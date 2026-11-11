import fs from 'fs';
import path from 'path';

export interface User {
  uid: string;
  displayName: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'creator' | 'user';
  status: 'active' | 'suspended';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  planId: string;
  name: string;
  nameAr: string;
  description: string;
  priceMinor: number; // e.g. 2900 = $29.00
  currency: string;
  duration: 'weekly' | '5days' | 'daily' | 'monthly' | 'annual' | 'custom' | string;
  durationDays?: number; // e.g. 5, 7, 30, or any custom days
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
  status: 'active' | 'expired' | 'cancelled';
  startsAt: string;
  expiresAt: string;
  paymentReference?: string;
}

export interface ActivationKey {
  keyId: string;
  keyCode?: string; // Only returned on generation
  keyHash: string;
  planId?: string;
  creditsAmount: number;
  status: 'active' | 'redeemed' | 'revoked' | 'expired';
  expiresAt?: string;
  maxActivations: number;
  activationCount: number;
  assignedUid?: string;
  createdBy: string;
  redeemedBy?: { uid: string; redeemedAt: string }[];
  createdAt: string;
}

export interface Wallet {
  uid: string;
  availableCredits: number;
  reservedCredits: number;
  totalPurchased: number;
  updatedAt: string;
}

export interface LedgerEntry {
  transactionId: string;
  uid: string;
  type: 'credit_purchase' | 'plan_grant' | 'generation_hold' | 'generation_finalize' | 'generation_refund' | 'activation_redeem' | 'admin_adjustment';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId: string;
  idempotencyKey?: string;
  description: string;
  createdAt: string;
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

export interface ProviderConfig {
  providerId: string;
  name: string;
  nameAr: string;
  enabled: boolean;
  type: 'google_gemini' | 'custom_veo' | 'elevenlabs_proxy';
  models: {
    modelId: string;
    name: string;
    task: 'text' | 'image' | 'video' | 'speech';
    creditCost: number;
    enabled: boolean;
  }[];
  secretConfigured: boolean;
  updatedAt: string;
}

export interface CustomerApiCredential {
  credentialId: string;
  uid: string;
  providerId: string;
  encryptedSecret: string;
  keyMask: string;
  status: 'active' | 'invalid' | 'revoked';
  createdAt: string;
  lastValidatedAt?: string;
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
  proofAttachmentUrl?: string;
  transferReference?: string;
  adminNotes?: string;
  idempotencyKey?: string;
  createdAt: string;
  confirmedAt?: string;
}

export interface SiteSettings {
  siteName: string;
  siteNameAr: string;
  taglineAr: string;
  primaryCurrency: string;
  creditPriceCents: number; // e.g. 10 cents per credit
  manualBankDetails: string;
  manualCryptoDetails: string;
  allowByok: boolean;
  freeTrialCredits: number;
  supportEmail: string;
}

export interface AuditLog {
  logId: string;
  actorUid: string;
  actorEmail?: string;
  action: string;
  targetType: string;
  targetId: string;
  timestamp: string;
  safeMetadata: Record<string, any>;
}

export interface DatabaseSchema {
  users: User[];
  plans: Plan[];
  subscriptions: Subscription[];
  activationKeys: ActivationKey[];
  wallets: Wallet[];
  ledger: LedgerEntry[];
  generationJobs: GenerationJob[];
  providers: ProviderConfig[];
  customerApiCredentials: CustomerApiCredential[];
  payments: PaymentRecord[];
  auditLogs: AuditLog[];
  siteSettings: SiteSettings;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const MEDIA_DIR = path.join(DATA_DIR, 'media');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

export const MEDIA_STORAGE_DIR = MEDIA_DIR;

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'CREATIVE AI STUDIO PRO',
  siteNameAr: 'استوديو الإبداع بالذكاء الاصطناعي',
  taglineAr: 'المنصة التجارية المتكاملة لصناعة الفيديو، الصور والتعليقات الصوتية بالذكاء الاصطناعي',
  primaryCurrency: 'USD',
  creditPriceCents: 10,
  manualBankDetails: 'البنك التجاري الدولي - حساب رقم: 9876543210 - آيبان: AE070331234567890123456 - اسم المستفيد: استوديو الإبداع الرقمي',
  manualCryptoDetails: 'USDT (TRC20): TXYzCreativeStudioProOfficialWallet99',
  allowByok: true,
  freeTrialCredits: 100,
  supportEmail: 'support@creativestudio.ai'
};

const DEFAULT_PLANS: Plan[] = [
  {
    planId: 'plan_trial',
    name: 'Free Trial',
    nameAr: 'تجربة مجانية',
    description: 'تجربة قدرات المنصة التوليدية فور التسجيل',
    priceMinor: 0,
    currency: 'USD',
    duration: 'monthly',
    creditsGranted: 100,
    allowedModels: ['gemini-3.8-flash', 'gemini-3.1-flash-lite-image', 'gemini-3.8-flash-lite-tts'],
    maxVideoDurationSeconds: 5,
    maxDailyJobs: 15,
    active: true
  },
  {
    planId: 'plan_5days_sprint',
    name: '5-Day Fast Sprint',
    nameAr: 'باقة 5 أيام السريعة',
    description: 'إنتاج محتوى مكثف لمدة خمسة أيام متتالية للمتاجر والحملات الإعلانية',
    priceMinor: 999,
    currency: 'USD',
    duration: '5days',
    durationDays: 5,
    creditsGranted: 500,
    allowedModels: ['gemini-3.8-flash', 'gemini-3.1-flash-lite-image', 'gemini-3.8-flash-lite-tts', 'veo-3.1-lite-generate-preview'],
    maxVideoDurationSeconds: 15,
    maxDailyJobs: 50,
    active: true,
    badge: '5 أيام عمل',
    features: [
      '500 رصيد توليد متكامل',
      'صلاحية استخدام كاملة لمدة 5 أيام متتالية',
      'توليد مقاطع فيديو بدقة 1080p بمحرك Veo Lite',
      'توليد صور متقدمة وعالية الدقة',
      'ترخيص استخدام تجاري معتمد'
    ]
  },
  {
    planId: 'plan_weekly_flex',
    name: 'Weekly Flex Plan',
    nameAr: 'باقة أسبوعية مرنة',
    description: 'خطة أسبوعية مرنة لمديري الحملات وصناع المحتوى على وسائل التواصل',
    priceMinor: 1499,
    currency: 'USD',
    duration: 'weekly',
    durationDays: 7,
    creditsGranted: 800,
    allowedModels: ['gemini-3.8-flash', 'gemini-3.1-flash-lite-image', 'gemini-3.8-flash-lite-tts', 'veo-3.1-lite-generate-preview'],
    maxVideoDurationSeconds: 20,
    maxDailyJobs: 70,
    active: true,
    badge: 'أسبوعي اقتصادي',
    features: [
      '800 رصيد توليد أسبوعي متجدد',
      'صلاحية استخدام كاملة لمدة 7 أيام',
      'توليد فيديو عالي الدقة بمحرك Veo Lite',
      'نماذج صور وصوتيات غير محدودة',
      'أولوية معالجة سريعة وترخيص تجاري'
    ]
  },
  {
    planId: 'plan_creator',
    name: 'Content Creator',
    nameAr: 'صانع المحتوى',
    description: 'مثالي لصناع الشورتس والريلز وحملات التواصل الاجتماعي',
    priceMinor: 2900,
    currency: 'USD',
    duration: 'monthly',
    durationDays: 30,
    creditsGranted: 1200,
    allowedModels: ['gemini-3.8-flash', 'gemini-3.1-flash-lite-image', 'gemini-3.8-flash-lite-tts', 'veo-3.1-lite-generate-preview'],
    maxVideoDurationSeconds: 15,
    maxDailyJobs: 80,
    active: true
  },
  {
    planId: 'plan_pro',
    name: 'Pro Studio',
    nameAr: 'المحترف برو',
    description: 'للوكالات الإعلانية والمسوقين المحترفين وأصحاب الأعمال',
    priceMinor: 7900,
    currency: 'USD',
    duration: 'monthly',
    creditsGranted: 4000,
    allowedModels: ['gemini-3.8-flash', 'gemini-nano-banana-2.1', 'gemini-3.1-flash-lite-image', 'gemini-3.8-flash-lite-tts', 'veo-3.1-generate-preview', 'veo-3.1-lite-generate-preview'],
    maxVideoDurationSeconds: 30,
    maxDailyJobs: 250,
    active: true
  },
  {
    planId: 'plan_enterprise',
    name: 'Enterprise Studio',
    nameAr: 'الاستوديو التجاري',
    description: 'قدرات استثنائية للشركات والإنتاج التلفزيوني والإعلاني الضخم',
    priceMinor: 19900,
    currency: 'USD',
    duration: 'monthly',
    creditsGranted: 12000,
    allowedModels: ['gemini-3.8-flash', 'gemini-nano-banana-2.1', 'gemini-3.1-flash-lite-image', 'gemini-3.8-flash-lite-tts', 'veo-3.1-generate-preview', 'veo-3.1-lite-generate-preview'],
    maxVideoDurationSeconds: 60,
    maxDailyJobs: 1000,
    active: true
  }
];

const DEFAULT_PROVIDERS: ProviderConfig[] = [
  {
    providerId: 'provider_gemini',
    name: 'Google Gemini & Veo Official API',
    nameAr: 'جوجل جيميني وفيو الرسمي',
    enabled: true,
    type: 'google_gemini',
    secretConfigured: !!process.env.GEMINI_API_KEY,
    updatedAt: new Date().toISOString(),
    models: [
      {
        modelId: 'gemini-3.8-flash',
        name: 'Gemini 3.8 Flash (Script & Prompts)',
        task: 'text',
        creditCost: 1,
        enabled: true
      },
      {
        modelId: 'gemini-3.1-flash-lite-image',
        name: 'Gemini 3.1 Flash Lite Image',
        task: 'image',
        creditCost: 5,
        enabled: true
      },
      {
        modelId: 'gemini-nano-banana-2.1',
        name: 'Gemini Nano Banana 2.1 (Ultra 4K & Realism)',
        task: 'image',
        creditCost: 10,
        enabled: true
      },
      {
        modelId: 'gemini-3.8-flash-lite-tts',
        name: 'Gemini 3.8 Flash Lite TTS (Arabic & Multi-Language)',
        task: 'speech',
        creditCost: 4,
        enabled: true
      },
      {
        modelId: 'veo-3.1-lite-generate-preview',
        name: 'Google Veo 3.1 Lite (Cinematic Video Engine)',
        task: 'video',
        creditCost: 25,
        enabled: true
      },
      {
        modelId: 'veo-3.1-generate-preview',
        name: 'Google Veo 3.1 Flagship (Ultra HD Video Engine)',
        task: 'video',
        creditCost: 50,
        enabled: true
      }
    ]
  }
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        const loadedPlans: Plan[] = parsed.plans && parsed.plans.length > 0 ? parsed.plans : [...DEFAULT_PLANS];
        if (!loadedPlans.some(p => p.duration === '5days' || p.durationDays === 5)) {
          const sample5Days = DEFAULT_PLANS.find(p => p.planId === 'plan_5days_sprint');
          if (sample5Days) loadedPlans.splice(1, 0, sample5Days);
        }
        if (!loadedPlans.some(p => p.duration === 'weekly' || p.durationDays === 7)) {
          const sampleWeekly = DEFAULT_PLANS.find(p => p.planId === 'plan_weekly_flex');
          if (sampleWeekly) loadedPlans.splice(2, 0, sampleWeekly);
        }

        return {
          users: parsed.users || [],
          plans: loadedPlans,
          subscriptions: parsed.subscriptions || [],
          activationKeys: parsed.activationKeys || [],
          wallets: parsed.wallets || [],
          ledger: parsed.ledger || [],
          generationJobs: parsed.generationJobs || [],
          providers: parsed.providers && parsed.providers.length > 0 ? parsed.providers : DEFAULT_PROVIDERS,
          customerApiCredentials: parsed.customerApiCredentials || [],
          payments: parsed.payments || [],
          auditLogs: parsed.auditLogs || [],
          siteSettings: parsed.siteSettings ? { ...DEFAULT_SETTINGS, ...parsed.siteSettings } : DEFAULT_SETTINGS
        };
      } catch (err) {
        console.error('Error loading db.json, re-initializing defaults', err);
      }
    }

    const initial: DatabaseSchema = {
      users: [],
      plans: DEFAULT_PLANS,
      subscriptions: [],
      activationKeys: [],
      wallets: [],
      ledger: [],
      generationJobs: [],
      providers: DEFAULT_PROVIDERS,
      customerApiCredentials: [],
      payments: [],
      auditLogs: [],
      siteSettings: DEFAULT_SETTINGS
    };
    this.saveData(initial);
    return initial;
  }

  private saveData(dataToSave: DatabaseSchema) {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (e) {
      console.error('Failed to write db.json:', e);
    }
  }

  public save() {
    this.saveData(this.data);
  }

  // Getters & Updaters
  public get users() { return this.data.users; }
  public get plans() { return this.data.plans; }
  public get subscriptions() { return this.data.subscriptions; }
  public get activationKeys() { return this.data.activationKeys; }
  public get wallets() { return this.data.wallets; }
  public get ledger() { return this.data.ledger; }
  public get generationJobs() { return this.data.generationJobs; }
  public get providers() { return this.data.providers; }
  public get customerApiCredentials() { return this.data.customerApiCredentials; }
  public get payments() { return this.data.payments; }
  public get auditLogs() { return this.data.auditLogs; }
  public get siteSettings() { return this.data.siteSettings; }

  public setSiteSettings(newSettings: Partial<SiteSettings>) {
    this.data.siteSettings = { ...this.data.siteSettings, ...newSettings };
    this.save();
    return this.data.siteSettings;
  }
}

export const db = new Database();
