const express = require('express');
const app = express();
const bodyParser = require('body-parser');
let currentNodePort = process.argv[2];
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended : false}));

app.use(require('./routes/api'));

app.listen(currentNodePort,()=>{
    console.log(`Running on port ${currentNodePort}`);
})