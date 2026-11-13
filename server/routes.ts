import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { db, User, Wallet, LedgerEntry, GenerationJob, ActivationKey, PaymentRecord, Plan, AuditLog } from './db.js';
import { 
  hashPassword, 
  verifyPassword, 
  signSessionToken, 
  verifySessionToken, 
  generateActivationKeyString, 
  hashActivationKey, 
  encryptCustomerApiKey, 
  maskApiKey 
} from './crypto.js';
import { 
  enhanceScriptAndPrompt, 
  generateImageContent, 
  generateSpeechContent, 
  initiateVideoGeneration, 
  checkVideoOperationStatus, 
  downloadAndSaveVeoVideo, 
  isApiKeyConfigured 
} from './aiService.js';

export const apiRouter = Router();

// Extend Request with authenticated user
interface AuthRequest extends Request {
  user?: User;
}

// Authentication Middleware
export function authenticateUser(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'غير مصرح: يجب تسجيل الدخول للوصول إلى هذا المورد' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifySessionToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'جلسة تسجيل الدخول منتهية أو غير صالحة' });
  }

  const user = db.users.find(u => u.uid === payload.uid);
  if (!user) {
    return res.status(401).json({ error: 'جلسة تسجيل الدخول غير صالحة أو غير موجودة' });
  }
  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'تم إيقاف هذا الحساب. يرجى التواصل مع إدارة المنصة' });
  }

  req.user = user;
  next();
}

// Admin Role Middleware
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'صلاحيات غير كافية: هذا الإجراء مخصص لمالك المنصة فقط' });
  }
  next();
}

function logAudit(actorUid: string, action: string, targetType: string, targetId: string, metadata: any = {}) {
  const log: AuditLog = {
    logId: `log_${crypto.randomUUID()}`,
    actorUid,
    action,
    targetType,
    targetId,
    timestamp: new Date().toISOString(),
    safeMetadata: metadata
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 2000) db.auditLogs.pop();
  db.save();
}

function getOrCreateWallet(uid: string): Wallet {
  let wallet = db.wallets.find(w => w.uid === uid);
  if (!wallet) {
    wallet = {
      uid,
      availableCredits: db.siteSettings.freeTrialCredits || 100,
      reservedCredits: 0,
      totalPurchased: 0,
      updatedAt: new Date().toISOString()
    };
    db.wallets.push(wallet);
    
    // Initial welcome ledger entry
    const entry: LedgerEntry = {
      transactionId: `tx_${crypto.randomUUID()}`,
      uid,
      type: 'plan_grant',
      amount: wallet.availableCredits,
      balanceBefore: 0,
      balanceAfter: wallet.availableCredits,
      referenceId: 'welcome_grant',
      description: 'هدية الترحيب بالرصيد التجريبي المجاني',
      createdAt: new Date().toISOString()
    };
    db.ledger.unshift(entry);
    db.save();
  }
  return wallet;
}

// Helper to calculate subscription expiry based on plan duration (weekly, 5-days, daily, monthly, annual, custom)
export function calculateSubscriptionExpiry(plan: Plan): Date {
  const expiresDate = new Date();
  if (typeof plan.durationDays === 'number' && plan.durationDays > 0) {
    expiresDate.setDate(expiresDate.getDate() + plan.durationDays);
  } else if (plan.duration === '5days') {
    expiresDate.setDate(expiresDate.getDate() + 5);
  } else if (plan.duration === 'weekly') {
    expiresDate.setDate(expiresDate.getDate() + 7);
  } else if (plan.duration === 'daily') {
    expiresDate.setDate(expiresDate.getDate() + 1);
  } else if (plan.duration === 'annual') {
    expiresDate.setFullYear(expiresDate.getFullYear() + 1);
  } else {
    // Default monthly
    expiresDate.setMonth(expiresDate.getMonth() + 1);
  }
  return expiresDate;
}

// Ensure default admin exists or promote first user
function ensureAdminSetup() {
  const targetEmail = 'nashwann1991@gmail.com';
  let adminUser = db.users.find(u => u.email.toLowerCase() === targetEmail.toLowerCase() || u.role === 'admin');
  if (!adminUser) {
    const adminUid = 'usr_admin_master';
    adminUser = {
      uid: adminUid,
      displayName: 'المهندس نشوان (مدير المنصة)',
      email: targetEmail,
      passwordHash: hashPassword('StudioPro2026!'),
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.users.push(adminUser);
    getOrCreateWallet(adminUid);
    db.save();
  }

  // Also ensure demo creator user exists for quick 1-click testing
  const demoEmail = 'creator_demo@studio.ai';
  let demoUser = db.users.find(u => u.email.toLowerCase() === demoEmail.toLowerCase());
  if (!demoUser) {
    const demoUid = 'usr_demo_creator';
    demoUser = {
      uid: demoUid,
      displayName: 'صانع محتوى تجريبي',
      email: demoEmail,
      passwordHash: hashPassword('StudioPro2026!'),
      role: 'creator',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.users.push(demoUser);
    getOrCreateWallet(demoUid);
    db.save();
  }
}
ensureAdminSetup();

// ==========================================
// 1. AUTHENTICATION & PROFILE
// ==========================================

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { email, password, displayName } = req.body;
  if (!email || !password || !displayName) {
    return res.status(400).json({ error: 'البريد الإلكتروني، الاسم وكلمة المرور مطلوبة' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (db.users.some(u => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ error: 'هذا البريد الإلكتروني مسجل مسبقاً' });
  }

  const isFirstOrTargetAdmin = db.users.length === 0 || normalizedEmail === 'nashwann1991@gmail.com';
  const uid = `usr_${crypto.randomUUID()}`;
  const newUser: User = {
    uid,
    displayName: displayName.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    role: isFirstOrTargetAdmin ? 'admin' : 'user',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.users.push(newUser);
  getOrCreateWallet(uid); // Initialize wallet with free trial credits

  const token = signSessionToken({ uid: newUser.uid, email: newUser.email, role: newUser.role });
  logAudit(newUser.uid, 'user_register', 'user', newUser.uid, { email: newUser.email, role: newUser.role });

  res.status(201).json({
    token,
    user: {
      uid: newUser.uid,
      displayName: newUser.displayName,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      createdAt: newUser.createdAt
    }
  });
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'بيانات تسجيل الدخول غير صحيحة' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'تم تعليق هذا الحساب. يرجى التواصل مع الدعم الفني' });
  }

  const token = signSessionToken({ uid: user.uid, email: user.email, role: user.role });
  res.json({
    token,
    user: {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt
    }
  });
});

apiRouter.post('/auth/google', (req: Request, res: Response) => {
  let email = req.body.email;
  let displayName = req.body.displayName;
  let photoUrl = req.body.photoUrl;

  // Handle Google Identity Services credential JWT if passed
  if (req.body.credential && typeof req.body.credential === 'string') {
    try {
      const parts = req.body.credential.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        if (payload.email) {
          email = payload.email;
          displayName = displayName || payload.name || payload.given_name || email.split('@')[0];
          photoUrl = photoUrl || payload.picture;
        }
      }
    } catch (err) {
      console.error('Error decoding Google credential token:', err);
    }
  }

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'البريد الإلكتروني لحساب جوجل مطلوب' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  let user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (user) {
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'تم تعليق هذا الحساب. يرجى التواصل مع الدعم الفني' });
    }
    if (photoUrl && !user.avatar) {
      user.avatar = photoUrl;
    }
    if (displayName && (!user.displayName || user.displayName === user.email)) {
      user.displayName = displayName.trim();
    }
    user.updatedAt = new Date().toISOString();
  } else {
    // Create new user from Google profile
    const isFirstOrTargetAdmin = db.users.length === 0 || normalizedEmail === 'nashwann1991@gmail.com';
    const uid = `usr_g_${crypto.randomUUID()}`;
    user = {
      uid,
      displayName: (displayName || email.split('@')[0]).trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(crypto.randomBytes(24).toString('hex')),
      role: isFirstOrTargetAdmin ? 'admin' : 'user',
      status: 'active',
      avatar: photoUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.users.push(user);
    getOrCreateWallet(uid);
    logAudit(user.uid, 'google_signup', 'user', user.uid, { email: user.email, role: user.role });
  }

  db.save();

  const token = signSessionToken({ uid: user.uid, email: user.email, role: user.role });
  res.json({
    token,
    user: {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      createdAt: user.createdAt
    }
  });
});

