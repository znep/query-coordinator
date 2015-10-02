chai.use(function(_chai, utils) {
  var Assertion = _chai.Assertion;
  var TestUtils = React.addons.TestUtils;

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

  Assertion.addProperty('reactElement', function () {
    var obj = utils.flag(this, 'object');
    new chai.Assertion(TestUtils.isElement(obj)).to.eq(true);
  });

  Assertion.addProperty('reactComponent', function() {
    var obj = utils.flag(this, 'object');
    new chai.Assertion(TestUtils.isCompositeComponent(obj)).to.eq(true);
  });

  Assertion.addMethod('elementOfType', function(type) {
    var obj = this._obj;

    new Assertion(obj).to.be.reactElement;

    var expected = _.isString(type) ? type : type.displayName;
    var actual = _.isString(obj.type) ? obj.type : obj;

    this.assert(
      TestUtils.isElementOfType(obj, type),
      'expected #{this} to be instance of #{exp} but was #{act}',
      'expected #{this} to not have textContent #{act}',
      expected,
      actual
    );
  });

});
