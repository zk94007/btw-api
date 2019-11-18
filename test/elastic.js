const { expect } = require('chai');
const { calculatePotentialVoterProbability } = require('../controllers/elasticController');

describe('calculatePotentialVoterProbability', function () {
    it('should to return 0 if the first or last name does not match', function () {
        const searchVoterData = {
            firstname: 'John',
            lastname: 'Doe',
        };
        const potentialVoter = {
            firstname: 'John',
            lastname: 'Smith',
        };
        expect(calculatePotentialVoterProbability(searchVoterData, potentialVoter)).to.equal(0);
    });

    it('should to return correct probability 1', function () {
        const searchVoterData = {
            firstname: 'John',
            lastname: 'Doe',
            address: '94  DAVIDSON DR',
            phone: '9108224409',
            birthday: '01.01.1990',
        };
        const potentialVoter = {
            firstname: 'John',
            lastname: 'Doe',
            address: '94  DAVIDSON DR',
            phone: '9108224409',
            birthday: '01.01.1990',
        };
        expect(calculatePotentialVoterProbability(searchVoterData, potentialVoter)).to.equal(99);
    });

    it('should to return correct probability 2', function () {
        const searchVoterData = {
            firstname: 'John',
            lastname: 'Doe',
            address: '94  DAVIDSON DR',
        };
        const potentialVoter = {
            firstname: 'John',
            lastname: 'Doe',
            address: '94  DAVIDSON DR',
        };
        expect(calculatePotentialVoterProbability(searchVoterData, potentialVoter)).to.equal(70);
    });

    it('should to return correct probability 3', function () {
        const searchVoterData = {
            firstname: 'John',
            lastname: 'Doe',
            address: '94  DAVIDSON DR',
            birthday: '01.01.1990',
        };
        const potentialVoter = {
            firstname: 'John',
            lastname: 'Doe',
            address: '94  DAVIDSON DR',
            birthday: '01.01.1990',
        };
        expect(calculatePotentialVoterProbability(searchVoterData, potentialVoter)).to.equal(93);
    });

    it('should to return correct probability 4', function () {
        const searchVoterData = {
            firstname: 'John',
            lastname: 'Doe',
            birthday: '01.01.1990',
        };
        const potentialVoter = {
            firstname: 'John',
            lastname: 'Doe',
            birthday: '01.01.1990',
        };
        expect(calculatePotentialVoterProbability(searchVoterData, potentialVoter)).to.equal(85);
    });

    it('should to return correct probability 4', function () {
        const searchVoterData = {
            firstname: 'John',
            lastname: 'Doe',
        };
        const potentialVoter = {
            firstname: 'John',
            lastname: 'Doe',
        };
        expect(calculatePotentialVoterProbability(searchVoterData, potentialVoter)).to.equal(50);
    });
});
