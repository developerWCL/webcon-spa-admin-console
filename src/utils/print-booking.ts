/**
 * Utility function to print booking details in a formatted template
 */

export interface PrintBookingData {
  bookingId: string;
  bookingDate: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  guestCount: number;
  services: { name: string; price: string, quantity: number }[];
  subtotalAmount?: string;
  totalAmount: string;
  discountAmount?: string;
  currency: string;
  specialRequest?: string;
  promotionName?: string;
  promotionCode?: string;
  paymentMethod?: string;
  captureId?: string;
  branchName?: string;
  branchPhone?: string;
  branchEmail?: string;
  spaLogo?: string;
  primaryColor?: string;
}

export function generatePrintBookingHTML(data: PrintBookingData): string {
  const PRIMARY = data.primaryColor || "#00CC66";
  const LIGHT_BG = "#F0FAF6";
  const spaLogo = data.spaLogo || "https://via.placeholder.com/150";

  const lastIdx = data.services.length - 1;
  const serviceRows = data.services
    .map(
      (s, i) => `<tr>
        <td style="padding:8px 0;${i < lastIdx ? "border-bottom:1px solid #e5e7eb;" : ""}color:#374151;">${s.name}</td>
        <td style="padding:8px 0;${i < lastIdx ? "border-bottom:1px solid #e5e7eb;" : ""}color:#374151;text-align:right;white-space:nowrap;">${s.quantity} x ${s.price} ${data.currency}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Booking Detail - ${data.bookingId}</title>
  <style>
    @media print {
      body { margin: 0; padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#f9fafb;padding:24px 32px;border-bottom:1px solid #e5e7eb;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <img src="${spaLogo}" alt="Spa Logo" style="height:80px;"/>
                  </td>
                  <td style="text-align:right;vertical-align:middle;">
                    <p style="margin:0;color:${PRIMARY};font-size:13px;font-weight:600;">Booking Details</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">

              <!-- Booking ID box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:${LIGHT_BG};border-radius:6px;margin-bottom:24px;">
                <tr>
                  <td width="50%" style="padding:16px 20px;border-right:1px solid #e5e7eb;">
                    <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.8px;">Booking Reference</p>
                    <p style="margin:0;color:${PRIMARY};font-size:20px;font-weight:700;">${data.bookingId}</p>
                  </td>
                  <td width="50%" style="padding:16px 20px;vertical-align:top;">
                    <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.8px;">Branch</p>
                    <p style="margin:0;color:#111827;font-size:15px;font-weight:600;">${data.branchName || "—"}</p>
                  </td>
                </tr>
              </table>

              <!-- Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td width="50%" style="padding:0 12px 0 0;vertical-align:top;">
                    <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.8px;">Treatment Date</p>
                    <p style="margin:0;color:#111827;font-size:15px;font-weight:600;">${data.bookingDate}</p>
                  </td>
                  <td width="50%" style="padding:0 0 0 12px;vertical-align:top;">
                    <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.8px;">Guests</p>
                    <p style="margin:0;color:#111827;font-size:15px;font-weight:600;">${data.guestCount} Adult${data.guestCount !== 1 ? "s" : ""}</p>
                  </td>
                </tr>
              </table>

              <!-- Guest Information -->
              <p style="margin:0 0 12px;color:#111827;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Guest Information</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background:${LIGHT_BG};border-radius:6px;padding:16px;">
                <tr>
                  <td style="padding:0;">
                    <p style="margin:0 0 8px;color:#111827;font-size:14px;"><span style="font-weight:600;text-transform:uppercase;color:#6b7280;">Name</span> : ${data.customerName}</p>
                    ${data.customerEmail ? `<p style="margin:0 0 8px;color:#111827;font-size:14px;"><span style="font-weight:600;text-transform:uppercase;color:#6b7280;">Email</span> : ${data.customerEmail}</p>` : ""}
                    ${data.customerPhone ? `<p style="margin:0;color:#111827;font-size:14px;"><span style="font-weight:600;text-transform:uppercase;color:#6b7280;">Phone</span> : ${data.customerPhone}</p>` : ""}
                  </td>
                </tr>
              </table>

              <!-- Services -->
              <p style="margin:0 0 8px;color:#111827;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Services</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                ${serviceRows}
              </table>

              ${
                data.specialRequest
                  ? `
              <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.8px;">Special Request</p>
              <p style="margin:0 0 24px;color:#374151;font-size:14px;">${data.specialRequest}</p>
              `
                  : ""
              }

              <!-- Promotion -->
              ${
                data.promotionName
                  ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#dcfce7;border-radius:6px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;color:#15803d;font-size:14px;font-weight:600;">Promotion: <strong>${data.promotionName}</strong> (${data.promotionCode})</p>
                  </td>
                </tr>
              </table>
              `
                  : ""
              }

              <!-- Payment Method & Capture ID -->
              ${
                data.paymentMethod
                  ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td width="50%" style="padding:0 12px 0 0;vertical-align:top;">
                    <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.8px;">Payment Method</p>
                    <p style="margin:0;color:#111827;font-size:15px;font-weight:600;">${data.paymentMethod}</p>
                  </td>
                  <td width="50%" style="padding:0 0 0 12px;vertical-align:top;">
                    ${
                      data.paymentMethod === "paypal" && data.captureId
                        ? `
                    <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.8px;">Capture ID</p>
                    <p style="margin:0;color:#111827;font-size:15px;font-weight:600;">${data.captureId}</p>
                    `
                        : ""
                    }
                  </td>
                </tr>
              </table>
              `
                  : ""
              }

              <!-- Total -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid ${PRIMARY};margin-bottom:32px;">
                ${
                  data.subtotalAmount
                    ? `
                <tr>
                  <td style="padding:8px 0;color:#111827;font-size:14px;">Subtotal</td>
                  <td style="padding:8px 0;text-align:right;color:#374151;font-size:14px;white-space:nowrap;">${data.subtotalAmount} ${data.currency}</td>
                </tr>
                `
                    : ""
                }
                ${
                  data.discountAmount && parseFloat(data.discountAmount) > 0
                    ? `
                <tr>
                  <td style="padding:8px 0;color:#10b981;font-size:14px;font-weight:600;">Discount</td>
                  <td style="padding:8px 0;text-align:right;color:#10b981;font-size:14px;font-weight:600;">-${data.discountAmount} ${data.currency}</td>
                </tr>
                `
                    : ""
                }  
                <tr>
                  <td style="padding:16px 0 0;color:#111827;font-size:15px;font-weight:700;">Total</td>
                  <td style="padding:16px 0 0;text-align:right;color:${PRIMARY};font-size:18px;font-weight:700;">${data.totalAmount} ${data.currency}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <!-- <tr>
            <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;">
              ${data.branchName ? `<p style="margin:0 0 4px;color:#374151;font-size:13px;font-weight:600;">${data.branchName}</p>` : ""}
              ${data.branchPhone ? `<p style="margin:0 0 2px;color:#6b7280;font-size:12px;">Tel: ${data.branchPhone}</p>` : ""}
              ${data.branchEmail ? `<p style="margin:0;color:#6b7280;font-size:12px;">Email: ${data.branchEmail}</p>` : ""}
            </td>
          </tr>-->

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function printBooking(data: PrintBookingData) {
  const html = generatePrintBookingHTML(data);

  // Create a hidden iframe for printing
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.style.visibility = "hidden";
  iframe.style.height = "0";
  iframe.style.width = "0";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    iframe.onload = () => {
      iframe.focus();
      iframe.contentWindow?.print();

      // Remove iframe after printing completes
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 250);
    };
  }
}
