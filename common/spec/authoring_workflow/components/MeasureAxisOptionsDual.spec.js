import React from 'react';
import TestUtils from 'react-dom/test-utils';
import defaultProps from '../defaultProps';
import renderComponent from '../renderComponent';
import I18n from 'common/i18n';
import { MeasureAxisOptionsDual } from 'common/authoring_workflow/components/MeasureAxisOptionsDual';
import { INPUT_DEBOUNCE_MILLISECONDS } from 'common/authoring_workflow/constants';

describe('MeasureAxisOptionsDual', () => {

  function emitsEvent(id, eventName, eventType) {
    it(`should emit an ${eventName} event`, (done) => {
      TestUtils.Simulate[eventType || 'change'](component.querySelector(id));
      setTimeout(() => {
        sinon.assert.calledOnce(props[eventName]);
        done();
      }, INPUT_DEBOUNCE_MILLISECONDS);
    });
  }

  var component;

  const props = defaultProps({
    onPrimaryMeasureAxisAutomaticSelected: sinon.spy()
  });

  beforeEach(() => {
    props.onPrimaryMeasureAxisAutomaticSelected.reset();
    component = renderComponent(MeasureAxisOptionsDual, props);
  });

  describe('when rendering', () => {

    it('it renders the tabs list', () => {

      assert.isNotNull(component.querySelector('.measure-axis-dual-container .tabs-list'));
      assert.equal(component.querySelectorAll('.measure-axis-dual-container .tabs-list li a').length, 2);

      const columnTab = I18n.t('shared.visualizations.panes.data.fields.combo_chart_measure_axis_options.primary_axis');
      assert.equal(component.querySelectorAll('.measure-axis-dual-container .tabs-list li a')[0].innerText, columnTab);

      const lineTab = I18n.t('shared.visualizations.panes.data.fields.combo_chart_measure_axis_options.secondary_axis');
      assert.equal(component.querySelectorAll('.measure-axis-dual-container .tabs-list li a')[1].innerText, lineTab);
    });

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

  describe('when selecting the automatic for left axis', () => {
    emitsEvent('#measure-axis-scale-automatic', 'onPrimaryMeasureAxisAutomaticSelected');
  });

  it('when selecting the automatic for right axis', () => {
    const rightAxisTab = component.querySelectorAll('.measure-axis-dual-container .tabs-list li a')[1];
    TestUtils.Simulate.click(rightAxisTab);

    emitsEvent('#measure-axis-scale-automatic', 'onPrimaryMeasureAxisAutomaticSelected');
  });
});
