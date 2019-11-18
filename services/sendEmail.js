require('ejs');
const mg = require('mailgun-js');
const activationEmailTemplate = require('../templates/activationEmailTemplate.ejs');
const resetPasswordEmailTemplate = require('../templates/resetPasswordEmailTemplate.ejs');
const config = require('../config');

const { api_key: apiKey, domain, from_whom: from } = config.mailgun;

const mailgun = mg({ apiKey, domain });

const sendEmail = params => mailgun.messages().send({ from, ...params });

const sendActivationEmail = (to, activationLink) => {
    const logoUrl = `${config.Origin_frontend}}/images/email-logo.png`;
    const text = `Please follow the link to confirm registration. ${activationLink}`;
    const html = activationEmailTemplate({ activationLink, logoUrl });
    const emailParams = {
        to,
        subject: 'Turnout Nation: complete your registration',
        text,
        html,
    };
    return sendEmail(emailParams);
};

const sendResetPasswordEmail = (to, resetPasswordLink) => {
    const logoUrl = `${config.Origin_frontend}}/images/email-logo.png`;
    const text = `Please follow the link to reset password. ${resetPasswordLink}`;
    const html = resetPasswordEmailTemplate({ resetPasswordLink, logoUrl });
    const emailParams = {
        to,
        subject: 'Turnout Nation: reset password request',
        text,
        html,
    };
    return sendEmail(emailParams);
};

module.exports = { sendEmail, sendActivationEmail, sendResetPasswordEmail };
