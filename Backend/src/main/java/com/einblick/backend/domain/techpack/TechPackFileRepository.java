package com.einblick.backend.domain.techpack;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface TechPackFileRepository extends JpaRepository<TechPackFile, Long> {

    // 목록 조회 시 대용량 FILE_DATA(BYTEA)를 함께 불러오지 않도록 메타데이터만 프로젝션한다.
    @Query("""
        SELECT new com.einblick.backend.domain.techpack.TechPackFileResponse(
            f.id, f.fileName, p.brand, p.season, f.fileType, f.fileSize, f.status, f.updatedAt, u.name)
        FROM TechPackFile f JOIN f.program p LEFT JOIN f.uploadedBy u
        ORDER BY f.createdAt DESC
        """)
    List<TechPackFileResponse> findAllSummaries();
}
