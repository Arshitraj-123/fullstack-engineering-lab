const config = require('./src/config');
const createTargetApp = require('./src/target/app');
const createControlApp = require('./src/loadtest/app');

const targetApp = createTargetApp();
const controlApp = createControlApp();

targetApp.listen(config.targetPort, () => {
  // eslint-disable-next-line no-console
  console.log(`Target app (system under test) -> http://localhost:${config.targetPort}`);
});

controlApp.listen(config.controlPort, () => {
  // eslint-disable-next-line no-console
  console.log(`Test cell control room       -> http://localhost:${config.controlPort}`);
  // eslint-disable-next-line no-console
  console.log('\nOpen the control room URL above in your browser.');
});
