import React, { useRef, useState } from 'react';
import {
  Search,
  Mic,
  Headset,
  Phone,
  ChevronRight,
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
} from 'lucide-react';
import {
  MozUser,
  ProfessionalProfile,
  formatUserCreditBalance,
  getConsultationCreditCostFormatted,
  getInitialWelcomeCreditsFormatted,
  PRICING_CONFIG,
} from '../types/mozfacil';

interface MozfacilHomeScreenProps {
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onSubmitSearch: (q: string) => void;
  onOpenDirectContact: () => void;
  onOpenUserInfo?: () => void;
  onOpenRegisterChoice?: () => void;
  onOpenShareMozfacil?: () => void;
  onOpenExploreModules: () => void;
  onOpenProfessionalsDirectory: () => void;
}

export const MozfacilHomeScreen: React.FC<MozfacilHomeScreenProps> = ({
  searchQuery,
  onSearchQueryChange,
  onSubmitSearch,
  onOpenDirectContact,
  onOpenUserInfo,
  onOpenRegisterChoice,
  onOpenShareMozfacil,
}) => {
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
      <div className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-evenly text-center gap-1.5 sm:gap-2.5">
        {/* 1. Hero Headline Block */}
        <div className="space-y-0.5 w-full">
          <h1 className="text-[25px] sm:text-[30px] font-black uppercase tracking-wide text-white leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
            MOÇAMBIQUE
          </h1>
          <p className="text-[16px] sm:text-[19px] font-black uppercase tracking-tight text-[#F97316] leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]">
            NA PALMA DA SUA MÃO
          </p>

          {/* Golden-Yellow Glowing Horizon Flare Divider */}
          <div className="relative w-4/5 max-w-[260px] mx-auto py-1">
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent" />
            <div className="absolute inset-x-1/4 top-0.5 h-[3.5px] bg-gradient-to-r from-transparent via-[#FDE047] to-transparent blur-[1.5px]" />
          </div>

          <p className="text-[12.5px] sm:text-[14px] font-normal text-white/95 leading-[1.3] max-w-[335px] mx-auto">
            Encontre o que precisa, divulgue o que oferece e conecte-se a novas oportunidades em todo o país, de forma rápida e segura.
          </p>
        </div>

        {/* 2. White Pill Search Bar matching reference print ("Pesquise o que precisa / pela mensagem ou pela voz") */}
        <form
          onSubmit={handleFormSubmit}
          className="w-full bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFC] to-[#E2E8F0] rounded-full shadow-[0_5px_18px_rgba(0,0,0,0.38)] border border-white px-3.5 py-2 flex items-center gap-2.5 shrink-0"
        >
          <button
            type="submit"
            aria-label="Pesquisar"
            className="text-[#EA580C] hover:text-[#C2410C] transition-colors shrink-0 pl-0.5"
          >
            <Search className="w-6 h-6 stroke-[2.3]" />
          </button>

          <div className="h-7 w-[1px] bg-slate-300/90 shrink-0" aria-hidden="true" />

          <div
            className="relative flex-1 min-w-0 text-left cursor-text"
            onClick={() => searchInputRef.current?.focus()}
          >
            {showTwoLinePlaceholder && (
              <div className="pointer-events-none select-none leading-tight">
                <div className="text-[14px] sm:text-[15px] font-extrabold text-[#07214E] truncate">
                  Pesquise o que precisa
                </div>
                <div className="text-[11.5px] sm:text-[12.5px] font-normal text-slate-500 truncate">
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
              aria-label="Pesquise serviços, contactos e obtenha soluções..."
              placeholder={
                showTwoLinePlaceholder
                  ? ''
                  : 'Pesquise o que precisa pela mensagem ou pela voz...'
              }
              className={`w-full bg-transparent text-[#07214E] placeholder:text-slate-400 text-sm font-bold focus:outline-none min-w-0 ${
                showTwoLinePlaceholder ? 'opacity-0 absolute inset-0' : 'py-1'
              }`}
            />
          </div>

          <div className="h-7 w-[1px] bg-slate-300/90 shrink-0" aria-hidden="true" />

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
            <Mic className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
          </button>
        </form>

        {/* 3. "Informação ao Utente" Glowing Orange-Bordered Card */}
        <button
          type="button"
          onClick={() => (onOpenUserInfo ? onOpenUserInfo() : onOpenDirectContact())}
          aria-label="Informação ao Utente - Contacto directo - Fale directamente com a equipa MOZFÁCIL"
          className="w-full rounded-[22px] bg-gradient-to-r from-[#031330]/95 via-[#061F4C]/95 to-[#031330]/95 border-[1.5px] border-[#F97316] shadow-[0_0_18px_rgba(249,115,22,0.32)] hover:shadow-[0_0_24px_rgba(249,115,22,0.52)] px-3.5 py-2 flex items-center gap-3 text-left transition-all group shrink-0"
        >
          {/* Thick Orange Circle with bold 'i' matching reference screenshot */}
          <div className="shrink-0 flex items-center justify-center pl-0.5">
            <div className="w-10 h-10 rounded-full border-[3px] border-[#EA580C] flex items-center justify-center shadow-[0_0_10px_rgba(234,88,12,0.3)]">
              <span className="text-[#EA580C] font-black text-xl leading-none font-serif italic-none">
                i
              </span>
            </div>
          </div>

          <div className="h-9 w-[1px] bg-white/25 shrink-0" aria-hidden="true" />

          <div className="flex-1 min-w-0">
            <div className="text-[15.5px] sm:text-[17px] font-extrabold text-white tracking-tight leading-tight">
              Informação ao Utente
            </div>
            <p className="text-[11.5px] sm:text-[12.5px] font-normal text-white/90 leading-[1.24] mt-0.5">
              Conheça os canais de apoio
              <br />e os custos de utilização.
            </p>
          </div>

          <ChevronRight className="w-5 h-5 text-white/90 group-hover:translate-x-0.5 transition-transform shrink-0 stroke-[2.4]" />
        </button>

        {/* 4. "Linha do Cliente" | "Contacto Directo" Circular Action Buttons + Sweeping Orange Waves */}
        <div className="relative w-full pt-0.5 pb-2.5 shrink-0">
          <div className="relative z-10 grid grid-cols-2 items-center w-full max-w-[310px] mx-auto">
            {/* Vertical Center Divider Line */}
            <div
              className="pointer-events-none absolute left-1/2 top-1.5 bottom-1.5 -translate-x-1/2 w-[1px] bg-white/20"
              aria-hidden="true"
            />

            {/* Left Circular Button: Linha do Cliente (WhatsApp Orange Icon) */}
            <a
              href="https://wa.me/258843001234?text=Ol%C3%A1%20Linha%20do%20Cliente%20MozF%C3%A1cil%2C%20preciso%20de%20apoio."
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 group px-2"
            >
              <div className="w-14 h-14 sm:w-[60px] sm:h-[60px] rounded-full border-[2px] border-white bg-[#04183D] group-hover:border-[#F97316] shadow-[0_4px_14px_rgba(0,0,0,0.45)] flex items-center justify-center transition-transform group-active:scale-95">
                {/* Orange WhatsApp Bubble with White Border and White Handset */}
                <svg
                  viewBox="0 0 44 44"
                  className="w-9 h-9 sm:w-10 sm:h-10"
                  aria-hidden="true"
                >
                  <path
                    d="M22 5C12.6 5 5 12.4 5 21.6c0 3.2.9 6.2 2.6 8.8L5.8 38l7.9-2.1c2.5 1.4 5.3 2.1 8.3 2.1 9.4 0 17-7.4 17-16.6S31.4 5 22 5z"
                    fill="#F97316"
                    stroke="#FFFFFF"
                    strokeWidth="2.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M17.4 14.5c-.4-.9-.8-.9-1.2-.9h-1c-.4 0-1 .1-1.5.7-.5.6-1.9 1.8-1.9 4.4s2 5.2 2.2 5.5c.3.4 3.8 6 9.4 8.2 4.6 1.8 5.6 1.5 6.6 1.4 1-.1 3.2-1.3 3.6-2.5.5-1.3.5-2.3.3-2.5-.1-.2-.5-.4-1.1-.7-.6-.3-3.2-1.6-3.7-1.8-.5-.2-.9-.3-1.2.3-.4.5-1.4 1.8-1.7 2.1-.3.4-.6.4-1.2.1-.6-.3-2.4-.9-4.5-2.8-1.7-1.5-2.8-3.3-3.1-3.9-.3-.5 0-.8.2-1.1.3-.3.6-.6.8-.9.3-.3.4-.5.6-.9.2-.4.1-.7 0-1-.2-.3-1.1-2.8-1.6-3.8z"
                    fill="#FFFFFF"
                  />
                </svg>
              </div>
              <span className="text-[12.5px] sm:text-[13.5px] font-bold text-white tracking-tight">
                Linha do Cliente
              </span>
            </a>

            {/* Right Circular Button: Contacto Directo (Orange Phone Handset) */}
            <a
              href="tel:+258843001234"
              onClick={(e) => {
                if (!navigator.userAgent.match(/Android|iPhone|iPad|iPod/i)) {
                  e.preventDefault();
                  onOpenDirectContact();
                }
              }}
              className="flex flex-col items-center gap-1 group px-2"
            >
              <div className="w-14 h-14 sm:w-[60px] sm:h-[60px] rounded-full border-[2px] border-white bg-[#04183D] group-hover:border-[#F97316] shadow-[0_4px_14px_rgba(0,0,0,0.45)] flex items-center justify-center transition-transform group-active:scale-95">
                <Phone className="w-7 h-7 sm:w-8 sm:h-8 text-[#EA580C] fill-[#EA580C]" />
              </div>
              <span className="text-[12.5px] sm:text-[13.5px] font-bold text-white tracking-tight">
                Contacto Directo
              </span>
            </a>
          </div>

          {/* Sweeping Glowing Orange/Gold Ribbon Waves right beneath Circular Buttons */}
          <svg
            viewBox="0 0 400 56"
            className="pointer-events-none absolute -bottom-1.5 -inset-x-4 w-[calc(100%+2rem)] h-9"
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

        {/* 5. "Cadastre-se Agora" Full-Width Orange CTA Button */}
        <button
          type="button"
          onClick={() =>
            onOpenRegisterChoice ? onOpenRegisterChoice() : onOpenDirectContact()
          }
          className="w-full rounded-[15px] bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#FF6B00] hover:from-[#C2410C] hover:to-[#EA580C] border-[1.5px] border-[#FBBF24] shadow-[0_4px_14px_rgba(234,88,12,0.45)] px-3.5 py-2 flex items-center justify-between text-white transition-all active:scale-[0.99] group shrink-0"
        >
          <div className="flex items-center justify-center flex-1 gap-3 pl-4">
            <UserPlus className="w-6 h-6 text-white fill-white shrink-0" />
            <div className="h-5 w-[1px] bg-white/45 shrink-0" aria-hidden="true" />
            <span className="text-[16.5px] sm:text-[18px] font-extrabold tracking-tight text-white">
              Cadastre-se Agora
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-white stroke-[2.5] group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>

        {/* 6. "É moçambicano?" White/Cream Share & Community Card */}
        <button
          type="button"
          onClick={() =>
            onOpenShareMozfacil ? onOpenShareMozfacil() : onOpenDirectContact()
          }
          className="w-full rounded-[18px] bg-gradient-to-b from-[#FFFFFF] via-[#FFF9F2] to-[#FDEBD8] border-[2px] border-[#F97316]/85 shadow-[0_5px_18px_rgba(0,0,0,0.42)] px-3 sm:px-3.5 py-2 flex items-center gap-2.5 text-left transition-all active:scale-[0.99] group shrink-0"
        >
          {/* Tilted Orange Megaphone Illustration matching screenshot */}
          <div className="shrink-0 flex items-center justify-center pl-0.5">
            <svg
              viewBox="0 0 64 56"
              className="w-12 h-10 sm:w-13 sm:h-11"
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

          <div className="h-11 w-[1px] bg-[#EA580C]/30 shrink-0" aria-hidden="true" />

          <div className="flex-1 min-w-0">
            <div className="text-[17px] sm:text-[19px] font-black text-[#07214E] leading-tight tracking-tight">
              É moçambicano?
            </div>
            <p className="text-[11.5px] sm:text-[12.5px] font-extrabold text-[#EA580C] leading-[1.22] mt-0.5">
              Ajude a colocar Moçambique
              <br />
              na palma de cada moçambicano!
            </p>
          </div>

          <ChevronRight className="w-5 h-5 text-[#EA580C] stroke-[2.5] group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>
      </div>
    </div>
  );
};

export type SidebarModalType =
  | 'direct_contact'
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
  onSelectProfile: (prof: ProfessionalProfile) => void;
  onToggleFavorite: (profileId: string) => void;
  onApplySearch: (q: string) => void;
  onNavigateUtenteRegistration: () => void;
  onNavigateProfessionalRegistration: () => void;
  onNavigateCompanyRegistration?: () => void;
}

