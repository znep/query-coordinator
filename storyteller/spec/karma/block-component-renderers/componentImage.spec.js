import $ from 'jquery';
import _ from 'lodash';
import { assert } from 'chai';

import { $transient } from '../TransientElement';
import 'editor/block-component-renderers/componentImage';

describe('componentImage jQuery plugin', function() {

  var $component;
  var validComponentData = {
    type: 'image',
    value: {
      documentId: '1234',
      url: 'https://example.com/valid-upload-image.png',
      alt: 'Much alt'
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
    assert.throws(function() { $component.componentImage(); });
    assert.throws(function() { $component.componentImage(1); });
    assert.throws(function() { $component.componentImage(null); });
    assert.throws(function() { $component.componentImage(undefined); });
    assert.throws(function() { $component.componentImage({}); });
    assert.throws(function() { $component.componentImage([]); });
  });

  describe('given a value that does not contain a documentId', function() {
    it('should throw when setting the img source', function() {
      var badData = _.cloneDeep(validComponentData);
      delete badData.value.documentId;

      assert.throws(function() {
        $component.componentImage(getProps({
          componentData: badData
        }));
      });
    });
  });

  describe('given a value that does not contain a url', function() {
    it('should throw when setting the img source', function() {
      var badData = _.cloneDeep(validComponentData);
      delete badData.value.url;

      assert.throws(function() {
        $component.componentImage(getProps({
          componentData: badData
        }));
      });
    });
  });

  describe('given a valid component type and value', function() {

    beforeEach(function() {
      $component = $component.componentImage(getProps());
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $, 'Returned value is not a jQuery collection');
    });

    describe('img data-document-id attribute', function() {
      it('should start off correct', function() {
        assert.equal(
          $component.find('img').attr('data-document-id'),
          validComponentData.value.documentId
        );
      });

      it('should update', function() {
        var updatedData = _.cloneDeep(validComponentData);
        updatedData.value.documentId = '4321';

        $component.componentImage(getProps({
          componentData: updatedData
        }));

        assert.equal(
          $component.find('img').attr('data-document-id'),
          updatedData.value.documentId
        );
      });
    });

    describe('img src attribute', function() {
      it('should start off correct', function() {
        assert.include(
          $component.find('img').attr('src'),
          validComponentData.value.url
        );
      });

      it('should update', function() {
        var updatedData = _.cloneDeep(validComponentData);
        updatedData.value.url = 'https://example.com/new-valid-upload-image.png';

        $component.componentImage(getProps({
          componentData: updatedData
        }));

        assert.include(
          $component.find('img').attr('src'),
          updatedData.value.url
        );
      });
    });

    describe('img src attribute', function() {
      it('should start off correct', function() {
        assert.equal(
          $component.find('img').attr('alt'),
          validComponentData.value.alt
        );
      });

      it('should update', function() {
        var updatedData = _.cloneDeep(validComponentData);
        updatedData.value.alt = '';

        $component.componentImage(getProps({
          componentData: updatedData
        }));

        assert.equal(
          $component.find('img').attr('alt'),
          null
        );
      });
    });
  });
});
