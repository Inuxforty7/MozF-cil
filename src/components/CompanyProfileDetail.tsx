import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Building2,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Edit3,
  Bus,
  Compass,
  ChevronRight,
  ChevronDown,
  Briefcase,
  AlertTriangle,
  Settings,
  Image as ImageIcon,
  Play,
  Eye,
  Film,
  FileText,
  Mail,
  Globe,
  Lock,
} from 'lucide-react';
import {
  CompanyDocument,
  CompanyEntityType,
  CompanyMedia,
  CompanyProfile,
  CompanySchedule,
  CompanyService,
  OperationalState,
} from '../types/mozfacil';
import {
  recordVideoView,
  updateCompanyOperationalState,
  updateSingleCompanyServiceAvailability,
} from '../services/mozfacilService';

interface CompanyProfileDetailProps {
  company: CompanyProfile;
  services: CompanyService[];
  schedules: CompanySchedule[];
  media: CompanyMedia[];
  documents: CompanyDocument[];
  currentUserId?: string | null;
  isAdmin: boolean;
  onBack: () => void;
  onEdit: () => void;
}

export const CompanyProfileDetail: React.FC<CompanyProfileDetailProps> = ({
  company,
  services,
  schedules,
  media,
  documents,
  currentUserId,
  isAdmin,
  onBack,
  onEdit,
}) => {
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [showMapPanel, setShowMapPanel] = useState(false);
  const [showServicesDetail, setShowServicesDetail] = useState(true);
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [showAllDetailsExpanded, setShowAllDetailsExpanded] = useState(false);
  const [isUpdatingState, setIsUpdatingState] = useState(false);
  const [updatingServiceId, setUpdatingServiceId] = useState<string | null>(null);

  // Video presentation playback and live view counter
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [videoViewsCount, setVideoViewsCount] = useState(company.videoViews || 0);
  const hasRecordedVideoViewRef = useRef(false);

  const canManage = Boolean(
    currentUserId && (company.ownerId === currentUserId || isAdmin)
  );

  const entityTypeLabels: Record<CompanyEntityType, string> = {
    private_company: 'Empresa Privada',
    public_institution: 'Instituição Pública',
    state_institution: 'Instituição de Estado',
    ngo: 'ONG / Organização Sem Fins Lucrativos',
    agency: 'Agência / Serviço Público',
  };

  const sortedSchedules = [...schedules].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  const handleToggleOperationalState = async (nextState: OperationalState) => {
    if (!canManage || isUpdatingState) return;
    setIsUpdatingState(true);
    try {
      await updateCompanyOperationalState({
        companyId: company.id,
        operationalState: nextState,
      });
    } finally {
      setIsUpdatingState(false);
    }
  };

  const handleToggleService = async (srv: CompanyService) => {
    if (!canManage || updatingServiceId === srv.id) return;
    setUpdatingServiceId(srv.id);
    try {
      await updateSingleCompanyServiceAvailability({
        serviceId: srv.id,
        availabilityStatus:
          srv.availabilityStatus === 'available' ? 'unavailable' : 'available',
      });
    } finally {
      setUpdatingServiceId(null);
    }
  };

  const handleAccessVideo = async () => {
    setIsPlayingVideo(true);
    if (!hasRecordedVideoViewRef.current) {
      hasRecordedVideoViewRef.current = true;
      setVideoViewsCount((prev) => prev + 1);
      try {
        await recordVideoView({
          collectionName: 'companies',
          docId: company.id,
        });
      } catch (err) {
        console.error('Erro ao registar visualização do vídeo da empresa:', err);
      }
    }
  };

  const handleToggleVerDetalhes = () => {
    const next = !showAllDetailsExpanded;
    setShowAllDetailsExpanded(next);
    setShowServicesDetail(true);
    setShowFullSchedule(next);
    setShowMapPanel(next);
  };

  const cleanWhatsappDigits = (company.whatsapp || company.phone).replace(/\D/g, '');
  const cleanPhoneDigits = company.phone.replace(/[^\d+]/g, '');
  const visiblePhotos = showAllPhotos ? media : media.slice(0, 2);

  return (
    <div className="max-w-2xl w-full mx-auto h-full flex-1 min-h-0 bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col overflow-hidden">
      {/* Structured Mobile Top App Bar (SHRINK-0) */}
      <div className="shrink-0 bg-gradient-to-r from-[#071F4A] via-[#0D316E] to-[#1E4B9B] text-white px-3.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2.5 border-b border-blue-900 shadow-xs">
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
          <span className="text-sm sm:text-base font-black text-white truncate block">
            Perfil da Entidade
          </span>
        </div>

        {canManage ? (
          <button
            type="button"
            onClick={onEdit}
            className="min-h-[36px] sm:min-h-[40px] px-3 py-1 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] active:scale-[0.98] text-white text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-xs shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5 shrink-0" />
            <span>Editar</span>
          </button>
        ) : (
          <div className="w-16 shrink-0" aria-hidden="true" />
        )}
      </div>

      {/* Non-Published Lifecycle Status Notice (Owner / Admin only) */}
      {company.publicationStatus !== 'published' && (
        <div className="shrink-0 px-4 py-2.5 bg-amber-50 border-b border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">
              Estado de Publicação:{' '}
              {company.publicationStatus === 'draft'
                ? 'Rascunho (Não visível no diretório público)'
                : company.publicationStatus === 'pending_review'
                ? 'Pendente de Revisão Administrativa'
                : 'Suspenso pela Moderação'}
            </span>
            {company.adminNotes && (
              <p className="mt-1 text-amber-800 italic">
                Nota da moderação: {company.adminNotes}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main Profile Content (Internal Scrollable Body) */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3.5 sm:p-5 space-y-4">
        {/* Entity Card with Logo, Names, Badges */}
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 border-2 border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.tradeName || company.displayName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="w-10 h-10 text-[#0D316E]" />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="text-lg sm:text-xl font-black text-[#0D316E] leading-tight">
              {company.tradeName || company.displayName}
            </h1>
            <p className="text-xs text-slate-500 font-semibold truncate">{company.legalName || company.officialName}</p>

            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{company.primaryCategoryName}</span>
              </span>

              <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                {entityTypeLabels[company.entityType]}
              </span>

              {(company.verificationStatus === 'verified' || company.companyVerified) && (
                <span className="text-emerald-700 font-extrabold inline-flex items-center gap-1 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verificada</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 pt-0.5">
              {company.nuit && (
                <span className="font-mono font-bold text-slate-700">
                  NUIT: {company.nuit}
                </span>
              )}
              {company.foundationYear && (
                <span className="text-slate-500">
                  Fundação: {company.foundationYear}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-[#0D316E]">
              <MapPin className="w-3.5 h-3.5 text-[#1E4B9B] shrink-0" />
              <span className="truncate">
                {company.neighborhood}, {company.district} · {company.province}
              </span>
            </div>
          </div>
        </div>

        {/* Entity Bio / Description */}
        {company.description && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
            {company.description}
          </div>
        )}

        {/* Photos Gallery */}
        {media.length > 0 && (
          <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#0D316E]">
                <ImageIcon className="w-4 h-4 text-[#1E4B9B]" />
                <span>
                  Fotos da Entidade ({media.length} {media.length === 1 ? 'foto' : 'fotos'})
                </span>
              </div>
              {media.length > 2 && (
                <button
                  type="button"
                  onClick={() => setShowAllPhotos((prev) => !prev)}
                  className="text-xs font-extrabold text-[#1E4B9B] hover:text-[#EA580C] flex items-center gap-0.5"
                >
                  <span>{showAllPhotos ? 'Mostrar menos' : 'Ver todas'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {visiblePhotos.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl overflow-hidden border border-slate-200 h-28 sm:h-36 bg-slate-100 relative"
                >
                  <img
                    src={m.storageRef}
                    alt={m.caption}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {m.caption && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 text-[10px] text-white font-semibold truncate">
                      {m.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* VÍDEO DE APRESENTAÇÃO COM CONTABILIZAÇÃO DE VISUALIZAÇÕES         */}
        {/* ================================================================= */}
        {company.videoUrl && (
          <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#0D316E]">
                <Film className="w-4 h-4 text-[#1E4B9B]" />
                <span>Vídeo Institucional / Apresentação</span>
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold">
                <Eye className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>
                  {videoViewsCount}{' '}
                  {videoViewsCount === 1 ? 'visualização' : 'visualizações'}
                </span>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 relative aspect-video flex items-center justify-center">
              {isPlayingVideo ? (
                company.videoUrl.includes('youtube.com') || company.videoUrl.includes('youtu.be') ? (
                  <iframe
                    src={
                      company.videoUrl.includes('watch?v=')
                        ? company.videoUrl.replace('watch?v=', 'embed/')
                        : company.videoUrl
                    }
                    title="Vídeo Institucional"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={company.videoUrl}
                    controls
                    autoPlay
                    onPlay={handleAccessVideo}
                    className="w-full h-full object-contain"
                  >
                    O seu navegador não suporta a reprodução deste vídeo.
                  </video>
                )
              ) : (
                <button
                  type="button"
                  onClick={handleAccessVideo}
                  className="w-full h-full flex flex-col items-center justify-center gap-2 group p-4 text-center cursor-pointer relative"
                >
                  <div className="w-14 h-14 rounded-full bg-[#EA580C] group-hover:bg-[#C2410C] text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                    <Play className="w-7 h-7 fill-white translate-x-0.5" />
                  </div>
                  <span className="text-white text-xs sm:text-sm font-extrabold drop-shadow-md">
                    Reproduzir Apresentação Institucional
                  </span>
                  <span className="text-slate-300 text-[11px]">
                    Toque para assistir e contabilizar visualização em direto
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Primary Contact & Map Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <a
            href={`https://wa.me/${cleanWhatsappDigits}`}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[46px] rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition-all"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span>Chat Grátis</span>
          </a>

          <a
            href={`tel:${cleanPhoneDigits}`}
            className="min-h-[46px] rounded-xl bg-[#0D316E] hover:bg-[#092452] active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition-all"
          >
            <Phone className="w-4 h-4 shrink-0" />
            <span>Ligar</span>
          </a>

          <button
            type="button"
            onClick={() => setShowMapPanel((prev) => !prev)}
            className="min-h-[46px] rounded-xl bg-white border-2 border-[#1E4B9B] hover:bg-blue-50 active:scale-[0.98] text-[#0D316E] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all"
          >
            <MapPin className="w-4 h-4 text-[#1E4B9B] shrink-0" />
            <span>Ver no mapa</span>
          </button>
        </div>

        {/* Additional Contact Links if provided */}
        {(company.email || company.website) && (
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            {company.email && (
              <a
                href={`mailto:${company.email}`}
                className="inline-flex items-center gap-1.5 text-[#0D316E] hover:underline font-semibold"
              >
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{company.email}</span>
              </a>
            )}
            {company.website && (
              <a
                href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#0D316E] hover:underline font-semibold"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>{company.website}</span>
              </a>
            )}
          </div>
        )}

        {/* Map & GPS panel */}
        {showMapPanel && (
          <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 space-y-2 text-xs">
            <div className="font-extrabold text-[#0D316E] flex items-center justify-between">
              <span>Localização e Coordenadas GPS</span>
              <span className="font-semibold text-slate-600">
                {company.hasGps ? 'GPS validado' : 'Endereço escrito'}
              </span>
            </div>
            <p className="text-slate-700">
              <strong>Endereço completo:</strong>{' '}
              {company.streetOrReference ? `${company.streetOrReference}, ` : ''}
              Bairro {company.neighborhood}, {company.district}, {company.province}
            </p>
            {company.hasGps && company.latitude && company.longitude ? (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="font-mono text-slate-700">
                  Lat: {company.latitude} | Lng: {company.longitude}
                </span>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${company.latitude}&mlon=${company.longitude}#map=16/${company.latitude}/${company.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-[#0D316E] text-white font-bold hover:bg-[#092452]"
                >
                  Abrir Mapa Interativo (OpenStreetMap)
                </a>
              </div>
            ) : (
              <p className="text-slate-600">
                Localização registada ({company.neighborhood}, {company.district},{' '}
                {company.province}).
              </p>
            )}
          </div>
        )}

        {/* Operational State Bar */}
        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Settings className="w-4 h-4 text-[#1E4B9B] shrink-0" />
            <span className="text-xs font-extrabold text-[#0D316E]">
              Estado operacional:
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold inline-flex items-center gap-1 ${
                company.operationalState === 'on'
                  ? 'bg-emerald-600 text-white'
                  : company.operationalState === 'off'
                  ? 'bg-slate-600 text-white'
                  : 'bg-red-600 text-white'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>{company.operationalState.toUpperCase()}</span>
            </span>
            <span className="text-xs font-semibold text-slate-700">
              {company.operationalState === 'on'
                ? 'Em atendimento'
                : company.operationalState === 'off'
                ? 'Fechado no momento'
                : 'Parado temporariamente'}
            </span>
          </div>

          {canManage && (
            <div className="flex items-center gap-1">
              {(['on', 'off', 'stop'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  disabled={isUpdatingState}
                  onClick={() => handleToggleOperationalState(st)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase transition-colors ${
                    company.operationalState === st
                      ? 'bg-[#0D316E] text-white'
                      : 'bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Structured Rows: Address, Nearest Stop, Coverage */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-200 overflow-hidden">
          <div className="p-3.5 flex items-center justify-between gap-3 text-left">
            <div className="flex items-start gap-3 min-w-0">
              <MapPin className="w-5 h-5 text-[#1E4B9B] shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm min-w-0">
                <span className="font-extrabold text-[#0D316E]">Sede / Endereço: </span>
                <span className="text-slate-700">
                  {company.streetOrReference ? `${company.streetOrReference}, ` : ''}
                  {company.neighborhood}, {company.district} · {company.province}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 flex items-center justify-between gap-3 text-left">
            <div className="flex items-start gap-3 min-w-0">
              <Bus className="w-5 h-5 text-[#1E4B9B] shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm min-w-0">
                <span className="font-extrabold text-[#0D316E]">Paragem mais próxima: </span>
                <span className="text-slate-700">
                  {company.nearestStop || `Bairro ${company.neighborhood}`}
                </span>
              </div>
            </div>
          </div>

          {/* Operating hours */}
          <div className="divide-y divide-slate-100">
            <button
              type="button"
              onClick={() => setShowFullSchedule((prev) => !prev)}
              className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <Clock className="w-5 h-5 text-[#1E4B9B] shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm min-w-0">
                  <span className="font-extrabold text-[#0D316E]">
                    Horário de funcionamento:{' '}
                  </span>
                  <span className="text-slate-700">{company.workingDaysSummary}</span>
                </div>
              </div>
              {showFullSchedule ? (
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              )}
            </button>

            {showFullSchedule && sortedSchedules.length > 0 && (
              <div className="p-3.5 bg-slate-50 space-y-1.5 text-xs">
                {sortedSchedules.map((s) => (
                  <div key={s.id} className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">{s.dayLabel}</span>
                    {s.isOpen ? (
                      <span className="font-mono text-emerald-700 font-bold">
                        {s.openingTime} – {s.closingTime}
                      </span>
                    ) : (
                      <span className="text-slate-400">Encerrado</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Services / Departments Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowServicesDetail((prev) => !prev)}
            className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#1E4B9B]" />
              <span className="font-extrabold text-[#0D316E] text-xs sm:text-sm">
                Serviços e Departamentos ({services.length})
              </span>
            </div>
            {showServicesDetail ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showServicesDetail && (
            <div className="p-3.5 space-y-2 bg-slate-50/50">
              {services.length > 0 ? (
                services.map((srv) => (
                  <div
                    key={srv.id}
                    className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-[#0D316E] text-xs sm:text-sm">
                        {srv.name || srv.serviceName}
                      </h4>
                      {srv.description && (
                        <p className="text-xs text-slate-600 line-clamp-1">{srv.description}</p>
                      )}
                      {(srv.basePrice || srv.price) ? (
                        <span className="text-[11px] font-bold text-emerald-700 mt-0.5 inline-block">
                          {srv.basePrice || srv.price} MT
                        </span>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      disabled={!canManage || updatingServiceId === srv.id}
                      onClick={() => handleToggleService(srv)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold shrink-0 transition-opacity ${
                        srv.availabilityStatus === 'available'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-400 text-white'
                      } ${canManage ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}`}
                    >
                      {srv.availabilityStatus === 'available' ? 'ON' : 'OFF'}
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 py-2">
                  Nenhum serviço ou departamento individual registado neste perfil.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Documentos & Informação Institucional */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#0D316E]">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Verificação e Conformidade</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-1.5">
              <CheckCircle2
                className={`w-4 h-4 shrink-0 ${
                  company.phoneVerified ? 'text-emerald-600' : 'text-slate-400'
                }`}
              />
              <div className="min-w-0">
                <div className="font-extrabold text-[#0D316E] truncate">Contacto</div>
                <div className="text-[10px] text-slate-500 truncate">
                  {company.phoneVerified ? 'Verificado' : 'Validado'}
                </div>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-1.5">
              <CheckCircle2
                className={`w-4 h-4 shrink-0 ${
                  company.nuit ? 'text-emerald-600' : 'text-slate-400'
                }`}
              />
              <div className="min-w-0">
                <div className="font-extrabold text-[#0D316E] truncate">NUIT</div>
                <div className="text-[10px] text-slate-500 truncate font-mono">
                  {company.nuit}
                </div>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-1.5">
              <CheckCircle2
                className={`w-4 h-4 shrink-0 ${
                  company.verificationStatus === 'verified' || company.companyVerified
                    ? 'text-emerald-600'
                    : 'text-amber-500'
                }`}
              />
              <div className="min-w-0">
                <div className="font-extrabold text-[#0D316E] truncate">Alvará / Registo</div>
                <div className="text-[10px] text-slate-500 truncate">
                  {company.verificationStatus === 'verified' || company.companyVerified
                    ? 'Conformidade'
                    : 'Em Análise'}
                </div>
              </div>
            </div>
          </div>

          {/* Protected Documents Notice (Private to Owner / Admin only) */}
          {canManage && documents.length > 0 && (
            <div className="pt-2 border-t border-slate-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Documentos Privados de Verificação (Visíveis apenas ao Titular e Administrador):</span>
              </div>
              <div className="space-y-1">
                {documents.map((d) => (
                  <div key={d.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-700">{d.title}</span>
                    <span className="text-[10px] uppercase font-bold text-emerald-700">{d.verificationStatus}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleToggleVerDetalhes}
            className="w-full min-h-[42px] py-2 px-4 rounded-xl bg-white border-2 border-[#0D316E] hover:bg-blue-50 text-[#0D316E] font-extrabold text-xs sm:text-sm transition-colors"
          >
            {showAllDetailsExpanded ? 'Ocultar detalhes completos' : 'Ver detalhes'}
          </button>
        </div>
      </div>
    </div>
  );
};
