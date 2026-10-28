import React, { useEffect, useRef, useState } from 'react';
import {
  Search,
  Mic,
  Headset,
  Phone,
  ChevronRight,
  ChevronLeft,
  X,
  User,
  UserPlus,
  Heart,
  Clock,
  Info,
  Briefcase,
  Shield,
  LogOut,
  Coins,
  MapPin,
  MessageCircle,
  CheckCircle2,
  Share2,
  Copy,
  Building2,
  Gift,
  Sparkles,
  Lock,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Settings,
  Eye,
} from 'lucide-react';
import {
  MozUser,
  ProfessionalProfile,
  CREDIT_PACKAGES,
  CreditPackageId,
  buildUserReferralLink,
  formatUserCreditBalance,
  getConsultationCreditCostFormatted,
} from '../types/mozfacil';

interface HomeAdSlideItem {
  imageUrl: string;
  caption: string;
}

interface HomeVideoAdItem {
  id: string;
  titleLine1: string;
  titleLine2?: string;
  fullTitle: string;
  category: string;
  description: string;
  durationLabel: string;
  durationSeconds: number;
  initialProgressPercent: number;
  thumbnailUrl: string;
  slides: HomeAdSlideItem[];
  videoUrl: string;
  fallbackVideoUrl: string;
  ctaLabel: string;
  whatsappText: string;
  viewsCount: number;
  likesCount: number;
}

const HOME_VIDEO_ADS: HomeVideoAdItem[] = [
  {
    id: 'ad-reserva-moz',
    titleLine1: 'Reserva de Moçambique',
    fullTitle: 'Reserva de Moçambique — Turismo & Destinos',
    category: 'Turismo & Lazer',
    description:
      'Explore praias paradisíacas, ilhas, safaris e alojamentos turísticos em todo Moçambique com reserva rápida e garantida.',
    durationLabel: '0:28',
    durationSeconds: 28,
    initialProgressPercent: 62,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=700&q=80',
    slides: [
      {
        imageUrl:
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=700&q=80',
        caption: 'Ilhas de Bazaruto',
      },
      {
        imageUrl:
          'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=700&q=80',
        caption: 'Resorts & Villas',
      },
      {
        imageUrl:
          'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=700&q=80',
        caption: 'Safari Gorongosa',
      },
      {
        imageUrl:
          'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=700&q=80',
        caption: 'Ponta do Ouro',
      },
    ],
    videoUrl:
      'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-seashore-with-rocks-1090-large.mp4',
    fallbackVideoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    ctaLabel: 'Reservar Destino via WhatsApp',
    whatsappText:
      'Olá! Vi o anúncio "Reserva de Moçambique" no MozFácil e gostaria de receber informações sobre pacotes e reservas.',
    viewsCount: 1420,
    likesCount: 318,
  },
  {
    id: 'ad-banco-bci',
    titleLine1: 'Banco BCI - Crédito Pessoal',
    fullTitle: 'Banco BCI — Soluções de Crédito Pessoal',
    category: 'Banca & Finanças',
    description:
      'Realize os seus planos pessoais, académicos ou familiares com o Crédito Pessoal BCI. Simulação rápida e atendimento dedicado.',
    durationLabel: '0:15',
    durationSeconds: 15,
    initialProgressPercent: 74,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=700&q=80',
    slides: [
      {
        imageUrl:
          'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=700&q=80',
        caption: 'Crédito na Hora',
      },
      {
        imageUrl:
          'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=700&q=80',
        caption: 'Apoio Familiar',
      },
      {
        imageUrl:
          'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=700&q=80',
        caption: 'Sonhos & Casa',
      },
      {
        imageUrl:
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=700&q=80',
        caption: 'Taxas Flexíveis',
      },
    ],
    videoUrl:
      'https://assets.mixkit.co/videos/preview/mixkit-people-working-in-a-modern-office-4345-large.mp4',
    fallbackVideoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    ctaLabel: 'Simular Crédito Pessoal',
    whatsappText:
      'Olá! Vi o anúncio "Banco BCI - Crédito Pessoal" no MozFácil e gostaria de saber mais sobre condições de financiamento.',
    viewsCount: 2890,
    likesCount: 542,
  },
  {
    id: 'ad-segura-auto',
    titleLine1: 'Segura Auto',
    titleLine2: 'Proteja já',
    fullTitle: 'Segura Auto — Proteja já a sua Viatura',
    category: 'Seguros & Assistência 24h',
    description:
      'Proteja a sua viatura contra todos os riscos com assistência em viagem 24h em todas as províncias de Moçambique.',
    durationLabel: '0:30',
    durationSeconds: 30,
    initialProgressPercent: 80,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=700&q=80',
    slides: [
      {
        imageUrl:
          'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=700&q=80',
        caption: 'Cobertura Total',
      },
      {
        imageUrl:
          'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=700&q=80',
        caption: 'Assistência 24h',
      },
      {
        imageUrl:
          'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=700&q=80',
        caption: 'Frota & Pessoal',
      },
      {
        imageUrl:
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=700&q=80',
        caption: 'Apoio na Estrada',
      },
    ],
    videoUrl:
      'https://assets.mixkit.co/videos/preview/mixkit-man-buying-a-car-in-a-dealership-42929-large.mp4',
    fallbackVideoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    ctaLabel: 'Pedir Cotação Segura Auto',
    whatsappText:
      'Olá! Vi o anúncio "Segura Auto - Proteja já" no MozFácil e gostaria de pedir uma cotação de seguro automóvel.',
    viewsCount: 1965,
    likesCount: 410,
  },
];

interface MozfacilHomeScreenProps {
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onSubmitSearch: (q: string) => void;
  onOpenDirectContact: () => void;
  onOpenCustomerLine?: () => void;
  onOpenUserInfo?: () => void;
  onOpenRegisterChoice?: () => void;
  onOpenShareMozfacil?: () => void;
  onOpenExploreModules: () => void;
  onOpenProfessionalsDirectory: () => void;
  isRegisteredUser?: boolean;
}

