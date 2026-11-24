[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/new/template/rssmonster?utm_medium=integration&utm_source=button&utm_campaign=rssmonster)

# RSSMonster on Railway

One-click Railway template for [RSSMonster](https://github.com/pietheinstrengholt/rssmonster), a self-hosted multi-user RSS reader with smart folders, search, rules, OPML and Fever / Google Reader API sync.

**Version:** RSSMonster v2.3.0, image `rssmonster/rssmonster:sha-e6ad401@sha256:cbd8f34d81a5ec57d069fdb39897c1059b242fdcec16f41a5e17a70bb35cb5c0` (upstream publishes no version tags; `sha-e6ad401` is the image built from the `v2.3.0` tag).

## What it deploys

| Service | Source | What it does |
|---|---|---|
| **RSSMonster** | `app/` in this repo | Web app and API on port 8080, public domain, health check `/api/health`. On every start it waits for MySQL, runs migrations under a MySQL lock, and on first boot creates the admin account. |
| **Worker** | `worker/` in this repo | Crawl worker: waits for the web service to be healthy, then fetches due feeds every 60 s. |
| **MySQL** | Railway MySQL 8 | All data (users, feeds, articles, settings) on a Railway volume. InnoDB buffer pool 128 MB. |

## After deploy

1. Open the **RSSMonster** service → **Variables** and copy `ADMIN_PASSWORD`.
2. Open the public URL and sign in as `admin` (or the `ADMIN_USERNAME` you set).
3. Add feeds, or import an OPML file. Change the password in the app if you like (changing the variable later has no effect).

Public sign-up is **closed**: upstream makes the first registered account the admin and has no switch to close sign-up, so this template creates the admin on first boot and blocks `/api/auth/register` unless you set `ALLOW_REGISTRATION=true` on the RSSMonster service (new accounts are then regular users).

## Variables

| Variable (service) | Default | Notes |
|---|---|---|
| `ADMIN_USERNAME` (RSSMonster) | `admin` | Used only on first boot, when the database has no user. |
| `ADMIN_PASSWORD` (RSSMonster) | generated, 24 chars | First-boot admin password. |
| `ALLOW_REGISTRATION` (RSSMonster) | `false` | `true` opens sign-up for regular accounts. |
| `JWT_SECRET`, `FEVER_CREDENTIAL_SECRET` (RSSMonster) | generated | Session and API-credential secrets. Changing them logs everyone out and breaks Fever API keys. |
| `PORT` (RSSMonster) | `8080` | |
| `DB_*` (both) | references to `MySQL` | |
| `APP_HEALTH_URL` (Worker) | private URL of the web service | The worker waits for it before crawling. |

Optional upstream features that are off: local AI inference (needs several GB of RAM), email (SMTP) and web push. See the [upstream docs](https://pietheinstrengholt.github.io/rssmonster/).

## Resources

Fits Railway's Free plan (0.5 GB RAM per service). Measured on Railway at a 0.5 GB / 1 vCPU limit: app about 110 MB, worker about 55 MB, MySQL about 245 MB. Node's heap is sized from the service's memory limit. An unexpected stop exits non-zero, so Railway's on-failure restart policy restarts it.

## Updates

This template builds from this repo. When a new RSSMonster release comes out, the pinned image in `app/Dockerfile` and `worker/Dockerfile` is bumped and the change is described in [CHANGELOG.md](CHANGELOG.md). Railway then shows deployers an "update available" notice; migrations run automatically when the new version starts. Read the changelog first: breaking changes are listed at the top of each entry.
