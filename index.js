var express = require("express");
var mongojs = require("mongojs");
var db = mongojs("sherry", ["options", "votes"]);
var mqtt = require("mqtt");

var mqttclient = mqtt.connect("mqtt://localhost");

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
  db.options.update({_id: db.ObjectId(req.params.id)}, {$inc: {votes: 1}});
  db.votes.insert({
    time: new Date().getTime(),
    option: db.ObjectId(req.params.id)
  });
  db.options.find({}, function(err, items){
    io.emit("data", items);
    var data = "";
    items.forEach(function(item, itemid){
      item.colour.push("");
      for(var i = 0; i < item.votes; i++){
          data += item.colour.join(",");
      }
    });
    mqttclient.publish("led", data);
  });
  res.sendStatus(200);
});

function sendvotestotree(){
  db.options.find({}, function(err, optionsdata){
    db.votes.find({}, function(err, votes){
      var options = {};
      optionsdata.forEach(function(option){
        options[option._id.toString()] = option;
      });
      var votecolours = [];
      votes.forEach(function(vote){
        votecolours.push(options[vote.option.toString()].colour);
      });
      console.log(votecolours);
    });
  });
}

sendvotestotree();
