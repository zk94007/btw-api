const XLSX = require('xlsx');
const fs = require('fs');
const moment = require('moment');
const { Client } = require('@elastic/elasticsearch');
const config = require('../config');
const esDocuments = require('../constants/esDocuments');
const voterStatusReasonDesc = require('../constants/voterStatusReasonDesc');
const esVoterHistoryDocuments = require('../constants/esVoterHistoryDocuments');

const client = new Client({ node: config.elasticNode });

const getPropertyValue = (obj, prop, defaultValue) => (obj.hasOwnProperty(prop) ? obj[prop] : defaultValue);

// return data array from props array
const filterProps = (obj, props) => {
    let filteredProps = [];
    props.forEach((prop) => {
        if (obj.hasOwnProperty(prop)) {
            filteredProps.push(obj[prop]);
        }
    });
    return filteredProps;
};

// match builder
const buildMatch = function (field, value) {
    let matchJSON = { match: {} };
    matchJSON.match[field] = value;
    return matchJSON;
};

// multi match builder
const buildMultiMatch = function (s_fields, value) {
    return {
        multi_match: {
            query: value,
            type: 'cross_fields',
            fields: s_fields,
        }
    };
};

const init = async () => {
    let indices = (await client.cat.indices({})).body;

    for (esDocument of esDocuments) {
        if (indices.indexOf(esDocument.type) === -1) {
            await client.indices.create({ index: esDocument.type });
        }
    }

    indices = (await client.cat.indices({})).body;

    let counts = [];
    for (esDocument of esDocuments) {
        counts.push(await client.count({ index: esDocument.type, type: esDocument.type }));
    }
};

/**
 *
 * @param searchVoterData
 * @param potentialVoter
 * @returns {number}
 */
exports.calculatePotentialVoterProbability = (searchVoterData, potentialVoter) => {
    if (!searchVoterData || !potentialVoter) {
        return 0;
    }

    const matchResult = {
        firstname: false,
        lastname: false,
        phone: false,
        birthday: false,
        address: false,
        state: false,
        city: false,
        zip: false,
    };

    const compareSearchResults = (fieldName) => {
        matchResult[fieldName] = potentialVoter[fieldName]
            && searchVoterData[fieldName]
            && typeof potentialVoter[fieldName] === 'string'
            && typeof searchVoterData[fieldName] === 'string'
            && potentialVoter[fieldName].toLowerCase().includes(searchVoterData[fieldName].toLowerCase());
    };

    Object.keys(searchVoterData).forEach(key => {
        compareSearchResults(key);
    });

    const compareAddressInSearchResult = (fieldName) => {
        matchResult[fieldName] = potentialVoter[fieldName]
            && searchVoterData.address
            && typeof potentialVoter[fieldName] === 'string'
            && typeof searchVoterData.address === 'string'
            && searchVoterData.address.toLowerCase().includes(potentialVoter[fieldName].toLowerCase());
    };

    const addressFields = ['state', 'city', 'zip'];
    addressFields.forEach(field => {
        compareAddressInSearchResult(field)
    });

    const matchAddress = matchResult.state || matchResult.city || matchResult.address || matchResult.zip;

    if (matchResult.firstname && matchResult.lastname) {
        if (matchResult.phone && matchResult.birthday && matchAddress) {
            if (matchResult.address || matchResult.zip) {
                return 99
            }
            if (matchResult.city) {
                return 95
            }
            return 90;
        }
        if (matchResult.birthday && matchResult.phone) {
            return 95;
        }
        if (matchResult.birthday && matchAddress) {
            if (matchResult.address || matchResult.zip) {
                return 93;
            }
            if (matchResult.city) {
                return 88;
            }
            return 83;
        }
        if (matchResult.phone && matchAddress) {
            return 85;
        }
        if (matchResult.birthday) {
            return 85;
        }
        if (matchResult.phone) {
            return 80;
        }
        if (matchAddress) {
            return 70;
        }
        return 50;
    }

    return 0;
};

