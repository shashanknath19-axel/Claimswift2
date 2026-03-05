package com.claimswift.paymentservice.service;

import com.claimswift.paymentservice.client.ClaimServiceClient;
import com.claimswift.paymentservice.client.NotificationServiceClient;
import com.claimswift.paymentservice.dto.AutoPaymentRequest;
import com.claimswift.paymentservice.dto.PaymentRequest;
import com.claimswift.paymentservice.dto.PaymentResponse;
import com.claimswift.paymentservice.entity.PaymentTransaction;
import com.claimswift.paymentservice.repository.PaymentTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentTransactionRepository paymentRepository;
    private final ClaimServiceClient claimServiceClient;
    private final NotificationServiceClient notificationServiceClient;

    @Transactional
    public PaymentResponse processPayment(PaymentRequest request, Long processedBy, String username) {
        log.info("Processing simulated payment for claim {}: Amount {}",
            request.getClaimId(), request.getAmount());

        PaymentTransaction existingApproved = paymentRepository
                .findFirstByClaimIdAndStatus(request.getClaimId(), PaymentTransaction.PaymentStatus.APPROVED)
                .orElse(null);
        if (existingApproved != null) {
            log.info("Skipping duplicate payment processing for claim {}. Existing transaction: {}",
                    request.getClaimId(), existingApproved.getTransactionId());
            return mapToResponse(existingApproved, "Payment already processed for this claim");
        }

        String transactionId = generateTransactionId();

        PaymentTransaction transaction = PaymentTransaction.builder()
                .transactionId(transactionId)
                .claimId(request.getClaimId())
                .policyholderId(request.getPolicyholderId())
                .amount(request.getAmount())
                .status(PaymentTransaction.PaymentStatus.INITIATED)
                .paymentMethod(request.getPaymentMethod())
                .beneficiaryName(request.getBeneficiaryName())
                .accountNumber(maskAccountNumber(request.getAccountNumber()))
                .ifscCode(request.getIfscCode())
                .bankName(request.getBankName())
                .simulationMode(true)
                .processedBy(processedBy)
                .createdBy(username)
                .updatedBy(username)
                .build();

        transaction = paymentRepository.save(transaction);

        PaymentSimulationResult result = simulatePaymentProcessing(request);

        transaction.setStatus(result.getStatus());
        transaction.setSimulationResult(result.getResult());
        transaction.setReferenceNumber(result.getReferenceNumber());

        if (result.getStatus() == PaymentTransaction.PaymentStatus.REJECTED ||
            result.getStatus() == PaymentTransaction.PaymentStatus.FAILED) {
            transaction.setFailureReason(result.getFailureReason());
        }

        transaction.setUpdatedBy(username);
        transaction = paymentRepository.save(transaction);

        updateClaimPaymentStatus(request.getClaimId(), request.getAmount(), result.getStatus());
        if (result.getStatus() == PaymentTransaction.PaymentStatus.APPROVED) {
            notifyPaymentProcessed(request, transaction);
        }

        log.info("Simulated payment completed for claim {}: Status {} - {}",
            request.getClaimId(), result.getStatus(), result.getResult());

        return mapToResponse(transaction, result.getMessage());
    }

    @Transactional
    public PaymentResponse processWorkflowPayment(AutoPaymentRequest request, Long processedBy, String username) {
        PaymentRequest paymentRequest = new PaymentRequest();
        paymentRequest.setClaimId(request.getClaimId());
        paymentRequest.setClaimNumber(request.getClaimNumber());
        paymentRequest.setPolicyholderId(request.getPolicyholderId());
        paymentRequest.setAmount(request.getAmount());
        paymentRequest.setPaymentMethod(PaymentTransaction.PaymentMethod.BANK_TRANSFER);
        paymentRequest.setBeneficiaryName("Policyholder-" + request.getPolicyholderId());
        paymentRequest.setAccountNumber(buildSyntheticAccountNumber(request.getPolicyholderId()));
        paymentRequest.setIfscCode("CLSW0000123");
        paymentRequest.setBankName("ClaimSwift Test Bank");
        paymentRequest.setForceSimulateSuccess(request.getForceSuccess() == null || request.getForceSuccess());
        paymentRequest.setForceSimulateFailure(false);

        return processPayment(paymentRequest, processedBy, username);
    }

    private PaymentSimulationResult simulatePaymentProcessing(PaymentRequest request) {
        PaymentSimulationResult result = new PaymentSimulationResult();

        if (Boolean.TRUE.equals(request.getForceSimulateSuccess())) {
            result.setStatus(PaymentTransaction.PaymentStatus.APPROVED);
            result.setResult("SIMULATED_SUCCESS");
            result.setReferenceNumber(generateReferenceNumber());
            result.setMessage("Payment simulated successfully (forced success)");
            return result;
        }

        if (Boolean.TRUE.equals(request.getForceSimulateFailure())) {
            result.setStatus(PaymentTransaction.PaymentStatus.REJECTED);
            result.setResult("SIMULATED_FAILURE");
            result.setFailureReason(request.getSimulateFailureReason() != null ?
                request.getSimulateFailureReason() : "Simulated failure");
            result.setMessage("Payment simulated failure (forced failure)");
            return result;
        }

        BigDecimal amount = request.getAmount();
        double successProbability;

        if (amount.compareTo(new BigDecimal("10000")) < 0) {
            successProbability = 0.90;
        } else if (amount.compareTo(new BigDecimal("50000")) < 0) {
            successProbability = 0.80;
        } else {
            successProbability = 0.70;
        }

        double random = Math.random();

        if (random < successProbability) {
            result.setStatus(PaymentTransaction.PaymentStatus.APPROVED);
            result.setResult("SIMULATED_SUCCESS");
            result.setReferenceNumber(generateReferenceNumber());
            result.setMessage("Payment processed successfully (simulated)");
        } else {
            result.setStatus(PaymentTransaction.PaymentStatus.REJECTED);
            result.setResult("SIMULATED_FAILURE");
            result.setFailureReason(getRandomFailureReason());
            result.setMessage("Payment failed: " + result.getFailureReason());
        }

        return result;
    }

    private String getRandomFailureReason() {
        String[] failureReasons = {
            "Insufficient funds in source account",
            "Bank server timeout",
            "Invalid account details",
            "Daily transaction limit exceeded",
            "Bank maintenance window",
            "NEFT/RTGS service unavailable",
            "Account frozen or blocked",
            "IFSC code validation failed"
        };
        int index = (int) (Math.random() * failureReasons.length);
        return failureReasons[index];
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPayment(Long id) {
        PaymentTransaction transaction = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + id));
        return mapToResponse(transaction, null);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByClaim(Long claimId) {
        List<PaymentTransaction> transactions = paymentRepository.findByClaimId(claimId);
        return transactions.stream()
                .map(t -> mapToResponse(t, null))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getAllPayments() {
        return paymentRepository.findAll().stream()
                .map(t -> mapToResponse(t, null))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByStatus(PaymentTransaction.PaymentStatus status) {
        return paymentRepository.findByStatus(status).stream()
                .map(t -> mapToResponse(t, null))
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPaymentSummary(String startDate, String endDate) {
        List<PaymentTransaction> transactions = paymentRepository.findAll();
        BigDecimal totalAmount = transactions.stream()
                .map(PaymentTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long total = transactions.size();
        long approved = transactions.stream().filter(t -> t.getStatus() == PaymentTransaction.PaymentStatus.APPROVED).count();
        long rejected = transactions.stream().filter(t -> t.getStatus() == PaymentTransaction.PaymentStatus.REJECTED).count();
        long failed = transactions.stream().filter(t -> t.getStatus() == PaymentTransaction.PaymentStatus.FAILED).count();
        long pending = transactions.stream().filter(t ->
                t.getStatus() == PaymentTransaction.PaymentStatus.PROCESSING ||
                t.getStatus() == PaymentTransaction.PaymentStatus.PENDING_VERIFICATION ||
                t.getStatus() == PaymentTransaction.PaymentStatus.INITIATED).count();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("startDate", startDate);
        summary.put("endDate", endDate);
        summary.put("generatedAt", LocalDateTime.now());
        summary.put("totalPayments", total);
        summary.put("approvedPayments", approved);
        summary.put("rejectedPayments", rejected);
        summary.put("failedPayments", failed);
        summary.put("pendingPayments", pending);
        summary.put("totalAmount", totalAmount);
        return summary;
    }

    private void updateClaimPaymentStatus(Long claimId, BigDecimal amount, PaymentTransaction.PaymentStatus status) {
        try {
            Map<String, Object> statusUpdate = new HashMap<>();

            if (status == PaymentTransaction.PaymentStatus.APPROVED) {
                statusUpdate.put("status", "PAID");
                statusUpdate.put("approvedAmount", amount);
                statusUpdate.put("notes", "Marked PAID by payment-service transaction");
            } else if (status == PaymentTransaction.PaymentStatus.REJECTED ||
                       status == PaymentTransaction.PaymentStatus.FAILED) {
                statusUpdate.put("status", "PAYMENT_FAILED");
                statusUpdate.put("notes", "Payment failed/rejected in payment-service");
            } else {
                return;
            }

            claimServiceClient.updateClaimStatus(claimId, statusUpdate);
            log.info("Claim {} status updated to {}", claimId, statusUpdate.get("status"));
        } catch (Exception e) {
            log.error("Failed to update claim status for claim {}", claimId, e);
        }
    }

    private void notifyPaymentProcessed(PaymentRequest request, PaymentTransaction transaction) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("userId", request.getPolicyholderId());
            payload.put("claimId", request.getClaimId());
            payload.put("claimNumber", request.getClaimNumber() != null ? request.getClaimNumber() : request.getClaimId());
            payload.put("amount", transaction.getAmount());
            notificationServiceClient.sendPaymentProcessedNotification(payload);
        } catch (Exception e) {
            log.error("Failed to notify payment completion for claim {}", request.getClaimId(), e);
        }
    }

    private String buildSyntheticAccountNumber(Long policyholderId) {
        long safeId = policyholderId == null ? 0L : policyholderId;
        return String.format("000000000000%04d", safeId % 10000);
    }

    private String generateTransactionId() {
        return "TXN" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
    }

    private String generateReferenceNumber() {
        return "REF" + System.currentTimeMillis() + (int)(Math.random() * 1000);
    }

    private String maskAccountNumber(String accountNumber) {
        if (accountNumber == null || accountNumber.length() < 4) {
            return accountNumber;
        }
        return "****" + accountNumber.substring(accountNumber.length() - 4);
    }

    private PaymentResponse mapToResponse(PaymentTransaction transaction, String message) {
        PaymentResponse response = new PaymentResponse();
        response.setId(transaction.getId());
        response.setTransactionId(transaction.getTransactionId());
        response.setClaimId(transaction.getClaimId());
        response.setPolicyholderId(transaction.getPolicyholderId());
        response.setAmount(transaction.getAmount());
        response.setStatus(transaction.getStatus());
        response.setPaymentMethod(transaction.getPaymentMethod());
        response.setBeneficiaryName(transaction.getBeneficiaryName());
        response.setReferenceNumber(transaction.getReferenceNumber());
        response.setSimulationMode(transaction.getSimulationMode());
        response.setSimulationResult(transaction.getSimulationResult());
        response.setFailureReason(transaction.getFailureReason());
        response.setCreatedAt(transaction.getCreatedAt());
        response.setUpdatedAt(transaction.getUpdatedAt());
        response.setMessage(message);
        return response;
    }

    private static class PaymentSimulationResult {
        private PaymentTransaction.PaymentStatus status;
        private String result;
        private String referenceNumber;
        private String failureReason;
        private String message;

        public PaymentTransaction.PaymentStatus getStatus() { return status; }
        public void setStatus(PaymentTransaction.PaymentStatus status) { this.status = status; }
        public String getResult() { return result; }
        public void setResult(String result) { this.result = result; }
        public String getReferenceNumber() { return referenceNumber; }
        public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }
        public String getFailureReason() { return failureReason; }
        public void setFailureReason(String failureReason) { this.failureReason = failureReason; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}
