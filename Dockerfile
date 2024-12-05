# Build stage
FROM node:alpine AS build

WORKDIR /build

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Production stage
FROM node:alpine AS production

WORKDIR /build

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /build/dist ./dist

EXPOSE 5000

CMD [ "node", "dist/index.js" ]