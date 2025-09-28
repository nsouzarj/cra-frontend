# CRA Frontend - Angular 20

Frontend web application for the CRA (Correspondente Responsável por Atos) system built with Angular 20 and Angular Material.

## 🏢 Visão Geral

O sistema CRA (Correspondente Responsável por Atos) é uma plataforma abrangente de gestão legal que permite que administradores, advogados e correspondentes gerenciem processos legais, usuários e solicitações de serviço. O sistema implementa controle de acesso baseado em funções com autenticação JWT.

Para mais informações sobre o projeto completo, consulte o [README.md](../README.md) principal.

## 🚀 Principais Recursos

- **Autenticação & Autorização**: Autenticação baseada em JWT com controle de acesso baseado em funções
- **Gestão de Usuários**: Operações CRUD completas para usuários (Acesso: Admin/Advogado)
- **Gestão de Correspondentes**: Gerenciamento de correspondentes legais com pesquisa e filtragem
- **Gestão de Processos**: Manipulação de processos legais com acompanhamento abrangente
- **Gestão de Solicitações**: Gerenciamento de solicitações de serviço com acompanhamento de status
- **Dashboard**: Visão geral de estatísticas em tempo real e ações rápidas
- **Design Responsivo**: Interface compatível com dispositivos móveis usando Angular Material
- **Internacionalização**: Interface e documentação em português
- **Armazenamento de Arquivos Híbrido**: Suporte para armazenamento local e na nuvem (Google Drive) com seleção por usuário
- **Controle de Origem de Arquivos**: Diferenciação visual e permissões baseadas na origem dos arquivos (solicitante vs correspondente)

## 🛠️ Tecnologias

- **Angular 20**: Framework mais recente com componentes standalone
- **Angular Material**: Componentes de UI modernos
- **TypeScript**: Desenvolvimento com segurança de tipos
- **RxJS**: Programação reativa
- **SCSS**: Estilização avançada

## 📋 Pré-requisitos

Antes de executar esta aplicação, certifique-se de ter:

- **Node.js** (versão 18 ou superior)
- **npm** (vem com Node.js)
- **Angular CLI** (versão 20)
- **CRA Backend** em execução em `http://localhost:8081`

## 🔧 Instalação

1. **Clone ou navegue até o diretório frontend:**
   ```bash
   cd cra-frontend
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Instale o Angular CLI globalmente (se ainda não estiver instalado):**
   ```bash
   npm install -g @angular/cli@20
   ```

## 🏃‍♂️ Executando a Aplicação

### Modo Desenvolvimento

```
npm start
# ou
ng serve --host 0.0.0.0 --disable-host-check
```

A aplicação estará disponível em:
- Local: `http://localhost:4200`
- Rede: `http://[seu-ip]:4200` (para acesso de outros dispositivos)

### Build de Produção

```
npm run build
# ou
ng build --configuration production
```

Os arquivos compilados estarão no diretório `dist/`.

## 🏗️ Estrutura do Projeto

```
src/
├── app/
│   ├── core/                     # Funcionalidade principal
│   │   ├── guards/               # Guards de rotas
│   │   ├── interceptors/         # Interceptadores HTTP
│   │   └── services/             # Serviços principais
│   ├── features/                 # Módulos de funcionalidades
│   │   ├── admin-dashboard/      # Dashboard administrativo
│   │   ├── advogado-dashboard/   # Dashboard de advogado
│   │   ├── auth/                 # Autenticação
│   │   │   ├── login/            # Componentes de login
│   │   │   └── external-storage/ # Autenticação e gerenciamento de armazenamento externo (Google Drive)
│   │   ├── comarca-management/   # Gerenciamento de comarcas
│   │   ├── correspondent-dashboard/ # Dashboard de correspondente
│   │   ├── correspondent-management/  # Gerenciamento de correspondentes
│   │   ├── correspondent-requests/ # Solicitações de correspondente
│   │   ├── process-management/   # Gerenciamento de processos
│   │   ├── request-management/   # Gerenciamento de solicitações
│   │   └── user-management/      # Gerenciamento de usuários
│   ├── main-nav/                 # Componentes de navegação principal
│   ├── shared/                   # Componentes e utilitários compartilhados
│   │   ├── components/           # Componentes reutilizáveis
│   │   ├── directives/           # Diretivas personalizadas
│   │   ├── models/               # Interfaces TypeScript
│   │   └── services/             # Serviços compartilhados
│   ├── app-routing.module.ts     # Roteamento principal
│   ├── app.component.ts          # Componente raiz
│   └── app.module.ts             # Módulo raiz
├── assets/                       # Recursos estáticos
├── styles.scss                   # Estilos globais
└── index.html                    # Arquivo HTML principal
```

