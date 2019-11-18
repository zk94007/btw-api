FROM node:8.12-alpine
WORKDIR /var/app
COPY . .
EXPOSE 3000
RUN apk add python g++ make --no-cache
RUN npm install
CMD ["npm", "start"]
