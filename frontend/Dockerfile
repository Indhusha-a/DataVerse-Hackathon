# Multi-stage build: compile the static bundle with Node, serve it with nginx.
# nginx also reverse-proxies /api and /chat so the built app can call the
# backend and the ml-service by their compose service names, the same way
# the Vite dev server proxies them in local development.
FROM node:20-alpine AS build
WORKDIR /app
# Node's default DNS resolution tries IPv6 first, which hangs against the npm
# registry on some Docker networks and has previously made installs here time
# out around 70s (an npm "Exit handler never called" failure that silently
# truncates the install instead of failing it). Forcing IPv4 first avoids it.
ENV NODE_OPTIONS=--dns-result-order=ipv4first
COPY package.json package-lock.json ./
RUN npm config set maxsockets 3 && npm config set fetch-retries 5 && npm install
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
