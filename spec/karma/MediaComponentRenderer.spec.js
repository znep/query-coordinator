describe('MediaComponentRenderer', function() {

  'use strict';

  var componentOptions;
  var testBlockId = 'testBlockId';
  var testComponentIndex = 1;
  var testImageSrc = 'test.jpg';
  var validRenderFn = function() {};
  var MediaComponentRenderer = window.socrata.storyteller.MediaComponentRenderer;

  describe('.renderTemplate()', function() {

    beforeEach(function() {
      componentOptions = {
        classes: 'test-class',
        blockId: testBlockId,
        componentIndex: testComponentIndex,
        componentWidth: '6',
        componentType: 'media',
        componentValue: { type: 'image', value: { src: 'test.jpg' } },
        editable: true
      };
    });

    describe('when called with `componentOptions` that does not include a `componentType` property', function() {

      it('throws an error', function() {

        delete componentOptions.componentType;

        assert.throw(function() {
          var template = MediaComponentRenderer.renderTemplate(componentOptions);
        });
      });
    });

    describe('when called with a `componentOptions.componentType` that is not "image" or "embed"', function() {

      it('throws an error', function() {

        componentOptions.componentType = 'invalid';

        assert.throw(function() {
          var template = MediaComponentRenderer.renderTemplate(componentOptions);
        });
      });
    });

    describe('when called with a `componentOptions.componentType` of "image"', function () {

      beforeEach(function() {
        componentOptions = {
          classes: 'test-class',
          blockId: testBlockId,
          componentIndex: testComponentIndex,
          componentWidth: '6',
          componentType: 'media',
          componentValue: { type: 'image', value: { src: 'test.jpg' } },
          editable: true
        };
      });

      describe('when called with `componentOptions` that does not include a `classes` property', function() {

        it('throws an error', function() {

          delete componentOptions.classes;

          assert.throw(function() {
            MediaComponentRenderer.renderTemplate(componentOptions);
          });
        });
      });

      describe('when called with valid `componentOptions`', function() {

        it('returns an image component template', function() {

          var template = MediaComponentRenderer.renderTemplate(componentOptions);

          assert.equal(template.attr('data-rendered-template'), 'media');
          assert.equal(template.attr('data-rendered-media-type'), 'image');
        });
      });
    });

    describe('when called with a `componentOptions.componentType` of "embed"', function () {

      beforeEach(function() {
        componentOptions = {
          classes: 'test-class',
          blockId: testBlockId,
          componentIndex: testComponentIndex,
          componentWidth: '6',
          componentType: 'media',
          componentValue: { type: 'embed', value: { provider: 'wizard' } },
          editable: true
        };
      });

      describe('when called with `componentOptions` that does not include a `classes` property', function() {

        it('throws an error', function() {

          delete componentOptions.classes;

          assert.throw(function() {
            MediaComponentRenderer.renderTemplate(componentOptions);
          });
        });
      });

      describe('when called with `componentOptions` that does not include a `componentValue` property', function() {

        it('throws an error', function() {

          delete componentOptions.componentValue;

          assert.throw(function() {
            MediaComponentRenderer.renderTemplate(componentOptions);
          });
        });
      });

      describe('when called with `componentOptions.componentvalue` that does not include a `value` property', function() {

        it('throws an error', function() {

          delete componentOptions.componentValue.value;

          assert.throw(function() {
            MediaComponentRenderer.renderTemplate(componentOptions);
          });
        });
      });

      describe('when called with valid `componentOptions`', function() {

        it('returns an image component template', function() {

          var template = MediaComponentRenderer.renderTemplate(componentOptions);

          assert.equal(template.attr('data-rendered-template'), 'media');
          assert.equal(template.attr('data-rendered-media-type'), 'embed');
        });
      });
    });
  });

  describe('.renderData()', function() {

    var validRenderFn = function() {};

    describe('when called with a `data.value` argument that has no `type` property', function() {

      it('throws an error', function() {

        var template = MediaComponentRenderer.renderTemplate(componentOptions);

        var invalidComponentData = { value: { src: testImageSrc } };

        assert.throw(function() {
          MediaComponentRenderer.renderData(template, invalidComponentData, componentOptions.editable, validRenderFn);
        });
      });
    });

    describe('when called with a `data.value` argument that has no `value` property', function() {

      it('throws an error', function() {

        var template = MediaComponentRenderer.renderTemplate(componentOptions);

        var invalidComponentData = { type: 'image' };

        assert.throw(function() {
          MediaComponentRenderer.renderData(template, invalidComponentData, componentOptions.editable, validRenderFn);
        });
      });
    });

    describe('when called with a `data.value.type` of "image"', function() {

      var validComponentData;

      beforeEach(function() {
        componentOptions = {
          classes: 'test-class',
          blockId: testBlockId,
          componentIndex: testComponentIndex,
          componentWidth: '6',
          componentType: 'media',
          componentValue: { type: 'image', value: { src: testImageSrc } },
          editable: true
        };

        validComponentData = {
          type: 'media',
          value: {
            type: 'image',
            value: {
              src: testImageSrc
            }
          }
        };
      });

      describe('when called with a `data.value.value` that does not include a `src` property', function() {

        it('throws an error', function() {

          var template = MediaComponentRenderer.renderTemplate(componentOptions);

          delete validComponentData.value.src;

          assert.throw(function() {
            MediaComponentRenderer.renderData(template, validComponentData, componentOptions.editable, null);
          });
        });
      });

      describe('when called with a `renderFn` that is not a function', function() {

        it('throws an error', function() {

          var template = MediaComponentRenderer.renderTemplate(componentOptions);

          assert.throw(function() {
            MediaComponentRenderer.renderData(template, validComponentData, componentOptions.editable, null);
          });
        });
      });

      describe('when called with a valid `data`', function() {

        it('renders the specified image to the template', function() {

          var template = MediaComponentRenderer.renderTemplate(componentOptions);

          MediaComponentRenderer.renderData(template, validComponentData, componentOptions.editable, validRenderFn);

          assert.equal(template.children('img').eq(0).attr('src'), testImageSrc);
        });

        it('calls `renderFn` when the image onload event is fired', function(done) {

          var template = MediaComponentRenderer.renderTemplate(componentOptions);
          var testRenderFn = function() {
            done();
          }

          MediaComponentRenderer.renderData(template, validComponentData, componentOptions.editable, testRenderFn);

          template.children('img').eq(0).trigger('load');
        });
      });
    });

    describe('when called with a `data.value.type` of "embed"', function() {

      var validComponentData;
      var testProvider = 'wizard';

      beforeEach(function() {
        componentOptions = {
          classes: 'test-class',
          blockId: testBlockId,
          componentIndex: testComponentIndex,
          componentWidth: '6',
          componentType: 'media',
          componentValue: { type: 'embed', value: { provider: 'wizard' } },
          editable: true
        };

        validComponentData = {
          type: 'media',
          value: {
            type: 'embed',
            value: {
              provider: testProvider
            }
          }
        };
      });

      describe('when called with a `data.value.value` that does not include a `provider` property', function() {

        it('throws an error', function() {

          var template = MediaComponentRenderer.renderTemplate(componentOptions);

          delete validComponentData.value.provider;

          assert.throw(function() {
            MediaComponentRenderer.renderData(template, validComponentData, componentOptions.editable, null);
          });
        });
      });

      describe('when called with a `renderFn` that is not a function', function() {

        it('throws an error', function() {

          var template = MediaComponentRenderer.renderTemplate(componentOptions);

          assert.throw(function() {
            MediaComponentRenderer.renderData(template, validComponentData, componentOptions.editable, null);
          });
        });
      });

      describe('when called with a valid `data`', function() {

        it('renders the specified image to the template', function() {

          var template = MediaComponentRenderer.renderTemplate(componentOptions);

          MediaComponentRenderer.renderData(template, validComponentData, componentOptions.editable, validRenderFn);

          var chooseProviderButton = template.find('button[data-embed-action="EMBED_WIZARD_CHOOSE_PROVIDER"]');

          assert.equal(chooseProviderButton.length, 1);
          assert.equal(chooseProviderButton.eq(0).attr('data-block-id'), testBlockId);
          assert.equal(chooseProviderButton.eq(0).attr('data-component-index'), testComponentIndex);
        });
      });
    });
  });
});
