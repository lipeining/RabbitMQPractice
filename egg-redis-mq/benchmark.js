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
        // console.log(result);
        reporter.buildReport(result); // the html structure
        const reportOutputPath = path.join(__dirname, 'optimisticLockTest.html');
        reporter.writeReport(result, reportOutputPath, (err, res) => {
            if (err) console.err('Error writting report: ', err);
            else console.log('Report written to: ', reportOutputPath);
        });
    });
}

function exclusiveLockTest() {
    autocannon(Object.assign(options, { url: 'http://localhost:7001/exclusive-lock' }), (err, result) => {
        // console.log(result);
        reporter.buildReport(result); // the html structure
        const reportOutputPath = path.join(__dirname, 'exclusiveLockTest.html');
        reporter.writeReport(result, reportOutputPath, (err, res) => {
            if (err) console.err('Error writting report: ', err);
            else console.log('Report written to: ', reportOutputPath);
        });
    });
}

// optimisticLockTest();
exclusiveLockTest();