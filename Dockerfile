FROM node
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package*.json ./
RUN npm install
COPY --chown=node:node src .
EXPOSE 9130
WORKDIR /home/node/app/src

CMD [ "node", "app.js" ]
USER node