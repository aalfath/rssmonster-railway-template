# RSSMonster v2.3.0 (upstream commit e6ad401). Upstream publishes no version tags on
# Docker Hub, only latest and sha-<commit>; sha-e6ad401 is the image built from the v2.3.0 tag.
FROM rssmonster/rssmonster:sha-e6ad401@sha256:cbd8f34d81a5ec57d069fdb39897c1059b242fdcec16f41a5e17a70bb35cb5c0

WORKDIR /app/server

COPY --chown=rssmonster:rssmonster railway-start.sh railway-prepare.mjs ./
COPY --chown=rssmonster:rssmonster railwayRegistrationGate.js ./middleware/railwayRegistrationGate.js

# Close public sign-up unless ALLOW_REGISTRATION=true (upstream has no switch and makes
# the first account the admin). Fail the build if upstream changed the route.
RUN sed -i "1i import railwayRegistrationGate from '../middleware/railwayRegistrationGate.js';" routes/auth.js \
 && sed -i "s#router.post('/register', userMiddleware.validateRegister,#router.post('/register', railwayRegistrationGate, userMiddleware.validateRegister,#" routes/auth.js \
 && grep -q "railwayRegistrationGate, userMiddleware.validateRegister" routes/auth.js \
 && chmod +x railway-start.sh

CMD ["sh", "/app/server/railway-start.sh"]
