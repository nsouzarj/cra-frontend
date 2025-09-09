# Acesso à Aplicação

## Endereços de Acesso

### Acesso Local (na mesma máquina)
- Frontend: http://localhost:4200
- Backend API: http://localhost:8081

### Acesso via Rede (de outros dispositivos)
- Substitua `192.168.1.103` pelo endereço IP real da sua máquina
- Frontend: http://192.168.1.103:4200
- Backend API: http://192.168.1.103:8081

## Como Encontrar seu Endereço IP

### Windows:
1. Abra o Prompt de Comando
2. Execute o comando: `ipconfig`
3. Procure o endereço IPv4 na seção do adaptador de rede que você está usando

### macOS/Linux:
1. Abra o Terminal
2. Execute o comando: `ifconfig` ou `ip addr`
3. Procure o endereço inet ou inet4

## Como Usar

1. Certifique-se de que o backend está rodando na porta 8081
2. Inicie o frontend com: `npm start`
3. Acesse a aplicação usando um dos endereços acima

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