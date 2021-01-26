// https://livecodestream.dev/post/go-serverless-with-nodejs-and-aws-lambda/
const fetch = require("node-fetch");

require('dotenv').config();

const sls = require("serverless-http");

const express = require("express");
const app = express();

var multer = require('multer');
var upload = multer();

// for parsing application/json
app.use(express.json());

// for parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// for parsing multipart/form-data
app.use(upload.array());
app.use(express.static('public'));

app.post("/monday/newPulse", (req, res) => {
    if (!req.body) {
        return res.sendStatus(400);
    }

    console.log("body", req.body);

    if (req.body.event != null && req.body.event.type == "create_pulse") {
        console.log("pulse id", req.body.event.pulseId);


    }

    res.json({ challenge: req.body.challenge }).status(200).send();
});

app.get("/monday/boards", (req, res) => {

    let query = '{ boards (limit:5) {name id} }';

    fetch("https://api.monday.com/v2", {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': process.env.MONDAY_TOKEN
        },
        body: JSON.stringify({
            'query': query
        })
    })
        .then(res => res.json())
        .then(res => console.log(JSON.stringify(res, null, 2)));

    res.status(200).send();
});

app.get("/test", (req, res) => {
    res.status(200).send();
});

module.exports.handler = sls(app);