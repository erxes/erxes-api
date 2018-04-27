FROM node:6-onbuild
RUN mkdir -p /usr/src/erxes-app-api
WORKDIR /usr/src/erxes-app-api
COPY package.json /usr/src/erxes-app-api/
RUN yarn install
COPY ../ /usr/src/erxes-app-api
RUN yarn remove bcrypt
RUN yarn add bcrypt
EXPOSE 3300
CMD ["yarn", "dev"]
