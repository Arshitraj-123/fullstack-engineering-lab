const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');
const config = require('../config');

/**
 * In-memory user "table". Passwords are never stored or returned in
 * plaintext — only bcrypt hashes live here, and toPublic() strips even
 * that before a user object ever reaches a response body.
 */

let users = [];

function seed() {
  const passwordHash = bcrypt.hashSync(config.seedAdmin.password, config.bcrypt.saltRounds);
  users = [
    {
      id: randomUUID(),
      name: config.seedAdmin.name,
      email: config.seedAdmin.email.toLowerCase(),
      passwordHash,
      role: 'admin',
      createdAt: new Date().toISOString(),
    },
  ];
}

seed();

function findAll() {
  return users;
}

function findByEmail(email) {
  return users.find((user) => user.email === email.toLowerCase());
}

function findById(id) {
  return users.find((user) => user.id === id);
}

function create({ name, email, passwordHash, role = 'user' }) {
  const user = {
    id: randomUUID(),
    name,
    email: email.toLowerCase(),
    passwordHash,
    role,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  return user;
}

/** Strips the password hash before a user is ever sent to a client. */
function toPublic(user) {
  const { passwordHash, ...publicUser } = user; // eslint-disable-line no-unused-vars
  return publicUser;
}

function reset() {
  seed();
}

module.exports = { findAll, findByEmail, findById, create, toPublic, reset };
