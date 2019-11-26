import * as faker from 'faker';
import utils, { checkFile, validSearchText } from '../data/utils';

describe('test utils', () => {
  test('test readFile', async () => {
    const data = await utils.readFile('notification');

    expect(data).toBeDefined();
  });
});

describe('Check file', () => {
  test('Check file success', async () => {
    const file: any = {
      path: 'src/__tests__/files/normal.jpeg',
      size: 7800000,
    };

    const response = await checkFile(file);

    expect(response).toBe('ok');
  });

  test('Check file Error (Invalid file)', async () => {
    try {
      await checkFile(null);
    } catch (e) {
      expect(e.message).toBe('Invalid file');
    }
  });

  test('Check file Error (Too large file)', async () => {
    try {
      const file = {
        size: 20000001,
      };

      await checkFile(file);
    } catch (e) {
      expect(e.message).toBe('Too large file');
    }
  });

  test('Check file Error (Invalid file no magic number)', async () => {
    try {
      const file: any = {
        path: 'src/__tests__/files/invalid-magic-number.html',
        size: 88,
      };

      await checkFile(file);
    } catch (e) {
      expect(e.message).toBe('Invalid file');
    }
  });

  test('Check file Error (Invalid file type)', async () => {
    const file: any = {
      path: 'src/__tests__/files/invalid-file-type.gif',
      size: 363021,
    };

    try {
      await checkFile(file);
    } catch (e) {
      expect(e.message).toBe('Invalid file');
    }
  });

  test('Valid search text', async () => {
    const shortArray = [faker.random.word()];

    let response = validSearchText(shortArray);

    expect(response).toBe(shortArray.join(' '));

    const longArray = new Array(50).fill('0123456789');

    response = validSearchText(longArray);

    expect(response).toBe(longArray.join(' ').substring(0, 511));
  });
});
