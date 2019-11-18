const { expect } = require('chai');
const superTest = require('supertest');
const uuid = require('uuid/v4');
const bcrypt = require('bcrypt');

const app = require('../../server');
const User = require('../../models/User');

const host = superTest(app);
const testUser = {
    email: 'test@test.net',
    password: 'somepassword',
    firstname: 'Michael',
    lastname: 'Jackson',
};

describe.only('Auth0 api', function () {
    describe('/signin endpoint', function () {
        const user = Object.assign({}, testUser);
        this.timeout(15000);
        before(async function () {
            user.password = await bcrypt.hash(user.password, 10);
        });

        this.beforeEach(async function () {
            await User.create(user);
        });

        this.afterEach(async function () {
            await User.findOneAndDelete({ email: user.email });
        });

        this.timeout(15000);

        it('fails login - user by email not exists', async function () {
            await host.post('/v1/auth/signin')
                .set('Content-Type', 'application/json')
                .send({ email: 'notexists@email.now', password: 'anypassword' })
                .expect(401)
                .expect(function (res) {
                    expect(res.body.message).to.equal('{"error":"access_denied","errorDescription":"Sorry, The email and password you entered don\'t match our records. Password fields may be case sensitive","businessErrorCode":"BE-102"}');
                    expect(res.body.message).to.not.equal('null');
                });
        });

        it('fails login - incorrect password', async function () {
            await host.post('/v1/auth/signin')
                .set('Content-Type', 'application/json')
                .send({ email: user.email, password: 'thatpasswordincorrect' })
                .expect(401)
                .expect(function (res) {
                    expect(res.body.message).to.equal('{"error":"access_denied","errorDescription":"Sorry, The email and password you entered don\'t match our records. Password fields may be case sensitive","businessErrorCode":"BE-101"}');
                    expect(res.body.message).to.not.equal('null');
                });
        });

        it('successfully signin', async function () {
            await host.post('/v1/auth/signin')
                .set('Content-Type', 'application/json')
                .send({ email: user.email, password: testUser.password })
                .expect(200)
                .expect(function (res) {
                    expect(res.body.message).to.equal('Successful signin');
                    expect(res.body.message).to.not.equal('null');
                    expect(res.body.user.email).to.equal(testUser.email);
                });
        });
    });

    describe('/signup endpoint', function () {
        this.timeout(15000);

        after(async function () {
            await User.findOneAndDelete({ email: testUser.email });
        });

        it('successfully signup', async function () {
            await host.post('/v1/auth/signup')
                .set('Content-Type', 'application/json')
                .send(testUser)
                .expect(200)
                .expect(function (res) {
                    expect(res.body.message).to.equal('Account created successfully');
                    expect(res.body.message).to.not.equal('null');
                });
        });

        it('fails signup - user exists', async function () {
            await host.post('/v1/auth/signup')
                .set('Content-Type', 'application/json')
                .send(testUser)
                .expect(400)
                .expect(function (res) {
                    expect(res.body.message).to.equal('{"error":"registration_failed","errorDescription":"Sorry, we cannot register you with this email. If you are not sure of your password, attempt to reset it or use another unique email","businessErrorCode":"BE-103"}');
                    expect(res.body.message).to.not.equal('null');
                });
        });
    });

    describe('/verifyEmail endpoint', function () {
        this.timeout(15000);

        let user = Object.assign({}, testUser);
        before(async function () {
            user.password = await bcrypt.hash(user.password, 10);
        });

        it('fails verify - user with provided email was not found', async function () {
            await host.post('/v1/auth/verifyEmail')
                .set('Content-Type', 'application/json')
                .send({ email: 'notexists@email.now' })
                .expect(401)
                .expect(function (res) {
                    expect(res.body.message).to.equal('{"error":"access_denied","errorDescription":"Sorry, The email and password you entered don\'t match our records. Password fields may be case sensitive","businessErrorCode":"BE-102"}'),
                    expect(res.body.message).to.not.equal('null');
                });
        });

        it('success verify email', async function () {
            await User.create(user);
            await host.post('/v1/auth/verifyEmail')
                .set('Content-Type', 'application/json')
                .send({ email: user.email })
                .expect(200)
                .expect(function (res) {
                    expect(res.body.message).to.equal('Email verified successfully');
                    expect(res.body.message).to.not.equal('null');
                });
            let userDoc = await User.findOne().byEmail(user.email);
            expect(userDoc.isEmailConfirmed).to.equal(true);
            await userDoc.remove();
        });
    });

    describe('/getUser endpoint', function () {
        this.timeout(15000);

        let user = Object.assign({}, testUser);
        ;
        before(async function () {
            user.password = await bcrypt.hash(user.password, 10);
        });

        this.beforeEach(async function () {
            await User.create(user);
        });

        this.afterEach(async function () {
            await User.findOneAndDelete({ email: user.email });
        });

        it('fails getting user - user with provided email was not found', async function () {
            await host.post('/v1/auth/getUser')
                .set('Content-Type', 'application/json')
                .send({ email: 'notexists@email.now' })
                .expect(404)
                .expect(function (res) {
                    expect(res.body.message).to.equal('{"error":"access_denied","errorDescription":"Sorry, The email and password you entered don\'t match our records. Password fields may be case sensitive","businessErrorCode":"BE-101"}'),
                    expect(res.body.message).to.not.equal('null');
                });
        });

        it('success getting user', async function () {
            await host.post('/v1/auth/getUser')
                .set('Content-Type', 'application/json')
                .send({ email: user.email })
                .expect(200)
                .expect(function (res) {
                    expect(res.body.message).to.equal('User found');
                    expect(res.body.message).to.not.equal('null');

                    expect(res.body.user.email).to.equal(user.email);
                    expect(res.body.user.firstname).to.equal(user.firstname);
                    expect(res.body.user.lastname).to.equal(user.lastname);
                });
        });
    });

    describe('/changePassword endpoint', function () {
        this.timeout(15000);

        let user = Object.assign({}, testUser);
        ;
        before(async function () {
            user.password = await bcrypt.hash(user.password, 10);
        });

        this.beforeEach(async function () {
            await User.create(user);
        });

        this.afterEach(async function () {
            await User.findOneAndDelete({ email: user.email });
        });

        it('fails changing password - user with provided email was not found', async function () {
            await host.post('/v1/auth/changePassword')
                .set('Content-Type', 'application/json')
                .send({ email: 'notexists@email.now', newPassword: 'somenewpassword' })
                .expect(401)
                .expect(function (res) {
                    expect(res.body.message).to.equal('{"error":"access_denied","errorDescription":"Sorry, The email and password you entered don\'t match our records. Password fields may be case sensitive","businessErrorCode":"BE-102"}'),
                    expect(res.body.message).to.not.equal('null');
                });
        });

        it('success changing password', async function () {
            let newPassword = 'somenewpassword';
            await host.post('/v1/auth/changePassword')
                .set('Content-Type', 'application/json')
                .send({ email: user.email, newPassword: newPassword })
                .expect(200)
                .expect(function (res) {
                    expect(res.body.message).to.equal('Password changed successfully');
                    expect(res.body.message).to.not.equal('null');
                });

            let userDoc = await User.findOne({ email: user.email });
            let compareResult = await bcrypt.compare(newPassword, userDoc.password);
            expect(compareResult).to.be.true;
        });
    });

    describe('/removeUser endpoint', function () {
        this.timeout(15000);

        let user = Object.assign({}, testUser);
        ;
        before(async function () {
            user.password = await bcrypt.hash(user.password, 10);
        });

        it('fails user remove - incorrect id format', async function () {
            await host.post('/v1/auth/removeUser')
                .set('Content-Type', 'application/json')
                .send({ user_id: '123' })
                .expect(400)
                .expect(function (res) {
                    expect(res.body.message).to.equal('Invalid user id format');
                    expect(res.body.message).to.not.equal('null');
                });
        });

        it('fails user remove - user with provided id was not found', async function () {
            await host.post('/v1/auth/removeUser')
                .set('Content-Type', 'application/json')
                .send({ user_id: '0f0f0f0f0f0f0f0f0f0f0f0f' })
                .expect(404)
                .expect(function (res) {
                    expect(res.body.message).to.equal('User with that id was not found!');
                    expect(res.body.message).to.not.equal('null');
                });
        });

        it('successfully removes user', async function () {
            const userDoc = await User.create(user);
            await host.post('/v1/auth/removeUser')
                .set('Content-Type', 'application/json')
                .send({ user_id: userDoc._id.toString() })
                .expect(200)
                .expect(function (res) {
                    expect(res.body.message).to.equal('User removed successfully');
                    expect(res.body.message).to.not.equal('null');
                });
            const count = await User.count({ id: userDoc._id });
            expect(count).to.equal(0);
        });
    });

    describe('/getUser endpoint - social scenario', function () {
        this.timeout(15000);

        let socialUser = {
            email: 'socialuser@example.com',
            socialLogin: true,
            auth0UserId: 'google|111222333444',
            password: '',
        };

        this.beforeEach(async function () {
            await User.create(socialUser);
        });

        this.afterEach(async function () {
            await User.findOneAndDelete({ auth0UserId: socialUser.auth0UserId });
        });

        it('fails getting social user - user with provided data not found', async function () {
            await host.post('/v1/auth/getUser')
                .set('Content-Type', 'application/json')
                .send({
                    social: true,
                    email: 'notexists@email.now',
                    userId: 'unexpected|000000'
                })
                .expect(404)
                .expect(function (res) {
                    expect(res.body.message).to.equal('{"error":"access_denied","errorDescription":"Sorry, The email and password you entered don\'t match our records. Password fields may be case sensitive","businessErrorCode":"BE-101"}'),
                    expect(res.body.message).to.not.equal('null');
                });
        });

        it('success getting social user', async function () {
            await host.post('/v1/auth/getUser')
                .set('Content-Type', 'application/json')
                .send({
                    social: true,
                    email: socialUser.email,
                    userId: socialUser.auth0UserId,
                })
                .expect(200)
                .expect(function (res) {
                    expect(res.body.message).to.equal('User found');
                    expect(res.body.message).to.not.equal('null');

                    expect(res.body.user.email).to.equal(socialUser.email);
                });
        });
    });

    describe('/signup endpoint - social scenario', function () {
        this.timeout(15000);

        let socialLoginData = {
            email: 'socialuser@example.com',
            social: true,
            userId: 'google|111222333444',
        };

        after(async function () {
            await User.findOneAndDelete({ auth0UserId: socialLoginData.userId });
        });

        it('successfully signup', async function () {
            await host.post('/v1/auth/signup')
                .set('Content-Type', 'application/json')
                .send(socialLoginData)
                .expect(200)
                .expect(function (res) {
                    expect(res.body.message).to.equal('Account created successfully');
                    expect(res.body.message).to.not.equal('null');
                });
        });

        it('fails signup - user exists', async function () {
            await host.post('/v1/auth/signup')
                .set('Content-Type', 'application/json')
                .send({ email: socialLoginData.email })
                .expect(400)
                .expect(function (res) {
                    expect(res.body.message).to.equal('{"error":"registration_failed","errorDescription":"Sorry, we cannot register you with this email. If you are not sure of your password, attempt to reset it or use another unique email","businessErrorCode":"BE-103"}'),
                    expect(res.body.message).to.not.equal('null');
                });
        });
    });

    describe('/signin endpoint - social scenario', function () {
        this.timeout(15000);

        let socialUser = {
            email: 'socialuser@example.com',
            socialLogin: true,
            auth0UserId: 'google|111222333444',
            password: '',
        };

        before(async function () {
            await User.create(socialUser);
        });

        after(async function () {
            await User.findOneAndDelete({ auth0UserId: socialUser.auth0UserId });
        });

        it('fails login - user with provided data not exists', async function () {
            await host.post('/v1/auth/signin')
                .set('Content-Type', 'application/json')
                .send({
                    social: true,
                    email: 'notexists@email.now',
                    userId: 'unexpected|000000'
                })
                .expect(401)
                .expect(function (res) {
                    expect(res.body.message).to.equal('{"error":"access_denied","errorDescription":"Sorry, The email and password you entered don\'t match our records. Password fields may be case sensitive","businessErrorCode":"BE-102"}'),
                    expect(res.body.message).to.not.equal('null');
                });
        });

        it('successfully signin', async function () {
            await host.post('/v1/auth/signin')
                .set('Content-Type', 'application/json')
                .send({
                    social: true,
                    email: socialUser.email,
                    userId: socialUser.auth0UserId
                })
                .expect(200)
                .expect(function (res) {
                    expect(res.body.message).to.equal('Successful signin');
                    expect(res.body.message).to.not.equal('null');

                    expect(res.body.user.email).to.equal(socialUser.email);
                });
        });
    });

    describe('/v1/user/resetPassword/reset/ endpoint', function () {
        this.timeout(15000);

        const SECONDS_IN_ONE_DAY = 1000 * 60 * 60 * 24;
        const userWithResetPassword = {
            email: 'test123@test.net',
            password: 'SomePassword123',
            firstname: 'John',
            lastname: 'Doe',
            resetPasswordToken: uuid(),
            resetPasswordExpires: Date.now() + SECONDS_IN_ONE_DAY * 5,
        };

        this.beforeEach(async function () {
            await User.create(userWithResetPassword);
        });

        this.afterEach(async function () {
            await User.findOneAndDelete({ email: userWithResetPassword.email });
        });

        it('fails reset password with weak password', async function () {
            await host
                .post('/v1/user/resetPassword/reset')
                .set('Content-Type', 'application/json')
                .send({
                    newPassword: 'password',
                    resetPasswordToken: userWithResetPassword.resetPasswordToken,
                })
                .expect(400)
                .expect(function (res) {
                    expect(res.body.message).to.equal('Password must be at least 8 characters in length and ' +
                        'contain 3 of the following 4 types of characters: lower case letters (a-z), uppercase ' +
                        'letters (A-Z), numbers (0-9), special characters (e.g. !@#$%^&*)');
                })
        });

        it('fails reset password with invalid token', async function () {
            await host
                .post('/v1/user/resetPassword/reset')
                .set('Content-Type', 'application/json')
                .send({
                    newPassword: 'MyNewPassword123',
                    resetPasswordToken: 'notValidToken',
                })
                .expect(404)
                .expect(function (res) {
                    expect(res.body.message).to.equal('Password reset token is invalid or has expired');
                })
        });

        it('successfully reset password', async function () {
            await host
                .post('/v1/user/resetPassword/reset')
                .set('Content-Type', 'application/json')
                .send({
                    newPassword: 'MyNewPassword123',
                    resetPasswordToken: userWithResetPassword.resetPasswordToken,
                })
                .expect(200)
                .expect(function (res) {
                    expect(res.body.message).to.equal('Password restored successfully');
                });
        });
    });
});
