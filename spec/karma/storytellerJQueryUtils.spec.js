describe('storytellerJQueryUtils', function() {
  'use strict';

  var $node;
  var storyteller = window.socrata.storyteller;
  var attrSpy;

  beforeEach(function() {
    testDom.append('<div>');
    $node = testDom.children('div');
    attrSpy = sinon.spy($node, 'attr');
  });

  it('should return a jQuery object for chaining', function() {
    assert.instanceOf(
      $node.updateAttrAndCallbackIfWasChanged('foo', 'bar', _.noop),
      $,
      'Returned value is not a jQuery collection');
  });

  describe('when invoked with a sometimes-changing attribute value', function() {
    var callbackStub;
    beforeEach(function() {
      callbackStub = sinon.stub();

      $node.updateAttrAndCallbackIfWasChanged('data-test', 'foo', callbackStub);
      $node.updateAttrAndCallbackIfWasChanged('data-test', 'foo', callbackStub);

      $node.updateAttrAndCallbackIfWasChanged('data-test', 'bar', callbackStub);
      $node.updateAttrAndCallbackIfWasChanged('data-test', 'bar', callbackStub);

      $node.updateAttrAndCallbackIfWasChanged('data-test', 'foo', callbackStub);
    });

    it('should call .attr() with the correct arguments only when the attribute changes', function() {
      // We only care about calls to .attr(attribute, value), not
      // .attr(attribute).
      var onlySetCallArgs = _.chain(attrSpy.getCalls()).pluck('args').
        filter(function(args) { return args.length !== 1 })
        .value();

      assert.deepEqual(
        onlySetCallArgs,
        [[ 'data-test', 'foo' ], [ 'data-test', 'bar' ], [ 'data-test', 'foo' ]]
      );
    });

    it('should call the callback with the correct arguments only when the attribute changes', function() {
      sinon.assert.alwaysCalledOn(callbackStub, $node);

      assert.deepEqual(
        _.pluck(callbackStub.getCalls(), 'args')
        [
          [ 'foo', 'data-test' ],
          [ 'bar', 'data-test' ],
          [ 'foo', 'data-test' ]
        ]
      );
    });
  });
});
