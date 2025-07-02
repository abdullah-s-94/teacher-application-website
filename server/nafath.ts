import crypto from 'crypto';
import { db } from './db';
import { nafathSessions } from '@shared/schema';
import { eq, and, lt } from 'drizzle-orm';

// نفاذ Configuration
interface NafathConfig {
  baseURL: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
}

// نفاذ User Data Interface
export interface NafathUserData {
  national_id: string;
  name_ar: string;
  birth_date: string;
  nationality: string;
  verified: boolean;
}

// Processed User Data for Application Form
export interface ProcessedNafathData {
  fullName: string;
  nationalId: string;
  birthDate: string;
  age: number;
  verified: boolean;
  transactionId: string;
}

class NafathService {
  private config: NafathConfig;

  constructor() {
    this.config = {
      baseURL: process.env.NAFATH_URL_BASE || '',
      clientId: process.env.NAFATH_CLIENT_ID || '',
      clientSecret: process.env.NAFATH_CLIENT_SECRET || '',
      redirectUri: `${process.env.APP_URL || 'http://localhost:5000'}/api/nafath/callback`,
      scope: 'profile national_id'
    };
  }

  // Check if نفاذ is properly configured
  isConfigured(): boolean {
    return !!(this.config.baseURL && this.config.clientId && this.config.clientSecret);
  }

  // Generate secure random strings
  private generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate OAuth state parameter
  private generateState(): string {
    return this.generateSecureToken(16);
  }

  // Generate session token
  private generateSessionToken(): string {
    return this.generateSecureToken(24);
  }

  // Calculate age from birth date
  private calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  // Process نفاذ user data for application form
  private processUserData(nafathData: NafathUserData, transactionId: string): ProcessedNafathData {
    return {
      fullName: nafathData.name_ar.trim(),
      nationalId: nafathData.national_id,
      birthDate: nafathData.birth_date,
      age: this.calculateAge(nafathData.birth_date),
      verified: nafathData.verified,
      transactionId
    };
  }

  // Initiate نفاذ OAuth flow
  async initiateAuth(gender: 'male' | 'female'): Promise<{ authUrl: string; sessionToken: string }> {
    if (!this.isConfigured()) {
      throw new Error('نفاذ غير مكون بشكل صحيح. يرجى التحقق من إعدادات الخادم.');
    }

    const state = this.generateState();
    const sessionToken = this.generateSessionToken();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Store session in database
    await db.insert(nafathSessions).values({
      sessionToken,
      state,
      gender,
      verified: false,
      expiresAt
    });

    // Build OAuth authorization URL
    const authUrl = `${this.config.baseURL}/oauth/authorize?` +
      `client_id=${encodeURIComponent(this.config.clientId)}&` +
      `redirect_uri=${encodeURIComponent(this.config.redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(this.config.scope)}&` +
      `state=${state}`;

    return { authUrl, sessionToken };
  }

  // Handle OAuth callback
  async handleCallback(code: string, state: string): Promise<{ sessionToken: string; success: boolean }> {
    // Find session by state
    const [session] = await db
      .select()
      .from(nafathSessions)
      .where(and(
        eq(nafathSessions.state, state),
        eq(nafathSessions.verified, false)
      ))
      .limit(1);

    if (!session) {
      throw new Error('جلسة غير صالحة أو منتهية الصلاحية');
    }

    // Check if session expired
    if (new Date() > session.expiresAt) {
      await this.cleanupSession(session.sessionToken);
      throw new Error('انتهت صلاحية الجلسة. يرجى المحاولة مرة أخرى.');
    }

    try {
      // Exchange authorization code for access token
      const tokenResponse = await this.exchangeCodeForToken(code);
      
      if (!tokenResponse.access_token) {
        throw new Error('فشل في الحصول على رمز الوصول من نفاذ');
      }

      // Fetch user data using access token
      const userData = await this.fetchUserData(tokenResponse.access_token);
      
      // Update session with user data
      await db
        .update(nafathSessions)
        .set({
          oauthCode: code,
          accessToken: tokenResponse.access_token,
          userData: JSON.stringify(userData),
          verified: true
        })
        .where(eq(nafathSessions.sessionToken, session.sessionToken));

      return { sessionToken: session.sessionToken, success: true };

    } catch (error) {
      console.error('نفاذ OAuth callback error:', error);
      await this.cleanupSession(session.sessionToken);
      throw new Error('خطأ في التحقق من نفاذ. يرجى المحاولة مرة أخرى.');
    }
  }

  // Exchange authorization code for access token
  private async exchangeCodeForToken(code: string): Promise<{ access_token: string; token_type: string }> {
    const tokenEndpoint = `${this.config.baseURL}/oauth/token`;
    
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: this.config.redirectUri
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange failed:', errorText);
      throw new Error('فشل في تبديل الرمز للحصول على رمز الوصول');
    }

    return response.json();
  }

  // Fetch user data from نفاذ API
  private async fetchUserData(accessToken: string): Promise<NafathUserData> {
    const userEndpoint = `${this.config.baseURL}/api/user`;
    
    const response = await fetch(userEndpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('User data fetch failed:', errorText);
      throw new Error('فشل في جلب بيانات المستخدم من نفاذ');
    }

    const userData = await response.json();
    
    // Validate required fields
    if (!userData.national_id || !userData.name_ar || !userData.birth_date) {
      throw new Error('بيانات المستخدم من نفاذ غير مكتملة');
    }

    return {
      national_id: userData.national_id,
      name_ar: userData.name_ar,
      birth_date: userData.birth_date,
      nationality: userData.nationality || 'saudi',
      verified: true
    };
  }

  // Get session data
  async getSessionData(sessionToken: string): Promise<ProcessedNafathData | null> {
    const [session] = await db
      .select()
      .from(nafathSessions)
      .where(and(
        eq(nafathSessions.sessionToken, sessionToken),
        eq(nafathSessions.verified, true)
      ))
      .limit(1);

    if (!session || !session.userData) {
      return null;
    }

    // Check if session expired
    if (new Date() > session.expiresAt) {
      await this.cleanupSession(sessionToken);
      return null;
    }

    try {
      const nafathData: NafathUserData = JSON.parse(session.userData);
      return this.processUserData(nafathData, session.sessionToken);
    } catch (error) {
      console.error('Error parsing نفاذ user data:', error);
      return null;
    }
  }

  // Clean up expired sessions
  async cleanupSession(sessionToken: string): Promise<void> {
    await db
      .delete(nafathSessions)
      .where(eq(nafathSessions.sessionToken, sessionToken));
  }

  // Clean up all expired sessions (scheduled task)
  async cleanupExpiredSessions(): Promise<number> {
    const result = await db
      .delete(nafathSessions)
      .where(lt(nafathSessions.expiresAt, new Date()));
    
    return result.rowCount || 0;
  }

  // Validate session exists and is not expired
  async validateSession(sessionToken: string): Promise<boolean> {
    const [session] = await db
      .select({ id: nafathSessions.id, expiresAt: nafathSessions.expiresAt })
      .from(nafathSessions)
      .where(eq(nafathSessions.sessionToken, sessionToken))
      .limit(1);

    if (!session) {
      return false;
    }

    if (new Date() > session.expiresAt) {
      await this.cleanupSession(sessionToken);
      return false;
    }

    return true;
  }
}

// Export singleton instance
export const nafathService = new NafathService();