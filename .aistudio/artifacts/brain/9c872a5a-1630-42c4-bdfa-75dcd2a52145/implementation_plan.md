# Plano de Implementação: Lógica de Créditos, Pacotes de Acesso e Engajamento Visual (MozFácil)

## 1. Diagnóstico e Eliminação de Contradições

Atualmente, a aplicação apresenta inconsistências face ao modelo oficial das imagens de referência:
- **Contradição no Saldo Inicial**: O código atribui `100 créditos` automáticos no registo (`INITIAL_WELCOME_CREDITS: 100`), contradizendo diretamente a regra **"O cadastro não gera recompensa"** e desvalorizando o pacote pago de **100 créditos = 30 dias (100 MT)**.
- **Contradição no Modelo de Consulta**: O código cobra avulso sem noção de pacotes temporais, enquanto o modelo oficial oferece **Pacotes de Acesso por Tempo** (`1 crédito = 2 horas`, `5 créditos = 24 horas`, `30 créditos = 7 dias`, `100 créditos = 30 dias`) para pessoas registadas e **Contacto Directo Emergente** (`50 créditos = 50 MT`) para pessoas registadas e não registadas.
- **Contradição na Linha do Cliente**: O botão **Linha do Cliente** na página inicial abre o WhatsApp para qualquer visitante sem verificar registo, contradizendo a regra **"Apenas para pessoas registadas"**.
- **Excesso de Texto nos Modais e Termos**: O modal atual de `Informação ao Utente` e a secção de termos do cadastro utilizam parágrafos longos que não seguem o design limpo, escaneável e orientado ao benefício das imagens fornecidas.

---

## 2. Arquitetura da Nova Lógica de Créditos (`src/constants.ts`, `src/types.ts`, `src/App.tsx`)

### 2.1. Configuração Oficial de Preços e Pacotes (`PRICING_CONFIG`)
- **`INITIAL_WELCOME_CREDITS: 0`**: Novos cadastros iniciam com `0 créditos`, respeitando estritamente que o registo de empresas, profissionais, serviços e utentes é **100% GRATUITO**, mas não gera créditos gratuitos de recompensa.
- **Tabela de Pacotes de Acesso (`CREDIT_PACKAGES`)**:
  - **2 Horas (`1 crédito = 1 MT`)**: Ideal para 1 consulta rápida imediata.
  - **24 Horas (`5 créditos = 5 MT`)**: Acesso durante todo o dia (*Poupança de 58% por hora*).
  - **7 Dias (`30 créditos = 30 MT`)**: Selo **"Popular · ~4,2 MT/dia"** para pesquisas semanais.
  - **30 Dias (`100 créditos = 100 MT`)**: Selo **"Melhor Valor · ~3,3 MT/dia"** para acesso mensal contínuo.
- **Contacto Directo Emergente (`50 créditos = 50 MT`)**:
  - Chamada telefónica prioritária para casos urgentes que exigem orientação imediata, disponível para pessoas registadas e não registadas.
- **Passe de Acesso Ativo (`activePassExpiresAt`)**:
  - Ao ativar um pacote de tempo ou usar créditos numa Consulta Normal, o utente fica com acesso ativo durante a janela temporal correspondente (ex.: 2h, 24h, 7 dias ou 30 dias), visualizando um contador claro do tempo restante e sentindo o benefício imediato do pacote escolhido.

---

## 3. Redesign Visual e Interativo de "Informação ao Utente" (`src/components/HomeAndSidebar.tsx`)

Fiel às 3 imagens de referência, com micro-interações que incentivam a conversão sem blocos de texto cansativos:

1. **Cabeçalho Azul Institucional (`#0f2d52`)**:
   - Ícone circular laranja (`#f97316`), título **"Informação ao Utente"** e subtítulo **"Canais de apoio e custos de utilização"**.
2. **Cartão 1 — Registo de empresas, profissionais e serviços**:
   - Destaque **`100% GRATUITO`** em laranja vibrante + frase curta *"Cadastre-se e comece a divulgar os seus produtos e serviços na MozFácil."*
3. **Cartão 2 — Linha do Cliente**:
   - Destaque **`Via WhatsApp · GRÁTIS`** + *"Apoio geral e esclarecimentos sobre o uso da plataforma. Apenas para pessoas registadas."*
   - Interativo: se o utilizador já estiver registado/autenticado, permite abrir diretamente o canal; se não estiver, encaminha de imediato para o registo gratuito.
4. **Secção — Consulta Normal (`Por SMS ou voz`)**:
   - Banner creme/laranja suave com ícone de moedas: **`1 crédito = 1 MT`** (*"As consultas são efectuadas através de créditos. Cada crédito corresponde a 1 metical (MT)."*).
   - **4 Cartões de Pacotes Interativos**:
     - `1 crédito` — `2 horas`
     - `5 créditos` — `24 horas`
     - `30 créditos` — `7 dias` *(destaque visual de vantagem)*
     - `100 créditos` — `30 dias` *(destaque Melhor Benefício)*
   - Ao clicar num dos 4 pacotes, o cartão fica selecionado com feedback visual nítido, mostra o resumo do benefício (custo diário/horário e vantagem) e disponibiliza o botão rápido de ativação/recarga (para utentes autenticados) ou de criação de conta (para visitantes).
5. **Cartão — Contacto Directo**:
   - Ícone de chamada + descrição concisa de atendimento prioritário/emergente + badge **`50 créditos = 50 MT`** + nota *"Disponível para pessoas registadas e não registadas"* com botão de acionamento direto.
6. **Cartão — Indique e Ganhe**:
   - Ícone de presente em caixa creme + título **"Indique e Ganhe"** + texto fiel: *"Partilhe o seu link. Quando a pessoa indicada fizer a primeira consulta paga, recebe créditos equivalentes ao valor elegível. O cadastro não gera recompensa."*
   - Inclui botão prático para **Copiar Link / Partilhar no WhatsApp** com o código pessoal do utente (ou convite para criar conta se visitante).
7. **Rodapé de Ação**:
   - Botão primário escuro **`Cadastre-se Agora`** (ou **`Recarregar / Ativar Pacote`** se já autenticado) e botão secundário **`Fechar`**.

---

## 4. Alinhamento em Toda a Aplicação (Zero Contradições)

- **Botão "Linha do Cliente" na Home (`HomeAndSidebar.tsx`)**:
  - Verifica se o utilizador está autenticado. Caso não esteja, apresenta um aviso elegante e direto explicando que a **Linha do Cliente (WhatsApp · GRÁTIS)** é exclusiva para pessoas registadas, com botões para **Entrar** ou **Cadastrar-se Gratuitamente**, além da opção de **Contacto Directo Emergente (50 MT)** para não registados.
- **Painel da Conta do Utente e Modal de Consulta (`ProfileAndAdmin.tsx`, `AuthModals.tsx`)**:
  - No painel do utente (`Minha Conta`), exibir o saldo de créditos, o estado do pacote ativo, o seletor interativo para recarregar pacotes (`1, 5, 30 ou 100 MT`) e o cartão **Indique e Ganhe** com código/link único partilhável em 1 clique.
  - No modal de Termos e Condições (`AuthModals.tsx`), atualizar a cláusula de créditos e benefícios para refletir exatamente os pacotes (`1, 5, 30, 100 créditos`), o Contacto Directo (`50 créditos`) e a regra do Indique e Ganhe sem qualquer promessa contraditória de 100 créditos grátis no registo.
