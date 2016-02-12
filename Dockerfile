FROM node:5

ADD ./package.json /app/package.json

WORKDIR /app

RUN npm install reef-client --registry=http://npm.line64.com
RUN npm install

ENV NODE_ENV=production

ADD ./dist /app/dist

CMD [ "node", "dist/index.js" ]