export const MozfacilHomeScreen: React.FC<MozfacilHomeScreenProps> = ({
  searchQuery,
  onSearchQueryChange,
  onSubmitSearch,
  onOpenDirectContact,
  onOpenCustomerLine,
  onOpenUserInfo,
  onOpenShareMozfacil,
  isRegisteredUser = false,
}) => {
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeVideoAdIndex, setActiveVideoAdIndex] = useState<number | null>(null);
  const [isPlayingVideo, setIsPlayingVideo] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [likedAdIds, setLikedAdIds] = useState<string[]>([]);
  const [adViewsMap, setAdViewsMap] = useState<Record<string, number>>(() => ({
    'ad-reserva-moz': 1420,
    'ad-banco-bci': 2890,
    'ad-segura-auto': 1965,
  }));

  // Automatic silent dynamic slide index & smooth progress (changes every 3.5 seconds)
  const [slideTick, setSlideTick] = useState(0);
  const [slideStepProgress, setSlideStepProgress] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const videoElementRef = useRef<HTMLVideoElement>(null);

  const activeVideoAd =
    activeVideoAdIndex !== null ? HOME_VIDEO_ADS[activeVideoAdIndex] || null : null;

  useEffect(() => {
    if (activeVideoAdIndex !== null) return;
    const SLIDE_DURATION_MS = 3500;
    const TICK_INTERVAL_MS = 100;
    let elapsed = 0;

    const interval = window.setInterval(() => {
      elapsed += TICK_INTERVAL_MS;
      if (elapsed >= SLIDE_DURATION_MS) {
        elapsed = 0;
        setSlideTick((prev) => prev + 1);
        setSlideStepProgress(0);
      } else {
        setSlideStepProgress(Math.min(100, Math.round((elapsed / SLIDE_DURATION_MS) * 100)));
      }
    }, TICK_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [activeVideoAdIndex]);

  useEffect(() => {
    if (!activeVideoAd) {
      setVideoProgress(0);
      return;
    }
    setIsPlayingVideo(true);
    setVideoProgress(0);
    setAdViewsMap((prev) => ({
      ...prev,
      [activeVideoAd.id]: (prev[activeVideoAd.id] || activeVideoAd.viewsCount) + 1,
    }));
  }, [activeVideoAd]);

  useEffect(() => {
    if (!activeVideoAd || !isPlayingVideo) return;
    const timer = window.setInterval(() => {
      if (videoElementRef.current && videoElementRef.current.duration) {
        const pct =
          (videoElementRef.current.currentTime / videoElementRef.current.duration) * 100;
        if (!Number.isNaN(pct) && pct > 0) {
          setVideoProgress(Math.min(100, pct));
          return;
        }
      }
      setVideoProgress((prev) => (prev >= 100 ? 0 : prev + 100 / activeVideoAd.durationSeconds));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeVideoAd, isPlayingVideo]);

  const handleOpenVideoAd = (index: number) => {
    setActiveVideoAdIndex(index);
  };

  const handleCloseVideoAd = () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    setActiveVideoAdIndex(null);
  };

  const handleTogglePlayPause = () => {
    const vid = videoElementRef.current;
    if (vid) {
      if (vid.paused) {
        vid.play().catch(() => {});
        setIsPlayingVideo(true);
      } else {
        vid.pause();
        setIsPlayingVideo(false);
      }
    } else {
      setIsPlayingVideo((prev) => !prev);
    }
  };

  const handleToggleMute = () => {
    const vid = videoElementRef.current;
    if (vid) {
      vid.muted = !vid.muted;
    }
    setIsVideoMuted((prev) => !prev);
  };

  const handleRequestNativeFullscreen = () => {
    const container = fullscreenContainerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    } else {
      container.requestFullscreen?.().catch(() => {});
    }
  };

  const handleToggleLikeAd = (adId: string) => {
    setLikedAdIds((prev) =>
      prev.includes(adId) ? prev.filter((id) => id !== adId) : [...prev, adId]
    );
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitSearch(searchQuery);
  };

  const handleVoiceSearch = () => {
    const SpeechRecognitionApi =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (!SpeechRecognitionApi) {
      onSubmitSearch(searchQuery);
      return;
    }

    try {
      // @ts-expect-error Browser Web Speech API constructor
      const recognition = new SpeechRecognitionApi();
      recognition.lang = 'pt-MZ';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      setIsListeningVoice(true);

      recognition.onresult = (event: {
        results?: ArrayLike<ArrayLike<{ transcript?: string }>>;
      }) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        setIsListeningVoice(false);
        if (transcript) {
          onSearchQueryChange(transcript);
          onSubmitSearch(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListeningVoice(false);
      };

      recognition.onend = () => {
        setIsListeningVoice(false);
      };

      recognition.start();
    } catch {
      setIsListeningVoice(false);
      onSubmitSearch(searchQuery);
    }
  };

  const showTwoLinePlaceholder = !searchQuery && !isSearchFocused;

  return (
    <div className="relative max-w-md w-full mx-auto h-full flex-1 min-h-0 flex flex-col justify-between px-2.5 sm:px-4 pt-1 pb-1.5 overflow-hidden select-none">
      {/* Top Curved Navy Dome Arch Backdrop matching reference print */}
      <svg
        viewBox="0 0 400 180"
        className="pointer-events-none absolute -top-3 inset-x-0 w-full h-32 opacity-50"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M-30,0 L430,0 L430,90 C320,25 80,25 -30,90 Z"
          fill="url(#topDomeArcGrad)"
        />
        <defs>
          <linearGradient id="topDomeArcGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#153E85" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#041537" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Main Content Stack fitted to 100% viewport with zero scroll */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-between text-center gap-1 sm:gap-1.5 py-0.5">
        {/* 1. Hero Headline Block matching reference print */}
        <div className="space-y-0.5 w-full pt-0.5 shrink-0">
          <h1 className="text-[23px] sm:text-[29px] font-black uppercase tracking-wide text-white leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
            MOÇAMBIQUE
          </h1>
          <p className="text-[15px] sm:text-[18px] font-black uppercase tracking-tight text-[#F97316] leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]">
            NA PALMA DA SUA MÃO
          </p>

          {/* Golden-Yellow Glowing Horizon Flare Divider */}
          <div className="relative w-4/5 max-w-[260px] mx-auto pt-0.5 pb-0.5">
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent" />
            <div className="absolute inset-x-1/4 top-0.5 h-[3.5px] bg-gradient-to-r from-transparent via-[#FDE047] to-transparent blur-[1.5px]" />
          </div>
        </div>

        {/* 2. White Pill Search Bar ("Pesquise o que precisa / pela mensagem ou pela voz") */}
        <form
          onSubmit={handleFormSubmit}
          className="w-full bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFC] to-[#E2E8F0] rounded-full shadow-[0_5px_16px_rgba(0,0,0,0.38)] border border-white px-3.5 py-1.5 sm:py-2 flex items-center gap-2.5 shrink-0"
        >
          <button
            type="submit"
            aria-label="Pesquisar"
            className="text-[#EA580C] hover:text-[#C2410C] transition-colors shrink-0 pl-0.5"
          >
            <Search className="w-5.5 h-5.5 sm:w-6 sm:h-6 stroke-[2.3]" />
          </button>

          <div className="h-6 sm:h-7 w-[1px] bg-slate-300/90 shrink-0" aria-hidden="true" />

          <div
            className="relative flex-1 min-w-0 text-left cursor-text"
            onClick={() => searchInputRef.current?.focus()}
          >
            {showTwoLinePlaceholder && (
              <div className="pointer-events-none select-none leading-tight">
                <div className="text-[13.5px] sm:text-[15px] font-extrabold text-[#07214E] truncate">
                  Pesquise o que precisa
                </div>
                <div className="text-[11px] sm:text-[12px] font-normal text-slate-500 truncate">
                  pela mensagem ou pela voz
                </div>
              </div>
            )}
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              aria-label="Pesquise serviços, contactos e obtenha soluções"
              placeholder={
                showTwoLinePlaceholder
                  ? ''
                  : 'Pesquise o que precisa pela mensagem ou pela voz'
              }
              className={`w-full bg-transparent text-[#07214E] placeholder:text-slate-400 text-sm font-bold focus:outline-none min-w-0 ${
                showTwoLinePlaceholder ? 'opacity-0 absolute inset-0' : 'py-0.5'
              }`}
            />
          </div>

          <div className="h-6 sm:h-7 w-[1px] bg-slate-300/90 shrink-0" aria-hidden="true" />

          <button
            type="button"
            onClick={handleVoiceSearch}
            aria-label="Pesquisa por voz"
            title="Pesquisar por voz"
            className={`shrink-0 pr-0.5 transition-transform ${
              isListeningVoice
                ? 'text-red-600 scale-110 animate-pulse'
                : 'text-[#EA580C] hover:text-[#C2410C]'
            }`}
          >
            <Mic className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[2.2]" />
          </button>
        </form>

        {/* 3. "SERVIÇOS MOZFÁCIL & TERMOS DE USO" Pill Card */}
        <button
          type="button"
          onClick={() => (onOpenUserInfo ? onOpenUserInfo() : onOpenDirectContact())}
          aria-label="Serviços MozFácil e Termos de Uso"
          className="w-full rounded-[24px] bg-gradient-to-r from-[#031330]/95 via-[#061F4C]/95 to-[#031330]/95 border-[2px] border-[#EA580C] shadow-[0_0_16px_rgba(234,88,12,0.34)] hover:shadow-[0_0_22px_rgba(234,88,12,0.55)] px-3 sm:px-3.5 py-2 flex items-center gap-2.5 sm:gap-3 transition-all group shrink-0"
        >
          {/* Left Thick Orange Circle with Bold White Gear/Cog Icon */}
          <div className="shrink-0 flex items-center justify-center pl-0.5">
            <div className="w-9.5 h-9.5 sm:w-11 sm:h-11 rounded-full border-[3px] border-[#EA580C] flex items-center justify-center shadow-[0_0_10px_rgba(234,88,12,0.35)] bg-[#041638]">
              <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-[2.4]" />
            </div>
          </div>

          <div className="h-8 w-[1px] bg-white/30 shrink-0" aria-hidden="true" />

          {/* Centered Bold White Uppercase Title */}
          <div className="flex-1 min-w-0 text-center">
            <div className="text-[13.5px] sm:text-[15.5px] font-black uppercase text-white tracking-wide leading-[1.18]">
              SERVIÇOS MOZFÁCIL &amp;
              <br />
              TERMOS DE USO
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-[#EA580C] group-hover:translate-x-0.5 transition-transform shrink-0 stroke-[2.8]" />
        </button>

        {/* 4. Contacts + PUBLICIDADE Header Row & 3 Dynamic Silent Slide Ad Cards + Sweeping Orange Curve */}
        <div className="relative w-full pb-2 shrink-0">
          {/* Header Row: Left WhatsApp Circle | Center PUBLICIDADE | Right Direct Phone Circle */}
          <div className="flex items-center justify-between px-1 mb-1">
            {/* Left Circular Button: Linha do Cliente (WhatsApp Orange Icon) */}
            <a
              href="https://wa.me/258843001234?text=Ol%C3%A1%20Linha%20do%20Cliente%20MozF%C3%A1cil%2C%20preciso%20de%20apoio."
              target="_blank"
              rel="noopener noreferrer"
              title="Linha do Cliente (WhatsApp)"
              aria-label="Linha do Cliente via WhatsApp"
              onClick={(e) => {
                if (!isRegisteredUser) {
                  e.preventDefault();
                  if (onOpenCustomerLine) {
                    onOpenCustomerLine();
                  } else if (onOpenUserInfo) {
                    onOpenUserInfo();
                  }
                }
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#04183D] shadow-[0_4px_12px_rgba(0,0,0,0.45)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
            >
              <svg
                viewBox="0 0 44 44"
                className="w-9 h-9 sm:w-10 sm:h-10"
                aria-hidden="true"
              >
                <path
                  d="M22 5C12.6 5 5 12.4 5 21.6c0 3.2.9 6.2 2.6 8.8L5.8 38l7.9-2.1c2.5 1.4 5.3 2.1 8.3 2.1 9.4 0 17-7.4 17-16.6S31.4 5 22 5z"
                  fill="#F97316"
                  stroke="#FFFFFF"
                  strokeWidth="2.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M17.4 14.5c-.4-.9-.8-.9-1.2-.9h-1c-.4 0-1 .1-1.5.7-.5.6-1.9 1.8-1.9 4.4s2 5.2 2.2 5.5c.3.4 3.8 6 9.4 8.2 4.6 1.8 5.6 1.5 6.6 1.4 1-.1 3.2-1.3 3.6-2.5.5-1.3.5-2.3.3-2.5-.1-.2-.5-.4-1.1-.7-.6-.3-3.2-1.6-3.7-1.8-.5-.2-.9-.3-1.2.3-.4.5-1.4 1.8-1.7 2.1-.3.4-.6.4-1.2.1-.6-.3-2.4-.9-4.5-2.8-1.7-1.5-2.8-3.3-3.1-3.9-.3-.5 0-.8.2-1.1.3-.3.6-.6.8-.9.3-.3.4-.5.6-.9.2-.4.1-.7 0-1-.2-.3-1.1-2.8-1.6-3.8z"
                  fill="#FFFFFF"
                />
              </svg>
            </a>

            {/* Center Label: PUBLICIDADE */}
            <span className="text-[12px] sm:text-[13px] font-black uppercase tracking-wider text-[#F97316] drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
              PUBLICIDADE
            </span>

            {/* Right Circular Button: Contacto Directo (Orange Phone Circle) */}
            <button
              type="button"
              onClick={onOpenDirectContact}
              title="Contacto Directo de Emergência"
              aria-label="Contacto Directo por Chamada"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-[2.2px] border-[#EA580C] bg-[#04183D] shadow-[0_4px_12px_rgba(0,0,0,0.45)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
            >
              <Phone className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#EA580C] fill-[#EA580C]" />
            </button>
          </div>

          {/* 3 Automatic Dynamic Visual Slide Ad Cards Grid (No Classic Play Button) */}
          <div className="relative z-10 grid grid-cols-3 gap-2 w-full">
            {HOME_VIDEO_ADS.map((ad, idx) => {
              const totalSlides = ad.slides.length;
              const currentSlideIdx = slideTick % totalSlides;
              const currentSlide = ad.slides[currentSlideIdx] || ad.slides[0];

              return (
                <button
                  key={ad.id}
                  type="button"
                  onClick={() => handleOpenVideoAd(idx)}
                  aria-label={`Ver publicidade em destaque: ${ad.fullTitle}`}
                  className="rounded-[13px] bg-gradient-to-b from-[#071D46] via-[#051636] to-[#030F26] border border-white/20 hover:border-[#F97316] p-1 shadow-[0_5px_14px_rgba(0,0,0,0.5)] flex flex-col justify-between text-center transition-all group active:scale-[0.98]"
                >
                  {/* Automatic Silent Dynamic Slide Box (No Play Icon Clutter) */}
                  <div className="relative w-full h-[68px] sm:h-[82px] rounded-[9px] overflow-hidden bg-[#020B1C]">
                    {ad.slides.map((slide, sIdx) => {
                      const isSlideActive = sIdx === currentSlideIdx;
                      return (
                        <img
                          key={slide.imageUrl}
                          src={slide.imageUrl}
                          alt={`${ad.fullTitle} - ${slide.caption}`}
                          className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out ${
                            isSlideActive
                              ? 'opacity-100 scale-105'
                              : 'opacity-0 scale-100 pointer-events-none'
                          }`}
                          loading="lazy"
                        />
                      );
                    })}

                    {/* Subtle bottom vignette for slide caption & progress bar legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/15 pointer-events-none" />

                    {/* Dynamic Micro-Highlight Caption on Current Slide */}
                    <div className="absolute bottom-2 inset-x-1 flex items-center justify-center pointer-events-none">
                      <span className="px-1.5 py-0.5 rounded bg-black/55 backdrop-blur-[2px] text-[8px] sm:text-[9px] font-extrabold text-amber-200 tracking-tight truncate max-w-full shadow-xs">
                        {currentSlide.caption}
                      </span>
                    </div>

                    {/* Segmented Automatic Slide Progress Bars */}
                    <div className="absolute bottom-0.5 inset-x-1 flex items-center gap-0.5 pointer-events-none">
                      {ad.slides.map((_, sIdx) => {
                        const isPast = sIdx < currentSlideIdx;
                        const isCurrent = sIdx === currentSlideIdx;
                        const barWidth = isPast ? 100 : isCurrent ? slideStepProgress : 0;
                        return (
                          <div
                            key={sIdx}
                            className="flex-1 h-[2.5px] rounded-full bg-white/30 overflow-hidden"
                          >
                            <div
                              className="h-full bg-[#F97316] rounded-full transition-all duration-100 ease-linear"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card Advertiser Caption & Slide Counter/Duration */}
                  <div className="pt-1 pb-0.5 px-0.5 flex-1 flex flex-col justify-between items-center">
                    <div className="text-[9px] sm:text-[10px] font-bold text-white leading-[1.15] line-clamp-2">
                      {ad.titleLine1}
                      {ad.titleLine2 && (
                        <>
                          <br />
                          {ad.titleLine2}
                        </>
                      )}
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-extrabold text-[#F97316] mt-0.5 tabular-nums">
                      {ad.durationLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sweeping Glowing Orange/Gold Ribbon Waves right beneath the 3 Video Ad Cards */}
          <svg
            viewBox="0 0 400 56"
            className="pointer-events-none absolute -bottom-2 -inset-x-4 w-[calc(100%+2rem)] h-7"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="midWaveRibbon1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EA580C" stopOpacity="0.98" />
                <stop offset="50%" stopColor="#D97706" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="midWaveRibbon2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9A3412" stopOpacity="0.5" />
                <stop offset="55%" stopColor="#EA580C" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#B45309" stopOpacity="0.45" />
              </linearGradient>
            </defs>
            <path
              d="M-10,8 C110,44 250,48 410,16"
              fill="none"
              stroke="url(#midWaveRibbon1)"
              strokeWidth="4.5"
            />
            <path
              d="M-10,32 C125,52 265,44 410,34"
              fill="none"
              stroke="url(#midWaveRibbon2)"
              strokeWidth="3"
            />
          </svg>
        </div>

        {/* 5. "É moçambicano?" White/Cream Share & Community Card */}
        <button
          type="button"
          onClick={() =>
            onOpenShareMozfacil ? onOpenShareMozfacil() : onOpenDirectContact()
          }
          className="w-full rounded-[16px] bg-gradient-to-b from-[#FFFFFF] via-[#FFF9F2] to-[#FDEBD8] border-[2px] border-[#F97316]/85 shadow-[0_5px_16px_rgba(0,0,0,0.42)] px-3 sm:px-3.5 py-1.5 sm:py-2 flex items-center gap-2.5 text-left transition-all active:scale-[0.99] group shrink-0"
        >
          {/* Tilted Orange Megaphone Illustration */}
          <div className="shrink-0 flex items-center justify-center pl-0.5">
            <svg
              viewBox="0 0 64 56"
              className="w-11 h-9 sm:w-12 sm:h-10"
              aria-hidden="true"
            >
              <g transform="rotate(-22 30 28)">
                {/* Megaphone Cone */}
                <path
                  d="M16 22 L38 11 L38 39 L16 28 Z"
                  fill="none"
                  stroke="#EA580C"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
                {/* Megaphone Mouth Rim */}
                <ellipse
                  cx="38"
                  cy="25"
                  rx="3.5"
                  ry="14"
                  fill="#FFF7ED"
                  stroke="#EA580C"
                  strokeWidth="3.5"
                />
                {/* Megaphone Back Cap */}
                <rect
                  x="10"
                  y="21"
                  width="6"
                  height="8"
                  rx="2"
                  fill="#EA580C"
                />
                {/* Megaphone Handle */}
                <path
                  d="M15 29 L19 41 C19.5 42.5 18 44 16.5 44 L14 44 C12.5 44 11.5 43 11 41.5 L8 29 Z"
                  fill="#EA580C"
                />
                {/* Sound Waves */}
                <line
                  x1="46"
                  y1="15"
                  x2="53"
                  y2="11"
                  stroke="#EA580C"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <line
                  x1="47"
                  y1="25"
                  x2="55"
                  y2="25"
                  stroke="#EA580C"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <line
                  x1="46"
                  y1="35"
                  x2="53"
                  y2="39"
                  stroke="#EA580C"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </g>
            </svg>
          </div>

          <div className="h-10 w-[1px] bg-[#EA580C]/30 shrink-0" aria-hidden="true" />

          <div className="flex-1 min-w-0">
            <div className="text-[15.5px] sm:text-[18px] font-black text-[#07214E] leading-tight tracking-tight">
              É moçambicano?
            </div>
            <p className="text-[11px] sm:text-[12px] font-extrabold text-[#EA580C] leading-[1.2] mt-0.5">
              Ajude a colocar Moçambique
              <br />
              na palma de cada moçambicano!
            </p>
          </div>

          <ChevronRight className="w-5 h-5 text-[#EA580C] stroke-[2.5] group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>
      </div>

      {/* ===================================================================== */}
      {/* FULL-SCREEN INTERACTIVE VIDEO AD PLAYER MODAL                         */}
      {/* ===================================================================== */}
      {activeVideoAd && activeVideoAdIndex !== null && (
        <div
          ref={fullscreenContainerRef}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xs flex flex-col justify-between select-none"
          role="dialog"
          aria-modal="true"
          aria-label={`Reprodutor de Vídeo Publicitário: ${activeVideoAd.fullTitle}`}
        >
          {/* Top Bar: Badge + Advertiser Info + Fullscreen & Close Controls */}
          <div className="relative z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/85 via-black/50 to-transparent">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="px-2.5 py-1 rounded-full bg-[#EA580C] text-white text-[10px] font-black uppercase tracking-wider shrink-0 shadow-md">
                • PUBLICIDADE
              </span>
              <div className="min-w-0 text-left">
                <div className="text-sm sm:text-base font-extrabold text-white truncate">
                  {activeVideoAd.fullTitle}
                </div>
                <div className="text-[11px] text-orange-300 font-semibold flex items-center gap-2">
                  <span>{activeVideoAd.category}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {adViewsMap[activeVideoAd.id] || activeVideoAd.viewsCount} visualizações
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRequestNativeFullscreen}
                title="Ecrã Inteiro"
                aria-label="Alternar ecrã inteiro"
                className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleCloseVideoAd}
                title="Fechar vídeo"
                aria-label="Fechar reprodutor de vídeo"
                className="w-10 h-10 rounded-full bg-white/15 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Center Video Viewport */}
          <div
            className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden bg-black cursor-pointer"
            onClick={handleTogglePlayPause}
          >
            <video
              ref={videoElementRef}
              key={activeVideoAd.id}
              poster={activeVideoAd.thumbnailUrl}
              autoPlay
              playsInline
              loop
              muted={isVideoMuted}
              onPlay={() => setIsPlayingVideo(true)}
              onPause={() => setIsPlayingVideo(false)}
              className="w-full h-full max-h-[72vh] object-contain"
            >
              <source src={activeVideoAd.videoUrl} type="video/mp4" />
              <source src={activeVideoAd.fallbackVideoUrl} type="video/mp4" />
            </video>

            {/* Play/Pause Overlay Indicator when paused */}
            {!isPlayingVideo && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                <div className="w-20 h-20 rounded-full bg-[#EA580C]/90 border-2 border-white flex items-center justify-center shadow-2xl">
                  <Play className="w-10 h-10 text-white fill-white ml-1" />
                </div>
              </div>
            )}

            {/* Left / Right Ad Switcher Buttons */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveVideoAdIndex(
                  (activeVideoAdIndex - 1 + HOME_VIDEO_ADS.length) % HOME_VIDEO_ADS.length
                );
              }}
              aria-label="Anúncio anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-[#EA580C] border border-white/30 text-white flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveVideoAdIndex((activeVideoAdIndex + 1) % HOME_VIDEO_ADS.length);
              }}
              aria-label="Próximo anúncio"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-[#EA580C] border border-white/30 text-white flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Bottom Engagement & Controls Panel */}
          <div className="relative z-20 bg-gradient-to-t from-[#03112B] via-[#04183D]/95 to-black/80 px-4 pt-3 pb-5 border-t border-white/15 space-y-3">
            {/* Interactive Progress Bar + Playback Controls */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTogglePlayPause}
                aria-label={isPlayingVideo ? 'Pausar vídeo' : 'Reproduzir vídeo'}
                className="w-9 h-9 rounded-full bg-[#EA580C] text-white flex items-center justify-center shrink-0"
              >
                {isPlayingVideo ? (
                  <Pause className="w-4 h-4 fill-white" />
                ) : (
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                )}
              </button>

              <div className="flex-1 h-2 rounded-full bg-white/25 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#F97316] to-[#FBBF24] transition-all duration-300"
                  style={{ width: `${Math.max(8, Math.min(100, videoProgress))}%` }}
                />
              </div>

              <span className="text-xs font-extrabold text-[#F97316] tabular-nums shrink-0">
                {activeVideoAd.durationLabel}
              </span>

              <button
                type="button"
                onClick={handleToggleMute}
                aria-label={isVideoMuted ? 'Ativar som' : 'Silenciar vídeo'}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0"
              >
                {isVideoMuted ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-white" />
                )}
              </button>
            </div>

            {/* Advertiser Description + Engagement Actions */}
            <div className="max-w-lg mx-auto space-y-3 text-left">
              <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                {activeVideoAd.description}
              </p>

              {/* Quick Thumbnails Switcher for the 3 Ads */}
              <div className="grid grid-cols-3 gap-2">
                {HOME_VIDEO_ADS.map((item, idx) => {
                  const isCurrent = idx === activeVideoAdIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveVideoAdIndex(idx)}
                      className={`rounded-xl p-1.5 flex items-center gap-2 text-left border transition-all ${
                        isCurrent
                          ? 'bg-[#EA580C]/25 border-[#F97316] text-white'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <img
                        src={item.thumbnailUrl}
                        alt={item.titleLine1}
                        className="w-8 h-8 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-extrabold truncate">
                          {item.titleLine1}
                        </div>
                        <div className="text-[9px] text-[#F97316] font-bold">
                          {item.durationLabel}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Primary CTA & Like Button Row */}
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleToggleLikeAd(activeVideoAd.id)}
                  className={`px-3.5 py-3 rounded-xl font-extrabold text-xs flex items-center gap-1.5 border transition-colors shrink-0 ${
                    likedAdIds.includes(activeVideoAd.id)
                      ? 'bg-rose-600 border-rose-500 text-white'
                      : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${
                      likedAdIds.includes(activeVideoAd.id) ? 'fill-white' : ''
                    }`}
                  />
                  <span>
                    {activeVideoAd.likesCount +
                      (likedAdIds.includes(activeVideoAd.id) ? 1 : 0)}
                  </span>
                </button>

                <a
                  href={`https://wa.me/258843001234?text=${encodeURIComponent(
                    activeVideoAd.whatsappText
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#EA580C] to-[#F97316] hover:from-[#C2410C] hover:to-[#EA580C] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>{activeVideoAd.ctaLabel}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export type SidebarModalType =
  | 'direct_contact'
  | 'customer_line'
  | 'user_info'
  | 'share_mozfacil'
  | 'favorites'
  | 'history'
  | 'help_support'
  | 'about_mozfacil'
  | 'register_choice'
  | null;

interface MozfacilSidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  firebaseUserUid?: string | null;
  userDisplayName?: string | null;
  userEmail?: string | null;
  mozUser?: MozUser | null;
  isAdmin: boolean;
  myProfilesCount: number;
  favoriteCount: number;
  onLogin: () => void;
  onLogout: () => void;
  onNavigateUtenteRegistration: () => void;
  onNavigateProfessionalRegistration: () => void;
  onNavigateMyProfiles: () => void;
  onNavigateAdmin: () => void;
  onOpenModal: (modal: SidebarModalType) => void;
}

export const MozfacilSidebarDrawer: React.FC<MozfacilSidebarDrawerProps> = ({
  isOpen,
  onClose,
  firebaseUserUid,
  userDisplayName,
  userEmail,
  mozUser,
  isAdmin,
  myProfilesCount,
  favoriteCount,
  onLogin,
  onLogout,
  onNavigateUtenteRegistration,
  onNavigateMyProfiles,
  onNavigateAdmin,
  onOpenModal,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/55 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Right Slide-Over Drawer matching reference print */}
      <aside
        aria-label="Menu Lateral MozFácil"
        className="relative z-10 w-[86vw] max-w-[340px] h-full bg-white shadow-2xl flex flex-col overflow-y-auto"
      >
        {/* Top Dark Navy Brand Section */}
        <div className="bg-gradient-to-b from-[#04183D] via-[#07255B] to-[#082B6A] text-white pt-4 pb-7 px-5 relative">
          {/* Top-right Close (X) button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar menu lateral"
              className="p-1.5 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-7 h-7 stroke-[2.5]" />
            </button>
          </div>

          {/* Centered MOZFÁCIL Logo */}
          <div className="flex flex-col items-center text-center mt-1">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 60 50" className="w-12 h-10 shrink-0" aria-hidden="true">
                <path d="M18 14 L56 2 L44 16 L8 20 Z" fill="#EA580C" />
                <path d="M4 28 L52 17 L41 31 L2 33 Z" fill="#FFFFFF" />
                <path d="M12 42 L48 32 L38 46 L6 45 Z" fill="#EA580C" />
              </svg>

              <div className="flex flex-col items-center leading-none">
                <div className="text-[26px] font-black italic tracking-tight flex items-center">
                  <span className="text-white">MOZ</span>
                  <span className="text-[#F97316]">FÁCIL</span>
                </div>
                <span className="text-xs font-extrabold italic text-white -mt-0.5">
                  Conexões Rápidas
                </span>
                <svg viewBox="0 0 180 10" className="w-40 h-2 -mt-0.5" aria-hidden="true">
                  <path
                    d="M 2 8 Q 90 1 178 4 Q 95 4 2 8 Z"
                    fill="#EA580C"
                  />
                </svg>
              </div>
            </div>

            <p className="text-xs sm:text-[13px] font-medium text-blue-100 leading-snug mt-3 max-w-[250px]">
              A sua plataforma de serviços e oportunidades em Moçambique
            </p>
          </div>
        </div>

        {/* White Rounded Body Container */}
        <div className="flex-1 bg-white rounded-t-[26px] -mt-4 relative z-10 p-4 sm:p-5 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            {/* Primary Button 1: Iniciar sessão (Login) or Active Account */}
            {!firebaseUserUid ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogin();
                }}
                className="w-full rounded-2xl bg-[#051F4E] hover:bg-[#082B6A] text-white px-4 py-3.5 flex items-center justify-between shadow-sm transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <User className="w-7 h-7 text-white fill-white shrink-0" />
                  <div className="text-left leading-tight">
                    <span className="block text-[15px] font-extrabold">
                      Iniciar sessão
                    </span>
                    <span className="block text-xs text-blue-200 font-medium mt-0.5">
                      (Login)
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white shrink-0" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateUtenteRegistration();
                }}
                className="w-full rounded-2xl bg-[#051F4E] hover:bg-[#082B6A] text-white px-4 py-3.5 flex items-center justify-between shadow-sm transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <User className="w-7 h-7 text-emerald-400 fill-emerald-400 shrink-0" />
                  <div className="text-left leading-tight min-w-0">
                    <span className="block text-[14px] font-extrabold truncate">
                      {mozUser?.displayName || userDisplayName || userEmail || 'Utente Autenticado'}
                    </span>
                    <span className="block text-xs text-amber-300 font-bold mt-0.5">
                      {mozUser ? formatUserCreditBalance(mozUser.creditsBalance) : 'Sessão ativa'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white shrink-0" />
              </button>
            )}

            {/* Primary Button 2: Criar conta (Cadastro) */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenModal('register_choice');
              }}
              className="w-full rounded-2xl bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white px-4 py-3.5 flex items-center justify-between shadow-sm transition-all"
            >
              <div className="flex items-center gap-3.5">
                <UserPlus className="w-7 h-7 text-white shrink-0" />
                <div className="text-left leading-tight">
                  <span className="block text-[15px] font-extrabold">
                    Criar conta
                  </span>
                  <span className="block text-xs text-orange-100 font-medium mt-0.5">
                    (Cadastro)
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white shrink-0" />
            </button>

            <div className="border-t border-slate-200 my-2" />

            {/* Menu Item 1: Minha conta */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateUtenteRegistration();
              }}
              className="w-full py-2.5 px-2 rounded-xl hover:bg-slate-100 flex items-center justify-between transition-colors text-left"
            >
              <div className="flex items-center gap-3.5">
                <User className="w-6 h-6 text-[#06204E] fill-[#06204E] shrink-0" />
                <div>
                  <span className="block text-sm font-extrabold text-[#06204E]">
                    Minha conta
                  </span>
                  <span className="block text-xs text-slate-500">
                    Ver e editar dados
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {/* Menu Item 2: Meus favoritos */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenModal('favorites');
              }}
              className="w-full py-2.5 px-2 rounded-xl hover:bg-slate-100 flex items-center justify-between transition-colors text-left"
            >
              <div className="flex items-center gap-3.5">
                <Heart className="w-6 h-6 text-[#06204E] fill-[#06204E] shrink-0" />
                <div>
                  <span className="block text-sm font-extrabold text-[#06204E]">
                    Meus favoritos {favoriteCount > 0 ? `(${favoriteCount})` : ''}
                  </span>
                  <span className="block text-xs text-slate-500">
                    Serviços guardados
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {/* Menu Item 3: Histórico */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenModal('history');
              }}
              className="w-full py-2.5 px-2 rounded-xl hover:bg-slate-100 flex items-center justify-between transition-colors text-left"
            >
              <div className="flex items-center gap-3.5">
                <Clock className="w-6 h-6 text-[#06204E] shrink-0" />
                <div>
                  <span className="block text-sm font-extrabold text-[#06204E]">
                    Histórico
                  </span>
                  <span className="block text-xs text-slate-500">
                    Pesquisas e actividades
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {/* Quick Link to My Profiles if user is signed in */}
            {firebaseUserUid && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateMyProfiles();
                }}
                className="w-full py-2.5 px-2 rounded-xl hover:bg-slate-100 flex items-center justify-between transition-colors text-left"
              >
                <div className="flex items-center gap-3.5">
                  <Briefcase className="w-6 h-6 text-[#06204E] shrink-0" />
                  <div>
                    <span className="block text-sm font-extrabold text-[#06204E]">
                      Meus Perfis ({myProfilesCount})
                    </span>
                    <span className="block text-xs text-slate-500">
                      Gerir perfis e disponibilidade
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            )}

            {/* Quick Link to Admin Console if Admin */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateAdmin();
                }}
                className="w-full py-2.5 px-2 rounded-xl bg-orange-50 hover:bg-orange-100 flex items-center justify-between transition-colors text-left"
              >
                <div className="flex items-center gap-3.5">
                  <Shield className="w-6 h-6 text-[#EA580C] shrink-0" />
                  <div>
                    <span className="block text-sm font-extrabold text-[#06204E]">
                      Painel Administrativo
                    </span>
                    <span className="block text-xs text-slate-600">
                      Aprovação de perfis e categorias
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            )}

            <div className="border-t border-slate-200 my-2" />

            {/* Menu Item 4: Ajuda e suporte */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenModal('help_support');
              }}
              className="w-full py-2.5 px-2 rounded-xl hover:bg-slate-100 flex items-center justify-between transition-colors text-left"
            >
              <div className="flex items-center gap-3.5">
                <Headset className="w-6 h-6 text-[#06204E] shrink-0" />
                <div>
                  <span className="block text-sm font-extrabold text-[#06204E]">
                    Ajuda e suporte
                  </span>
                  <span className="block text-xs text-slate-500">
                    Dúvidas e contacto
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {/* Menu Item 5: Sobre o MozFácil */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenModal('about_mozfacil');
              }}
              className="w-full py-2.5 px-2 rounded-xl hover:bg-slate-100 flex items-center justify-between transition-colors text-left"
            >
              <div className="flex items-center gap-3.5">
                <Info className="w-6 h-6 text-[#06204E] shrink-0" />
                <div>
                  <span className="block text-sm font-extrabold text-[#06204E]">
                    Sobre o MozFácil
                  </span>
                  <span className="block text-xs text-slate-500">
                    Versão e informações
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          </div>

          {/* Logout button at bottom if signed in */}
          {firebaseUserUid && (
            <div className="pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 text-xs font-extrabold flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Terminar Sessão (Sair)</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

interface MozfacilActionModalsProps {
  activeModal: SidebarModalType;
  onClose: () => void;
  favoriteProfiles: ProfessionalProfile[];
  recentProfiles: ProfessionalProfile[];
  recentSearches: string[];
  mozUser?: MozUser | null;
  firebaseUserUid?: string | null;
  onSelectProfile: (prof: ProfessionalProfile) => void;
  onToggleFavorite: (profileId: string) => void;
  onApplySearch: (q: string) => void;
  onNavigateUtenteRegistration: () => void;
  onNavigateProfessionalRegistration: () => void;
  onNavigateCompanyRegistration?: () => void;
  onActivatePackage?: (packageId: CreditPackageId) => Promise<void>;
  onEmergencyDirectCall?: () => Promise<void>;
  onSwitchModal?: (modal: SidebarModalType) => void;
}

export const MozfacilActionModals: React.FC<MozfacilActionModalsProps> = ({
  activeModal,
  onClose,
  favoriteProfiles,
  recentProfiles,
  recentSearches,
  mozUser,
  firebaseUserUid,
  onSelectProfile,
  onToggleFavorite,
  onApplySearch,
  onNavigateUtenteRegistration,
  onNavigateProfessionalRegistration,
  onNavigateCompanyRegistration,
  onActivatePackage,
  onEmergencyDirectCall,
  onSwitchModal,
}) => {
  const [linkCopied, setLinkCopied] = useState(false);
  const [referralCopied, setReferralCopied] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<CreditPackageId>('pack_30');
  const [isActivatingPack, setIsActivatingPack] = useState(false);
  const [packFeedback, setPackFeedback] = useState<string | null>(null);
  const [packError, setPackError] = useState<string | null>(null);

  if (!activeModal) return null;

  const isRegisteredUtente = Boolean(mozUser && mozUser.termsAccepted);
  const personalReferralUrl = buildUserReferralLink(mozUser?.id || firebaseUserUid);

  const shareUrl =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://moz-facil.vercel.app';
  const shareText =
    'Conheça o MOZFÁCIL — Moçambique na Palma da Sua Mão! Encontre o que precisa, divulgue o que oferece e conecte-se a novas oportunidades em todo o país:';

  const handleCopyShareLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => {
        setLinkCopied(true);
      });
    }
  };

  const handleCopyReferralLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(personalReferralUrl).then(() => {
        setReferralCopied(true);
      });
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'MOZFÁCIL — Conexões Rápidas',
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share unavailable
      }
    } else {
      handleCopyShareLink();
    }
  };

  const handleActivateSelectedPackage = async () => {
    setPackFeedback(null);
    setPackError(null);
    if (!isRegisteredUtente) {
      onClose();
      onNavigateUtenteRegistration();
      return;
    }
    if (!onActivatePackage) return;
    setIsActivatingPack(true);
    try {
      await onActivatePackage(selectedPackId);
      const chosen = CREDIT_PACKAGES.find((p) => p.id === selectedPackId);
      setPackFeedback(
        `Pacote ${chosen?.creditsLabel} (${chosen?.durationLabel}) ativado com sucesso na sua conta!`
      );
    } catch (err) {
      setPackError(
        err instanceof Error ? err.message : 'Não foi possível ativar o pacote selecionado.'
      );
    } finally {
      setIsActivatingPack(false);
    }
  };

  const selectedPackageObj =
    CREDIT_PACKAGES.find((p) => p.id === selectedPackId) || CREDIT_PACKAGES[2];

  // =========================================================================
  // SPECIAL FULL-FIDELITY MODAL 1: CONTACTO DIRECTO (Matching image_0c32f208.png)
  // =========================================================================
  if (activeModal === 'direct_contact') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4">
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-[1px]"
          onClick={onClose}
          aria-hidden="true"
        />

        <div className="relative z-10 w-full max-w-[390px] bg-[#FAFBFD] rounded-[28px] shadow-2xl border border-slate-200 px-5 pt-5 pb-5 space-y-3.5 text-center">
          {/* Top-right Close (X) button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Contacto Directo"
            className="absolute right-4 top-4 p-1.5 rounded-full text-[#041B42] hover:bg-slate-200/70 transition-colors"
          >
            <X className="w-7 h-7 stroke-[2.8]" />
          </button>

          {/* Top Emblem: Navy Circle with White Phone + Orange Exclamation Badge + Curved Arcs */}
          <div className="pt-1 flex justify-center">
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* Outer decorative orange arcs */}
              <svg
                viewBox="0 0 120 120"
                className="w-28 h-28"
                aria-hidden="true"
              >
                {/* Top-left orange arc */}
                <path
                  d="M 18 46 A 48 48 0 0 1 64 10"
                  fill="none"
                  stroke="#F97316"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
                {/* Bottom-right orange arc */}
                <path
                  d="M 102 74 A 48 48 0 0 1 56 110"
                  fill="none"
                  stroke="#F97316"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
                {/* Main Dark Navy Circle */}
                <circle cx="58" cy="60" r="42" fill="#052659" />
                {/* White Phone Handset inside Navy Circle */}
                <path
                  d="M44.5 42.5c-1.1-2.4-2.2-2.4-3.3-2.4h-2.8c-1.1 0-2.8.3-4.1 1.9-1.4 1.6-5.2 5-5.2 12.1s5.5 14.3 6.1 15.1c.8 1.1 10.5 16.5 25.9 22.6 12.7 5 15.4 4.1 18.2 3.9 2.8-.3 8.8-3.6 9.9-6.9 1.4-3.6 1.4-6.3.8-6.9-.3-.5-1.4-1.1-3-1.9-1.7-.8-8.8-4.4-10.2-5-1.4-.5-2.5-.8-3.3.8-1.1 1.4-3.9 5-4.7 5.8-.8 1.1-1.7 1.1-3.3.3-1.7-.8-6.6-2.5-12.4-7.7-4.7-4.1-7.7-9.1-8.5-10.7-.8-1.4 0-2.2.6-3 .8-.8 1.7-1.7 2.2-2.5.8-.8 1.1-1.4 1.7-2.5.5-1.1.3-1.9 0-2.8-.6-.8-3-7.7-4.6-10.2z"
                  fill="#FFFFFF"
                  transform="translate(8, 6) scale(0.82)"
                />
                {/* Overlapping Orange Alert Circle on top-right */}
                <circle
                  cx="87"
                  cy="38"
                  r="19"
                  fill="#F97316"
                  stroke="#FAFBFD"
                  strokeWidth="4"
                />
                {/* Exclamation mark inside orange circle */}
                <rect x="84.5" y="25" width="5" height="14" rx="2.5" fill="#FFFFFF" />
                <circle cx="87" cy="45.5" r="3" fill="#FFFFFF" />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <h3 className="text-[26px] font-black text-[#041B42] tracking-tight leading-none">
            Contacto Directo
          </h3>

          {/* Box 1: Warm Cream Warning ("Apenas para casos emergentes.") */}
          <div className="rounded-2xl bg-[#FFF3E6] border-[1.5px] border-[#F97316]/85 px-3.5 py-2.5 flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-full bg-[#F97316] flex items-center justify-center shrink-0">
              <span className="text-white font-black text-xl leading-none">!</span>
            </div>
            <div className="h-7 w-[1px] bg-[#F97316]/45 shrink-0" aria-hidden="true" />
            <span className="text-[15px] sm:text-base font-extrabold text-[#041B42] leading-snug">
              Apenas para casos emergentes.
            </span>
          </div>

          {/* Box 2: Light Slate Info ("Se o seu caso não é urgente, use a consulta por texto ou voz.") */}
          <div className="rounded-2xl bg-[#EAF1F8] border border-slate-200/90 px-4 py-3 text-center">
            <p className="text-[14.5px] sm:text-[15.5px] font-medium text-[#041B42] leading-snug">
              Se o seu caso não é urgente,
              <br />
              use a consulta por texto ou voz.
            </p>
          </div>

          {/* Box 3: Cost Row ("Custo: 50 créditos") */}
          <div className="rounded-2xl bg-[#EDF2F7] border border-slate-200/90 px-3.5 py-2.5 flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-full bg-[#052659] flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5 text-[#F97316]" />
            </div>
            <div className="h-7 w-[1px] bg-slate-300 shrink-0" aria-hidden="true" />
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-base font-extrabold text-[#041B42]">Custo:</span>
              <span className="text-[22px] font-black text-[#EA580C] tracking-tight">
                50 créditos
              </span>
            </div>
          </div>

          {/* Primary Action Button: Ligar Agora */}
          <a
            href="tel:+258843001234"
            onClick={() => {
              if (onEmergencyDirectCall) {
                onEmergencyDirectCall().catch(() => {});
              }
            }}
            className="w-full rounded-2xl bg-[#052659] hover:bg-[#073170] border-[2px] border-[#F97316] shadow-[0_4px_14px_rgba(5,38,89,0.3)] py-3.5 px-5 flex items-center justify-center gap-4 text-white transition-all active:scale-[0.99]"
          >
            <div className="relative flex items-center justify-center shrink-0">
              <Phone className="w-7 h-7 text-white fill-white" />
              <span
                aria-hidden="true"
                className="w-2.5 h-2.5 rounded-full border-t-2 border-r-2 border-[#F97316] absolute -top-1 -right-1"
              />
            </div>
            <div className="h-7 w-[1px] bg-white/35 shrink-0" aria-hidden="true" />
            <span className="text-[22px] font-black tracking-tight">Ligar Agora</span>
          </a>

          {/* Secondary Action Button: Cancelar */}
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-white hover:bg-slate-50 border-[1.5px] border-[#052659] py-2.5 text-base font-extrabold text-[#041B42] transition-colors"
          >
            Cancelar
          </button>

          {/* Bottom Orange CTA Button: Cadastre-se */}
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onSwitchModal) {
                onSwitchModal('register_choice');
              } else {
                onNavigateUtenteRegistration();
              }
            }}
            className="w-full rounded-2xl bg-gradient-to-r from-[#FF6B00] via-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] py-3 px-4 flex items-center justify-between text-white shadow-md transition-all active:scale-[0.99]"
          >
            <div className="flex items-center justify-center flex-1 gap-3 pl-4">
              <UserPlus className="w-6 h-6 text-white fill-white shrink-0" />
              <div className="h-6 w-[1px] bg-white/45 shrink-0" aria-hidden="true" />
              <span className="text-[19px] font-black tracking-tight">Cadastre-se</span>
            </div>
            <ChevronRight className="w-6 h-6 text-white stroke-[2.8] shrink-0" />
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SPECIAL FULL-FIDELITY MODAL 2: INFORMAÇÃO AO UTENTE
  // (Matching image_4673b5f6.png, image_1f97c858.png, image_a9e1aa88.png)
  // =========================================================================
  if (activeModal === 'user_info') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-[1px]"
          onClick={onClose}
          aria-hidden="true"
        />

        <div className="relative z-10 w-full max-w-[420px] bg-[#F3F6FA] rounded-[26px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header matching Serviços MozFácil & Termos de Uso */}
          <div className="bg-gradient-to-b from-[#173766] via-[#0F2C56] to-[#081F42] text-white px-5 py-4 flex items-center gap-3.5 shrink-0">
            <div className="w-12 h-12 rounded-full border-[3px] border-[#EA580C] bg-[#061A3E] flex items-center justify-center shrink-0 shadow-md">
              <Settings className="w-6 h-6 text-white stroke-[2.4]" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-[17px] sm:text-[19px] font-extrabold tracking-tight leading-tight text-white uppercase">
                Serviços MozFácil &amp; Termos de Uso
              </h3>
              <p className="text-xs sm:text-[13px] text-blue-100/95 leading-snug mt-0.5">
                Canais de apoio, pacotes e condições de utilização
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar Serviços MozFácil e Termos de Uso"
              className="p-1.5 rounded-lg text-white/85 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            >
              <X className="w-6 h-6 stroke-[2.3]" />
            </button>
          </div>

          {/* Scrollable Cards Body */}
          <div className="p-4 space-y-3.5 overflow-y-auto flex-1">
            {/* Apresentação da Plataforma — Leitura limpa, coluna única e sem repetições */}
            <div className="bg-gradient-to-br from-[#08224A] to-[#0D316E] rounded-2xl p-4 text-white shadow-xs border border-blue-900/20">
              <p className="text-[14px] sm:text-[14.5px] font-medium text-blue-50 leading-relaxed">
                Encontre o que precisa, divulgue o que oferece e conecte-se a novas oportunidades em todo o país, de forma rápida e segura.
              </p>
            </div>

            {/* Card 1 Interativo: Registo de empresas, profissionais e serviços (100% GRATUITO) */}
            <button
              type="button"
              onClick={() => {
                if (onSwitchModal) {
                  onSwitchModal('register_choice');
                } else {
                  onClose();
                  onNavigateUtenteRegistration();
                }
              }}
              className="w-full text-left bg-white hover:bg-orange-50/40 active:scale-[0.99] rounded-2xl p-4 shadow-xs border border-slate-200/90 hover:border-[#EA580C]/50 transition-all group space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <h4 className="text-[16px] sm:text-[17px] font-extrabold text-[#0B2545] leading-snug">
                    Registo de empresas, profissionais e serviços
                  </h4>
                  <div className="text-[20px] sm:text-[22px] font-black text-[#EA580C] tracking-tight leading-none pt-0.5">
                    100% GRATUITO
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#FEF3E7] group-hover:bg-[#EA580C] text-[#EA580C] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                  <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                </div>
              </div>
              <p className="text-[13.5px] text-slate-600 leading-relaxed">
                Cadastre-se gratuitamente e comece a divulgar os seus produtos, serviços ou empresa em todo o país.
              </p>
            </button>

            {/* Card 2 Interativo: Linha do Cliente (Via WhatsApp · GRÁTIS) */}
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/90 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#FEF3E7] flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-[#EA580C] stroke-[2.3]" />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div>
                  <h4 className="text-[16px] sm:text-[17px] font-extrabold text-[#0B2545] leading-tight">
                    Linha do Cliente
                  </h4>
                  <div className="text-[14px] font-extrabold text-[#EA580C] mt-0.5">
                    Via WhatsApp · GRÁTIS
                  </div>
                </div>
                <p className="text-[13.5px] text-slate-600 leading-relaxed">
                  Apoio geral e esclarecimentos sobre o uso da plataforma para utilizadores registados.
                </p>
                {isRegisteredUtente ? (
                  <div className="pt-1">
                    <a
                      href="https://wa.me/258843001234?text=Ol%C3%A1%20Linha%20do%20Cliente%2C%20preciso%20de%20apoio."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Abrir Linha do Cliente no WhatsApp</span>
                    </a>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (onSwitchModal) {
                        onSwitchModal('register_choice');
                      } else {
                        onClose();
                        onNavigateUtenteRegistration();
                      }
                    }}
                    className="pt-1 inline-flex items-center gap-1.5 text-[12px] font-extrabold text-[#EA580C] hover:text-[#C2410C] transition-colors text-left"
                  >
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span className="underline underline-offset-2">
                      Concluir registo gratuito para desbloquear
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Card 3: Consulta Normal (Por SMS ou voz + 1 crédito = 1 MT + 4 Interactive Packages) */}
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/90 space-y-3">
              <div>
                <h4 className="text-[16px] sm:text-[17px] font-extrabold text-[#0B2545] leading-tight">
                  Consulta Normal
                </h4>
                <div className="text-[14px] font-extrabold text-[#EA580C] mt-0.5">
                  Por SMS ou voz
                </div>
              </div>

              {/* Warm Cream Box: 1 crédito = 1 MT */}
              <div className="rounded-2xl bg-[#FEF3E7] p-3.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-[#EA580C] shrink-0" />
                  <span className="text-[19px] font-black text-[#0B2545] tracking-tight">
                    1 crédito = 1 MT
                  </span>
                </div>
                <p className="text-[13px] text-slate-700 leading-relaxed">
                  As consultas são efectuadas através de créditos. Cada crédito corresponde a 1 metical (MT).
                </p>
              </div>

              {/* 4 Interactive Package Rows */}
              <div className="space-y-2" role="radiogroup" aria-label="Pacotes de acesso">
                {CREDIT_PACKAGES.map((pack) => {
                  const isSelected = selectedPackId === pack.id;
                  return (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => {
                        setSelectedPackId(pack.id);
                        setPackFeedback(null);
                        setPackError(null);
                      }}
                      className={`w-full rounded-xl px-4 py-3 flex items-center justify-between transition-all text-left ${
                        isSelected
                          ? 'bg-[#EFF3F8] ring-2 ring-[#EA580C] shadow-xs'
                          : 'bg-[#EFF3F8] hover:bg-[#E4ECF5]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[16px] font-extrabold text-[#0B2545]">
                          {pack.creditsLabel}
                        </span>
                        {pack.badge && (
                          <span
                            className={`text-[10.5px] font-extrabold px-2 py-0.5 rounded-md ${
                              pack.id === 'pack_100'
                                ? 'bg-[#EA580C] text-white'
                                : pack.id === 'pack_30'
                                  ? 'bg-[#0B2545] text-white'
                                  : 'bg-white text-slate-600 border border-slate-200'
                            }`}
                          >
                            {pack.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[15.5px] font-extrabold text-[#EA580C] shrink-0">
                        {pack.durationLabel}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Harmonious Single-Column Selected Package Action Box */}
              <div className="rounded-xl bg-slate-50 border border-slate-200/90 p-3.5 space-y-2.5">
                <div className="space-y-0.5">
                  <div className="text-xs font-extrabold text-[#0B2545] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
                    <span>
                      Pacote selecionado: {selectedPackageObj.creditsLabel} ({selectedPackageObj.durationLabel})
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-600 leading-snug">
                    {selectedPackageObj.benefitText}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isActivatingPack}
                  onClick={handleActivateSelectedPackage}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs sm:text-[13px] font-extrabold transition-colors disabled:opacity-60 shadow-2xs"
                >
                  {isActivatingPack
                    ? 'A ativar pacote...'
                    : isRegisteredUtente
                      ? `Ativar Pacote (${selectedPackageObj.priceMzn} MT)`
                      : 'Concluir Registo para Ativar Pacote'}
                </button>
              </div>

              {packFeedback && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{packFeedback}</span>
                </div>
              )}

              {packError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700">
                  {packError}
                </div>
              )}
            </div>

            {/* Indique e Ganhe matching image_a9e1aa88.png */}
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#FEF3E7] flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5 text-[#EA580C]" />
              </div>
              <div className="space-y-2 flex-1 min-w-0">
                <h4 className="text-[16px] sm:text-[17px] font-extrabold text-[#0B2545] leading-tight">
                  Indique e Ganhe
                </h4>
                <p className="text-[13.5px] text-slate-600 leading-relaxed">
                  Partilhe o seu link. Quando a pessoa indicada fizer a primeira consulta paga, recebe créditos equivalentes ao valor elegível. O cadastro não gera recompensa.
                </p>

                {/* Personal Referral Link Share Bar */}
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyReferralLink}
                    className="px-3 py-1.5 rounded-xl bg-[#FEF3E7] hover:bg-orange-100 text-[#0B2545] text-xs font-extrabold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#EA580C]" />
                    <span>
                      {referralCopied ? 'Link de convite copiado!' : 'Copiar meu link de convite'}
                    </span>
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Conheça a plataforma MozFácil (Moçambique na Palma da Sua Mão): ${personalReferralUrl}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Partilhar</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom Buttons matching image_a9e1aa88.png */}
            <div className="pt-1 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onSwitchModal) {
                    onSwitchModal('register_choice');
                  } else {
                    onNavigateUtenteRegistration();
                  }
                }}
                className="w-full py-3.5 rounded-full bg-[#111827] hover:bg-[#1E293B] text-white text-[15.5px] font-extrabold tracking-tight shadow-sm transition-colors"
              >
                Cadastre-se Agora
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 rounded-full bg-white hover:bg-slate-100 border border-slate-300 text-[#0B2545] text-[15.5px] font-extrabold tracking-tight transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SPECIAL FULL-FIDELITY MODAL 3: CADASTRE-SE AGORA NO MOZFÁCIL
  // (Matching image_c49d4897.png — Unified Navy & Orange palette)
  // =========================================================================
  if (activeModal === 'register_choice') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-[1px]"
          onClick={onClose}
          aria-hidden="true"
        />

        <div className="relative z-10 w-full max-w-[420px] bg-white rounded-[26px] shadow-[0_20px_50px_rgba(0,0,0,0.45)] border border-white/80 overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header with Navy Gradient, Orange "MozFácil" highlight, and Curved Orange/Gold Swooshes */}
          <div className="relative bg-gradient-to-b from-[#082A66] via-[#051D49] to-[#031230] text-white pt-4 pb-6 px-5 shrink-0 overflow-hidden">
            <div className="relative z-10 flex items-center justify-between gap-2">
              <h3 className="text-[20px] sm:text-[22px] font-extrabold tracking-tight leading-tight text-white">
                Cadastre-se Agora no{' '}
                <span className="text-[#FF6B00]">MozFácil</span>
              </h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar janela de cadastro"
                className="p-1 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              >
                <X className="w-6 h-6 stroke-[2.2]" />
              </button>
            </div>

            {/* Bottom Decorative Orange & Amber Swooshes matching reference print */}
            <svg
              viewBox="0 0 420 28"
              preserveAspectRatio="none"
              className="pointer-events-none absolute bottom-0 inset-x-0 w-full h-5"
              aria-hidden="true"
            >
              {/* Left-to-center orange wave */}
              <path
                d="M0,6 Q115,27 255,26 L0,28 Z"
                fill="#020E26"
                opacity="0.65"
              />
              <path
                d="M0,4 Q120,25 265,26"
                fill="none"
                stroke="#EA580C"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Right-to-center warm gold/orange wave */}
              <path
                d="M215,27 Q335,23 420,3"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M245,27 Q345,25 420,10"
                fill="none"
                stroke="#EA580C"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.85"
              />
            </svg>
          </div>

          {/* Modal Body */}
          <div className="px-4 sm:px-5 pt-3.5 pb-5 space-y-3.5 overflow-y-auto">
            <p className="text-[14.5px] sm:text-[15.5px] font-medium text-[#061E45] leading-snug">
              Escolha o tipo de registo gratuito que pretende efetuar:
            </p>

            {/* Card 1: 1. Cadastro do Utente (Consultar Serviços) — Navy & Soft Blue */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateUtenteRegistration();
              }}
              className="w-full rounded-[20px] border-[2px] border-[#062356] bg-[#EEF5FC] hover:bg-[#E3EFFB] px-3.5 sm:px-4 py-3.5 flex items-center gap-3.5 text-left transition-all active:scale-[0.99]"
            >
              {/* Solid Navy User Silhouette Icon */}
              <div className="w-11 sm:w-12 flex items-center justify-center shrink-0">
                <svg
                  viewBox="0 0 48 48"
                  className="w-11 h-11 sm:w-12 sm:h-12"
                  aria-hidden="true"
                >
                  <circle cx="24" cy="15" r="8.5" fill="#062356" />
                  <path
                    d="M8 39c0-7.8 6.8-13 16-13s16 5.2 16 13v2H8v-2z"
                    fill="#062356"
                  />
                </svg>
              </div>

              {/* Vertical Divider */}
              <div
                className="w-[1px] self-stretch my-1 bg-[#062356]/25 shrink-0"
                aria-hidden="true"
              />

              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <div className="text-[16.5px] sm:text-[18px] font-extrabold text-[#062356] leading-tight">
                  1. Cadastro do Utente
                  <br />
                  (Consultar Serviços)
                </div>
                <p className="text-[13px] sm:text-[14px] text-[#1E293B] leading-snug mt-1.5 font-normal">
                  Registe os seus dados para consultar profissionais, empresas e serviços em Moçambique.
                </p>
              </div>

              {/* Orange Right Chevron */}
              <ChevronRight className="w-6 h-6 text-[#FF6B00] stroke-[2.8] shrink-0" />
            </button>

            {/* Card 2: 2. Cadastrar Profissional / Serviço (100% Gratuito) — Orange & Warm Cream */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateProfessionalRegistration();
              }}
              className="w-full rounded-[20px] border-[2px] border-[#FF6B00] bg-[#FFF5EC] hover:bg-[#FEEBD9] px-3.5 sm:px-4 py-3.5 flex items-center gap-3.5 text-left transition-all active:scale-[0.99]"
            >
              {/* Solid Orange Professional with Hard Hat Icon */}
              <div className="w-11 sm:w-12 flex items-center justify-center shrink-0">
                <svg
                  viewBox="0 0 48 48"
                  className="w-11 h-11 sm:w-12 sm:h-12"
                  aria-hidden="true"
                >
                  {/* Hard Hat Dome & Rib */}
                  <path
                    d="M14 15c0-5.2 4.3-9.5 10-9.5s10 4.3 10 9.5H14z"
                    fill="#FF6B00"
                  />
                  <rect x="22.2" y="4" width="3.6" height="11" rx="1.5" fill="#FFF5EC" />
                  <rect x="22.8" y="4" width="2.4" height="11" rx="1" fill="#FF6B00" />
                  {/* Hard Hat Brim */}
                  <rect x="11.5" y="15" width="25" height="3" rx="1.5" fill="#FF6B00" />
                  {/* Head */}
                  <path
                    d="M16.5 19.5h15c0 4.6-3.4 8.2-7.5 8.2s-7.5-3.6-7.5-8.2z"
                    fill="#FF6B00"
                  />
                  {/* Shoulders / Collar */}
                  <path
                    d="M8 40c0-6.8 5.6-10.5 12.2-11.2L24 33l3.8-4.2C34.4 29.5 40 33.2 40 40v1.5H8V40z"
                    fill="#FF6B00"
                  />
                </svg>
              </div>

              {/* Vertical Divider */}
              <div
                className="w-[1px] self-stretch my-1 bg-[#FF6B00]/35 shrink-0"
                aria-hidden="true"
              />

              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <div className="text-[16.5px] sm:text-[18px] font-extrabold text-[#EA580C] leading-tight">
                  2. Cadastrar Profissional / Serviço (100% Gratuito)
                </div>
                <p className="text-[13px] sm:text-[14px] text-[#1E293B] leading-snug mt-1.5 font-normal">
                  Divulgue a sua profissão, oficina, prestação de serviços ou atividade móvel no diretório público.
                </p>
              </div>

              {/* Orange Right Chevron */}
              <ChevronRight className="w-6 h-6 text-[#FF6B00] stroke-[2.8] shrink-0" />
            </button>

            {/* Card 3: 3. Cadastrar Empresa / Instituição (100% Gratuito) — Unified Navy & Soft Blue */}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onNavigateCompanyRegistration) {
                  onNavigateCompanyRegistration();
                } else {
                  onNavigateProfessionalRegistration();
                }
              }}
              className="w-full rounded-[20px] border-[2px] border-[#062356] bg-[#EEF5FC] hover:bg-[#E3EFFB] px-3.5 sm:px-4 py-3.5 flex items-center gap-3.5 text-left transition-all active:scale-[0.99]"
            >
              {/* Solid Navy Twin Buildings Icon matching reference print */}
              <div className="w-11 sm:w-12 flex items-center justify-center shrink-0">
                <svg
                  viewBox="0 0 48 48"
                  className="w-11 h-11 sm:w-12 sm:h-12"
                  aria-hidden="true"
                >
                  {/* Left Shorter Building */}
                  <rect x="6" y="18" width="12" height="24" rx="1.5" fill="#062356" />
                  <rect x="8.5" y="21" width="2.8" height="2.8" fill="#EEF5FC" />
                  <rect x="12.7" y="21" width="2.8" height="2.8" fill="#EEF5FC" />
                  <rect x="8.5" y="26" width="2.8" height="2.8" fill="#EEF5FC" />
                  <rect x="12.7" y="26" width="2.8" height="2.8" fill="#EEF5FC" />
                  <rect x="8.5" y="31" width="2.8" height="2.8" fill="#EEF5FC" />
                  <rect x="12.7" y="31" width="2.8" height="2.8" fill="#EEF5FC" />
                  <rect x="8.5" y="36" width="2.8" height="2.8" fill="#EEF5FC" />
                  <rect x="12.7" y="36" width="2.8" height="2.8" fill="#EEF5FC" />

                  {/* Center Taller Building */}
                  <rect x="20" y="9" width="14" height="33" rx="1.5" fill="#062356" />
                  <rect x="23" y="12.5" width="3" height="3" fill="#EEF5FC" />
                  <rect x="28" y="12.5" width="3" height="3" fill="#EEF5FC" />
                  <rect x="23" y="18" width="3" height="3" fill="#EEF5FC" />
                  <rect x="28" y="18" width="3" height="3" fill="#EEF5FC" />
                  <rect x="23" y="23.5" width="3" height="3" fill="#EEF5FC" />
                  <rect x="28" y="23.5" width="3" height="3" fill="#EEF5FC" />
                  <rect x="23" y="29" width="3" height="3" fill="#EEF5FC" />
                  <rect x="28" y="29" width="3" height="3" fill="#EEF5FC" />
                  {/* Door on Center Building */}
                  <rect x="25" y="35" width="4" height="7" fill="#EEF5FC" />

                  {/* Right Annex Building */}
                  <rect x="35.5" y="22" width="7.5" height="20" rx="1" fill="#062356" />
                  <rect x="37.8" y="25" width="3" height="2.8" fill="#EEF5FC" />
                  <rect x="37.8" y="30" width="3" height="2.8" fill="#EEF5FC" />
                  <rect x="37.8" y="35" width="3" height="2.8" fill="#EEF5FC" />
                </svg>
              </div>

              {/* Vertical Divider */}
              <div
                className="w-[1px] self-stretch my-1 bg-[#062356]/25 shrink-0"
                aria-hidden="true"
              />

              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <div className="text-[16.5px] sm:text-[18px] font-extrabold text-[#062356] leading-tight">
                  3. Cadastrar Empresa / Instituição (100% Gratuito)
                </div>
                <p className="text-[13px] sm:text-[14px] text-[#1E293B] leading-snug mt-1.5 font-normal">
                  Registe a sua empresa privada, instituição pública, ONG ou agência no diretório nacional de Empresas.
                </p>
              </div>

              {/* Orange Right Chevron */}
              <ChevronRight className="w-6 h-6 text-[#FF6B00] stroke-[2.8] shrink-0" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#051F4E] to-[#0D316E] text-white px-5 py-4 flex items-center justify-between">
          <h3 className="text-base font-extrabold">
            {activeModal === 'customer_line' && 'Linha do Cliente — Via WhatsApp'}
            {activeModal === 'share_mozfacil' &&
              'É moçambicano? Partilhe o MozFácil!'}
            {activeModal === 'favorites' && 'Meus Favoritos (Serviços Guardados)'}
            {activeModal === 'history' && 'Histórico de Pesquisas e Atividades'}
            {activeModal === 'help_support' && 'Ajuda e Suporte MozFácil'}
            {activeModal === 'about_mozfacil' && 'Sobre a Plataforma MozFácil'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
          {/* 0. CUSTOMER LINE GATE MODAL ("Linha do Cliente - Apenas para pessoas registadas") */}
          {activeModal === 'customer_line' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#FEF3E7] border border-orange-200 flex items-start gap-3">
                <MessageCircle className="w-6 h-6 text-[#EA580C] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-extrabold text-[#0B2545] text-base">
                    Linha do Cliente · Via WhatsApp · GRÁTIS
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Apoio geral e esclarecimentos sobre o uso da plataforma. <strong>Apenas para pessoas registadas.</strong>
                  </p>
                </div>
              </div>

              {isRegisteredUtente ? (
                <a
                  href="https://wa.me/258843001234?text=Ol%C3%A1%20Linha%20do%20Cliente%20MozF%C3%A1cil%2C%20preciso%20de%20apoio."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <MessageCircle className="w-5 h-5" />
                    <span>Conversar Agora no WhatsApp (GRÁTIS)</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </a>
              ) : (
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateUtenteRegistration();
                    }}
                    className="w-full p-3.5 rounded-xl bg-gradient-to-r from-[#EA580C] to-[#F97316] hover:from-[#C2410C] hover:to-[#EA580C] text-white font-extrabold flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <UserPlus className="w-5 h-5" />
                      <span>Cadastre-se Agora (Registo Gratuito)</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {onSwitchModal && (
                    <button
                      type="button"
                      onClick={() => onSwitchModal('direct_contact')}
                      className="w-full p-3.5 rounded-xl bg-[#052659] hover:bg-[#0D316E] text-white font-extrabold flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <Phone className="w-5 h-5 text-[#F97316]" />
                        <span>Caso Emergente? Usar Contacto Directo (50 MT)</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 1C. SHARE MOZFACIL MODAL ("É moçambicano?") */}
          {activeModal === 'share_mozfacil' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 space-y-1.5">
                <div className="font-black text-[#07214E] text-base">
                  Ajude a colocar Moçambique na palma de cada moçambicano!
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Convide amigos, familiares, profissionais autónomos, oficinas e empresas a fazerem parte da maior rede de conexões rápidas de Moçambique.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <MessageCircle className="w-5 h-5" />
                    <span>Partilhar no WhatsApp</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </a>

                <a
                  href={`sms:?body=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
                  className="p-3.5 rounded-xl bg-[#0D316E] hover:bg-[#051F4E] text-white font-extrabold flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Share2 className="w-5 h-5" />
                    <span>Enviar Convite por SMS</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="p-3.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-extrabold flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Share2 className="w-5 h-5" />
                    <span>Partilhar noutros Aplicativos</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="p-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#07214E] font-extrabold flex items-center justify-between border border-slate-200"
                >
                  <div className="flex items-center gap-2.5">
                    <Copy className="w-5 h-5 text-[#EA580C]" />
                    <span>
                      {linkCopied
                        ? 'Link copiado para a área de transferência!'
                        : 'Copiar Link do MozFácil'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
          )}

          {/* 2. FAVORITES MODAL */}
          {activeModal === 'favorites' && (
            <div className="space-y-3">
              {favoriteProfiles.length > 0 ? (
                favoriteProfiles.map((prof) => (
                  <div
                    key={prof.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-extrabold text-[#0D316E] truncate">
                        {prof.displayName}
                      </div>
                      <div className="text-xs text-slate-600 truncate">
                        {prof.primaryCategoryName} · {prof.neighborhood}, {prof.district}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onSelectProfile(prof);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#0D316E] text-white text-xs font-bold"
                      >
                        Abrir
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(prof.id)}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                        title="Remover dos favoritos"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 space-y-2">
                  <Heart className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-[#0D316E]">
                    Ainda não guardou nenhum serviço nos favoritos.
                  </p>
                  <p className="text-xs text-slate-500">
                    Explore o módulo de Profissionais e Serviços para guardar os contactos da sua preferência.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 3. HISTORY MODAL */}
          {activeModal === 'history' && (
            <div className="space-y-4">
              {mozUser && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-[#EA580C]" />
                    <div>
                      <div className="font-extrabold text-[#0D316E]">
                        Resumo da Conta de Consultas
                      </div>
                      <div className="text-xs text-slate-600">
                        Consultas efetuadas: <strong>{mozUser.consultationsCount}</strong> · Saldo:{' '}
                        <strong>{formatUserCreditBalance(mozUser.creditsBalance)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-extrabold text-[#0D316E] text-xs uppercase tracking-wider">
                  Pesquisas Recentes
                </h4>
                {recentSearches.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          onClose();
                          onApplySearch(q);
                        }}
                        className="px-3 py-1 rounded-full bg-slate-100 hover:bg-blue-50 text-[#0D316E] text-xs font-semibold"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Nenhuma pesquisa efetuada nesta sessão.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-[#0D316E] text-xs uppercase tracking-wider">
                  Perfis Visualizados Recentemente
                </h4>
                {recentProfiles.length > 0 ? (
                  <div className="space-y-2">
                    {recentProfiles.map((prof) => (
                      <button
                        key={prof.id}
                        type="button"
                        onClick={() => {
                          onClose();
                          onSelectProfile(prof);
                        }}
                        className="w-full p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-left"
                      >
                        <div>
                          <div className="font-bold text-[#0D316E] text-xs">
                            {prof.displayName}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#F97316]" />
                            <span>
                              {prof.primaryCategoryName} · {prof.district}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Nenhum perfil consultado recentemente.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 4. HELP & SUPPORT MODAL */}
          {activeModal === 'help_support' && (
            <div className="space-y-4">
              <p className="text-slate-600 leading-relaxed">
                A nossa equipa de suporte apoia utentes, profissionais e empresas em todas as províncias de Moçambique.
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                {isRegisteredUtente ? (
                  <a
                    href="https://wa.me/258843001234"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center justify-between shadow-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <MessageCircle className="w-5 h-5" />
                      <span>Linha do Cliente · WhatsApp (GRÁTIS)</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (onSwitchModal) onSwitchModal('customer_line');
                    }}
                    className="p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center justify-between shadow-xs text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <MessageCircle className="w-5 h-5" />
                      <span>Linha do Cliente · WhatsApp (Registados)</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (onSwitchModal) onSwitchModal('direct_contact');
                  }}
                  className="p-3.5 rounded-xl bg-[#0D316E] hover:bg-[#051F4E] text-white font-extrabold flex items-center justify-between shadow-xs text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-5 h-5 text-[#F97316]" />
                    <span>Contacto Directo Emergente (50 créditos)</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 space-y-1.5 text-xs text-slate-700">
                <div className="font-extrabold text-[#0D316E]">
                  Resumo de Custos:
                </div>
                <p>
                  • Registo de empresas, profissionais e serviços: <strong>100% GRATUITO</strong>.
                </p>
                <p>
                  • Consulta Normal ({getConsultationCreditCostFormatted()}): pacotes de <strong>1, 5, 30 ou 100 créditos</strong> para pessoas registadas.
                </p>
              </div>
            </div>
          )}

          {/* 5. ABOUT MOZFACIL MODAL */}
          {activeModal === 'about_mozfacil' && (
            <div className="space-y-3.5">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-6 h-6 text-[#F97316] shrink-0" />
                <div>
                  <div className="font-extrabold text-[#0D316E] text-sm">
                    Conexões Rápidas
                  </div>
                  <div className="text-xs text-slate-500">
                    Moçambique na Palma da Sua Mão
                  </div>
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed">
                Plataforma digital integrada de serviços, profissionais independentes, empresas, oportunidades e utilidade pública em todo o país.
              </p>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs text-slate-600">
                <div>
                  <strong>Cobertura Geográfica:</strong> Todas as 11 Províncias, Distritos, Localidades e Bairros de Moçambique.
                </div>
                <div>
                  <strong>Módulos Integrados:</strong> 12 Módulos Oficiais (Profissionais e Serviços e Empresas e Instituições ativos e operacionais).
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
