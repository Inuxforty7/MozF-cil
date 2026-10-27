import React, { useState, useMemo, useEffect } from 'react';
import {
  Shield,
  CheckCircle2,
  XCircle,
  PauseOctagon,
  RefreshCw,
  GitMerge,
  Settings2,
  History,
  FolderKanban,
  Users,
  Eye,
  Plus,
  Building2,
  Landmark,
} from 'lucide-react';
import {
  AuditLog,
  CategoryReviewStatus,
  CompanyCategory,
  CompanyProfile,
  OperationalState,
  PUBLIC_PLACE_CATEGORY_LABELS,
  ProfessionalCategory,
  ProfessionalProfile,
  PublicPlace,
  PublicPlaceCategory,
  PublicPlaceOperationalState,
  PublicPlacePublicationStatus,
  PublicationStatus,
} from '../types/mozfacil';
import {
  adminConfigureCategoryFields,
  adminManageCategory,
  adminManageCompanyCategory,
  adminMergeCategories,
  adminSetCompanyPublicationStatus,
  adminSetProfilePublicationStatus,
  adminUpdatePublicPlace,
  adminVerifyCompany,
  adminVerifyProfessionalContact,
  proposeOrSelectCategory,
} from '../services/mozfacilService';

interface AdminDashboardProps {
  profiles: ProfessionalProfile[];
  categories: ProfessionalCategory[];
  companies?: CompanyProfile[];
  companyCategories?: CompanyCategory[];
  publicPlaces?: PublicPlace[];
  auditLogs: AuditLog[];
  adminId: string;
  adminName: string;
  onInspectProfile: (profileId: string) => void;
  onInspectCompany?: (companyId: string) => void;
}

const PUBLICATION_STATUS_LABELS: Record<PublicationStatus, string> = {
  published: 'Publicado',
  pending_review: 'Pendente de Revisão',
  draft: 'Rascunho',
  rejected: 'Rejeitado',
  suspended: 'Suspenso',
};

const CATEGORY_STATUS_LABELS: Record<CategoryReviewStatus, string> = {
  approved: 'Aprovada',
  pending: 'Proposta Pendente',
  rejected: 'Rejeitada',
  merged: 'Fundida',
};

const OPERATIONAL_STATE_LABELS: Record<OperationalState, string> = {
  on: 'Disponível (ON)',
  off: 'Ocupado / Pausa (OFF)',
  stop: 'Indisponível (STOP)',
};

const AUDIT_OPERATION_LABELS: Record<string, string> = {
  category_created: 'Categoria Proposta / Criada',
  category_proposed: 'Proposta de Categoria',
  category_approved: 'Categoria Aprovada',
  category_renamed: 'Categoria Atualizada',
  category_merged: 'Categorias Fundidas',
  category_rejected: 'Categoria Rejeitada',
  category_fields_configured: 'Campos da Atividade Configurados',
  profile_created: 'Perfil Profissional Criado',
  profile_updated: 'Perfil Profissional Atualizado',
  profile_status_changed: 'Estado do Perfil Alterado',
  contact_verified: 'Verificação de Contacto Atualizada',
  utente_registered: 'Cadastro de Utente Guardado',
  consultation_debit: 'Consulta Direta Realizada (-1 Crédito)',
  consultation_debited: 'Consulta Direta Realizada (-1 Crédito)',
  public_place_created: 'Instituição Pública Registada pela Comunidade',
  public_place_updated: 'Instituição Pública Corrigida pela Administração',
};

