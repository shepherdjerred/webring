VERSION 0.8
FROM node:lts
WORKDIR /workspace

deps:
  COPY package.json package-lock.json .
  RUN npm ci

lint:
  FROM +deps
  COPY --dir src eslint.config.js tsconfig.json .
  RUN npm run lint

build:
  FROM +deps
  COPY --dir src tsconfig.json .
  RUN npm run build
  SAVE ARTIFACT dist

test:
  FROM +build
  COPY example example
  WORKDIR example
  RUN npm ci
  RUN npm run build

ci:
  BUILD +lint
  BUILD +build
  BUILD +test
