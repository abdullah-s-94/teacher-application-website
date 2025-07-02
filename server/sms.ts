import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

interface AWSConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

interface SMSMessage {
  to: string;
  message: string;
}

export class SMSService {
  private client: SNSClient | null = null;
  private config: AWSConfig | null = null;
  private isEnabled: boolean = false;

  constructor() {
    this.initializeConfig();
  }

  private initializeConfig() {
    const region = process.env.AWS_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (accessKeyId && secretAccessKey) {
      this.config = {
        region,
        accessKeyId,
        secretAccessKey
      };
      
      this.client = new SNSClient({
        region: this.config.region,
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey
        }
      });
      
      this.isEnabled = true;
      console.log('[SMS] AWS SNS service initialized successfully');
    } else {
      console.log('[SMS] SMS service disabled - missing configuration');
      console.log('[SMS] Required: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY');
      console.log('[SMS] Optional: AWS_REGION (defaults to us-east-1)');
    }
  }

  async sendStatusUpdateSMS(phone: string, fullName: string, status: string): Promise<boolean> {
    if (!this.isEnabled || !this.client) {
      console.log('[SMS] Service not enabled, skipping SMS notification');
      return false;
    }

    try {
      // Format phone number to international format
      const formattedPhone = this.formatSaudiPhone(phone);
      
      // Generate Arabic message based on status
      const message = this.generateStatusMessage(fullName, status);

      const command = new PublishCommand({
        Message: message,
        PhoneNumber: formattedPhone,
      });

      const response = await this.client.send(command);

      if (response.MessageId) {
        console.log(`[SMS] Status update sent to ${formattedPhone} for ${fullName} - Status: ${status}`);
        console.log(`[SMS] AWS SNS MessageId: ${response.MessageId}`);
        return true;
      } else {
        console.error('[SMS] Failed to send SMS - no MessageId returned');
        return false;
      }
    } catch (error) {
      console.error('[SMS] Error sending SMS:', error);
      return false;
    }
  }

  private formatSaudiPhone(phone: string): string {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Handle Saudi phone numbers
    if (cleaned.startsWith('966')) {
      // Already in international format
      return '+' + cleaned;
    } else if (cleaned.startsWith('05')) {
      // Local Saudi format, convert to international
      return '+966' + cleaned.substring(1);
    } else if (cleaned.startsWith('5') && cleaned.length === 9) {
      // Saudi mobile without country code or leading zero
      return '+966' + cleaned;
    } else {
      // Default: assume Saudi number and prepend +966
      return '+966' + cleaned;
    }
  }

  private generateStatusMessage(fullName: string, status: string): string {
    const schoolName = 'مدارس أنجال النخبة الأهلية';
    
    switch (status) {
      case 'accepted':
        return `${fullName} المحترم/ة\n\nنبشركم بقبولكم للعمل في ${schoolName}. سيتم التواصل معكم قريباً لتحديد موعد المقابلة الشخصية.\n\nتهانينا وأهلاً بكم في عائلة ${schoolName}`;
      
      case 'rejected':
        return `${fullName} المحترم/ة\n\nنشكركم على اهتمامكم بالعمل في ${schoolName}. للأسف لم يتم قبول طلبكم في الوقت الحالي.\n\nنتمنى لكم التوفيق في مسيرتكم المهنية`;
      
      default:
        return `${fullName} المحترم/ة\n\nتم تحديث حالة طلب التوظيف الخاص بكم في ${schoolName}.\n\nشكراً لتقديمكم على وظائفنا`;
    }
  }

  isServiceEnabled(): boolean {
    return this.isEnabled;
  }
}

export const smsService = new SMSService();