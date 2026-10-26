import React, { useState, useEffect, useRef } from 'react';
import {
  User as FirebaseUser,
  RecaptchaVerifier,
  ConfirmationResult,
  linkWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import {
  auth,
  formatFirebaseAuthError,
  isUnauthorizedDomainError,
} from '../firebase';
import { MozUser } from '../types/mozfacil';
import {
  getProvinces,
  getDistrictsByProvince,
  getNeighborhoodsByDistrict,
} from '../data/mozambiqueLocations';
import { saveUtenteRegistration } from '../services/mozfacilService';
import {
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Smartphone,
  ShieldCheck,
  Coins,
  ArrowLeft,
} from 'lucide-react';

interface UtenteRegistrationScreenProps {
  firebaseUser: FirebaseUser | null;
  mozUser: MozUser | null;
  onBack: () => void;
  onSaved: (updatedUser: MozUser) => void;
  onRequestGoogleLogin: () => Promise<void>;
}

export const UtenteRegistrationScreen: React.FC<UtenteRegistrationScreenProps> = ({
  firebaseUser,
  mozUser,
  onBack,
  onSaved,
  onRequestGoogleLogin,
}) => {
  const [displayName, setDisplayName] = useState(
    mozUser?.displayName || firebaseUser?.displayName || ''
  );
  const [whatsapp, setWhatsapp] = useState(
    mozUser?.whatsapp || mozUser?.phone || firebaseUser?.phoneNumber || ''
  );
  const [province, setProvince] = useState(mozUser?.province || '');
  const [district, setDistrict] = useState(mozUser?.district || '');
  const [neighborhood, setNeighborhood] = useState(mozUser?.neighborhood || '');
  const [termsAccepted, setTermsAccepted] = useState<boolean>(
    mozUser ? Boolean(mozUser.termsAccepted) : false
  );

  // Real Firebase Phone Auth / OTP verification states
  const [otpStep, setOtpStep] = useState<'idle' | 'sending' | 'code_sent' | 'verifying' | 'verified'>(
    mozUser?.phoneVerified || Boolean(firebaseUser?.phoneNumber) ? 'verified' : 'idle'
  );
  const [otpCode, setOtpCode] = useState('');
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpCooldown, setOtpCooldown] = useState<number>(0);

  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Synchronize state when mozUser / firebaseUser loads or changes
  useEffect(() => {
    if (mozUser) {
      if (mozUser.displayName) setDisplayName(mozUser.displayName);
      if (mozUser.whatsapp || mozUser.phone) {
        setWhatsapp(mozUser.whatsapp || mozUser.phone || '');
      }
      if (mozUser.province) setProvince(mozUser.province);
      if (mozUser.district) setDistrict(mozUser.district);
      if (mozUser.neighborhood) setNeighborhood(mozUser.neighborhood);
      setTermsAccepted(Boolean(mozUser.termsAccepted));
      if (mozUser.phoneVerified) {
        setOtpStep('verified');
      }
    } else if (firebaseUser) {
      if (firebaseUser.displayName && !displayName) {
        setDisplayName(firebaseUser.displayName);
      }
      if (firebaseUser.phoneNumber && !whatsapp) {
        setWhatsapp(firebaseUser.phoneNumber);
        setOtpStep('verified');
      }
    }
  }, [mozUser, firebaseUser]);

  // Clean up RecaptchaVerifier on unmount
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {
          // Ignore cleanup errors
        }
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  // Resend cooldown timer (1 second tick via requestAnimationFrame)
  useEffect(() => {
    if (otpCooldown <= 0) return;
    let rafId: number;
    const start = performance.now();
    const tick = (now: number) => {
      if (now - start >= 1000) {
        setOtpCooldown((prev) => Math.max(0, prev - 1));
      } else {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [otpCooldown]);

  const provinces = getProvinces();
  const districts = province ? getDistrictsByProvince(province) : [];
  const neighborhoods =
    province && district ? getNeighborhoodsByDistrict(province, district) : [];

  const handleProvinceChange = (newProv: string) => {
    setProvince(newProv);
    setDistrict('');
    setNeighborhood('');
  };

  const handleDistrictChange = (newDist: string) => {
    setDistrict(newDist);
    setNeighborhood('');
  };

  const formatMozPhoneE164 = (raw: string): string | null => {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('258') && digits.length === 12) {
      return `+${digits}`;
    }
    if (digits.length === 9 && /^8[2-7]\d{7}$/.test(digits)) {
      return `+258${digits}`;
    }
    if (raw.trim().startsWith('+') && digits.length >= 10 && digits.length <= 15) {
      return `+${digits}`;
    }
    return null;
  };

  // Attempt WebOTP API automatic SMS code reading on supported mobile browsers
  const startWebOtpListener = () => {
    if (typeof window !== 'undefined' && 'OTPCredential' in window && navigator.credentials) {
      const abortController = new AbortController();
      navigator.credentials
        .get({
          // @ts-expect-error WebOTP API transport option
          otp: { transport: ['sms'] },
          signal: abortController.signal,
        })
        .then((credential: unknown) => {
          const otpCred = credential as { code?: string } | null;
          if (otpCred && otpCred.code) {
            setOtpCode(otpCred.code);
          }
        })
        .catch(() => {
          // User entered manually or browser aborted WebOTP
        });
    }
  };

  const handleVerifyOtpClick = async () => {
    setOtpError(null);
    setOtpMessage(null);

    if (otpCooldown > 0) {
      return;
    }

    if (!firebaseUser) {
      setOtpError('Entre com Google antes de verificar o número.');
      return;
    }

    const e164Phone = formatMozPhoneE164(whatsapp);
    if (!e164Phone) {
      setOtpError('Introduza um número válido de Moçambique (ex: +258 84 123 4567).');
      return;
    }

    setOtpStep('sending');
    try {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {
          // Ignore clear errors
        }
        recaptchaVerifierRef.current = null;
      }

      if (recaptchaContainerRef.current) {
        recaptchaContainerRef.current.innerHTML = '';
        recaptchaVerifierRef.current = new RecaptchaVerifier(
          auth,
          recaptchaContainerRef.current,
          { size: 'invisible' }
        );
      }

      if (!recaptchaVerifierRef.current) {
        throw new Error('Verificador reCAPTCHA não pôde ser inicializado.');
      }

      const confirmation = await linkWithPhoneNumber(
        firebaseUser,
        e164Phone,
        recaptchaVerifierRef.current
      );
      confirmationResultRef.current = confirmation;
      setOtpStep('code_sent');
      setOtpCooldown(60);
      setOtpMessage(`Código enviado para ${e164Phone}.`);
      startWebOtpListener();
    } catch (err: unknown) {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {
          // Ignore clear errors
        }
        recaptchaVerifierRef.current = null;
      }

      const firebaseErr = err as { code?: string; message?: string };
      if (firebaseErr.code === 'auth/provider-already-linked') {
        setOtpStep('verified');
        setOtpMessage('Número já verificado na sua conta.');
      } else if (firebaseErr.code === 'auth/credential-already-in-use') {
        setOtpStep('idle');
        setOtpError('Este número já está associado a outra conta.');
      } else if (
        firebaseErr.code === 'auth/operation-not-allowed' ||
        firebaseErr.code === 'auth/billing-not-enabled'
      ) {
        setOtpStep('idle');
        setOtpError(
          'O envio de SMS não está disponível de momento. Pode guardar o cadastro e verificar o número mais tarde.'
        );
      } else if (firebaseErr.code === 'auth/too-many-requests') {
        setOtpStep('idle');
        setOtpCooldown(60);
        setOtpError('Muitas tentativas. Aguarde 60 segundos antes de tentar novamente.');
      } else if (isUnauthorizedDomainError(err)) {
        setOtpStep('idle');
        setOtpError(formatFirebaseAuthError(err));
      } else {
        setOtpStep('idle');
        setOtpError(
          formatFirebaseAuthError(err) || 'Não foi possível enviar o SMS de verificação.'
        );
      }
    }
  };

  const handleConfirmOtpCode = async () => {
    setOtpError(null);
    const cleanCode = otpCode.trim();
    if (cleanCode.length < 6) {
      setOtpError('Introduza o código de 6 dígitos enviado por SMS.');
      return;
    }

    if (!confirmationResultRef.current) {
      setOtpError('Solicite primeiro o envio do código.');
      return;
    }

    setOtpStep('verifying');
    try {
      await confirmationResultRef.current.confirm(cleanCode);
      setOtpStep('verified');
      setOtpMessage('Número verificado com sucesso.');
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string; message?: string };
      if (
        firebaseErr.code === 'auth/credential-already-in-use' &&
        confirmationResultRef.current.verificationId
      ) {
        try {
          const cred = PhoneAuthProvider.credential(
            confirmationResultRef.current.verificationId,
            cleanCode
          );
          if (!firebaseUser) {
            await signInWithCredential(auth, cred);
            setOtpStep('verified');
            setOtpMessage('Número verificado com sucesso.');
            return;
          } else {
            setOtpStep('idle');
            setOtpError('Este número já está vinculado a outra conta.');
            return;
          }
        } catch {
          // Fall through
        }
      }
      setOtpStep('code_sent');
      setOtpError('Código inválido ou expirado.');
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!firebaseUser) {
      setFormError('Entre com Google antes de guardar o cadastro.');
      return;
    }

    const trimmedName = displayName.trim();
    if (trimmedName.length < 2) {
      setFormError('Indique o seu nome completo.');
      return;
    }

    const e164Phone = formatMozPhoneE164(whatsapp);
    if (!e164Phone) {
      setFormError('Indique um número de WhatsApp válido (ex: 84 123 4567).');
      return;
    }

    if (!termsAccepted) {
      setFormError('Aceite os Termos e Condições para guardar o cadastro.');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await saveUtenteRegistration({
        userId: firebaseUser.uid,
        displayName: trimmedName,
        whatsapp: e164Phone,
        province: province || '',
        district: district || '',
        neighborhood: neighborhood || '',
        termsAccepted: true,
        phoneVerifiedByAuth: Boolean(auth.currentUser?.phoneNumber || firebaseUser.phoneNumber),
      });

      onSaved(updated);
      setFormSuccess('Cadastro guardado com sucesso!');
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : 'Erro ao guardar o cadastro.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto pb-8">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Top bar */}
        <div className="bg-[#0D316E] px-5 py-4 text-white flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">
              Cadastro do Utente
            </h1>
            <p className="text-xs text-blue-100 mt-0.5">
              Entre para guardar os seus dados e consultar profissionais.
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Authentication & Compact Credit Section */}
          {!firebaseUser ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={onRequestGoogleLogin}
                className="w-full h-12 rounded-2xl border-2 border-[#0D316E] bg-white hover:bg-blue-50/60 active:scale-[0.99] transition-all flex items-center justify-center gap-3 px-4 shadow-xs"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 21.4 7.4 24 12 24z"
                  />
                </svg>
                <span className="text-[15px] font-extrabold text-[#0D316E]">
                  Entrar com Google
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Signed-in account pill */}
              <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-800 truncate">
                    {firebaseUser.email || firebaseUser.displayName}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 shrink-0">
                  Conta ativa
                </span>
              </div>

              {/* Compact Credit Section (only real user database state) */}
              {mozUser && (
                <div className="rounded-2xl bg-[#0D316E] text-white p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#E85B0D] flex items-center justify-center shrink-0">
                      <Coins className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold uppercase tracking-wide text-orange-300">
                        Saldo de consultas
                      </div>
                      <div className="text-xs text-blue-100">
                        1 consulta = 1 crédito (1 MT)
                      </div>
                      <div className="text-[11px] text-blue-200 mt-0.5 tabular-nums">
                        Consultas efectuadas: {mozUser.consultationsCount}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-extrabold tabular-nums">
                      {mozUser.creditsBalance}
                    </div>
                    <div className="text-[11px] text-blue-200 font-semibold">
                      créditos
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Invisible reCAPTCHA Mount Point */}
          <div ref={recaptchaContainerRef} className="hidden" />

          {/* Main Form */}
          <form onSubmit={handleSubmitForm} className="space-y-4">
            {/* 1. Nome completo */}
            <div className="space-y-1.5">
              <label
                htmlFor="utente-fullname"
                className="block text-sm font-extrabold text-[#0D316E]"
              >
                1. Nome completo
              </label>
              <input
                id="utente-fullname"
                type="text"
                required
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex: João Manuel Matsinhe"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E85B0D] focus:border-transparent"
              />
            </div>

            {/* 2. WhatsApp */}
            <div className="space-y-1.5">
              <label
                htmlFor="utente-whatsapp"
                className="block text-sm font-extrabold text-[#0D316E]"
              >
                2. WhatsApp
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  id="utente-whatsapp"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={whatsapp}
                  onChange={(e) => {
                    setWhatsapp(e.target.value);
                    if (otpStep === 'verified' && e.target.value !== firebaseUser?.phoneNumber) {
                      setOtpStep('idle');
                    }
                  }}
                  placeholder="+258 84 123 4567"
                  className="flex-1 h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E85B0D] focus:border-transparent"
                />

                <button
                  type="button"
                  onClick={handleVerifyOtpClick}
                  disabled={otpStep === 'sending' || otpCooldown > 0}
                  className={`h-11 px-4 rounded-xl font-extrabold text-xs shrink-0 transition-all flex items-center justify-center gap-1.5 ${
                    otpStep === 'verified'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#E85B0D] hover:bg-[#D14E07] text-white disabled:opacity-60'
                  }`}
                >
                  {otpStep === 'sending' ? (
                    'A enviar...'
                  ) : otpStep === 'verified' ? (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Verificado
                    </>
                  ) : otpCooldown > 0 ? (
                    `Aguarde (${otpCooldown}s)`
                  ) : (
                    'Verificar número'
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Confirme o número através do código de verificação.
              </p>

              {/* OTP Code Input Box when SMS was dispatched */}
              {(otpStep === 'code_sent' || otpStep === 'verifying') && (
                <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <label
                    htmlFor="utente-otp-code"
                    className="block text-xs font-bold text-[#0D316E] flex items-center gap-1.5"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-[#E85B0D]" />
                    Código SMS (6 dígitos)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="utente-otp-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="flex-1 h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm font-mono tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D316E]"
                    />
                    <button
                      type="button"
                      onClick={handleConfirmOtpCode}
                      disabled={otpStep === 'verifying'}
                      className="h-10 px-4 rounded-lg bg-[#0D316E] hover:bg-[#092452] text-white text-xs font-extrabold transition-colors disabled:opacity-50"
                    >
                      {otpStep === 'verifying' ? 'A validar...' : 'Confirmar'}
                    </button>
                  </div>
                </div>
              )}

              {otpMessage && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{otpMessage}</span>
                </div>
              )}

              {otpError && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>{otpError}</span>
                </div>
              )}
            </div>

            {/* 3. Localização (opcional) */}
            <div className="space-y-2">
              <label className="block text-sm font-extrabold text-[#0D316E]">
                3. Localização (opcional)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Província */}
                <div className="relative">
                  <select
                    aria-label="Província"
                    value={province}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="w-full h-11 pl-3 pr-8 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-[#E85B0D]"
                  >
                    <option value="">Província</option>
                    {provinces.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>

                {/* Distrito */}
                <div className="relative">
                  <select
                    aria-label="Distrito"
                    value={district}
                    disabled={!province}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full h-11 pl-3 pr-8 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-[#E85B0D] disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">Distrito</option>
                    {districts.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>

                {/* Bairro */}
                <div className="relative">
                  <select
                    aria-label="Bairro"
                    value={neighborhood}
                    disabled={!district}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full h-11 pl-3 pr-8 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-[#E85B0D] disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">Bairro</option>
                    {neighborhoods.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Terms Acceptance */}
            <div className="pt-1 flex items-start gap-2.5">
              <input
                id="utente-terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded border-slate-300 accent-[#E85B0D] cursor-pointer shrink-0"
              />
              <div className="text-xs leading-relaxed text-slate-800">
                <label htmlFor="utente-terms" className="cursor-pointer font-medium">
                  Aceito os Termos e Condições. Cada consulta custa 1 crédito (1 MT).
                </label>{' '}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-[#E85B0D] font-extrabold underline hover:text-[#C2410C]"
                >
                  Ler termos
                </button>
              </div>
            </div>

            {/* Feedback Messages */}
            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formSuccess}</span>
              </div>
            )}

            {/* Primary Action Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full h-12 rounded-2xl bg-[#E85B0D] hover:bg-[#D14E07] active:scale-[0.99] text-white text-base font-extrabold tracking-tight shadow-sm transition-all disabled:opacity-60"
              >
                {isSaving ? 'A guardar...' : 'Guardar cadastro'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-extrabold text-[#0D316E]">
                Termos e Condições — MozFácil
              </h3>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <p>
                <strong>1. Créditos de consulta:</strong> Na ativação da conta de utente são atribuídos
                100 créditos para utilização exclusiva na plataforma. Os créditos não constituem saldo
                monetário reembolsável.
              </p>
              <p>
                <strong>2. Custo por consulta:</strong> Cada consulta de contacto profissional custa
                1 crédito (1 MT). Consultas repetidas ao mesmo perfil não são cobradas novamente.
              </p>
              <p>
                <strong>3. Dados do utente:</strong> O utilizador compromete-se a indicar o seu nome e
                número de contacto válidos (+258).
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setTermsAccepted(true);
                  setShowTermsModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-[#E85B0D] text-white text-xs font-extrabold"
              >
                Aceitar e fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
