const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');
const path = require("path")
const fs = require("fs")

const express = require('express');
const app = express();

const https = require("https").createServer({
    rejectUnauthorized: false,
    cert: fs.readFileSync("crt.pem"),
    key: fs.readFileSync("key.pem")
  }, app)
const io = require('socket.io')(https);
const port = (process.env.PORT || 443);


let liveData = [];
let predictionDone = false;

let model;

app.use('/record', express.static(__dirname + '/public'));
app.use("/", express.static(path.join(__dirname, "/")))

// utilities
const readDir = () => 
    new Promise((resolve, reject) => fs.readdir(`data`, "utf8", (err, data) => err ? reject(err) : resolve(data)));

async function gestureClasses () {
    const filenames = (await readDir()).filter(filename => !(/(^|\/)\.[^\/\.]/g).test(filename));
    return  filenames.reduce((acc, filename) => {
       const gestureClass = filename.split("_")[0]
       if (!acc.includes(gestureClass))
         acc.push(gestureClass)
      return acc
     }, [])
  }

io.on('connection', async function(socket){
    model = await tf.loadLayersModel('file://model/model.json');
    socket.on('motion data', function(data){
        predictionDone = false;
        if(liveData.length < 300){
            liveData.push(data.xAcc, data.yAcc, data.zAcc, data.xGyro, data.yGyro, data.zGyro)
        }
    })

    socket.on('end motion data', function(){
        if(!predictionDone && liveData.length){
            predictionDone = true;
            predict(model, liveData);
            liveData = [];
        }
    })

    socket.on('connected', function(data){
        console.log('front end connected')
    })
});

async function predict (model, newSampleData) {
    const g = await gestureClasses()
    tf.tidy(() => {
        const inputData = newSampleData;
        const input = tf.tensor2d([inputData], [1, 300]);
        const predictOut = model.predict(input);
        const winner = g[predictOut.argMax(-1).dataSync()[0]];
        io.emit("predicted gesture", winner)
        console.log("predicted gesture: " + winner)
    });
}

https.listen(port);