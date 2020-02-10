FROM python:3

WORKDIR /usr/src/app

RUN pip install mongo-connector \
    && pip install elasticsearch \
    && pip install elastic2-doc-manager

COPY . .

CMD ["bash", "./start.sh"]
