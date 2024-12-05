FROM node:alpine AS base

WORKDIR /build

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY . .

EXPOSE 5000

CMD [ "node", "src/index.js" ]