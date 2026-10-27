import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  Filter,
  MapPin,
  Phone,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Film,
  PlusCircle,
  ChevronRight,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  CompanyCategory,
  CompanyEntityType,
  CompanyProfile,
  OperationalState,
} from '../types/mozfacil';
import { getProvinces } from '../data/mozambiqueLocations';

interface CompaniesDirectoryProps {
  companies: CompanyProfile[];
  categories: CompanyCategory[];
  onSelectCompany: (company: CompanyProfile) => void;
  onRegisterCompany: () => void;
  isAdmin: boolean;
}

export const CompaniesDirectory: React.FC<CompaniesDirectoryProps> = ({
  companies,
  categories,
  onSelectCompany,
  onRegisterCompany,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [operationalFilter, setOperationalFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const entityTypeLabels: Record<CompanyEntityType, string> = {
    private_company: 'Empresa Privada',
    public_institution: 'Instituição Pública',
    state_institution: 'Instituição de Estado',
    ngo: 'ONG / Organização Sem Fins Lucrativos',
    agency: 'Agência / Serviço Público',
  };

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      // Must be published in public directory
      if (c.publicationStatus !== 'published') return false;

      // Text search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const nameA = (c.tradeName || c.displayName || '').toLowerCase();
        const nameB = (c.legalName || c.officialName || '').toLowerCase();
        const matchesName = nameA.includes(query) || nameB.includes(query);
        const matchesCategory = (c.primaryCategoryName || '').toLowerCase().includes(query);
        const matchesLocation =
          (c.province || '').toLowerCase().includes(query) ||
          (c.district || '').toLowerCase().includes(query) ||
          (c.neighborhood || '').toLowerCase().includes(query);
        const matchesNuit = (c.nuit || '').includes(query);
        if (!matchesName && !matchesCategory && !matchesLocation && !matchesNuit) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && c.primaryCategoryId !== selectedCategory) {
        return false;
      }

      // Entity type filter
      if (selectedEntityType !== 'all' && c.entityType !== selectedEntityType) {
        return false;
      }

      // Province filter
      if (selectedProvince !== 'all' && c.province !== selectedProvince) {
        return false;
      }

      // Operational state
      if (operationalFilter !== 'all' && c.operationalState !== operationalFilter) {
        return false;
      }

      return true;
    });
  }, [companies, searchTerm, selectedCategory, selectedEntityType, selectedProvince, operationalFilter]);

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#071F4A] via-[#0D316E] to-[#1E4B9B] rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 text-orange-300 text-xs font-extrabold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              <span>Módulo 2 · Diretório Oficial</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Empresas e Instituições
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
              Consulte empresas, instituições públicas, ONGs e serviços em Moçambique com dados validados, horários e contactos diretos.
            </p>
          </div>

          <button
            type="button"
            onClick={onRegisterCompany}
            className="self-start sm:self-center min-h-[44px] px-4 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-sm transition-transform active:scale-95 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Registar Empresa</span>
          </button>
        </div>
      </div>

      {/* Search & Quick Filter Bar */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por nome comercial, categoria, NUIT ou bairro..."
              className="w-full min-h-[48px] h-12 pl-10 pr-9 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0D316E] focus:border-transparent text-slate-800"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className={`min-h-[48px] h-12 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-extrabold flex items-center gap-1.5 transition-colors shrink-0 ${
              showFilters || selectedCategory !== 'all' || selectedEntityType !== 'all' || selectedProvince !== 'all'
                ? 'bg-blue-50 border-[#0D316E] text-[#0D316E]'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
          </button>
        </div>

        {/* Expandable Advanced Filter Panel */}
        {showFilters && (
          <div className="pt-3.5 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Categoria:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full min-h-[46px] py-2.5 px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-[#0D316E]"
              >
                <option value="all">Todas as Categorias</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name || cat.originalName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Tipo de Entidade:</label>
              <select
                value={selectedEntityType}
                onChange={(e) => setSelectedEntityType(e.target.value)}
                className="w-full min-h-[46px] py-2.5 px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-[#0D316E]"
              >
                <option value="all">Todos os Tipos</option>
                <option value="private_company">Empresa Privada</option>
                <option value="public_institution">Instituição Pública</option>
                <option value="ngo">ONG / Sem Fins Lucrativos</option>
                <option value="cooperative">Cooperativa / Associação</option>
                <option value="public_service">Serviço Público</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Província:</label>
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full min-h-[46px] py-2.5 px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-[#0D316E]"
              >
                <option value="all">Todas as Províncias</option>
                {getProvinces().map((p: string) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Estado de Serviço:</label>
              <select
                value={operationalFilter}
                onChange={(e) => setOperationalFilter(e.target.value)}
                className="w-full min-h-[46px] py-2.5 px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-[#0D316E]"
              >
                <option value="all">Qualquer Estado</option>
                <option value="on">Apenas Abertos (ON)</option>
                <option value="off">Fechados (OFF)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Directory Listings Count */}
      <div className="flex items-center justify-between text-xs text-slate-600 px-1 font-semibold">
        <span>
          A mostrar <strong>{filteredCompanies.length}</strong>{' '}
          {filteredCompanies.length === 1 ? 'entidade registada' : 'entidades registadas'}
        </span>
        {(selectedCategory !== 'all' || selectedEntityType !== 'all' || selectedProvince !== 'all' || operationalFilter !== 'all' || searchTerm) && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedEntityType('all');
              setSelectedProvince('all');
              setOperationalFilter('all');
            }}
            className="text-[#EA580C] hover:underline font-bold"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Companies Cards Grid */}
      {filteredCompanies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredCompanies.map((c) => {
            const cleanWhatsapp = (c.whatsapp || c.phone).replace(/\D/g, '');
            const cleanPhone = c.phone.replace(/[^\d+]/g, '');

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-4 flex flex-col justify-between gap-3 relative overflow-hidden"
              >
                {/* Header Row: Logo/Avatar + Name + Status */}
                <div className="flex items-start gap-3">
                  <div className="w-13 h-13 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {c.logoUrl ? (
                      <img
                        src={c.logoUrl}
                        alt={c.tradeName || c.displayName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="w-6 h-6 text-[#1E4B9B]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <h3
                        onClick={() => onSelectCompany(c)}
                        className="font-extrabold text-[#0D316E] text-sm sm:text-base truncate cursor-pointer hover:underline"
                      >
                        {c.tradeName || c.displayName}
                      </h3>
                      {(c.verificationStatus === 'verified' || c.companyVerified) && (
                        <span title="Entidade Verificada">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 truncate">{c.legalName || c.officialName}</p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-extrabold border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{c.primaryCategoryName}</span>
                      </span>

                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {entityTypeLabels[c.entityType]}
                      </span>

                      {/* Video badge if company has video presentation */}
                      {c.videoUrl && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[10px] font-extrabold border border-blue-200">
                          <Film className="w-3 h-3 text-blue-600" />
                          <span>Vídeo ({c.videoViews || 0})</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Location & Operating State Row */}
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-[#1E4B9B] shrink-0" />
                    <span className="truncate">
                      {c.streetOrReference ? `${c.streetOrReference}, ` : ''}
                      {c.neighborhood}, {c.district} · {c.province}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-0.5 border-t border-slate-200/60">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="text-slate-600 truncate">{c.workingDaysSummary}</span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full font-black uppercase text-[10px] ${
                        c.operationalState === 'on'
                          ? 'bg-emerald-600 text-white'
                          : c.operationalState === 'off'
                          ? 'bg-slate-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      {c.operationalState}
                    </span>
                  </div>
                </div>

                {/* Action Buttons: WhatsApp, Call, View Profile */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <a
                    href={`https://wa.me/${cleanWhatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[38px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>WhatsApp</span>
                  </a>

                  <a
                    href={`tel:${cleanPhone}`}
                    className="min-h-[38px] rounded-xl bg-[#0D316E] hover:bg-[#092452] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>Ligar</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => onSelectCompany(c)}
                    className="min-h-[38px] rounded-xl bg-white border border-[#0D316E] hover:bg-blue-50 text-[#0D316E] font-extrabold text-xs flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>Perfil</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Nenhuma entidade encontrada</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Não foram encontradas empresas ou instituições com os filtros selecionados. Tente ajustar os termos de pesquisa ou registar uma nova entidade.
          </p>
          <button
            type="button"
            onClick={onRegisterCompany}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Registar Empresa Agora</span>
          </button>
        </div>
      )}
    </div>
  );
};
