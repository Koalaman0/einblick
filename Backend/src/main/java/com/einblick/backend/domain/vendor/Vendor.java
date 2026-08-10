package com.einblick.backend.domain.vendor;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "VENDORS")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Vendor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "VENDOR_ID")
    private Long id;

    @Column(name = "NAME", nullable = false, length = 100)
    private String name;

    @Column(name = "IS_OVERSEAS", nullable = false)
    @Builder.Default
    private Boolean overseas = false;

    @Column(name = "CONTACT_NAME", length = 50)
    private String contactName;

    @Column(name = "CONTACT_INFO", length = 200)
    private String contactInfo;
}
