FROM node:22-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

RUN npm install
COPY . .

RUN npx prisma generate
EXPOSE 8000
CMD ["sh", "-c", "npx prisma db push && npm start"]
# CMD ["npm", "start"]
