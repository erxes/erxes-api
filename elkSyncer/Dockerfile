FROM python:3

WORKDIR /usr/src/app

RUN pip install mongo-connector \
    && pip install elasticsearch \
    && pip install elastic2-doc-manager \
    && pip install python-dotenv

COPY . .

# CMD ["python", "main.py"]
CMD ["bash"]
