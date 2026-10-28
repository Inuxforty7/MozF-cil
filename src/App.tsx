/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import {
  Search,
  MapPin,
  Phone,
  MessageCircle,
  Plus,
  CheckCircle2,
  Briefcase,
  Filter,
  WifiOff,
  AlertTriangle,
  RefreshCw,
  LogOut,
  LogIn,
  Shield,
  UserCheck,
  UserPlus,
  Coins,
  Clock,
  Wrench,
  Edit3,
  Home,
  Building2,
  User,
  LayoutGrid,
  Eye,
  EyeOff,
  Menu,
} from 'lucide-react';
import {
  activeFirebaseConfig,
  auth,
  db,
  formatFirebaseAuthError,
  getCurrentHostDomain,
  googleProvider,
  handleFirestoreError,
  isTokenServiceDisabledError,
  isUnauthorizedDomainError,
  onTokenServiceDisabled,
  OperationType,
} from './firebase';
import {
  AuditLog,
  AvailabilitySchedule,
  CompanyCategory,
  CompanyDocument,
  CompanyMedia,
  CompanyProfile,
  CompanySchedule,
  CompanyService,
  CoverageAreaType,
  MozUser,
  ProfessionalCategory,
  ProfessionalMedia,
  ProfessionalProfile,
  ProfessionalService,
  ProfileType,
  PublicPlace,
  PublicationStatus,
  SearchFilters,
  formatUserCreditBalance,
  getConsultationCreditCostFormatted,
  PRICING_CONFIG,
} from './types/mozfacil';
import {
  getProvinces,
  getDistrictsByProvince,
  getNeighborhoodsByDistrict,
} from './data/mozambiqueLocations';
import {
  MOZFACIL_MODULES,
  MozfacilModuleDefinition,
  MozfacilModuleId,
  getModuleById,
  getModuleByRoutePath,
} from './data/mozfacilModules';
import {
  activateCreditPackage,
  ensureUserDocument,
  ownerSetProfilePublicationStatus,
  performDirectConsultationDebit,
  performEmergencyDirectCallDebit,
  updateProfileOperationalState,
} from './services/mozfacilService';
import { normalizeCategoryName } from './utils/categoryNormalization';
import { ProfessionalRegistrationForm } from './components/ProfessionalRegistrationForm';
import { ProfessionalProfileDetail } from './components/ProfessionalProfileDetail';
import { CompaniesDirectory } from './components/CompaniesDirectory';
import { CompanyProfileDetail } from './components/CompanyProfileDetail';
import { CompanyRegistrationForm } from './components/CompanyRegistrationForm';
import { AdminDashboard } from './components/AdminDashboard';
import { UtenteRegistrationScreen } from './components/UtenteRegistrationScreen';
import {
  ExploreModulesScreen,
  ModuleDestinationUnavailable,
} from './components/ExploreModulesScreen';
import {
  MozfacilHomeScreen,
  MozfacilSidebarDrawer,
  MozfacilActionModals,
  SidebarModalType,
} from './components/HomeAndSidebar';
import {
  PublicPlaceInstructionsScreen,
  PublicPlaceRegistrationScreen,
} from './components/PublicPlaceFlow';

type AppView =
  | 'home'
  | 'explore'
  | 'directory'
  | 'module_info'
  | 'utente_registration'
  | 'my_profiles'
  | 'register_edit'
  | 'detail'
  | 'admin'
  | 'companies_directory'
  | 'company_registration'
  | 'company_detail'
  | 'public_place_instructions'
  | 'public_place_registration';

interface NavigationStateSnapshot {
  view: AppView;
  moduleId?: MozfacilModuleId | null;
  profileId?: string | null;
  editingProfileId?: string | null;
  companyId?: string | null;
  editingCompanyId?: string | null;
}

function resolveInitialNavigationFromUrl(): NavigationStateSnapshot {
  if (typeof window === 'undefined') {
    return { view: 'home', moduleId: null, profileId: null, editingProfileId: null };
  }
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  if (pathname === '/' || pathname === '/inicio') {
    return { view: 'home', moduleId: null, profileId: null, editingProfileId: null };
  }
  if (pathname === '/explore' || pathname === '/mais') {
    return { view: 'explore', moduleId: null, profileId: null, editingProfileId: null };
  }
  if (pathname === '/profissionais') {
    return { view: 'directory', moduleId: 'professionals_services', profileId: null, editingProfileId: null };
  }
  if (pathname === '/profissionais/registar') {
    return { view: 'register_edit', moduleId: 'professionals_services', profileId: null, editingProfileId: null };
  }
  if (pathname.startsWith('/profissionais/')) {
    const rawProfileId = decodeURIComponent(pathname.slice('/profissionais/'.length)).trim();
    if (rawProfileId) {
      return {
        view: 'detail',
        moduleId: 'professionals_services',
        profileId: rawProfileId,
        editingProfileId: null,
      };
    }
  }
  if (pathname === '/empresas') {
    return { view: 'companies_directory', moduleId: 'companies_institutions', profileId: null, editingProfileId: null, companyId: null, editingCompanyId: null };
  }
  if (pathname === '/empresas/registar') {
    return { view: 'company_registration', moduleId: 'companies_institutions', profileId: null, editingProfileId: null, companyId: null, editingCompanyId: null };
  }
  if (pathname.startsWith('/empresas/')) {
    const rawCompanyId = decodeURIComponent(pathname.slice('/empresas/'.length)).trim();
    if (rawCompanyId) {
      return {
        view: 'company_detail',
        moduleId: 'companies_institutions',
        profileId: null,
        editingProfileId: null,
        companyId: rawCompanyId,
        editingCompanyId: null,
      };
    }
  }
  if (pathname === '/cadastro-utente') {
    return { view: 'utente_registration', moduleId: null, profileId: null, editingProfileId: null };
  }
  if (pathname === '/meus-perfis') {
    return { view: 'my_profiles', moduleId: null, profileId: null, editingProfileId: null };
  }
  if (pathname === '/admin') {
    return { view: 'admin', moduleId: null, profileId: null, editingProfileId: null };
  }
  if (
    pathname === '/instituicoes-publicas' ||
    pathname === '/instituicoes-publicas/instrucoes' ||
    pathname === '/locais-publicos' ||
    pathname === '/locais-publicos/instrucoes'
  ) {
    return {
      view: 'public_place_instructions',
      moduleId: null,
      profileId: null,
      editingProfileId: null,
    };
  }
  if (
    pathname === '/instituicoes-publicas/registar' ||
    pathname === '/locais-publicos/registar'
  ) {
    return {
      view: 'public_place_registration',
      moduleId: null,
      profileId: null,
      editingProfileId: null,
    };
  }
  const matchedModule = getModuleByRoutePath(pathname);
  if (matchedModule) {
    if (matchedModule.id === 'companies_institutions') {
      return { view: 'companies_directory', moduleId: 'companies_institutions', profileId: null, editingProfileId: null };
    }
    if (matchedModule.isAvailable) {
      return { view: 'directory', moduleId: matchedModule.id, profileId: null, editingProfileId: null };
    }
    return { view: 'module_info', moduleId: matchedModule.id, profileId: null, editingProfileId: null };
  }
  return { view: 'home', moduleId: null, profileId: null, editingProfileId: null };
}

