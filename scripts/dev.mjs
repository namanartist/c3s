import net from 'node:net';
import { spawn } from 'node:child_process';

const API_PORT = process.env.API_PORT || 3001;
const childProcesses = [];

function isPortInUse(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    let settled = false;
    const finish = (inUse) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(inUse);
    };

    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    socket.setTimeout(500, () => finish(false));
  });
}

async function waitForPort(port, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isPortInUse(port)) return true;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return false;
}

function startProcess(command, args) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: false,
    windowsHide: true,
  });
  childProcesses.push(child);
  return child;
}

function stopChildren() {
  for (const child of childProcesses) {
    if (!child.killed) {
      try {
        child.kill();
      } catch {
        // process may have already exited
      }
    }
  }
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    stopChildren();
    process.exit(0);
  });
}

const apiAlreadyRunning = await isPortInUse(API_PORT);
if (apiAlreadyRunning) {
  console.log(`API service connected on http://localhost:${API_PORT}`);
} else {
  startProcess(process.execPath, ['dev-api-server.js']);
  if (!(await waitForPort(API_PORT))) {
    console.warn(`The API service did not start on port ${API_PORT}. Check MONGO_URL and the API logs.`);
  } else {
    console.log(`API service started successfully on http://localhost:${API_PORT}`);
  }
}

// Directly invoke vite binary with node executable to avoid shell: true DEP0190 warning on Node 22+
const viteBin = './node_modules/vite/bin/vite.js';
const vite = startProcess(process.execPath, [viteBin]);
vite.once('exit', (code) => {
  stopChildren();
  process.exit(code ?? 0);
});

