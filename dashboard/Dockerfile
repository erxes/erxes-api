FROM node:12.16-slim
WORKDIR /dashboard-api
RUN chown -R node:node /dashboard-api
COPY --chown=node:node . /dashboard-api
USER node
EXPOSE 4300
ENTRYPOINT ["node", "--max_old_space_size=8192", "index.js"]
