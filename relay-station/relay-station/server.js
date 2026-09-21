const config = require('./src/config');
const createDispatcherApp = require('./src/dispatcher/app');
const createReceiverApp = require('./src/receiver/app');

const dispatcherApp = createDispatcherApp();
const receiverApp = createReceiverApp();

dispatcherApp.listen(config.dispatcherPort, () => {
  // eslint-disable-next-line no-console
  console.log(`Dispatcher (event source)   -> http://localhost:${config.dispatcherPort}`);
});

receiverApp.listen(config.receiverPort, () => {
  // eslint-disable-next-line no-console
  console.log(`Receiver (webhook consumer) -> http://localhost:${config.receiverPort}`);
  // eslint-disable-next-line no-console
  console.log('\nOpen the dispatcher URL above in your browser for the control room UI.');
});
