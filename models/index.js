'use strict';

let Sequelize = require('sequelize');
let config = require('config').get('database');

let sequelize = new Sequelize(config.databaseName, config.user, config.password, {
    host: config.host,
    dialect: config.dialect
});

let models = [
    'User',
    'CustomLocation',
    'Event'
];

models.forEach(function (model) {
    exports[model] = sequelize.import(__dirname + '/' + model);
});

sequelize.sync();