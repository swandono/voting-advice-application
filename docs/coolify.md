# Deploying with Coolify

This repo ships with a production `docker-compose.yml` that’s designed to work well with Coolify (no AWS required).

## 1) Create the resource in Coolify

1. In Coolify, create a new **Docker Compose** resource.
2. Connect it to your Git repository.
3. Use the repo’s `docker-compose.yml`.

Coolify will let you attach domains and HTTPS to the `frontend` and `strapi` services.

## 2) Attach domains (recommended)

- `frontend` → `app.yourdomain.com` (port `3000`)
- `strapi` → `api.yourdomain.com` (port `1337`)

## 3) Required environment variables

Set these in Coolify (recommended) or provide them in an `.env` file.

### Database

```dotenv
DATABASE_NAME=vaa
DATABASE_USERNAME=vaa
DATABASE_PASSWORD=change_me
DATABASE_SCHEMA=public
DATABASE_SSL_SELF=false
```

### Strapi secrets

```dotenv
APP_KEYS=key1,key2
API_TOKEN_SALT=change_me
ADMIN_JWT_SECRET=change_me
JWT_SECRET=change_me
```

### Public URLs

```dotenv
PUBLIC_BROWSER_FRONTEND_URL=https://app.yourdomain.com
PUBLIC_BROWSER_BACKEND_URL=https://api.yourdomain.com

PUBLIC_SERVER_FRONTEND_URL=https://app.yourdomain.com
PUBLIC_SERVER_BACKEND_URL=https://api.yourdomain.com
```

## 4) No-AWS defaults (uploads + email)

By default, `docker-compose.yml` sets:

- `UPLOAD_PROVIDER=local` (stores uploads in a Docker volume)
- `EMAIL_PROVIDER=smtp` (uses SMTP if configured)

### Local uploads persistence

Uploads are persisted in the `strapi-uploads` volume. Keep that volume when redeploying.

### SMTP email (optional)

If you want emails to work, set:

```dotenv
MAIL_FROM=no-reply@yourdomain.com
MAIL_REPLY_TO=contact@yourdomain.com

SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_user
SMTP_PASS=your_pass
```

If you don’t set `SMTP_HOST`, the email plugin configuration is not enabled.

## 5) First run

1. Deploy the stack in Coolify.
2. Open `https://api.yourdomain.com/admin` and create the first Strapi admin user.

