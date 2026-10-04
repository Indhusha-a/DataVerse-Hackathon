package com.waypoint.backend.admin;

import com.waypoint.backend.audit.AuditService;
import com.waypoint.backend.common.ApiException;
import com.waypoint.backend.security.CustomUserDetails;
import com.waypoint.backend.security.User;
import com.waypoint.backend.security.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class AdminUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public AdminUserService(UserRepository userRepository, PasswordEncoder passwordEncoder, AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    public List<User> listUsers() {
        return userRepository.findAll();
    }

    public User createUser(CreateUserRequest request, CustomUserDetails actor) {
        if (userRepository.existsByUsername(request.username())) {
            throw new ApiException(HttpStatus.CONFLICT, "Username already taken: " + request.username());
        }
        User user = new User();
        user.setUsername(request.username());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName());
        user.setRole(request.role());
        user.setDepotId(request.depotId());
        user.setOutletId(request.outletId());
        user.setActive(true);
        User saved = userRepository.save(user);

        auditService.log(actor.getUser().getId(), actor.getUser().getRole().name(), "USER_CREATED",
                "User", saved.getId().toString(), "API", "SUCCESS", "username=" + saved.getUsername());
        return saved;
    }

    public User updateUser(UUID id, UpdateUserRequest request, CustomUserDetails actor) {
        User user = userRepository.findById(id).orElseThrow(() -> ApiException.notFound("User not found: " + id));
        user.setRole(request.role());
        user.setActive(request.active());
        User saved = userRepository.save(user);

        auditService.log(actor.getUser().getId(), actor.getUser().getRole().name(), "USER_UPDATED",
                "User", saved.getId().toString(), "API", "SUCCESS",
                "role=" + saved.getRole() + ",active=" + saved.isActive());
        return saved;
    }
}