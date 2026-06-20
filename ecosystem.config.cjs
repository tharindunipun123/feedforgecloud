/** PM2 process manager — run: pm2 start ecosystem.config.cjs */
module.exports = {
  apps: [
    {
      name: 'feedforge',
      cwd: __dirname,
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3005',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: '3005',
      },
    },
  ],
};
