'use strict';

let express = require('express');
let app = express();
let bodyParser = require('body-parser');
let passService = require('./services/passwordService');
let jwt = require('jsonwebtoken');
let morgan = require('morgan');
let secret = require('config').get('secret');

let models = require('./models');
let UserObject = models.User;
let CustomLocationObject = models.CustomLocation;
let EventObject = models.Event;
CustomLocationObject.hasMany(EventObject, {
    foreignKey: 'custom_location_id',
});
EventObject.belongsTo(CustomLocationObject, {
    foreignKey: 'custom_location_id',
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));
app.use(morgan('combined'));

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8000');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,authorization');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.get('/listAllLocations', function (req, res) {
    CustomLocationObject.findAll({order: 'date DESC',
        include: [{model: EventObject}]
        })
        .then(function (allLocations) {
            res.send(allLocations);
        });
});

app.get('/locationsBackTo/:inputDate', function (req, res) {
    console.log(req.params.inputDate);
    //TODO validate date input
    CustomLocationObject.findAll({order: 'date DESC',
        include: [{
            model: EventObject,
            where: {
                date: {
                    $gt: req.params.inputDate,
                },
            }
        }],
    })
        .then(function (allLocations) {
            res.send(allLocations);
        });
});

app.get('/eventsFromTo/:fromDate/:toDate', function (req, res) {
    console.log(req.params.fromDate);
    //TODO validate date input
    CustomLocationObject.findAll({order: 'date DESC',
        include: [{
            model: EventObject,
            where: {
                date: {
                    $gt: req.params.fromDate,
                    $lt: req.params.toDate
                },
            }
        }],
    })
        .then(function (allLocations) {
            res.send(allLocations);
        });
});

app.get('/listLocations/:pageNumber/:fromDate/:toDate', function (req, res) {
    let start = (req.params.pageNumber - 1) * 5;
    CustomLocationObject.findAll({
        order: 'date DESC',
        include: [{
            model: EventObject,
            where: {
                date: {
                    $gte: req.params.fromDate,
                    $lte: req.params.toDate
                },
            }
        }],
        })
        .then(function (allLocations) {
            let resData = {
                locationsArray: allLocations.slice(start, start + 5),
                totalCount : allLocations.length
            };
            res.send(resData);
        });
});

// -------------- LOCATION
app.get('/location/:id', function (req, res) {
    try {
        let tokenFromUser = req.headers.authorization;
        console.log(tokenFromUser);
        let decoded = jwt.verify(tokenFromUser, secret);
        console.log(decoded);

        let locationId = req.params.id;
        CustomLocationObject.findAll({
            include: {model: EventObject},
            where: {id: locationId}
        }).then(function (location) {
            if (location[0]) {
                res.send(location[0]);
            } else {
                res.status(404).send({message: 'No such location'})
            }
        })
    } catch(err) {
        res.status(400).send({message: "Server error. Please try again or contact support"});
        console.log(err);
    }

});

app.put('/location/:id', function (req, res) {

    CustomLocationObject.update({
        name : req.body.name,
        color: req.body.color
    }, {
        where: {
            id : req.params.id
        }
    }).then(function (location) {
        res.send(location);
    })
});

app.post('/location', function (req, res) {
    let eventBuild = {
        name: req.body.eventName,
        details: req.body.eventDescription,
        date: req.body.eventDate
    };
    CustomLocationObject.findAll({
        where : {
            latitude: req.body.latitude,
            longitude: req.body.longitude
        }
    }).then(function (loc) {
        if (loc.length === 0) {
            let newCustomLocationBuild = {
                name: req.body.name,
                latitude: req.body.latitude,
                longitude: req.body.longitude,
                color: req.body.color
            };
            let newCustomLocation = CustomLocationObject.build(newCustomLocationBuild);
            newCustomLocation.save().then(function (loc) {
                console.log(loc);
                eventBuild.custom_location_id = loc.dataValues.id;
                let newEvent = EventObject.build(eventBuild);
                newEvent.save().then(function (ev) {
                    res.send({
                        'location': loc,
                        'event': ev
                    });
                });
            });
        } else {
            eventBuild.custom_location_id = loc[0].id;
            let newEvent = EventObject.build(eventBuild);
            newEvent.save().then(function (ev) {
                res.send({
                    'location': newEvent,
                    'event': ev
                })
            });
        }
    });
});


// ------------- EVENT
app.get('/event/:id', function (req, res) {
    let locationId = req.params.id;
    EventObject.findAll({
        where: {id: locationId},
    }).then(function (event) {
        res.send(event[0]);
    })
});

app.put('/event/:id', function (req, res) {

    EventObject.update({
        name : req.body.name,
        date: req.body.date,
        details: req.body.details,
    }, {
        where: {
            id : req.params.id
        }
    }).then(function (event) {
        console.log(event);
        res.send(event);
    })
});

// ------------- USER
app.post('/register', function (req, res) {
    if (req.body.password !== req.body.confirm) {
        res.send(400, {
            "Message": "The request is invalid.",
            "ModelState": {
                "model.ConfirmPassword": [
                    "The password and confirmation password do not match."
                ]
            }
        });
    } else {
        req.body.password = passService.generateHash(req.body.password);
        let newUser = UserObject.build(req.body);
        newUser.save();
        res.send({message: 'user created successfully'});
    }
});

app.post('/login', function (req, res) {
    UserObject.findOne({
        where: {
            username: req.body.username
        }
    }).then(function (user) {
        if (!user) {
            res.status(401).send({message: 'Authentication failed. User not found.'})
        }
        if (passService.generateHash(req.body.password) !== user.password) {
            res.status(401).send({"message": "Incorrect password"})
        } else {
            let token = jwt.sign({username: user.username}, secret, { expiresIn: '1h' });
            res.send({
                "message": "logged in successfully",
                "userName": user.username,
                "token": token
            })
        }
    });

});

app.post('/changePassword', function (req, res) {

    if (req.body.newPassword !== req.body.confirmPassword) {
        res.send(400, {
            "Message": "The password and confirmation password do not match.",
            "ModelState": {
                "model.ConfirmPassword": [
                    "The password and confirmation password do not match."
                ]
            }
        });
    }  else {


        UserObject.findOne({
            where: {
                username: req.body.username
            }
        }).then(function (user) {
            if (!user) {
                res.status(401).send({Message: 'Authentication failed. User not found.'})
            }
            if (passService.generateHash(req.body.oldPassword) !== user.password) {
                res.status(401).send({"Message": "Incorrect password"})
            } else {
                UserObject.update({
                    password : passService.generateHash(req.body.newPassword)
                }, {
                    where: {
                        username: req.body.username
                    }
                }).then(function (data) {
                    let token = jwt.sign({username: user.username}, secret, { expiresIn: '1h' });
                    res.send({
                        "message": "password changed successfully",
                        "userName": user.username,
                        "token": token
                    });
                    console.log(data);
                });

            }
        });



    }
});

app.listen(3000, function () {
    console.log('Listening to port 3000');
});
