package com.waypoint.backend.audit;

import com.waypoint.backend.security.CustomUserDetails;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Records each AI assistant tool call against the user whose token the call ran under. */
@RestController
@RequestMapping("/api/audit/ai-tool-calls")
public class AiAuditController {

    private final AuditService auditService;

    public AiAuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void record(@Valid @RequestBody AiToolCallRequest request, @AuthenticationPrincipal CustomUserDetails actor) {
        auditService.log(actor.getUser().getId(), actor.getUser().getRole().name(), "AI_TOOL_CALL", "AiTool",
                request.tool(), "AI", request.result(), request.arguments());
    }

    record AiToolCallRequest(@NotBlank String tool, @NotBlank String result, String arguments) {}
}
