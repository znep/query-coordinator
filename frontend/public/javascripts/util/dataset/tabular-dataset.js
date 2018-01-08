(function() {

  var TabularDataset = ServerModel.extend({

    // WARNING! This property is read by base-model and you will encounter
    // baffling behavior if you, say, rename it or change it into an array,
    // or both. >_>
    _validKeys: {
      attribution: true,
      attributionLink: true,
      category: true,
      columns: true,
      description: true,
      disabledFeatureFlags: true,
      displayFormat: true,
      displayType: true,
      flags: true,
      hideFromCatalog: true,
      hideFromDataJson: true,
      iconUrl: true,
      id: true,
      licenseId: true,
      message: true,
      metadata: true,
      moderationStatus: true,
      name: true,
      originalViewId: true,
      privateMetadata: true,
      publicationAppendEnabled: true,
      query: true,
      queryString: true,
      resourceName: true,
      rowIdentifierColumnId: true,
      searchString: true,
      tags: true,
      termsAndConditions: true
    },

    getReadOnlyView: function() {
      return new ReadOnlyView(this.serialize());
    },

    isDefault: function() {
      return this.getReadOnlyView().isRoot();
    },

    isPublic: function() {
      return this.getReadOnlyView().isPublic();
    },

    hasRight: function(right) {
      return this.getReadOnlyView().hasRight(right);
    },

    isFederated: function() {
      return this.getReadOnlyView().isFederated();
    },

    isPublished: function() {
      return this.getReadOnlyView().isPublished();
    },

    isUnpublished: function() {
      return this.getReadOnlyView().isDraft();
    },

    getBaseUrl: function() {
      var readOnlyView = this.getReadOnlyView();

      return ViewRenderer.origin(readOnlyView);
    },

    getFullUrl: function() {
      var readOnlyView = this.getReadOnlyView();

      return ViewRenderer.fullUrl(readOnlyView);
    },

    getShortUrl: function() {
      var readOnlyView = this.getReadOnlyView();

      return ViewRenderer.shortUrl(readOnlyView);
    },

    getApiUrl: function() {
      var readOnlyView = this.getReadOnlyView();

      return ViewRenderer.shortUrl(readOnlyView);
    },

    save: function(successCallback, errorCallback) {
      var self = this;

      if (!self.hasRight(blist.rights.view.UPDATE_VIEW)) {
        return false;
      }

      var vizIds = $.isBlank(self.visibleColumns) ?
        null :
        _.pluck(self.visibleColumns, 'id');
      var saved = function(newDS) {
        // core always removes metadata.jsonQuery while frontend still depends on it.
        // This recreate metadata.jsonQuery from view.query
        var nds = createDatasetFromView(newDS.serialize());

        self._savedRowSet = self._activeRowSet;
        self.update(nds);
        if (!$.isBlank(vizIds) &&
          !_.isEqual(vizIds, _.pluck(nds.visibleColumns, 'id'))) {
          self.setVisibleColumns(vizIds);
        }
        if (_.isFunction(successCallback)) {
          successCallback(self);
        }
        self.trigger('saved');
      };
      var failedToSave = function() {

        if (_.isFunction(errorCallback)) {
          errorCallback();
        }
      };

      ViewPersistor.update(this.getReadOnlyView()).
        then(saved).
        catch(failedToSave);
    },

    saveNew: function(useNBE, successCallback, errorCallback) {
      var dsOrig = this;
      var dsCreated = function(newDS) {
        newDS = createDatasetFromView(newDS.serialize());

        if (!$.isBlank(dsOrig.accessType)) {
          newDS.setAccessType(dsOrig.accessType);
        }

        if (_.isFunction(successCallback)) {
          successCallback(newDS);
        }
      };
      var ds = cleanViewForCreate(this);

      // Munge permissions for forms, since those don't get carried over
      // or inherited
      if (dsOrig.isPublic() && dsOrig.type == 'form') {
        ds.flags = ds.flags || [];
        ds.flags.push('dataPublicAdd');
      }

      ViewPersistor.update(new ReadOnlyView(ds.cleanCopy()), useNBE).
        then(dsCreated).
        catch(errorCallback);
    },

    remove: function(successCallback, errorCallback) {
      var self = this;
      var dsRemoved = function() {
        self.trigger('removed');
        if (_.isFunction(successCallback)) {
          successCallback();
        }
      };

      ViewPersistor.delete(this.getReadOnlyView()).
        then(dsRemoved).
        catch(errorCallback);
    },

    changeOwner: function(userId, successCallback, errorCallback) {
      var ownerChanged = function() {
        if (_.isFunction(successCallback)) {
          successCallback();
        }
      };

      ViewPersistor.update(this.getReadOnlyView(), userId).
        then(ownerChanged).
        catch(errorCallback);
    },


    makePublic: function(successCallback, errorCallback) {
      var self = this;
      var madePublic = function(updatedView) {

        self.trigger('permissions_changed');

        if (_.isFunction(successCallback)) {
          successCallback.apply(self, [updatedView.serialize()]);
        }
      };
      var failedToMakePublic = function() {

        if (_.isFunction(errorCallback)) {
          errorCallback();
        }
      };

      ViewPersistor.makePublic(this.getReadOnlyView()).
        then(madePublic).
        catch(failedToMakePublic);
    },

    makePrivate: function(successCallback, errorCallback) {
      var self = this;
      var madePrivate = function(updatedView) {

        self.trigger('permissions_changed');

        if (_.isFunction(successCallback)) {
          successCallback.apply(self, [updatedView.serialize()]);
        }
      };
      var failedToMakePrivate = function() {

        if (_.isFunction(errorCallback)) {
          errorCallback();
        }
      };

      ViewPersistor.makePrivate(this.getReadOnlyView()).
        then(madePrivate).
        catch(failedToMakePrivate);
    },

    createGrant: function(grant, successCallback, errorCallback) {
      var self = this;
      var grantCreated = function(response) {
        self.grants = self.grants || [];
        self.grants.push(response);
        if (_.isFunction(successCallback)) {
          successCallback();
        }
      };

      ViewPersistor.createGrant(this.getReadOnlyView(), grant).
        then(grantCreated).
        catch(errorCallback);
    },

    removeGrant: function(grant, successCallback, errorCallback) {
      var self = this;
      var grantDeleted = function() {
        self.grants = _.reject(self.grants || [], function(g) {
          return (!$.isBlank(grant.userId) && grant.userId == g.userId) ||
            (!$.isBlank(grant.userEmail) && grant.userEmail == g.userEmail);
        });
        if (_.isFunction(successCallback)) {
          successCallback();
        }
      };

      ViewPersistor.deleteGrant(this.getReadOnlyView(), grant).
        then(grantDeleted).
        catch(errorCallback);
    },

    makeUnpublishedCopy: function(successCallback, pendingCallback, errorCallback) {
      var self = this;
      /* eslint-disable no-unused-vars */
      // TODO: Figure out how to handle the 'pending' state using promises.
      var pendingHandler = function() {
        self.copyPending = true;
        if (_.isFunction(pendingCallback)) {
          pendingCallback();
        }
      };
      /* eslint-enable no-unused-vars */
      var successHandler = function(r) {
        delete self.copyPending;
        self._unpublishedView = createDatasetFromView(r.serialize());
        if (_.isFunction(successCallback)) {
          successCallback(self._unpublishedView);
        }
      };

      ViewPersistor.createDraft(this.getReadOnlyView()).
        then(successHandler).
        catch(errorCallback);
    },

    publish: function(successCallback, errorCallback) {
      var successHandler = function(r) {
        var pubDS = createDatasetFromView(r.serialize());
        if (_.isFunction(successCallback)) {
          successCallback(pubDS);
        }
      };

      ViewPersistor.publishDraft(this.getReadOnlyView()).
        then(successHandler).
        catch(errorCallback);
    },

    isPublicationStageChangeAvailable: function(isPublished, resultCallback) {
      var controlsGridStatusKey = 'controls.grid.{0}'.format(isPublished ? 'published' : 'unpublished');
      var successHandler;
      var errorHandler;

      if (this.getReadOnlyView().isOBE()) {

        successHandler = function(results) {
          resultCallback(results.view < 1, $.t('{0}.geocodes_pending'.format(controlsGridStatusKey)));
        };
        errorHandler = function() {
          resultCallback(false, $.t('{0}.unknown_publication_stage_change_available_error'.format(controlsGridStatusKey)));
        };
      } else {

        successHandler = function(replicationStatus) {
          var computationUpToDate = _.get(replicationStatus, 'asynchronous_computation_up_to_date', true);

          resultCallback(computationUpToDate, $.t('{0}.asynchronous_computation_pending'.format(controlsGridStatusKey)));
        };
        errorHandler = function() {
          resultCallback(false, $.t('{0}.unknown_publication_stage_change_available_error'.format(controlsGridStatusKey)));
        };
      }

      ViewPersistor.viewIsReadyForPublicationOperation(this.getReadOnlyView()).
        then(successHandler).
        catch(errorHandler);
    },

    makeBackup: function(successCallback) {
      var successHandler = function() {
        if (_.isFunction(successCallback)) {
          successCallback();
        }
      };

      ViewPersistor.createBackup(this.getReadOnlyView()).
        then(successHandler).
        catch(console.error);
    },

    deleteBackup: function(backupUri, successCallback) {
      var successHandler = function() {
        if (_.isFunction(successCallback)) {
          successCallback = function() {};
        }
      };

      ViewPersistor.deleteBackup(this.getReadOnlyView(), backupUri).
        then(successHandler).
        catch(console.error);
    },

    serialize: function() {
      var serializeColumn = function(column) {

        return {
          id: _.get(column, 'id'),
          name: _.get(column, 'name'),
          dataTypeName: _.get(column, 'dataTypeName'),
          fieldName: _.get(column, 'fieldName'),
          position: _.get(column, 'position'),
          renderTypeName: _.get(column, 'renderTypeName'),
          tableColumnId: _.get(column, 'tableColumnId'),
          width: _.get(column, 'width'),
          format: _.get(column, 'format')
        };
      };

      return {
        columns: _.get(this, 'columns', []).map(serializeColumn),
        createdAt: _.get(this, 'createdAt'),
        displayType: _.get(this, 'displayType'),
        domainCName: _.get(this, 'domainCName'),
        flags: _.get(this, 'flags', []),
        grants: _.get(this, 'grants', []),
        id: _.get(this, 'id'),
        metadata: _.get(this, 'metadata', {}),
        name: _.get(this, 'name', ''),
        newBackend: _.get(this, 'newBackend'),
        oid: _.get(this, 'oid'),
        provenance: _.get(this, 'provenance'),
        publicationAppendEnabled: _.get(this, 'publicationAppendEnabled'),
        publicationDate: _.get(this, 'publicationDate'),
        publicationGroup: _.get(this, 'publicationGroup'),
        publicationStage: _.get(this, 'publicationStage'),
        query: _.get(this, 'query', {}),
        rights: _.get(this, 'rights'),
        rowsUpdatedAt: _.get(this, 'rowsUpdatedAt'),
        tableId: _.get(this, 'tableId'),
        viewLastModified: _.get(this, 'viewLastModified'),
        viewType: _.get(this, 'viewType')
      };
    },

    /**
     *
     * Initialize this Dataset
     *
     */

    _init: function(viewObject) {

      this._super();

      this.registerEvent([
        'columns_changed',
        'valid',
        'query_change',
        'set_temporary',
        'clear_temporary',
        'row_change',
        'blob_change',
        'row_count_change',
        'column_resized',
        'displayformat_change',
        'displaytype_change',
        'column_totals_changed',
        'removed',
        'permissions_changed',
        'new_comment',
        'reloaded',
        'conditionalformatting_change',
        'saved',
        'dataset_last_modified',
        'grid_error_message'
      ]);

      this._fileDataForFileId = {};
      this._useSODA2 = false;
      this._readOnlyView = new ReadOnlyView(viewObject);
      this._commentCache = {};
      this._commentByID = {};

      this.initializeFromViewObject(viewObject);

      // Set up Polaroid image capturing
      if (window._phantom) {
        console.log('Running in PhantomJS.');
        if (_.isFunction(window.callPhantom)) {
          this._setupPolaroidImageCapturing();
        } else {
          console.log('window.callPhantom not present, skipping image capture');
        }
      }
    },

    update: function(viewObjectFragment) {
      var viewObject = this.serialize();

      _.merge(viewObject, viewObjectFragment);

      // We need to persist the view's actual id, since a lot of updates will return
      // with an id of 'zzzz-zzzz' indicating that they are ephemeral.
      viewObject.id = this.id;

      // EN-20968 - Move away from jsonQuery
      //
      // Back-migrate all the jsonQuery shenannigans to something that Core Server
      // can undestand. Eventually we will want to modify the data-shaping UI so
      // that it does not create query metadata in the formats we do not intend
      // to support, but the effort to do this is probably in the same order of
      // magnitude as rewriting the whole thing from scratch-ish because the UI
      // is all auto-generated based on the properties we don't want to support.
      this.initializeFromViewObject(JsonQueryHelpers.viewWithoutJsonQuery(viewObject));

      this.trigger('query_change');
      this.trigger('conditionalformatting_change');
      this.trigger('displaytype_change');
      this.trigger('displayformat_change');
      this.trigger('valid');
    },

    reload: function() {

      ReadOnlyView.fromViewId(this.id).
        then(function(readOnlyView) {
          this.update(readOnlyView.serialize());
        }).
        catch(console.error);
    },

    initializeFromViewObject: function(viewObject) {

      this.assignInstancePropertiesThatAreViewProperties(viewObject);
      this.assignInstancePropertiesThatAreDerivedFromViewProperties();
      this.addColumnContainerToViewInstance();

      // TODO: Just make everywhere in the code call the method, not check
      // the .valid property. Then remove the .valid property.
      this.valid = this.datasetIsValid();
    },

    assignInstancePropertiesThatAreViewProperties: function(viewObject) {
      var self = this;

      _.each(
        viewObject,
        function(value, key) {
          self[key] = value;
        }
      );
    },

    assignInstancePropertiesThatAreDerivedFromViewProperties: function() {

      this.originalViewId = this.id;
      this.url = this.getFullUrl();
      this.fullUrl = this.getFullUrl(true);
      this.shortUrl = this.getShortUrl(true);
      this.apiUrl = this.getApiUrl();
      this.domainUrl = this.getBaseUrl(this.domainCName);
      this.type = getType(this);
      this.displayName = (this.type === 'blist') ?
        ((this.isPublished()) ? $.t('core.view_types.dataset') : $.t('core.view_types.working_copy')) :
        $.t('core.view_types.' + this.type);

      if ($.isBlank(this.displayType)) {
        this.displayType = {
          'tabular': 'table',
          'blobby': 'blob',
          'href': 'href'
        }[this.viewType || 'tabular'];
      }

      // displayFormat is assumed to exist even though it only exists
      // in the view if something has set it.
      //
      // TODO: make this a getter on the dataset model, not a property.
      this.displayFormat = this.displayFormat || {};
      this.metadata = this.metadata || {};

      // The following three metadata properties may be missing from the view
      // if they are null, but frontend code expects them to exist.
      if (!$.subKeyDefined(this, 'metadata.availableDisplayTypes')) {
        var adt;
        if (_.include(['blob', 'href', 'form', 'api'], this.type)) {
          adt = [this.type];
        } else {
          adt = ['table', 'fatrow', 'page'];
          if (!$.isBlank(this.displayType) &&
            !_.include(['blist', 'filter', 'grouped'], this.type)) {
            adt.unshift(this.displayType);
          }
        }
        this.metadata.availableDisplayTypes = adt;
      }
      if (!$.subKeyDefined(this, 'metadata.renderTypeConfig.visible')) {
        this.metadata = $.extend(true, {
          renderTypeConfig: {
            visible: {}
          }
        }, this.metadata);
        this.metadata.renderTypeConfig.visible[this.displayType] = true;
      }
      if ($.subKeyDefined(this, 'metadata.renderTypeConfig.active') &&
        !_.any(this.metadata.renderTypeConfig.active, function(t) {
          return t.id == 'self';
        })) {
        // Something needs to be set to self to properly hook up sidebar, etc.; so pick one at random
        this.metadata.renderTypeConfig.active[
          _.first(_.keys(this.metadata.renderTypeConfig.visible))] = {
          id: 'self'
        };
      }

      // Legacy support for SODA1 search strings.
      this.searchString = this.searchString || undefined;
    },

    addColumnContainerToViewInstance: function() {
      var viewUrl = '/views/' + this.id + '.json';
      var columnsUrl = '/views/' + this.id + '/columns';

      TabularDataset.addProperties(
        this,
        ColumnContainer('column', viewUrl, columnsUrl), //eslint-disable-line new-cap
        $.extend({}, this)
      );

      this.updateColumns(this.initialMetaColumns, false, true);
      delete this.initialMetaColumns;

      if (!_.isUndefined(this.rowIdentifierColumnId)) {
        this.rowIdentifierColumn = this.columnForID(this.rowIdentifierColumnId);
      }
    },

    /**
     *
     * Tell me things about this dataset
     *
     */

    datasetIsValid: function() {
      return $.isBlank(this.message);
    },

    canEdit: function() {
      return (this.hasRight(blist.rights.view.WRITE) || this.hasRight(blist.rights.view.ADD) || this.hasRight(blist.rights.view.DELETE)) &&
        !this.isGrouped() && !this.isAPI();
    },

    canUpdate: function() {
      return (this.isUnpublished() || !this.isDefault()) &&
        this.hasRight(blist.rights.view.UPDATE_VIEW);
    },

    isGrid: function() {
      return this.metadata.renderTypeConfig.visible.table;
    },

    // Checks to determine whether or not options such as calendar-create, map-create, or chart-config should be
    // visible. These options are only available if the availableDisplayTypes are a subset of
    // ['table', 'fatrow', 'page', 'assetinventory']
    shouldShowViewCreationOptions: function() {
      return _.difference(
        this.metadata.availableDisplayTypes, ['table', 'fatrow', 'page', 'assetinventory']
      ).length == 0;
    },

    isGrouped: function() {
      return !_.isEmpty((this.metadata.jsonQuery || {}).group);
    },

    getDownloadType: function() {
      if (!GeoHelpers.isGeoDataset(this)) {
        return 'normal';
      } else {
        var backendPrefix = this.newBackend ? 'nbe_' : 'obe_';
        return backendPrefix + 'geo';
      }
    },

    isBlobby: function() {
      return (this.type == 'blob');
    },

    isHref: function() {
      return (this.type == 'href');
    },

    isDataLens: function() {
      return (this.displayType === 'data_lens');
    },

    isTabular: function() {
      return (this.viewType == 'tabular');
    },

    isAPI: function() {
      return (this.type == 'api');
    },

    isSnapshot: function() {
      return this.publicationStage == 'snapshotted';
    },

    forceEditable: function() {
      return $.parseParams('$$force_editable') == 'true';
    },

    isImmutable: function() {
      if (this.forceEditable()) {
        return false;
      }
      return (this.isBlobby() || GeoHelpers.isGeoDataset(this));
    },

    // This is a weird function, because it just returns an error message.
    invalidMessage: function() {
      return this.message || $.t('controls.grid.required_cols_missing');
    },

    downloadUrl: function(type) {
      return ViewRenderer.downloadUrl(this.getReadOnlyView(), type);
    },

    getNewBackendId: function() {
      var ds = this;
      if (!ds._nbeId && ds.newBackend) {
        ds._nbeId = ds.id;
      }
      if (!_.isUndefined(ds._nbeId)) {
        return $.when(ds._nbeId);
      }

      var deferred = $.Deferred(); //eslint-disable-line new-cap
      ds.makeRequestWithPromise({
        url: '/api/migrations/{0}'.format(ds.id)
      }).done(function(migration) {
        ds._nbeId = migration.nbeId;
        deferred.resolve(ds._nbeId);
      }).fail(function() {
        deferred.reject();
      });
      return deferred.promise();
    },

    getOperationStatuses: function(callback) {
      var ds = this;
      ds.makeRequest({
        url: '/views/' + ds.id,
        params: {
          method: 'operationStatuses'
        },
        success: callback
      });
    },

    hasBlobColumns: function() {
      return !_.isEmpty(this.blobColumns());
    },

    getShareTypes: function() {
      var stypes = ['Contributor', 'Owner'];
      if (this.type != 'form') {
        stypes.unshift('Viewer');
      }
      return stypes;
    },

    findColumnForServerName: function(name, parCol) {
      var ds = this;
      name = ds._useSODA2 ? name : ({
        sid: 'id',
        'id': 'uuid'
      }[name] || name);
      var c = ds._useSODA2 ?
        $.isBlank(parCol) ? ds.columnForFieldName(name) : parCol.childColumnForFieldName(name) :
        $.isBlank(parCol) ? ds.columnForID(name) : parCol.childColumnForID(name);

      if ($.isBlank(c)) {
        if (ds._useSODA2 && ds.isGrouped()) {
          // Maybe a group function?
          var i = name.indexOf('__');
          var gf = name.slice(i + 2);
          var mId = name.slice(0, i);
          c = $.isBlank(parCol) ? ds.columnForIdentifier(mId) : parCol.childColumnForIdentifier(mId);
          if ($.isBlank(c) || c.format.group_function !=
            blist.datatypes.groupFunctionFromSoda2(gf)) {
            // Maybe this is an aggregate column?
            i = name.indexOf('_');
            var agg = name.slice(0, i);
            name = name.slice(i + 1);
            c = $.isBlank(parCol) ? ds.columnForIdentifier(name) :
              parCol.childColumnForIdentifier(name);
            if ($.isBlank(c) || c.format.grouping_aggregate !=
              blist.datatypes.aggregateFromSoda2(agg)) {
              return null;
            }
          }
        } else {
          return null;
        }
      }
      return c;
    },

    getChildViewsForType: function(type) {
      // but if we're displaying it as a map, there's only one
      // map to show
      if (type == 'map') {
        return false;
      }

      // we can only switch if they're trying to display a tabular-ish
      // grid thing
      if (!_.include(['table', 'fatrow', 'page'], type)) {
        return false;
      }

      return this.childViews;
    },

    getViewForDisplay: function(type, callback) {
      // in most cases, it's just the dataset
      var vft = this.getChildViewsForType(type);
      if (!vft) {
        callback(this);
        return;
      }

      // figure out which underlying view to show
      var typeDisplay = $.deepGet(true, this, 'metadata',
        'renderTypeConfig', 'active', type);
      if (!typeDisplay.id || (typeDisplay.id === 'self')) {
        typeDisplay.id = vft[0];
      }

      this._getChildView(typeDisplay.id, callback);
    },


    getChildOptionsForType: function(type, callback) {
      var ds = this;
      var children = ds.getChildViewsForType(type);
      if (!children) {
        callback([ds]);
      } else {
        var options = [];
        _.each(children, function(childUid) {
          ds._getChildView(childUid, function(child) {
            options.push(child);
          }, true);
        });
        ServerModel.sendBatch(function() {
          // success
          callback(options);
        });
      }
    },

    /**
     *
     * Do CRUD operations on entities that are not datasets but are attached to datasets
     *
     */

    // CREATE things

    addColumn: function(column, successCallback, errorCallback) {
      if (!$.isBlank((column || {}).parentId)) {
        var par = this.columnForID(column.parentId);
        if ($.isBlank(par)) {
          throw 'Column ' + column.parentId + ' not found';
        }
        par.addChildColumn(column, successCallback, errorCallback);
        // True means abort (don't handle)
        return true;
      }
    },

    addComment: function(comment, successCallback, errorCallback) {
      var ds = this;

      var cacheId = ds.id;
      var addedComment = function(newCom) {
        ds.numberOfComments++;
        if (!$.isBlank(ds._commentCache[cacheId])) {
          ds._commentCache[cacheId].unshift(newCom);
        }
        ds._commentByID[newCom.id] = newCom;
        ds.trigger('new_comment', [newCom, comment.parent]);
        if (_.isFunction(successCallback)) {
          successCallback(newCom);
        }
      };

      ds.makeRequest({
        url: '/views/' + ds.id + '/comments.json',
        type: 'POST',
        data: JSON.stringify(comment),
        success: addedComment,
        error: errorCallback
      });
    },

    // RETRIEVE things

    getComments: function(callback) {
      var ds = this;
      var cacheId = ds.id;
      if ($.isBlank(ds._commentCache[cacheId])) {
        // Keep getComments cachable by the browser; even though it has no full
        // etag/cache-control handling internally. Comments just don't need to be
        // hitting the backend
        ds.makeRequest({
          url: '/views/' + ds.id + '/comments.json',
          params: null,
          type: 'GET',
          pageCache: true,
          success: function(comms) {
            ds._commentCache[cacheId] = ds._commentCache[cacheId] || [];
            _.each(comms, function(c) {
              ds._commentByID[c.id] = c;
              ds._commentCache[cacheId].push(c);
            });
            callback(ds._commentCache[cacheId]);
          }
        });
      } else {
        callback(ds._commentCache[cacheId]);
      }
    },

    // CORE-2979: this.grants is unreliable because it's being cached.
    userGrants: function(successCallback, errorCallback) {
      var ds = this,
        success = function() {
          var userGrants = _.reject(ds.grants,
            function(g) {
              return _.include(g.flags || [], 'public');
            });
          if (_.isFunction(successCallback)) {
            successCallback(userGrants);
          }
        },
        callback = function(grants) {
          ds.grants = grants || [];
          success();
          ds._grantsFetched = true;
        };

      if (!this._grantsFetched) {
        ds.makeRequest({
          url: '/api/views/' + ds.id + '/grants.json',
          success: callback,
          error: errorCallback
        });
        this._grantsFetched = 'fetching';
      } else if (this._grantsFetched === true) {
        success();
      }
    },

    // UPDATE things

    flagComment: function(commentId, successCallback, errorCallback) {
      var ds = this;

      var com = ds._commentByID[commentId];
      if (!$.isBlank(com)) {
        com.flags = com.flags || [];
        if (!_.include(com.flags, 'flag')) {
          com.flags.push('flag');
        }
      }

      ds.makeRequest({
        url: '/views/' + this.id + '/comments/' +
          commentId + '.json',
        type: 'PUT',
        data: JSON.stringify({
          flags: ['flag']
        }),
        success: successCallback,
        error: errorCallback
      });
    },

    replaceGrant: function(oldGrant, newGrant, successCallback, errorCallback) {
      var ds = this;

      var grantUpdated = function(response) {
        ds.grants = ds.grants || [];
        ds.grants.push(response);
        if (_.isFunction(successCallback)) {
          successCallback();
        }
      };

      var fallback = function(error) {
        if (error.status == 404) {
          var grantDeleted = function() {
            ds.createGrant(newGrant, successCallback, errorCallback);
          };

          // Core server only accepts creation or deletion for grants, so...
          ds.removeGrant(oldGrant, grantDeleted, errorCallback);
        }
      };

      var updateGrant = {
        'oldGrant': oldGrant,
        'newGrant': newGrant
      };

      ds.makeRequest({
        url: '/api/views/' + ds.id + '/grants',
        params: {
          method: 'update'
        },
        type: 'PUT',
        data: JSON.stringify(updateGrant),
        success: grantUpdated,
        error: fallback
      });
    },

    // DELETE things

    removeComment: function(commentId, successCallback, errorCallback) {
      var ds = this;
      var com = ds._commentByID[commentId];

      if ($.isBlank(com)) return;

      ds.makeRequest({
        url: '/views/' + this.id + '/comments/' + commentId + '.json',
        type: 'DELETE',
        success: successCallback,
        error: errorCallback
      });
    },


    /**
     *
     * Search for something in this dataset
     *
     */

    // inDatasetSearch - boolean - if set to true, it tells the backend to timeout faster than its default; see details in EN-10852
    setSearchString: function(searchString, inDatasetSearch) {
      var metadata = $.extend(true, {}, this.metadata);
      metadata.inDatasetSearch = inDatasetSearch;

      this.update({
        metadata: metadata
      });
    },

    /**
     *
     * Manage Files and File Data
     *
     */

    blobColumns: function() {
      return _.filter(this.realColumns, function(col) {
        return col.renderTypeName === 'blob';
      });
    },

    blobs: function() {
      var ds = this;
      if (!$.isBlank(this._blobs)) {
        return this._blobs;
      }

      if (this.isBlobby()) {
        var b = {
          type: (this.blobMimeType || '').replace(/;.*/, ''),
          size: this.blobFileSize,
          href: '/api/views/' + ds.id + '/files/' + this.blobId +
            '?' + $.param({
              filename: this.blobFilename
            })
        };
        if (this.blobFilename != this.name) {
          b.name = this.blobFilename;
        }
        this._blobs = [b];
      } else if (this.isHref()) {
        this._blobs = [];
        if ($.subKeyDefined(this, 'metadata.accessPoints')) {
          _.each(this.metadata.accessPoints, function(v, k) {
            ds._blobs.push({
              href: v,
              type: k.toUpperCase()
            });
          });
          this._blobs = _.sortBy(this._blobs, 'type');
        } else if ($.subKeyDefined(this, 'metadata.href')) {
          this._blobs.push({
            href: this.metadata.href,
            type: 'Link',
            size: 'Unknown'
          });
        }
      }

      return this._blobs;
    },

    // File Data exists at the Dataset level, not the RowSet level.
    resyncFileDataForFileIds: function(ids) {
      var ds = this;

      // We choose to be overzealous here because we'll reject them in the next step.
      if (_.isUndefined(ids)) {
        ids = ds._activeRowSet.getFileIds();
        ds._activeRowSet.mapFileIdsToRows();
      }

      var fileIds = _.reject(ids, _.bind(this.fileDataForFileId, ds));

      if (_.isEmpty(fileIds)) {
        return $.when(ds._fileDataForFileId);
      }

      var deferred = $.Deferred(); //eslint-disable-line new-cap
      $.ajax({
        url: '/views/{0}/files.json?method=getAll'.format(ds.id),
        data: JSON.stringify({
          fileIds: fileIds
        }),
        contentType: 'application/json',
        type: 'post',
        dataType: 'json'
      }).
      done(function(responseData) {
        var rowsChanged = _(responseData).
        map(function(data) {
          ds._fileDataForFileId[data.id] = data;
          return ds._activeRowSet.applyFileDataToRow(data);
        }).
        filter(_.identity). // Dump falses.
        value();

        if (rowsChanged.length > 0) {
          ds._activeRowSet.trigger('row_change', [rowsChanged, false]);
        }
        deferred.resolve(ds._fileDataForFileId);
      });
      return deferred.promise();
    },

    fileDataForFileId: function(id) {
      return this._fileDataForFileId[id];
    },

    /**
     *
     * Deal with Dataset relationships (e.g. derived and related views)
     *
     */

    getParentDataset: function(callback) {
      var ds = this;
      if (($.isBlank(ds._parent) || $.isBlank(ds._parent.columns)) &&
        $.isBlank(ds.noParentAvailable)) {
        ds.makeRequest({
          url: '/views/{0}.json'.format(this.id),
          params: {
            method: 'getDefaultView'
          },
          success: function(parDS) {
            if (parDS.id == ds.id) {
              ds._parent = ds;
            } else {
              ds._parent = createDatasetFromView(parDS);
              if (!$.isBlank(ds.accessType)) {
                ds._parent.setAccessType(ds.accessType);
              }
            }
            callback(ds._parent);
          },
          error: function(xhr) {
            if (JSON.parse(xhr.responseText).code == 'permission_denied') {
              ds.noParentAvailable = true;
            }
            callback();
          }
        });
      } else {
        callback(ds._parent);
      }
    },

    // account for modifyingLens
    getParentView: function(callback) {
      var ds = this;

      if (($.isBlank(ds._modifyingView) || $.isBlank(ds._modifyingView.columns)) &&
        $.isBlank(ds.noModifyingViewAvailable)) {
        if (!_.isUndefined(ds.modifyingViewUid)) {

        ReadOnlyView.fromViewId(ds.id).
          then(function(readOnlyView) {
            ds._modifyingView = readOnlyView.serialize();
            if (!$.isBlank(ds.accessType)) {
              ds._modifyingView.setAccessType(ds.accessType);
            }
            callback(ds._modifyingView);
          }).
          catch(function(xhr) {
            // doesn't seem possible but let's be safe
            if (JSON.parse(xhr.responseText).code == 'permission_denied') {
              ds.noModifyingViewAvailable = true;
            }
            callback();
          });
        } else {
          ds.getParentDataset(callback);
        }
      } else {
        callback(ds._modifyingView);
      }
    },

    getRelatedViews: function(callback) {
      var ds = this;
      if ($.isBlank(ds.relatedViews)) {
        ds.loadRelatedViews(function() {
          callback(ds.relatedViews);
        });
      } else {
        callback(ds.relatedViews);
      }
    },

    getChildView: function(uid, callback) {
      if (!this.childViews) {
        throw 'No such child view';
      }

      this._childViews || (this._childViews = {});
      if (!this._childViews[uid]) {
        var self = this;
        var handleChild = function(child) {
          self._childViews[uid] = child;
          if (child != self) {
            child.unbind(null, null, self);
            child.bind('displaytype_change',
              function() {
                self.trigger('displaytype_change');
              }, self);
          }
          callback(child);
        };
        if (uid == 'self') {
          handleChild(self);
        } else {

          ReadOnlyView.fromViewId(uid).
            then(function(readOnlyView) {
              handleChild(createDatasetFromView(readOnlyView.serialize()));
            }).
            catch(console.error);
        }
      } else {
        callback(this._childViews[uid]);
      }
    },

    loadRelatedViews: function(callback) {
      callback = callback || _.noop;

      var ds = this;
      var processRelatedViews = function(views) {
        var rds = this;
        views = _.map(views, function(v) {
          if (v.id == rds.id) {
            v = rds;
          }
          if (v instanceof TabularDataset || v instanceof Dataset) {
            return v;
          }

          var nv = createDatasetFromView(v);
          nv.bind('removed', function() {
            rds.viewRemoved(this);
          });
          if (!$.isBlank(rds.accessType)) {
            nv.setAccessType(rds.accessType);
          }
          return nv;
        });

        var parDS = _.detect(views, function(v) {
          return _.include(v.flags || [], 'default');
        });
        if (!$.isBlank(parDS)) {
          rds._parent = parDS;
          views = _.without(views, parDS);
        }

        return views;
      };

      // add data lenses to the pane using a second getByTableId call
      var coreViewsPromise = this.getRelatedCoreViews();
      var dataLensPromise = this.getRelatedDataLenses();

      $.whenever(coreViewsPromise, dataLensPromise).done(function(coreResult, dataLensResult) {
        var coreViews = coreResult ? coreResult[0] : [];
        var dataLensViews = dataLensResult ? dataLensResult : [];

        ds.relatedViews = processRelatedViews(
          _.uniq([].concat(coreViews, dataLensViews), 'id')
        );

        callback();
      });
    },

    getRelatedCoreViews: function() {
      // Fully cachable
      return this.makeRequestWithPromise({
        url: '/views.json',
        pageCache: true,
        type: 'GET',
        data: {
          method: 'getByTableId',
          tableId: this.tableId
        }
      });
    },

    getRelatedDataLenses: function() {
      var ds = this;
      var fetchViewJson = function(nbeId) {
        return ds.makeRequestWithPromise({
          url: '/views/{0}.json'.format(nbeId),
          pageCache: true,
          type: 'GET'
        });
      };
      var lookUpDataLensesByTableId = function(nbeTableId) {
        if ($.isBlank(nbeTableId)) {
          throw new Error('nbeTableId is blank');
        }

        return ds.makeRequestWithPromise({
          url: '/views.json',
          pageCache: true,
          type: 'GET',
          data: {
            method: 'getByTableId',
            tableId: nbeTableId
          }
        });
      };
      var onlyDataLenses = function(views) {
        var dataLens = _.filter(views, function(view) {
          return view.displayType === 'data_lens' || view.displayType === 'visualization';
        });

        return $.when(dataLens);
      };

      return this.
        getNewBackendId().
        pipe(fetchViewJson).
        pipe(function(result) {
          return lookUpDataLensesByTableId(result.tableId);
        }).
        pipe(onlyDataLenses);
    },

    /**
     *
     * Deal with the Dataset publication cycle
     *
     */

    loadPublicationViews: function(callback) {
      var ds = this;
      var processDS = function(views) {
        views = _.map(views, function(v) {
          if (v instanceof Dataset) {
            return v;
          }

          var nv = createDatasetFromView(v);
          if (!$.isBlank(ds.accessType)) {
            nv.setAccessType(ds.accessType);
          }
          return nv;
        });

        ds._publishedViews = _.filter(views, function(v) {
          return v.isPublished();
        });
        ds._snapshotViews = _.filter(views, function(v) {
          return v.isSnapshot();
        });
        // There should be only one
        ds._unpublishedView = _.detect(views, function(v) {
          return v.isUnpublished();
        });

        if (_.isFunction(callback)) {
          callback();
        }
      };

      ds.makeRequest({
        url: '/api/views/' + ds.id + '.json',
        pageCache: true,
        type: 'GET',
        params: {
          method: 'getPublicationGroup'
        },
        success: processDS
      });
    },

    getPublishedView: function(callback) {
      var ds = this;
      if ($.isBlank(ds._publishedView)) {
        if (!$.isBlank(ds.publishedViewUid) && $.isBlank(ds.noPublishedViewAvailable)) {
          ds.makeRequest({
            url: '/views/{0}.json'.format(this.publishedViewUid),
            success: function(pv) {
              ds._publishedView = createDatasetFromView(pv);
              callback(ds._publishedView);
            },
            error: function(xhr) {
              if (JSON.parse(xhr.responseText).code == 'permission_denied') {
                ds.noPublishedViewAvailable = true;
              }
              callback();
            }
          });
        } else {
          callback();
        }
      } else {
        callback(ds._publishedView);
      }
    },

    getPublishedDataset: function(callback) {
      var ds = this;
      if ($.isBlank(ds._publishedViews)) {
        ds.loadPublicationViews(function() {
          callback(_.detect(ds._publishedViews, function(v) {
            return v.isDefault();
          }));
        });
      } else {
        callback(_.detect(ds._publishedViews, function(v) {
          return v.isDefault();
        }));
      }
    },

    getUnpublishedDataset: function(callback) {
      var ds = this;
      if ($.isBlank(ds._publishedViews)) {
        ds.loadPublicationViews(function() {
          callback(ds._unpublishedView);
        });
      } else {
        callback(ds._unpublishedView);
      }
    },

    getUnpublishedView: function(callback) {
      var ds = this;
      if ($.isBlank(ds._unpublishedView) && $.isBlank(ds.noUnpublishedViewAvailable)) {
        ds.makeRequest({
          url: '/views/{0}.json'.format(this.publishedViewUid),
          params: {
            method: 'getPublicationGroup',
            stage: 'unpublished'
          },
          success: function(pv) {
            ds._unpublishedView = createDatasetFromView(pv);
            callback(ds._unpublishedView);
          },
          error: function(xhr) {
            if (JSON.parse(xhr.responseText).code == 'permission_denied') {
              ds.noUnpublishedViewAvailable = true;
            }
            callback(ds._unpublishedView);
          }
        });
      } else {
        callback(ds._unpublishedView);
      }
    },



    /**
     *
     * Deal with Dataset archiving (snapshots for OBE datasets, backups for NBE datasets)
     *
     */

    getFullSnapshotUrl: function(name) {
      name = this._getThumbNameOrDefault(name);

      if ($.isBlank(this._getCroppedThumbnailMeta(name))) {
        return null;
      }

      return this.getSnapshotNamed(name);
    },

    getSnapshotNamed: function(name) {
      return '/api/views/' + this.id + '/snapshots/' + escape(name);
    },

    getCroppedSnapshotUrl: function(name) {
      name = this._getThumbNameOrDefault(name);
      // make sure the crop has been created
      var meta = this._getCroppedThumbnailMeta(name);
      if ($.isBlank(meta)) {
        return null;
      }

      return this.getSnapshotNamed(meta.filename);
    },

    // ask the core server to take a new picture
    requestSnapshot: function(name, callback) {
      var ds = this;

      ds.makeRequest({
        success: function(response) {
          ds._updateThumbnailCallback(response, callback);
        },
        error: callback,
        type: 'POST',
        url: '/views/' + ds.id + '/snapshots?method=snapshot&name=' +
          ds._getThumbNameOrDefault(name)
      });
    },

    cropSnapshot: function(name, callback) {
      var ds = this;

      ds.makeRequest({
        success: function(response) {
          ds._updateThumbnailCallback(response, callback);
        },
        error: callback,
        type: 'POST',
        url: '/views/' + ds.id + '/snapshots?method=cropExisting&name=' +
          ds._getThumbNameOrDefault(name)
      });
    },

    getBackups: function(callback) {
      var ds = this;
      if (!ds.newBackend) {
        return;
      }
      var processTS = function(timestamps) {
        var rv = _.map(timestamps, function(timestamp) {
          return {
            downloadLinks: {
              csv: '/api/views/{0}/backups/{1}'.format(ds.id, timestamp)
            },
            moment: moment(timestamp)
          };
        });
        callback(rv);
      };

      ds.makeRequest({
        url: '/api/views/{0}/backups'.format(ds.id),
        type: 'GET',
        success: processTS
      });
    },

    getSnapshotDatasets: function(callback) {
      var ds = this;
      if ($.isBlank(ds._snapshotViews)) {
        ds.loadPublicationViews(function() {
          callback(_.filter(ds._snapshotViews, function(v) {
            return v.isDefault();
          }));
        });
      } else {
        callback(_.filter(ds._snapshotViews, function(v) {
          return v.isDefault();
        }));
      }
    },

    /**
     *
     * Serialization
     *
     */

    clean: function() {
      return cleanViewForSave(this);
    },

    cleanCopy: function(allowedKeys) {
      var dsCopy = this._super(allowedKeys);
      if (!$.isBlank(dsCopy.query)) {
        dsCopy.query.filterCondition = this.cleanFilters();
        delete dsCopy.query.namedFilters;
      }
      return dsCopy;
    },

    // EN-17875 - Make grid view Socrata Viz table respond to OBE/NBE read
    // queries using old query path
    //
    // We need to pass a JSON representation of the view along to the Table
    // renderer by including the equivalent output of the /api/views endpoint in
    // the vif with which we instantiate the Table.
    //
    // Unfortunately, the `.cleanCopy()` method on the Dataset model omits the
    // `renderTypeName` property (since it is not a valid property to send back
    // to Core Server--presumably we assign a renderTypeName when we persist the
    // updated view).
    //
    // Accordingly, and in the spirit of making as few changes to existing code
    // as possible, I am adding an additional method that does not omit the
    // renderTypeName property for the specific use case described above.
    //
    // This is the Dataset component of the work; there are also similar
    // implementations in the Column and Base models located in this project at
    // `platform-ui/frontend/public/javascripts/util/dataset/column.js` and
    // `platform-ui/frontend/public/javascripts/util/base-model.js`,
    // respectively.
    //
    // BECAUSE YOU ASKED, here is a slightly more verbose explanation for why we
    // need to do this (taken from github.com/socrata/platform-ui/pull/5232):
    //
    //   It's actually the Column object that has the renderTypeName property.
    //   But one gets the serialized columns by getting the serialized view (the
    //   dataset implementation of the function with the same name, which
    //   function on dataset basically maps the list of visible columns with the
    //   version of the cleanCopyIncludingRenderTypeName implemented in the
    //   column model, and both will attempt to call
    //   cleanCopyIncludingRenderTypeName on the base model because they both
    //   call self._super(), and it's the whole big mess of the inheritance
    //   stuff that we abused so badly circa 2011.
    //
    // USE AT YOUR OWN RISK etc. etc.
    cleanCopyIncludingRenderTypeName: function() {
      var dsCopy = this._super();
      if (!$.isBlank(dsCopy.query)) {
        dsCopy.query.filterCondition = this.cleanFilters();
        delete dsCopy.query.namedFilters;
      }
      dsCopy.columns = this.realColumns.map(function(column) {
        return column.cleanCopyIncludingRenderTypeName();
      });
      return dsCopy;
    },

    cleanUnsaveable: function(md) {
      var ds = this;
      var adjMD = md;
      if (ds.isPublished() && ds.isDefault()) {
        adjMD = $.extend(true, {}, md);
        // Can't save columns or any query but a sort-by on published datasets
        delete adjMD.columns;

        // If they give us a blank query obj, don't do unnecessary modifications
        if (!$.isBlank(adjMD.query) && _.isEmpty(adjMD.query)) { /* nothing */ } else if ($.subKeyDefined(adjMD, 'query.orderBys')) {
          adjMD.query = {
            orderBys: adjMD.query.orderBys
          };
        } else {
          delete adjMD.query;
        }
      }
      return adjMD;
    },

    /**
     *
     * Data shaping
     *
     */

    getAggregates: function(callback, customAggs) {
      var ds = this;
      var aggResult = function(aggs) {
        _.each(aggs, function(a) {
          var c = ds.columnForIdentifier(a.columnIdent);
          // Might be a child column...
          if ($.isBlank(c)) {
            // Look through each nested table, and find if it has a child
            // column -- find the first real one
            _.each(ds.columnsForType('nested_table', true), function(pc) {
              c = c || pc.childColumnForIdentifier(a.columnIdent);
            });
          }
          if (!$.isBlank(c)) {
            c.aggregates[a.name] = $.isBlank(a.value) ? null : parseFloat(a.value);
          }
        });

        ds.trigger('column_totals_changed');
        if (_.isFunction(callback)) {
          callback();
        }
      };

      _.each(ds.realColumns, function(c) {
        c.aggregates = {};
      });

      ds._activeRowSet.getAggregates(aggResult, customAggs);
    },

    getQueryBase: function(callback) {
      var ds = this;
      if (!$.isBlank(ds._queryBase)) {
        if (_.isFunction(callback)) {
          callback();
        }
        return;
      }

      var updateSelf = _.throttle(function() {
        // This might not actually be a real case, because if you can modify the current
        // view, query access ought to be based on the parent. But logically this is
        // a good thing to do.
        if (!$.isBlank(ds._queryBase) && ds._queryBase.id == ds.id) {
          ds._queryBase.reload(true);
        }
      }, 500, { leading:false });
      // trailing throttle above to make sure reloads from 'columns_changed' events don't get dropped
      ds.bind('saved', updateSelf, ds);
      ds.bind('columns_changed', function(changeType) {
        if (changeType == 'added' || changeType == 'fullSet' || changeType == 'removed') {
          updateSelf();
        }
      }, ds);

      var selfForBase = function() {

        ReadOnlyView.fromViewId(ds.id).
          then(function(readOnlyView) {
            ds._queryBase = readOnlyView.serialize();
            if (_.isFunction(callback)) {
              callback();
            }
          }).
          catch(console.error);
      };

      if (ds.hasRight(blist.rights.view.UPDATE_VIEW) && !ds.isDefault()) {
        ds.getParentView(function(par) {
          if (!$.isBlank(par)) {
            ds._queryBase = par;
            if (_.isFunction(callback)) {
              callback();
            }
          } else {
            selfForBase();
          }
        });
      } else {

        // This is duct tape for some other race condition
        // when trying to render out a map. See: ONCALL-2845.
        _.defer(selfForBase);
      }
    },

    cleanFilters: function(excludeTemporary) {
      var ds = this;
      var filters;
      if (!$.isBlank((ds.query || {}).filterCondition)) {
        filters = $.extend(true, {}, ds.query.filterCondition);
      }
      if (!$.isBlank((ds.query || {}).namedFilters)) {
        var newFilters = [];
        _.each(ds.query.namedFilters, function(nf) {
          if (_.isEmpty(nf) || excludeTemporary && nf.temporary) {
            return;
          }
          // Named filter keys off of main type; so just check displayType and
          // not renderTypeConfig.visible
          if (!$.isBlank(nf.displayTypes) &&
            !_.include(nf.displayTypes, ds.displayType)) {
            return;
          }
          nf = $.extend(true, {}, nf);
          delete nf.temporary;
          delete nf.displayTypes;
          newFilters.push(nf);
        });
        if (newFilters.length > 0) {
          if ($.isBlank(filters) && newFilters.length == 1) {
            filters = _.first(newFilters);
          } else {
            if ($.isBlank(filters)) {
              filters = {
                children: [],
                type: 'operator',
                value: 'AND'
              };
            } else if (filters.type != 'operator' || filters.value != 'AND') {
              filters = {
                type: 'operator',
                value: 'AND',
                children: [filters]
              };
            }
            filters.children = (filters.children || []).concat(newFilters);
          }
        }
      }
      return filters;
    },

    /**
     *
     * Modify the state of the UI at runtime by modifying properties on the dataset
     *
     * TODO: Factor this stuff out and put it somewhere more sensible.
     *
     */

    showRenderType: function(rt, activeUid, force) {
      var ds = this;
      if (!force && ds.metadata.renderTypeConfig.visible[rt]) {
        return;
      }
      var md = $.extend(true, {}, ds.metadata);
      md.renderTypeConfig.visible[rt] = true;
      if (activeUid && (activeUid != ds.id || force)) {
        $.deepSet(md, activeUid, 'renderTypeConfig', 'active', rt, 'id');
      }
      ds.update({
        metadata: md
      }, false, true);
    },

    hideRenderType: function(rt) {
      var ds = this;
      if (!ds.metadata.renderTypeConfig.visible[rt]) {
        return;
      }
      var md = $.extend(true, {}, ds.metadata);
      delete md.renderTypeConfig.visible[rt];
      ds.update({
        metadata: md
      }, false, true);
    },

    toggleRenderType: function(rt) {
      if (this.metadata.renderTypeConfig.visible[rt]) {
        this.hideRenderType(rt);
      } else {
        this.showRenderType(rt);
      }
    },

    viewRemoved: function(view) {
      var ds = this;
      if (!$.isBlank(ds.relatedViews)) {
        ds.relatedViews = _.without(ds.relatedViews, view);
      }
      if (!$.isBlank(ds._relViewCount)) {
        ds._relViewCount--;
      }
      if (!$.isBlank(ds._parent) && ds._parent.id == view.id) {
        delete ds._parent;
      }
    },

    /**
     *
     * Random utility methods
     *
     */

    makeRequest: function(req) {
      req.headers = $.extend(req.headers, {
        'X-Socrata-Federation': 'Honey Badger'
      });
      if (req.inline) {
        req.url = '/views/INLINE/rows.json';
        req.type = 'POST';
        req.data = req.data || JSON.stringify(this.cleanCopy());
      }
      delete req.inline;

      this._super(req);
    },

    // TODO: Find out what this does and if it's something we want to continue to support
    notifyUsers: function(successCallback, errorCallback) {
      this.makeRequest({
        url: '/api/views/' + this.id + '.json',
        params: {
          method: 'notifyUsers'
        },
        type: 'POST',
        success: successCallback,
        error: errorCallback
      });
    },

    redirectTo: function(urlParams) {
      var url = this.url;
      var queryString = '';

      if (blist.configuration.dataset_landing_page_enabled) {
        url = url + '/data';
      }

      if (!$.isBlank(urlParams)) {
        queryString = '?' + $.toParam(urlParams);
      }

      window.location = url + queryString;
    },

    // For metrics purposes
    registerOpening: function(referrer) {
      // make network request.
      var params = {
        method: 'opening'
      };
      if ($.isPresent(referrer)) {
        params.referrer = referrer;
      }

      this.makeRequest({
        url: '/views/' + this.id + '.json',
        params: params,
        type: 'POST'
      });
    },

    getNewBackendMetadata: function() {
      var ds = this;
      if (!_.isUndefined(ds._newBackendMetadata)) {
        return $.when(ds._newBackendMetadata);
      }

      var deferred = $.Deferred(); //eslint-disable-line new-cap
      var reject = function() {
        deferred.reject();
      };

      ds.getNewBackendId().done(function(newBackendId) {
        if (newBackendId) {
          var datasetMetadataUrl = '/api/views/{0}.json';

          $.get(datasetMetadataUrl.format(newBackendId)).done(function(metadata) {
            ds._newBackendMetadata = metadata;
            deferred.resolve(ds._newBackendMetadata);
          }).fail(reject);
        } else {
          ds._newBackendMetadata = null;
          deferred.resolve(ds._newBackendMetadata);
        }
      }).fail(reject);
      return deferred.promise();
    },

    isLayered: function() {
      //checks for layers as direct children
      if (this.isGeoDataset() &&
        typeof(this.metadata.geo.layers) === 'string' &&
        this.metadata.geo.layers.split(',').length > 1) {
        return true;
      }
      //checks for layers from a separate dataset (derived views)
      if (this.displayFormat && this.displayFormat.viewDefinitions) {
        return _.any(this.displayFormat.viewDefinitions, function(viewDef) {
          return viewDef.uid != 'self';
        });
      }
      return false;
    },

    /**
     *
     * Handle Polaroid
     *
     */

    // See util/dataset/map.js and util/dataset/chart.js for examples of asset
    // types which override the timeout value. NOTE: timeout must be less than
    // the render timeout of Polaroid!
    _setupPolaroidImageCapturing: function(timeout) {
      this.bind('request_finish', _.debounce(function() {
        console.log('Render complete.');
        window.callPhantom('snapshotReady');
      }, timeout || 5000));
    },

    _getThumbNameOrDefault: function(name) {
      return name || 'page';
    },

    _getCroppedThumbnailMeta: function(name) {
      return ((this.metadata || {}).thumbnail || {})[name];
    },

    _updateThumbnailCallback: function(response, callback) {
      if ((response.metadata || {}).thumbnail) {
        this.metadata.thumbnail = response.metadata.thumbnail;
      }
      callback(response);
    }
  });

  /* The type string is not always the simplest thing -- a lot of munging
   * goes on in Rails; we roughly duplicate it here */
  function getType(ds) {
    var VIZ_TYPES = ['chart', 'annotatedtimeline', 'imagesparkline', 'areachart', 'barchart', 'columnchart', 'linechart', 'piechart'];
    var MAP_TYPES = ['map', 'geomap', 'intensitymap'];
    var type = ds.displayType || 'table';

    if (ds.viewType == 'blobby') {
      type = 'blob';
    } else if (ds.displayType == 'assetinventory') {
      type = 'table';
    } else if (ds.viewType == 'href') {
      type = 'href';
    } else if (ds.displayType == 'api') {
      type = 'api';
    } else if (_.include(['table', 'fatrow', 'page'], type) &&
      _.include(ds.flags || [], 'default')) {
      type = 'blist';
    } else if (_.include(VIZ_TYPES, type)) {
      type = 'chart';
    } else if (_.include(MAP_TYPES, type)) {
      type = 'map';
    } else if (type == 'calendar') {
      // Do nothing; but avoid the else cases
    } else if (!$.isBlank(ds.query) && !$.isBlank(ds.query.groupBys) &&
      // We have to inspect the message because if it is invalid, the groupBy is gone
      ds.query.groupBys.length > 0 || (ds.message || '').indexOf('roll up') >= 0) {
      type = 'grouped';
    } else if (_.include(['table', 'fatrow', 'page'], type) &&
      !_.include(ds.flags || [], 'default')) {
      type = 'filter';
    }

    return type;
  }

  function cleanViewForSave(ds, allowedKeys) {
    var dsCopy = ds.cleanCopy(allowedKeys);
    if (ds.oldColumns) {
      // If we swapped in NBE columns, swap them out when saving.
      dsCopy.columns = ds.oldColumns;
    }
    dsCopy = ds.cleanUnsaveable(dsCopy);

    // cleanCopy already removes namedFilters, so we just need to get the updated fc here
    if (!$.isBlank(dsCopy.query)) {
      dsCopy.query.filterCondition = ds.cleanFilters(true);
    }

    return dsCopy;
  }

  function cleanViewForCreate(ds) {
    var dsCopy = ds.cleanCopy();

    if (!_.isUndefined(dsCopy.metadata)) {
      delete dsCopy.metadata.facets;
      delete dsCopy.metadata.filterCondition;
    }

    delete dsCopy.resourceName;
    delete dsCopy.rowIdentifierColumnId;

    if (!$.isBlank(dsCopy.query)) {
      dsCopy.query.filterCondition = ds.cleanFilters(true);
    }

    if (dsCopy.displayType == 'assetinventory') {
      delete dsCopy.displayType;
    }

    return dsCopy;
  }

  if (blist.inBrowser) {
    this.TabularDataset = TabularDataset;
  } else {
    module.exports = TabularDataset;
  }
})();
