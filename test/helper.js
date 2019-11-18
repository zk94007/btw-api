const expect = require('chai').expect;
const helper = require('../utility/helper')();

describe('isStrengthPassword', function () {
    it('password should be at least 8 character length', function () {
        const password1 = 'Abc123!';
        const password2 = 'Password123';
        expect(helper.isStrengthPassword(password1)).to.be.false;
        expect(helper.isStrengthPassword(password2)).to.be.true;
    });

    it('Password should contain 3 of the following 4 types of characters: lower case letters (a-z), uppercase ' +
        'letters (A-Z), numbers (0-9), special characters (e.g. !@#$%^&*)', function () {
        const weakPasswords = ['aaaaaaaaaaaa', 'AAAAAAaaaaaa', 'aaaaaaa12345', 'AAAAAA12345', 'aaaaa!@#$%', '12345678'];
        const strongPasswords = ['Aaaaaaaa123', 'aaaa123#$', 'AAaa?$!!!', 'AAA1234!@#'];
        weakPasswords.forEach(password => {
            expect(helper.isStrengthPassword(password)).to.be.false;
        });
        strongPasswords.forEach(password => {
            expect(helper.isStrengthPassword(password)).to.be.true;
        });
    });
});
