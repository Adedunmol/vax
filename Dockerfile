# Base image
FROM node:alpine AS base

WORKDIR /app

COPY package*.json ./

RUN npm ci && npm cache clean --force

# Development stage
FROM base AS development

COPY . .

# Testing
FROM development AS testing

COPY --from=development . .

# RUN npm run test

# Build stage
FROM development AS build

RUN npm run build

# Production stage
FROM base AS production

COPY --from=build /app/dist /app