package com.system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

@SpringBootApplication
public class BackendApplication extends SpringBootServletInitializer {

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(BackendApplication.class);
    }

    public static void main(String[] args) {
        // Khởi động toàn bộ hệ thống Spring Boot
        SpringApplication.run(BackendApplication.class, args);
        System.out.println("AutoTrade Backend dang chay tai: ");
        System.out.println("-> API Server: http://localhost:8080");
        System.out.println("-> Swagger UI: http://localhost:8080/swagger-ui.html");
    }

}
