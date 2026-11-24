# Deploy and Host RSSMonster on Railway

RSSMonster is a self-hosted, multi-user RSS and Atom reader with a three-pane reading view, smart folders, saved searches, tags, rule-based actions and OPML import/export. It also speaks the Fever and Google Reader APIs, so mobile apps such as Reeder or ReadKit can sync with it.

## About Hosting RSSMonster

This template runs RSSMonster v2.3.0 as three Railway services: the web app, a crawl worker that fetches your feeds every minute, and Railway MySQL for all data. On first boot the web service waits for MySQL, applies the database migrations and creates the admin account from generated variables, so nobody else can claim it. Public sign-up stays closed. After deploy, open the RSSMonster service's Variables tab, copy `ADMIN_PASSWORD`, and sign in as `admin`. Updates arrive as Railway update notices when this template's repo moves to a new upstream release; migrations run automatically on the next start.

## Common Use Cases

* A private, ad-free news and blog reader that you own, shared with family or a small team
* Syncing feeds to mobile RSS apps through the Fever or Google Reader API
* Organising many feeds with smart folders, saved searches, tags and automatic rules

## Dependencies for RSSMonster Hosting

* MySQL 8 (Railway MySQL, included) for users, feeds, articles and settings
* Outbound internet access to fetch the feeds you subscribe to

### Deployment Dependencies

* RSSMonster source and image: https://github.com/pietheinstrengholt/rssmonster (release v2.3.0, MIT)
* Template repo: https://github.com/aalfath/rssmonster-railway-template
* Documentation: https://pietheinstrengholt.github.io/rssmonster/

### Implementation Details

Services:

* **RSSMonster** (public): the web app and API on port 8080, health check `/api/health`. Runs migrations under a MySQL lock and creates the admin on first boot.
* **Worker** (private): the crawl worker. It waits until the web service is healthy, then fetches due feeds every 60 seconds.
* **MySQL** (private, volume): Railway's MySQL 8 with a 128 MB InnoDB buffer pool.

Variables you may change on the RSSMonster service: `ADMIN_USERNAME` (default `admin`, used only on first boot), `ALLOW_REGISTRATION` (`true` lets anyone with the URL create a regular account; default `false`). `JWT_SECRET`, `FEVER_CREDENTIAL_SECRET` and `ADMIN_PASSWORD` are generated. Changing `ADMIN_PASSWORD` later has no effect: change the password in the app instead.

Each service fits Railway's Free plan limit of 0.5 GB RAM (measured: app about 110 MB, worker about 55 MB, MySQL about 245 MB). The optional local AI features (upstream's inference service with Qwen and ModernBERT models and its AI worker) are left out because they need several GB of RAM; they stay switched off. Email (SMTP) and web push are optional and off by default; see upstream's docs to add them.

## Why Deploy RSSMonster on Railway?

<!-- Recommended: Keep this section as shown below -->
Railway is a singular platform to deploy your infrastructure stack. Railway will host your infrastructure so you don't have to deal with configuration, while allowing you to vertically and horizontally scale it.

By deploying RSSMonster on Railway, you are one step closer to supporting a complete full-stack application with minimal burden. Host your servers, databases, AI agents, and more on Railway.
<!-- End recommended section -->
