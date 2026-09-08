FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx ng build auth-admin --configuration production

FROM nginx:alpine

COPY --from=build /app/dist/auth-admin /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
