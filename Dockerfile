FROM erxes/runner:latest
WORKDIR /erxes-api/
RUN chown -R node:node /erxes-api
COPY --chown=node:node package.json /erxes-api/package.json
COPY --chown=node:node .* /erxes-api/
RUN yarn install
COPY --chown=node:node . /erxes-api
RUN yarn build
USER node
EXPOSE 3300
ENTRYPOINT [ "node", "--max_old_space_size=8192", "dist" ]
