var assert = require("assert");
describe("Harmony generators", function(){
  it("should allow variable assignment expressions, and function injection with try{}catch{} blocks", function(done){
    var tester = function*(value){
      var resolve;
      try {
        while(resolve = yield value) {
          console.log("value:" + value);
          console.log("resolve:" +resolve);
        }
      } catch (exitCallback) {
        exitCallback();
      }
    };

    var t = tester("initial");

    t.next();
    t.next("someval");
    t.next(3);
    t.throw(function(){ done() });
  });
});
