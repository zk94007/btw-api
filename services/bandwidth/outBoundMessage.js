/**
 *  Created by KennethObikwelu on 9/17/18.
 */

let helper = require('../../utility/helper');
let Bandwidth = require("node-bandwidth");
let client = new Bandwidth({
	userId   : 'u-5bkwxs44kgt5223bbwvn2pq',
	apiToken : 't-g7jiv7kq7lumwniewuprr5i',
	apiSecret: 'bggn7cl2uidvqfohnb2fid2og6qq2pxap4rokpq'
});

module.exports = () => {

	const buildMessage = (pollingLocation) => {
		let baseMessage= helper().retrieveMessage('pollingLocationSMS');
		return baseMessage.pollingLocation + '' +
			pollingLocation
	}

	const sendSMS = (payload, res) => {
		client.Message.send({
			from: '4154491381',
			to  : payload[0],
			text: buildMessage(payload[1])
		})
			.then((message) => {
				let logMessage = 'Message successfully sent to ' + payload[0] + ' with ' + message.id;
				helper().response(200, logMessage, res);
			})
			.catch((err) => {
				console.log(err.message);
				helper().response(500, 'Oops something went wrong', res);
			})
	}
	return {
		sendSMS
	}
}
