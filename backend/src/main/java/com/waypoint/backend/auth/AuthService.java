package com.waypoint.backend.auth;

import com.waypoint.backend.audit.AuditService;
import com.waypoint.backend.common.ApiException;
import com.waypoint.backend.security.CustomUserDetails;
import com.waypoint.backend.security.JwtService;
import com.waypoint.backend.security.User;
import com.waypoint.backend.security.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public AuthService(AuthenticationManager authenticationManager, JwtService jwtService,
                       UserRepository userRepository, AuditService auditService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    public LoginResponse login(LoginRequest request) {
        try {
            var authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password()));
            User user = ((CustomUserDetails) authentication.getPrincipal()).getUser();

            auditService.log(user.getId(), user.getRole().name(), "LOGIN_SUCCESS", "User",
                    user.getId().toString(), "API", "SUCCESS", null);
            return new LoginResponse(jwtService.generateToken(user), user.getId(), user.getUsername(),
                    user.getFullName(), user.getRole().name(), user.getRole().permissions(),
                    user.getOutletId(), user.getDepotId());
        } catch (AuthenticationException e) {
            auditService.log(null, null, "LOGIN_FAILURE", "User", request.username(), "API", "FAILURE", null);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }
    }

    public TokenResponse refresh(String token) {
        String username;
        try {
            username = jwtService.extractUsername(token);
        } catch (RuntimeException e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid token");
        }
        if (!jwtService.isTokenValid(token, username)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Token expired or invalid");
        }
        User user = userRepository.findByUsername(username)
                .filter(User::isActive)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Account is inactive"));
        return new TokenResponse(jwtService.generateToken(user));
    }

    public void logout(UUID userId, String role) {
        if (userId == null) return;
        auditService.log(userId, role, "LOGOUT", "User", userId.toString(), "API", "SUCCESS", null);
    }
}
