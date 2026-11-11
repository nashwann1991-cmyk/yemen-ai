export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: 'admin' | 'creator' | 'user';
  status: 'active' | 'suspended';
  avatar?: string;
  createdAt: string;
}

export interface UserWallet {
  availableCredits: number;
  reservedCredits: number;
}

export interface Plan {
  planId: string;
  name: string;
  nameAr: string;
  description: string;
  priceMinor: number;
  currency: string;
  duration: 'weekly' | '5days' | 'daily' | 'monthly' | 'annual' | 'custom' | string;
  durationDays?: number;
  creditsGranted: number;
  allowedModels: string[];
  maxVideoDurationSeconds: number;
  maxDailyJobs: number;
  active: boolean;
  features?: string[];
  badge?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Subscription {
  subscriptionId: string;
  uid: string;
  planId: string;
  planName?: string;
  status: 'active' | 'expired' | 'cancelled';
  startsAt: string;
  expiresAt: string;
  plan?: Plan;
}

export interface GenerationJob {
  jobId: string;
  uid: string;
  type: 'video' | 'image' | 'speech' | 'prompt_expand';
  providerId: string;
  modelId: string;
  prompt: string;
  status: 'queued' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  estimatedCost: number;
  reservedCredits: number;
  actualCost: number;
  resultUrl?: string;
  resultData?: any;
  errorCode?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  completedAt?: string;
}

export interface LedgerEntry {
  transactionId: string;
  uid: string;
  type: 'credit_purchase' | 'plan_grant' | 'generation_hold' | 'generation_finalize' | 'generation_refund' | 'activation_redeem' | 'admin_adjustment';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId: string;
  description: string;
  createdAt: string;
}

export interface ActivationKeyRecord {
  keyId: string;
  keyHash: string;
  planId?: string;
  creditsAmount: number;
  status: 'active' | 'redeemed' | 'revoked' | 'expired';
  expiresAt?: string;
  maxActivations: number;
  activationCount: number;
  createdBy: string;
  createdAt: string;
}

export interface PaymentRecord {
  paymentId: string;
  uid: string;
  userEmail: string;
  planId?: string;
  creditsPurchased?: number;
  amountMinor: number;
  currency: string;
  method: 'manual_bank' | 'manual_crypto' | 'electronic_stripe' | 'activation_key';
  status: 'pending' | 'confirmed' | 'rejected';
  transferReference?: string;
  proofAttachmentUrl?: string;
  adminNotes?: string;
  createdAt: string;
  confirmedAt?: string;
}

export interface ProviderConfig {
  providerId: string;
  name: string;
  nameAr: string;
  enabled: boolean;
  type: string;
  models: {
    modelId: string;
    name: string;
    task: 'text' | 'image' | 'video' | 'speech';
    creditCost: number;
    enabled: boolean;
  }[];
  secretConfigured: boolean;
}

export interface SiteSettings {
  siteName: string;
  siteNameAr: string;
  taglineAr: string;
  primaryCurrency: string;
  creditPriceCents: number;
  manualBankDetails: string;
  manualCryptoDetails: string;
  allowByok: boolean;
  freeTrialCredits: number;
  supportEmail: string;
}
