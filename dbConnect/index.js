const mongoose = require('mongoose');
const config = require('../config');

const state = {
    connected: false,
};

const getConnectionString = () => {
    if (config.mongo.connectionString) {
        return config.mongo.connectionString;
    }
    return `mongodb://${config.mongo.host}:${config.mongo.port}/${config.mongo.database}`;
};

exports.connect = () => {
    if (state.connected) {
        return;
    }

    mongoose.connect(getConnectionString(), config.mongo.options);

    mongoose.connection.on('error', (err) => {
        console.log('***** Not connected to database .....');
        console.log(err);
        process.exit(1);
    });

    mongoose.connection.once('open', () => {
        console.log('***** Connected to database .....');
        state.connected = true;
    });

    mongoose.connection.on('disconnected', function(){
        console.log("Mongoose default connection is disconnected");
    });
    
    process.on('SIGINT', function(){
        mongoose.connection.close(function(){
          console.log("Mongoose default connection is disconnected due to application termination");
           process.exit(0);
          });
    });
};

exports.get = () => mongoose.connection;