export const MozfacilActionModals: React.FC<MozfacilActionModalsProps> = ({
  activeModal,
  onClose,
  favoriteProfiles,
  recentProfiles,
  recentSearches,
  mozUser,
  onSelectProfile,
  onToggleFavorite,
  onApplySearch,
  onNavigateUtenteRegistration,
  onNavigateProfessionalRegistration,
  onNavigateCompanyRegistration,
}) => {
  const [linkCopied, setLinkCopied] = useState(false);

  if (!activeModal) return null;

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
            {activeModal === 'register_choice' && 'Cadastre-se Agora no MozFácil'}
            {activeModal === 'user_info' && 'Informação ao Utente'}
            {activeModal === 'share_mozfacil' &&
              'É moçambicano? Partilhe o MozFácil!'}
            {activeModal === 'favorites' && 'Meus Favoritos (Serviços Guardados)'}
            {activeModal === 'history' && 'Histórico de Pesquisas e Atividades'}
            {(activeModal === 'help_support' || activeModal === 'direct_contact') &&
              'Contacto Directo e Suporte MozFácil'}
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
          {/* 1. REGISTER CHOICE MODAL ("Cadastre-se Agora") */}
          {activeModal === 'register_choice' && (
            <div className="space-y-3">
              <p className="text-slate-600">
                Escolha o tipo de registo que pretende efetuar na plataforma MozFácil:
              </p>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateUtenteRegistration();
                }}
                className="w-full p-4 rounded-xl border-2 border-[#0D316E] bg-blue-50/60 hover:bg-blue-50 text-left flex items-center justify-between gap-3 transition-colors"
              >
                <div className="space-y-1">
                  <div className="font-extrabold text-[#0D316E] text-sm">
                    1. Cadastro do Utente (Consultar Serviços)
                  </div>
                  <p className="text-xs text-slate-600">
                    Registe os seus dados para consultar profissionais, empresas e serviços em Moçambique.
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#0D316E] shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateProfessionalRegistration();
                }}
                className="w-full p-4 rounded-xl border-2 border-[#F97316] bg-orange-50/60 hover:bg-orange-50 text-left flex items-center justify-between gap-3 transition-colors"
              >
                <div className="space-y-1">
                  <div className="font-extrabold text-[#EA580C] text-sm">
                    2. Cadastrar Profissional / Serviço (Gratuito)
                  </div>
                  <p className="text-xs text-slate-600">
                    Divulgue a sua profissão, oficina, prestação de serviços ou atividade móvel no diretório público.
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#EA580C] shrink-0" />
              </button>

              {onNavigateCompanyRegistration && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateCompanyRegistration();
                  }}
                  className="w-full p-4 rounded-xl border-2 border-emerald-600 bg-emerald-50/60 hover:bg-emerald-50 text-left flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="font-extrabold text-emerald-800 text-sm flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>3. Cadastrar Empresa / Instituição (Gratuito)</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Registe a sua empresa privada, instituição pública, ONG ou agência no diretório nacional de Empresas.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-emerald-700 shrink-0" />
                </button>
              )}
            </div>
          )}

          {/* 1B. USER INFO MODAL ("Informação ao Utente") */}
          {activeModal === 'user_info' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 space-y-2 text-xs sm:text-sm text-slate-700">
                <div className="font-extrabold text-[#0D316E] flex items-center gap-2 text-sm">
                  <Coins className="w-4 h-4 text-[#EA580C] shrink-0" />
                  <span>Custos de Utilização e Consultas</span>
                </div>
                <p>
                  • <strong>Registo de Profissionais e Empresas:</strong> O cadastro e divulgação no diretório são <strong>100% gratuitos</strong>.
                </p>
                <p>
                  • <strong>Pacote Inicial do Utente:</strong> Ao criar conta no MozFácil, recebe automaticamente <strong>{getInitialWelcomeCreditsFormatted()}</strong>.
                </p>
                <p>
                  • <strong>Consulta de Contactos:</strong> Cada consulta de detalhes completos desconta apenas <strong>{getConsultationCreditCostFormatted()}</strong>, sem cobrança duplicada para o mesmo perfil.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="font-extrabold text-[#0D316E] text-xs uppercase tracking-wider">
                  Canais Oficiais de Apoio ao Utente
                </div>

                <a
                  href="https://wa.me/258843001234?text=Ol%C3%A1%20Linha%20do%20Cliente%20MozF%C3%A1cil%2C%20preciso%20de%20apoio."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <MessageCircle className="w-5 h-5" />
                    <span>Linha do Cliente (WhatsApp Directo)</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </a>

                <a
                  href="tel:+258843001234"
                  className="p-3.5 rounded-xl bg-[#0D316E] hover:bg-[#051F4E] text-white font-extrabold flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-5 h-5" />
                    <span>Contacto Directo (Chamada Telefónica)</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </a>

                <a
                  href="sms:+258843001234?body=Ol%C3%A1%20Equipa%20MozF%C3%A1cil%2C%20preciso%20de%20apoio."
                  className="p-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0D316E] font-extrabold flex items-center justify-between"
                >
                  <span>Enviar Mensagem SMS</span>
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
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

          {/* 4. HELP & DIRECT CONTACT MODAL */}
          {(activeModal === 'help_support' || activeModal === 'direct_contact') && (
            <div className="space-y-4">
              <p className="text-slate-600 leading-relaxed">
                A equipa <strong>MOZFÁCIL Conexões Rápidas</strong> está disponível para apoiar utentes, profissionais independentes e empresas em todas as províncias de Moçambique.
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                <a
                  href="https://wa.me/258843001234"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <MessageCircle className="w-5 h-5" />
                    <span>Atendimento via WhatsApp Directo</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </a>

                <a
                  href="tel:+258843001234"
                  className="p-3.5 rounded-xl bg-[#0D316E] hover:bg-[#051F4E] text-white font-extrabold flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-5 h-5" />
                    <span>Ligar para Linha de Apoio MozFácil</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </a>

                <a
                  href="sms:+258843001234?body=Ol%C3%A1%20Equipa%20MozF%C3%A1cil%2C%20preciso%20de%20apoio."
                  className="p-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0D316E] font-extrabold flex items-center justify-between"
                >
                  <span>Enviar SMS Directo</span>
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 space-y-1.5 text-xs text-slate-700">
                <div className="font-extrabold text-[#0D316E]">
                  Informação sobre Consultas e Registos:
                </div>
                <p>
                  • O registo de perfis profissionais e serviços é <strong>100% gratuito</strong>.
                </p>
                <p>
                  • Para utentes, cada consulta de detalhes completos implica o débito de <strong>{getConsultationCreditCostFormatted()}</strong>, sem cobrança duplicada para o mesmo perfil.
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
                    MOZFÁCIL — Conexões Rápidas
                  </div>
                  <div className="text-xs text-slate-500">
                    Moçambique na Palma da Sua Mão
                  </div>
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed">
                O <strong>MozFácil</strong> é a plataforma digital integrada de serviços, profissionais independentes, empresas, oportunidades e utilidade pública em Moçambique.
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
