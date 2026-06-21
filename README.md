# Meus Gastos — Web App

Versão web (desktop) do app **Meus Gastos**, em Next.js (App Router). Mesmas
funcionalidades do app mobile, com layout para tela cheia: lançamento de gastos,
categorias/subcategorias, limites, gráficos e ajustes. Usa o **mesmo backend
Supabase** do app.

## Stack

- Next.js 15 + React 19 (App Router)
- Supabase (`@supabase/ssr`) — auth Google + Postgres + realtime
- Tailwind CSS + tema claro/escuro
- Ícones: `@mdi/js` + logos de marca (simple-icons, embutidos)

## Rodar

```bash
cp .env.example .env.local   # preencha as chaves do Supabase
npm install
npm run dev                  # http://localhost:3000
```

## Variáveis (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Login Google (Supabase)

O fluxo web usa OAuth via Supabase. No painel do Supabase:

- **Authentication → URL Configuration → Redirect URLs**: adicione
  `http://localhost:3000/auth/callback` (dev) e a URL de produção
  `https://SEU-DOMINIO/auth/callback`.
- O provider Google já deve ter o **client Web** configurado (mesmo do projeto).

## Estrutura

- `app/(app)/*` — telas autenticadas (início, categorias, limites, gráficos, ajustes)
- `app/login` — entrada com Google
- `app/auth/callback` — troca do code OAuth por sessão
- `src/` — lógica portada do app (tipos, utils, tema, dados, componentes)
- `lib/supabase/` — clients browser/server + middleware de sessão

Deploy sugerido: Vercel.
