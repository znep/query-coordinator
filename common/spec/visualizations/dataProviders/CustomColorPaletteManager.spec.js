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

  describe('getDisplayedColorsFromCustomPalette', () => {
    let currentPalette;

    beforeEach(() => {
      currentPalette = {
        '10988': { 'color': '#fdbb69', 'index': 11 },
        '10989': { 'color': '#f06c45', 'index': 10 },
        '10990': { 'color': '#e42022', 'index': 9 },
        '10991': { 'color': '#f16666', 'index': 8 },
        '10992': { 'color': '#dc9a88', 'index': 7 },
        '10993': { 'color': '#6f9e4c', 'index': 6 },
        '10994': { 'color': '#52af43', 'index': 5 },
        '10995': { 'color': '#98d277', 'index': 4 },
        '10996': { 'color': '#7eba98', 'index': 3 },
        '10997': { 'color': '#2d82af', 'index': 2 },
        '10998': { 'color': '#5b9ec9', 'index': 1 },
        '10999': { 'color': '#a6cee3', 'index': 0 },
        '(Other)': { 'color': '#fe982c', 'index': 12 }
      };
    });

    it('returns the corresponding custom colors for all grouping values', () => {
      const columnNames = [ '10988', '10989', '10990', '10991', '10992', '10993', '10994', '10995', '10996', '10997', '10998', '10999', '(Other)' ];
      const expectedColumnColors = ['#fdbb69', '#f06c45', '#e42022', '#f16666', '#dc9a88', '#6f9e4c', '#52af43', '#98d277', '#7eba98', '#2d82af', '#5b9ec9', '#a6cee3', '#fe982c'];
      const colorsToRender = CustomColorPaletteManager.getDisplayedColorsFromCustomPalette(
        columnNames,
        currentPalette
      );

      assert.deepEqual(colorsToRender, expectedColumnColors);
    });

    it('returns the corresponding custom colors for a subset of column values', () => {
      const columnNames = [ '10988', '10995', '10999' ];
      const expectedColumnColors = ['#fdbb69', '#98d277', '#a6cee3'];
      const colorsToRender = CustomColorPaletteManager.getDisplayedColorsFromCustomPalette(
        columnNames,
        currentPalette
      );

      assert.deepEqual(colorsToRender, expectedColumnColors);
    });

    it('returns values from the base color palette if column names not in the custom palette are given', () => {
      const columnNames = [ 'invalid', 'names' ];
      const expectedColumnColors = COLOR_PALETTES.categorical.slice(0, 2);
      const colorsToRender = CustomColorPaletteManager.getDisplayedColorsFromCustomPalette(
        columnNames,
        currentPalette
      );

      assert.deepEqual(colorsToRender, expectedColumnColors);
    });
  });

});
