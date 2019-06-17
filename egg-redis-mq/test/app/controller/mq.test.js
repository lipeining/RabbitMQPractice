'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/controller/mq.test.js', () => {
    it('should GET /mq-init and lock it', async () => {
        await app.httpRequest()
            .get('/mq-init')
            .query({ number: 4 })
            .expect(200);
        const all = [
            app.httpRequest().get('/mq-lock'),
            app.httpRequest().get('/mq-lock'),
            app.httpRequest().get('/mq-lock'),
            app.httpRequest().get('/mq-lock'),
            app.httpRequest().get('/mq-lock'),
            app.httpRequest().get('/mq-lock'),
            app.httpRequest().get('/mq-lock'),
            app.httpRequest().get('/mq-lock'),
            app.httpRequest().get('/mq-lock'),
            app.httpRequest().get('/mq-lock'),
        ];
        await Promise.all(all);
    });
    it('hold the time', (done) => {
        setTimeout(done, 5000);
    });
});