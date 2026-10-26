import React, { useState } from 'react';
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
} from 'lucide-react';
import { MozUser, ProfessionalProfile } from '../types/mozfacil';

interface MozfacilHomeScreenProps {
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onSubmitSearch: (q: string) => void;
  onOpenDirectContact: () => void;
  onOpenExploreModules: () => void;
  onOpenProfessionalsDirectory: () => void;
}

export const MozfacilHomeScreen: React.FC<MozfacilHomeScreenProps> = ({
  searchQuery,
  onSearchQueryChange,
  onSubmitSearch,
  onOpenDirectContact,
}) => {
  const [isListeningVoice, setIsListeningVoice] = useState(false);

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

  return (
    <div className="relative max-w-md mx-auto min-h-[calc(100vh-150px)] flex flex-col justify-between px-3 sm:px-5 pt-6 pb-8 overflow-hidden select-none">
      {/* Subtle Background Curved Light Waves */}
      <svg
        viewBox="0 0 400 220"
        className="pointer-events-none absolute -top-6 inset-x-0 w-full h-48 opacity-35"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M-40,140 C80,30 240,20 440,100 L440,0 L-40,0 Z"
          fill="url(#topWaveGrad)"
        />
        <defs>
          <linearGradient id="topWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E4B9B" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#041537" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Main Centered Hero & Interactive Controls */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center space-y-6 my-auto">
        {/* Hero Headline Block */}
        <div className="space-y-1.5 w-full">
          <h1 className="text-[30px] sm:text-[36px] font-black uppercase tracking-wide text-white leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
            MOÇAMBIQUE
          </h1>
          <p className="text-[19px] sm:text-[23px] font-black uppercase tracking-wide text-[#F97316] leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]">
            NA PALMA DA SUA MÃO
          </p>

          {/* Glowing Horizon Flare Divider */}
          <div className="relative w-4/5 max-w-[290px] mx-auto pt-2 pb-1">
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#F97316] to-transparent" />
            <div className="absolute inset-x-1/3 top-1.5 h-[3px] bg-gradient-to-r from-transparent via-amber-200 to-transparent blur-[1px]" />
          </div>

          <p className="text-[14.5px] sm:text-[16px] font-medium text-white/95 leading-[1.45] max-w-[330px] mx-auto pt-1">
            Encontre o que precisa, divulgue o que oferece e conecte-se a novas oportunidades em todo o país, de forma rápida e segura.
          </p>
        </div>

        {/* White Pill Search Bar matching reference print */}
        <form
          onSubmit={handleFormSubmit}
          className="w-full bg-gradient-to-b from-white to-[#F1F5F9] rounded-full shadow-[0_6px_20px_rgba(0,0,0,0.35)] border border-white px-4 py-3 flex items-center gap-3"
        >
          <button
            type="submit"
            aria-label="Pesquisar"
            className="text-[#F97316] hover:text-[#EA580C] transition-colors shrink-0"
          >
            <Search className="w-7 h-7 stroke-[2.5]" />
          </button>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Pesquise serviços, contactos e obtenha soluções..."
            className="flex-1 bg-transparent text-slate-700 placeholder:text-slate-500 text-xs sm:text-sm font-medium focus:outline-none min-w-0"
          />

          <div className="h-7 w-[1px] bg-slate-300 shrink-0" aria-hidden="true" />

          <button
            type="button"
            onClick={handleVoiceSearch}
            aria-label="Pesquisa por voz"
            title="Pesquisar por voz"
            className={`shrink-0 transition-transform ${
              isListeningVoice
                ? 'text-red-600 scale-110 animate-pulse'
                : 'text-[#F97316] hover:text-[#EA580C]'
            }`}
          >
            <Mic className="w-6 h-6 stroke-[2.2]" />
          </button>
        </form>

        {/* "Contacto directo" Glowing Orange-Bordered Card */}
        <button
          type="button"
          onClick={onOpenDirectContact}
          className="w-full rounded-[28px] bg-gradient-to-r from-[#041537]/95 via-[#072254]/95 to-[#041537]/95 border-[2px] border-[#F97316] shadow-[0_0_22px_rgba(249,115,22,0.35)] hover:shadow-[0_0_28px_rgba(249,115,22,0.55)] px-4 sm:px-5 py-3.5 flex items-center gap-3.5 text-left transition-all group"
        >
          <div className="shrink-0 flex items-center justify-center pl-1">
            <Headset className="w-10 h-10 text-[#F97316] stroke-[2.2]" />
          </div>

          <div className="h-10 w-[1px] bg-white/20 shrink-0" aria-hidden="true" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Contacto directo
              </span>
              <ChevronRight className="w-5 h-5 text-white group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>
            <p className="text-[11.5px] sm:text-xs font-medium text-blue-100/90 truncate mt-0.5">
              Fale directamente com a equipa MOZFÁCIL
            </p>
          </div>
        </button>

        {/* SMS | Ligar Circular Action Buttons */}
        <div className="flex items-center justify-center gap-8 pt-2">
          {/* SMS Button */}
          <a
            href="sms:+258843001234?body=Ol%C3%A1%20Equipa%20MozF%C3%A1cil%2C%20preciso%20de%20apoio."
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-16 h-16 rounded-full border-2 border-white bg-[#06204E]/90 group-hover:border-[#F97316] shadow-[0_4px_14px_rgba(0,0,0,0.4)] flex items-center justify-center transition-colors">
              {/* Custom SMS Speech Bubble Icon matching screenshot */}
              <svg
                viewBox="0 0 36 32"
                className="w-9 h-8 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="30" height="20" rx="5" />
                <path d="M10 23 L7 29 L15 23" />
                <text
                  x="18"
                  y="16"
                  textAnchor="middle"
                  fill="currentColor"
                  stroke="none"
                  fontSize="8.5"
                  fontWeight="800"
                  fontFamily="sans-serif"
                >
                  SMS
                </text>
              </svg>
            </div>
            <span className="text-sm font-extrabold text-white tracking-tight">
              SMS
            </span>
          </a>

          {/* Vertical Divider */}
          <div className="h-14 w-[1px] bg-white/25" aria-hidden="true" />

          {/* Ligar Button */}
          <a
            href="tel:+258843001234"
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-16 h-16 rounded-full border-2 border-white bg-[#06204E]/90 group-hover:border-[#F97316] shadow-[0_4px_14px_rgba(0,0,0,0.4)] flex items-center justify-center transition-colors">
              <Phone className="w-7 h-7 text-white fill-white" />
            </div>
            <span className="text-sm font-extrabold text-white tracking-tight">
              Ligar
            </span>
          </a>
        </div>
      </div>

      {/* Bottom Sweeping Glowing Orange/Gold Ribbon Waves matching reference print */}
      <svg
        viewBox="0 0 400 95"
        className="pointer-events-none absolute bottom-0 inset-x-0 w-full h-24"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="orangeRibbon1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EA580C" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#F59E0B" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#EA580C" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="orangeRibbon2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F97316" stopOpacity="0.2" />
            <stop offset="60%" stopColor="#F97316" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FBBF24" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        <path
          d="M-20,18 C95,48 210,85 420,52 L420,95 L-20,95 Z"
          fill="#031230"
          opacity="0.7"
        />
        <path
          d="M-20,22 C110,55 220,88 420,45"
          fill="none"
          stroke="url(#orangeRibbon1)"
          strokeWidth="5"
        />
        <path
          d="M-20,62 C130,85 260,78 420,38"
          fill="none"
          stroke="url(#orangeRibbon2)"
          strokeWidth="3.5"
        />
      </svg>
    </div>
  );
};

export type SidebarModalType =
  | 'direct_contact'
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
                      {mozUser ? `${mozUser.creditsBalance} Créditos (${mozUser.creditsBalance} MT)` : 'Sessão ativa'}
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
}) => {
  if (!activeModal) return null;

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
            {activeModal === 'register_choice' && 'Criar Conta / Cadastro no MozFácil'}
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
          {/* 1. REGISTER CHOICE MODAL */}
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
                    Registe os seus dados para consultar profissionais e serviços em Moçambique (1 consulta = 1 crédito / 1 MT).
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
                        <strong>{mozUser.creditsBalance} créditos ({mozUser.creditsBalance} MT)</strong>
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
                  • Para utentes, cada consulta de detalhes completos implica o débito de <strong>1 crédito (correspondente a 1 MT)</strong>, sem cobrança duplicada para o mesmo perfil.
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
                  <strong>Módulos Integrados:</strong> 12 Módulos Oficiais (Profissionais e Serviços ativo e operacional).
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
