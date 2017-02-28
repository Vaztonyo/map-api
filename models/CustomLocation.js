'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('CustomLocation', {
        name: {
            type: DataTypes.STRING,
            field: 'name'
        },
        description: {
            type: DataTypes.STRING,
            field: 'description'
        },
        latitude: {
            type: DataTypes.DECIMAL(10, 5),
            field: 'latitude'
        },
        longitude: {
            type: DataTypes.DECIMAL(10, 5),
            field: 'longitude'
        },
        date: {
            type: DataTypes.DATE,
            field: 'date'
        },
        color: {
            type: DataTypes.STRING,
            field: 'color'
        }
    }, {
        tableName: 'custom_locations'
    });
};