import React from 'react';
import renderComponent from '../renderComponent';
import { ComboChartMeasureSelector } from 'common/authoring_workflow/components/ComboChartMeasureSelector';
import I18n from 'common/i18n';

const props = {
  series: [{
    dataSource: {
      dimension: {
        columnName: 'category',
        aggregationFunction: null
      }
    }
  }]
};

describe('ComboChartMeasureSelector', () => {

  describe('rendering', () => {
    var component;

    beforeEach(() => {
      component = renderComponent(ComboChartMeasureSelector, props);
    });

    it('renders combo chart measure selector tabs list', () => {

      assert.isNotNull(component.querySelector('.tabs-list'));
      assert.equal(component.querySelectorAll('.tabs-list li a').length, 2);

      const columnTab = I18n.t('shared.visualizations.panes.data.fields.combo_chart_measure_selector.column');
      assert.equal(component.querySelectorAll('.tabs-list li a')[0].innerText, columnTab);

      const lineTab = I18n.t('shared.visualizations.panes.data.fields.combo_chart_measure_selector.line');
      assert.equal(component.querySelectorAll('.tabs-list li a')[1].innerText, lineTab);
    });
  });
});
