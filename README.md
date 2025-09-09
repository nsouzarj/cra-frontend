# CRA Frontend - Angular 18

Frontend web application for the CRA (Correspondente Responsável por Atos) system built with Angular 18 and Angular Material.

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

## 🛠️ Tecnologias

- **Angular 18**: Framework mais recente com componentes standalone
- **Angular Material**: Componentes de UI modernos
- **TypeScript**: Desenvolvimento com segurança de tipos
- **RxJS**: Programação reativa
- **SCSS**: Estilização avançada

## 📋 Pré-requisitos

Antes de executar esta aplicação, certifique-se de ter:

- **Node.js** (versão 18 ou superior)
- **npm** (vem com Node.js)
- **Angular CLI** (versão 18)
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
   npm install -g @angular/cli@18
   ```

## 🏃‍♂️ Executando a Aplicação

### Modo Desenvolvimento

```bash
npm start
# ou
ng serve --host 0.0.0.0 --disable-host-check
```

A aplicação estará disponível em:
- Local: `http://localhost:4200`
- Rede: `http://[seu-ip]:4200` (para acesso de outros dispositivos)

### Build de Produção

```bash
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
│   │   ├── auth/                 # Autenticação
│   │   ├── dashboard/            # Dashboard
│   │   ├── user-management/      # Gerenciamento de usuários
│   │   ├── correspondent-management/  # Gerenciamento de correspondentes
│   │   ├── process-management/   # Gerenciamento de processos
│   │   └── request-management/   # Gerenciamento de solicitações
│   ├── shared/                   # Componentes e utilitários compartilhados
│   │   ├── components/           # Componentes reutilizáveis
│   │   └── models/               # Interfaces TypeScript
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

## 🔧 Configuração

### Configuração do Endpoint da API

A URL da API backend é configurada nos arquivos de ambiente:

- Desenvolvimento: `http://localhost:8081/cra-api` (ou `http://[seu-ip]:8081/cra-api` para acesso via rede)
- Produção: `/cra-api` (relativo, para proxy)

### Configuração de Ambiente

Crie arquivos de ambiente para diferentes configurações:

```typescript
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
```bash
docker-compose down
```

### Visualizando Logs
```bash
docker-compose logs -f
```

Para instruções detalhadas sobre implantação com Docker, consulte:
- [DOCKER.md](DOCKER.md) (Inglês)
- [DOCKER.pt.md](DOCKER.pt.md) (Português)

## 🔐 Credenciais Padrão

Use as mesmas credenciais configuradas no backend:

- **Admin**: admin / admin123
- **Advogado**: advogado / senha123
- **Correspondente**: correspondente / senha123

## 🎨 Personalização

### Tema
A aplicação utiliza temas do Angular Material. Personalize as cores em `src/styles.scss`:

```scss
$cra-frontend-primary: mat-palette($mat-indigo);
$cra-frontend-accent: mat-palette($mat-pink, A200, A100, A400);
```

### Adicionando Novos Recursos
1. Crie módulos de funcionalidades em `src/app/features/`
2. Adicione roteamento em `src/app/app-routing.module.ts`
3. Adicione itens de navegação em `src/app/shared/components/layout/sidenav/sidenav.component.ts`

## 📱 Suporte Mobile

A aplicação é totalmente responsiva e suporta dispositivos móveis com:
- Layouts de grade responsivos
- Interface compatível com toque
- Navegação otimizada para mobile
- Formulários adaptativos

## 🐳 Implantação com Docker

Esta aplicação pode ser containerizada usando Docker para fácil implantação e escalabilidade.

### Início Rápido

```bash
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
- **@angular/core**: ^18.0.0
- **@angular/material**: ^18.0.0
- **@angular/cdk**: ^18.0.0
- **rxjs**: ~7.8.0
- **typescript**: ~5.4.0

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

## 🔄 Atualizações

Para atualizar o Angular e as dependências:

```bash
# Atualizar Angular
ng update @angular/core @angular/cli

# Atualizar Angular Material
ng update @angular/material

# Atualizar todas as dependências
npm update
```