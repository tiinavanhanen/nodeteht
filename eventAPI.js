var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var url = require('url');
var mysql = require('mysql');
var db = require('./database');

var urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use(urlencodedParser);
app.use(bodyParser.json());

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

var con = mysql.createConnection(db.config());

app.get('/events', function (req, res) {
    var q = url.parse(req.url,true).query;
    var startDate = q.start;
    var endDate = q.end;
    var sql = "SELECT event_date.event_date, event.event_name, event.event_type, location.location_name"
        +" FROM event_date, event, location"
        +" WHERE event_date.event_id = event.id and event.location_id = location.id"
        +" and event_date.event_date >= ? and event_date.event_date <= ?"
        +" GROUP BY event.event_name"
        +" ORDER BY event_date.event_date";
    con.query(sql, [startDate, endDate], function (err, result) {
        if (err) {
            throw err;
        } else {
            res.send(JSON.stringify(result));
        }
    });
});

app.get('/api/location', function (req, res) {
    var q = url.parse(req.url,true).query;
    var name = q.name;
    var sql = "SELECT address FROM location WHERE location_name = ?";
    con.query(sql, [name], function (err, result) {
        if (result) {
            res.end((JSON.stringify(result)));
        } else {
            return res.send(err, result);
        }
    });
});

app.post('/api/addevent', urlencodedParser, function (req, res) {
    response = {
        eventName: req.body.eventName,
        eventType: req.body.eventType,
        eventDate: req.body.eventDate,
        eventLocation: req.body.eventLocation
    };
    var jsonObj = req.body;
    var locationID = -1;
    var eventID = -1;
    console.log(jsonObj);
    var sql = "SELECT id FROM location WHERE location_name = ?";
    con.query(sql, [jsonObj.eventLocation], function (err,result) {
        if (result) {
            if (result.length > 0) {
                locationID = result[0].id;
                console.log("id1.1:" + locationID);
                var sql3 = "INSERT INTO event (event_name, event_type, location_id) VALUES (?, ?, ?)";
                console.log("Id2: " + locationID);
                con.query(sql3, [jsonObj.eventName, jsonObj.eventType, locationID], function (err, result) {
                    if (result) {
                        eventID = result.insertId;
                        var sql4 = "INSERT INTO event_date VALUES (?, ?)";
                        con.query(sql4, [jsonObj.eventDate, eventID], function (err, result) {
                            if (result) {
                                console.log("Tiedot lisätty");
                            } else {
                                throw err;
                            }
                        });
                    } else {
                        throw err;
                    }
                });
            } else {
                var sql2 = "INSERT INTO location (location_name) VALUES (?)";
                con.query(sql2, [jsonObj.eventLocation], function (err, result) {
                    if (result) {
                        locationID = result.insertId;
                        console.log("id1.2:" + locationID);
                    } else {
                        throw err;
                    }
                    var sql3 = "INSERT INTO event (event_name, event_type, location_id) VALUES (?, ?, ?)";
                    console.log("Id2: " + locationID);
                    con.query(sql3, [jsonObj.eventName, jsonObj.eventType, locationID], function (err, result) {
                        if (result) {
                            eventID = result.insertId;
                            var sql4 = "INSERT INTO event_date VALUES (?, ?)";
                            con.query(sql4, [jsonObj.eventDate, eventID], function (err, result) {
                                if (result) {
                                    console.log("Tiedot lisätty");
                                } else {
                                    throw err;
                                }
                            });
                        } else {
                            throw err;
                        }
                    });
                });
            }
        } else {
            throw err;
        }
        res.end(JSON.stringify(response));
    });
});

module.exports = app;