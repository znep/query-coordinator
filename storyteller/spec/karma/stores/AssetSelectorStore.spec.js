import _ from 'lodash';
import { assert } from 'chai';
import sinon from 'sinon';

import StandardMocks from '../StandardMocks';
import Constants from 'editor/Constants';
import Actions from 'editor/Actions';
import StorytellerUtils from 'StorytellerUtils';
import Dispatcher from 'editor/Dispatcher';
import Store, {__RewireAPI__ as StoreAPI} from 'editor/stores/Store';
import AssetSelectorStore, {viewIsDirectlyVisualizable, WIZARD_STEP, __RewireAPI__ as AssetSelectorStoreAPI} from 'editor/stores/AssetSelectorStore';
import {STATUS} from 'editor/stores/FileUploaderStore';
import FileUploaderStoreMocker from '../mocks/FileUploaderStoreMocker.js';
import I18nMocker from '../I18nMocker';

const nbeView = {
  'id' : StandardMocks.validStoryUid,
  'name' : 'nbe',
  'displayType' : 'table',
  'domain' : 'example.com',
  'newBackend' : true,
  'viewType' : 'tabular',
  'query' : {}
};
const obeViewWithNoQuery = {
  'id' : StandardMocks.validStoryUid,
  'name' : 'obe plain',
  'displayType' : 'table',
  'domain' : 'example.com',
  'newBackend' : false,
  'viewType' : 'tabular',
  'query' : {}
};

describe('AssetSelectorStore static functions', function() {
  describe('viewIsDirectlyVisualizable', function() {
    describe('making a table', function() {
      var tableType = 'socrata.visualization.table';
      it('return true for nbe views', function() {
        assert.isTrue(viewIsDirectlyVisualizable(tableType, nbeView));
      });
      it('return true for obe views', function() {
        assert.isTrue(viewIsDirectlyVisualizable(tableType, obeViewWithNoQuery));
      });
    });

    describe('making a non-table visualization', function() {
      var columnChart = 'socrata.visualization.columnChart';
      it('return true for nbe views', function() {
        assert.isTrue(viewIsDirectlyVisualizable(columnChart, nbeView));
      });
      it('return false for obe views', function() {
        assert.isFalse(viewIsDirectlyVisualizable(columnChart, obeViewWithNoQuery));
      });
    });

  });
});

