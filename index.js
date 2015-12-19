var express = require("express");
var mongojs = require("mongojs");
var db = mongojs("192.168.3.97/sherry", ["options", "votes"]);
var mqtt = require("mqtt");

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
  db.options.update({_id: db.ObjectId(req.params.id)}, {$inc: {votes: 1}});
  db.options.find({}, function(err, items){
    io.emit("data", items);
    items.forEach(function(item, itemid){
      item.colour.push("");
      for(var i = 0; i < item.votes; i++){
        mqttclient.publish("led/" + (itemid + i), item.colour.join(","));
      }
    });
  });
  res.sendStatus(200);
});
