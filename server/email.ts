import nodemailer from "nodemailer";
import { db } from "./db";
import { emailSettings } from "@shared/schema";
import { eq } from "drizzle-orm";

interface OrderEmailData {
  supplierName: string;
  supplierEmail: string;
  productName: string;
  productSku: string;
  quantity: number;
  notes?: string;
  businessName: string;
}

export async function getEmailSettings(userId: number) {
  const settings = await db
    .select()
    .from(emailSettings)
    .where(eq(emailSettings.userId, userId))
    .limit(1);
  return settings[0] || null;
}

export async function saveEmailSettings(userId: number, data: {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  fromName: string;
}) {
  const existing = await getEmailSettings(userId);
  if (existing) {
    const updated = await db
      .update(emailSettings)
      .set(data)
      .where(eq(emailSettings.userId, userId))
      .returning();
    return updated[0];
  } else {
    const created = await db
      .insert(emailSettings)
      .values({ userId, ...data })
      .returning();
    return created[0];
  }
}

export async function sendOrderEmail(userId: number, orderData: OrderEmailData): Promise<{ success: boolean; message: string }> {
  const settings = await getEmailSettings(userId);

  if (!settings?.smtpUser || !settings?.smtpPass || !settings?.fromEmail) {
    return { success: false, message: "Email credentials not configured. Please set up email in Settings." };
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost || "smtp.gmail.com",
    port: settings.smtpPort || 587,
    secure: (settings.smtpPort || 587) === 465,
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPass,
    },
  });

  const subject = `Purchase Order Request – ${orderData.productName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">📦 Purchase Order Request</h2>
        <p style="margin: 4px 0 0; opacity: 0.85;">From ${orderData.businessName}</p>
      </div>
      <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Dear <strong>${orderData.supplierName}</strong>,</p>
        <p>We would like to place a purchase order for the following item:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="background-color: #f3f4f6;">
            <th style="text-align: left; padding: 10px; border: 1px solid #e5e7eb;">Product</th>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${orderData.productName}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 10px; border: 1px solid #e5e7eb;">SKU</th>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${orderData.productSku}</td>
          </tr>
          <tr style="background-color: #f3f4f6;">
            <th style="text-align: left; padding: 10px; border: 1px solid #e5e7eb;">Quantity Required</th>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>${orderData.quantity} units</strong></td>
          </tr>
          ${orderData.notes ? `
          <tr>
            <th style="text-align: left; padding: 10px; border: 1px solid #e5e7eb;">Notes</th>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${orderData.notes}</td>
          </tr>` : ""}
        </table>
        <p>Please confirm the availability and expected delivery timeline at your earliest convenience.</p>
        <p style="margin-top: 24px;">Thank you,<br/><strong>${orderData.businessName}</strong></p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;"/>
        <p style="color: #6b7280; font-size: 12px;">This order was placed via SmartInventory – Kirana Store Management System</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"${settings.fromName || orderData.businessName}" <${settings.fromEmail}>`,
      to: orderData.supplierEmail,
      subject,
      html,
    });
    return { success: true, message: `Order email sent to ${orderData.supplierEmail}` };
  } catch (error: any) {
    console.error("Email send error:", error);
    return { success: false, message: error.message || "Failed to send email" };
  }
}
