import TestUtils from 'react-dom/test-utils';
import defaultProps from '../../defaultProps';
import renderComponent from '../../renderComponent';
import { AxisAndScalePane } from 'common/authoring_workflow/components/panes/AxisAndScalePane';
import { getInputDebounceMs } from 'common/authoring_workflow/constants';

function render(type, dimensionColumnName) {
  const referenceLines = [
    {
      color: '#ba001e',
      label: 'Red Line',
      value: 70000,
      uId: 'a'
    },
    {
      color: '#1e489f',
      label: 'Blue Line',
      value: 60000,
      uId: 'b'
    },
    {
      color: '#067126',
      label: 'Green Line',
      value: 50000,
      uId: 'c'
    }
  ];

  const props = defaultProps({
    vifAuthoring: {
      authoring: { selectedVisualizationType: type },
      vifs: {
        columnChart: { referenceLines },
        barChart: { referenceLines },
        timelineChart: {
          referenceLines,
          series: [{
            dataSource: {
              dimension: {
                columnName: dimensionColumnName,
                aggregationFunction: null
              }
            }
          }]
        },
        histogram: { referenceLines }
      }
    },
    metadata: {
      data: {
        columns: [
          { name: 'number', fieldName: 'number', renderTypeName: 'number' },
          { name: 'calendar_Date', fieldName: 'calendar_date', renderTypeName: 'calendar_date' }
        ]
      }
    },
    measureAxisScaleControl: 'custom',
    onClickAddReferenceLine: sinon.spy(),
    onSelectChartSorting: sinon.spy()
  });

  return {
    props,
    component: renderComponent(AxisAndScalePane, props),
    referenceLines
  };
}

describe('AxisAndScalePane', () => {
  let component;
  let props;
  let referenceLines;

  function setUpVisualization(type, dimensionColumnName = null) {
    return () => {
      const renderedParts = render(type, dimensionColumnName);

      component = renderedParts.component;
      props = renderedParts.props;
      referenceLines = renderedParts.referenceLines;
    };
  }

  function emitsEvent(id, eventName, eventType) {
    it(`should emit an ${eventName} event`, (done) => {
      TestUtils.Simulate[eventType || 'change'](component.querySelector(id));
      setTimeout(() => {
        sinon.assert.calledOnce(props[eventName]);
        done();
      }, getInputDebounceMs());
    });
  }

  function rendersReferenceLinesAndEmitsEvents() {
    describe('rendering', () => {

      it('renders an Add Reference Line link', () => {
        assert.isNotNull(component.querySelector('#reference-lines-add-reference-line-link'));
      });

      it('renders three sets of reference line controls', () => {
        assert.isNotNull(component.querySelector('#reference-lines-reference-line-container-0'));
        assert.isNotNull(component.querySelector('#reference-lines-reference-line-container-1'));
        assert.isNotNull(component.querySelector('#reference-lines-reference-line-container-2'));

        const valueInput0 = component.querySelector('#reference-lines-value-input-0');
        assert.equal(valueInput0.value, referenceLines[0].value, 'value text input');
        const labelInput0 = component.querySelector('#reference-lines-label-input-0');
        assert.equal(labelInput0.value, referenceLines[0].label, 'label text input');

        const valueInput1 = component.querySelector('#reference-lines-value-input-1');
        assert.equal(valueInput1.value, referenceLines[1].value, 'value text input');
        const labelInput1 = component.querySelector('#reference-lines-label-input-1');
        assert.equal(labelInput1.value, referenceLines[1].label, 'label text input');

        const valueInput2 = component.querySelector('#reference-lines-value-input-2');
        assert.equal(valueInput2.value, referenceLines[2].value, 'value text input');
        const labelInput2 = component.querySelector('#reference-lines-label-input-2');
        assert.equal(labelInput2.value, referenceLines[2].label, 'label text input');
      });
    });

    describe('events', () => {
      describe('when clicking the Add Reference Line link', () => {
        emitsEvent('#reference-lines-add-reference-line-link', 'onClickAddReferenceLine', 'click');
      });
    });
  }

  function rendersChartSortingAndEmitsEvents() {
    describe('rendering', () => {
      it('renders a dropdown with chart sorting options', () => {
        assert.isNotNull(component.querySelector('#chart-sorting-selection'));
      });
    });

    describe('events', () => {
      describe('when changing the chart sorting order', () => {
        emitsEvent('#chart-sorting-selection .picklist-option', 'onSelectChartSorting', 'click');
      });
    });
  }

  describe('without a visualization type', () => {
    beforeEach(() => {
      var renderedParts = render(null);

      component = renderedParts.component;
      props = renderedParts.props;
    });

    describe('rendering', () => {
      it('renders an empty pane info message', () => {
        assert.isNotNull(component.querySelector('.authoring-empty-pane'));
      });
    });
  });

  describe('barChart', () => {
    beforeEach(setUpVisualization('barChart'));

    // TODO: EN-9281 rendersScaleAndEmitsEvents();
    rendersChartSortingAndEmitsEvents();
    rendersReferenceLinesAndEmitsEvents();
  });

  describe('columnChart', () => {
    beforeEach(setUpVisualization('columnChart'));

    // TODO: EN-9281 rendersScaleAndEmitsEvents();
    rendersChartSortingAndEmitsEvents();
    rendersReferenceLinesAndEmitsEvents();
  });

  describe('histogram', () => {
    beforeEach(setUpVisualization('histogram'));

    // TODO: EN-9281 rendersScaleAndEmitsEvents();
    rendersReferenceLinesAndEmitsEvents();
  });

  describe('timelineChart', () => {

    describe('when dimension is not a calendar_date', () => {
      beforeEach(setUpVisualization('timelineChart'));
      rendersChartSortingAndEmitsEvents();
      rendersReferenceLinesAndEmitsEvents();

      it('does render a dropdown with chart sorting options', () => {
        assert.isNotNull(component.querySelector('#chart-sorting-selection'));
      });
    });

    describe('when dimension is a calendar_date', () => {
      beforeEach(setUpVisualization('timelineChart', 'calendar_date'));
      rendersReferenceLinesAndEmitsEvents();

      it('does not render a dropdown with chart sorting options', () => {
        assert.isNull(component.querySelector('#chart-sorting-selection'));
      });
    });
  });

  describe('pieChart', () => {
    beforeEach(setUpVisualization('pieChart'));

    rendersChartSortingAndEmitsEvents();
  });
});
