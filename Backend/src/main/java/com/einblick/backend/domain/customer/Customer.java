package com.einblick.backend.domain.customer;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "CUSTOMERS")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "CUSTOMER_ID")
    private Long id;

    @Column(name = "CODE", nullable = false, unique = true, length = 30)
    private String code;   // 'HOUSE', 'FANATICS', 'EU', 'USA_LA' ...

    @Column(name = "NAME", nullable = false, length = 100)
    private String name;

    // PO 공란이나 'USA LA' 같은 별칭을 자동으로 HOUSE로 매칭시키기 위한 플래그
    @Column(name = "IS_HOUSE_ALIAS", nullable = false)
    @Builder.Default
    private Boolean houseAlias = false;

    // 아래는 '고객사별 패킹 정보' 마스터 값(STK/FORMAT/ASSORT-SOLID/RATIO/POLYBAG/CARTON/HANGER).
    // 대사 시 ASSORT에 실제로 입력된 패킹정보와 이 값을 비교해 표준 이탈을 잡아낸다.
    @Column(name = "PACKING_METHOD", length = 60)
    private String packingMethod;

    @Column(name = "FORMAT", length = 100)
    private String format;

    @Column(name = "ASSORT_SOLID", length = 30)
    private String assortSolid;

    @Column(name = "STD_RATIO", length = 50)
    private String stdRatio;

    @Column(name = "STD_POLYBAG", length = 20)
    private String stdPolybag;

    @Column(name = "STD_CARTON", length = 20)
    private String stdCarton;

    @Column(name = "STD_HANGER", length = 300)
    private String stdHanger;

    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public void updatePackingStandard(
        String packingMethod, String format, String assortSolid,
        String stdRatio, String stdPolybag, String stdCarton, String stdHanger
    ) {
        this.packingMethod = packingMethod;
        this.format = format;
        this.assortSolid = assortSolid;
        this.stdRatio = stdRatio;
        this.stdPolybag = stdPolybag;
        this.stdCarton = stdCarton;
        this.stdHanger = stdHanger;
    }
}
