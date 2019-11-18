const { getDistrictsByAddress } = require('../services/civicApi');
const helper = require('../utility/helper')();


exports.getDistrictsByAddress = async (req, res) => {
    const { address } = req.query;
    try {
        const districts = await getDistrictsByAddress(address);
        return res
            .status(200)
            .json({
                status: 200,
                message: 'Districts successfully detected',
                districts,
            });
    } catch (error) {
        if (
            error.response
            && error.response.data
            && error.response.data.error
            && error.response.data.error.code === 400
        ) {
            return helper.response(400, 'Failed to parse address', res);
        }
        return helper.errorResponse(500, 'service_unavailable', 'Something went wrong, please try again later', 'BE-105' ,res);
    }
};