function resolvePathForNavigation(snap: NavigationStateSnapshot): string {
  switch (snap.view) {
    case 'home':
      return '/';
    case 'explore':
      return '/explore';
    case 'directory':
      return '/profissionais';
    case 'companies_directory':
      return '/empresas';
    case 'company_registration':
      return '/empresas/registar';
    case 'company_detail':
      return snap.companyId ? `/empresas/${snap.companyId}` : '/empresas';
    case 'public_place_instructions':
      return '/instituicoes-publicas/instrucoes';
    case 'public_place_registration':
      return '/instituicoes-publicas/registar';
    case 'module_info': {
      const mod = getModuleById(snap.moduleId);
      return mod ? mod.routePath : '/explore';
    }
    case 'utente_registration':
      return '/cadastro-utente';
    case 'my_profiles':
      return '/meus-perfis';
    case 'register_edit':
      return '/profissionais/registar';
    case 'detail':
      return snap.profileId ? `/profissionais/${snap.profileId}` : '/profissionais';
    case 'admin':
      return '/admin';
  }
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class MozErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message || String(error) };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('MozFácil Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-2xl border border-red-200 p-6 shadow-md space-y-4">
            <div className="flex items-center gap-3 text-red-700">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h2 className="text-lg font-extrabold">Ocorreu um problema ao carregar a página</h2>
            </div>
            <p className="text-xs text-slate-600 break-words bg-slate-50 p-3 rounded-lg border border-slate-200">
              Não foi possível concluir a operação solicitada. Verifique a sua ligação e tente recarregar a aplicação.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-[#0D316E] text-white text-xs font-bold"
            >
              Recarregar Aplicação
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const initialNav = useMemo(() => resolveInitialNavigationFromUrl(), []);

  // Auth & User State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [mozUser, setMozUser] = useState<MozUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isDomainUnauthorized, setIsDomainUnauthorized] = useState(false);
  const [isTokenServiceDisabled, setIsTokenServiceDisabled] = useState(false);
  const [domainCopied, setDomainCopied] = useState(false);

  // Network Availability State
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Navigation View State
  const [activeView, setActiveView] = useState<AppView>(initialNav.view);
  const [selectedModuleId, setSelectedModuleId] = useState<MozfacilModuleId | null>(
    initialNav.moduleId || null
  );
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    initialNav.profileId || null
  );
  const [editingProfileId, setEditingProfileId] = useState<string | null>(
    initialNav.editingProfileId || null
  );
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    initialNav.companyId || null
  );
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(
    initialNav.editingCompanyId || null
  );

  // Module 2 Companies State (Partitioned for Zero-Trust ABAC Security & Real-Time Sync)
  const [publishedCompanies, setPublishedCompanies] = useState<CompanyProfile[]>([]);
  const [myCompanies, setMyCompanies] = useState<CompanyProfile[]>([]);
  const [adminAllCompanies, setAdminAllCompanies] = useState<CompanyProfile[]>([]);
  const [publicCompanyCategories, setPublicCompanyCategories] = useState<CompanyCategory[]>([]);
  const [adminCompanyCategories, setAdminCompanyCategories] = useState<CompanyCategory[]>([]);
  const [selectedCompanyServices, setSelectedCompanyServices] = useState<CompanyService[]>([]);
  const [selectedCompanySchedules, setSelectedCompanySchedules] = useState<CompanySchedule[]>([]);
  const [selectedCompanyMedia, setSelectedCompanyMedia] = useState<CompanyMedia[]>([]);
  const [selectedCompanyDocuments, setSelectedCompanyDocuments] = useState<CompanyDocument[]>([]);

  // Community Public Institutions State
  const [publishedPublicPlaces, setPublishedPublicPlaces] = useState<PublicPlace[]>([]);
  const [adminPublicPlaces, setAdminPublicPlaces] = useState<PublicPlace[]>([]);

  const [myProfilesFilter, setMyProfilesFilter] = useState<PublicationStatus | 'all'>('all');
  const [consultationNotice, setConsultationNotice] = useState<string | null>(null);
  const [isConsulting, setIsConsulting] = useState(false);
  const [showTopMenu, setShowTopMenu] = useState(false);
  const [activeSidebarModal, setActiveSidebarModal] = useState<SidebarModalType>(null);
  const [favoriteProfileIds, setFavoriteProfileIds] = useState<string[]>([]);
  const [recentProfileIds, setRecentProfileIds] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Persisted Firestore Collections State
  const [publishedProfiles, setPublishedProfiles] = useState<ProfessionalProfile[]>([]);
  const [myProfiles, setMyProfiles] = useState<ProfessionalProfile[]>([]);
  const [adminAllProfiles, setAdminAllProfiles] = useState<ProfessionalProfile[]>([]);
  const [publicCategories, setPublicCategories] = useState<ProfessionalCategory[]>([]);
  const [adminCategories, setAdminCategories] = useState<ProfessionalCategory[]>([]);
  const [publishedServices, setPublishedServices] = useState<ProfessionalService[]>([]);
  const [myServices, setMyServices] = useState<ProfessionalService[]>([]);
  const [targetServices, setTargetServices] = useState<ProfessionalService[]>([]);
  const [publishedSchedules, setPublishedSchedules] = useState<AvailabilitySchedule[]>([]);
  const [mySchedules, setMySchedules] = useState<AvailabilitySchedule[]>([]);
  const [targetSchedules, setTargetSchedules] = useState<AvailabilitySchedule[]>([]);
  const [publishedMedia, setPublishedMedia] = useState<ProfessionalMedia[]>([]);
  const [myMedia, setMyMedia] = useState<ProfessionalMedia[]>([]);
  const [targetMedia, setTargetMedia] = useState<ProfessionalMedia[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Request / Loading States
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [requestError, setRequestError] = useState<string | null>(null);

  // Search & Filter State
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    profileType: 'all',
    categoryId: '',
    specialtyId: '',
    province: '',
    district: '',
    neighborhood: '',
    coverageAreaType: 'all',
    deliveryMode: 'all',
    availabilityStatus: 'all',
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);

  // Client-side History Navigation Helper (Preserves Browser Back / Forward)
  const navigateTo = useCallback(
    (
      nextView: AppView,
      opts?: {
        moduleId?: MozfacilModuleId | null;
        profileId?: string | null;
        editingProfileId?: string | null;
        companyId?: string | null;
        editingCompanyId?: string | null;
        replace?: boolean;
      }
    ) => {
      const nextSnap: NavigationStateSnapshot = {
        view: nextView,
        moduleId: opts?.moduleId !== undefined ? opts.moduleId : selectedModuleId,
        profileId: opts?.profileId !== undefined ? opts.profileId : selectedProfileId,
        editingProfileId:
          opts?.editingProfileId !== undefined ? opts.editingProfileId : editingProfileId,
        companyId: opts?.companyId !== undefined ? opts.companyId : selectedCompanyId,
        editingCompanyId:
          opts?.editingCompanyId !== undefined ? opts.editingCompanyId : editingCompanyId,
      };

      setActiveView(nextSnap.view);
      if (opts?.moduleId !== undefined) setSelectedModuleId(opts.moduleId);
      if (opts?.profileId !== undefined) setSelectedProfileId(opts.profileId);
      if (opts?.editingProfileId !== undefined) setEditingProfileId(opts.editingProfileId);
      if (opts?.companyId !== undefined) setSelectedCompanyId(opts.companyId);
      if (opts?.editingCompanyId !== undefined) setEditingCompanyId(opts.editingCompanyId);

      if (typeof window !== 'undefined') {
        const targetPath = resolvePathForNavigation(nextSnap);
        try {
          if (opts?.replace) {
            window.history.replaceState(nextSnap, '', targetPath);
          } else {
            window.history.pushState(nextSnap, '', targetPath);
          }
        } catch {
          // Ignore pushState restrictions in sandboxed environments
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [selectedModuleId, selectedProfileId, editingProfileId, selectedCompanyId, editingCompanyId]
  );

  // Sync initial history entry and listen to browser back/forward (popstate)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.history.replaceState(initialNav, '', resolvePathForNavigation(initialNav));
    } catch {
      // Ignore replaceState errors in restricted frames
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as NavigationStateSnapshot | null;
      if (state && state.view) {
        setActiveView(state.view);
        setSelectedModuleId(state.moduleId ?? null);
        setSelectedProfileId(state.profileId ?? null);
        setEditingProfileId(state.editingProfileId ?? null);
        setSelectedCompanyId(state.companyId ?? null);
        setEditingCompanyId(state.editingCompanyId ?? null);
      } else {
        const fallback = resolveInitialNavigationFromUrl();
        setActiveView(fallback.view);
        setSelectedModuleId(fallback.moduleId ?? null);
        setSelectedProfileId(fallback.profileId ?? null);
        setEditingProfileId(fallback.editingProfileId ?? null);
        setSelectedCompanyId(fallback.companyId ?? null);
        setEditingCompanyId(fallback.editingCompanyId ?? null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [initialNav]);

  const handleSelectExploreModule = useCallback(
    (module: MozfacilModuleDefinition) => {
      if (module.id === 'companies_institutions') {
        navigateTo('companies_directory', { moduleId: 'companies_institutions' });
      } else if (module.id === 'professionals_services' || module.isAvailable) {
        navigateTo('directory', { moduleId: 'professionals_services' });
      } else {
        navigateTo('module_info', { moduleId: module.id });
      }
    },
    [navigateTo]
  );

  const isAdmin = useMemo(() => {
    return (
      mozUser?.role === 'admin' ||
      (firebaseUser?.email?.toLowerCase() === 'inuxforty@gmail.com' &&
        firebaseUser?.emailVerified === true)
    );
  }, [mozUser, firebaseUser]);

  const categories = useMemo(() => {
    if (isAdmin && adminCategories.length > 0) {
      return adminCategories;
    }
    return publicCategories;
  }, [isAdmin, adminCategories, publicCategories]);

  // Monitor Online/Offline Network State
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 1. Firebase Auth Listener
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const reason = 'reason' in event ? event.reason : event.error;
      if (isTokenServiceDisabledError(reason)) {
        setIsTokenServiceDisabled(true);
        setAuthError(formatFirebaseAuthError(reason));
      }
    };
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleGlobalError);

    const unsubTokenService = onTokenServiceDisabled((err) => {
      setIsTokenServiceDisabled(true);
      setAuthError(formatFirebaseAuthError(err));
    });

    getRedirectResult(auth).catch((err) => {
      if (err) {
        setIsDomainUnauthorized(isUnauthorizedDomainError(err));
        if (isTokenServiceDisabledError(err)) {
          setIsTokenServiceDisabled(true);
        }
        setAuthError(formatFirebaseAuthError(err));
      }
    });

    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        setAuthError(null);
        setIsDomainUnauthorized(false);
        setIsTokenServiceDisabled(false);
        try {
          await user.getIdToken();
          const userDoc = await ensureUserDocument(user);
          setMozUser(userDoc);
        } catch (err: unknown) {
          console.error('Error ensuring user doc:', err);
          if (isTokenServiceDisabledError(err)) {
            setIsTokenServiceDisabled(true);
            setAuthError(formatFirebaseAuthError(err));
          }
        }
      } else {
        setMozUser(null);
        setMyProfiles([]);
        setMyCompanies([]);
        setAdminAllProfiles([]);
        setAdminAllCompanies([]);
        setAdminCategories([]);
        setAdminCompanyCategories([]);
        setAuditLogs([]);
      }
      setIsAuthReady(true);
    });
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleGlobalError);
      unsubTokenService();
      unsub();
    };
  }, []);

  // Redirect away from protected screens if signed out or not admin
  useEffect(() => {
    if (!isAuthReady) return;
    if (
      !firebaseUser &&
      (activeView === 'my_profiles' || activeView === 'register_edit' || activeView === 'admin')
    ) {
      navigateTo('directory', { replace: true });
    } else if (activeView === 'admin' && !isAdmin) {
      navigateTo('directory', { replace: true });
    }
  }, [isAuthReady, firebaseUser, isAdmin, activeView, navigateTo]);

  // 2. Public Firestore Listeners (Bounded Published Profiles, Categories, Services)
  useEffect(() => {
    setIsLoadingData(true);
    setRequestError(null);

    const pubProfQuery = query(
      collection(db, 'professional_profiles'),
      where('publicationStatus', '==', 'published'),
      limit(100)
    );
    const unsubPubProf = onSnapshot(
      pubProfQuery,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as ProfessionalProfile);
        setPublishedProfiles(list);
        setIsLoadingData(false);
      },
      (err) => {
        setIsLoadingData(false);
        setRequestError('Não foi possível carregar os perfis publicados.');
        handleFirestoreError(err, OperationType.LIST, 'professional_profiles');
      }
    );

    const catQuery = query(
      collection(db, 'professional_categories'),
      where('reviewStatus', 'in', ['approved', 'pending', 'merged']),
      limit(200)
    );
    const unsubCat = onSnapshot(
      catQuery,
      (snap) => {
        setPublicCategories(snap.docs.map((d) => d.data() as ProfessionalCategory));
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'professional_categories');
      }
    );

    const pubSrvQuery = query(
      collection(db, 'professional_services'),
      where('publicationStatus', '==', 'published'),
      limit(200)
    );
    const unsubPubSrv = onSnapshot(
      pubSrvQuery,
      (snap) => {
        setPublishedServices(snap.docs.map((d) => d.data() as ProfessionalService));
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'professional_services');
      }
    );

    // Module 2: Published Companies & Company Categories Listeners (Hardened Zero-Trust ABAC Queries)
    const compQuery = query(
      collection(db, 'companies'),
      where('publicationStatus', '==', 'published'),
      limit(200)
    );
    const unsubComp = onSnapshot(
      compQuery,
      (snap) => {
        setPublishedCompanies(snap.docs.map((d) => d.data() as CompanyProfile));
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'companies');
      }
    );

    const compCatQuery = query(
      collection(db, 'company_categories'),
      where('reviewStatus', 'in', ['approved', 'pending', 'merged']),
      limit(200)
    );
    const unsubCompCat = onSnapshot(
      compCatQuery,
      (snap) => {
        setPublicCompanyCategories(snap.docs.map((d) => d.data() as CompanyCategory));
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'company_categories');
      }
    );

    const pubPlacesQuery = query(
      collection(db, 'public_places'),
      where('publicationStatus', '==', 'published'),
      limit(200)
    );
    const unsubPubPlaces = onSnapshot(
      pubPlacesQuery,
      (snap) => {
        setPublishedPublicPlaces(snap.docs.map((d) => d.data() as PublicPlace));
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'public_places');
      }
    );

    return () => {
      unsubPubProf();
      unsubCat();
      unsubPubSrv();
      unsubComp();
      unsubCompCat();
      unsubPubPlaces();
    };
  }, []);

  const publicPlaces = useMemo(() => {
    const map = new Map<string, PublicPlace>();
    publishedPublicPlaces.forEach((p) => map.set(p.id, p));
    adminPublicPlaces.forEach((p) => map.set(p.id, p));
    return Array.from(map.values());
  }, [publishedPublicPlaces, adminPublicPlaces]);

  // Memoized unified companies & categories across public, owner, and admin tiers
  const companies = useMemo(() => {
    const map = new Map<string, CompanyProfile>();
    publishedCompanies.forEach((c) => map.set(c.id, c));
    myCompanies.forEach((c) => map.set(c.id, c));
    adminAllCompanies.forEach((c) => map.set(c.id, c));
    return Array.from(map.values());
  }, [publishedCompanies, myCompanies, adminAllCompanies]);

  const companyCategories = useMemo(() => {
    if (isAdmin && adminCompanyCategories.length > 0) {
      return adminCompanyCategories;
    }
    return publicCompanyCategories;
  }, [isAdmin, adminCompanyCategories, publicCompanyCategories]);

  // Module 2: Selected or Edited Company Subcollections Listener
  useEffect(() => {
    const targetCompId = selectedCompanyId || editingCompanyId;
    if (!targetCompId) {
      setSelectedCompanyServices([]);
      setSelectedCompanySchedules([]);
      setSelectedCompanyMedia([]);
      setSelectedCompanyDocuments([]);
      return;
    }

    const targetCompany = companies.find((c) => c.id === targetCompId);
    const canReadUnpublishedCompany =
      Boolean(firebaseUser) &&
      (isAdmin || (targetCompany && targetCompany.ownerId === firebaseUser?.uid));

    const unsubs: Array<() => void> = [];

    if (canReadUnpublishedCompany) {
      // Owner or Admin: full access to all company services, hours, media, and private verification documents
      unsubs.push(
        onSnapshot(
          query(collection(db, 'company_services'), where('companyId', '==', targetCompId), limit(50)),
          (snap) => setSelectedCompanyServices(snap.docs.map((d) => d.data() as CompanyService)),
          (err) => handleFirestoreError(err, OperationType.LIST, 'company_services')
        )
      );
      unsubs.push(
        onSnapshot(
          query(collection(db, 'company_hours'), where('companyId', '==', targetCompId), limit(20)),
          (snap) => setSelectedCompanySchedules(snap.docs.map((d) => d.data() as CompanySchedule)),
          (err) => handleFirestoreError(err, OperationType.LIST, 'company_hours')
        )
      );
      unsubs.push(
        onSnapshot(
          query(collection(db, 'company_media'), where('companyId', '==', targetCompId), limit(30)),
          (snap) => setSelectedCompanyMedia(snap.docs.map((d) => d.data() as CompanyMedia)),
          (err) => handleFirestoreError(err, OperationType.LIST, 'company_media')
        )
      );
      unsubs.push(
        onSnapshot(
          query(collection(db, 'company_documents'), where('companyId', '==', targetCompId), limit(20)),
          (snap) => setSelectedCompanyDocuments(snap.docs.map((d) => d.data() as CompanyDocument)),
          (err) => handleFirestoreError(err, OperationType.LIST, 'company_documents')
        )
      );
    } else {
      // Public Visitor: bounded read of published services, hours, media; documents are strictly private
      unsubs.push(
        onSnapshot(
          query(
            collection(db, 'company_services'),
            where('companyId', '==', targetCompId),
            where('publicationStatus', '==', 'published'),
            limit(50)
          ),
          (snap) => setSelectedCompanyServices(snap.docs.map((d) => d.data() as CompanyService)),
          (err) => handleFirestoreError(err, OperationType.LIST, 'company_services')
        )
      );
      unsubs.push(
        onSnapshot(
          query(
            collection(db, 'company_hours'),
            where('companyId', '==', targetCompId),
            where('publicationStatus', '==', 'published'),
            limit(20)
          ),
          (snap) => setSelectedCompanySchedules(snap.docs.map((d) => d.data() as CompanySchedule)),
          (err) => handleFirestoreError(err, OperationType.LIST, 'company_hours')
        )
      );
      unsubs.push(
        onSnapshot(
          query(
            collection(db, 'company_media'),
            where('companyId', '==', targetCompId),
            where('publicationStatus', '==', 'published'),
            limit(30)
          ),
          (snap) => setSelectedCompanyMedia(snap.docs.map((d) => d.data() as CompanyMedia)),
          (err) => handleFirestoreError(err, OperationType.LIST, 'company_media')
        )
      );
      setSelectedCompanyDocuments([]);
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [selectedCompanyId, editingCompanyId, firebaseUser, isAdmin, companies]);

  const selectedCompany = useMemo(() => {
    if (!selectedCompanyId) return null;
    return companies.find((c) => c.id === selectedCompanyId) || null;
  }, [companies, selectedCompanyId]);

  const editingCompany = useMemo(() => {
    if (!editingCompanyId) return null;
    return companies.find((c) => c.id === editingCompanyId) || null;
  }, [companies, editingCompanyId]);

  // Resolve all known profiles across public, owner, and admin listeners
  const allKnownProfiles = useMemo(() => {
    const map = new Map<string, ProfessionalProfile>();
    publishedProfiles.forEach((p) => map.set(p.id, p));
    myProfiles.forEach((p) => map.set(p.id, p));
    adminAllProfiles.forEach((p) => map.set(p.id, p));
    return Array.from(map.values());
  }, [publishedProfiles, myProfiles, adminAllProfiles]);

  // 2b. On-Demand Schedules, Media & Services Listener for Selected or Edited Profile
  useEffect(() => {
    const targetId = selectedProfileId || editingProfileId;
    if (!targetId) {
      setPublishedSchedules([]);
      setPublishedMedia([]);
      setTargetServices([]);
      setTargetSchedules([]);
      setTargetMedia([]);
      return;
    }

    const targetProfile = allKnownProfiles.find((p) => p.id === targetId);
    const canReadUnpublishedTarget =
      Boolean(firebaseUser) &&
      (isAdmin || (targetProfile && targetProfile.ownerId === firebaseUser?.uid));

    const unsubs: Array<() => void> = [];

    const pubSchedQuery = query(
      collection(db, 'availability_schedules'),
      where('profileId', '==', targetId),
      where('publicationStatus', '==', 'published'),
      limit(14)
    );
    unsubs.push(
      onSnapshot(
        pubSchedQuery,
        (snap) => {
          setPublishedSchedules(snap.docs.map((d) => d.data() as AvailabilitySchedule));
        },
        () => {}
      )
    );

    const pubMediaQuery = query(
      collection(db, 'professional_media'),
      where('profileId', '==', targetId),
      where('publicationStatus', '==', 'published'),
      limit(20)
    );
    unsubs.push(
      onSnapshot(
        pubMediaQuery,
        (snap) => {
          setPublishedMedia(snap.docs.map((d) => d.data() as ProfessionalMedia));
        },
        () => {}
      )
    );

    if (canReadUnpublishedTarget) {
      const targetSrvQuery = query(
        collection(db, 'professional_services'),
        where('profileId', '==', targetId),
        limit(50)
      );
      unsubs.push(
        onSnapshot(
          targetSrvQuery,
          (snap) => {
            setTargetServices(snap.docs.map((d) => d.data() as ProfessionalService));
          },
          () => {}
        )
      );

      const targetSchedQuery = query(
        collection(db, 'availability_schedules'),
        where('profileId', '==', targetId),
        limit(14)
      );
      unsubs.push(
        onSnapshot(
          targetSchedQuery,
          (snap) => {
            setTargetSchedules(snap.docs.map((d) => d.data() as AvailabilitySchedule));
          },
          () => {}
        )
      );

      const targetMediaQuery = query(
        collection(db, 'professional_media'),
        where('profileId', '==', targetId),
        limit(20)
      );
      unsubs.push(
        onSnapshot(
          targetMediaQuery,
          (snap) => {
            setTargetMedia(snap.docs.map((d) => d.data() as ProfessionalMedia));
          },
          () => {}
        )
      );
    } else {
      setTargetServices([]);
      setTargetSchedules([]);
      setTargetMedia([]);
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [selectedProfileId, editingProfileId, firebaseUser, isAdmin, allKnownProfiles]);

  // 3. Authenticated Owner Listeners (User Doc, My Profiles, My Services, My Schedules, My Media)
  useEffect(() => {
    if (!isAuthReady || !firebaseUser) {
      setMyProfiles([]);
      setMyServices([]);
      setMySchedules([]);
      setMyMedia([]);
      return;
    }

    const uid = firebaseUser.uid;
    const unsubUserDoc = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (snap.exists()) {
          setMozUser(snap.data() as MozUser);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}`)
    );

    const myProfQ = query(
      collection(db, 'professional_profiles'),
      where('ownerId', '==', uid),
      limit(100)
    );
    const unsubMyProf = onSnapshot(
      myProfQ,
      (snap) => {
        setMyProfiles(snap.docs.map((d) => d.data() as ProfessionalProfile));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'professional_profiles')
    );

    const mySrvQ = query(
      collection(db, 'professional_services'),
      where('ownerId', '==', uid),
      limit(200)
    );
    const unsubMySrv = onSnapshot(
      mySrvQ,
      (snap) => {
        setMyServices(snap.docs.map((d) => d.data() as ProfessionalService));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'professional_services')
    );

    const mySchedQ = query(
      collection(db, 'availability_schedules'),
      where('ownerId', '==', uid),
      limit(200)
    );
    const unsubMySched = onSnapshot(
      mySchedQ,
      (snap) => {
        setMySchedules(snap.docs.map((d) => d.data() as AvailabilitySchedule));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'availability_schedules')
    );

    const myMediaQ = query(
      collection(db, 'professional_media'),
      where('ownerId', '==', uid),
      limit(200)
    );
    const unsubMyMedia = onSnapshot(
      myMediaQ,
      (snap) => {
        setMyMedia(snap.docs.map((d) => d.data() as ProfessionalMedia));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'professional_media')
    );

    const myCompQ = query(
      collection(db, 'companies'),
      where('ownerId', '==', uid),
      limit(100)
    );
    const unsubMyComp = onSnapshot(
      myCompQ,
      (snap) => {
        setMyCompanies(snap.docs.map((d) => d.data() as CompanyProfile));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'companies')
    );

    return () => {
      unsubUserDoc();
      unsubMyProf();
      unsubMySrv();
      unsubMySched();
      unsubMyMedia();
      unsubMyComp();
    };
  }, [isAuthReady, firebaseUser]);

  // 4. Administrator Listeners (Bounded Profiles, Categories, Companies, Audit Logs)
  useEffect(() => {
    if (!isAuthReady || !firebaseUser || !isAdmin) {
      setAdminAllProfiles([]);
      setAdminAllCompanies([]);
      setAdminCategories([]);
      setAdminCompanyCategories([]);
      setAuditLogs([]);
      return;
    }

    const unsubAllProf = onSnapshot(
      query(collection(db, 'professional_profiles'), limit(100)),
      (snap) => {
        setAdminAllProfiles(snap.docs.map((d) => d.data() as ProfessionalProfile));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'professional_profiles')
    );

    const unsubAllCat = onSnapshot(
      query(collection(db, 'professional_categories'), limit(200)),
      (snap) => {
        setAdminCategories(snap.docs.map((d) => d.data() as ProfessionalCategory));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'professional_categories')
    );

    const unsubAllComp = onSnapshot(
      query(collection(db, 'companies'), limit(200)),
      (snap) => {
        setAdminAllCompanies(snap.docs.map((d) => d.data() as CompanyProfile));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'companies')
    );

    const unsubAllCompCat = onSnapshot(
      query(collection(db, 'company_categories'), limit(200)),
      (snap) => {
        setAdminCompanyCategories(snap.docs.map((d) => d.data() as CompanyCategory));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'company_categories')
    );

    const unsubLogs = onSnapshot(
      query(collection(db, 'audit_logs'), limit(100)),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as AuditLog);
        list.sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tB - tA;
        });
        setAuditLogs(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'audit_logs')
    );

    const unsubAllPublicPlaces = onSnapshot(
      query(collection(db, 'public_places'), limit(200)),
      (snap) => {
        setAdminPublicPlaces(snap.docs.map((d) => d.data() as PublicPlace));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'public_places')
    );

    return () => {
      unsubAllProf();
      unsubAllCat();
      unsubAllComp();
      unsubAllCompCat();
      unsubLogs();
      unsubAllPublicPlaces();
    };
  }, [isAuthReady, firebaseUser, isAdmin]);

  // Map services by profileId for fast search and card display
  const servicesByProfileId = useMemo(() => {
    const map: Record<string, ProfessionalService[]> = {};
    const combined = [...publishedServices];
    myServices.forEach((ms) => {
      if (!combined.some((s) => s.id === ms.id)) combined.push(ms);
    });
    targetServices.forEach((ts) => {
      if (!combined.some((s) => s.id === ts.id)) combined.push(ts);
    });
    combined.forEach((srv) => {
      if (!map[srv.profileId]) map[srv.profileId] = [];
      map[srv.profileId].push(srv);
    });
    return map;
  }, [publishedServices, myServices, targetServices]);

  const schedulesByProfileId = useMemo(() => {
    const map: Record<string, AvailabilitySchedule[]> = {};
    const combined = [...publishedSchedules];
    mySchedules.forEach((ms) => {
      if (!combined.some((s) => s.id === ms.id)) combined.push(ms);
    });
    targetSchedules.forEach((ts) => {
      if (!combined.some((s) => s.id === ts.id)) combined.push(ts);
    });
    combined.forEach((sch) => {
      if (!map[sch.profileId]) map[sch.profileId] = [];
      map[sch.profileId].push(sch);
    });
    return map;
  }, [publishedSchedules, mySchedules, targetSchedules]);

  const mediaByProfileId = useMemo(() => {
    const map: Record<string, ProfessionalMedia[]> = {};
    const combined = [...publishedMedia];
    myMedia.forEach((mm) => {
      if (!combined.some((m) => m.id === mm.id)) combined.push(mm);
    });
    targetMedia.forEach((tm) => {
      if (!combined.some((m) => m.id === tm.id)) combined.push(tm);
    });
    combined.forEach((med) => {
      if (!map[med.profileId]) map[med.profileId] = [];
      map[med.profileId].push(med);
    });
    return map;
  }, [publishedMedia, myMedia, targetMedia]);

  // Public Catalogue Categories (Approved Only for Public Filter)
  const approvedPublicProfessions = useMemo(() => {
    return publicCategories
      .filter((c) => c.categoryType === 'profession' && c.reviewStatus === 'approved')
      .sort((a, b) => a.originalName.localeCompare(b.originalName, 'pt'));
  }, [publicCategories]);

  const approvedPublicSpecialties = useMemo(() => {
    return publicCategories
      .filter((c) => c.categoryType === 'specialty' && c.reviewStatus === 'approved')
      .sort((a, b) => a.originalName.localeCompare(b.originalName, 'pt'));
  }, [publicCategories]);

  // Combined Search & Multi-Filter Engine on Published Profiles
  const filteredPublishedProfiles = useMemo(() => {
    const qNorm = normalizeCategoryName(filters.query);

    return publishedProfiles.filter((prof) => {
      if (prof.publicationStatus !== 'published') return false;

      if (filters.profileType !== 'all' && prof.profileType !== filters.profileType) {
        return false;
      }
      if (filters.categoryId && prof.primaryCategoryId !== filters.categoryId) {
        return false;
      }
      if (filters.specialtyId && !prof.specialtyIds.includes(filters.specialtyId)) {
        return false;
      }
      if (filters.province && prof.province !== filters.province) {
        return false;
      }
      if (filters.district && prof.district !== filters.district) {
        return false;
      }
      if (
        filters.neighborhood &&
        normalizeCategoryName(prof.neighborhood) !==
          normalizeCategoryName(filters.neighborhood)
      ) {
        return false;
      }
      if (
        filters.coverageAreaType !== 'all' &&
        prof.coverageAreaType !== filters.coverageAreaType
      ) {
        return false;
      }
      if (filters.deliveryMode !== 'all') {
        if (
          filters.deliveryMode === 'customer_location' &&
          prof.deliveryMode !== 'customer_location' &&
          prof.deliveryMode !== 'both'
        ) {
          return false;
        } else if (
          filters.deliveryMode === 'professional_location' &&
          prof.deliveryMode !== 'professional_location' &&
          prof.deliveryMode !== 'both'
        ) {
          return false;
        } else if (
          filters.deliveryMode !== 'customer_location' &&
          filters.deliveryMode !== 'professional_location' &&
          prof.deliveryMode !== filters.deliveryMode
        ) {
          return false;
        }
      }
      if (
        filters.availabilityStatus !== 'all' &&
        prof.availabilityStatus !== filters.availabilityStatus
      ) {
        return false;
      }

      if (qNorm) {
        const profServices = servicesByProfileId[prof.id] || [];
        const srvText = profServices
          .map((s) => `${s.serviceName} ${s.description} ${s.conditions}`)
          .join(' ');
        const searchable = normalizeCategoryName(
          [
            prof.displayName,
            prof.responsibleName,
            prof.primaryCategoryName,
            prof.specialtyNames.join(' '),
            prof.description,
            prof.province,
            prof.district,
            prof.locality,
            prof.neighborhood,
            prof.streetOrReference,
            prof.nearestStop,
            prof.coverageLocations,
            srvText,
          ].join(' ')
        );
        if (!searchable.includes(qNorm)) return false;
      }

      return true;
    });
  }, [publishedProfiles, filters, servicesByProfileId]);

  // Real-time counts for My Profiles dashboard
  const myProfileCounts = useMemo(() => {
    return {
      all: myProfiles.length,
      published: myProfiles.filter((p) => p.publicationStatus === 'published').length,
      pending_review: myProfiles.filter((p) => p.publicationStatus === 'pending_review').length,
      draft: myProfiles.filter((p) => p.publicationStatus === 'draft').length,
      rejected: myProfiles.filter((p) => p.publicationStatus === 'rejected').length,
      suspended: myProfiles.filter((p) => p.publicationStatus === 'suspended').length,
    };
  }, [myProfiles]);

  const filteredMyProfiles = useMemo(() => {
    if (myProfilesFilter === 'all') return myProfiles;
    return myProfiles.filter((p) => p.publicationStatus === myProfilesFilter);
  }, [myProfiles, myProfilesFilter]);

  const handleLogin = async () => {
    setAuthError(null);
    setIsDomainUnauthorized(false);
    setDomainCopied(false);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirErr) {
          setIsDomainUnauthorized(isUnauthorizedDomainError(redirErr));
          setAuthError(formatFirebaseAuthError(redirErr));
          return;
        }
      }
      setIsDomainUnauthorized(isUnauthorizedDomainError(err));
      setAuthError(formatFirebaseAuthError(err));
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setMozUser(null);
    setMyProfiles([]);
    setAdminAllProfiles([]);
    setAdminCategories([]);
    setAuditLogs([]);
    navigateTo('directory', { editingProfileId: null, replace: true });
  };

  const handleResetFilters = () => {
    setFilters({
      query: '',
      profileType: 'all',
      categoryId: '',
      specialtyId: '',
      province: '',
      district: '',
      neighborhood: '',
      coverageAreaType: 'all',
      deliveryMode: 'all',
      availabilityStatus: 'all',
    });
  };

  const handleToggleFavorite = useCallback((profId: string) => {
    setFavoriteProfileIds((prev) =>
      prev.includes(profId) ? prev.filter((id) => id !== profId) : [profId, ...prev]
    );
  }, []);

  // Direct Consultation Handler
  const handleConsultProfile = async (prof: ProfessionalProfile) => {
    if (isConsulting) return;
    setConsultationNotice(null);
    setRecentProfileIds((prev) => [prof.id, ...prev.filter((id) => id !== prof.id)].slice(0, 10));

    if (!firebaseUser || prof.ownerId === firebaseUser.uid || isAdmin) {
      navigateTo('detail', { profileId: prof.id });
      return;
    }

    setIsConsulting(true);
    try {
      const res = await performDirectConsultationDebit({
        userId: firebaseUser.uid,
        userName: mozUser?.displayName || firebaseUser.displayName || 'Utente MozFácil',
        targetProfileId: prof.id,
        targetProfileName: prof.displayName,
      });

      navigateTo('detail', { profileId: prof.id });

      if (res.alreadyConsulted) {
        setConsultationNotice(
          `Consulta de "${prof.displayName}" já desbloqueada anteriormente (sem débito duplicado). Saldo: ${formatUserCreditBalance(res.remainingCredits)}.`
        );
      } else {
        setConsultationNotice(
          `Consulta efetuada ("${prof.displayName}"): débito de ${getConsultationCreditCostFormatted()}. Saldo restante: ${formatUserCreditBalance(res.remainingCredits)}.`
        );
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : `Não foi possível concluir o débito de ${getConsultationCreditCostFormatted()} para esta consulta.`;
      setConsultationNotice(msg);
      if (msg.includes('Termos e Condições') || msg.includes('Cadastro do Utente')) {
        navigateTo('utente_registration');
      }
    } finally {
      setIsConsulting(false);
    }
  };

  const selectedProfile = useMemo(
    () => allKnownProfiles.find((p) => p.id === selectedProfileId) || null,
    [allKnownProfiles, selectedProfileId]
  );

  const editingProfile = useMemo(
    () => allKnownProfiles.find((p) => p.id === editingProfileId) || null,
    [allKnownProfiles, editingProfileId]
  );

  const selectedModule = useMemo(
    () => getModuleById(selectedModuleId) || MOZFACIL_MODULES[1],
    [selectedModuleId]
  );

  const provinces = useMemo(() => getProvinces(), []);
  const filterDistricts = useMemo(
    () => (filters.province ? getDistrictsByProvince(filters.province) : []),
    [filters.province]
  );
  const filterNeighborhoods = useMemo(
    () =>
      filters.province && filters.district
        ? getNeighborhoodsByDistrict(filters.province, filters.district)
        : [],
    [filters.province, filters.district]
  );

  const isExploreDarkTheme =
    activeView === 'home' || activeView === 'explore' || activeView === 'module_info';

  const favoriteProfiles = useMemo(
    () => allKnownProfiles.filter((p) => favoriteProfileIds.includes(p.id)),
    [allKnownProfiles, favoriteProfileIds]
  );

  const recentProfiles = useMemo(
    () =>
      recentProfileIds
        .map((id) => allKnownProfiles.find((p) => p.id === id))
        .filter((p): p is ProfessionalProfile => Boolean(p)),
    [allKnownProfiles, recentProfileIds]
  );

  const isViewportLocked =
    activeView === 'home' ||
    activeView === 'directory' ||
    activeView === 'companies_directory';

  return (
    <MozErrorBoundary>
      <div
        className={`flex flex-col transition-colors ${
          isViewportLocked
            ? 'h-[100dvh] max-h-[100dvh] overflow-hidden pb-[64px]'
            : 'min-h-screen pb-24'
        } ${
          isExploreDarkTheme
            ? 'bg-gradient-to-b from-[#02102E] via-[#062054] to-[#031438]'
            : 'bg-[#F4F7FB]'
        }`}
      >
        {/* ================================================================= */}
        {/* TOP BRAND BAR MATCHING REFERENCE PRINT (MOZFÁCIL Conexões Rápidas) */}
        {/* ================================================================= */}
        <header className="sticky top-0 z-30 pt-1.5 sm:pt-2 px-2 sm:px-4 shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-b from-[#FFFFFF] via-[#F1F5F9] to-[#CBD5E1] rounded-2xl shadow-[0_4px_14px_rgba(0,0,0,0.25)] border border-white/90 px-3 sm:px-5 py-1.5 sm:py-2 flex items-center justify-between gap-2">
              {/* Left / Center: 3-Wing Swoosh + MOZFÁCIL + Conexões Rápidas */}
              <button
                type="button"
                onClick={() => navigateTo('home', { moduleId: null })}
                className="flex items-center gap-2 sm:gap-3 focus:outline-none group text-left"
              >
                {/* 3-Wing Swoosh Emblem (Orange, Navy, Orange) */}
                <svg viewBox="0 0 60 50" className="w-10 h-8 sm:w-13 sm:h-11 shrink-0" aria-hidden="true">
                  <path d="M18 14 L56 2 L44 16 L8 20 Z" fill="#EA580C" />
                  <path d="M4 28 L52 17 L41 31 L2 33 Z" fill="#07214E" />
                  <path d="M12 42 L48 32 L38 46 L6 45 Z" fill="#EA580C" />
                </svg>

                <div className="flex flex-col items-center leading-none">
                  <div className="text-[20px] sm:text-[28px] font-black italic tracking-tight flex items-center">
                    <span className="text-[#07214E]">MOZ</span>
                    <span className="text-[#D9530F]">FÁCIL</span>
                  </div>
                  <span className="text-[10px] sm:text-xs font-extrabold italic text-[#07214E] -mt-0.5">
                    Conexões Rápidas
                  </span>
                  {/* Tapered orange swoosh underline */}
                  <svg viewBox="0 0 180 10" className="w-32 sm:w-44 h-1.5 sm:h-2 -mt-0.5" aria-hidden="true">
                    <path
                      d="M 2 8 Q 90 1 178 4 Q 95 4 2 8 Z"
                      fill="#EA580C"
                    />
                  </svg>
                </div>
              </button>

              {/* Right: EyeOff Counter + Divider + UserPlus Register Icon + Divider + Orange Menu Button */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveSidebarModal('user_info')}
                  className="flex items-center gap-1 text-[#07214E] font-extrabold text-xs sm:text-sm tabular-nums hover:opacity-80 transition-opacity"
                  title="Serviços MozFácil e Créditos"
                >
                  <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-[#D9530F] shrink-0" />
                  <span>{mozUser ? mozUser.creditsBalance : 0}</span>
                </button>

                <div className="h-5 sm:h-6 w-[1px] bg-slate-400/70" aria-hidden="true" />

                <button
                  type="button"
                  onClick={() => setActiveSidebarModal('register_choice')}
                  className="p-1 sm:p-1.5 rounded-lg hover:bg-slate-200/70 text-[#EA580C] transition-colors flex items-center justify-center"
                  aria-label="Cadastre-se Agora no MozFácil"
                  title="Cadastre-se Agora no MozFácil"
                >
                  <svg
                    viewBox="0 0 28 24"
                    className="w-6 h-5 sm:w-7 sm:h-6"
                    aria-hidden="true"
                  >
                    <circle cx="10" cy="7" r="4.5" fill="#EA580C" />
                    <path
                      d="M2 20c0-4.2 3.6-7 8-7s8 2.8 8 7H2z"
                      fill="#EA580C"
                    />
                    <path
                      d="M22 8v6M19 11h6"
                      stroke="#EA580C"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>

                <div className="h-5 sm:h-6 w-[1px] bg-slate-400/70" aria-hidden="true" />

                <button
                  type="button"
                  onClick={() => setShowTopMenu((prev) => !prev)}
                  className="p-1 sm:p-1.5 rounded-lg hover:bg-slate-200/70 text-[#D9530F] transition-colors"
                  aria-label="Abrir menu lateral"
                  aria-expanded={showTopMenu}
                >
                  <Menu className="w-6 h-6 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Secondary Quick Navigation & Account Bar on internal module screens (hidden on mobile when inside locked directory views to preserve dynamic viewport) */}
            {!isExploreDarkTheme && (
              <div
                className={`mt-1.5 bg-[#082456]/95 backdrop-blur-xs text-white rounded-2xl border border-blue-800/80 px-3 py-1.5 shadow-md items-center justify-between gap-2 text-xs ${
                  activeView === 'directory' || activeView === 'companies_directory'
                    ? 'hidden md:flex'
                    : 'flex flex-wrap'
                }`}
              >
                <nav aria-label="Navegação Principal" className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      navigateTo('explore');
                      setShowTopMenu(false);
                    }}
                    className="px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors bg-white/10 text-blue-100 hover:bg-white/20"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Explore</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigateTo('directory', { moduleId: 'professionals_services' });
                      setShowTopMenu(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                      activeView === 'directory'
                        ? 'bg-white text-[#0D316E]'
                        : 'bg-white/10 text-blue-100 hover:bg-white/20'
                    }`}
                  >
                    Profissionais e Serviços
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigateTo('utente_registration');
                      setShowTopMenu(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-extrabold flex items-center gap-1 transition-colors ${
                      activeView === 'utente_registration'
                        ? 'bg-[#E85B0D] text-white'
                        : 'bg-white/10 text-blue-100 hover:bg-white/20'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Cadastro do Utente</span>
                  </button>

                  {firebaseUser && (
                    <button
                      type="button"
                      onClick={() => {
                        navigateTo('my_profiles');
                        setShowTopMenu(false);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                        activeView === 'my_profiles'
                          ? 'bg-white text-[#0D316E]'
                          : 'bg-white/10 text-blue-100 hover:bg-white/20'
                      }`}
                    >
                      Meus Perfis ({myProfiles.length})
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        navigateTo('admin');
                        setShowTopMenu(false);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors ${
                        activeView === 'admin'
                          ? 'bg-[#F97316] text-white'
                          : 'bg-white/10 text-blue-100 hover:bg-white/20'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Painel Admin</span>
                    </button>
                  )}
                </nav>

                <div className="flex flex-wrap items-center gap-2">
                  {firebaseUser && mozUser ? (
                    <button
                      type="button"
                      onClick={() => {
                        navigateTo('utente_registration');
                        setShowTopMenu(false);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 text-[#0D316E] font-extrabold flex items-center gap-1 tabular-nums"
                    >
                      <Coins className="w-3.5 h-3.5 text-[#E85B0D]" />
                      <span>
                        {formatUserCreditBalance(mozUser.creditsBalance)}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSidebarModal('user_info');
                        setShowTopMenu(false);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/10 text-blue-100 font-semibold flex items-center gap-1 hover:bg-white/20 transition-colors"
                      title="Informação sobre créditos e custos de utilização"
                    >
                      <Coins className="w-3.5 h-3.5 text-[#F97316]" />
                      <span>Informação de Créditos</span>
                    </button>
                  )}

                  {firebaseUser ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          navigateTo('register_edit', { editingProfileId: null });
                          setShowTopMenu(false);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white font-extrabold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Novo Perfil</span>
                      </button>

                      <span className="inline-flex items-center gap-1 font-semibold text-white max-w-[130px] truncate">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">
                          {mozUser?.displayName || firebaseUser.displayName || firebaseUser.email}
                        </span>
                      </span>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold flex items-center gap-1"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Sair</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleLogin}
                      className="px-3 py-1 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white font-extrabold flex items-center gap-1"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Entrar / Registar</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Network Offline Banner */}
        {!isOnline && (
          <div className="bg-amber-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 mt-2">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>
              Rede indisponível. A exibir dados em cache local até que a ligação seja restabelecida.
            </span>
          </div>
        )}

        {/* Auth Error Notice */}
        {authError && (
          <div className="max-w-3xl mx-auto px-4 pt-2 w-full">
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <span className="font-semibold leading-relaxed">{authError}</span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthError(null);
                    setIsDomainUnauthorized(false);
                    setIsTokenServiceDisabled(false);
                  }}
                  className="font-bold underline shrink-0"
                >
                  Fechar
                </button>
              </div>
              {isTokenServiceDisabled && (
                <div className="pt-2 border-t border-red-200/80 flex flex-wrap items-center gap-2">
                  <a
                    href="https://console.developers.google.com/apis/api/securetoken.googleapis.com/overview?project=701961670549"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#E85B0D] hover:bg-[#c94d09] text-white font-extrabold text-xs transition-colors shadow-xs"
                  >
                    Ativar "Token Service API" no Google Cloud (1 clique)
                  </a>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-red-300 hover:bg-red-50 text-red-900 font-bold text-xs transition-colors"
                  >
                    Já ativei / Atualizar página
                  </button>
                </div>
              )}
              {isDomainUnauthorized && (
                <div className="pt-1.5 border-t border-red-200/80 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const host = getCurrentHostDomain();
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(host).then(() => {
                          setDomainCopied(true);
                        });
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-red-300 hover:bg-red-100 text-red-900 font-bold text-[11px] transition-colors"
                  >
                    {domainCopied
                      ? `Domínio copiado (${getCurrentHostDomain()})`
                      : `Copiar domínio: ${getCurrentHostDomain()}`}
                  </button>
                  <a
                    href={`https://console.firebase.google.com/project/${activeFirebaseConfig.projectId}/authentication/settings`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-[#0D316E] hover:bg-[#092452] text-white font-bold text-[11px] transition-colors"
                  >
                    Abrir Domínios Autorizados no Firebase Console
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Consultation / Operation Notice Banner */}
        {consultationNotice && (
          <div className="max-w-3xl mx-auto px-4 pt-2 w-full">
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-[#0D316E] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#E85B0D] shrink-0" />
                <span>{consultationNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setConsultationNotice(null)}
                className="underline text-slate-600 shrink-0"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MAIN CONTENT AREA                                                 */}
        {/* ================================================================= */}
        <main
          className={`flex-1 max-w-7xl w-full mx-auto ${
            activeView === 'home'
              ? 'min-h-0 flex flex-col overflow-hidden px-1.5 sm:px-6 py-0.5'
              : activeView === 'directory' || activeView === 'companies_directory'
                ? 'min-h-0 flex flex-col overflow-hidden px-2 sm:px-6 py-1.5 sm:py-2.5'
                : activeView === 'explore'
                  ? 'px-1.5 sm:px-6 pt-1 pb-20 sm:py-3'
                  : 'px-2 sm:px-6 pt-2 pb-24 sm:py-4 sm:pb-24'
          }`}
        >
          {/* VIEW 0.1: HOME SCREEN ("Início" button in bottom bar matching reference print) */}
          {activeView === 'home' && (
            <MozfacilHomeScreen
              searchQuery={filters.query}
              onSearchQueryChange={(q) => setFilters((prev) => ({ ...prev, query: q }))}
              onSubmitSearch={(q) => {
                const trimmed = q.trim();
                if (trimmed) {
                  setRecentSearches((prev) =>
                    [trimmed, ...prev.filter((item) => item !== trimmed)].slice(0, 8)
                  );
                }
                setFilters((prev) => ({ ...prev, query: trimmed }));
                navigateTo('directory', { moduleId: 'professionals_services' });
              }}
              isRegisteredUser={Boolean(mozUser && mozUser.termsAccepted)}
              onOpenCustomerLine={() => setActiveSidebarModal('customer_line')}
              onOpenDirectContact={() => setActiveSidebarModal('direct_contact')}
              onOpenUserInfo={() => setActiveSidebarModal('user_info')}
              onOpenRegisterChoice={() => setActiveSidebarModal('register_choice')}
              onOpenShareMozfacil={() => navigateTo('public_place_instructions')}
              onOpenExploreModules={() => navigateTo('explore')}
              onOpenProfessionalsDirectory={() =>
                navigateTo('directory', { moduleId: 'professionals_services' })
              }
            />
          )}

          {/* VIEW 0.1b: PUBLIC INSTITUTIONS INSTRUCTIONS SCREEN */}
          {activeView === 'public_place_instructions' && (
            <PublicPlaceInstructionsScreen
              publicPlaces={publicPlaces}
              onContinueToForm={() => navigateTo('public_place_registration')}
              onBackHome={() => navigateTo('home', { moduleId: null })}
              onOpenShareModal={() => setActiveSidebarModal('share_mozfacil')}
            />
          )}

          {/* VIEW 0.1c: PUBLIC INSTITUTIONS REGISTRATION FORM */}
          {activeView === 'public_place_registration' && (
            <PublicPlaceRegistrationScreen
              existingPlaces={publicPlaces}
              onBackToInstructions={() => navigateTo('public_place_instructions')}
              onPlaceSubmitted={(newPlace) => {
                setPublishedPublicPlaces((prev) =>
                  prev.some((p) => p.id === newPlace.id) ? prev : [newPlace, ...prev]
                );
              }}
            />
          )}

          {/* VIEW 0.2: EXPLORE SCREEN (ALL 12 ORIGINAL MODULES MATCHING PRINT) */}
          {activeView === 'explore' && (
            <ExploreModulesScreen
              onSelectModule={handleSelectExploreModule}
              onBack={() => navigateTo('home', { moduleId: null })}
            />
          )}

          {/* VIEW 0.5: INFORMATIVE DESTINATION FOR MODULES 2-12 */}
          {activeView === 'module_info' && (
            <div className="pt-2">
              <ModuleDestinationUnavailable
                module={selectedModule}
                onBackToExplore={() => navigateTo('explore')}
                onOpenProfessionalsModule={() =>
                  navigateTo('directory', { moduleId: 'professionals_services' })
                }
              />
            </div>
          )}

          {/* VIEW 1: PUBLIC DIRECTORY & REAL-TIME SEARCH / FILTERS (MODULE 1 — DYNAMIC MOBILE VIEWPORT) */}
          {activeView === 'directory' && (
            <div className="h-full flex-1 min-h-0 flex flex-col gap-2 max-w-4xl w-full mx-auto overflow-hidden">
              {/* Top Compact Header, Search & Quick Filter Control Bar (shrink-0) */}
              <div className="shrink-0 bg-gradient-to-r from-[#071F4A] via-[#0D316E] to-[#1E4B9B] rounded-2xl p-2.5 sm:p-3.5 text-white shadow-md border border-[#1E4B9B]/80 space-y-2">
                {/* Row 1: Title + Count + Quick Register CTA */}
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#F97316]/20 border border-[#F97316]/40 flex items-center justify-center shrink-0">
                      <Briefcase className="w-4 h-4 text-[#F97316]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h1 className="text-sm sm:text-lg font-black tracking-tight text-white truncate">
                          Profissionais e Serviços
                        </h1>
                        <span className="px-2 py-0.5 rounded-full bg-white/15 text-orange-300 text-[10px] sm:text-xs font-extrabold tabular-nums shrink-0">
                          {filteredPublishedProfiles.length}
                        </span>
                      </div>
                      <p className="text-[11px] text-blue-200 truncate hidden sm:block">
                        Mecânicos, técnicos, prestadores de serviços e vendedores verificados em Moçambique
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {firebaseUser && mozUser ? (
                      <button
                        type="button"
                        onClick={() => navigateTo('utente_registration')}
                        className="h-8 px-2.5 rounded-xl bg-amber-50 text-[#0D316E] font-extrabold text-[11px] flex items-center gap-1 tabular-nums md:hidden"
                      >
                        <Coins className="w-3.5 h-3.5 text-[#E85B0D]" />
                        <span>{formatUserCreditBalance(mozUser.creditsBalance)}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveSidebarModal('user_info')}
                        className="h-8 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-blue-100 font-bold text-[11px] flex items-center gap-1 md:hidden"
                      >
                        <Coins className="w-3.5 h-3.5 text-[#F97316]" />
                        <span>Créditos</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (!firebaseUser) {
                          handleLogin();
                        } else {
                          navigateTo('register_edit', { editingProfileId: null });
                        }
                      }}
                      className="h-8 sm:h-9 px-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-[11px] sm:text-xs font-extrabold flex items-center gap-1 shadow-xs transition-transform active:scale-95 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Cadastrar</span>
                    </button>
                  </div>
                </div>

                {/* Row 2: Search Input + Compact Filter Drawer Toggle */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 min-w-0">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={filters.query}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, query: e.target.value }))
                      }
                      placeholder="Pesquisar profissão, nome ou bairro..."
                      className="w-full h-9 sm:h-10 pl-9 pr-8 rounded-xl bg-white text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                    />
                    {filters.query && (
                      <button
                        type="button"
                        onClick={() => setFilters((prev) => ({ ...prev, query: '' }))}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAdvancedFilters((prev) => !prev)}
                    className={`h-9 sm:h-10 px-3 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-colors shrink-0 border ${
                      showAdvancedFilters ||
                      filters.district ||
                      filters.neighborhood ||
                      filters.specialtyId ||
                      filters.profileType !== 'all' ||
                      filters.coverageAreaType !== 'all'
                        ? 'bg-[#F97316] border-[#F97316] text-white'
                        : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Filtros</span>
                  </button>
                </div>

                {/* Row 3: 2-Column Quick Selectors (Profissão + Província) & Quick Status Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-12 gap-1.5 sm:gap-2 items-center">
                  <div className="sm:col-span-4">
                    <select
                      value={filters.categoryId}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, categoryId: e.target.value }))
                      }
                      className="w-full h-8 sm:h-9 px-2.5 rounded-xl bg-white/95 text-slate-900 text-[11px] sm:text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                    >
                      <option value="">Todas as Profissões ({approvedPublicProfessions.length})</option>
                      {approvedPublicProfessions.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.originalName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <select
                      value={filters.province}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          province: e.target.value,
                          district: '',
                          neighborhood: '',
                        }))
                      }
                      className="w-full h-8 sm:h-9 px-2.5 rounded-xl bg-white/95 text-slate-900 text-[11px] sm:text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                    >
                      <option value="">Toda Moçambique</option>
                      {provinces.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quick Pills Strip */}
                  <div className="col-span-2 sm:col-span-5 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          availabilityStatus:
                            prev.availabilityStatus === 'available' ? 'all' : 'available',
                        }))
                      }
                      className={`h-7 sm:h-8 px-2.5 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all whitespace-nowrap shrink-0 ${
                        filters.availabilityStatus === 'available'
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-white/10 text-blue-100 hover:bg-white/20'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Disponíveis (ON)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          deliveryMode:
                            prev.deliveryMode === 'customer_location'
                              ? 'all'
                              : 'customer_location',
                        }))
                      }
                      className={`h-7 sm:h-8 px-2.5 rounded-lg text-[11px] font-extrabold transition-all whitespace-nowrap shrink-0 ${
                        filters.deliveryMode === 'customer_location'
                          ? 'bg-[#F97316] text-white shadow-xs'
                          : 'bg-white/10 text-blue-100 hover:bg-white/20'
                      }`}
                    >
                      <span>Ao Domicílio</span>
                    </button>

                    {(filters.query ||
                      filters.profileType !== 'all' ||
                      filters.categoryId ||
                      filters.specialtyId ||
                      filters.province ||
                      filters.district ||
                      filters.neighborhood ||
                      filters.coverageAreaType !== 'all' ||
                      filters.deliveryMode !== 'all' ||
                      filters.availabilityStatus !== 'all') && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="h-7 sm:h-8 px-2.5 rounded-lg bg-red-500/20 border border-red-300/40 text-orange-200 hover:bg-red-500/30 text-[11px] font-extrabold flex items-center gap-1 whitespace-nowrap shrink-0"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Limpar</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Expandable Compact Multi-Filter Drawer */}
                {showAdvancedFilters && (
                  <div className="pt-2 border-t border-white/15 grid grid-cols-2 sm:grid-cols-5 gap-2 text-slate-900">
                    <select
                      value={filters.district}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          district: e.target.value,
                          neighborhood: '',
                        }))
                      }
                      disabled={!filters.province}
                      className="w-full h-8 px-2.5 rounded-lg bg-white text-[11px] font-semibold disabled:opacity-60"
                    >
                      <option value="">
                        {filters.province ? 'Todos os Distritos' : 'Distrito (Província 1º)'}
                      </option>
                      {filterDistricts.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>

                    <select
                      value={filters.neighborhood}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, neighborhood: e.target.value }))
                      }
                      disabled={!filters.district}
                      className="w-full h-8 px-2.5 rounded-lg bg-white text-[11px] font-semibold disabled:opacity-60"
                    >
                      <option value="">
                        {filters.district ? 'Todos os Bairros' : 'Bairro (Distrito 1º)'}
                      </option>
                      {filterNeighborhoods.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>

                    <select
                      value={filters.specialtyId}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, specialtyId: e.target.value }))
                      }
                      className="w-full h-8 px-2.5 rounded-lg bg-white text-[11px] font-semibold"
                    >
                      <option value="">Todas Especialidades</option>
                      {approvedPublicSpecialties.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.originalName}
                        </option>
                      ))}
                    </select>

                    <select
                      value={filters.profileType}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          profileType: e.target.value as ProfileType | 'all',
                        }))
                      }
                      className="w-full h-8 px-2.5 rounded-lg bg-white text-[11px] font-semibold"
                    >
                      <option value="all">Todos os Prestadores</option>
                      <option value="independent">Independente</option>
                      <option value="service_provider">Prestador de Serviços</option>
                      <option value="street_vendor">Vendedor Ambulante</option>
                    </select>

                    <select
                      value={filters.coverageAreaType}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          coverageAreaType: e.target.value as CoverageAreaType | 'all',
                        }))
                      }
                      className="col-span-2 sm:col-span-1 w-full h-8 px-2.5 rounded-lg bg-white text-[11px] font-semibold"
                    >
                      <option value="all">Qualquer Cobertura</option>
                      <option value="neighborhood">Bairro</option>
                      <option value="district">Distrito</option>
                      <option value="province">Província</option>
                      <option value="selected_locations">Zonas Selecionadas</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Dynamic Self-Contained Results Viewport (flex-1 min-h-0 overflow-y-auto) */}
              <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 pb-2 space-y-2.5">
                {/* INTERFACE STATE 1: REQUEST FAILED */}
                {requestError && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-center space-y-2">
                    <AlertTriangle className="w-6 h-6 text-red-600 mx-auto" />
                    <h3 className="text-xs font-extrabold text-red-900">
                      Falha ao carregar dados da base de dados
                    </h3>
                    <p className="text-[11px] text-red-700">{requestError}</p>
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="px-3.5 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                )}

                {/* INTERFACE STATE 2: LOADING */}
                {isLoadingData && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className="bg-white rounded-2xl p-3.5 border border-slate-200 animate-pulse space-y-2.5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-slate-200" />
                          <div className="space-y-1.5 flex-1">
                            <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                            <div className="h-3 bg-slate-200 rounded w-1/2" />
                          </div>
                        </div>
                        <div className="h-8 bg-slate-100 rounded-xl" />
                      </div>
                    ))}
                  </div>
                )}

                {/* INTERFACE STATE 3: RESULTS FOUND */}
                {!isLoadingData && filteredPublishedProfiles.length > 0 && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {filteredPublishedProfiles.slice(0, visibleCount).map((prof) => {
                        const profServices = servicesByProfileId[prof.id] || [];
                        const cleanWa = (prof.whatsapp || prof.phone).replace(/\D/g, '');
                        const cleanTel = prof.phone.replace(/[^\d+]/g, '');
                        const firstService = profServices[0];

                        return (
                          <article
                            key={prof.id}
                            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow p-3 sm:p-3.5 flex flex-col justify-between gap-2.5"
                          >
                            {/* Card Top: Compact Avatar + Name + Category + Location + Status */}
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                onClick={() => handleConsultProfile(prof)}
                                className="w-12 h-12 sm:w-13 sm:h-13 rounded-full border-2 border-[#0D316E] bg-blue-50 flex items-center justify-center overflow-hidden shrink-0"
                              >
                                {prof.photoUrl ? (
                                  <img
                                    src={prof.photoUrl}
                                    alt={prof.displayName}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Briefcase className="w-5 h-5 text-[#0D316E]" />
                                )}
                              </button>

                              <div className="flex-1 min-w-0 space-y-0.5">
                                <div className="flex items-center justify-between gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleConsultProfile(prof)}
                                    className="text-left font-extrabold text-sm sm:text-base text-[#0D316E] hover:text-[#F97316] transition-colors truncate"
                                  >
                                    {prof.displayName}
                                  </button>

                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                                      prof.operationalState === 'on'
                                        ? 'bg-emerald-600 text-white'
                                        : prof.operationalState === 'off'
                                        ? 'bg-slate-500 text-white'
                                        : 'bg-red-600 text-white'
                                    }`}
                                  >
                                    {prof.operationalState.toUpperCase()}
                                  </span>
                                </div>

                                <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-1">
                                  <span className="font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                                    {prof.primaryCategoryName}
                                  </span>
                                  <span>·</span>
                                  <span className="font-semibold text-slate-700">
                                    {prof.profileType === 'independent'
                                      ? 'Independente'
                                      : prof.profileType === 'service_provider'
                                      ? 'Prestador'
                                      : 'Ambulante'}
                                  </span>
                                  {prof.phoneVerified && (
                                    <span className="text-emerald-700 font-bold">· Verificado</span>
                                  )}
                                </div>

                                <div className="flex items-center justify-between gap-2 text-[11px] pt-0.5">
                                  <div className="flex items-center gap-1 font-semibold text-[#0D316E] min-w-0">
                                    <MapPin className="w-3 h-3 text-[#F97316] shrink-0" />
                                    <span className="truncate">
                                      {prof.neighborhood}, {prof.district} ({prof.province})
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1 text-slate-500 shrink-0">
                                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate max-w-[95px]">
                                      {prof.workingDaysSummary}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Compact Service / Description Strip */}
                            {(firstService || prof.description) && (
                              <div className="bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2 text-[11px]">
                                {firstService ? (
                                  <>
                                    <span className="font-bold text-slate-700 truncate flex items-center gap-1">
                                      <Wrench className="w-3 h-3 text-[#0D316E] shrink-0" />
                                      <span className="truncate">{firstService.serviceName}</span>
                                      {profServices.length > 1 && (
                                        <span className="text-slate-400 font-semibold shrink-0">
                                          +{profServices.length - 1}
                                        </span>
                                      )}
                                    </span>
                                    <span className="font-mono font-extrabold text-[#0D316E] shrink-0">
                                      {firstService.hasFixedPrice && firstService.price > 0
                                        ? `${firstService.price.toLocaleString('pt-MZ')} MT`
                                        : 'Sob consulta'}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-slate-600 truncate">{prof.description}</span>
                                )}
                              </div>
                            )}

                            {/* Compact Action Bar */}
                            <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                              <a
                                href={`https://wa.me/${cleanWa}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-8 sm:h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-1 transition-colors"
                              >
                                <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>WhatsApp</span>
                              </a>

                              <a
                                href={`tel:${cleanTel}`}
                                className="h-8 sm:h-9 rounded-xl bg-[#0D316E] hover:bg-[#092452] text-white text-xs font-extrabold flex items-center justify-center gap-1 transition-colors"
                              >
                                <Phone className="w-3.5 h-3.5 shrink-0" />
                                <span>Ligar</span>
                              </a>

                              <button
                                type="button"
                                onClick={() => handleConsultProfile(prof)}
                                className="h-8 sm:h-9 rounded-xl bg-white border border-[#0D316E] hover:bg-blue-50 text-[#0D316E] text-xs font-extrabold flex items-center justify-center transition-colors"
                              >
                                <span>Ver Perfil</span>
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>

                    {/* Incremental Pagination Button */}
                    {filteredPublishedProfiles.length > visibleCount && (
                      <div className="text-center pt-1 pb-2">
                        <button
                          type="button"
                          onClick={() => setVisibleCount((prev) => prev + 12)}
                          className="px-5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-[#0D316E] font-extrabold text-xs shadow-xs"
                        >
                          Carregar mais ({filteredPublishedProfiles.length - visibleCount} restantes)
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* INTERFACE STATE 4: NO RESULTS */}
                {!isLoadingData && filteredPublishedProfiles.length === 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center max-w-md mx-auto space-y-3 shadow-xs my-2">
                    <Briefcase className="w-8 h-8 text-[#0D316E] mx-auto" />
                    <div className="space-y-1">
                      <h3 className="text-sm font-extrabold text-[#0D316E]">
                        {publishedProfiles.length === 0
                          ? 'Ainda Não Existem Perfis Publicados'
                          : 'Nenhum profissional corresponde aos filtros'}
                      </h3>
                      <p className="text-xs text-slate-600">
                        {publishedProfiles.length === 0
                          ? 'Registe o primeiro perfil profissional ou serviço para iniciar o catálogo público.'
                          : 'Tente ajustar a pesquisa, mudar de província ou limpar os filtros ativos.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      {publishedProfiles.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (!firebaseUser) {
                              handleLogin();
                            } else {
                              navigateTo('register_edit', { editingProfileId: null });
                            }
                          }}
                          className="h-9 px-4 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-extrabold flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Criar Perfil Profissional</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="h-9 px-4 rounded-xl bg-[#0D316E] text-white text-xs font-extrabold"
                        >
                          Limpar Filtros
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 1.5: CADASTRO DO UTENTE */}
          {activeView === 'utente_registration' && (
            <UtenteRegistrationScreen
              firebaseUser={firebaseUser}
              mozUser={mozUser}
              onBack={() => navigateTo('directory')}
              onSaved={(updatedUser) => {
                setMozUser(updatedUser);
              }}
              onRequestGoogleLogin={handleLogin}
            />
          )}

          {/* VIEW 2: MY PROFILES (AUTHENTICATED PROFESSIONAL DASHBOARD) */}
          {activeView === 'my_profiles' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-[#0D316E]">
                    Meus Perfis Profissionais e Serviços ({myProfileCounts.all})
                  </h2>
                  <p className="text-xs text-slate-600">
                    Gira o estado de disponibilidade (ON/OFF/STOP), edite serviços, horários ou acompanhe perfis em revisão e rascunhos.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigateTo('register_edit', { editingProfileId: null })}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white text-xs font-extrabold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Novo Perfil Profissional</span>
                </button>
              </div>

              {/* Horizontally Scrollable Status Filter Carousel for My Profiles */}
              <div className="bg-white border border-slate-200 rounded-xl p-1.5 overflow-x-auto no-scrollbar scroll-smooth">
                <div className="flex items-center gap-1.5 min-w-max">
                  {(
                    [
                      { id: 'all', label: `Todos (${myProfileCounts.all})` },
                      { id: 'published', label: `Publicados (${myProfileCounts.published})` },
                      {
                        id: 'pending_review',
                        label: `Em Revisão (${myProfileCounts.pending_review})`,
                      },
                      { id: 'draft', label: `Rascunhos (${myProfileCounts.draft})` },
                      { id: 'rejected', label: `Rejeitados (${myProfileCounts.rejected})` },
                      { id: 'suspended', label: `Suspensos (${myProfileCounts.suspended})` },
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setMyProfilesFilter(st.id)}
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all whitespace-nowrap shrink-0 active:scale-[0.98] ${
                        myProfilesFilter === st.id
                          ? 'bg-[#0D316E] text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {requestError && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between">
                  <span>{requestError}</span>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="px-3 py-1 rounded-lg bg-red-600 text-white font-bold"
                  >
                    Recarregar
                  </button>
                </div>
              )}

              {isLoadingData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map((n) => (
                    <div
                      key={n}
                      className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse space-y-3"
                    >
                      <div className="h-5 bg-slate-200 rounded w-2/3" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                      <div className="h-10 bg-slate-100 rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : filteredMyProfiles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMyProfiles.map((prof) => {
                    const profServices = servicesByProfileId[prof.id] || [];
                    return (
                      <div
                        key={prof.id}
                        className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-base font-extrabold text-[#0D316E]">
                              {prof.displayName}
                            </h3>
                            <p className="text-xs text-slate-600">
                              {prof.primaryCategoryName || 'Categoria por definir'} ·{' '}
                              {prof.neighborhood}, {prof.district} ({prof.province})
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {profServices.length}{' '}
                              {profServices.length === 1
                                ? 'serviço registado'
                                : 'serviços registados'}{' '}
                              · {prof.workingDaysSummary}
                            </p>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
                              prof.publicationStatus === 'published'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : prof.publicationStatus === 'pending_review'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : prof.publicationStatus === 'draft'
                                ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {prof.publicationStatus === 'published'
                              ? 'Publicado'
                              : prof.publicationStatus === 'draft'
                              ? 'Rascunho'
                              : prof.publicationStatus === 'pending_review'
                              ? 'Em Revisão'
                              : prof.publicationStatus === 'rejected'
                              ? 'Rejeitado'
                              : 'Suspenso'}
                          </span>
                        </div>

                        {prof.rejectionReason && (
                          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                            <strong>Nota da Administração:</strong> {prof.rejectionReason}
                          </div>
                        )}

                        {/* Quick Operational State Switcher */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-xs font-bold text-slate-700">
                            Disponibilidade Atual:
                          </span>
                          <div className="flex items-center gap-1.5">
                            {(['on', 'off', 'stop'] as const).map((st) => (
                              <button
                                key={st}
                                type="button"
                                disabled={prof.publicationStatus === 'suspended'}
                                onClick={() =>
                                  updateProfileOperationalState({
                                    profileId: prof.id,
                                    operationalState: st,
                                  })
                                }
                                className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase transition-colors ${
                                  prof.operationalState === st
                                    ? st === 'on'
                                      ? 'bg-emerald-600 text-white'
                                      : st === 'off'
                                      ? 'bg-slate-600 text-white'
                                      : 'bg-red-600 text-white'
                                    : 'bg-white border border-slate-300 text-slate-600'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Primary & Lifecycle Actions */}
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => navigateTo('detail', { profileId: prof.id })}
                              className="flex-1 min-h-[40px] rounded-xl border border-[#0D316E] text-[#0D316E] text-xs font-bold hover:bg-blue-50"
                            >
                              Ver Página do Perfil
                            </button>
                            <button
                              type="button"
                              disabled={prof.publicationStatus === 'suspended' && !isAdmin}
                              onClick={() =>
                                navigateTo('register_edit', { editingProfileId: prof.id })
                              }
                              className="flex-1 min-h-[40px] rounded-xl bg-[#0D316E] hover:bg-[#092452] text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>
                                {prof.publicationStatus === 'draft'
                                  ? 'Continuar Rascunho'
                                  : prof.publicationStatus === 'rejected'
                                  ? 'Corrigir e Reenviar'
                                  : 'Editar Dados e Serviços'}
                              </span>
                            </button>
                          </div>

                          {/* Deactivate to Draft or Resubmit for Review */}
                          {prof.publicationStatus !== 'suspended' && firebaseUser && (
                            <div className="flex items-center justify-end gap-2">
                              {(prof.publicationStatus === 'published' ||
                                prof.publicationStatus === 'pending_review') && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await ownerSetProfilePublicationStatus({
                                        profile: prof,
                                        newStatus: 'draft',
                                        ownerId: firebaseUser.uid,
                                        ownerName:
                                          mozUser?.displayName ||
                                          firebaseUser.displayName ||
                                          'Profissional',
                                      });
                                      setConsultationNotice(
                                        `O perfil "${prof.displayName}" foi desativado do diretório público e guardado como Rascunho.`
                                      );
                                    } catch (err) {
                                      setConsultationNotice(
                                        err instanceof Error
                                          ? err.message
                                          : 'Erro ao desativar publicação.'
                                      );
                                    }
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                                >
                                  Desativar Publicação (Passar a Rascunho)
                                </button>
                              )}

                              {(prof.publicationStatus === 'draft' ||
                                prof.publicationStatus === 'rejected') &&
                                prof.primaryCategoryId &&
                                prof.phone && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        await ownerSetProfilePublicationStatus({
                                          profile: prof,
                                          newStatus: 'pending_review',
                                          ownerId: firebaseUser.uid,
                                          ownerName:
                                            mozUser?.displayName ||
                                            firebaseUser.displayName ||
                                            'Profissional',
                                        });
                                        setConsultationNotice(
                                          `O perfil "${prof.displayName}" foi submetido para revisão administrativa.`
                                        );
                                      } catch (err) {
                                        setConsultationNotice(
                                          err instanceof Error
                                            ? err.message
                                            : 'Complete todos os campos obrigatórios antes de submeter.'
                                        );
                                      }
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors"
                                  >
                                    Submeter para Revisão
                                  </button>
                                )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-3">
                  <p className="text-sm font-bold text-[#0D316E]">
                    {myProfiles.length === 0
                      ? 'Ainda não criou nenhum perfil profissional associado à sua conta.'
                      : 'Nenhum perfil encontrado para o filtro de estado selecionado.'}
                  </p>
                  {myProfiles.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => navigateTo('register_edit', { editingProfileId: null })}
                      className="px-5 py-2.5 rounded-xl bg-[#F97316] text-white text-xs font-extrabold"
                    >
                      Criar Meu Perfil Gratuito Agora
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMyProfilesFilter('all')}
                      className="px-4 py-2 rounded-xl bg-[#0D316E] text-white text-xs font-bold"
                    >
                      Mostrar Todos os Meus Perfis
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: REGISTRATION / EDIT FORM */}
          {activeView === 'register_edit' && firebaseUser && (
            <ProfessionalRegistrationForm
              currentUserId={firebaseUser.uid}
              currentUserName={
                mozUser?.displayName || firebaseUser.displayName || 'Profissional'
              }
              currentUserEmail={firebaseUser.email || ''}
              currentUserEmailVerified={Boolean(firebaseUser.emailVerified)}
              isAdmin={isAdmin}
              categories={categories}
              existingProfile={editingProfile}
              existingServices={
                editingProfile ? servicesByProfileId[editingProfile.id] || [] : []
              }
              existingSchedules={
                editingProfile ? schedulesByProfileId[editingProfile.id] || [] : []
              }
              existingMedia={
                editingProfile ? mediaByProfileId[editingProfile.id] || [] : []
              }
              onSaved={(savedId) => {
                setMyProfilesFilter('all');
                setConsultationNotice(
                  'Perfil profissional guardado com sucesso. Pode gerir o seu estado em "Meus Perfis" ou visualizar os detalhes abaixo.'
                );
                navigateTo('my_profiles', { profileId: savedId });
              }}
              onCancel={() => navigateTo('directory')}
            />
          )}

          {/* VIEW 4: PROFILE DETAIL VIEW */}
          {activeView === 'detail' && selectedProfile && (
            <ProfessionalProfileDetail
              profile={selectedProfile}
              services={servicesByProfileId[selectedProfile.id] || []}
              schedules={schedulesByProfileId[selectedProfile.id] || []}
              media={mediaByProfileId[selectedProfile.id] || []}
              currentUserId={firebaseUser?.uid}
              isAdmin={isAdmin}
              onBack={() => navigateTo('directory')}
              onEdit={() =>
                navigateTo('register_edit', { editingProfileId: selectedProfile.id })
              }
            />
          )}

          {/* VIEW 5: ADMINISTRATOR CONSOLE */}
          {activeView === 'admin' && isAdmin && firebaseUser && (
            <AdminDashboard
              profiles={adminAllProfiles.length > 0 ? adminAllProfiles : allKnownProfiles}
              categories={categories}
              companies={companies}
              companyCategories={companyCategories}
              publicPlaces={publicPlaces}
              auditLogs={auditLogs}
              adminId={firebaseUser.uid}
              adminName={mozUser?.displayName || firebaseUser.email || 'Admin'}
              onInspectProfile={(profId) => navigateTo('detail', { profileId: profId })}
              onInspectCompany={(compId) => navigateTo('company_detail', { companyId: compId })}
            />
          )}

          {/* VIEW 6: MODULE 2 — COMPANIES & INSTITUTIONS DIRECTORY */}
          {activeView === 'companies_directory' && (
            <CompaniesDirectory
              companies={companies}
              categories={companyCategories}
              onSelectCompany={(comp) => navigateTo('company_detail', { companyId: comp.id })}
              onRegisterCompany={() => {
                if (!firebaseUser) {
                  handleLogin();
                } else {
                  navigateTo('company_registration', { editingCompanyId: null });
                }
              }}
              isAdmin={isAdmin}
            />
          )}

          {/* VIEW 7: MODULE 2 — COMPANY REGISTRATION / EDIT FORM */}
          {activeView === 'company_registration' && firebaseUser && (
            <CompanyRegistrationForm
              categories={companyCategories}
              currentUserId={firebaseUser.uid}
              initialCompany={editingCompany}
              initialServices={selectedCompanyServices}
              initialSchedules={selectedCompanySchedules}
              initialMedia={selectedCompanyMedia}
              initialDocuments={selectedCompanyDocuments}
              onBack={() => navigateTo('companies_directory')}
              onSaved={(savedId) => navigateTo('company_detail', { companyId: savedId })}
            />
          )}

          {/* VIEW 8: MODULE 2 — COMPANY PROFILE DETAIL */}
          {activeView === 'company_detail' && selectedCompany && (
            <CompanyProfileDetail
              company={selectedCompany}
              services={selectedCompanyServices}
              schedules={selectedCompanySchedules}
              media={selectedCompanyMedia}
              documents={selectedCompanyDocuments}
              currentUserId={firebaseUser?.uid}
              isAdmin={isAdmin}
              onBack={() => navigateTo('companies_directory')}
              onEdit={() =>
                navigateTo('company_registration', { editingCompanyId: selectedCompany.id })
              }
            />
          )}
        </main>

        {/* ================================================================= */}
        {/* SLIDE-OVER SIDEBAR DRAWER & INTERACTIVE MODALS                    */}
        {/* ================================================================= */}
        <MozfacilSidebarDrawer
          isOpen={showTopMenu}
          onClose={() => setShowTopMenu(false)}
          firebaseUserUid={firebaseUser?.uid}
          userDisplayName={firebaseUser?.displayName}
          userEmail={firebaseUser?.email}
          mozUser={mozUser}
          isAdmin={isAdmin}
          myProfilesCount={myProfiles.length}
          favoriteCount={favoriteProfileIds.length}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onNavigateUtenteRegistration={() => navigateTo('utente_registration')}
          onNavigateProfessionalRegistration={() => {
            if (!firebaseUser) {
              handleLogin();
            } else {
              navigateTo('register_edit', { editingProfileId: null });
            }
          }}
          onNavigateMyProfiles={() => navigateTo('my_profiles')}
          onNavigateAdmin={() => navigateTo('admin')}
          onOpenModal={(modal) => setActiveSidebarModal(modal)}
        />

        <MozfacilActionModals
          activeModal={activeSidebarModal}
          onClose={() => setActiveSidebarModal(null)}
          favoriteProfiles={favoriteProfiles}
          recentProfiles={recentProfiles}
          recentSearches={recentSearches}
          mozUser={mozUser}
          firebaseUserUid={firebaseUser?.uid || null}
          onSelectProfile={(prof) => handleConsultProfile(prof)}
          onToggleFavorite={handleToggleFavorite}
          onApplySearch={(q) => {
            setFilters((prev) => ({ ...prev, query: q }));
            navigateTo('directory', { moduleId: 'professionals_services' });
          }}
          onNavigateUtenteRegistration={() => navigateTo('utente_registration')}
          onNavigateProfessionalRegistration={() => {
            if (!firebaseUser) {
              handleLogin();
            } else {
              navigateTo('register_edit', { editingProfileId: null });
            }
          }}
          onNavigateCompanyRegistration={() => {
            if (!firebaseUser) {
              handleLogin();
            } else {
              navigateTo('company_registration', { editingCompanyId: null });
            }
          }}
          onActivatePackage={async (pkgId) => {
            if (!firebaseUser || !mozUser) {
              navigateTo('utente_registration');
              return;
            }
            await activateCreditPackage({
              userId: firebaseUser.uid,
              userName: mozUser.displayName || firebaseUser.displayName || 'Utente',
              packageId: pkgId,
            });
          }}
          onEmergencyDirectCall={async () => {
            if (firebaseUser && mozUser && mozUser.creditsBalance >= PRICING_CONFIG.DIRECT_CONTACT_CREDITS) {
              await performEmergencyDirectCallDebit({
                userId: firebaseUser.uid,
                userName: mozUser.displayName || firebaseUser.displayName || 'Utente',
              });
            }
            window.location.href = 'tel:+258847664935';
          }}
          onSwitchModal={(modal) => setActiveSidebarModal(modal)}
        />

        {/* ================================================================= */}
        {/* BOTTOM NAVIGATION BAR MATCHING REFERENCE PRINT                    */}
        {/* (Início, Empresas, Profissionais, Mais)                           */}
        {/* ================================================================= */}
        <nav
          aria-label="Navegação Inferior MozFácil"
          className="fixed bottom-0 inset-x-0 z-30 px-2 sm:px-4 pb-2 pt-1 pointer-events-none"
        >
          <div className="max-w-3xl mx-auto bg-gradient-to-b from-[#0A2E6E] to-[#04183D] text-white rounded-[20px] border border-[#1E4B9B]/90 shadow-[0_-4px_18px_rgba(0,0,0,0.4)] grid grid-cols-4 divide-x divide-white/15 pointer-events-auto overflow-hidden">
            {/* 1. Início */}
            <button
              type="button"
              onClick={() => navigateTo('home', { moduleId: null })}
              className={`relative py-2.5 px-1 flex flex-col items-center justify-center gap-1 text-xs font-bold transition-colors ${
                activeView === 'home'
                  ? 'text-[#F97316]'
                  : 'text-white hover:text-orange-200'
              }`}
            >
              <Home className="w-6 h-6 shrink-0 fill-current" />
              <span className="truncate">Início</span>
              {activeView === 'home' && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-1 inset-x-4 h-1 rounded-full bg-[#F97316]"
                />
              )}
            </button>

            {/* 2. Empresas */}
            <button
              type="button"
              onClick={() =>
                navigateTo('companies_directory', { moduleId: 'companies_institutions' })
              }
              className={`relative py-2.5 px-1 flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors ${
                activeView === 'companies_directory' ||
                activeView === 'company_registration' ||
                activeView === 'company_detail' ||
                (activeView === 'module_info' && selectedModuleId === 'companies_institutions')
                  ? 'text-[#F97316]'
                  : 'text-white hover:text-orange-200'
              }`}
            >
              <Building2 className="w-6 h-6 shrink-0" />
              <span className="truncate">Empresas</span>
              {(activeView === 'companies_directory' ||
                activeView === 'company_registration' ||
                activeView === 'company_detail' ||
                (activeView === 'module_info' && selectedModuleId === 'companies_institutions')) && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-1 inset-x-4 h-1 rounded-full bg-[#F97316]"
                  />
                )}
            </button>

            {/* 3. Profissionais */}
            <button
              type="button"
              onClick={() =>
                navigateTo('directory', { moduleId: 'professionals_services' })
              }
              className={`relative py-2.5 px-1 flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors ${
                activeView === 'directory' ||
                activeView === 'detail' ||
                activeView === 'my_profiles' ||
                activeView === 'register_edit'
                  ? 'text-[#F97316]'
                  : 'text-white hover:text-orange-200'
              }`}
            >
              <User className="w-6 h-6 shrink-0 fill-current" />
              <span className="truncate">Profissionais</span>
              {(activeView === 'directory' ||
                activeView === 'detail' ||
                activeView === 'my_profiles' ||
                activeView === 'register_edit') && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-1 inset-x-4 h-1 rounded-full bg-[#F97316]"
                />
              )}
            </button>

            {/* 4. Mais (Explore 12 Modules) */}
            <button
              type="button"
              onClick={() => navigateTo('explore')}
              className={`relative py-2.5 px-1 flex flex-col items-center justify-center gap-1 text-xs font-bold transition-colors ${
                activeView === 'explore'
                  ? 'text-[#F97316]'
                  : 'text-white hover:text-orange-200'
              }`}
            >
              <LayoutGrid className="w-6 h-6 shrink-0 fill-current" />
              <span className="truncate">Mais</span>
              {activeView === 'explore' && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-1 inset-x-4 h-1 rounded-full bg-[#F97316]"
                />
              )}
            </button>
          </div>
        </nav>
      </div>
    </MozErrorBoundary>
  );
}
