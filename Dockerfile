FROM erxes/runner:latest
WORKDIR /erxes-api/
COPY . /erxes-api
EXPOSE 4300
ENTRYPOINT [ "node", "--max_old_space_size=8192", "dist" ]
