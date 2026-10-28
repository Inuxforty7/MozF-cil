import React from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, Briefcase, Grid } from 'lucide-react';
import {
  MOZFACIL_MODULES,
  MozfacilModuleDefinition,
} from '../data/mozfacilModules';

interface ExploreModulesScreenProps {
  onSelectModule: (module: MozfacilModuleDefinition) => void;
  onBack?: () => void;
}

export const ExploreModulesScreen: React.FC<ExploreModulesScreenProps> = ({
  onSelectModule,
  onBack,
}) => {
  return (
    <section
      aria-label="Explore — Diretório de Módulos MozFácil"
      className="w-full max-w-3xl mx-auto relative overflow-hidden pb-4 sm:pb-6"
    >
      {/* Decorative glowing orange swoosh arc on top-right matching the reference print */}
      <svg
        viewBox="0 0 720 180"
        fill="none"
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 w-full h-36 sm:h-44 object-cover"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="mozOrangeArc" x1="350" y1="0" x2="720" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F97316" stopOpacity="0" />
            <stop offset="35%" stopColor="#F97316" stopOpacity="0.85" />
            <stop offset="75%" stopColor="#FB923C" stopOpacity="1" />
            <stop offset="100%" stopColor="#EA580C" stopOpacity="0.9" />
          </linearGradient>
          <radialGradient id="mozCenterGlow" cx="50%" cy="35%" r="50%">
            <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#041942" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="360" cy="70" rx="340" ry="90" fill="url(#mozCenterGlow)" />
        <path
          d="M 410 -4 Q 580 18 725 118 L 725 148 Q 565 36 390 -4 Z"
          fill="url(#mozOrangeArc)"
        />
        <path
          d="M 455 -2 Q 605 24 725 104"
          stroke="#FDBA74"
          strokeWidth="2.5"
          strokeOpacity="0.85"
        />
      </svg>

      {/* Top Explore Header */}
      <div className="relative z-10 text-center pt-0.5 pb-2.5 sm:pb-4 px-1">
        <div className="flex items-center justify-between">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="min-h-[38px] min-w-[38px] rounded-xl bg-white/10 hover:bg-white/20 active:scale-[0.96] border border-white/15 flex items-center justify-center text-white transition-all shrink-0"
              aria-label="Voltar"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
          ) : (
            <div className="w-9 h-9" aria-hidden="true" />
          )}

          <div className="flex flex-col items-center">
            <h1 className="text-[26px] sm:text-4xl font-extrabold tracking-tight text-white leading-none drop-shadow-xs">
              Explore
            </h1>
            {/* Glowing orange underline under Explore */}
            <div className="mt-1.5 h-[2px] w-44 sm:w-64 bg-gradient-to-r from-transparent via-[#F97316] to-transparent" />
          </div>

          <div className="w-8 h-8 sm:w-9 sm:h-9" aria-hidden="true" />
        </div>

        <p className="mt-1.5 text-[12.5px] sm:text-[15px] text-white/95 font-normal max-w-[320px] sm:max-w-md mx-auto leading-[1.24]">
          Descubra serviços, produtos e oportunidades em todo o país.
        </p>
      </div>

      {/* 12 Independent Module Cards — 2 Columns x 6 Rows Matching the Reference Screenshot */}
      <div className="relative z-10 grid grid-cols-1 min-[340px]:grid-cols-2 gap-1.5 sm:gap-2.5">
        {MOZFACIL_MODULES.map((mod) => (
          <button
            key={mod.id}
            type="button"
            onClick={() => onSelectModule(mod)}
            data-module-id={mod.id}
            data-module-number={mod.number}
            aria-label={`${mod.number}. ${mod.title} — ${mod.description}`}
            className="group w-full text-left bg-white hover:bg-slate-50 active:scale-[0.99] rounded-[16px] sm:rounded-[18px] pl-1.5 pr-1 py-1 sm:px-2.5 sm:py-2 shadow-[0_3px_10px_rgba(0,0,0,0.28)] border border-white/95 transition-all flex items-center gap-1.5 sm:gap-2.5 h-[76px] sm:h-[92px] overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
          >
            {/* Left Side: High-Resolution 3D Module Illustration Spanning Card Height */}
            <div className="w-[46px] h-[60px] min-[390px]:w-[52px] min-[390px]:h-[64px] sm:w-[66px] sm:h-[74px] rounded-[11px] overflow-hidden shrink-0 flex items-center justify-center bg-[#FFFDF9]">
              <img
                src={mod.imagePath}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Right Side: Top Row (Orange Badge + Navy Title + Chevron) & Bottom Row (Full-Width Description Under Badge) */}
            <div className="flex-1 min-w-0 h-full flex flex-col justify-center py-0.5 overflow-hidden">
              <div className="flex items-center justify-between gap-0.5 min-w-0">
                <div className="flex items-start gap-1 min-w-0 flex-1 overflow-hidden">
                  <span className="w-[16px] h-[16px] sm:w-[20px] sm:h-[20px] rounded-full bg-gradient-to-b from-[#FB923C] to-[#EA580C] text-white font-extrabold text-[9.5px] sm:text-[11px] flex items-center justify-center shrink-0 shadow-2xs mt-[1px] tabular-nums leading-none">
                    {mod.number}
                  </span>
                  <h2 className="font-extrabold text-[9.5px] min-[390px]:text-[10.5px] sm:text-[13px] text-[#07214E] leading-[1.12] tracking-[-0.025em] min-w-0 flex-1 overflow-hidden">
                    {mod.titleLines.map((line, idx) => (
                      <span key={idx} className="block truncate">
                        {line}
                      </span>
                    ))}
                  </h2>
                </div>

                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#07214E] group-hover:translate-x-0.5 transition-transform shrink-0 stroke-[2.2]" />
              </div>

              <p className="mt-1 sm:mt-1.5 text-[7.8px] min-[390px]:text-[8.5px] sm:text-[10.8px] text-[#1E293B] font-normal leading-[1.16] tracking-[-0.02em] overflow-hidden">
                {mod.descriptionLines.map((line, idx) => (
                  <span key={idx} className="block truncate">
                    {line}
                  </span>
                ))}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

interface ModuleDestinationUnavailableProps {
  module: MozfacilModuleDefinition;
  onBackToExplore: () => void;
  onOpenProfessionalsModule: () => void;
}

export const ModuleDestinationUnavailable: React.FC<ModuleDestinationUnavailableProps> = ({
  module,
  onBackToExplore,
  onOpenProfessionalsModule,
}) => {
  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden mb-20 sm:mb-8">
      <div className="bg-gradient-to-r from-[#061A3E] to-[#0D316E] text-white p-4 sm:p-5 flex items-center gap-3">
        <button
          type="button"
          onClick={onBackToExplore}
          className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-[0.98] border border-white/15 flex items-center gap-1.5 text-xs font-extrabold text-white transition-all shrink-0"
          aria-label="Voltar para Explore"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>Voltar</span>
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#F97316] text-white text-xs font-extrabold flex items-center justify-center shrink-0 tabular-nums">
              {module.number}
            </span>
            <h2 className="text-base sm:text-lg font-extrabold truncate">{module.title}</h2>
          </div>
          <p className="text-xs text-blue-200 truncate">{module.description}</p>
        </div>
      </div>

      <div className="p-6 text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 shadow-xs bg-[#FFFDF9] p-1">
            <img
              src={module.imagePath}
              alt={module.title}
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-extrabold text-[#092452]">
            Módulo {module.number}: {module.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            {module.description}
          </p>
          <p className="text-xs text-slate-500 pt-1">
            Este módulo da plataforma MozFácil encontra-se atualmente em fase de disponibilização.
            O módulo <strong>1. Profissionais e Serviços</strong> já está ativo para consultas e registos.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={onBackToExplore}
            className="w-full sm:w-auto min-h-[42px] px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-[#092452] text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Grid className="w-4 h-4 text-[#F97316]" />
            <span>Voltar ao Explore (12 Módulos)</span>
          </button>

          <button
            type="button"
            onClick={onOpenProfessionalsModule}
            className="w-full sm:w-auto min-h-[42px] px-4 py-2 rounded-xl bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <Briefcase className="w-4 h-4" />
            <span>Abrir Profissionais e Serviços</span>
          </button>
        </div>
      </div>
    </div>
  );
};
