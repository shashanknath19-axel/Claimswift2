package com.claimswift.claimservice.controller;

import com.claimswift.claimservice.dto.ClaimRequest;
import com.claimswift.claimservice.dto.ClaimResponse;
import com.claimswift.claimservice.dto.ClaimStatusUpdateRequest;
import com.claimswift.claimservice.service.ClaimService;
import com.claimswift.claimservice.util.StandardResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/claims")
@Validated
@RequiredArgsConstructor
public class ClaimController {

    private final ClaimService claimService;

    @PostMapping
    @PreAuthorize("hasAnyRole('POLICYHOLDER', 'ADMIN')")
    public ResponseEntity<StandardResponse<ClaimResponse>> submitClaim(
            @Valid @RequestBody ClaimRequest request,
            @RequestAttribute("userId") Long claimantId,
            @RequestAttribute("username") String username) {
        ClaimResponse response = claimService.submitClaim(request, claimantId, username);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(StandardResponse.success("Claim submitted successfully", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('POLICYHOLDER', 'ADJUSTER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<StandardResponse<ClaimResponse>> getClaimById(
            @PathVariable("id") @Positive(message = "Claim ID must be positive") Long id) {
        ClaimResponse response = claimService.getClaimById(id);
        return ResponseEntity.ok(StandardResponse.success(response));
    }

    @GetMapping("/number/{claimNumber}")
    @PreAuthorize("hasAnyRole('POLICYHOLDER', 'ADJUSTER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<StandardResponse<ClaimResponse>> getClaimByNumber(
            @PathVariable("claimNumber") @NotBlank(message = "Claim number is required") String claimNumber) {
        ClaimResponse response = claimService.getClaimByNumber(claimNumber);
        return ResponseEntity.ok(StandardResponse.success(response));
    }

    @GetMapping("/my-claims")
    @PreAuthorize("hasRole('POLICYHOLDER')")
    public ResponseEntity<StandardResponse<List<ClaimResponse>>> getMyClaims(
            @RequestAttribute("userId") Long claimantId) {
        List<ClaimResponse> responses = claimService.getClaimsByClaimant(claimantId);
        return ResponseEntity.ok(StandardResponse.success(responses));
    }

    @GetMapping("/history")
    @PreAuthorize("hasRole('POLICYHOLDER')")
    public ResponseEntity<StandardResponse<List<ClaimResponse>>> getClaimHistory(
            @RequestAttribute("userId") Long claimantId) {
        List<ClaimResponse> responses = claimService.getClaimHistory(claimantId);
        return ResponseEntity.ok(StandardResponse.success(responses));
    }

    @GetMapping("/my-claims/search")
    @PreAuthorize("hasRole('POLICYHOLDER')")
    public ResponseEntity<StandardResponse<List<ClaimResponse>>> searchMyClaims(
            @RequestAttribute("userId") Long claimantId,
            @RequestParam(name = "query", required = false) String query,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "fromDate", required = false) String fromDate,
            @RequestParam(name = "toDate", required = false) String toDate) {
        List<ClaimResponse> responses = claimService.searchMyClaims(claimantId, query, status, fromDate, toDate);
        return ResponseEntity.ok(StandardResponse.success(responses));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADJUSTER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<StandardResponse<Page<ClaimResponse>>> getClaims(
            @RequestParam(name = "page", defaultValue = "0") @PositiveOrZero(message = "page must be 0 or greater") int page,
            @RequestParam(name = "size", defaultValue = "10") @Positive(message = "size must be greater than 0") int size,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "sortBy", defaultValue = "createdAt") String sortBy,
            @RequestParam(name = "sortDir", defaultValue = "desc") String sortDir) {
        Page<ClaimResponse> response = claimService.getClaimsPage(page, size, status, sortBy, sortDir);
        return ResponseEntity.ok(StandardResponse.success(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADJUSTER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<StandardResponse<ClaimResponse>> updateClaim(
            @PathVariable("id") @Positive(message = "Claim ID must be positive") Long id,
            @Valid @RequestBody ClaimRequest request,
            @RequestAttribute("username") String username) {
        ClaimResponse response = claimService.updateClaim(id, request, username);
        return ResponseEntity.ok(StandardResponse.success("Claim updated", response));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADJUSTER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<StandardResponse<ClaimResponse>> updateClaimStatus(
            @PathVariable("id") @Positive(message = "Claim ID must be positive") Long id,
            @Valid @RequestBody ClaimStatusUpdateRequest request,
            @RequestAttribute("username") String username) {
        ClaimResponse response = claimService.updateClaimStatus(id, request, username);
        return ResponseEntity.ok(StandardResponse.success("Claim status updated", response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADJUSTER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<StandardResponse<ClaimResponse>> updateClaimStatusPatch(
            @PathVariable("id") @Positive(message = "Claim ID must be positive") Long id,
            @Valid @RequestBody ClaimStatusUpdateRequest request,
            @RequestAttribute("username") String username) {
        ClaimResponse response = claimService.updateClaimStatus(id, request, username);
        return ResponseEntity.ok(StandardResponse.success("Claim status updated", response));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADJUSTER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<StandardResponse<List<ClaimResponse>>> getClaimsByStatus(
            @PathVariable("status") @NotBlank(message = "Status is required") String status) {
        List<ClaimResponse> responses = claimService.getClaimsByStatus(status);
        return ResponseEntity.ok(StandardResponse.success(responses));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADJUSTER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<StandardResponse<List<ClaimResponse>>> getPendingClaims() {
        List<ClaimResponse> responses = claimService.getClaimsByStatus("UNDER_REVIEW");
        return ResponseEntity.ok(StandardResponse.success(responses));
    }

    @GetMapping("/assigned")
    @PreAuthorize("hasAnyRole('ADJUSTER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<StandardResponse<List<ClaimResponse>>> getAssignedClaims(
            @RequestAttribute("userId") Long userId) {
        List<ClaimResponse> responses = claimService.getAssignedClaims(userId);
        return ResponseEntity.ok(StandardResponse.success(responses));
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<StandardResponse<ClaimResponse>> assignClaim(
            @PathVariable("id") @Positive(message = "Claim ID must be positive") Long claimId,
            @RequestBody Map<String, Long> request,
            @RequestAttribute("username") String username) {
        Long adjusterId = request.get("adjusterId");
        if (adjusterId == null || adjusterId <= 0) {
            throw new IllegalArgumentException("adjusterId must be a positive number");
        }
        ClaimResponse response = claimService.assignClaim(claimId, adjusterId, username);
        return ResponseEntity.ok(StandardResponse.success("Claim assigned", response));
    }

    @PatchMapping("/{id}/unassign")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<StandardResponse<ClaimResponse>> unassignClaim(
            @PathVariable("id") @Positive(message = "Claim ID must be positive") Long claimId,
            @RequestAttribute("username") String username) {
        ClaimResponse response = claimService.unassignClaim(claimId, username);
        return ResponseEntity.ok(StandardResponse.success("Claim unassigned", response));
    }

    @GetMapping("/statistics")
    @PreAuthorize("hasAnyRole('ADJUSTER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<StandardResponse<Map<String, Object>>> getClaimStatistics() {
        return ResponseEntity.ok(StandardResponse.success(claimService.getClaimStatistics()));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADJUSTER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<StandardResponse<List<ClaimResponse>>> searchClaims(
            @RequestParam("query") @NotBlank(message = "query is required") String query) {
        List<ClaimResponse> responses = claimService.searchClaims(query);
        return ResponseEntity.ok(StandardResponse.success(responses));
    }

    @GetMapping("/adjuster/{adjusterId}")
    @PreAuthorize("hasAnyRole('ADJUSTER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<StandardResponse<List<ClaimResponse>>> getClaimsByAdjuster(
            @PathVariable("adjusterId") @Positive(message = "Adjuster ID must be positive") Long adjusterId) {
        List<ClaimResponse> responses = claimService.getClaimsByAdjuster(adjusterId);
        return ResponseEntity.ok(StandardResponse.success(responses));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADJUSTER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<StandardResponse<Map<String, Object>>> getClaimsSummary(
            @RequestParam(name = "startDate", required = false) String startDate,
            @RequestParam(name = "endDate", required = false) String endDate) {
        return ResponseEntity.ok(StandardResponse.success(claimService.getClaimsSummary(startDate, endDate)));
    }

    @GetMapping("/internal/all")
    @PreAuthorize("hasAnyRole('ADJUSTER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getClaimsForReporting() {
        return ResponseEntity.ok(claimService.getAllClaims().stream().map(this::toMap).toList());
    }

    @GetMapping("/internal/status/{status}")
    @PreAuthorize("hasAnyRole('ADJUSTER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getClaimsByStatusForReporting(@PathVariable("status") String status) {
        return ResponseEntity.ok(claimService.getClaimsByStatus(status).stream().map(this::toMap).toList());
    }

    @GetMapping("/internal/adjuster/{adjusterId}")
    @PreAuthorize("hasAnyRole('ADJUSTER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getClaimsByAdjusterForReporting(
            @PathVariable("adjusterId") @Positive(message = "Adjuster ID must be positive") Long adjusterId) {
        return ResponseEntity.ok(claimService.getClaimsByAdjuster(adjusterId).stream().map(this::toMap).toList());
    }

    @GetMapping("/internal/summary")
    @PreAuthorize("hasAnyRole('ADJUSTER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getClaimSummaryForReporting(
            @RequestParam(name = "startDate", required = false) String startDate,
            @RequestParam(name = "endDate", required = false) String endDate) {
        return ResponseEntity.ok(claimService.getClaimsSummary(startDate, endDate));
    }

    @GetMapping("/internal/{id}")
    @PreAuthorize("hasAnyRole('ADJUSTER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getClaimForInternalWorkflow(
            @PathVariable("id") @Positive(message = "Claim ID must be positive") Long id) {
        return ResponseEntity.ok(toMap(claimService.getClaimById(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADJUSTER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<StandardResponse<Void>> deleteClaim(
            @PathVariable("id") @Positive(message = "Claim ID must be positive") Long id) {
        claimService.deleteClaim(id);
        return ResponseEntity.ok(StandardResponse.success("Claim deleted", null));
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Claim Service is running");
    }

    private Map<String, Object> toMap(ClaimResponse response) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", response.getId());
        data.put("claimNumber", response.getClaimNumber());
        data.put("policyNumber", response.getPolicyNumber());
        data.put("policyholderId", response.getPolicyholderId());
        data.put("status", response.getStatus() != null ? response.getStatus().name() : null);
        data.put("claimAmount", response.getClaimAmount() != null ? response.getClaimAmount() : BigDecimal.ZERO);
        data.put("approvedAmount", response.getApprovedAmount());
        data.put("adjusterId", response.getAssignedAdjusterId());
        data.put("incidentDate", response.getIncidentDate() != null ? response.getIncidentDate() : LocalDate.now());
        data.put("createdAt", response.getCreatedAt() != null ? response.getCreatedAt() : LocalDateTime.now());
        return data;
    }
}
