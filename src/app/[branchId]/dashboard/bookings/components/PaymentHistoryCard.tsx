"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PaymentData } from "../../../../../schemas/booking.schema";

interface PaymentHistoryCardProps {
  paymentHistory: PaymentData[];
}

export function PaymentHistoryCard({
  paymentHistory,
}: PaymentHistoryCardProps) {
  if (paymentHistory.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {paymentHistory.map((payment) => (
            <div
              key={payment.id}
              className="flex items-start justify-between pb-3 border-b last:border-0"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {payment.amount > 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-medium text-sm">
                    {payment.type === "deposit" ? "Payment" : "Refund"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {payment.date}
                </p>
                <p className="text-xs text-muted-foreground">
                  {payment.method}
                </p>
                {payment.note && (
                  <p className="text-xs text-muted-foreground italic mt-1">
                    {payment.note}
                  </p>
                )}
              </div>
              <span
                className={`font-semibold ${payment.amount > 0 ? "text-green-600" : "text-red-600"}`}
              >
                {payment.amount > 0 ? "+" : ""}$
                {Number(payment.amount).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
