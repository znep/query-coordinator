import $ from 'jquery';
import _ from 'lodash';
import sinon from 'sinon';
import { assert } from 'chai';

import { stubConsoleError } from '../consoleStub';
import { $transient } from '../TransientElement';
import I18nMocker from '../I18nMocker';
import {__RewireAPI__ as componentSocrataVisualizationVizCanvasAPI} from 'editor/block-component-renderers/componentSocrataVisualizationVizCanvas';

describe('componentSocrataVisualizationVizCanvas jQuery plugin', () => {
  let $component;

  const VIF_ID = 'some-id-that-is-a-uuid';
  const validComponentData = {
    type: 'socrata.visualization.vizCanvas',
    value: {
      layout: {
        height: 300
      },
      dataset: {
        domain: 'example.com',
        datasetUid: 'test-test',
        vifId: VIF_ID
      }
    }
  };

  const validVizCanvasViewData = {
    id: 'test-test',
    name: 'Visualization Canvas',
    displayType: 'visualization',
    domainCName: 'example.com',
    displayFormat: {
      visualizationCanvasMetadata: {
        vifs: [
          {
            id: VIF_ID,
            configuration: {
              viewSourceDataLink: true
            },
            series: [
              {
                type: 'timelineChart',
                dataSource: {
                  domain: 'example.com',
                  type: 'socrata.soql',
                  datasetUid: 'four-four',
                  dimension: {
                    columnName: 'column_name'
                  }
                }
              }
            ]
          }
        ]
      }
    }
  };

  const getProps = (props) => {
    return _.extend({
      blockId: null,
      componentData: validComponentData,
      componentIndex: null,
      theme: null,
      useMetadataCache: false
    }, props);
  };

  let visualizationRendererSpy;

  function stubApiAndCreateComponentWith(statusCode, response = {}, componentData = validComponentData) {
    let server;

    beforeEach((done) => {
      visualizationRendererSpy = sinon.spy();
      componentSocrataVisualizationVizCanvasAPI.__Rewire__('VisualizationRenderer', visualizationRendererSpy);

      server = sinon.fakeServer.create();
      server.respondImmediately = true;
      server.respondWith(
        'GET',
        `https://example.com/api/views/${componentData.value.dataset.datasetUid}.json?read_from_nbe=true&version=2.1`,
        [
          statusCode,
          { 'Content-Type': 'application/json' },
          JSON.stringify(response)
        ]
      );

      $component = $component.componentSocrataVisualizationVizCanvas(getProps({ componentData }));

      setTimeout(() => { done(); }, 0);
    });

    afterEach(() => {
      componentSocrataVisualizationVizCanvasAPI.__ResetDependency__('VisualizationRenderer');
      server.restore();
    });
  }

  before(() => {
    componentSocrataVisualizationVizCanvasAPI.__Rewire__('I18n', I18nMocker);
  });

  after(() => {
    componentSocrataVisualizationVizCanvasAPI.__ResetDependency__('I18n');
  });

  beforeEach(() => {
    $transient.append('<div>');
    $component = $transient.children('div');
  });

  it('throws when passed invalid arguments', () => {
    assert.throws(() => { $component.componentSocrataVisualizationVizCanvas(); });
    assert.throws(() => { $component.componentSocrataVisualizationVizCanvas(1); });
    assert.throws(() => { $component.componentSocrataVisualizationVizCanvas(null); });
    assert.throws(() => { $component.componentSocrataVisualizationVizCanvas(undefined); });
    assert.throws(() => { $component.componentSocrataVisualizationVizCanvas({}); });
    assert.throws(() => { $component.componentSocrataVisualizationVizCanvas([]); });
  });

  describe('given a type that is not supported', () => {
    it('throws when instantiated', () => {
      const badData = _.cloneDeep(validComponentData);
      badData.type = 'notSocrata.notVisualization.notVizCanvas';
      assert.throws(() => {
        $component.componentSocrataVisualizationVizCanvas(getProps({ componentData: badData }));
      });
    });
  });

  describe('given an incomplete visualization config', () => {
    it('throws when instantiated without domain', () => {
      const badData = _.cloneDeep(validComponentData);
      delete badData.value.dataset.domain;
      assert.throws(() => {
        $component.componentSocrataVisualizationVizCanvas(
          getProps({ componentData: badData })
        );
      });
    });

    it('throws when instantiated without viewUid', () => {
      let badData = _.cloneDeep(validComponentData);
      delete badData.value.dataset.datasetUid;
      assert.throws(() => {
        $component.componentSocrataVisualizationVizCanvas(
          getProps({ componentData: badData })
        );
      });
    });

    it('throws when instantiated without vifId', () => {
      let badData = _.cloneDeep(validComponentData);
      delete badData.value.dataset.vifId;
      assert.throws(() => {
        $component.componentSocrataVisualizationVizCanvas(
          getProps({ componentData: badData })
        );
      });
    });
  });

  describe('given a valid component type and value', () => {
    describe('when there is a valid viz-canvas view with that 4x4', () => {
      stubApiAndCreateComponentWith(200, validVizCanvasViewData, validComponentData);

      it('returns a jQuery object for chaining', () => {
        assert.instanceOf($component, $, 'Returned value is not a jQuery collection');
      });

      it('adds a class to the component element', () => {
        assert.isTrue($component.hasClass('component-socrata-visualization-viz-canvas'));
      });

      it('calls VisualizationRenderer with the correct parameters', () => {
        let vif = validVizCanvasViewData.displayFormat.visualizationCanvasMetadata.vifs[0];

        // our code makes sure we have default values for units and filters before rendering
        _.set(vif, 'unit.one', 'Translation for: editor.visualizations.default_unit.one');
        _.set(vif, 'unit.other', 'Translation for: editor.visualizations.default_unit.other');
        _.set(vif, 'series[0].dataSource.filters', []);

        sinon.assert.calledWithExactly(
          visualizationRendererSpy,
          vif,
          $component.find('.component-content'),
          { displayFilterBar: true }
        );
      });

      describe('when stored rendered vif becomes unparsable', () => {
        stubConsoleError();

        it('renders error', () => {
          $component.attr('data-rendered-vif', 'unparseable');
          $component.componentSocrataVisualizationVizCanvas(getProps({ componentData: validComponentData }));

          const $alert = $component.find('.socrata-visualization-error-message');

          assert.lengthOf($alert, 1);
          assert.include($alert.text(), 'Translation for: editor.viz_canvas.errors.status_unspecified');
        });
      });
    });

    describe('when the viz-canvas view returns unauthorized', () => {
      stubConsoleError();
      stubApiAndCreateComponentWith(403);

      it('does not render visualization', () => {
        sinon.assert.notCalled(visualizationRendererSpy);
      });

      it('renders error', () => {
        const $alert = $component.find('.socrata-visualization-error-message');

        assert.lengthOf($alert, 1);
        assert.include($alert.text(), 'Translation for: editor.viz_canvas.errors.status_403');
      });
    });

    describe('when the viz-canvas view returns not found', () => {
      stubConsoleError();
      stubApiAndCreateComponentWith(404);

      it('does not render visualization', () => {
        sinon.assert.notCalled(visualizationRendererSpy);
      });

      it('renders error', () => {
        const $alert = $component.find('.socrata-visualization-error-message');

        assert.lengthOf($alert, 1);
        assert.include($alert.text(), 'Translation for: editor.viz_canvas.errors.status_404');
      });
    });

    describe('when the viz-canvas view returns another error', () => {
      stubConsoleError();
      stubApiAndCreateComponentWith(401);

      it('does not render visualization', () => {
        sinon.assert.notCalled(visualizationRendererSpy);
      });

      it('renders error', () => {
        const $alert = $component.find('.socrata-visualization-error-message');

        assert.lengthOf($alert, 1);
        assert.include($alert.text(), 'Translation for: editor.viz_canvas.errors.status_unspecified');
      });
    });

    describe('when the viz-canvas view does not contain the referenced vif', () => {
      stubConsoleError();
      let componentDataWithWrongVifId = _.cloneDeep(validComponentData);
      componentDataWithWrongVifId.value.dataset.vifId = 'not-the-right-id-at-all';

      stubApiAndCreateComponentWith(200, validVizCanvasViewData, componentDataWithWrongVifId);

      it('does not render visualization', () => {
        sinon.assert.notCalled(visualizationRendererSpy);
      });

      it('renders error', () => {
        const $alert = $component.find('.socrata-visualization-error-message');

        assert.lengthOf($alert, 1);
        assert.include($alert.text(), 'Translation for: editor.viz_canvas.errors.status_404');
      });
    });

  });

});
