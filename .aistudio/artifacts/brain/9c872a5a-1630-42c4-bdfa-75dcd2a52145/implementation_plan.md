# Plano de Melhorias — Navegação Mobile, Cartões, Ecrãs e Design System (MozFácil)

## 1. Diagnóstico e Objetivos
Com base na análise da captura de ecrã enviada e nas suas escolhas de navegação mobile, identificámos os seguintes pontos críticos de usabilidade no telemóvel (360px–430px):
- **Cabeçalho Superior Apertado**: No ecrã de *Registo de Empresa ou Instituição*, o botão `Voltar`, o título `Registo de Empresa ou In...` e o selo `Passo 1 de 5` colidem horizontalmente sem espaçamento (`gap`), cortando o título e partindo o indicador de passo em duas linhas.
- **Abas de Passos Cortadas (`grid-cols-5`)**: A grelha fixa de 5 colunas força cada etapa a ocupar apenas 20% da largura do ecrã, truncando todos os nomes (`1. Identi...`, `2. Conta...`, `3. Locali...`, `4. Fotos ...`, `5. Horári...`).
- **Navegação entre Etapas e Cartões**: Falta um carrossel horizontal deslizável com os nomes completos de cada etapa, auto-scroll suave para a etapa ativa e uma **barra fixa inferior ergonómica** com os botões `Anterior` e `Próximo Passo` / `Publicar` na zona natural do polegar.
- **Consistência de Cartões e Ecrãs de Detalhe / Exploração**: Os ecrãs de *Registo de Profissional*, *Perfil da Empresa*, *Perfil do Profissional*, *Meus Perfis* e *Explore* precisam de cabeçalhos padronizados (com botão de retorno de 44×44px, título nítido e badge de estado alinhado), cartões com hierarquia visual limpa e espaçamento inferior seguro para não colidir com a navegação fixa.

---

## 2. Garantias de Preservação (Zero Alteração de Lógica)
- **100% da lógica original preservada**: Todos os campos, validações de NUIT/telefone (+258), OTP SMS Firebase, captura de coordenadas GPS, upload/compressão de imagens, documentos privados, horários semanais, serviços e gravação no Firestore permanecem intocados.
- **Paleta Oficial MozFácil**: Azul Marinho Institucional (`#071F4A`, `#0D316E`, `#1E4B9B`), Laranja de Destaque (`#EA580C`, `#F97316`), Verde Esmeralda para estados ativos/verificados (`#059669`) e superfícies neutras (`#F8FAFC` / `#FFFFFF`).

---

## 3. Melhorias Planeadas por Área

### A. Registo e Edição de Empresa / Instituição (`src/components/CompanyRegistrationForm.tsx`)
1. **Cabeçalho Mobile Desafogado (App Bar)**:
   - Botão `Voltar` com área de toque mínima de `40x40px` (`rounded-xl bg-white/10 hover:bg-white/20`), separado do título com espaçamento generoso (`gap-3`).
   - Título estruturado em 2 linhas limpas ou subtítulo contextual + badge `Passo X de 5` compacto (`whitespace-nowrap shrink-0`) e barra visual de progresso linear (`20%` a `100%`) na base do cabeçalho.
2. **Carrossel Horizontal Deslizável com Nomes Completos dos 5 Passos**:
   - Substituir o `grid-cols-5` truncado por um **carrossel horizontal deslizável (`overflow-x-auto no-scrollbar scroll-smooth`)** onde cada passo exibe o ícone, número, **nome completo sem cortes** (`1. Identificação`, `2. Contacto`, `3. Localização`, `4. Fotos e Documentos`, `5. Horários e Serviços`) e indicador visual de etapa concluída/ativa.
   - Sincronizar o scroll horizontal automaticamente para manter o passo ativo centrado no ecrã ao avançar ou recuar.
3. **Cartões de Formulário e Barra Fixa Inferior (`Anterior` / `Próximo Passo`)**:
   - Organizar os grupos de campos em cartões claros (`rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs`).
   - Adicionar **barra de navegação fixa inferior** (`sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-[0_-4px_16px_rgba(13,49,110,0.08)]`) com botões ergonómicos (`min-h-[46px]`):
     - Passos 1 a 4: Botão `Anterior` + indicador central de etapa + botão primário `Próximo Passo →`.
     - Passo 5: Botão `Anterior` + `Guardar Rascunho` + CTA principal `Publicar Empresa`.

### B. Registo e Edição de Profissional / Serviço (`src/components/ProfessionalRegistrationForm.tsx`)
1. **Navegação Rápida por Passos em Carrossel Horizontal**:
   - Adicionar barra de navegação das 5 secções em **carrossel horizontal deslizável com nomes completos** (`1. Identificação`, `2. Contacto e SMS`, `3. Localização e GPS`, `4. Estado e Horário`, `5. Serviços e Fotos`), permitindo alternar entre visualização passo a passo (modo assistente focado no mobile) ou visão completa, evitando scroll excessivo no telemóvel.
2. **Cabeçalho e Barra Fixa Inferior**:
   - Uniformizar o cabeçalho com o mesmo padrão do Design System MozFácil e adicionar a **barra fixa inferior** com `Anterior` / `Próximo Passo` e ações de publicação (`Criar Perfil Gratuito`, `Rascunho`, `Submeter à Revisão`).

### C. Perfis Detalhados de Empresa e Profissional (`src/components/CompanyProfileDetail.tsx` & `src/components/ProfessionalProfileDetail.tsx`)
1. **App Bar de Detalhe e Cartão de Identidade**:
   - Cabeçalho superior sticky com botão `Voltar` ergonómico, título sem truncamento abrupto e botão `Editar Perfil` bem destacado.
   - Cartão principal de identidade com logótipo/avatar, selos de verificação (`Verificado`, `NUIT`, `Categoria`) bem alinhados com `flex-wrap` e sem sobreposição em ecrãs estreitos.
2. **Barra de Ações Rápidas (Chat WhatsApp, Ligar, Ver no Mapa)**:
   - Botões de contacto rápido com altura mínima `46px`, ícones claros e feedback tátil (`active:scale-[0.98]`), mantendo a leitura limpa dos cartões de Horários, Serviços/Departamentos, Galeria de Fotos e Vídeo Institucional.

### D. Ecrã Explore, Meus Perfis e Contentor Principal (`src/components/ExploreModulesScreen.tsx` & `src/App.tsx`)
1. **Fluxo de Exploração e Transição entre Ecrãs**:
   - Garantir que todas as vistas de formulário, detalhe, `Meus Perfis` e `Explore` têm espaçamento inferior adequado (`pb-24`) para que a barra de navegação principal da aplicação (`Início`, `Empresas`, `Profissionais`, `Mais`) nunca cubra botões ou cartões.
   - Melhorar o cabeçalho e os filtros de estado em `Meus Perfis` com carrossel horizontal deslizável de filtros (`Todos`, `Publicados`, `Em Revisão`, `Rascunhos`, `Rejeitados`) e cartões de gestão mais limpos no mobile.
