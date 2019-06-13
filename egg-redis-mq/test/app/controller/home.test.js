'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/controller/home.test.js', () => {
    it('should assert', () => {
        const pkg = require('../../../package.json');
        assert(app.config.keys.startsWith(pkg.name));

        // const ctx = app.mockContext({});
        // yield ctx.service.xx();
    });

    it('should GET /', () => {
        return app.httpRequest()
            .get('/')
            .expect('hi, egg')
            .expect(200);
    });
    it('should GET /exclusive-lock', async () => {
        await app.httpRequest()
            .get(`/init`)
            .query({ number: 4 })
            .expect(200);
        const all = [
            app.httpRequest().get('/exclusive-lock'),
            app.httpRequest().get('/exclusive-lock'),
            app.httpRequest().get('/exclusive-lock'),
            app.httpRequest().get('/exclusive-lock'),
            app.httpRequest().get('/exclusive-lock'),
            app.httpRequest().get('/exclusive-lock'),
            app.httpRequest().get('/exclusive-lock'),
            app.httpRequest().get('/exclusive-lock'),
            app.httpRequest().get('/exclusive-lock'),
            app.httpRequest().get('/exclusive-lock'),
        ];
        await Promise.all(all);
    });
    it('should GET /optimistic-lock', async () => {
        await app.httpRequest()
            .get(`/init`)
            .query({ number: 4 })
            .expect(200);
        const all = [
            app.httpRequest().get('/optimistic-lock'),
            app.httpRequest().get('/optimistic-lock'),
            app.httpRequest().get('/optimistic-lock'),
            app.httpRequest().get('/optimistic-lock'),
            app.httpRequest().get('/optimistic-lock'),
            app.httpRequest().get('/optimistic-lock'),
            app.httpRequest().get('/optimistic-lock'),
            app.httpRequest().get('/optimistic-lock'),
            app.httpRequest().get('/optimistic-lock'),
            app.httpRequest().get('/optimistic-lock'),
        ];
        await Promise.all(all);
    });
    it('hold the time', (done) => {
        setTimeout(done, 5000);
    });
});