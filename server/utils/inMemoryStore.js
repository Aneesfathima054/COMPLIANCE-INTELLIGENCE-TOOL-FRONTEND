const { randomUUID } = require("crypto");

const inMemoryStore = {
  users: [],
  complaints: []
};

const createId = () => randomUUID();

const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }

  const { password, ...safeUser } = user;
  return safeUser;
};

module.exports = {
  inMemoryStore,
  createId,
  sanitizeUser
};
