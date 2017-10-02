// This code was copied from 'meteor-random' package and a bit changed
import nodeCrypto from 'crypto';

const UNMISTAKABLE_CHARS = '23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz';
const CHARS_COUNT = 17;

const id = () => {
  var digits = [];
  for (var i = 0; i < CHARS_COUNT; i++) {
    digits[i] = choice(UNMISTAKABLE_CHARS);
  }
  return digits.join('');
};

const choice = arrayOrString => {
  var index = Math.floor(fraction() * arrayOrString.length);
  if (typeof arrayOrString === 'string') return arrayOrString.substr(index, 1);
  else return arrayOrString[index];
};

const fraction = () => {
  if (nodeCrypto) {
    var numerator = parseInt(hexString(8), 16);
    return numerator * 2.3283064365386963e-10; // 2^-32
  } else {
    throw new Error('No random generator available');
  }
};

const hexString = digits => {
  var numBytes = Math.ceil(digits / 2);
  var bytes;
  // Try to get cryptographically strong randomness. Fall back to
  // non-cryptographically strong if not available.
  try {
    bytes = nodeCrypto.randomBytes(numBytes);
  } catch (e) {
    // XXX should re-throw any error except insufficient entropy
    bytes = nodeCrypto.pseudoRandomBytes(numBytes);
  }
  var result = bytes.toString('hex');
  // If the number of digits is odd, we'll have generated an extra 4 bits
  // of randomness, so we need to trim the last digit.
  return result.substring(0, digits);
};

export default {
  id,
};
