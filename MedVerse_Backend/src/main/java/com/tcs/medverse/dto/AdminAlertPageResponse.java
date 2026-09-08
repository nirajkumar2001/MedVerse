package com.tcs.medverse.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class AdminAlertPageResponse {
    private List<AlertDto> items;
    private int page;
    private int size;
    private long totalItems;
    private int totalPages;
    private boolean hasNext;
}
