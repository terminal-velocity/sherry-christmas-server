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

app.get("/admin/options/", function(req, res){
  db.options.find(function(err, items){
    res.json(items);
  });
});

app.delete("/admin/options/:id", function(req, res){
  db.options.remove({_id: db.ObjectId(req.params.id)}, function(){
    res.sendStatus(200);
  });
});

app.post("/admin/options/", function(req, res){

});

app.get("/vote/:id", function(req, res){
  db.options.update({_id: db.ObjectId(req.params.id)}, {$inc: {votes: 1}});
  db.options.find({}, function(err, items){
    io.emit("data", items);
    items.forEach(function(item, itemid){
      console.log("items");
      item.colour.forEach(function(colour, colourid){
          for(var i = 0; i < item.votes; i++){
            mqttclient.publish("led/" + (itemid + i) + "/" + colourid, colour.toString());
          }
      });
    });
  });
  res.sendStatus(200);
});
