FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "start"]

FROM development AS build
# URL du Gateway injectée au build (les variables REACT_APP_* sont figées
# dans le bundle par react-scripts, impossible de les changer après coup
# via une variable d'environnement de la Container App).
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
RUN npm run build

FROM nginx:1.27-alpine AS staging
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
ENV NODE_ENV=staging
EXPOSE 80

FROM staging AS production
ENV NODE_ENV=production
EXPOSE 80
