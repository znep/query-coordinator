import StandardMocks from '../StandardMocks';
import Constants from '../../../app/assets/javascripts/editor/Constants';
import Actions from '../../../app/assets/javascripts/editor/Actions';
import StorytellerUtils from '../../../app/assets/javascripts/StorytellerUtils';
import Dispatcher from '../../../app/assets/javascripts/editor/Dispatcher';
import Store, {__RewireAPI__ as StoreAPI} from '../../../app/assets/javascripts/editor/stores/Store';
import AssetSelectorStore, {WIZARD_STEP, __RewireAPI__ as AssetSelectorStoreAPI} from '../../../app/assets/javascripts/editor/stores/AssetSelectorStore';

describe('AssetSelectorStore', function() {

  var server;
  var dispatcher;
  var storyStore;
  var assetSelectorStore;
  var blockComponentAtIndex;

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

    AssetSelectorStoreAPI.__Rewire__('dispatcher', dispatcher);
    AssetSelectorStoreAPI.__Rewire__('storyStore',  storyStore);

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
      var payloadUrl = 'https://validurl.com/image.png';
      var payloadDocumentId = '12345';
      var payloadAlt = 'So alt';

      describe('.getComponentValue()', function() {
        beforeEach(function() {
          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
            provider: 'IMAGE'
          });

          dispatcher.dispatch({
            action: Actions.FILE_UPLOAD_DONE,
            url: payloadUrl,
            documentId: payloadDocumentId
          });

          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_UPDATE_IMAGE_ALT_ATTRIBUTE,
            altAttribute: payloadAlt
          });
        });

        it('returns object with alt', function() {
          assert.deepEqual(
            assetSelectorStore.getComponentValue(),
            { documentId: payloadDocumentId, url: payloadUrl, alt: payloadAlt }
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
              'SOCRATA_VISUALIZATION': 'SELECT_DATASET_FOR_VISUALIZATION',
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

      it('should attempt to fetch the NBE datasetUid if dataset is OBE', function() {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
          datasetUid: StandardMocks.validStoryUid,
          isNewBackend: false
        });

        assert.lengthOf(server.requests, 1);
        var request = server.requests[0];
        assert.equal(request.method, 'GET');
        assert.equal(request.url, migrationUrl);
      });

      it('should not request API migrations if dataset is already NBE', function() {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
          datasetUid: StandardMocks.validStoryUid,
          isNewBackend: true
        });

        assert.isDefined(server);
        assert.isFalse(_.any(server.requests, function(request) {
          return request.url === migrationUrl;
        }));
      });

      it('should add datasetUid to _currentComponentProperities', function() {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
          datasetUid: StandardMocks.validStoryUid,
          isNewBackend: true
        });

        server.respond([200, {}, '{}']);

        assert.equal(
          assetSelectorStore.getComponentValue().dataset.datasetUid,
          StandardMocks.validStoryUid
        );
      });
    });

    describe('after an `ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION` action', function() {
      beforeEach(function() {

        // Send in dataset uid so ComponentValues.value.settings exists
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
          datasetUid: StandardMocks.validStoryUid,
          isNewBackend: true
        });

        server.respond([200, {}, '{}']);
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

    describe('after a `FILE_UPLOAD_PROGRESS` action', function() {
      beforeEach(function() {
        dispatcher.dispatch({
          action: Actions.FILE_UPLOAD_PROGRESS,
          percentLoaded: 0.245
        });
      });

      describe('.getUploadPercentLoaded()', function() {
        it('returns the percent loaded', function() {
          assert.equal(
            assetSelectorStore.getUploadPercentLoaded(),
            0.245
          );
        });
      });
    });

    describe('after a `FILE_UPLOAD_DONE` action', function() {
      var payloadUrl = 'https://validurl.com/image.png';
      var payloadDocumentId = '12345';

      ['HERO'].map(function(provider) {
        describe(StorytellerUtils.format('while editing component type: {0}', provider), function() {
          beforeEach(function() {
            if (provider === 'AUTHOR') {
              blockComponentAtIndex = {
                type: provider.toLowerCase(),
                value: {
                  image: {
                    url: payloadUrl,
                    documentId: payloadDocumentId
                  },
                  blurb: 'blurb'
                }
              };
            } else if (provider === 'HERO') {
              blockComponentAtIndex = {
                type: provider.toLowerCase(),
                value: {
                  url: payloadUrl,
                  documentId: payloadDocumentId,
                  html: 'html content'
                }
              };
            } else {
              blockComponentAtIndex = {
                type: provider.toLowerCase(),
                value: {
                  url: payloadUrl,
                  documentId: payloadDocumentId
                }
              };
            }

            dispatcher.dispatch({
              action: Actions.ASSET_SELECTOR_EDIT_EXISTING_ASSET_EMBED,
              blockId: 'block-id',
              componentIndex: 0
            });
          });

          beforeEach(function() {
            dispatcher.dispatch({
              action: Actions.FILE_UPLOAD_DONE,
              url: payloadUrl,
              documentId: payloadDocumentId
            });
          });

          describe('.getComponentType()', function() {
            var correctType;
            if (provider === 'IMAGE') {
              correctType = 'image';
            } else if (provider === 'HERO') {
              correctType = 'hero';
            } else if (provider === 'AUTHOR') {
              correctType = 'author';
            }

            it(StorytellerUtils.format('returns `{0}`', correctType), function() {
              assert.equal(
                assetSelectorStore.getComponentType(),
                correctType
              );
            });
          });

          describe('.getComponentValue()', function() {
            it('returns correct payload', function() {
              if (provider === 'AUTHOR') {
                assert.deepEqual(
                  assetSelectorStore.getComponentValue(),
                  {
                    blurb: storyStore.getBlockComponentAtIndex(StandardMocks.authorBlockId, 0).value.blurb,
                    image: { documentId: payloadDocumentId, url: payloadUrl }
                  }
                );
              } else if (provider === 'HERO') {
                assert.deepEqual(
                  assetSelectorStore.getComponentValue(),
                  { documentId: payloadDocumentId, url: payloadUrl, html: 'html content' }
                );
              } else {
                assert.deepEqual(
                  assetSelectorStore.getComponentValue(),
                  { documentId: payloadDocumentId, url: payloadUrl }
                );
              }
            });
          });
        });
      });
    });

    describe('after a `FILE_UPLOAD_ERROR` action', function() {
      describe('for file type validation error', function() {
        beforeEach(function() {
          dispatcher.dispatch({
            action: Actions.FILE_UPLOAD_ERROR,
            error: {
              step: 'validation_file_type'
            }
          });
        });

        describe('.getComponentType()', function() {
          it('returns `imageUploadError`', function() {
            assert.equal(
              assetSelectorStore.getComponentType(),
              'imageUploadError'
            );
          });
        });

        describe('.getComponentValue()', function() {
          it('returns `validation_file_type`', function() {
            assert.deepEqual(
              assetSelectorStore.getComponentValue(),
              { step: 'validation_file_type' }
            );
          });
        });
      });

      describe('for file size validation error', function() {
        beforeEach(function() {
          dispatcher.dispatch({
            action: Actions.FILE_UPLOAD_ERROR,
            error: {
              step: 'validation_file_size'
            }
          });
        });

        describe('.getComponentType()', function() {
          it('returns `imageUploadError`', function() {
            assert.equal(
              assetSelectorStore.getComponentType(),
              'imageUploadError'
            );
          });
        });

        describe('.getComponentValue()', function() {
          it('returns `validation_file_size`', function() {
            assert.deepEqual(
              assetSelectorStore.getComponentValue(),
              { step: 'validation_file_size' }
            );
          });
        });
      });

      describe('for other upload error with reason', function() {
        beforeEach(function() {
          dispatcher.dispatch({
            action: Actions.FILE_UPLOAD_ERROR,
            error: {
              step: 'get_upload_url',
              reason: { status: 500, message: 'Internal Server Error' }
            }
          });
        });

        describe('.getComponentType()', function() {
          it('returns `imageUploadError`', function() {
            assert.equal(
              assetSelectorStore.getComponentType(),
              'imageUploadError'
            );
          });
        });

        describe('.getComponentValue()', function() {
          it('returns `get_upload_url`', function() {
            assert.deepEqual(
              assetSelectorStore.getComponentValue(),
              { step: 'get_upload_url', reason: { status: 500, message: 'Internal Server Error' } }
            );
          });
        });
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
          verifyStepIs('CONFIGURE_VISUALIZATION');
          verifyComponentDataInAssetSelectorStoreMatchesStoryStore();

          describe('then jump to SELECT_TABLE_OR_CHART', function() {
            jumpToStep('SELECT_TABLE_OR_CHART');
            verifyStepIs('SELECT_TABLE_OR_CHART');
            verifyComponentDataInAssetSelectorStoreMatchesStoryStore();
          });

          describe('then jump to SELECT_DATASET_FOR_VISUALIZATION', function() {
            jumpToStep('SELECT_DATASET_FOR_VISUALIZATION');
            verifyStepIs('SELECT_DATASET_FOR_VISUALIZATION');
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

          describe('then jump to SELECT_TABLE_OR_CHART', function() {
            jumpToStep('SELECT_TABLE_OR_CHART');
            verifyStepIs('SELECT_TABLE_OR_CHART');
            verifyComponentDataInAssetSelectorStoreMatchesStoryStore();
          });

          describe('then jump to SELECT_DATASET_FOR_VISUALIZATION', function() {
            jumpToStep('SELECT_DATASET_FOR_VISUALIZATION');
            verifyStepIs('SELECT_DATASET_FOR_VISUALIZATION');
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

    describe('after a `EMBED_CODE_UPLOAD_DONE` action', function() {
      var payloadUrl = 'https://validurl.com/embeddedHtml.html';
      var payloadDocumentId = '2345';

      beforeEach(function() {
        dispatcher.dispatch({
          action: Actions.EMBED_CODE_UPLOAD_DONE,
          url: payloadUrl,
          documentId: payloadDocumentId
        });
      });

      describe('.getComponentType()', function() {
        it('returns `embeddedHtml`', function() {
          assert.equal(
            assetSelectorStore.getComponentType(),
            'embeddedHtml'
          );
        });
      });

      describe('.getComponentValue()', function() {
        it('returns payload with url and documentId and layout', function() {
          assert.deepEqual(
            assetSelectorStore.getComponentValue(),
            {
              documentId: payloadDocumentId,
              url: payloadUrl,
              layout: { height: Constants.DEFAULT_VISUALIZATION_HEIGHT }
            }
          );
        });
      });
    });
  });
});