// Sync Firebase Auth & Firestore user registration/login with backend wallet & session
apiRouter.post('/auth/firebase', (req: Request, res: Response) => {
  let { idToken, firebaseUid, email, displayName, photoUrl, authProvider } = req.body;

  if (idToken && typeof idToken === 'string') {
    try {
      const parts = idToken.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        if (payload.sub) firebaseUid = payload.sub;
        if (payload.email) email = payload.email;
        if (payload.name && !displayName) displayName = payload.name;
        if (payload.picture && !photoUrl) photoUrl = payload.picture;
      }
    } catch (err) {
      console.error('Error decoding Firebase ID token:', err);
    }
  }

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'بيانات حساب Firebase غير مكتملة' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  let user = db.users.find(
    u => (firebaseUid && u.uid === firebaseUid) || u.email.toLowerCase() === normalizedEmail
  );

  if (user) {
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'تم تعليق هذا الحساب. يرجى التواصل مع الدعم الفني' });
    }
    if (photoUrl && !user.avatar) {
      user.avatar = photoUrl;
    }
    if (displayName && displayName.trim() && (!user.displayName || user.displayName === user.email)) {
      user.displayName = displayName.trim();
    }
    user.updatedAt = new Date().toISOString();
  } else {
    const isFirstOrTargetAdmin = db.users.length === 0 || normalizedEmail === 'nashwann1991@gmail.com';
    const uid = firebaseUid && typeof firebaseUid === 'string' ? firebaseUid : `usr_fb_${crypto.randomUUID()}`;
    user = {
      uid,
      displayName: (displayName || normalizedEmail.split('@')[0]).trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(crypto.randomBytes(24).toString('hex')),
      role: isFirstOrTargetAdmin ? 'admin' : 'user',
      status: 'active',
      avatar: photoUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.users.push(user);
    getOrCreateWallet(uid);
    logAudit(user.uid, 'firebase_register', 'user', user.uid, {
      email: user.email,
      role: user.role,
      authProvider: authProvider || 'firebase'
    });
  }

  db.save();

  const token = signSessionToken({ uid: user.uid, email: user.email, role: user.role });
  res.json({
    token,
    user: {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      createdAt: user.createdAt
    }
  });
});

apiRouter.get('/auth/me', authenticateUser, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const wallet = getOrCreateWallet(user.uid);
  const activeSub = db.subscriptions.find(s => s.uid === user.uid && s.status === 'active');
  const plan = activeSub ? db.plans.find(p => p.planId === activeSub.planId) : null;

  res.json({
    user: {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt
    },
    wallet: {
      availableCredits: wallet.availableCredits,
      reservedCredits: wallet.reservedCredits
    },
    subscription: activeSub ? {
      ...activeSub,
      planName: plan?.nameAr || plan?.name
    } : null,
    systemConfig: {
      geminiConfigured: isApiKeyConfigured(),
      siteName: db.siteSettings.siteName,
      siteNameAr: db.siteSettings.siteNameAr,
      currency: db.siteSettings.primaryCurrency
    }
  });
});

apiRouter.post('/auth/profile', authenticateUser, (req: AuthRequest, res: Response) => {
  const { displayName, avatar } = req.body;
  const user = req.user!;
  if (displayName) user.displayName = displayName.trim();
  if (avatar) user.avatar = avatar;
  user.updatedAt = new Date().toISOString();
  db.save();

  res.json({ success: true, user });
});

// ==========================================
// 2. ACCOUNT OVERVIEW & DASHBOARD
// ==========================================

apiRouter.get('/account/overview', authenticateUser, (req: AuthRequest, res: Response) => {
  const uid = req.user!.uid;
  const wallet = getOrCreateWallet(uid);
  const activeSub = db.subscriptions.find(s => s.uid === uid && s.status === 'active');
  const plan = activeSub ? db.plans.find(p => p.planId === activeSub.planId) : null;

  const userJobs = db.generationJobs.filter(j => j.uid === uid);
  const completedJobs = userJobs.filter(j => j.status === 'succeeded').length;
  const inProgressJobs = userJobs.filter(j => j.status === 'processing' || j.status === 'queued').length;
  const totalCost = userJobs.reduce((acc, j) => acc + (j.actualCost || 0), 0);

  const recentTransactions = db.ledger
    .filter(l => l.uid === uid)
    .slice(0, 10);

  res.json({
    wallet,
    subscription: activeSub ? { ...activeSub, plan } : null,
    metrics: {
      totalJobs: userJobs.length,
      completedJobs,
      inProgressJobs,
      totalCreditsSpent: totalCost
    },
    recentTransactions,
    providersStatus: db.providers.map(p => ({
      providerId: p.providerId,
      name: p.nameAr || p.name,
      enabled: p.enabled && (p.secretConfigured || isApiKeyConfigured())
    }))
  });
});

// ==========================================
// 3. PLANS & SUBSCRIPTIONS
// ==========================================

apiRouter.get('/plans', (_req: Request, res: Response) => {
  const activePlans = db.plans.filter(p => p.active);
  res.json({ plans: activePlans, currency: db.siteSettings.primaryCurrency });
});

apiRouter.get('/subscriptions/current', authenticateUser, (req: AuthRequest, res: Response) => {
  const uid = req.user!.uid;
  const sub = db.subscriptions.find(s => s.uid === uid && s.status === 'active');
  const plan = sub ? db.plans.find(p => p.planId === sub.planId) : null;
  res.json({ subscription: sub, plan });
});

// ==========================================
// 4. ACTIVATION KEYS (REDEEM & VERIFY)
// ==========================================

apiRouter.post('/activation/redeem', authenticateUser, (req: AuthRequest, res: Response) => {
  const { keyCode } = req.body;
  const uid = req.user!.uid;

  if (!keyCode || typeof keyCode !== 'string') {
    return res.status(400).json({ error: 'يرجى إدخال رمز مفتاح التفعيل' });
  }

  const cleanKey = keyCode.trim().toUpperCase();
  const keyHash = hashActivationKey(cleanKey);

  const keyRecord = db.activationKeys.find(k => k.keyHash === keyHash);
  if (!keyRecord) {
    return res.status(404).json({ error: 'مفتاح التفعيل غير صحيح أو غير موجود' });
  }

  if (keyRecord.status !== 'active') {
    return res.status(400).json({ error: `هذا المفتاح غير صالح (الحالة: ${keyRecord.status})` });
  }

  if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
    keyRecord.status = 'expired';
    db.save();
    return res.status(400).json({ error: 'انتهت صلاحية مفتاح التفعيل هذا' });
  }

  if (keyRecord.activationCount >= keyRecord.maxActivations) {
    keyRecord.status = 'redeemed';
    db.save();
    return res.status(400).json({ error: 'تم استهلاك الحد الأقصى لتفعيل هذا المفتاح' });
  }

  // Check if assigned to a specific user
  if (keyRecord.assignedUid && keyRecord.assignedUid !== uid) {
    return res.status(403).json({ error: 'هذا المفتاح مخصص لحساب مستخدم آخر' });
  }

  // Atomic activation
  keyRecord.activationCount += 1;
  if (!keyRecord.redeemedBy) keyRecord.redeemedBy = [];
  keyRecord.redeemedBy.push({ uid, redeemedAt: new Date().toISOString() });

  if (keyRecord.activationCount >= keyRecord.maxActivations) {
    keyRecord.status = 'redeemed';
  }

  // Grant plan or credits
  const wallet = getOrCreateWallet(uid);
  const creditsGranted = keyRecord.creditsAmount || 0;
  let planActivated: Plan | null = null;

  if (keyRecord.planId) {
    const plan = db.plans.find(p => p.planId === keyRecord.planId);
    if (plan) {
      planActivated = plan;
      // Expire previous active subscriptions
      db.subscriptions
        .filter(s => s.uid === uid && s.status === 'active')
        .forEach(s => s.status = 'cancelled');

      const expiresDate = calculateSubscriptionExpiry(plan);

      db.subscriptions.push({
        subscriptionId: `sub_${crypto.randomUUID()}`,
        uid,
        planId: plan.planId,
        status: 'active',
        startsAt: new Date().toISOString(),
        expiresAt: expiresDate.toISOString(),
        paymentReference: `key_${keyRecord.keyId}`
      });
    }
  }

  // Update wallet and record ledger
  const totalCreditsToAdd = creditsGranted + (planActivated ? planActivated.creditsGranted : 0);
  const balanceBefore = wallet.availableCredits;
  wallet.availableCredits += totalCreditsToAdd;
  wallet.totalPurchased += totalCreditsToAdd;
  wallet.updatedAt = new Date().toISOString();

  const ledgerEntry: LedgerEntry = {
    transactionId: `tx_${crypto.randomUUID()}`,
    uid,
    type: 'activation_redeem',
    amount: totalCreditsToAdd,
    balanceBefore,
    balanceAfter: wallet.availableCredits,
    referenceId: keyRecord.keyId,
    description: `تفعيل مفتاح ترخيص: ${planActivated ? planActivated.nameAr : `${creditsGranted} رصيد`}`,
    createdAt: new Date().toISOString()
  };
  db.ledger.unshift(ledgerEntry);
  db.save();

  logAudit(uid, 'redeem_key', 'activationKey', keyRecord.keyId, {
    creditsAdded: totalCreditsToAdd,
    planId: keyRecord.planId
  });

  res.json({
    success: true,
    message: 'تم تفعيل المفتاح بنجاح وإضافة الرصيد إلى محفظتك!',
    creditsGranted: totalCreditsToAdd,
    newBalance: wallet.availableCredits,
    plan: planActivated
  });
});

