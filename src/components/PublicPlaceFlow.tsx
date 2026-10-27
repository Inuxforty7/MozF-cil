import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Camera,
  CheckCircle2,
  ChevronRight,
  Copy,
  FileText,
  Landmark,
  LocateFixed,
  MapPin,
  PlusCircle,
  Search,
  Share2,
  Sparkles,
  Trash2,
  Upload,
  User,
} from 'lucide-react';
import {
  PUBLIC_PLACE_CATEGORY_LABELS,
  PublicPlace,
  PublicPlaceCategory,
  PublicPlaceOperationalState,
} from '../types/mozfacil';
import {
  getDistrictsByProvince,
  getNeighborhoodsByDistrict,
  getProvinces,
} from '../data/mozambiqueLocations';
import { submitPublicPlace } from '../services/mozfacilService';

const SUPPORTED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

const MAX_RAW_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB raw upload limit before client-side compression

export function formatFileSizeLabel(bytes: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Parses the single multiline "Pontos de referência" field into the structured
 * Firestore schema fields (`nearestChapaStop`, `nearbyInstitutions`, `referenceDescription`).
 */
export function parseReferencePointsInput(rawText: string): {
  nearestChapaStop: string;
  nearbyInstitutions: string;
  referenceDescription: string;
} {
  const cleaned = rawText.trim().replace(/\s+/g, ' ');
  if (!cleaned) {
    return {
      nearestChapaStop: '',
      nearbyInstitutions: '',
      referenceDescription: '',
    };
  }

  const separatorRegex =
    /(?:\s*[,;\n•]\s*|\s+-\s+|\s+(?:ao lado|perto|próximo|proximo|em frente|junto|atrás|atras)\s+(?:de|da|do|das|dos|a|o)?\s*)/i;
  const parts = rawText
    .split(separatorRegex)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    const first = parts[0].slice(0, 150);
    const rest = parts.slice(1).join(', ').slice(0, 300);
    return {
      nearestChapaStop: first,
      nearbyInstitutions: rest || first.slice(0, 300),
      referenceDescription: cleaned.slice(0, 500),
    };
  }

  return {
    nearestChapaStop: cleaned.slice(0, 150),
    nearbyInstitutions: cleaned.slice(0, 300),
    referenceDescription: cleaned.slice(0, 500),
  };
}

/**
 * Compresses an uploaded facade image client-side using HTML5 Canvas so it fits safely
 * inside a Firestore document (< 240 KB base64 JPEG data URL).
 */
async function compressInstitutionImageFile(
  file: File,
  maxDimension = 640,
  quality = 0.74,
  maxCharLimit = 240000
): Promise<string> {
  if (
    file.type &&
    !SUPPORTED_IMAGE_MIME_TYPES.includes(file.type.toLowerCase()) &&
    !file.type.toLowerCase().startsWith('image/')
  ) {
    throw new Error(
      'Formato de ficheiro não suportado. Selecione uma imagem JPG, PNG ou WEBP.'
    );
  }

  if (file.size > MAX_RAW_IMAGE_BYTES) {
    throw new Error(
      'O ficheiro excede o limite máximo de 15 MB. Escolha uma fotografia mais leve.'
    );
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler o ficheiro de imagem.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagem inválido ou corrompido.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível processar a imagem no navegador.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        if (dataUrl.length > maxCharLimit) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.52);
        }
        if (dataUrl.length > maxCharLimit) {
          reject(new Error('A imagem é demasiado grande. Escolha uma fotografia mais leve.'));
          return;
        }
        resolve(dataUrl);
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

