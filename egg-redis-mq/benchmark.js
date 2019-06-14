'use strict'

const autocannon = require('autocannon');
// const _ = require('lodash');
const reporter = require('autocannon-reporter');
const path = require('path');
const options = {
    title: 'redis-mq',
    url: 'http://localhost:7001/',
    method: 'GET',
    connections: 50, //default
    pipelining: 1, // default
    duration: 10, // default
    timeout: 20,
}
// 首先，手动启动后台服务
// 其次，初始化对应的counter
// 最后，运行node benchmark.js
// async/await
function optimisticLockTest() {
    autocannon(Object.assign(options, { url: 'http://localhost:7001/optimistic-lock' }), (err, result) => {
        console.log(result);
        result = reporter.buildReport(result); // the html structure
        const reportOutputPath = path.join(__dirname, 'optimisticLockTest.html');
        reporter.writeReport(result, reportOutputPath, (err, res) => {
            if (err) console.err('Error writting report: ', err);
            else console.log('Report written to: ', reportOutputPath);
        });
    });
}

function exclusiveLockTest({ version = '' }) {
    const uri = ['exclusive', 'lock', version].filter(item => { return Boolean(item) }).join('-');
    autocannon(Object.assign(options, { url: `http://localhost:7001/${uri}` }), (err, result) => {
        console.log(result);
        result = reporter.buildReport(result); // the html structure
        const reportOutputPath = path.join(__dirname, `${uri}.html`);
        reporter.writeReport(result, reportOutputPath, (err, res) => {
            if (err) console.err('Error writting report: ', err);
            else console.log('Report written to: ', reportOutputPath);
        });
    });
}

optimisticLockTest();
// exclusiveLockTest({ version: '' });
// exclusiveLockTest({ version: 'v2' });


// exclusive-lock
// {
//     title: 'redis-mq',
//     url: 'http://localhost:7001/exclusive-lock',
//     socketPath: undefined,
//     requests: {
//         average: 790,
//         mean: 790,
//         stddev: 135.32,
//         min: 572,
//         max: 997,
//         total: 7900,
//         p0_001: 572,
//         p0_01: 572,
//         p0_1: 572,
//         p1: 572,
//         p2_5: 572,
//         p10: 572,
//         p25: 674,
//         p50: 807,
//         p75: 857,
//         p90: 977,
//         p97_5: 997,
//         p99: 997,
//         p99_9: 997,
//         p99_99: 997,
//         p99_999: 997,
//         sent: 7950
//     },
//     latency: {
//         average: 60.04,
//         mean: 60.04,
//         stddev: 229.18,
//         min: 0,
//         max: 2787.4674880000002,
//         p0_001: 0,
//         p0_01: 0,
//         p0_1: 0,
//         p1: 0,
//         p2_5: 0,
//         p10: 0,
//         p25: 0,
//         p50: 1,
//         p75: 1,
//         p90: 67,
//         p97_5: 776,
//         p99: 1218,
//         p99_9: 2143,
//         p99_99: 2787,
//         p99_999: 2787
//     },
//     throughput: {
//         average: 310041.6,
//         mean: 310041.6,
//         stddev: 53000.97,
//         min: 224663,
//         max: 391011,
//         total: 3100152,
//         p0_001: 224767,
//         p0_01: 224767,
//         p0_1: 224767,
//         p1: 224767,
//         p2_5: 224767,
//         p10: 224767,
//         p25: 264703,
//         p50: 316927,
//         p75: 336383,
//         p90: 383487,
//         p97_5: 391167,
//         p99: 391167,
//         p99_9: 391167,
//         p99_99: 391167,
//         p99_999: 391167
//     },
//     errors: 0,
//     timeouts: 0,
//     duration: 10.04,
//     start: 2019 - 06 - 14 T01: 46: 34.889 Z,
//     finish: 2019 - 06 - 14 T01: 46: 44.928 Z,
//     connections: 50,
//     pipelining: 1,
//     non2xx: 0,
//     '1xx': 0,
//     '2xx': 7900,
//     '3xx': 0,
//     '4xx': 0,
//     '5xx': 0
// }


// exclusive-lock-v2
// {
//     title: 'redis-mq',
//     url: 'http://localhost:7001/exclusive-lock-v2',
//     socketPath: undefined,
//     requests: {
//         average: 3209.6,
//         mean: 3209.6,
//         stddev: 984.35,
//         min: 1495,
//         max: 4534,
//         total: 32092,
//         p0_001: 1495,
//         p0_01: 1495,
//         p0_1: 1495,
//         p1: 1495,
//         p2_5: 1495,
//         p10: 1495,
//         p25: 2159,
//         p50: 3219,
//         p75: 4095,
//         p90: 4215,
//         p97_5: 4535,
//         p99: 4535,
//         p99_9: 4535,
//         p99_99: 4535,
//         p99_999: 4535,
//         sent: 32142
//     },
//     latency: {
//         average: 14.9,
//         mean: 14.9,
//         stddev: 35.46,
//         min: 0,
//         max: 1313.0164009999999,
//         p0_001: 0,
//         p0_01: 0,
//         p0_1: 0,
//         p1: 1,
//         p2_5: 2,
//         p10: 6,
//         p25: 8,
//         p50: 11,
//         p75: 14,
//         p90: 22,
//         p97_5: 50,
//         p99: 69,
//         p99_9: 664,
//         p99_99: 1099,
//         p99_999: 1313
//     },
//     throughput: {
//         average: 1267225.61,
//         mean: 1267225.61,
//         stddev: 388217.19,
//         min: 591066,
//         max: 1788597,
//         total: 12672281,
//         p0_001: 591359,
//         p0_01: 591359,
//         p0_1: 591359,
//         p1: 591359,
//         p2_5: 591359,
//         p10: 591359,
//         p25: 853503,
//         p50: 1270783,
//         p75: 1616895,
//         p90: 1663999,
//         p97_5: 1788927,
//         p99: 1788927,
//         p99_9: 1788927,
//         p99_99: 1788927,
//         p99_999: 1788927
//     },
//     errors: 0,
//     timeouts: 0,
//     duration: 10.04,
//     start: 2019 - 06 - 14 T01: 48: 30.358 Z,
//     finish: 2019 - 06 - 14 T01: 48: 40.401 Z,
//     connections: 50,
//     pipelining: 1,
//     non2xx: 0,
//     '1xx': 0,
//     '2xx': 32092,
//     '3xx': 0,
//     '4xx': 0,
//     '5xx': 0
// }