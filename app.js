const express = require('express');
const app = express();
const fs = require('fs');

const port = !!process.env.PORT ? process.env.PORT : 3000;
const logOn = !!process.env.LOG_ON ? process.env.LOG_ON :  false;

// Parse application/x-amz-json-1.1
app.use (function(req, res, next) {
    let data='';
    req.setEncoding('utf8');
    
    req.on('data', function(chunk) { 
       data += chunk;
    });

    req.on('end', function() {
        req.body = JSON.parse(data);
        next();
    });
});

app.listen(port, () => {
    log(`Server is running at ${port}`);
});

app.post('/', (req, res) => {
    const secrets = JSON.parse(fs.readFileSync('secrets.json'));

    const target = req.header('X-Amz-Target');
    log(target);
    log(req.body);

    let result = null;
    switch(target) {
        case "AmazonSSM.GetParameter": result = GetParameter(secrets, req); break;
        case "AmazonSSM.GetParameters": result = GetParameters(secrets, req); break;
        default:
            throw Error(`Not implemented target: ${target}`);
    }

    log(result);
    res.send(result);
});

function log(message) {
    if (!logOn) {
        return;
    }

    console.log(message);
}

function GetParameter(secrets, req) {
    if (!secrets.hasOwnProperty(req.body.Name)) {
        throw Error(`Not implemented parameter: ${req.body.Name}`);
    }

    return {
        "Parameter": {
            "Name": req.body.Name,
            "Type": "String",
            "Value": secrets[req.body.Name],
            "Version": 1
        }
    };
}

function GetParameters(secrets, req) {
    const parameters = [];
    const invalidParameters = [];

    for (const name of req.body.Names) {
        if (!secrets.hasOwnProperty(name)) {
            invalidParameters.push(name);
        } else {
            parameters.push({
                    "Name": name,
                    "Type": "String",
                    "Value": secrets[name],
                    "Version": 1
            });
        }
    }

    return {
        "InvalidParameters": invalidParameters,
        "Parameters": parameters
    };
}