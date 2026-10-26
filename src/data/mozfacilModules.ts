export type MozfacilModuleId =
  | 'professionals_services'
  | 'companies_institutions'
  | 'shopping_opportunities'
  | 'real_estate_accommodation'
  | 'transport_vehicles'
  | 'entertainment_relationships'
  | 'lost_and_found'
  | 'mourning_funeral'
  | 'faith_traditional_medicine'
  | 'tourism_travel'
  | 's2s_relationships'
  | 'turma_dos_vencedores';

export interface MozfacilModuleDefinition {
  id: MozfacilModuleId;
  number: number;
  title: string;
  titleLines: readonly string[];
  description: string;
  descriptionLines: readonly string[];
  routePath: string;
  imagePath: string;
  isAvailable: boolean;
}

/**
 * Single source of truth for all 12 original MozFácil platform modules.
 * Preserves exact numbering (1-12), Portuguese titles, descriptions, illustrations, and explicit route paths.
 */
export const MOZFACIL_MODULES: readonly MozfacilModuleDefinition[] = [
  {
    id: 'professionals_services',
    number: 1,
    title: 'Profissionais e Serviços',
    titleLines: ['Profissionais', 'e Serviços'],
    description: 'Profissionais independentes e vendedores ambulantes.',
    descriptionLines: ['Profissionais independentes', 'e vendedores ambulantes.'],
    routePath: '/profissionais',
    imagePath: '/assets/modules/mod_1.png',
    isAvailable: true,
  },
  {
    id: 'companies_institutions',
    number: 2,
    title: 'Empresas e Instituições',
    titleLines: ['Empresas', 'e Instituições'],
    description: 'Empresas privadas, instituições públicas e estatais, ONGs e agências.',
    descriptionLines: [
      'Empresas privadas, instituições',
      'públicas e estatais, ONGs e agências.',
    ],
    routePath: '/empresas',
    imagePath: '/assets/modules/mod_2.png',
    isAvailable: true,
  },
  {
    id: 'shopping_opportunities',
    number: 3,
    title: 'Compras e Oportunidades',
    titleLines: ['Compras e', 'Oportunidades'],
    description: 'Venda de produtos e Desconto do Dia.',
    descriptionLines: ['Venda de produtos e', 'Desconto do Dia.'],
    routePath: '/compras',
    imagePath: '/assets/modules/mod_3.png',
    isAvailable: false,
  },
  {
    id: 'real_estate_accommodation',
    number: 4,
    title: 'Imóveis e Alojamento',
    titleLines: ['Imóveis e', 'Alojamento'],
    description: 'Venda e aluguer de imóveis, hotéis, pensões e lodges.',
    descriptionLines: ['Venda e aluguer de imóveis,', 'hotéis, pensões e lodges.'],
    routePath: '/imoveis',
    imagePath: '/assets/modules/mod_4.png',
    isAvailable: false,
  },
  {
    id: 'transport_vehicles',
    number: 5,
    title: 'Transporte e Aluguer de Viaturas',
    titleLines: ['Transporte e', 'Aluguer de Viaturas'],
    description: 'Rent-a-car, transporte de mercadorias e transporte de passageiros.',
    descriptionLines: [
      'Rent-a-car, transporte de mercadorias',
      'e transporte de passageiros.',
    ],
    routePath: '/transporte',
    imagePath: '/assets/modules/mod_5.png',
    isAvailable: false,
  },
  {
    id: 'entertainment_relationships',
    number: 6,
    title: 'Entretenimento e Relacionamentos',
    titleLines: ['Entretenimento', 'e Relacionamentos'],
    description: 'Entretenimento e Smile to Smile S2S (atrações, namoros e casamentos).',
    descriptionLines: [
      'Entretenimento e Smile to Smile S2S',
      '(atrações, namoros e casamentos).',
    ],
    routePath: '/entretenimento',
    imagePath: '/assets/modules/mod_6.png',
    isAvailable: false,
  },
  {
    id: 'lost_and_found',
    number: 7,
    title: 'Perdidos e Achados',
    titleLines: ['Perdidos e', 'Achados'],
    description: 'Objectos ou bens perdidos e encontrados.',
    descriptionLines: ['Objectos ou bens perdidos', 'e encontrados.'],
    routePath: '/perdidos-achados',
    imagePath: '/assets/modules/mod_7.png',
    isAvailable: false,
  },
  {
    id: 'mourning_funeral',
    number: 8,
    title: 'Luto e Apoio Funerário',
    titleLines: ['Luto e Apoio', 'Funerário'],
    description: 'Serviços e apoio relacionados com o luto.',
    descriptionLines: ['Serviços e apoio relacionados', 'com o luto.'],
    routePath: '/luto-apoio',
    imagePath: '/assets/modules/mod_8.png',
    isAvailable: false,
  },
  {
    id: 'faith_traditional_medicine',
    number: 9,
    title: 'Fé e Medicina Tradicional',
    titleLines: ['Fé e Medicina', 'Tradicional'],
    description: 'Comunidades religiosas e praticantes de medicina tradicional.',
    descriptionLines: [
      'Comunidades religiosas e praticantes',
      'de medicina tradicional.',
    ],
    routePath: '/fe-medicina',
    imagePath: '/assets/modules/mod_9.png',
    isAvailable: false,
  },
  {
    id: 'tourism_travel',
    number: 10,
    title: 'Turismo e Viagens',
    titleLines: ['Turismo e Viagens'],
    description: 'Turismo, destinos, guias, praias e actividades afins.',
    descriptionLines: ['Turismo, destinos, guias, praias', 'e actividades afins.'],
    routePath: '/turismo',
    imagePath: '/assets/modules/mod_10.png',
    isAvailable: false,
  },
  {
    id: 's2s_relationships',
    number: 11,
    title: 'Smile to Smile S2S Relacionamentos',
    titleLines: ['Smile to Smile S2S', 'Relacionamentos'],
    description: 'Amizades, namoro e relacionamentos.',
    descriptionLines: ['Amizades, namoro e', 'relacionamentos.'],
    routePath: '/s2s-relacionamentos',
    imagePath: '/assets/modules/mod_11.png',
    isAvailable: false,
  },
  {
    id: 'turma_dos_vencedores',
    number: 12,
    title: 'Turma dos Vencedores',
    titleLines: ['Turma dos', 'Vencedores'],
    description: 'Preparação para exames universitários e carta de condução.',
    descriptionLines: [
      'Preparação para exames',
      'universitários e carta de',
      'condução.',
    ],
    routePath: '/turma-vencedores',
    imagePath: '/assets/modules/mod_12.png',
    isAvailable: false,
  },
] as const;

export function getModuleById(
  id: MozfacilModuleId | string | null | undefined
): MozfacilModuleDefinition | undefined {
  if (!id) return undefined;
  return MOZFACIL_MODULES.find((m) => m.id === id);
}

export function getModuleByRoutePath(pathname: string): MozfacilModuleDefinition | undefined {
  const clean = pathname.replace(/\/+$/, '') || '/';
  return MOZFACIL_MODULES.find((m) => m.routePath === clean);
}
