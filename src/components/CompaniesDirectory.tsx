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

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedEntityType !== 'all' ||
    selectedProvince !== 'all' ||
    operationalFilter !== 'all' ||
    Boolean(searchTerm.trim());

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedEntityType('all');
    setSelectedProvince('all');
    setOperationalFilter('all');
  };

  return (
    <div className="h-full flex-1 min-h-0 flex flex-col gap-2 max-w-4xl w-full mx-auto overflow-hidden">
      {/* Top Compact Header, Search & Quick Filter Control Bar (shrink-0) */}
      <div className="shrink-0 bg-gradient-to-r from-[#071F4A] via-[#0D316E] to-[#1E4B9B] rounded-2xl p-2.5 sm:p-3.5 text-white shadow-md border border-[#1E4B9B]/80 space-y-2">
        {/* Row 1: Title + Count + Quick Register CTA */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#EA580C]/20 border border-[#EA580C]/40 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-[#F97316]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-lg font-black tracking-tight text-white truncate">
                  Empresas e Instituições
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-white/15 text-orange-300 text-[10px] sm:text-xs font-extrabold tabular-nums shrink-0">
                  {filteredCompanies.length}
                </span>
              </div>
              <p className="text-[11px] text-blue-200 truncate hidden sm:block">
                Empresas privadas, instituições públicas, ONGs e serviços validados em Moçambique
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onRegisterCompany}
            className="h-8 sm:h-9 px-3 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl text-[11px] sm:text-xs font-extrabold flex items-center gap-1 shadow-xs transition-transform active:scale-95 shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Registar</span>
          </button>
        </div>

        {/* Row 2: Search Input + Compact Filter Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar empresa, instituição, categoria ou bairro..."
              className="w-full h-9 sm:h-10 pl-9 pr-8 text-xs sm:text-sm font-medium rounded-xl bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#F97316]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className={`h-9 sm:h-10 px-3 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 transition-colors shrink-0 ${
              showFilters || selectedEntityType !== 'all' || operationalFilter !== 'all'
                ? 'bg-[#F97316] border-[#F97316] text-white'
                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtros</span>
          </button>
        </div>

        {/* Row 3: 2-Column Quick Selectors (Categoria + Província) & Quick Status Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-12 gap-1.5 sm:gap-2 items-center">
          <div className="sm:col-span-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-8 sm:h-9 px-2.5 rounded-xl bg-white/95 text-slate-900 text-[11px] sm:text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-[#F97316]"
            >
              <option value="all">Todas as Categorias ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name || cat.originalName}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full h-8 sm:h-9 px-2.5 rounded-xl bg-white/95 text-slate-900 text-[11px] sm:text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-[#F97316]"
            >
              <option value="all">Toda Moçambique</option>
              {getProvinces().map((p: string) => (
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
                setOperationalFilter((prev) => (prev === 'on' ? 'all' : 'on'))
              }
              className={`h-7 sm:h-8 px-2.5 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all whitespace-nowrap shrink-0 ${
                operationalFilter === 'on'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-white/10 text-blue-100 hover:bg-white/20'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Abertos (ON)</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setSelectedEntityType((prev) =>
                  prev === 'private_company' ? 'all' : 'private_company'
                )
              }
              className={`h-7 sm:h-8 px-2.5 rounded-lg text-[11px] font-extrabold transition-all whitespace-nowrap shrink-0 ${
                selectedEntityType === 'private_company'
                  ? 'bg-[#F97316] text-white shadow-xs'
                  : 'bg-white/10 text-blue-100 hover:bg-white/20'
              }`}
            >
              <span>Empresas</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setSelectedEntityType((prev) =>
                  prev === 'public_institution' ? 'all' : 'public_institution'
                )
              }
              className={`h-7 sm:h-8 px-2.5 rounded-lg text-[11px] font-extrabold transition-all whitespace-nowrap shrink-0 ${
                selectedEntityType === 'public_institution'
                  ? 'bg-[#F97316] text-white shadow-xs'
                  : 'bg-white/10 text-blue-100 hover:bg-white/20'
              }`}
            >
              <span>Instituições</span>
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-7 sm:h-8 px-2.5 rounded-lg bg-red-500/20 border border-red-300/40 text-orange-200 hover:bg-red-500/30 text-[11px] font-extrabold whitespace-nowrap shrink-0"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Expandable Advanced Filter Panel */}
        {showFilters && (
          <div className="pt-2 border-t border-white/15 grid grid-cols-2 gap-2 text-slate-900">
            <select
              value={selectedEntityType}
              onChange={(e) => setSelectedEntityType(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg bg-white text-[11px] font-semibold"
            >
              <option value="all">Todos os Tipos de Entidade</option>
              <option value="private_company">Empresa Privada</option>
              <option value="public_institution">Instituição Pública</option>
              <option value="state_institution">Instituição de Estado</option>
              <option value="ngo">ONG / Sem Fins Lucrativos</option>
              <option value="agency">Agência / Serviço Público</option>
            </select>

            <select
              value={operationalFilter}
              onChange={(e) => setOperationalFilter(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg bg-white text-[11px] font-semibold"
            >
              <option value="all">Qualquer Estado (ON/OFF)</option>
              <option value="on">Apenas Abertos (ON)</option>
              <option value="off">Fechados (OFF)</option>
            </select>
          </div>
        )}
      </div>

      {/* Dynamic Self-Contained Results Viewport (flex-1 min-h-0 overflow-y-auto) */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 pb-2 space-y-2.5">
        {filteredCompanies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {filteredCompanies.map((c) => {
              const cleanWhatsapp = (c.whatsapp || c.phone).replace(/\D/g, '');
              const cleanPhone = c.phone.replace(/[^\d+]/g, '');

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow p-3 sm:p-3.5 flex flex-col justify-between gap-2.5 relative overflow-hidden"
                >
                  {/* Header Row: Logo/Avatar + Name + Status */}
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => onSelectCompany(c)}
                      className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center"
                    >
                      {c.logoUrl ? (
                        <img
                          src={c.logoUrl}
                          alt={c.tradeName || c.displayName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="w-5 h-5 text-[#1E4B9B]" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1 min-w-0">
                          <h3
                            onClick={() => onSelectCompany(c)}
                            className="font-extrabold text-[#0D316E] text-sm sm:text-base truncate cursor-pointer hover:text-[#F97316] transition-colors"
                          >
                            {c.tradeName || c.displayName}
                          </h3>
                          {(c.verificationStatus === 'verified' || c.companyVerified) && (
                            <span title="Entidade Verificada" className="shrink-0">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            </span>
                          )}
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full font-black uppercase text-[10px] shrink-0 ${
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

                      <div className="flex flex-wrap items-center gap-1 text-[11px]">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200">
                          <span>{c.primaryCategoryName}</span>
                        </span>

                        <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {entityTypeLabels[c.entityType]}
                        </span>

                        {c.videoUrl && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-800 text-[10px] font-extrabold border border-blue-200">
                            <Film className="w-2.5 h-2.5 text-blue-600" />
                            <span>Vídeo</span>
                          </span>
                        )}
                      </div>

                      {/* Compact Location & Schedule Inline */}
                      <div className="flex items-center justify-between gap-2 text-[11px] pt-0.5">
                        <div className="flex items-center gap-1 text-slate-700 font-semibold min-w-0">
                          <MapPin className="w-3 h-3 text-[#F97316] shrink-0" />
                          <span className="truncate">
                            {c.neighborhood}, {c.district} ({c.province})
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-slate-500 shrink-0">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[95px]">{c.workingDaysSummary}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: WhatsApp, Call, View Profile */}
                  <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                    <a
                      href={`https://wa.me/${cleanWhatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8 sm:h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>WhatsApp</span>
                    </a>

                    <a
                      href={`tel:${cleanPhone}`}
                      className="h-8 sm:h-9 rounded-xl bg-[#0D316E] hover:bg-[#092452] text-white font-extrabold text-xs flex items-center justify-center gap-1 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>Ligar</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => onSelectCompany(c)}
                      className="h-8 sm:h-9 rounded-xl bg-white border border-[#0D316E] hover:bg-blue-50 text-[#0D316E] font-extrabold text-xs flex items-center justify-center gap-1 transition-colors"
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
          <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center space-y-2.5 max-w-md mx-auto my-2">
            <Building2 className="w-9 h-9 text-slate-300 mx-auto" />
            <h3 className="text-sm font-extrabold text-[#0D316E]">Nenhuma entidade encontrada</h3>
            <p className="text-xs text-slate-500">
              Não foram encontradas empresas ou instituições com os filtros selecionados.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="h-9 px-3.5 bg-[#0D316E] text-white rounded-xl text-xs font-extrabold"
                >
                  Limpar Filtros
                </button>
              )}
              <button
                type="button"
                onClick={onRegisterCompany}
                className="h-9 px-3.5 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Registar Empresa</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
