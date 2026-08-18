package com.einblick.backend.domain.customer;

public record CustomerResponse(
    Long id,
    String code,
    String name,
    boolean houseAlias,
    String packingMethod,
    String format,
    String assortSolid,
    String stdRatio,
    String stdPolybag,
    String stdCarton,
    String stdHanger
) {
    public static CustomerResponse from(Customer customer) {
        return new CustomerResponse(
            customer.getId(),
            customer.getCode(),
            customer.getName(),
            customer.getHouseAlias(),
            customer.getPackingMethod(),
            customer.getFormat(),
            customer.getAssortSolid(),
            customer.getStdRatio(),
            customer.getStdPolybag(),
            customer.getStdCarton(),
            customer.getStdHanger()
        );
    }
}
