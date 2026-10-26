import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};

export const activeFirebaseConfig = {
  ...firebaseConfig,
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId:
    env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  firestoreDatabaseId:
    env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfig.firestoreDatabaseId,
};

export const app = getApps().length > 0 ? getApp() : initializeApp(activeFirebaseConfig);
export const db = getFirestore(app, activeFirebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export function getCurrentHostDomain(): string {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return window.location.hostname;
  }
  return 'moz-facil.vercel.app';
}

export function isUnauthorizedDomainError(error: unknown): boolean {
  const code = (error as { code?: string })?.code || '';
  const msg = error instanceof Error ? error.message : String(error || '');
  return (
    code === 'auth/unauthorized-domain' ||
    msg.includes('auth/unauthorized-domain')
  );
}

export function formatFirebaseAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code || '';
  const msg = error instanceof Error ? error.message : String(error || '');

  if (isUnauthorizedDomainError(error)) {
    const domain = getCurrentHostDomain();
    return `O domínio "${domain}" ainda não está autorizado no Firebase Authentication. No Firebase Console (projeto ${activeFirebaseConfig.projectId}), aceda a Authentication > Configurações (Settings) > Domínios autorizados (Authorized domains) e adicione "${domain}".`;
  }

  if (
    code === 'auth/popup-closed-by-user' ||
    msg.includes('auth/popup-closed-by-user') ||
    code === 'auth/cancelled-popup-request'
  ) {
    return 'A janela de início de sessão Google foi fechada antes de concluir. Tente novamente.';
  }

  if (code === 'auth/popup-blocked' || msg.includes('auth/popup-blocked')) {
    return 'O navegador bloqueou a janela de login. Permita pop-ups para este site e tente novamente.';
  }

  if (
    code === 'auth/network-request-failed' ||
    msg.includes('auth/network-request-failed')
  ) {
    return 'Falha de ligação à rede ao comunicar com o servidor de autenticação. Verifique a sua internet.';
  }

  return msg || 'Não foi possível iniciar sessão com Google.';
}

export interface MozPhoneValidationResult {
  valid: boolean;
  e164: string;
  localDigits: string;
  formattedDisplay: string;
  error?: string;
}

/**
 * Validates and normalizes a Mozambique phone number (+258) to E.164 format.
 * Rejects invalid characters, duplicate country prefixes, invalid mobile prefixes,
 * or incomplete/excess digits.
 */
