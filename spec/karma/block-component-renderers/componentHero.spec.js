describe('componentHero jQuery plugin', function() {
  'use strict';

  var $component;
  var manager;
  var blockId = 'test';
  var componentIndex = 9001;
  var storyteller = window.socrata.storyteller;
  var validComponentData = {
    type: 'hero',
    value: {
      documentId: '1234',
      url: 'https://imageuploads.com/valid-upload-image.png',
      html: ''
    }
  };

  beforeEach(function() {
    testDom.append('<div>');
    $component = testDom.children('div');

    $(document.body).
      attr('data-block-id', blockId).
      attr('data-component-index', componentIndex);

    manager = storyteller.richTextEditorManager;
    storyteller.richTextEditorManager = {
      getEditor: _.noop
    };
  });

  afterEach(function() {
    storyteller.richTextEditorManager = manager;
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
        $component.componentHero(componentData);
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

      it('should render with a default height class', function() {
        assert.isTrue($component.find('.hero').hasClass('hero-height-override'));
      });

      describe('launching an image upload', function() {
        var dispatchStub;

        beforeEach(function() {
          dispatchStub = sinon.stub(window.storyteller.dispatcher, 'dispatch');
        });

        afterEach(function() {
          dispatchStub.restore();
        });

        it('should dispatch ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT', function() {
          $component.find('button').click();

          assert.isTrue(dispatchStub.calledWith({
            action: Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT,
            blockId: blockId,
            componentIndex: componentIndex
          }));
        });

        it('should dispatch ASSET_SELECTOR_PROVIDER_CHOSEN,', function() {
          $component.find('button').click();

          assert.isTrue(dispatchStub.calledWith({
            action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
            provider: 'HERO'
          }));
        });
      });
    });
  });

  describe('rendered', function() {
    var dispatchStub;

    beforeEach(function() {
      dispatchStub = sinon.stub(window.storyteller.dispatcher, 'dispatch');
    });

    afterEach(function() {
      dispatchStub.restore();
    });

    it('should render an "Edit" button', function() {
      $component.componentHero(validComponentData);
      assert.lengthOf($component.find('.component-edit-controls-edit-btn'), 1);
    });

    it('should render a resize handle', function() {
      $component.componentHero(validComponentData);
      assert.lengthOf($component.find('.component-resize-handle'), 1);
    });

    it('should span the entire browser window width', function() {
      $component.componentHero(validComponentData);

      assert.closeTo(
        $component.find('.hero').width(),
        $(window).width(),
        100
      );
    });

    describe('converting from unconfigured to configured', function() {
      beforeEach(function() {
        var componentData = _.omit(validComponentData, 'value');
        $component.componentHero(componentData);

        componentData = _.cloneDeep(validComponentData);
        $component.componentHero(componentData);
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

      it('should render with a default height class', function() {
        assert.isTrue($component.find('.hero').hasClass('hero-height-override'));
      });
    });

    describe('converting from configured to configured (changed/updated)', function() {
      var url = 'https://hello.com/world.jpg';

      beforeEach(function() {
        var componentData = _.cloneDeep(validComponentData);
        $component.componentHero(componentData);

        componentData = _.cloneDeep(validComponentData);
        componentData.value.url = url;

        $component.componentHero(componentData);
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
