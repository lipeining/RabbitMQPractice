const Redis = require('ioredis');
const redis = new Redis({
	port: 6379, // Redis port
	host: 'localhost', // Redis host
	family: 4, // 4 (IPv4) or 6 (IPv6)
	password: 'admin',
	db: 8
});

redis.on('connect', function() {
	console.info('Redis server is connected');
});

redis.on('error', function(err) {
	console.error('Redis connected fail.');
	console.error(err);
	process.exit(-1);
});

module.exports = redis;