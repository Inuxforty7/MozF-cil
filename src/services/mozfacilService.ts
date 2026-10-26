import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  runTransaction,
  writeBatch,
  serverTimestamp,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
  validateMozambiquePhone,
} from '../firebase';
import {
  AuditOperation,
  AvailabilityStatus,
  CategoryReviewStatus,
  CategoryType,
  CompanyCategory,
  CompanyDocType,
  CompanyDocument,
  CompanyEntityType,
  CompanyMedia,
  CompanyProfile,
  CompanySchedule,
  CompanyService,
  CompanyVerificationStatus,
  CoverageAreaType,
  DeliveryMode,
  MediaFileType,
  MozUser,
  OperationalState,
  ProfessionalCategory,
  ProfessionalProfile,
  ProfileType,
  PublicationStatus,
  ServiceDeliveryMethod,
  VALIDATION_LIMITS,
} from '../types/mozfacil';
import {
  buildDeterministicCategoryId,
  formatCategoryDisplayName,
  normalizeCategoryName,
} from '../utils/categoryNormalization';

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, VALIDATION_LIMITS.ID_MAX);
  return cleaned || 'unknown_target';
}

function clampStr(val: string | undefined | null, max: number, minFallback = ''): string {
  const str = (val ?? '').trim();
  if (!str && minFallback) return minFallback.slice(0, max);
  return str.slice(0, max);
}

