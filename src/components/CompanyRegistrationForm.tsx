import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Building2,
  MapPin,
  LocateFixed,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  Briefcase,
  Image as ImageIcon,
  ShieldCheck,
  FileText,
  Smartphone,
  Film,
  Lock,
} from 'lucide-react';
import {
  AvailabilityStatus,
  CompanyCategory,
  CompanyDocument,
  CompanyDocType,
  CompanyEntityType,
  CompanyMedia,
  CompanyProfile,
  CompanySchedule,
  CompanyService,
  OperationalState,
  PublicationStatus,
} from '../types/mozfacil';
import {
  getProvinces,
  getDistrictsByProvince,
} from '../data/mozambiqueLocations';
import {
  SaveCompanyPayload,
  proposeOrSelectCompanyCategory,
  saveCompanyProfileComplete,
} from '../services/mozfacilService';
import { validateMozambiquePhone } from '../firebase';

interface CompanyMediaInput {
  storageRef: string;
  mediaType?: 'image' | 'video';
  caption?: string;
  displayOrder?: number;
}

interface CompanyDocumentInput {
  docType: CompanyDocType;
  title: string;
  storageRef: string;
  fileHash?: string;
}

interface CompanyScheduleInput {
  dayOfWeek: number;
  dayLabel: string;
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
}

interface CompanyServiceInput {
  name: string;
  description?: string;
  basePrice?: number;
  availabilityStatus: AvailabilityStatus;
  displayOrder?: number;
}

interface CompanyRegistrationFormProps {
  categories: CompanyCategory[];
  currentUserId: string;
  initialCompany?: CompanyProfile | null;
  initialServices?: CompanyService[];
  initialSchedules?: CompanySchedule[];
  initialMedia?: CompanyMedia[];
  initialDocuments?: CompanyDocument[];
  onBack: () => void;
  onSaved: (companyId: string) => void;
}

const DEFAULT_DAYS = [
  { day: 1, label: 'Segunda-feira' },
  { day: 2, label: 'Terça-feira' },
  { day: 3, label: 'Quarta-feira' },
  { day: 4, label: 'Quinta-feira' },
  { day: 5, label: 'Sexta-feira' },
  { day: 6, label: 'Sábado' },
  { day: 0, label: 'Domingo' },
];

