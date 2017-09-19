import React from 'react';
import TestUtils from 'react-dom/test-utils';
import _ from 'lodash';

import defaultProps from '../../defaultProps';
import renderComponent from '../../renderComponent';
import vifs from 'common/authoring_workflow/vifs';
import { PresentationPane } from 'common/authoring_workflow/components/panes/PresentationPane';
import { INPUT_DEBOUNCE_MILLISECONDS } from 'common/authoring_workflow/constants';

function createVifAuthoring(type, groupBy) {
  const vifAuthoring = {
    authoring: {
      selectedVisualizationType: type
    },
    vifs: {...vifs}
  };

  if(groupBy) _.set(vifAuthoring, 'vifs.timelineChart.series[0].dataSource.dimension.grouping.columnName', 'example_grouping');

  return vifAuthoring;
}

function render(type, groupBy) {
  var props = defaultProps({
    vifAuthoring: createVifAuthoring(type, groupBy),
    onChangeBaseColor: sinon.spy(),
    onSelectBaseLayer: sinon.spy(),
    onChangeBaseLayerOpacity: sinon.spy(),
    onChangePointColor: sinon.spy(),
    onChangePointOpacity: sinon.spy(),
    onChangePointSize: sinon.spy(),
    onChangeShowDimensionLabels: sinon.spy(),
    onChangeShowValueLabels: sinon.spy(),
    onChangeShowValueLabelsAsPercent: sinon.spy(),
    onChangeLabelTop: sinon.spy(),
    onChangeLabelBottom: sinon.spy(),
    onChangeLabelLeft: sinon.spy(),
    onChangeTitle: sinon.stub(),
    onChangeDescription: sinon.stub(),
    onChangeShowSourceDataLink: sinon.stub(),
    onSelectColorScale: sinon.spy(),
    onSelectColorPalette: sinon.spy()
  });

  return {
    props: props,
    component: renderComponent(PresentationPane, props)
  };
}

