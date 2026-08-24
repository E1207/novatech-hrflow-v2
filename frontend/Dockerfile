FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "start"]

FROM development AS build
RUN npm run build

FROM nginx:1.27-alpine AS staging
COPY --from=build /app/build /usr/share/nginx/html
ENV NODE_ENV=staging
EXPOSE 80

FROM staging AS production
ENV NODE_ENV=production
EXPOSE 80
