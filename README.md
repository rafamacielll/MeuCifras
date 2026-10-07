# MeuCifras

Aplicação web para salvar cifras com sincronização entre aparelhos.

## Arquitetura
- Frontend: HTML/CSS/JavaScript
- Hospedagem: GitHub Pages
- Banco + login: Supabase

## Segurança
O aplicativo usa Supabase Auth e Row Level Security (RLS).
Cada usuário só pode ler e alterar as próprias cifras e playlists.

## Configuração
O projeto já está conectado ao Supabase do MeuCifras.

## Migração automática
Após o primeiro login, o app tenta enviar para a nuvem as cifras/playlists que já estavam no localStorage do navegador das versões recentes. A migração é executada uma vez naquele navegador.

## GitHub Pages
O projeto inclui `.github/workflows/pages.yml` para publicação no GitHub Pages.
