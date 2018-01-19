import _ from 'lodash';
import Lines from 'common/visualizations/views/map/vifOverlays/partials/Lines';
import { mapMockVif } from 'common/spec/visualizations/mapMockVif';

describe('Lines', () => {
  let lines;
  let mockMap;
  let renderOptions;

  beforeEach(() => {
    mockMap = {
      addSource: sinon.spy(),
      addLayer: sinon.spy(),
      setPaintProperty: sinon.spy(),
      removeLayer: sinon.spy(),
      removeSource: sinon.spy()
    };

    renderOptions = {
      countBy: '__resize_by__',
      colorBy: '__color_by_category__',
      colorByCategories: null,
      aggregateAndResizeBy: '__resize_by__'
    };

    lines = new Lines(mockMap);
  });

  describe('setup', () => {
    it('should add source and Layers to the map', () => {
      const vif = mapMockVif();
      lines.setup(vif, renderOptions);

      sinon.assert.calledWith(mockMap.addSource, 'lineVectorDataSource', sinon.match({
        type: 'vector',
        geojsonTile: true,
        aggregateBy: '__resize_by__'
      }));

      sinon.assert.calledWith(mockMap.addLayer,
        sinon.match({
          source: 'lineVectorDataSource',
          id: 'lineLayer',
          'source-layer': '_geojsonTileLayer',
          type: 'line',
          paint: {
            'line-color':'#eb6900',
            'line-width': 5
          }
        })
      );
    });
  });

  describe('update', () => {
    it('should update the map with renderOptions/vif', () => {
      const vif = mapMockVif({});

      lines.setup(vif, renderOptions);
      lines.update(vif, renderOptions);

      sinon.assert.calledWith(mockMap.setPaintProperty, 'lineLayer', 'line-color', '#eb6900');
    });

    it('should destroy and setup if existing and new source options are different', () => {
      let newRenderOptions = _.cloneDeep(renderOptions);
      const vif = mapMockVif({});
      const newVif = mapMockVif({
        series: [{
          color: { primary: 'green' }
        }]
      });
      newRenderOptions.aggregateAndResizeBy = '__count_by__';
      lines.setup(vif, renderOptions);
      lines.update(newVif, newRenderOptions);

      sinon.assert.calledWith(mockMap.removeLayer, 'lineLayer');
      sinon.assert.calledWith(mockMap.removeSource, 'lineVectorDataSource');
    });
  });
});

