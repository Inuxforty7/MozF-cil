/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
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
  Menu,
} from 'lucide-react';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  AuditLog,
  AvailabilitySchedule,
  CoverageAreaType,
  MozUser,
  ProfessionalCategory,
  ProfessionalMedia,
  ProfessionalProfile,
  ProfessionalService,
  ProfileType,
  PublicationStatus,
  SearchFilters,
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
  ensureUserDocument,
  ownerSetProfilePublicationStatus,
  performDirectConsultationDebit,
  updateProfileOperationalState,
} from './services/mozfacilService';
import { normalizeCategoryName } from './utils/categoryNormalization';
import { ProfessionalRegistrationForm } from './components/ProfessionalRegistrationForm';
import { ProfessionalProfileDetail } from './components/ProfessionalProfileDetail';
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

type AppView =
  | 'home'
  | 'explore'
  | 'directory'
  | 'module_info'
  | 'utente_registration'
  | 'my_profiles'
  | 'register_edit'
  | 'detail'
  | 'admin';

interface NavigationStateSnapshot {
  view: AppView;
  moduleId?: MozfacilModuleId | null;
  profileId?: string | null;
  editingProfileId?: string | null;
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
  if (pathname === '/cadastro-utente') {
    return { view: 'utente_registration', moduleId: null, profileId: null, editingProfileId: null };
  }
  if (pathname === '/meus-perfis') {
    return { view: 'my_profiles', moduleId: null, profileId: null, editingProfileId: null };
  }
  if (pathname === '/admin') {
    return { view: 'admin', moduleId: null, profileId: null, editingProfileId: null };
  }
  const matchedModule = getModuleByRoutePath(pathname);
  if (matchedModule) {
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
        replace?: boolean;
      }
    ) => {
      const nextSnap: NavigationStateSnapshot = {
        view: nextView,
        moduleId: opts?.moduleId !== undefined ? opts.moduleId : selectedModuleId,
        profileId: opts?.profileId !== undefined ? opts.profileId : selectedProfileId,
        editingProfileId:
          opts?.editingProfileId !== undefined ? opts.editingProfileId : editingProfileId,
      };

      setActiveView(nextSnap.view);
      if (opts?.moduleId !== undefined) setSelectedModuleId(opts.moduleId);
      if (opts?.profileId !== undefined) setSelectedProfileId(opts.profileId);
      if (opts?.editingProfileId !== undefined) setEditingProfileId(opts.editingProfileId);

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
    [selectedModuleId, selectedProfileId, editingProfileId]
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
      } else {
        const fallback = resolveInitialNavigationFromUrl();
        setActiveView(fallback.view);
        setSelectedModuleId(fallback.moduleId ?? null);
        setSelectedProfileId(fallback.profileId ?? null);
        setEditingProfileId(fallback.editingProfileId ?? null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [initialNav]);

  const handleSelectExploreModule = useCallback(
    (module: MozfacilModuleDefinition) => {
      if (module.id === 'professionals_services' || module.isAvailable) {
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
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const userDoc = await ensureUserDocument(user);
          setMozUser(userDoc);
        } catch (err) {
          console.error('Error ensuring user doc:', err);
        }
      } else {
        setMozUser(null);
        setMyProfiles([]);
        setAdminAllProfiles([]);
        setAdminCategories([]);
        setAuditLogs([]);
      }
      setIsAuthReady(true);
    });
    return () => unsub();
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

    return () => {
      unsubPubProf();
      unsubCat();
      unsubPubSrv();
    };
  }, []);

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

    return () => {
      unsubUserDoc();
      unsubMyProf();
      unsubMySrv();
      unsubMySched();
      unsubMyMedia();
    };
  }, [isAuthReady, firebaseUser]);

  // 4. Administrator Listeners (Bounded Profiles, Categories, Audit Logs)
  useEffect(() => {
    if (!isAuthReady || !firebaseUser || !isAdmin) {
      setAdminAllProfiles([]);
      setAdminCategories([]);
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

    return () => {
      unsubAllProf();
      unsubAllCat();
      unsubLogs();
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
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Não foi possível iniciar sessão com Google.'
      );
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
          `Consulta de "${prof.displayName}" já desbloqueada anteriormente (sem débito duplicado). Créditos de Consulta disponíveis: ${res.remainingCredits} créditos (${res.remainingCredits} MT).`
        );
      } else {
        setConsultationNotice(
          `Consulta efetuada ("${prof.displayName}"): débito de 1 crédito (1 MT). Créditos de Consulta disponíveis: ${res.remainingCredits} créditos (${res.remainingCredits} MT).`
        );
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Não foi possível concluir o débito de 1 crédito (1 MT) para esta consulta.';
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

  return (
    <MozErrorBoundary>
      <div
        className={`min-h-screen flex flex-col pb-24 transition-colors ${
          isExploreDarkTheme
            ? 'bg-gradient-to-b from-[#02102E] via-[#062054] to-[#031438]'
            : 'bg-[#F4F7FB]'
        }`}
      >
        {/* ================================================================= */}
        {/* TOP BRAND BAR MATCHING REFERENCE PRINT (MOZFÁCIL Conexões Rápidas) */}
        {/* ================================================================= */}
        <header className="sticky top-0 z-30 pt-2 px-2.5 sm:px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-b from-[#FFFFFF] via-[#F1F5F9] to-[#CBD5E1] rounded-2xl shadow-[0_4px_14px_rgba(0,0,0,0.3)] border border-white/90 px-3 sm:px-5 py-2 flex items-center justify-between gap-2">
              {/* Left / Center: 3-Wing Swoosh + MOZFÁCIL + Conexões Rápidas */}
              <button
                type="button"
                onClick={() => navigateTo('home', { moduleId: null })}
                className="flex items-center gap-2 sm:gap-3 focus:outline-none group text-left"
              >
                {/* 3-Wing Swoosh Emblem (Orange, Navy, Orange) */}
                <svg viewBox="0 0 60 50" className="w-11 h-9 sm:w-13 sm:h-11 shrink-0" aria-hidden="true">
                  <path d="M18 14 L56 2 L44 16 L8 20 Z" fill="#EA580C" />
                  <path d="M4 28 L52 17 L41 31 L2 33 Z" fill="#07214E" />
                  <path d="M12 42 L48 32 L38 46 L6 45 Z" fill="#EA580C" />
                </svg>

                <div className="flex flex-col items-center leading-none">
                  <div className="text-[22px] sm:text-[28px] font-black italic tracking-tight flex items-center">
                    <span className="text-[#07214E]">MOZ</span>
                    <span className="text-[#D9530F]">FÁCIL</span>
                  </div>
                  <span className="text-[11px] sm:text-xs font-extrabold italic text-[#07214E] -mt-0.5">
                    Conexões Rápidas
                  </span>
                  {/* Tapered orange swoosh underline */}
                  <svg viewBox="0 0 180 10" className="w-36 sm:w-44 h-2 -mt-0.5" aria-hidden="true">
                    <path
                      d="M 2 8 Q 90 1 178 4 Q 95 4 2 8 Z"
                      fill="#EA580C"
                    />
                  </svg>
                </div>
              </button>

              {/* Right: Eye Counter + Divider + Orange Menu Button */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div
                  className="flex items-center gap-1 text-[#07214E] font-extrabold text-xs sm:text-sm tabular-nums"
                  title="Perfis publicados no diretório"
                >
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-[#D9530F] shrink-0" />
                  <span>{publishedProfiles.length}</span>
                </div>

                <div className="h-6 w-[1px] bg-slate-400/70" aria-hidden="true" />

                <button
                  type="button"
                  onClick={() => setShowTopMenu((prev) => !prev)}
                  className="p-1.5 rounded-lg hover:bg-slate-200/70 text-[#D9530F] transition-colors"
                  aria-label="Abrir menu lateral"
                  aria-expanded={showTopMenu}
                >
                  <Menu className="w-6 h-6 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Secondary Quick Navigation & Account Bar on internal module screens */}
            {!isExploreDarkTheme && (
              <div className="mt-1.5 bg-[#082456]/95 backdrop-blur-xs text-white rounded-2xl border border-blue-800/80 px-3 py-2 shadow-md flex flex-wrap items-center justify-between gap-2 text-xs">
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
                        {mozUser.creditsBalance} Créditos ({mozUser.creditsBalance} MT)
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        navigateTo('utente_registration');
                        setShowTopMenu(false);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/10 text-blue-100 font-semibold flex items-center gap-1"
                    >
                      <Coins className="w-3.5 h-3.5 text-[#F97316]" />
                      <span>1 Consulta = 1 Crédito (1 MT)</span>
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
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
              <span>{authError}</span>
              <button
                type="button"
                onClick={() => setAuthError(null)}
                className="font-bold underline ml-3"
              >
                Fechar
              </button>
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
            activeView === 'home' || activeView === 'explore'
              ? 'px-1.5 sm:px-6 py-1 sm:py-3'
              : 'px-2 sm:px-6 py-2 sm:py-4'
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
              onOpenDirectContact={() => setActiveSidebarModal('direct_contact')}
              onOpenExploreModules={() => navigateTo('explore')}
              onOpenProfessionalsDirectory={() =>
                navigateTo('directory', { moduleId: 'professionals_services' })
              }
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

          {/* VIEW 1: PUBLIC DIRECTORY & REAL-TIME SEARCH / FILTERS (MODULE 1) */}
          {activeView === 'directory' && (
            <div className="space-y-6">
              {/* Hero & Search Filter Bar */}
              <div className="bg-gradient-to-b from-[#092452] to-[#0D316E] rounded-2xl p-5 sm:p-6 text-white shadow-md space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                      MozFácil — Profissionais Independentes, Serviços e Vendedores
                    </h1>
                    <p className="text-xs sm:text-sm text-blue-200 max-w-2xl">
                      Encontre mecânicos, técnicos, enfermeiros, carpinteiros, prestadores de serviços e vendedores ambulantes verificados na sua província, distrito ou bairro.
                    </p>
                  </div>

                  {/* Quick Filter Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          availabilityStatus:
                            prev.availabilityStatus === 'available' ? 'all' : 'available',
                        }))
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
                        filters.availabilityStatus === 'available'
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-white/10 text-blue-100 hover:bg-white/20'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Disponíveis Agora (ON)</span>
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
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap shrink-0 ${
                        filters.deliveryMode === 'customer_location'
                          ? 'bg-[#F97316] text-white shadow-xs'
                          : 'bg-white/10 text-blue-100 hover:bg-white/20'
                      }`}
                    >
                      Atendimento ao Domicílio / No Local
                    </button>
                  </div>
                </div>

                {/* Primary Search & Location Bar */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                  <div className="md:col-span-5 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={filters.query}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, query: e.target.value }))
                      }
                      placeholder="Pesquisar nome, profissão, serviço, bairro (ex: Mecânico Matola)..."
                      className="w-full min-h-[44px] pl-10 pr-3 py-2 rounded-xl bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <select
                      value={filters.categoryId}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, categoryId: e.target.value }))
                      }
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                    >
                      <option value="">Todas as Profissões ({approvedPublicProfessions.length})</option>
                      {approvedPublicProfessions.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.originalName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
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
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                    >
                      <option value="">Toda Moçambique</option>
                      {provinces.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAdvancedFilters((prev) => !prev)}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Filter className="w-4 h-4" />
                      <span>Mais Filtros</span>
                    </button>
                  </div>
                </div>

                {/* Expandable Multi-Filter Row */}
                {showAdvancedFilters && (
                  <div className="pt-3 border-t border-white/15 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-slate-900">
                    <div>
                      <label className="block text-[11px] font-semibold text-blue-200 mb-1">
                        Distrito
                      </label>
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
                        className="w-full min-h-[40px] px-2.5 py-1.5 rounded-lg bg-white text-xs disabled:opacity-60"
                      >
                        <option value="">
                          {filters.province ? 'Todos os Distritos' : 'Selecione a Província'}
                        </option>
                        {filterDistricts.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-blue-200 mb-1">
                        Bairro
                      </label>
                      <select
                        value={filters.neighborhood}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, neighborhood: e.target.value }))
                        }
                        disabled={!filters.district}
                        className="w-full min-h-[40px] px-2.5 py-1.5 rounded-lg bg-white text-xs disabled:opacity-60"
                      >
                        <option value="">
                          {filters.district ? 'Todos os Bairros' : 'Selecione o Distrito'}
                        </option>
                        {filterNeighborhoods.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-blue-200 mb-1">
                        Especialidade
                      </label>
                      <select
                        value={filters.specialtyId}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, specialtyId: e.target.value }))
                        }
                        className="w-full min-h-[40px] px-2.5 py-1.5 rounded-lg bg-white text-xs"
                      >
                        <option value="">Todas as Especialidades</option>
                        {approvedPublicSpecialties.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.originalName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-blue-200 mb-1">
                        Tipo de Prestador
                      </label>
                      <select
                        value={filters.profileType}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            profileType: e.target.value as ProfileType | 'all',
                          }))
                        }
                        className="w-full min-h-[40px] px-2.5 py-1.5 rounded-lg bg-white text-xs"
                      >
                        <option value="all">Todos os Tipos</option>
                        <option value="independent">Profissional Independente</option>
                        <option value="service_provider">Prestador de Serviços</option>
                        <option value="street_vendor">Vendedor Ambulante / Móvel</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-blue-200 mb-1">
                        Área de Cobertura
                      </label>
                      <select
                        value={filters.coverageAreaType}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            coverageAreaType: e.target.value as CoverageAreaType | 'all',
                          }))
                        }
                        className="w-full min-h-[40px] px-2.5 py-1.5 rounded-lg bg-white text-xs"
                      >
                        <option value="all">Qualquer Cobertura</option>
                        <option value="neighborhood">Bairro</option>
                        <option value="district">Distrito</option>
                        <option value="province">Província</option>
                        <option value="selected_locations">Zonas Selecionadas</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Filter Summary & Count Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs sm:text-sm font-bold text-[#0D316E] tabular-nums">
                  {isLoadingData
                    ? 'A pesquisar perfis publicados...'
                    : `${filteredPublishedProfiles.length} ${
                        filteredPublishedProfiles.length === 1
                          ? 'profissional publicado encontrado'
                          : 'profissionais publicados encontrados'
                      }`}
                </div>

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
                    className="text-xs font-bold text-[#F97316] hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Limpar todos os filtros</span>
                  </button>
                )}
              </div>

              {/* INTERFACE STATE 1: REQUEST FAILED */}
              {requestError && (
                <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-center space-y-3">
                  <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
                  <h3 className="text-sm font-extrabold text-red-900">
                    Falha ao carregar dados da base de dados
                  </h3>
                  <p className="text-xs text-red-700">{requestError}</p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
                  >
                    Tentar Novamente
                  </button>
                </div>
              )}

              {/* INTERFACE STATE 2: LOADING */}
              {isLoadingData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-slate-200" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-slate-200 rounded w-3/4" />
                          <div className="h-3 bg-slate-200 rounded w-1/2" />
                        </div>
                      </div>
                      <div className="h-12 bg-slate-100 rounded-xl" />
                      <div className="h-9 bg-slate-200 rounded-xl" />
                    </div>
                  ))}
                </div>
              )}

              {/* INTERFACE STATE 3: RESULTS FOUND */}
              {!isLoadingData && filteredPublishedProfiles.length > 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredPublishedProfiles.slice(0, visibleCount).map((prof) => {
                      const profServices = servicesByProfileId[prof.id] || [];
                      const cleanWa = (prof.whatsapp || prof.phone).replace(/\D/g, '');
                      const cleanTel = prof.phone.replace(/[^\d+]/g, '');

                      return (
                        <article
                          key={prof.id}
                          className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
                        >
                          <div className="p-5 space-y-3.5">
                            {/* Card Top: Avatar + Name + Category + Availability */}
                            <div className="flex items-start gap-3.5">
                              <button
                                type="button"
                                onClick={() => handleConsultProfile(prof)}
                                className="w-16 h-16 rounded-full border-2 border-[#0D316E] bg-blue-50 flex items-center justify-center overflow-hidden shrink-0"
                              >
                                {prof.photoUrl ? (
                                  <img
                                    src={prof.photoUrl}
                                    alt={prof.displayName}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Briefcase className="w-7 h-7 text-[#0D316E]" />
                                )}
                              </button>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleConsultProfile(prof)}
                                    className="text-left font-extrabold text-base text-[#0D316E] hover:text-[#F97316] transition-colors line-clamp-2"
                                  >
                                    {prof.displayName}
                                  </button>

                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold shrink-0 ${
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

                                <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-1.5">
                                  <span className="font-bold text-emerald-800">
                                    {prof.primaryCategoryName}
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span>
                                    {prof.profileType === 'independent'
                                      ? 'Independente'
                                      : prof.profileType === 'service_provider'
                                      ? 'Prestador'
                                      : 'Ambulante'}
                                  </span>
                                  {prof.phoneVerified && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span className="text-emerald-700 font-semibold">
                                        Verificado
                                      </span>
                                    </>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 text-xs font-semibold text-[#0D316E] mt-1">
                                  <MapPin className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
                                  <span className="truncate">
                                    {prof.neighborhood}, {prof.district} ({prof.province})
                                  </span>
                                </div>
                              </div>
                            </div>

                            {prof.description && (
                              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                {prof.description}
                              </p>
                            )}

                            {/* Individual Services Preview */}
                            {profServices.length > 0 && (
                              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                                <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                                  <Wrench className="w-3 h-3 text-[#0D316E]" />
                                  <span>Serviços Registados ({profServices.length}):</span>
                                </div>
                                {profServices.slice(0, 2).map((srv) => (
                                  <div
                                    key={srv.id}
                                    className="flex items-center justify-between text-xs bg-slate-50 px-2.5 py-1.5 rounded-lg"
                                  >
                                    <span className="font-semibold text-slate-800 truncate pr-2">
                                      {srv.serviceName}
                                    </span>
                                    <span className="font-mono font-bold text-[#0D316E] shrink-0">
                                      {srv.hasFixedPrice && srv.price > 0
                                        ? `${srv.price.toLocaleString('pt-MZ')} MT`
                                        : 'Sob consulta'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{prof.workingDaysSummary}</span>
                            </div>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="p-3 bg-slate-50 border-t border-slate-200 grid grid-cols-3 gap-2">
                            <a
                              href={`https://wa.me/${cleanWa}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="min-h-[38px] rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Chat</span>
                            </a>

                            <a
                              href={`tel:${cleanTel}`}
                              className="min-h-[38px] rounded-lg bg-[#0D316E] hover:bg-[#092452] text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Ligar</span>
                            </a>

                            <button
                              type="button"
                              onClick={() => handleConsultProfile(prof)}
                              className="min-h-[38px] rounded-lg bg-white border border-[#0D316E] hover:bg-blue-50 text-[#0D316E] text-xs font-bold flex items-center justify-center transition-colors"
                            >
                              Ver Perfil
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {/* Incremental Pagination Button */}
                  {filteredPublishedProfiles.length > visibleCount && (
                    <div className="text-center pt-4">
                      <button
                        type="button"
                        onClick={() => setVisibleCount((prev) => prev + 12)}
                        className="px-6 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-[#0D316E] font-bold text-xs shadow-xs"
                      >
                        Carregar mais profissionais (
                        {filteredPublishedProfiles.length - visibleCount} restantes)
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* INTERFACE STATE 4: NO RESULTS */}
              {!isLoadingData && filteredPublishedProfiles.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-xl mx-auto space-y-4 shadow-xs">
                  <Briefcase className="w-10 h-10 text-[#0D316E] mx-auto" />
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-[#0D316E]">
                      {publishedProfiles.length === 0
                        ? 'Ainda Não Existem Perfis Publicados no Diretório'
                        : 'Nenhum profissional corresponde aos filtros selecionados'}
                    </h3>
                    <p className="text-xs text-slate-600">
                      {publishedProfiles.length === 0
                        ? 'Registe o primeiro perfil profissional ou serviço para iniciar o catálogo público no MozFácil.'
                        : 'Tente ajustar a pesquisa, mudar de distrito ou limpar os filtros ativos.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
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
                        className="min-h-[42px] px-4 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Criar Perfil Profissional</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="px-4 py-2 rounded-xl bg-[#0D316E] text-white text-xs font-bold"
                      >
                        Limpar Filtros de Pesquisa
                      </button>
                    )}
                  </div>
                </div>
              )}
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

              {/* Status Filter Tabs for My Profiles */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl w-fit">
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                      myProfilesFilter === st.id
                        ? 'bg-[#0D316E] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
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
              auditLogs={auditLogs}
              adminId={firebaseUser.uid}
              adminName={mozUser?.displayName || firebaseUser.email || 'Admin'}
              onInspectProfile={(profId) => navigateTo('detail', { profileId: profId })}
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
                navigateTo('module_info', { moduleId: 'companies_institutions' })
              }
              className={`relative py-2.5 px-1 flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors ${
                activeView === 'module_info' &&
                selectedModuleId === 'companies_institutions'
                  ? 'text-[#F97316]'
                  : 'text-white hover:text-orange-200'
              }`}
            >
              <Building2 className="w-6 h-6 shrink-0" />
              <span className="truncate">Empresas</span>
              {activeView === 'module_info' &&
                selectedModuleId === 'companies_institutions' && (
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
