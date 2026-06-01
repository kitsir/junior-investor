FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY server ./server
ENV PORT=3001
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "server/index.js"]
