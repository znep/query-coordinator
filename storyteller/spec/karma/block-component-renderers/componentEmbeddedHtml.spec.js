import $ from 'jquery';
import _ from 'lodash';
import { assert } from 'chai';

import { $transient } from '../TransientElement';
import 'editor/block-component-renderers/componentEmbeddedHtml';

describe('componentEmbeddedHtml jQuery plugin', function() {

  var $component;
  var validComponentData = {
    type: 'embeddedHtml',
    value: {
      url: 'https://example.com/embedded_fragment.html',
      title: 'my title',
      documentId: '4567',
      layout: {
        height: 300
      }
    }
  };

  const getProps = (props) => {
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
    assert.throws(function() { $component.componentEmbeddedHtml(); });
    assert.throws(function() { $component.componentEmbeddedHtml(1); });
    assert.throws(function() { $component.componentEmbeddedHtml(null); });
    assert.throws(function() { $component.componentEmbeddedHtml(undefined); });
    assert.throws(function() { $component.componentEmbeddedHtml({}); });
    assert.throws(function() { $component.componentEmbeddedHtml([]); });
  });

  describe('given a value that does not contain a url', function() {
    it('should throw when setting the iframe source', function() {
      var badComponentData = _.cloneDeep(validComponentData);
      delete badComponentData.value.url;

      assert.throws(function() {
        $component.componentEmbeddedHtml(getProps({
          componentData: badComponentData
        }));
      });
    });
  });

  describe('given a valid component type and value', function() {

    beforeEach(function() {
      $component = $component.componentEmbeddedHtml(getProps());
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $, 'Returned value is not a jQuery collection');
    });

    describe('iframe data-document-id attribute', function() {
      it('should start off correct', function() {
        assert.equal(
          $component.find('iframe').attr('data-document-id'),
          validComponentData.value.documentId
        );
      });

      it('should update', function() {
        var updatedComponentData = _.cloneDeep(validComponentData);
        updatedComponentData.value.documentId = '9999';

        $component.componentEmbeddedHtml(getProps({
          componentData: updatedComponentData
        }));

        assert.equal(
          $component.find('iframe').attr('data-document-id'),
          updatedComponentData.value.documentId
        );
      });

    });

    describe('iframe src and title attributes', function() {
      it('should start off correct', function() {
        assert.equal(
          $component.find('iframe').attr('src'),
          validComponentData.value.url
        );
        assert.equal(
          $component.find('iframe').attr('title'),
          validComponentData.value.title
        );
      });

      it('should update', function() {
        var updatedComponentData = _.cloneDeep(validComponentData);
        updatedComponentData.value.url = 'https://updated.example.com/embedded_fragment.html';
        updatedComponentData.value.title = 'new title';

        $component.componentEmbeddedHtml(getProps({
          componentData: updatedComponentData
        }));

        assert.equal(
          $component.find('iframe').attr('src'),
          updatedComponentData.value.url
        );
        assert.equal(
          $component.find('iframe').attr('title'),
          updatedComponentData.value.title
        );
      });
    });

    describe('internet explorer hovering', function() {
      beforeEach(function() {
        $component.find('iframe').mouseenter();
      });

      it('should add a .active class to the base element when hovering', function() {
        assert.isTrue($component.hasClass('active'));
      });

      it('removes the .active class from the base element when leaving', function() {
        $component.find('iframe').mouseleave();
        assert.isFalse($component.hasClass('active'));
      });
    });
  });
});

