import { Timestamp } from 'firebase/firestore';

export type UserRole = 'visitor' | 'professional' | 'admin';

export type ProfileType = 'independent' | 'service_provider' | 'street_vendor';

export type CoverageAreaType =
  | 'neighborhood'
  | 'district'
  | 'province'
  | 'selected_locations';

export type DeliveryMode =
  | 'customer_location'
  | 'professional_location'
  | 'both'
  | 'mobile_route';

export type ServiceDeliveryMethod =
  | 'customer_location'
  | 'professional_location'
  | 'both'
  | 'remote';

export type AvailabilityStatus = 'available' | 'unavailable';

export type OperationalState = 'on' | 'off' | 'stop';

export type PublicationStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'rejected'
  | 'suspended';

export type CategoryType = 'profession' | 'specialty';

export type CategoryReviewStatus = 'pending' | 'approved' | 'rejected' | 'merged';

export type MediaFileType = 'profile_photo' | 'work_photo' | 'certificate' | 'video';

export type MediaUploadStatus = 'completed' | 'pending' | 'failed';

export type CompanyEntityType =
  | 'private_company'
  | 'public_institution'
  | 'state_institution'
  | 'ngo'
  | 'agency';

export type CompanyDocType = 'nuit_doc' | 'alvara' | 'statutes' | 'other';

export type CompanyVerificationStatus = 'pending' | 'verified' | 'rejected';

export type AuditOperation =
  | 'utente_registered'
  | 'consultation_debit'
  | 'profile_created'
  | 'profile_updated'
  | 'profile_status_changed'
  | 'contact_verified'
  | 'category_created'
  | 'category_approved'
  | 'category_rejected'
  | 'category_renamed'
  | 'category_merged'
  | 'category_fields_configured'
  | 'company_created'
  | 'company_updated'
  | 'company_status_changed'
  | 'company_verified'
  | 'company_category_created'
  | 'company_category_approved'
  | 'video_viewed';

// Validation constants synchronized with firebase-blueprint.json & firestore.rules
export const VALIDATION_LIMITS = {
  ID_MAX: 128,
  ID_PATTERN: /^[a-zA-Z0-9_\-]+$/,
  DISPLAY_NAME_MIN: 2,
  DISPLAY_NAME_MAX: 120,
  RESPONSIBLE_NAME_MAX: 120,
  RESPONSIBLE_ROLE_MAX: 80,
  NUIT_MAX: 30,
  PHOTO_URL_MAX: 250000,
  CATEGORY_NAME_MIN: 2,
  CATEGORY_NAME_MAX: 100,
  SPECIALTIES_MAX_COUNT: 10,
  EXPERIENCE_MAX: 80,
  DESCRIPTION_MAX: 2000,
  PHONE_MIN: 3,
  PHONE_MAX: 40,
  EMAIL_MAX: 120,
  PROVINCE_MAX: 80,
  DISTRICT_MAX: 80,
  LOCALITY_MAX: 100,
  NEIGHBORHOOD_MAX: 100,
  STREET_REF_MAX: 250,
  NEAREST_STOP_MAX: 200,
  COVERAGE_LOCATIONS_MAX: 500,
  WORKING_DAYS_SUMMARY_MAX: 200,
  TIME_STRING_MAX: 20,
  ACTIVITY_LABEL_MAX: 100,
  ACTIVITY_PLACEHOLDER_MAX: 150,
  ACTIVITY_VALUE_MAX: 500,
  REJECTION_REASON_MAX: 500,
  SERVICE_NAME_MIN: 2,
  SERVICE_NAME_MAX: 120,
  SERVICE_DESC_MAX: 1000,
  SERVICE_CONDITIONS_MAX: 500,
  SERVICE_PRICE_MAX: 100000000,
  MEDIA_CAPTION_MAX: 200,
  MEDIA_STORAGE_REF_MAX: 300000,
  SCHEDULE_NOTES_MAX: 200,
  AUDIT_DETAILS_MAX: 1000,
  INITIAL_PACKAGE_CREDITS: 100,
  CREDITS_PER_CONSULTATION: 1,
} as const;

