const axios = require('axios');
const config = require('../config');
const District = require('../models/District');

const GOOGLE_CIVIC_API = 'https://www.googleapis.com/civicinfo/v2';


const serializeParams = params => Object
    .entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');

const parseOcdId = (ocdId) => {
    if (ocdId) {
        const parsedOcdId = {};
        ocdId
            .split('/')
            .forEach((division) => {
                const [key, value] = division.split(':');
                if (value) {
                    parsedOcdId[key] = value;
                }
            });
        return parsedOcdId;
    }
    return {};
};

const getAllDistricts = async () => {
    const params = {
        query: 'congressional district',
        key: config.google_civic_api_key,
    };
    const divisionSearchResponse = await axios.get(`${GOOGLE_CIVIC_API}/divisions?${serializeParams(params)}`);

    divisionSearchResponse.data.results.forEach((district) => {
        const parsedOcdId = parseOcdId(district.ocdId);
        const districtModel = new District({ ...district, ...parsedOcdId });
        districtModel.save();
    });

    return divisionSearchResponse.data.results;
};

const checkDistricts = async () => {
    if (await District.countDocuments() < 500) {
        await getAllDistricts();
    }
};

const getDistrictsByAddress = async (address) => {
    const params = {
        address,
        levels: 'country',
        includeOffices: false,
        key: config.google_civic_api_key,
    };
    const representativesData = await axios.get(`${GOOGLE_CIVIC_API}/representatives?${serializeParams(params)}`);

    const exactDistricts = Object
        .entries(representativesData && representativesData.data.divisions)
        .filter(([ocdId]) => !!parseOcdId(ocdId).cd)
        .map(([ocdId, value]) => ({ ocdId, name: value.name, ...parseOcdId(ocdId) }));

    if (exactDistricts && exactDistricts.length) {
        return exactDistricts;
    }

    const { normalizedInput } = representativesData.data;
    const stateDistricts = await District.find({ state: normalizedInput.state.toLowerCase() });
    return stateDistricts.sort((previousDistrict, nextDistrict) => previousDistrict.cd - nextDistrict.cd);
};

module.exports = {
    serializeParams,
    parseOcdId,
    getDistrictsByAddress,
    getAllDistricts,
    checkDistricts,
};
