FROM node:20-alpine

EXPOSE 3000

WORKDIR /app

RUN npm i npm@latest -g

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "run", "dev"]