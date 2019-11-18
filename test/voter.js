const { expect } = require('chai');
const uuid = require('uuid/v4');
const superTest = require('supertest');
const app = require('../server');
const Voter = require('../models/Voter');
const Task = require('../models/Task');
const mongoose = require('mongoose');
const host = superTest(app);
const accessToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ik5UTTBPVU5FTXpkRk16aEZPVEEw' +
	'UlVNeU5UZ3pOalZCUWpkRE1EQXdRakkwTkVFeU56WXdSQSJ9.eyJpc3MiOiJodHRwczovL2JldGhld2F2ZS5hdXRoMC5j' +
	'b20vIiwic3ViIjoiSE1KUHVpSUtxbThpYTB1Q3FidFllaHF5VWRQNThJdm5AY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vYm' +
	'V0aGV3YXZlLmF1dGgwLmNvbS9hcGkvdjIvIiwiaWF0IjoxNTY1MjM5MTkxLCJleHAiOjE1Njc4MzExOTEsImF6cCI6IkhNSlB' +
	'1aUlLcW04aWEwdUNxYnRZZWhxeVVkUDU4SXZuIiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIn0.JWLedazXTmIOoY1RHz6EuMF' +
	'VDuNHjWqsGwziafABMeHHai6Fh2V63jbQt20GTOMTs7iaQHRNM9H6RBojieh3OJNhb1dA3_r6HcUNDM9ynXCrGn_9DlOUcCdX5T0wyj' +
	'fBOyVjWd2AAHEzrHBnKlI4xNTiwvTvOztAwtmGy0RCv5KGZmJyNEs4YaBMGeqKB40r63Ok9K8EewSPVV0KrU-bIytywCLAnIPiQ0IRgEsF8' +
	'9QSA1JdIA8lmVjLVrJ1dTzqJONCGJarie58U2JKuUSyXmc1hvW5rnqo73qN9EufNXcUBxDgg469GQ1tRid4bTXAxVcwHXLP0YyxUcxfP5bznw';
const voterDoc1 = {
    tasks: [],
    userId: mongoose.Types.ObjectId("4edd40c86762e0fb12000003"),
    socialId: "s13",
    firstname: "fddff",
    lastname: "sdfs",
    sex: "male",
    icon: "3232",
};

const voterDoc2 = {
    tasks: ['{"taskId":"1238"}', '{"taskId":"1237"}'],
    userId: mongoose.Types.ObjectId("4edd40c86762e0fb12000003"),
    socialId: "s14",
    firstname: "fddfhjjk",
    lastname: "svbb",
    sex: "female",
    icon: "3232",
};

let voter_id1 = null;
let voter_id2 = null;
describe('voter api', function () {
   /* const firstVoter = Object.assign({}, voterDoc1);
    const secondVoter = Object.assign({}, voterDoc2);
    this.timeout(20000);

    before(async  ()=> {
        const voter1 = await Voter.create(firstVoter);
        const voter2 = await Voter.create(secondVoter);
        voter_id1 = voter1._id;
        voter_id2 = voter2._id;
    });

    after(async function () {
        await Voter.findByIdAndDelete({ _id: voter_id1 });
        await Voter.findByIdAndDelete({ _id: voter_id2 });
    });

    describe('GET /v2/voter/all/:userId',  function () {
        this.timeout(5000);
        let voter = Object.assign({}, voterDoc1);
        it('fails getting voters - no voters found for this userid', async function () {
            await host.get('/v2/voter/all/4edd40c86762e0fb12000002')
                .set('Authorization', accessToken)
	            .set('Content-Type', 'application/json')
                .send()
                .expect(200)
                .expect(function (res) {
                    expect(res.body.message).to.equal('No voters found for the requested userid');
                });
        });
    });

    describe('PATCH /v2/voter/:Id endpoint', function () {
        this.timeout(20000);
        const voter_id = '5d1e1644d3ca9b42cc07368b';
        let voter = Object.assign({}, voterDoc1);
        it('fails updating voter - voter with provided voterId was not found', async function () {
            try {
                await host.patch(`/v2/voter/${voter_id}`)
                    .set('Content-Type', 'application/json')
	                .set('Authorization', accessToken)
                    .send({ socialId: "s14" }, {})
                    .expect(200)
                    .expect(function (res) {
                        expect(res.body.message).to.equal('Voter with that id was not found!');
                        
                    });
            } catch (ex) {
                console.log(ex);
            }
        });

        it('success updating voter', async function () {
            await host.patch(`/v2/voter/${voter_id1}`)
                .set('Content-Type', 'application/json')
	            .set('Authorization', accessToken)
                .send({ userId: "5d10ab815d38c528fb183eef", socialId: "s14" }, {})
                .expect(200)
                .expect(function (res) {
                    expect(res.body.message).to.equal('Voter updated successfully');
                    
                });
        });
    });

    describe('DELETE /v2/voter/:Id endpoint',  ()=> {
        const secondVoter = Object.assign({}, voterDoc2);
        this.timeout(5000);
        it('fails voter remove - voter with provided id was not found', async function() {
            let _id = '5d21873de0c80a40607b4041';
            await host.delete(`/v2/voter/${_id}`)
	            .set('Authorization', accessToken)
	            .set('Content-Type', 'application/json')
                .send({})
                .expect(200)
                .expect(function (res) {
                    expect(res.body.message).to.equal('Voter with that id was not found!');
                    
                });
        });

        it('successfully remove voter', async function () {
            const voter = Object.assign({}, voterDoc2);
            const testVoter = await Voter.create(voter);
            const taskDoc = {
                taskId: "888f3456-608a-4305-9580-4ad518e9kdkd",
                voterId: testVoter._id,
                userId: "5d120807fc4f11435c1073b5",
                status: "Unassigned",
                points: 50,
                ruleId: "RGR_NAT_001",
                taskDescription: "This task voters whose voting status is <not registered>",
                taskName: "Get unregistered voters to be registered",
                taskSpread: "National"
            };
            const task = Object.assign({}, taskDoc);
            await Task.create(task);
            await Task.create(task);
            await host.delete(`/v2/voter/${testVoter._id}`)
	            .set('Authorization', accessToken)
	            .set('Content-Type', 'application/json')
                .send({})
                .expect(200)
                .expect(function (res) {
                    expect(res.body.message).to.equal('Voter and related tasks removed successfully');
                    
                });
            const count = await Voter.countDocuments({ id: testVoter._id });
            expect(count).to.equal(0);
        });

    });*/
});
