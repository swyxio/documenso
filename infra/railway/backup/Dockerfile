FROM node:24-alpine3.23
RUN apk add --no-cache postgresql18-client
WORKDIR /backup
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY backup.mjs ./
USER node
CMD ["node", "backup.mjs"]
