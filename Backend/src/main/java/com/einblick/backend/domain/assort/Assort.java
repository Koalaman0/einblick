package com.einblick.backend.domain.assort;

import com.einblick.backend.domain.program.Program;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ASSORTS")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Assort {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ASSORT_ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PROGRAM_ID", nullable = false)
    private Program program;

    @Column(name = "TEAM", length = 100)
    private String team;

    @Column(name = "PLAYER", length = 100)
    private String player;

    // 엑셀에 실제로 찍혀있는 라벨 원본 그대로 저장 (공란/'USA LA' 등 -> 매칭 로직은 서비스단에서 처리)
    @Column(name = "CUSTOMER_LABEL", nullable = false, length = 50)
    private String customerLabel;

    @Column(name = "TOTAL_QTY", nullable = false)
    @Builder.Default
    private Integer totalQty = 0;

    @Column(name = "SOURCE_FILE", length = 300)
    private String sourceFile;

    // 패킹정보(ASSORT/SOLID·RATIO·POLYBAG·CARTON·HANGER) - 엑셀에 실제로 입력된 값 그대로 저장.
    // 대사 시 CUSTOMERS의 고객사 마스터 표준값과 비교해 이탈을 잡아낸다.
    @Column(name = "ASSORT_SOLID", length = 30)
    private String assortSolid;

    @Column(name = "RATIO", length = 50)
    private String ratio;

    @Column(name = "POLYBAG", length = 20)
    private String polybag;

    @Column(name = "CARTON", length = 20)
    private String carton;

    @Column(name = "HANGER", length = 300)
    private String hanger;

    @OneToMany(mappedBy = "assort", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AssortSize> sizes = new ArrayList<>();

    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public void addSize(AssortSize size) {
        sizes.add(size);
        size.assignAssort(this);
    }
}
