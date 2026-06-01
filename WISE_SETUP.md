# Wise Setup (Deprecated)

This project no longer uses Wise routes for sample-request payment setup.

Removed endpoints:
- /api/sample-requests/create-wise-transfer
- /api/sample-requests/check-wise-transfer

Current sample-request payment workflow:
1. User fills the sample request form.
2. Proceed to Payment shows bank transfer details in-app.
3. User pays outside the app.
4. User clicks Confirm Payment and is taken to /payment-confirmation/[token].
5. Backend sends an email with the same payment confirmation link, so proof can be submitted later.
6. If proof is already submitted, the user can ignore the email.

Optional frontend env vars for bank-detail display:
- NEXT_PUBLIC_BANK_NAME
- NEXT_PUBLIC_BANK_ACCOUNT_NAME
- NEXT_PUBLIC_BANK_ACCOUNT_NUMBER
- NEXT_PUBLIC_BANK_IBAN
- NEXT_PUBLIC_BANK_SWIFT
- NEXT_PUBLIC_BANK_ROUTING_NUMBER
- NEXT_PUBLIC_BANK_BENEFICIARY_ADDRESS