describe('PresentationPane', () => {
  var component;
  var props;

  function setUpVisualization(type, groupBy) {
    return () => {
      var renderedParts = render(type, groupBy);

      component = renderedParts.component;
      props = renderedParts.props;
    };
  }

  function emitsEvent(selector, eventName, eventType) {
    it(`should emit an ${eventName} event`, function(done) {
      TestUtils.Simulate[eventType || 'change'](component.querySelector(selector));

      setTimeout(() => {
        sinon.assert.calledOnce(props[eventName]);
        done();
      }, INPUT_DEBOUNCE_MILLISECONDS);
    });
  }

  function rendersShowDimensionLabelsAndEmitsEvents() {
    describe('rendering', () => {
      it('renders a show dimension labels checkbox', () => {
        expect(component.querySelector('#show-dimension-labels')).to.exist;
      });
    });

    describe('events', () => {
      describe('when changing the show dimension labels checkbox', () => {
        emitsEvent('#show-dimension-labels', 'onChangeShowDimensionLabels');
      });
    });
  }

  function rendersShowValueLabelsAndEmitsEvents() {
    describe('rendering', () => {
      it('renders a show value labels checkbox', () => {
        expect(component.querySelector('#show-value-labels')).to.exist;
      });
    });

    describe('events', () => {
      describe('when changing the show value labels checkbox', () => {
        emitsEvent('#show-value-labels', 'onChangeShowValueLabels');
      });
    });
  }

  function rendersShowValueLabelsAsPercentAndEmitEvents() {
    describe('rendering', () => {
      it('renders a show value labels as percentage checkbox', () => {
        expect(component.querySelector('#show-value-labels-as-percent')).to.exist;
      });
    });

    describe('events', function () {
      describe('when changing the show value labels as percent checkbox', function () {
        emitsEvent('#show-value-labels-as-percent', 'onChangeShowValueLabelsAsPercent');
      })
    });
  }

  function rendersTopAndLeftLabelsAndEmitsEvents() {
    describe('rendering', () => {
      it('renders a top label input', () => {
        expect(component.querySelector('#label-top')).to.exist;
      });

      it('renders a left label input', () => {
        expect(component.querySelector('#label-left')).to.exist;
      });
    });

    describe('events', () => {
      describe('when changing the top label', () => {
        emitsEvent('#label-top', 'onChangeLabelTop');
      });

      describe('when changing the left label', () => {
        emitsEvent('#label-left', 'onChangeLabelLeft');
      });
    });
  }

  function rendersBottomAndLeftLabelsAndEmitsEvents() {
    describe('rendering', () => {
      it('renders a bottom label input', () => {
        expect(component.querySelector('#label-bottom')).to.exist;
      });

      it('renders a left label input', () => {
        expect(component.querySelector('#label-left')).to.exist;
      });
    });

    describe('events', () => {
      describe('when changing the bottom label', () => {
        emitsEvent('#label-bottom', 'onChangeLabelBottom');
      });

      describe('when changing the left label', () => {
        emitsEvent('#label-left', 'onChangeLabelLeft');
      });
    });
  }

  describe('without a visualization type', () => {
    beforeEach(setUpVisualization(null));

    describe('rendering', () => {
      it('renders an empty pane info message', () => {
        expect(component.querySelector('.authoring-empty-pane')).to.exist;
      });
    });
  });

  describe('with a visualization type', () => {
    beforeEach(setUpVisualization('barChart'));

    describe('rendering', () => {
      it('renders a title text input', () => {
        expect(component.querySelector('input[type="text"]')).to.exist;
      });

      it('renders a description text area', () => {
        expect(component.querySelector('textarea')).to.exist;
      });

      it('renders a source data link checkbox', () => {
        expect(component.querySelector('input[type="checkbox"]')).to.exist;
      });
    });

    describe('events', () => {
      describe('when changing the title', () => {
        it('should emit an onChangeTitle event', function(done) {
          var input = component.querySelector('input[type="text"]');

          TestUtils.Simulate.change(input);

          setTimeout(() => {
            sinon.assert.calledOnce(props.onChangeTitle);
            done();
          }, INPUT_DEBOUNCE_MILLISECONDS);
        });
      });

      describe('when changing the description', () => {
        it('should emit an onChangeDescription event', function(done) {
          var textarea = component.querySelector('textarea');

          TestUtils.Simulate.change(textarea);

          setTimeout(() => {
            sinon.assert.calledOnce(props.onChangeDescription);
            done();
          }, INPUT_DEBOUNCE_MILLISECONDS);
        });
      });

      describe('when changing the visibility of source data link', () => {
        it('should emit an onChangeShowSourceDataLink event', () => {
          var checkbox = component.querySelector('input[type="checkbox"]');

          TestUtils.Simulate.change(checkbox);
          sinon.assert.calledOnce(props.onChangeShowSourceDataLink);
        });
      });
    });
  });

  describe('regionMap', () => {
    beforeEach(setUpVisualization('regionMap'));

    describe('rendering', () => {
      it('renders color scale', () => {
        expect(component.querySelector('#color-scale')).to.exist;
      });

      it('renders map type', () => {
        expect(component.querySelector('#base-layer')).to.exist;
      });

      it('renders map opacity', () => {
        expect(component.querySelector('#base-layer-opacity')).to.exist;
      });
    });

    describe('events', () => {
      describe('when changing the color scale', () => {
        emitsEvent('#color-scale .picklist-option', 'onSelectColorScale', 'click');
      });

      describe('when changing the map type', () => {
        emitsEvent('#base-layer .picklist-option', 'onSelectBaseLayer', 'click');
      });
    });
  });

  describe('barChart', function () {
    beforeEach(setUpVisualization('barChart'));

    describe('rendering', () => {
      it('renders an input', () => {
        expect(component.querySelector('.color-picker')).to.exist;
      });
    });

    rendersShowDimensionLabelsAndEmitsEvents();
    rendersShowValueLabelsAndEmitsEvents();
    rendersTopAndLeftLabelsAndEmitsEvents();
  });

  describe('columnChart', () => {
    beforeEach(setUpVisualization('columnChart'));

    describe('rendering', () => {
      it('renders an input', () => {
        expect(component.querySelector('.color-picker')).to.exist;
      });
    });

    rendersShowDimensionLabelsAndEmitsEvents();
    rendersBottomAndLeftLabelsAndEmitsEvents();
  });

  describe('histogram', () => {
    beforeEach(setUpVisualization('histogram'));

    describe('rendering', () => {
      it('renders an input', () => {
        expect(component.querySelector('.color-picker')).to.exist;
      });
    });

    rendersBottomAndLeftLabelsAndEmitsEvents();
  });

  describe('featureMap', () => {
    beforeEach(setUpVisualization('featureMap'));

    describe('rendering', () => {
      it('renders point color', () => {
        expect(component.querySelector('.color-picker')).to.exist;
      });

      it('renders point opacity', () => {
        expect(component.querySelector('#point-opacity')).to.exist;
      });

      it('renders point size', () => {
        expect(component.querySelector('#point-size')).to.exist;
      });

      it('renders map type', () => {
        expect(component.querySelector('#base-layer')).to.exist;
      });

      it('renders map opacity', () => {
        expect(component.querySelector('#base-layer-opacity')).to.exist;
      });
    });

    describe('events', () => {
      emitsEvent('#base-layer .picklist-option', 'onSelectBaseLayer', 'click');
    });
  });

  describe('timelineChart', () => {
    beforeEach(setUpVisualization('timelineChart'));

    describe('rendering', () => {
      it('renders an input', () => {
        expect(component.querySelector('.color-picker')).to.exist;
      });
    });

    rendersBottomAndLeftLabelsAndEmitsEvents();
  });

  describe('Grouped timelineChart', () => {
    beforeEach(setUpVisualization('timelineChart', 'example_grouping'));

    rendersBottomAndLeftLabelsAndEmitsEvents();
  });

  describe('pieChart', () => {
    beforeEach(setUpVisualization('pieChart'));

    describe('rendering', () => {
      it('renders color palette selection', () => {
        expect(component.querySelector('#color-palette')).to.not.equal(null);
      });

      it('renders a custom color palette option at the end of the picklist', () => {
        expect(component.querySelector('#custom-6')).to.not.equal(null);
        expect(component.querySelector('#custom-1')).to.equal(null);
      });
    });

    rendersShowValueLabelsAndEmitsEvents();
    rendersShowValueLabelsAsPercentAndEmitEvents();
  });


});
