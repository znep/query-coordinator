import _ from 'lodash';

import StandardMocks from '../StandardMocks';
import Constants from '../../../app/assets/javascripts/editor/Constants';
import Actions from '../../../app/assets/javascripts/editor/Actions';
import StorytellerUtils from '../../../app/assets/javascripts/StorytellerUtils';
import Dispatcher from '../../../app/assets/javascripts/editor/Dispatcher';
import Store, {__RewireAPI__ as StoreAPI} from '../../../app/assets/javascripts/editor/stores/Store';
import AssetSelectorStore, {viewIsDirectlyVisualizable, WIZARD_STEP, __RewireAPI__ as AssetSelectorStoreAPI} from '../../../app/assets/javascripts/editor/stores/AssetSelectorStore';
import {STATUS} from '../../../app/assets/javascripts/editor/stores/FileUploaderStore';
import FileUploaderStoreMocker from '../mocks/FileUploaderStoreMocker.js';

var nbeView = {
  'id' : StandardMocks.validStoryUid,
  'name' : 'nbe',
  'displayType' : 'table',
  'newBackend' : true,
  'viewType' : 'tabular',
  'query' : {}
};
var obeViewWithNoQuery = {
  'id' : StandardMocks.validStoryUid,
  'name' : 'obe plain',
  'displayType' : 'table',
  'newBackend' : false,
  'viewType' : 'tabular',
  'query' : {}
};
var obeViewWithFilter = {
  'id' : StandardMocks.validStoryUid,
  'name' : 'obe filtered',
  'displayType' : 'table',
  'newBackend' : false,
  'viewType' : 'tabular',
  'query' : {
    'filterCondition' : {
      'type' : 'operator',
      'value' : 'EQUALS',
      'children' : [ {
        'columnId' : 3156549,
        'type' : 'column'
      }, {
        'type' : 'literal',
        'value' : 'bunnies'
      } ]
    },
    'metadata' : {
      'unifiedVersion' : 2
    }
  }
};
var obeViewWithGroup = {
  'id' : StandardMocks.validStoryUid,
  'name' : 'obe grouped',
  'displayType' : 'table',
  'newBackend' : false,
  'viewType' : 'tabular',
  'query' : {
    'groupBys' : [ {
      'columnId' : 9756,
      'type' : 'column'
    } ]
  }
};