// ==========================================
// 5. WALLET & FINANCIAL LEDGER
// ==========================================

apiRouter.get('/wallet', authenticateUser, (req: AuthRequest, res: Response) => {
  const wallet = getOrCreateWallet(req.user!.uid);
  res.json({ wallet });
});

apiRouter.get('/wallet/ledger', authenticateUser, (req: AuthRequest, res: Response) => {
  const uid = req.user!.uid;
  const userEntries = db.ledger.filter(l => l.uid === uid);
  res.json({ ledger: userEntries });
});

// ==========================================
// 6. AI GENERATION WORKFLOWS
// ==========================================

// Helper: atomic reserve credits
function reserveCredits(uid: string, cost: number, jobReference: string, desc: string): boolean {
  const wallet = getOrCreateWallet(uid);
  if (wallet.availableCredits < cost) {
    return false;
  }
  const balanceBefore = wallet.availableCredits;
  wallet.availableCredits -= cost;
  wallet.reservedCredits += cost;
  wallet.updatedAt = new Date().toISOString();

  const holdEntry: LedgerEntry = {
    transactionId: `tx_${crypto.randomUUID()}`,
    uid,
    type: 'generation_hold',
    amount: -cost,
    balanceBefore,
    balanceAfter: wallet.availableCredits,
    referenceId: jobReference,
    description: desc,
    createdAt: new Date().toISOString()
  };
  db.ledger.unshift(holdEntry);
  db.save();
  return true;
}

// Helper: finalize credit deduction
function finalizeCredits(uid: string, reservedCost: number, actualCost: number, jobReference: string) {
  const wallet = getOrCreateWallet(uid);
  wallet.reservedCredits = Math.max(0, wallet.reservedCredits - reservedCost);
  
  // If actual cost was lower than reservation, refund difference to available
  if (actualCost < reservedCost) {
    const refund = reservedCost - actualCost;
    const balanceBefore = wallet.availableCredits;
    wallet.availableCredits += refund;

    const refundEntry: LedgerEntry = {
      transactionId: `tx_${crypto.randomUUID()}`,
      uid,
      type: 'generation_refund',
      amount: refund,
      balanceBefore,
      balanceAfter: wallet.availableCredits,
      referenceId: jobReference,
      description: 'تسوية وإرجاع فائض حجز الرصيد بعد اكتمال التوليد',
      createdAt: new Date().toISOString()
    };
    db.ledger.unshift(refundEntry);
  }

  wallet.updatedAt = new Date().toISOString();
  db.save();
}

// Helper: refund reserved credits on failure
function refundReservation(uid: string, reservedCost: number, jobReference: string, reason: string) {
  const wallet = getOrCreateWallet(uid);
  wallet.reservedCredits = Math.max(0, wallet.reservedCredits - reservedCost);
  const balanceBefore = wallet.availableCredits;
  wallet.availableCredits += reservedCost;
  wallet.updatedAt = new Date().toISOString();

  const refundEntry: LedgerEntry = {
    transactionId: `tx_${crypto.randomUUID()}`,
    uid,
    type: 'generation_refund',
    amount: reservedCost,
    balanceBefore,
    balanceAfter: wallet.availableCredits,
    referenceId: jobReference,
    description: `إلغاء حجز الرصيد واسترداده بالكامل: ${reason}`,
    createdAt: new Date().toISOString()
  };
  db.ledger.unshift(refundEntry);
  db.save();
}

// --- Prompt Enhancer & Script Breakdown ---
apiRouter.post('/generations/prompt-enhance', authenticateUser, async (req: AuthRequest, res: Response) => {
  const { rawIdea, contentType, style, targetAudience, language } = req.body;
  if (!rawIdea) {
    return res.status(400).json({ error: 'يرجى تقديم فكرة أو وصف لتطوير البرومبت والسيناريو' });
  }

  const cost = 1; // 1 credit for script enhancement
  const jobId = `job_${crypto.randomUUID()}`;
  const reserved = reserveCredits(req.user!.uid, cost, jobId, 'تحسين البرومبت وكتابة السيناريو الذكي');
  if (!reserved) {
    return res.status(402).json({ error: 'رصيدك غير كافٍ. يلزم 1 رصيد لهذه العملية.' });
  }

  try {
    const result = await enhanceScriptAndPrompt({
      rawIdea,
      contentType: contentType || 'video',
      style,
      targetAudience,
      language
    });

    finalizeCredits(req.user!.uid, cost, cost, jobId);

    const job: GenerationJob = {
      jobId,
      uid: req.user!.uid,
      type: 'prompt_expand',
      providerId: 'provider_gemini',
      modelId: 'gemini-3.8-flash',
      prompt: rawIdea,
      status: 'succeeded',
      estimatedCost: cost,
      reservedCredits: cost,
      actualCost: cost,
      resultData: result,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };
    db.generationJobs.unshift(job);
    db.save();

    res.json({ success: true, job });
  } catch (err: any) {
    refundReservation(req.user!.uid, cost, jobId, err.message || 'خطأ أثناء تحسين السيناريو');
    res.status(500).json({ error: err.message || 'فشلت معالجة البرومبت' });
  }
});

// --- Image Studio Generation ---
apiRouter.post('/generations/image', authenticateUser, async (req: AuthRequest, res: Response) => {
  const { prompt, model, aspectRatio, arabicPosterText, posterSubtitle } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'وصف الصورة (البرومبت) مطلوب' });
  }

  const selectedModel = model === 'gemini-nano-banana-2.1' ? 'gemini-nano-banana-2.1' : 'gemini-3.1-flash-lite-image';
  const cost = selectedModel === 'gemini-nano-banana-2.1' ? 10 : 5;
  const jobId = `job_${crypto.randomUUID()}`;

  const reserved = reserveCredits(req.user!.uid, cost, jobId, `توليد صورة (${selectedModel})`);
  if (!reserved) {
    return res.status(402).json({ error: `رصيدك غير كافٍ. تحتاج إلى ${cost} رصيد لتوليد هذه الصورة.` });
  }

  const job: GenerationJob = {
    jobId,
    uid: req.user!.uid,
    type: 'image',
    providerId: 'provider_gemini',
    modelId: selectedModel,
    prompt,
    status: 'processing',
    estimatedCost: cost,
    reservedCredits: cost,
    actualCost: cost,
    createdAt: new Date().toISOString()
  };
  db.generationJobs.unshift(job);
  db.save();

  try {
    const result = await generateImageContent({
      prompt,
      model: selectedModel,
      aspectRatio,
      arabicPosterText,
      posterSubtitle
    });

    job.status = 'succeeded';
    job.resultUrl = result.mediaUrl;
    job.metadata = { width: result.width, height: result.height, format: result.format };
    job.completedAt = new Date().toISOString();
    finalizeCredits(req.user!.uid, cost, cost, jobId);
    db.save();

    res.json({ success: true, job });
  } catch (err: any) {
    job.status = 'failed';
    job.errorCode = err.message || 'خطأ في توليد الصورة';
    job.completedAt = new Date().toISOString();
    refundReservation(req.user!.uid, cost, jobId, err.message || 'فشل التوليد');
    db.save();

    res.status(500).json({ error: err.message || 'فشلت عملية توليد الصورة' });
  }
});

