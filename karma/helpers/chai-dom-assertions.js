chai.use(function(_chai) {
  var Assertion = _chai.Assertion;

  Assertion.addMethod('className', function(className) {
    var obj = this._obj;

    // first, our instanceof check, shortcut
    new Assertion(this._obj).to.be.instanceof(Element);
    var classList = obj.className.split(' ');

    // second, our type check
    this.assert(
      _.contains(obj.classList, className),
      'expected #{this} to have class #{exp} in class list #{act}',
      'expected #{this} to not have class #{act}',
      className        /* expected*/,
      obj.className    // actual
    );
  });

  Assertion.addMethod('textContent', function(textContent) {
    var obj = this._obj;

    // first, our instanceof check, shortcut
    new Assertion(obj).to.be.instanceof(Node);

    // second, our type check
    this.assert(
      obj.textContent.trim() === textContent,
      'expected #{this} to have textContent #{exp} but was #{act}',
      'expected #{this} to not have textContent #{act}',
      textContent        /* expected*/,
      obj.textContent    // actual
    );
  });

});
