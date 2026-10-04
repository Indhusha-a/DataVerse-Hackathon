package com.waypoint.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point. Spring Boot auto-configures the web server, JPA, and security
 * based on what's on the classpath and the beans defined under the
 * com.waypoint.backend package (component scan root).
 */
@SpringBootApplication
public class BackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}