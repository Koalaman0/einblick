package com.hanlim.wms.domain.customer;

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

    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