export async function recordAuditLog(params: {
  actorId: string;
  actorName: string;
  operation: AuditOperation;
  targetCollection: string;
  targetRecordId: string;
  details: string;
}): Promise<void> {
  const logId = sanitizeId(`log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const path = `audit_logs/${logId}`;
  try {
    await setDoc(doc(db, 'audit_logs', logId), {
      id: logId,
      actorId: sanitizeId(params.actorId),
      actorName: clampStr(params.actorName, VALIDATION_LIMITS.DISPLAY_NAME_MAX, 'Utilizador'),
      operation: params.operation,
      targetCollection: clampStr(params.targetCollection, 80, 'system'),
      targetRecordId: sanitizeId(params.targetRecordId),
      details: clampStr(params.details, VALIDATION_LIMITS.AUDIT_DETAILS_MAX, 'Operação registada'),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Ensures `/users/{uid}` exists using an atomic transaction.
 * - Never resets or overwrites an existing user's `creditsBalance`, `consultationsCount`, or `createdAt`.
 * - Only promotes `role: 'admin'` when the authenticated token has a verified bootstrap admin email.
 */
export async function ensureUserDocument(firebaseUser: FirebaseUser): Promise<MozUser> {
  const uid = sanitizeId(firebaseUser.uid);
  const userPath = `users/${uid}`;
  const isBootstrappedAdmin =
    firebaseUser.email?.toLowerCase() === 'inuxforty@gmail.com' &&
    firebaseUser.emailVerified === true;

  try {
    if (isBootstrappedAdmin) {
      try {
        const adminRef = doc(db, 'admins', uid);
        const adminSnap = await getDoc(adminRef);
        if (!adminSnap.exists()) {
          await setDoc(adminRef, {
            id: uid,
            email: clampStr(firebaseUser.email, VALIDATION_LIMITS.EMAIL_MAX, 'admin@mozfacil.mz'),
            createdAt: serverTimestamp(),
          });
        }
      } catch (adminErr) {
        console.warn('Não foi possível verificar a coleção /admins de imediato (rede offline ou pendente):', adminErr);
      }
    }

    const userRef = doc(db, 'users', uid);

    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(userRef);
        if (snap.exists()) {
          const raw = snap.data() as Partial<MozUser>;
          if (isBootstrappedAdmin && raw.role !== 'admin') {
            tx.update(userRef, {
              role: 'admin',
              updatedAt: serverTimestamp(),
            });
          }
          return;
        }

        const newUser = {
          id: uid,
          displayName: clampStr(
            firebaseUser.displayName || firebaseUser.email?.split('@')[0],
            VALIDATION_LIMITS.DISPLAY_NAME_MAX,
            'Utente MozFácil'
          ),
          email: clampStr(firebaseUser.email, VALIDATION_LIMITS.EMAIL_MAX, ''),
          phone: clampStr(firebaseUser.phoneNumber, VALIDATION_LIMITS.PHONE_MAX, ''),
          whatsapp: clampStr(firebaseUser.phoneNumber, VALIDATION_LIMITS.PHONE_MAX, ''),
          province: '',
          district: '',
          neighborhood: '',
          termsAccepted: false,
          creditsBalance: VALIDATION_LIMITS.INITIAL_PACKAGE_CREDITS,
          consultationsCount: 0,
          role: isBootstrappedAdmin ? ('admin' as const) : ('visitor' as const),
          phoneVerified: Boolean(firebaseUser.phoneNumber),
          emailVerified: Boolean(firebaseUser.emailVerified),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        tx.set(userRef, newUser);
      });

      const finalSnap = await getDoc(userRef);
      if (finalSnap.exists()) {
        return finalSnap.data() as MozUser;
      }
    } catch (txErr) {
      console.warn('Transação de utilizador adiada por conectividade offline; a recuperar registo local ou fallback:', txErr);
      try {
        const cachedSnap = await getDoc(userRef);
        if (cachedSnap.exists()) {
          return cachedSnap.data() as MozUser;
        }
      } catch {
        // Fallback em memória abaixo
      }
    }

    return {
      id: uid,
      displayName: clampStr(
        firebaseUser.displayName || firebaseUser.email?.split('@')[0],
        VALIDATION_LIMITS.DISPLAY_NAME_MAX,
        'Utente MozFácil'
      ),
      email: clampStr(firebaseUser.email, VALIDATION_LIMITS.EMAIL_MAX, ''),
      phone: clampStr(firebaseUser.phoneNumber, VALIDATION_LIMITS.PHONE_MAX, ''),
      whatsapp: clampStr(firebaseUser.phoneNumber, VALIDATION_LIMITS.PHONE_MAX, ''),
      province: '',
      district: '',
      neighborhood: '',
      termsAccepted: false,
      creditsBalance: VALIDATION_LIMITS.INITIAL_PACKAGE_CREDITS,
      consultationsCount: 0,
      role: isBootstrappedAdmin ? ('admin' as const) : ('visitor' as const),
      phoneVerified: Boolean(firebaseUser.phoneNumber),
      emailVerified: Boolean(firebaseUser.emailVerified),
      createdAt: null as unknown as Timestamp,
      updatedAt: null as unknown as Timestamp,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export interface SaveUtentePayload {
  userId: string;
  displayName: string;
  whatsapp: string;
  province: string;
  district: string;
  neighborhood: string;
  termsAccepted: boolean;
  phoneVerifiedByAuth: boolean;
}

/**
 * Persists the "Cadastro do Utente" form in /users/{userId}.
 * Enforces mandatory acceptance of the 1 Crédito = 1 MT consultation rule,
 * never alters an existing user's creditsBalance, and only marks phoneVerified = true
 * if the Firebase Auth token actually contains a verified phoneNumber (or was already verified).
 */
export async function saveUtenteRegistration(payload: SaveUtentePayload): Promise<MozUser> {
  const uid = sanitizeId(payload.userId);
  const userPath = `users/${uid}`;

  if (!payload.displayName || payload.displayName.trim().length < 2) {
    throw new Error('Por favor, introduza o seu Nome Completo (mínimo 2 caracteres).');
  }
  const cleanDigits = payload.whatsapp.replace(/\D/g, '');
  if (cleanDigits.length < 9) {
    throw new Error('Por favor, introduza um número de WhatsApp válido (+258 XX XXX XXXX).');
  }
  if (!payload.termsAccepted) {
    throw new Error(
      'É obrigatório aceitar os termos e condições (débito de 1 crédito = 1 MT por consulta efetuada).'
    );
  }

  const formattedWhatsapp = payload.whatsapp.trim().startsWith('+')
    ? payload.whatsapp.trim()
    : `+258 ${payload.whatsapp.trim()}`;

  const hasTokenVerifiedPhone = Boolean(auth.currentUser?.phoneNumber);
  const hasTokenVerifiedEmail = Boolean(auth.currentUser?.emailVerified);

  if (hasTokenVerifiedPhone && auth.currentUser) {
    try {
      await auth.currentUser.getIdToken(true);
    } catch {
      // Ignore offline token refresh warnings
    }
  }

  try {
    const userRef = doc(db, 'users', uid);

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists()) {
        tx.set(userRef, {
          id: uid,
          displayName: clampStr(payload.displayName, VALIDATION_LIMITS.DISPLAY_NAME_MAX, 'Utente'),
          email: clampStr(auth.currentUser?.email, VALIDATION_LIMITS.EMAIL_MAX, ''),
          phone: clampStr(formattedWhatsapp, VALIDATION_LIMITS.PHONE_MAX, ''),
          whatsapp: clampStr(formattedWhatsapp, VALIDATION_LIMITS.PHONE_MAX, ''),
          province: clampStr(payload.province, VALIDATION_LIMITS.PROVINCE_MAX, ''),
          district: clampStr(payload.district, VALIDATION_LIMITS.DISTRICT_MAX, ''),
          neighborhood: clampStr(payload.neighborhood, VALIDATION_LIMITS.NEIGHBORHOOD_MAX, ''),
          termsAccepted: true,
          creditsBalance: VALIDATION_LIMITS.INITIAL_PACKAGE_CREDITS,
          consultationsCount: 0,
          role: 'visitor',
          phoneVerified: hasTokenVerifiedPhone,
          emailVerified: hasTokenVerifiedEmail,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return;
      }

      const existing = snap.data() as MozUser;
      tx.update(userRef, {
        displayName: clampStr(payload.displayName, VALIDATION_LIMITS.DISPLAY_NAME_MAX, 'Utente'),
        phone: clampStr(formattedWhatsapp, VALIDATION_LIMITS.PHONE_MAX, existing.phone || ''),
        whatsapp: clampStr(formattedWhatsapp, VALIDATION_LIMITS.PHONE_MAX, ''),
        province: clampStr(payload.province, VALIDATION_LIMITS.PROVINCE_MAX, ''),
        district: clampStr(payload.district, VALIDATION_LIMITS.DISTRICT_MAX, ''),
        neighborhood: clampStr(payload.neighborhood, VALIDATION_LIMITS.NEIGHBORHOOD_MAX, ''),
        termsAccepted: true,
        phoneVerified: Boolean(existing.phoneVerified || hasTokenVerifiedPhone),
        updatedAt: serverTimestamp(),
      });
    });

    await recordAuditLog({
      actorId: uid,
      actorName: payload.displayName,
      operation: 'utente_registered',
      targetCollection: 'users',
      targetRecordId: uid,
      details: `Cadastro do Utente guardado (${formattedWhatsapp}${
        payload.province ? ` · ${payload.province}` : ''
      }${payload.district ? ` / ${payload.district}` : ''}${
        payload.neighborhood ? ` / ${payload.neighborhood}` : ''
      }). Termos de 1 crédito (1 MT) por consulta aceites.`,
    });

    const updatedSnap = await getDoc(userRef);
    return updatedSnap.data() as MozUser;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

/**
 * Executes an atomic, idempotent direct consultation debit:
 * - Checks `/user_consultations/${userId}_${targetProfileId}` inside the transaction.
 *   If the user has already consulted this profile, returns `alreadyConsulted: true` without charging again.
 * - Verifies that the target profile exists and is `published`.
 * - Verifies that the Utente has accepted terms (`termsAccepted === true`) and has `creditsBalance >= 1`.
 * - Atomically creates the `/user_consultations/${consultationId}` receipt, decrements `creditsBalance` by 1,
 *   increments `consultationsCount` by 1, and writes the immutable `audit_logs` entry.
 */
export async function performDirectConsultationDebit(params: {
  userId: string;
  userName: string;
  targetProfileId: string;
  targetProfileName: string;
}): Promise<{
  remainingCredits: number;
  consultationsCount: number;
  alreadyConsulted: boolean;
}> {
  const uid = sanitizeId(params.userId);
  const targetId = sanitizeId(params.targetProfileId);
  const consultationId = sanitizeId(`${uid}_${targetId}`);
  const userPath = `users/${uid}`;

  try {
    const result = await runTransaction(db, async (tx) => {
      const userRef = doc(db, 'users', uid);
      const profileRef = doc(db, 'professional_profiles', targetId);
      const consultationRef = doc(db, 'user_consultations', consultationId);

      const [userSnap, profileSnap, consultationSnap] = await Promise.all([
        tx.get(userRef),
        tx.get(profileRef),
        tx.get(consultationRef),
      ]);

      if (!userSnap.exists()) {
        throw new Error('Registo de utente não encontrado. Conclua o Cadastro do Utente.');
      }

      if (!profileSnap.exists()) {
        throw new Error('O perfil profissional selecionado não existe.');
      }

      const profileData = profileSnap.data() as ProfessionalProfile;
      if (profileData.publicationStatus !== 'published') {
        throw new Error('Apenas perfis publicados podem ser consultados publicamente.');
      }

      const userData = userSnap.data() as MozUser;
      const currentBalance =
        typeof userData.creditsBalance === 'number' ? userData.creditsBalance : 0;
      const currentTotal =
        typeof userData.consultationsCount === 'number' ? userData.consultationsCount : 0;

      // Idempotency guarantee: never charge twice for the same user + profile consultation
      if (consultationSnap.exists()) {
        return {
          remainingCredits: currentBalance,
          consultationsCount: currentTotal,
          alreadyConsulted: true,
        };
      }

      if (!userData.termsAccepted) {
        throw new Error(
          'Para efetuar consultas diretas na plataforma, deve aceitar os Termos e Condições (1 crédito = 1 MT por consulta) no Cadastro do Utente.'
        );
      }

      if (currentBalance < VALIDATION_LIMITS.CREDITS_PER_CONSULTATION) {
        throw new Error(
          'Saldo de créditos insuficiente (0 créditos / 0 MT). Atualize o seu pacote para continuar a efetuar consultas.'
        );
      }

      const nextBalance = currentBalance - VALIDATION_LIMITS.CREDITS_PER_CONSULTATION;
      const nextTotal = currentTotal + 1;

      tx.set(consultationRef, {
        id: consultationId,
        userId: uid,
        targetProfileId: targetId,
        targetProfileName: clampStr(
          params.targetProfileName || profileData.displayName,
          VALIDATION_LIMITS.DISPLAY_NAME_MAX,
          'Profissional'
        ),
        creditsDebited: VALIDATION_LIMITS.CREDITS_PER_CONSULTATION,
        amountMzn: VALIDATION_LIMITS.CREDITS_PER_CONSULTATION,
        createdAt: serverTimestamp(),
      });

      tx.update(userRef, {
        creditsBalance: nextBalance,
        consultationsCount: nextTotal,
        updatedAt: serverTimestamp(),
      });

      const logId = sanitizeId(`log_cons_${consultationId}_${Date.now()}`);
      tx.set(doc(db, 'audit_logs', logId), {
        id: logId,
        actorId: uid,
        actorName: clampStr(params.userName || userData.displayName, VALIDATION_LIMITS.DISPLAY_NAME_MAX, 'Utente MozFácil'),
        operation: 'consultation_debit',
        targetCollection: 'user_consultations',
        targetRecordId: consultationId,
        details: clampStr(
          `Consulta direta de "${profileData.displayName}" (${targetId}): débito de 1 crédito (1 MT). Saldo restante: ${nextBalance} créditos (${nextBalance} MT).`,
          VALIDATION_LIMITS.AUDIT_DETAILS_MAX,
          'Consulta debitada'
        ),
        createdAt: serverTimestamp(),
      });

      return {
        remainingCredits: nextBalance,
        consultationsCount: nextTotal,
        alreadyConsulted: false,
      };
    });

    return result;
  } catch (error) {
    if (error instanceof Error && !error.message.includes('permission-denied')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

/**
 * Dynamically selects an existing category or proposes a new one atomically
 * using a Firestore transaction and deterministic normalized ID.
 */
export async function proposeOrSelectCategory(params: {
  rawName: string;
  categoryType: CategoryType;
  parentCategoryId?: string;
  actorId: string;
  actorName: string;
  isAdmin: boolean;
  activityField1Label?: string;
  activityField1Placeholder?: string;
  activityField1Required?: boolean;
  activityField2Label?: string;
  activityField2Placeholder?: string;
  activityField2Required?: boolean;
}): Promise<ProfessionalCategory> {
  const displayName = formatCategoryDisplayName(params.rawName);
  const normalized = normalizeCategoryName(params.rawName);
  if (normalized.length < 2) {
    throw new Error('O nome da categoria deve ter pelo menos 2 caracteres válidos.');
  }

  const categoryId = buildDeterministicCategoryId(params.rawName, params.categoryType);
  const categoryRef = doc(db, 'professional_categories', categoryId);
  const path = `professional_categories/${categoryId}`;

  try {
    let createdNew = false;
    const resultCategory = await runTransaction(db, async (tx) => {
      const existingSnap = await tx.get(categoryRef);
      if (existingSnap.exists()) {
        const existingData = existingSnap.data() as ProfessionalCategory;
        if (existingData.reviewStatus === 'rejected' && !params.isAdmin) {
          throw new Error(
            `A categoria "${existingData.originalName}" foi rejeitada pela administração e não pode ser utilizada.`
          );
        }
        if (existingData.reviewStatus === 'merged' && existingData.canonicalCategoryId) {
          const canonicalRef = doc(
            db,
            'professional_categories',
            existingData.canonicalCategoryId
          );
          const canonicalSnap = await tx.get(canonicalRef);
          if (canonicalSnap.exists()) {
            const canonicalData = canonicalSnap.data() as ProfessionalCategory;
            if (canonicalData.reviewStatus === 'rejected' && !params.isAdmin) {
              throw new Error(
                `A categoria canónica "${canonicalData.originalName}" não está disponível para utilização.`
              );
            }
            return canonicalData;
          }
        }
        return existingData;
      }

      createdNew = true;
      const reviewStatus: CategoryReviewStatus = params.isAdmin ? 'approved' : 'pending';
      const newCategoryDoc = {
        id: categoryId,
        originalName: clampStr(displayName, VALIDATION_LIMITS.CATEGORY_NAME_MAX, 'Profissão'),
        normalizedName: clampStr(normalized, VALIDATION_LIMITS.CATEGORY_NAME_MAX, 'profissao'),
        categoryType: params.categoryType,
        parentCategoryId: params.parentCategoryId
          ? sanitizeId(params.parentCategoryId)
          : '',
        reviewStatus,
        creatorId: sanitizeId(params.actorId),
        reviewerId: params.isAdmin ? sanitizeId(params.actorId) : '',
        canonicalCategoryId: '',
        activityField1Label: clampStr(
          params.activityField1Label,
          VALIDATION_LIMITS.ACTIVITY_LABEL_MAX,
          ''
        ),
        activityField1Placeholder: clampStr(
          params.activityField1Placeholder,
          VALIDATION_LIMITS.ACTIVITY_PLACEHOLDER_MAX,
          ''
        ),
        activityField1Required: Boolean(params.activityField1Required),
        activityField2Label: clampStr(
          params.activityField2Label,
          VALIDATION_LIMITS.ACTIVITY_LABEL_MAX,
          ''
        ),
        activityField2Placeholder: clampStr(
          params.activityField2Placeholder,
          VALIDATION_LIMITS.ACTIVITY_PLACEHOLDER_MAX,
          ''
        ),
        activityField2Required: Boolean(params.activityField2Required),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      tx.set(categoryRef, newCategoryDoc);
      return {
        ...newCategoryDoc,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      } as ProfessionalCategory;
    });

    if (createdNew) {
      await recordAuditLog({
        actorId: params.actorId,
        actorName: params.actorName,
        operation: 'category_created',
        targetCollection: 'professional_categories',
        targetRecordId: categoryId,
        details: `Categoria dinâmica "${displayName}" (${params.categoryType}) criada com estado "${
          params.isAdmin ? 'approved' : 'pending'
        }".`,
      });
    }

    return resultCategory;
  } catch (error) {
    if (error instanceof Error && !error.message.includes('permission-denied')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export interface ServiceInputItem {
  id?: string;
  serviceName: string;
  description: string;
  conditions: string;
  price: number;
  hasFixedPrice: boolean;
  deliveryMethod: ServiceDeliveryMethod;
  availabilityStatus: AvailabilityStatus;
}

export interface ScheduleInputItem {
  dayOfWeek: number;
  dayLabel: string;
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
  notes: string;
}

export interface MediaInputItem {
  id?: string;
  fileType: MediaFileType;
  caption: string;
  storageRef: string;
}

export interface SaveProfilePayload {
  profileId?: string;
  ownerId: string;
  actorName: string;
  profileType: ProfileType;
  displayName: string;
  responsibleName: string;
  responsibleRole: string;
  nuit: string;
  photoUrl: string;
  primaryCategoryId: string;
  primaryCategoryName: string;
  specialties: { id: string; name: string }[];
  experienceYears: number;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  authorizedPublication: boolean;
  province: string;
  district: string;
  locality: string;
  neighborhood: string;
  streetOrReference: string;
  nearestStop: string;
  hasGps: boolean;
  latitude: number;
  longitude: number;
  coverageAreaType: CoverageAreaType;
  coverageLocations: string;
  deliveryMode: DeliveryMode;
  availabilityStatus: AvailabilityStatus;
  operationalState: OperationalState;
  workingDaysSummary: string;
  openingTime: string;
  closingTime: string;
  activityField1Label: string;
  activityField1Value: string;
  activityField2Label: string;
  activityField2Value: string;
  publicationStatus: PublicationStatus;
  rejectionReason?: string;
  services: ServiceInputItem[];
  schedules: ScheduleInputItem[];
  mediaItems: MediaInputItem[];
}

/**
 * Atomically saves a professional profile and synchronizes all child collections
 * (`professional_specialties`, `professional_services`, `availability_schedules`, `professional_media`, and `audit_logs`)
 * using a single Firestore `writeBatch` (bounded < 60 operations, well within the 500-op Firestore batch limit).
 */
export async function saveProfessionalProfileComplete(
  payload: SaveProfilePayload
): Promise<string> {
  const profileId = payload.profileId
    ? sanitizeId(payload.profileId)
    : sanitizeId(`prof_${payload.ownerId.slice(0, 20)}_${Date.now()}`);
  const profilePath = `professional_profiles/${profileId}`;

  const boundedSpecialties = payload.specialties
    .filter((s) => s.id && s.name)
    .slice(0, VALIDATION_LIMITS.SPECIALTIES_MAX_COUNT);
  const specialtyIds = boundedSpecialties.map((s) => sanitizeId(s.id));
  const specialtyNames = boundedSpecialties.map((s) =>
    clampStr(s.name, VALIDATION_LIMITS.CATEGORY_NAME_MAX, '')
  );

  const boundedServices = payload.services
    .filter((s) => s.serviceName && s.serviceName.trim().length >= 2)
    .slice(0, 25);

  const boundedSchedules = payload.schedules.slice(0, 7);
  const boundedMedia = payload.mediaItems.filter((m) => m.storageRef).slice(0, 15);

  const safeExp = Math.max(
    0,
    Math.min(VALIDATION_LIMITS.EXPERIENCE_MAX, Number(payload.experienceYears) || 0)
  );
  const safeLat = payload.hasGps
    ? Math.max(-90, Math.min(90, Number(payload.latitude) || 0))
    : 0;
  const safeLng = payload.hasGps
    ? Math.max(-180, Math.min(180, Number(payload.longitude) || 0))
    : 0;

  try {
    const profileRef = doc(db, 'professional_profiles', profileId);

    const [
      existingSnap,
      existingSpecSnap,
      existingSrvSnap,
      existingSchedSnap,
      existingMediaSnap,
      primaryCatSnap,
    ] = await Promise.all([
      getDoc(profileRef),
      getDocs(
        query(
          collection(db, 'professional_specialties'),
          where('profileId', '==', profileId),
          where('ownerId', '==', payload.ownerId)
        )
      ),
      getDocs(
        query(
          collection(db, 'professional_services'),
          where('profileId', '==', profileId),
          where('ownerId', '==', payload.ownerId)
        )
      ),
      getDocs(
        query(
          collection(db, 'availability_schedules'),
          where('profileId', '==', profileId),
          where('ownerId', '==', payload.ownerId)
        )
      ),
      getDocs(
        query(
          collection(db, 'professional_media'),
          where('profileId', '==', profileId),
          where('ownerId', '==', payload.ownerId)
        )
      ),
      payload.primaryCategoryId
        ? getDoc(doc(db, 'professional_categories', sanitizeId(payload.primaryCategoryId)))
        : Promise.resolve(null),
    ]);

    let resolvedPrimaryCategoryId = payload.primaryCategoryId
      ? sanitizeId(payload.primaryCategoryId)
      : '';
    let resolvedPrimaryCategoryName = clampStr(
      payload.primaryCategoryName,
      VALIDATION_LIMITS.CATEGORY_NAME_MAX,
      ''
    );
    let effectivePublicationStatus: PublicationStatus = payload.publicationStatus;

    if (primaryCatSnap && primaryCatSnap.exists()) {
      let catData = primaryCatSnap.data() as ProfessionalCategory;
      if (catData.reviewStatus === 'merged' && catData.canonicalCategoryId) {
        const canonicalSnap = await getDoc(
          doc(db, 'professional_categories', catData.canonicalCategoryId)
        );
        if (canonicalSnap.exists()) {
          catData = canonicalSnap.data() as ProfessionalCategory;
          resolvedPrimaryCategoryId = catData.id;
          resolvedPrimaryCategoryName = clampStr(
            catData.originalName,
            VALIDATION_LIMITS.CATEGORY_NAME_MAX,
            resolvedPrimaryCategoryName
          );
        }
      }
      if (
        (effectivePublicationStatus === 'published' ||
          effectivePublicationStatus === 'pending_review') &&
        catData.reviewStatus === 'rejected'
      ) {
        throw new Error(
          `A categoria "${catData.originalName}" foi rejeitada pela administração e não pode ser utilizada para publicação.`
        );
      }
      // Enforce business rule: a pending category cannot bypass publication requirements to make a profile directly 'published'
      if (effectivePublicationStatus === 'published' && catData.reviewStatus !== 'approved') {
        effectivePublicationStatus = 'pending_review';
      }
    } else if (effectivePublicationStatus === 'published') {
      effectivePublicationStatus = 'pending_review';
    }

    const isUpdate = existingSnap.exists();
    const existingData = isUpdate ? (existingSnap.data() as ProfessionalProfile) : null;

    // Preserve phoneVerified if already verified by Admin (and phone was not changed) OR verified via Firebase Phone Auth
    const phoneValidation = validateMozambiquePhone(payload.phone);
    const authPhone = auth.currentUser?.phoneNumber || '';
    const hasFirebaseVerifiedPhone = Boolean(
      authPhone &&
        (authPhone === payload.phone.trim() ||
          (phoneValidation.valid && authPhone === phoneValidation.e164))
    );

    if (hasFirebaseVerifiedPhone && auth.currentUser) {
      try {
        await auth.currentUser.getIdToken(true);
      } catch {
        // Ignore offline token refresh warnings
      }
    }

    const preservedPhoneVerified =
      isUpdate &&
      existingData?.phoneVerified === true &&
      existingData.phone === payload.phone.trim();

    const effectivePhoneVerified = Boolean(
      preservedPhoneVerified || hasFirebaseVerifiedPhone
    );

    const baseProfileData = {
      id: profileId,
      ownerId: sanitizeId(payload.ownerId),
      profileType: payload.profileType,
      displayName: clampStr(payload.displayName, VALIDATION_LIMITS.DISPLAY_NAME_MAX, ''),
      responsibleName: clampStr(
        payload.responsibleName,
        VALIDATION_LIMITS.RESPONSIBLE_NAME_MAX,
        ''
      ),
      responsibleRole: clampStr(
        payload.responsibleRole,
        VALIDATION_LIMITS.RESPONSIBLE_ROLE_MAX,
        ''
      ),
      nuit: clampStr(payload.nuit, VALIDATION_LIMITS.NUIT_MAX, ''),
      photoUrl: clampStr(payload.photoUrl, VALIDATION_LIMITS.PHOTO_URL_MAX, ''),
      primaryCategoryId: resolvedPrimaryCategoryId,
      primaryCategoryName: resolvedPrimaryCategoryName,
      specialtyIds,
      specialtyNames,
      experienceYears: safeExp,
      description: clampStr(payload.description, VALIDATION_LIMITS.DESCRIPTION_MAX, ''),
      phone: clampStr(payload.phone, VALIDATION_LIMITS.PHONE_MAX, ''),
      whatsapp: clampStr(payload.whatsapp, VALIDATION_LIMITS.PHONE_MAX, ''),
      email: clampStr(payload.email, VALIDATION_LIMITS.EMAIL_MAX, ''),
      phoneVerified: effectivePhoneVerified,
      authorizedPublication: Boolean(payload.authorizedPublication),
      province: clampStr(payload.province, VALIDATION_LIMITS.PROVINCE_MAX, ''),
      district: clampStr(payload.district, VALIDATION_LIMITS.DISTRICT_MAX, ''),
      locality: clampStr(payload.locality, VALIDATION_LIMITS.LOCALITY_MAX, ''),
      neighborhood: clampStr(payload.neighborhood, VALIDATION_LIMITS.NEIGHBORHOOD_MAX, ''),
      streetOrReference: clampStr(
        payload.streetOrReference,
        VALIDATION_LIMITS.STREET_REF_MAX,
        ''
      ),
      nearestStop: clampStr(payload.nearestStop, VALIDATION_LIMITS.NEAREST_STOP_MAX, ''),
      hasGps: Boolean(payload.hasGps),
      latitude: safeLat,
      longitude: safeLng,
      coverageAreaType: payload.coverageAreaType,
      coverageLocations: clampStr(
        payload.coverageLocations,
        VALIDATION_LIMITS.COVERAGE_LOCATIONS_MAX,
        ''
      ),
      deliveryMode: payload.deliveryMode,
      availabilityStatus: payload.availabilityStatus,
      operationalState: payload.operationalState,
      workingDaysSummary: clampStr(
        payload.workingDaysSummary,
        VALIDATION_LIMITS.WORKING_DAYS_SUMMARY_MAX,
        ''
      ),
      openingTime: clampStr(payload.openingTime, VALIDATION_LIMITS.TIME_STRING_MAX, ''),
      closingTime: clampStr(payload.closingTime, VALIDATION_LIMITS.TIME_STRING_MAX, ''),
      activityField1Label: clampStr(
        payload.activityField1Label,
        VALIDATION_LIMITS.ACTIVITY_LABEL_MAX,
        ''
      ),
      activityField1Value: clampStr(
        payload.activityField1Value,
        VALIDATION_LIMITS.ACTIVITY_VALUE_MAX,
        ''
      ),
      activityField2Label: clampStr(
        payload.activityField2Label,
        VALIDATION_LIMITS.ACTIVITY_LABEL_MAX,
        ''
      ),
      activityField2Value: clampStr(
        payload.activityField2Value,
        VALIDATION_LIMITS.ACTIVITY_VALUE_MAX,
        ''
      ),
      publicationStatus: effectivePublicationStatus,
      rejectionReason: clampStr(
        payload.rejectionReason,
        VALIDATION_LIMITS.REJECTION_REASON_MAX,
        ''
      ),
      updatedAt: serverTimestamp(),
    };

    const batch = writeBatch(db);

    if (isUpdate) {
      const updateFields = { ...baseProfileData };
      delete (updateFields as Partial<typeof baseProfileData>).id;
      delete (updateFields as Partial<typeof baseProfileData>).ownerId;
      if (!hasFirebaseVerifiedPhone) {
        delete (updateFields as Partial<typeof baseProfileData>).phoneVerified;
      }
      batch.update(profileRef, updateFields);
    } else {
      batch.set(profileRef, {
        ...baseProfileData,
        phoneVerified: Boolean(hasFirebaseVerifiedPhone),
        createdAt: serverTimestamp(),
      });
    }

    // 1. Sync professional_specialties in batch
    const incomingSpecAssocIds = new Set<string>();
    for (const spec of boundedSpecialties) {
      const assocId = sanitizeId(`pspec_${profileId}_${spec.id}`).slice(0, 120);
      incomingSpecAssocIds.add(assocId);
      const existingSpecDoc = existingSpecSnap.docs.find((d) => d.id === assocId);
      const specRef = doc(db, 'professional_specialties', assocId);
      if (existingSpecDoc) {
        batch.update(specRef, {
          categoryId: sanitizeId(spec.id),
          specialtyName: clampStr(spec.name, VALIDATION_LIMITS.CATEGORY_NAME_MAX, ''),
          publicationStatus: effectivePublicationStatus,
          updatedAt: serverTimestamp(),
        });
      } else {
        batch.set(specRef, {
          id: assocId,
          profileId,
          ownerId: sanitizeId(payload.ownerId),
          categoryId: sanitizeId(spec.id),
          specialtyName: clampStr(spec.name, VALIDATION_LIMITS.CATEGORY_NAME_MAX, ''),
          publicationStatus: effectivePublicationStatus,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
    for (const oldSpecDoc of existingSpecSnap.docs) {
      if (!incomingSpecAssocIds.has(oldSpecDoc.id)) {
        batch.delete(oldSpecDoc.ref);
      }
    }

    // 2. Sync professional_services in batch
    const incomingSrvIds = new Set<string>();
    for (let i = 0; i < boundedServices.length; i++) {
      const srv = boundedServices[i];
      const srvId = srv.id
        ? sanitizeId(srv.id)
        : sanitizeId(`srv_${profileId}_${i}_${Date.now()}`);
      incomingSrvIds.add(srvId);
      const existingSrvDoc = existingSrvSnap.docs.find((d) => d.id === srvId);
      const srvRef = doc(db, 'professional_services', srvId);
      const srvData = {
        id: srvId,
        profileId,
        ownerId: sanitizeId(payload.ownerId),
        serviceName: clampStr(srv.serviceName, VALIDATION_LIMITS.SERVICE_NAME_MAX, ''),
        description: clampStr(srv.description, VALIDATION_LIMITS.SERVICE_DESC_MAX, ''),
        conditions: clampStr(srv.conditions, VALIDATION_LIMITS.SERVICE_CONDITIONS_MAX, ''),
        price: Math.max(
          0,
          Math.min(VALIDATION_LIMITS.SERVICE_PRICE_MAX, Number(srv.price) || 0)
        ),
        hasFixedPrice: Boolean(srv.hasFixedPrice),
        deliveryMethod: srv.deliveryMethod,
        availabilityStatus: srv.availabilityStatus,
        publicationStatus: effectivePublicationStatus,
        updatedAt: serverTimestamp(),
      };

      if (existingSrvDoc) {
        batch.update(srvRef, {
          serviceName: srvData.serviceName,
          description: srvData.description,
          conditions: srvData.conditions,
          price: srvData.price,
          hasFixedPrice: srvData.hasFixedPrice,
          deliveryMethod: srvData.deliveryMethod,
          availabilityStatus: srvData.availabilityStatus,
          publicationStatus: srvData.publicationStatus,
          updatedAt: serverTimestamp(),
        });
      } else {
        batch.set(srvRef, {
          ...srvData,
          createdAt: serverTimestamp(),
        });
      }
    }
    for (const oldSrvDoc of existingSrvSnap.docs) {
      if (!incomingSrvIds.has(oldSrvDoc.id)) {
        batch.delete(oldSrvDoc.ref);
      }
    }

    // 3. Sync availability_schedules in batch
    for (const sched of boundedSchedules) {
      const schedId = sanitizeId(`sched_${profileId}_${sched.dayOfWeek}`);
      const existingSchedDoc = existingSchedSnap.docs.find((d) => d.id === schedId);
      const schedRef = doc(db, 'availability_schedules', schedId);
      if (existingSchedDoc) {
        batch.update(schedRef, {
          dayOfWeek: sched.dayOfWeek,
          dayLabel: clampStr(sched.dayLabel, 40, 'Dia'),
          isOpen: Boolean(sched.isOpen),
          openingTime: clampStr(sched.openingTime, 10, '08:00'),
          closingTime: clampStr(sched.closingTime, 10, '17:00'),
          notes: clampStr(sched.notes, VALIDATION_LIMITS.SCHEDULE_NOTES_MAX, ''),
          publicationStatus: effectivePublicationStatus,
          updatedAt: serverTimestamp(),
        });
      } else {
        batch.set(schedRef, {
          id: schedId,
          profileId,
          ownerId: sanitizeId(payload.ownerId),
          dayOfWeek: sched.dayOfWeek,
          dayLabel: clampStr(sched.dayLabel, 40, 'Dia'),
          isOpen: Boolean(sched.isOpen),
          openingTime: clampStr(sched.openingTime, 10, '08:00'),
          closingTime: clampStr(sched.closingTime, 10, '17:00'),
          notes: clampStr(sched.notes, VALIDATION_LIMITS.SCHEDULE_NOTES_MAX, ''),
          publicationStatus: effectivePublicationStatus,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }

    // 4. Sync professional_media in batch
    const incomingMediaIds = new Set<string>();
    for (let i = 0; i < boundedMedia.length; i++) {
      const m = boundedMedia[i];
      const mediaId = m.id
        ? sanitizeId(m.id)
        : sanitizeId(`med_${profileId}_${i}_${Date.now()}`);
      incomingMediaIds.add(mediaId);
      const existingMediaDoc = existingMediaSnap.docs.find((d) => d.id === mediaId);
      const mediaRef = doc(db, 'professional_media', mediaId);
      if (existingMediaDoc) {
        batch.update(mediaRef, {
          fileType: m.fileType,
          caption: clampStr(m.caption, VALIDATION_LIMITS.MEDIA_CAPTION_MAX, ''),
          storageRef: clampStr(m.storageRef, VALIDATION_LIMITS.MEDIA_STORAGE_REF_MAX, ''),
          uploadStatus: 'completed',
          publicationStatus: effectivePublicationStatus,
          updatedAt: serverTimestamp(),
        });
      } else {
        batch.set(mediaRef, {
          id: mediaId,
          profileId,
          ownerId: sanitizeId(payload.ownerId),
          fileType: m.fileType,
          caption: clampStr(m.caption, VALIDATION_LIMITS.MEDIA_CAPTION_MAX, ''),
          storageRef: clampStr(m.storageRef, VALIDATION_LIMITS.MEDIA_STORAGE_REF_MAX, ''),
          uploadStatus: 'completed',
          publicationStatus: effectivePublicationStatus,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
    for (const oldMedia of existingMediaSnap.docs) {
      if (!incomingMediaIds.has(oldMedia.id)) {
        batch.delete(oldMedia.ref);
      }
    }

    // 5. Audit log in the same atomic batch
    const logId = sanitizeId(`log_prof_${profileId}_${Date.now()}`);
    batch.set(doc(db, 'audit_logs', logId), {
      id: logId,
      actorId: sanitizeId(payload.ownerId),
      actorName: clampStr(payload.actorName, VALIDATION_LIMITS.DISPLAY_NAME_MAX, 'Profissional'),
      operation: isUpdate ? 'profile_updated' : 'profile_created',
      targetCollection: 'professional_profiles',
      targetRecordId: profileId,
      details: clampStr(
        `Perfil "${payload.displayName}" guardado com estado de publicação "${effectivePublicationStatus}" e disponibilidade "${payload.availabilityStatus}".`,
        VALIDATION_LIMITS.AUDIT_DETAILS_MAX,
        'Perfil guardado'
      ),
      createdAt: serverTimestamp(),
    });

    await batch.commit();

    return profileId;
  } catch (error) {
    if (error instanceof Error && !error.message.includes('permission-denied')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, profilePath);
  }
}

/**
 * Updates only operational state (ON / OFF / STOP) and availability status
 * without altering the profile's publication status (draft/pending/published).
 */
export async function updateProfileOperationalState(params: {
  profileId: string;
  operationalState: OperationalState;
}): Promise<void> {
  const path = `professional_profiles/${params.profileId}`;
  const availabilityStatus: AvailabilityStatus =
    params.operationalState === 'on' ? 'available' : 'unavailable';
  try {
    await updateDoc(doc(db, 'professional_profiles', params.profileId), {
      operationalState: params.operationalState,
      availabilityStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateSingleServiceAvailability(params: {
  serviceId: string;
  availabilityStatus: AvailabilityStatus;
}): Promise<void> {
  const path = `professional_services/${params.serviceId}`;
  try {
    await updateDoc(doc(db, 'professional_services', params.serviceId), {
      availabilityStatus: params.availabilityStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Administrator lifecycle control: Approve (published), Reject (rejected),
 * Request Correction (draft), Suspend (suspended), or Reactivate (published).
 * Synchronizes publicationStatus across child records atomically via `writeBatch`.
 */
export async function adminSetProfilePublicationStatus(params: {
  profile: ProfessionalProfile;
  newStatus: PublicationStatus;
  rejectionReason: string;
  adminId: string;
  adminName: string;
}): Promise<void> {
  const profileId = params.profile.id;
  const path = `professional_profiles/${profileId}`;
  try {
    if (params.newStatus === 'published') {
      if (!params.profile.primaryCategoryId) {
        throw new Error(
          'Não é possível publicar um perfil sem uma categoria principal atribuída.'
        );
      }
      const primaryCatSnap = await getDoc(
        doc(db, 'professional_categories', params.profile.primaryCategoryId)
      );
      if (!primaryCatSnap.exists()) {
        throw new Error(
          'A categoria principal associada a este perfil não existe no catálogo.'
        );
      }
      const primaryCat = primaryCatSnap.data() as ProfessionalCategory;
      if (primaryCat.reviewStatus !== 'approved') {
        throw new Error(
          `Não é possível publicar o perfil enquanto a categoria principal "${primaryCat.originalName}" estiver com estado "${primaryCat.reviewStatus}". Aprove ou unifique primeiro a categoria no separador Categorias.`
        );
      }
    }

    const childCollections = [
      'professional_specialties',
      'professional_services',
      'professional_media',
      'availability_schedules',
    ];

    const childSnaps = await Promise.all(
      childCollections.map((colName) =>
        getDocs(
          query(
            collection(db, colName),
            where('profileId', '==', profileId),
            where('ownerId', '==', params.profile.ownerId)
          )
        )
      )
    );

    const batch = writeBatch(db);
    batch.update(doc(db, 'professional_profiles', profileId), {
      publicationStatus: params.newStatus,
      rejectionReason: clampStr(
        params.rejectionReason,
        VALIDATION_LIMITS.REJECTION_REASON_MAX,
        ''
      ),
      updatedAt: serverTimestamp(),
    });

    for (const snap of childSnaps) {
      for (const childDoc of snap.docs) {
        batch.update(childDoc.ref, {
          publicationStatus: params.newStatus,
          updatedAt: serverTimestamp(),
        });
      }
    }

    const logId = sanitizeId(`log_status_${profileId}_${Date.now()}`);
    batch.set(doc(db, 'audit_logs', logId), {
      id: logId,
      actorId: sanitizeId(params.adminId),
      actorName: clampStr(params.adminName, VALIDATION_LIMITS.DISPLAY_NAME_MAX, 'Admin'),
      operation: 'profile_status_changed',
      targetCollection: 'professional_profiles',
      targetRecordId: profileId,
      details: clampStr(
        `Estado do perfil "${params.profile.displayName}" alterado de "${
          params.profile.publicationStatus
        }" para "${params.newStatus}".${
          params.rejectionReason ? ` Motivo: ${params.rejectionReason}` : ''
        }`,
        VALIDATION_LIMITS.AUDIT_DETAILS_MAX,
        'Estado alterado'
      ),
      createdAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (error) {
    if (error instanceof Error && !error.message.includes('permission-denied')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Owner lifecycle control: Allows a profile owner to deactivate a published/pending profile
 * back to 'draft', or resubmit a 'draft'/'rejected' profile to 'pending_review' / 'published',
 * synchronizing publicationStatus across all child collections atomically via `writeBatch`.
 */
export async function ownerSetProfilePublicationStatus(params: {
  profile: ProfessionalProfile;
  newStatus: 'draft' | 'pending_review' | 'published';
  ownerId: string;
  ownerName: string;
}): Promise<void> {
  const profileId = params.profile.id;
  const path = `professional_profiles/${profileId}`;
  if (params.profile.publicationStatus === 'suspended') {
    throw new Error('Perfis suspensos pela administração apenas podem ser reativados por um administrador.');
  }

  try {
    let effectiveNewStatus = params.newStatus;
    if (effectiveNewStatus === 'published' || effectiveNewStatus === 'pending_review') {
      const primaryCatSnap = params.profile.primaryCategoryId
        ? await getDoc(doc(db, 'professional_categories', params.profile.primaryCategoryId))
        : null;
      if (!primaryCatSnap || !primaryCatSnap.exists()) {
        throw new Error('Selecione uma categoria principal válida antes de publicar o perfil.');
      }
      const primaryCat = primaryCatSnap.data() as ProfessionalCategory;
      if (primaryCat.reviewStatus === 'rejected') {
        throw new Error(
          `A categoria "${primaryCat.originalName}" foi rejeitada pela administração. Altere a categoria antes de publicar.`
        );
      }
      if (effectiveNewStatus === 'published' && primaryCat.reviewStatus !== 'approved') {
        effectiveNewStatus = 'pending_review';
      }
    }

    const childCollections = [
      'professional_specialties',
      'professional_services',
      'professional_media',
      'availability_schedules',
    ];

    const childSnaps = await Promise.all(
      childCollections.map((colName) =>
        getDocs(
          query(
            collection(db, colName),
            where('profileId', '==', profileId),
            where('ownerId', '==', params.ownerId)
          )
        )
      )
    );

    const batch = writeBatch(db);
    batch.update(doc(db, 'professional_profiles', profileId), {
      publicationStatus: effectiveNewStatus,
      rejectionReason: '',
      updatedAt: serverTimestamp(),
    });

    for (const snap of childSnaps) {
      for (const childDoc of snap.docs) {
        batch.update(childDoc.ref, {
          publicationStatus: effectiveNewStatus,
          updatedAt: serverTimestamp(),
        });
      }
    }

    const logId = sanitizeId(`log_owner_st_${profileId}_${Date.now()}`);
    batch.set(doc(db, 'audit_logs', logId), {
      id: logId,
      actorId: sanitizeId(params.ownerId),
      actorName: clampStr(params.ownerName, VALIDATION_LIMITS.DISPLAY_NAME_MAX, 'Profissional'),
      operation: 'profile_updated',
      targetCollection: 'professional_profiles',
      targetRecordId: profileId,
      details: clampStr(
        `Titular alterou o estado de publicação do perfil "${params.profile.displayName}" de "${params.profile.publicationStatus}" para "${effectiveNewStatus}".`,
        VALIDATION_LIMITS.AUDIT_DETAILS_MAX,
        'Estado de publicação atualizado pelo titular'
      ),
      createdAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (error) {
    if (error instanceof Error && !error.message.includes('permission-denied')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Administrator contact verification after real confirmation of the professional's phone number.
 */
export async function adminVerifyProfessionalContact(params: {
  profile: ProfessionalProfile;
  verified: boolean;
  adminId: string;
  adminName: string;
}): Promise<void> {
  const profileId = params.profile.id;
  const path = `professional_profiles/${profileId}`;
  try {
    await updateDoc(doc(db, 'professional_profiles', profileId), {
      phoneVerified: params.verified,
      updatedAt: serverTimestamp(),
    });

    await recordAuditLog({
      actorId: params.adminId,
      actorName: params.adminName,
      operation: 'contact_verified',
      targetCollection: 'professional_profiles',
      targetRecordId: profileId,
      details: `Verificação do contacto telefónico (${params.profile.phone}) do perfil "${
        params.profile.displayName
      }" definida para: ${params.verified ? 'VERIFICADO' : 'NÃO VERIFICADO'}.`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Administrator category approval, rejection, or standardization/renaming.
 * Propagates renamed category display name to associated profiles and specialty records.
 */
export async function adminManageCategory(params: {
  category: ProfessionalCategory;
  newDisplayName: string;
  newReviewStatus: CategoryReviewStatus;
  adminId: string;
  adminName: string;
}): Promise<void> {
  const categoryId = params.category.id;
  const path = `professional_categories/${categoryId}`;
  const formattedName = formatCategoryDisplayName(params.newDisplayName);
  const normalized = normalizeCategoryName(params.newDisplayName);

  try {
    await updateDoc(doc(db, 'professional_categories', categoryId), {
      originalName: clampStr(formattedName, VALIDATION_LIMITS.CATEGORY_NAME_MAX, 'Categoria'),
      normalizedName: clampStr(normalized, VALIDATION_LIMITS.CATEGORY_NAME_MAX, 'categoria'),
      parentCategoryId: params.category.parentCategoryId,
      reviewStatus: params.newReviewStatus,
      reviewerId: sanitizeId(params.adminId),
      canonicalCategoryId: params.category.canonicalCategoryId,
      activityField1Label: params.category.activityField1Label,
      activityField1Placeholder: params.category.activityField1Placeholder,
      activityField1Required: params.category.activityField1Required,
      activityField2Label: params.category.activityField2Label,
      activityField2Placeholder: params.category.activityField2Placeholder,
      activityField2Required: params.category.activityField2Required,
      updatedAt: serverTimestamp(),
    });

    if (formattedName !== params.category.originalName) {
      if (params.category.categoryType === 'profession') {
        const profQ = query(
          collection(db, 'professional_profiles'),
          where('primaryCategoryId', '==', categoryId)
        );
        const profSnap = await getDocs(profQ);
        for (const pDoc of profSnap.docs) {
          await updateDoc(pDoc.ref, {
            primaryCategoryName: formattedName,
            updatedAt: serverTimestamp(),
          });
        }
      } else {
        const specQ = query(
          collection(db, 'professional_specialties'),
          where('categoryId', '==', categoryId)
        );
        const specSnap = await getDocs(specQ);
        for (const sDoc of specSnap.docs) {
          await updateDoc(sDoc.ref, {
            specialtyName: formattedName,
            updatedAt: serverTimestamp(),
          });
        }

        const specProfQ = query(
          collection(db, 'professional_profiles'),
          where('specialtyIds', 'array-contains', categoryId)
        );
        const specProfSnap = await getDocs(specProfQ);
        for (const pDoc of specProfSnap.docs) {
          const pData = pDoc.data() as ProfessionalProfile;
          if (pData.specialtyIds?.includes(categoryId)) {
            const updatedSpecNames = pData.specialtyIds.map((sid, idx) =>
              sid === categoryId
                ? formattedName
                : pData.specialtyNames?.[idx] || ''
            );
            await updateDoc(pDoc.ref, {
              specialtyNames: updatedSpecNames,
              updatedAt: serverTimestamp(),
            });
          }
        }
      }
    }

    const op: AuditOperation =
      formattedName !== params.category.originalName
        ? 'category_renamed'
        : params.newReviewStatus === 'approved'
        ? 'category_approved'
        : 'category_rejected';

    await recordAuditLog({
      actorId: params.adminId,
      actorName: params.adminName,
      operation: op,
      targetCollection: 'professional_categories',
      targetRecordId: categoryId,
      details: `Categoria "${params.category.originalName}" atualizada para "${formattedName}" com estado "${params.newReviewStatus}".`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Administrator configuration of activity-specific registration fields for a category.
 */
export async function adminConfigureCategoryFields(params: {
  category: ProfessionalCategory;
  activityField1Label: string;
  activityField1Placeholder: string;
  activityField1Required: boolean;
  activityField2Label: string;
  activityField2Placeholder: string;
  activityField2Required: boolean;
  adminId: string;
  adminName: string;
}): Promise<void> {
  const path = `professional_categories/${params.category.id}`;
  try {
    await updateDoc(doc(db, 'professional_categories', params.category.id), {
      originalName: params.category.originalName,
      normalizedName: params.category.normalizedName,
      parentCategoryId: params.category.parentCategoryId,
      reviewStatus: params.category.reviewStatus,
      reviewerId: sanitizeId(params.adminId),
      canonicalCategoryId: params.category.canonicalCategoryId,
      activityField1Label: clampStr(
        params.activityField1Label,
        VALIDATION_LIMITS.ACTIVITY_LABEL_MAX,
        ''
      ),
      activityField1Placeholder: clampStr(
        params.activityField1Placeholder,
        VALIDATION_LIMITS.ACTIVITY_PLACEHOLDER_MAX,
        ''
      ),
      activityField1Required: Boolean(params.activityField1Required),
      activityField2Label: clampStr(
        params.activityField2Label,
        VALIDATION_LIMITS.ACTIVITY_LABEL_MAX,
        ''
      ),
      activityField2Placeholder: clampStr(
        params.activityField2Placeholder,
        VALIDATION_LIMITS.ACTIVITY_PLACEHOLDER_MAX,
        ''
      ),
      activityField2Required: Boolean(params.activityField2Required),
      updatedAt: serverTimestamp(),
    });

    await recordAuditLog({
      actorId: params.adminId,
      actorName: params.adminName,
      operation: 'category_fields_configured',
      targetCollection: 'professional_categories',
      targetRecordId: params.category.id,
      details: `Campos específicos de atividade configurados para "${params.category.originalName}": [${
        params.activityField1Label || 'Nenhum'
      }, ${params.activityField2Label || 'Nenhum'}].`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Administrator category merge:
 * Merges a duplicate/synonym category (`sourceCategory`) into a canonical category (`targetCategory`),
 * migrating all associated professional profiles and specialty links using targeted indexed queries.
 */
export async function adminMergeCategories(params: {
  sourceCategory: ProfessionalCategory;
  targetCategory: ProfessionalCategory;
  adminId: string;
  adminName: string;
}): Promise<number> {
  if (params.sourceCategory.id === params.targetCategory.id) {
    throw new Error('A categoria de origem e a categoria de destino não podem ser a mesma.');
  }
  if (params.sourceCategory.categoryType !== params.targetCategory.categoryType) {
    throw new Error(
      'Apenas é possível fundir categorias do mesmo tipo (Profissão com Profissão, ou Especialidade com Especialidade).'
    );
  }
  if (
    params.targetCategory.reviewStatus === 'merged' ||
    params.targetCategory.reviewStatus === 'rejected'
  ) {
    throw new Error(
      'A categoria oficial de destino deve estar ativa/aprovada e não pode ser uma categoria rejeitada ou já fundida.'
    );
  }
  const sourcePath = `professional_categories/${params.sourceCategory.id}`;

  try {
    // Ensure the canonical target category is officially approved and never inherits a pending/rejected state
    if (params.targetCategory.reviewStatus !== 'approved') {
      await updateDoc(doc(db, 'professional_categories', params.targetCategory.id), {
        originalName: params.targetCategory.originalName,
        normalizedName: params.targetCategory.normalizedName,
        parentCategoryId: params.targetCategory.parentCategoryId,
        reviewStatus: 'approved',
        reviewerId: sanitizeId(params.adminId),
        canonicalCategoryId: '',
        activityField1Label: params.targetCategory.activityField1Label,
        activityField1Placeholder: params.targetCategory.activityField1Placeholder,
        activityField1Required: params.targetCategory.activityField1Required,
        activityField2Label: params.targetCategory.activityField2Label,
        activityField2Placeholder: params.targetCategory.activityField2Placeholder,
        activityField2Required: params.targetCategory.activityField2Required,
        updatedAt: serverTimestamp(),
      });
    }

    await updateDoc(doc(db, 'professional_categories', params.sourceCategory.id), {
      originalName: params.sourceCategory.originalName,
      normalizedName: params.sourceCategory.normalizedName,
      parentCategoryId: params.sourceCategory.parentCategoryId,
      reviewStatus: 'merged',
      reviewerId: sanitizeId(params.adminId),
      canonicalCategoryId: params.targetCategory.id,
      activityField1Label: params.sourceCategory.activityField1Label,
      activityField1Placeholder: params.sourceCategory.activityField1Placeholder,
      activityField1Required: params.sourceCategory.activityField1Required,
      activityField2Label: params.sourceCategory.activityField2Label,
      activityField2Placeholder: params.sourceCategory.activityField2Placeholder,
      activityField2Required: params.sourceCategory.activityField2Required,
      updatedAt: serverTimestamp(),
    });

    let migratedCount = 0;

    // 1. Targeted query for profiles using sourceCategory as primaryCategoryId
    const profQ = query(
      collection(db, 'professional_profiles'),
      where('primaryCategoryId', '==', params.sourceCategory.id)
    );
    const profSnap = await getDocs(profQ);
    for (const pDoc of profSnap.docs) {
      await updateDoc(pDoc.ref, {
        primaryCategoryId: params.targetCategory.id,
        primaryCategoryName: params.targetCategory.originalName,
        updatedAt: serverTimestamp(),
      });
      migratedCount++;
    }

    // 2. Targeted array-contains query for profiles using sourceCategory in specialtyIds
    const specProfQ = query(
      collection(db, 'professional_profiles'),
      where('specialtyIds', 'array-contains', params.sourceCategory.id)
    );
    const specProfSnap = await getDocs(specProfQ);
    for (const pDoc of specProfSnap.docs) {
      const pData = pDoc.data() as ProfessionalProfile;
      if (pData.specialtyIds?.includes(params.sourceCategory.id)) {
        const updatedSpecIds: string[] = [];
        const updatedSpecNames: string[] = [];
        pData.specialtyIds.forEach((sid, idx) => {
          const mappedId =
            sid === params.sourceCategory.id ? params.targetCategory.id : sid;
          const mappedName =
            sid === params.sourceCategory.id
              ? params.targetCategory.originalName
              : pData.specialtyNames[idx] || params.targetCategory.originalName;
          if (!updatedSpecIds.includes(mappedId)) {
            updatedSpecIds.push(mappedId);
            updatedSpecNames.push(mappedName);
          }
        });
        await updateDoc(pDoc.ref, {
          specialtyIds: updatedSpecIds,
          specialtyNames: updatedSpecNames,
          updatedAt: serverTimestamp(),
        });
        migratedCount++;
      }
    }

    // 3. Targeted query for professional_specialties records
    const specQ = query(
      collection(db, 'professional_specialties'),
      where('categoryId', '==', params.sourceCategory.id)
    );
    const specSnap = await getDocs(specQ);
    for (const sDoc of specSnap.docs) {
      await updateDoc(sDoc.ref, {
        categoryId: params.targetCategory.id,
        specialtyName: params.targetCategory.originalName,
        updatedAt: serverTimestamp(),
      });
    }

    await recordAuditLog({
      actorId: params.adminId,
      actorName: params.adminName,
      operation: 'category_merged',
      targetCollection: 'professional_categories',
      targetRecordId: params.sourceCategory.id,
      details: `Categoria "${params.sourceCategory.originalName}" fundida na categoria canónica "${params.targetCategory.originalName}" (${migratedCount} perfis migrados sem perda de referências).`,
    });

    return migratedCount;
  } catch (error) {
    if (error instanceof Error && !error.message.includes('permission-denied')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, sourcePath);
  }
}

/**
 * Atomically increments the video view count (and general view count)
 * when a user accesses or plays a video in a professional or company profile,
 * ensuring the view counter never remains stuck at 0.
 */
export async function recordVideoView(params: {
  collectionName: 'professional_profiles' | 'companies';
  docId: string;
}): Promise<void> {
  const safeId = sanitizeId(params.docId);
  const docRef = doc(db, params.collectionName, safeId);
  try {
    await updateDoc(docRef, {
      videoViews: increment(1),
      viewsCount: increment(1),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn(`Não foi possível registar visualização para ${safeId}:`, err);
  }
}

export interface SaveCompanyPayload {
  companyId?: string;
  ownerId: string;
  actorName: string;
  entityType: CompanyEntityType;
  officialName: string;
  displayName: string;
  nuit: string;
  primaryCategoryId: string;
  primaryCategoryName: string;
  subcategory: string;
  description: string;
  logoUrl: string;
  photoUrl: string;
  videoUrl: string;
  responsibleName: string;
  responsibleRole: string;
  phone: string;
  whatsapp: string;
  email: string;
  authorizedPublication: boolean;
  province: string;
  district: string;
  locality: string;
  neighborhood: string;
  streetOrReference: string;
  nearestStop: string;
  hasGps: boolean;
  latitude: number;
  longitude: number;
  operationalState: OperationalState;
  workingDaysSummary: string;
  openingTime: string;
  closingTime: string;
  publicationStatus: PublicationStatus;
  rejectionReason?: string;
  services: {
    id?: string;
    serviceName: string;
    description: string;
    conditions?: string;
    price: number;
    hasFixedPrice: boolean;
    deliveryMethod: ServiceDeliveryMethod;
    availabilityStatus: AvailabilityStatus;
  }[];
  schedules: {
    dayOfWeek: number;
    dayLabel: string;
    isOpen: boolean;
    openingTime: string;
    closingTime: string;
    notes: string;
  }[];
  mediaItems: {
    id?: string;
    fileType: MediaFileType;
    caption: string;
    storageRef: string;
  }[];
  documents: {
    id?: string;
    docType: CompanyDocType;
    title: string;
    fileName: string;
    storageRef: string;
    verificationStatus?: CompanyVerificationStatus;
  }[];
}

/**
 * Dynamically selects an existing company category or proposes a new one atomically,
 * completely segregated from professional categories.
 */
export async function proposeOrSelectCompanyCategory(params: {
  rawName: string;
  entityType?: CompanyEntityType | 'all';
  actorId: string;
  actorName: string;
  isAdmin: boolean;
}): Promise<CompanyCategory> {
  const displayName = formatCategoryDisplayName(params.rawName);
  const normalized = normalizeCategoryName(params.rawName);
  if (normalized.length < 2) {
    throw new Error('O nome da categoria da empresa deve ter pelo menos 2 caracteres válidos.');
  }

  const categoryId = sanitizeId(`comp_cat_${normalized.replace(/\s+/g, '_')}`).slice(0, 80);
  const categoryRef = doc(db, 'company_categories', categoryId);
  const path = `company_categories/${categoryId}`;

  try {
    let createdNew = false;
    const resultCategory = await runTransaction(db, async (tx) => {
      const existingSnap = await tx.get(categoryRef);
      if (existingSnap.exists()) {
        const existingData = existingSnap.data() as CompanyCategory;
        if (existingData.reviewStatus === 'rejected' && !params.isAdmin) {
          throw new Error(
            `A categoria "${existingData.originalName}" foi rejeitada pela administração e não pode ser utilizada.`
          );
        }
        return existingData;
      }

      createdNew = true;
      const reviewStatus: CategoryReviewStatus = params.isAdmin ? 'approved' : 'pending';
      const newCategoryDoc: CompanyCategory = {
        id: categoryId,
        originalName: clampStr(displayName, VALIDATION_LIMITS.CATEGORY_NAME_MAX, 'Categoria'),
        normalizedName: clampStr(normalized, VALIDATION_LIMITS.CATEGORY_NAME_MAX, 'categoria'),
        entityType: params.entityType || 'all',
        reviewStatus,
        creatorId: sanitizeId(params.actorId),
        subcategories: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      tx.set(categoryRef, {
        ...newCategoryDoc,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return newCategoryDoc;
    });

    if (createdNew) {
      await recordAuditLog({
        actorId: params.actorId,
        actorName: params.actorName,
        operation: 'company_category_created',
        targetCollection: 'company_categories',
        targetRecordId: categoryId,
        details: `Categoria de empresa/instituição "${displayName}" criada com estado "${
          params.isAdmin ? 'approved' : 'pending'
        }".`,
      });
    }

    return resultCategory;
  } catch (error) {
    if (error instanceof Error && !error.message.includes('permission-denied')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Administrator approval/rejection or name update of a company category.
 */
export async function adminManageCompanyCategory(params: {
  categoryId: string;
  originalName?: string;
  reviewStatus?: CategoryReviewStatus;
  subcategories?: string[];
  adminId: string;
  adminName: string;
}): Promise<void> {
  const catRef = doc(db, 'company_categories', sanitizeId(params.categoryId));
  const updateData: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (params.originalName) {
    updateData.originalName = clampStr(
      formatCategoryDisplayName(params.originalName),
      VALIDATION_LIMITS.CATEGORY_NAME_MAX,
      ''
    );
    updateData.normalizedName = normalizeCategoryName(params.originalName);
  }
  if (params.reviewStatus) {
    updateData.reviewStatus = params.reviewStatus;
  }
  if (params.subcategories) {
    updateData.subcategories = params.subcategories;
  }

  await updateDoc(catRef, updateData);

  await recordAuditLog({
    actorId: params.adminId,
    actorName: params.adminName,
    operation: 'company_category_approved',
    targetCollection: 'company_categories',
    targetRecordId: params.categoryId,
    details: `Categoria de empresa "${params.categoryId}" atualizada pela administração.`,
  });
}

/**
 * Atomically saves a Company / Institution profile and synchronizes child collections
 * (`company_services`, `company_hours`, `company_media`, `company_documents`, and `audit_logs`).
 */
export async function saveCompanyProfileComplete(
  payload: SaveCompanyPayload
): Promise<string> {
  const companyId = payload.companyId
    ? sanitizeId(payload.companyId)
    : sanitizeId(`comp_${payload.ownerId.slice(0, 20)}_${Date.now()}`);
  const companyPath = `companies/${companyId}`;

  const boundedServices = payload.services
    .filter((s) => s.serviceName && s.serviceName.trim().length >= 2)
    .slice(0, 25);
  const boundedSchedules = payload.schedules.slice(0, 7);
  const boundedMedia = payload.mediaItems.filter((m) => m.storageRef).slice(0, 20);
  const boundedDocs = payload.documents.filter((d) => d.storageRef).slice(0, 10);

  const safeLat = payload.hasGps
    ? Math.max(-90, Math.min(90, Number(payload.latitude) || 0))
    : 0;
  const safeLng = payload.hasGps
    ? Math.max(-180, Math.min(180, Number(payload.longitude) || 0))
    : 0;

  let isUpdate = false;
  try {
    const compRef = doc(db, 'companies', companyId);

    const [
      existingSnap,
      existingSrvSnap,
      existingSchedSnap,
      existingMediaSnap,
      existingDocsSnap,
      primaryCatSnap,
    ] = await Promise.all([
      getDoc(compRef),
      getDocs(
        query(
          collection(db, 'company_services'),
          where('companyId', '==', companyId),
          where('ownerId', '==', payload.ownerId)
        )
      ),
      getDocs(
        query(
          collection(db, 'company_hours'),
          where('companyId', '==', companyId),
          where('ownerId', '==', payload.ownerId)
        )
      ),
      getDocs(
        query(
          collection(db, 'company_media'),
          where('companyId', '==', companyId),
          where('ownerId', '==', payload.ownerId)
        )
      ),
      getDocs(
        query(
          collection(db, 'company_documents'),
          where('companyId', '==', companyId),
          where('ownerId', '==', payload.ownerId)
        )
      ),
      payload.primaryCategoryId
        ? getDoc(doc(db, 'company_categories', sanitizeId(payload.primaryCategoryId)))
        : Promise.resolve(null),
    ]);

    let resolvedPrimaryCategoryId = payload.primaryCategoryId
      ? sanitizeId(payload.primaryCategoryId)
      : '';
    let resolvedPrimaryCategoryName = clampStr(
      payload.primaryCategoryName,
      VALIDATION_LIMITS.CATEGORY_NAME_MAX,
      ''
    );
    let effectivePublicationStatus: PublicationStatus = payload.publicationStatus;

    if (primaryCatSnap && primaryCatSnap.exists()) {
      const catData = primaryCatSnap.data() as CompanyCategory;
      if (catData.reviewStatus === 'rejected') {
        throw new Error(
          `A categoria "${catData.originalName}" foi rejeitada e não pode ser utilizada.`
        );
      }
      if (effectivePublicationStatus === 'published' && catData.reviewStatus !== 'approved') {
        effectivePublicationStatus = 'pending_review';
      }
    } else if (effectivePublicationStatus === 'published') {
      effectivePublicationStatus = 'pending_review';
    }

    isUpdate = existingSnap.exists();
    const existingData = isUpdate ? (existingSnap.data() as CompanyProfile) : null;

    // Check phone verification token
    const phoneValidation = validateMozambiquePhone(payload.phone);
    const authPhone = auth.currentUser?.phoneNumber || '';
    const hasFirebaseVerifiedPhone = Boolean(
      authPhone &&
        (authPhone === payload.phone.trim() ||
          (phoneValidation.valid && authPhone === phoneValidation.e164))
    );

    if (hasFirebaseVerifiedPhone && auth.currentUser) {
      try {
        await auth.currentUser.getIdToken(true);
      } catch {
        // Ignore offline refresh error
      }
    }

    const preservedPhoneVerified =
      isUpdate &&
      existingData?.phoneVerified === true &&
      existingData.phone === payload.phone.trim();

    const effectivePhoneVerified = Boolean(
      preservedPhoneVerified || hasFirebaseVerifiedPhone
    );

    const preservedCompanyVerified = isUpdate && Boolean(existingData?.companyVerified);

    const baseCompanyData = {
      id: companyId,
      ownerId: sanitizeId(payload.ownerId),
      entityType: payload.entityType,
      officialName: clampStr(payload.officialName, VALIDATION_LIMITS.DISPLAY_NAME_MAX, ''),
      displayName: clampStr(
        payload.displayName || payload.officialName,
        VALIDATION_LIMITS.DISPLAY_NAME_MAX,
        ''
      ),
      nuit: clampStr(payload.nuit, VALIDATION_LIMITS.NUIT_MAX, ''),
      primaryCategoryId: resolvedPrimaryCategoryId,
      primaryCategoryName: resolvedPrimaryCategoryName,
      subcategory: clampStr(payload.subcategory, 100, ''),
      description: clampStr(payload.description, VALIDATION_LIMITS.DESCRIPTION_MAX, ''),
      logoUrl: clampStr(payload.logoUrl, VALIDATION_LIMITS.PHOTO_URL_MAX, ''),
      photoUrl: clampStr(payload.photoUrl, VALIDATION_LIMITS.PHOTO_URL_MAX, ''),
      videoUrl: clampStr(payload.videoUrl, 500, ''),
      videoViews: existingData?.videoViews || 0,
      viewsCount: existingData?.viewsCount || 0,
      responsibleName: clampStr(
        payload.responsibleName,
        VALIDATION_LIMITS.RESPONSIBLE_NAME_MAX,
        ''
      ),
      responsibleRole: clampStr(
        payload.responsibleRole,
        VALIDATION_LIMITS.RESPONSIBLE_ROLE_MAX,
        ''
      ),
      phone: clampStr(payload.phone, VALIDATION_LIMITS.PHONE_MAX, ''),
      whatsapp: clampStr(payload.whatsapp, VALIDATION_LIMITS.PHONE_MAX, ''),
      email: clampStr(payload.email, VALIDATION_LIMITS.EMAIL_MAX, ''),
      phoneVerified: effectivePhoneVerified,
      companyVerified: preservedCompanyVerified,
      authorizedPublication: Boolean(payload.authorizedPublication),
      province: clampStr(payload.province, VALIDATION_LIMITS.PROVINCE_MAX, ''),
      district: clampStr(payload.district, VALIDATION_LIMITS.DISTRICT_MAX, ''),
      locality: clampStr(payload.locality, VALIDATION_LIMITS.LOCALITY_MAX, ''),
      neighborhood: clampStr(payload.neighborhood, VALIDATION_LIMITS.NEIGHBORHOOD_MAX, ''),
      streetOrReference: clampStr(
        payload.streetOrReference,
        VALIDATION_LIMITS.STREET_REF_MAX,
        ''
      ),
      nearestStop: clampStr(payload.nearestStop, VALIDATION_LIMITS.NEAREST_STOP_MAX, ''),
      hasGps: Boolean(payload.hasGps),
      latitude: safeLat,
      longitude: safeLng,
      operationalState: payload.operationalState,
      workingDaysSummary: clampStr(
        payload.workingDaysSummary,
        VALIDATION_LIMITS.WORKING_DAYS_SUMMARY_MAX,
        ''
      ),
      openingTime: clampStr(payload.openingTime, VALIDATION_LIMITS.TIME_STRING_MAX, ''),
      closingTime: clampStr(payload.closingTime, VALIDATION_LIMITS.TIME_STRING_MAX, ''),
      publicationStatus: effectivePublicationStatus,
      rejectionReason: clampStr(
        payload.rejectionReason,
        VALIDATION_LIMITS.REJECTION_REASON_MAX,
        ''
      ),
      updatedAt: serverTimestamp(),
    };

    const batch = writeBatch(db);

    if (isUpdate) {
      const updateFields = { ...baseCompanyData };
      delete (updateFields as Partial<typeof baseCompanyData>).id;
      delete (updateFields as Partial<typeof baseCompanyData>).ownerId;
      delete (updateFields as Partial<typeof baseCompanyData>).companyVerified;
      if (!hasFirebaseVerifiedPhone) {
        delete (updateFields as Partial<typeof baseCompanyData>).phoneVerified;
      }
      batch.update(compRef, updateFields);
    } else {
      batch.set(compRef, {
        ...baseCompanyData,
        phoneVerified: Boolean(hasFirebaseVerifiedPhone),
        companyVerified: false,
        createdAt: serverTimestamp(),
      });
    }

    // 1. Sync company_services in batch
    const incomingSrvIds = new Set<string>();
    for (let i = 0; i < boundedServices.length; i++) {
      const srv = boundedServices[i];
      const srvId = srv.id
        ? sanitizeId(srv.id)
        : sanitizeId(`csrv_${companyId}_${i}_${Date.now()}`);
      incomingSrvIds.add(srvId);

      const existingDoc = existingSrvSnap.docs.find((d) => d.id === srvId);
      const srvRef = doc(db, 'company_services', srvId);
      const srvData = {
        companyId,
        ownerId: sanitizeId(payload.ownerId),
        serviceName: clampStr(srv.serviceName, VALIDATION_LIMITS.SERVICE_NAME_MAX, ''),
        description: clampStr(srv.description, VALIDATION_LIMITS.SERVICE_DESC_MAX, ''),
        conditions: clampStr(srv.conditions, VALIDATION_LIMITS.SERVICE_CONDITIONS_MAX, ''),
        price: Math.max(0, Math.min(VALIDATION_LIMITS.SERVICE_PRICE_MAX, Number(srv.price) || 0)),
        hasFixedPrice: Boolean(srv.hasFixedPrice),
        deliveryMethod: srv.deliveryMethod,
        availabilityStatus: srv.availabilityStatus,
        publicationStatus: effectivePublicationStatus,
        updatedAt: serverTimestamp(),
      };

      if (existingDoc) {
        batch.update(srvRef, srvData);
      } else {
        batch.set(srvRef, {
          id: srvId,
          ...srvData,
          createdAt: serverTimestamp(),
        });
      }
    }
    for (const oldDoc of existingSrvSnap.docs) {
      if (!incomingSrvIds.has(oldDoc.id)) {
        batch.delete(oldDoc.ref);
      }
    }

    // 2. Sync company_hours in batch
    const incomingSchedIds = new Set<string>();
    for (const sched of boundedSchedules) {
      const schedId = sanitizeId(`chour_${companyId}_${sched.dayOfWeek}`);
      incomingSchedIds.add(schedId);
      const existingDoc = existingSchedSnap.docs.find((d) => d.id === schedId);
      const schedRef = doc(db, 'company_hours', schedId);
      const schedData = {
        companyId,
        ownerId: sanitizeId(payload.ownerId),
        dayOfWeek: Math.max(0, Math.min(6, sched.dayOfWeek)),
        dayLabel: clampStr(sched.dayLabel, 40, 'Dia'),
        isOpen: Boolean(sched.isOpen),
        openingTime: clampStr(sched.openingTime, VALIDATION_LIMITS.TIME_STRING_MAX, '08:00'),
        closingTime: clampStr(sched.closingTime, VALIDATION_LIMITS.TIME_STRING_MAX, '17:00'),
        notes: clampStr(sched.notes, VALIDATION_LIMITS.SCHEDULE_NOTES_MAX, ''),
        publicationStatus: effectivePublicationStatus,
        updatedAt: serverTimestamp(),
      };

      if (existingDoc) {
        batch.update(schedRef, schedData);
      } else {
        batch.set(schedRef, {
          id: schedId,
          ...schedData,
          createdAt: serverTimestamp(),
        });
      }
    }
    for (const oldDoc of existingSchedSnap.docs) {
      if (!incomingSchedIds.has(oldDoc.id)) {
        batch.delete(oldDoc.ref);
      }
    }

    // 3. Sync company_media in batch
    const incomingMediaIds = new Set<string>();
    for (let i = 0; i < boundedMedia.length; i++) {
      const m = boundedMedia[i];
      const mId = m.id ? sanitizeId(m.id) : sanitizeId(`cmed_${companyId}_${i}_${Date.now()}`);
      incomingMediaIds.add(mId);
      const existingDoc = existingMediaSnap.docs.find((d) => d.id === mId);
      const mRef = doc(db, 'company_media', mId);
      const mData = {
        companyId,
        ownerId: sanitizeId(payload.ownerId),
        fileType: m.fileType,
        caption: clampStr(m.caption, VALIDATION_LIMITS.MEDIA_CAPTION_MAX, ''),
        storageRef: clampStr(m.storageRef, VALIDATION_LIMITS.MEDIA_STORAGE_REF_MAX, ''),
        uploadStatus: 'completed' as const,
        publicationStatus: effectivePublicationStatus,
        updatedAt: serverTimestamp(),
      };

      if (existingDoc) {
        batch.update(mRef, mData);
      } else {
        batch.set(mRef, {
          id: mId,
          ...mData,
          createdAt: serverTimestamp(),
        });
      }
    }
    for (const oldDoc of existingMediaSnap.docs) {
      if (!incomingMediaIds.has(oldDoc.id)) {
        batch.delete(oldDoc.ref);
      }
    }

    // 4. Sync company_documents in batch (protected private verification documents)
    const incomingDocIds = new Set<string>();
    for (let i = 0; i < boundedDocs.length; i++) {
      const d = boundedDocs[i];
      const dId = d.id ? sanitizeId(d.id) : sanitizeId(`cdoc_${companyId}_${i}_${Date.now()}`);
      incomingDocIds.add(dId);
      const existingDoc = existingDocsSnap.docs.find((item) => item.id === dId);
      const dRef = doc(db, 'company_documents', dId);
      const dData = {
        companyId,
        ownerId: sanitizeId(payload.ownerId),
        docType: d.docType,
        title: clampStr(d.title, 120, 'Documento de Verificação'),
        fileName: clampStr(d.fileName, 120, 'ficheiro'),
        storageRef: clampStr(d.storageRef, VALIDATION_LIMITS.MEDIA_STORAGE_REF_MAX, ''),
        verificationStatus: d.verificationStatus || 'pending',
        updatedAt: serverTimestamp(),
      };

      if (existingDoc) {
        batch.update(dRef, dData);
      } else {
        batch.set(dRef, {
          id: dId,
          ...dData,
          createdAt: serverTimestamp(),
        });
      }
    }
    for (const oldDoc of existingDocsSnap.docs) {
      if (!incomingDocIds.has(oldDoc.id)) {
        batch.delete(oldDoc.ref);
      }
    }

    // 5. Record Audit Log in batch
    const auditId = sanitizeId(`audit_comp_${companyId}_${Date.now()}`);
    batch.set(doc(db, 'audit_logs', auditId), {
      id: auditId,
      actorId: sanitizeId(payload.ownerId),
      actorName: clampStr(payload.actorName, VALIDATION_LIMITS.DISPLAY_NAME_MAX, 'Titular'),
      operation: isUpdate ? 'company_updated' : 'company_created',
      targetCollection: 'companies',
      targetRecordId: companyId,
      details: `Empresa/Instituição "${baseCompanyData.displayName}" (${baseCompanyData.entityType}) guardada com estado "${effectivePublicationStatus}".`,
      createdAt: serverTimestamp(),
    });

    await batch.commit();
    return companyId;
  } catch (error) {
    if (error instanceof Error && !error.message.includes('permission-denied')) {
      throw error;
    }
    handleFirestoreError(error, isUpdate ? OperationType.UPDATE : OperationType.CREATE, companyPath);
  }
}

/**
 * Updates operational state (ON/OFF/STOP) for a company without touching publicationStatus.
 */
export async function updateCompanyOperationalState(params: {
  companyId: string;
  operationalState: OperationalState;
}): Promise<void> {
  const compRef = doc(db, 'companies', sanitizeId(params.companyId));
  await updateDoc(compRef, {
    operationalState: params.operationalState,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Toggles single service availability in company_services.
 */
export async function updateSingleCompanyServiceAvailability(params: {
  serviceId: string;
  availabilityStatus: AvailabilityStatus;
}): Promise<void> {
  const srvRef = doc(db, 'company_services', sanitizeId(params.serviceId));
  await updateDoc(srvRef, {
    availabilityStatus: params.availabilityStatus,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Administrator company publication moderation: approve, reject, suspend, reactivate.
 */
export async function adminSetCompanyPublicationStatus(params: {
  companyId: string;
  newStatus: PublicationStatus;
  rejectionReason?: string;
  adminId: string;
  adminName: string;
}): Promise<void> {
  if (
    (params.newStatus === 'rejected' || params.newStatus === 'suspended') &&
    !params.rejectionReason?.trim()
  ) {
    throw new Error('É obrigatório indicar uma justificação técnica ao rejeitar ou suspender uma empresa.');
  }

  const compRef = doc(db, 'companies', sanitizeId(params.companyId));
  const batch = writeBatch(db);

  batch.update(compRef, {
    publicationStatus: params.newStatus,
    rejectionReason: clampStr(
      params.rejectionReason,
      VALIDATION_LIMITS.REJECTION_REASON_MAX,
      ''
    ),
    updatedAt: serverTimestamp(),
  });

  const auditId = sanitizeId(`audit_comp_mod_${params.companyId}_${Date.now()}`);
  batch.set(doc(db, 'audit_logs', auditId), {
    id: auditId,
    actorId: sanitizeId(params.adminId),
    actorName: clampStr(params.adminName, VALIDATION_LIMITS.DISPLAY_NAME_MAX, 'Administrador'),
    operation: 'company_status_changed',
    targetCollection: 'companies',
    targetRecordId: params.companyId,
    details: `Estado de publicação da empresa "${params.companyId}" alterado para "${params.newStatus}". ${
      params.rejectionReason ? `Motivo: ${params.rejectionReason}` : ''
    }`,
    createdAt: serverTimestamp(),
  });

  await batch.commit();
}

/**
 * Administrator legal verification of a company (companyVerified).
 */
export async function adminVerifyCompany(params: {
  companyId: string;
  companyVerified: boolean;
  adminId: string;
  adminName: string;
  note?: string;
}): Promise<void> {
  const compRef = doc(db, 'companies', sanitizeId(params.companyId));
  const batch = writeBatch(db);

  batch.update(compRef, {
    companyVerified: params.companyVerified,
    updatedAt: serverTimestamp(),
  });

  const auditId = sanitizeId(`audit_comp_verif_${params.companyId}_${Date.now()}`);
  batch.set(doc(db, 'audit_logs', auditId), {
    id: auditId,
    actorId: sanitizeId(params.adminId),
    actorName: clampStr(params.adminName, VALIDATION_LIMITS.DISPLAY_NAME_MAX, 'Administrador'),
    operation: 'company_verified',
    targetCollection: 'companies',
    targetRecordId: params.companyId,
    details: `Verificação de empresa/instituição para "${params.companyId}" definida como ${
      params.companyVerified ? 'VERIFICADA' : 'NÃO VERIFICADA'
    }. ${params.note || ''}`,
    createdAt: serverTimestamp(),
  });

  await batch.commit();
}
