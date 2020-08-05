import * as dotenv from 'dotenv';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { PubSub } from 'graphql-subscriptions';
import * as Redis from 'ioredis';
import { redisOptions } from './inmemoryStorage';

// load environment variables
dotenv.config();

const createPubsubInstance = () => {
  if (redisOptions.host) {
    return new RedisPubSub({
      connectionListener: error => {
        if (error) {
          console.error(error);
        }
      },
      publisher: new Redis(redisOptions),
      subscriber: new Redis(redisOptions),
    });
  }

  return new PubSub();
};

export const graphqlPubsub = createPubsubInstance();