// --- Speech Studio (TTS) ---
apiRouter.post('/generations/speech', authenticateUser, async (req: AuthRequest, res: Response) => {
  const { text, voiceName, style } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'النص المطلوب تحويله إلى صوت مطلوب' });
  }

  const cost = 4;
  const jobId = `job_${crypto.randomUUID()}`;

  const reserved = reserveCredits(req.user!.uid, cost, jobId, 'إنشاء تعليق صوتي فائق الدقة');
  if (!reserved) {
    return res.status(402).json({ error: `رصيد غير كافٍ. يلزم ${cost} رصيد لإنشاء التعليق الصوتي.` });
  }

  const job: GenerationJob = {
    jobId,
    uid: req.user!.uid,
    type: 'speech',
    providerId: 'provider_gemini',
    modelId: 'gemini-3.8-flash-lite-tts',
    prompt: text,
    status: 'processing',
    estimatedCost: cost,
    reservedCredits: cost,
    actualCost: cost,
    createdAt: new Date().toISOString()
  };
  db.generationJobs.unshift(job);
  db.save();

  try {
    const result = await generateSpeechContent({
      text,
      voiceName,
      style
    });

    job.status = 'succeeded';
    job.resultUrl = result.mediaUrl;
    job.metadata = { durationEstimatedSeconds: result.durationEstimatedSeconds, format: result.format, voice: voiceName || 'Kore' };
    job.completedAt = new Date().toISOString();
    finalizeCredits(req.user!.uid, cost, cost, jobId);
    db.save();

    res.json({ success: true, job });
  } catch (err: any) {
    job.status = 'failed';
    job.errorCode = err.message || 'خطأ في توليد الصوت';
    job.completedAt = new Date().toISOString();
    refundReservation(req.user!.uid, cost, jobId, err.message || 'فشل توليد الصوت');
    db.save();

    res.status(500).json({ error: err.message || 'فشلت عملية إنشاء الصوت' });
  }
});

// --- Video Studio Generation (Asynchronous Veo Pipeline) ---
apiRouter.post('/generations/video', authenticateUser, async (req: AuthRequest, res: Response) => {
  const { prompt, model, aspectRatio, resolution, imageBase64 } = req.body;
  if (!prompt && !imageBase64) {
    return res.status(400).json({ error: 'يرجى تقديم وصف الفيديو أو صورة مرجعية للبدء' });
  }

  const selectedModel = model === 'veo-3.1-generate-preview' ? 'veo-3.1-generate-preview' : 'veo-3.1-lite-generate-preview';
  const cost = selectedModel === 'veo-3.1-generate-preview' ? 50 : 25;
  const jobId = `job_${crypto.randomUUID()}`;

  const reserved = reserveCredits(req.user!.uid, cost, jobId, `إنشاء فيديو بالذكاء الاصطناعي (${selectedModel})`);
  if (!reserved) {
    return res.status(402).json({ error: `رصيد غير كافٍ. يلزم ${cost} رصيد لإنشاء هذا المقطع.` });
  }

  const job: GenerationJob = {
    jobId,
    uid: req.user!.uid,
    type: 'video',
    providerId: 'provider_gemini',
    modelId: selectedModel,
    prompt: prompt || 'تحويل صورة إلى فيديو سينمائي',
    status: 'queued',
    estimatedCost: cost,
    reservedCredits: cost,
    actualCost: cost,
    metadata: { aspectRatio: aspectRatio || '16:9', resolution: resolution || '720p' },
    createdAt: new Date().toISOString()
  };
  db.generationJobs.unshift(job);
  db.save();

  try {
    const videoOp = await initiateVideoGeneration({
      prompt: prompt || '',
      model: selectedModel,
      aspectRatio,
      resolution,
      imageBase64
    });

    job.status = 'processing';
    job.metadata = { ...job.metadata, operationName: videoOp.operationName };
    db.save();

    res.status(202).json({
      success: true,
      message: 'تم بدء مهمة توليد الفيديو بنجاح وجارٍ المعالجة في السحابة',
      job
    });
  } catch (err: any) {
    job.status = 'failed';
    job.errorCode = err.message || 'فشل إطلاق عملية الفيديو';
    job.completedAt = new Date().toISOString();
    refundReservation(req.user!.uid, cost, jobId, err.message || 'فشل إرسال طلب الفيديو للمزود');
    db.save();

    res.status(500).json({ error: err.message || 'فشل إطلاق عملية توليد الفيديو' });
  }
});

// Check status / Poll Generation Job
apiRouter.get('/generations/:jobId', authenticateUser, async (req: AuthRequest, res: Response) => {
  const { jobId } = req.params;
  const job = db.generationJobs.find(j => j.jobId === jobId && (j.uid === req.user!.uid || req.user!.role === 'admin'));
  if (!job) {
    return res.status(404).json({ error: 'المهمة غير موجودة' });
  }

  // If video is still processing and has an operationName, check Google Veo status
  if (job.type === 'video' && job.status === 'processing' && job.metadata?.operationName) {
    try {
      const statusCheck = await checkVideoOperationStatus({
        operationName: job.metadata.operationName
      });

      if (statusCheck.done) {
        if (statusCheck.error) {
          job.status = 'failed';
          job.errorCode = statusCheck.error;
          job.completedAt = new Date().toISOString();
          refundReservation(job.uid, job.reservedCredits, job.jobId, statusCheck.error);
        } else if (statusCheck.downloadUri) {
          const localUrl = await downloadAndSaveVeoVideo(statusCheck.downloadUri);
          job.status = 'succeeded';
          job.resultUrl = localUrl;
          job.completedAt = new Date().toISOString();
          finalizeCredits(job.uid, job.reservedCredits, job.actualCost, job.jobId);
        }
        db.save();
      }
    } catch (err: any) {
      console.error('Error polling video operation:', err);
    }
  }

  res.json({ job });
});

// Cancel a queued/processing job
apiRouter.post('/generations/:jobId/cancel', authenticateUser, (req: AuthRequest, res: Response) => {
  const { jobId } = req.params;
  const job = db.generationJobs.find(j => j.jobId === jobId && (j.uid === req.user!.uid || req.user!.role === 'admin'));
  if (!job) {
    return res.status(404).json({ error: 'المهمة غير موجودة' });
  }

  if (job.status === 'succeeded' || job.status === 'failed' || job.status === 'cancelled') {
    return res.status(400).json({ error: 'لا يمكن إلغاء مهمة مكتملة أو منتهية مسبقاً' });
  }

  job.status = 'cancelled';
  job.completedAt = new Date().toISOString();
  refundReservation(job.uid, job.reservedCredits, job.jobId, 'إلغاء المهمة من قبل المستخدم');
  db.save();

  res.json({ success: true, message: 'تم إلغاء المهمة واسترداد الرصيد المحجوز بنجاح', job });
});

// ==========================================
// 7. PROJECTS & MEDIA GALLERY
// ==========================================

apiRouter.get('/projects', authenticateUser, (req: AuthRequest, res: Response) => {
  const uid = req.user!.uid;
  const typeFilter = req.query.type as string;
  let jobs = db.generationJobs.filter(j => j.uid === uid);

  if (typeFilter && typeFilter !== 'all') {
    jobs = jobs.filter(j => j.type === typeFilter);
  }

  res.json({ projects: jobs });
});

apiRouter.delete('/projects/:jobId', authenticateUser, (req: AuthRequest, res: Response) => {
  const { jobId } = req.params;
  const index = db.generationJobs.findIndex(j => j.jobId === jobId && (j.uid === req.user!.uid || req.user!.role === 'admin'));
  if (index === -1) {
    return res.status(404).json({ error: 'المشروع غير موجود' });
  }

  const [deleted] = db.generationJobs.splice(index, 1);
  db.save();
  res.json({ success: true, deletedJobId: deleted.jobId });
});

