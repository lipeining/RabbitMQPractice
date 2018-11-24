const Redis = require('redis');
const redisClient = Redis.createClient({ password: 'admin', db: 8 });
module.exports = redisClient;