describe('AssetSelectorStore', function() {
  var server;
  var dispatcher;
  var storyStore;
  var assetSelectorStore;
  var fileUploaderStoreMock;
  var blockComponentAtIndex;

  function bootstrap() {
    dispatcher = new Dispatcher();

    StoreAPI.__Rewire__('dispatcher', dispatcher);

    var StoryStoreMock = function() {
      _.extend(this, new Store());

      this.getBlockComponentAtIndex = function() {
        return blockComponentAtIndex;
      };
    };

    storyStore = new StoryStoreMock();
    fileUploaderStoreMock = FileUploaderStoreMocker.create({
      properties: {
        fileById: _.constant({
          status: STATUS.COMPLETED,
          raw: {name: 'raw.jpg'},
          resource: {
            url: 'http://google.com',
            documentId: 12
          }
        })
      }
    });

    AssetSelectorStoreAPI.__Rewire__('dispatcher', dispatcher);
    AssetSelectorStoreAPI.__Rewire__('storyStore',  storyStore);
    AssetSelectorStoreAPI.__Rewire__('fileUploaderStore', fileUploaderStoreMock);
    AssetSelectorStoreAPI.__Rewire__('I18n', I18nMocker);

    server = sinon.fakeServer.create();
    assetSelectorStore = new AssetSelectorStore();
  }

  beforeEach(function() {
    bootstrap();
  });

  afterEach(function() {
    StoreAPI.__ResetDependency__('dispatcher');
    AssetSelectorStoreAPI.__ResetDependency__('dispatcher');
    AssetSelectorStoreAPI.__ResetDependency__('storyStore');
    AssetSelectorStoreAPI.__ResetDependency__('I18n');

    server.restore();
  });

  describe('asset selector data accessors', function() {
    describe('when in an uninitialized state', function() {
      describe('.getStep()', function() {
        it('should return null', function() {
          assert.equal(assetSelectorStore.getStep(), null);
        });
      });

      describe('.getBlockId()', function() {
        it('should return null', function() {
          assert.equal(assetSelectorStore.getBlockId(), null);
        });
      });

      describe('.getComponentIndex()', function() {
        it('should return null', function() {
          assert.equal(assetSelectorStore.getComponentIndex(), null);
        });
      });

      describe('.getComponentType()', function() {
        it('should return undefined', function() {
          assert.isUndefined(assetSelectorStore.getComponentType());
        });
      });

      describe('.getComponentValue()', function() {
        it('should return undefined', function() {
          var value = assetSelectorStore.getComponentValue();
          assert.isUndefined(value);
        });
      });

      describe('.isDirty()', function() {
        function editComponent(type) {
          blockComponentAtIndex = {type: type, value: {}};

          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_EDIT_EXISTING_ASSET_EMBED,
            blockId: 1,
            componentIndex: 0
          });
        }

        beforeEach(function() {
          editComponent('youtube.video');
        });

        it('should return false when nothing has changed', function() {
          assert.isFalse(assetSelectorStore.isDirty());
        });

        it('should return true when something has changed', function() {
          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_UPDATE_YOUTUBE_URL,
            url: 'foo'
          });

          assert.isTrue(assetSelectorStore.isDirty());
        });
      });

      describe('.isUploadingFile()', function() {
        it('should return false', function() {
          assert.isFalse(assetSelectorStore.isUploadingFile());
        });
      });

      describe('.getImageSearchUrl', function() {
        it('should return null', function() {
          assert.isNull(assetSelectorStore.getImageSearchUrl());
        });
      });

      describe('.getImageSearchResults', function() {
        it('should return an empty array', function() {
          var results = assetSelectorStore.getImageSearchResults();

          assert.isArray(results);
          assert.lengthOf(results, 0);
        });
      });

      describe('.getImageSearchPhrase', function() {
        it('should return null', function() {
          assert.isNull(assetSelectorStore.getImageSearchPhrase());
        });
      });

      describe('.getImageSearchPage', function() {
        it('should return 1', function() {
          assert.equal(assetSelectorStore.getImageSearchPage(), 1);
        });
      });

      describe('.getImageSearchPageSize', function() {
        it('should return Constants.IMAGE_SEARCH_PAGE_SIZE', function() {
          assert.equal(assetSelectorStore.getImageSearchPageSize(), Constants.IMAGE_SEARCH_PAGE_SIZE);
        });
      });

      describe('.hasImageSearchPhrase', function() {
        it('should return false', function() {
          assert.isFalse(assetSelectorStore.hasImageSearchPhrase());
        });
      });

      describe('.hasImageSearchResults', function() {
        it('should return false', function() {
          assert.isFalse(assetSelectorStore.hasImageSearchResults());
        });
      });

      describe('.isImageSearching', function() {
        it('should return false', function() {
          assert.isFalse(assetSelectorStore.isImageSearching());
        });
      });

      describe('.hasImageSearchError', function() {
        it('should return false', function() {
          assert.isFalse(assetSelectorStore.hasImageSearchError());
        });
      });

      describe('.canPageImageSearchNext', function() {
        it('should return false', function() {
          assert.isFalse(assetSelectorStore.canPageImageSearchNext());
        });
      });

      describe('.getImageSearchSelected', function() {
        it('should return null', function() {
          assert.isNull(assetSelectorStore.getImageSearchSelected());
        });
      });
    });

    describe('after an `ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT` action with `initialComponentProperties` set', function() {

      var testBlockId = 'testBlock1';
      var testComponentIndex = '1';

      beforeEach(function() {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT,
          blockId: testBlockId,
          componentIndex: testComponentIndex,
          initialComponentProperties: {
            foo: 'bar'
          }
        });
      });

      it('should reflect the initialComponentProperties in getComponentValue', function() {
        assert.propertyVal(assetSelectorStore.getComponentValue(), 'foo', 'bar');
      });
    });

    describe('after an `ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT` action', function() {
      var testBlockId = 'testBlock1';
      var testComponentIndex = '1';

      beforeEach(function() {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT,
          blockId: testBlockId,
          componentIndex: testComponentIndex
        });
      });

      describe('.getStep()', function() {
        it('should return SELECT_ASSET_PROVIDER', function() {
          assert.equal(assetSelectorStore.getStep(), WIZARD_STEP.SELECT_ASSET_PROVIDER);
        });
      });

      describe('.getBlockId()', function() {
        it('should return the blockId specified in the action payload', function() {
          assert.equal(assetSelectorStore.getBlockId(), testBlockId);
        });
      });

      describe('.getComponentIndex()', function() {
        it('should return the componentIndex specified in the action payload', function() {
          assert.equal(assetSelectorStore.getComponentIndex(), testComponentIndex);
        });
      });
    });

    describe('after an `ASSET_SELECTOR_UPDATE_IMAGE_ALT_ATTRIBUTE` action', function() {
      var payloadAlt = 'So alt';
      var isUploadingFileStub;

      describe('.getComponentValue()', function() {
        beforeEach(function() {
          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT,
            blockId: '',
            componentIndex: '',
            initialComponentProperties: {}
          });

          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
            provider: 'IMAGE'
          });

          isUploadingFileStub = sinon.stub(assetSelectorStore, 'isUploadingFile').callsFake(_.constant(true));
          fileUploaderStoreMock._emitChange();

          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_UPDATE_IMAGE_ALT_ATTRIBUTE,
            altAttribute: payloadAlt
          });
        });

        afterEach(function() {
          isUploadingFileStub.restore();
        });

        it('returns object with alt', function() {
          assert.propertyVal(
            assetSelectorStore.getComponentValue(),
            'alt',
            payloadAlt
          );
        });
      });

      describe('with a bad provider', function() {
        function badProvider() {
          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
            provider: 'YOUTUBE'
          });

          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_UPDATE_IMAGE_ALT_ATTRIBUTE,
            altAttribute: payloadAlt
          });
        }

        it('throws an error', function() {
          assert.throws(badProvider);
        });
      });
    });

    describe('after an `ASSET_SELECTOR_UPDATE_TITLE_ATTRIBUTE` action', function() {
      var payloadTitle = 'Very title';

      describe('.getComponentValue()', function() {
        beforeEach(function() {
          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT,
            blockId: '',
            componentIndex: '',
            initialComponentProperties: {}
          });

          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
            provider: 'YOUTUBE'
          });

          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_UPDATE_YOUTUBE_URL,
            url: 'https://youtu.be/m86ae_e_ptU'
          });

          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_UPDATE_TITLE_ATTRIBUTE,
            titleAttribute: payloadTitle
          });
        });

        it('returns object with title', function() {
          assert.propertyVal(
            assetSelectorStore.getComponentValue(),
            'title',
            payloadTitle
          );
        });
      });

      describe('with a bad provider', function() {
        function badProvider() {
          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
            provider: 'IMAGE'
          });

          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_UPDATE_TITLE_ATTRIBUTE,
            titleAttribute: payloadTitle
          });
        }

        it('throws an error', function() {
          assert.throws(badProvider);
        });
      });
    });

    describe('after an `ASSET_SELECTOR_PROVIDER_CHOSEN` action', function() {
      function withProvider(provider) {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
          provider: provider
        });
      }

      describe('with a bad provider', function() {
        it('should throw', function() {
          assert.throws(function() {
            withProvider('not valid');
          });
        });
      });

      [
        'SOCRATA_VISUALIZATION',
        'IMAGE',
        'YOUTUBE',
        'EMBED_CODE'
      ].map(function(validProvider) {
        describe(StorytellerUtils.format('with provider: {0}', validProvider), function() {
          beforeEach(function() {
            withProvider(validProvider);
          });

          describe('.getStep()', function() {
            var EXPECTED_STEPS = {
              'SOCRATA_VISUALIZATION': 'SELECT_VISUALIZATION_OPTION',
              'IMAGE': 'SELECT_IMAGE_TO_UPLOAD',
              'YOUTUBE': 'ENTER_YOUTUBE_URL',
              'EMBED_CODE': 'ENTER_EMBED_CODE'
            };
            var expectedStep = EXPECTED_STEPS[validProvider];

            it(StorytellerUtils.format('should return {0}', expectedStep), function() {
              assert.equal(assetSelectorStore.getStep(), expectedStep);
            });
          });
        });
      });
    });

    describe('after an `ASSET_SELECTOR_CLOSE` action', function() {
      var testBlockId = 'testBlock1';
      var testComponentIndex = '1';

      beforeEach(function() {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT,
          blockId: testBlockId,
          componentIndex: testComponentIndex
        });

        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CLOSE
        });
      });

      describe('.getStep()', function() {
        it('should return null', function() {
          assert.equal(assetSelectorStore.getStep(), null);
        });
      });

      describe('.getBlockId()', function() {
        it('should return null', function() {
          assert.equal(assetSelectorStore.getBlockId(), null);
        });
      });

      describe('.getComponentIndex()', function() {
        it('should return null', function() {
          assert.equal(assetSelectorStore.getComponentIndex(), null);
        });
      });
    });

    describe('after an `ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET` action', function() {
      it('should throw if domain is not set to a string', function() {
        // nbe
        assert.throws(function() {
          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
            viewData: _.omit(nbeView, 'domain')
          });
        });
      });

      it('should add datasetUid to _currentComponentProperities', function(done) {
        assetSelectorStore.addChangeListener(function() {
          assert.equal(
            assetSelectorStore.getComponentValue().dataset.datasetUid,
            nbeView.id
          );
          done();
        });

        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
          viewData: nbeView
        });
      });

      it('should add federatedFromDomain to _currentComponentProperities', (done) => {
        assetSelectorStore.addChangeListener(() => {
          assert.equal(
            assetSelectorStore.getComponentValue().dataset.federatedFromDomain,
            'federated.example.com'
          );
          done();
        });

        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
          viewData: nbeView,
          federatedFromDomain: 'federated.example.com'
        });
      });

      describe('when in the Authoring Workflow', function() {
        beforeEach(function() {
          bootstrap();
        });

        it('should step to the authoring workflow page', function(done) {
          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_VISUALIZATION_OPTION_CHOSEN,
            visualizationOption: 'AUTHOR_VISUALIZATION'
          });

          assetSelectorStore.addChangeListener(function() {
            assert.equal(
              assetSelectorStore.getStep(),
              WIZARD_STEP.AUTHOR_VISUALIZATION
            );

            done();
          });

          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
            viewData: nbeView
          });
        });
      });
    });

    describe('after an `ASSET_SELECTOR_CHOOSE_VISUALIZATION_MAP_OR_CHART` action', () => {
      it('validates payload has domain', () => {
        assert.throws(() => {
          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_MAP_OR_CHART,
            // domain: 'example.com',
            mapOrChartUid: 'test-test',
            viewData: nbeView
          });
        });
      });

      it('validates payload has mapOrChartUid', () => {
        assert.throws(() => {
          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_MAP_OR_CHART,
            domain: 'example.com',
            // mapOrChartUid: 'test-test',
            viewData: nbeView
          });
        });
      });

      it('validates payload has viewData', () => {
        assert.throws(() => {
          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_MAP_OR_CHART,
            domain: 'example.com',
            mapOrChartUid: 'test-test'
            // viewData: nbeView
          });
        });
      });

      describe('when selected asset is a classic chart', () => {
        const classicChartView = {
          id: StandardMocks.classicChartId,
          name: 'classic chart',
          displayType: 'chart',
          domain: 'example.com',
          newBackend: false,
          viewType: 'tabular',
          query: {}
        };

        function dispatchAction() {
          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_MAP_OR_CHART,
            domain: 'example.com',
            mapOrChartUid: StandardMocks.classicChartId,
            viewData: classicChartView,
            federatedFromDomain: 'federated.example.com'
          });
        }

        it('sets the wizard step', (done) => {
          assetSelectorStore.addChangeListener(() => {
            assert.equal(
              assetSelectorStore.getStep(),
              WIZARD_STEP.CONFIGURE_MAP_OR_CHART
            );
            done();
          });

          dispatchAction();
        });

        it('sets dataset componentProperties', (done) => {
          assetSelectorStore.addChangeListener(() => {
            assert.deepEqual(
              assetSelectorStore.getComponentValue(),
              {
                dataset: {
                  domain: 'example.com',
                  datasetUid: StandardMocks.classicChartId,
                  federatedFromDomain: 'federated.example.com'
                }
              }
            );
            done();
          });

          dispatchAction();
        });

        it('sets dataset in state', (done) => {
          assetSelectorStore.addChangeListener(() => {
            assert.deepEqual(
              assetSelectorStore.getDataset(),
              classicChartView
            );
            done();
          });

          dispatchAction();
        });
      });

      describe('when selected asset is a viz-canvas', () => {
        const vizCanvasView = {
          id: StandardMocks.vizCanvasId,
          name: 'viz canvas',
          displayType: 'visualization',
          domain: 'example.com',
          newBackend: true,
          viewType: 'tabular',
          query: {},
          displayFormat: {
            visualizationCanvasMetadata: {
              vifs: [
                {
                  id: StandardMocks.vizCanvasChartId
                }
              ]
            }
          }
        };

        function dispatchAction() {
          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_MAP_OR_CHART,
            domain: vizCanvasView.domain,
            mapOrChartUid: vizCanvasView.id,
            viewData: vizCanvasView,
            federatedFromDomain: 'federation.example.com'
          });
        }

        it('sets the wizard step', (done) => {
          assetSelectorStore.addChangeListener(() => {
            assert.equal(
              assetSelectorStore.getStep(),
              WIZARD_STEP.CONFIGURE_MAP_OR_CHART
            );
            done();
          });

          dispatchAction();
        });

        it('sets dataset componentProperties', (done) => {
          assetSelectorStore.addChangeListener(() => {
            assert.deepEqual(
              assetSelectorStore.getComponentValue(),
              {
                dataset: {
                  domain: vizCanvasView.domain,
                  datasetUid: StandardMocks.vizCanvasId,
                  vifId: StandardMocks.vizCanvasChartId,
                  federatedFromDomain: 'federation.example.com'
                }
              }
            );
            done();
          });

          dispatchAction();
        });

        it('sets dataset in state to visualization view data', (done) => {
          assetSelectorStore.addChangeListener(() => {
            assert.deepEqual(
              assetSelectorStore.getDataset(),
              vizCanvasView
            );
            done();
          });

          dispatchAction();
        });
      });

      describe('when selected asset is not valid', () => {
        const unsupportedAssetView = {
          id: StandardMocks.validStoryUid,
          name: 'viz canvas',
          displayType: 'story',
          domain: 'example.com',
          newBackend: false,
          viewType: 'story'
        };

        function dispatchAction() {
          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_MAP_OR_CHART,
            domain: unsupportedAssetView.domain,
            mapOrChartUid: unsupportedAssetView.id,
            viewData: unsupportedAssetView
          });
        }

        it('does not update componentProperties', () => {
          dispatchAction();

          assert.isUndefined(
            assetSelectorStore.getDataset()
          );
        });

        it('alerts', () => {
          window.alert = sinon.spy();
          dispatchAction();
          sinon.assert.calledWith(window.alert, 'Translation for: editor.asset_selector.visualization.choose_map_or_chart_error');
        });
      });
    });

    describe('after an `ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION` action', function() {
      beforeEach(function() {
        // Send in dataset uid so ComponentValues.value.settings exists
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
          viewData: nbeView
        });
      });

      it('clears the componentType and sets componentProperties to an object containing only the dataset when there is a null visualization', function() {
        var payload = {
          'format': 'vif',
          'data': null,
          originalUid: 'orig-inal'
        };

        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION,
          visualization: payload
        });

        assert.equal(
          assetSelectorStore.getComponentType(),
          null
        );

        assert.deepEqual(
          assetSelectorStore.getComponentValue(),
          {
            dataset: {
              datasetUid: 'what-what',
              domain: nbeView.domain
            }
          }
        );
      });

      it('adds visualization configuration to componentValue when there is vif with originalUid', function() {
        var payload = {
          'format': 'vif',
          'data': {
            type: 'columnChart'
          },
          originalUid: 'orig-inal'
        };

        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION,
          visualization: payload
        });

        assert.equal(
          assetSelectorStore.getComponentType(),
          'socrata.visualization.columnChart'
        );

        assert.deepEqual(
          assetSelectorStore.getComponentValue(),
          {
            vif: payload.data,
            dataset: {
              datasetUid: 'what-what',
              domain: nbeView.domain
            },
            originalUid: 'orig-inal'
          }
        );

      });

      it('adds visualization configuration to componentValue when there is vif with no originalUid', function() {
        var payload = {
          'format': 'vif',
          'data': {
            type: 'columnChart'
          }
        };

        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION,
          visualization: payload
        });

        assert.equal(
          assetSelectorStore.getComponentType(),
          'socrata.visualization.columnChart'
        );

        assert.deepEqual(
          assetSelectorStore.getComponentValue(),
          {
            vif: payload.data,
            dataset: {
              datasetUid: 'what-what',
              domain: nbeView.domain
            },
            originalUid: undefined
          }
        );
      });

      // Note that classic viz without originalUid is not supported.

      it('adds visualization configuration to componentValue when there is a classic visualization with originalUid', function() {
        var payload = {
          'format': 'classic',
          'originalUid': 'orig-inal',
          'data': {
            // Sample chart view blob from core
            'id': 'nggb-5hek',
            'name': 'LOGO',
            'averageRating': 0,
            'createdAt': 1445297299,
            'displayType': 'chart',
            'downloadCount': 0,
            'newBackend': false,
            'numberOfComments': 0,
            'oid': 1627,
            'publicationAppendEnabled': false,
            'publicationDate': 1445279717,
            'publicationGroup': 1393,
            'publicationStage': 'published',
            'rowsUpdatedAt': 1445279706,
            'rowsUpdatedBy': 'tugg-ikce',
            'tableId': 1393,
            'totalTimesRated': 0,
            'viewCount': 0,
            'viewLastModified': 1445297299,
            'viewType': 'tabular',
            'columns': [ {
              'id': 9484,
              'name': 'Location',
              'dataTypeName': 'location',
              'fieldName': 'location',
              'position': 1,
              'renderTypeName': 'location',
              'tableColumnId': 6821,
              'width': 196,
              'format': { },
              'subColumnTypes': [ 'human_address', 'latitude', 'longitude', 'machine_address', 'needs_recoding' ]
            }, {
              'id': 9485,
              'name': 'General Offense Number',
              'dataTypeName': 'number',
              'fieldName': 'general_offense_number',
              'position': 2,
              'renderTypeName': 'number',
              'tableColumnId': 6822,
              'width': 364,
              'format': { }
            }, {
              'id': 9486,
              'name': 'Date',
              'dataTypeName': 'calendar_date',
              'fieldName': 'date',
              'position': 3,
              'renderTypeName': 'calendar_date',
              'tableColumnId': 6823,
              'width': 148,
              'format': { }
            }, {
              'id': 9487,
              'name': 'Type',
              'dataTypeName': 'text',
              'fieldName': 'type',
              'position': 4,
              'renderTypeName': 'text',
              'tableColumnId': 6820,
              'width': 148,
              'format': { }
            } ],
            'displayFormat': {
              'chartType': 'line',
              'hideDsgMsg': false,
              'dataLabels': false,
              'yAxis': {
                'formatter': {
                  'abbreviate': true
                }
              },
              'valueColumns': [ {
                'color': '#003366',
                'fieldName': 'general_offense_number'
              } ],
              'fixedColumns': [ 'type' ],
              'seriesColumns': [ { } ],
              'legendDetails': {
                'showSeries': true,
                'showValueMarkers': true
              },
              'pointSize': '3',
              'legend': 'bottom',
              'smoothLine': false,
              'descriptionColumns': [ { } ],
              'lineSize': '2',
              'sortSeries': false
            },
            'grants': [ {
              'inherited': true,
              'type': 'viewer',
              'flags': [ 'public' ]
            } ],
            'metadata': {
              'renderTypeConfig': {
                'visible': {
                  'chart': true,
                  'table': true
                }
              },
              'availableDisplayTypes': [ 'chart', 'table', 'fatrow', 'page' ],
              'rowLabel': 'Row'
            },
            'owner': {
              'id': 'tugg-ikce',
              'displayName': 'Foo',
              'emailUnsubscribed': false,
              'profileLastModified': 1364945570,
              'roleName': 'administrator',
              'screenName': 'Foo',
              'rights': [ 'create_datasets', 'edit_others_datasets', 'edit_sdp', 'edit_site_theme', 'moderate_comments', 'manage_users', 'chown_datasets', 'edit_nominations', 'approve_nominations', 'feature_items', 'federations', 'manage_stories', 'manage_approval', 'change_configurations', 'view_domain', 'view_others_datasets', 'edit_pages', 'create_pages', 'view_goals', 'view_dashboards', 'edit_goals', 'edit_dashboards', 'create_dashboards', 'edit_others_stories', 'view_stories_stats' ],
              'flags': [ 'admin' ]
            },
            'query': { },
            'rights': [ 'read', 'write', 'add', 'delete', 'grant', 'add_column', 'remove_column', 'update_column', 'update_view', 'delete_view' ],
            'tableAuthor': {
              'id': 'tugg-ikce',
              'displayName': 'Foo',
              'emailUnsubscribed': false,
              'profileLastModified': 1364945570,
              'roleName': 'administrator',
              'screenName': 'Foo',
              'rights': [ 'create_datasets', 'edit_others_datasets', 'edit_sdp', 'edit_site_theme', 'moderate_comments', 'manage_users', 'chown_datasets', 'edit_nominations', 'approve_nominations', 'feature_items', 'federations', 'manage_stories', 'manage_approval', 'change_configurations', 'view_domain', 'view_others_datasets', 'edit_pages', 'create_pages', 'view_goals', 'view_dashboards', 'edit_goals', 'edit_dashboards', 'create_dashboards', 'edit_others_stories', 'view_stories_stats' ],
              'flags': [ 'admin' ]
            }
          }
        };

        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION,
          visualization: payload
        });

        assert.equal(
          assetSelectorStore.getComponentType(),
          'socrata.visualization.classic'
        );

        assert.deepEqual(
          assetSelectorStore.getComponentValue(),
          {
            visualization: payload.data,
            dataset: {
              datasetUid: 'what-what',
              domain: nbeView.domain
            },
            originalUid: 'orig-inal'
          }
        );

      });
    });

    describe('non-linear workflows', function() {
      var blockIdBeingEdited;

      function editComponent(blockId, type, value) {
        blockIdBeingEdited = blockId;
        blockComponentAtIndex = {type: type, value: {}};

        if (value) {
          blockComponentAtIndex.value = value;
        }

        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_EDIT_EXISTING_ASSET_EMBED,
          blockId: blockId,
          componentIndex: 0
        });
        server.respond([200, {}, '{}']);
      }

      function jumpToStep(step) {
        beforeEach(function() {
          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_JUMP_TO_STEP,
            step: step
          });
        });
      }

      function verifyStepIs(step) {
        it(StorytellerUtils.format('should set the step to {0}', step), function() {
          assert.equal(assetSelectorStore.getStep(), WIZARD_STEP[step]);
        });
      }

      function verifyComponentDataInAssetSelectorStoreMatchesStoryStore() {
        it('should copy componentValue into assetSelectorStore', function() {
          assert.deepEqual(
            assetSelectorStore.getComponentValue(),
            storyStore.getBlockComponentAtIndex(blockIdBeingEdited, 0).value
          );
        });
        it('should copy componentType into assetSelectorStore', function() {
          assert.deepEqual(
            assetSelectorStore.getComponentType(),
            storyStore.getBlockComponentAtIndex(blockIdBeingEdited, 0).type
          );
        });
        it('should copy componentIndex into assetSelectorStore', function() {
          assert.equal(
            assetSelectorStore.getComponentIndex(),
            0 // All these tests use the first component.
          );
        });
        it('should copy blockId into assetSelectorStore', function() {
          assert.equal(
            assetSelectorStore.getBlockId(),
            blockIdBeingEdited
          );
        });
      }

      describe('Editing an existing', function() {
        describe('image', function() {
          beforeEach(function() { editComponent(StandardMocks.imageBlockId, 'image'); });
          verifyStepIs('IMAGE_PREVIEW');
          verifyComponentDataInAssetSelectorStoreMatchesStoryStore();

          describe('then jump to SELECT_ASSET_PROVIDER', function() {
            jumpToStep('SELECT_ASSET_PROVIDER');
            verifyStepIs('SELECT_ASSET_PROVIDER');
            verifyComponentDataInAssetSelectorStoreMatchesStoryStore();
          });
        });

        describe('socrata.visualization.classic', function() {
          beforeEach(function() { editComponent(StandardMocks.classicVizBlockId, 'socrata.visualization.classic'); });
          verifyStepIs('CONFIGURE_MAP_OR_CHART');
          verifyComponentDataInAssetSelectorStoreMatchesStoryStore();

          describe('then jump to SELECT_VISUALIZATION_OPTION', function() {
            jumpToStep('SELECT_VISUALIZATION_OPTION');
            verifyStepIs('SELECT_VISUALIZATION_OPTION');
            verifyComponentDataInAssetSelectorStoreMatchesStoryStore();
          });

          describe('then jump to SELECT_MAP_OR_CHART_VISUALIZATION_FROM_CATALOG', function() {
            jumpToStep('SELECT_MAP_OR_CHART_VISUALIZATION_FROM_CATALOG');
            verifyStepIs('SELECT_MAP_OR_CHART_VISUALIZATION_FROM_CATALOG');
            verifyComponentDataInAssetSelectorStoreMatchesStoryStore();
          });

          describe('then jump to an invalid step', function() {
            it('should raise', function() {
              assert.throws(function() {
                dispatcher.dispatch({
                  action: Actions.ASSET_SELECTOR_JUMP_TO_STEP,
                  step: 'NOT_VALID_YO'
                });
              });
            });
          });
        });

        describe('socrata.visualization.columnChart', function() {
          describe('with a v1 vif', function() {
            beforeEach(function() {
              bootstrap();
              editComponent(StandardMocks.vifBlockId, 'socrata.visualization.columnChart', {vif: {format: {version: 1}}});
            });

            verifyStepIs('AUTHOR_VISUALIZATION');
            verifyComponentDataInAssetSelectorStoreMatchesStoryStore();
          });

          describe('with a v2 vif', function() {
            beforeEach(function() {
              bootstrap();
              editComponent(StandardMocks.vifBlockId, 'socrata.visualization.columnChart', {vif: {format: {version: 2}}});
            });

            verifyStepIs('AUTHOR_VISUALIZATION');
            verifyComponentDataInAssetSelectorStoreMatchesStoryStore();
          });
        });

        describe('youtube.video', function() {
          beforeEach(function() { editComponent(StandardMocks.youtubeBlockId, 'youtube.video'); });
          verifyStepIs('ENTER_YOUTUBE_URL');
          verifyComponentDataInAssetSelectorStoreMatchesStoryStore();

          describe('then jump to SELECT_ASSET_PROVIDER', function() {
            jumpToStep('SELECT_ASSET_PROVIDER');
            verifyStepIs('SELECT_ASSET_PROVIDER');
            verifyComponentDataInAssetSelectorStoreMatchesStoryStore();
          });
        });
      });
    });
  });

  describe('ASSET_SELECTOR_IMAGE_SEARCH', function() {
    var dispatch = function(phrase, continuous) {
      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_IMAGE_SEARCH,
        phrase: phrase,
        continuous: continuous
      });
    };

    describe('when given an invalid phrase', function() {
      it('throws', function() {
        assert.throws(function() {
          dispatch(10);
        });
      });
    });

    describe('when given a valid phrase', function() {
      var emitChangeSpy;
      var phrase = 'Katze!';

      beforeEach(function() {
        emitChangeSpy = sinon.spy(assetSelectorStore, '_emitChange');
      });

      afterEach(function() {
        emitChangeSpy.reset();
      });

      describe('.isImageSearching()', function() {
        it('should be true', function() {
          dispatch(phrase);
          assert.isTrue(assetSelectorStore.isImageSearching());
        });
      });

      describe('when search fails', function() {
        it('should emit a change', function(done) {
          assert.lengthOf(server.requests, 0);

          dispatch(phrase);

          assert.lengthOf(server.requests, 1);
          server.respondWith('GET', server.requests[0].url, [400, {'Content-Type': 'application/json'}, '{}']);
          server.respond();

          _.delay(function() {
            sinon.assert.calledTwice(emitChangeSpy);
            assert.isFalse(assetSelectorStore.isImageSearching());
            assert.isTrue(assetSelectorStore.hasImageSearchError());
            done();
          }, 20);
        });
      });

      describe('when search is not continuous', function() {
        var continuous = false;

        it('should emit a change before and after the search', function(done) {
          assert.lengthOf(server.requests, 0);

          dispatch(phrase, continuous);

          assert.lengthOf(server.requests, 1);
          server.respondWith([200, {'Content-Type': 'application/json'}, '{}']);
          server.respond();

          _.delay(function() {
            try {
              sinon.assert.calledTwice(emitChangeSpy);
              assert.isFalse(assetSelectorStore.isImageSearching());
              assert.isFalse(assetSelectorStore.hasImageSearchError());
              assert.isTrue(assetSelectorStore.hasImageSearchResults());
              assert.lengthOf(assetSelectorStore.getImageSearchResults(), 1);
            } catch (e) {
              done(e);
            }
            done();
          }, 20);
        });
      });

      describe('when search is continuous', function() {
        var continuous = true;

        it('should emit a change after the search', function(done) {
          dispatch(phrase, continuous);

          assert.lengthOf(server.requests, 1);
          server.respondWith('GET', server.requests[0].url, [200, {'Content-Type': 'application/json'}, '[{}]']);
          server.respond();

          _.delay(function() {
            sinon.assert.calledOnce(emitChangeSpy);
            done();
          }, 20);
        });
      });
    });
  });

  describe('ASSET_SELECTOR_IMAGE_SELECTED', function() {
    var dispatch = function(id) {
      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_IMAGE_SELECTED,
        id: id
      });
    };

    describe('when given a payload without an ID', function() {
      var id = null;

      it('should throw', function() {
        assert.throws(function() {
          dispatch(id);
        });
      });
    });

    describe('when given a payload with an ID', function() {
      var id = 'youseeme';
      var url = StorytellerUtils.format('/stories/api/v1/getty-images/{0}', id);
      var setComponentTypeAndSetImage = function(componentType) {
        beforeEach(function() {
          _.attempt(_.get(assetSelectorStore.getComponentType, 'restore'));
          sinon.stub(assetSelectorStore, 'getComponentType').callsFake(_.constant(componentType));

          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT,
            blockId: 'blockId',
            componentIndex: 'componentIndex',
            initialComponentProperties: {}
          });

          dispatch(id);
        });
      };

      describe('when componentType is author', function() {
        setComponentTypeAndSetImage('author');

        it('should build a valid component', function() {
          assert.deepEqual(assetSelectorStore.getComponentValue(), {
            image: {
              documentId: null,
              url: url
            }
          });
        });
      });

      describe('when componentType is hero', function() {
        setComponentTypeAndSetImage('hero');

        it('should build a valid component', function() {
          assert.deepEqual(assetSelectorStore.getComponentValue(), {
            documentId: null,
            url: url
          });
        });
      });

      describe('when componentType is image', function() {
        setComponentTypeAndSetImage('image');

        it('should build a valid component', function() {
          assert.deepEqual(assetSelectorStore.getComponentValue(), {
            documentId: null,
            url: url
          });
        });
      });
    });
  });

  describe('ASSET_SELECTOR_IMAGE_SEARCH_LOAD_MORE', function() {
    describe('when you cannot get to the next page', function() {
      // Silence is golden?
    });

    describe('when you can get to the next page', function() {
      var canPageImageSearchNextStub;
      var getImageSearchPhraseStub;

      beforeEach(function() {
        canPageImageSearchNextStub = sinon.stub(assetSelectorStore, 'canPageImageSearchNext').callsFake(_.constant(true));
        getImageSearchPhraseStub = sinon.stub(assetSelectorStore, 'getImageSearchPhrase').callsFake(_.constant('ine'));
      });

      afterEach(function() {
        canPageImageSearchNextStub.restore();
        getImageSearchPhraseStub.restore();
      });

      it('should request a new search', function() {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_IMAGE_SEARCH_LOAD_MORE
        });

        assert.lengthOf(server.requests, 1);
      });
    });
  });

  describe('ASSET_SELECTOR_UPDATE_GOAL_URL', function() {
    var dispatch = function(url) {
      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_UPDATE_GOAL_URL,
        url: url
      });
    };

    it('sets nulls in componentProperties when the url is invalid', function() {
      dispatch('https://example.com/bloop');
      assert.propertyVal(assetSelectorStore.getComponentValue(), 'domain', null);
      assert.propertyVal(assetSelectorStore.getComponentValue(), 'goalUid', null);
    });

    it('sets componentProperties with valid data when the url is a dashboard goal', function() {
      dispatch('https://example.com/stat/goals/aaaa-aaaa/bbbb-bbbb/cccc-cccc');
      assert.propertyVal(assetSelectorStore.getComponentValue(), 'domain', 'example.com');
      assert.propertyVal(assetSelectorStore.getComponentValue(), 'goalUid', 'cccc-cccc');

      dispatch('https://example.com/stat/goals/default/aaaa-aaaa/bbbb-bbbb');
      assert.propertyVal(assetSelectorStore.getComponentValue(), 'domain', 'example.com');
      assert.propertyVal(assetSelectorStore.getComponentValue(), 'goalUid', 'bbbb-bbbb');
    });

    it('sets componentProperties with valid data when the url is a single goal', function() {
      dispatch('https://example.com/stat/goals/single/aaaa-aaaa');
      assert.propertyVal(assetSelectorStore.getComponentValue(), 'domain', 'example.com');
      assert.propertyVal(assetSelectorStore.getComponentValue(), 'goalUid', 'aaaa-aaaa');
    });

    it('sets componentProperties with valid data when the url has optional suffixes', function() {
      dispatch('https://example.com/stat/goals/single/aaaa-aaaa/view/');
      assert.propertyVal(assetSelectorStore.getComponentValue(), 'domain', 'example.com');
      assert.propertyVal(assetSelectorStore.getComponentValue(), 'goalUid', 'aaaa-aaaa');

      dispatch('https://example.com/stat/goals/single/aaaa-aaaa/preview/');
      assert.propertyVal(assetSelectorStore.getComponentValue(), 'domain', 'example.com');
      assert.propertyVal(assetSelectorStore.getComponentValue(), 'goalUid', 'aaaa-aaaa');

      dispatch('https://example.com/stat/goals/single/aaaa-aaaa/edit/');
      assert.propertyVal(assetSelectorStore.getComponentValue(), 'domain', 'example.com');
      assert.propertyVal(assetSelectorStore.getComponentValue(), 'goalUid', 'aaaa-aaaa');

      dispatch('https://example.com/stat/goals/single/aaaa-aaaa/edit-story/');
      assert.propertyVal(assetSelectorStore.getComponentValue(), 'domain', 'example.com');
      assert.propertyVal(assetSelectorStore.getComponentValue(), 'goalUid', 'aaaa-aaaa');

      dispatch('https://example.com/stat/goals/single/aaaa-aaaa/edit-classic/');
      assert.propertyVal(assetSelectorStore.getComponentValue(), 'domain', 'example.com');
      assert.propertyVal(assetSelectorStore.getComponentValue(), 'goalUid', 'aaaa-aaaa');
    });
  });


  describe('ASSET_SELECTOR_IMAGE_CROP_COMMIT', function() {
    var url = 'https://supertechbro.sushi';
    var documentResponse = [200, {'Content-Type': 'application/json'}, '{"document": {"url": "' + url + '"}}'];
    var cropResponse = [200, {}, ''];

    var dispatch = function() {
      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_IMAGE_CROP_COMMIT
      });
    };

    describe('when a crop is set', function() {
      var getComponentValueStub;
      var crop = {crop: {x: 30, y: 40, width: 50, height: 50}};

      beforeEach(function() {
        getComponentValueStub = sinon.stub(assetSelectorStore, 'getComponentValue').callsFake(_.constant(crop));
      });

      afterEach(function() {
        getComponentValueStub.reset();
      });

      it('should request a crop with dimensions corrected to a [0, 1] range.', function(done) {
        dispatch();

        assert.isTrue(assetSelectorStore.isCropping());
        assert.isFalse(assetSelectorStore.isCropComplete());

        assert.lengthOf(server.requests, 1);

        server.respondWith('GET', server.requests[0].url, documentResponse);
        server.respond();

        setTimeout(function() {
          assert.lengthOf(server.requests, 2);

          var requestBody = JSON.parse(server.requests[1].requestBody);

          server.respondWith('PUT', server.requests[1].url, cropResponse);
          server.respond();

          assert.deepEqual(requestBody, {
            document: {
              crop_x: 0.3,
              crop_y: 0.4,
              crop_width: 0.5,
              crop_height: 0.5
            }
          });

          setTimeout(function() {
            assert.isFalse(assetSelectorStore.isCropping());
            assert.isTrue(assetSelectorStore.isCropComplete());
            assert.propertyVal(crop, 'url', url);

            done();
          });
        });
      });
    });

    describe('when a crop is not set', function() {
      var getComponentValueStub;

      beforeEach(function() {
        getComponentValueStub = sinon.stub(assetSelectorStore, 'getComponentValue').callsFake(_.constant({}));
      });

      afterEach(function() {
        getComponentValueStub.reset();
      });

      it('should request a crop with null values.', function(done) {
        dispatch();

        assert.lengthOf(server.requests, 1);

        server.respondWith('GET', server.requests[0].url, documentResponse);
        server.respond();

        setTimeout(function() {
          assert.lengthOf(server.requests, 2);

          var requestBody = JSON.parse(server.requests[1].requestBody);

          server.respondWith('PUT', server.requests[1].url, cropResponse);
          server.respond();

          assert.deepEqual(requestBody, {
            document: {
              crop_x: null,
              crop_y: null,
              crop_width: null,
              crop_height: null
            }
          });

          done();
        });
      });
    });

    describe('when the response is an error', function() {
      var value;
      var getComponentValueStub;

      beforeEach(function() {
        value = {test: 'testing'};
        getComponentValueStub = sinon.stub(assetSelectorStore, 'getComponentValue').callsFake(_.constant(value));
      });

      afterEach(function() {
        getComponentValueStub.reset();
      });

      it('sets a reason', function(done) {
        dispatch();

        assert.lengthOf(server.requests, 1);

        server.respondWith('PUT', server.requests[0].url, [400, {}, '']);
        server.respond();

        setTimeout(function() {
          assert.property(value, 'reason');
          assert.equal(value.reason, I18nMocker.t('editor.asset_selector.image_preview.errors.cropping'));
          done();
        }, 10);
      });
    });
  });

  describe('ASSET_SELECTOR_IMAGE_CROP_START', function() {
    var value;
    var getComponentValueStub;

    beforeEach(function() {
      value = {};
      getComponentValueStub = sinon.stub(assetSelectorStore, 'getComponentValue').callsFake(_.constant(value));

      dispatcher.dispatch({ action: Actions.ASSET_SELECTOR_IMAGE_CROP_START });
    });

    afterEach(function() {
      getComponentValueStub.reset();
    });

    it('sets a default crop and enables cropping UI', function() {
      assert.deepEqual(value.crop, Constants.DEFAULT_CROP);
    });

    it('enables cropping UI', function() {
      assert.isTrue(assetSelectorStore.isCroppingUiEnabled());
    });
  });

  describe('ASSET_SELECTOR_IMAGE_CROP_RESET', function() {
    var value;
    var getComponentValueStub;

    beforeEach(function() {
      value = {crop: {}};

      getComponentValueStub = sinon.stub(assetSelectorStore, 'getComponentValue').callsFake(_.constant(value));

      dispatcher.dispatch({ action: Actions.ASSET_SELECTOR_IMAGE_CROP_RESET });
    });

    afterEach(function() {
      getComponentValueStub.reset();
    });

    it('removes crop from component properties', function() {
      assert.notProperty(value, 'crop');
    });

    it('disables cropping UI', function() {
      assert.isFalse(assetSelectorStore.isCroppingUiEnabled());
    });
  });

  describe('ASSET_SELECTOR_IMAGE_UPLOAD', function() {
    var dispatch = function(file) {
      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_IMAGE_UPLOAD,
        file: file
      });
    };

    describe('when the payload is valid', function() {
      var originalFileReader;
      var url = 'catspajamas.com';
      var file = {
        size: 1,
        type: 'image/jpeg'
      };

      beforeEach(function() {
        originalFileReader = window.FileReader;

        window.FileReader = function() {
          this.result = url;

          this.addEventListener = sinon.stub();
          this.addEventListener.withArgs('load').yields();

          this.readAsDataURL = sinon.stub();
        };

        dispatch(file);
      });

      afterEach(function() {
        window.FileReader = originalFileReader;
      });

      it('sets the image preview url', function() {
        assert.equal(assetSelectorStore.getPreviewImageUrl(), url);
      });

      it('sets the image preview', function() {
        assert.deepEqual(assetSelectorStore.getPreviewImageData(), file);
      });

      it('sets the step to IMAGE_PREVIEW', function() {
        assert.equal(assetSelectorStore.getStep(), WIZARD_STEP.IMAGE_PREVIEW);
      });

      it('resets the crop completion to false', function() {
        assert.isFalse(assetSelectorStore.isCropComplete());
      });
    });

    describe('when the payload is invalid', function() {
      var file;
      var buildsErrorState = function() {
        beforeEach(function() {
          dispatch(file);
        });

        it('sets the step to IMAGE_UPLOAD_ERROR', function() {
          assert.equal(assetSelectorStore.getStep(), WIZARD_STEP.IMAGE_UPLOAD_ERROR);
        });
      };

      describe('when the file is too large', function() {
        file = {
          size: Constants.MAX_FILE_SIZE_BYTES + 10,
          type: 'image/jpeg'
        };

        buildsErrorState();
      });

      describe('when the file has an invalid file type', function() {
        file = {
          size: 1,
          type: 'mammal/homo-sapiens'
        };

        buildsErrorState();
      });
    });
  });

  describe('ASSET_SELECTOR_IMAGE_PREVIEW_BACK', function() {
    var value;
    var getComponentValueStub;
    var dispatch = function() {
      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_IMAGE_PREVIEW_BACK
      });
    };

    beforeEach(function() {
      value = {crop: {}};

      getComponentValueStub = sinon.stub(assetSelectorStore, 'getComponentValue').callsFake(_.constant(value));

      dispatch();
    });

    afterEach(function() {
      getComponentValueStub.restore();
    });

    it('resets previewImage', function() {
      assert.isNull(assetSelectorStore.getPreviewImageData());
    });

    it('sets step to SELECT_IMAGE_TO_UPLOAD', function() {
      assert.equal(assetSelectorStore.getStep(), WIZARD_STEP.SELECT_IMAGE_TO_UPLOAD);
    });

    it('resets Getty Image searching', function() {
      assert.lengthOf(assetSelectorStore.getImageSearchResults(), 0);
      assert.isFalse(assetSelectorStore.hasImageSearchResults());
      assert.isFalse(assetSelectorStore.isImageSearching());
      assert.isFalse(assetSelectorStore.hasImageSearchError());
    });

    it('resets cropping progress and UI enabling', function() {
      assert.isFalse(assetSelectorStore.isCroppingUiEnabled());
      assert.isFalse(assetSelectorStore.isCropComplete());
    });

    it('resets cropping', function() {
      assert.notProperty(assetSelectorStore.getComponentValue(), 'crop');
    });
  });

  describe('ASSET_SELECTOR_IMAGE_CROP_SET', function() {
    var value;
    var getComponentValueStub;
    var crop = {x: 0, y: 0, width: 100, height: 100};
    var dispatch = function(payload) {
      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_IMAGE_CROP_SET,
        crop: payload
      });
    };

    beforeEach(function() {
      value = {};
      getComponentValueStub = sinon.stub(assetSelectorStore, 'getComponentValue').callsFake(_.constant(value));
    });

    afterEach(function() {
      getComponentValueStub.restore();
    });

    it('sets crop', function() {
      dispatch(crop);
      assert.deepEqual(value.crop, crop);
    });
  });

  describe('ASSET_SELECTOR_TOGGLE_IMAGE_WINDOW_TARGET', function() {
    let getComponentValueStub;
    let getComponentTypeStub;
    let value;
    let compType;

    const dispatch = function() {
      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_TOGGLE_IMAGE_WINDOW_TARGET
      });
    };

    beforeEach(function() {
      value = { openInNewWindow: false };
      compType = 'image';

      getComponentValueStub = sinon.stub(assetSelectorStore, 'getComponentValue').callsFake(_.constant(value));

      getComponentTypeStub = sinon.stub(assetSelectorStore, 'getComponentType').callsFake(_.constant(compType));
    });

    afterEach(function() {
      getComponentValueStub.restore();
      getComponentTypeStub.restore();
    });

    it('toggles the openInNewWindow property', function() {
      dispatch();
      assert.isTrue(value.openInNewWindow);
      dispatch();
      assert.isFalse(value.openInNewWindow);
    });

    it('throws an error if the component is not an image', function() {
      getComponentTypeStub.restore();

      getComponentTypeStub = sinon.stub(assetSelectorStore, 'getComponentType').callsFake(_.constant('not-an-image'));

      assert.throws(() => dispatch());
    });
  });

  describe('ASSET_SELECTOR_TOGGLE_GOAL_WINDOW_TARGET', function() {
    let getComponentValueStub;
    let getComponentTypeStub;
    let value;
    let compType;

    const dispatch = function() {
      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_TOGGLE_GOAL_WINDOW_TARGET
      });
    };

    beforeEach(function() {
      value = { openInNewWindow: false };
      compType = 'goal.tile';

      getComponentValueStub = sinon.stub(assetSelectorStore, 'getComponentValue').callsFake(_.constant(value));

      getComponentTypeStub = sinon.stub(assetSelectorStore, 'getComponentType').callsFake(_.constant(compType));
    });

    afterEach(function() {
      getComponentValueStub.restore();
      getComponentTypeStub.restore();
    });

    it('toggles the openInNewWindow property', function() {
      dispatch();
      assert.isTrue(value.openInNewWindow);
      dispatch();
      assert.isFalse(value.openInNewWindow);
    });

    it('throws an error if the component is not a goal', function() {
      getComponentTypeStub.restore();

      getComponentTypeStub = sinon.stub(assetSelectorStore, 'getComponentType').callsFake(_.constant('not-a-goal'));

      assert.throws(() => dispatch());
    });
  });
});
