import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

// نفاذ data interfaces
export interface NafathUserData {
  fullName: string;
  nationalId: string;
  birthDate: string;
  age: number;
  verified: boolean;
  transactionId: string;
}

export interface NafathStatus {
  configured: boolean;
  message: string;
}

export interface NafathSessionResponse {
  data: NafathUserData;
  message: string;
}

// نفاذ hook for managing OAuth flow and session data
export function useNafath() {
  const queryClient = useQueryClient();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [nafathData, setNafathData] = useState<NafathUserData | null>(null);
  const [isInitiating, setIsInitiating] = useState(false);

  // Check نفاذ service status
  const { data: nafathStatus, isLoading: isCheckingStatus } = useQuery<NafathStatus>({
    queryKey: ['/api/nafath/status'],
    queryFn: async () => {
      const response = await fetch('/api/nafath/status');
      if (!response.ok) throw new Error('Failed to check نفاذ status');
      return response.json();
    },
  });

  // Get session data when session token is available
  const { data: sessionData, isLoading: isLoadingSession, error: sessionError } = useQuery<NafathSessionResponse>({
    queryKey: ['/api/nafath/session', sessionToken],
    queryFn: async () => {
      const response = await fetch(`/api/nafath/session/${sessionToken}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('انتهت صلاحية الجلسة أو غير موجودة');
        }
        throw new Error('فشل في جلب بيانات نفاذ');
      }
      return response.json();
    },
    enabled: !!sessionToken,
    retry: false, // Don't retry if session is invalid
  });

  // Mutation to initiate نفاذ authentication
  const initiateMutation = useMutation({
    mutationFn: async (gender: 'male' | 'female') => {
      const response = await fetch('/api/nafath/initiate', {
        method: 'POST',
        body: JSON.stringify({ gender }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to initiate نفاذ auth');
      return response.json();
    },
    onSuccess: (data) => {
      // Store session token for later use
      setSessionToken(data.sessionToken);
      localStorage.setItem('nafath_session_token', data.sessionToken);
      
      // Redirect to نفاذ OAuth URL
      window.location.href = data.authUrl;
    },
    onError: (error) => {
      console.error('Error initiating نفاذ auth:', error);
      setIsInitiating(false);
    }
  });

  // Mutation to clean up session
  const cleanupMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await fetch(`/api/nafath/session/${token}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to cleanup session');
      return response.json();
    },
    onSuccess: () => {
      setSessionToken(null);
      setNafathData(null);
      localStorage.removeItem('nafath_session_token');
      localStorage.removeItem('nafath_success');
      localStorage.removeItem('nafath_error');
    }
  });

  // Initialize from URL parameters or localStorage on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionFromUrl = urlParams.get('nafath_session');
    const successFromUrl = urlParams.get('nafath_success');
    const errorFromUrl = urlParams.get('nafath_error');
    
    // Handle successful OAuth callback
    if (sessionFromUrl && successFromUrl) {
      setSessionToken(sessionFromUrl);
      localStorage.setItem('nafath_session_token', sessionFromUrl);
      localStorage.setItem('nafath_success', 'true');
      
      // Clean up URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
    
    // Handle OAuth error
    if (errorFromUrl) {
      localStorage.setItem('nafath_error', decodeURIComponent(errorFromUrl));
      
      // Clean up URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
    
    // Load session token from localStorage if available
    const storedToken = localStorage.getItem('nafath_session_token');
    if (storedToken && !sessionFromUrl) {
      setSessionToken(storedToken);
    }
  }, []);

  // Update نفاذ data when session data is loaded
  useEffect(() => {
    if (sessionData?.data) {
      setNafathData(sessionData.data);
    }
  }, [sessionData]);

  // Handle session errors (expired, invalid, etc.)
  useEffect(() => {
    if (sessionError) {
      console.error('نفاذ session error:', sessionError);
      // Clear invalid session
      if (sessionToken) {
        setSessionToken(null);
        setNafathData(null);
        localStorage.removeItem('nafath_session_token');
      }
    }
  }, [sessionError, sessionToken]);

  // Function to initiate نفاذ authentication
  const initiateAuth = (gender: 'male' | 'female') => {
    setIsInitiating(true);
    initiateMutation.mutate(gender);
  };

  // Function to clear نفاذ session and data
  const clearSession = () => {
    if (sessionToken) {
      cleanupMutation.mutate(sessionToken);
    } else {
      // Clear local state even if no session token
      setSessionToken(null);
      setNafathData(null);
      localStorage.removeItem('nafath_session_token');
      localStorage.removeItem('nafath_success');
      localStorage.removeItem('nafath_error');
    }
  };

  // Get stored success/error messages
  const getStoredMessages = () => {
    const success = localStorage.getItem('nafath_success') === 'true';
    const error = localStorage.getItem('nafath_error');
    
    return { success, error };
  };

  // Clear stored messages
  const clearStoredMessages = () => {
    localStorage.removeItem('nafath_success');
    localStorage.removeItem('nafath_error');
  };

  return {
    // Status
    nafathStatus,
    isNafathConfigured: nafathStatus?.configured || false,
    isCheckingStatus,
    
    // Session management
    sessionToken,
    nafathData,
    isLoadingSession,
    sessionError,
    
    // Authentication
    initiateAuth,
    isInitiating: isInitiating || initiateMutation.isPending,
    initiateError: initiateMutation.error,
    
    // Cleanup
    clearSession,
    isClearingSession: cleanupMutation.isPending,
    
    // Messages
    getStoredMessages,
    clearStoredMessages,
    
    // Computed properties
    isVerified: !!nafathData?.verified,
    hasValidSession: !!sessionToken && !!nafathData && !sessionError,
  };
}

// Helper hook for checking if user came from نفاذ authentication
export function useNafathRedirect() {
  const [redirectInfo, setRedirectInfo] = useState<{
    isFromNafath: boolean;
    success: boolean;
    error: string | null;
    sessionToken: string | null;
  }>({
    isFromNafath: false,
    success: false,
    error: null,
    sessionToken: null
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionFromUrl = urlParams.get('nafath_session');
    const successFromUrl = urlParams.get('nafath_success');
    const errorFromUrl = urlParams.get('nafath_error');
    
    if (sessionFromUrl || successFromUrl || errorFromUrl) {
      setRedirectInfo({
        isFromNafath: true,
        success: successFromUrl === 'true',
        error: errorFromUrl ? decodeURIComponent(errorFromUrl) : null,
        sessionToken: sessionFromUrl
      });
      
      // Clean up URL parameters after processing
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  return redirectInfo;
}