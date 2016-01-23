describe('AssetSelectorStore', function() {

  'use strict';
  var storyteller = window.socrata.storyteller;
  var WIZARD_STEP = storyteller.AssetSelectorStore.WIZARD_STEP;
  var server;

  beforeEach(function() {
    // Since these tests actually expect to use AJAX, we need to disable the
    // mocked XMLHttpRequest (which happens in StandardMocks) before each,
    // and re-enble it after each.
    window.mockedXMLHttpRequest.restore();

    server = sinon.fakeServer.create();
  });

  afterEach(function() {
    server.restore();

    // See comment above re: temporarily disabling the mocked XMLHttpRequest.
    window.mockedXMLHttpRequest = sinon.useFakeXMLHttpRequest();
  });

  describe('asset selector data accessors', function() {

    describe('when in an uninitialized state', function() {

      describe('.getStep()', function() {

        it('should return null', function() {
          assert.equal(storyteller.assetSelectorStore.getStep(), null);
        });
      });

      describe('.getBlockId()', function() {

        it('should return null', function() {
          assert.equal(storyteller.assetSelectorStore.getBlockId(), null);
        });
      });

      describe('.getComponentIndex()', function() {

        it('should return null', function() {
          assert.equal(storyteller.assetSelectorStore.getComponentIndex(), null);
        });
      });

      describe('.getComponentType()', function() {

        it('should return undefined', function() {
          assert.isUndefined(storyteller.assetSelectorStore.getComponentType());
        });
      });

      describe('.getComponentValue()', function() {

        it('should return undefined', function() {

          var value = storyteller.assetSelectorStore.getComponentValue();

          assert.isUndefined(value);
        });
      });
    });

    describe('after an `ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT` action', function() {

      var testBlockId = 'testBlock1';
      var testComponentIndex = '1';

      beforeEach(function() {
        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT,
          blockId: testBlockId,
          componentIndex: testComponentIndex
        });
      });

      describe('.getStep()', function() {

        it('should return SELECT_ASSET_PROVIDER', function() {
          assert.equal(storyteller.assetSelectorStore.getStep(), WIZARD_STEP.SELECT_ASSET_PROVIDER);
        });
      });

      describe('.getBlockId()', function() {

        it('should return the blockId specified in the action payload', function() {
          assert.equal(storyteller.assetSelectorStore.getBlockId(), testBlockId);
        });
      });

      describe('.getComponentIndex()', function() {

        it('should return the componentIndex specified in the action payload', function() {
          assert.equal(storyteller.assetSelectorStore.getComponentIndex(), testComponentIndex);
        });
      });
    });

    describe('after an `ASSET_SELECTOR_UPDATE_IMAGE_ALT_ATTRIBUTE` action', function() {

      var payloadUrl = 'https://validurl.com/image.png';
      var payloadDocumentId = '12345';
      var payloadAlt = 'So alt';

      describe('.getComponentValue()', function() {
        beforeEach(function() {
          storyteller.dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
            provider: 'IMAGE'
          });

          storyteller.dispatcher.dispatch({
            action: Actions.FILE_UPLOAD_DONE,
            url: payloadUrl,
            documentId: payloadDocumentId
          });

          storyteller.dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_UPDATE_IMAGE_ALT_ATTRIBUTE,
            altAttribute: payloadAlt
          });
        });

        it('returns object with alt', function() {
          assert.deepEqual(
            storyteller.assetSelectorStore.getComponentValue(),
            { documentId: payloadDocumentId, url: payloadUrl, alt: payloadAlt }
          );
        });
      });

      describe('with a bad provider', function() {
        function badProvider() {
          storyteller.dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
            provider: 'YOUTUBE'
          });

          storyteller.dispatcher.dispatch({
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
        storyteller.dispatcher.dispatch({
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
        describe('with provider: {0}'.format(validProvider), function() {
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

            it('should return {0}'.format(expectedStep), function() {
              assert.equal(storyteller.assetSelectorStore.getStep(), expectedStep);
            });
          });
        });
      });
    });

    describe('after an `ASSET_SELECTOR_CLOSE` action', function() {

      var testBlockId = 'testBlock1';
      var testComponentIndex = '1';

      beforeEach(function() {
        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT,
          blockId: testBlockId,
          componentIndex: testComponentIndex
        });

        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CLOSE
        });
      });

      describe('.getStep()', function() {

        it('should return null', function() {
          assert.equal(storyteller.assetSelectorStore.getStep(), null);
        });
      });

      describe('.getBlockId()', function() {

        it('should return null', function() {
          assert.equal(storyteller.assetSelectorStore.getBlockId(), null);
        });
      });

      describe('.getComponentIndex()', function() {

        it('should return null', function() {
          assert.equal(storyteller.assetSelectorStore.getComponentIndex(), null);
        });
      });
    });

    describe('after an `ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET` action', function() {
      var migrationUrl;

      beforeEach(function() {
        migrationUrl = '/api/migrations/{0}.json'.format(standardMocks.validStoryUid);
      });

      it('should attempt to fetch the NBE datasetUid if dataset is OBE', function() {
        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
          datasetUid: standardMocks.validStoryUid,
          isNewBackend: false
        });

        assert.lengthOf(server.requests, 1);
        var request = server.requests[0];
        assert.equal(request.method, 'GET');
        assert.equal(request.url, migrationUrl);
      });

      it('should not request API migrations if dataset is already NBE', function() {
        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
          datasetUid: standardMocks.validStoryUid,
          isNewBackend: true
        });

        assert.isDefined(server);
        assert.isFalse(_.any(server.requests, function(request) {
          return request.url === migrationUrl;
        }));
      });

      it('should add datasetUid to _currentComponentProperities', function() {
        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
          datasetUid: standardMocks.validStoryUid,
          isNewBackend: true
        });

        server.respond([200, {}, '{}']);

        assert.equal(
          storyteller.assetSelectorStore.getComponentValue().dataset.datasetUid,
          standardMocks.validStoryUid
        );
      });
    });

    describe('after an `ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION` action', function() {

      beforeEach(function() {
        // Send in dataset uid so ComponentValues.value.settings exists
        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
          datasetUid: standardMocks.validStoryUid,
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

        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION,
          visualization: payload
        });

        assert.equal(
          storyteller.assetSelectorStore.getComponentType(),
          'socrata.visualization.columnChart'
        );

        assert.deepEqual(
          storyteller.assetSelectorStore.getComponentValue(),
          {
            vif: payload.data,
            dataset: {
              datasetUid: 'test-test',
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

        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION,
          visualization: payload
        });

        assert.equal(
          storyteller.assetSelectorStore.getComponentType(),
          'socrata.visualization.columnChart'
        );

        assert.deepEqual(
          storyteller.assetSelectorStore.getComponentValue(),
          {
            vif: payload.data,
            dataset: {
              datasetUid: 'test-test',
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

        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION,
          visualization: payload
        });

        assert.equal(
          storyteller.assetSelectorStore.getComponentType(),
          'socrata.visualization.classic'
        );

        assert.deepEqual(
          storyteller.assetSelectorStore.getComponentValue(),
          {
            visualization: payload.data,
            dataset: {
              datasetUid: 'test-test',
              domain: window.location.hostname
            },
            originalUid: 'orig-inal'
          }
        );

      });
    });

    describe('after a `FILE_UPLOAD_PROGRESS` action', function() {

      beforeEach(function() {
        storyteller.dispatcher.dispatch({
          action: Actions.FILE_UPLOAD_PROGRESS,
          percentLoaded: 0.245
        });
      });

      describe('.getComponentValue()', function() {
        it('returns object with percentLoaded', function() {
          assert.deepEqual(
            storyteller.assetSelectorStore.getComponentValue(),
            { percentLoaded: 0.245 }
          );
        });
      });
    });

    describe('after a `FILE_UPLOAD_DONE` action', function() {

      var payloadUrl = 'https://validurl.com/image.png';
      var payloadDocumentId = '12345';

      beforeEach(function() {
        storyteller.dispatcher.dispatch({
          action: Actions.FILE_UPLOAD_DONE,
          url: payloadUrl,
          documentId: payloadDocumentId
        });
      });

      describe('.getComponentType()', function() {
        it('returns `image`', function() {
          assert.equal(
            storyteller.assetSelectorStore.getComponentType(),
            'image'
          );
        });
      });

      describe('.getComponentValue()', function() {
        it('returns payload with url and documentId', function() {
          assert.deepEqual(
            storyteller.assetSelectorStore.getComponentValue(),
            { documentId: payloadDocumentId, url: payloadUrl }
          );
        });
      });
    });

    describe('after a `FILE_UPLOAD_ERROR` action', function() {

      describe('for file type validation error', function() {
        beforeEach(function() {
          storyteller.dispatcher.dispatch({
            action: Actions.FILE_UPLOAD_ERROR,
            error: {
              step: 'validation_file_type'
            }
          });
        });

        describe('.getComponentType()', function() {
          it('returns `imageUploadError`', function() {
            assert.equal(
              storyteller.assetSelectorStore.getComponentType(),
              'imageUploadError'
            );
          });
        });

        describe('.getComponentValue()', function() {
          it('returns `validation_file_type`', function() {
            assert.deepEqual(
              storyteller.assetSelectorStore.getComponentValue(),
              { step: 'validation_file_type' }
            );
          });
        });
      });

      describe('for file size validation error', function() {
        beforeEach(function() {
          storyteller.dispatcher.dispatch({
            action: Actions.FILE_UPLOAD_ERROR,
            error: {
              step: 'validation_file_size'
            }
          });
        });

        describe('.getComponentType()', function() {
          it('returns `imageUploadError`', function() {
            assert.equal(
              storyteller.assetSelectorStore.getComponentType(),
              'imageUploadError'
            );
          });
        });

        describe('.getComponentValue()', function() {
          it('returns `validation_file_size`', function() {
            assert.deepEqual(
              storyteller.assetSelectorStore.getComponentValue(),
              { step: 'validation_file_size' }
            );
          });
        });
      });

      describe('for other upload error with reason', function() {
        beforeEach(function() {
          storyteller.dispatcher.dispatch({
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
              storyteller.assetSelectorStore.getComponentType(),
              'imageUploadError'
            );
          });
        });

        describe('.getComponentValue()', function() {
          it('returns `get_upload_url`', function() {
            assert.deepEqual(
              storyteller.assetSelectorStore.getComponentValue(),
              { step: 'get_upload_url', reason: { status: 500, message: 'Internal Server Error' } }
            );
          });
        });
      });
    });

    describe('non-linear workflows', function() {
      var blockIdBeingEdited;
      function editComponent(blockId) {
        blockIdBeingEdited = blockId;
        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_EDIT_EXISTING_ASSET_EMBED,
          blockId: blockId,
          componentIndex: 0
        });
        server.respond([200, {}, '{}']);
      }

      function jumpToStep(step) {
        beforeEach(function() {
          storyteller.dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_JUMP_TO_STEP,
            step: step
          });
        });
      }

      function verifyStepIs(step) {
        it('should set the step to {0}'.format(step), function() {
          assert.equal(storyteller.assetSelectorStore.getStep(), WIZARD_STEP[step]);
        });
      }

      function verifyComponentDataInAssetSelectorStoreMatchesStoryStore() {
        it('should copy componentValue into assetSelectorStore', function() {
          assert.deepEqual(
            storyteller.assetSelectorStore.getComponentValue(),
            storyteller.storyStore.getBlockComponentAtIndex(blockIdBeingEdited, 0).value
          );
        });
        it('should copy componentType into assetSelectorStore', function() {
          assert.deepEqual(
            storyteller.assetSelectorStore.getComponentType(),
            storyteller.storyStore.getBlockComponentAtIndex(blockIdBeingEdited, 0).type
          );
        });
        it('should copy componentIndex into assetSelectorStore', function() {
          assert.equal(
            storyteller.assetSelectorStore.getComponentIndex(),
            0 // All these tests use the first component.
          );
        });
        it('should copy blockId into assetSelectorStore', function() {
          assert.equal(
            storyteller.assetSelectorStore.getBlockId(),
            blockIdBeingEdited
          );
        });
      }

      describe('Editing an existing', function() {
        describe('image', function() {
          beforeEach(function() { editComponent(standardMocks.imageBlockId); });
          verifyStepIs('IMAGE_PREVIEW');
          verifyComponentDataInAssetSelectorStoreMatchesStoryStore();

          describe('then jump to SELECT_ASSET_PROVIDER', function() {
            jumpToStep('SELECT_ASSET_PROVIDER');
            verifyStepIs('SELECT_ASSET_PROVIDER');
            verifyComponentDataInAssetSelectorStoreMatchesStoryStore();
          });
        });

        describe('socrata.visualization.classic', function() {
          beforeEach(function() { editComponent(standardMocks.classicVizBlockId); });
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
                storyteller.dispatcher.dispatch({
                  action: Actions.ASSET_SELECTOR_JUMP_TO_STEP,
                  step: 'NOT_VALID_YO'
                });
              });
            });
          });
        });

        describe('socrata.visualization.columnChart', function() {
          beforeEach(function() { editComponent(standardMocks.vifBlockId); });
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
          beforeEach(function() { editComponent(standardMocks.youtubeBlockId); });
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
        storyteller.dispatcher.dispatch({
          action: Actions.EMBED_CODE_UPLOAD_DONE,
          url: payloadUrl,
          documentId: payloadDocumentId
        });
      });

      describe('.getComponentType()', function() {
        it('returns `embeddedHtml`', function() {
          assert.equal(
            storyteller.assetSelectorStore.getComponentType(),
            'embeddedHtml'
          );
        });
      });

      describe('.getComponentValue()', function() {
        it('returns payload with url and documentId and layout', function() {
          assert.deepEqual(
            storyteller.assetSelectorStore.getComponentValue(),
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
