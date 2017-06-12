'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('CustomLocation', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            name: 'id'
        },
        name: {
            type: DataTypes.STRING,
            field: 'name'
        },
        latitude: {
            type: DataTypes.DECIMAL(10, 5),
            field: 'latitude'
        },
        longitude: {
            type: DataTypes.DECIMAL(10, 5),
            field: 'longitude'
        },
        color: {
            type: DataTypes.STRING,
            field: 'color'
        }
    }, {
        tableName: 'custom_locations'
    });
};