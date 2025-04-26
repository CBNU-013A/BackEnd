FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install
#npm install dotenv --save       
#npm install express --save
#npm install mongoose --save
#npm install cors --save 
COPY . .

EXPOSE 8001
CMD ["node", "app.js"]