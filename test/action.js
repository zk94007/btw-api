const expect = require('chai').expect;
const superTest = require('supertest');

const app = require('../server');
const User = require('../models/User');
const Voter = require('../models/Voter');
const PotentialVoter = require('../models/PotentialVoter');
const Contact = require('../models/Contact');

const host = superTest(app);
const testSecret = 'jk23923f9eifjwef9j';
const testUserId = '5d10ab815d38c528fb183eee';
const testSocialId = 'masasdcxzsdnjkj5';

const potentialVoter = new PotentialVoter({
  firstname: 'test',
  lastname: 'testtest'
});

const testVoter = new PotentialVoter({
    socialId: 'masasdcxzsdnjkj5',
    firstname: 'votertest',
    lastname: 'testvoter'
});

const oneTestContact = new Contact({
  firstname: 'Gordon',
  lastname: 'Freeman',
  socialId: 'someSocialIdForEl'
});

const twoTestContact = new Contact({
  firstname: 'Elizabeth',
  lastname: 'Olsen',
  socialId: 'someSocialIdForGo'
});

const oneTestPotentialVoter = new PotentialVoter({
    firstname: 'Gordon',
    lastname: 'Freeman',
    gender: 'Male',
    id: 'KC342GsBltOqjyIl8xso',
    _index: 'first_type'
});
const twoTestPotentialVoter = new PotentialVoter({
  firstname: 'Elizabeth',
  lastname: 'Olsen',
  gender: 'Female',
  id: '3p7d12sBltOqjyIlR4eY',
  _index: 'second_type'
});
const testUser = new User({
    email: 'test@test.test',
    password: 'samePassword',
    firstname: 'Harry',
    lastname: 'Potter',
    registrationDate: "2019-07-07T18:44:09.976Z",
    points: 0,
    isEmailConfirmed: false,
    onboarding: {
        district: false,
        importSource: false,
        addTenVoters: false
    }
});

const testV2User = new User({
	email                : 'test@test.test',
	firstname            : 'Harry',
	lastname             : 'Sesame',
	welcomeDashboardShown: 'true',
	registrationDate     : '2019-07-07T18:44:09.976Z',
	lastLoginTime        : '2019-07-07T18:44:09.976Z',
	points               :  500,
	isEmailConfirmed     : true,
	isProfileComplete: false,
	userProfile: {
		address: '23 Acme street',
		zipcode: '64554',
		phoneNumber: '5564453435',
		bioInfo: 'Handsome young Engineer',
		dateOfBirth: '1st Sept 1988',
		profileImageUrl: ''
  },
  electionProfiles:[{
    electionProfileId: "4edd40c86762e0fb12000004",
    electionProfileName: 'Test Profile',
    isActive: true
  }]
})