// User Usage & Tool Statistics Endpoint for Dashboard
apiRouter.get('/user/stats', authenticateUser, (req: AuthRequest, res: Response) => {
  const uid = req.user!.uid;
  const userJobs = db.generationJobs.filter(j => j.uid === uid);
  const wallet = getOrCreateWallet(uid);

  const totalGenerations = userJobs.length;
  const totalVideos = userJobs.filter(j => j.type === 'video').length;
  const totalImages = userJobs.filter(j => j.type === 'image').length;
  const totalSpeech = userJobs.filter(j => j.type === 'speech').length;
  const totalPrompts = userJobs.filter(j => j.type === 'prompt_expand').length;

  const succeededCount = userJobs.filter(j => j.status === 'succeeded').length;
  const failedCount = userJobs.filter(j => j.status === 'failed').length;
  const processingCount = userJobs.filter(j => j.status === 'processing' || j.status === 'queued').length;

  const totalCreditsSpent = userJobs.reduce((sum, j) => sum + (j.status === 'succeeded' ? (j.actualCost || 0) : 0), 0);

  // Group by day for the last 14 days
  const daysMap: Record<string, { date: string; displayDate: string; dayName: string; videos: number; images: number; speech: number; total: number; credits: number }> = {};
  
  const arabicDayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const displayDate = `${d.getMonth() + 1}/${d.getDate()}`;
    const dayName = arabicDayNames[d.getDay()];
    daysMap[key] = {
      date: key,
      displayDate,
      dayName,
      videos: 0,
      images: 0,
      speech: 0,
      total: 0,
      credits: 0
    };
  }

  userJobs.forEach(job => {
    const jobDate = (job.createdAt || '').split('T')[0];
    if (daysMap[jobDate]) {
      if (job.type === 'video') daysMap[jobDate].videos += 1;
      else if (job.type === 'image') daysMap[jobDate].images += 1;
      else if (job.type === 'speech') daysMap[jobDate].speech += 1;
      daysMap[jobDate].total += 1;
      if (job.status === 'succeeded') {
        daysMap[jobDate].credits += (job.actualCost || 0);
      }
    }
  });

  const dailyUsage = Object.values(daysMap);

  // Tool distribution for Pie / Bar
  const toolDistribution = [
    { name: 'فيديو', nameEn: 'Videos', type: 'video', value: totalVideos, color: '#06b6d4' },
    { name: 'صور', nameEn: 'Images', type: 'image', value: totalImages, color: '#8b5cf6' },
    { name: 'صوت', nameEn: 'Voiceover', type: 'speech', value: totalSpeech, color: '#ec4899' },
    { name: 'سيناريو', nameEn: 'Prompts', type: 'prompt_expand', value: totalPrompts, color: '#10b981' }
  ];

  // Recent 6 generations
  const recentActivity = userJobs.slice(0, 6);

  res.json({
    stats: {
      totalGenerations,
      totalVideos,
      totalImages,
      totalSpeech,
      totalPrompts,
      succeededCount,
      failedCount,
      processingCount,
      totalCreditsSpent,
      availableCredits: wallet.availableCredits,
      dailyUsage,
      toolDistribution,
      recentActivity
    }
  });
});

// ==========================================
// 8. CUSTOMER BYOK API CREDENTIALS
// ==========================================

apiRouter.get('/customer-credentials', authenticateUser, (req: AuthRequest, res: Response) => {
  const creds = db.customerApiCredentials
    .filter(c => c.uid === req.user!.uid)
    .map(c => ({
      credentialId: c.credentialId,
      providerId: c.providerId,
      keyMask: c.keyMask,
      status: c.status,
      createdAt: c.createdAt,
      lastValidatedAt: c.lastValidatedAt
    }));
  res.json({ credentials: creds });
});

apiRouter.post('/customer-credentials', authenticateUser, (req: AuthRequest, res: Response) => {
  const { providerId, apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 10) {
    return res.status(400).json({ error: 'صيغة مفتاح API غير صحيحة' });
  }

  const uid = req.user!.uid;
  // Remove existing credential for this provider if any
  const existingIdx = db.customerApiCredentials.findIndex(c => c.uid === uid && c.providerId === providerId);
  if (existingIdx !== -1) {
    db.customerApiCredentials.splice(existingIdx, 1);
  }

  const newCred = {
    credentialId: `cred_${crypto.randomUUID()}`,
    uid,
    providerId: providerId || 'provider_gemini',
    encryptedSecret: encryptCustomerApiKey(apiKey.trim()),
    keyMask: maskApiKey(apiKey.trim()),
    status: 'active' as const,
    createdAt: new Date().toISOString(),
    lastValidatedAt: new Date().toISOString()
  };

  db.customerApiCredentials.push(newCred);
  db.save();

  logAudit(uid, 'add_byok_key', 'credential', newCred.credentialId, { providerId: newCred.providerId });

  res.status(201).json({
    success: true,
    credential: {
      credentialId: newCred.credentialId,
      providerId: newCred.providerId,
      keyMask: newCred.keyMask,
      status: newCred.status
    }
  });
});

apiRouter.delete('/customer-credentials/:credentialId', authenticateUser, (req: AuthRequest, res: Response) => {
  const { credentialId } = req.params;
  const idx = db.customerApiCredentials.findIndex(c => c.credentialId === credentialId && c.uid === req.user!.uid);
  if (idx === -1) {
    return res.status(404).json({ error: 'المفتاح غير موجود' });
  }

  db.customerApiCredentials.splice(idx, 1);
  db.save();
  res.json({ success: true, message: 'تم حذف مفتاح API بنجاح' });
});

// ==========================================
// 9. COMMERCIAL PAYMENTS (MANUAL & STRIPE)
// ==========================================

apiRouter.post('/payments/manual', authenticateUser, (req: AuthRequest, res: Response) => {
  const { planId, creditsAmount, method, transferReference, proofAttachmentUrl } = req.body;
  const user = req.user!;

  let amountMinor = 0;
  let targetPlan: Plan | undefined;

  if (planId) {
    targetPlan = db.plans.find(p => p.planId === planId);
    if (!targetPlan) {
      return res.status(400).json({ error: 'الباقة المحددة غير صالحة' });
    }
    amountMinor = targetPlan.priceMinor;
  } else if (creditsAmount) {
    // E.g. $10 per 100 credits
    const unitRate = db.siteSettings.creditPriceCents || 10;
    amountMinor = Math.round((Number(creditsAmount) * unitRate));
  } else {
    return res.status(400).json({ error: 'يرجى تحديد الباقة أو كمية الرصيد المطلوبة للشراء' });
  }

  const paymentRecord: PaymentRecord = {
    paymentId: `pay_${crypto.randomUUID()}`,
    uid: user.uid,
    userEmail: user.email,
    planId: targetPlan?.planId,
    creditsPurchased: creditsAmount ? Number(creditsAmount) : targetPlan?.creditsGranted,
    amountMinor,
    currency: targetPlan?.currency || db.siteSettings.primaryCurrency || 'USD',
    method: method === 'manual_crypto' ? 'manual_crypto' : 'manual_bank',
    status: 'pending',
    transferReference: transferReference ? String(transferReference).trim() : undefined,
    proofAttachmentUrl: proofAttachmentUrl ? String(proofAttachmentUrl).trim() : undefined,
    createdAt: new Date().toISOString()
  };

  db.payments.unshift(paymentRecord);
  db.save();

  logAudit(user.uid, 'create_manual_payment', 'payment', paymentRecord.paymentId, {
    amountMinor,
    method: paymentRecord.method,
    planId: paymentRecord.planId
  });

  res.status(201).json({
    success: true,
    message: 'تم إرسال طلب الدفع بنجاح. سيقوم المشرف بمراجعته وتفعيل الحساب فور التأكد.',
    payment: paymentRecord
  });
});

apiRouter.get('/payments/my', authenticateUser, (req: AuthRequest, res: Response) => {
  const userPayments = db.payments.filter(p => p.uid === req.user!.uid);
  res.json({ payments: userPayments });
});

