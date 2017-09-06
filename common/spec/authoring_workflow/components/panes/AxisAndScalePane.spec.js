import TestUtils from 'react-addons-test-utils';
import defaultProps from '../../defaultProps';
import renderComponent from '../../renderComponent';
import { AxisAndScalePane } from 'common/authoring_workflow/components/panes/AxisAndScalePane';
import { INPUT_DEBOUNCE_MILLISECONDS } from 'common/authoring_workflow/constants';

function render(type) {
  const referenceLines = [
    {
      color: "#ba001e",
      label: "Red Line",
      value: 70000
    },
    {
      color: "#1e489f",
      label: "Blue Line",
      value: 60000
    },
    {
      color: "#067126",
      label: "Green Line",
      value: 50000
    }
  ];
  
  const props = defaultProps({
    vifAuthoring: { 
      authoring: { selectedVisualizationType: type },
      vifs: { 
        columnChart: { referenceLines },
        barChart: { referenceLines },
        timelineChart: { referenceLines },
        histogram: { referenceLines }
       }
    },
    measureAxisScaleControl: 'custom',
    onClickAddReferenceLine: sinon.spy(),
    onSelectChartSorting: sinon.spy(),
    onMeasureAxisMinValueChange: sinon.spy(),
    onMeasureAxisMaxValueChange: sinon.spy()
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

  function setUpVisualization(type) {
    return () => {
      const renderedParts = render(type);

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
      }, INPUT_DEBOUNCE_MILLISECONDS);
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
        expect(component.querySelector('#chart-sorting-selection')).to.exist;
      });
    });

    describe('events', () => {
      describe('when changing the chart sorting order', () => {
        emitsEvent('#chart-sorting-selection .picklist-option', 'onSelectChartSorting', 'click');
      });
    });
  }

  function rendersScaleAndEmitsEvents() {
    describe('rendering', () => {
      it('renders automatic selection', () => {
        expect(component.querySelector('#measure-axis-scale-automatic')).to.exist;
      });

      it('renders custom selection', () => {
        expect(component.querySelector('#measure-axis-scale-custom')).to.exist;
      });

      it('renders min input', () => {
        expect(component.querySelector('#measure-axis-scale-custom-min')).to.exist;
      });

      it('renders max input', () => {
        expect(component.querySelector('#measure-axis-scale-custom-max')).to.exist;
      });
    });

    describe('events', () => {
      describe('when clicking #measure-axis-scale-custom-min', () => {
        emitsEvent('#measure-axis-scale-custom-min', 'onMeasureAxisMinValueChange');
      });

      describe('when clicking #measure-axis-scale-custom-max', () => {
        emitsEvent('#measure-axis-scale-custom-max', 'onMeasureAxisMaxValueChange');
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
        expect(component.querySelector('.authoring-empty-pane')).to.exist;
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
    beforeEach(setUpVisualization('timelineChart'));

    // TODO: EN-9281 rendersScaleAndEmitsEvents();
    rendersReferenceLinesAndEmitsEvents();
  });

  describe('pieChart', () => {
    beforeEach(setUpVisualization('pieChart'));

    rendersChartSortingAndEmitsEvents();
  });
});
