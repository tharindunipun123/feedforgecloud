/** PM2 process manager — run: pm2 start ecosystem.config.cjs --update-env */
const fs = require('fs');
const path = require('path');

function loadEnvFile(filename) {
  const env = {};
  const filePath = path.join(__dirname, filename);
  if (!fs.existsSync(filePath)) return env;

  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

module.exports = {
  apps: [
    {
      name: 'feedforge',
      cwd: __dirname,
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3005',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: '3005',
        ...loadEnvFile('.env.local'),
      },
    },
  ],
};