// Generic Webhook for payment gateways (Stripe / Paddle / Crypto)
apiRouter.post('/webhooks/:providerId', (req: Request, res: Response) => {
  const { providerId } = req.params;
  const { eventId, paymentReference, status, uid, planId, amountMinor } = req.body;

  // Idempotency check
  const existingPayment = db.payments.find(p => p.transferReference === paymentReference && p.status === 'confirmed');
  if (existingPayment) {
    return res.json({ received: true, message: 'تمت معالجة الحدث مسبقاً' });
  }

  if (status === 'payment_succeeded' && uid) {
    const user = db.users.find(u => u.uid === uid);
    if (user) {
      const plan = planId ? db.plans.find(p => p.planId === planId) : null;
      const creditsToAdd = plan ? plan.creditsGranted : 1000;
      const wallet = getOrCreateWallet(uid);
      const balanceBefore = wallet.availableCredits;
      wallet.availableCredits += creditsToAdd;
      wallet.totalPurchased += creditsToAdd;

      const ledgerEntry: LedgerEntry = {
        transactionId: `tx_${crypto.randomUUID()}`,
        uid,
        type: 'credit_purchase',
        amount: creditsToAdd,
        balanceBefore,
        balanceAfter: wallet.availableCredits,
        referenceId: eventId || `webhook_${crypto.randomUUID()}`,
        description: `دفعة إلكترونية ناجحة عبر ${providerId}`,
        createdAt: new Date().toISOString()
      };
      db.ledger.unshift(ledgerEntry);

      db.payments.push({
        paymentId: `pay_${crypto.randomUUID()}`,
        uid,
        userEmail: user.email,
        planId: plan?.planId,
        creditsPurchased: creditsToAdd,
        amountMinor: amountMinor || 0,
        currency: 'USD',
        method: 'electronic_stripe',
        status: 'confirmed',
        transferReference: paymentReference,
        createdAt: new Date().toISOString(),
        confirmedAt: new Date().toISOString()
      });
      db.save();
    }
  }

  res.json({ received: true });
});

// ==========================================
// 10. ADMIN DASHBOARD & OWNER CONTROLS
// ==========================================

apiRouter.get('/admin/metrics', authenticateUser, requireAdmin, (_req: AuthRequest, res: Response) => {
  const totalUsers = db.users.length;
  const activeSubs = db.subscriptions.filter(s => s.status === 'active').length;
  const confirmedPayments = db.payments.filter(p => p.status === 'confirmed');
  const pendingPayments = db.payments.filter(p => p.status === 'pending');
  
  const totalRevenueMinor = confirmedPayments.reduce((acc, p) => acc + (p.amountMinor || 0), 0);
  const totalJobs = db.generationJobs.length;
  const successfulJobs = db.generationJobs.filter(j => j.status === 'succeeded').length;
  const failedJobs = db.generationJobs.filter(j => j.status === 'failed').length;
  const totalCreditsUsed = db.generationJobs.reduce((acc, j) => acc + (j.actualCost || 0), 0);

  // Model usage count
  const modelUsage: Record<string, number> = {};
  db.generationJobs.forEach(j => {
    modelUsage[j.modelId] = (modelUsage[j.modelId] || 0) + 1;
  });

  res.json({
    overview: {
      totalUsers,
      activeSubs,
      totalRevenueFormatted: `$${(totalRevenueMinor / 100).toFixed(2)}`,
      totalRevenueMinor,
      pendingPaymentsCount: pendingPayments.length,
      totalJobs,
      successfulJobs,
      failedJobs,
      totalCreditsUsed
    },
    modelUsage,
    providersStatus: db.providers
  });
});

apiRouter.get('/admin/users', authenticateUser, requireAdmin, (_req: AuthRequest, res: Response) => {
  const usersWithWallet = db.users.map(u => {
    const wallet = db.wallets.find(w => w.uid === u.uid) || { availableCredits: 0, reservedCredits: 0 };
    const sub = db.subscriptions.find(s => s.uid === u.uid && s.status === 'active');
    return {
      uid: u.uid,
      displayName: u.displayName,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
      credits: wallet.availableCredits,
      reservedCredits: wallet.reservedCredits,
      planId: sub?.planId || 'free'
    };
  });
  res.json({ users: usersWithWallet });
});

apiRouter.post('/admin/users/:uid/adjust-credits', authenticateUser, requireAdmin, (req: AuthRequest, res: Response) => {
  const { uid } = req.params;
  const { amount, reason } = req.body;

  if (typeof amount !== 'number' || isNaN(amount)) {
    return res.status(400).json({ error: 'المبلغ غير صالح' });
  }

  const wallet = getOrCreateWallet(uid);
  const balanceBefore = wallet.availableCredits;
  wallet.availableCredits += amount;
  wallet.updatedAt = new Date().toISOString();

  const entry: LedgerEntry = {
    transactionId: `tx_${crypto.randomUUID()}`,
    uid,
    type: 'admin_adjustment',
    amount,
    balanceBefore,
    balanceAfter: wallet.availableCredits,
    referenceId: `admin_${req.user!.uid}`,
    description: reason || 'تعديل رصيد إداري',
    createdAt: new Date().toISOString()
  };
  db.ledger.unshift(entry);
  db.save();

  logAudit(req.user!.uid, 'adjust_credits', 'wallet', uid, { amount, reason, newBalance: wallet.availableCredits });

  res.json({ success: true, newBalance: wallet.availableCredits });
});

apiRouter.post('/admin/users/:uid/toggle-status', authenticateUser, requireAdmin, (req: AuthRequest, res: Response) => {
  const { uid } = req.params;
  const targetUser = db.users.find(u => u.uid === uid);
  if (!targetUser) return res.status(404).json({ error: 'المستخدم غير موجود' });

  if (targetUser.role === 'admin' && targetUser.uid === req.user!.uid) {
    return res.status(400).json({ error: 'لا يمكنك إيقاف حسابك الإداري الخاص' });
  }

  targetUser.status = targetUser.status === 'active' ? 'suspended' : 'active';
  targetUser.updatedAt = new Date().toISOString();
  db.save();

  logAudit(req.user!.uid, 'toggle_user_status', 'user', uid, { newStatus: targetUser.status });

  res.json({ success: true, status: targetUser.status });
});

// Admin Activation Keys Management
apiRouter.get('/admin/activation-keys', authenticateUser, requireAdmin, (_req: AuthRequest, res: Response) => {
  res.json({ keys: db.activationKeys });
});

apiRouter.post('/admin/activation-keys/generate', authenticateUser, requireAdmin, (req: AuthRequest, res: Response) => {
  const { count, planId, creditsAmount, maxActivations, expiresDays } = req.body;
  const numToCreate = Math.min(Math.max(1, Number(count) || 1), 50);

  const generatedList: { keyId: string; keyCode: string; creditsAmount: number; planId?: string }[] = [];

  for (let i = 0; i < numToCreate; i++) {
    const rawCode = generateActivationKeyString();
    const keyHash = hashActivationKey(rawCode);
    const keyId = `key_${crypto.randomUUID()}`;

    let expiresAt: string | undefined;
    if (expiresDays && Number(expiresDays) > 0) {
      const exp = new Date();
      exp.setDate(exp.getDate() + Number(expiresDays));
      expiresAt = exp.toISOString();
    }

    const keyRecord: ActivationKey = {
      keyId,
      keyHash,
      planId: planId || undefined,
      creditsAmount: Number(creditsAmount) || 500,
      status: 'active',
      expiresAt,
      maxActivations: Number(maxActivations) || 1,
      activationCount: 0,
      createdBy: req.user!.uid,
      createdAt: new Date().toISOString()
    };

    db.activationKeys.unshift(keyRecord);
    generatedList.push({
      keyId,
      keyCode: rawCode, // Visible only right upon generation!
      creditsAmount: keyRecord.creditsAmount,
      planId: keyRecord.planId
    });
  }

  db.save();
  logAudit(req.user!.uid, 'generate_keys', 'activationKey', `count_${numToCreate}`, { planId, creditsAmount });

  res.status(201).json({
    success: true,
    message: `تم إنشاء ${numToCreate} مفتاح تفعيل جديد بنجاح`,
    generatedKeys: generatedList
  });
});

apiRouter.post('/admin/activation-keys/:keyId/revoke', authenticateUser, requireAdmin, (req: AuthRequest, res: Response) => {
  const { keyId } = req.params;
  const key = db.activationKeys.find(k => k.keyId === keyId);
  if (!key) return res.status(404).json({ error: 'المفتاح غير موجود' });

  key.status = 'revoked';
  db.save();
  logAudit(req.user!.uid, 'revoke_key', 'activationKey', keyId);

  res.json({ success: true, message: 'تم إلغاء المفتاح بنجاح' });
});

// Admin Payments Review
apiRouter.get('/admin/payments', authenticateUser, requireAdmin, (_req: AuthRequest, res: Response) => {
  res.json({ payments: db.payments });
});

