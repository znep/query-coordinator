import React from 'react';
import TestUtils from 'react-dom/test-utils';
import defaultProps from '../defaultProps';
import renderComponent from '../renderComponent';
import I18n from 'common/i18n';
import { MeasureAxisOptionsSingle } from 'common/authoring_workflow/components/MeasureAxisOptionsSingle';
import { getInputDebounceMs } from 'common/authoring_workflow/constants';

describe('MeasureAxisOptionsSingle', () => {

  function emitsEvent(id, eventName, eventType) {
    it(`should emit an ${eventName} event`, (done) => {
      TestUtils.Simulate[eventType || 'change'](component.querySelector(id));
      setTimeout(() => {
        sinon.assert.calledOnce(props[eventName]);
        done();
      }, getInputDebounceMs());
    });
  }

  var component;

  const props = defaultProps({
    onMeasureAxisAutomaticSelected: sinon.spy()
  });

  beforeEach(() => {
    component = renderComponent(MeasureAxisOptionsSingle, props);
  });

  describe('when rendering', () => {

    it('it renders the radio buttons', () => {

      assert.isNotNull(component.querySelector('#measure-axis-scale-automatic'));
      assert.isNotNull(component.querySelector('#measure-axis-scale-custom'));
      assert.isNotNull(component.querySelector('.measure-axis-scale-automatic-container .translation-within-label'));
      assert.isNotNull(component.querySelector('.measure-axis-scale-custom-container .translation-within-label'));

      assert.equal(
        component.querySelector('.measure-axis-scale-automatic-container .translation-within-label').innerText,
        I18n.t('shared.visualizations.panes.axis_and_scale.fields.scale.automatic')
      );

      assert.equal(
        component.querySelector('.measure-axis-scale-custom-container .translation-within-label').innerText,
        I18n.t('shared.visualizations.panes.axis_and_scale.fields.scale.custom')
      );
    });
  });

  describe('when selecting automatic', () => {
    emitsEvent('#measure-axis-scale-automatic', 'onMeasureAxisAutomaticSelected');
  });
});