export function validateMozambiquePhone(raw: string): MozPhoneValidationResult {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) {
    return {
      valid: false,
      e164: '',
      localDigits: '',
      formattedDisplay: '',
      error: 'Indique o número de telefone de Moçambique (ex: 84 123 4567).',
    };
  }

  // Reject invalid characters (only digits, spaces, +, -, (, ) allowed)
  if (/[^0-9+\-\s()]/.test(trimmed)) {
    return {
      valid: false,
      e164: '',
      localDigits: '',
      formattedDisplay: '',
      error: 'O número contém caracteres inválidos. Utilize apenas algarismos (ex: 84 123 4567).',
    };
  }

  // Reject multiple '+' signs or duplicate country code prefixes like "+258 +258" or "258258..."
  const plusCount = (trimmed.match(/\+/g) || []).length;
  if (plusCount > 1 || (plusCount === 1 && !trimmed.startsWith('+'))) {
    return {
      valid: false,
      e164: '',
      localDigits: '',
      formattedDisplay: '',
      error: 'Formato inválido: prefixo internacional duplicado ou mal posicionado.',
    };
  }

  let digits = trimmed.replace(/\D/g, '');

  // Strip leading 00258 or 258 once
  if (digits.startsWith('00258')) {
    digits = digits.slice(5);
  } else if (digits.startsWith('258') && digits.length > 9) {
    digits = digits.slice(3);
  }

  // Detect duplicate 258 prefix (e.g. "+258 258 84 123 4567")
  if (digits.startsWith('258') && digits.length >= 12) {
    return {
      valid: false,
      e164: '',
      localDigits: '',
      formattedDisplay: '',
      error: 'Prefixo +258 duplicado. Indique apenas os 9 dígitos do número móvel (ex: 84 123 4567).',
    };
  }

  if (digits.length < 9) {
    return {
      valid: false,
      e164: '',
      localDigits: digits,
      formattedDisplay: '',
      error: `Número incompleto (${digits.length} de 9 dígitos). Introduza um número válido de 9 dígitos (ex: 84 123 4567).`,
    };
  }

  if (digits.length > 9) {
    return {
      valid: false,
      e164: '',
      localDigits: digits,
      formattedDisplay: '',
      error: `Número com dígitos em excesso (${digits.length} dígitos). Em Moçambique o número móvel tem 9 dígitos (ex: 84 123 4567).`,
    };
  }

  // Mozambique mobile operators start with 82, 83 (Tmcel), 84, 85 (Vodacom), 86, 87 (Movitel)
  if (!/^8[2-7]\d{7}$/.test(digits)) {
    return {
      valid: false,
      e164: '',
      localDigits: digits,
      formattedDisplay: '',
      error: 'Operadora inválida. O número móvel em Moçambique deve começar por 82, 83, 84, 85, 86 ou 87.',
    };
  }

  const e164 = `+258${digits}`;
  const formattedDisplay = `+258 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  return {
    valid: true,
    e164,
    localDigits: digits,
    formattedDisplay,
  };
}

export interface FormattedPhoneAuthError {
  code: string;
  userMessage: string;
  isGatewayConfigIssue: boolean;
}

/**
 * Translates real Firebase Phone Authentication errors into accurate, actionable
 * Portuguese messages without masking real failures or leaking sensitive tokens.
 */
export function formatFirebasePhoneAuthError(error: unknown): FormattedPhoneAuthError {
  const rawCode = (error as { code?: string })?.code || '';
  const rawMsg = error instanceof Error ? error.message : String(error || '');
  const combined = `${rawCode} ${rawMsg}`;

  if (isUnauthorizedDomainError(error)) {
    const domain = getCurrentHostDomain();
    return {
      code: 'auth/unauthorized-domain',
      isGatewayConfigIssue: true,
      userMessage: `Domínio não autorizado (${domain}). No Firebase Console (projeto ${activeFirebaseConfig.projectId} > Authentication > Settings > Authorized domains), adicione "${domain}" para permitir reCAPTCHA e envio de SMS.`,
    };
  }

  if (combined.includes('auth/invalid-phone-number')) {
    return {
      code: 'auth/invalid-phone-number',
      isGatewayConfigIssue: false,
      userMessage:
        'O número de telefone foi rejeitado pelo Firebase (auth/invalid-phone-number). Confirme que segue o formato +258 82/83/84/85/86/87 XXX XXXX.',
    };
  }

  if (combined.includes('auth/missing-phone-number')) {
    return {
      code: 'auth/missing-phone-number',
      isGatewayConfigIssue: false,
      userMessage: 'Indique o número de telefone antes de solicitar o código SMS.',
    };
  }

  if (combined.includes('auth/captcha-check-failed')) {
    const domain = getCurrentHostDomain();
    return {
      code: 'auth/captcha-check-failed',
      isGatewayConfigIssue: true,
      userMessage: `A verificação reCAPTCHA falhou (auth/captcha-check-failed). Confirme que o domínio "${domain}" está nos Domínios Autorizados do Firebase Authentication e atualize a página.`,
    };
  }

  if (
    combined.includes('auth/missing-client-identifier') ||
    combined.includes('auth/missing-app-credential') ||
    combined.includes('auth/invalid-app-credential')
  ) {
    return {
      code: 'auth/missing-client-identifier',
      isGatewayConfigIssue: true,
      userMessage:
        'Falha ao validar o identificador de cliente reCAPTCHA no Firebase (auth/missing-client-identifier). Verifique a configuração de Authentication e os domínios autorizados no Firebase Console.',
    };
  }

  if (combined.includes('auth/billing-not-enabled')) {
    return {
      code: 'auth/billing-not-enabled',
      isGatewayConfigIssue: true,
      userMessage: `O envio de SMS requer faturação ativa (plano Blaze) no projeto Firebase "${activeFirebaseConfig.projectId}" (auth/billing-not-enabled). Ative o plano Blaze no Firebase Console ou registe um número de teste em Authentication > Sign-in method > Phone.`,
    };
  }

  if (combined.includes('auth/operation-not-allowed')) {
    return {
      code: 'auth/operation-not-allowed',
      isGatewayConfigIssue: true,
      userMessage: `O Firebase recusou o envio de SMS (auth/operation-not-allowed). No Firebase Console (projeto ${activeFirebaseConfig.projectId}), ative o fornecedor "Phone" em Authentication > Sign-in method e permita Moçambique (+258) em Authentication > Settings > SMS region policy.`,
    };
  }

  if (combined.includes('auth/quota-exceeded')) {
    return {
      code: 'auth/quota-exceeded',
      isGatewayConfigIssue: true,
      userMessage:
        'A quota diária de envio de SMS do projeto Firebase foi atingida (auth/quota-exceeded). Tente novamente mais tarde.',
    };
  }

  if (combined.includes('auth/too-many-requests')) {
    return {
      code: 'auth/too-many-requests',
      isGatewayConfigIssue: false,
      userMessage:
        'Demasiadas tentativas de verificação para este número ou dispositivo (auth/too-many-requests). Aguarde alguns minutos antes de tentar novamente.',
    };
  }

  if (combined.includes('auth/code-expired') || combined.includes('auth/session-expired')) {
    return {
      code: 'auth/code-expired',
      isGatewayConfigIssue: false,
      userMessage:
        'O código SMS expirou (auth/code-expired). Clique em "Reenviar" para receber um novo código de 6 dígitos.',
    };
  }

  if (combined.includes('auth/invalid-verification-code')) {
    return {
      code: 'auth/invalid-verification-code',
      isGatewayConfigIssue: false,
      userMessage:
        'O código de 6 dígitos introduzido está incorreto (auth/invalid-verification-code). Verifique o SMS recebido e tente novamente.',
    };
  }

  if (
    combined.includes('auth/credential-already-in-use') ||
    combined.includes('auth/account-exists-with-different-credential')
  ) {
    return {
      code: 'auth/credential-already-in-use',
      isGatewayConfigIssue: false,
      userMessage:
        'Este número de telefone já está verificado e associado a outra conta no MozFácil (auth/credential-already-in-use).',
    };
  }

  if (combined.includes('auth/provider-already-linked')) {
    return {
      code: 'auth/provider-already-linked',
      isGatewayConfigIssue: false,
      userMessage:
        'A sua conta já possui um número de telefone verificado associado (auth/provider-already-linked).',
    };
  }

  if (combined.includes('auth/network-request-failed')) {
    return {
      code: 'auth/network-request-failed',
      isGatewayConfigIssue: false,
      userMessage:
        'Falha de ligação à rede ao comunicar com o Firebase Authentication. Verifique a sua ligação à internet.',
    };
  }

  return {
    code: rawCode || 'auth/unknown',
    isGatewayConfigIssue: false,
    userMessage: `Não foi possível concluir a verificação por SMS (${rawCode || 'erro de autenticação'}). Tente novamente.`,
  };
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testConnection();
