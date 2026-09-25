# Анкета опитування особового складу

Веб-анкета (59 питань, 9 розділів) з обов'язковим входом, автозбереженням кожної
відповіді та адмін-панеллю для перегляду відповідей і метаданих респондентів.

**Стек:** Next.js 16 (App Router) · PostgreSQL · Better Auth · Tailwind CSS.

## Локальний запуск

```bash
npm install
cp .env.example .env.local        # заповніть DATABASE_URL та BETTER_AUTH_SECRET
npm run db:setup                  # створює таблиці
npm run dev                       # http://localhost:3000
```

`BETTER_AUTH_SECRET` — випадковий рядок:
`node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`

### Локальна база (Docker)

```bash
docker run -d --name survey-pg -e POSTGRES_PASSWORD=devpass -e POSTGRES_DB=survey -p 54329:5432 postgres:17-alpine
# DATABASE_URL=postgres://postgres:devpass@localhost:54329/survey
```

## Призначення адміністратора

Роль `admin` не видається через сайт — лише вручну. Спочатку зареєструйтесь на сайті,
потім:

```bash
npm run db:setup -- your@email.com
```

## Google-вхід (необовʼязково)

1. [Google Cloud Console](https://console.cloud.google.com/) → створіть проєкт.
2. **APIs & Services → OAuth consent screen** → тип *External*, заповніть назву/пошту.
3. **Credentials → Create credentials → OAuth client ID** → *Web application*.
4. **Authorized redirect URIs** додайте:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://ВАШ-ДОМЕН/api/auth/callback/google`
5. Отриманий **Client ID** і **Client secret** → у `.env.local` (`GOOGLE_CLIENT_ID`,
   `GOOGLE_CLIENT_SECRET`). Кнопка Google зʼявиться автоматично.

## Безкоштовний деплой (Vercel + Supabase)

1. **Supabase** → New project. У *Project Settings → Database*:
   - *Connection pooling* (Transaction, порт `6543`) → рядок у `DATABASE_URL`.
   - *SSL Configuration* → завантажте сертифікат → його вміст у `DATABASE_CA_CERT`.
2. **Vercel** → Import репозиторію. У *Environment Variables* додайте всі змінні з
   `.env.example` (`BETTER_AUTH_URL` = адреса вашого домену на Vercel).
3. Після першого деплою один раз локально виконайте `npm run db:setup` з
   *production* `DATABASE_URL`, щоб створити таблиці, і призначте адміністратора.

## Що збирається про респондента

IP (перший і останній), країна/місто (з заголовків Vercel), User-Agent,
мова браузера, часовий пояс, роздільна здатність, платформа, наявність сенсора,
час початку / оновлення / надсилання. Видно лише адміністратору.
