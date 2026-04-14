module.exports = {
  apps: [{
    name: 'ribasta',
    script: 'node_modules/.bin/next',
    args: 'start -p 3015',
    cwd: '/var/www/ribasta',
    env: {
      NODE_ENV: 'production',
      PORT: 3015,
    },
  }],
};
