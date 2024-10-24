import { createHmac, randomBytes } from "crypto";
export const hasher = (password: string, salt: string) => {
  let hash = createHmac('sha512', salt);
  hash.update(password);
  return hash.digest('hex') + `:${salt}`;
};

export const generateSalt = (rounds: number | null) => {
  if (typeof rounds !== 'number') {
    throw new Error('rounds param must be a number');
  }
  if (rounds >= 15) {
    throw new Error(`${rounds} is greater than 15, Must be less that 15`);
  }
  return randomBytes(Math.ceil(rounds / 2)).toString('hex').slice(0, rounds);
};

export const hash = (password: string, salt: string) => {
  return hasher(password, salt);
};

export const compare = (password: string, hashed: string) => {
  const oldHash = hashed.split(':');
  const salt = oldHash[1];
  const hashedNewValue = hash(password, salt);
  return hashedNewValue === hashed;
};