// this returns potential voters array based on voterInfo
exports.findVoter2 = async (voterInfo) => {
    const getAddress = (address) => {
        if (address) {
            if (typeof address !== 'object') {
                return address;
            }
        }
        return '';
    };

    const firstname = voterInfo.firstname || '';
    const lastname = voterInfo.lastname || '';
    const phone = voterInfo.phone || '';
    const birthday = voterInfo.birthday || '';
    const address = getAddress(voterInfo.address);

    const addressFields = ['address', 'city', 'state', 'zip', 'extraAddressLine', 'zipPlus', 
        'mailAddr1', 'mailAddr2', 'mailAddr3', 'mailingCity', 'mailingState', 'mailingZipCode', 'mailingZipPlus', 'mailingCountry'];
    const sourceFields = ['firstname', 'lastname', 'birthday', 'gender', 'phone', 'address', 'state', 'city', 'zip', 'congressionalDistrict', 'voterStatusDesc', 'voterStatusReasonDesc'];

    let potentialVoters = [];

    for (esDocument of esDocuments[state]) {
        // Build elastic query data for each document
        let searchJSON = {
            index: esDocument.type,
            type: esDocument.type,
            body: {
                _source: filterProps(esDocument, sourceFields),
                size: 100,
                query: {
                    bool: {
                        must: [],
                        should: []
                    }
                }
            }
        };

        // first name search query
        searchJSON.body.query.bool.must.push(buildMatch(esDocument.firstname, {
            query: firstname,
            fuzziness: 'auto',
        }));

        // last name search query
        searchJSON.body.query.bool.must.push(buildMatch(esDocument.lastname, lastname));

        // phone search query
        if (esDocument.hasOwnProperty('phone')) {
            searchJSON.body.query.bool.should.push(buildMatch(esDocument.phone, phone));
        }

        // birthday search query
        searchJSON.body.query.bool.should.push(buildMatch(esDocument.birthday, birthday));

        // address search query
        searchJSON.body.query.bool.should.push(buildMultiMatch(addressFields.map(item => getPropertyValue(esDocument, item, null)), address));

        // search using elastic search
        const { body: votersData } = await client.search(searchJSON);

        // get actual potentialvoter format
        const voters = await votersData.hits.hits.map(voter => ({
            _index: voter._index,
            _score: voter._score,
            id: voter._id,
            firstname: voter._source[esDocument.firstname],
            lastname: voter._source[esDocument.lastname],
            address: voter._source[esDocument.address],
            phone: esDocument.hasOwnProperty('phone') ? voter._source[esDocument.phone] : '',
            birthday: voter._source[esDocument.birthday],
            gender: voter._source[esDocument.gender],
            state: voter._source[esDocument.state],
            congressionalDistrict: voter._source[esDocument.congressionalDistrict],
            voterStatusDesc: esDocument.hasOwnProperty('voterStatusDesc') ? voter._source[esDocument.voterStatusDesc] : 'INACTIVE',
            voterStatusReasonDesc: esDocument.hasOwnProperty('voterStatusReasonDesc') ? voter._source[esDocument.voterStatusReasonDesc] : voterStatusReasonDesc[esDocument.state],
            probability: exports.calculatePotentialVoterProbability(
                {
                    firstname,
                    lastname,
                    address,
                    phone,
                    birthday,
                },
                {
                    firstname: voter._source[esDocument.firstname],
                    lastname: voter._source[esDocument.lastname],
                    address: voter._source[esDocument.address],
                    phone: esDocument.hasOwnProperty('phone') ? voter._source[esDocument.phone] : '',
                    birthday: voter._source[esDocument.birthday],
                    state: voter._source[esDocument.state],
                    city: voter._source[esDocument.city],
                    zip: voter._source[esDocument.zip],
                },
            ),
        }));

        await potentialVoters.push(...voters);
    }

    potentialVoters = potentialVoters.sort((a, b) => b._score - a._score);
    return { potentialVoters };
};

function getDateFromExcel(excelDate) {
    return moment((excelDate - 25569) * 86400 * 1000).format('DD.MM.YYYY')
}