describe("addVoters endpoint", function () {
    /*describe('/v1/user/addVoters endpoint', function () {
        this.timeout(25000);
        before(async function () {
            await testV2User.save();
            oneTestContact.userId = testV2User._id;
            twoTestContact.userId = testV2User._id;
            await oneTestContact.save();
            await twoTestContact.save();
            oneTestPotentialVoter.contactId = oneTestContact._id;
            twoTestPotentialVoter.contactId = twoTestContact._id;
            await oneTestPotentialVoter.save();
            await twoTestPotentialVoter.save();
        });
        after(async function(){
          await Voter.findOneAndDelete({socialId: 'someSocialIdForEl'});
          await Voter.findOneAndDelete({socialId: 'someSocialIdForGo'});
        })
        it('New voters was added', async function(){
          await host.post('/v1/user/addVoters')
              .set('Content-Type', 'application/json')
              .send({testSecret, voters: [{id: oneTestPotentialVoter.id, _index: oneTestPotentialVoter._index},{id: twoTestPotentialVoter.id, _index: twoTestPotentialVoter._index}]})
              .expect(200);
        });
        it('Try send incorrect format voters', async function(){
          await host.post('/v1/user/addVoters')
              .set('Content-Type', 'application/json')
              .send({testSecret, voters: 'someIncoorecttext'})
              .expect(400);
        });
    });*/
    describe("getUser endpoint", function () {
        this.timeout(10000);
        before(async function () {
            await testV2User.save();
        });
        after(async function () {
            await User.findOneAndDelete({ email: testV2User.email });
        })
        it('Unauthorized', async function () {
            await host.get('/v2/user')
                .set('Content-Type', 'application/json')
                .send()
                .expect(401);
        });
        it('Successfully, user was found', async function () {
            await host.get('/v2/user?testSecret=jk23923f9eifjwef9j')
                .set('Content-Type', 'application/json')
                .send()
                .expect(200)
                .expect(function (res) {
                  console.log(res.body.user);
                  expect(res.body.user.email).to.equal(testV2User.email);
                  expect(res.body.user.points).to.equal(testV2User.points);
                  expect(res.body.user.userProfile.zipcode).to.equal(testV2User.userProfile.zipcode);
                })
        });
    });

    describe("parseFile endpoint", function () {
      this.timeout(10000);
      after(async function () {
        await Voter.deleteMany({firstname: 'testNametest'});
      })
        this.timeout(10000);
        it('trying send empty field "file"', async function () {
            await host.post('/v1/user/parseFile')
                .set('Content-Type', 'application/json')
                .send({ testSecret })
                .expect(400);
        });
        it('trying send the file in the correct format', async function () {
            await host.post('/v1/user/parseFile')
                .set('Content-Type', 'application/json')
                .field('testSecret', testSecret)
                .attach('file', 'test/testFile/correctFile.csv')
                .expect(200);
        });
        it('trying send the file in the incorrect format', async function () {
            await host.post('/v1/user/parseFile')
                .set('Content-Type', 'application/json')
                .field('testSecret', testSecret)
                .attach('file', 'test/testFile/incorrectFile.ods')
                .expect(400);
        })
    });
   /* describe("showResult - endpoint", function () {
      this.timeout(10000);
      before(async function () {
        const user = await User.findOne({email: 'test@test.test'});
        oneTestContact.userId = user._id;
        await oneTestContact.save();
        oneTestPotentialVoter.contactId = oneTestContact._id;
        await oneTestPotentialVoter.save();
      });
      this.timeout(10000);
      after(async function () {
        await PotentialVoter.findOneAndDelete({_id: oneTestPotentialVoter._id});
        await Contact.findOneAndDelete({_id: oneTestContact._id});
      })
      it('trying get potential voters', async function () {
        await host.get('/v1/user/showResultV2?testSecret=jk23923f9eifjwef9j')
            .set('Content-Type', 'application/json')
            .send()
            .expect(200);
      })
    });*/
    describe("dashboardLeaderBoard - endpoint", function () {
      this.timeout(10000);
      // it('trying send incorrect format', async function() {
      //   await host.get('/v1/user/dashboardLeaderBoard?testSecret=jk23923f9eifjwef9j')
      //       .set('Content-Type', 'application/json')
      //       .send()
      //       .expect(400);
      // });
      it('trying get dashboardLeaderBoard for all time period', async function() {
        await host.get('/v1/user/dashboardLeaderBoard?testSecret=jk23923f9eifjwef9j&period=allTime')
            .set('Content-Type', 'application/json')
            .send()
            .expect(200);
      })
      it('trying get dashboardLeaderBoard for month period', async function() {
        await host.get('/v1/user/dashboardLeaderBoard?testSecret=jk23923f9eifjwef9j&period=month')
            .set('Content-Type', 'application/json')
            .send()
            .expect(200);
      })
      it('trying get dashboardLeaderBoard for week period', async function() {
        await host.get('/v1/user/dashboardLeaderBoard?testSecret=jk23923f9eifjwef9j&period=week')
            .set('Content-Type', 'application/json')
            .send()
            .expect(200);
      })
    })
});
