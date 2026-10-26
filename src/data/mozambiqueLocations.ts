export interface DistrictLocationData {
  name: string;
  localities: string[];
  neighborhoods: string[];
}

export interface ProvinceLocationData {
  name: string;
  districts: DistrictLocationData[];
}

export const MOZAMBIQUE_LOCATIONS: ProvinceLocationData[] = [
  {
    name: 'Maputo Província',
    districts: [
      {
        name: 'Matola',
        localities: ['Matola Sede', 'Machava', 'Infulene'],
        neighborhoods: [
          'T3',
          'Bagamoyo',
          'Fomento',
          'Liberdade',
          'Patrice Lumumba',
          'Machava Sede',
          'Matola Gare',
          'Tsalala',
          'Khongolote',
          'Intaka',
          'Muhalaze',
          'Boquisso',
          'Mussumbuluco',
          'Zona Verde',
          'Acordos de Lusaka',
        ],
      },
      {
        name: 'Boane',
        localities: ['Boane Sede', 'Matola-Rio'],
        neighborhoods: [
          'Vila de Boane',
          'Belo Horizonte',
          'Djuba',
          'Mulotana',
          'Campoane',
          'Chinonanquila',
        ],
      },
      {
        name: 'Marracuene',
        localities: ['Marracuene Sede', 'Machubo'],
        neighborhoods: [
          'Vila de Marracuene',
          'Kumbeza',
          'Guava',
          'Mateque',
          'Muntanhana',
          'Agostinho Neto',
          'Zintava',
        ],
      },
      {
        name: 'Manhiça',
        localities: ['Manhiça Sede', 'Xinavane', 'Maluana'],
        neighborhoods: ['Vila da Manhiça', 'Maragra', 'Xinavane Sede', 'Maluana Centro'],
      },
      {
        name: 'Moamba',
        localities: ['Moamba Sede', 'Pessene', 'Ressano Garcia'],
        neighborhoods: ['Vila da Moamba', 'Ressano Garcia Fronteira', 'Pessene Centro'],
      },
      {
        name: 'Namaacha',
        localities: ['Namaacha Sede', 'Changalane'],
        neighborhoods: ['Vila da Namaacha', 'Impaputo', 'Goba'],
      },
    ],
  },
  {
    name: 'Maputo Cidade',
    districts: [
      {
        name: 'KaMpfumo',
        localities: ['Zona Urbana Central'],
        neighborhoods: [
          'Central A',
          'Central B',
          'Central C',
          'Alto Maé A',
          'Alto Maé B',
          'Malhangalene A',
          'Malhangalene B',
          'Polana Cimento A',
          'Polana Cimento B',
          'Coop',
          'Sommerschield',
          'Baixa',
        ],
      },
      {
        name: 'Nlhamankulu',
        localities: ['Suburbana Próxima'],
        neighborhoods: [
          'Aeroporto A',
          'Aeroporto B',
          'Xipamanine',
          'Minkadjuine',
          'Unidade 7',
          'Chamanculo A',
          'Chamanculo B',
          'Chamanculo C',
          'Chamanculo D',
          'Malanga',
        ],
      },
      {
        name: 'KaMaxakeni',
        localities: ['Maxaquene'],
        neighborhoods: [
          'Mafalala',
          'Maxaquene A',
          'Maxaquene B',
          'Maxaquene C',
          'Maxaquene D',
          'Polana Caniço A',
          'Polana Caniço B',
          'Urbanização',
        ],
      },
      {
        name: 'KaMavota',
        localities: ['Mavota'],
        neighborhoods: [
          'Mavalane A',
          'Mavalane B',
          'FPLM',
          'Hulene A',
          'Hulene B',
          'Ferroviário',
          'Laulane',
          '3 de Fevereiro',
          'Mahotas',
          'Albazine',
          'Costa do Sol',
        ],
      },
      {
        name: 'KaMubukwana',
        localities: ['Mubukwana'],
        neighborhoods: [
          'Bagamoyo Maputo',
          'George Dimitrov (Benfica)',
          'Inhagóia A',
          'Inhagóia B',
          'Jardim',
          'Luis Cabral',
          'Magoanine A',
          'Magoanine B',
          'Magoanine C',
          'Zimpeto',
        ],
      },
      {
        name: 'KaTembe',
        localities: ['Katembe'],
        neighborhoods: ['Guachene', 'Chali', 'Inguide', 'Incassane', 'Chamissava'],
      },
    ],
  },
  {
    name: 'Gaza',
    districts: [
      {
        name: 'Xai-Xai',
        localities: ['Xai-Xai Sede', 'Praia de Xai-Xai'],
        neighborhoods: ['Cidade Baixa', 'Cidade Alta', 'Inhamissa', 'Patrice Lumumba', 'Marien Ngouabi'],
      },
      {
        name: 'Chókwè',
        localities: ['Chókwè Sede', 'Lionde'],
        neighborhoods: ['1º Bairro', '2º Bairro', '3º Bairro', '4º Bairro', 'Lionde Centro'],
      },
      {
        name: 'Bilene',
        localities: ['Macia', 'Praia do Bilene'],
        neighborhoods: ['Vila da Macia', 'São Martinho', 'Praia do Bilene Sede'],
      },
      {
        name: 'Chibuto',
        localities: ['Chibuto Sede'],
        neighborhoods: ['Cimento', '25 de Junho', 'Samora Machel'],
      },
    ],
  },
  {
    name: 'Inhambane',
    districts: [
      {
        name: 'Inhambane',
        localities: ['Inhambane Sede', 'Tofo'],
        neighborhoods: ['Balane 1', 'Balane 2', 'Balane 3', 'Liberdade', 'Chambone', 'Muelé', 'Praia do Tofo'],
      },
      {
        name: 'Maxixe',
        localities: ['Maxixe Sede'],
        neighborhoods: ['Chambone A', 'Chambone B', 'Mabil', 'Rumbana', 'Tinga-Tinga'],
      },
      {
        name: 'Vilankulo',
        localities: ['Vilankulo Sede'],
        neighborhoods: ['Central', 'Desse', 'Chibuene', 'Alto Macassa', '7 de Setembro'],
      },
    ],
  },
  {
    name: 'Sofala',
    districts: [
      {
        name: 'Beira',
        localities: ['Urbano Central', 'Chiveve', 'Manga', 'Munhava'],
        neighborhoods: [
          'Ponta Gêa',
          'Macuti',
          'Esturro',
          'Matacuane',
          'Chaimite',
          'Pioneiros',
          'Palmeiras',
          'Munhava Central',
          'Manga Mascarenhas',
          'Alto da Manga',
        ],
      },
      {
        name: 'Dondo',
        localities: ['Dondo Sede', 'Mafambisse'],
        neighborhoods: ['Cimento', 'Macharote', 'Consito', 'Mafambisse Centro'],
      },
      {
        name: 'Nhamatanda',
        localities: ['Nhamatanda Sede', 'Tica'],
        neighborhoods: ['Vila de Nhamatanda', 'Vila de Tica'],
      },
    ],
  },
  {
    name: 'Manica',
    districts: [
      {
        name: 'Chimoio',
        localities: ['Chimoio Sede'],
        neighborhoods: [
          'Bairro 1 (Cimento)',
          'Bairro 2',
          'Bairro 3',
          'Bairro 4',
          'Trangapasso',
          'Vila Nova',
          '7 de Abril',
          'Josina Machel',
        ],
      },
      {
        name: 'Manica',
        localities: ['Manica Sede', 'Machipanda'],
        neighborhoods: ['Vila de Manica', 'Vumba', 'Machipanda Fronteira'],
      },
    ],
  },
  {
    name: 'Tete',
    districts: [
      {
        name: 'Tete',
        localities: ['Tete Sede', 'Moatize'],
        neighborhoods: [
          'Josina Machel',
          'Filipe Samuel Magaia',
          'Francisco Manyanga',
          'Chingodzi',
          'Matundo',
          'Samora Machel',
          'Mpádué',
        ],
      },
      {
        name: 'Moatize',
        localities: ['Moatize Sede', 'Zóbuè'],
        neighborhoods: ['Bairro 25 de Setembro', 'Liberdade', '1º de Maio', 'Bagamoyo Moatize'],
      },
    ],
  },
  {
    name: 'Zambézia',
    districts: [
      {
        name: 'Quelimane',
        localities: ['Quelimane Sede'],
        neighborhoods: ['Cimento', 'Chuabo Dembe', 'Kansa', 'Sangariveira', 'Coalane', 'Icídua'],
      },
      {
        name: 'Mocuba',
        localities: ['Mocuba Sede'],
        neighborhoods: ['Cimento', 'Carreira de Tiro', '25 de Setembro', 'Marmanelo'],
      },
      {
        name: 'Gurué',
        localities: ['Gurué Sede'],
        neighborhoods: ['Vila de Gurué', 'Barragem', 'Moneia'],
      },
    ],
  },
  {
    name: 'Nampula',
    districts: [
      {
        name: 'Nampula',
        localities: ['Nampula Central', 'Muhala', 'Natikiri'],
        neighborhoods: [
          'Urbano Central',
          'Muhala Expansão',
          'Muahivire',
          'Namicopo',
          'Napipine',
          'Carrupeia',
          'Marrere',
          'Mutauanha',
        ],
      },
      {
        name: 'Nacala-Porto',
        localities: ['Maiaia', 'Mutiva'],
        neighborhoods: ['Cidade Baixa', 'Cidade Alta', 'Mathapue', 'Ribaué', 'Triângulo'],
      },
      {
        name: 'Angoche',
        localities: ['Angoche Sede'],
        neighborhoods: ['Cimento', 'Inguri', 'Cerema'],
      },
    ],
  },
  {
    name: 'Cabo Delgado',
    districts: [
      {
        name: 'Pemba',
        localities: ['Pemba Sede', 'Wimbe'],
        neighborhoods: ['Cimento', 'Alto Gingone', 'Natite', 'Cariacó', 'Paquitequete', 'Chuiba', 'Eduardo Mondlane'],
      },
      {
        name: 'Montepuez',
        localities: ['Montepuez Sede'],
        neighborhoods: ['Cimento', 'Mirige', 'Napulacale', 'Matunda'],
      },
    ],
  },
  {
    name: 'Niassa',
    districts: [
      {
        name: 'Lichinga',
        localities: ['Lichinga Sede'],
        neighborhoods: ['Sanjala', 'Chiuaula', 'Nomba', 'Cerâmica', 'Popular', 'Namacula'],
      },
      {
        name: 'Cuamba',
        localities: ['Cuamba Sede'],
        neighborhoods: ['Cimento', 'Adine 1', 'Adine 2', 'Aeroporto Cuamba'],
      },
    ],
  },
];

export function getProvinces(): string[] {
  return MOZAMBIQUE_LOCATIONS.map((p) => p.name);
}

export function getDistrictsByProvince(provinceName: string): string[] {
  const prov = MOZAMBIQUE_LOCATIONS.find((p) => p.name === provinceName);
  return prov ? prov.districts.map((d) => d.name) : [];
}

export function getLocalitiesByDistrict(
  provinceName: string,
  districtName: string
): string[] {
  const prov = MOZAMBIQUE_LOCATIONS.find((p) => p.name === provinceName);
  const dist = prov?.districts.find((d) => d.name === districtName);
  return dist ? dist.localities : [];
}

export function getNeighborhoodsByDistrict(
  provinceName: string,
  districtName: string
): string[] {
  const prov = MOZAMBIQUE_LOCATIONS.find((p) => p.name === provinceName);
  const dist = prov?.districts.find((d) => d.name === districtName);
  return dist ? dist.neighborhoods : [];
}
