# Guia de Implantação com Docker

Este guia explica como containerizar e implantar a aplicação CRA Frontend usando o Docker.

## Pré-requisitos

Antes de começar, certifique-se de ter o seguinte instalado:
- Docker (versão 18.09 ou superior)
- Docker Compose (versão 1.27.0 ou superior)

## Arquivos de Configuração do Docker

Este projeto inclui os seguintes arquivos relacionados ao Docker:

1. `Dockerfile` - Configuração de build multi-estágio para a aplicação Angular
2. `docker-compose.yml` - Configuração do Docker Compose para implantação fácil de todo o stack (frontend, backend e banco de dados)
3. `docker-compose.override.yml` - Configuração adicional para verificações de saúde no desenvolvimento
4. `nginx.conf` - Configuração do servidor web Nginx para servir a aplicação com capacidades de proxy reverso
5. `.dockerignore` - Especifica arquivos e diretórios a serem excluídos do contexto de build do Docker

## Construindo a Imagem Docker

Para construir a imagem Docker, execute o seguinte comando no diretório raiz do projeto:

```bash
docker build -t cra-frontend .
```

Este comando irá:
1. Usar o Node.js 18 para construir a aplicação Angular
2. Criar uma build de produção da aplicação
3. Empacotar a aplicação construída em um container Nginx Alpine

## Executando o Stack Completo com Docker Compose

A forma recomendada de executar a aplicação é usando o Docker Compose, que iniciará todos os serviços (frontend, backend e banco de dados):

```bash
# Construir e iniciar todos os serviços
docker-compose up -d

# Visualizar logs
docker-compose logs -f

# Parar e remover todos os containers
docker-compose down
```

Isso iniciará:
- Aplicação frontend em `http://localhost:4200`
- API backend em `http://localhost:8081/cra-api`
- Banco de dados PostgreSQL em `localhost:5432`

## Executando Apenas o Container do Frontend

Se você quiser executar apenas o container do frontend (assumindo que tem o backend rodando separadamente):

```bash
docker run -d -p 4200:80 --name cra-frontend-app cra-frontend
```

Isso irá:
- Executar o container em modo desanexado (`-d`)
- Mapear a porta 4200 do host para a porta 80 no container (`-p 4200:80`)
- Nomear o container como `cra-frontend-app` (`--name cra-frontend-app`)

A aplicação estará acessível em `http://localhost:4200`

## Configuração

### Variáveis de Ambiente

O container Docker usa as seguintes variáveis de ambiente:

- `NODE_ENV`: Definido como "production" para builds de produção

### Configuração de Portas

O container expõe a porta 80. Você pode alterar o mapeamento de portas do host em:
- O comando `docker run`
- O arquivo `docker-compose.yml` (o serviço frontend mapeia para a porta 4200)

### Configuração da API de Backend

A aplicação está configurada para usar `/cra-api` como endpoint da API, que é tratado pela configuração do proxy reverso do Nginx. O servidor Nginx fará proxy das requisições para o serviço backend.

Se você precisar alterar a URL da API de backend:
1. Atualize o `apiUrl` em `src/environments/environment.prod.ts`
2. Reconstrua a imagem Docker

## Implantação em Produção

Para implantação em produção:

1. Atualize a configuração de ambiente em `src/environments/environment.prod.ts` com a URL do seu backend de produção
2. Construa com otimizações de produção:
   ```bash
   docker build -t cra-frontend:prod .
   ```
3. Execute com limites de recursos apropriados:
   ```bash
   docker run -d --name cra-frontend-app \
     -p 4200:80 \
     --memory=512m \
     --cpus=0.5 \
     cra-frontend:prod
   ```

Para uma implantação completa em produção com todos os serviços:

1. Atualize a tag da imagem do backend em `docker-compose.yml` se necessário
2. Ajuste as variáveis de ambiente conforme necessário
3. Execute:
   ```bash
   docker-compose up -d
   ```

## Verificações de Saúde

A configuração do Docker Compose inclui verificações de saúde para os serviços frontend e backend:
- O frontend aguarda que o backend esteja saudável antes de iniciar
- O backend verifica seu próprio endpoint de saúde

## Solução de Problemas

### Problemas de Build

Se você encontrar problemas de build:
1. Certifique-se de que todas as dependências estão instaladas corretamente
2. Verifique se o arquivo `.dockerignore` está excluindo corretamente os arquivos desnecessários
3. Verifique se o arquivo `package.json` está configurado corretamente
4. Certifique-se de ter espaço em disco e memória suficientes

### Problemas de Execução

Se o container falhar ao iniciar:
1. Verifique os logs do container: `docker logs cra-frontend-app`
2. Certifique-se de que a porta 4200 não está em uso
3. Verifique se a configuração do nginx está correta
4. Verifique se todas as variáveis de ambiente necessárias estão definidas

### Problemas de Rede

Se a aplicação não conseguir se conectar ao backend:
1. Certifique-se de que o backend está acessível a partir do container
2. Verifique a configuração da URL da API nos arquivos de ambiente
3. Verifique a conectividade de rede entre containers se estiver usando redes Docker
4. Verifique se a configuração do proxy reverso do Nginx está correta

### Problemas de Conexão com o Banco de Dados

Se o backend não conseguir se conectar ao banco de dados:
1. Verifique se o container do banco de dados está em execução
2. Verifique os parâmetros de conexão do banco de dados no serviço backend
3. Certifique-se de que as credenciais do banco de dados estão corretas

## Melhores Práticas

1. Sempre use versões específicas para imagens base em produção
2. Atualize regularmente as dependências e reconstrua as imagens
3. Use builds multi-estágio para reduzir o tamanho da imagem
4. Implemente verificações de saúde em ambientes de produção
5. Use segredos do Docker para dados de configuração sensíveis
6. Verifique regularmente as imagens em busca de vulnerabilidades
7. Use limites de recursos para evitar que os containers consumam recursos excessivos
8. Implemente estratégias adequadas de registro para ambientes de produção

## Aprimoramentos Recentes

A configuração do Docker foi aprimorada com:
1. Configuração do Nginx aprimorada com melhor tratamento de erros
2. Verificações de saúde para todos os serviços
3. Melhor gerenciamento de recursos com políticas de reinicialização
4. Configuração aprimorada do proxy reverso para requisições da API
5. Cache aprimorado para assets estáticos