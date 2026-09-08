package com.tcs.medverse.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class AnalyticsDto {
    private long totalCasesReviewed;
    private long totalAlerts;
    private long totalRejectedCases;
    private long totalApprovedCases;
}