const TARGET_COLLECTION_LABELS: Record<string, string> = {
  professional_profiles: 'Perfil Profissional',
  professional_categories: 'Categoria',
  users: 'Conta de Utilizador',
  user_consultations: 'Consulta de Perfil',
  public_places: 'Instituição Pública',
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  profiles,
  categories,
  companies = [],
  companyCategories = [],
  publicPlaces = [],
  auditLogs,
  adminId,
  adminName,
  onInspectProfile,
  onInspectCompany,
}) => {
  const [activeTab, setActiveTab] = useState<
    'profiles' | 'companies' | 'public_places' | 'categories' | 'custom_fields' | 'audit_logs'
  >('profiles');

  // Public Institutions tab state
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);
  const [placeForm, setPlaceForm] = useState<{
    placeName: string;
    placeCategory: PublicPlaceCategory;
    province: string;
    district: string;
    locality: string;
    neighborhood: string;
    streetOrAvenue: string;
    nearestChapaStop: string;
    nearbyInstitutions: string;
    referenceDescription: string;
    secretaryPhone: string;
    operationalState: PublicPlaceOperationalState;
    latitude: number;
    longitude: number;
    hasGps: boolean;
    gpsAccuracyMeters: number;
    photoUrl: string;
    publicationStatus: PublicPlacePublicationStatus;
  } | null>(null);
  const [busyPlaceId, setBusyPlaceId] = useState<string | null>(null);

  // Companies tab state
  const [companyStatusFilter, setCompanyStatusFilter] = useState<PublicationStatus | 'all'>('all');
  const [companyRejectionNotes, setCompanyRejectionNotes] = useState<Record<string, string>>({});
  const [busyCompanyId, setBusyCompanyId] = useState<string | null>(null);

  // Profiles tab state
  const [statusFilter, setStatusFilter] = useState<PublicationStatus | 'all'>('all');
  const [rejectionNotes, setRejectionNotes] = useState<Record<string, string>>({});
  const [busyProfileId, setBusyProfileId] = useState<string | null>(null);

  // Categories tab state
  const [catFilter, setCatFilter] = useState<CategoryReviewStatus | 'all'>('all');
  const [catSearchQuery, setCatSearchQuery] = useState('');
  const [editingCatNames, setEditingCatNames] = useState<Record<string, string>>({});
  const [mergeSourceId, setMergeSourceId] = useState<string>('');
  const [mergeTargetId, setMergeTargetId] = useState<string>('');
  const [newAdminCatName, setNewAdminCatName] = useState('');
  const [newAdminCatType, setNewAdminCatType] = useState<'profession' | 'specialty'>('profession');
  const [catFeedback, setCatFeedback] = useState<string | null>(null);
  const [isBusyCat, setIsBusyCat] = useState(false);

  // Audit logs filter state
  const [auditOpFilter, setAuditOpFilter] = useState<string>('all');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');

  // Activity-specific fields configuration state
  const professionCategories = useMemo(
    () => categories.filter((c) => c.categoryType === 'profession' && c.reviewStatus !== 'merged'),
    [categories]
  );
  const [selectedConfigCatId, setSelectedConfigCatId] = useState<string>(
    professionCategories[0]?.id || ''
  );

  useEffect(() => {
    if (!selectedConfigCatId && professionCategories.length > 0) {
      const first = professionCategories[0];
      setSelectedConfigCatId(first.id);
      setF1Label(first.activityField1Label || '');
      setF1Placeholder(first.activityField1Placeholder || '');
      setF1Required(first.activityField1Required || false);
      setF2Label(first.activityField2Label || '');
      setF2Placeholder(first.activityField2Placeholder || '');
      setF2Required(first.activityField2Required || false);
    }
  }, [professionCategories, selectedConfigCatId]);

  const selectedConfigCat = useMemo(
    () => professionCategories.find((c) => c.id === selectedConfigCatId) || null,
    [professionCategories, selectedConfigCatId]
  );

  const [f1Label, setF1Label] = useState(selectedConfigCat?.activityField1Label || '');
  const [f1Placeholder, setF1Placeholder] = useState(
    selectedConfigCat?.activityField1Placeholder || ''
  );
  const [f1Required, setF1Required] = useState(
    selectedConfigCat?.activityField1Required || false
  );
  const [f2Label, setF2Label] = useState(selectedConfigCat?.activityField2Label || '');
  const [f2Placeholder, setF2Placeholder] = useState(
    selectedConfigCat?.activityField2Placeholder || ''
  );
  const [f2Required, setF2Required] = useState(
    selectedConfigCat?.activityField2Required || false
  );

  const handleSelectConfigCategory = (catId: string) => {
    setSelectedConfigCatId(catId);
    const found = professionCategories.find((c) => c.id === catId);
    if (found) {
      setF1Label(found.activityField1Label || '');
      setF1Placeholder(found.activityField1Placeholder || '');
      setF1Required(found.activityField1Required || false);
      setF2Label(found.activityField2Label || '');
      setF2Placeholder(found.activityField2Placeholder || '');
      setF2Required(found.activityField2Required || false);
    }
  };

  // Real-time counters by profile status
  const profileCounts = useMemo(() => {
    return {
      all: profiles.length,
      pending_review: profiles.filter((p) => p.publicationStatus === 'pending_review').length,
      published: profiles.filter((p) => p.publicationStatus === 'published').length,
      draft: profiles.filter((p) => p.publicationStatus === 'draft').length,
      rejected: profiles.filter((p) => p.publicationStatus === 'rejected').length,
      suspended: profiles.filter((p) => p.publicationStatus === 'suspended').length,
    };
  }, [profiles]);

  // Real-time counters by category review status
  const categoryCounts = useMemo(() => {
    return {
      all: categories.length,
      pending: categories.filter((c) => c.reviewStatus === 'pending').length,
      approved: categories.filter((c) => c.reviewStatus === 'approved').length,
      rejected: categories.filter((c) => c.reviewStatus === 'rejected').length,
      merged: categories.filter((c) => c.reviewStatus === 'merged').length,
    };
  }, [categories]);

  // Count associated professional profiles per category (primary category or specialty)
  const categoryProfileCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of categories) {
      counts[cat.id] = 0;
    }
    for (const prof of profiles) {
      if (prof.primaryCategoryId) {
        counts[prof.primaryCategoryId] = (counts[prof.primaryCategoryId] || 0) + 1;
      }
      if (Array.isArray(prof.specialtyIds)) {
        for (const sid of prof.specialtyIds) {
          if (sid && sid !== prof.primaryCategoryId) {
            counts[sid] = (counts[sid] || 0) + 1;
          }
        }
      }
    }
    return counts;
  }, [categories, profiles]);

  const filteredProfiles = useMemo(() => {
    if (statusFilter === 'all') return profiles;
    return profiles.filter((p) => p.publicationStatus === statusFilter);
  }, [profiles, statusFilter]);

  const filteredCategories = useMemo(() => {
    const q = catSearchQuery.trim().toLowerCase();
    return categories.filter((c) => {
      if (catFilter !== 'all' && c.reviewStatus !== catFilter) return false;
      if (q && !c.originalName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [categories, catFilter, catSearchQuery]);

  const filteredAuditLogs = useMemo(() => {
    const q = auditSearchQuery.trim().toLowerCase();
    return auditLogs.filter((log) => {
      if (auditOpFilter !== 'all' && log.operation !== auditOpFilter) return false;
      if (
        q &&
        !log.details.toLowerCase().includes(q) &&
        !log.actorName.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [auditLogs, auditOpFilter, auditSearchQuery]);

  const handleProfileStatusAction = async (
    profile: ProfessionalProfile,
    newStatus: PublicationStatus
  ) => {
    const note = (rejectionNotes[profile.id] ?? profile.rejectionReason ?? '').trim();
    if ((newStatus === 'rejected' || newStatus === 'draft') && !note) {
      setCatFeedback(
        `Por favor, indique o motivo da rejeição ou pedido de correção no campo de nota do perfil "${profile.displayName}" antes de continuar.`
      );
      return;
    }

    setBusyProfileId(profile.id);
    setCatFeedback(null);
    try {
      await adminSetProfilePublicationStatus({
        profile,
        newStatus,
        rejectionReason: note,
        adminId,
        adminName,
      });
      setCatFeedback(
        `Estado do perfil "${profile.displayName}" alterado para ${PUBLICATION_STATUS_LABELS[newStatus]}.`
      );
    } catch (err) {
      setCatFeedback(
        err instanceof Error ? err.message : 'Não foi possível alterar o estado do perfil.'
      );
    } finally {
      setBusyProfileId(null);
    }
  };

  const filteredCompanies = useMemo(() => {
    if (companyStatusFilter === 'all') return companies;
    return companies.filter((c) => c.publicationStatus === companyStatusFilter);
  }, [companies, companyStatusFilter]);

  const companyCounts = useMemo(() => {
    return {
      all: companies.length,
      pending_review: companies.filter((c) => c.publicationStatus === 'pending_review').length,
      published: companies.filter((c) => c.publicationStatus === 'published').length,
      draft: companies.filter((c) => c.publicationStatus === 'draft').length,
      rejected: companies.filter((c) => c.publicationStatus === 'rejected').length,
      suspended: companies.filter((c) => c.publicationStatus === 'suspended').length,
    };
  }, [companies]);

  const handleCompanyPublicationStatus = async (
    companyId: string,
    newStatus: PublicationStatus
  ) => {
    const notes = companyRejectionNotes[companyId]?.trim();
    if ((newStatus === 'rejected' || newStatus === 'suspended') && !notes) {
      alert('É obrigatório indicar uma nota justificativa da moderação.');
      return;
    }
    setBusyCompanyId(companyId);
    try {
      await adminSetCompanyPublicationStatus({
        companyId,
        newStatus,
        adminId,
        adminName,
        rejectionReason: notes,
      });
      setCompanyRejectionNotes((prev) => ({ ...prev, [companyId]: '' }));
    } finally {
      setBusyCompanyId(null);
    }
  };

  const handleVerifyCompany = async (companyId: string, verified: boolean) => {
    setBusyCompanyId(companyId);
    try {
      await adminVerifyCompany({
        companyId,
        companyVerified: verified,
        adminId,
        adminName,
      });
    } finally {
      setBusyCompanyId(null);
    }
  };

  const handleToggleContactVerification = async (profile: ProfessionalProfile) => {
    setBusyProfileId(profile.id);
    setCatFeedback(null);
    try {
      await adminVerifyProfessionalContact({
        profile,
        verified: !profile.phoneVerified,
        adminId,
        adminName,
      });
      setCatFeedback(
        `Contacto do perfil "${profile.displayName}" marcado como ${
          !profile.phoneVerified ? 'verificado' : 'não verificado'
        }.`
      );
    } catch (err) {
      setCatFeedback(
        err instanceof Error ? err.message : 'Não foi possível atualizar a verificação de contacto.'
      );
    } finally {
      setBusyProfileId(null);
    }
  };

  const handleCategoryStatusOrRename = async (
    cat: ProfessionalCategory,
    newStatus: CategoryReviewStatus
  ) => {
    setIsBusyCat(true);
    setCatFeedback(null);
    try {
      const updatedName = editingCatNames[cat.id] ?? cat.originalName;
      await adminManageCategory({
        category: cat,
        newDisplayName: updatedName,
        newReviewStatus: newStatus,
        adminId,
        adminName,
      });
      setCatFeedback(
        `Categoria "${updatedName}" atualizada para "${CATEGORY_STATUS_LABELS[newStatus]}".`
      );
    } catch (err) {
      setCatFeedback(err instanceof Error ? err.message : 'Erro ao atualizar categoria.');
    } finally {
      setIsBusyCat(false);
    }
  };

  const handleMergeDuplicateCategories = async () => {
    if (!mergeSourceId || !mergeTargetId || mergeSourceId === mergeTargetId) {
      setCatFeedback(
        'Selecione uma categoria duplicada de origem e uma categoria oficial de destino diferentes.'
      );
      return;
    }
    const sourceCat = categories.find((c) => c.id === mergeSourceId);
    const targetCat = categories.find((c) => c.id === mergeTargetId);
    if (!sourceCat || !targetCat) return;

    setIsBusyCat(true);
    setCatFeedback(null);
    try {
      const migratedCount = await adminMergeCategories({
        sourceCategory: sourceCat,
        targetCategory: targetCat,
        adminId,
        adminName,
      });
      setCatFeedback(
        `Fusão concluída: "${sourceCat.originalName}" foi unificada em "${targetCat.originalName}" (${migratedCount} registos atualizados).`
      );
      setMergeSourceId('');
    } catch (err) {
      setCatFeedback(err instanceof Error ? err.message : 'Erro ao fundir categorias.');
    } finally {
      setIsBusyCat(false);
    }
  };

  const handleCreateOfficialCategory = async () => {
    if (newAdminCatName.trim().length < 2) return;
    setIsBusyCat(true);
    setCatFeedback(null);
    try {
      const created = await proposeOrSelectCategory({
        rawName: newAdminCatName,
        categoryType: newAdminCatType,
        actorId: adminId,
        actorName: adminName,
        isAdmin: true,
      });
      setNewAdminCatName('');
      setCatFeedback(`Categoria oficial "${created.originalName}" registada e aprovada.`);
    } catch (err) {
      setCatFeedback(err instanceof Error ? err.message : 'Erro ao criar categoria.');
    } finally {
      setIsBusyCat(false);
    }
  };

  const handleSaveCustomFields = async () => {
    if (!selectedConfigCat) return;
    setIsBusyCat(true);
    setCatFeedback(null);
    try {
      await adminConfigureCategoryFields({
        category: selectedConfigCat,
        activityField1Label: f1Label,
        activityField1Placeholder: f1Placeholder,
        activityField1Required: f1Required,
        activityField2Label: f2Label,
        activityField2Placeholder: f2Placeholder,
        activityField2Required: f2Required,
        adminId,
        adminName,
      });
      setCatFeedback(
        `Campos específicos para "${selectedConfigCat.originalName}" guardados com sucesso.`
      );
    } catch (err) {
      setCatFeedback(err instanceof Error ? err.message : 'Erro ao guardar configuração.');
    } finally {
      setIsBusyCat(false);
    }
  };

  const handleStartEditPublicPlace = (place: PublicPlace) => {
    setEditingPlaceId(place.id);
    setPlaceForm({
      placeName: place.placeName,
      placeCategory: place.placeCategory,
      province: place.province,
      district: place.district,
      locality: place.locality || place.neighborhood,
      neighborhood: place.neighborhood,
      streetOrAvenue: place.streetOrAvenue || 'Rua sem nome',
      nearestChapaStop: place.nearestChapaStop || '',
      nearbyInstitutions: place.nearbyInstitutions || '',
      referenceDescription: place.referenceDescription || '',
      secretaryPhone: place.secretaryPhone || '',
      operationalState: place.operationalState || 'on',
      latitude: place.latitude ?? -25.9692,
      longitude: place.longitude ?? 32.5732,
      hasGps: Boolean(place.hasGps),
      gpsAccuracyMeters: place.gpsAccuracyMeters ?? 0,
      photoUrl: place.photoUrl || '',
      publicationStatus: place.publicationStatus,
    });
  };

  const handleSavePublicPlace = async (placeId: string) => {
    if (!placeForm) return;
    setBusyPlaceId(placeId);
    setCatFeedback(null);
    try {
      await adminUpdatePublicPlace({
        placeId,
        placeName: placeForm.placeName,
        placeCategory: placeForm.placeCategory,
        hasGps: placeForm.hasGps,
        latitude: placeForm.latitude,
        longitude: placeForm.longitude,
        gpsAccuracyMeters: placeForm.gpsAccuracyMeters,
        province: placeForm.province,
        district: placeForm.district,
        locality: placeForm.locality,
        neighborhood: placeForm.neighborhood,
        streetOrAvenue: placeForm.streetOrAvenue,
        nearestChapaStop: placeForm.nearestChapaStop,
        nearbyInstitutions: placeForm.nearbyInstitutions,
        referenceDescription: placeForm.referenceDescription,
        secretaryPhone: placeForm.secretaryPhone,
        operationalState: placeForm.operationalState,
        photoUrl: placeForm.photoUrl,
        publicationStatus: placeForm.publicationStatus,
        adminId,
        adminName,
      });
      setEditingPlaceId(null);
      setPlaceForm(null);
      setCatFeedback(`Instituição pública "${placeForm.placeName}" atualizada com sucesso.`);
    } catch (err) {
      setCatFeedback(
        err instanceof Error ? err.message : 'Erro ao atualizar a instituição pública.'
      );
    } finally {
      setBusyPlaceId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#092452] to-[#0D316E] text-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="w-7 h-7 text-[#F97316]" />
            <div>
              <h2 className="text-lg font-extrabold">
                Painel Administrativo — Profissionais e Serviços
              </h2>
              <p className="text-xs text-blue-200">
                Gestão de perfis, catálogo de profissões e especialidades, campos por atividade e histórico de ações.
              </p>
            </div>
          </div>

          {/* Sub-navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#092452]/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('profiles')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'profiles'
                  ? 'bg-[#F97316] text-white'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Perfis ({profiles.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('companies')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'companies'
                  ? 'bg-[#F97316] text-white'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Empresas ({companies.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('public_places')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'public_places'
                  ? 'bg-[#F97316] text-white'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Instituições Públicas ({publicPlaces.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'categories'
                  ? 'bg-[#F97316] text-white'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Categorias ({categories.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('custom_fields')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'custom_fields'
                  ? 'bg-[#F97316] text-white'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Campos por Atividade</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audit_logs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'audit_logs'
                  ? 'bg-[#F97316] text-white'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Histórico ({auditLogs.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Summary Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-4 bg-slate-50 border-b border-slate-200 text-xs">
        <div className="bg-white p-3 rounded-xl border border-slate-200">
          <span className="text-slate-500 block font-semibold">Total de Perfis</span>
          <span className="text-lg font-extrabold text-[#0D316E] tabular-nums">
            {profileCounts.all}
          </span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200">
          <span className="text-slate-500 block font-semibold">Pendentes de Revisão</span>
          <span className="text-lg font-extrabold text-amber-600 tabular-nums">
            {profileCounts.pending_review}
          </span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200">
          <span className="text-slate-500 block font-semibold">Perfis Publicados</span>
          <span className="text-lg font-extrabold text-emerald-700 tabular-nums">
            {profileCounts.published}
          </span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200">
          <span className="text-slate-500 block font-semibold">Rascunhos / Outros</span>
          <span className="text-lg font-extrabold text-slate-700 tabular-nums">
            {profileCounts.draft + profileCounts.rejected + profileCounts.suspended}
          </span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
          <span className="text-slate-500 block font-semibold">Categorias Aprovadas</span>
          <span className="text-lg font-extrabold text-[#0D316E] tabular-nums">
            {categoryCounts.approved} / {categoryCounts.all}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {catFeedback && (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-[#0D316E]">
            {catFeedback}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 1: GESTÃO DE PERFIS PROFISSIONAIS                             */}
        {/* ================================================================= */}
        {activeTab === 'profiles' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
              {(
                [
                  { id: 'all', label: `Todos (${profileCounts.all})` },
                  {
                    id: 'pending_review',
                    label: `Pendentes de Revisão (${profileCounts.pending_review})`,
                  },
                  { id: 'published', label: `Publicados (${profileCounts.published})` },
                  { id: 'draft', label: `Rascunhos (${profileCounts.draft})` },
                  { id: 'rejected', label: `Rejeitados (${profileCounts.rejected})` },
                  { id: 'suspended', label: `Suspensos (${profileCounts.suspended})` },
                ] as const
              ).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                    statusFilter === st.id
                      ? 'bg-white text-[#0D316E] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
              {filteredProfiles.length > 0 ? (
                filteredProfiles.map((prof) => (
                  <div
                    key={prof.id}
                    className="p-4 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-sm text-[#0D316E]">
                          {prof.displayName}
                        </span>
                        <span className="text-xs text-slate-500">
                          · {prof.primaryCategoryName} · {prof.neighborhood}, {prof.district} (
                          {prof.province})
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span>
                          Estado de Publicação:{' '}
                          <strong className="text-[#0D316E]">
                            {PUBLICATION_STATUS_LABELS[prof.publicationStatus] ||
                              prof.publicationStatus}
                          </strong>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          Disponibilidade:{' '}
                          <strong>
                            {OPERATIONAL_STATE_LABELS[prof.operationalState] ||
                              prof.operationalState.toUpperCase()}
                          </strong>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{prof.phone}</span>
                      </div>

                      <div className="pt-1.5 flex items-center gap-2 max-w-md">
                        <input
                          type="text"
                          value={rejectionNotes[prof.id] ?? prof.rejectionReason ?? ''}
                          onChange={(e) =>
                            setRejectionNotes((prev) => ({
                              ...prev,
                              [prof.id]: e.target.value,
                            }))
                          }
                          placeholder="Motivo de rejeição / correção ou nota administrativa..."
                          className="w-full min-h-[42px] px-3.5 py-2 text-xs border border-slate-300 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onInspectProfile(prof.id)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Perfil</span>
                      </button>

                      <button
                        type="button"
                        disabled={busyProfileId === prof.id}
                        onClick={() => handleToggleContactVerification(prof)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-50 ${
                          prof.phoneVerified
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {prof.phoneVerified ? 'Contacto Verificado' : 'Verificar Contacto'}
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={busyProfileId === prof.id}
                        onClick={() => handleProfileStatusAction(prof, 'published')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Aprovar / Publicar</span>
                      </button>

                      <button
                        type="button"
                        disabled={busyProfileId === prof.id}
                        onClick={() => handleProfileStatusAction(prof, 'draft')}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Pedir Correção</span>
                      </button>

                      <button
                        type="button"
                        disabled={busyProfileId === prof.id}
                        onClick={() => handleProfileStatusAction(prof, 'rejected')}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Rejeitar</span>
                      </button>

                      <button
                        type="button"
                        disabled={busyProfileId === prof.id}
                        onClick={() =>
                          handleProfileStatusAction(
                            prof,
                            prof.publicationStatus === 'suspended' ? 'published' : 'suspended'
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                      >
                        <PauseOctagon className="w-3.5 h-3.5" />
                        <span>
                          {prof.publicationStatus === 'suspended' ? 'Reativar' : 'Suspender'}
                        </span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">
                  Nenhum perfil encontrado para este filtro.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB: GESTÃO DE EMPRESAS E INSTITUIÇÕES (MÓDULO 2)                 */}
        {/* ================================================================= */}
        {activeTab === 'companies' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
              {(
                [
                  { id: 'all', label: `Todas (${companyCounts.all})` },
                  {
                    id: 'pending_review',
                    label: `Pendentes de Revisão (${companyCounts.pending_review})`,
                  },
                  { id: 'published', label: `Publicadas (${companyCounts.published})` },
                  { id: 'draft', label: `Rascunhos (${companyCounts.draft})` },
                  { id: 'rejected', label: `Rejeitadas (${companyCounts.rejected})` },
                  { id: 'suspended', label: `Suspensas (${companyCounts.suspended})` },
                ] as const
              ).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setCompanyStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                    companyStatusFilter === st.id
                      ? 'bg-white text-[#0D316E] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
              {filteredCompanies.length > 0 ? (
                filteredCompanies.map((comp) => (
                  <div
                    key={comp.id}
                    className="p-4 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-[#0D316E] text-sm">
                          {comp.tradeName}
                        </span>
                        <span className="text-xs text-slate-500">({comp.legalName})</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            comp.publicationStatus === 'published'
                              ? 'bg-emerald-100 text-emerald-800'
                              : comp.publicationStatus === 'pending_review'
                              ? 'bg-amber-100 text-amber-800'
                              : comp.publicationStatus === 'draft'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {PUBLICATION_STATUS_LABELS[comp.publicationStatus]}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            comp.verificationStatus === 'verified'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {comp.verificationStatus === 'verified' ? 'Alvará Verificado' : 'Alvará Não Verificado'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                        <span>
                          <strong>Categoria:</strong> {comp.primaryCategoryName}
                        </span>
                        <span>
                          <strong>NUIT:</strong> <span className="font-mono">{comp.nuit}</span>
                        </span>
                        <span>
                          <strong>Localização:</strong> {comp.neighborhood}, {comp.district} ({comp.province})
                        </span>
                        <span>
                          <strong>Telefone:</strong> {comp.phone}
                        </span>
                      </div>

                      {comp.adminNotes && (
                        <p className="text-xs text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200 italic">
                          Nota da moderação: {comp.adminNotes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                      <input
                        type="text"
                        value={companyRejectionNotes[comp.id] || ''}
                        onChange={(e) =>
                          setCompanyRejectionNotes((prev) => ({
                            ...prev,
                            [comp.id]: e.target.value,
                          }))
                        }
                        placeholder="Motivo (para rejeitar/suspender)..."
                        className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 w-full sm:w-52"
                      />

                      {onInspectCompany && (
                        <button
                          type="button"
                          onClick={() => onInspectCompany(comp.id)}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0D316E] text-xs font-bold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver</span>
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={busyCompanyId === comp.id}
                        onClick={() => handleCompanyPublicationStatus(comp.id, 'published')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Aprovar</span>
                      </button>

                      <button
                        type="button"
                        disabled={busyCompanyId === comp.id}
                        onClick={() => handleCompanyPublicationStatus(comp.id, 'rejected')}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Rejeitar</span>
                      </button>

                      <button
                        type="button"
                        disabled={busyCompanyId === comp.id}
                        onClick={() => handleVerifyCompany(comp.id, comp.verificationStatus !== 'verified')}
                        className="px-3 py-1.5 rounded-lg bg-[#0D316E] hover:bg-[#092452] text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>{comp.verificationStatus === 'verified' ? 'Revogar Selo' : 'Atestar Alvará'}</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">
                  Nenhuma empresa encontrada para este filtro.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB: GESTÃO E CORREÇÃO DE INSTITUIÇÕES PÚBLICAS                   */}
        {/* ================================================================= */}
        {activeTab === 'public_places' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
              Reveja e corrija os dados das Instituições Públicas mapeadas pela comunidade moçambicana (Denominação, Categoria, GPS, Localização, Rua/Avenida, Pontos de Referência, Contactos da Secretaria e Estado ON/OFF).
            </div>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
              {publicPlaces.length > 0 ? (
                publicPlaces.map((place) => {
                  const isEditing = editingPlaceId === place.id && placeForm !== null;
                  return (
                    <div key={place.id} className="p-4 bg-white space-y-3">
                      {!isEditing ? (
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-extrabold text-sm text-[#0D316E]">
                                {place.placeName}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-orange-100 text-[#C2410C] font-bold text-[10px]">
                                {PUBLIC_PLACE_CATEGORY_LABELS[place.placeCategory] ||
                                  place.placeCategory}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  place.operationalState === 'off'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {place.operationalState === 'off' ? 'OFF' : 'ON'}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  place.publicationStatus === 'published'
                                    ? 'bg-blue-50 text-[#0D316E]'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {place.publicationStatus}
                              </span>
                            </div>

                            <div className="text-xs text-slate-600 space-y-0.5">
                              <div>
                                <strong>Localização:</strong> {place.province} · {place.district} ·{' '}
                                {place.locality} · {place.neighborhood} ({place.streetOrAvenue})
                              </div>
                              <div>
                                <strong>Referências:</strong> Paragem {place.nearestChapaStop} ·{' '}
                                Próximo de: {place.nearbyInstitutions}
                                {place.referenceDescription
                                  ? ` (${place.referenceDescription})`
                                  : ''}
                              </div>
                              <div>
                                <strong>Secretaria:</strong>{' '}
                                {place.secretaryPhone || 'Em branco'} · <strong>GPS:</strong>{' '}
                                {place.hasGps
                                  ? `${place.latitude}, ${place.longitude} (${place.gpsAccuracyMeters}m)`
                                  : 'Não capturado'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEditPublicPlace(place)}
                              className="px-3 py-1.5 rounded-lg bg-[#0D316E] hover:bg-[#092452] text-white text-xs font-bold"
                            >
                              Editar / Corrigir Dados
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div>
                              <label className="block text-[11px] font-bold text-[#0D316E] mb-0.5">
                                1. Denominação
                              </label>
                              <input
                                type="text"
                                value={placeForm.placeName}
                                onChange={(e) =>
                                  setPlaceForm((prev) =>
                                    prev ? { ...prev, placeName: e.target.value } : null
                                  )
                                }
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-[#0D316E] mb-0.5">
                                2. Categoria
                              </label>
                              <select
                                value={placeForm.placeCategory}
                                onChange={(e) =>
                                  setPlaceForm((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          placeCategory: e.target.value as PublicPlaceCategory,
                                        }
                                      : null
                                  )
                                }
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                              >
                                {(
                                  Object.entries(PUBLIC_PLACE_CATEGORY_LABELS) as [
                                    PublicPlaceCategory,
                                    string,
                                  ][]
                                ).map(([k, label]) => (
                                  <option key={k} value={k}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-[#0D316E] mb-0.5">
                                8. Estado do Serviço / Publicação
                              </label>
                              <div className="flex gap-1.5">
                                <select
                                  value={placeForm.operationalState}
                                  onChange={(e) =>
                                    setPlaceForm((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            operationalState: e.target
                                              .value as PublicPlaceOperationalState,
                                          }
                                        : null
                                    )
                                  }
                                  className="flex-1 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                                >
                                  <option value="on">ON (A funcionar)</option>
                                  <option value="off">OFF (Encerrada)</option>
                                </select>
                                <select
                                  value={placeForm.publicationStatus}
                                  onChange={(e) =>
                                    setPlaceForm((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            publicationStatus: e.target
                                              .value as PublicPlacePublicationStatus,
                                          }
                                        : null
                                    )
                                  }
                                  className="flex-1 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                                >
                                  <option value="published">Publicada</option>
                                  <option value="pending_review">Em Revisão</option>
                                  <option value="suspended">Suspensa</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                Província
                              </label>
                              <input
                                type="text"
                                value={placeForm.province}
                                onChange={(e) =>
                                  setPlaceForm((prev) =>
                                    prev ? { ...prev, province: e.target.value } : null
                                  )
                                }
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                Distrito
                              </label>
                              <input
                                type="text"
                                value={placeForm.district}
                                onChange={(e) =>
                                  setPlaceForm((prev) =>
                                    prev ? { ...prev, district: e.target.value } : null
                                  )
                                }
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                Localidade
                              </label>
                              <input
                                type="text"
                                value={placeForm.locality}
                                onChange={(e) =>
                                  setPlaceForm((prev) =>
                                    prev ? { ...prev, locality: e.target.value } : null
                                  )
                                }
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                Bairro
                              </label>
                              <input
                                type="text"
                                value={placeForm.neighborhood}
                                onChange={(e) =>
                                  setPlaceForm((prev) =>
                                    prev ? { ...prev, neighborhood: e.target.value } : null
                                  )
                                }
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                5. Rua / Avenida
                              </label>
                              <input
                                type="text"
                                value={placeForm.streetOrAvenue}
                                onChange={(e) =>
                                  setPlaceForm((prev) =>
                                    prev ? { ...prev, streetOrAvenue: e.target.value } : null
                                  )
                                }
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                6. Paragem de Chapa
                              </label>
                              <input
                                type="text"
                                value={placeForm.nearestChapaStop}
                                onChange={(e) =>
                                  setPlaceForm((prev) =>
                                    prev ? { ...prev, nearestChapaStop: e.target.value } : null
                                  )
                                }
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                6. Instituições Próximas
                              </label>
                              <input
                                type="text"
                                value={placeForm.nearbyInstitutions}
                                onChange={(e) =>
                                  setPlaceForm((prev) =>
                                    prev ? { ...prev, nearbyInstitutions: e.target.value } : null
                                  )
                                }
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                7. Contactos da Secretaria
                              </label>
                              <input
                                type="text"
                                value={placeForm.secretaryPhone}
                                onChange={(e) =>
                                  setPlaceForm((prev) =>
                                    prev ? { ...prev, secretaryPhone: e.target.value } : null
                                  )
                                }
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                3. Latitude
                              </label>
                              <input
                                type="number"
                                step="0.000001"
                                value={placeForm.latitude}
                                onChange={(e) =>
                                  setPlaceForm((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          latitude: Number(e.target.value) || 0,
                                          hasGps: true,
                                        }
                                      : null
                                  )
                                }
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                3. Longitude
                              </label>
                              <input
                                type="number"
                                step="0.000001"
                                value={placeForm.longitude}
                                onChange={(e) =>
                                  setPlaceForm((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          longitude: Number(e.target.value) || 0,
                                          hasGps: true,
                                        }
                                      : null
                                  )
                                }
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                Explicação adicional
                              </label>
                              <input
                                type="text"
                                value={placeForm.referenceDescription}
                                onChange={(e) =>
                                  setPlaceForm((prev) =>
                                    prev
                                      ? { ...prev, referenceDescription: e.target.value }
                                      : null
                                  )
                                }
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPlaceId(null);
                                setPlaceForm(null);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              disabled={busyPlaceId === place.id}
                              onClick={() => handleSavePublicPlace(place.id)}
                              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
                            >
                              Guardar Correções
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">
                  Ainda não existem instituições públicas registadas pela comunidade.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: CATEGORIAS E ESPECIALIDADES DINÂMICAS (RENAME & MERGE)     */}
        {/* ================================================================= */}
        {activeTab === 'categories' && (
          <div className="space-y-5">
            {/* Create Official Category or Merge Duplicates */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Create new category */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h3 className="text-xs font-extrabold text-[#0D316E] flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-[#F97316]" />
                  <span>Adicionar Categoria ou Especialidade Oficial</span>
                </h3>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    value={newAdminCatName}
                    onChange={(e) => setNewAdminCatName(e.target.value)}
                    placeholder="Nome da profissão ou especialidade..."
                    className="w-full sm:flex-1 min-h-[46px] px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl"
                  />
                  <select
                    value={newAdminCatType}
                    onChange={(e) =>
                      setNewAdminCatType(e.target.value as 'profession' | 'specialty')
                    }
                    className="min-h-[46px] px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="profession">Profissão</option>
                    <option value="specialty">Especialidade</option>
                  </select>
                  <button
                    type="button"
                    disabled={isBusyCat}
                    onClick={handleCreateOfficialCategory}
                    className="min-h-[46px] px-4 py-2.5 rounded-xl bg-[#0D316E] text-white text-xs sm:text-sm font-bold hover:bg-[#092452]"
                  >
                    Criar Aprovada
                  </button>
                </div>
              </div>

              {/* Merge duplicate categories */}
              <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200 space-y-3">
                <h3 className="text-xs font-extrabold text-[#0D316E] flex items-center gap-1.5">
                  <GitMerge className="w-4 h-4 text-[#F97316]" />
                  <span>Fundir Categorias Duplicadas (Sem Perda de Perfis)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <select
                    value={mergeSourceId}
                    onChange={(e) => {
                      setMergeSourceId(e.target.value);
                      setMergeTargetId('');
                    }}
                    className="min-h-[46px] px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="">Categoria duplicada (Origem)...</option>
                    {categories
                      .filter((c) => c.reviewStatus !== 'merged')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.originalName} ({c.categoryType === 'profession' ? 'Profissão' : 'Especialidade'} · {categoryProfileCounts[c.id] || 0} perfis)
                        </option>
                      ))}
                  </select>

                  <select
                    value={mergeTargetId}
                    onChange={(e) => setMergeTargetId(e.target.value)}
                    className="min-h-[46px] px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="">Categoria oficial (Destino)...</option>
                    {categories
                      .filter((c) => {
                        if (c.reviewStatus === 'merged' || c.reviewStatus === 'rejected') return false;
                        if (c.id === mergeSourceId) return false;
                        const srcCat = categories.find((s) => s.id === mergeSourceId);
                        if (srcCat && c.categoryType !== srcCat.categoryType) return false;
                        return true;
                      })
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.originalName} ({c.categoryType === 'profession' ? 'Profissão' : 'Especialidade'} · {categoryProfileCounts[c.id] || 0} perfis)
                        </option>
                      ))}
                  </select>

                  <button
                    type="button"
                    disabled={isBusyCat || !mergeSourceId || !mergeTargetId}
                    onClick={handleMergeDuplicateCategories}
                    className="min-h-[46px] px-3.5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold disabled:opacity-50"
                  >
                    Fundir e Migrar Perfis
                  </button>
                </div>
              </div>
            </div>

            {/* Category Status Filter + Search Input */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
                {(
                  [
                    { id: 'all', label: `Todas (${categoryCounts.all})` },
                    {
                      id: 'pending',
                      label: `Propostas Pendentes (${categoryCounts.pending})`,
                    },
                    {
                      id: 'approved',
                      label: `Aprovadas no Catálogo (${categoryCounts.approved})`,
                    },
                    { id: 'rejected', label: `Rejeitadas (${categoryCounts.rejected})` },
                    { id: 'merged', label: `Fundidas (${categoryCounts.merged})` },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setCatFilter(st.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                      catFilter === st.id
                        ? 'bg-white text-[#0D316E] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={catSearchQuery}
                onChange={(e) => setCatSearchQuery(e.target.value)}
                placeholder="Pesquisar categoria ou duplicada..."
                className="min-w-[230px] min-h-[44px] px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#F97316]"
              />
            </div>

            {/* Categories Table */}
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={editingCatNames[cat.id] ?? cat.originalName}
                          onChange={(e) =>
                            setEditingCatNames((prev) => ({
                              ...prev,
                              [cat.id]: e.target.value,
                            }))
                          }
                          className="min-h-[42px] px-3 py-1.5 text-sm font-bold text-[#0D316E] border border-slate-300 rounded-xl bg-white"
                        />
                        <span className="text-xs text-slate-600">
                          · Tipo:{' '}
                          <strong>
                            {cat.categoryType === 'profession' ? 'Profissão' : 'Especialidade'}
                          </strong>{' '}
                          · Estado:{' '}
                          <strong className="text-[#0D316E]">
                            {CATEGORY_STATUS_LABELS[cat.reviewStatus] || cat.reviewStatus}
                          </strong>{' '}
                          · Perfis associados:{' '}
                          <strong className="text-slate-900 tabular-nums">
                            {categoryProfileCounts[cat.id] || 0}
                          </strong>
                        </span>
                      </div>
                      {cat.canonicalCategoryId && (
                        <div className="text-xs text-orange-700 font-semibold">
                          Unificada com a categoria oficial selecionada.
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isBusyCat}
                        onClick={() => handleCategoryStatusOrRename(cat, 'approved')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                      >
                        Guardar / Aprovar
                      </button>
                      <button
                        type="button"
                        disabled={isBusyCat}
                        onClick={() => handleCategoryStatusOrRename(cat, 'rejected')}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                      >
                        Rejeitar
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">
                  Nenhuma categoria encontrada para este filtro.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: CONFIGURAÇÃO DE CAMPOS ESPECÍFICOS POR ATIVIDADE           */}
        {/* ================================================================= */}
        {activeTab === 'custom_fields' && (
          <div className="max-w-2xl space-y-4">
            <p className="text-xs text-slate-600">
              Configure campos adicionais específicos para qualquer profissão para enriquecer as fichas dos profissionais.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#0D316E] mb-1.5">
                Selecionar Profissão a Configurar
              </label>
              <select
                value={selectedConfigCatId}
                onChange={(e) => handleSelectConfigCategory(e.target.value)}
                className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl"
              >
                {professionCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.originalName}
                  </option>
                ))}
              </select>
            </div>

            {selectedConfigCat && (
              <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="space-y-2.5">
                  <h4 className="text-xs font-extrabold text-[#0D316E]">
                    Campo Específico 1 da Atividade
                  </h4>
                  <input
                    type="text"
                    value={f1Label}
                    onChange={(e) => setF1Label(e.target.value)}
                    placeholder="Título do Campo 1 (ex: Tipos de Viaturas Atendidas)"
                    className="w-full min-h-[48px] h-12 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl"
                  />
                  <input
                    type="text"
                    value={f1Placeholder}
                    onChange={(e) => setF1Placeholder(e.target.value)}
                    placeholder="Texto de exemplo / ajuda"
                    className="w-full min-h-[48px] h-12 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl"
                  />
                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={f1Required}
                      onChange={(e) => setF1Required(e.target.checked)}
                    />
                    <span>Obrigatório para publicar perfis nesta categoria</span>
                  </label>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-slate-200">
                  <h4 className="text-xs font-extrabold text-[#0D316E]">
                    Campo Específico 2 da Atividade
                  </h4>
                  <input
                    type="text"
                    value={f2Label}
                    onChange={(e) => setF2Label(e.target.value)}
                    placeholder="Título do Campo 2 (ex: Serviço de Reboque / Socorro)"
                    className="w-full min-h-[48px] h-12 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl"
                  />
                  <input
                    type="text"
                    value={f2Placeholder}
                    onChange={(e) => setF2Placeholder(e.target.value)}
                    placeholder="Texto de exemplo / ajuda"
                    className="w-full min-h-[48px] h-12 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl"
                  />
                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={f2Required}
                      onChange={(e) => setF2Required(e.target.checked)}
                    />
                    <span>Obrigatório para publicar perfis nesta categoria</span>
                  </label>
                </div>

                <button
                  type="button"
                  disabled={isBusyCat}
                  onClick={handleSaveCustomFields}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl bg-[#0D316E] hover:bg-[#092452] text-white text-xs sm:text-sm font-bold"
                >
                  Guardar Configuração da Atividade
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: HISTÓRICO DE ATIVIDADE E REGISTOS                          */}
        {/* ================================================================= */}
        {activeTab === 'audit_logs' && (
          <div className="space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <select
                value={auditOpFilter}
                onChange={(e) => setAuditOpFilter(e.target.value)}
                className="min-h-[44px] px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl font-bold text-[#0D316E]"
              >
                <option value="all">Todas as Operações ({auditLogs.length})</option>
                <option value="profile_created">Perfis Criados</option>
                <option value="profile_updated">Perfis Atualizados</option>
                <option value="profile_status_changed">Alterações de Estado Admin</option>
                <option value="contact_verified">Verificações de Contacto</option>
                <option value="category_created">Categorias Propostas / Criadas</option>
                <option value="category_approved">Categorias Aprovadas</option>
                <option value="category_merged">Categorias Fundidas</option>
                <option value="consultation_debit">Consultas Debitadas (-1 Crédito)</option>
                <option value="utente_registered">Cadastros de Utente</option>
              </select>

              <input
                type="text"
                value={auditSearchQuery}
                onChange={(e) => setAuditSearchQuery(e.target.value)}
                placeholder="Filtrar por utilizador ou detalhe..."
                className="min-w-[230px] min-h-[44px] px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#F97316]"
              />
            </div>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
              {filteredAuditLogs.length > 0 ? (
                filteredAuditLogs.map((log) => (
                  <div key={log.id} className="p-3.5 bg-white space-y-1 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-[#0D316E]">
                        {AUDIT_OPERATION_LABELS[log.operation] || log.operation} · {log.actorName}
                      </span>
                      <span className="font-mono text-slate-500 tabular-nums">
                        {log.createdAt?.toDate
                          ? log.createdAt.toDate().toLocaleString('pt-MZ')
                          : 'Recente'}
                      </span>
                    </div>
                    <p className="text-slate-700">{log.details}</p>
                    <span className="text-[11px] text-slate-500">
                      Secção: {TARGET_COLLECTION_LABELS[log.targetCollection] || 'Registo'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">
                  Nenhum registo de atividade encontrado para o filtro selecionado.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
