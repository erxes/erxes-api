FROM erxes/erxes-api:base-12.19.0-slim
WORKDIR /erxes-api
COPY --chown=node:node . /erxes-api
RUN yarn install --production && \
    yarn build && \
    chown -R node:node /erxes-api
USER node
EXPOSE 3300
ENTRYPOINT [ "node", "--max_old_space_size=8192", "dist" ]
