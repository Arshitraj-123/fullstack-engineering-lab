const createApp = require('./src/app');
const config = require('./src/config');

const app = createApp();

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Parcel Depot API listening on http://localhost:${config.port}`);
});