const ORDERED_PUBLIC_INSTITUTION_CATEGORIES: Array<{
  id: PublicPlaceCategory;
  label: string;
}> = [
  { id: 'escola_publica', label: 'Escola Pública' },
  { id: 'hospital_centro_saude', label: 'Hospital Público / Centro de Saúde' },
  { id: 'tribunal_procuradoria', label: 'Tribunal / Procuradoria' },
  { id: 'reparticao_direccao', label: 'Repartição Pública / Direcção' },
  { id: 'posto_administrativo_municipio', label: 'Posto Administrativo / Município' },
];

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
  const [selectedCategory, setSelectedCategory] = useState<PublicPlaceCategory | ''>('');
  const [copiedLink, setCopiedLink] = useState(false);

  const provinces = useMemo(() => getProvinces(), []);

  const filteredPlaces = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return publicPlaces.filter((place) => {
      if (place.publicationStatus !== 'published') return false;
      if (selectedProvince && place.province !== selectedProvince) return false;
      if (selectedCategory && place.placeCategory !== selectedCategory) return false;
      if (!q) return true;
      return (
        place.placeName.toLowerCase().includes(q) ||
        place.neighborhood.toLowerCase().includes(q) ||
        place.locality.toLowerCase().includes(q) ||
        place.district.toLowerCase().includes(q) ||
        place.province.toLowerCase().includes(q) ||
        (place.streetOrAvenue || '').toLowerCase().includes(q) ||
        (place.nearestChapaStop || '').toLowerCase().includes(q) ||
        (place.nearbyInstitutions || '').toLowerCase().includes(q) ||
        (place.referenceDescription || '').toLowerCase().includes(q) ||
        (PUBLIC_PLACE_CATEGORY_LABELS[place.placeCategory] || '')
          .toLowerCase()
          .includes(q)
      );
    });
  }, [publicPlaces, searchQuery, selectedProvince, selectedCategory]);

  const handleCopyMozfacilLink = async () => {
    const url = typeof window !== 'undefined' ? window.location.origin : '';
    if (navigator.clipboard && url) {
      try {
        await navigator.clipboard.writeText(url);
        setCopiedLink(true);
      } catch {
        setCopiedLink(false);
      }
    }
  };

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

      {/* Main Instruction Document Card */}
      <div className="bg-white rounded-2xl border-2 border-[#F97316]/85 shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#07214E] via-[#0D316E] to-[#07214E] px-5 py-4 sm:py-5 text-white space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#F97316] flex items-center justify-center shrink-0 shadow-xs">
              <Landmark className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-orange-300">
                INSTRUÇÕES DE PREENCHIMENTO — MOZFÁCIL
              </p>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white leading-snug">
                Instituições Públicas
              </h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-blue-100 pt-1">
            Cadastro feito por cada moçambicano no seu bairro e local de trabalho.
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-5 text-slate-800 text-xs sm:text-sm leading-relaxed">
          {/* Objectivo & Missão solicitada */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-blue-50/80 border border-blue-200 space-y-2">
            <p>
              <strong className="text-[#0D316E]">Objectivo:</strong> Ajudar a cada moçambicano a encontrar de forma fácil e segura a escola, hospital ou serviço público que precisa, em qualquer ponto do país.
            </p>
            <p>
              <strong className="text-[#EA580C]">Missão solicitada:</strong> Ajude a mapear os serviços públicos de Moçambique. Preencha com informações correctas sobre a instituição pública que conhece.
            </p>
          </div>

          {/* Top Quick CTA */}
          <div>
            <button
              type="button"
              onClick={onContinueToForm}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#FF6B00] hover:from-[#C2410C] hover:to-[#EA580C] text-white font-extrabold text-sm sm:text-base shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <span>Continuar para o formulário</span>
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* 9 Numbered Sections */}
          <div className="space-y-3">
            {/* 1. Denominação */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
              <h2 className="font-extrabold text-[#0D316E] text-sm">1. Denominação</h2>
              <p className="text-slate-700">
                Qual é o nome oficial que está na placa ou carimbo da instituição?
              </p>
              <p className="text-xs text-slate-600 italic">
                Exemplos: Escola Primária Completa de Matola C; Centro de Saúde de Ndlavela.
              </p>
            </div>

            {/* 2. Categoria */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5">
              <h2 className="font-extrabold text-[#0D316E] text-sm">2. Categoria</h2>
              <p className="text-slate-700">Que tipo de instituição pública é?</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                {ORDERED_PUBLIC_INSTITUTION_CATEGORIES.map((cat) => (
                  <li
                    key={cat.id}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 font-bold text-xs text-[#0D316E] flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] shrink-0" />
                    <span>{cat.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. GPS */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
              <h2 className="font-extrabold text-[#0D316E] text-sm">3. GPS</h2>
              <p className="text-slate-700">
                Clique em &quot;Automático&quot; quando estiver perto da instituição.
              </p>
              <p className="text-slate-700">
                Ajuste o ponto no mapa até ficar a 4 a 5 metros da entrada principal. Máximo 8 metros.
              </p>
            </div>

            {/* 4. Localização */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
              <h2 className="font-extrabold text-[#0D316E] text-sm">4. Localização</h2>
              <p className="text-slate-700">
                Onde fica? Indique província, distrito, localidade e bairro.
              </p>
            </div>

            {/* 5. Rua / Avenida */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
              <h2 className="font-extrabold text-[#0D316E] text-sm">5. Rua / Avenida</h2>
              <p className="text-slate-700">
                Qual é a rua ou avenida? Se não souber o nome, escreva &quot;Rua sem nome&quot;.
              </p>
            </div>

            {/* 6. Pontos de Referência */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
              <h2 className="font-extrabold text-[#0D316E] text-sm">6. Pontos de Referência</h2>
              <p className="text-slate-700">
                Como explicar para alguém chegar de chapa? Escreva o nome da paragem e indique uma ou duas instituições próximas.
              </p>
              <p className="text-xs text-slate-600 italic">
                Exemplo: Desça na paragem Shoprite, ao lado do Mercado Central.
              </p>
            </div>

            {/* 7. Contactos da Secretaria */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
              <h2 className="font-extrabold text-[#0D316E] text-sm">7. Contactos da Secretaria</h2>
              <p className="text-slate-700">
                Se souber o número da secretaria que atende o público, indique. Se não souber, deixe em branco.
              </p>
            </div>

            {/* 8. Estado do Serviço */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
              <h2 className="font-extrabold text-[#0D316E] text-sm">8. Estado do Serviço</h2>
              <p className="text-slate-700">O que sabe sobre a instituição?</p>
              <div className="flex flex-wrap gap-2 pt-1 text-xs font-bold">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                  ON: Está a funcionar.
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-red-50 text-red-800 border border-red-200">
                  OFF: Instituição encerrada.
                </span>
              </div>
            </div>

            {/* 9. Imagem do Local */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
              <h2 className="font-extrabold text-[#0D316E] text-sm">9. Imagem do Local</h2>
              <p className="text-slate-700">
                Se puder, anexe foto da fachada com a placa visível.
              </p>
            </div>
          </div>

          {/* Closing Section */}
          <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200/90 space-y-2.5">
            <div>
              <h3 className="font-extrabold text-[#0D316E] text-sm">Para terminar</h3>
              <p className="text-slate-700">
                Verifique se os dados estão correctos e clique em &quot;Guardar Formulário&quot;.
              </p>
            </div>

            <p>
              <strong className="text-[#0D316E]">Objectivo:</strong> Juntos, ajudamos cada moçambicano a encontrar a escola, hospital ou serviço público que pretende de forma fácil e mais segura.
            </p>

            <p>
              <strong className="text-[#EA580C]">Segredo:</strong> As aves da mesma aplumagem voam juntas.
            </p>

            <div className="pt-1 space-y-1">
              <h4 className="font-black text-[#EA580C] text-sm">VAMOS!</h4>
              <p className="text-slate-700">
                Vá à instituição mais próxima que conhece, preencha e submeta o formulário. Depois copie o link do MozFácil e envie para pessoas conhecidas, amigos e familiares para fazerem o mesmo na zona deles. Se todos mapearmos um pouco, Moçambique inteiro fica na palma da mão de cada moçambicano.
              </p>
            </div>

            <div className="pt-2 border-t border-orange-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-black text-[#0D316E] text-xs sm:text-sm">
                  MozFácil — Conexões Rápidas
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-600">
                  Feito pelo povo moçambicano, para o povo moçambicano.
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyMozfacilLink}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-orange-300 text-xs font-extrabold text-[#0D316E] hover:bg-orange-100/50 transition-colors shrink-0"
              >
                <Copy className="w-3.5 h-3.5 text-[#EA580C]" />
                <span>{copiedLink ? 'Link do MozFácil copiado!' : 'Copiar link do MozFácil'}</span>
              </button>
            </div>
          </div>

          {/* Primary Bottom Continuation Button */}
          <div className="pt-1">
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

      {/* Community Directory of Registered Public Institutions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-[#0D316E]" />
            <h2 className="text-sm sm:text-base font-extrabold text-[#0D316E]">
              Instituições Públicas Mapeadas ({filteredPlaces.length})
            </h2>
          </div>

          <button
            type="button"
            onClick={onContinueToForm}
            className="inline-flex items-center gap-1 text-xs font-extrabold text-[#EA580C] hover:underline"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Mapear Instituição</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Procurar escola, hospital, bairro, paragem..."
              className="w-full min-h-[48px] h-12 pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            />
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as PublicPlaceCategory | '')}
              aria-label="Filtrar por categoria"
              className="w-full min-h-[48px] h-12 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            >
              <option value="">Todas as Categorias</option>
              {ORDERED_PUBLIC_INSTITUTION_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              aria-label="Filtrar por província"
              className="w-full min-h-[48px] h-12 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#F97316]"
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
          <div className="text-center py-6 px-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
            <MapPin className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-xs sm:text-sm font-bold text-slate-700">
              Ainda não existem instituições públicas registadas com este filtro.
            </p>
            <button
              type="button"
              onClick={onContinueToForm}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EA580C] text-white text-xs font-extrabold hover:bg-[#C2410C] transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Registar primeira instituição pública</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto pr-0.5">
            {filteredPlaces.map((place) => (
              <div
                key={place.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white transition-colors flex gap-3 items-start"
              >
                {place.photoUrl ? (
                  <img
                    src={place.photoUrl}
                    alt={place.placeName}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <Landmark className="w-5 h-5 text-[#0D316E]" />
                  </div>
                )}

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[11px] font-bold text-[#EA580C] truncate">
                      {PUBLIC_PLACE_CATEGORY_LABELS[place.placeCategory] || 'Instituição Pública'}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                        place.operationalState === 'off'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {place.operationalState === 'off' ? 'OFF' : 'ON'}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-extrabold text-[#0D316E] leading-snug">
                    {place.placeName}
                  </h3>

                  <p className="text-[11px] text-slate-600">
                    {place.neighborhood}
                    {place.locality ? ` · ${place.locality}` : ''} · {place.district} (
                    {place.province})
                  </p>

                  {place.streetOrAvenue && (
                    <p className="text-[11px] text-slate-600">
                      <strong>Rua/Av.:</strong> {place.streetOrAvenue}
                    </p>
                  )}

                  {(place.nearestChapaStop || place.nearbyInstitutions) && (
                    <p className="text-[11px] text-slate-600">
                      <strong>Ref.:</strong>{' '}
                      {place.referenceDescription
                        ? place.referenceDescription
                        : `${place.nearestChapaStop ? `Paragem ${place.nearestChapaStop}` : ''}${
                            place.nearestChapaStop && place.nearbyInstitutions ? ' · ' : ''
                          }${place.nearbyInstitutions || ''}`}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {place.secretaryPhone && (
                      <a
                        href={`tel:${place.secretaryPhone}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0D316E] hover:underline"
                      >
                        <span>Secretaria: {place.secretaryPhone}</span>
                      </a>
                    )}
                    {place.hasGps && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#EA580C] hover:underline"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>Ver no Mapa</span>
                      </a>
                    )}
                  </div>
                </div>
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
  // Section 1 — Denominação
  const [placeName, setPlaceName] = useState('');
  // Section 2 — Categoria (starts empty to show "Selecione a categoria" placeholder matching screenshot)
  const [placeCategory, setPlaceCategory] = useState<PublicPlaceCategory | ''>('');
  // Section 3 — GPS
  const [hasGps, setHasGps] = useState(false);
  const [latitude, setLatitude] = useState<number>(-25.9692);
  const [longitude, setLongitude] = useState<number>(32.5732);
  const [gpsAccuracyMeters, setGpsAccuracyMeters] = useState<number>(0);
  const [isCapturingGps, setIsCapturingGps] = useState(false);
  const [showGpsAdjustPad, setShowGpsAdjustPad] = useState(false);
  const [gpsFeedback, setGpsFeedback] = useState<string | null>(null);
  const [gpsWarning, setGpsWarning] = useState<string | null>(null);
  // Section 4 — Província • Distrito • Localidade • Bairro
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [customDistrict, setCustomDistrict] = useState('');
  const [locality, setLocality] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  // Section 5 — Rua / Avenida
  const [streetOrAvenue, setStreetOrAvenue] = useState('');
  // Section 6 — Pontos de referência (single multiline input matching screenshot)
  const [referencePointsInput, setReferencePointsInput] = useState('');
  // Section 7 — Contactos Secretaria (optional)
  const [secretaryPhone, setSecretaryPhone] = useState('');
  // Section 8 — Existência de serviços (ON / OFF)
  const [operationalState, setOperationalState] = useState<PublicPlaceOperationalState>('on');
  // Section 9 — Imagem do local — opcional
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFileName, setPhotoFileName] = useState('');
  const [photoFileSizeLabel, setPhotoFileSizeLabel] = useState('');
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedPlace, setSubmittedPlace] = useState<PublicPlace | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

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

  // Section 3: GPS Automatic capture + real accuracy reporting
  const handleAutomaticGps = () => {
    setGpsFeedback(null);
    setGpsWarning(null);
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsWarning(
        'O seu navegador ou dispositivo não disponibiliza geolocalização automática. Pode ajustar o marcador manualmente abaixo.'
      );
      setShowGpsAdjustPad(true);
      return;
    }

    setIsCapturingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsCapturingGps(false);
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        const acc = Math.round((position.coords.accuracy || 0) * 10) / 10;

        setLatitude(lat);
        setLongitude(lng);
        setGpsAccuracyMeters(acc);
        setHasGps(true);
        setShowGpsAdjustPad(true);

        if (acc > 0 && acc <= 8) {
          setGpsFeedback(
            `GPS capturado (${lat}, ${lng}) com precisão de ${acc} m (dentro do máximo recomendado de 8m).`
          );
        } else {
          setGpsFeedback(
            `Coordenadas capturadas: ${lat}, ${lng}${acc > 0 ? ` (precisão: ${acc} m)` : ''}.`
          );
          if (acc > 8) {
            setGpsWarning(
              `Precisão reportada pelo dispositivo: ${acc} m. Ajuste o ponto abaixo se necessário para ficar a 4 a 5 metros da entrada principal (máximo 8m).`
            );
          }
        }
      },
      (err) => {
        setIsCapturingGps(false);
        setShowGpsAdjustPad(true);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsWarning(
            'Permissão de localização recusada no dispositivo. Autorize o GPS no navegador ou ajuste as coordenadas manualmente abaixo.'
          );
        } else {
          setGpsWarning(
            'Sinal GPS indisponível neste momento. Pode ajustar as coordenadas manualmente ou prosseguir com a localização administrativa.'
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  // Fine adjustment of ~1 meter (~0.000009 degrees) in any cardinal direction
  const nudgeGpsMeters = (deltaNorthMeters: number, deltaEastMeters: number) => {
    const meterInDegrees = 0.000009;
    setLatitude((prev) => Number((prev + deltaNorthMeters * meterInDegrees).toFixed(6)));
    setLongitude((prev) => Number((prev + deltaEastMeters * meterInDegrees).toFixed(6)));
    setHasGps(true);
    setGpsFeedback(
      'Ponto ajustado manualmente (+1 metro em relação à entrada principal).'
    );
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);
    setIsCompressingPhoto(true);
    try {
      const compressedDataUrl = await compressInstitutionImageFile(file);
      setPhotoUrl(compressedDataUrl);
      setPhotoFileName(file.name || 'fachada.jpg');
      setPhotoFileSizeLabel(formatFileSizeLabel(file.size));
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Não foi possível processar a imagem selecionada.'
      );
    } finally {
      setIsCompressingPhoto(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleClearPhoto = () => {
    setPhotoUrl('');
    setPhotoFileName('');
    setPhotoFileSizeLabel('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (placeName.trim().length < 2) {
      setErrorMessage(
        '1. Denominação: Indique o nome oficial que está na placa ou carimbo da instituição.'
      );
      return;
    }
    if (!placeCategory) {
      setErrorMessage('2. Categoria: Por favor, selecione a categoria da instituição pública.');
      return;
    }
    if (!province) {
      setErrorMessage('4. Localização: Por favor, selecione a província.');
      return;
    }
    if (!effectiveDistrict || effectiveDistrict.length < 2) {
      setErrorMessage('4. Localização: Por favor, selecione ou indique o distrito.');
      return;
    }
    if (!locality.trim()) {
      setErrorMessage('4. Localização: Por favor, indique a localidade.');
      return;
    }
    if (!neighborhood.trim()) {
      setErrorMessage('4. Localização: Por favor, indique o bairro.');
      return;
    }
    if (streetOrAvenue.trim().length < 2) {
      setErrorMessage(
        '5. Rua / Avenida: Indique a rua ou avenida. Se não souber o nome, escreva "Rua sem nome".'
      );
      return;
    }

    const parsedRefs = parseReferencePointsInput(referencePointsInput);
    if (!parsedRefs.nearestChapaStop || parsedRefs.referenceDescription.length < 3) {
      setErrorMessage(
        '6. Pontos de referência: Digite a paragem de chapa e outros pontos de referência próximos.'
      );
      return;
    }

    if (
      secretaryPhone.trim().length > 0 &&
      !/^[0-9+\-\s()]{6,40}$/.test(secretaryPhone.trim())
    ) {
      setErrorMessage(
        '7. Contactos Secretaria: Indique um número de telefone válido ou deixe em branco.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await submitPublicPlace({
        placeName: placeName.trim(),
        placeCategory,
        hasGps,
        latitude,
        longitude,
        gpsAccuracyMeters,
        province,
        district: effectiveDistrict,
        locality: locality.trim(),
        neighborhood: neighborhood.trim(),
        streetOrAvenue: streetOrAvenue.trim(),
        nearestChapaStop: parsedRefs.nearestChapaStop,
        nearbyInstitutions: parsedRefs.nearbyInstitutions,
        referenceDescription: parsedRefs.referenceDescription,
        secretaryPhone: secretaryPhone.trim(),
        operationalState,
        photoUrl,
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
          : 'Não foi possível guardar o formulário neste momento.';
      setErrorMessage(rawMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNewPlace = () => {
    setPlaceName('');
    setPlaceCategory('');
    setHasGps(false);
    setGpsAccuracyMeters(0);
    setGpsFeedback(null);
    setGpsWarning(null);
    setShowGpsAdjustPad(false);
    setStreetOrAvenue('');
    setReferencePointsInput('');
    setSecretaryPhone('');
    setOperationalState('on');
    handleClearPhoto();
    setErrorMessage(null);
    setSubmittedPlace(null);
  };

  const handleCopyShareLink = async () => {
    const url = typeof window !== 'undefined' ? window.location.origin : '';
    if (navigator.clipboard && url) {
      try {
        await navigator.clipboard.writeText(url);
        setCopiedShareLink(true);
      } catch {
        setCopiedShareLink(false);
      }
    }
  };

  const gpsDisplayText = isCapturingGps
    ? 'A capturar sinal GPS...'
    : hasGps
      ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}${
          gpsAccuracyMeters > 0 ? ` (±${gpsAccuracyMeters}m)` : ''
        }`
      : '';

  return (
    <div className="max-w-lg mx-auto py-1 sm:py-3 px-1.5 sm:px-4">
      {/* Main Form Card matching the supplied visual reference */}
      <div className="bg-[#FBFBFD] rounded-[26px] border border-slate-200/95 shadow-[0_12px_36px_rgba(9,30,66,0.12)] overflow-hidden">
        {/* 1. Top Blue-to-Orange Brand Banner matching visual reference */}
        <div className="bg-gradient-to-r from-[#0645D6] via-[#2E59A8] to-[#FF7A00] px-4 sm:px-5 py-3.5 text-white flex items-center justify-between gap-2">
          {/* Left: Document Badge + MOZFÁCIL Conexões Rápidas */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#2B65EC]/90 via-[#5E6AB0]/85 to-[#F97316]/90 border border-white/35 shadow-md flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-white stroke-[2.2]" />
            </div>

            <div className="min-w-0">
              <div className="text-xl sm:text-2xl font-black tracking-wide leading-none flex items-center">
                <span className="text-white">MOZ</span>
                <span className="text-[#FF8A1F]">FÁCIL</span>
              </div>
              <div className="text-xs sm:text-[13px] italic font-medium text-white/95 tracking-wide mt-0.5">
                Conexões Rápidas
              </div>
              <div className="h-[2px] w-full bg-gradient-to-r from-white/20 via-[#FF8A1F] to-transparent mt-0.5" />
            </div>
          </div>

          {/* Right: Header Icons (Instructions/Notifications, Search/Directory, User) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onBackToInstructions}
              title="Ver instruções de preenchimento"
              aria-label="Ver instruções de preenchimento"
              className="w-9 h-9 rounded-full hover:bg-white/15 flex items-center justify-center text-white transition-colors"
            >
              <Bell className="w-4 h-4 sm:w-[18px] sm:h-[18px] fill-current" />
            </button>
            <button
              type="button"
              onClick={onBackToInstructions}
              title="Pesquisar instituições públicas"
              aria-label="Pesquisar instituições públicas"
              className="w-9 h-9 rounded-full hover:bg-white/15 flex items-center justify-center text-white transition-colors"
            >
              <Search className="w-4 h-4 sm:w-[18px] sm:h-[18px] stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={onBackToInstructions}
              title="Voltar às instruções"
              aria-label="Voltar às instruções"
              className="w-8 h-8 rounded-full bg-white/25 hover:bg-white/35 border border-white/50 flex items-center justify-center text-white transition-colors"
            >
              <User className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>

        {/* Sub-header Bar (Navigation & Verified Context — no unverified NUIT/Alvará hardcoded) */}
        <div className="bg-[#F4F6FA] border-b border-slate-200/90 px-4 sm:px-5 py-2 flex items-center justify-between gap-2 text-xs text-slate-700">
          <span className="font-semibold text-[#091E42] truncate">
            Instituições Públicas • Moçambique
          </span>
          <button
            type="button"
            onClick={onBackToInstructions}
            className="inline-flex items-center gap-1 font-extrabold text-[#0D316E] hover:text-[#EA580C] transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#EA580C]" />
            <span>Instruções</span>
          </button>
        </div>

        {submittedPlace ? (
          <div className="p-5 sm:p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-extrabold text-[#091E42]">
                Formulário guardado com sucesso!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Obrigado por mapear <strong>{submittedPlace.placeName}</strong> em{' '}
                <strong>
                  {submittedPlace.neighborhood}, {submittedPlace.district} (
                  {submittedPlace.province})
                </strong>
                .
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5 text-slate-700">
              <div>
                <strong>1. Denominação:</strong> {submittedPlace.placeName}
              </div>
              <div>
                <strong>2. Categoria:</strong>{' '}
                {PUBLIC_PLACE_CATEGORY_LABELS[submittedPlace.placeCategory]}
              </div>
              <div>
                <strong>3. GPS:</strong>{' '}
                {submittedPlace.hasGps
                  ? `${submittedPlace.latitude}, ${submittedPlace.longitude}${
                      submittedPlace.gpsAccuracyMeters > 0
                        ? ` (precisão: ${submittedPlace.gpsAccuracyMeters}m)`
                        : ''
                    }`
                  : 'Registado sem captura automática de GPS'}
              </div>
              <div>
                <strong>4. Localização:</strong> {submittedPlace.province} •{' '}
                {submittedPlace.district} • {submittedPlace.locality} •{' '}
                {submittedPlace.neighborhood}
              </div>
              <div>
                <strong>5. Rua / Avenida:</strong> {submittedPlace.streetOrAvenue}
              </div>
              <div>
                <strong>6. Pontos de referência:</strong>{' '}
                {submittedPlace.referenceDescription ||
                  `${submittedPlace.nearestChapaStop} — ${submittedPlace.nearbyInstitutions}`}
              </div>
              {submittedPlace.secretaryPhone && (
                <div>
                  <strong>7. Contactos Secretaria:</strong> {submittedPlace.secretaryPhone}
                </div>
              )}
              <div>
                <strong>8. Existência de serviços:</strong>{' '}
                {submittedPlace.operationalState === 'on'
                  ? 'ON (Está a funcionar)'
                  : 'OFF (Instituição encerrada)'}
              </div>
            </div>

            {/* VAMOS! Call to action to copy & share MozFácil link */}
            <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-left space-y-2">
              <div className="text-xs font-black text-[#EA580C]">
                VAMOS! Partilhe o MozFácil com amigos e familiares
              </div>
              <p className="text-xs text-slate-700">
                Copie o link do MozFácil e envie para pessoas conhecidas, amigos e familiares para fazerem o mesmo na zona deles.
              </p>
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-orange-300 text-xs font-extrabold text-[#0D316E] hover:bg-orange-100/50 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-[#EA580C]" />
                <span>
                  {copiedShareLink ? 'Link copiado com sucesso!' : 'Copiar link do MozFácil'}
                </span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleResetForNewPlace}
                className="flex-1 py-3 px-4 rounded-full bg-gradient-to-r from-[#0052FF] via-[#2962EB] to-[#FF7A00] text-white font-extrabold text-xs sm:text-sm transition-opacity hover:opacity-95"
              >
                Mapear outra instituição pública
              </button>
              <button
                type="button"
                onClick={onBackToInstructions}
                className="flex-1 py-3 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-[#091E42] font-extrabold text-xs sm:text-sm transition-colors"
              >
                Ver instruções e instituições
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-4 sm:px-6 pt-5 pb-6 space-y-5">
            {/* Form Heading Block matching screenshot */}
            <div className="space-y-1 pb-1">
              <h1 className="text-[21px] sm:text-[25px] font-black text-[#091E42] tracking-tight leading-tight">
                Cadastro Formulário Editável
              </h1>
              <p className="text-[13px] sm:text-[15px] font-extrabold text-[#EA580C] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
                <span>9 Secções • Preenchimento automático</span>
              </p>
            </div>

            {/* SECTION 1 — Denominação */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-gradient-to-b from-[#FF8524] to-[#EA580C] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center shadow-2xs shrink-0">
                  1
                </span>
                <label
                  htmlFor="public-place-name"
                  className="text-[15px] sm:text-[16px] font-extrabold text-[#091E42] leading-snug"
                >
                  Denominação
                </label>
              </div>
              <div className="pl-0 min-[360px]:pl-9">
                <input
                  id="public-place-name"
                  type="text"
                  required
                  maxLength={120}
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  placeholder="Digite a denominação"
                  className="w-full min-h-[48px] h-12 px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm sm:text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-transparent"
                />
              </div>
            </div>

            {/* SECTION 2 — Categoria */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-gradient-to-b from-[#FF8524] to-[#EA580C] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center shadow-2xs shrink-0">
                  2
                </span>
                <label
                  htmlFor="public-place-category"
                  className="text-[15px] sm:text-[16px] font-extrabold text-[#091E42] leading-snug"
                >
                  Categoria
                </label>
              </div>
              <div className="pl-0 min-[360px]:pl-9">
                <select
                  id="public-place-category"
                  required
                  value={placeCategory}
                  onChange={(e) => setPlaceCategory(e.target.value as PublicPlaceCategory | '')}
                  className={`w-full min-h-[48px] h-12 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm sm:text-[15px] focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-transparent ${
                    placeCategory ? 'text-slate-900 font-semibold' : 'text-slate-500'
                  }`}
                >
                  <option value="">Selecione a categoria</option>
                  {ORDERED_PUBLIC_INSTITUTION_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id} className="text-slate-900 font-medium">
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SECTION 3 — GPS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-gradient-to-b from-[#FF8524] to-[#EA580C] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center shadow-2xs shrink-0">
                    3
                  </span>
                  <label
                    htmlFor="public-place-gps-display"
                    className="text-[15px] sm:text-[16px] font-extrabold text-[#091E42] leading-snug"
                  >
                    GPS
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => setShowGpsAdjustPad((prev) => !prev)}
                  className="text-[11px] font-bold text-[#0D316E] hover:text-[#EA580C] underline"
                >
                  {showGpsAdjustPad ? 'Ocultar ajuste do mapa' : 'Ajustar ponto (4–5m)'}
                </button>
              </div>

              <div className="pl-0 min-[360px]:pl-9 space-y-2.5">
                <div className="flex flex-col min-[380px]:flex-row items-stretch min-[380px]:items-center gap-2.5">
                  <input
                    id="public-place-gps-display"
                    type="text"
                    readOnly
                    value={gpsDisplayText}
                    onClick={() => setShowGpsAdjustPad(true)}
                    placeholder="Localização GPS — Capturar..."
                    className="w-full min-[380px]:flex-1 min-w-0 min-h-[48px] h-12 px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                  />

                  <button
                    type="button"
                    onClick={handleAutomaticGps}
                    disabled={isCapturingGps}
                    className="min-h-[48px] h-12 px-4 rounded-xl bg-gradient-to-b from-[#FF8524] to-[#EA580C] hover:from-[#F97316] hover:to-[#C2410C] text-white font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-[0.99] disabled:opacity-60 shrink-0"
                  >
                    <LocateFixed className="w-4 h-4 text-white stroke-[2.2]" />
                    <span>{isCapturingGps ? 'A capturar...' : 'Automático'}</span>
                  </button>
                </div>

                {gpsFeedback && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                    {gpsFeedback}
                  </div>
                )}

                {gpsWarning && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900">
                    {gpsWarning}
                  </div>
                )}

                {showGpsAdjustPad && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                      <span className="font-bold text-[#091E42]">
                        Ajuste fino do marcador (4 a 5m da entrada principal • máx. 8m):
                      </span>
                      {hasGps && gpsAccuracyMeters > 0 && (
                        <span className="font-extrabold text-[#EA580C]">
                          Precisão: {gpsAccuracyMeters} m
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div />
                      <button
                        type="button"
                        onClick={() => nudgeGpsMeters(1, 0)}
                        className="py-2 px-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[11px] font-extrabold text-[#091E42]"
                      >
                        ▲ Norte (+1m)
                      </button>
                      <div />
                      <button
                        type="button"
                        onClick={() => nudgeGpsMeters(0, -1)}
                        className="py-2 px-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[11px] font-extrabold text-[#091E42]"
                      >
                        ◀ Oeste (+1m)
                      </button>
                      <div className="py-2 px-1 rounded-lg bg-orange-50 border border-orange-200 text-[10px] font-extrabold text-[#EA580C] flex items-center justify-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>4–5m</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => nudgeGpsMeters(0, 1)}
                        className="py-2 px-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[11px] font-extrabold text-[#091E42]"
                      >
                        Este (+1m) ▶
                      </button>
                      <div />
                      <button
                        type="button"
                        onClick={() => nudgeGpsMeters(-1, 0)}
                        className="py-2 px-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[11px] font-extrabold text-[#091E42]"
                      >
                        ▼ Sul (+1m)
                      </button>
                      <div />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label
                          htmlFor="public-place-lat"
                          className="block text-[11px] font-bold text-slate-600 mb-1"
                        >
                          Latitude
                        </label>
                        <input
                          id="public-place-lat"
                          type="number"
                          step="0.000001"
                          value={latitude}
                          onChange={(e) => {
                            setLatitude(Number(e.target.value) || 0);
                            setHasGps(true);
                          }}
                          className="w-full min-h-[44px] h-11 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-mono text-slate-800"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="public-place-lng"
                          className="block text-[11px] font-bold text-slate-600 mb-1"
                        >
                          Longitude
                        </label>
                        <input
                          id="public-place-lng"
                          type="number"
                          step="0.000001"
                          value={longitude}
                          onChange={(e) => {
                            setLongitude(Number(e.target.value) || 0);
                            setHasGps(true);
                          }}
                          className="w-full min-h-[44px] h-11 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-mono text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 4 — Província • Distrito • Localidade • Bairro */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-gradient-to-b from-[#FF8524] to-[#EA580C] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center shadow-2xs shrink-0">
                  4
                </span>
                <span className="text-[15px] sm:text-[16px] font-extrabold text-[#091E42] leading-snug">
                  Província • Distrito • Localidade • Bairro
                </span>
              </div>

              <div className="pl-0 min-[360px]:pl-9 space-y-2.5">
                <div className="grid grid-cols-1 min-[340px]:grid-cols-2 gap-3">
                  {/* Província */}
                  <div>
                    <select
                      id="public-place-province"
                      aria-label="Província"
                      required
                      value={province}
                      onChange={(e) => handleProvinceChange(e.target.value)}
                      className={`w-full min-h-[48px] h-12 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-transparent ${
                        province ? 'text-slate-900 font-semibold' : 'text-slate-500'
                      }`}
                    >
                      <option value="">Província</option>
                      {provinces.map((prov) => (
                        <option key={prov} value={prov} className="text-slate-900 font-medium">
                          {prov}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Distrito */}
                  <div>
                    <select
                      id="public-place-district"
                      aria-label="Distrito"
                      required
                      disabled={!province}
                      value={district}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      className={`w-full min-h-[48px] h-12 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-transparent ${
                        district ? 'text-slate-900 font-semibold' : 'text-slate-500'
                      }`}
                    >
                      <option value="">Distrito</option>
                      {districts.map((dist) => (
                        <option key={dist} value={dist} className="text-slate-900 font-medium">
                          {dist}
                        </option>
                      ))}
                      {province && (
                        <option value="__custom__" className="text-slate-900 font-medium">
                          Outro distrito...
                        </option>
                      )}
                    </select>
                  </div>

                  {/* Localidade */}
                  <div>
                    <input
                      id="public-place-locality"
                      aria-label="Localidade"
                      type="text"
                      required
                      maxLength={100}
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      placeholder="Localidade"
                      className="w-full min-h-[48px] h-12 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-transparent"
                    />
                  </div>

                  {/* Bairro */}
                  <div>
                    <input
                      id="public-place-neighborhood"
                      aria-label="Bairro"
                      type="text"
                      required
                      maxLength={100}
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder="Bairro"
                      className="w-full min-h-[48px] h-12 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-transparent"
                    />
                  </div>
                </div>

                {district === '__custom__' && (
                  <input
                    id="public-place-custom-district"
                    type="text"
                    required
                    maxLength={80}
                    value={customDistrict}
                    onChange={(e) => setCustomDistrict(e.target.value)}
                    placeholder="Digite o nome do distrito"
                    className="w-full min-h-[48px] h-12 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                  />
                )}

                {suggestedNeighborhoods.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[11px] font-semibold text-slate-500">Sugestões:</span>
                    {suggestedNeighborhoods.slice(0, 6).map((nb) => (
                      <button
                        key={nb}
                        type="button"
                        onClick={() => {
                          setNeighborhood(nb);
                          if (!locality) setLocality(nb);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                          neighborhood === nb
                            ? 'bg-[#091E42] text-white border-[#091E42]'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {nb}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 5 — Rua / Avenida */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-gradient-to-b from-[#FF8524] to-[#EA580C] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center shadow-2xs shrink-0">
                    5
                  </span>
                  <label
                    htmlFor="public-place-street"
                    className="text-[15px] sm:text-[16px] font-extrabold text-[#091E42] leading-snug"
                  >
                    Rua / Avenida
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => setStreetOrAvenue('Rua sem nome')}
                  className="text-[11px] font-bold text-[#EA580C] hover:underline"
                >
                  Usar &quot;Rua sem nome&quot;
                </button>
              </div>

              <div className="pl-0 min-[360px]:pl-9">
                <input
                  id="public-place-street"
                  type="text"
                  required
                  maxLength={200}
                  value={streetOrAvenue}
                  onChange={(e) => setStreetOrAvenue(e.target.value)}
                  placeholder="Digite a rua ou avenida"
                  className="w-full min-h-[48px] h-12 px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm sm:text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-transparent"
                />
              </div>
            </div>

            {/* SECTION 6 — Pontos de referência */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-gradient-to-b from-[#FF8524] to-[#EA580C] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center shadow-2xs shrink-0">
                  6
                </span>
                <label
                  htmlFor="public-place-references"
                  className="text-[15px] sm:text-[16px] font-extrabold text-[#091E42] leading-snug"
                >
                  Pontos de referência
                </label>
              </div>

              <div className="pl-0 min-[360px]:pl-9">
                <textarea
                  id="public-place-references"
                  required
                  rows={3}
                  maxLength={500}
                  value={referencePointsInput}
                  onChange={(e) => setReferencePointsInput(e.target.value)}
                  placeholder="Digite a paragem de chapa e outros pontos ex: Paragem Shoprite ao lado da Farmácia etc"
                  className="w-full min-h-[88px] px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-transparent"
                />
              </div>
            </div>

            {/* SECTION 7 — Contactos Secretaria */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-gradient-to-b from-[#FF8524] to-[#EA580C] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center shadow-2xs shrink-0">
                  7
                </span>
                <label
                  htmlFor="public-place-secretary-phone"
                  className="text-[15px] sm:text-[16px] font-extrabold text-[#091E42] leading-snug"
                >
                  Contactos Secretaria
                </label>
              </div>

              <div className="pl-0 min-[360px]:pl-9">
                <input
                  id="public-place-secretary-phone"
                  type="tel"
                  maxLength={40}
                  value={secretaryPhone}
                  onChange={(e) => setSecretaryPhone(e.target.value)}
                  placeholder="Digite o contacto da secretaria"
                  className="w-full min-h-[48px] h-12 px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm sm:text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-transparent"
                />
              </div>
            </div>

            {/* SECTION 8 — Existência de serviços */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-gradient-to-b from-[#FF8524] to-[#EA580C] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center shadow-2xs shrink-0">
                  8
                </span>
                <span className="text-[15px] sm:text-[16px] font-extrabold text-[#091E42] leading-snug">
                  Existência de serviços
                </span>
              </div>

              <div className="pl-0 min-[360px]:pl-9">
                <div className="grid grid-cols-2 gap-3">
                  {/* ON Option */}
                  <button
                    type="button"
                    aria-pressed={operationalState === 'on'}
                    title="ON: Está a funcionar"
                    onClick={() => setOperationalState('on')}
                    className={`min-h-[48px] h-12 rounded-xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all ${
                      operationalState === 'on'
                        ? 'bg-gradient-to-b from-[#29B354] to-[#1E9643] border border-[#198239] text-white shadow-xs'
                        : 'bg-[#F3F4F6] border border-slate-300 text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    {operationalState === 'on' ? (
                      <CheckCircle2 className="w-5 h-5 text-white stroke-[2.3]" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border-2 border-slate-400 inline-block" />
                    )}
                    <span>ON</span>
                  </button>

                  {/* OFF Option */}
                  <button
                    type="button"
                    aria-pressed={operationalState === 'off'}
                    title="OFF: Instituição encerrada"
                    onClick={() => setOperationalState('off')}
                    className={`min-h-[48px] h-12 rounded-xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all ${
                      operationalState === 'off'
                        ? 'bg-slate-700 border border-slate-800 text-white shadow-xs'
                        : 'bg-[#F3F4F6] border border-slate-300 text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    {operationalState === 'off' ? (
                      <CheckCircle2 className="w-5 h-5 text-white stroke-[2.3]" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border-2 border-slate-400 inline-block" />
                    )}
                    <span>OFF</span>
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 9 — Imagem do local — opcional */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-gradient-to-b from-[#FF8524] to-[#EA580C] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center shadow-2xs shrink-0">
                  9
                </span>
                <span className="text-[15px] sm:text-[16px] font-extrabold text-[#091E42] leading-snug">
                  Imagem do local — opcional
                </span>
              </div>

              <div className="pl-0 min-[360px]:pl-9">
                <input
                  ref={fileInputRef}
                  id="public-place-photo-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/*"
                  onChange={handlePhotoFileChange}
                  className="hidden"
                />

                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-2.5 sm:p-3 flex items-center justify-between gap-3">
                  {/* Left Thumbnail or Placeholder */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt="Preview da fachada"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  {/* Middle Filename & Size / Status */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="min-w-0 flex-1 cursor-pointer"
                  >
                    {photoUrl ? (
                      <>
                        <div className="font-extrabold text-xs sm:text-sm text-[#091E42] truncate">
                          {photoFileName || 'fachada.jpg'}
                        </div>
                        <div className="text-[11px] sm:text-xs text-slate-500 truncate">
                          Preview: {photoFileName || 'fachada.jpg'}
                          {photoFileSizeLabel ? ` • ${photoFileSizeLabel}` : ''}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-extrabold text-xs sm:text-sm text-[#091E42] truncate">
                          {isCompressingPhoto
                            ? 'A processar fotografia...'
                            : 'Anexar foto da fachada'}
                        </div>
                        <div className="text-[11px] sm:text-xs text-slate-500 truncate">
                          Preview: opcional • JPG, PNG ou WEBP
                        </div>
                      </>
                    )}
                  </div>

                  {/* Right Action: "Alterar" + Upload Icon (plus optional clear button) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isCompressingPhoto}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#EA580C] hover:bg-orange-50 font-extrabold text-xs sm:text-sm transition-colors disabled:opacity-60"
                    >
                      <span>Alterar</span>
                      <Upload className="w-4 h-4 stroke-[2.3]" />
                    </button>

                    {photoUrl && (
                      <button
                        type="button"
                        onClick={handleClearPhoto}
                        title="Remover imagem"
                        aria-label="Remover imagem"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Validation / Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Main Submission Button ("Guardar Formulário") matching visual reference */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isCompressingPhoto}
                className="w-full py-3.5 sm:py-4 px-6 rounded-full bg-gradient-to-r from-[#0052FF] via-[#2563EB] to-[#FF7A00] hover:from-[#0045D8] hover:via-[#1D4ED8] hover:to-[#EA580C] text-white font-extrabold text-base sm:text-lg tracking-tight shadow-[0_6px_20px_rgba(0,82,255,0.28)] flex items-center justify-center transition-all active:scale-[0.99] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C] focus-visible:ring-offset-2"
              >
                <span>{isSubmitting ? 'A guardar formulário...' : 'Guardar Formulário'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
