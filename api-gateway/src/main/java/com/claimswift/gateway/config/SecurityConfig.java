package com.claimswift.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
                .formLogin(ServerHttpSecurity.FormLoginSpec::disable)
                .authorizeExchange(exchange -> exchange
                        .pathMatchers(
                                "/actuator/health",
                                "/actuator/info",
                                "/actuator/prometheus",
                                "/actuator/metrics/**",
                                "/fallback/**"
                        ).permitAll()
                        .pathMatchers("/api/auth/**").permitAll()
                        .pathMatchers("/ws/**").permitAll()
                        .pathMatchers(
                                "/api/claims/**",
                                "/api/documents/**",
                                "/api/assessments/**",
                                "/api/payments/**",
                                "/api/notifications/**",
                                "/api/reports/**"
                        ).permitAll()
                        .anyExchange().denyAll()
                )
                .build();
    }
}
