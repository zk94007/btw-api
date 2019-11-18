const { expect } = require('chai');
const superTest = require('supertest');
const uuid = require('uuid/v4');
const bcrypt = require('bcrypt');

const app = require('../server');
const Rule = require('../models/Rule');

const host = superTest(app);
const testRule = {
    ruleId: '8974',
    ruleDescription: 'Each rule should be assigned points',
    points: 50,
    ruleType: "IN",
    ruleSpread: 'National',
    isActive: true,
    ruleName: 'assigned points',
};
const ruleDoc = {
    ruleId: '768',
    ruleDescription: 'Each rule should be assigned points',
    points: 50,
    ruleType: "IN",
    isActive: true,
    ruleSpread: 'State',
    ruleName: 'assigned points',
};

describe('rule api', function () {
    const rule = Object.assign({}, testRule);
    this.timeout(10000);
    before(async function () {
        await Rule.create(rule);
    });

    after(async function () {
        await Rule.findOneAndDelete({ ruleId: rule.ruleId });
    });

    describe('/create rule endpoint', function () {
        const rule = Object.assign({}, ruleDoc);
        after(async function () {
            await Rule.findOneAndDelete({ ruleId: rule.ruleId });
        });
        this.timeout(10000);
        it('successfully rule added', async function () {
            await host.post('/v1/rule')
                .set('Content-Type', 'application/json')
                .send(ruleDoc)
                .expect(200)
                .expect(function (res) {
                    expect(res.body.message).to.equal('rule created successfully');
                    
                });
        });

        it('fails rule generation ', async function () {
            await host.post('/v1/rule')
                .set('Content-Type', 'application/json')
                .send(testRule)
                .expect(400)
                .expect(function (res) {
                    expect(res.body.message).to.equal('A rule with that ruleId already exists!');
                    
                });
        });
    });

    describe('/getRule endpoint', function () {
        this.timeout(10000);

        let rule = Object.assign({}, testRule);

        it('fails getting rule - rule with provided ruleId was not found', async function () {
            await host.get(`/v1/rule/1234`)
                .set('Content-Type', 'application/json')
                .send()
                .expect(404)
                .expect(function (res) {
                    expect(res.body.message).to.equal('rule with the requested id was not found!');
                    
                });
        });

        it('success getting rule', async function () {
            await host.get(`/v1/rule/${rule.ruleId}`)
                .set('Content-Type', 'application/json')
                .send()
                .expect(200)
                .expect(function (res) {
                    expect(res.body.message).to.equal('rule found');
                    
                    expect(res.body.rule.ruleId).to.equal(`${rule.ruleId}`);
                    expect(res.body.rule.userId).to.equal(rule.userId);
                    expect(res.body.rule.points).to.equal(rule.points);
                });
        });
    });

    describe('/updaterule endpoint', function () {
        this.timeout(10000);
        let rule = Object.assign({}, testRule);

        it('fails updating rule - rule with provided ruleId was not found', async function () {
            await host.patch(`/v1/rule/123`)
                .set('Content-Type', 'application/json')
                .send({ ruleDescription: 'create a task if registration status is unregistered' }, {})
                .expect(404)
                .expect(function (res) {
                    expect(res.body.message).to.equal('Rule with that id was not found!');
                    
                });
        });

        it('success updating rule', async function () {
            await host.patch(`/v1/rule/${rule.ruleId}`)
                .set('Content-Type', 'application/json')
                .send({ ruleDescription: 'create a task if registration status is unregistered' }, {})
                .expect(200)
                .expect(function (res) {
                    expect(res.body.message).to.equal('Rule updated successfully');
                    
                });
        });
    });

    describe('/removerule endpoint', function () {
        this.timeout(10000);
        let rule = Object.assign({}, testRule);
        it('fails rule remove - rule with provided id was not found', async function () {
            await host.delete(`/v1/rule/823234324234`)
                .set('Content-Type', 'application/json')
                .send({})
                .expect(404)
                .expect(function (res) {
                    expect(res.body.message).to.equal('Rule with that id was not found!');
                    
                });
        });

        it('successfully remove rule', async function () {
            let rule = Object.assign({}, ruleDoc);
            const testRule = await Rule.create(rule);
            await host.delete(`/v1/rule/${testRule.ruleId}`)
                .send({})
                .expect(200)
                .expect(function (res) {
                    expect(res.body.message).to.equal('Rule removed successfully');
                    
                });
            const count = await Rule.countDocuments({ ruleId: testRule.ruleId });
            expect(count).to.equal(0);
        });

    });
});

