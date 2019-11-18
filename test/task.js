const { expect } = require('chai');

const superTest = require('supertest');
const uuid = require('uuid/v4');
const bcrypt = require('bcrypt');

const app = require('../server');
const Task = require('../models/Task');
const host = superTest(app);

const accessToken = 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ik5UTTBPVU5FTXpkRk16aEZPVEEw' +
	'UlVNeU5UZ3pOalZCUWpkRE1EQXdRakkwTkVFeU56WXdSQSJ9.eyJpc3MiOiJodHRwczovL2JldGhld2F2ZS5hdXRoMC5j' +
	'b20vIiwic3ViIjoiSE1KUHVpSUtxbThpYTB1Q3FidFllaHF5VWRQNThJdm5AY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vYm' +
	'V0aGV3YXZlLmF1dGgwLmNvbS9hcGkvdjIvIiwiaWF0IjoxNTY1MjM5MTkxLCJleHAiOjE1Njc4MzExOTEsImF6cCI6IkhNSlB' +
	'1aUlLcW04aWEwdUNxYnRZZWhxeVVkUDU4SXZuIiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIn0.JWLedazXTmIOoY1RHz6EuMF' +
	'VDuNHjWqsGwziafABMeHHai6Fh2V63jbQt20GTOMTs7iaQHRNM9H6RBojieh3OJNhb1dA3_r6HcUNDM9ynXCrGn_9DlOUcCdX5T0wyj' +
	'fBOyVjWd2AAHEzrHBnKlI4xNTiwvTvOztAwtmGy0RCv5KGZmJyNEs4YaBMGeqKB40r63Ok9K8EewSPVV0KrU-bIytywCLAnIPiQ0IRgEsF8' +
	'9QSA1JdIA8lmVjLVrJ1dTzqJONCGJarie58U2JKuUSyXmc1hvW5rnqo73qN9EufNXcUBxDgg469GQ1tRid4bTXAxVcwHXLP0YyxUcxfP5bznw';

const testTask = {
    taskId: "888f3456-608a-4305-9580-4ad518e9kdkd",
    voterId: "984f6187-608a-4305-9580-4ad518e9eded",
    userId: "5d120807fc4f11435c1073b5",
    status: "Unassigned",
    points: 7,
    ruleId: "RGR_NAT_001",
    taskDescription: "This task voters whose voting status is <not registered>",
    taskName: "Get unregistered voters to be registered",
    taskSpread: "National"
};
const taskDoc = {
    taskId: "784f3456-608a-4305-9580-4ad518e9mdmd",
    voterId: "984f6187-608a-4305-9580-4ad518e9edef",
    userId: "5d120807fc4f11435c1073b6",
    status: "Unassigned",
    points: 5,
    ruleId: "RGR_ST_002",
    taskDescription: "This task voters whose voting status is <not registered> from <State>",
    taskName: "Get unregistered voters to be registered",
    taskSpread: "State",
};

