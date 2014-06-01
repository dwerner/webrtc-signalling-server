var EventEmitter = require("events").EventEmitter;
var util = require('util');


function Caller() {
  EventEmitter.apply(this, arguments);
  return this;
}

util.inherits(Caller, EventEmitter);


// this offers to caller
Caller.prototype.offer = function (caller) {
  caller.emit("offer", this);
};

Caller.prototype.answer = function (offering) {
  offering.emit("answer", this);
};


module.exports = Caller;
