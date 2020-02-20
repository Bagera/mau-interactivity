const express = require('express');
const app = express();
const fs = require("fs")
const path = require("path")
const https = require("https").createServer({
    rejectUnauthorized: false,
    cert: fs.readFileSync("crt.pem"),
    key: fs.readFileSync("key.pem")
  }, app)
const io = require('socket.io')(https);
const port = (process.env.PORT || 443);

let stream;
let sampleNumber;
let gestureType;
let previousSampleNumber;

app.use('/record', express.static(__dirname + '/public'));
app.use("/", express.static(path.join(__dirname, "/")))

process.argv.forEach(function (val, index, array) {
    gestureType = array[2];
    sampleNumber = parseInt(array[3]);
    if ((gestureType === undefined) || (sampleNumber === undefined)) {
        console.log("Error: Remember to pass gesture type and sample number parameters")
        process.exit();
    } 
    previousSampleNumber = sampleNumber;
    stream = fs.createWriteStream(`data/${gestureType}_${sampleNumber}.txt`, {flags:'a'});
});

io.on('connection', function(socket){
    socket.emit("training")
  
    socket.on('motion data', function(data){
        if(sampleNumber !== previousSampleNumber){
            stream = fs.createWriteStream(`./data/${gestureType}_${sampleNumber}.txt`, {flags:'a'});
        }
        stream.write(`${data}\r\n`);
    })

    socket.on('end motion data', function(){
        stream.end();
        sampleNumber++;
    })

    socket.on("recording-started", () => {
        console.log(`Recording started (sample ${sampleNumber})`)
    })

    socket.on("recording-stopped", () => {
        console.log("Recording stopped")
    })

    socket.on('connected', (data) => {
        console.log('front end connected')
    })
}); 


https.listen(port, () => {
    console.log(`On port ${port} ready to record gestures...`)
}
);