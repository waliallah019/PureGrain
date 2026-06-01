import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, CheckCircle, Loader2 } from "lucide-react";

interface PaymentInstructionsProps {
  shippingFee: number;
  isSubmitting?: boolean;
  onPaymentConfirmed: () => Promise<void> | void;
  onCancel: () => void;
  paymentInstructions?: any;
}

const PaymentInstructions: React.FC<PaymentInstructionsProps> = ({
  shippingFee,
  isSubmitting = false,
  onPaymentConfirmed,
  onCancel,
  paymentInstructions
}) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopied(fieldName);
    toast.success(`${fieldName} copied to clipboard!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleConfirmPayment = async () => {
    if (isSubmitting) return;
    await Promise.resolve(onPaymentConfirmed());
  };

  const getBankDetails = () => {
    if (!paymentInstructions) return null;
    
    // Wise payment instructions structure may vary
    const accountDetails = paymentInstructions?.accountDetails || paymentInstructions;
    return accountDetails;
  };

  const bankDetails = getBankDetails();
  const accountTitle = bankDetails?.accountName || bankDetails?.accountTitle;

  return (
    <div className="space-y-6">
      <Card className="border-2 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-amber-600" />
            <span>Payment Instructions</span>
          </CardTitle>
          <CardDescription>
            Please complete the payment of <span className="font-semibold text-foreground">${shippingFee.toFixed(2)}</span> using the details below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {bankDetails ? (
            <div className="space-y-4">
              {accountTitle && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Account Title</Label>
                  <Input value={accountTitle} readOnly />
                </div>
              )}

              {bankDetails.accountNumber && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Account Number</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={bankDetails.accountNumber}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(bankDetails.accountNumber, 'Account Number')}
                    >
                      {copied === 'Account Number' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {bankDetails.routingNumber && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Routing Number</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={bankDetails.routingNumber}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(bankDetails.routingNumber, 'Routing Number')}
                    >
                      {copied === 'Routing Number' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {bankDetails.swiftCode && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">SWIFT Code</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={bankDetails.swiftCode}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(bankDetails.swiftCode, 'SWIFT Code')}
                    >
                      {copied === 'SWIFT Code' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {bankDetails.bankName && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Bank Name</Label>
                  <Input value={bankDetails.bankName} readOnly />
                </div>
              )}

              {bankDetails.iban && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">IBAN</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={bankDetails.iban}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(bankDetails.iban, 'IBAN')}
                    >
                      {copied === 'IBAN' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {bankDetails.reference && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Reference / Memo</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={bankDetails.reference}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(bankDetails.reference, 'Reference')}
                    >
                      {copied === 'Reference' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Please include this reference when making the payment
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-700 rounded-md">
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
                  Please contact us at support@puregrain.com if you need help with bank transfer details.
                </p>
              </div>
            </div>
          )}

          <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-700 rounded-md space-y-3">
            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
              Payment Flow
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-sm text-amber-800 dark:text-amber-200">
              <li>Use the bank details above and make the transfer from your banking app or bank branch.</li>
              <li>Keep your transfer receipt or screenshot as payment proof.</li>
              <li>Click Confirm Payment below.</li>
              <li>You will be redirected to the payment confirmation page to upload proof and submit details.</li>
            </ol>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              If you cannot submit proof right now, no problem. A payment confirmation link is also sent to your email so you can complete it later.
            </p>
          </div>

          <div className="flex space-x-4">
            <Button
              type="button"
              onClick={handleConfirmPayment}
              disabled={isSubmitting}
              className="flex-1 bg-amber-800 hover:bg-amber-900 dark:bg-amber-700 dark:hover:bg-amber-800"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting and redirecting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Payment
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>

        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            If you have any questions about the payment process, please contact us at{' '}
            <a href="mailto:support@puregrain.com" className="text-amber-600 hover:underline">
              support@puregrain.com
            </a>
            {' '}or call us at{' '}
            <a href="tel:+1234567890" className="text-amber-600 hover:underline">
              +1 (234) 567-890
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentInstructions;

