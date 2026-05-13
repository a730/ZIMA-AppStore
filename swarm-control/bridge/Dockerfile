FROM node:22-slim

WORKDIR /app

COPY package.json tsconfig.json ./
RUN npm install

COPY src/ ./src/

EXPOSE 18789

CMD ["node", "--import", "tsx", "src/index.ts"]
