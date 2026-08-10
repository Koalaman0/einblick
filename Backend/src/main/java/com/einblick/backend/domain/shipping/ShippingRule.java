package com.einblick.backend.domain.shipping;

import com.einblick.backend.domain.program.Program;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "SHIPPING_RULES")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class ShippingRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SHIPPING_RULE_ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PROGRAM_ID", nullable = false)
    private Program program;

    @Column(name = "SEASON", length = 30)
    private String season;

    @Column(name = "PO_RANGE_FROM", length = 30)
    private String poRangeFrom;

    @Column(name = "PO_RANGE_TO", length = 30)
    private String poRangeTo;

    @Enumerated(EnumType.STRING)
    @Column(name = "TRANSPORT_METHOD", nullable = false, length = 20)
    private RequiredTransportMethod transportMethod;

    @Column(name = "EX_FACTORY_DATE")
    private LocalDate exFactoryDate;

    public enum RequiredTransportMethod { AIR_ONLY, BOAT_ONLY, SPLIT }
}
