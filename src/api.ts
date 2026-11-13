const TOKEN_KEY = 'creative_studio_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredToken();
    }
    throw new Error(data.error || `خطأ في الخادم (${response.status})`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: { email: string; password: string; displayName: string }) => 
    request<{ token: string; user: any }>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) => 
    request<{ token: string; user: any }>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  loginWithGoogle: (body: { credential?: string; email?: string; displayName?: string; photoUrl?: string }) => 
    request<{ token: string; user: any }>('/api/auth/google', { method: 'POST', body: JSON.stringify(body) }),

  syncFirebaseAuth: (body: { idToken?: string; firebaseUid?: string; email: string; displayName?: string; photoUrl?: string; authProvider?: 'password' | 'google' }) =>
    request<{ token: string; user: any }>('/api/auth/firebase', { method: 'POST', body: JSON.stringify(body) }),

  getMe: () => 
    request<{ user: any; wallet: any; subscription: any; systemConfig: any }>('/api/auth/me'),

  updateProfile: (body: { displayName?: string; avatar?: string }) => 
    request<{ success: boolean; user: any }>('/api/auth/profile', { method: 'POST', body: JSON.stringify(body) }),

  // Dashboard & Account
  getAccountOverview: () => 
    request<any>('/api/account/overview'),

  // Plans & Subscriptions
  getPlans: () => 
    request<{ plans: any[]; currency: string }>('/api/plans'),

  getCurrentSubscription: () => 
    request<{ subscription: any; plan: any }>('/api/subscriptions/current'),

  // Activation Keys
  redeemActivationKey: (keyCode: string) => 
    request<any>('/api/activation/redeem', { method: 'POST', body: JSON.stringify({ keyCode }) }),

  // Wallet & Ledger
  getWallet: () => 
    request<{ wallet: any }>('/api/wallet'),

  getLedger: () => 
    request<{ ledger: any[] }>('/api/wallet/ledger'),

  // AI Generations
  enhancePrompt: (body: { rawIdea: string; contentType: string; style?: string; targetAudience?: string; language?: string }) =>
    request<{ success: boolean; job: any }>('/api/generations/prompt-enhance', { method: 'POST', body: JSON.stringify(body) }),

  generateImage: (body: { prompt: string; model?: string; aspectRatio?: string; arabicPosterText?: string; posterSubtitle?: string }) =>
    request<{ success: boolean; job: any }>('/api/generations/image', { method: 'POST', body: JSON.stringify(body) }),

  generateSpeech: (body: { text: string; voiceName?: string; style?: string }) =>
    request<{ success: boolean; job: any }>('/api/generations/speech', { method: 'POST', body: JSON.stringify(body) }),

  generateVideo: (body: { prompt?: string; model?: string; aspectRatio?: string; resolution?: string; imageBase64?: string }) =>
    request<{ success: boolean; message: string; job: any }>('/api/generations/video', { method: 'POST', body: JSON.stringify(body) }),

  getJobStatus: (jobId: string) =>
    request<{ job: any }>(`/api/generations/${jobId}`),

  cancelJob: (jobId: string) =>
    request<{ success: boolean; job: any }>(`/api/generations/${jobId}/cancel`, { method: 'POST' }),

  // Projects & Stats
  getProjects: (type?: string) =>
    request<{ projects: any[] }>(`/api/projects${type ? `?type=${type}` : ''}`),

  deleteProject: (jobId: string) =>
    request<{ success: boolean }>(`/api/projects/${jobId}`, { method: 'DELETE' }),

  getUserStats: () =>
    request<{ stats: any }>('/api/user/stats'),

  // BYOK Credentials
  getCustomerCredentials: () =>
    request<{ credentials: any[] }>('/api/customer-credentials'),

  addCustomerCredential: (body: { providerId: string; apiKey: string }) =>
    request<{ success: boolean; credential: any }>('/api/customer-credentials', { method: 'POST', body: JSON.stringify(body) }),

  deleteCustomerCredential: (credentialId: string) =>
    request<{ success: boolean }>(`/api/customer-credentials/${credentialId}`, { method: 'DELETE' }),

  // Commercial Payments
  submitManualPayment: (body: { planId?: string; creditsAmount?: number; method: string; transferReference?: string; proofAttachmentUrl?: string }) =>
    request<{ success: boolean; message: string; payment: any }>('/api/payments/manual', { method: 'POST', body: JSON.stringify(body) }),

  getMyPayments: () =>
    request<{ payments: any[] }>('/api/payments/my'),

  // Admin Controls
  getAdminMetrics: () =>
    request<any>('/api/admin/metrics'),

  getAdminUsers: () =>
    request<{ users: any[] }>('/api/admin/users'),

  adjustUserCredits: (uid: string, amount: number, reason: string) =>
    request<{ success: boolean; newBalance: number }>(`/api/admin/users/${uid}/adjust-credits`, { method: 'POST', body: JSON.stringify({ amount, reason }) }),

  toggleUserStatus: (uid: string) =>
    request<{ success: boolean; status: string }>(`/api/admin/users/${uid}/toggle-status`, { method: 'POST' }),

  getAdminActivationKeys: () =>
    request<{ keys: any[] }>('/api/admin/activation-keys'),

  generateActivationKeys: (body: { count: number; planId?: string; creditsAmount?: number; maxActivations?: number; expiresDays?: number }) =>
    request<{ success: boolean; message: string; generatedKeys: any[] }>('/api/admin/activation-keys/generate', { method: 'POST', body: JSON.stringify(body) }),

  revokeActivationKey: (keyId: string) =>
    request<{ success: boolean }>(`/api/admin/activation-keys/${keyId}/revoke`, { method: 'POST' }),

  getAdminPayments: () =>
    request<{ payments: any[] }>('/api/admin/payments'),

  reviewPayment: (paymentId: string, action: 'approve' | 'reject', notes?: string) =>
    request<{ success: boolean; payment: any }>(`/api/admin/payments/${paymentId}/review`, { method: 'POST', body: JSON.stringify({ action, notes }) }),

  getAdminProviders: () =>
    request<{ providers: any[] }>('/api/admin/providers'),

  toggleProvider: (providerId: string) =>
    request<{ success: boolean; provider: any }>(`/api/admin/providers/${providerId}/toggle`, { method: 'POST' }),

  getAdminSettings: () =>
    request<{ settings: any }>('/api/admin/settings'),

  updateAdminSettings: (settings: any) =>
    request<{ success: boolean; settings: any }>('/api/admin/settings', { method: 'PUT', body: JSON.stringify(settings) }),

  // Admin Plans Management
  getAdminPlans: () =>
    request<{ plans: any[]; currency: string }>('/api/admin/plans'),

  createAdminPlan: (body: any) =>
    request<{ success: boolean; message: string; plan: any }>('/api/admin/plans', { method: 'POST', body: JSON.stringify(body) }),

  updateAdminPlan: (planId: string, body: any) =>
    request<{ success: boolean; message: string; plan: any }>(`/api/admin/plans/${planId}`, { method: 'PUT', body: JSON.stringify(body) }),

  toggleAdminPlan: (planId: string) =>
    request<{ success: boolean; message: string; plan: any }>(`/api/admin/plans/${planId}/toggle`, { method: 'POST' }),

  deleteAdminPlan: (planId: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/plans/${planId}`, { method: 'DELETE' }),

  getAuditLogs: () =>
    request<{ logs: any[] }>('/api/admin/audit-logs'),

  runSelfTest: () =>
    request<any>('/api/system/self-test')
};
