import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Camera,
  MapPin,
  LocateFixed,
  Plus,
  Trash2,
  CheckCircle2,
  PauseCircle,
  StopCircle,
  AlertCircle,
  Save,
  Send,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  Wrench,
  Image as ImageIcon,
  ShieldCheck,
  FileText,
  Smartphone,
} from 'lucide-react';
import {
  ConfirmationResult,
  RecaptchaVerifier,
  linkWithPhoneNumber,
  unlink,
} from 'firebase/auth';
import {
  auth,
  formatFirebasePhoneAuthError,
  validateMozambiquePhone,
} from '../firebase';
import {
  AvailabilitySchedule,
  AvailabilityStatus,
  CoverageAreaType,
  DeliveryMode,
  OperationalState,
  ProfessionalCategory,
  ProfessionalMedia,
  ProfessionalProfile,
  ProfessionalService,
  ProfileType,
  PublicationStatus,
  ServiceDeliveryMethod,
} from '../types/mozfacil';
import {
  getProvinces,
  getDistrictsByProvince,
  getLocalitiesByDistrict,
  getNeighborhoodsByDistrict,
} from '../data/mozambiqueLocations';
import {
  MediaInputItem,
  ScheduleInputItem,
  ServiceInputItem,
  proposeOrSelectCategory,
  saveProfessionalProfileComplete,
} from '../services/mozfacilService';
import { DynamicCategorySelector } from './DynamicCategorySelector';

interface ProfessionalRegistrationFormProps {
  currentUserId: string;
  currentUserName: string;
  currentUserEmail: string;
  currentUserEmailVerified: boolean;
  isAdmin: boolean;
  categories: ProfessionalCategory[];
  existingProfile?: ProfessionalProfile | null;
  existingServices?: ProfessionalService[];
  existingSchedules?: AvailabilitySchedule[];
  existingMedia?: ProfessionalMedia[];
  onSaved: (profileId: string) => void;
  onCancel: () => void;
}

const DEFAULT_SCHEDULES: ScheduleInputItem[] = [
  { dayOfWeek: 0, dayLabel: 'Segunda-feira', isOpen: true, openingTime: '07:30', closingTime: '17:30', notes: '' },
  { dayOfWeek: 1, dayLabel: 'Terça-feira', isOpen: true, openingTime: '07:30', closingTime: '17:30', notes: '' },
  { dayOfWeek: 2, dayLabel: 'Quarta-feira', isOpen: true, openingTime: '07:30', closingTime: '17:30', notes: '' },
  { dayOfWeek: 3, dayLabel: 'Quinta-feira', isOpen: true, openingTime: '07:30', closingTime: '17:30', notes: '' },
  { dayOfWeek: 4, dayLabel: 'Sexta-feira', isOpen: true, openingTime: '07:30', closingTime: '17:30', notes: '' },
  { dayOfWeek: 5, dayLabel: 'Sábado', isOpen: true, openingTime: '08:00', closingTime: '14:00', notes: '' },
  { dayOfWeek: 6, dayLabel: 'Domingo', isOpen: false, openingTime: '08:00', closingTime: '12:00', notes: 'Encerrado' },
];

const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_UPLOAD_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

async function compressImageFile(
  file: File,
  maxWidth = 480,
  quality = 0.72,
  maxChars = 240000
): Promise<string> {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type.toLowerCase())) {
    throw new Error(
      'Formato de ficheiro inválido. Utilize apenas imagens JPG, PNG ou WEBP.'
    );
  }
  if (file.size > MAX_UPLOAD_FILE_BYTES) {
    throw new Error(
      'O ficheiro excede o tamanho máximo permitido de 5 MB. Escolha uma imagem menor.'
    );
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        let currentWidth = maxWidth;
        let currentQuality = quality;

        for (let attempt = 0; attempt < 4; attempt++) {
          const scale = Math.min(1, currentWidth / img.width);
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Falha ao processar imagem.'));
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
          if (dataUrl.length <= maxChars) {
            resolve(dataUrl);
            return;
          }
          currentWidth = Math.round(currentWidth * 0.75);
          currentQuality = Math.max(0.4, currentQuality - 0.12);
        }

        reject(
          new Error(
            'A imagem é demasiado complexa após compressão. Selecione uma fotografia mais simples ou de menor resolução.'
          )
        );
      };
      img.onerror = () => reject(new Error('Ficheiro de imagem inválido ou corrompido.'));
      img.src = ev.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erro ao ler ficheiro.'));
    reader.readAsDataURL(file);
  });
}