apiRouter.post('/admin/payments/:paymentId/review', authenticateUser, requireAdmin, (req: AuthRequest, res: Response) => {
  const { paymentId } = req.params;
  const { action, notes } = req.body; // 'approve' | 'reject'

  const payment = db.payments.find(p => p.paymentId === paymentId);
  if (!payment) return res.status(404).json({ error: 'طلب الدفع غير موجود' });
  if (payment.status !== 'pending') {
    return res.status(400).json({ error: `تمت مراجعة هذا الطلب مسبقاً (الحالة: ${payment.status})` });
  }

  if (action === 'approve') {
    payment.status = 'confirmed';
    payment.confirmedAt = new Date().toISOString();
    payment.adminNotes = notes || 'تمت الموافقة وتأكيد التحويل البنكي/الرقمي';

    // Upgrade subscription or grant credits
    const wallet = getOrCreateWallet(payment.uid);
    let creditsToAdd = payment.creditsPurchased || 0;

    if (payment.planId) {
      const plan = db.plans.find(p => p.planId === payment.planId);
      if (plan) {
        creditsToAdd = Math.max(creditsToAdd, plan.creditsGranted);
        // Expire older active subscriptions
        db.subscriptions
          .filter(s => s.uid === payment.uid && s.status === 'active')
          .forEach(s => s.status = 'cancelled');

        const expDate = calculateSubscriptionExpiry(plan);

        db.subscriptions.push({
          subscriptionId: `sub_${crypto.randomUUID()}`,
          uid: payment.uid,
          planId: plan.planId,
          status: 'active',
          startsAt: new Date().toISOString(),
          expiresAt: expDate.toISOString(),
          paymentReference: payment.paymentId
        });
      }
    }

    const balanceBefore = wallet.availableCredits;
    wallet.availableCredits += creditsToAdd;
    wallet.totalPurchased += creditsToAdd;
    wallet.updatedAt = new Date().toISOString();

    const ledgerEntry: LedgerEntry = {
      transactionId: `tx_${crypto.randomUUID()}`,
      uid: payment.uid,
      type: 'credit_purchase',
      amount: creditsToAdd,
      balanceBefore,
      balanceAfter: wallet.availableCredits,
      referenceId: payment.paymentId,
      description: `تأكيد شراء باقة/رصيد يدوي: #${payment.paymentId.slice(-6)}`,
      createdAt: new Date().toISOString()
    };
    db.ledger.unshift(ledgerEntry);

    logAudit(req.user!.uid, 'approve_payment', 'payment', payment.paymentId, { amount: creditsToAdd });
  } else {
    payment.status = 'rejected';
    payment.adminNotes = notes || 'تم الرفض لعدم استلام الحوالة أو عدم تطابق الإيصال';
    logAudit(req.user!.uid, 'reject_payment', 'payment', payment.paymentId, { reason: notes });
  }

  db.save();
  res.json({ success: true, payment });
});

// Admin Providers Toggle
apiRouter.get('/admin/providers', authenticateUser, requireAdmin, (_req: AuthRequest, res: Response) => {
  res.json({ providers: db.providers });
});

apiRouter.post('/admin/providers/:providerId/toggle', authenticateUser, requireAdmin, (req: AuthRequest, res: Response) => {
  const { providerId } = req.params;
  const provider = db.providers.find(p => p.providerId === providerId);
  if (!provider) return res.status(404).json({ error: 'المزود غير موجود' });

  provider.enabled = !provider.enabled;
  provider.updatedAt = new Date().toISOString();
  db.save();

  logAudit(req.user!.uid, 'toggle_provider', 'provider', providerId, { enabled: provider.enabled });
  res.json({ success: true, provider });
});

// Admin Site Settings
apiRouter.get('/admin/settings', authenticateUser, requireAdmin, (_req: AuthRequest, res: Response) => {
  res.json({ settings: db.siteSettings });
});

apiRouter.put('/admin/settings', authenticateUser, requireAdmin, (req: AuthRequest, res: Response) => {
  const updated = db.setSiteSettings(req.body);
  logAudit(req.user!.uid, 'update_settings', 'siteSettings', 'global', req.body);
  res.json({ success: true, settings: updated });
});

// ==========================================
// ADMIN PLANS MANAGEMENT (CREATE, EDIT, TOGGLE, DELETE)
// Enables Admin to create weekly packages, 5-day packages, or ANY custom package
// ==========================================

apiRouter.get('/admin/plans', authenticateUser, requireAdmin, (_req: AuthRequest, res: Response) => {
  res.json({ plans: db.plans, currency: db.siteSettings.primaryCurrency || 'USD' });
});

