FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY server ./server
EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "server/index.js"]
