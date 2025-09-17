# Acesso à Aplicação

## Endereços de Acesso

### Acesso Local (na mesma máquina)
- Frontend: http://localhost:4200
- Backend API: http://localhost:8081/cra-api

### Acesso via Rede (de outros dispositivos)
- Substitua `192.168.1.105` pelo endereço IP real da sua máquina
- Frontend: http://192.168.1.105:4200
- Backend API: http://192.168.1.105:8081/cra-api

## Como Encontrar seu Endereço IP

### Windows:
1. Abra o Prompt de Comando
2. Execute o comando: `ipconfig`
3. Procure o endereço IPv4 na seção do adaptador de rede que você está usando

### macOS/Linux:
1. Abra o Terminal
2. Execute o comando: `ifconfig` ou `ip addr`
3. Procure o endereço inet ou inet4

## Como Usar com Docker

### Iniciando com Docker Compose (Recomendado)
```bash
# Iniciar todos os serviços
docker-compose up -d

# Verificar status dos serviços
docker-compose ps

# Visualizar logs
docker-compose logs -f
```

### Parando os Serviços
```bash
# Parar todos os serviços
docker-compose down

# Parar e remover volumes (incluindo dados do banco)
docker-compose down -v
```

## Credenciais Padrão

- **Admin**: admin / admin123
- **Advogado**: advogado / senha123
- **Correspondente**: correspondente / senha123

## Problemas Comuns

### Erro de Conexão
- Verifique se o endereço IP está correto
- Certifique-se de que não há firewalls bloqueando as portas 4200 e 8081
- Confirme que ambos frontend e backend estão em execução

### Erro 404 nas Requisições
- Verifique se a configuração do `apiUrl` no arquivo `environment.ts` está correta
- Confirme que o backend está acessível no endereço configurado

### Problemas com Docker
- Verifique se o Docker e Docker Compose estão instalados corretamente
- Certifique-se de ter permissões adequadas para executar comandos Docker
- Verifique se há espaço em disco suficiente

## Recursos Adicionais

### Documentação Docker
- [DOCKER.md](DOCKER.md) - Guia completo de implantação com Docker (em inglês)
- [DOCKER.pt.md](DOCKER.pt.md) - Guia completo de implantação com Docker (em português)
- [DOCKER_SETUP_GUIDE.md](DOCKER_SETUP_GUIDE.md) - Guia de configuração do Docker
- [DOCKER_FIXES.md](DOCKER_FIXES.md) - Soluções para problemas comuns do Docker
- [TESTING_DOCKER.md](TESTING_DOCKER.md) - Guia de testes do ambiente Docker

### Funcionalidades Recentes
1. **Gerenciamento Avançado de Status de Solicitações** - Controle completo dos status das solicitações
2. **Sistema de Anexos com Controle de Origem** - Upload/download de arquivos com diferenciação visual por origem
3. **Sistema de Observações do Correspondente** - Captura especializada de observações dos correspondentes
4. **Formatação de Valores Monetários** - Campo especializado para valores em formato brasileiro
5. **Aprimoramentos na Interface do Usuário** - Melhorias na formatação de datas e feedback visual