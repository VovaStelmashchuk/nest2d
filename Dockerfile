ARG NODE_VERSION=20.18.0

FROM node:${NODE_VERSION}-slim as base

ARG PORT=3000
ARG GIT_COMMIT_SHA

WORKDIR /src

FROM base as build

COPY --link package.json package-lock.json .
RUN npm install

COPY --link . .

RUN npm run build

FROM base

ENV PORT=$PORT
ENV NODE_ENV=production
ENV NUXT_PUBLIC_GIT_COMMIT_SHA=$GIT_COMMIT_SHA

COPY --from=build /src/.output /src/.output

CMD [ "node", ".output/server/index.mjs" ]

