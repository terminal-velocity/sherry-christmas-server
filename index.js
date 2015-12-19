var express = require("express");
var mongojs = require("mongojs");
var db = mongojs("192.168.3.97/sherry", ["options", "votes"]);
var mqtt = require("mqtt");
var smooth = require("./smooth.js");

var mqttclient = mqtt.connect("mqtt://192.168.3.97");

var app = express();
var server = app.listen(9001);
var io = require("socket.io").listen(server);

mqttclient.publish("test", "hello world");

app.get("/", function(req, res){
  res.sendFile(__dirname + "/client/index.html");
});

app.get("/options/", function(req, res){
  db.options.find(function(err, items){
    res.json(items);
  });
});

app.delete("/options/:id", function(req, res){
  db.options.remove({_id: db.ObjectId(req.params.id)}, function(){
    res.sendStatus(200);
  });
});

app.get("/vote/:id", function(req, res){
  db.options.update({_id: db.ObjectId(req.params.id)}, {$inc: {votes: 1}}, function(){
    db.votes.insert({
      time: new Date().getTime(),
      option: db.ObjectId(req.params.id)
    }, function(){
      db.options.find({}, function(err, items){
        io.emit("data", items);
        sendvotestotree();
        res.sendStatus(200);
      });
    });
  });
});

function sendvotestotree(){
  db.options.find({}, function(err, optionsdata){
    db.votes.find().sort({time: 1}, function(err, votes){
      var options = {};
      optionsdata.forEach(function(option){
        options[option._id.toString()] = option;
      });
      var votecolours = [];
      votes.forEach(function(vote){
        votecolours.push(options[vote.option.toString()].colour);
      });
      var smoothfunction = smooth(votecolours, {scaleTo: 49, method: "linear"});
      var leds = [];
      for(var i = 0; i < 50; i++){
        var data = smoothfunction(i);
        leds.push(Math.round(data[0]), Math.round(data[1] * 0.6), Math.round(data[2] * 0.75));
      }
      var ledvalues = [];
      leds.forEach(function(led){
        ledvalues.push(led);
      });
      mqttclient.publish("led", ledvalues.join(",") + ",");
    });
  });
}
