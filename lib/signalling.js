var me = module.exports;

me.listen = function (transport) {
  var iceServers = [{url:"stun:stun.example.com"}];
  var clients = {};

  function send(client, message){
    client.send(JSON.stringify(message));
    return client;
  }

  function registerUser(connection, json){
    if (json.username) {
      var client = getClient(json.username);
      if(client){
        send(connection, {type:'ack-register-username', error:"username already registered"});
      } else {
        clients[json.username] = connection;
        connection.on("close", function(){
          delete clients[json.username];
        });
        send(connection, {type:'ack-register-username', username:json.username});
      }
    } else {
      send(connection, {type:'ack-register-username', error:"no username provided"});
    }
  } 

  function sendCandidate(connection, message){
    var client = getClient(message.target); 
    if(client){
      send(connection, {type:'ack-send-candidate', username:message.target});
      send(client, message);
    } else {
      send(connection, {type:'ack-send-candidate', username:message.target, success:false, error:'not found'});
    }
  }

  function sendOffer(connection, message){
    var client = getClient(message.target); 
    if(client){
      send(connection, {type:'ack-send-offer', username:message.target});
      send(client, message);
    } else {
      send(connection, {type:'ack-send-offer', username:message.target, success:false, error:'not found'});
    }
  }

  function sendAnswer(connection, message){
    var client = getClient(message.target); 
    if(client){
      send(connection, {type:'ack-send-answer', username:message.target});
      send(client, message);
    } else {
      send(connection, {type:'ack-send-answer', username:message.target, success:false, error:'not found'});
    }
  }

  function getClient(username){
    return clients[username]; 
  }

  function handleCommand(connection, message) {
    switch(message.command) {
      case 'list-ice-servers':          send(connection, iceServers);                 break;
      case 'list-registered-usernames': send(connection, Object.keys(clients));       break; 
      case 'send-candidate':            sendCandidate(connection, message);           break;
      case 'send-offer':                sendOffer(connection, message);               break; 
      case 'send-answer':               sendAnswer(connection, message);              break; 
      case 'register-username':         registerUser(connection, message);            break;
      default:                          send(connection, {error:'unknown command'});  break;                     
    }
  }

  transport.on('connection', function (connection) {
    connection.on('message', function(msg) {
      var message;
      try { message = JSON.parse(msg); } catch (e) { 
        send(connection, {type:'error', message:'Server received bad request. Must be JSON.'});
        return;
      }
      if(message){
        switch (message.type) {
          case 'ping':      send(connection, {type:'ack-ping'});                              break;
          case 'command':   handleCommand(connection, message);                               break;
          default:          send(connection, {type:'error', error:"unknown message type"});   break;
        }
      }
    });
  });
  return transport;
};

