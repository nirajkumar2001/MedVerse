FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx ng build healthcare-app --configuration production --base-href /healthcare/
RUN npx ng build learning-app --configuration production --base-href /learning/
RUN npx ng build auth-admin --configuration production --base-href /admin/

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/healthcare-app/browser /usr/share/nginx/html/healthcare
COPY --from=build /app/dist/learning-app/browser /usr/share/nginx/html/learning
COPY --from=build /app/dist/auth-admin/browser /usr/share/nginx/html/admin

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
