import $ from 'jQuery';
import _ from 'lodash';

import { $transient } from '../TransientElement';
import DataGenerators from '../DataGenerators';
import Dispatcher from '../../../app/assets/javascripts/editor/Dispatcher';
import CustomEvent from '../../../app/assets/javascripts/CustomEvent';
import Actions from '../../../app/assets/javascripts/editor/Actions';
import {__RewireAPI__ as StoreAPI} from '../../../app/assets/javascripts/editor/stores/Store';
import StoryStore from '../../../app/assets/javascripts/editor/stores/StoryStore';
import {__RewireAPI__ as componentHeroAPI} from '../../../app/assets/javascripts/editor/block-component-renderers/componentHero';

describe('componentHero jQuery plugin', function() {
  var $component;
  var blockId;
  var componentIndex = 0;
  var mockComponentHTML;
  var validComponentData = {
    type: 'hero',
    value: {
      documentId: '1234',
      url: 'https://imageuploads.com/valid-upload-image.png',
      html: 'some html'
    }
  };

  var theme = 'slate';
  var dispatcher;
  var story;
  var storyStore;
  var options = { editMode: true };

  beforeEach(function() {
    story = DataGenerators.generateStoryData({
      uid: 'what-what',
      blocks: [
        DataGenerators.generateBlockData({
          components: [validComponentData]
        })
      ]
    });

    dispatcher = new Dispatcher();

    StoreAPI.__Rewire__('dispatcher', dispatcher);

    storyStore = new StoryStore();

    dispatcher.dispatch({
      action: Actions.STORY_CREATE,
      data: story
    });

    blockId = storyStore.getStoryBlockIds(story.uid)[0];

    componentHeroAPI.__Rewire__('storyStore', storyStore);
    componentHeroAPI.__Rewire__('dispatcher', dispatcher);
    componentHeroAPI.__Rewire__('richTextEditorManager', {getEditor: _.noop});
    componentHeroAPI.__Rewire__('Environment', {
      IMAGES: {COVER_IMAGE_ICON: ''}
    });

    $transient.append('<div>');
    $component = $transient.children('div');

    $(document.body).
      attr('data-block-id', blockId).
      attr('data-component-index', componentIndex);

    mockComponentHTML = sinon.stub($.fn, 'componentHTML', _.noop);
  });

  afterEach(function() {
    mockComponentHTML.restore();
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { $component.componentHero(); });
    assert.throws(function() { $component.componentHero(1); });
    assert.throws(function() { $component.componentHero(null); });
    assert.throws(function() { $component.componentHero(undefined); });
    assert.throws(function() { $component.componentHero({}); });
    assert.throws(function() { $component.componentHero([]); });
  });

  describe('unrendered', function() {
    describe('given a null value', function() {
      beforeEach(function() {
        var componentData = _.omit(validComponentData, 'value');
        $component.componentHero(componentData, theme, options);
      });

      it('should render the unconfigured hero', function() {
        assert.lengthOf($component.children('.hero-unconfigured'), 1);
      });

      it('should render a button to upload an image', function() {
        assert.lengthOf($component.find('button'), 1);
      });

      it('should have a type-class of component-hero', function() {
        assert($component.has('.component-hero'));
      });

      describe('launching an image upload', function() {
        it('should dispatch ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT', function(done) {
          dispatcher.register(function(payload) {
            if (payload.action === 'ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT') {
              assert.propertyVal(payload, 'blockId', blockId);
              assert.propertyVal(payload, 'componentIndex', componentIndex);
              assert.property(payload, 'initialComponentProperties'); // Don't care about value, it comes from the default component content.
              done();
            }
          });

          $component.find('button').click();
        });

        it('should dispatch ASSET_SELECTOR_PROVIDER_CHOSEN,', function(done) {
          dispatcher.register(function(payload) {
            if (payload.action === 'ASSET_SELECTOR_PROVIDER_CHOSEN') {
              assert.propertyVal(payload, 'provider', 'HERO');
              done();
            }
          });

          $component.find('button').click();
        });
      });
    });
  });

  describe('rendered', function() {
    it('should render an "Edit" button', function() {
      $component.componentHero(validComponentData, theme, options);
      assert.lengthOf($component.find('.component-edit-controls-edit-btn'), 1);
    });

    it('should render a resize handle', function() {
      $component.componentHero(validComponentData, theme, options);
      assert.lengthOf($component.find('.component-resize-handle'), 1);
    });

    it('should span the entire browser window width', function() {
      $component.componentHero(validComponentData, theme, options);

      assert.closeTo(
        $component.find('.hero').width(),
        $(window).width(),
        100
      );
    });

    it('should render a componentHTML with the correct options', function() {
      $component.componentHero(validComponentData, 'the theme', { editMode: true, some: 'option' });
      sinon.assert.calledOnce(mockComponentHTML);
      var firstCall = mockComponentHTML.getCalls()[0];
      var args = firstCall.args;
      var htmlComponentDataArg = args[0];
      var themeArg = args[1];
      var optionsArg = args[2];

      assert.propertyVal(htmlComponentDataArg, 'type', 'html');
      assert.propertyVal(htmlComponentDataArg, 'value', validComponentData.value.html);
      assert.equal(themeArg, 'the theme');
      assert.propertyVal(optionsArg, 'some', 'option', 'option not passed through');
      assert.deepEqual(optionsArg.extraContentClasses, [ 'hero-body', 'remove-top-margin' ]);

      assert.isTrue(firstCall.thisValue.hasClass('hero-text'));
    });

    describe('on rich-text-editor::content-change', function() {
      it('should dispatch BLOCK_UPDATE_COMPONENT', function(done) {
        $component.componentHero(validComponentData, theme, options);
        dispatcher.register(function(payload) {
          if (payload.action === Actions.BLOCK_UPDATE_COMPONENT) {
            assert.propertyVal(payload, 'type', 'hero');
            assert.propertyVal(payload.value, 'html', 'new content');
            assert.propertyVal(payload, 'blockId', blockId);
            assert.propertyVal(payload, 'componentIndex', componentIndex);
            done();
          }
        });
        $component[0].dispatchEvent(
          new CustomEvent(
            'rich-text-editor::content-change',
            { detail: { content: 'new content' }, bubbles: true }
          )
        );
      });
    });

    describe('converting from unconfigured to configured', function() {
      beforeEach(function() {
        var componentData = _.omit(validComponentData, 'value');
        $component.componentHero(componentData, theme, options);

        componentData = _.cloneDeep(validComponentData);
        $component.componentHero(componentData, theme, options);
      });

      it('should not have a button to upload an image', function() {
        assert.lengthOf($component.find('.btn-primary'), 0);
      });

      it('should render a background-image', function() {
        assert.include(
          $component.children('.hero').css('background-image'),
          validComponentData.value.url
        );
      });
    });

    describe('converting from configured to configured (changed/updated)', function() {
      var url = 'https://hello.com/world.jpg';

      beforeEach(function() {
        var componentData = _.cloneDeep(validComponentData);
        $component.componentHero(componentData, theme, options);

        componentData = _.cloneDeep(validComponentData);
        componentData.value.url = url;

        $component.componentHero(componentData, theme, options);
      });

      it('should update the image URL', function() {
        assert.include(
          $component.children('.hero').css('background-image'),
          url
        );
      });
    });
  });
});
