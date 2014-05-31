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

  it("should respond to a ping with type:'ack-ping'", function (done){
    signal(++debugPort);
    ws().on("open", function () {
      this.send(JSON.stringify({type:'ping'}));
    }).once("message", function (data, flags){
      var x = JSON.parse(data);
      assert.equal(x.type, "ack-ping"); 
      done(); 
    });
  });

  it("should allow client registration of the form {type:'command', command:'register-username', username:...}", function (done) {
    signal(++debugPort);
    ws().on("open", function(){
      this.send(JSON.stringify({type:'command', command:'register-username', username:"dan"}));
    }).once("message", function (data, flags){
      var d = JSON.parse(data);
      assert.equal(d.type, "ack-register-username"); 
      this.send(JSON.stringify({type:"command", command:"list-registered-usernames"}));
      this.once("message", function (d2, f2){
        assert.equal(d2, JSON.stringify(["dan"])); 
        done();
      });
    });
  });

  it("should list ice servers stored on the server", function (done){
    signal(++debugPort);
    ws().on("open", function (){
      this.send(JSON.stringify({type:'command', command:"list-ice-servers"}));
    }).once("message", function (data, flags){
      var iceServers = JSON.parse(data);
      assert.equal(iceServers[0].url, "stun:stun.example.com");
      done();
    });
  });

  function describeCommand(commandType){
    it("should relay "+commandType+" to the intended recipient.", function (done){
      signal(++debugPort);
      var candidate = JSON.stringify({type:'command', command:'send-'+commandType, source: "dan", target:"steve", candidate:"sdp:asdf"});
      var dan = ws();
      dan.on("open", function (){
        dan.send(JSON.stringify({type:'command', command:'register-username', username:"dan"}));
      }).once("message", function (data, flags){
        var a = JSON.parse(data);
        assert.equal(a.type, 'ack-register-username');
        assert.equal(a.username, "dan");
        var steve = ws();
        steve.on("open", function (){
          steve.send(JSON.stringify({type:'command', command:'register-username', username:"steve"})); 
        });
        steve.once("message", function (s,p) {
          var b = JSON.parse(s);
          assert.equal(b.username, "steve");
          steve.on("message", function (z, fa){
            var c = JSON.parse(z);
            assert.equal(c.type, "command");
            assert.equal(c.command, "send-"+commandType);
            assert.equal(c.target, "steve");
            assert.equal(c.source, "dan");
            done();
          });
          dan.send(candidate);
          dan.once("message", function (d,f){
            var c = JSON.parse(d);
            assert.equal(c.type, "ack-send-"+commandType);
            assert.equal(c.username, "steve");
          });
        });
      });
    });
  }

  describeCommand("candidate");
  describeCommand("offer");
  describeCommand("answer");

  
  it("should not relay, and provide error for messages of unknown type", function (done){
    signal(++debugPort);
    var candidate = JSON.stringify({type:'googbles', source: "dan", target:"steve", otherkindofthing:"somecrap"});
    var dan = ws();
    dan.on("open", function (){
      dan.send(JSON.stringify({type:"command", command:"register-username", username:"dan"}));
    }).once("message", function (data, flags){
      var d = JSON.parse(data);
      assert.equal("ack-register-username", d.type);
      assert.equal("dan", d.username);
      var steve = ws();
      steve.on("open", function (){
        steve.send(JSON.stringify({type:"command", command:"register-username", username:"steve"})); 
      });
      steve.once("message", function (s,p) {
        var d = JSON.parse(s);
        assert.equal("ack-register-username", d.type);
        assert.equal(d.username, "steve");
        dan.send(candidate);
        dan.once("message", function (d,f){
          var e = JSON.parse(d);
          assert.equal(e.type,"error");
          assert.equal(e.error,"unknown message type");
          done();
        });
      });
    });
  });

  it("should not hold stale (closed) registered connections", function (done) {
    signal(++debugPort);
    ws().on("open", function(){
      this.send(JSON.stringify({type:'command', command:'register-username', username:'dan'}));
    }).once("message", function (data,flags){
      var d = JSON.parse(data);
      assert.equal("ack-register-username", d.type);
      assert.equal("dan", d.username);
      this.close();
      ws().on("open", function (){
        this.send(JSON.stringify({type:'command', command:"list-registered-usernames"}));     
      }).once("message", function (d2, f2){
        assert.equal(d2, "[]");
        done();
      });
    });
  });

  it("should respond to bad messages with error", function(done){
    signal(++debugPort);
    ws().on("open", function () {
      this.send("gobbledegook asl;kdjfioh4vna;ilooihjln;onp8n;e4n.zihyrpaohvln089237571-078456ohkvna;8l93475");
    }).once("message", function(data,flags){
      var d = JSON.parse(data);
      assert.equal(d.type, "error");
      done();
    });
  });

});
