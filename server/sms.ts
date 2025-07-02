import { Client } from 'plivo';

interface SMSConfig {
  authId: string;
  authToken: string;
  fromNumber: string;
}

interface SMSMessage {
  to: string;
  message: string;
}

export class SMSService {
  private client: Client | null = null;
  private config: SMSConfig | null = null;
  private isEnabled: boolean = false;

  constructor() {
    this.initializeConfig();
  }

  private initializeConfig() {
    const authId = process.env.PLIVO_AUTH_ID;
    const authToken = process.env.PLIVO_AUTH_TOKEN;
    const fromNumber = process.env.PLIVO_FROM_NUMBER;

    if (authId && authToken && fromNumber) {
      this.config = { authId, authToken, fromNumber };
      this.client = new Client(authId, authToken);
      this.isEnabled = true;
      console.log('[SMS] SMS service initialized successfully');
    } else {
      console.log('[SMS] SMS service disabled - missing configuration');
      this.isEnabled = false;
    }
  }

  async sendStatusUpdateSMS(phone: string, fullName: string, status: string): Promise<boolean> {
    if (!this.isEnabled || !this.client || !this.config) {
      console.log('[SMS] SMS service not configured, skipping notification');
      return false;
    }

    try {
      // Format phone number for Saudi Arabia
      const formattedPhone = this.formatSaudiPhone(phone);
      
      // Generate Arabic message based on status
      const message = this.generateStatusMessage(fullName, status);

      const response = await this.client.messages.create(
        this.config.fromNumber,  // src
        formattedPhone,          // dst
        message                  // text
      );

      if (response.messageUuid) {
        console.log(`[SMS] Status update sent to ${formattedPhone} for ${fullName} - Status: ${status}`);
        return true;
      } else {
        console.error('[SMS] Failed to send SMS:', response);
        return false;
      }
    } catch (error) {
      console.error('[SMS] Error sending SMS:', error);
      return false;
    }
  }

  private formatSaudiPhone(phone: string): string {
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // If it starts with 05, replace with +9665
    if (cleanPhone.startsWith('05')) {
      return '+966' + cleanPhone.substring(1);
    }
    
    // If it starts with 5, add +966
    if (cleanPhone.startsWith('5') && cleanPhone.length === 9) {
      return '+966' + cleanPhone;
    }
    
    // If it already starts with 966, add +
    if (cleanPhone.startsWith('966')) {
      return '+' + cleanPhone;
    }
    
    // Default: assume it's a Saudi number and add +966
    return '+966' + cleanPhone;
  }

  private generateStatusMessage(fullName: string, status: string): string {
    const schoolName = 'مدارس أنجال النخبة الأهلية';
    
    switch (status) {
      case 'accepted':
        return `${schoolName}\n\nمبروك ${fullName}!\nتم قبول طلب التوظيف الخاص بك. سيتم التواصل معك قريباً لإكمال الإجراءات.\n\nنرحب بانضمامك لفريقنا التعليمي المتميز.`;
      
      case 'rejected':
        return `${schoolName}\n\nعزيزنا ${fullName}\nنشكرك على اهتمامك بالانضمام لمدارسنا. نعتذر لعدم إمكانية قبول طلبك حالياً.\n\nنتمنى لك التوفيق في مسيرتك المهنية.`;
      
      default:
        return `${schoolName}\n\nعزيزنا ${fullName}\nتم تحديث حالة طلب التوظيف الخاص بك.\n\nيمكنك التواصل مع إدارة المدرسة للاستفسار.`;
    }
  }

  isServiceEnabled(): boolean {
    return this.isEnabled;
  }
}

export const smsService = new SMSService();