export interface MozUser {
  id: string;
  displayName: string;
  email: string;
  phone: string;
  whatsapp: string;
  province: string;
  district: string;
  neighborhood: string;
  termsAccepted: boolean;
  creditsBalance: number;
  consultationsCount: number;
  role: UserRole;
  phoneVerified: boolean;
  emailVerified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserConsultation {
  id: string;
  userId: string;
  targetProfileId: string;
  targetProfileName: string;
  creditsDebited: number;
  amountMzn: number;
  createdAt: Timestamp;
}

export interface ProfessionalProfile {
  id: string;
  ownerId: string;
  profileType: ProfileType;
  displayName: string;
  responsibleName: string;
  responsibleRole: string;
  nuit: string;
  photoUrl: string;
  primaryCategoryId: string;
  primaryCategoryName: string;
  specialtyIds: string[];
  specialtyNames: string[];
  experienceYears: number;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  phoneVerified: boolean;
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
  rejectionReason: string;
  videoUrl?: string;
  videoViews?: number;
  viewsCount?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProfessionalCategory {
  id: string;
  originalName: string;
  normalizedName: string;
  categoryType: CategoryType;
  parentCategoryId: string;
  reviewStatus: CategoryReviewStatus;
  creatorId: string;
  reviewerId: string;
  canonicalCategoryId: string;
  activityField1Label: string;
  activityField1Placeholder: string;
  activityField1Required: boolean;
  activityField2Label: string;
  activityField2Placeholder: string;
  activityField2Required: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProfessionalSpecialty {
  id: string;
  profileId: string;
  ownerId: string;
  categoryId: string;
  specialtyName: string;
  publicationStatus: PublicationStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProfessionalService {
  id: string;
  profileId: string;
  ownerId: string;
  serviceName: string;
  description: string;
  conditions: string;
  price: number;
  hasFixedPrice: boolean;
  deliveryMethod: ServiceDeliveryMethod;
  availabilityStatus: AvailabilityStatus;
  publicationStatus: PublicationStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProfessionalMedia {
  id: string;
  profileId: string;
  ownerId: string;
  fileType: MediaFileType;
  caption: string;
  storageRef: string;
  uploadStatus: MediaUploadStatus;
  publicationStatus: PublicationStatus;
  viewsCount?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AvailabilitySchedule {
  id: string;
  profileId: string;
  ownerId: string;
  dayOfWeek: number;
  dayLabel: string;
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
  notes: string;
  publicationStatus: PublicationStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CompanyCategory {
  id: string;
  originalName: string;
  name?: string;
  normalizedName: string;
  entityType?: CompanyEntityType | 'all';
  reviewStatus: CategoryReviewStatus;
  creatorId: string;
  subcategories?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CompanyProfile {
  id: string;
  ownerId: string;
  entityType: CompanyEntityType;
  officialName: string;
  displayName: string;
  tradeName?: string;
  legalName?: string;
  nuit: string;
  primaryCategoryId: string;
  primaryCategoryName: string;
  subcategory: string;
  description: string;
  logoUrl: string;
  photoUrl: string;
  videoUrl: string;
  videoViews: number;
  viewsCount: number;
  responsibleName: string;
  responsibleRole: string;
  phone: string;
  whatsapp: string;
  email: string;
  website?: string;
  foundationYear?: number;
  phoneVerified: boolean;
  companyVerified: boolean;
  verificationStatus?: CompanyVerificationStatus;
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
  rejectionReason: string;
  adminNotes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CompanyService {
  id: string;
  companyId: string;
  ownerId: string;
  serviceName: string;
  name?: string;
  description: string;
  conditions: string;
  price: number;
  basePrice?: number;
  hasFixedPrice: boolean;
  deliveryMethod: ServiceDeliveryMethod;
  availabilityStatus: AvailabilityStatus;
  publicationStatus: PublicationStatus;
  displayOrder?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CompanySchedule {
  id: string;
  companyId: string;
  ownerId: string;
  dayOfWeek: number;
  dayLabel: string;
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
  notes: string;
  publicationStatus: PublicationStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CompanyMedia {
  id: string;
  companyId: string;
  ownerId: string;
  fileType: MediaFileType;
  mediaType?: 'image' | 'video';
  caption: string;
  storageRef: string;
  uploadStatus: MediaUploadStatus;
  publicationStatus: PublicationStatus;
  displayOrder?: number;
  viewsCount?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CompanyDocument {
  id: string;
  companyId: string;
  ownerId: string;
  docType: CompanyDocType;
  title: string;
  fileName: string;
  storageRef: string;
  fileHash?: string;
  verificationStatus: CompanyVerificationStatus;
  reviewedByAdminId?: string;
  adminNotes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CompanySearchFilters {
  query: string;
  entityType: CompanyEntityType | 'all';
  categoryId: string;
  province: string;
  district: string;
  neighborhood: string;
  operationalState: OperationalState | 'all';
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  operation: AuditOperation;
  targetCollection: string;
  targetRecordId: string;
  details: string;
  createdAt: Timestamp;
}

export interface SearchFilters {
  query: string;
  profileType: ProfileType | 'all';
  categoryId: string;
  specialtyId: string;
  province: string;
  district: string;
  neighborhood: string;
  coverageAreaType: CoverageAreaType | 'all';
  deliveryMode: DeliveryMode | 'all';
  availabilityStatus: AvailabilityStatus | 'all';
}
