package com.tcs.medverse.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class SearchRequestDto {

    @NotBlank(message = "Search input cannot be empty.")
    @Size(max = 100, message = "Search input should not exceed 100 characters.")
    @Pattern(
            regexp = "^[A-Za-z0-9][A-Za-z0-9\\s-]*$",
            message = "Special Characters Not Allowed"
    )
    private String query;

    public SearchRequestDto() {}

    public String getQuery() { return query; }

    public void setQuery(String query) {
        this.query = (query == null) ? null : query.trim().replaceAll("\\s+", " ");
    }
}