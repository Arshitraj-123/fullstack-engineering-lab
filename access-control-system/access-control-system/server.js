require('dotenv').config();

const createApp = require('./src/app');
const config = require('./src/config');

const app = createApp();

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Access Control System listening on http://localhost:${config.port}`);
  // eslint-disable-next-line no-console
  console.log(`Seeded admin login -> ${config.seedAdmin.email} / ${config.seedAdmin.password}`);
});