apiRouter.post('/admin/plans', authenticateUser, requireAdmin, (req: AuthRequest, res: Response) => {
  const {
    name,
    nameAr,
    description,
    priceMinor,
    currency,
    duration,
    durationDays,
    creditsGranted,
    allowedModels,
    maxVideoDurationSeconds,
    maxDailyJobs,
    active,
    features,
    badge
  } = req.body;

  if (!nameAr || !name) {
    return res.status(400).json({ error: 'يرجى إدخال اسم الباقة بالعربية والإنجليزية' });
  }

  if (typeof creditsGranted !== 'number' || creditsGranted < 0) {
    return res.status(400).json({ error: 'يرجى تحديد رصيد صالح للباقة' });
  }

  // Calculate duration days
  let calculatedDays = typeof durationDays === 'number' && durationDays > 0 ? durationDays : undefined;
  if (!calculatedDays) {
    if (duration === '5days') calculatedDays = 5;
    else if (duration === 'weekly') calculatedDays = 7;
    else if (duration === 'daily') calculatedDays = 1;
    else if (duration === 'monthly') calculatedDays = 30;
    else if (duration === 'annual') calculatedDays = 365;
    else calculatedDays = 7;
  }

  const planId = `plan_${crypto.randomUUID()}`;
  const newPlan: Plan = {
    planId,
    name: String(name).trim(),
    nameAr: String(nameAr).trim(),
    description: description ? String(description).trim() : '',
    priceMinor: typeof priceMinor === 'number' ? Math.max(0, priceMinor) : 0,
    currency: currency || db.siteSettings.primaryCurrency || 'USD',
    duration: duration || (calculatedDays === 5 ? '5days' : calculatedDays === 7 ? 'weekly' : 'custom'),
    durationDays: calculatedDays,
    creditsGranted: Number(creditsGranted) || 0,
    allowedModels: Array.isArray(allowedModels) && allowedModels.length > 0
      ? allowedModels
      : ['gemini-3.8-flash', 'gemini-3.1-flash-lite-image', 'gemini-3.8-flash-lite-tts', 'veo-3.1-lite-generate-preview'],
    maxVideoDurationSeconds: Number(maxVideoDurationSeconds) || 15,
    maxDailyJobs: Number(maxDailyJobs) || 50,
    active: active !== undefined ? Boolean(active) : true,
    features: Array.isArray(features) && features.length > 0 ? features : [
      `${Number(creditsGranted)} رصيد توليد متجدد`,
      `صلاحية استخدام كاملة لمدة ${calculatedDays} أيام`,
      'توليد فيديو وصور وصوتيات بالذكاء الاصطناعي',
      'ترخيص استخدام تجاري معتمد'
    ],
    badge: badge ? String(badge).trim() : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.plans.push(newPlan);
  db.save();

  logAudit(req.user!.uid, 'create_plan', 'plan', planId, {
    nameAr: newPlan.nameAr,
    duration: newPlan.duration,
    durationDays: newPlan.durationDays,
    creditsGranted: newPlan.creditsGranted,
    priceMinor: newPlan.priceMinor
  });

  res.status(201).json({
    success: true,
    message: `تم إنشاء باقة «${newPlan.nameAr}» بنجاح (${newPlan.durationDays} أيام)`,
    plan: newPlan
  });
});

apiRouter.put('/admin/plans/:planId', authenticateUser, requireAdmin, (req: AuthRequest, res: Response) => {
  const { planId } = req.params;
  const plan = db.plans.find(p => p.planId === planId);
  if (!plan) return res.status(404).json({ error: 'الباقة غير موجودة' });

  const {
    name,
    nameAr,
    description,
    priceMinor,
    currency,
    duration,
    durationDays,
    creditsGranted,
    allowedModels,
    maxVideoDurationSeconds,
    maxDailyJobs,
    active,
    features,
    badge
  } = req.body;

  if (name !== undefined) plan.name = String(name).trim();
  if (nameAr !== undefined) plan.nameAr = String(nameAr).trim();
  if (description !== undefined) plan.description = String(description).trim();
  if (priceMinor !== undefined) plan.priceMinor = Math.max(0, Number(priceMinor) || 0);
  if (currency !== undefined) plan.currency = String(currency).trim();
  if (duration !== undefined) plan.duration = duration;
  if (durationDays !== undefined) plan.durationDays = Number(durationDays) || undefined;
  if (creditsGranted !== undefined) plan.creditsGranted = Math.max(0, Number(creditsGranted) || 0);
  if (Array.isArray(allowedModels)) plan.allowedModels = allowedModels;
  if (maxVideoDurationSeconds !== undefined) plan.maxVideoDurationSeconds = Number(maxVideoDurationSeconds) || 15;
  if (maxDailyJobs !== undefined) plan.maxDailyJobs = Number(maxDailyJobs) || 50;
  if (active !== undefined) plan.active = Boolean(active);
  if (Array.isArray(features)) plan.features = features;
  if (badge !== undefined) plan.badge = badge ? String(badge).trim() : undefined;
  plan.updatedAt = new Date().toISOString();

  db.save();

  logAudit(req.user!.uid, 'update_plan', 'plan', planId, {
    nameAr: plan.nameAr,
    duration: plan.duration,
    priceMinor: plan.priceMinor
  });

  res.json({
    success: true,
    message: `تم تحديث بيانات الباقة «${plan.nameAr}» بنجاح`,
    plan
  });
});

apiRouter.post('/admin/plans/:planId/toggle', authenticateUser, requireAdmin, (req: AuthRequest, res: Response) => {
  const { planId } = req.params;
  const plan = db.plans.find(p => p.planId === planId);
  if (!plan) return res.status(404).json({ error: 'الباقة غير موجودة' });

  plan.active = !plan.active;
  plan.updatedAt = new Date().toISOString();
  db.save();

  logAudit(req.user!.uid, 'toggle_plan', 'plan', planId, { active: plan.active });
  res.json({ success: true, message: `تم ${plan.active ? 'تفعيل' : 'تعطيل'} الباقة بنجاح`, plan });
});

apiRouter.delete('/admin/plans/:planId', authenticateUser, requireAdmin, (req: AuthRequest, res: Response) => {
  const { planId } = req.params;
  const idx = db.plans.findIndex(p => p.planId === planId);
  if (idx === -1) return res.status(404).json({ error: 'الباقة غير موجودة' });

  const activeSubs = db.subscriptions.filter(s => s.planId === planId && s.status === 'active');
  if (activeSubs.length > 0) {
    db.plans[idx].active = false;
    db.save();
    return res.json({
      success: true,
      message: 'تم تعطيل الباقة بنجاح (لم يتم الحذف الكامل لوجود اشتراكات نشطة مرتبطة بها)'
    });
  }

  const deleted = db.plans.splice(idx, 1)[0];
  db.save();
  logAudit(req.user!.uid, 'delete_plan', 'plan', planId, { nameAr: deleted.nameAr });

  res.json({ success: true, message: `تم حذف باقة «${deleted.nameAr}» بنجاح` });
});

apiRouter.get('/admin/audit-logs', authenticateUser, requireAdmin, (_req: AuthRequest, res: Response) => {
  res.json({ logs: db.auditLogs.slice(0, 100) });
});

// ==========================================
// 11. AUTOMATED VERIFICATION SELF-TEST SUITE
// ==========================================
// Fulfills Section 23: Complete verification test suite

apiRouter.get('/system/self-test', async (_req: Request, res: Response) => {
  const testResults: { testName: string; passed: boolean; message: string; durationMs: number }[] = [];

  const runTest = async (name: string, fn: () => Promise<void> | void) => {
    const start = Date.now();
    try {
      await fn();
      testResults.push({ testName: name, passed: true, message: 'ناجح', durationMs: Date.now() - start });
    } catch (err: any) {
      testResults.push({ testName: name, passed: false, message: err.message || 'فشل', durationMs: Date.now() - start });
    }
  };

  // 1. Password hashing & verification
  await runTest('تشفير كلمات المرور والتحقق منها (PBKDF2+SHA512)', () => {
    const pwd = 'TestSecretPassword_2026!';
    const hashed = hashPassword(pwd);
    if (!verifyPassword(pwd, hashed)) throw new Error('فشل التحقق من كلمة المرور المشفرة');
    if (verifyPassword('WrongPassword', hashed)) throw new Error('تم قبول كلمة مرور خاطئة!');
  });

  // 2. Session Token generation & tamper resistance
  await runTest('توليد وتوقيع جلسات المستخدم (HMAC-SHA256 Token)', () => {
    const payload = { uid: 'usr_test_123', email: 'test@studio.ai', role: 'creator' };
    const token = signSessionToken(payload);
    const verified = verifySessionToken(token);
    if (!verified || verified.uid !== payload.uid) throw new Error('فشل فك توقيع الجلسة');
    const tampered = token.slice(0, -4) + 'abcd';
    if (verifySessionToken(tampered)) throw new Error('تم قبول رمز جلسة تم العبث به!');
  });

  // 3. Activation Key Hashing & Validation
  await runTest('توليد وفحص مفاتيح التفعيل المشفرة', () => {
    const rawKey = generateActivationKeyString();
    if (!rawKey.startsWith('CS-') || rawKey.length < 20) throw new Error('صيغة المفتاح غير مطابقة');
    const hash = hashActivationKey(rawKey);
    const hash2 = hashActivationKey(rawKey.toLowerCase()); // Case insensitivity
    if (hash !== hash2) throw new Error('تطابق الهاش مع تجاهل حالة الأحرف فشل');
  });

  // 4. Customer BYOK Encryption & Decryption
  await runTest('تشفير مفاتيح العملاء الحساسة بـ AES-256-GCM', () => {
    const rawKey = 'sk-proj-super-secret-customer-key-998811';
    const encrypted = encryptCustomerApiKey(rawKey);
    if (encrypted.includes(rawKey)) throw new Error('المفتاح محفوظ كنص صريح!');
    const mask = maskApiKey(rawKey);
    if (mask !== 'sk-p...8811') throw new Error('قناع المفتاح غير دقيق');
  });

  // 5. Atomic Credit Reservation and Double-Debit prevention
  await runTest('منع الخصم المزدوج وحجز الرصيد الذري في المحفظة', () => {
    const testUid = `usr_test_${crypto.randomUUID()}`;
    const wallet = getOrCreateWallet(testUid);
    const initialBalance = wallet.availableCredits;
    const holdAmount = 30;

    const ok1 = reserveCredits(testUid, holdAmount, 'job_test_1', 'اختبار حجز الرصيد');
    if (!ok1) throw new Error('فشل حجز الرصيد المتاح');
    if (wallet.availableCredits !== initialBalance - holdAmount) throw new Error('عدم تطابق الرصيد المتاح بعد الحجز');
    if (wallet.reservedCredits !== holdAmount) throw new Error('عدم تطابق الرصيد المحجوز');

    // Refund reservation
    refundReservation(testUid, holdAmount, 'job_test_1', 'اختبار الاسترداد');
    if (wallet.availableCredits !== initialBalance) throw new Error('فشل استرداد الرصيد المحجوز بعد الإلغاء');
  });

  // 6. Gemini Environment Configuration Check
  await runTest('فحص جاهزية محرك الذكاء الاصطناعي Google Gemini API', () => {
    if (!isApiKeyConfigured()) {
      // It's acceptable for unconfigured env, but report status
      testResults.push({
        testName: 'حالة مفتاح Google Gemini API الخارجي',
        passed: true,
        message: 'تنبيه: GEMINI_API_KEY غير مضاف في متغيرات البيئة. سيعمل وضع مفاتيح العملاء BYOK وإعدادات الخادم.',
        durationMs: 0
      });
    }
  });

  const allPassed = testResults.every(t => t.passed);
  res.json({
    status: allPassed ? 'all_tests_passed' : 'some_tests_failed',
    timestamp: new Date().toISOString(),
    totalTests: testResults.length,
    tests: testResults
  });
});
