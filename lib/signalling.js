var me = module.exports;

me.listen = function (transport) {
  var iceServers = [{url:"stun:stun.example.com"}];
  var clients = {};
  
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
        connection.send(JSON.stringify(Object.keys(clients)));
      }
      else if (json && json.source && json.target) {
        for (var client in clients){
          if (client === json.target){
            connection.send("ack candidate for "+json.target);
            clients[client].send(msg);
            return;
          }
        }
      }
      else if (json && json.register){
        clients[json.register] = connection;
        connection.on("close", function(){
          delete clients[json.register];
        });
        connection.send("ack registered "+json.register);
      } 
      else if (msg === "list registered users") {
        console.log(clients);
        connection.send(JSON.stringify(clients));
      }
      else {
        connection.send("unknown message");
      }

    });
  });
  return transport;
};

