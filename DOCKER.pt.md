# Guia de Implantação com Docker

Este guia explica como containerizar e implantar a aplicação CRA Frontend usando o Docker.

## Pré-requisitos

Antes de começar, certifique-se de ter o seguinte instalado:
- Docker (versão 18.09 ou superior)
- Docker Compose (opcional, mas recomendado)

## Arquivos de Configuração do Docker

Este projeto inclui os seguintes arquivos relacionados ao Docker:

1. `Dockerfile` - Configuração de build multi-estágio para a aplicação Angular
2. `docker-compose.yml` - Configuração do Docker Compose para implantação fácil
3. `nginx.conf` - Configuração do servidor web Nginx para servir a aplicação
4. `.dockerignore` - Especifica arquivos e diretórios a serem excluídos do contexto de build do Docker

## Construindo a Imagem Docker

Para construir a imagem Docker, execute o seguinte comando no diretório raiz do projeto:

```bash
docker build -t cra-frontend .
```

Este comando irá:
1. Usar o Node.js 18 para construir a aplicação Angular
2. Criar uma build de produção da aplicação
3. Empacotar a aplicação construída em um container Nginx Alpine

## Executando o Container

Após construir a imagem, você pode executar o container com:

```bash
docker run -d -p 4200:80 --name cra-frontend-app cra-frontend
```

Isso irá:
- Executar o container em modo desanexado (`-d`)
- Mapear a porta 4200 do host para a porta 80 no container (`-p 4200:80`)
- Nomear o container como `cra-frontend-app` (`--name cra-frontend-app`)

A aplicação estará acessível em `http://localhost:4200`

## Usando o Docker Compose

Para gerenciamento mais fácil, você pode usar o Docker Compose:

```bash
# Construir e iniciar a aplicação
docker-compose up -d

# Parar e remover os containers
docker-compose down
```

## Configuração

### Variáveis de Ambiente

O container Docker usa as seguintes variáveis de ambiente:

- `NODE_ENV`: Definido como "production" para builds de produção

### Configuração de Portas

O container expõe a porta 80. Você pode alterar o mapeamento de portas do host em:
- O comando `docker run`
- O arquivo `docker-compose.yml`

### Configuração da API de Backend

A aplicação está configurada para usar uma URL relativa para chamadas de API (`/cra-api`). Isso permite que ela funcione com proxies reversos ou quando o backend é servido do mesmo domínio.

Se você precisar alterar a URL da API de backend:
1. Atualize o `apiUrl` em `src/environments/environment.prod.ts`
2. Reconstrua a imagem Docker

## Implantação em Produção

Para implantação em produção:

1. Atualize a configuração de ambiente em `src/environments/environment.prod.ts`
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

## Solução de Problemas

### Problemas de Build

Se você encontrar problemas de build:
1. Certifique-se de que todas as dependências estão instaladas corretamente
2. Verifique se o arquivo `.dockerignore` está excluindo corretamente os arquivos desnecessários
3. Verifique se o arquivo `package.json` está configurado corretamente

### Problemas de Execução

Se o container falhar ao iniciar:
1. Verifique os logs do container: `docker logs cra-frontend-app`
2. Certifique-se de que a porta 4200 não está em uso
3. Verifique se a configuração do nginx está correta

### Problemas de Rede

Se a aplicação não conseguir se conectar ao backend:
1. Certifique-se de que o backend está acessível a partir do container
2. Verifique a configuração da URL da API nos arquivos de ambiente
3. Verifique a conectividade de rede entre containers se estiver usando redes Docker

## Melhores Práticas

1. Sempre use versões específicas para imagens base em produção
2. Atualize regularmente as dependências e reconstrua as imagens
3. Use builds multi-estágio para reduzir o tamanho da imagem
4. Implemente verificações de saúde em ambientes de produção
5. Use segredos do Docker para dados de configuração sensíveis