const importFromXLS = async (file) => {
    const wb = XLSX.readFile(file, { sheetRows: 40000 });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const range = XLSX.utils.decode_range(sheet['!ref']);

    let headers = [], writeCounter = 0, entitiesToInsert = [];

    for (let C = range.s.c; C <= range.e.c; ++C) { //fill headers
        let cell_address = { c: C, r: 0 };
        let cell_ref = XLSX.utils.encode_cell(cell_address);
        const cell = sheet[cell_ref] ? sheet[cell_ref].v : 'empty';
        headers.push(cell.replace(/ /g, '_').replace(/`/g, '')) //headers have camel case and _. Strange logic, should be changed.
    }


    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        let newEntity = {};
        for (let C = range.s.c; C <= range.e.c; ++C) {
            let cell_address = { c: C, r: R };
            let cell_ref = XLSX.utils.encode_cell(cell_address);
            let cell = sheet[cell_ref] ? sheet[cell_ref].v : '';
            if (!cell) cell = '';
            if (headers[C] === 'Birth_Date') {
                cell = getDateFromExcel(cell)
            }
            newEntity[headers[C]] = cell.toString();
        }

        entitiesToInsert.push({
            index: {
                _index: 'first_type',
                _type: 'first_type',
            }
        });
        entitiesToInsert.push(newEntity);
        if (entitiesToInsert.length > 300) {
            const lastMemoryUsage = Math.ceil(process.memoryUsage().heapUsed / 1024 / 1024);
            client.bulk({ body: entitiesToInsert })
                .then((res) => {
                    writeCounter = writeCounter + res.body.items.length;
                    res.body.items.forEach(item => {
                        if (item.index.error) {
                            console.log(item.index.error);
                            writeCounter--;
                        }
                    });
                    console.log(writeCounter + ' added, memory: ' + lastMemoryUsage)
                });

            await timeout(100);
            entitiesToInsert = []
        }
    }
};

exports.searchByQuery = async (query, state) => {
    let potentialVoters = [];
    const sourceFields = ['firstname', 'lastname', 'birthday', 'gender', 'phone', 'address', 'state', 'city', 'zip', 'congressionalDistrict', 'voterStatusDesc', 'voterStatusReasonDesc', 'voterRegistrationNumber'];
    const searchFields = ['firstname', 'lastname', 'birthday', 'phone', 'address', 'state', 'city', 'zip', 'extraAddressLine', 'zipPlus', 
        'mailAddr1', 'mailAddr2', 'mailAddr3', 'mailAddr4', 'mailingCity', 'mailingState', 'mailingZipCode', 'mailingZipPlus', 'mailingCountry'];

    if (!esDocuments.hasOwnProperty(state)) {
        return potentialVoters;
    }
    
    for (esDocument of esDocuments[state]) {
        // Build elastic query data for each document
        let searchJSON = {
            index: esDocument.type,
            type: esDocument.type,
            body: {
                size: 1000,
                _source: filterProps(esDocument, sourceFields),
                query: {
                    multi_match: {
                        query,
                        type: 'cross_fields',
                        fields: filterProps(esDocument, searchFields),
                    }
                }
            }
        };

        // search using elastic search
        const { body: votersData } = await client.search(searchJSON);

        // get actual potentialvoter format
        const voters = await votersData.hits.hits.map((voter) => ({
            _index: voter._index,
            _score: voter._score,
            id: voter._id,
            firstname: voter._source[esDocument.firstname],
            lastname: voter._source[esDocument.lastname],
            address: voter._source[esDocument.address],
            phone: esDocument.hasOwnProperty('phone') ? voter._source[esDocument.phone] : '',
            birthday: voter._source[esDocument.birthday],
            gender: voter._source[esDocument.gender],
            state: voter._source[esDocument.state],
            congressionalDistrict: voter._source[esDocument.congressionalDistrict],
            voterStatusDesc: esDocument.hasOwnProperty('voterStatusDesc') ? voter._source[esDocument.voterStatusDesc] : 'INACTIVE',
            voterStatusReasonDesc: esDocument.hasOwnProperty('voterStatusReasonDesc') ? voter._source[esDocument.voterStatusReasonDesc] : voterStatusReasonDesc[esDocument.state],
        }));

        await potentialVoters.push(...voters);
    }

    potentialVoters = potentialVoters.sort((a, b) => b._score - a._score);
    return { potentialVoters };
};

exports.getVoterFromElastic = async (elasticId, _index) => {
    const result = await client.get({
        index: _index,
        type: _index,
        id: elasticId,
    });

    for (const esDocument of esDocuments) {
        if (_index === esDocument.type) {
            let res_obj = {
                _index: result.body._index,
                _score: result.body._score,
                id: result.body._id,
                firstname: result.body._source[esDocument.firstname],
                lastname: result.body._source[esDocument.lastname],
                address: result.body._source[esDocument.address],
                phone: esDocument.hasOwnProperty('phone') ? result.body._source[esDocument.phone] : '',
                birthday: result.body._source[esDocument.birthday],
                gender: result.body._source[esDocument.gender],
                state: result.body._source[esDocument.state],
                congressionalDistrict: result.body._source[esDocument.congressionalDistrict],
                details: {
                    ...result.body._source,
                    voter_status_desc: undefined,
                    voter_status_reason_desc: undefined,
                },
            };
            if (esDocument.hasOwnProperty('voterStatusDesc')) {
                res_obj['voterStatusDesc'] = result.body._source[esDocument.voterStatusDesc];
            }
            if (esDocument.hasOwnProperty('voterStatusReasonDesc')) {
                res_obj['voterStatusReasonDesc'] = result.body._source[esDocument.voterStatusReasonDesc];
            }
            return res_obj;
        }
    }
};

const timeout = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const importFromTXT = async (file, type) => { //type: $enum: ['second_type', 'third_type'].
    let readStream = fs.createReadStream(file);
    let remnant = '', headers = null, readCounter = 0, writeCounter = 0, entitiesToInsert = [];

    readStream
        .on('data', async function (chunk) {
            //join remnant from prev iteration, replace " symbols, split by next line
            let rowsArray = (remnant + chunk.toString('utf8').replace(/"/g, '')).split("\r\n");

            rowsArray.forEach((row, index) => {
                if (index < rowsArray.length - 1) {
                    row = row.split("\t"); //split by tab symbol
                    if (!headers) { //fill headers
                        headers = row;
                    } else {
                        readCounter++;
                        let newEntity = {};
                        headers.forEach((header, i) => {
                            if (!row[i]) row[i] = '';
                            newEntity[header] = row[i].toString()
                        });
                        entitiesToInsert.push({
                            index: {
                                _index: type,
                                _type: type,
                            }
                        });
                        entitiesToInsert.push(newEntity);
                    }
                } else {
                    remnant = row;
                }
            });
            const lastMemoryUsage = Math.ceil(process.memoryUsage().heapUsed / 1024 / 1024);

            client.bulk({ body: entitiesToInsert })
                .then((res) => {
                    writeCounter = writeCounter + res.body.items.length;
                    res.body.items.forEach(item => {
                        if (item.index.error) {
                            console.log(item.index.error);
                            writeCounter--;
                        }
                    });
                    console.log(writeCounter + ' added')
                });
            readStream.pause();
            await timeout(100);
            readStream.resume();
            entitiesToInsert = [];
            console.log(readCounter + ' read, memory: ' + lastMemoryUsage)

        })
        .on('end', function () {
            console.log('end')
        });
};

exports.getVoterHistory = async (voterRegNum, state) => {
    // search using elastic search
    let voterHistory = [];

    if (!esDocuments.hasOwnProperty(state)) {
        return voterHistory;
    }
    
    for (const esVoterHistoryDocument of esVoterHistoryDocuments[state]) {
        const searchJSON = {
            index: esVoterHistoryDocument.type,
            type: esVoterHistoryDocument.type,
            body: {
                size: 1000,
                _source: [],
                query: {
                    term: {}
                }
            }
        };

        for (const source in esVoterHistoryDocument) {
            if (esVoterHistoryDocument.hasOwnProperty(source) && source !== 'type') {
                searchJSON.body._source.push(esVoterHistoryDocument[source]);
            }
        }

        searchJSON.body.query.term[esVoterHistoryDocument.voterRegNum] = {};
        searchJSON.body.query.term[esVoterHistoryDocument.voterRegNum]['value'] = voterRegNum;
    
        const { body: historyData } = await client.search(searchJSON);
        const histories = await historyData.hits.hits.map((history) => {
            let historyObject = {};
            for (const source in esVoterHistoryDocument) {
                if (esVoterHistoryDocument.hasOwnProperty(source) && source !== 'type') {
                    historyObject[source] = history._source[esVoterHistoryDocument[source]];
                }
            }
            return historyObject;
        });
        voterHistory.push(...histories);

    }

    return { voterHistory };
};
