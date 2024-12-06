# Base image
FROM node:alpine AS base

WORKDIR /app

COPY package*.json ./

RUN npm ci && npm cache clean --force

# Development stage
FROM base AS development

COPY . .

# Build stage
FROM development AS build

RUN npm run build

# Production stage
FROM base AS production

COPY --from=build /app/dist /app