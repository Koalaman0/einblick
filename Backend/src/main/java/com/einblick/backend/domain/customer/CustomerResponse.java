package com.einblick.backend.domain.customer;

public record CustomerResponse(Long id, String code, String name, boolean houseAlias) {
    public static CustomerResponse from(Customer customer) {
        return new CustomerResponse(customer.getId(), customer.getCode(), customer.getName(), customer.getHouseAlias());
    }
}
