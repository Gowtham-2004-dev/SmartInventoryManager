import twilio from 'twilio';
import { storage } from './storage';

// Initialize Twilio client with environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Create a Twilio client
const twilioClient = twilio(accountSid, authToken);

export class NotificationService {
  /**
   * Send an SMS notification to a user
   * @param userId - The ID of the user to notify
   * @param message - The message to send
   * @returns Promise resolving to success status
   */
  async sendSMS(userId: number, message: string): Promise<boolean> {
    try {
      // Get the user details including phone number
      const user = await storage.getUser(userId);
      
      if (!user || !user.phoneNumber) {
        console.error(`Cannot send SMS to user ${userId}: No phone number found`);
        return false;
      }
      
      // Send SMS using Twilio
      await twilioClient.messages.create({
        body: message,
        from: twilioPhoneNumber,
        to: user.phoneNumber
      });
      
      console.log(`SMS sent successfully to user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error sending SMS notification:', error);
      return false;
    }
  }
  
  /**
   * Send a low stock alert notification
   * @param userId - The ID of the user to notify
   * @param productName - The name of the product that is low in stock
   * @param quantity - The current quantity
   * @returns Promise resolving to success status
   */
  async sendLowStockAlert(userId: number, productName: string, quantity: number): Promise<boolean> {
    const message = `⚠️ Low Stock Alert: ${productName} is running low with only ${quantity} units remaining. Please consider restocking soon.`;
    return this.sendSMS(userId, message);
  }
  
  /**
   * Send a sales report notification
   * @param userId - The ID of the user to notify
   * @param totalSales - Total sales amount
   * @param productCount - Number of products sold
   * @returns Promise resolving to success status
   */
  async sendSalesReport(userId: number, totalSales: number, productCount: number): Promise<boolean> {
    const message = `📊 Sales Report: Today you sold ${productCount} products for a total of ₹${totalSales.toFixed(2)}. Great job!`;
    return this.sendSMS(userId, message);
  }
  
  /**
   * Send a forecast alert notification
   * @param userId - The ID of the user to notify
   * @param productName - The name of the product
   * @param predictedDemand - The predicted demand for the product
   * @returns Promise resolving to success status
   */
  async sendForecastAlert(userId: number, productName: string, predictedDemand: number): Promise<boolean> {
    const message = `🔮 Forecast Alert: We predict a demand of ${predictedDemand} units for ${productName} in the coming week.`;
    return this.sendSMS(userId, message);
  }
}

export const notifications = new NotificationService();