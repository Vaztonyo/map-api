'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('Event', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            name: 'id'
        },
        custom_location_id: {
            type: DataTypes.INTEGER,

            references: {
                model: 'custom_locations',

                key: 'id',
            },
            name: 'custom_location_id'
        },
        name: {
            type: DataTypes.STRING,
            field: 'name'
        },
        details: {
            type: DataTypes.TEXT,
            field: 'details'
        },
        date: {
            type: DataTypes.DATEONLY,
            field: 'date'
        },
    });
};