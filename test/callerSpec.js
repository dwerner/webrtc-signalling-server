var assert = require("assert");
var Caller = require("../lib/model/caller");

describe("Caller", function () {
  it("shoud be able to call other callers", function (done){
    var c1 = new Caller("a");
    var c2 = new Caller("b");


    c2.on("offer", function(offering){
      console.log("on offer");
      this.answer(offering);
    });

    c1.on("answer", function(answering) {
      console.log("on answer");
      done();
    });
    c1.offer(c2);

  });
});
