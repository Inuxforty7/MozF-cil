import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  MapPin,
  Navigation,
  PlusCircle,
  Search,
  Share2,
  Landmark,
} from 'lucide-react';
import {
  PUBLIC_PLACE_CATEGORY_LABELS,
  PublicPlace,
  PublicPlaceCategory,
} from '../types/mozfacil';
import {
  getDistrictsByProvince,
  getNeighborhoodsByDistrict,
  getProvinces,
} from '../data/mozambiqueLocations';
import { submitPublicPlace } from '../services/mozfacilService';

interface PublicPlaceInstructionsScreenProps {
  publicPlaces: PublicPlace[];
  onContinueToForm: () => void;
  onBackHome: () => void;
  onOpenShareModal?: () => void;
}

export const PublicPlaceInstructionsScreen: React.FC<PublicPlaceInstructionsScreenProps> = ({
  publicPlaces,
  onContinueToForm,
  onBackHome,
  onOpenShareModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const provinces = useMemo(() => getProvinces(), []);

  const filteredPlaces = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return publicPlaces.filter((place) => {
      if (place.publicationStatus !== 'published') return false;
      if (selectedProvince && place.province !== selectedProvince) return false;
      if (!q) return true;
      return (
        place.placeName.toLowerCase().includes(q) ||
        place.neighborhood.toLowerCase().includes(q) ||
        place.district.toLowerCase().includes(q) ||
        place.province.toLowerCase().includes(q) ||
        place.referenceDescription.toLowerCase().includes(q) ||
        (PUBLIC_PLACE_CATEGORY_LABELS[place.placeCategory] || '')
          .toLowerCase()
          .includes(q)
      );
    });
  }, [publicPlaces, searchQuery, selectedProvince]);

  return (
    <div className="max-w-2xl mx-auto py-2 sm:py-4 px-2 sm:px-4 space-y-4">
      {/* Top Navigation Back Button */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBackHome}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-extrabold text-[#0D316E] hover:bg-slate-50 shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#E85B0D]" />
          <span>Voltar ao Início</span>
        </button>

        {onOpenShareModal && (
          <button
            type="button"
            onClick={onOpenShareModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-[#E85B0D]" />
            <span>Partilhar MozFácil</span>
          </button>
        )}
      </div>

      {/* Main Instruction Card */}
      <div className="bg-white rounded-2xl border-2 border-[#F97316]/80 shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-[#07214E] via-[#0D316E] to-[#07214E] px-5 py-4 text-white flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#F97316] flex items-center justify-center shrink-0 shadow-xs">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-orange-300">
              Comunidade MozFácil · Moçambique
            </span>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white leading-snug">
              Ajude a registar os locais da sua comunidade
            </h1>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-4 text-slate-700 text-sm leading-relaxed">
          <p className="font-medium text-slate-800">
            Conhece um mercado, uma paragem, uma instituição pública ou outro local importante da sua zona? Ajude outras pessoas a encontrá-lo, indicando o nome do local e onde fica.
          </p>

          <p className="text-slate-600">
            Preencha apenas as informações que conhece. Indique a província, o distrito ou município, o bairro ou a localidade e uma referência que ajude a chegar ao local, quando aplicável.
          </p>

          {/* Practical Examples Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-200/80 text-xs">
              <div className="font-extrabold text-[#0D316E]">Mercados</div>
              <div className="text-[11px] text-slate-600 mt-0.5">Mercados e feiras locais</div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs">
              <div className="font-extrabold text-[#0D316E]">Paragens</div>
              <div className="text-[11px] text-slate-600 mt-0.5">Paragens e terminais</div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs">
              <div className="font-extrabold text-[#0D316E]">Instituições</div>
              <div className="text-[11px] text-slate-600 mt-0.5">Escolas, saúde e serviços</div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs">
              <div className="font-extrabold text-[#0D316E]">Referências</div>
              <div className="text-[11px] text-slate-600 mt-0.5">Praças e pontos conhecidos</div>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onContinueToForm}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#FF6B00] hover:from-[#C2410C] hover:to-[#EA580C] text-white font-extrabold text-base shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <span>Continuar para o formulário</span>
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Community Directory of Registered Public Places */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-[#0D316E]" />
            <h2 className="text-sm sm:text-base font-extrabold text-[#0D316E]">
              Locais Comunitários Registados ({filteredPlaces.length})
            </h2>
          </div>

          <button
            type="button"
            onClick={onContinueToForm}
            className="inline-flex items-center gap-1 text-xs font-extrabold text-[#EA580C] hover:underline"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Adicionar Local</span>
          </button>
        </div>

        {/* Simple Search & Province Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Procurar mercado, paragem, instituição ou bairro..."
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            />
          </div>
          <div>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              aria-label="Filtrar por província"
              className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            >
              <option value="">Todas as Províncias</option>
              {provinces.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredPlaces.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-50 border border-slate-200/80 text-center space-y-2">
            <p className="text-xs sm:text-sm font-semibold text-slate-600">
              Ainda não foram encontrados locais registados para esta pesquisa.
            </p>
            <button
              type="button"
              onClick={onContinueToForm}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D316E] text-white text-xs font-extrabold hover:bg-[#07214E] transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Registar o primeiro local</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
            {filteredPlaces.map((place) => (
              <div
                key={place.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-blue-200 transition-colors space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-extrabold text-[#0D316E] text-sm leading-snug">
                    {place.placeName}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-orange-100 text-[#C2410C] font-bold text-[10px] shrink-0">
                    {PUBLIC_PLACE_CATEGORY_LABELS[place.placeCategory] || 'Local Público'}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
                  <span>
                    {place.neighborhood}
                    {place.locality ? ` (${place.locality})` : ''} · {place.district},{' '}
                    {place.province}
                  </span>
                </div>

                {place.referenceDescription && (
                  <p className="text-xs text-slate-600 leading-relaxed flex items-start gap-1.5 pt-0.5">
                    <Navigation className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{place.referenceDescription}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface PublicPlaceRegistrationScreenProps {
  existingPlaces: PublicPlace[];
  onBackToInstructions: () => void;
  onPlaceSubmitted?: (newPlace: PublicPlace) => void;
}

export const PublicPlaceRegistrationScreen: React.FC<PublicPlaceRegistrationScreenProps> = ({
  existingPlaces,
  onBackToInstructions,
  onPlaceSubmitted,
}) => {
  const [placeName, setPlaceName] = useState('');
  const [placeCategory, setPlaceCategory] = useState<PublicPlaceCategory>('market');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [customDistrict, setCustomDistrict] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [locality, setLocality] = useState('');
  const [referenceDescription, setReferenceDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedPlace, setSubmittedPlace] = useState<PublicPlace | null>(null);

  const provinces = useMemo(() => getProvinces(), []);
  const districts = useMemo(
    () => (province ? getDistrictsByProvince(province) : []),
    [province]
  );
  const suggestedNeighborhoods = useMemo(
    () =>
      province && district && district !== '__custom__'
        ? getNeighborhoodsByDistrict(province, district)
        : [],
    [province, district]
  );

  const effectiveDistrict =
    district === '__custom__' ? customDistrict.trim() : district.trim();

  const handleProvinceChange = (nextProv: string) => {
    setProvince(nextProv);
    setDistrict('');
    setCustomDistrict('');
    setNeighborhood('');
  };

  const handleDistrictChange = (nextDist: string) => {
    setDistrict(nextDist);
    setNeighborhood('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (placeName.trim().length < 2) {
      setErrorMessage('Por favor, indique o nome do local (ex.: Mercado de Malanga).');
      return;
    }
    if (!province) {
      setErrorMessage('Por favor, selecione a província.');
      return;
    }
    if (!effectiveDistrict || effectiveDistrict.length < 2) {
      setErrorMessage('Por favor, indique o distrito ou município.');
      return;
    }
    if (!neighborhood.trim()) {
      setErrorMessage('Por favor, indique o bairro, localidade ou comunidade.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await submitPublicPlace({
        placeName: placeName.trim(),
        placeCategory,
        province,
        district: effectiveDistrict,
        neighborhood: neighborhood.trim(),
        locality: locality.trim(),
        referenceDescription: referenceDescription.trim(),
        existingPlaces,
      });
      setSubmittedPlace(created);
      if (onPlaceSubmitted) {
        onPlaceSubmitted(created);
      }
    } catch (err) {
      const rawMsg =
        err instanceof Error
          ? err.message
          : 'Não foi possível registar o local neste momento.';
      setErrorMessage(rawMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNewPlace = () => {
    setPlaceName('');
    setNeighborhood('');
    setLocality('');
    setReferenceDescription('');
    setErrorMessage(null);
    setSubmittedPlace(null);
  };

  return (
    <div className="max-w-xl mx-auto py-2 sm:py-4 px-2 sm:px-4 space-y-4">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToInstructions}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-extrabold text-[#0D316E] hover:bg-slate-50 shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#E85B0D]" />
          <span>Voltar às instruções</span>
        </button>
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-[#07214E] to-[#0D316E] px-5 py-4 text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F97316] flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
              Registar Local da Comunidade
            </h1>
            <p className="text-xs text-blue-100">
              Indique o nome do local e onde fica para ajudar outras pessoas a encontrá-lo.
            </p>
          </div>
        </div>

        {submittedPlace ? (
          <div className="p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-extrabold text-[#0D316E]">
                Local registado com sucesso!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Obrigado por ajudar a registar <strong>{submittedPlace.placeName}</strong> em{' '}
                <strong>
                  {submittedPlace.neighborhood}, {submittedPlace.district} (
                  {submittedPlace.province})
                </strong>
                .
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1 text-slate-700">
              <div>
                <strong>Nome do local:</strong> {submittedPlace.placeName}
              </div>
              <div>
                <strong>Tipo:</strong>{' '}
                {PUBLIC_PLACE_CATEGORY_LABELS[submittedPlace.placeCategory]}
              </div>
              <div>
                <strong>Localização:</strong> {submittedPlace.neighborhood}
                {submittedPlace.locality ? ` (${submittedPlace.locality})` : ''} ·{' '}
                {submittedPlace.district}, {submittedPlace.province}
              </div>
              {submittedPlace.referenceDescription && (
                <div>
                  <strong>Referência:</strong> {submittedPlace.referenceDescription}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleResetForNewPlace}
                className="flex-1 py-3 px-4 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-extrabold text-xs sm:text-sm transition-colors"
              >
                Registar outro local
              </button>
              <button
                type="button"
                onClick={onBackToInstructions}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0D316E] font-extrabold text-xs sm:text-sm transition-colors"
              >
                Ver locais registados
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {/* 1. Nome do local */}
            <div className="space-y-1.5">
              <label
                htmlFor="public-place-name"
                className="block text-xs sm:text-sm font-extrabold text-[#0D316E]"
              >
                1. Nome do local *
              </label>
              <input
                id="public-place-name"
                type="text"
                required
                maxLength={120}
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                placeholder="Ex: Mercado de Malanga, Paragem Junta, Escola Secundária..."
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
              />
            </div>

            {/* 2. Tipo de local */}
            <div className="space-y-1.5">
              <label
                htmlFor="public-place-category"
                className="block text-xs sm:text-sm font-extrabold text-[#0D316E]"
              >
                2. Tipo de local
              </label>
              <select
                id="public-place-category"
                value={placeCategory}
                onChange={(e) => setPlaceCategory(e.target.value as PublicPlaceCategory)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
              >
                {(
                  Object.entries(PUBLIC_PLACE_CATEGORY_LABELS) as [
                    PublicPlaceCategory,
                    string,
                  ][]
                ).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Província & 4. Distrito ou Município */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="public-place-province"
                  className="block text-xs sm:text-sm font-extrabold text-[#0D316E]"
                >
                  3. Província *
                </label>
                <select
                  id="public-place-province"
                  required
                  value={province}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                >
                  <option value="">Selecione a província</option>
                  {provinces.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="public-place-district"
                  className="block text-xs sm:text-sm font-extrabold text-[#0D316E]"
                >
                  4. Distrito ou Município *
                </label>
                <select
                  id="public-place-district"
                  required
                  disabled={!province}
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                >
                  <option value="">
                    {province ? 'Selecione o distrito/município' : 'Escolha primeiro a província'}
                  </option>
                  {districts.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                  {province && (
                    <option value="__custom__">Outro distrito / município...</option>
                  )}
                </select>
              </div>
            </div>

            {district === '__custom__' && (
              <div className="space-y-1.5">
                <label
                  htmlFor="public-place-custom-district"
                  className="block text-xs font-bold text-slate-700"
                >
                  Indique o nome do distrito ou município *
                </label>
                <input
                  id="public-place-custom-district"
                  type="text"
                  required
                  maxLength={80}
                  value={customDistrict}
                  onChange={(e) => setCustomDistrict(e.target.value)}
                  placeholder="Ex: Marracuene, Dondo, Mocuba..."
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                />
              </div>
            )}

            {/* 5. Bairro, Localidade ou Comunidade */}
            <div className="space-y-1.5">
              <label
                htmlFor="public-place-neighborhood"
                className="block text-xs sm:text-sm font-extrabold text-[#0D316E]"
              >
                5. Bairro, Localidade ou Comunidade *
              </label>
              <input
                id="public-place-neighborhood"
                type="text"
                required
                maxLength={100}
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Ex: Malanga, Alto Maé, Zimpeto, Manga..."
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
              />
              {suggestedNeighborhoods.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Sugestões rápidas:
                  </span>
                  {suggestedNeighborhoods.slice(0, 8).map((nb) => (
                    <button
                      key={nb}
                      type="button"
                      onClick={() => setNeighborhood(nb)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-colors ${
                        neighborhood === nb
                          ? 'bg-[#0D316E] text-white border-[#0D316E]'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {nb}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Localidade / Posto Administrativo (Opcional) */}
            <div className="space-y-1.5">
              <label
                htmlFor="public-place-locality"
                className="block text-xs sm:text-sm font-bold text-slate-700"
              >
                6. Posto Administrativo ou Zona (opcional)
              </label>
              <input
                id="public-place-locality"
                type="text"
                maxLength={100}
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="Preencha apenas se aplicável"
                className="w-full h-10 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
              />
            </div>

            {/* 7. Referência / Como chegar (Opcional) */}
            <div className="space-y-1.5">
              <label
                htmlFor="public-place-reference"
                className="block text-xs sm:text-sm font-extrabold text-[#0D316E]"
              >
                7. Referência ou indicações de como chegar (opcional)
              </label>
              <textarea
                id="public-place-reference"
                rows={3}
                maxLength={500}
                value={referenceDescription}
                onChange={(e) => setReferenceDescription(e.target.value)}
                placeholder="Ex: Próximo à paragem principal, em frente à escola ou ao lado da padaria..."
                className="w-full p-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
              />
            </div>

            {/* Validation / Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-2xl bg-[#EA580C] hover:bg-[#C2410C] active:scale-[0.99] text-white text-base font-extrabold tracking-tight shadow-sm transition-all disabled:opacity-60"
              >
                {isSubmitting ? 'A guardar local...' : 'Registar local na comunidade'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
