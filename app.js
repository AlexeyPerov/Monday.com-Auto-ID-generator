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

// An API call to create a new pulse
app.post("/monday/createPulse", async (req, res) => {
    if (!req.body) {
        return res.sendStatus(400);
    }

    const boardId = req.body.boardId;
    const contents = req.body.contents;

    const query = 'mutation{ create_item (board_id:' + boardId + 
        ', item_name:\"' + contents + '\") { id } }';
  
    let result = await fetchMondayQuery(query);

    console.log('result', result);

    res.status(200).send();
});

// Monday.com webhook upon creation of the new pulse
app.post("/monday/newPulse", async (req, res) => {
    if (!req.body) {
        return res.sendStatus(400);
    }

    console.log("body", req.body);

    if (req.body.event != null && req.body.event.type == "create_pulse") {
        const pulseId = req.body.event.pulseId;
        const boardId = req.body.event.boardId;

        console.log("pulse id", req.body.event.pulseId);
        console.log("board id", req.body.event.boardId);

        const columnId = await detectIdColumnType(boardId);

        await assignPulseId(pulseId, boardId, columnId);
    }

    res.json({ challenge: req.body.challenge }).status(200).send();
});

// An API call to assign Auto ID to all pulses in a specified board
app.post("/monday/assignAllBoardIds", async (req, res) => {
    if (!req.body) {
        return res.sendStatus(400);
    }

    const boardId = req.body.boardId;

    const columnId = await detectIdColumnType(boardId);

    const boardQuery = '{boards(limit:1, ids:[' + boardId + '])' 
        + ' { id items { id } } }';
        
    var boardResult = await fetchMondayQuery(boardQuery);  
    console.log(JSON.stringify(boardResult, null, 2));
    const items = boardResult.data.boards[0].items;

    const length = items.length;

    for (var i = 0; i < length;i ++) {
        const pulseId = items[i].id;
        await assignPulseId(pulseId, boardId);
    }
    
    res.status(200).send();
});

// An API call to assign Auto ID to an existing pulse
app.post("/monday/assignId", async (req, res) => {
    if (!req.body) {
        return res.sendStatus(400);
    }

    const pulseId = req.body.pulseId;
    const boardId = req.body.boardId;

    const columnId = await detectIdColumnType(boardId);
    await assignPulseId(pulseId, boardId, columnId);

    res.status(200).send();
});

async function detectIdColumnType(boardId) {
    const boardQuery = '{boards(limit:1, ids:[' + boardId + '])' 
        + ' { id items (limit:1) { column_values{title id} } } }';
        
    var boardResult = await fetchMondayQuery(boardQuery);  

    const columns = boardResult.data.boards[0].items[0].column_values;
    const column = columns.find(column => column.title == 'ID');

    if (column == null) {
        throw new Error('Specified board doesn\'t contain ID column').send();
    }    

    return column.id;
}

async function assignPulseId(pulseId, boardId, columnId) {
    const id = await generateId();
    const fullId = 'AOC-' + id;

    const query = 'mutation { change_simple_column_value (item_id:' + pulseId + ', board_id:' + boardId + ',' 
        + ' column_id:"' + columnId + '", value:' +  '\"' + fullId + '\"' + ') { updated_at } }';

    var result = await fetchMondayQuery(query);  

    console.log('result', result);
}

var id = 0;

app.post("/set_id_counter", (req, res) => {
    console.log('new_value', req.new_counter);
    id = new_counter;
    res.status(200).send();
});

app.get("/get_id_counter", (req, res) => {    
    res.status(200).send(id);
});

app.get("/test", (req, res) => {
    res.status(200).send();
});

async function generateId() {
    id++;
    return id;
}

async function fetchMondayQuery(query) {
    let response = await fetch("https://api.monday.com/v2", {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': process.env.MONDAY_TOKEN
        },
        body: JSON.stringify({
            'query': query
        })
    });

    if (!response.ok) {
        throw new Error('HTTP error, status: ' + response.status);
    } else {
        return await response.json();
    }
}

module.exports.handler = sls(app);