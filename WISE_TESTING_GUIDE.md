# Wise Testing Guide (Deprecated)

Wise-based sample-request testing is no longer applicable in this repository.

Removed endpoints:
- /api/sample-requests/create-wise-transfer
- /api/sample-requests/check-wise-transfer

Use this test flow instead:
1. Open /sample-request.
2. Fill and submit the form via Proceed to Payment.
3. Verify bank details are shown.
4. Click Confirm Payment.
5. Verify redirect to /payment-confirmation/[token].
6. Submit proof using /api/payment-confirmations.
7. Verify admin review under /api/admin/payment-confirmations.

Suggested env vars for realistic UI testing:
- NEXT_PUBLIC_BANK_NAME
- NEXT_PUBLIC_BANK_ACCOUNT_NAME
- NEXT_PUBLIC_BANK_ACCOUNT_NUMBER
- NEXT_PUBLIC_BANK_IBAN
- NEXT_PUBLIC_BANK_SWIFT
- NEXT_PUBLIC_BANK_ROUTING_NUMBER
- NEXT_PUBLIC_BANK_BENEFICIARY_ADDRESS
