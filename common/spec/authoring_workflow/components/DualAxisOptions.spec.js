import React from 'react';
import TestUtils from 'react-dom/test-utils';
import defaultProps from '../defaultProps';
import renderComponent from '../renderComponent';
import I18n from 'common/i18n';
import { DualAxisOptions } from 'common/authoring_workflow/components/DualAxisOptions';
import { getInputDebounceMs } from 'common/authoring_workflow/constants';

describe('DualAxisOptions', () => {

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
    onSecondaryMeasureAxisAutomaticSelected: () => {},
    onSelectColumnAxis: sinon.spy(),
    onSelectLineAxis: sinon.spy()
  });

  beforeEach(() => {
    props.onSelectColumnAxis.reset();
    props.onSelectLineAxis.reset();

    component = renderComponent(DualAxisOptions, props);
  });

  describe('when rendering', () => {

    it('it renders the tabs list', () => {

      assert.isNotNull(component.querySelector('.dual-axis-container .tabs-list'));
      assert.equal(component.querySelectorAll('.dual-axis-container .tabs-list li a').length, 2);

      const columnTab = I18n.t('shared.visualizations.panes.data.fields.dual_axis_options.column');
      assert.equal(component.querySelectorAll('.dual-axis-container .tabs-list li a')[0].innerText, columnTab);

      const lineTab = I18n.t('shared.visualizations.panes.data.fields.dual_axis_options.line');
      assert.equal(component.querySelectorAll('.dual-axis-container .tabs-list li a')[1].innerText, lineTab);
    });

    it('it renders the radio buttons', () => {

      assert.isNotNull(component.querySelector('#dual-axis-primary'));
      assert.isNotNull(component.querySelector('#dual-axis-secondary'));
      assert.isNotNull(component.querySelector('.primary-axis-container .translation-within-label'));
      assert.isNotNull(component.querySelector('.secondary-axis-container .translation-within-label'));

      assert.equal(
        component.querySelector('.primary-axis-container .translation-within-label').innerText,
        I18n.t('shared.visualizations.panes.data.fields.dual_axis_options.primary_axis')
      );

      assert.equal(
        component.querySelector('.secondary-axis-container .translation-within-label').innerText,
        I18n.t('shared.visualizations.panes.data.fields.dual_axis_options.secondary_axis')
      );
    });
  });

  describe('when selecting the primary axis for columns', () => {
    emitsEvent('#dual-axis-primary', 'onSelectColumnAxis');
  });

  describe('when selecting the secondary axis for columns', () => {
    emitsEvent('#dual-axis-secondary', 'onSelectColumnAxis');
  });

  it('when selecting the primary axis for lines', () => {
    const linesTab = component.querySelectorAll('.dual-axis-container .tabs-list li a')[1];
    TestUtils.Simulate.click(linesTab);

    emitsEvent('#dual-axis-primary', 'onSelectLineAxis');
  });

  it('when selecting the secondary axis for lines', () => {
    const linesTab = component.querySelectorAll('.dual-axis-container .tabs-list li a')[1];
    TestUtils.Simulate.click(linesTab);

    emitsEvent('#dual-axis-secondary', 'onSelectLineAxis');
  });
});
