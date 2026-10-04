package com.waypoint.backend.admin;

import com.waypoint.backend.audit.AuditLogRepository;
import com.waypoint.backend.reference.depot.DepotRepository;
import com.waypoint.backend.reference.vehicle.VehicleResponse;
import com.waypoint.backend.reference.vehicle.VehicleService;
import com.waypoint.backend.reference.vehicle.VehicleUpsertRequest;
import com.waypoint.backend.security.CustomUserDetails;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminUserService userService;
    private final VehicleService vehicleService;
    private final AdminDemoService demoService;
    private final AuditLogRepository auditLogRepository;
    private final DepotRepository depotRepository;

    public AdminController(AdminUserService userService, VehicleService vehicleService,
                           AdminDemoService demoService, AuditLogRepository auditLogRepository,
                           DepotRepository depotRepository) {
        this.userService = userService;
        this.vehicleService = vehicleService;
        this.demoService = demoService;
        this.auditLogRepository = auditLogRepository;
        this.depotRepository = depotRepository;
    }

    @GetMapping("/depots")
    public List<DepotResponse> listDepots() {
        return depotRepository.findAll().stream().map(DepotResponse::from).toList();
    }

    @GetMapping("/users")
    public List<UserResponse> listUsers() {
        return userService.listUsers().stream().map(UserResponse::from).toList();
    }

    @PostMapping("/users")
    public UserResponse createUser(@Valid @RequestBody CreateUserRequest request,
                                   @AuthenticationPrincipal CustomUserDetails actor) {
        return UserResponse.from(userService.createUser(request, actor));
    }

    @PatchMapping("/users/{id}")
    public UserResponse updateUser(@PathVariable UUID id, @Valid @RequestBody UpdateUserRequest request,
                                   @AuthenticationPrincipal CustomUserDetails actor) {
        return UserResponse.from(userService.updateUser(id, request, actor));
    }

    @PostMapping("/vehicles")
    public VehicleResponse createVehicle(@Valid @RequestBody VehicleUpsertRequest request,
                                         @AuthenticationPrincipal CustomUserDetails actor) {
        return VehicleResponse.from(vehicleService.create(request, actor));
    }

    @PutMapping("/vehicles/{id}")
    public VehicleResponse updateVehicle(@PathVariable UUID id, @Valid @RequestBody VehicleUpsertRequest request,
                                         @AuthenticationPrincipal CustomUserDetails actor) {
        return VehicleResponse.from(vehicleService.update(id, request, actor));
    }

    @DeleteMapping("/vehicles/{id}")
    public void deleteVehicle(@PathVariable UUID id, @AuthenticationPrincipal CustomUserDetails actor) {
        vehicleService.delete(id, actor);
    }

    @GetMapping("/audit-logs")
    public List<AuditLogResponse> listAuditLogs(@RequestParam(defaultValue = "50") int limit) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, limit, Sort.unsorted()))
                .stream().map(AuditLogResponse::from).toList();
    }

    @PostMapping("/demo/reset")
    public void resetDemo(@AuthenticationPrincipal CustomUserDetails actor) {
        demoService.reset(actor);
    }

    @PostMapping("/demo/seed")
    public void seedDemo(@AuthenticationPrincipal CustomUserDetails actor) throws Exception {
        demoService.seed(actor);
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return demoService.health();
    }
}
