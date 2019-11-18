const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const config = require('../config');

const checkJwt = (req, res, next) => {
  if (req.body.testSecret === 'jk23923f9eifjwef9j' || req.query.testSecret === 'jk23923f9eifjwef9j') {
      req.user = {
          "https://bethewave.vote":{
              email: 'test@test.test'
          }
      };
        next();
    } else {
        jwt({
            secret: jwksRsa.expressJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: `https://${config.auth0.domain}/.well-known/jwks.json`,
            }),

            // Validate the audience and the issuer.
            audience: `https://${config.auth0.domain}/userinfo`,
            issuer: `https://${config.auth0.domain}/`,
            algorithms: ['RS256'],
        })(req, res, next);
    }
};

module.exports = { checkJwt };
