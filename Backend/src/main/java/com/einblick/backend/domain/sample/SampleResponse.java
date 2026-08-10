package com.einblick.backend.domain.sample;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record SampleResponse(
    Long id,
    String styleCode,
    String brand,
    String type,
    String status,
    String commentSource,
    LocalDate dueDate,
    LocalDateTime createdAt
) {
    public static SampleResponse from(Sample sample) {
        return new SampleResponse(
            sample.getId(),
            sample.getProgram().getStyleCode(),
            sample.getProgram().getBrand(),
            sample.getType().name(),
            sample.getStatus().name(),
            sample.getCommentSource(),
            sample.getDueDate(),
            sample.getCreatedAt()
        );
    }
}
