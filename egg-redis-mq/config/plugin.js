'use strict';

/** @type Egg.EggPlugin */
module.exports = {
    // had enabled by egg
    // static: {
    //   enable: true,
    // }
    rabbot: {
        enable: true,
        package: 'egg-rabbot',
    },
    redis: {
        enable: true,
        package: 'egg-redis',
    },
    kafkaNode: {
        enable: true,
        package: 'egg-kafka-node',
    },
};