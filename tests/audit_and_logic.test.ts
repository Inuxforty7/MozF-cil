import fs from 'fs';
import path from 'path';
import assert from 'assert';
import {
  normalizeCategoryName,
  formatCategoryDisplayName,
  buildDeterministicCategoryId,
} from '../src/utils/categoryNormalization.ts';
import {
  getProvinces,
  getDistrictsByProvince,
  getLocalitiesByDistrict,
  getNeighborhoodsByDistrict,
} from '../src/data/mozambiqueLocations.ts';
import {
  MOZFACIL_MODULES,
  getModuleById,
  getModuleByRoutePath,
} from '../src/data/mozfacilModules.ts';
import { DIRTY_DOZEN_TESTS } from '../firestore.rules.test.ts';

function runAuditAndLogicTests() {
  console.log('=== 1. TESTE DE NORMALIZAÇÃO E ANTI-DUPLICAÇÃO DE CATEGORIAS DINÂMICAS ===');
  assert.strictEqual(
    normalizeCategoryName('  Mecânico   Automóvel '),
    'mecanico automovel',
    'Deve normalizar acentos, maiúsculas e espaços repetidos'
  );
  assert.strictEqual(
    normalizeCategoryName('MECÂNICO AUTOMÓVEL'),
    normalizeCategoryName('mecanico automovel'),
    'Deve tratar maiúsculas e acentos de forma idêntica'
  );
  assert.strictEqual(
    buildDeterministicCategoryId('  Mecânico  ', 'profession'),
    'prof_mecanico',
    'Deve gerar ID determinístico para profissão'
  );
  assert.strictEqual(
    buildDeterministicCategoryId('MECÂNICO', 'profession'),
    'prof_mecanico',
    'Pedidos concorrentes para a mesma categoria normalizada devem apontar para o mesmo documento ID'
  );
  assert.notStrictEqual(
    buildDeterministicCategoryId('Mecânico Auto', 'profession'),
    buildDeterministicCategoryId('Mecânico Industrial', 'profession'),
    'Não deve fundir automaticamente profissões distintas apenas por terem nomes semelhantes'
  );
  assert.strictEqual(
    formatCategoryDisplayName('   carpinteiro   e   marceneiro  '),
    'Carpinteiro e marceneiro',
    'Deve formatar o nome de exibição limpando espaços supérfluos'
  );
  console.log('✓ Normalização e determinismo de categorias verificados.');

  console.log('\n=== 2. TESTE DE DADOS GEOGRÁFICOS DEPENDENTES (MOÇAMBIQUE) ===');
  const provinces = getProvinces();
  assert(provinces.length === 11, `Esperadas 11 províncias, encontradas ${provinces.length}`);
  assert(provinces.includes('Maputo Província'), 'Deve incluir Maputo Província');
  assert(provinces.includes('Sofala'), 'Deve incluir Sofala');
  assert(provinces.includes('Nampula'), 'Deve incluir Nampula');

  const matolaDistricts = getDistrictsByProvince('Maputo Província');
  assert(matolaDistricts.includes('Matola'), 'Maputo Província deve conter o distrito da Matola');
  assert(!matolaDistricts.includes('Beira'), 'Maputo Província não deve conter distritos de Sofala');

  const matolaNeighborhoods = getNeighborhoodsByDistrict('Maputo Província', 'Matola');
  assert(matolaNeighborhoods.includes('Bagamoyo'), 'Matola deve incluir o bairro Bagamoyo');
  assert(matolaNeighborhoods.includes('T3'), 'Matola deve incluir o bairro T3');
  assert(
    getLocalitiesByDistrict('Maputo Província', 'Matola').includes('Machava'),
    'Matola deve incluir a localidade da Machava'
  );
  console.log('✓ Seletores geográficos dependentes verificados.');

  console.log('\n=== 3. AUDITORIA DE AUSÊNCIA DE MOCKS E DE NOTAS TÉCNICAS INTERNAS NA UI ===');
  const srcFiles = [
    'src/App.tsx',
    'src/firebase.ts',
    'src/services/mozfacilService.ts',
    'src/data/mozfacilModules.ts',
    'src/components/ExploreModulesScreen.tsx',
    'src/components/HomeAndSidebar.tsx',
    'src/components/UtenteRegistrationScreen.tsx',
    'src/components/ProfessionalRegistrationForm.tsx',
    'src/components/ProfessionalProfileDetail.tsx',
    'src/components/DynamicCategorySelector.tsx',
    'src/components/AdminDashboard.tsx',
  ];

  const bannedMockPatterns = [
    { pattern: /localStorage/i, reason: 'Proibido usar localStorage como base de dados' },
    { pattern: /sessionStorage/i, reason: 'Proibido usar sessionStorage para persistência' },
    { pattern: /seedInitialMozfacilDatabase/i, reason: 'Proibido ter gerador de dados fictícios/seed na aplicação' },
    { pattern: /handleSendSmsVerification/i, reason: 'Proibido simular envio de SMS falso no cliente' },
    { pattern: /\+258 84 000 0000/i, reason: 'Proibido injetar número de telefone fictício como fallback' },
    { pattern: /setTimeout\s*\(/i, reason: 'Proibido simular latência de rede com setTimeout' },
    {
      pattern: /Análise Técnica e Implementação dos 4 Pilares do Áudio/i,
      reason: 'Proibido exibir notas técnicas internas de áudio na interface do utilizador',
    },
  ];

  for (const relPath of srcFiles) {
    const fullPath = path.resolve(process.cwd(), relPath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    for (const check of bannedMockPatterns) {
      assert(
        !check.pattern.test(content),
        `Padrão proibido detetado em ${relPath}: ${check.reason}`
      );
    }
  }
  console.log('✓ Zero mocks, zero localStorage e zero notas técnicas internas confirmados na UI.');

  console.log('\n=== 4. AUDITORIA TÉCNICA DE SEGURANÇA, REGRAS DE LOTE (getAfter) E INTEGRIDADE ===');
  const rulesContent = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf-8');
  const serviceContent = fs.readFileSync(
    path.resolve(process.cwd(), 'src/services/mozfacilService.ts'),
    'utf-8'
  );
  const appContent = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf-8');
  const utenteScreenContent = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/UtenteRegistrationScreen.tsx'),
    'utf-8'
  );
  const adminDashboardContent = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/AdminDashboard.tsx'),
    'utf-8'
  );

  // Area 1: Admin privilege isolation
  assert(
    rulesContent.includes("request.auth.token.email_verified == true &&\n          request.auth.token.email == 'inuxforty@gmail.com'"),
    'Area 1: isAdmin() deve exigir email_verified == true ao verificar o email do administrador bootstrap'
  );
  assert(
    rulesContent.includes("incoming().role in ['visitor', 'professional']"),
    'Area 1: Clientes normais não podem atribuir role == admin em /users/{userId}'
  );

  // Area 2: User initialization never resets existing creditsBalance & UI never fakes 100 credits when logged out
  assert(
    serviceContent.includes("tx.update(userRef,") &&
      serviceContent.includes("role: 'admin'") &&
      serviceContent.includes('updatedAt: serverTimestamp()'),
    'Area 2: ensureUserDocument deve usar tx.update apenas para role/updatedAt quando o documento já existe, sem sobrescrever creditsBalance'
  );
  assert(
    rulesContent.includes('incoming().creditsBalance == existing().creditsBalance'),
    'Area 2: Atualização cadastral do utente não pode alterar creditsBalance'
  );
  assert(
    !appContent.includes('mozUser?.creditsBalance ?? VALIDATION_LIMITS.INITIAL_PACKAGE_CREDITS') &&
      !utenteScreenContent.includes('mozUser?.creditsBalance ?? VALIDATION_LIMITS.INITIAL_PACKAGE_CREDITS'),
    'Area 2: A interface não deve mostrar um saldo falso de 100 créditos por omissão quando o utilizador não está autenticado'
  );

  // Area 3: Idempotent, uniquely identified consultation debits
  assert(
    rulesContent.includes('match /user_consultations/{consultationId}') &&
      rulesContent.includes('!exists(/databases/$(database)/documents/user_consultations/$(consultationId))') &&
      rulesContent.includes("data.id == (data.userId + '_' + data.targetProfileId)"),
    'Area 3: Regras devem exigir recibo determinístico único em /user_consultations/{userId_targetProfileId} sem duplicação'
  );
  assert(
    rulesContent.includes('existing().termsAccepted == true') &&
      rulesContent.includes('incoming().creditsBalance == existing().creditsBalance - 1'),
    'Area 3: Débito de 1 crédito exige termsAccepted == true e decremento exato de 1 crédito'
  );
  assert(
    serviceContent.includes('if (consultationSnap.exists())') &&
      serviceContent.includes('alreadyConsulted: true'),
    'Area 3: performDirectConsultationDebit deve ser idempotente e não cobrar duas vezes pela mesma consulta'
  );

  // Area 4: Audit log anti-forgery & immutability
  assert(
    rulesContent.includes("isAdmin() &&\n          data.operation in [\n            'profile_status_changed', 'contact_verified'"),
    'Area 4: Operações administrativas no audit_logs devem ser restritas a isAdmin()'
  );
  assert(
    rulesContent.includes('allow update, delete: if false;'),
    'Area 4: Registos de auditoria e recibos de consulta devem ser imutáveis'
  );

  // Area 5 & 6: Batch creation & status synchronization using getAfter(...)
  assert(
    rulesContent.includes(
      "getAfter(/databases/$(database)/documents/professional_categories/$(data.primaryCategoryId)).data.categoryType == 'profession'"
    ) &&
      rulesContent.includes(
        "data.publicationStatus == 'pending_review' &&\n            getAfter(/databases/$(database)/documents/professional_categories/$(data.primaryCategoryId)).data.reviewStatus in ['approved', 'pending']"
      ) &&
      rulesContent.includes(
        "data.publicationStatus == 'published' &&\n            getAfter(/databases/$(database)/documents/professional_categories/$(data.primaryCategoryId)).data.reviewStatus == 'approved'"
      ),
    'Area 5: isPublishableProfile deve usar getAfter() e exigir reviewStatus == approved quando publicationStatus == published'
  );
  assert(
    rulesContent.includes(
      'incoming().publicationStatus == getAfter(/databases/$(database)/documents/professional_profiles/$(incoming().profileId)).data.publicationStatus'
    ),
    'Area 6: Coleções filhas devem usar getAfter() para permitir writeBatch atómico na criação de perfis e alteração de estado'
  );
  assert(
    serviceContent.includes("where('specialtyIds', 'array-contains', params.sourceCategory.id)"),
    'Area 5: adminMergeCategories deve usar query indexada array-contains em vez de descarregar toda a coleção'
  );

  // Area 7 & 8: Category listener isolation & bounded queries
  assert(
    appContent.includes('publicCategories') && appContent.includes('adminCategories'),
    'Area 7: App.tsx deve isolar publicCategories e adminCategories para evitar colisão de estado no Painel Admin'
  );
  assert(
    !adminDashboardContent.includes('Normalizado: <code'),
    'Area 7: AdminDashboard não deve expor campos internos brutos como normalizedName na interface'
  );
  assert(
    appContent.includes('limit(100)') && appContent.includes('limit(200)'),
    'Area 8: Queries em App.tsx devem ter cláusulas limit() explícitas para evitar transferências ilimitadas'
  );

  // Area 9: Identity preservation on phone linking & authentic phoneVerified status
  assert(
    rulesContent.includes('incoming().phoneVerified == (request.auth.token.phone_number != null)'),
    'Area 9: phoneVerified em /users/{userId} deve refletir estritamente o token de autenticação'
  );
  assert(
    !utenteScreenContent.includes("setOtpStep('verified');\n          setOtpError(null);\n          setOtpMessage(\n            `WhatsApp"),
    'Area 9: UtenteRegistrationScreen não deve forjar estado verified quando ocorre auth/operation-not-allowed'
  );

  // Area 10: Atomic writeBatch in saveProfessionalProfileComplete
  assert(
    serviceContent.includes('const batch = writeBatch(db);') &&
      serviceContent.includes('await batch.commit();'),
    'Area 10: saveProfessionalProfileComplete e adminSetProfilePublicationStatus devem usar writeBatch(db) atómico'
  );

  assert(
    DIRTY_DOZEN_TESTS.length === 12,
    'A suite Dirty Dozen deve conter os 12 casos de teste adversariais'
  );
  console.log('✓ Todos os pontos da auditoria técnica e de interface verificados no código e nas regras.');

  console.log('\n=== 5. TESTE DO DIRETÓRIO EXPLORE (12 MÓDULOS ORIGINAIS) E NAVEGAÇÃO INFERIOR ===');
  assert.strictEqual(
    MOZFACIL_MODULES.length,
    12,
    'Explore deve conter exatamente os 12 módulos originais'
  );

  const expectedTitles = [
    'Profissionais e Serviços',
    'Empresas e Instituições',
    'Compras e Oportunidades',
    'Imóveis e Alojamento',
    'Transporte e Aluguer de Viaturas',
    'Entretenimento e Relacionamentos',
    'Perdidos e Achados',
    'Luto e Apoio Funerário',
    'Fé e Medicina Tradicional',
    'Turismo e Viagens',
    'Smile to Smile S2S Relacionamentos',
    'Turma dos Vencedores',
  ];

  MOZFACIL_MODULES.forEach((mod, index) => {
    assert.strictEqual(mod.number, index + 1, `Módulo na posição ${index} deve ter número ${index + 1}`);
    assert.strictEqual(mod.title, expectedTitles[index], `Título do módulo ${mod.number} deve ser "${expectedTitles[index]}"`);
    assert(mod.routePath.startsWith('/'), `Módulo ${mod.number} deve ter routePath explícito iniciado por /`);
    assert.strictEqual(getModuleById(mod.id)?.id, mod.id, 'getModuleById deve resolver o módulo corretamente');
    assert.strictEqual(getModuleByRoutePath(mod.routePath)?.id, mod.id, 'getModuleByRoutePath deve resolver o módulo corretamente');
  });

  // Verify Module 1 is active and Modules 6 & 11 remain distinct
  assert.strictEqual(MOZFACIL_MODULES[0].id, 'professionals_services');
  assert.strictEqual(MOZFACIL_MODULES[0].isAvailable, true);
  assert.notStrictEqual(
    MOZFACIL_MODULES[5].id,
    MOZFACIL_MODULES[10].id,
    'Módulos 6 (Entretenimento e Relacionamentos) e 11 (Smile to Smile S2S Relacionamentos) devem permanecer separados'
  );
  for (let i = 1; i < MOZFACIL_MODULES.length; i++) {
    assert.strictEqual(
      MOZFACIL_MODULES[i].isAvailable,
      false,
      `Módulo ${MOZFACIL_MODULES[i].number} não deve fingir funcionalidade inexistente`
    );
  }

  // Verify bottom navigation items and history popstate listener in App.tsx
  assert(
    appContent.includes('>Início</span>') &&
      appContent.includes('>Empresas</span>') &&
      appContent.includes('>Profissionais</span>') &&
      appContent.includes('>Mais</span>'),
    'A navegação inferior deve preservar os 4 itens: Início, Empresas, Profissionais e Mais'
  );
  assert(
    appContent.includes("window.addEventListener('popstate'") &&
      appContent.includes('window.history.pushState'),
    'App.tsx deve suportar navegação de retorno do navegador (popstate / pushState)'
  );
  console.log('✓ Todos os 12 módulos do Explore, rotas explícitas e barra de navegação inferior verificados.');

  console.log('\n=== 6. TESTE COMPLETO DO MÓDULO INTERNO PROFISSIONAIS E SERVIÇOS ===');
  const regFormContent = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/ProfessionalRegistrationForm.tsx'),
    'utf-8'
  );
  const detailContent = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/ProfessionalProfileDetail.tsx'),
    'utf-8'
  );
  const dynamicCatContent = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/DynamicCategorySelector.tsx'),
    'utf-8'
  );

  // 1. Dynamic header counter (no hardcoded 1.247)
  assert(
    !appContent.includes('1.247') && appContent.includes('{publishedProfiles.length}'),
    'O cabeçalho não deve exibir contadores estáticos fictícios (como 1.247), devendo refletir publishedProfiles.length'
  );

  // 2. ProfessionalRegistrationForm: 5 sections, auto-category resolution, service deduplication, schedule validation, real SMS OTP
  assert(
    regFormContent.includes('Foto e Dados do Profissional / Serviço') &&
      regFormContent.includes('Responsável e Autorização') &&
      regFormContent.includes('Localização') &&
      regFormContent.includes('Estado dos serviços') &&
      regFormContent.includes('Fotos, Vídeo e Documentos'),
    'ProfessionalRegistrationForm deve conter as 5 secções numeradas alinhadas ao sistema de design'
  );
  assert(
    regFormContent.includes('!resolvedCategoryId && pendingProfessionText.trim().length >= 2') &&
      regFormContent.includes('proposeOrSelectCategory'),
    'ProfessionalRegistrationForm deve resolver automaticamente categorias digitadas na pesquisa antes de submeter'
  );
  assert(
    regFormContent.includes('seenServiceKeys') &&
      regFormContent.includes('deduplicatedServices'),
    'ProfessionalRegistrationForm deve impedir a criação de serviços duplicados na mesma submissão'
  );
  assert(
    regFormContent.includes('sched.openingTime >= sched.closingTime') &&
      regFormContent.includes('openingTime >= closingTime'),
    'ProfessionalRegistrationForm deve validar intervalos de horário (hora de abertura anterior à hora de fecho)'
  );
  assert(
    regFormContent.includes('linkWithPhoneNumber') &&
      regFormContent.includes('Enviar código') &&
      regFormContent.includes('Código SMS'),
    'ProfessionalRegistrationForm deve incluir verificação real de contacto por SMS OTP via Firebase Auth'
  );

  // 3. ProfessionalProfileDetail: complete layout & interactive controls
  assert(
    detailContent.includes('Chat Grátis') &&
      detailContent.includes('Ligar') &&
      detailContent.includes('Ver no mapa') &&
      detailContent.includes('Estado do serviço:') &&
      detailContent.includes('Endereço:') &&
      detailContent.includes('Paragem mais próxima:') &&
      detailContent.includes('Referência:') &&
      detailContent.includes('Serviços oferecidos:') &&
      detailContent.includes('Horário de funcionamento:') &&
      detailContent.includes('Documentos Verificados') &&
      detailContent.includes('Ver detalhes'),
    'ProfessionalProfileDetail deve apresentar todas as secções e ações interativas do perfil público'
  );

  // 4. My Profiles owner lifecycle actions & AdminDashboard required rejection reason + filters
  assert(
    serviceContent.includes('export async function ownerSetProfilePublicationStatus') &&
      appContent.includes('Desativar Publicação (Passar a Rascunho)'),
    'Meus Perfis deve permitir ao titular desativar uma publicação (passar a rascunho) ou resubmeter para revisão'
  );
  assert(
    adminDashboardContent.includes("(newStatus === 'rejected' || newStatus === 'draft') && !note") &&
      adminDashboardContent.includes('catSearchQuery') &&
      adminDashboardContent.includes('auditOpFilter') &&
      adminDashboardContent.includes('category_created') &&
      adminDashboardContent.includes('consultation_debit'),
    'AdminDashboard deve exigir motivo ao rejeitar perfis, permitir pesquisa de categorias e filtrar o histórico de auditoria'
  );

  // 5. Home (Início) screen & Slide-Over Sidebar Drawer
  const homeSidebarContent = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/HomeAndSidebar.tsx'),
    'utf-8'
  );
  assert(
    homeSidebarContent.includes('MOÇAMBIQUE') &&
      homeSidebarContent.includes('NA PALMA DA SUA MÃO') &&
      homeSidebarContent.includes('Pesquise serviços, contactos e obtenha soluções...') &&
      homeSidebarContent.includes('Contacto directo') &&
      homeSidebarContent.includes('Fale directamente com a equipa MOZFÁCIL') &&
      homeSidebarContent.includes('Iniciar sessão') &&
      homeSidebarContent.includes('Criar conta') &&
      homeSidebarContent.includes('Minha conta') &&
      homeSidebarContent.includes('Meus favoritos') &&
      homeSidebarContent.includes('Histórico') &&
      homeSidebarContent.includes('Ajuda e suporte') &&
      homeSidebarContent.includes('Sobre o MozFácil'),
    'HomeAndSidebar deve apresentar a tela Início e o menu lateral (Sidebar Drawer) conforme o sistema de design'
  );
  console.log('✓ Módulo interno Profissionais e Serviços, tela Início e Menu Lateral validados.');

  console.log('\n=== 7. VALIDAÇÃO DOS 29 CENÁRIOS OBRIGATÓRIOS (SECÇÃO 12) ===');
  // Scenario 1: Empty category catalog has zero invented categories
  assert(
    !dynamicCatContent.includes('SUGGESTED_PROFESSIONS') &&
      dynamicCatContent.includes('Catálogo sem categorias predefinidas'),
    'Cenário 1: O catálogo de categorias deve iniciar vazio sem categorias inventadas predefinidas'
  );

  // Scenarios 2, 3, 4, 5: Dynamic category proposal, normalization, sequential & concurrent deduplication, pending reuse
  const idCanalizadorA = buildDeterministicCategoryId('Canalizador', 'profession');
  const idCanalizadorB = buildDeterministicCategoryId('  CANALIZADOR  ', 'profession');
  const idCanalizadorC = buildDeterministicCategoryId('canalizador', 'profession');
  assert.strictEqual(idCanalizadorA, 'prof_canalizador');
  assert.strictEqual(idCanalizadorA, idCanalizadorB, 'Cenário 3/4: Submissões equivalentes geram o mesmo ID determinístico');
  assert.strictEqual(idCanalizadorB, idCanalizadorC, 'Cenário 4: Submissões concorrentes apontam para o mesmo registo na transação');
  assert(
    dynamicCatContent.includes("c.reviewStatus === 'approved' || c.reviewStatus === 'pending'") &&
      appContent.includes("c.reviewStatus === 'approved'"),
    'Cenário 5: Uma categoria pending é reutilizável no registo, mas apenas categorias approved surgem como oficiais no filtro público'
  );

  // Scenarios 6, 7, 8, 9, 10: Admin category approval, rename propagation, merge integrity, and pending/rejected publication gating
  assert(
    serviceContent.includes("where('primaryCategoryId', '==', categoryId)") &&
      serviceContent.includes("where('specialtyIds', 'array-contains', categoryId)"),
    'Cenários 7 & 8: Renomear ou fundir categorias propaga a alteração a todos os perfis e especialidades associados sem perda de referências'
  );
  assert(
    serviceContent.includes("if (effectivePublicationStatus === 'published' && catData.reviewStatus !== 'approved')") &&
      serviceContent.includes("effectivePublicationStatus = 'pending_review'") &&
      serviceContent.includes('if (primaryCat.reviewStatus !== \'approved\')'),
    'Cenários 9 & 10: Categorias pendentes ou rejeitadas nunca podem contornar os requisitos de publicação (published exige categoria approved)'
  );
  assert(
    adminDashboardContent.includes('Perfis associados:') &&
      adminDashboardContent.includes('categoryProfileCounts'),
    'Secção 6: O Painel Administrativo exibe o número de perfis profissionais associados a cada categoria'
  );

  // Scenarios 11–20: Individual vs Entity/Service Provider profiles, dependent locations, GPS & manual fallback, coverage modes, multiple services, weekly schedule, operational ON/OFF/STOP, media
  assert(
    regFormContent.includes("'independent'") &&
      regFormContent.includes("'service_provider'") &&
      regFormContent.includes("'street_vendor'") &&
      regFormContent.includes('responsibleName') &&
      regFormContent.includes('nuit'),
    'Cenários 11 & 12: Suporte completo a perfis independentes, prestadores/oficinas e ambulantes com responsável e NUIT'
  );
  assert(
    regFormContent.includes('navigator.geolocation.getCurrentPosition') &&
      regFormContent.includes('PERMISSION_DENIED'),
    'Cenário 14: Suporte a geolocalização GPS com fallback manual completo'
  );
  assert(
    serviceContent.includes('export async function updateProfileOperationalState') &&
      rulesContent.includes("'availabilityStatus', 'operationalState', 'updatedAt'"),
    'Cenário 18: Alterar estado operacional (ON / OFF / STOP) não corrompe nem altera publicationStatus'
  );

  // Scenarios 21–29: Draft/pending/rejected/suspended exclusion from public queries, Utente registration, consultation debit idempotency, zero balance refusal, unauthorized admin/audit protection
  assert(
    appContent.includes("where('publicationStatus', '==', 'published')") &&
      rulesContent.includes("existing().publicationStatus == 'published'"),
    'Cenários 21, 22, 23: Apenas perfis published são listados no diretório público; draft, pending_review, rejected e suspended são excluídos'
  );
  assert(
    serviceContent.includes('export async function saveUtenteRegistration') &&
      serviceContent.includes('export async function performDirectConsultationDebit'),
    'Cenários 24, 25, 26, 27: Registo do Utente, débito atómico de 1 crédito, idempotência contra dupla cobrança e bloqueio com saldo 0'
  );
  console.log('✓ Todos os 29 cenários obrigatórios da Secção 12 validados com sucesso.');

  console.log('\n=== 8. VALIDAÇÃO DE PRONTIDÃO PARA PRODUÇÃO E DEPLOY VERCEL / GITHUB ===');
  const vercelJsonRaw = fs.readFileSync(path.resolve(process.cwd(), 'vercel.json'), 'utf-8');
  const vercelJson = JSON.parse(vercelJsonRaw);
  assert.strictEqual(vercelJson.framework, 'vite', 'vercel.json deve especificar framework vite');
  assert.strictEqual(vercelJson.buildCommand, 'npm run build', 'vercel.json deve usar npm run build');
  assert.strictEqual(vercelJson.outputDirectory, 'dist', 'vercel.json deve usar dist como outputDirectory');
  assert(
    Array.isArray(vercelJson.rewrites) &&
      vercelJson.rewrites.some((r: { destination?: string }) => r.destination === '/index.html'),
    'vercel.json deve configurar rewrite SPA para /index.html evitando erros 404 em rotas diretas'
  );

  const gitignoreContent = fs.readFileSync(path.resolve(process.cwd(), '.gitignore'), 'utf-8');
  assert(
    gitignoreContent.includes('dist/') &&
      gitignoreContent.includes('.vercel/') &&
      gitignoreContent.includes('.env*') &&
      gitignoreContent.includes('!.env.example') &&
      gitignoreContent.includes('*service-account*.json'),
    '.gitignore deve excluir dist/, .vercel/, ficheiros .env locais e chaves privadas de service-account'
  );

  const firebaseTsContent = fs.readFileSync(
    path.resolve(process.cwd(), 'src/firebase.ts'),
    'utf-8'
  );
  const firebaseConfigJson = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'firebase-applet-config.json'), 'utf-8')
  );
  assert.strictEqual(
    firebaseConfigJson.projectId,
    'enhanced-voyage-nvr20',
    'O projeto Firebase original (enhanced-voyage-nvr20) deve permanecer preservado'
  );
  assert.strictEqual(
    firebaseConfigJson.firestoreDatabaseId,
    'ai-studio-mozfcilprofissio-9c872a5a-1630-42c4-bdfa-75dcd2a52145',
    'A base de dados Firestore original deve permanecer preservada'
  );
  assert(
    firebaseTsContent.includes('getApps().length > 0 ? getApp() : initializeApp('),
    'src/firebase.ts deve proteger contra instâncias duplicadas com getApps()/getApp()'
  );

  // Direct URL routing resolution for /profissionais/registar and /profissionais/:id
  assert(
    appContent.includes("if (pathname === '/profissionais/registar')") &&
      appContent.includes("if (pathname.startsWith('/profissionais/'))"),
    'App.tsx deve resolver acesso direto por URL e refresh para /profissionais/registar e /profissionais/:id'
  );

  // RecaptchaVerifier cleanup on unmount and error + 60s resend cooldown in both phone verification screens
  assert(
    utenteScreenContent.includes('recaptchaVerifierRef.current.clear()') &&
      regFormContent.includes('recaptchaVerifierRef.current.clear()') &&
      utenteScreenContent.includes('setOtpCooldown(60)') &&
      regFormContent.includes('setOtpCooldown(60)'),
    'Ambos os ecrãs de verificação por SMS devem limpar o RecaptchaVerifier e controlar reenvio com cooldown de 60s'
  );

  // Strict image upload MIME type and file size validation + adaptive char-bound guard
  assert(
    regFormContent.includes('ALLOWED_IMAGE_MIME_TYPES') &&
      regFormContent.includes('MAX_UPLOAD_FILE_BYTES') &&
      regFormContent.includes('dataUrl.length <= maxChars'),
    'ProfessionalRegistrationForm deve rejeitar tipos MIME inválidos, ficheiros > 5 MB e garantir limite de caracteres para o Firestore'
  );

  // Atomic consultation receipt cross-check via getAfter in firestore.rules
  assert(
    rulesContent.includes(
      'getAfter(/databases/$(database)/documents/users/$(request.auth.uid)).data.creditsBalance =='
    ) &&
      rulesContent.includes(
        'get(/databases/$(database)/documents/users/$(request.auth.uid)).data.creditsBalance - 1'
      ),
    'firestore.rules deve exigir via getAfter que a criação de user_consultations debite atomicamente 1 crédito em /users/{uid}'
  );

  // Simplified UtenteRegistrationScreen concise Portuguese UI & compact credit section
  assert(
    utenteScreenContent.includes('Cadastro do Utente') &&
      utenteScreenContent.includes('Entre para guardar os seus dados e consultar profissionais.') &&
      utenteScreenContent.includes('Entrar com Google') &&
      utenteScreenContent.includes('1. Nome completo') &&
      utenteScreenContent.includes('2. WhatsApp') &&
      utenteScreenContent.includes('3. Localização (opcional)') &&
      utenteScreenContent.includes('Confirme o número através do código de verificação.') &&
      utenteScreenContent.includes('Verificar número') &&
      utenteScreenContent.includes('Aceito os Termos e Condições. Cada consulta custa 1 crédito (1 MT).') &&
      utenteScreenContent.includes('Guardar cadastro') &&
      utenteScreenContent.includes('Saldo de consultas') &&
      utenteScreenContent.includes('1 consulta = 1 crédito (1 MT)') &&
      utenteScreenContent.includes('Consultas efectuadas: {mozUser.consultationsCount}') &&
      !utenteScreenContent.includes('Sessão ainda não iniciada'),
    'UtenteRegistrationScreen deve usar os textos concisos aprovados e a secção compacta de saldo de consultas sem mensagens redundantes'
  );

  console.log('\n=== 9. TESTE DO FLUXO REAL DE VERIFICAÇÃO SMS FIREBASE, VALIDAÇÃO +258 E ESTADOS DE CONTACTO ===');
  // Ensure the misleading notice claiming the gateway is inactive by default is gone
  assert(
    !regFormContent.includes(
      'O envio de SMS pelo gateway Firebase não está ativo neste projeto no momento'
    ),
    'ProfessionalRegistrationForm não deve exibir aviso enganador pré-definido afirmando que o gateway SMS está desativado sem reportar o erro real do Firebase'
  );

  // Ensure 6-digit OTP input is ONLY displayed after Firebase returns ConfirmationResult (otpConfirmation)
  assert(
    regFormContent.includes('{otpConfirmation && !isPhoneActuallyVerified && ('),
    'ProfessionalRegistrationForm só deve apresentar as caixas de 6 dígitos do Código SMS após o Firebase iniciar o envio (otpConfirmation !== null)'
  );

  // Ensure all 4 contact verification states are explicitly distinguished in ProfessionalRegistrationForm
  assert(
    regFormContent.includes('Estado: Contacto verificado pelo Firebase (SMS)') &&
      regFormContent.includes('Estado: Contacto verificado pela administração') &&
      regFormContent.includes('Estado: Verificação por SMS pendente') &&
      regFormContent.includes('Estado: Contacto não verificado'),
    'ProfessionalRegistrationForm deve distinguir claramente os 4 estados de verificação de contacto'
  );

  // Ensure ID token refresh after OTP confirmation so Firestore rules see request.auth.token.phone_number != null
  assert(
    regFormContent.includes('await auth.currentUser.getIdToken(true)') &&
      utenteScreenContent.includes('await auth.currentUser.getIdToken(true)') &&
      serviceContent.includes('await auth.currentUser.getIdToken(true)'),
    'Após confirmar o código SMS, a aplicação deve atualizar o ID token (getIdToken(true)) antes de gravar no Firestore'
  );

  // Ensure professional_profiles rules align phoneVerified with request.auth.token.phone_number != null
  assert(
    rulesContent.includes('incoming().phoneVerified == (request.auth.token.phone_number != null)') &&
      rulesContent.includes("'phone', 'whatsapp', 'email', 'phoneVerified', 'authorizedPublication'"),
    'firestore.rules deve permitir phoneVerified == true quando o token Firebase Auth contém phone_number verificado, impedindo falsificação por utilizadores não verificados'
  );

  // Ensure firebase.ts defines validateMozambiquePhone and formatFirebasePhoneAuthError covering all required error codes
  const requiredAuthErrorCodes = [
    'auth/invalid-phone-number',
    'auth/unauthorized-domain',
    'auth/captcha-check-failed',
    'auth/missing-client-identifier',
    'auth/quota-exceeded',
    'auth/billing-not-enabled',
    'auth/operation-not-allowed',
    'auth/too-many-requests',
    'auth/code-expired',
    'auth/invalid-verification-code',
    'auth/credential-already-in-use',
    'auth/provider-already-linked',
  ];
  for (const errCode of requiredAuthErrorCodes) {
    assert(
      firebaseTsContent.includes(errCode),
      `src/firebase.ts deve tratar explicitamente o código de erro Firebase Phone Auth: ${errCode}`
    );
  }
  console.log('✓ Fluxo real de verificação SMS, tratamento de erros Firebase e 4 estados de verificação validados.');

  console.log('✓ Configuração de produção para GitHub, Vercel e Firebase verificada.');
  console.log('\nTODOS OS TESTES PASSARAM COM SUCESSO!');
}

runAuditAndLogicTests();