describe('task api',  function()  {
   /* const task = Object.assign({}, testTask);
    this.timeout(10000);
    before(async ()=> {
        await Task.create(task);
    });

    after(async ()=> {
        await Task.findOneAndDelete({ taskId: task.taskId });
    });

    this.timeout(10000);
    describe('GET /v1/task', function () {
        const task = Object.assign({}, taskDoc);
        after(async function () {
            await Task.findOneAndDelete({ taskId: task.taskId });
        });
        this.timeout(5000);
        it('successfully task added', async function () {
            await host.post('/v1/task')
                .set('Content-Type', 'application/json')
	            .set('Authorization', accessToken)
                .send(taskDoc)
                .expect(200)
                .expect(function (res) {
                    expect(res.body.message).to.equal('task created successfully');
                });
        });

        it('fails task generation ', async function () {
            await host.post('/v1/task')
                .set('Content-Type', 'application/json')
	            .set('Authorization', accessToken)
                .send(testTask)
                .expect(400)
                .expect(function (res) {
                    expect(res.body.message).to.equal('A task with that taskId already exists!');
                });
        });
    });

    describe('GET /v1/task/:id ', function () {
        this.timeout(5000);
        let task = Object.assign({}, testTask);
        it('fails getting task - task with provided taskId was not found', async function () {
            await host.get(`/v1/task/1234`)
	            .set('Authorization', accessToken)
	            .set('Content-Type', 'application/json')
                .send()
                .expect(200)
                .expect(function (res) {
                    expect(res.body.message).to.equal('Task with the requested id was not found!');
                    
                });
        });

        it('success getting task', async function () {
            await host.get(`/v1/task/${task.taskId}`)
	            .set('Authorization', accessToken)
	            .set('Content-Type', 'application/json')
                .send()
                .expect(200)
                .expect(function (res) {
                    expect(res.body.message).to.equal('Task found');
                    
                    expect(res.body.task.taskId).to.equal(`${task.taskId}`);
                    expect(res.body.task.userId).to.equal(task.userId);
                    expect(res.body.task.points).to.equal(task.points);
                });
        });
    });

    describe('PATCH /v1/task/:id', function () {
        this.timeout(5000);
        let task = Object.assign({}, testTask);
        it('fails updating task - task with provided taskId was not found', async function () {
            let task_id = 123;
            await host.patch(`/v1/task/${task_id}`)
                .set('Content-Type', 'application/json')
	            .set('Authorization', accessToken)
                .send({ points: 123 }, {})
                .expect(200)
                .expect(function (res) {
                    expect(res.body.message).to.equal('Task with that id was not found!');
                    
                });
        });

        it('success updating task', async function () {
            await host.patch(`/v1/task/${task.taskId}`)
                .set('Content-Type', 'application/json')
	            .set('Authorization', accessToken)
                .send({ points: 7 }, {})
                .expect(200)
                .expect(function (res) {
                    expect(res.body.message).to.equal('Task updated successfully');
                    
                });
        });
    });

    describe('DELETE /v1/task/:id', function () {
        this.timeout(5000);
        let task = Object.assign({}, taskDoc);
        it('fails task remove - task with provided id was not found', async function () {
            let task_id = 82;
            await host.delete(`/v1/task/${task_id}`)
	            .set('Authorization', accessToken)
	            .set('Content-Type', 'application/json')
                .send({})
                .expect(200)
                .expect(function (res) {
                    expect(res.body.message).to.equal('Task with that id was not found!');
                    
                });
        });
        it('successfully remove task', async function () {
            let task = Object.assign({}, taskDoc);
            const testTask = await Task.create(task);
            await host.delete(`/v1/task/${testTask.taskId}`)
	            .set('Authorization', accessToken)
	            .set('Content-Type', 'application/json')
                .send({})
                .expect(200)
                .expect(function (res) {
                    expect(res.body.message).to.equal('Task removed successfully');
                    
                });
                const count = await Task.countDocuments({ taskId: testTask.taskId});
                expect(count).to.equal(0);
        });
    });

    describe('GET /v1/task/all/:userId', function () {
        this.timeout(5000);
        let task = Object.assign({}, testTask);
        it('fails getting tasks - no tasks found for this userid', async function () {
            await host.get('/v1/task/all/1234abc')
	            .set('Authorization', accessToken)
	            .set('Content-Type', 'application/json')
                .send()
                .expect(200)
                .expect(function (res) {
                    expect(res.body.message).to.equal('No tasks present for this user');
                });
        });

        it('success getting all the tasks for the user', async function () {
            await host.get(`/v1/task/all/${task.userId}`)
	            .set('Authorization', accessToken)
	            .set('Content-Type', 'application/json')
                .send()
                .expect(200)
                .expect(function (res) {
                    expect(res.body.length).to.not.equal(0);
                });
        });
    });

    describe('GET /v1/task/all/:voterId/voter', function () {
        this.timeout(5000);
        let task = Object.assign({}, testTask);
        it('fails getting task - task with provided taskId was not found', async function () {
            await host.get(`/v1/task/all/1234/voter`)
	            .set('Authorization', accessToken)
	            .set('Content-Type', 'application/json')
                .send()
                .expect(200)
                .expect(function (res) {
                    expect(res.body.message).to.equal('No tasks present for the requested voterid');
                });
        });

        it('success getting task', async function () {
            await host.get(`/v1/task/all/${task.voterId}/voter`)
	            .set('Authorization', accessToken)
	            .set('Content-Type', 'application/json')
                .send()
                .expect(200)
                .expect(function (res) {
                    expect(res.body.length).to.not.equal(0);
                });
        });
    });*/

});
