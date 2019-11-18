const { expect } = require('chai');

const { serializeParams, parseOcdId } = require('../services/civicApi');

describe('serializeParams', function () {
    it('should serialize object into string', function () {
        const params = { name: 'John', lastname: 'Doe' };
        expect(serializeParams(params)).to.equal('name=John&lastname=Doe');
    });

    it('should encode string', function () {
        const params = { stringWithSpaces: 'how are you' };
        expect(serializeParams(params)).to.equal('stringWithSpaces=how%20are%20you');
    });
});

describe('parseOcdId', function () {
    it('should parse ocdId into object', function () {
        const ocdId = 'ocd-division/country:us/state:ny/cd:1';
        const parsedOcdId = {
            country: 'us',
            state: 'ny',
            cd: '1',
        };
        expect(parseOcdId(ocdId)).to.deep.equal(parsedOcdId);
    });
});
