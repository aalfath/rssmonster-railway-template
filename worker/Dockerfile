# RSSMonster v2.3.0 crawl worker (same upstream image as the web service).
FROM rssmonster/rssmonster:sha-e6ad401@sha256:cbd8f34d81a5ec57d069fdb39897c1059b242fdcec16f41a5e17a70bb35cb5c0

WORKDIR /app/server

COPY --chown=rssmonster:rssmonster railway-worker.sh ./

CMD ["sh", "/app/server/railway-worker.sh"]
