import $ from 'jQuery';
import _ from 'lodash';

import '../../app/assets/javascripts/editor/StorytellerJQueryUtils';

describe('StorytellerJQueryUtils', function() {

  var $node;
  var attrSpy;
  var testDom;

  beforeEach(function() {
    testDom = $('<div>');
    testDom.append('<div>');
    $node = testDom.children('div');
    attrSpy = sinon.spy($node, 'attr');
    $(document.body).append(testDom);
  });

  afterEach(function() {
    testDom.remove();
  });

  it('should return a jQuery object for chaining', function() {
    assert.instanceOf(
      $node.updateAttributeWithCallbackIfChanged('foo', 'bar', _.noop),
      $,
      'Returned value is not a jQuery collection');
  });

  describe('when invoked with a sometimes-changing attribute value', function() {
    var callbackStub;
    beforeEach(function() {
      callbackStub = sinon.stub();

      $node.updateAttributeWithCallbackIfChanged('data-test', 'foo', callbackStub);
      $node.updateAttributeWithCallbackIfChanged('data-test', 'foo', callbackStub);

      $node.updateAttributeWithCallbackIfChanged('data-test', 'bar', callbackStub);
      $node.updateAttributeWithCallbackIfChanged('data-test', 'bar', callbackStub);

      $node.updateAttributeWithCallbackIfChanged('data-test', 'foo', callbackStub);
    });

    it('should call .attr() with the correct arguments only when the attribute changes', function() {
      // We only care about calls to .attr(attribute, value), not
      // .attr(attribute).
      var onlySetCallArgs = _.chain(attrSpy.getCalls()).pluck('args').
        filter(function(args) { return args.length !== 1; }).
        value();

      assert.deepEqual(
        onlySetCallArgs,
        [[ 'data-test', 'foo' ], [ 'data-test', 'bar' ], [ 'data-test', 'foo' ]]
      );
    });

    it('should call the callback with the correct arguments only when the attribute changes', function() {
      sinon.assert.alwaysCalledOn(callbackStub, $node);

      assert.deepEqual(
        _.pluck(callbackStub.getCalls(), 'args'),
        [
          [ 'foo', 'data-test' ],
          [ 'bar', 'data-test' ],
          [ 'foo', 'data-test' ]
        ]
      );
    });
  });
});
