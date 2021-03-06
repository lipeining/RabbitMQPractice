'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
    const { router, controller } = app;
    router.get('/', controller.home.index);
    router.get('/monitor', controller.home.monitor);
    router.get('/init', controller.home.init);
    router.get('/optimistic-lock', controller.home.optimisticLock);
    router.get('/exclusive-lock', controller.home.exclusiveLock);
    router.get('/exclusive-lock-v2', controller.home.exclusiveLockV2);
    router.get('/order', controller.home.order);

    // rabbitmq
    router.get('/mq-init', controller.mq.init);
    router.get('/mq-monitor', controller.mq.monitor);
    router.get('/mq-lock', controller.mq.lock);

    // kafka
    router.get('/kafka-init', controller.kafka.init);
    router.get('/kafka-monitor', controller.kafka.monitor);
    router.get('/kafka-lock', controller.kafka.lock);
};