FROM node:12.19-slim
WORKDIR /automations
COPY package.json yarn.lock ./
RUN yarn install --production
COPY . .
RUN yarn build && \
    chown -R node:node /automations
USER node
EXPOSE 4000
ENTRYPOINT ["node", "dist"]