describe('AssetSelectorStore static functions', function() {
  describe('viewIsDirectlyVisualizable', function() {
    describe('making a table', function() {
      var tableType = 'socrata.visualization.table';
      it('return true for nbe views', function() {
        assert.isTrue(viewIsDirectlyVisualizable(tableType, nbeView));
      });
      it('return true for obe views with a filter query', function() {
        assert.isTrue(viewIsDirectlyVisualizable(tableType, obeViewWithFilter));
      });
      it('return false for obe views with a group query', function() {
        assert.isFalse(viewIsDirectlyVisualizable(tableType, obeViewWithGroup));
      });
      it('return false for obe views with no query', function() {
        assert.isFalse(viewIsDirectlyVisualizable(tableType, obeViewWithNoQuery));
      });
    });

    describe('making a non-table visualization', function() {
      var columnChart = 'socrata.visualization.columnChart';
      it('return true for nbe views', function() {
        assert.isTrue(viewIsDirectlyVisualizable(columnChart, nbeView));
      });
      it('return false for obe views with a filter query', function() {
        assert.isFalse(viewIsDirectlyVisualizable(columnChart, obeViewWithFilter));
      });
      it('return false for obe views with a group query', function() {
        assert.isFalse(viewIsDirectlyVisualizable(columnChart, obeViewWithGroup));
      });
      it('return false for obe views with no query', function() {
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

  function respondToMetadataRequestWith(viewData) {
    var viewDataUrl;

    viewDataUrl = StorytellerUtils.format('/api/views/{0}.json', viewData.id);

    assert.lengthOf(server.requests, 1);
    var metadataRequest = server.requests[0];
    assert.equal(metadataRequest.method, 'GET');
    assert.include(metadataRequest.url, viewDataUrl);
    server.respond([200, { 'Content-Type': 'application/json' }, JSON.stringify(viewData) ]);
  }

  beforeEach(function() {
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

    server = sinon.fakeServer.create();
    assetSelectorStore = new AssetSelectorStore();
  });

  afterEach(function() {
    StoreAPI.__ResetDependency__('dispatcher');
    AssetSelectorStoreAPI.__ResetDependency__('dispatcher');
    AssetSelectorStoreAPI.__ResetDependency__('storyStore');

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
            action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
            provider: 'IMAGE'
          });

          isUploadingFileStub = sinon.stub(assetSelectorStore, 'isUploadingFile', _.constant(true));
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
          assert.throws(function() {
            badProvider();
          });
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
      var migrationUrl;

      beforeEach(function() {
        migrationUrl = StorytellerUtils.format('/api/migrations/{0}.json', StandardMocks.validStoryUid);
      });

      it('should throw if domain is not set to a string', function() {
        // nbe
        assert.throws(function() {
          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
            datasetUid: StandardMocks.validStoryUid,
            isNewBackend: true
          });
        });
        assert.throws(function() {
          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
            domain: undefined,
            datasetUid: StandardMocks.validStoryUid,
            isNewBackend: true
          });
        });

        // obe
        assert.throws(function() {
          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
            datasetUid: StandardMocks.validStoryUid,
            isNewBackend: false
          });
        });
        assert.throws(function() {
          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
            domain: undefined,
            datasetUid: StandardMocks.validStoryUid,
            isNewBackend: false
          });
        });
      });

      it('should attempt to fetch the NBE datasetUid if view is not directly visualizable', function(done) {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
          domain: window.location.hostname,
          datasetUid: StandardMocks.validStoryUid,
          isNewBackend: false
        });

        respondToMetadataRequestWith(obeViewWithFilter);

        // Wait for promises...
        setTimeout(function() {
          assert.lengthOf(server.requests, 2);
          var migrationsRequest = server.requests[1];
          assert.include(migrationsRequest.url, migrationUrl);
          done();
        }, 1);
      });

      it('should not request API migrations if dataset is directly visualizable', function(done) {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
          datasetUid: StandardMocks.validStoryUid,
          domain: 'example.com',
          isNewBackend: true
        });

        respondToMetadataRequestWith(nbeView);

        // Wait for promises...
        setTimeout(function() {
          assert.lengthOf(server.requests, 1);
          assert.isFalse(_.any(server.requests, function(request) {
            return request.url === migrationUrl;
          }));
          done();
        }, 1);
      });

      it('should add datasetUid to _currentComponentProperities', function(done) {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
          datasetUid: StandardMocks.validStoryUid,
          domain: 'example.com',
          isNewBackend: true
        });

        assetSelectorStore.addChangeListener(function() {
          assert.equal(
            assetSelectorStore.getComponentValue().dataset.datasetUid,
            StandardMocks.validStoryUid
          );
          done();
        });

        respondToMetadataRequestWith(nbeView);
      });
    });

    describe('after an `ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION` action', function() {
      beforeEach(function(done) {

        // Send in dataset uid so ComponentValues.value.settings exists
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
          domain: window.location.hostname,
          datasetUid: StandardMocks.validStoryUid,
          isNewBackend: true
        });

        assetSelectorStore.addChangeListener(_.once(done));
        respondToMetadataRequestWith(nbeView);
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
              domain: window.location.hostname
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
              domain: window.location.hostname
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
              domain: window.location.hostname
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
              'rights': [ 'create_datasets', 'edit_others_datasets', 'edit_sdp', 'edit_site_theme', 'moderate_comments', 'manage_users', 'chown_datasets', 'edit_nominations', 'approve_nominations', 'feature_items', 'federations', 'manage_stories', 'manage_approval', 'change_configurations', 'view_domain', 'view_others_datasets', 'edit_pages', 'create_pages', 'view_goals', 'view_dashboards', 'edit_goals', 'edit_dashboards', 'create_dashboards' ],
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
              'rights': [ 'create_datasets', 'edit_others_datasets', 'edit_sdp', 'edit_site_theme', 'moderate_comments', 'manage_users', 'chown_datasets', 'edit_nominations', 'approve_nominations', 'feature_items', 'federations', 'manage_stories', 'manage_approval', 'change_configurations', 'view_domain', 'view_others_datasets', 'edit_pages', 'create_pages', 'view_goals', 'view_dashboards', 'edit_goals', 'edit_dashboards', 'create_dashboards' ],
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
              domain: window.location.hostname
            },
            originalUid: 'orig-inal'
          }
        );

      });
    });

    describe('non-linear workflows', function() {
      var blockIdBeingEdited;

      function editComponent(blockId, type) {
        blockIdBeingEdited = blockId;
        blockComponentAtIndex = {type: type};

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
          beforeEach(function() { editComponent(StandardMocks.vifBlockId, 'socrata.visualization.columnChart'); });
          verifyStepIs('CONFIGURE_VISUALIZATION');
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
          server.respondWith('GET', server.requests[0].url, [200, {'Content-Type': 'application/json'}, '{}']);
          server.respond();

          _.delay(function() {
            sinon.assert.calledTwice(emitChangeSpy);
            assert.isFalse(assetSelectorStore.isImageSearching());
            assert.isFalse(assetSelectorStore.hasImageSearchError());
            assert.isTrue(assetSelectorStore.hasImageSearchResults());
            assert.lengthOf(assetSelectorStore.getImageSearchResults(), 1);
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
          sinon.stub(assetSelectorStore, 'getComponentType', _.constant(componentType));

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
        canPageImageSearchNextStub = sinon.stub(assetSelectorStore, 'canPageImageSearchNext', _.constant(true));
        getImageSearchPhraseStub = sinon.stub(assetSelectorStore, 'getImageSearchPhrase', _.constant('ine'));
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
});
