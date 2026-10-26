/**
 * Verification Suite for MozFácil Firestore Security Rules (Dirty Dozen Payloads)
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  authUid: string | null;
  emailVerified: boolean;
  docId: string;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Privilege Escalation: Self-assign admin role on user registration',
    collection: 'users',
    operation: 'create',
    authUid: 'user_attacker',
    emailVerified: true,
    docId: 'user_attacker',
    payload: {
      id: 'user_attacker',
      displayName: 'Attacker',
      email: 'attacker@example.com',
      phone: '+258840000000',
      whatsapp: '',
      role: 'admin',
      phoneVerified: false,
      emailVerified: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'PII Leak: Read another user document',
    collection: 'users',
    operation: 'get',
    authUid: 'user_attacker',
    emailVerified: true,
    docId: 'user_victim',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Shadow Update: Inject undeclared ghost field into professional profile',
    collection: 'professional_profiles',
    operation: 'update',
    authUid: 'user_owner',
    emailVerified: true,
    docId: 'prof_1',
    payload: {
      displayName: 'Valid Name',
      ghostVerifiedFlag: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Identity Spoofing: Create profile with another user as ownerId',
    collection: 'professional_profiles',
    operation: 'create',
    authUid: 'user_attacker',
    emailVerified: true,
    docId: 'prof_spoof',
    payload: {
      id: 'prof_spoof',
      ownerId: 'user_victim',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Orphaned Service Creation: Reference non-existent parent profileId',
    collection: 'professional_services',
    operation: 'create',
    authUid: 'user_owner',
    emailVerified: true,
    docId: 'srv_orphan',
    payload: {
      id: 'srv_orphan',
      profileId: 'non_existent_profile',
      ownerId: 'user_owner',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Cross-Owner Service Injection: Add service to another user profile',
    collection: 'professional_services',
    operation: 'create',
    authUid: 'user_attacker',
    emailVerified: true,
    docId: 'srv_hijack',
    payload: {
      id: 'srv_hijack',
      profileId: 'prof_victim',
      ownerId: 'user_attacker',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'ID Poisoning: Document ID with invalid characters',
    collection: 'professional_profiles',
    operation: 'create',
    authUid: 'user_owner',
    emailVerified: true,
    docId: 'invalid$id#with!spaces',
    payload: {},
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Unbounded Array Exhaustion: More than 10 specialtyIds',
    collection: 'professional_profiles',
    operation: 'update',
    authUid: 'user_owner',
    emailVerified: true,
    docId: 'prof_1',
    payload: {
      specialtyIds: ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11'],
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Unauthorized Category Approval by Non-Admin',
    collection: 'professional_categories',
    operation: 'update',
    authUid: 'user_regular',
    emailVerified: true,
    docId: 'prof_mecanico',
    payload: {
      reviewStatus: 'approved',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Suspended Profile Self-Reactivation by Owner',
    collection: 'professional_profiles',
    operation: 'update',
    authUid: 'user_suspended_owner',
    emailVerified: true,
    docId: 'prof_suspended',
    payload: {
      publicationStatus: 'published',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Timestamp Forgery: Client-supplied past timestamp on create',
    collection: 'professional_profiles',
    operation: 'create',
    authUid: 'user_owner',
    emailVerified: true,
    docId: 'prof_backdated',
    payload: {
      createdAt: '2020-01-01T00:00:00Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Audit Log Tampering: Attempt to delete an audit log record',
    collection: 'audit_logs',
    operation: 'delete',
    authUid: 'user_admin',
    emailVerified: true,
    docId: 'log_1',
    expectedResult: 'PERMISSION_DENIED',
  },
];
