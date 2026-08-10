package com.einblick.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.net.URI;

// Railway의 Postgres 플러그인은 개별 PGHOST/PGPORT/... 변수 대신 DATABASE_URL
// (postgresql://user:password@host:port/db 형식) 하나만 제공하므로 직접 파싱한다.
@Configuration
public class DataSourceConfig {

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Bean
    public DataSource dataSource() {
        if (databaseUrl.isBlank()) {
            return DataSourceBuilder.create()
                    .url("jdbc:postgresql://localhost:5432/einblick")
                    .username("einblick")
                    .password("einblick1234")
                    .driverClassName("org.postgresql.Driver")
                    .build();
        }

        URI uri = URI.create(databaseUrl);
        String[] userInfo = uri.getUserInfo().split(":", 2);
        String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + uri.getPort() + uri.getPath();

        return DataSourceBuilder.create()
                .url(jdbcUrl)
                .username(userInfo[0])
                .password(userInfo[1])
                .driverClassName("org.postgresql.Driver")
                .build();
    }
}
