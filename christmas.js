var mqtt = require("mqtt");
var mqttclient = mqtt.connect("mqtt://localhost");

function red(){
  mqttclient.publish("led", "255,0,0,0,255,0,".repeat(25));
  setTimeout(green, 1000);
}

function green(){
  mqttclient.publish("led", "0,255,0,255,0,0,".repeat(25));
  setTimeout(red, 1000);
}

red();