## 🎯 Funcionalidades Principais

### Sistema de Autenticação
- Gerenciamento de tokens JWT com atualização automática
- Controle de acesso baseado em funções (Admin, Advogado, Correspondente)
- Rotas protegidas com guards
- Tratamento automático de expiração de tokens

### Gestão de Usuários (Apenas Admin/Advogado)
- Criar, ler, atualizar e excluir usuários
- Pesquisar por login, nome ou tipo
- Ativar/desativar usuários
- Atribuição de funções

### Gestão de Correspondentes
- Operações CRUD completas para correspondentes
- Pesquisar por OAB, CPF/CNPJ, nome ou tipo
- Gerenciamento de endereços
- Controle de status ativo/inativo

### Gestão de Processos
- Criar e gerenciar processos legais
- Pesquisar por número, parte, parte adversa ou assunto
- Filtrar por status, comarca ou órgão
- Estatísticas de processos

### Gestão de Solicitações
- Criar e acompanhar solicitações de serviço
- Vincular solicitações a processos e correspondentes
- Acompanhamento de status (Pendente, Em Andamento, Finalizada, Cancelada)
- Gerenciamento de prazos
- **Sistema de Anexos**: Upload e download de arquivos com suporte a armazenamento local e na nuvem (Google Drive)
- **Controle de Origem**: Diferenciação visual de arquivos com base em sua origem (solicitante vs correspondente)

## 🆕 Novas Funcionalidades Implementadas

### 1. Gerenciamento Avançado de Status de Solicitações
- Implementação de serviço dedicado para gerenciamento de status de solicitações
- Suporte completo para operações CRUD de status
- Integração com todas as telas de solicitações

### 2. Sistema de Anexos com Controle de Origem
- Upload e download de arquivos anexados às solicitações
- Controle automático de origem dos arquivos (solicitante vs correspondente)
- Interface visual diferenciada para arquivos com base em sua origem:
  - Bordas azuis para arquivos enviados por correspondentes
  - Bordas verdes para arquivos enviados por solicitantes/administradores
- Permissões de exclusão baseadas na origem do arquivo e perfil do usuário

### 3. Sistema de Observações do Correspondente
- Diálogo especializado para captura de observações do correspondente
- Validação de observações com mínimo de 20 caracteres
- Exibição condicional de observações baseada no status da solicitação
- Integração com fluxo de alteração de status

### 4. Formatação de Valores Monetários
- Campo de entrada especializado para valores monetários
- Formatação automática para padrão brasileiro (R$ 0,00)
- Validação e tratamento de entrada de dados

### 5. Aprimoramentos na Gestão de Status
- Atualização automática da data de conclusão com base no status
- Lógica especializada para status "Aguardando Confirmação", "Em Andamento", "Finalizada" e "Concluído"
- Exibição condicional de campos e seções baseada no status atual

### 6. Aprimoramentos na Interface do Usuário
- Melhorias na formatação de datas e horas
- Componentes de diálogo padronizados (confirmação e observação)
- Feedback visual aprimorado para diferentes estados da aplicação

