import $ from 'jquery';
import _ from 'lodash';
import { assert } from 'chai';

import { $transient } from '../TransientElement';
import StandardMocks from '../StandardMocks';
import Store from 'editor/stores/Store';
import Dispatcher from 'editor/Dispatcher';
import {__RewireAPI__ as StoryTitleAPI} from 'editor/components/StoryTitle';

describe('StoryTitle jQuery plugin', function() {

  var node;
  var dispatcher;
  var storyStoreMock;
  var title;

  beforeEach(function() {
    node = $transient.append('<div>');

    var StoreMock = function() {
      _.extend(this, new Store());

      this.getStoryTitle = function() {
        return title;
      };

      this.doesStoryExist = _.constant(true);
    };

    storyStoreMock = new StoreMock();
    dispatcher = new Dispatcher();

    StoryTitleAPI.__Rewire__('dispatcher', dispatcher);
    StoryTitleAPI.__Rewire__('storyStore', storyStoreMock);
  });

  afterEach(function() {
    StoryTitleAPI.__ResetDependency__('dispatcher');
    StoryTitleAPI.__ResetDependency__('storyStore');
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { node.storyTitle(); });
    assert.throws(function() { node.storyTitle(1); });
    assert.throws(function() { node.storyTitle(null); });
    assert.throws(function() { node.storyTitle(undefined); });
    assert.throws(function() { node.storyTitle({}); });
    assert.throws(function() { node.storyTitle([]); });
  });

  describe('given a storyUid that does not correspond to a story', function() {
    it('should not do anything', function() {
      storyStoreMock.doesStoryExist = _.constant(false);
      node.storyTitle('badd-guyz');
      assert.equal(node.text(), '');
    });
  });

  describe('given a storyUid that corresponds to a story', function() {
    var returnValue;

    beforeEach(function() {
      title = 'Title';
      returnValue = node.storyTitle(StandardMocks.validStoryUid);
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf(returnValue, $);
    });

    it('should render the story title and attribute', function() {
      assert.equal(node.text(), title);
      assert.equal(node.attr('title'), title);
    });

    describe('that changes', function() {
      it('should update the story title', function() {
        title = 'New Story Title';
        storyStoreMock._emitChange();

        assert.equal(node.text(), title);
        assert.equal(node.attr('title'), title);
      });
    });

  });
});
