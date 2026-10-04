"""
Provider-agnostic tool-calling loop. The model answers each turn with one JSON
object, either a tool call or a final reply. Tool calls are limited to the
caller's role and to MAX_ITERATIONS steps.
"""

import json
import re

from app.providers import get_provider
from app.tools import TOOL_IMPLEMENTATIONS, TOOL_SPECS, allowed_tools_for_role, record_tool_call

MAX_ITERATIONS = 3


def _build_system_prompt(role: str, context: dict | None) -> str:
    allowed = allowed_tools_for_role(role)
    tool_lines = "\n".join(
        f'- {name}: {TOOL_SPECS[name]["description"]} args={TOOL_SPECS[name]["args"]}'
        for name in allowed
    )
    context_line = f"\nCurrent UI context: {json.dumps(context)}" if context else ""

    return f"""You are Waypoint AI, a logistics operations assistant for a {role} user of the
Waypoint delivery platform. You explain and retrieve real system state — you
never invent order numbers, statuses, vehicle IDs, or ETAs.{context_line}

You may call these tools (and ONLY these — the user's role does not permit any other tool):
{tool_lines}

Respond with EXACTLY ONE JSON object per turn, no other text, no markdown fences:
- To call a tool: {{"action": "tool", "tool": "<tool name>", "args": {{...}}}}
- To answer the user directly once you have enough information:
  {{"action": "final", "reply": "<your natural-language answer>"}}

Never answer a question about live order/trip/vehicle/notification state from
memory — always call the relevant tool first. If no tool fits the question,
use action "final" and say so plainly."""


def _parse_model_turn(raw: str) -> dict:
    """Models occasionally wrap JSON in markdown fences or add stray text
    despite instructions — strip fences and grab the first {...} block
    before parsing, rather than failing the whole turn over formatting."""
    cleaned = re.sub(r"^```(json)?|```$", "", raw.strip(), flags=re.MULTILINE).strip()
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if not match:
        return {"action": "final", "reply": raw.strip()}
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return {"action": "final", "reply": raw.strip()}


async def run_agent(role: str, message: str, context: dict | None, jwt: str) -> tuple[str, list[str]]:
    """Returns (reply, tool_calls_made)."""
    provider = get_provider()
    allowed = allowed_tools_for_role(role)

    messages = [
        {"role": "system", "content": _build_system_prompt(role, context)},
        {"role": "user", "content": message},
    ]
    tool_calls_made: list[str] = []

    for _ in range(MAX_ITERATIONS):
        raw = await provider.complete(messages, temperature=0.2)
        turn = _parse_model_turn(raw)

        if turn.get("action") != "tool":
            return turn.get("reply", raw), tool_calls_made

        tool_name = turn.get("tool")
        args = turn.get("args", {}) or {}

        if tool_name not in allowed:
            tool_result = {"error": f"Tool '{tool_name}' is not permitted for role {role}"}
            outcome = "DENIED"
        elif tool_name not in TOOL_IMPLEMENTATIONS:
            tool_result = {"error": f"Unknown tool '{tool_name}'"}
            outcome = "UNKNOWN"
        else:
            try:
                tool_result = await TOOL_IMPLEMENTATIONS[tool_name](args, jwt, role)
                outcome = "OK"
            except Exception as e:
                tool_result = {"error": str(e)}
                outcome = "ERROR"

        await record_tool_call(jwt, tool_name or "unknown", outcome, args)
        tool_calls_made.append(tool_name or "unknown")
        messages.append({"role": "assistant", "content": raw})
        messages.append({"role": "user", "content": f"Tool result for {tool_name}: {json.dumps(tool_result)}"})

    return ("I wasn't able to finish answering that within my tool-call budget — "
            "please rephrase or ask something more specific."), tool_calls_made