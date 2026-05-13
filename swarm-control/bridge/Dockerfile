FROM node:22-slim

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --omit=dev
COPY index.js ./

EXPOSE 18789
CMD ["node", "index.js"]
