/**
 *  Created by KennethObikwelu on 8/12/19.
 */



const {expect} = require('chai');

const superTest = require('supertest');
const uuid = require('uuid/v4');
const bcrypt = require('bcrypt');

const app = require('../server');
const GuestUser = require('../models/GuestUser');
const Subscription = require('../models/Subscription');
const host = superTest(app);

const testGuest = {
	firstname             : "testFirstName",
	lastname              : "testLastname",
	isRegistered          : "true",
	isNetworkStrong       : "true",
	cityOfResidence       : "New York",
	email                 : "test@email.com",
	pastRelevantExperience: "I was a campaign advisor for a state program. I believe this can be of use"
}

const testGuestMissingRequiredAtrribute = {
	firstname             : "testFirstName",
	lastname              : "testLastname",
	isNetworkStrong       : "true",
	cityOfResidence       : "New York",
	email                 : "test@email.com",
	pastRelevantExperience: "I was a campaign advisor for a state program. I believe this can be of use"
}

const testGuestEmptyAtrributeValue = {
	firstname             : "testFirstName",
	lastname              : "",
	isNetworkStrong       : "true",
	cityOfResidence       : "New York",
	email                 : "test@email.com",
	pastRelevantExperience: "I was a campaign advisor for a state program. I believe this can be of use"
}


describe('guest api', function () {

	describe('POST /v1/guestUser', function () {

		this.afterEach(async function () {
			await GuestUser.findOneAndDelete({email: testGuest.email});
		});

		this.timeout(15000);

		it('successful message post', async function () {
			await host.post('/v1/guestUser')
				.set('Content-Type', 'application/json')
				.send(testGuest)
				.expect(200)
				.expect(function (res) {
					expect(res.body.message).to.equal('Message received! We will contact you shortly');
				});
		});

		it('missing attribute returns error', async function () {
			await host.post('/v1/guestUser')
				.set('Content-Type', 'application/json')
				.send(testGuestMissingRequiredAtrribute)
				.expect(400)
				.expect(function (res) {
					expect(res.body.message).to.equal('A required field is missing First Name, Last Name, Email, City, Registration status or Experience');
				});
		});

		it('empty attribute value returns error', async function () {
			await host.post('/v1/guestUser')
				.set('Content-Type', 'application/json')
				.send(testGuestEmptyAtrributeValue)
				.expect(400)
				.expect(function (res) {
					expect(res.body.message).to.equal('A required field is missing First Name, Last Name, Email, City, Registration status or Experience');
				});
		});
	})

	describe('POST /v1/guestUser/subscribe', function () {

	/*	this.afterEach(async function () {
			await Subscription.findOneAndDelete({email: "testSubscribe@email.com"});
		});

		this.timeout(15000);

		it('successful newsletter subscription', async function () {
			await host.post('/v1/guestUser')
				.set('Content-Type', 'application/json')
				.send({email: "testSubscribe@email.com"})
				.expect(200)
				.expect(function (res) {
					expect(res.body.message).to.equal('Subscription successful!');
				});
		});

		it('email already subscribed', async function () {
			await host.post('/v1/guestUser')
				.set('Content-Type', 'application/json')
				.send(testGuest.email)
				.expect(400)
		});
*/
	})
})