describe('TextComponentRenderer', function() {

  'use strict';

  var componentOptions;
  var validRenderFn = function() {};
  var storyteller = window.socrata.storyteller;
  var TextComponentRenderer = storyteller.TextComponentRenderer;


  beforeEach(function() {
    storyteller.RichTextEditorManagerMocker.mock();
  });

  afterEach(function() {
    storyteller.RichTextEditorManagerMocker.unmock();
  });

  beforeEach(function() {

    componentOptions = {
      classes: 'test-class',
      blockId: 'testBlockId',
      componentIndex: 1,
      componentWidth: '6',
      componentType: 'text',
      componentValue: 'Test text',
      editable: true
    };
  });

  describe('.renderTemplate()', function() {

    describe('when called without a component type', function() {

      it('throws an error', function() {

        delete componentOptions.componentType;

        assert.throw(function() {
          var template = TextComponentRenderer.renderTemplate(componentOptions);
        });
      });
    });

    describe('when called with a component type that is not "text"', function() {

      it('throws an error', function() {

        componentOptions.componentType = 'invalid';

        assert.throw(function() {
          var template = TextComponentRenderer.renderTemplate(componentOptions);
        });
      });
    });

    describe('when called with component type "text"', function () {

      it('returns a text component template', function() {

        var template = TextComponentRenderer.renderTemplate(componentOptions);

        assert.equal(template.attr('data-rendered-template'), 'text');
        assert.equal(template.attr('data-editor-id'), componentOptions.blockId + '-' + componentOptions.componentIndex);
      });
    });
  });

  describe('.renderData()', function() {

    var validComponentData;
    var testText = 'Test text';

    beforeEach(function() {
      validComponentData = {
        type: 'text',
        value: testText
      };
    });

    describe('when called with a `data` that is not an object', function() {

      it('throws an error', function() {

        var template = TextComponentRenderer.renderTemplate(componentOptions);
        var invalidComponentData = null;

        assert.throw(function() {
          TextComponentRenderer.renderData(template, invalidComponentData, componentOptions.editable, validRenderFn);
        });
      });
    });

    describe('when called with a `data.type` that is not "text"', function() {

      it('throws an error', function() {

        var template = TextComponentRenderer.renderTemplate(componentOptions);

        validComponentData.type = 'invalid';

        assert.throw(function() {
          TextComponentRenderer.renderData(template, validComponentData, componentOptions.editable, validRenderFn);
        });
      });
    });

    describe('when called with a `renderFn` that is not a function', function() {

      it('throws an error', function() {

        var template = TextComponentRenderer.renderTemplate(componentOptions);

        assert.throw(function() {
          TextComponentRenderer.renderData(template, validComponentData, componentOptions.editable, null);
        });
      });
    });

    describe('when called with a valid `data`', function() {

      it('calls `.setContent()` on an editor with the specified content', function(done) {

        var template = TextComponentRenderer.renderTemplate(componentOptions);
        var editorSetContentCallback = function(content) {
          assert.equal(content, testText);
          done();
        };

        storyteller.RichTextEditorManagerMocker.setContentCallback(editorSetContentCallback);

        TextComponentRenderer.renderData(template, validComponentData, componentOptions.editable, validRenderFn);
      });
    });
  });
});
