'use strict';

let express = require('express');
let app = express();
let bodyParser = require('body-parser');
let passService = require('./services/passwordService');
let jwt = require('jsonwebtoken');
let morgan = require('morgan');

let models = require('./models');
let UserObject = models.User;
let CustomLocationObject = models.CustomLocation;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));
app.use(morgan('combined'));

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8000');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});


app.get('/listLocations/:pageNumber', function (req, res) {
    let start = (req.params.pageNumber - 1) * 5;
    CustomLocationObject.findAll({order: 'date DESC'})
        .then(function (allLocations) {
            let resData = {
                locationsArray: allLocations.slice(start, start + 5),
                totalCount : allLocations.length
            };
            res.send(resData);
        });
});

app.post('/location', function (req, res) {
   let newCustomLocation = CustomLocationObject.build(req.body);
   newCustomLocation.save();
   res.send("ok");
});

app.get('/location/:id', function (req, res) {
    let locationId = req.params.id;
    CustomLocationObject.findById(locationId).then(function (location) {
        res.send(location);
    })
});

app.post('/register', function (req, res) {
    if (req.body.password != req.body.confirm) {
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
        if (passService.generateHash(req.body.password) != user.password) {
            res.status(401).send({"message": "Incorrect password"})
        } else {
            let token = jwt.sign({username: user.username}, 'ragnar', { expiresIn: '1h' });
            res.send({
                "message": "logged in successfully",
                "userName": user.username,
                "token": token
            })
        }
    });

});

app.listen(3000, function () {
    console.log('Listening to port 3000');
});
