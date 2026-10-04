package com.waypoint.backend.security;

import org.springframework.boot.context.properties.ConfigurationProperties;
import lombok.Getter;
import lombok.Setter;

/**
 * Binds the app.jwt.* keys from application.yml into a typed bean, so
 * JwtService doesn't read raw @Value strings scattered around.
 */
@ConfigurationProperties(prefix = "app.jwt")
@Getter
@Setter
public class JwtProperties {
    private String secret;
    private long expirationMs;
}