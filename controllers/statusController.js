/**
 *  Created by KennethObikwelu on 9/3/19.
 */

const helper = require('../utility/helper')();

exports.checkApiStatus = async (req, res) => {
	return helper.response(200, 'api-turnoutnation.org is up as at ' + Date.now() , res);
}