'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('User', {
        username: {
            type: DataTypes.STRING,
            unique: true,
            field: 'username'
        },
        password: {
            type: DataTypes.STRING,
            field: 'password'
        }
    });
};