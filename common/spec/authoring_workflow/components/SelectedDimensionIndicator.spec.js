import _ from 'lodash';
import { assert } from 'chai';
import { Simulate } from 'react-addons-test-utils';

import renderComponent from '../renderComponent';
import defaultProps from '../defaultProps';
import columnChartData from '../testData/columnChart';
import { SelectedDimensionIndicator } from 'common/authoring_workflow/components/SelectedDimensionIndicator';
import ConnectedSelectedDimensionIndicator from 'common/authoring_workflow/components/SelectedDimensionIndicator';

import { translate } from 'common/visualizations/I18n';

const validMetadata = {
  data: {
    columns: [
      { name: 'column1', fieldName: 'column1', renderTypeName: 'number' },
      { name: 'column2', fieldName: 'column2', renderTypeName: 'number' }
    ]
  },
  phidippidesMetadata: {
    columns: {
      column1: { name: 'column1', renderTypeName: 'number' },
      column2: { name: 'column2', renderTypeName: 'number' }
    }
  }
};

const dimensionSelectedVifAuthoring = {
  vifs: {
    columnChart: _.merge(columnChartData(), {
      series: [
        _.merge(columnChartData().series[0], {
          dataSource: {
            dimension: {
              columnName: 'column1'
            }
          }
        })
      ]
    })
  }
};

describe('SelectedDimensionIndicator', () => {
  it('should render empty selection message if there is no dimension selected', () => {
    const component = renderComponent(ConnectedSelectedDimensionIndicator, defaultProps());
    const emptySelectionTranslation = translate('panes.data.fields.dimension.empty_selection');
    assert(component.textContent === emptySelectionTranslation);
  });

  it('should render given dimension\'s name if exists', () => {
    const component = renderComponent(ConnectedSelectedDimensionIndicator, defaultProps(), {
      metadata: validMetadata,
      vifAuthoring: _.merge(dimensionSelectedVifAuthoring, {
        vifs: {
          columnChart: {
            series: [
              _.merge(columnChartData().series[0], {
                dataSource: {
                  dimension: {
                    columnName: 'column1'
                  }
                }
              })
            ]
          }
        }
      })
    });

    assert.isOk(component.querySelector('.icon-number'));
    assert.isOk(component.querySelector('.recommended-indicator'));
    assert.match(component.textContent, /column1/);
  });

  it('should unselect the dimension when clear button is clicked', () => {
    const state = {
      metadata: validMetadata,
      vifAuthoring: dimensionSelectedVifAuthoring
    };

    const clearCallback = sinon.spy();

    const component = renderComponent(SelectedDimensionIndicator, defaultProps({
      dimensionFieldName: 'column1',
      validDimensions: [validMetadata.data.columns[0]],
      recommendedDimensions: validMetadata.data.columns,
      onRemoveSelection: clearCallback
    }));

    const clearButton = component.querySelector('.btn-clear-dimension');
    Simulate.click(clearButton);

    assert(clearCallback.calledOnce);
  });
});