export const CompanyRegistrationForm: React.FC<CompanyRegistrationFormProps> = ({
  categories,
  currentUserId,
  initialCompany,
  initialServices = [],
  initialSchedules = [],
  initialMedia = [],
  initialDocuments = [],
  onBack,
  onSaved,
}) => {
  // Active Section Tab (1 to 5)
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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

  // Section 1: Identification
  const [tradeName, setTradeName] = useState(initialCompany?.tradeName || '');
  const [legalName, setLegalName] = useState(initialCompany?.legalName || '');
  const [nuit, setNuit] = useState(initialCompany?.nuit || '');
  const [entityType, setEntityType] = useState<CompanyEntityType>(
    initialCompany?.entityType || 'private_company'
  );
  const [foundationYear, setFoundationYear] = useState<string>(
    initialCompany?.foundationYear ? String(initialCompany.foundationYear) : ''
  );
  const [description, setDescription] = useState(initialCompany?.description || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initialCompany?.primaryCategoryId || (categories[0]?.id || '')
  );
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isProposingCategory, setIsProposingCategory] = useState(false);

  // Section 2: Contact & Representative
  const [responsibleName, setResponsibleName] = useState(
    initialCompany?.responsibleName || ''
  );
  const [responsibleRole, setResponsibleRole] = useState(
    initialCompany?.responsibleRole || ''
  );
  const [phone, setPhone] = useState(initialCompany?.phone || '');
  const [whatsapp, setWhatsapp] = useState(initialCompany?.whatsapp || '');
  const [email, setEmail] = useState(initialCompany?.email || '');
  const [website, setWebsite] = useState(initialCompany?.website || '');
  const [phoneVerified, setPhoneVerified] = useState(
    initialCompany?.phoneVerified || false
  );

  // Section 3: Physical Location
  const provinces = useMemo(() => getProvinces(), []);
  const [province, setProvince] = useState(
    initialCompany?.province || provinces[0] || 'Maputo Cidade'
  );
  const districts = useMemo(() => getDistrictsByProvince(province), [province]);
  const [district, setDistrict] = useState(
    initialCompany?.district || (districts[0] || 'KaMpfumo')
  );
  const [neighborhood, setNeighborhood] = useState(
    initialCompany?.neighborhood || ''
  );
  const [streetOrReference, setStreetOrReference] = useState(
    initialCompany?.streetOrReference || ''
  );
  const [nearestStop, setNearestStop] = useState(
    initialCompany?.nearestStop || ''
  );
  const [latitude, setLatitude] = useState<string>(
    initialCompany?.latitude != null ? String(initialCompany.latitude) : ''
  );
  const [longitude, setLongitude] = useState<string>(
    initialCompany?.longitude != null ? String(initialCompany.longitude) : ''
  );
  const [hasGps, setHasGps] = useState(initialCompany?.hasGps || false);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Update district when province changes
  useEffect(() => {
    if (!districts.includes(district)) {
      setDistrict(districts[0] || '');
    }
  }, [province, districts, district]);

  // Section 4: Media, Logo, Video & Verification Documents
  const [logoUrl, setLogoUrl] = useState(initialCompany?.logoUrl || '');
  const [videoUrl, setVideoUrl] = useState(initialCompany?.videoUrl || '');
  const [mediaList, setMediaList] = useState<CompanyMediaInput[]>(
    initialMedia.length > 0
      ? initialMedia.map((m) => ({
          storageRef: m.storageRef,
          mediaType: m.mediaType || (m.fileType === 'video' ? 'video' : 'image'),
          caption: m.caption,
          displayOrder: m.displayOrder || 1,
        }))
      : []
  );
  const [documentsList, setDocumentsList] = useState<CompanyDocumentInput[]>(
    initialDocuments.length > 0
      ? initialDocuments.map((d) => ({
          docType: d.docType,
          title: d.title,
          storageRef: d.storageRef,
          fileHash: d.fileHash,
        }))
      : []
  );
  const [tempPhotoUrl, setTempPhotoUrl] = useState('');
  const [tempPhotoCaption, setTempPhotoCaption] = useState('');

  // Temp Doc
  const [tempDocType, setTempDocType] = useState<CompanyDocType>('alvara');
  const [tempDocTitle, setTempDocTitle] = useState('');
  const [tempDocRef, setTempDocRef] = useState('');

  // Section 5: Operating Hours & Services
  const [schedules, setSchedules] = useState<CompanyScheduleInput[]>(() => {
    if (initialSchedules.length > 0) {
      return initialSchedules.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        dayLabel: s.dayLabel,
        isOpen: s.isOpen,
        openingTime: s.openingTime,
        closingTime: s.closingTime,
      }));
    }
    return DEFAULT_DAYS.map((d) => ({
      dayOfWeek: d.day,
      dayLabel: d.label,
      isOpen: d.day !== 0,
      openingTime: '08:00',
      closingTime: '17:00',
    }));
  });

  const [servicesList, setServicesList] = useState<CompanyServiceInput[]>(
    initialServices.length > 0
      ? initialServices.map((s) => ({
          name: s.name || s.serviceName,
          description: s.description || '',
          basePrice: s.basePrice || s.price,
          availabilityStatus: s.availabilityStatus,
          displayOrder: s.displayOrder || 1,
        }))
      : [
          {
            name: 'Atendimento Geral',
            description: 'Serviço de atendimento institucional e ao cliente',
            availabilityStatus: 'available',
            displayOrder: 1,
          },
        ]
  );
  const [tempServiceName, setTempServiceName] = useState('');
  const [tempServiceDesc, setTempServiceDesc] = useState('');
  const [tempServicePrice, setTempServicePrice] = useState('');

  const [operationalState, setOperationalState] = useState<OperationalState>(
    initialCompany?.operationalState || 'on'
  );
  const [termsAccepted, setTermsAccepted] = useState(Boolean(initialCompany));

  // Category Proposing / Selecting
  const handleCreateCategoryProposal = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const cat = await proposeOrSelectCompanyCategory({
        rawName: newCategoryName.trim(),
        actorId: currentUserId,
        actorName: responsibleName.trim() || 'Titular',
        isAdmin: false,
      });
      setSelectedCategoryId(cat.id);
      setIsProposingCategory(false);
      setNewCategoryName('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao criar categoria.');
    }
  };

  // GPS Geolocation Handler
  const handleCaptureGps = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('Geolocalização não é suportada pelo seu navegador.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setHasGps(true);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        setGpsError('Não foi possível obter a sua localização GPS automática.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Photos List handlers
  const handleAddPhoto = () => {
    if (!tempPhotoUrl.trim()) return;
    setMediaList((prev) => [
      ...prev,
      {
        storageRef: tempPhotoUrl.trim(),
        mediaType: 'image',
        caption: tempPhotoCaption.trim() || undefined,
        displayOrder: prev.length + 1,
      },
    ]);
    setTempPhotoUrl('');
    setTempPhotoCaption('');
  };

  const handleRemovePhoto = (index: number) => {
    setMediaList((prev) => prev.filter((_, i) => i !== index));
  };

  // Documents List handlers
  const handleAddDocument = () => {
    if (!tempDocRef.trim() || !tempDocTitle.trim()) return;
    setDocumentsList((prev) => [
      ...prev,
      {
        docType: tempDocType,
        title: tempDocTitle.trim(),
        storageRef: tempDocRef.trim(),
      },
    ]);
    setTempDocTitle('');
    setTempDocRef('');
  };

  const handleRemoveDocument = (index: number) => {
    setDocumentsList((prev) => prev.filter((_, i) => i !== index));
  };

  // Services List handlers
  const handleAddService = () => {
    if (!tempServiceName.trim()) return;
    setServicesList((prev) => [
      ...prev,
      {
        name: tempServiceName.trim(),
        description: tempServiceDesc.trim() || undefined,
        basePrice: tempServicePrice ? Number(tempServicePrice) : undefined,
        availabilityStatus: 'available',
        displayOrder: prev.length + 1,
      },
    ]);
    setTempServiceName('');
    setTempServiceDesc('');
    setTempServicePrice('');
  };

  const handleRemoveService = (index: number) => {
    setServicesList((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = async (targetStatus: PublicationStatus) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    if (!tradeName.trim()) {
      setErrorMessage('Por favor, informe o Nome Comercial da empresa.');
      setActiveStep(1);
      return;
    }
    if (!legalName.trim()) {
      setErrorMessage('Por favor, informe a Denominação Social / Razão Social.');
      setActiveStep(1);
      return;
    }
    if (!nuit.trim() || nuit.replace(/\D/g, '').length < 9) {
      setErrorMessage('Por favor, informe um NUIT válido com 9 dígitos moçambicanos.');
      setActiveStep(1);
      return;
    }
    if (!selectedCategoryId) {
      setErrorMessage('Por favor, selecione uma Categoria Empresarial.');
      setActiveStep(1);
      return;
    }
    if (!responsibleName.trim()) {
      setErrorMessage('Por favor, informe o Nome do Responsável ou Representante.');
      setActiveStep(2);
      return;
    }
    const phoneValid = validateMozambiquePhone(phone);
    if (!phoneValid.valid) {
      setErrorMessage(`Telefone principal inválido: ${phoneValid.error}`);
      setActiveStep(2);
      return;
    }
    if (!neighborhood.trim()) {
      setErrorMessage('Por favor, indique o Bairro onde a entidade se localiza.');
      setActiveStep(3);
      return;
    }
    if (targetStatus === 'published' && !termsAccepted) {
      setErrorMessage('Deve aceitar os Termos e Condições para publicar a empresa.');
      setActiveStep(5);
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedCat = categories.find((c) => c.id === selectedCategoryId);
      const catName = selectedCat ? (selectedCat.name || selectedCat.originalName) : 'Geral Empresarial';

      const payload: SaveCompanyPayload = {
        companyId: initialCompany?.id,
        ownerId: currentUserId,
        actorName: responsibleName.trim() || 'Titular',
        entityType,
        officialName: legalName.trim(),
        displayName: tradeName.trim(),
        nuit: nuit.trim(),
        primaryCategoryId: selectedCategoryId,
        primaryCategoryName: catName,
        subcategory: '',
        description: description.trim(),
        logoUrl: logoUrl.trim(),
        photoUrl: mediaList[0]?.storageRef || logoUrl.trim(),
        videoUrl: videoUrl.trim(),
        responsibleName: responsibleName.trim(),
        responsibleRole: responsibleRole.trim(),
        phone: phoneValid.e164,
        whatsapp: whatsapp.trim() ? (validateMozambiquePhone(whatsapp).valid ? validateMozambiquePhone(whatsapp).e164 : phoneValid.e164) : phoneValid.e164,
        email: email.trim(),
        authorizedPublication: termsAccepted,
        province,
        district,
        locality: '',
        neighborhood: neighborhood.trim(),
        streetOrReference: streetOrReference.trim(),
        nearestStop: nearestStop.trim(),
        hasGps,
        latitude: latitude ? parseFloat(latitude) : 0,
        longitude: longitude ? parseFloat(longitude) : 0,
        operationalState,
        workingDaysSummary: 'Segunda a Sábado',
        openingTime: '08:00',
        closingTime: '17:00',
        publicationStatus: targetStatus,
        services: servicesList.map((s) => ({
          serviceName: s.name,
          description: s.description || '',
          conditions: '',
          price: s.basePrice || 0,
          hasFixedPrice: Boolean(s.basePrice),
          deliveryMethod: 'both' as const,
          availabilityStatus: s.availabilityStatus,
        })),
        schedules: schedules.map((sch) => ({
          dayOfWeek: sch.dayOfWeek,
          dayLabel: sch.dayLabel,
          isOpen: sch.isOpen,
          openingTime: sch.openingTime,
          closingTime: sch.closingTime,
          notes: '',
        })),
        mediaItems: mediaList.map((m) => ({
          fileType: 'work_photo' as const,
          caption: m.caption || '',
          storageRef: m.storageRef,
        })),
        documents: documentsList.map((d) => ({
          docType: d.docType,
          title: d.title,
          fileName: d.title,
          storageRef: d.storageRef,
          verificationStatus: 'pending' as const,
        })),
      };

      const resultId = await saveCompanyProfileComplete(payload);
      setSuccessMessage('Empresa guardada com sucesso!');
      setTimeout(() => {
        onSaved(resultId);
      }, 700);
    } catch (err: any) {
      console.error('Erro ao guardar perfil da empresa:', err);
      setErrorMessage(err.message || 'Erro ao processar dados no Firestore.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const companySteps = [
    { num: 1, title: 'Identificação Institucional', shortLabel: 'Identificação' },
    { num: 2, title: 'Contacto e Responsável', shortLabel: 'Contacto e SMS' },
    { num: 3, title: 'Localização e GPS', shortLabel: 'Localização e GPS' },
    { num: 4, title: 'Fotos e Documentos', shortLabel: 'Fotos e Documentos' },
    { num: 5, title: 'Horários e Serviços', shortLabel: 'Horários e Serviços' },
  ];

  const currentStepMeta = companySteps.find((s) => s.num === activeStep) || companySteps[0];

  return (
    <div className="max-w-3xl w-full mx-auto h-full flex-1 min-h-0 bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col overflow-hidden">
      {/* Structured Mobile-First Top App Bar (SHRINK-0) */}
      <div className="shrink-0 bg-gradient-to-r from-[#071F4A] via-[#0D316E] to-[#1E4B9B] px-3 sm:px-5 pt-2.5 pb-2.5 text-white border-b border-blue-900/80">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[36px] sm:min-h-[40px] px-2.5 sm:px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 active:scale-[0.98] border border-white/15 flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-white transition-all shrink-0"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Voltar</span>
          </button>

          <div className="min-w-0 flex-1 text-center px-1">
            <h2 className="text-xs sm:text-base font-black text-white leading-tight truncate">
              {initialCompany ? 'Editar Empresa / Instituição' : 'Registo de Empresa ou Instituição'}
            </h2>
            <p className="text-[10.5px] sm:text-[11px] text-blue-200 font-semibold truncate">
              {currentStepMeta.title}
            </p>
          </div>

          <span className="text-[10.5px] sm:text-[11px] font-extrabold px-2.5 py-0.5 sm:py-1 rounded-full bg-[#EA580C] text-white whitespace-nowrap shrink-0 shadow-2xs tabular-nums">
            Passo {activeStep} de 5
          </span>
        </div>

        {/* Linear Step Progress Bar */}
        <div className="mt-2 h-1.5 w-full bg-white/15 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#F97316] to-[#FB923C] rounded-full transition-all duration-300"
            style={{ width: `${(activeStep / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Horizontal Scrollable Step Carousel with Full Step Names (SHRINK-0) */}
      <div className="shrink-0 bg-slate-50 border-b border-slate-200 px-2.5 sm:px-3 py-2 overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
          {companySteps.map((s) => {
            const isActive = activeStep === s.num;
            const isCompleted = s.num < activeStep;
            return (
              <button
                key={s.num}
                ref={(el) => {
                  stepTabRefs.current[s.num] = el;
                }}
                type="button"
                onClick={() => setActiveStep(s.num)}
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
      </div>

      {/* Internal Self-Contained Scrollable Form Body */}
      <div
        ref={formBodyScrollRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3.5 sm:p-5 space-y-4"
      >
        {/* Alerts */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {/* ================= STEP 1: IDENTIFICAÇÃO ================= */}
        {activeStep === 1 && (
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-extrabold text-[#0D316E] flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#1E4B9B]" />
                <span>Identificação Institucional e Legal</span>
              </h3>
              <p className="text-xs text-slate-500">
                Dados cadastrais e jurídicos da empresa ou instituição em Moçambique.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Nome Comercial / Nome Fantasia *
                </label>
                <input
                  type="text"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  placeholder="Ex: MozConstruções Lda"
                  className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0D316E] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Denominação Social / Razão Social *
                </label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="Ex: Sociedade Moçambicana de Construções, Lda"
                  className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0D316E] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  NUIT Moçambicano (9 dígitos) *
                </label>
                <input
                  type="text"
                  value={nuit}
                  onChange={(e) => setNuit(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  placeholder="Ex: 400123456"
                  maxLength={9}
                  className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0D316E] focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Tipo de Entidade *
                </label>
                <select
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value as CompanyEntityType)}
                  className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#0D316E] focus:outline-hidden"
                >
                  <option value="private_company">Empresa Privada (Sociedade, Lda, SA)</option>
                  <option value="public_institution">Instituição Pública (Ministério, Direcção)</option>
                  <option value="ngo">ONG / Sem Fins Lucrativos</option>
                  <option value="cooperative">Cooperativa / Associação</option>
                  <option value="public_service">Serviço Público / Autarquia</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Ano de Fundação / Início de Actividades
                </label>
                <input
                  type="number"
                  value={foundationYear}
                  onChange={(e) => setFoundationYear(e.target.value)}
                  placeholder="Ex: 2018"
                  min={1900}
                  max={2030}
                  className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0D316E] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Categoria Empresarial (Isolada) *
                </label>
                {!isProposingCategory ? (
                  <div className="space-y-2">
                    <select
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
                      className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#0D316E] focus:outline-hidden"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name || c.originalName}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsProposingCategory(true)}
                      className="text-xs text-[#EA580C] font-bold hover:underline"
                    >
                      + Propor nova categoria empresarial
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Nome da nova categoria empresarial..."
                      className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0D316E] focus:outline-hidden"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCreateCategoryProposal}
                        className="min-h-[40px] px-3.5 py-1.5 bg-[#0D316E] text-white rounded-xl text-xs font-bold"
                      >
                        Confirmar
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsProposingCategory(false)}
                        className="min-h-[40px] px-3.5 py-1.5 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-bold text-slate-700 mb-1.5">
                Descrição Institucional / Missão da Empresa
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva as actividades principais, serviços e diferenciais da empresa..."
                rows={3}
                className="w-full min-h-[96px] p-3.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0D316E] focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {/* ================= STEP 2: RESPONSÁVEL E CONTACTO ================= */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-extrabold text-[#0D316E] flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[#1E4B9B]" />
                <span>Responsável e Canais de Contacto</span>
              </h3>
              <p className="text-xs text-slate-500">
                Contactos oficiais para contacto com clientes e notificações do sistema.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Nome do Representante / Administrador *
                </label>
                <input
                  type="text"
                  value={responsibleName}
                  onChange={(e) => setResponsibleName(e.target.value)}
                  placeholder="Ex: Carlos Matsinhe"
                  className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0D316E] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Cargo / Função do Responsável
                </label>
                <input
                  type="text"
                  value={responsibleRole}
                  onChange={(e) => setResponsibleRole(e.target.value)}
                  placeholder="Ex: Diretor Geral / Gerente"
                  className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0D316E] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Telefone Principal (Moçambique +258) *
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: 841234567 ou +258 84 123 4567"
                  className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0D316E] focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  WhatsApp Oficial da Empresa
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Ex: 841234567 (opcional, usa o telefone se vazio)"
                  className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0D316E] focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  E-mail Oficial / Atendimento
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contacto@empresa.co.mz"
                  className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0D316E] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Website / Página Web
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://www.empresa.co.mz"
                  className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0D316E] focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: LOCALIZAÇÃO FÍSICA ================= */}
        {activeStep === 3 && (
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-extrabold text-[#0D316E] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#1E4B9B]" />
                <span>Localização Física e Sede da Entidade</span>
              </h3>
              <p className="text-xs text-slate-500">
                Indique a província, o distrito, o bairro e paragens para facilitar o acesso de utentes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Província *
                </label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#0D316E] focus:outline-hidden"
                >
                  {provinces.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Distrito / Município *
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#0D316E] focus:outline-hidden"
                >
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Bairro *
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Ex: Central / Polana Cimento / Matola C"
                  className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0D316E] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Endereço / Rua / Av. e Número
                </label>
                <input
                  type="text"
                  value={streetOrReference}
                  onChange={(e) => setStreetOrReference(e.target.value)}
                  placeholder="Ex: Av. 24 de Julho, Edifício Maputo Plaza, 3º andar"
                  className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0D316E] focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1.5">
                  Paragem de Transporte mais próxima
                </label>
                <input
                  type="text"
                  value={nearestStop}
                  onChange={(e) => setNearestStop(e.target.value)}
                  placeholder="Ex: Paragem Museu / Paragem Prédio Vermelho"
                  className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0D316E] focus:outline-hidden"
                />
              </div>
            </div>

            {/* GPS capture block */}
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-[#0D316E]">
                  Coordenadas GPS (Opcional para Mapa Interativo)
                </span>
                <button
                  type="button"
                  disabled={isLocating}
                  onClick={handleCaptureGps}
                  className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#0D316E] hover:bg-[#092452] text-white font-bold inline-flex items-center gap-1.5 transition-colors"
                >
                  <LocateFixed className="w-3.5 h-3.5" />
                  <span>{isLocating ? 'A localizar...' : 'Capturar GPS Atual'}</span>
                </button>
              </div>
              {gpsError && <p className="text-red-600">{gpsError}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={latitude}
                  onChange={(e) => {
                    setLatitude(e.target.value);
                    setHasGps(Boolean(e.target.value && longitude));
                  }}
                  placeholder="Latitude (ex: -25.9692)"
                  className="w-full min-h-[48px] h-12 px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white font-mono"
                />
                <input
                  type="text"
                  value={longitude}
                  onChange={(e) => {
                    setLongitude(e.target.value);
                    setHasGps(Boolean(e.target.value && latitude));
                  }}
                  placeholder="Longitude (ex: 32.5732)"
                  className="w-full min-h-[48px] h-12 px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 4: FOTOS, VÍDEO E DOCUMENTOS ================= */}
        {activeStep === 4 && (
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-extrabold text-[#0D316E] flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#1E4B9B]" />
                <span>Logótipo, Apresentação em Vídeo e Documentos de Conformidade</span>
              </h3>
              <p className="text-xs text-slate-500">
                O vídeo de apresentação terá visualizações contabilizadas em direto. Os documentos de conformidade são protegidos por regras de segurança e visíveis apenas ao proprietário e à moderação.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Logótipo da Empresa (URL / Imagem)
                </label>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://.../logo.png"
                  className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0D316E] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Vídeo de Apresentação / Institucional (URL YouTube ou Direto)
                </label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... ou .mp4"
                  className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0D316E] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Photos Sub-section */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <span className="font-extrabold text-[#0D316E] block">
                Galeria de Fotos da Entidade / Instalações
              </span>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={tempPhotoUrl}
                  onChange={(e) => setTempPhotoUrl(e.target.value)}
                  placeholder="URL da foto (ex: https://.../foto.jpg)"
                  className="w-full sm:flex-1 min-h-[48px] h-12 px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                />
                <input
                  type="text"
                  value={tempPhotoCaption}
                  onChange={(e) => setTempPhotoCaption(e.target.value)}
                  placeholder="Legenda (ex: Sala de Atendimento)"
                  className="w-full sm:w-52 min-h-[48px] h-12 px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  className="min-h-[48px] h-12 px-4 py-2.5 bg-[#0D316E] hover:bg-[#092452] text-white rounded-xl font-bold shrink-0 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Foto</span>
                </button>
              </div>

              {mediaList.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  {mediaList.map((m, idx) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-300 bg-white group">
                      <img src={m.storageRef} alt={m.caption} className="w-full h-20 object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-80 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Protected Verification Documents Sub-section */}
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-3 text-xs">
              <div className="flex items-center gap-1.5 text-amber-950 font-extrabold">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Documentos de Conformidade e Alvará (Armazenamento Privado)</span>
              </div>
              <p className="text-slate-600">
                Estes ficheiros são protegidos por regras de segurança do Firestore (não são públicos).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={tempDocType}
                  onChange={(e) => setTempDocType(e.target.value as CompanyDocType)}
                  className="w-full min-h-[48px] h-12 px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                >
                  <option value="alvara">Alvará Comercial / Licença</option>
                  <option value="br_publication">Publicação no Boletim da República (BR)</option>
                  <option value="tax_clearance">Certidão de Quitação Fiscal (AT)</option>
                  <option value="responsible_id">BI / Passaporte do Representante</option>
                  <option value="power_of_attorney">Procuração / Estatutos</option>
                  <option value="other">Outro Documento</option>
                </select>
                <input
                  type="text"
                  value={tempDocTitle}
                  onChange={(e) => setTempDocTitle(e.target.value)}
                  placeholder="Título (ex: Alvará 2024)"
                  className="w-full min-h-[48px] h-12 px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                />
                <input
                  type="text"
                  value={tempDocRef}
                  onChange={(e) => setTempDocRef(e.target.value)}
                  placeholder="URL / Referência do ficheiro"
                  className="w-full min-h-[48px] h-12 px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <button
                type="button"
                onClick={handleAddDocument}
                className="min-h-[44px] px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl font-bold inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Anexar Documento Privado</span>
              </button>

              {documentsList.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  {documentsList.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#0D316E]" />
                        <span className="font-bold text-slate-700">{doc.title}</span>
                        <span className="text-[10px] text-slate-500 uppercase">({doc.docType})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDocument(idx)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= STEP 5: HORÁRIOS, SERVIÇOS E PUBLICAÇÃO ================= */}
        {activeStep === 5 && (
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-extrabold text-[#0D316E] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#1E4B9B]" />
                <span>Horários de Funcionamento e Departamentos</span>
              </h3>
              <p className="text-xs text-slate-500">
                Configure os dias em que a entidade está aberta e adicione os serviços prestados.
              </p>
            </div>

            {/* Operating State Selector */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-700">Estado Operacional Inicial:</span>
              <div className="flex items-center gap-2">
                {(['on', 'off', 'stop'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setOperationalState(st)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-black uppercase transition-colors ${
                      operationalState === st
                        ? 'bg-[#0D316E] text-white shadow-xs'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Weekly Schedules */}
            <div className="space-y-2 text-xs">
              <span className="font-extrabold text-[#0D316E] block">Horário Semanal:</span>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {schedules.map((sch, idx) => (
                  <div key={sch.dayOfWeek} className="p-3 flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 cursor-pointer w-36">
                      <input
                        type="checkbox"
                        checked={sch.isOpen}
                        onChange={(e) => {
                          const updated = [...schedules];
                          updated[idx] = { ...sch, isOpen: e.target.checked };
                          setSchedules(updated);
                        }}
                        className="rounded text-[#0D316E]"
                      />
                      <span className="font-bold text-slate-700">{sch.dayLabel}</span>
                    </label>

                    {sch.isOpen ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={sch.openingTime}
                          onChange={(e) => {
                            const updated = [...schedules];
                            updated[idx] = { ...sch, openingTime: e.target.value };
                            setSchedules(updated);
                          }}
                          className="min-h-[42px] px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs"
                        />
                        <span className="text-slate-400">até</span>
                        <input
                          type="time"
                          value={sch.closingTime}
                          onChange={(e) => {
                            const updated = [...schedules];
                            updated[idx] = { ...sch, closingTime: e.target.value };
                            setSchedules(updated);
                          }}
                          className="min-h-[42px] px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs"
                        />
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Encerrado</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Services / Departments list */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <span className="font-extrabold text-[#0D316E] block">
                Departamentos / Serviços Oferecidos ({servicesList.length})
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={tempServiceName}
                  onChange={(e) => setTempServiceName(e.target.value)}
                  placeholder="Nome do serviço / balcão"
                  className="w-full min-h-[48px] h-12 px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                />
                <input
                  type="text"
                  value={tempServiceDesc}
                  onChange={(e) => setTempServiceDesc(e.target.value)}
                  placeholder="Descrição resumida"
                  className="w-full min-h-[48px] h-12 px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={tempServicePrice}
                    onChange={(e) => setTempServicePrice(e.target.value)}
                    placeholder="Preço (MT)"
                    className="w-28 min-h-[48px] h-12 px-3 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddService}
                    className="flex-1 min-h-[48px] h-12 px-3.5 py-2.5 bg-[#0D316E] hover:bg-[#092452] text-white rounded-xl font-bold flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar</span>
                  </button>
                </div>
              </div>

              {servicesList.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  {servicesList.map((srv, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-[#0D316E]">{srv.name}</div>
                        {srv.description && (
                          <div className="text-slate-500 text-[11px]">{srv.description}</div>
                        )}
                        {srv.basePrice && (
                          <div className="text-emerald-700 font-bold text-[11px]">{srv.basePrice} MT</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveService(idx)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 rounded text-[#0D316E]"
                />
                <span className="text-slate-700 font-semibold leading-relaxed">
                  Declaro que as informações institucionais, NUIT e contactos fornecidos são autênticos e autorizo a sua publicação no diretório nacional MozFácil nos termos da legislação moçambicana de protecção de dados.
                </span>
              </label>
            </div>
          </div>
        )}

      </div>

      {/* Docked Bottom Navigation & Submission Bar (SHRINK-0 — Never Clips Fields) */}
      <div className="shrink-0 bg-white border-t border-slate-200 px-3.5 sm:px-5 py-2.5 shadow-[0_-4px_16px_rgba(13,49,110,0.06)] flex items-center justify-between gap-2">
        <div>
          {activeStep > 1 ? (
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
              onClick={onBack}
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
            disabled={isSubmitting}
            onClick={() => handleSubmit('draft')}
            className="min-h-[42px] px-3 sm:px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 active:scale-[0.98] text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Guardar progresso como rascunho"
          >
            <Save className="w-3.5 h-3.5 text-[#0D316E] shrink-0" />
            <span className="hidden min-[380px]:inline">Rascunho</span>
          </button>

          {activeStep < 5 ? (
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
              disabled={isSubmitting}
              onClick={() => handleSubmit('published')}
              className="min-h-[42px] px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] active:scale-[0.98] text-white text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
            >
              <Send className="w-4 h-4 shrink-0" />
              <span>{isSubmitting ? 'A Gravar...' : 'Publicar Empresa'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
