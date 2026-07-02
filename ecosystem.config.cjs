module.exports = {
  apps: [
    {
      name: 'dosumart-api',
      cwd: './apps/backend',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3086,
      },
      max_memory_restart: '512M',
      error_file: '/home/dosumart/logs/api-error.log',
      out_file: '/home/dosumart/logs/api-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
