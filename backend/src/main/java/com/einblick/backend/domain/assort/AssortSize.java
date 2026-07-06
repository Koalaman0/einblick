package com.hanlim.wms.domain.assort;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ASSORT_SIZES",
        uniqueConstraints = @UniqueConstraint(name = "UQ_ASSORT_SIZE", columnNames = {"ASSORT_ID", "SIZE_CODE"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class AssortSize {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ASSORT_SIZE_ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ASSORT_ID", nullable = false)
    private Assort assort;

    @Column(name = "SIZE_CODE", nullable = false, length = 10)
    private String sizeCode;

    @Column(name = "QTY", nullable = false)
    @Builder.Default
    private Integer qty = 0;

    void assignAssort(Assort assort) {
        this.assort = assort;
    }
}
