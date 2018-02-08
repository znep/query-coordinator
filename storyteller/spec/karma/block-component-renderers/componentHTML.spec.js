import $ from 'jquery';
import { assert } from 'chai';
import sinon from 'sinon';

import { $transient } from '../TransientElement';
import {__RewireAPI__ as componentHTMLAPI} from 'editor/block-component-renderers/componentHTML';

describe('componentHTML jQuery plugin', function() {

  var $component;

  var validComponentData = { type: 'html', value: 'rawrenstein' };
  var editorMock = function() {
    return {
      setContent: setContentSpy,
      applyThemeClass: applyThemeClassSpy,
      addContentClass: addContentClassSpy
    };
  };

  var applyThemeClassSpy = sinon.spy();
  var addContentClassSpy = sinon.spy();
  var deleteEditorSpy = sinon.spy();
  var getEditorSpy = sinon.spy(editorMock);
  var setContentSpy = sinon.spy();
  var createEditorSpy = sinon.spy(editorMock);

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

    componentHTMLAPI.__Rewire__('richTextEditorManager', {
      createEditor: createEditorSpy,
      applyThemeClass: applyThemeClassSpy,
      addContentClass: addContentClassSpy,
      deleteEditor: deleteEditorSpy,
      getEditor: getEditorSpy,
      setContent: setContentSpy
    });
  });

  afterEach(function() {
    createEditorSpy.reset();
    applyThemeClassSpy.reset();
    addContentClassSpy.reset();
    deleteEditorSpy.reset();
    getEditorSpy.reset();
    setContentSpy.reset();

    componentHTMLAPI.__ResetDependency__('richTextEditorManager');
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { $component.componentHTML(); });
    assert.throws(function() { $component.componentHTML(1); });
    assert.throws(function() { $component.componentHTML(null); });
    assert.throws(function() { $component.componentHTML(undefined); });
    assert.throws(function() { $component.componentHTML({}); });
    assert.throws(function() { $component.componentHTML([]); });
  });

  it('should throw when not passed a component type', function() {
    const badData = _.cloneDeep(validComponentData);
    delete badData.type;

    assert.throws(function() {
      $component.componentHTML(getProps({
        componentData: badData
      }));
    });
  });

  it('should throw when passed a component type that is not Storyteller.Text', function() {
    const badData = _.cloneDeep(validComponentData);
    badData.type = 'notHtml';

    assert.throws(function() {
      $component.componentHTML(getProps({
        componentData: badData
      }));
    });
  });

  describe('given a valid component type and value, and no options', function() {
    var editorId;
    var initialValue = 'testing';
    var componentData = { type: 'html', value: initialValue };
    var theme = 'classic';

    beforeEach(function() {
      $component = $component.componentHTML(getProps({
        componentData,
        theme
      }));

      editorId = $component.attr('data-editor-id');
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $);
    });

    it('sets the data-editor-id attribute on the $component', function() {
      assert.isTrue($component.is('[data-editor-id]'));
    });

    it('calls createEditor on richTextEditorManager', function() {
      sinon.assert.calledWith(createEditorSpy, $component, editorId, initialValue);
    });

    it('calls applyThemeClass during editor creation', function() {
      sinon.assert.calledWith(applyThemeClassSpy, theme);
    });

    it('does not call addContentClass during editor creation', function() {
      sinon.assert.notCalled(addContentClassSpy);
    });

    describe('that is then destroyed', function() {
      it('should call deleteEditor on richTextEditorManager', function() {
        sinon.assert.notCalled(deleteEditorSpy);

        // It should be safe to destroy multiple times.
        $component.trigger('destroy').trigger('destroy');

        sinon.assert.calledOnce(deleteEditorSpy);
        sinon.assert.calledWithExactly(deleteEditorSpy, editorId);
      });
    });

    describe('that is then updated', function() {
      it('calls setContent on the correct editor instance', function() {
        var newValue = 'something';

        $component.componentHTML(getProps({
          componentData: { type: 'html', value: newValue },
          theme
        }));

        sinon.assert.calledWith(getEditorSpy, editorId);
        sinon.assert.calledWith(setContentSpy, newValue);
      });
    });
  });

  describe('given a valid component type and value, and options containing extraContentClasses', function() {
    var initialValue = 'testing';
    var componentData = { type: 'html', value: initialValue };
    var theme = 'classic';
    var extraContentClasses = [ 'the-extra-content-class' ];

    beforeEach(function() {
      $component = $component.componentHTML(getProps({
        componentData,
        theme,
        extraContentClasses
      }));
    });

    it('does not call addContentClass during editor creation', function() {
      sinon.assert.calledWith(addContentClassSpy, 'the-extra-content-class');
    });
  });

});
