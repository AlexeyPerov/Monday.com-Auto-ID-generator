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

// Monday.com webhook upon creation of the new pulse
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

// An API call to create a new pulse
app.post("/monday/createPulse", (req, res) => {
    if (!req.body) {
        return res.sendStatus(400);
    }

    const boardId = req.body.boardId;
    const contents = req.body.contents;

    const query = 'mutation{ create_item (board_id:' + boardId + 
        ', item_name:\"' + contents + '\") { id } }';
  
    try {
        fetchMondayQuery(query);
    } catch (e) {
        console.log('error', e);
    }    

    res.status(200).send();
});

// An API call to assign Auto ID to an existing pulse
app.post("/monday/assignId", (req, res) => {
    if (!req.body) {
        return res.sendStatus(400);
    }

    const pulseId = req.body.pulseId;
    const boardId = req.body.boardId;

    const query = 'mutation { change_simple_column_value (item_id:' + pulseId + ', board_id:' + boardId + ',' 
        + ' column_id:"gdd___notes", value:' +  '\"AOC-001\"' + ') { updated_at } }';

    try {
        fetchMondayQuery(query);
    } catch (e) {
        console.log('error', e);
    }    

    res.status(200).send();
});

app.get("/test", (req, res) => {
    res.status(200).send();
});

function fetchMondayQuery(query) {
    return fetch("https://api.monday.com/v2", {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': process.env.MONDAY_TOKEN
        },
        body: JSON.stringify({
            'query': query
        })
    })
    .then(response => {
        response.json()
            .then((data) => {
                    console.log(data)
                })
                .catch(error => console.log(error));
    })
    .catch(error => console.log(error));
}

module.exports.handler = sls(app);