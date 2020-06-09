module.exports = {
  apps : [
      {
        name: "erxes-cron",
        script: "./dist/cronJobs/index.js",
        watch: true,
        kill_timeout: 300000, // 5 min
        env: {
            "PORT": 3600,
            "NODE_ENV": "development",
            "DEBUG": "erxes-crons:*",
            "PROCESS_NAME": "crons"
        },
      }
  ]
}