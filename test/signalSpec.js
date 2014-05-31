var assert = require("assert");
var server = require("../lib/signalling");
var WebSocket = require("ws");

var WebSocketServer = require("ws").Server;

// This test series uses a real WebSocketServer
// But the implementation is coded against EventEmitter
function signal(port) {
  var transport = new WebSocketServer({port:port, clientTracking:true});
  return server.listen(transport); 
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
    var candidate = JSON.stringify({source: "dan", target:"steve", candidate:"sdp:asdf"});
    var dan = ws();
    dan.on("open", function (){
      dan.send(JSON.stringify({register:"dan"}));
    }).once("message", function (data, flags){
      assert.equal("ack registered dan", data);
      var steve = ws();
      steve.on("open", function (){
        steve.send(JSON.stringify({register:"steve"})); 
      });
      steve.once("message", function (s,p) {
        assert.equal("ack registered steve", s);
        steve.on("message", function (c, fa){
          assert.equal(c, candidate);
          done();
        });
        dan.send(candidate);
      });
    });
  });

  it("should not hold stale (closed) registered connections", function (done) {
    signal(++debugPort);
    ws().on("open", function(){
      this.send(JSON.stringify({register:"dan"}));
    }).once("message", function (data,flags){
      assert.equal("ack registered dan", data);
      this.close();
      ws().on("open", function (){
        this.send("list registered users")     
      }).once("message", function (d2, f2){
        assert.equal(d2, "[]");
        done();
      });
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
