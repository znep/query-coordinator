import $ from 'jquery';
import _ from 'lodash';
import { assert } from 'chai';

import { $transient } from '../TransientElement';
import StorytellerUtils from 'StorytellerUtils';
import 'editor/block-component-renderers/componentYoutubeVideo';

describe('componentYoutubeVideo jQuery plugin', function() {

  var $component;
  var validComponentData = {
    type: 'youtube.video',
    value: {
      id: 'videoId',
      title: 'my title'
    }
  };

  var getProps = (props) => {
    return _.extend({
      blockId: null,
      componentData: validComponentData,
      componentIndex: null,
      theme: null
    }, props);
  };

  beforeEach(function() {
    $transient.append('<div>');
    $component = $transient.children('div');
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
        $component.componentYoutubeVideo(getProps({ componentData: badData }));
      });
    });
  });

  describe('given a valid component type and value', function() {

    beforeEach(function() {
      $component = $component.componentYoutubeVideo(getProps());
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $, 'Returned value is not a jQuery collection');
    });

    describe('iframe src and title attributes', function() {
      it('should start off correct', function() {
        assert.equal(
          $component.find('iframe').attr('src'),
          StorytellerUtils.format(
            'https://www.youtube.com/embed/{0}?rel=0&showinfo=0',
            validComponentData.value.id
          )
        );
        assert.equal(
          $component.find('iframe').attr('title'),
          'my title'
        );
      });

      it('should update', function() {
        var updatedData = _.cloneDeep(validComponentData);
        updatedData.value.id = '1234';
        updatedData.value.title = 'new title';

        $component.componentYoutubeVideo(getProps({
          componentData: updatedData
        }));

        assert.equal(
          $component.find('iframe').attr('src'),
          StorytellerUtils.format(
            'https://www.youtube.com/embed/{0}?rel=0&showinfo=0',
            '1234'
          )
        );
        assert.equal(
          $component.find('iframe').attr('title'),
          'new title'
        );
      });
    });
  });
});
