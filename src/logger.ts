import { EventEmitter } from 'events';
import { publishMessage } from './data/resolvers/mutations/conversations';
import { ConversationMessages } from './db/models';

export const logger = () => {
  class MyEmitter extends EventEmitter {
    private queue = [] as any[];

    constructor() {
      super();
      // const outWrite = process.stdout.write;
      const errWrite = process.stderr.write;

      // process.stdout.write = (...args: any) => {
      //   outWrite.apply(process.stdout, args);

      //   this.body(args);

      //   return false;
      // };

      process.stderr.write = (...args: any) => {
        errWrite.apply(process.stderr, args);

        this.body(args);

        return false;
      };
    }

    private body = args => {
      const date = new Date();

      const item = {
        id: Math.random(),
        string: args[0],
        ts: date,
      };

      this.queue.push(item);

      const limit = 1000;
      if (limit && this.queue.length > limit) {
        this.queue.shift();
      }

      this.emit('write', args[0], item);
    };
  }

  const STD_OUT = new MyEmitter();

  const handler = async text => {
    const doc = { conversationId: 'iFgET4sQqQbHPfg3Z', content: `content: ${text}` };

    const messageObj = await ConversationMessages.addMessage(doc);

    publishMessage(messageObj);
  };

  STD_OUT.on('write', handler);
};
