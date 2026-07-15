package com.einblick.backend.domain.program;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "PROGRAMS",
        uniqueConstraints = @UniqueConstraint(name = "UQ_PROGRAM_STYLE_SEASON", columnNames = {"STYLE_CODE", "SEASON"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Program {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PROGRAM_ID")
    private Long id;

    @Column(name = "BRAND", nullable = false, length = 50)
    private String brand;          // NIKE, MITCHELL_NESS, COLLEGE ...

    @Column(name = "LEAGUE", length = 50)
    private String league;         // MLB, NBA, NFL, NHL, NCAA ...

    @Column(name = "STYLE_CODE", nullable = false, length = 50)
    private String styleCode;

    @Column(name = "STYLE_NAME", length = 200)
    private String styleName;

    @Column(name = "SEASON", length = 30)
    private String season;         // '10TH', '11TH' 등 차수

    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
