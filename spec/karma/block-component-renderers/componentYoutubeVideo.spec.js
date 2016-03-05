import $ from 'jQuery';
import _ from 'lodash';

import StorytellerUtils from '../../../app/assets/javascripts/StorytellerUtils';
import '../../../app/assets/javascripts/editor/block-component-renderers/componentYoutubeVideo';

describe('componentYoutubeVideo jQuery plugin', function() {

  var testDom;
  var $component;
  var validComponentData = {
    type: 'youtube.video',
    value: {
      id: 'videoId'
    }
  };

  beforeEach(function() {
    testDom = $('<div>');
    testDom.append('<div>');
    $component = testDom.children('div');
    $(document.body).append(testDom);
  });

  afterEach(function() {
    testDom.remove();
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { $component.componentYoutubeVideo(); });
    assert.throws(function() { $component.componentYoutubeVideo(1); });
    assert.throws(function() { $component.componentYoutubeVideo(null); });
    assert.throws(function() { $component.componentYoutubeVideo(undefined); });
    assert.throws(function() { $component.componentYoutubeVideo({}); });
    assert.throws(function() { $component.componentYoutubeVideo([]); });
  });

  describe('given a value that does not contain an id', function() {
    it('should throw when setting the iframe source', function() {
      var badData = _.cloneDeep(validComponentData);
      delete badData.value.id;

      assert.throws(function() {
        $component.componentYoutubeVideo(badData);
      });
    });
  });

  describe('given a valid component type and value', function() {

    beforeEach(function() {
      $component = $component.componentYoutubeVideo(validComponentData);
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $, 'Returned value is not a jQuery collection');
    });

    describe('iframe src attribute', function() {
      it('should start off correct', function() {
        assert.equal(
          $component.find('iframe').attr('src'),
          StorytellerUtils.format(
            'https://www.youtube.com/embed/{0}?rel=0&showinfo=0',
            validComponentData.value.id
          )
        );
      });

      it('should update', function() {
        var updatedData = _.cloneDeep(validComponentData);
        updatedData.value.id = '1234';

        $component.componentYoutubeVideo(updatedData);

        assert.equal(
          $component.find('iframe').attr('src'),
          StorytellerUtils.format(
            'https://www.youtube.com/embed/{0}?rel=0&showinfo=0',
            '1234'
          )
        );
      });
    });
  });
});