### 7. Sistema de Armazenamento de Arquivos Híbrido
- **Armazenamento Local**: Os arquivos são armazenados diretamente no servidor backend no diretório configurado.
- **Armazenamento na Nuvem**: Integração com Google Drive para armazenamento externo através de autenticação OAuth2.
- **Seleção de Local de Armazenamento**: Interface que permite ao usuário escolher entre armazenamento local ou na nuvem ao anexar arquivos.
- **Autenticação Externa**: Sistema de autenticação seguro com Google Drive para proteger arquivos armazenados na nuvem.
- **Download Unificado**: Interface unificada para download de arquivos independentemente do local de armazenamento.
- **Controle de Origem**: Diferenciação visual de arquivos com base em sua origem (solicitante vs correspondente).
- **Gerenciamento de Permissões**: Controle de acesso baseado em perfis para exclusão de arquivos.
- **Módulo de Autenticação Externa**: Componentes especializados para gerenciamento da autenticação com Google Drive.

## 🔧 Configuração

### Configuração do Endpoint da API

A URL da API backend é configurada nos arquivos de ambiente:

- Desenvolvimento: `http://localhost:8081/cra-api` (ou `http://[seu-ip]:8081/cra-api` para acesso via rede)
- Produção: `/cra-api` (relativo, para proxy)

### Configuração de Ambiente

Crie arquivos de ambiente para diferentes configurações:

```
// src/environments/environment.ts (desenvolvimento)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8081/cra-api'
};

// src/environments/environment.prod.ts (produção)
export const environment = {
  production: true,
  apiUrl: '/cra-api'
};
```

### Configuração de Armazenamento de Arquivos

O sistema suporta dois tipos de armazenamento de arquivos:

1. **Armazenamento Local**: Os arquivos são armazenados diretamente no servidor backend no diretório configurado.

2. **Armazenamento na Nuvem (Google Drive)**: Os arquivos são armazenados no Google Drive do usuário através de autenticação OAuth2.

Para habilitar o armazenamento na nuvem, é necessário configurar as credenciais do Google Drive API no backend e garantir que o frontend tenha permissões adequadas para acessar a API.

#### Fluxo de Autenticação para Armazenamento na Nuvem

1. O usuário seleciona "Google Drive" como local de armazenamento
2. O sistema verifica se o usuário já está autenticado com o Google Drive
3. Se não estiver autenticado, uma janela de autenticação do Google é aberta
4. Após autenticação bem-sucedida, o usuário pode fazer upload de arquivos para o Google Drive
5. Os metadados dos arquivos são armazenados no banco de dados local, incluindo o ID do arquivo no Google Drive

A escolha entre armazenamento local e na nuvem pode ser feita configurando a variável `fileStorageType` nos arquivos de ambiente:

```
// src/environments/environment.ts (desenvolvimento)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8081/cra-api',
  fileStorageType: 'local' // ou 'cloud'
};

// src/environments/environment.prod.ts (produção)
export const environment = {
  production: true,
  apiUrl: '/cra-api',
  fileStorageType: 'cloud' // ou 'local'
};

```

## ▶️ Execução com Docker

### Pré-requisitos
- Docker e Docker Compose instalados
- Pelo menos 4GB de RAM disponível

### Início Rápido
1. Clone o repositório:
   ```bash
   git clone <url-do-repositorio>
   cd cra-frontend
   ```

2. Inicie todo o stack da aplicação:
   ```bash
   docker-compose up -d
   ```

3. Acesse a aplicação:
   - Frontend: http://localhost:4200
   - API Backend: http://localhost:8081/cra-api
   - Banco de Dados: localhost:5432 (PostgreSQL)

### Parando a Aplicação
```
docker-compose down
```

### Visualizando Logs
```
docker-compose logs -f
```

Para instruções detalhadas sobre implantação com Docker, consulte:
- [DOCKER.md](DOCKER.md) (Inglês)
- [DOCKER.pt.md](DOCKER.pt.md) (Português)

**Nota sobre Armazenamento de Arquivos**: Ao executar com Docker, certifique-se de que os volumes para armazenamento de arquivos locais estão corretamente mapeados no docker-compose.yml para persistir os arquivos entre reinicializações dos containers.

## 🔐 Credenciais Padrão

Use as mesmas credenciais configuradas no backend:

- **Admin**: admin / admin123
- **Advogado**: advogado / senha123
- **Correspondente**: correspondente / senha123

## 🎨 Personalização

### Tema
A aplicação utiliza temas do Angular Material. Personalize as cores em `src/styles.scss`:

