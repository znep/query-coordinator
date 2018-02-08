import $ from 'jquery';
import _ from 'lodash';
import { assert } from 'chai';
import sinon from 'sinon';

import { expectConsoleErrorCallCount } from '../consoleStub';
import { $transient } from '../TransientElement';
import StorytellerUtils from 'StorytellerUtils';
import 'editor/block-component-renderers/componentStoryTile';

describe('componentStoryTile jQuery plugin', function() {
  var $component;
  var validComponentData = {
    type: 'story.tile',
    value: {
      domain: 'example.com',
      storyUid: 'test-test',
      url: 'https://example.com/stories/s/test-test'
    }
  };
  var validStoryTileDataWithoutImage = {
    title: 'The Unicorn Is The Noblest Beast And I Will Cut You If You Say Otherwise',
    image: null,
    description: 'Unicorns are the most noble of all creatures. They are herbivores. It is considered good luck to see a unicorn. Unicorns are proud. Some unicorns have fire instead of hair, but not all the hair just the long hair. These are the most noble of all the unicorns.',
    theme: 'classic',
    url: StorytellerUtils.format(
      'https://example.com/stories/s/{0}', validComponentData.value.storyUid
    )
  };
  var validStoryTileDataWithImage = _.clone(validStoryTileDataWithoutImage);

  validStoryTileDataWithImage.image = 'about:blank';

  var getProps = (props) => {
    return _.extend({
      blockId: null,
      componentData: validComponentData,
      componentIndex: null,
      theme: null,
      editMode: true
    }, props);
  };

  function stubApiAndCreateComponentWith(statusCode, response, componentData) {
    var server;

    beforeEach(function(done) {
      server = sinon.fakeServer.create();
      server.respondImmediately = true;
      server.respondWith(
        'GET',
        StorytellerUtils.format(
          'https://example.com/stories/s/{0}/tile.json',
          componentData.value.storyUid
        ),
        [
          statusCode,
          { 'Content-Type': 'application/json' },
          JSON.stringify(response)
        ]
      );


      $component = $component.componentStoryTile(getProps({ componentData }));

      // Need to use a setTimeout to escape the stack and resolve the promise.
      setTimeout(function() { done(); }, 0);
    });

    afterEach(function() {
      server.restore();
    });
  }

  beforeEach(function() {
    $transient.append('<div>');
    $component = $transient.children('div');
  });

  it('should throw when passed invalid arguments', function() {

    assert.throws(function() { $component.componentStoryTile(); });
    assert.throws(function() { $component.componentStoryTile(1); });
    assert.throws(function() { $component.componentStoryTile(null); });
    assert.throws(function() { $component.componentStoryTile(undefined); });
    assert.throws(function() { $component.componentStoryTile({}); });
    assert.throws(function() { $component.componentStoryTile([]); });
  });

  describe('given a value that does not contain a domain', function() {

    it('should throw when setting the tile source', function() {
      var badData = _.cloneDeep(validComponentData);

      delete badData.value.domain;

      assert.throws(function() {
        $component.componentStoryTile(getProps({ componentData: badData }));
      });
    });
  });

  describe('given a value that does not contain a storyUid', function() {

    it('should throw when setting the tile source', function() {
      var badData = _.cloneDeep(validComponentData);

      delete badData.value.storyUid;

      assert.throws(function() {
        $component.componentStoryTile(getProps({ componentData: badData }));
      });
    });
  });

  describe('when there is no story with that 4x4', function() {
    expectConsoleErrorCallCount(1);

    stubApiAndCreateComponentWith(404, {}, validComponentData);

    it('should render an error message', function() {
      assert.isTrue($component.hasClass('component-error'));
    });

    describe('the edit controls', function() {
      it('should still be attached to the component', function() {
        assert.lengthOf($component.find('.component-edit-controls-container'), 1);
      });
    });
  });

  describe('given a valid component type and value', function() {

    describe('when there is no image specified', function() {
      stubApiAndCreateComponentWith(200, validStoryTileDataWithoutImage, validComponentData);

      it('should return a jQuery object for chaining', function() {
        assert.instanceOf($component, $, 'Returned value is not a jQuery collection');
      });

      it('should render the tile as a link to the story', function() {

        assert.equal(
          $component.find('.story-tile-container').attr('href'),
          validStoryTileDataWithoutImage.url
        );
        assert.equal(
          $component.find('.story-tile-container').attr('target'),
          '_self'
        );
      });

      it('should render the story title container', function() {
        assert.lengthOf(
          $component.find('.story-tile-title-container'), 1
        );
      });

      it('should render the story title', function() {

        assert.equal(
          $component.find('.story-tile-title').text(),
          validStoryTileDataWithoutImage.title
        );
      });

      it('should render the default story image', function() {

        assert.equal(
          $component.find('.story-tile-image').attr('style'),
          null
        );
      });

      it('should render the story description', function() {

        assert.equal(
          $component.find('.story-tile-description').text(),
          validStoryTileDataWithoutImage.description
        );
      });
    });

    describe('when there is an image specified', function() {
      stubApiAndCreateComponentWith(200, validStoryTileDataWithImage, validComponentData);

      it('should render the specified  image', function() {

        assert.include(
          $component.find('.story-tile-image').css('background-image'),
          'about:blank'
        );
      });
    });

    describe('when the new window behavior is enabled', function() {
      var componentData = _.cloneDeep(validComponentData);
      componentData.value.openInNewWindow = true;
      stubApiAndCreateComponentWith(200, validStoryTileDataWithImage, componentData);

      it('should set target="_blank"', function() {
        assert.equal(
          $component.find('.story-tile-container').attr('target'),
          '_blank'
        );
      });
    });

    describe('when the new window behavior is disabled', function() {
      var componentData = _.cloneDeep(validComponentData);
      componentData.value.openInNewWindow = false;
      stubApiAndCreateComponentWith(200, validStoryTileDataWithImage, componentData);

      it('should set target="_self"', function() {
        assert.equal(
          $component.find('.story-tile-container').attr('target'),
          '_self'
        );
      });
    });

    describe('the edit controls', function() {
      stubApiAndCreateComponentWith(200, validStoryTileDataWithImage, validComponentData);

      it('should still be attached to the component', function() {
        assert.lengthOf($component.find('.component-edit-controls-container'), 1);
      });
    });
  });
});
