package com.claimswift.reportingservice.service;

import com.claimswift.reportingservice.client.ClaimServiceClient;
import com.claimswift.reportingservice.client.PaymentServiceClient;
import com.claimswift.reportingservice.dto.AdjusterPerformanceReport;
import com.claimswift.reportingservice.dto.ClaimSummaryReport;
import com.claimswift.reportingservice.dto.PaymentReport;
import com.claimswift.reportingservice.util.PdfGenerator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ReportingService {

    private final ClaimServiceClient claimServiceClient;
    private final PaymentServiceClient paymentServiceClient;
    private final PdfGenerator pdfGenerator;

    public ReportingService(
            ClaimServiceClient claimServiceClient,
            PaymentServiceClient paymentServiceClient,
            PdfGenerator pdfGenerator) {
        this.claimServiceClient = claimServiceClient;
        this.paymentServiceClient = paymentServiceClient;
        this.pdfGenerator = pdfGenerator;
    }

    public ClaimSummaryReport generateClaimSummaryReport(String startDate, String endDate) {
        List<Map<String, Object>> claims = safeList(claimServiceClient.getAllClaims());

        long total = claims.size();
        long submitted = countByStatus(claims, "SUBMITTED");
        long underReview = countByStatus(claims, "UNDER_REVIEW");
        long approved = countByStatus(claims, "APPROVED");
        long rejected = countByStatus(claims, "REJECTED");
        long paid = countByStatus(claims, "PAID");

        BigDecimal totalAmount = sumDecimal(claims, "claimAmount");
        BigDecimal averageAmount = total > 0
                ? totalAmount.divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal approvedAmount = claims.stream()
                .filter(c -> "APPROVED".equalsIgnoreCase(String.valueOf(c.get("status"))))
                .map(c -> toBigDecimal(c.get("approvedAmount")))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal paidAmount = claims.stream()
                .filter(c -> "PAID".equalsIgnoreCase(String.valueOf(c.get("status"))))
                .map(c -> toBigDecimal(c.get("approvedAmount")))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Long> byStatus = claims.stream()
                .collect(Collectors.groupingBy(
                        c -> String.valueOf(c.getOrDefault("status", "UNKNOWN")),
                        Collectors.counting()
                ));

        return ClaimSummaryReport.builder()
                .reportGeneratedAt(LocalDateTime.now())
                .reportPeriod(buildPeriod(startDate, endDate))
                .totalClaims(total)
                .submittedClaims(submitted)
                .underReviewClaims(underReview)
                .approvedClaims(approved)
                .rejectedClaims(rejected)
                .paidClaims(paid)
                .totalClaimAmount(totalAmount)
                .totalApprovedAmount(approvedAmount)
                .totalPaidAmount(paidAmount)
                .averageClaimAmount(averageAmount)
                .claimsByStatus(byStatus)
                .claimsThisMonth(total)
                .claimsLastMonth(0L)
                .amountThisMonth(totalAmount)
                .amountLastMonth(BigDecimal.ZERO)
                .build();
    }

    public PaymentReport generatePaymentReport(String startDate, String endDate) {
        List<Map<String, Object>> payments = safeList(paymentServiceClient.getAllPayments());

        long total = payments.size();
        long approved = countByStatus(payments, "APPROVED");
        long rejected = countByStatus(payments, "REJECTED");
        long pending = countByStatus(payments, "PENDING_VERIFICATION")
                + countByStatus(payments, "INITIATED")
                + countByStatus(payments, "PROCESSING");

        BigDecimal totalAmount = sumDecimal(payments, "amount");
        BigDecimal average = total > 0
                ? totalAmount.divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal approvedAmount = payments.stream()
                .filter(p -> "APPROVED".equalsIgnoreCase(String.valueOf(p.get("status"))))
                .map(p -> toBigDecimal(p.get("amount")))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal rejectedAmount = payments.stream()
                .filter(p -> "REJECTED".equalsIgnoreCase(String.valueOf(p.get("status")))
                        || "FAILED".equalsIgnoreCase(String.valueOf(p.get("status"))))
                .map(p -> toBigDecimal(p.get("amount")))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Long> byStatus = payments.stream()
                .collect(Collectors.groupingBy(
                        p -> String.valueOf(p.getOrDefault("status", "UNKNOWN")),
                        Collectors.counting()
                ));

        return PaymentReport.builder()
                .reportGeneratedAt(LocalDateTime.now())
                .reportPeriod(buildPeriod(startDate, endDate))
                .totalPayments(total)
                .approvedPayments(approved)
                .rejectedPayments(rejected)
                .pendingPayments(pending)
                .totalAmount(totalAmount)
                .approvedAmount(approvedAmount)
                .rejectedAmount(rejectedAmount)
                .averagePaymentAmount(average)
                .paymentsByStatus(byStatus)
                .amountByStatus(Collections.emptyMap())
                .paymentsByMethod(Collections.emptyMap())
                .paymentsThisMonth(total)
                .paymentsLastMonth(0L)
                .amountThisMonth(totalAmount)
                .amountLastMonth(BigDecimal.ZERO)
                .build();
    }

    public AdjusterPerformanceReport generateAdjusterPerformanceReport(String startDate, String endDate) {
        List<Map<String, Object>> claims = safeList(claimServiceClient.getAllClaims());
        Map<Long, List<Map<String, Object>>> byAdjuster = claims.stream()
                .filter(c -> c.get("adjusterId") != null)
                .collect(Collectors.groupingBy(c -> Long.valueOf(String.valueOf(c.get("adjusterId")))));

        List<AdjusterPerformanceReport.AdjusterPerformance> performances = byAdjuster.entrySet().stream()
                .map(entry -> {
                    Long adjusterId = entry.getKey();
                    List<Map<String, Object>> items = entry.getValue();
                    long totalAssigned = items.size();
                    long approved = items.stream()
                            .filter(c -> "APPROVED".equalsIgnoreCase(String.valueOf(c.get("status"))))
                            .count();
                    long rejected = items.stream()
                            .filter(c -> "REJECTED".equalsIgnoreCase(String.valueOf(c.get("status"))))
                            .count();
                    long pending = items.stream()
                            .filter(c -> "UNDER_REVIEW".equalsIgnoreCase(String.valueOf(c.get("status")))
                                    || "ADJUSTED".equalsIgnoreCase(String.valueOf(c.get("status"))))
                            .count();
                    BigDecimal totalClaimAmount = items.stream()
                            .map(c -> toBigDecimal(c.get("claimAmount")))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal approvedAmount = items.stream()
                            .filter(c -> "APPROVED".equalsIgnoreCase(String.valueOf(c.get("status"))))
                            .map(c -> toBigDecimal(c.get("approvedAmount")))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal rejectedAmount = items.stream()
                            .filter(c -> "REJECTED".equalsIgnoreCase(String.valueOf(c.get("status"))))
                            .map(c -> toBigDecimal(c.get("claimAmount")))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    double approvalRate = totalAssigned > 0 ? (approved * 100.0) / totalAssigned : 0.0;

                    return AdjusterPerformanceReport.AdjusterPerformance.builder()
                            .adjusterId(adjusterId)
                            .adjusterName("Adjuster-" + adjusterId)
                            .adjusterEmail("N/A")
                            .totalClaimsAssigned(totalAssigned)
                            .claimsApproved(approved)
                            .claimsRejected(rejected)
                            .claimsPending(pending)
                            .totalClaimAmount(totalClaimAmount)
                            .approvedAmount(approvedAmount)
                            .rejectedAmount(rejectedAmount)
                            .averageProcessingTimeDays(0.0)
                            .approvalRate(approvalRate)
                            .totalDecisions(approved + rejected)
                            .build();
                })
                .toList();

        BigDecimal totalAmountProcessed = performances.stream()
                .map(AdjusterPerformanceReport.AdjusterPerformance::getTotalClaimAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return AdjusterPerformanceReport.builder()
                .reportGeneratedAt(LocalDateTime.now())
                .reportPeriod(buildPeriod(startDate, endDate))
                .totalAdjusters((long) performances.size())
                .totalClaimsProcessed((long) claims.size())
                .totalAmountProcessed(totalAmountProcessed)
                .averageProcessingTime(0.0)
                .adjusterPerformances(performances)
                .build();
    }

    public byte[] exportClaimSummaryToPdf(String startDate, String endDate) {
        return pdfGenerator.generateClaimSummaryPdf(generateClaimSummaryReport(startDate, endDate));
    }

    public byte[] exportPaymentReportToPdf(String startDate, String endDate) {
        return pdfGenerator.generatePaymentReportPdf(generatePaymentReport(startDate, endDate));
    }

    public byte[] exportAdjusterPerformanceToPdf(String startDate, String endDate) {
        return pdfGenerator.generateAdjusterPerformancePdf(generateAdjusterPerformanceReport(startDate, endDate));
    }

    private List<Map<String, Object>> safeList(List<Map<String, Object>> input) {
        return input == null ? Collections.emptyList() : input;
    }

    private long countByStatus(List<Map<String, Object>> items, String status) {
        return items.stream()
                .filter(i -> status.equalsIgnoreCase(String.valueOf(i.get("status"))))
                .count();
    }

    private BigDecimal sumDecimal(List<Map<String, Object>> items, String key) {
        return items.stream()
                .map(i -> toBigDecimal(i.get(key)))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal bd) {
            return bd;
        }
        return new BigDecimal(String.valueOf(value));
    }

    private String buildPeriod(String startDate, String endDate) {
        if (startDate == null && endDate == null) {
            return "All Time";
        }
        return String.valueOf(startDate) + " to " + String.valueOf(endDate);
    }
}
