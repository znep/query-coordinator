chai.use(function(_chai) {
  var Assertion = _chai.Assertion;

  Assertion.addMethod('className', function(className) {
    var obj = this._obj;

    new Assertion(this._obj).to.be.instanceof(Element);
    var classList = obj.className.split(' ');

    this.assert(
      _.contains(classList, className),
      'expected #{this} to have class #{exp} in class list #{act}',
      'expected #{this} to not have class #{act}',
      className,
      obj.className
    );
  });

  Assertion.addMethod('textContent', function(textContent) {
    var obj = this._obj;

    new Assertion(obj).to.be.instanceof(Node);

    this.assert(
      obj.textContent.trim() === textContent,
      'expected #{this} to have textContent #{exp} but was #{act}',
      'expected #{this} to not have textContent #{act}',
      textContent,
      obj.textContent
    );
  });

});
