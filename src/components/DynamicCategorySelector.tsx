import React, { useState, useMemo } from 'react';
import { Plus, Search, Check, Sparkles, Tag, AlertCircle } from 'lucide-react';
import { ProfessionalCategory } from '../types/mozfacil';
import {
  formatCategoryDisplayName,
  normalizeCategoryName,
} from '../utils/categoryNormalization';
import { proposeOrSelectCategory } from '../services/mozfacilService';

interface DynamicCategorySelectorProps {
  categories: ProfessionalCategory[];
  selectedCategoryId: string;
  selectedCategoryName: string;
  onSelectCategory: (category: ProfessionalCategory) => void;
  onPendingProfessionChange?: (rawText: string) => void;
  selectedSpecialties: { id: string; name: string }[];
  onChangeSpecialties: (specialties: { id: string; name: string }[]) => void;
  actorId: string;
  actorName: string;
  isAdmin: boolean;
}

export const DynamicCategorySelector: React.FC<DynamicCategorySelectorProps> = ({
  categories,
  selectedCategoryId,
  selectedCategoryName,
  onSelectCategory,
  onPendingProfessionChange,
  selectedSpecialties,
  onChangeSpecialties,
  actorId,
  actorName,
  isAdmin,
}) => {
  const [profSearch, setProfSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreatingProf, setIsCreatingProf] = useState(false);
  const [specSearch, setSpecSearch] = useState('');
  const [isCreatingSpec, setIsCreatingSpec] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter usable profession categories (approved or pending; exclude rejected & merged)
  const professionCategories = useMemo(() => {
    return categories
      .filter(
        (c) =>
          c.categoryType === 'profession' &&
          (c.reviewStatus === 'approved' || c.reviewStatus === 'pending')
      )
      .sort((a, b) => a.originalName.localeCompare(b.originalName, 'pt'));
  }, [categories]);

  const specialtyCategories = useMemo(() => {
    return categories
      .filter(
        (c) =>
          c.categoryType === 'specialty' &&
          (c.reviewStatus === 'approved' || c.reviewStatus === 'pending')
      )
      .sort((a, b) => a.originalName.localeCompare(b.originalName, 'pt'));
  }, [categories]);

  const normalizedProfQuery = normalizeCategoryName(profSearch);

  const filteredProfessions = useMemo(() => {
    if (!normalizedProfQuery) return professionCategories;
    return professionCategories.filter((c) =>
      c.normalizedName.includes(normalizedProfQuery)
    );
  }, [professionCategories, normalizedProfQuery]);

  const exactProfMatch = useMemo(() => {
    if (!normalizedProfQuery) return null;
    return (
      professionCategories.find((c) => c.normalizedName === normalizedProfQuery) ||
      null
    );
  }, [professionCategories, normalizedProfQuery]);

  const normalizedSpecQuery = normalizeCategoryName(specSearch);

  const filteredSpecialties = useMemo(() => {
    if (!normalizedSpecQuery) return specialtyCategories;
    return specialtyCategories.filter((c) =>
      c.normalizedName.includes(normalizedSpecQuery)
    );
  }, [specialtyCategories, normalizedSpecQuery]);

  const exactSpecMatch = useMemo(() => {
    if (!normalizedSpecQuery) return null;
    return (
      specialtyCategories.find((c) => c.normalizedName === normalizedSpecQuery) ||
      null
    );
  }, [specialtyCategories, normalizedSpecQuery]);

  const handleCreateOrSelectProfessionByName = async (rawName: string) => {
    const norm = normalizeCategoryName(rawName);
    if (norm.length < 2) {
      setErrorMsg('Digite pelo menos 2 letras para definir a profissão.');
      return;
    }
    setErrorMsg(null);
    setIsCreatingProf(true);
    try {
      const created = await proposeOrSelectCategory({
        rawName,
        categoryType: 'profession',
        actorId,
        actorName,
        isAdmin,
      });
      onSelectCategory(created);
      onPendingProfessionChange?.('');
      setProfSearch('');
      setIsDropdownOpen(false);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erro ao registar categoria profissional.'
      );
    } finally {
      setIsCreatingProf(false);
    }
  };

  const handleProposeNewProfession = async () => {
    await handleCreateOrSelectProfessionByName(profSearch);
  };

  const handleToggleSpecialty = (spec: ProfessionalCategory) => {
    const exists = selectedSpecialties.some((s) => s.id === spec.id);
    if (exists) {
      onChangeSpecialties(selectedSpecialties.filter((s) => s.id !== spec.id));
    } else {
      if (selectedSpecialties.length >= 10) {
        setErrorMsg('Pode selecionar no máximo 10 especialidades.');
        return;
      }
      setErrorMsg(null);
      onChangeSpecialties([
        ...selectedSpecialties,
        { id: spec.id, name: spec.originalName },
      ]);
    }
  };

  const handleProposeNewSpecialty = async () => {
    if (normalizedSpecQuery.length < 2) {
      setErrorMsg('Digite pelo menos 2 letras para propor uma nova especialidade.');
      return;
    }
    if (selectedSpecialties.length >= 10) {
      setErrorMsg('Limite máximo de 10 especialidades atingido.');
      return;
    }
    setErrorMsg(null);
    setIsCreatingSpec(true);
    try {
      const created = await proposeOrSelectCategory({
        rawName: specSearch,
        categoryType: 'specialty',
        parentCategoryId: selectedCategoryId || '',
        actorId,
        actorName,
        isAdmin,
      });
      if (!selectedSpecialties.some((s) => s.id === created.id)) {
        onChangeSpecialties([
          ...selectedSpecialties,
          { id: created.id, name: created.originalName },
        ]);
      }
      setSpecSearch('');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erro ao propor especialidade.'
      );
    } finally {
      setIsCreatingSpec(false);
    }
  };

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Primary Profession Category Selector */}
      <div className="relative">
        <label className="block text-xs font-bold text-[#0D316E] mb-1.5">
          Categoria Profissional / Atividade Principal <span className="text-red-500">*</span>
        </label>

        <button
          type="button"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className="w-full min-h-[48px] h-12 px-4 py-2.5 text-left bg-white border border-slate-300 rounded-xl flex items-center justify-between text-sm hover:border-[#0D316E] focus:outline-none focus:ring-2 focus:ring-[#F97316]"
        >
          <span
            className={
              selectedCategoryName || profSearch.trim()
                ? 'font-semibold text-slate-900'
                : 'text-slate-400'
            }
          >
            {selectedCategoryName ||
              (profSearch.trim()
                ? `${formatCategoryDisplayName(profSearch)} (clique para confirmar ou guarde o formulário)`
                : 'Selecione ou digite uma profissão (ex: Mecânico, Carpinteiro...)')}
          </span>
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
        </button>

        {isDropdownOpen && (
          <div className="mt-2 bg-white border border-slate-300 rounded-xl shadow-lg p-3.5 z-30 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={profSearch}
                onChange={(e) => {
                  setProfSearch(e.target.value);
                  onPendingProfessionChange?.(e.target.value);
                }}
                placeholder="Pesquisar profissão existente ou digitar nova..."
                className="w-full min-h-[48px] h-12 pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#F97316]"
              />
            </div>

            <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
              {filteredProfessions.length > 0 ? (
                filteredProfessions.map((cat) => {
                  const isSelected = cat.id === selectedCategoryId;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        onSelectCategory(cat);
                        onPendingProfessionChange?.('');
                        setIsDropdownOpen(false);
                        setProfSearch('');
                      }}
                      className={`w-full px-3.5 py-3 text-left text-sm flex items-center justify-between hover:bg-orange-50/70 transition-colors ${
                        isSelected ? 'bg-orange-50 font-semibold text-[#0D316E]' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <span>{cat.originalName}</span>
                        {cat.reviewStatus === 'pending' && (
                          <span className="ml-2 text-[11px] text-amber-700">
                            · Proposta em revisão (utilizável)
                          </span>
                        )}
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#F97316]" />}
                    </button>
                  );
                })
              ) : (
                <div className="p-3.5 text-xs text-slate-500 text-center">
                  {profSearch.trim()
                    ? `Clique abaixo para registar dinamicamente "${formatCategoryDisplayName(profSearch)}".`
                    : 'Catálogo sem categorias predefinidas. Digite o nome da sua profissão acima para registá-la dinamicamente.'}
                </div>
              )}
            </div>

            {normalizedProfQuery.length >= 2 && !exactProfMatch && (
              <div className="pt-1">
                <button
                  type="button"
                  disabled={isCreatingProf}
                  onClick={handleProposeNewProfession}
                  className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-[#0D316E] hover:bg-[#092452] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {isCreatingProf
                      ? 'A registar categoria...'
                      : `Usar Categoria: "${formatCategoryDisplayName(profSearch)}"`}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Specialties Selector & Dynamic Proposal */}
      <div>
        <label className="block text-xs font-bold text-[#0D316E] mb-1.5">
          Especialidades (Selecione ou adicione novas especialidades)
        </label>

        {selectedSpecialties.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2.5">
            {selectedSpecialties.map((spec) => (
              <button
                key={spec.id}
                type="button"
                onClick={() =>
                  onChangeSpecialties(selectedSpecialties.filter((s) => s.id !== spec.id))
                }
                className="px-3 py-1.5 rounded-lg bg-[#0D316E]/10 hover:bg-red-50 text-[#0D316E] hover:text-red-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Clique para remover especialidade"
              >
                <Tag className="w-3 h-3" />
                <span>{spec.name}</span>
                <span className="text-slate-400 hover:text-red-600 font-bold">×</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative w-full sm:flex-1">
            <input
              type="text"
              value={specSearch}
              onChange={(e) => setSpecSearch(e.target.value)}
              placeholder="Pesquisar ou propor especialidade (ex: Injeção Eletrónica, Portas Maciças...)"
              className="w-full min-h-[48px] h-12 px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#F97316]"
            />
          </div>
          {normalizedSpecQuery.length >= 2 && !exactSpecMatch && (
            <button
              type="button"
              disabled={isCreatingSpec}
              onClick={handleProposeNewSpecialty}
              className="min-h-[48px] h-12 px-4 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shrink-0 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isCreatingSpec ? 'A criar...' : '+ Propor Especialidade'}</span>
            </button>
          )}
        </div>

        {filteredSpecialties.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-lg">
            {filteredSpecialties.map((spec) => {
              const isSelected = selectedSpecialties.some((s) => s.id === spec.id);
              return (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() => handleToggleSpecialty(spec)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-[#0D316E] text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-[#0D316E]'
                  }`}
                >
                  {isSelected ? `✓ ${spec.originalName}` : `+ ${spec.originalName}`}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
