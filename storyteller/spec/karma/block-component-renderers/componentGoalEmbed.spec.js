import $ from 'jquery';
import _ from 'lodash';
import { assert } from 'chai';

import { $transient } from '../TransientElement';
import componentGoalEmbed from 'editor/block-component-renderers/componentGoalEmbed'; //eslint-disable-line no-unused-vars

describe('componentGoalEmbed jQuery plugin', () => {
  let $component;

  const validComponentData = {
    type: 'goal.embed',
    value: {
      uid: 'test-test'
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

  beforeEach(() => {
    $transient.append('<div>');
    $component = $transient.children('div');
  });

  afterEach(() => {
    $component.trigger('destroy');
  });

  it('should throw when passed invalid arguments', () => {
    assert.throws(() => { $component.componentGoalEmbed(); });
    assert.throws(() => { $component.componentGoalEmbed(1); });
    assert.throws(() => { $component.componentGoalEmbed(null); });
    assert.throws(() => { $component.componentGoalEmbed(undefined); });
    assert.throws(() => { $component.componentGoalEmbed({}); });
    assert.throws(() => { $component.componentGoalEmbed([]); });
  });

  describe('given a value that does not contain a uid', () => {
    it('should throw when attempting to render the goal', () => {
      const badData = _.cloneDeep(validComponentData);

      delete badData.value.uid;

      assert.throws(() => {
        $component.componentGoalEmbed(getProps({
          componentData: badData
        }));
      });
    });
  });

  describe('given a value that does not contain a type', () => {
    it('should throw when attempting to render the goal', () => {
      const badData = _.cloneDeep(validComponentData);

      delete badData.type;

      assert.throws(() => {
        $component.componentGoalEmbed(getProps({
          componentData: badData
        }));
      });
    });
  });

  describe('given a valid component type and value', () => {
    let component;
    beforeEach(() => {
      component = $component.componentGoalEmbed(getProps());
    });

    it('renders a jQuery object for chaining', () => {
      assert.instanceOf(component, $, 'Returned value is not a jQuery collection');
    });

    it('renders an iframe for the goal embed view', () => {
      assert.equal(component.find('iframe').attr('src'), '/stat/goals/single/test-test/embed');
    });
  });

  describe('in edit mode', () => {
    let component;
    beforeEach(() => {
      component = $component.componentGoalEmbed(getProps({
        theme: 'classic',
        editMode: true
      }));
    });

    it('renders a button for a modal to edit the goal', () => {
      assert.lengthOf(component.find('.component-edit-controls-edit-btn'), 1);
    });

    describe('the edit modal', () => {
      let modalTarget;
      beforeEach(() => {
        modalTarget = component.data('edit-modal');

        component.find('.component-edit-controls-edit-btn').click();
      });

      it('binds to a direct child of body', () => {
        assert.include(_.toArray(document.body.children), modalTarget[0]);
      });

      it('renders an iframe for the goal embed edit view', () => {
        assert.equal(modalTarget.find('iframe').attr('src'), '/stat/goals/single/test-test/embed/edit');
      });

      it('renders a warning about the publication cycle', () => {
        assert.lengthOf(modalTarget.find('section .alert.warning'), 1);
      });

      it('renders a cancel button and a save button', () => {
        assert.lengthOf(modalTarget.find('footer .btn'), 2);
      });
    });

  });
});
