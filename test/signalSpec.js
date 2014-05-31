var assert = require("assert");
var server = require("../lib/signalling");
var WebSocket = require("ws");

var WebSocketServer = require("ws").Server;

// This test series uses a real WebSocketServer
// But the implementation is coded against EventEmitter
function signal(port) {
  return server.listen(new WebSocketServer({port:port})); 
}

var debugPort = 8888;
function ws () {
  var url = "ws://localhost:"+debugPort;
  return new WebSocket(url);
}

describe("Signalling Server", function (){

  it("should listen without error", function (){
    signal(++debugPort);
  });

  it("should respond to a 'ping' with 'ack ping'", function (done){
    signal(++debugPort);
    ws().on("open", function () {
      this.send("ping");
    }).once("message", function (data, flags){
      assert.equal(data, "ack ping"); 
      done(); 
    });
  });

  it("should allow client registration of the form {register:'username'}", function (done) {
    signal(++debugPort);
    ws().on("open", function(){
      this.send(JSON.stringify({register:"dan"}));
    }).once("message", function (data, flags){
      assert.equal(data,"ack registered dan"); 
      this.send("list registered users");
      this.once("message", function (d2, f2){
        assert.equal(d2, JSON.stringify(["dan"])); 
        done();
      });
    });
  });

  it("should list ice servers stored on the server when sent 'list ice servers'", function (done){
    signal(++debugPort);
    ws().on("open", function (){
      this.send("list ice servers");
    }).once("message", function (data, flags){
      var iceServers = JSON.parse(data);
      assert.equal(iceServers[0].url, "stun:stun.example.com");
      done();
    });
  });

  it("should relay candidate sdp records to the intended recipient.", function (done){
    signal(++debugPort);
    ws().on("open", function (){
    }).once("message", function (data, flags){
      
    });
  
  });

  it("should respond to bad messages with 'unknown message'", function(done){
    signal(++debugPort);
    ws().on("open", function () {
      this.send("gobbledegook asl;kdjfioh4vna;ilooihjln;onp8n;e4n.zihyrpaohvln089237571-078456ohkvna;8l93475");
    }).once("message", function(data,flags){
      assert.equal("unknown message", data);
      done();
    });
  });

});
