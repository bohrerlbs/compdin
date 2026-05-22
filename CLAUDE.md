@AGENTS.md

## Self-hosting no PC do Leonardo (pendente)

Leonardo quer migrar do Supabase + Vercel para rodar no PC próprio em casa.

**Infraestrutura que ele já tem:**
- PC em casa com energia solar (confiável)
- Acesso externo via **Cloudflare Tunnel** (`cloudflared.exe`) — já usa no KF bot
- Projeto KF bot em `C:\Users\Leonardo\Downloads\kfbot` como referência de setup
- Sem nginx, sem PM2 — usa `.bat` para iniciar processos

**O que precisa fazer (quando for executar):**

1. **Instalar PostgreSQL no Windows**
   - Installer: https://www.postgresql.org/download/windows/
   - Anotar usuário (`postgres`) e senha definidos na instalação

2. **Criar o banco:**
   ```bat
   "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE DATABASE compdin;"
   ```

3. **Configurar `.env` no projeto compdin:**
   ```
   DATABASE_URL=postgresql://postgres:SUASENHA@localhost:5432/compdin
   NEXTAUTH_URL=https://compdin.SEUDOMINIO.com
   NEXTAUTH_SECRET=qualquer_string_longa_aqui
   ```

4. **Build e migração:**
   ```bat
   npm run build
   npx prisma migrate deploy
   ```

5. **Migrar dados do Supabase (não perder nada):**
   ```bat
   pg_dump "postgresql://postgres:SENHA@db.PROJETO.supabase.co:5432/postgres" > backup.sql
   "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d compdin -f backup.sql
   ```
   - String de conexão do Supabase: pegar em Settings → Database → Connection string

6. **Criar `INICIAR_COMPDIN.bat`** na pasta do projeto:
   ```bat
   @echo off
   cd /d C:\caminho\do\compdin
   npm start
   ```

7. **Cloudflare Tunnel permanente** (igual ao que já usa no KF bot, mas fixo):
   - Entrar em `dash.cloudflare.com` → Zero Trust → Networks → Tunnels
   - Criar tunnel "compdin"
   - Apontar `compdin.SEUDOMINIO.com` → `http://localhost:3000`
   - Baixar e rodar o conector gerado

8. **Manter rodando com NSSM** (transforma em serviço Windows, inicia com o PC):
   ```bat
   nssm install compdin "npm" "start"
   nssm set compdin AppDirectory "C:\caminho\do\compdin"
   nssm start compdin
   ```

**Notas:**
- O código do app não precisa de nenhuma alteração — só as variáveis de ambiente
- O Cloudflare Tunnel cuida do HTTPS automaticamente, sem nginx nem certificados manuais
- Após migrar, pode desativar o projeto no Supabase e Vercel
