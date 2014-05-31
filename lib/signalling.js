
module.exports.listen = function (transport) {
  var users = [];
  var iceServers = [{url:"stun:stun.example.com"}];
  
  transport.on('connection', function (connection) {
    connection.on('message', function(msg) {
      var json;
      if (msg.indexOf("{") === 0 || msg.indexOf("[") === 0){
        try { json = JSON.parse(msg); } catch (e) { console.log("Unable to JSON.parse message.", e);}
      }

      if(msg == "ping"){
        connection.send("ack ping");
      }
      else if (msg === "list ice servers") {
        connection.send(JSON.stringify(iceServers));
      }
      else if (msg === "list registered users"){
        connection.send(JSON.stringify(users));
      }
      else if (json && json.register){
        users.push(json.register); 
        connection.send("ack registered "+json.register);
      } 
      else if (msg === "list registered users") {
        connection.send(JSON.stringify(users));
      }
      else {
        connection.send("unknown message");
      }
    });
  });
  return transport;
};

