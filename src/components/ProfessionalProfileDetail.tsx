import React, { useState } from 'react';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Edit3,
  Wrench,
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
} from 'lucide-react';
import {
  AvailabilitySchedule,
  OperationalState,
  ProfessionalMedia,
  ProfessionalProfile,
  ProfessionalService,
} from '../types/mozfacil';
import {
  recordVideoView,
  updateProfileOperationalState,
  updateSingleServiceAvailability,
} from '../services/mozfacilService';

interface ProfessionalProfileDetailProps {
  profile: ProfessionalProfile;
  services: ProfessionalService[];
  schedules: AvailabilitySchedule[];
  media: ProfessionalMedia[];
  currentUserId?: string | null;
  isAdmin: boolean;
  onBack: () => void;
  onEdit: () => void;
}

export const ProfessionalProfileDetail: React.FC<ProfessionalProfileDetailProps> = ({
  profile,
  services,
  schedules,
  media,
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
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [videoViewsCount, setVideoViewsCount] = useState(profile.videoViews || 0);
  const hasRecordedVideoViewRef = React.useRef(false);

  const videoItem =
    media.find((m) => m.fileType === 'video') ||
    (profile.videoUrl
      ? {
          id: 'video-main',
          storageRef: profile.videoUrl,
          fileType: 'video' as const,
          caption: 'Vídeo de Apresentação / Demonstração dos Serviços',
        }
      : null);

  const handleAccessVideo = async () => {
    setIsPlayingVideo(true);
    if (!hasRecordedVideoViewRef.current) {
      hasRecordedVideoViewRef.current = true;
      setVideoViewsCount((prev) => prev + 1);
      try {
        await recordVideoView({
          collectionName: 'professional_profiles',
          docId: profile.id,
        });
      } catch (err) {
        console.error('Erro ao registar visualização do vídeo:', err);
      }
    }
  };

  const canManage = Boolean(
    currentUserId && (profile.ownerId === currentUserId || isAdmin)
  );

  const sortedSchedules = [...schedules].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  const profileTypeLabel =
    profile.profileType === 'independent'
      ? 'Profissional Independente'
      : profile.profileType === 'service_provider'
      ? 'Prestador de Serviços'
      : 'Vendedor Ambulante / Móvel';

  const deliveryModeLabel =
    profile.deliveryMode === 'customer_location'
      ? 'Atendimento ao Domicílio do Cliente'
      : profile.deliveryMode === 'professional_location'
      ? 'Atendimento no Local do Profissional'
      : profile.deliveryMode === 'both'
      ? 'Atendimento no Local e ao Domicílio'
      : 'Atendimento em Rota Móvel / Ambulante';

  const handleToggleOperationalState = async (nextState: OperationalState) => {
    if (!canManage || isUpdatingState) return;
    setIsUpdatingState(true);
    try {
      await updateProfileOperationalState({
        profileId: profile.id,
        operationalState: nextState,
      });
    } finally {
      setIsUpdatingState(false);
    }
  };

  const handleToggleService = async (srv: ProfessionalService) => {
    if (!canManage || updatingServiceId === srv.id) return;
    setUpdatingServiceId(srv.id);
    try {
      await updateSingleServiceAvailability({
        serviceId: srv.id,
        availabilityStatus:
          srv.availabilityStatus === 'available' ? 'unavailable' : 'available',
      });
    } finally {
      setUpdatingServiceId(null);
    }
  };

  const handleToggleVerDetalhes = () => {
    const next = !showAllDetailsExpanded;
    setShowAllDetailsExpanded(next);
    setShowServicesDetail(true);
    setShowFullSchedule(next);
    setShowMapPanel(next);
  };

  const cleanWhatsappDigits = (profile.whatsapp || profile.phone).replace(/\D/g, '');
  const cleanPhoneDigits = profile.phone.replace(/[^\d+]/g, '');
  const visiblePhotos = showAllPhotos ? media : media.slice(0, 2);

  return (
    <div className="max-w-2xl w-full mx-auto h-full flex-1 min-h-0 bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col overflow-hidden">
      {/* ================================================================= */}
      {/* STRUCTURED MOBILE TOP APP BAR (SHRINK-0)                          */}
      {/* ================================================================= */}
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
            Perfil do Profissional
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
      {profile.publicationStatus !== 'published' && (
        <div className="shrink-0 px-4 py-2.5 bg-amber-50 border-b border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">
              Estado de Publicação:{' '}
              {profile.publicationStatus === 'draft'
                ? 'Rascunho (Não visível na pesquisa pública)'
                : profile.publicationStatus === 'pending_review'
                ? 'Pendente de Revisão Administrativa'
                : profile.publicationStatus === 'rejected'
                ? 'Rejeitado / Necessita Correção'
                : 'Suspenso pelo Administrador'}
            </span>
            {profile.rejectionReason && (
              <p className="mt-0.5 text-red-700 font-medium">
                Nota administrativa: {profile.rejectionReason}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3.5 sm:p-5 space-y-4 bg-[#F8FAFC]">
        {/* ================================================================= */}
        {/* PROFILE HEADER CARD MATCHING REFERENCE PRINT                      */}
        {/* ================================================================= */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-start gap-3.5">
          {/* Circular Avatar with Blue Ring */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-3 border-[#1E4B9B] bg-[#EBF3FF] flex flex-col items-center justify-center overflow-hidden shrink-0 shadow-xs">
            {profile.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={profile.displayName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-2">
                <Briefcase className="w-7 h-7 text-[#0D316E] mx-auto" />
                <span className="text-[9px] font-extrabold text-[#0D316E] block mt-0.5 truncate max-w-[68px]">
                  {profile.primaryCategoryName}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <h1 className="text-lg sm:text-xl font-extrabold text-[#0D316E] leading-tight">
              {profile.displayName}
            </h1>

            {/* Category Badge in Green + Profile Type */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{profile.primaryCategoryName}</span>
              </span>

              <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                {profileTypeLabel}
              </span>
            </div>

            {/* Verified & Experience Row */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              {profile.phoneVerified && (
                <span className="text-emerald-700 font-extrabold inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verificado</span>
                </span>
              )}
              {profile.nuit && (
                <span className="font-mono font-semibold text-slate-700">
                  NUIT {profile.nuit}
                </span>
              )}
              <span className="font-semibold text-slate-600 tabular-nums">
                {profile.experienceYears}{' '}
                {profile.experienceYears === 1 ? 'ano' : 'anos'} exp.
              </span>
            </div>

            {profile.specialtyNames.length > 0 && (
              <div className="text-xs text-slate-600">
                <span className="font-bold text-[#0D316E]">Especialidades: </span>
                {profile.specialtyNames.join(' · ')}
              </div>
            )}

            {/* Location Line with Pin */}
            <div className="flex items-center gap-1 text-xs font-bold text-[#0D316E]">
              <MapPin className="w-3.5 h-3.5 text-[#1E4B9B] shrink-0" />
              <span className="truncate">
                {profile.neighborhood}, {profile.district} • {profile.province}
              </span>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* FOTOS GALLERY MATCHING REFERENCE PRINT                            */}
        {/* ================================================================= */}
        {media.length > 0 && (
          <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#0D316E]">
                <ImageIcon className="w-4 h-4 text-[#1E4B9B]" />
                <span>
                  Fotos ({media.length} {media.length === 1 ? 'foto' : 'fotos'})
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
        {videoItem && (
          <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#0D316E]">
                <Film className="w-4 h-4 text-[#1E4B9B]" />
                <span>Vídeo de Demonstração</span>
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
                videoItem.storageRef.includes('youtube.com') ||
                videoItem.storageRef.includes('youtu.be') ? (
                  <iframe
                    src={
                      videoItem.storageRef.includes('watch?v=')
                        ? videoItem.storageRef.replace('watch?v=', 'embed/')
                        : videoItem.storageRef
                    }
                    title="Vídeo de Apresentação"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={videoItem.storageRef}
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
                    Reproduzir Apresentação em Vídeo
                  </span>
                  <span className="text-slate-300 text-[11px]">
                    Toque para abrir e contabilizar visualização em direto
                  </span>
                </button>
              )}
            </div>
            {videoItem.caption && (
              <p className="text-xs text-slate-600 italic px-1">{videoItem.caption}</p>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* 3 PRIMARY CONTACT & MAP ACTION BUTTONS MATCHING REFERENCE PRINT   */}
        {/* ================================================================= */}
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

        {/* Expandable Location & GPS Verification Panel */}
        {showMapPanel && (
          <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 space-y-2 text-xs">
            <div className="font-extrabold text-[#0D316E] flex items-center justify-between">
              <span>Localização e Coordenadas GPS</span>
              <span className="font-semibold text-slate-600">
                {profile.hasGps
                  ? 'GPS registado pelo dispositivo'
                  : 'Endereço escrito verificado'}
              </span>
            </div>
            <p className="text-slate-700">
              <strong>Endereço completo:</strong>{' '}
              {profile.streetOrReference ? `${profile.streetOrReference}, ` : ''}
              Bairro {profile.neighborhood}
              {profile.locality ? ` – ${profile.locality}` : ''}, {profile.district},{' '}
              {profile.province}
            </p>
            {profile.hasGps ? (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="font-mono text-slate-700">
                  Lat: {profile.latitude} | Lng: {profile.longitude}
                </span>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${profile.latitude}&mlon=${profile.longitude}#map=16/${profile.latitude}/${profile.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-[#0D316E] text-white font-bold hover:bg-[#092452]"
                >
                  Abrir Mapa Interativo (OpenStreetMap)
                </a>
              </div>
            ) : (
              <p className="text-slate-600">
                Localização registada manualmente ({profile.neighborhood}, {profile.district},{' '}
                {profile.province}).
              </p>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* OPERATIONAL STATE BAR MATCHING REFERENCE PRINT                    */}
        {/* ================================================================= */}
        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Settings className="w-4 h-4 text-[#1E4B9B] shrink-0" />
            <span className="text-xs font-extrabold text-[#0D316E]">
              Estado do serviço:
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold inline-flex items-center gap-1 ${
                profile.operationalState === 'on'
                  ? 'bg-emerald-600 text-white'
                  : profile.operationalState === 'off'
                  ? 'bg-slate-600 text-white'
                  : 'bg-red-600 text-white'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>{profile.operationalState.toUpperCase()}</span>
            </span>
            <span className="text-xs font-semibold text-slate-700">
              {profile.operationalState === 'on'
                ? 'A funcionar (atendimento normal)'
                : profile.operationalState === 'off'
                ? 'Indisponível no momento'
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
                    profile.operationalState === st
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

        {/* ================================================================= */}
        {/* STRUCTURED CHEVRON ROWS MATCHING REFERENCE PRINT                  */}
        {/* ================================================================= */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-200 overflow-hidden">
          {/* Row 1: Endereço */}
          <button
            type="button"
            onClick={() => setShowMapPanel((prev) => !prev)}
            className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-start gap-3 min-w-0">
              <MapPin className="w-5 h-5 text-[#1E4B9B] shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm min-w-0">
                <span className="font-extrabold text-[#0D316E]">Endereço: </span>
                <span className="text-slate-700">
                  {profile.streetOrReference ? `${profile.streetOrReference}, ` : ''}
                  {profile.neighborhood}
                  {profile.locality ? ` · ${profile.locality}` : ''}, {profile.district}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          {/* Row 2: Paragem mais próxima */}
          <button
            type="button"
            onClick={() => setShowMapPanel((prev) => !prev)}
            className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-start gap-3 min-w-0">
              <Bus className="w-5 h-5 text-[#1E4B9B] shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm min-w-0">
                <span className="font-extrabold text-[#0D316E]">
                  Paragem mais próxima:{' '}
                </span>
                <span className="text-slate-700">
                  {profile.nearestStop || `Bairro ${profile.neighborhood}`}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          {/* Row 3: Referência e Cobertura */}
          <button
            type="button"
            onClick={() => setShowMapPanel((prev) => !prev)}
            className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-start gap-3 min-w-0">
              <Compass className="w-5 h-5 text-[#1E4B9B] shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm min-w-0">
                <span className="font-extrabold text-[#0D316E]">Referência: </span>
                <span className="text-slate-700">
                  {profile.coverageLocations ||
                    `${deliveryModeLabel} (${profile.district}, ${profile.province})`}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          {/* Row 4: Serviços oferecidos */}
          <div className="divide-y divide-slate-100">
            <button
              type="button"
              onClick={() => setShowServicesDetail((prev) => !prev)}
              className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <Wrench className="w-5 h-5 text-[#1E4B9B] shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm min-w-0">
                  <span className="font-extrabold text-[#0D316E] block">
                    Serviços oferecidos:
                  </span>
                  <span className="text-slate-700 line-clamp-2">
                    {services.length > 0
                      ? services.map((s) => s.serviceName).join(', ')
                      : profile.description || profile.primaryCategoryName}
                  </span>
                </div>
              </div>
              {showServicesDetail ? (
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              )}
            </button>

            {showServicesDetail && (
              <div className="p-3.5 bg-slate-50/70 space-y-2.5">
                {profile.description && (
                  <p className="text-xs text-slate-600 leading-relaxed pb-1">
                    {profile.description}
                  </p>
                )}

                {services.length > 0 ? (
                  services.map((srv) => (
                    <div
                      key={srv.id}
                      className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="font-extrabold text-xs sm:text-sm text-[#0D316E]">
                          {srv.serviceName}
                        </div>
                        {srv.description && (
                          <p className="text-xs text-slate-600">{srv.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                          <span className="font-mono font-extrabold text-[#0D316E]">
                            {srv.hasFixedPrice && srv.price > 0
                              ? `${srv.price.toLocaleString('pt-MZ')} MT`
                              : 'Preço sob consulta'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {srv.deliveryMethod === 'customer_location'
                              ? 'Ao domicílio'
                              : srv.deliveryMethod === 'professional_location'
                              ? 'No estabelecimento'
                              : srv.deliveryMethod === 'both'
                              ? 'No local ou ao domicílio'
                              : 'Remoto'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={!canManage || updatingServiceId === srv.id}
                        onClick={() => handleToggleService(srv)}
                        className={`min-w-[58px] py-1 px-2.5 rounded-full text-xs font-extrabold text-center shrink-0 transition-colors ${
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
                    Nenhum serviço individual detalhado neste perfil.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Row 5: Horário de funcionamento */}
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
                  <span className="text-slate-700">{profile.workingDaysSummary}</span>
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

        {/* Dynamic Activity-Specific Information */}
        {(profile.activityField1Value || profile.activityField2Value) && (
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5 text-xs sm:text-sm">
            <h3 className="font-extrabold text-[#0D316E]">
              Informação Técnica ({profile.primaryCategoryName})
            </h3>
            {profile.activityField1Label && profile.activityField1Value && (
              <div>
                <span className="font-bold text-slate-700">
                  {profile.activityField1Label}:{' '}
                </span>
                <span className="text-slate-600">{profile.activityField1Value}</span>
              </div>
            )}
            {profile.activityField2Label && profile.activityField2Value && (
              <div>
                <span className="font-bold text-slate-700">
                  {profile.activityField2Label}:{' '}
                </span>
                <span className="text-slate-600">{profile.activityField2Value}</span>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* DOCUMENTOS VERIFICADOS CARD MATCHING REFERENCE PRINT              */}
        {/* ================================================================= */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#0D316E]">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Documentos Verificados</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-1.5">
              <CheckCircle2
                className={`w-4 h-4 shrink-0 ${
                  profile.phoneVerified ? 'text-emerald-600' : 'text-slate-400'
                }`}
              />
              <div className="min-w-0">
                <div className="font-extrabold text-[#0D316E] truncate">Contacto</div>
                <div className="text-[10px] text-slate-500 truncate">
                  {profile.phoneVerified ? 'Verificado' : profile.phone}
                </div>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-1.5">
              <CheckCircle2
                className={`w-4 h-4 shrink-0 ${
                  profile.nuit ? 'text-emerald-600' : 'text-slate-400'
                }`}
              />
              <div className="min-w-0">
                <div className="font-extrabold text-[#0D316E] truncate">NUIT</div>
                <div className="text-[10px] text-slate-500 truncate">
                  {profile.nuit ? profile.nuit : 'Individual'}
                </div>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <div className="font-extrabold text-[#0D316E] truncate">Titular</div>
                <div className="text-[10px] text-slate-500 truncate">
                  {profile.responsibleName || profile.displayName}
                </div>
              </div>
            </div>
          </div>

          {/* Full-width "Ver detalhes" button matching bottom of reference print */}
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
