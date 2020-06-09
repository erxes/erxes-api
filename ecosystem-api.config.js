module.exports = {
  apps : [
      {
        name: "erxes-api",
        script: "./dist/index.js",
        watch: true,
        kill_timeout: 300000, // 5 min
        env: {
            "PORT": 3300,
            "NODE_ENV": "development",
            "DEBUG": "erxes-api:*"
        },
      }
  ]
}