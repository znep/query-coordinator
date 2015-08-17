describe('StorytellerComponentLayout jQuery plugin', function() {
  var node;
  var storyteller = window.socrata.storyteller;

  beforeEach(function() {
    node = testDom.append('<div>');
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { node.storytellerComponentLayout(); });
    assert.throws(function() { node.storytellerComponentLayout(1); });
    assert.throws(function() { node.storytellerComponentLayout(null); });
    assert.throws(function() { node.storytellerComponentLayout(undefined); });
    assert.throws(function() { node.storytellerComponentLayout({}); });
    assert.throws(function() { node.storytellerComponentLayout([]); });
  });

  describe('given a value that is not supported', function () {
    it('should throw when instantiated', function () {
      assert.throws(function() { node.storytellerComponentLayout({type: 'layout', value: 'notspacer'}); });
    });
  });

  describe('given a valid component type and value', function() {
    var returnValue;
    var component = {type: 'layout', value: 'spacer'};

    beforeEach(function() {
      returnValue = node.storytellerComponentLayout(component);
    });

    it('should return a jQuery object for chaining', function() {
      assert.isTrue($.fn.isPrototypeOf(returnValue), 'Returned value is not a jQuery collection');
    });
  });

  describe('given a horizontal rule component', function () {
    var returnValue;
    var component = {type: 'layout', value: 'horizontalRule'};

    beforeEach(function() {
      returnValue = node.storytellerComponentLayout(component);
    });

    it('should render an <hr> DOM element', function () {
      assert.lengthOf(returnValue.find('hr'), 1);
    });
  });

  describe('given a spacer component', function () {
    var returnValue;
    var component = {type: 'layout', value: 'spacer'};

    beforeEach(function() {
      returnValue = node.storytellerComponentLayout(component);
    });

    it('should render a <div class="spacer"> DOM element', function () {
      assert.lengthOf(returnValue.find('div.spacer'), 1);
    });
  });
});
