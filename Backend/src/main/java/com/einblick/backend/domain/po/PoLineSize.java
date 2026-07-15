package com.einblick.backend.domain.po;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "PO_LINE_SIZES",
        uniqueConstraints = @UniqueConstraint(name = "UQ_POLINE_SIZE", columnNames = {"PO_LINE_ID", "SIZE_CODE"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class PoLineSize {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PO_LINE_SIZE_ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PO_LINE_ID", nullable = false)
    private PoLine poLine;

    // 사이즈 종류가 브랜드/카테고리마다 달라(S/M/L vs 0-4T) 자유 문자열로 관리
    @Column(name = "SIZE_CODE", nullable = false, length = 10)
    private String sizeCode;

    @Column(name = "QTY", nullable = false)
    @Builder.Default
    private Integer qty = 0;

    void assignPoLine(PoLine poLine) {
        this.poLine = poLine;
    }
}
