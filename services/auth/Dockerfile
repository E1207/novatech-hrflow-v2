FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
FROM base AS development
RUN npm install
COPY . .
ENV NODE_ENV=development
USER node
EXPOSE 3001
CMD ["npm", "run", "start"]

FROM base AS staging
RUN npm install --omit=dev
COPY . .
ENV NODE_ENV=staging
USER node
EXPOSE 3001
CMD ["npm", "run", "start"]

FROM staging AS production
ENV NODE_ENV=production
EXPOSE 3001
CMD ["npm", "run", "start"]
