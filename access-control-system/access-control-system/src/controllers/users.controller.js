const usersStore = require('../data/usersStore');

function listUsers(req, res) {
  const users = usersStore.findAll().map(usersStore.toPublic);
  res.status(200).json({ data: users, count: users.length });
}

module.exports = { listUsers };
