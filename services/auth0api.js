const AuthenticationClient = require('auth0').AuthenticationClient;
const ManagementClient = require('auth0').ManagementClient;
const auth0Config = (require('../config')).auth0;

let state = {
    authentication: null,
    management: null
}

module.exports.init = async () => {
    if(auth0Config.domain === '' || auth0Config.clientId === '' || auth0Config.clientSecret === '') {
        console.log('Auth0 settings not found, authentication actions may not work.');
        return;
    }
    console.log('Initializing auth0 api module');
    if(state.authentication === null) {
        state.authentication = new AuthenticationClient({
            domain: auth0Config.domain,
            clientId: auth0Config.clientId,
            clientSecret: auth0Config.clientSecret
        });
        console.log('Created authentication client');
    }
    if(state.management === null) {
        let token = await state.authentication.clientCredentialsGrant({
            audience: `https://${auth0Config.domain}/api/v2/`,
        });
        console.log('Got management api token');
        state.management = new ManagementClient({
            token: token.access_token,
            domain: auth0Config.domain,
            scope: 'read:users read:users_app_metadata read:user_idp_tokens create:user_tickets',
        });
        console.log('Created management client');
    }
};

module.exports.get = () => {
    return state;
}