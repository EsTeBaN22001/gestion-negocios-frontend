# Etapa 1: Build de Angular
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

# Etapa 2: Servidor Web Nginx
FROM nginx:alpine
COPY --from=build /app/dist/gestion-negocios/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
