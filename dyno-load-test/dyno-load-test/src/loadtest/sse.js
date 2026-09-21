let clients = [];

function addClient(res) {
  clients.push(res);
}

function removeClient(res) {
  clients = clients.filter((c) => c !== res);
}

function broadcast(type, payload) {
  const line = `data: ${JSON.stringify({ type, payload })}\n\n`;
  clients.forEach((res) => res.write(line));
}

module.exports = { addClient, removeClient, broadcast };
