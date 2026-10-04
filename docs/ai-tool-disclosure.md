# AI tool disclosure

Tech-Triathlon 2026 requires disclosure of AI assistance used to build a submission, and of any AI feature built into the product itself. Both are covered here.

## AI used to build this submission

This Hackathon-phase codebase (backend, frontend, ml-service, and this documentation) was built with **Claude Code** (Anthropic), an AI coding assistant, working from the team's own problem framing, architecture decisions and build plan (`artifacts/build-plan/`) and the competition's Challenge Booklet and dataset. Claude Code generated and edited code, diagnosed and fixed build and runtime issues, and wrote this documentation, under the team's direction and within the scope the team set — it did not choose the architecture, the tech stack, or which operating rules the planning engine enforces; those came from the team's own build-plan documents and the booklet.

Nothing in the submission's business logic, operating constraints, or dataset was AI-generated content presented as original research — the planning rules, state machines and constraint list are transcribed from the booklet and the team's build plan, not invented.

## The in-product AI assistant ("WAYPOINT AI")

A floating assistant panel, available to all five accounts, that answers questions about live system state in natural language. It is explicitly **not** the planning engine and does not make or influence any allocation decision — "deterministic systems decide, AI explains," per the team's governing principle (`artifacts/Project_Knowledge_Base.md`).

**How it works** (see the sequence diagram in [`backend/README.md`](../backend/README.md#what-happens-one-sequence-per-role)):

1. The browser sends the user's question and their own JWT to `ml-service`'s `POST /chat`.
2. `ml-service` builds a system prompt listing only the tools that role is allowed (`ROLE_TOOLS` in `ml-service/app/tools.py`) and sends it, with the conversation, to the configured LLM provider.
3. If the model asks to call a tool, `ml-service` checks it against that role's allowed list — a denied call never reaches the backend — then calls the real Spring Boot endpoint with the user's own JWT, so the backend's own role and resource-level checks apply exactly as they would to a browser request.
4. Every tool call, permitted or denied, is written to the backend's audit log (`POST /api/audit/ai-tool-calls`), visible on the Admin → Audit log screen.
5. The model's final natural-language reply is returned to the browser, along with which tools were used, shown under each answer.

**Guardrails:**

- **Read-only.** No tool maps to a mutating endpoint (create, confirm, defer, dispatch, etc.). The assistant can explain a deferral; it cannot issue one.
- **Role-scoped, not just role-labelled.** Dispatcher/Loader/Driver tools return order, trip and notification data; Admin's tools are system-administration only (health, audit log, user accounts, fleet) — it has no access to the operational order/trip/deferral tools, since "is the system healthy" and "where is order X" are different users' questions.
- **No invented data.** The system prompt explicitly instructs the model to never answer a live-state question from memory — only from a tool result — and the model has no other source of order, trip or vehicle data.
- **Provider-agnostic, swappable without a code change.** `LLM_PROVIDER` (`groq` | `gemini` | `openrouter`) and the matching `*_MODEL` env var select the provider and model; `ml-service/app/agent.py`'s reasoning loop is the same regardless of which one is active.
- **Degrades honestly.** With no LLM key configured, or if the configured provider/model is unavailable, the panel tells the user the assistant needs a key or is unreachable — it never fabricates a reply, and the rest of the application is unaffected.

**Known limits:** a 3-tool-call budget per question (`MAX_ITERATIONS` in `agent.py`) before the assistant asks the user to rephrase; no conversation memory across separate questions; no streaming (one reply per request).
