import _ from 'lodash';
import CustomColorPaletteManager, { __RewireAPI__ as CustomColorPaletteManagerAPI } from 'common/visualizations/dataProviders/CustomColorPaletteManager';
import { COLOR_PALETTES } from 'common/visualizations/views/SvgStyleConstants';
import { customPaletteVif, customPalette } from './testData/customPalette';
import { customPaletteVif as customPalettePieChartVif, customPalette as customPalettePieChart } from './testData/customPalettePieChart';
import { getInitialState } from '../../authoring_workflow/testStore';
import I18n from 'common/i18n';
import allLocales from 'common/i18n/config/locales';

describe('CustomColorPaletteManager', () => {
  beforeEach(() => {
    I18n.translations.en = allLocales.en;
  });

  afterEach(() => {
    I18n.translations = {};
  });

  describe('generateCustomColorPalette', () => {
    let timeStub;
    let categoricalStub;

    beforeEach(() => {
      const results = {
        // null represents (No value) for bar, column, and timeline charts.
        columns: ['dimension', null, '10', '9', '8', '7', '6', '5', '4', '3', '2', '1'],
        rows: [['3',118],['8',112],['5',111],['4',110],['6',107],['9',100],['10',92],['7',90],['1',83],['2',77],['(Other)',0], ['(No value)', 10]]
      };
      timeStub = sinon.stub();
      timeStub.returns(Promise.resolve(results));
      categoricalStub = sinon.stub();
      categoricalStub.returns(Promise.resolve(results));

      CustomColorPaletteManagerAPI.__Rewire__('TimeDataManager', { getData: timeStub });
      CustomColorPaletteManagerAPI.__Rewire__('CategoricalDataManager', { getData: categoricalStub });
    });

    afterEach(() => {
      CustomColorPaletteManagerAPI.__ResetDependency__('TimeDataManager');
      CustomColorPaletteManagerAPI.__ResetDependency__('CategoricalDataManager');
    });

    testCustomPaletteByVisualizationType('columnChart');
    testCustomPaletteByVisualizationType('barChart');
    testCustomPaletteByVisualizationType('timelineChart');
    testCustomPaletteByVisualizationType('pieChart');

    function testCustomPaletteByVisualizationType(visualizationType) {
      let vif;
      let partialPalette;
      let expectedCustomPalette;

      beforeEach(() => {
        vif = visualizationType === 'pieChart' ? customPalettePieChartVif : customPaletteVif;
        expectedCustomPalette = visualizationType === 'pieChart' ? customPalettePieChart : customPalette;
        partialPalette = visualizationType === 'pieChart' ?
        {
          '1': {
            'color': '#aaaaaa',
            'index': 8
          },
          '2': {
            'color': '#aaaaaa',
            'index': 9
          }
        } :
        {
          '1': {
            'color': '#aaaaaa',
            'index': 10
          },
          '2': {
            'color': '#aaaaaa',
            'index': 9
          }
        };
      });

      describe(visualizationType, () => {
        it('returns a custom color palette with categorical color values if customPalette does not exist', (done) => {
          const dimensionColumnName = 'plausibility';
          const testState = getInitialState({
            vifAuthoring: {
              authoring: {
                selectedVisualizationType: visualizationType
              },
              vifs: {
                [visualizationType]: vif
              }
            }
          });

          CustomColorPaletteManager.generateCustomColorPalette(testState.vifAuthoring).
          then((result) => {
            assert.deepEqual(result.customColorPalette, expectedCustomPalette);
            assert.deepEqual(result.dimensionColumnName, dimensionColumnName);
            done();
          }).
          catch(() => done('Did not return a custom color palette'));
        });

        it('returns a custom color palette that keeps the color assignments from the current customPalette', (done) => {
          const dimensionColumnName = 'plausibility';

          const partialPaletteVif = _.cloneDeep(vif);
          _.set(partialPaletteVif, `series[0].color.customPalette.${dimensionColumnName}`, partialPalette);

          const testState = getInitialState({
            vifAuthoring: {
              authoring: {
                selectedVisualizationType: visualizationType
              },
              vifs: {
                [visualizationType]: partialPaletteVif
              }
            }
          });

          CustomColorPaletteManager.generateCustomColorPalette(testState.vifAuthoring).
          then((result) => {
            assert.notDeepEqual(result.customColorPalette, expectedCustomPalette);
            assert.deepEqual(result.customColorPalette['1'], partialPalette['1']);
            assert.deepEqual(result.customColorPalette['2'], partialPalette['2']);
            assert.deepEqual(result.dimensionColumnName, dimensionColumnName);
            done();
          }).
          catch(() => done('Did not return a custom color palette'));
        });
      });
    }

  });
});
