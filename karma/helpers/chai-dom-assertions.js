chai.use(function(_chai, utils) {
  var Assertion = _chai.Assertion;

  Assertion.addMethod('className', function (className) {
    var obj = this._obj;

    // first, our instanceof check, shortcut
    new Assertion(this._obj).to.be.instanceof(Element);

    // second, our type check
    this.assert(
      obj.classList.contains(className)
      , "expected #{this} to have class #{exp} in class list #{act}"
      , "expected #{this} to not have class #{act}"
      , className        // expected
      , obj.className    // actual
    );
  });

});
