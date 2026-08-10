package com.einblick.backend.domain.sample;

import com.einblick.backend.domain.program.Program;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "SAMPLES")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Sample {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SAMPLE_ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PROGRAM_ID", nullable = false)
    private Program program;

    @Enumerated(EnumType.STRING)
    @Column(name = "TYPE", nullable = false, length = 20)
    private Type type;

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.PREPARING;

    @Column(name = "COMMENT_SOURCE", length = 50)
    private String commentSource;

    @Column(name = "DUE_DATE")
    private LocalDate dueDate;

    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public void updateType(Type type) {
        this.type = type;
    }

    public void updateStatus(Status status) {
        this.status = status;
    }

    public enum Type {
        SMS, FIT, APPROVAL, TOP, GB_TEST, WALMART_TEST, CNS_TEST
    }

    public enum Status {
        PREPARING, SENT, COMMENT_WAIT, APPROVED, FAIL
    }
}
