package com.einblick.backend.domain.techpack;

import java.time.LocalDateTime;

public record TechPackFileResponse(
    Long id,
    String fileName,
    String brand,
    String season,
    String fileType,
    long fileSize,
    String status,
    LocalDateTime updatedAt,
    String uploaderName
) {
    public TechPackFileResponse(Long id, String fileName, String brand, String season,
                                 TechPackFile.Type fileType, long fileSize, TechPackFile.Status status,
                                 LocalDateTime updatedAt, String uploaderName) {
        this(id, fileName, brand, season, fileType.name(), fileSize, status.name(), updatedAt, uploaderName);
    }
}
