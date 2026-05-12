# syntax=docker/dockerfile:1.6
ARG NODE_VERSION=22-alpine

FROM node:${NODE_VERSION} AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts && \
    pnpm rebuild bcrypt protobufjs @nestjs/core grpc-tools

FROM base AS build
ARG APP
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm proto:gen && npx nest build ${APP}

FROM node:${NODE_VERSION} AS runtime
ARG APP
ENV NODE_ENV=production
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod --ignore-scripts && \
    pnpm rebuild bcrypt protobufjs @nestjs/core
COPY --from=build /app/dist ./dist
COPY --from=build /app/libs/proto/src/proto ./libs/proto/src/proto
ENV APP=${APP}
CMD ["sh", "-c", "node dist/apps/${APP}/main"]