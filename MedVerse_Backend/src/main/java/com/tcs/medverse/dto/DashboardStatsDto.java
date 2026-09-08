package com.tcs.medverse.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class DashboardStatsDto {
    private long totalActiveUsers;
    private long totalDoctors;
    private long totalStaff;
    private long securityAlerts;
    private long failedLogins;
    private double complianceScore;
    private long pendingApprovals;
    private long pendingCases;

    public DashboardStatsDto(long totalProfiles, long approvedProfiles, int i, long alerts, int i1, double v, long pendingProfiles, int i2) {
        this.totalActiveUsers = totalProfiles;
        this.totalDoctors = approvedProfiles;
        this.totalStaff = i;
        this.securityAlerts = alerts;
        this.failedLogins = i1;
        this.complianceScore = v;
        this.pendingApprovals = pendingProfiles;
        this.pendingCases = i2;
    }
}
