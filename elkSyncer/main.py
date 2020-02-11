#!/usr/bin/python

import os
import subprocess
from dotenv import load_dotenv
from elasticsearch import Elasticsearch

load_dotenv()

MONGO_URL = os.getenv('MONGO_URL')
ELASTICSEARCH_URL = os.getenv('ELASTICSEARCH_URL')

client = Elasticsearch([ELASTICSEARCH_URL])

customer_mapping = {
    'primaryEmail': {
        'type': 'text',
        'analyzer': 'uax_url_email_analyzer',
    },
    'integrationId': {
        'type': 'keyword',
    },
    'scopeBrandIds': {
        'type': 'keyword',
    },
    'ownerId': {
        'type': 'keyword',
    },
    'position': {
        'type': 'keyword',
    },
    'leadStatus': {
        'type': 'keyword',
    },
    'lifecycleState': {
        'type': 'keyword',
    },
    'tagIds': {
        'type': 'keyword',
    },
    'companyIds': {
        'type': 'keyword',
    },
    'mergedIds': {
        'type': 'keyword',
    },
    'status': {
        'type': 'keyword',
    },
}

company_mapping = {
    'primaryEmail': {
        'type': 'text',
        'analyzer': 'uax_url_email_analyzer',
    },
    'scopeBrandIds': {
        'type': 'keyword',
    },
    'plan': {
        'type': 'keyword',
    },
    'industry': {
        'type': 'keyword',
    },
    'parentCompanyId': {
        'type': 'keyword',
    },
    'ownerId': {
        'type': 'keyword',
    },
    'leadStatus': {
        'type': 'keyword',
    },
    'lifecycleState': {
        'type': 'keyword',
    },
    'tagIds': {
        'type': 'keyword',
    },
    'mergedIds': {
        'type': 'keyword',
    },
    'status': {
        'type': 'keyword',
    },
    'businessType': {
        'type': 'keyword',
    },
}

try:
    response = client.indices.exists(index='customers')

    print('Create customers index', response)

    if response == False:
        analysis = {
            'analyzer': {
                'uax_url_email_analyzer': {
                    'tokenizer': 'uax_url_email_tokenizer',
                },
            },
            'tokenizer': {
                'uax_url_email_tokenizer': {
                    'type': 'uax_url_email',
                },
            },
        }

        customers_response = client.indices.create(index='customers', body={ 'settings': { 'analysis': analysis } })
        companies_response = client.indices.create(index='companies', body={ 'settings': { 'analysis': analysis } })

        print('Customers response', customers_response)
        print('Companies response', companies_response)
except Exception as e:
    print(e)

try:
    response = client.indices.put_mapping(index='customers', body = { 'properties': customer_mapping })
    companies_response = client.indices.put_mapping(index='companies', body={ 'properties': company_mapping })

    print(response)
    print(companies_response)
except Exception as e:
    print(e)

command = 'mongo-connector -m %s  -c mongo-connector-config.json --target-url %s' % (MONGO_URL, ELASTICSEARCH_URL)

print('Starting connector ....', command)

process = subprocess.Popen(command, shell=True)

process.wait()

print('End connector')