``scss
$cra-frontend-primary: mat-palette($mat-indigo);
$cra-frontend-accent: mat-palette($mat-pink, A200, A100, A400);
```

### Adicionando Novos Recursos
1. Crie módulos de funcionalidades em `src/app/features/`
2. Adicione roteamento em `src/app/app-routing.module.ts`
3. Adicione itens de navegação em `src/app/shared/components/layout/sidenav/sidenav.component.ts`

### Configuração de Armazenamento de Arquivos
Para personalizar as opções de armazenamento de arquivos:
1. Modifique os componentes de seleção de armazenamento em `src/app/features/request-management/` e `src/app/features/correspondent-requests/`
2. Atualize os estilos em `src/app/features/request-management/request-form.component.scss` e `src/app/features/request-management/request-detail.component.scss`
3. Configure as permissões de acesso no serviço de autenticação externa

## 📱 Suporte Mobile

A aplicação é totalmente responsiva e suporta dispositivos móveis com:
- Layouts de grade responsivos
- Interface compatível com toque
- Navegação otimizada para mobile
- Formulários adaptativos

## 🐳 Implantação com Docker

Esta aplicação pode ser containerizada usando Docker para fácil implantação e escalabilidade.

### Início Rápido

```
# Construir a imagem Docker
docker build -t cra-frontend .

# Executar o container
docker run -d -p 4200:80 --name cra-frontend-app cra-frontend
```

A aplicação estará disponível em `http://localhost:4200`

## 🧪 Testes

```bash
# Executar testes unitários
npm test

# Executar testes e2e
npm run e2e

# Executar testes em modo watch
npm run test:watch

# Gerar relatório de cobertura
npm run test:coverage
```

## 📦 Dependências

Principais dependências incluem:
- **@angular/core**: ~20.2.2
- **@angular/material**: ~20.2.2
- **@angular/cdk**: ~20.2.2
- **rxjs**: ~7.8.0
- **typescript**: ~5.9.2
- **@dhutaryan/ngx-mat-timepicker**: Componente de timepicker para Angular Material

## 🤝 Contribuição

1. Siga o guia de estilo do Angular
2. Utilize TypeScript em modo estrito
3. Implemente tratamento adequado de erros
4. Adicione comentários apropriados
5. Teste suas alterações

## 📄 Licença

Este projeto faz parte do sistema CRA para gestão de correspondentes legais.

## 🆘 Suporte

Para problemas e dúvidas:
1. Verifique se o backend está em execução e acessível
2. Verifique as permissões e funções dos usuários
3. Verifique o console do navegador em busca de erros
4. Revise as requisições de rede nas ferramentas de desenvolvedor
5. Para problemas com armazenamento na nuvem, verifique se as credenciais do Google Drive API estão corretamente configuradas no backend

## 🔄 Atualizações

Para atualizar o Angular e as dependências:

```
# Atualizar Angular
ng update @angular/core @angular/cli

# Atualizar Angular Material
ng update @angular/material

# Atualizar todas as dependências
npm update
```

## 🚀 Migração para Angular 20

O projeto foi atualizado da versão Angular 18 para Angular 20, aproveitando os recursos mais recentes do framework:

### Principais Atualizações

- **Angular 20.2.2**: Atualização para a versão mais recente do framework
- **Angular Material 20.2.2**: Componentes atualizados com melhorias de desempenho
- **TypeScript 5.9.2**: Suporte para recursos mais recentes da linguagem
- **Compatibilidade**: Total compatibilidade com as APIs existentes

### Benefícios da Migração

- **Melhor desempenho**: Otimizações do Angular 20 para renderização e change detection
- **Novos recursos**: Aproveitamento dos recursos mais recentes do framework
- **Segurança**: Atualizações de segurança e correções de bugs
- **Suporte**: Compatibilidade com as versões mais recentes das ferramentas de desenvolvimento

### Considerações Técnicas

- **Componentes Standalone**: Continuação do uso de componentes standalone introduzidos no Angular 18
- **Compatibilidade**: Todos os componentes e serviços foram atualizados para manter compatibilidade
- **Testes**: Todos os testes foram verificados e atualizados conforme necessário