export const ProfessionalRegistrationForm: React.FC<ProfessionalRegistrationFormProps> = ({
  currentUserId,
  currentUserName,
  currentUserEmail,
  currentUserEmailVerified,
  isAdmin,
  categories,
  existingProfile,
  existingServices = [],
  existingSchedules = [],
  existingMedia = [],
  onSaved,
  onCancel,
}) => {
  // Active Step (1 to 5) & Step Mode
  const [activeStep, setActiveStep] = useState<number>(1);
  const [viewAllSteps, setViewAllSteps] = useState<boolean>(false);
  const stepTabRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const formBodyScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const activeBtn = stepTabRefs.current[activeStep];
    if (activeBtn) {
      activeBtn.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
    if (formBodyScrollRef.current) {
      formBodyScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeStep]);

  // 1. Identification
  const [profileType, setProfileType] = useState<ProfileType>(
    existingProfile?.profileType || 'independent'
  );
  const [displayName, setDisplayName] = useState(existingProfile?.displayName || '');
  const [photoUrl, setPhotoUrl] = useState(existingProfile?.photoUrl || '');
  const [nuit, setNuit] = useState(existingProfile?.nuit || '');
  const [primaryCategoryId, setPrimaryCategoryId] = useState(
    existingProfile?.primaryCategoryId || ''
  );
  const [primaryCategoryName, setPrimaryCategoryName] = useState(
    existingProfile?.primaryCategoryName || ''
  );
  const [pendingProfessionText, setPendingProfessionText] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<{ id: string; name: string }[]>(
    () => {
      if (existingProfile?.specialtyIds && existingProfile?.specialtyNames) {
        return existingProfile.specialtyIds.map((id, i) => ({
          id,
          name: existingProfile.specialtyNames[i] || id,
        }));
      }
      return [];
    }
  );
  const [experienceYears, setExperienceYears] = useState<number>(
    existingProfile?.experienceYears ?? 0
  );
  const [description, setDescription] = useState(existingProfile?.description || '');

  // Activity-specific fields
  const [activityField1Value, setActivityField1Value] = useState(
    existingProfile?.activityField1Value || ''
  );
  const [activityField2Value, setActivityField2Value] = useState(
    existingProfile?.activityField2Value || ''
  );

  // 2. Responsible & Contact Info (Real verification status + Firebase Phone OTP)
  const [responsibleName, setResponsibleName] = useState(
    existingProfile?.responsibleName || currentUserName || ''
  );
  const [responsibleRole, setResponsibleRole] = useState(
    existingProfile?.responsibleRole || 'Proprietário'
  );
  const [phone, setPhone] = useState(existingProfile?.phone || '');
  const [whatsapp, setWhatsapp] = useState(existingProfile?.whatsapp || '');
  const [email, setEmail] = useState(existingProfile?.email || currentUserEmail || '');
  const [authorizedPublication, setAuthorizedPublication] = useState(
    existingProfile?.authorizedPublication ?? true
  );

  // Real Firebase SMS OTP state for Section 2
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpConfirmation, setOtpConfirmation] = useState<ConfirmationResult | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpGatewayFallbackNote, setOtpGatewayFallbackNote] = useState<string | null>(null);
  const [verifiedFirebasePhone, setVerifiedFirebasePhone] = useState<string>(
    () => auth.currentUser?.phoneNumber || ''
  );
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (auth.currentUser?.phoneNumber) {
      setVerifiedFirebasePhone(auth.currentUser.phoneNumber);
    }
  }, [auth.currentUser?.phoneNumber]);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setOtpCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [otpCooldown]);

  const phoneValidation = useMemo(() => validateMozambiquePhone(phone), [phone]);

  const isPhoneVerifiedByFirebase = Boolean(
    verifiedFirebasePhone &&
      ((phoneValidation.valid && phoneValidation.e164 === verifiedFirebasePhone) ||
        phone.trim() === verifiedFirebasePhone)
  );

  const isPhoneVerifiedByAdmin = Boolean(
    !isPhoneVerifiedByFirebase &&
      existingProfile?.phoneVerified &&
      existingProfile.phone.trim() !== '' &&
      existingProfile.phone.trim() === phone.trim()
  );

  const isPhoneActuallyVerified = isPhoneVerifiedByFirebase || isPhoneVerifiedByAdmin;
  const isSmsVerificationPending = Boolean(!isPhoneActuallyVerified && otpConfirmation !== null);

  const isEmailActuallyVerified = Boolean(
    currentUserEmailVerified &&
      currentUserEmail &&
      email.trim().toLowerCase() === currentUserEmail.toLowerCase()
  );

  // Cleanup reCAPTCHA on unmount
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

  // 3. Location & Service Coverage
  const provinces = useMemo(() => getProvinces(), []);
  const [province, setProvince] = useState(existingProfile?.province || 'Maputo Província');
  const availableDistricts = useMemo(() => getDistrictsByProvince(province), [province]);
  const [district, setDistrict] = useState(existingProfile?.district || 'Matola');
  const availableLocalities = useMemo(
    () => getLocalitiesByDistrict(province, district),
    [province, district]
  );
  const availableNeighborhoods = useMemo(
    () => getNeighborhoodsByDistrict(province, district),
    [province, district]
  );
  const [locality, setLocality] = useState(
    existingProfile?.locality ||
      getLocalitiesByDistrict('Maputo Província', 'Matola')[0] ||
      ''
  );
  const [neighborhood, setNeighborhood] = useState(
    existingProfile?.neighborhood ||
      getNeighborhoodsByDistrict('Maputo Província', 'Matola')[0] ||
      'Matola A'
  );
  const [streetOrReference, setStreetOrReference] = useState(
    existingProfile?.streetOrReference || ''
  );
  const [nearestStop, setNearestStop] = useState(existingProfile?.nearestStop || '');
  const [hasGps, setHasGps] = useState(existingProfile?.hasGps || false);
  const [latitude, setLatitude] = useState<number>(existingProfile?.latitude || 0);
  const [longitude, setLongitude] = useState<number>(existingProfile?.longitude || 0);
  const [gpsStatusMsg, setGpsStatusMsg] = useState<string | null>(null);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [coverageAreaType, setCoverageAreaType] = useState<CoverageAreaType>(
    existingProfile?.coverageAreaType || 'district'
  );
  const [coverageLocations, setCoverageLocations] = useState(
    existingProfile?.coverageLocations || ''
  );
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>(
    existingProfile?.deliveryMode || 'both'
  );

  // 4. Operational State & Working Hours
  const [operationalState, setOperationalState] = useState<OperationalState>(
    existingProfile?.operationalState || 'on'
  );
  const [openingTime, setOpeningTime] = useState(existingProfile?.openingTime || '07:30');
  const [closingTime, setClosingTime] = useState(existingProfile?.closingTime || '17:30');
  const [workingDaysSummary, setWorkingDaysSummary] = useState(
    existingProfile?.workingDaysSummary || 'Segunda a Sábado: 07:30 – 17:30'
  );
  const [showDetailedSchedule, setShowDetailedSchedule] = useState(false);
  const [schedules, setSchedules] = useState<ScheduleInputItem[]>(() => {
    if (existingSchedules.length > 0) {
      return [...existingSchedules]
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
        .map((s) => ({
          dayOfWeek: s.dayOfWeek,
          dayLabel: s.dayLabel,
          isOpen: s.isOpen,
          openingTime: s.openingTime,
          closingTime: s.closingTime,
          notes: s.notes,
        }));
    }
    return DEFAULT_SCHEDULES;
  });

  // 5. Individual Services & Media
  const [services, setServices] = useState<ServiceInputItem[]>(() => {
    if (existingServices.length > 0) {
      return existingServices.map((s) => ({
        id: s.id,
        serviceName: s.serviceName,
        description: s.description,
        conditions: s.conditions,
        price: s.price,
        hasFixedPrice: s.hasFixedPrice,
        deliveryMethod: s.deliveryMethod,
        availabilityStatus: s.availabilityStatus,
      }));
    }
    return [
      {
        serviceName: '',
        description: '',
        conditions: '',
        price: 0,
        hasFixedPrice: false,
        deliveryMethod: 'both',
        availabilityStatus: 'available',
      },
    ];
  });

  const [mediaItems, setMediaItems] = useState<MediaInputItem[]>(() => {
    if (existingMedia.length > 0) {
      return existingMedia.map((m) => ({
        id: m.id,
        fileType: m.fileType,
        caption: m.caption,
        storageRef: m.storageRef,
      }));
    }
    return [];
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync dependent province -> district selector
  useEffect(() => {
    const districts = getDistrictsByProvince(province);
    if (districts.length > 0 && !districts.includes(district)) {
      const nextDist = districts[0];
      setDistrict(nextDist);
    }
  }, [province]);

  // Active category object for dynamic activity-specific fields
  const activeCategoryObj = useMemo(() => {
    return categories.find((c) => c.id === primaryCategoryId) || null;
  }, [categories, primaryCategoryId]);

  const handleRequestPhoneOtp = async () => {
    if (isSendingOtp || otpCooldown > 0) return;
    setOtpError(null);
    setOtpNotice(null);
    setOtpGatewayFallbackNote(null);

    const validation = validateMozambiquePhone(phone);
    if (!validation.valid) {
      setOtpError(
        validation.error ||
          'Introduza um número de telefone válido de Moçambique (+258 82/83/84/85/86/87 XXX XXXX).'
      );
      return;
    }

    if (!auth.currentUser) {
      setOtpError('Inicie sessão na sua conta antes de solicitar o código SMS de verificação.');
      return;
    }

    // If this exact E.164 phone is already verified on the current Firebase user token
    if (auth.currentUser.phoneNumber === validation.e164) {
      try {
        await auth.currentUser.getIdToken(true);
      } catch {
        // Ignore offline refresh error
      }
      setVerifiedFirebasePhone(validation.e164);
      setOtpConfirmation(null);
      setOtpNotice(
        `O número ${validation.formattedDisplay} já se encontra verificado pelo Firebase na sua conta.`
      );
      return;
    }

    setIsSendingOtp(true);
    try {
      // If a different phone number was previously linked, unlink the old phone provider first
      if (
        auth.currentUser.providerData.some((p) => p.providerId === 'phone') &&
        auth.currentUser.phoneNumber !== validation.e164
      ) {
        try {
          await unlink(auth.currentUser, 'phone');
          setVerifiedFirebasePhone('');
        } catch {
          // Proceed if provider was already unlinked
        }
      }

      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {
          // Ignore clear error
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
        throw new Error('Não foi possível inicializar o verificador reCAPTCHA na página.');
      }

      const result = await linkWithPhoneNumber(
        auth.currentUser,
        validation.e164,
        recaptchaVerifierRef.current
      );
      setOtpConfirmation(result);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpCooldown(60);
      setOtpNotice(
        `Código SMS enviado para ${validation.formattedDisplay}. Introduza os 6 dígitos recebidos abaixo.`
      );

      // Optional WebOTP API auto-read if supported by mobile browser
      if (typeof window !== 'undefined' && 'OTPCredential' in window && navigator.credentials) {
        try {
          const abortCtrl = new AbortController();
          navigator.credentials
            .get({
              // @ts-expect-error WebOTP API option
              otp: { transport: ['sms'] },
              signal: abortCtrl.signal,
            })
            .then((cred: unknown) => {
              const code = (cred as { code?: string })?.code;
              if (code && /^\d{6}$/.test(code)) {
                setOtpDigits(code.split('').slice(0, 6));
              }
            })
            .catch(() => {
              // Ignore WebOTP abort/unsupported
            });
        } catch {
          // Ignore WebOTP fallback
        }
      }
    } catch (err: unknown) {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {
          // Ignore reCAPTCHA clear error
        }
        recaptchaVerifierRef.current = null;
      }
      setOtpConfirmation(null);

      const formattedErr = formatFirebasePhoneAuthError(err);
      if (
        formattedErr.code === 'auth/provider-already-linked' &&
        auth.currentUser?.phoneNumber === validation.e164
      ) {
        setVerifiedFirebasePhone(validation.e164);
        setOtpNotice(
          `O número ${validation.formattedDisplay} já está verificado pelo Firebase na sua conta.`
        );
      } else {
        setOtpError(formattedErr.userMessage);
        if (formattedErr.isGatewayConfigIssue) {
          setOtpGatewayFallbackNote(
            'Pode guardar ou submeter o seu Perfil Profissional com o estado "Contacto não verificado"; o perfil ficará identificado como não verificado por SMS e sujeito a revisão administrativa.'
          );
        }
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleConfirmOtpDigits = async () => {
    const code = otpDigits.join('').trim();
    if (!otpConfirmation) {
      setOtpError('Solicite primeiro o envio do código SMS clicando em "Enviar código".');
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setOtpError('Introduza os 6 dígitos numéricos do código SMS recebido.');
      return;
    }
    setIsVerifyingOtp(true);
    setOtpError(null);
    setOtpGatewayFallbackNote(null);
    try {
      await otpConfirmation.confirm(code);
      if (auth.currentUser) {
        try {
          await auth.currentUser.getIdToken(true);
          await auth.currentUser.reload();
        } catch {
          // Ignore offline reload warning
        }
      }
      const verifiedE164 =
        auth.currentUser?.phoneNumber ||
        (phoneValidation.valid ? phoneValidation.e164 : phone.trim());
      setVerifiedFirebasePhone(verifiedE164);
      setOtpConfirmation(null);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpNotice('Contacto telefónico verificado com sucesso pelo Firebase (SMS).');
    } catch (err: unknown) {
      const formattedErr = formatFirebasePhoneAuthError(err);
      setOtpError(formattedErr.userMessage);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleOtpDigitChange = (idx: number, val: string) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[idx] = clean;
    setOtpDigits(next);
    if (clean && idx < 5) {
      digitRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      digitRefs.current[idx - 1]?.focus();
    }
  };

  const handleRequestGps = () => {
    if (!navigator.geolocation) {
      setGpsStatusMsg(
        'O seu navegador não suporta geolocalização. Preencha a localização manualmente abaixo.'
      );
      return;
    }
    setIsLocatingGps(true);
    setGpsStatusMsg('A obter coordenadas GPS do dispositivo...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setHasGps(true);
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        setIsLocatingGps(false);
        setGpsStatusMsg(
          `Localização GPS registada com sucesso (${pos.coords.latitude.toFixed(
            4
          )}, ${pos.coords.longitude.toFixed(4)}).`
        );
      },
      (err) => {
        setIsLocatingGps(false);
        setHasGps(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatusMsg(
            'Permissão de GPS negada. Pode continuar o registo preenchendo a Província, Distrito e Bairro manualmente.'
          );
        } else {
          setGpsStatusMsg(
            'Não foi possível captar o sinal GPS agora. O registo manual permanece disponível.'
          );
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setValidationError(null);
    try {
      const compressed = await compressImageFile(file, 420, 0.72, 240000);
      setPhotoUrl(compressed);
    } catch (err) {
      e.target.value = '';
      setValidationError(
        err instanceof Error ? err.message : 'Erro ao processar fotografia de perfil.'
      );
    }
  };

  const handleAddMediaPhoto = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: 'work_photo' | 'certificate',
    customCaption?: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setValidationError(null);
    try {
      const compressed = await compressImageFile(file, 520, 0.7, 280000);
      setMediaItems((prev) => [
        ...prev,
        {
          fileType,
          caption:
            customCaption ||
            (fileType === 'work_photo'
              ? 'Foto de trabalho / atividade'
              : 'Certificado / Documento'),
          storageRef: compressed,
        },
      ]);
    } catch (err) {
      e.target.value = '';
      setValidationError(err instanceof Error ? err.message : 'Erro ao carregar ficheiro.');
    }
  };

  const handleAddServiceRow = () => {
    setServices((prev) => [
      ...prev,
      {
        serviceName: '',
        description: '',
        conditions: '',
        price: 0,
        hasFixedPrice: false,
        deliveryMethod: 'both',
        availabilityStatus: 'available',
      },
    ]);
  };

  const handleUpdateServiceRow = (index: number, patch: Partial<ServiceInputItem>) => {
    setServices((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const handleRemoveServiceRow = (index: number) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (targetPublicationStatus: PublicationStatus) => {
    setValidationError(null);

    if (displayName.trim().length < 1) {
      setValidationError('Indique pelo menos o Nome do Profissional / Serviço para guardar.');
      return;
    }

    let resolvedCategoryId = primaryCategoryId;
    let resolvedCategoryName = primaryCategoryName;

    // Auto-resolve typed category if user typed in the search box without clicking the suggestion first
    if (!resolvedCategoryId && pendingProfessionText.trim().length >= 2) {
      try {
        const autoCat = await proposeOrSelectCategory({
          rawName: pendingProfessionText.trim(),
          categoryType: 'profession',
          actorId: currentUserId,
          actorName: currentUserName || displayName.trim(),
          isAdmin,
        });
        resolvedCategoryId = autoCat.id;
        resolvedCategoryName = autoCat.originalName;
        setPrimaryCategoryId(autoCat.id);
        setPrimaryCategoryName(autoCat.originalName);
        setPendingProfessionText('');
      } catch (catErr) {
        setValidationError(
          catErr instanceof Error
            ? catErr.message
            : 'Não foi possível validar a categoria digitada.'
        );
        return;
      }
    }

    // Deduplicate services by normalized name + deliveryMethod
    const seenServiceKeys = new Set<string>();
    const deduplicatedServices: ServiceInputItem[] = [];
    for (const s of services) {
      const trimmedName = s.serviceName.trim();
      if (trimmedName.length < 2) continue;
      const key = `${trimmedName.toLowerCase()}|${s.deliveryMethod}`;
      if (!seenServiceKeys.has(key)) {
        seenServiceKeys.add(key);
        deduplicatedServices.push({
          ...s,
          serviceName: trimmedName,
        });
      }
    }

    const isPublishing =
      targetPublicationStatus === 'published' || targetPublicationStatus === 'pending_review';

    if (isPublishing) {
      if (displayName.trim().length < 2) {
        setValidationError('Por favor, preencha o Nome do Profissional / Serviço (mínimo 2 caracteres).');
        return;
      }
      if (!resolvedCategoryId || !resolvedCategoryName) {
        setValidationError(
          'Por favor, selecione uma Categoria Profissional ou digite uma nova.'
        );
        return;
      }
      if (phone.trim().length < 6) {
        setValidationError('Por favor, indique um número de telefone de contacto válido.');
        return;
      }
      if (!province || !district || !neighborhood.trim()) {
        setValidationError(
          'Por favor, indique a Província, Distrito e Bairro de localização.'
        );
        return;
      }
      if (!authorizedPublication) {
        setValidationError(
          'Deve confirmar a declaração de responsabilidade e autorização de publicação no MozFácil.'
        );
        return;
      }

      // If no service row was manually typed yet, auto-seed the primary service from the category name
      if (deduplicatedServices.length === 0 && resolvedCategoryName) {
        deduplicatedServices.push({
          serviceName: `Atendimento de ${resolvedCategoryName}`,
          description: description.trim() || `Serviços de ${resolvedCategoryName}`,
          conditions: '',
          price: 0,
          hasFixedPrice: false,
          deliveryMethod: 'both',
          availabilityStatus: 'available',
        });
      }

      if (deduplicatedServices.length === 0) {
        setValidationError(
          'Adicione pelo menos 1 serviço individual com nome (mínimo 2 caracteres) antes de publicar ou submeter.'
        );
        return;
      }

      // Validate main opening/closing time range
      if (openingTime && closingTime && openingTime >= closingTime) {
        setValidationError(
          'A Hora de Fecho geral deve ser posterior à Hora de Abertura (ex: 07:30 às 17:30).'
        );
        return;
      }

      // Validate per-day schedule time ranges
      for (const sched of schedules) {
        if (sched.isOpen && sched.openingTime && sched.closingTime && sched.openingTime >= sched.closingTime) {
          setValidationError(
            `No horário de ${sched.dayLabel}, a hora de fecho (${sched.closingTime}) deve ser posterior à hora de abertura (${sched.openingTime}).`
          );
          return;
        }
      }

      const resolvedCatObj =
        categories.find((c) => c.id === resolvedCategoryId) || activeCategoryObj;

      if (
        resolvedCatObj?.activityField1Required &&
        resolvedCatObj.activityField1Label &&
        !activityField1Value.trim()
      ) {
        setValidationError(
          `O campo específico "${resolvedCatObj.activityField1Label}" é obrigatório para esta categoria.`
        );
        return;
      }
      if (
        resolvedCatObj?.activityField2Required &&
        resolvedCatObj.activityField2Label &&
        !activityField2Value.trim()
      ) {
        setValidationError(
          `O campo específico "${resolvedCatObj.activityField2Label}" é obrigatório para esta categoria.`
        );
        return;
      }
    }

    const availabilityStatus: AvailabilityStatus =
      operationalState === 'on' ? 'available' : 'unavailable';

    setIsSaving(true);
    try {
      const savedId = await saveProfessionalProfileComplete({
        profileId: existingProfile?.id,
        ownerId: currentUserId,
        actorName: currentUserName || displayName.trim(),
        profileType,
        displayName: displayName.trim(),
        responsibleName: responsibleName.trim() || displayName.trim(),
        responsibleRole: responsibleRole.trim(),
        nuit: nuit.trim(),
        photoUrl,
        primaryCategoryId: resolvedCategoryId,
        primaryCategoryName: resolvedCategoryName,
        specialties: selectedSpecialties,
        experienceYears,
        description: description.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        email: email.trim(),
        authorizedPublication,
        province,
        district,
        locality: locality.trim(),
        neighborhood: neighborhood.trim(),
        streetOrReference: streetOrReference.trim(),
        nearestStop: nearestStop.trim(),
        hasGps,
        latitude,
        longitude,
        coverageAreaType,
        coverageLocations: coverageLocations.trim(),
        deliveryMode,
        availabilityStatus,
        operationalState,
        workingDaysSummary: workingDaysSummary.trim(),
        openingTime,
        closingTime,
        activityField1Label: activeCategoryObj?.activityField1Label || '',
        activityField1Value: activityField1Value.trim(),
        activityField2Label: activeCategoryObj?.activityField2Label || '',
        activityField2Value: activityField2Value.trim(),
        publicationStatus: targetPublicationStatus,
        rejectionReason:
          targetPublicationStatus === 'draft' || targetPublicationStatus === 'pending_review'
            ? ''
            : existingProfile?.rejectionReason || '',
        services: deduplicatedServices,
        schedules,
        mediaItems,
      });

      onSaved(savedId);
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : 'Ocorreu um erro ao guardar o perfil.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const professionalSteps = [
    { num: 1, title: 'Foto e Dados do Profissional', shortLabel: 'Identificação' },
    { num: 2, title: 'Responsável, Contacto e SMS', shortLabel: 'Contacto e SMS' },
    { num: 3, title: 'Localização, GPS e Cobertura', shortLabel: 'Localização e GPS' },
    { num: 4, title: 'Estado dos Serviços e Horário', shortLabel: 'Estado e Horário' },
    { num: 5, title: 'Fotos, Documentos e Serviços', shortLabel: 'Fotos e Serviços' },
  ];

  const currentStepMeta =
    professionalSteps.find((s) => s.num === activeStep) || professionalSteps[0];

  return (
    <div className="max-w-2xl w-full mx-auto h-full flex-1 min-h-0 bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col overflow-hidden">
      {/* Container for real Firebase Phone Auth reCAPTCHA */}
      <div ref={recaptchaContainerRef} id="mozfacil-prof-recaptcha" aria-hidden="true" />

      {/* ================================================================= */}
      {/* TOP DARK NAVY HEADER BANNER WITH STEP PROGRESS (SHRINK-0)         */}
      {/* ================================================================= */}
      <div className="shrink-0 bg-gradient-to-b from-[#071F4A] via-[#0B2B64] to-[#0E3578] text-white px-3 sm:px-5 pt-2.5 pb-2.5 border-b border-blue-900">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[36px] sm:min-h-[40px] px-2.5 sm:px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 active:scale-[0.98] border border-white/15 flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-white transition-all shrink-0"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Voltar</span>
          </button>

          {/* Center Brand & Title */}
          <div className="min-w-0 flex-1 text-center px-1">
            <h2 className="text-xs sm:text-base font-black tracking-tight text-white truncate">
              {existingProfile
                ? 'Editar Perfil Profissional'
                : 'Cadastrar Profissional / Serviço'}
            </h2>
            <p className="text-[10.5px] sm:text-[11px] text-blue-200 font-semibold truncate">
              {viewAllSteps ? 'Visualização completa (5 secções)' : currentStepMeta.title}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-1.5">
            {existingProfile && (
              <span className="hidden sm:inline-block text-[10px] bg-white/15 px-2 py-0.5 rounded-full text-orange-300 font-bold">
                {existingProfile.publicationStatus === 'published'
                  ? 'Publicado'
                  : existingProfile.publicationStatus === 'draft'
                  ? 'Rascunho'
                  : existingProfile.publicationStatus === 'pending_review'
                  ? 'Revisão'
                  : existingProfile.publicationStatus === 'rejected'
                  ? 'Rejeitado'
                  : 'Suspenso'}
              </span>
            )}
            <span className="text-[10.5px] sm:text-[11px] font-extrabold px-2.5 py-0.5 sm:py-1 rounded-full bg-[#EA580C] text-white whitespace-nowrap shrink-0 shadow-2xs tabular-nums">
              Passo {activeStep} de 5
            </span>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="mt-2 h-1.5 w-full bg-white/15 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#F97316] to-[#FB923C] rounded-full transition-all duration-300"
            style={{ width: `${viewAllSteps ? 100 : (activeStep / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Horizontal Scrollable Step Carousel with Full Step Names (SHRINK-0) */}
      <div className="shrink-0 bg-slate-50 border-b border-slate-200 px-2.5 sm:px-3 py-2 overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 min-w-max">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {professionalSteps.map((s) => {
              const isActive = !viewAllSteps && activeStep === s.num;
              const isCompleted = !viewAllSteps && s.num < activeStep;
              return (
                <button
                  key={s.num}
                  ref={(el) => {
                    stepTabRefs.current[s.num] = el;
                  }}
                  type="button"
                  onClick={() => {
                    setViewAllSteps(false);
                    setActiveStep(s.num);
                  }}
                  className={`min-h-[36px] sm:min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap shrink-0 flex items-center gap-1.5 sm:gap-2 transition-all active:scale-[0.98] ${
                    isActive
                      ? 'bg-[#0D316E] text-white shadow-xs ring-2 ring-[#0D316E]/20'
                      : isCompleted
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100/70'
                      : 'bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center shrink-0 tabular-nums ${
                      isActive
                        ? 'bg-[#F97316] text-white'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isCompleted ? '✓' : s.num}
                  </span>
                  <span>{s.shortLabel}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setViewAllSteps((prev) => !prev)}
            className={`min-h-[36px] sm:min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] font-extrabold whitespace-nowrap shrink-0 border transition-all ${
              viewAllSteps
                ? 'bg-[#EA580C] text-white border-[#EA580C]'
                : 'bg-white text-[#0D316E] border-slate-200 hover:bg-slate-100'
            }`}
          >
            {viewAllSteps ? 'Modo por Passos' : 'Ver Tudo'}
          </button>
        </div>
      </div>

      {/* Internal Self-Contained Scrollable Form Body */}
      <div
        ref={formBodyScrollRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3.5 sm:p-5 space-y-4 bg-[#F1F5F9]"
      >
        {validationError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Atenção aos dados do formulário:</p>
              <p>{validationError}</p>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* SECTION 1: FOTO E DADOS DO PROFISSIONAL / SERVIÇO                 */}
        {/* ================================================================= */}
        {(viewAllSteps || activeStep === 1) && (
        <section className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
            <span className="w-6 h-6 rounded-full bg-[#EA580C] text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
              1
            </span>
            <h3 className="text-sm sm:text-base font-extrabold text-[#0D316E]">
              Foto e Dados do Profissional / Serviço
            </h3>
          </div>

          {/* Left Photo Box + Right Core Fields matching reference print */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch">
            {/* Square Photo Upload Tile */}
            <label className="w-full sm:w-32 min-h-[136px] rounded-xl border-2 border-dashed border-blue-300 bg-[#F0F6FF] hover:bg-blue-50 flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden shrink-0 relative">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Foto do profissional"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="p-2.5 text-center">
                  <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-1.5">
                    <Camera className="w-6 h-6 text-[#1E4B9B]" />
                  </div>
                  <span className="text-xs font-bold text-[#0D316E] block leading-tight">
                    Adicionar logo / foto
                  </span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePhotoUpload}
                className="hidden"
              />
            </label>

            <div className="w-full sm:flex-1 space-y-3.5">
              <div>
                <label className="block text-xs font-extrabold text-[#0D316E] mb-1.5">
                  Nome do Profissional / Serviço <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ex: Dr. António Machava / Mestre João Auto"
                  className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#EA580C]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-[#0D316E] mb-1.5 flex items-center justify-between">
                    <span>NUIT</span>
                    <span className="text-[10px] font-normal text-slate-400">Opcional</span>
                  </label>
                  <input
                    type="text"
                    value={nuit}
                    onChange={(e) => setNuit(e.target.value)}
                    placeholder="Ex: 123456789"
                    className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#EA580C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#0D316E] mb-1.5">
                    Experiência (Anos)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={80}
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value) || 0)}
                    className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
              </div>

              {/* Compact Profile Type Pills */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                  Modalidade de Registo
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { value: 'independent', label: 'Independente' },
                      { value: 'service_provider', label: 'Prestador' },
                      { value: 'street_vendor', label: 'Ambulante' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setProfileType(item.value)}
                      className={`min-h-[42px] py-2 px-2.5 rounded-xl border text-xs font-extrabold text-center transition-all ${
                        profileType === item.value
                          ? 'bg-[#0D316E] text-white border-[#0D316E]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-[#0D316E]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Category & Specialties Selector */}
          <DynamicCategorySelector
            categories={categories}
            selectedCategoryId={primaryCategoryId}
            selectedCategoryName={primaryCategoryName}
            onSelectCategory={(cat) => {
              setPrimaryCategoryId(cat.id);
              setPrimaryCategoryName(cat.originalName);
              setPendingProfessionText('');
              setServices((prev) => {
                if (prev.length > 0 && prev[0].serviceName.trim() === '') {
                  const next = [...prev];
                  next[0] = {
                    ...next[0],
                    serviceName: `Atendimento de ${cat.originalName}`,
                  };
                  return next;
                }
                return prev;
              });
            }}
            onPendingProfessionChange={setPendingProfessionText}
            selectedSpecialties={selectedSpecialties}
            onChangeSpecialties={setSelectedSpecialties}
            actorId={currentUserId}
            actorName={currentUserName}
            isAdmin={isAdmin}
          />

          {/* Dynamic Activity-Specific Fields */}
          {(activeCategoryObj?.activityField1Label || activeCategoryObj?.activityField2Label) && (
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
              <div className="text-xs font-bold text-[#0D316E]">
                Detalhes Específicos da Atividade ({activeCategoryObj.originalName})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeCategoryObj.activityField1Label && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {activeCategoryObj.activityField1Label}
                      {activeCategoryObj.activityField1Required && (
                        <span className="text-red-500"> *</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={activityField1Value}
                      onChange={(e) => setActivityField1Value(e.target.value)}
                      placeholder={
                        activeCategoryObj.activityField1Placeholder || 'Preencha se aplicável'
                      }
                      className="w-full min-h-[48px] h-12 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                )}
                {activeCategoryObj.activityField2Label && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {activeCategoryObj.activityField2Label}
                      {activeCategoryObj.activityField2Required && (
                        <span className="text-red-500"> *</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={activityField2Value}
                      onChange={(e) => setActivityField2Value(e.target.value)}
                      placeholder={
                        activeCategoryObj.activityField2Placeholder || 'Preencha se aplicável'
                      }
                      className="w-full min-h-[48px] h-12 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-extrabold text-[#0D316E] mb-1.5">
              Resumo da Experiência e Atividade Profissional
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva brevemente a sua experiência, especialidades e garantias de atendimento..."
              className="w-full min-h-[92px] p-3.5 text-sm bg-white border border-slate-300 rounded-xl leading-relaxed focus:outline-none focus:border-[#EA580C]"
            />
          </div>
        </section>
        )}

        {/* ================================================================= */}
        {/* SECTION 2: RESPONSÁVEL E AUTORIZAÇÃO (MATCHING REFERENCE PRINT)   */}
        {/* ================================================================= */}
        {(viewAllSteps || activeStep === 2) && (
        <section className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
            <span className="w-6 h-6 rounded-full bg-[#EA580C] text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
              2
            </span>
            <h3 className="text-sm sm:text-base font-extrabold text-[#0D316E]">
              Responsável e Autorização
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-extrabold text-[#0D316E] mb-1.5">
                Nome do Responsável <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={responsibleName}
                onChange={(e) => setResponsibleName(e.target.value)}
                placeholder="Ex: João Silva"
                className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#EA580C]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#0D316E] mb-1.5">
                Função <span className="text-red-500">*</span>
              </label>
              <select
                value={responsibleRole}
                onChange={(e) => setResponsibleRole(e.target.value)}
                className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#EA580C]"
              >
                <option value="Proprietário">Proprietário</option>
                <option value="Titular / Profissional">Titular / Profissional Independente</option>
                <option value="Responsável Técnico">Responsável Técnico</option>
                <option value="Vendedor Móvel">Vendedor Ambulante / Móvel</option>
              </select>
            </div>
          </div>

          {/* Contact Phone + "Enviar código" Button matching reference print */}
          <div>
            <label className="block text-xs font-extrabold text-[#0D316E] mb-1.5">
              Contacto do Responsável <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
              <div className="w-full sm:flex-1 flex items-center bg-white border border-slate-300 rounded-xl overflow-hidden focus-within:border-[#EA580C]">
                <span className="px-3.5 min-h-[48px] h-12 flex items-center bg-slate-100 text-xs sm:text-sm font-bold text-slate-700 border-r border-slate-300 shrink-0">
                  🇲🇿 +258
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setOtpError(null);
                    setOtpGatewayFallbackNote(null);
                    if (otpConfirmation) {
                      setOtpConfirmation(null);
                      setOtpDigits(['', '', '', '', '', '']);
                      setOtpNotice(null);
                    }
                  }}
                  placeholder="84 123 4567"
                  className="flex-1 min-h-[48px] h-12 px-3.5 py-2.5 text-sm focus:outline-none"
                />
              </div>

              <button
                type="button"
                disabled={isSendingOtp || otpCooldown > 0 || isPhoneVerifiedByFirebase}
                onClick={handleRequestPhoneOtp}
                className="min-h-[48px] h-12 px-4 py-2.5 rounded-xl bg-[#1E4B9B] hover:bg-[#0D316E] text-white font-extrabold text-xs sm:text-sm shrink-0 transition-colors disabled:opacity-50 shadow-xs"
              >
                {isSendingOtp
                  ? 'A enviar...'
                  : isPhoneVerifiedByFirebase
                  ? 'Verificado'
                  : otpCooldown > 0
                  ? `Reenviar (${otpCooldown}s)`
                  : 'Enviar código'}
              </button>
            </div>
          </div>

          {/* 6-Digit SMS Code Boxes — displayed ONLY after Firebase initiates SMS (otpConfirmation !== null) */}
          <div className="space-y-2.5">
            {otpConfirmation && !isPhoneActuallyVerified && (
              <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="text-xs font-extrabold text-[#0D316E]">Código SMS</span>
                  <span className="text-[11px] text-slate-500">
                    Digite o código de 6 dígitos recebido por SMS
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="grid grid-cols-6 gap-2 w-full sm:flex-1 max-w-xs">
                    {otpDigits.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          digitRefs.current[i] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        autoComplete={i === 0 ? 'one-time-code' : 'off'}
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        aria-label={`Dígito ${i + 1} do código SMS`}
                        className="w-full min-h-[48px] h-12 text-center font-extrabold text-base bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#EA580C]"
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={isVerifyingOtp}
                    onClick={handleConfirmOtpDigits}
                    className="min-h-[48px] h-12 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shrink-0 disabled:opacity-50"
                  >
                    {isVerifyingOtp ? 'A validar...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            )}

            {otpNotice && (
              <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 font-medium">
                {otpNotice}
              </p>
            )}
            {otpError && (
              <div className="text-[11px] text-red-800 bg-red-50 border border-red-200 rounded-lg px-2.5 py-2 space-y-1">
                <p className="font-semibold flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                  <span>{otpError}</span>
                </p>
                {otpGatewayFallbackNote && (
                  <p className="text-slate-700 bg-white/80 border border-red-100 rounded px-2 py-1 text-[10px]">
                    {otpGatewayFallbackNote}
                  </p>
                )}
              </div>
            )}

            {/* Explicit 4-state contact verification indicator */}
            <div className="text-[11px] flex items-center gap-1.5 pt-0.5">
              {isPhoneVerifiedByFirebase ? (
                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-bold inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Estado: Contacto verificado pelo Firebase (SMS)</span>
                </span>
              ) : isPhoneVerifiedByAdmin ? (
                <span className="text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md font-bold inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Estado: Contacto verificado pela administração</span>
                </span>
              ) : isSmsVerificationPending ? (
                <span className="text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md font-bold inline-flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 shrink-0" />
                  <span>Estado: Verificação por SMS pendente (aguarda confirmação do código)</span>
                </span>
              ) : (
                <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md font-medium inline-flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    Estado: Contacto não verificado (aguarda verificação por SMS ou revisão administrativa)
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Optional WhatsApp & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div>
              <label className="block text-xs font-extrabold text-[#0D316E] mb-1.5">
                WhatsApp (Chat Direto)
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ex: +258 84 123 4567"
                className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#EA580C]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#0D316E] mb-1.5">
                Email (Opcional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: profissional@email.com"
                className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#EA580C]"
              />
              {isEmailActuallyVerified && (
                <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
                  ✓ Email autenticado via Google
                </span>
              )}
            </div>
          </div>

          {/* Authorization Checkbox matching reference print */}
          <label className="flex items-start gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={authorizedPublication}
              onChange={(e) => setAuthorizedPublication(e.target.checked)}
              className="w-4 h-4 mt-0.5 accent-[#EA580C] rounded shrink-0"
            />
            <span className="text-xs font-bold text-slate-700 leading-snug">
              Declaro que sou o responsável e autorizo a publicação dos dados no MozFácil.
            </span>
          </label>
        </section>
        )}

        {/* ================================================================= */}
        {/* SECTION 3: LOCALIZAÇÃO (MATCHING REFERENCE PRINT)                 */}
        {/* ================================================================= */}
        {(viewAllSteps || activeStep === 3) && (
        <section className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
            <span className="w-6 h-6 rounded-full bg-[#EA580C] text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
              3
            </span>
            <h3 className="text-sm sm:text-base font-extrabold text-[#0D316E]">
              Localização
            </h3>
          </div>

          {/* Orange GPS Button matching reference print */}
          <div>
            <button
              type="button"
              disabled={isLocatingGps}
              onClick={handleRequestGps}
              className="w-full min-h-[48px] h-12 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <LocateFixed className="w-4 h-4" />
              <span>
                {isLocatingGps
                  ? 'A obter coordenadas GPS...'
                  : hasGps
                  ? `Localização GPS Ativa (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
                  : 'Usar minha localização (GPS)'}
              </span>
            </button>
            {gpsStatusMsg && (
              <p className="text-[11px] text-slate-600 mt-1.5 px-1">{gpsStatusMsg}</p>
            )}
          </div>

          {/* 2-Column Dependent Province & District Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-extrabold text-[#0D316E] mb-1.5">
                Província <span className="text-red-500">*</span>
              </label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full min-h-[48px] h-12 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#EA580C]"
              >
                {provinces.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#0D316E] mb-1.5">
                Distrito <span className="text-red-500">*</span>
              </label>
              <select
                value={district}
                onChange={(e) => {
                  const nextDist = e.target.value;
                  setDistrict(nextDist);
                  const locs = getLocalitiesByDistrict(province, nextDist);
                  if (locs.length > 0) setLocality(locs[0]);
                  const neighs = getNeighborhoodsByDistrict(province, nextDist);
                  if (neighs.length > 0) setNeighborhood(neighs[0]);
                }}
                className="w-full min-h-[48px] h-12 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#EA580C]"
              >
                {availableDistricts.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2-Column Locality & Neighborhood */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-extrabold text-[#0D316E] mb-1.5">
                Localidade
              </label>
              <input
                type="text"
                list="moz-localities-list"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="Selecione ou digite..."
                className="w-full min-h-[48px] h-12 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#EA580C]"
              />
              <datalist id="moz-localities-list">
                {availableLocalities.map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#0D316E] mb-1.5">
                Bairro <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                list="moz-neighborhoods-list"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Selecione ou digite..."
                className="w-full min-h-[48px] h-12 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#EA580C]"
              />
              <datalist id="moz-neighborhoods-list">
                {availableNeighborhoods.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#0D316E] mb-1.5">
              Rua / Avenida
            </label>
            <input
              type="text"
              value={streetOrReference}
              onChange={(e) => setStreetOrReference(e.target.value)}
              placeholder="Ex: Av. das Indústrias, 123"
              className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#0D316E] mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span>Paragem e referências próximas</span>
            </label>
            <input
              type="text"
              value={nearestStop}
              onChange={(e) => setNearestStop(e.target.value)}
              placeholder="Ex: Perto do Mercado da Matola, perto da Farmácia"
              className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          {/* Service Coverage Area & Delivery Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div>
              <label className="block text-xs font-extrabold text-[#0D316E] mb-1.5">
                Área de Cobertura
              </label>
              <select
                value={coverageAreaType}
                onChange={(e) => setCoverageAreaType(e.target.value as CoverageAreaType)}
                className="w-full min-h-[48px] h-12 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#EA580C]"
              >
                <option value="neighborhood">Apenas no Meu Bairro</option>
                <option value="district">Todo o Distrito ({district})</option>
                <option value="province">Toda a Província ({province})</option>
                <option value="selected_locations">Bairros / Zonas Selecionadas</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#0D316E] mb-1.5">
                Modalidade de Atendimento
              </label>
              <select
                value={deliveryMode}
                onChange={(e) => setDeliveryMode(e.target.value as DeliveryMode)}
                className="w-full min-h-[48px] h-12 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#EA580C]"
              >
                <option value="both">No Local e ao Domicílio</option>
                <option value="customer_location">Ao Domicílio do Cliente</option>
                <option value="professional_location">No Meu Estabelecimento / Oficina</option>
                <option value="mobile_route">Vendedor / Rota Móvel</option>
              </select>
            </div>
          </div>

          {coverageAreaType === 'selected_locations' && (
            <div>
              <label className="block text-xs font-extrabold text-[#0D316E] mb-1.5">
                Zonas / Bairros Abrangidos
              </label>
              <input
                type="text"
                value={coverageLocations}
                onChange={(e) => setCoverageLocations(e.target.value)}
                placeholder={`Ex: ${neighborhood || 'Bairro'}, ${district} e arredores`}
                className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#EA580C]"
              />
            </div>
          )}
        </section>
        )}

        {/* ================================================================= */}
        {/* SECTION 4: ESTADO DOS SERVIÇOS E HORÁRIO (MATCHING REFERENCE)     */}
        {/* ================================================================= */}
        {(viewAllSteps || activeStep === 4) && (
        <section className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
            <span className="w-6 h-6 rounded-full bg-[#EA580C] text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
              4
            </span>
            <h3 className="text-sm sm:text-base font-extrabold text-[#0D316E]">
              Estado dos serviços
            </h3>
          </div>

          {/* ON / OFF / STOP Pills matching reference print */}
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setOperationalState('on')}
              className="text-center focus:outline-none"
            >
              <div
                className={`min-h-[44px] rounded-full font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
                  operationalState === 'on'
                    ? 'bg-emerald-600 text-white ring-3 ring-emerald-200 shadow-xs'
                    : 'bg-emerald-600/80 text-white opacity-60 hover:opacity-90'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ON</span>
              </div>
              <span className="block text-[11px] font-bold text-slate-700 mt-1">
                A funcionar
              </span>
            </button>

            <button
              type="button"
              onClick={() => setOperationalState('off')}
              className="text-center focus:outline-none"
            >
              <div
                className={`min-h-[44px] rounded-full font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
                  operationalState === 'off'
                    ? 'bg-slate-600 text-white ring-3 ring-slate-300 shadow-xs'
                    : 'bg-slate-400 text-white opacity-75 hover:opacity-100'
                }`}
              >
                <PauseCircle className="w-4 h-4" />
                <span>OFF</span>
              </div>
              <span className="block text-[11px] font-bold text-slate-700 mt-1">
                Indisponível
              </span>
            </button>

            <button
              type="button"
              onClick={() => setOperationalState('stop')}
              className="text-center focus:outline-none"
            >
              <div
                className={`min-h-[44px] rounded-full font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
                  operationalState === 'stop'
                    ? 'bg-red-600 text-white ring-3 ring-red-200 shadow-xs'
                    : 'bg-red-600/85 text-white opacity-65 hover:opacity-95'
                }`}
              >
                <StopCircle className="w-4 h-4" />
                <span>STOP</span>
              </div>
              <span className="block text-[11px] font-bold text-slate-700 mt-1">
                Parado no momento
              </span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-xs font-extrabold text-[#0D316E] mb-1.5">
                Hora de Abertura
              </label>
              <input
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                className="w-full min-h-[48px] h-12 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-[#0D316E] mb-1.5">
                Hora de Fecho
              </label>
              <input
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                className="w-full min-h-[48px] h-12 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-extrabold text-[#0D316E] mb-1.5">
                Resumo de Horário
              </label>
              <input
                type="text"
                value={workingDaysSummary}
                onChange={(e) => setWorkingDaysSummary(e.target.value)}
                placeholder="Seg–Sáb: 07:30 – 17:30"
                className="w-full min-h-[48px] h-12 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowDetailedSchedule((prev) => !prev)}
              className="text-xs font-extrabold text-[#1E4B9B] hover:text-[#EA580C] flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {showDetailedSchedule
                  ? 'Ocultar horário semanal detalhado'
                  : 'Configurar horário semanal por dia (Segunda a Domingo)'}
              </span>
            </button>

            {showDetailedSchedule && (
              <div className="mt-2.5 space-y-2 border border-slate-200 rounded-xl p-3.5 bg-slate-50">
                {schedules.map((sched, idx) => (
                  <div
                    key={sched.dayOfWeek}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center py-2 border-b border-slate-200/70 last:border-0"
                  >
                    <label className="sm:col-span-4 flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sched.isOpen}
                        onChange={(e) => {
                          const updated = [...schedules];
                          updated[idx] = { ...sched, isOpen: e.target.checked };
                          setSchedules(updated);
                        }}
                        className="w-4 h-4 accent-emerald-600"
                      />
                      <span>{sched.dayLabel}</span>
                    </label>
                    {sched.isOpen ? (
                      <>
                        <div className="sm:col-span-3 flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-500">Das</span>
                          <input
                            type="time"
                            value={sched.openingTime}
                            onChange={(e) => {
                              const updated = [...schedules];
                              updated[idx] = { ...sched, openingTime: e.target.value };
                              setSchedules(updated);
                            }}
                            className="min-h-[42px] px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div className="sm:col-span-3 flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-500">às</span>
                          <input
                            type="time"
                            value={sched.closingTime}
                            onChange={(e) => {
                              const updated = [...schedules];
                              updated[idx] = { ...sched, closingTime: e.target.value };
                              setSchedules(updated);
                            }}
                            className="min-h-[42px] px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div className="sm:col-span-2 text-right">
                          <span className="text-[11px] text-emerald-700 font-semibold">
                            Aberto
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="sm:col-span-8 text-xs text-slate-400 italic">
                        Encerrado neste dia
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
        )}

        {/* ================================================================= */}
        {/* SECTION 5: FOTOS, DOCUMENTOS E SERVIÇOS (MATCHING REFERENCE)      */}
        {/* ================================================================= */}
        {(viewAllSteps || activeStep === 5) && (
        <section className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
            <span className="w-6 h-6 rounded-full bg-[#EA580C] text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
              5
            </span>
            <h3 className="text-sm sm:text-base font-extrabold text-[#0D316E]">
              Fotos, Vídeo e Documentos
            </h3>
          </div>

          {/* 3 Compact Horizontal Upload Tiles matching reference print */}
          <div className="grid grid-cols-3 gap-2.5">
            <label className="p-3 rounded-xl border border-slate-300 bg-[#F8FAFC] hover:bg-blue-50 flex flex-col items-center text-center gap-1 cursor-pointer transition-colors">
              <ImageIcon className="w-6 h-6 text-[#1E4B9B]" />
              <span className="text-[11px] font-extrabold text-[#0D316E] leading-tight">
                Fotos de trabalho
              </span>
              <span className="text-[10px] font-semibold text-blue-600">
                Adicionar fotos
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleAddMediaPhoto(e, 'work_photo', 'Foto de trabalho')}
                className="hidden"
              />
            </label>

            <label className="p-3 rounded-xl border border-slate-300 bg-[#F8FAFC] hover:bg-blue-50 flex flex-col items-center text-center gap-1 cursor-pointer transition-colors">
              <ShieldCheck className="w-6 h-6 text-[#1E4B9B]" />
              <span className="text-[11px] font-extrabold text-[#0D316E] leading-tight">
                Certificado / Alvará
              </span>
              <span className="text-[10px] font-semibold text-blue-600">
                Adicionar doc.
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleAddMediaPhoto(e, 'certificate', 'Certificado / Alvará')}
                className="hidden"
              />
            </label>

            <label className="p-3 rounded-xl border border-slate-300 bg-[#F8FAFC] hover:bg-blue-50 flex flex-col items-center text-center gap-1 cursor-pointer transition-colors">
              <FileText className="w-6 h-6 text-[#1E4B9B]" />
              <span className="text-[11px] font-extrabold text-[#0D316E] leading-tight">
                NUIT (Opcional)
              </span>
              <span className="text-[10px] font-semibold text-blue-600">
                Adicionar doc.
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleAddMediaPhoto(e, 'certificate', 'Comprovativo NUIT')}
                className="hidden"
              />
            </label>
          </div>

          {mediaItems.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {mediaItems.map((m, idx) => (
                <div
                  key={m.id || idx}
                  className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 h-20 group"
                >
                  <img
                    src={m.storageRef}
                    alt={m.caption}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setMediaItems((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-xs"
                    title="Remover ficheiro"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Individual Services Management */}
          <div className="pt-2 border-t border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-[#EA580C]" />
                <span className="text-xs sm:text-sm font-extrabold text-[#0D316E]">
                  Serviços Oferecidos e Preços ({services.length})
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddServiceRow}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#0D316E] hover:bg-[#092452] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Serviço</span>
              </button>
            </div>

            <div className="space-y-3">
              {services.map((srv, idx) => (
                <div
                  key={srv.id || idx}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#0D316E]">
                      Serviço #{idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateServiceRow(idx, {
                            availabilityStatus:
                              srv.availabilityStatus === 'available'
                                ? 'unavailable'
                                : 'available',
                          })
                        }
                        className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-colors ${
                          srv.availabilityStatus === 'available'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-400 text-white'
                        }`}
                      >
                        {srv.availabilityStatus === 'available' ? 'ON · Ativo' : 'OFF · Pausado'}
                      </button>
                      {services.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveServiceRow(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          title="Remover serviço"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nome do Serviço <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={srv.serviceName}
                        onChange={(e) =>
                          handleUpdateServiceRow(idx, { serviceName: e.target.value })
                        }
                        placeholder="Ex: Consultas Gerais / Revisão Auto"
                        className="w-full min-h-[48px] h-12 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Preço em MT (0 = Sob Consulta)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={srv.price}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          handleUpdateServiceRow(idx, {
                            price: val,
                            hasFixedPrice: val > 0,
                          });
                        }}
                        placeholder="Ex: 1500"
                        className="w-full min-h-[48px] h-12 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Descrição / Detalhe
                      </label>
                      <input
                        type="text"
                        value={srv.description}
                        onChange={(e) =>
                          handleUpdateServiceRow(idx, { description: e.target.value })
                        }
                        placeholder="Ex: Atendimento a adultos e crianças"
                        className="w-full min-h-[48px] h-12 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Modalidade de Entrega
                      </label>
                      <select
                        value={srv.deliveryMethod}
                        onChange={(e) =>
                          handleUpdateServiceRow(idx, {
                            deliveryMethod: e.target.value as ServiceDeliveryMethod,
                          })
                        }
                        className="w-full min-h-[48px] h-12 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl"
                      >
                        <option value="both">No Local e ao Domicílio</option>
                        <option value="customer_location">Ao Domicílio do Cliente</option>
                        <option value="professional_location">No Estabelecimento / Oficina</option>
                        <option value="remote">Remoto / Teleconsulta</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Review Submission Box (no duplicate primary publish button collision) */}
          <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="min-w-0 flex-1">
              <span className="font-extrabold text-[#0D316E] block">
                Pronto para publicar no diretório MozFácil?
              </span>
              <span className="text-[11px] text-slate-600">
                Use o botão <strong>Publicar Perfil</strong> na barra inferior ou submeta à revisão administrativa.
              </span>
            </div>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSubmit('pending_review')}
              className="min-h-[38px] py-1.5 px-3 rounded-xl bg-[#0D316E] hover:bg-[#092452] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submeter à Revisão</span>
            </button>
          </div>
        </section>
        )}
      </div>

      {/* Docked Bottom Step Navigation & Submission Bar (SHRINK-0 — Never Clips Fields) */}
      <div className="shrink-0 bg-white border-t border-slate-200 px-3.5 sm:px-5 py-2.5 shadow-[0_-4px_16px_rgba(13,49,110,0.06)] flex items-center justify-between gap-2">
        <div>
          {!viewAllSteps && activeStep > 1 ? (
            <button
              type="button"
              onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
              className="min-h-[42px] px-3.5 sm:px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 text-xs sm:text-sm font-extrabold flex items-center gap-1.5 transition-all"
            >
              <ChevronLeft className="w-4 h-4 shrink-0" />
              <span>Anterior</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-600 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span>Cancelar</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSubmit('draft')}
            className="min-h-[42px] px-3 sm:px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 active:scale-[0.98] text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Guardar progresso como rascunho"
          >
            <Save className="w-3.5 h-3.5 text-[#0D316E] shrink-0" />
            <span className="hidden min-[380px]:inline">Rascunho</span>
          </button>

          {!viewAllSteps && activeStep < 5 ? (
            <button
              type="button"
              onClick={() => setActiveStep((prev) => Math.min(5, prev + 1))}
              className="min-h-[42px] px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-[#0D316E] to-[#1E4B9B] hover:from-[#092452] hover:to-[#0D316E] active:scale-[0.98] text-white text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all shadow-sm"
            >
              <span>Próximo Passo</span>
              <ChevronRight className="w-4 h-4 shrink-0" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSubmit('published')}
              className="min-h-[42px] px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] active:scale-[0.98] text-white text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
            >
              <Send className="w-4 h-4 shrink-0" />
              <span>
                {isSaving
                  ? 'A guardar...'
                  : existingProfile
                  ? 'Guardar e Publicar'
                  : 'Publicar Perfil'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
