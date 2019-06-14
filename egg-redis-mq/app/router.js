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
};