FROM ghcr.io/puppeteer/puppeteer:24.6.0

WORKDIR /app

# Puppeteer image runs as pptruser (non-root)
COPY --chown=pptruser:pptruser package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY --chown=pptruser:pptruser . .

ENV PORT=10000
EXPOSE 10000

CMD ["node", "server.js"]
