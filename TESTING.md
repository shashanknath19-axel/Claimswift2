# ClaimSwift Testing Guide

This guide gives one repeatable test workflow for:
- Unit tests
- Integration tests
- API testing
- End-to-end business flow testing

## 1) Unit + Integration Tests (Maven)

Run from project root:

```cmd
cmd /c "set MAVEN_HOME=C:\Users\shashank.nath\tools\apache-maven-3.9.12\apache-maven-3.9.12 && set PATH=C:\Users\shashank.nath\tools\apache-maven-3.9.12\apache-maven-3.9.12\bin;%PATH% && mvn clean test"
```

What this covers:
- Existing unit tests (auth, claim, document, reporting)
- Existing controller tests (claim)
- New integration tests for startup + actuator endpoints in:
  - config-server
  - eureka-server
  - api-gateway
  - assessment-service
  - payment-service
  - notification-service

Pass criteria:
- Maven exits with `BUILD SUCCESS`

## 2) API Smoke Testing

Prerequisite:
- Start all services first (Config, Eureka, Auth, Claim, Document, Assessment, Payment, Notification, Reporting, API Gateway).

Run smoke API validation:

```cmd
cmd /c "powershell -ExecutionPolicy Bypass -File run-logs\api-smoke-test.ps1"
```

Output:
- JSON report in `run-logs\api-smoke-report-<timestamp>.json`
- Postman environment in `run-logs\postman-env-<timestamp>.json`

Pass criteria:
- Report `failed` count is `0`

## 3) End-to-End Workflow Testing

This validates the full lifecycle through gateway:
- login/register
- create claim
- upload document
- assessment
- approval/payment path
- notifications
- reporting checks

Run:

```cmd
cmd /c "powershell -ExecutionPolicy Bypass -File run-logs\workflow-lifecycle-gateway.ps1"
```

Output:
- JSON report in `run-logs\workflow-lifecycle-gateway-<timestamp>.json`

Pass criteria:
- Report `success` is `true`
- Key steps (`create-claim`, `upload-document`, `perform-assessment`, `payment-processed`, `reporting-updated`) are marked pass

## 4) Recommended CI Order

1. `mvn clean test`
2. Start full stack
3. `api-smoke-test.ps1`
4. `workflow-lifecycle-gateway.ps1`

This sequence catches logic regressions first, then service-to-service and business-flow regressions.
