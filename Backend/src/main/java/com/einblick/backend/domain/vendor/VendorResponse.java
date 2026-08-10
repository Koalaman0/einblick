package com.einblick.backend.domain.vendor;

public record VendorResponse(Long id, String name, Boolean overseas, String contactName, String contactInfo) {
    public static VendorResponse from(Vendor vendor) {
        return new VendorResponse(vendor.getId(), vendor.getName(), vendor.getOverseas(), vendor.getContactName(), vendor.getContactInfo());
    }
}
