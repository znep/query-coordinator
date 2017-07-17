(function() {

  /* Properties on Dataset:

      + displayType: from core server, this can be set by the client to tell the
          front-end how to render data.  Available values: 'calendar', 'chart',
          'map', 'form', 'api'
      + viewType: set by core server, this defines whether a dataset is tabular data,
          blobby data, or an href.  Possible values: 'tabular', 'blobby', 'href', 'geo'
      + type: set by this Model, it rolls up several pieces of data to give a simple
          type for the Dataset that code can check against.  Possible values:
          'blist', 'filter', 'grouped', 'chart', 'map', 'form', 'calendar',
          'blob', 'href', 'api'
      + styleClass: set by this Model, this can be set as a class on an HTML element
          to pick up styling for this type of Dataset
      + displayName: set by this Model, a displayable string that should used in the
          UI to indicate this item.  For example, it can be 'dataset',
          'filtered view', 'grouped view', etc.
      + _mixpanelViewType: set by this Model, based on type, this is a human-friendly version
          of type that is intended for internal use only (specifically sending events to
          Mixpanel). If you add new types to type, update this mapping!

      + temporary: True if the dataset has been modified and not saved
      + minorChange: Only valid when temporary is set.  If this is true, it is a
          minor update (such as a map viewport being changed) and doesn't
          really invalidate most actions like sharing, embedding, etc.
  */

  var Dataset = ServerModel.extend({
    _init: function(v) {
      this._super();

      this.registerEvent(['columns_changed', 'valid', 'query_change',
        'set_temporary', 'clear_temporary', 'row_change', 'blob_change',
        'row_count_change', 'column_resized', 'displayformat_change',
        'displaytype_change', 'column_totals_changed', 'removed',
        'permissions_changed', 'new_comment', 'reloaded',
        'conditionalformatting_change', 'saved', 'dataset_last_modified',
        'grid_error_message'
      ]);

      var ds = this;

      // EN-10110/EN-16622 - Disable non-table renderTypeOptions for NBE-only datasets
      if (blist.feature_flags.enable_nbe_only_grid_view_optimizations) {
        // Override whatever the renderTypeConfig might actually be with ONLY
        // the table/grid view, since that is the only one we want to support
        // moving forward with NBE-only datasets.
        //
        // It seems safer to expunge the presence of unsupported
        // renderTypeConfigs from view JSON used to instantiate the Dataset
        // model rather than trying to track down every single thing that might
        // be reading these properties in any number of dynamic property path
        // constructions, blargh.
        if (
          v.hasOwnProperty('metadata') &&
          v.metadata.hasOwnProperty('renderTypeConfig')
        ) {

          // Store the original values so that we can replace them when we make
          // updates to the server's notion of the view, since we want the below
          // change to be transparent and client-side only.
          //
          // Note that for some reason when loading a grid view page the Dataset
          // model gets instantiated twice (?!) so we need to guard against
          // overwriting the original stashed values with the overridden ones.
          if (!window.blist.hasOwnProperty('originalDatasetTypeMetadata')) {
            window.blist.originalDatasetTypeMetadata = {
              availableDisplayTypes: _.cloneDeep(v.metadata.availableDisplayTypes),
              renderTypeConfig: _.cloneDeep(v.metadata.renderTypeConfig)
            };
          }

          v.metadata.renderTypeConfig = {
            visible: {
              socrataVizTable: true
            }
          };
          v.metadata.availableDisplayTypes = ['socrataVizTable'];
        }
      }

      // Avoid overwriting functions with static values from Rails (e.g., totalRows)
      _.each(v, function(curVal, key) {
        if (!_.isFunction(ds[key])) {
          ds[key] = curVal;
        }
      });

      this._fileDataForFileId = {};

      if (!(blist.sharedDatasetCache[this.id] instanceof Dataset)) {
        blist.sharedDatasetCache[this.id] = this;
      }
      if (!$.isBlank(this.resourceName) &&
        !(blist.sharedDatasetCache[this.resourceName] instanceof Dataset)) {
        blist.sharedDatasetCache[this.resourceName] = this;
      }

      // EN-6784 - Race condition in useSODA2 + column .lookup
      // We need to determine useSoda2 before we construct the columns for this dataset
      // because column creation actually uses that flag.
      this._determineUseSODA2();

      // This ID really shouldn't be changing; if it does, this URL
      // will be out-of-date...
      var selfUrl = '/views/' + this.id;
      Dataset.addProperties(this, ColumnContainer('column', //eslint-disable-line new-cap
        selfUrl + '.json', selfUrl + '/columns'), $.extend({}, this));

      if (!$.isBlank(this.approvalHistory)) {
        Dataset.addProperties(this, Dataset.modules.approvalHistory, $.extend({}, this));
      }

      this.updateColumns(this.initialMetaColumns, false, true);
      delete this.initialMetaColumns;

      this._adjustProperties();

      // Note: _useSODA2 is set in _adjustProperties.
      if (!_.isUndefined(this.rowIdentifierColumnId)) {
        this.rowIdentifierColumn = this.columnForID(this.rowIdentifierColumnId);
        this.rowsNeedPK = this.newBackend && this._useSODA2; // BASICALLY A TAUTOLOGY.
      }

      var originalQuery = this._getQueryGrouping();
      this._syncQueries(originalQuery.oldJsonQuery, originalQuery.oldQuery, originalQuery.oldGroupings, originalQuery.oldGroupAggs);

      this.temporary = false;
      this.minorChange = true;
      this.valid = this._checkValidity();

      // We need an active row set to start
      var cleanFC = ds.cleanJsonFilters();
      ds._savedRowSet = new RowSet(ds, $.extend({}, ds.metadata.jsonQuery, {
          where: cleanFC.where,
          having: cleanFC.having,
          namedFilters: null
        }), {
          orderBys: (ds.query || {}).orderBys,
          filterCondition: ds.cleanFilters(),
          groupBys: (ds.query || {}).groupBys,
          groupFuncs: ds._getGroupedFunctions()
        },
        null, ds.initialRows);
      delete ds.initialRows;
      ds._activateRowSet(ds._savedRowSet);

      this._pendingRowEdits = {};
      this._pendingRowDeletes = {};

      this._aggregatesStale = true;

      this._origObj = this.cleanCopy();

      this._commentCache = {};
      this._commentByID = {};

      // Set up Polaroid image capturing
      if (window._phantom) {
        console.log('Running in PhantomJS.');
        if (_.isFunction(window.callPhantom)) {
          this._setupPolaroidImageCapturing();
        } else {
          console.log('window.callPhantom not present, skipping image capture');
        }
      }

      this.bucketSize = parseInt(blist.feature_flags.nbe_bucket_size, 10) || 1000;
    },

    usingBuckets: function() {
      return this.newBackend && false !== blist.feature_flags.nbe_bucket_size;
    },

    rowForID: function(id) {
      return this._activeRowSet.rowForID(id);
    },

    rowForIndex: function(index) {
      return this._activeRowSet.rowForIndex(index);
    },

    rowIndex: function(id, successCallback) {
      this._activeRowSet.rowIndex(id, successCallback);
    },

    totalRows: function() {
      return this._activeRowSet.totalRows();
    },

    getRowBucket: function(index) {
      return this._activeRowSet.getRowBucket(index);
    },

    bucketIndex: function(bucketStart) {
      return this._activeRowSet.bucketIndex(bucketStart);
    },

    totalBuckets: function() {
      return this._activeRowSet.totalBuckets();
    },

    isDefault: function() {
      return _.include(this.flags || [], 'default');
    },

    isPublic: function() {
      var ds = this;
      return _.any(this.grants || [], function(grant) {
        return _.include(grant.flags || [], 'public') &&
          ((ds.type == 'form' && grant.type == 'contributor') ||
            ds.type != 'form');
      });
    },

    isAnonymous: function(isAnon) {
      if (!$.isBlank(isAnon)) {
        this._isAnon = isAnon;
      }
      if ($.isBlank(this._isAnon)) {
        this._isAnon = false;
      }
      return this._isAnon;
    },

    hasRight: function(right) {
      return _.include(this.rights, right);
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

    isFederated: function() {
      return !$.isBlank(this.domainCName);
    },

    isArcGISDataset: function() {
      if (this.metadata && this.metadata.custom_fields && this.metadata.custom_fields.Basic && this.metadata.custom_fields.Basic.Source) {
        return true;
      }
      return false;
    },

    getDownloadType: function() {
      if (!this.isGeoDataset()) {
        return 'normal';
      } else {
        var backendPrefix = this.newBackend ? 'nbe_' : 'obe_';
        return backendPrefix + 'geo';
      }
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

    isGeoDataset: function() {
      return (this.metadata && this.metadata.geo);
    },

    isApiGeospatial: function() {
      var customFields = _.merge(this.metadata || {}, this.privateMetadata || {}).custom_fields || {};
      return _.reduce(customFields, function(acc, fields, fieldset) {
        return acc || (/^geo-?spatial api pre-?release$/i.test(fieldset) && (fields.Enabled || fields.enabled) === 'true');
      }, false);
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

    isPublished: function() {
      return this.publicationStage == 'published';
    },

    isUnpublished: function() {
      return this.publicationStage == 'unpublished';
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
      return (this.isBlobby() || this.isGeoDataset());
    },

    renderWithArcGISServer: function() {
      // Render everything using ArcGIS Server since we can't preemptively tell
      // if something is more than 500 rows or not.
      return this.isArcGISDataset();
    },

    invalidMessage: function() {
      return this.message || $.t('controls.grid.required_cols_missing');
    },

    clean: function() {
      return cleanViewForSave(this);
    },

    save: function(successCallback, errorCallback, allowedKeys) {
      var ds;

      if (blist.feature_flags.enable_nbe_only_grid_view_optimizations) {
        ds = restoreOriginalTypeMetadata(cleanViewForSave(this, allowedKeys));
      } else {
        ds = cleanViewForSave(this, allowedKeys);
      }

      if (!ds.hasRight(blist.rights.view.UPDATE_VIEW)) {
        return false;
      }

      var vizIds = $.isBlank(ds.visibleColumns) ? null :
        _.pluck(ds.visibleColumns, 'id');
      var dsSaved = function(newDS) {
        ds._savedRowSet = ds._activeRowSet;
        ds._update(newDS, true, false, true);
        if (!$.isBlank(vizIds) &&
          !_.isEqual(vizIds, _.pluck(ds.visibleColumns, 'id'))) {
          ds.setVisibleColumns(vizIds);
        }
        if (_.isFunction(successCallback)) {
          successCallback(ds);
        }
        ds.trigger('saved');
      };

      this.makeRequest({
        url: '/views/' + this.id + '.json',
        type: 'PUT',
        data: JSON.stringify(ds),
        error: errorCallback,
        success: dsSaved
      });

      return true;
    },

    saveNew: function(useNBE, successCallback, errorCallback) {
      var url = (useNBE) ? '/views?nbe=true' : '/views';
      var dsOrig = this;
      var dsCreated = function(newDS) {
        newDS = new Dataset(newDS);

        if (!$.isBlank(dsOrig.accessType)) {
          newDS.setAccessType(dsOrig.accessType);
        }

        if (_.isFunction(successCallback)) {
          successCallback(newDS);
        }
      };
      var ds;

      if (blist.feature_flags.enable_nbe_only_grid_view_optimizations) {
        ds = restoreOriginalTypeMetadata(cleanViewForCreate(this));
      } else {
        ds = cleanViewForCreate(this);
      }

      // Munge permissions for forms, since those don't get carried over
      // or inherited
      if (dsOrig.isPublic() && dsOrig.type == 'form') {
        ds.flags = ds.flags || [];
        ds.flags.push('dataPublicAdd');
      }

      this.makeRequest({
        url: url,
        type: 'POST',
        data: JSON.stringify(ds),
        error: errorCallback,
        success: dsCreated
      });
    },

    update: function(newDS, fullUpdate, minorUpdate) {
      var ds = this;

      // If any updated key exists but is set to invalid, then we can't save
      // it on this dataset; so make minorUpdate false
      if (!_.isEqual(newDS, ds._cleanUnsaveable(newDS))) {
        minorUpdate = false;
      }
      var copyFunc = minorUpdate ? cleanViewForSave : cleanViewForCreate;
      var origCopy = copyFunc(this);
      this._update(newDS, fullUpdate, fullUpdate);
      var updCopy = copyFunc(this);
      if (!_.isEqual(origCopy, updCopy)) {
        this._markTemporary(minorUpdate);
      }

      // EN-12888 - Don't Copy Parent Filters Into Child Grouped View
      //
      // See comment above the implementation of this function for details.
      maybeShowIncorrectGridPreviewNotice(origCopy, updCopy);
    },

    reload: function(reloadFromServer) {
      var ds = this;
      if (ds.isBlobby()) {
        ds.trigger('blob_change');
        return;
      }
      ds._aggregatesStale = true;
      if (reloadFromServer) {
        ds.makeRequest({
          url: '/api/views/' + ds.id + '.json',
          type: 'GET',
          success: function(newDS) {
            ds._update(newDS, true, true, true);
            ds.trigger('reloaded');
          }
        });
      } else {
        // We can just restore to the original object
        ds._update(ds._origObj, true, true, true);
        ds.trigger('reloaded');
      }
    },

    simpleSort: function(colId, ascending) {
      var ds = this;
      var md = $.extend(true, {}, ds.metadata);
      var query = md.jsonQuery;
      var col = ds.columnForIdentifier(colId);
      if ($.isBlank(col)) {
        delete query.order;
      } else {
        query.order = [{
          columnFieldName: col.fieldName,
          ascending: ascending === true
        }];
      }

      ds.update({
        metadata: md
      }, false, (query.order || []).length < 2);
    },

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
            if (!k.endsWith('Size')) {
              ds._blobs.push({
                href: v,
                type: k.toUpperCase(),
                size: ds.metadata.accessPoints[k + 'Size']
              });
            }
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

    removeGrant: function(grant, successCallback, errorCallback) {
      var ds = this;

      var grantDeleted = function() {
        ds.grants = _.reject(ds.grants || [], function(g) {
          return (!$.isBlank(grant.userId) && grant.userId == g.userId) ||
            (!$.isBlank(grant.groupUid) && grant.groupUid == g.groupUid) ||
            (!$.isBlank(grant.userEmail) && grant.userEmail == g.userEmail);
        });
        if (_.isFunction(successCallback)) {
          successCallback();
        }
      };

      ds.makeRequest({
        url: '/api/views/' + ds.id + '/grants',
        params: {
          method: 'delete'
        },
        type: 'PUT',
        data: JSON.stringify(grant),
        success: grantDeleted,
        error: errorCallback
      });
    },

    createGrant: function(grant, successCallback, errorCallback, isBatch) {
      var ds = this;

      var grantCreated = function(response) {
        ds.grants = ds.grants || [];
        ds.grants.push(response);
        if (_.isFunction(successCallback)) {
          successCallback();
        }
      };

      ds.makeRequest({
        url: '/api/views/' + ds.id + '/grants/',
        type: 'POST',
        data: JSON.stringify(grant),
        batch: isBatch,
        success: grantCreated,
        error: errorCallback
      });
    },

    replaceGrant: function(oldGrant, newGrant, successCallback, errorCallback) {
      var ds = this;

      var grantDeleted = function() {
        ds.createGrant(newGrant, successCallback, errorCallback);
      };

      // Core server only accepts creation or deletion for grants, so...
      ds.removeGrant(oldGrant, grantDeleted, errorCallback);
    },

    makePublic: function(successCallback, errorCallback) {
      var ds = this;

      var success = function() {
        ds.trigger('permissions_changed');
        if (_.isFunction(successCallback)) {
          successCallback.apply(ds, arguments);
        }
      };

      if (!ds.isPublic()) {
        ds.grants = ds.grants || [];
        ds.grants.push({
          type: (ds.type == 'form' ? 'contributor' : 'viewer'),
          flags: ['public']
        });

        ds.makeRequest({
          url: '/views/' + ds.id,
          type: 'PUT',
          params: {
            method: 'setPermission',
            value:
              (ds.type == 'form' ? 'public.add' : 'public.read')
          },
          success: success,
          error: errorCallback
        });
      } else {
        success();
      }
    },

    makePrivate: function(successCallback, errorCallback) {
      var ds = this;

      var success = function() {
        ds.trigger('permissions_changed');
        if (_.isFunction(successCallback)) {
          successCallback.apply(ds, arguments);
        }
      };

      if (ds.isPublic()) {
        ds.grants = _.reject(ds.grants,
          function(g) {
            return _.include(g.flags || [], 'public') &&
              g.inherited !== true;
          });

        ds.makeRequest({
          url: '/views/' + ds.id + '.json',
          type: 'PUT',
          params: {
            method: 'setPermission',
            value: 'private'
          },
          success: success,
          error: errorCallback
        });
      } else {
        success();
      }
    },

    makeCustomGeoregion: function(successCallback, errorCallback) {
      var ds = this;
      ds.makeRequest({
        url: '/admin/geo',
        data: JSON.stringify({
          id: ds.id
        }),
        type: 'POST',
        success: successCallback,
        error: errorCallback
      });
    },

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

    getNewBackendId: function() {
      var ds = this;
      if (!ds._nbeId && ds.newBackend) {
        ds._nbeId = ds.id;
      }
      if (!_.isUndefined(ds._nbeId)) {
        return $.when(ds._nbeId);
      }

      var deferred = $.Deferred(); //eslint-disable-line new-cap
      this.makeRequestWithPromise({
        url: '/api/migrations/{0}'.format(ds.id)
      }).done(function(migration) {
        ds._nbeId = migration.nbeId;
        deferred.resolve(ds._nbeId);
      }).fail(function() {
        deferred.reject();
      });
      return deferred.promise();
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
          var datasetMetadataUrl = '/metadata/v1/dataset/{0}.json';

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

    getTotalRows: function(successCallback, errorCallback) {
      this._activeRowSet.getTotalRows(successCallback, errorCallback);
    },

    getClusters: function(viewport, displayFormat, minDistance, successCallback, errorCallback) {
      var ds = this;
      if (!ds._clusters) {
        ds._clusters = {};
      }
      if (!ds._rowClusterParents) {
        ds._rowClusterParents = {};
      }

      if (!($.subKeyDefined(displayFormat, 'plot.locationId') && _.include(['location', 'point'],
          (ds.columnForIdentifier(displayFormat.plot.locationId) || {}).renderTypeName))) {
        errorCallback();
        return;
      }

      if (ds.newBackend) {
        ds._getClustersViaSODA2.apply(ds, arguments);
        return;
      }

      var params = {
        method: 'clustered2'
      };
      _.each({
        'xmin': 'min_lon',
        'xmax': 'max_lon',
        'ymin': 'min_lat',
        'ymax': 'max_lat'
      }, function(newProp, oldProp) {
        params[newProp] = viewport[oldProp];
      });

      params['target_node_clusters'] = 250;
      params['min_distance_between_clusters'] = minDistance;
      if (!params['min_distance_between_clusters']) {
        params['min_distance_between_clusters'] = Math.min(viewport.xmax - viewport.xmin,
          viewport.ymax - viewport.ymin) / 10;
        if (params['min_distance_between_clusters'] > 5) {
          params['min_distance_between_clusters'] = 5;
        } else if (params['min_distance_between_clusters'] > 1) {
          params['min_distance_between_clusters'] = 1;
        }
      }

      var translateCluster = function(c) {
        c.parent = ds._clusters[c.pathToRoot[0]];
        ds._clusters[c.id] = c;
        _.each(c.points, function(point) {
          ds._rowClusterParents[point] = c;
        });
        _.each(c.children, function(child) {
          if (ds._clusters[child] && !ds._clusters[child].parent) {
            ds._clusters[child].parent = ds._clusters[ds._clusters[child].pathToRoot[0]];
          }
        });
        _.each(c.polygon, function(vertex) {
          if (vertex.lat == 90) {
            vertex.lat -= 0.000001;
          } else if (vertex.lat == -90) {
            vertex.lat += 0.000001;
          }
          if (vertex.lon == 180) {
            vertex.lon -= 0.000001;
          } else if (vertex.lon == -180) {
            vertex.lon += 0.000001;
          }
        });
        c.leafNode = (c.points || []).length > 0;
      };

      var useInline = ds.isDefault() || $.subKeyDefined(ds, 'query.filterCondition') || ds.cleanFilters() || $.isPresent($.deepGetStringField(ds, 'metadata.jsonQuery.search')) || ($.isPresent(displayFormat) && !_.isEqual(displayFormat, ds.displayFormat));

      var reqData;
      if (useInline) {
        if ($.subKeyDefined(ds, 'query.namedFilters.viewport')) {
          var tmp = ds.query.namedFilters.viewport;
          delete ds.query.namedFilters.viewport;
          reqData = ds.cleanCopy();
          ds.query.namedFilters.viewport = tmp;
        } else {
          reqData = ds.cleanCopy();
        }

        if (!$.isBlank(displayFormat)) {
          reqData.displayFormat = displayFormat;
        }
        reqData = JSON.stringify(reqData);
      }
      if (params['max_lon'] < params['min_lon']) {
        var viewportsLeft = 2;
        var totalData = [];
        var callback = function(data) {
          viewportsLeft--;
          totalData = totalData.concat(data);
          ds.trigger('row_count_change');
          if (viewportsLeft == 0) {
            successCallback(totalData);
          }
        };
        ds.makeRequest({
          url: '/views/' + ds.id + '/rows.json',
          params: $.extend({}, params, {
            'min_lon': -179.999999
          }),
          data: reqData,
          inline: useInline,
          success: function(data) {
            _.each(data, translateCluster);
            callback(data);
          },
          error: errorCallback
        });
        ds.makeRequest({
          url: '/views/' + ds.id + '/rows.json',
          params: $.extend({}, params, {
            'max_lon': 179.999999
          }),
          data: reqData,
          inline: useInline,
          success: function(data) {
            _.each(data, translateCluster);
            callback(data);
          },
          error: errorCallback
        });
      } else {
        ds.makeRequest({
          url: '/views/' + ds.id + '/rows.json',
          params: params,
          data: reqData,
          inline: useInline,
          success: function(data) {
            _.each(data, translateCluster);
            ds.trigger('row_count_change');
            successCallback(data);
          },
          error: errorCallback
        });
      }
    },

    // inDatasetSearch - boolean - if set to true, it tells the backend to timeout faster than its default; see details in EN-10852
    setSearchString: function(searchString, inDatasetSearch) {
      var metadata = $.extend(true, {}, this.metadata);
      metadata.jsonQuery.search = searchString;
      metadata.inDatasetSearch = inDatasetSearch;
      this.update({
        metadata: metadata
      });
    },

    _getClustersViaSODA2: function(viewport, displayFormat, minDistance, successCallback, errorCallback) {
      var ds = this;

      var colLookup = ds.columnForIdentifier(displayFormat.plot.locationId).lookup;
      var params = {
        method: 'soql_clustered'
      };

      // Yay copy-paste
      params['target_node_clusters'] = 250;
      params['min_distance_between_clusters'] = minDistance;
      if (!params['min_distance_between_clusters']) {
        params['min_distance_between_clusters'] = Math.min(viewport.xmax - viewport.xmin,
          viewport.ymax - viewport.ymin) / 10;
        if (params['min_distance_between_clusters'] > 5) {
          params['min_distance_between_clusters'] = 5;
        } else if (params['min_distance_between_clusters'] > 1) {
          params['min_distance_between_clusters'] = 1;
        }
      }

      var translateCluster = function(c) {
        c.parent = ds._clusters[c.pathToRoot[0]];
        ds._clusters[c.id] = c;
        _.each(c.points, function(point) {
          ds._rowClusterParents[point] = c;
        });
        _.each(c.children, function(child) {
          if (ds._clusters[child] && !ds._clusters[child].parent) {
            ds._clusters[child].parent = ds._clusters[ds._clusters[child].pathToRoot[0]];
          }
        });
        _.each(c.polygon, function(vertex) {
          if (vertex.lat == 90) {
            vertex.lat -= 0.000001;
          } else if (vertex.lat == -90) {
            vertex.lat += 0.000001;
          }
          if (vertex.lon == 180) {
            vertex.lon -= 0.000001;
          } else if (vertex.lon == -180) {
            vertex.lon += 0.000001;
          }
        });
        c.leafNode = (c.points || []).length > 0;
      };

      // Build baseline query with row filtering.
      var baseQuery = ds._queryBase.metadata.jsonQuery,
        rs = ds._activeRowSet;

      // Pillaged from RowSet#_makeSODA2Request
      // Inject tears here because lack of DRYness.
      var soqlWhere = blist.filter.generateSOQLWhere(
        blist.filter.subtractQueries(Dataset.translateFilterColumnsToBase(
            rs._jsonQuery.where, ds),
          baseQuery.where), ds._queryBase);

      params.$where = soqlWhere;
      params.location = colLookup;

      var requests;

      _.each({
        'xmin': 'min_lon',
        'xmax': 'max_lon',
        'ymin': 'min_lat',
        'ymax': 'max_lat'
      }, function(newProp, oldProp) {
        params[newProp] = viewport[oldProp];
      });

      if (viewport.xmax < viewport.xmin) {
        // Add one query for each side of the date line.
        requests = _.map([{
          max_lon: 179.999999
        }, {
          min_lon: -179.999999
        }], function(bound) {
          return $.extend({}, params, bound);
        });
      } else {
        requests = [params];
      }

      var viewportsLeft = requests.length;
      var totalData = [];
      var callback = function(data) {
        viewportsLeft--;
        totalData = totalData.concat(data);
        ds.trigger('row_count_change');
        if (viewportsLeft == 0) {
          successCallback(totalData);
        }
      };

      _.each(requests, function(req) {

        ds.makeRequest({
          url: '/views/' + ds.id + '/rows.json',
          params: req,
          success: function(data) {
            _.each(data, translateCluster);
            callback(data);
          },
          error: errorCallback
        });
      });
    },

    blobColumns: function() {
      return _.filter(this.realColumns, function(col) {
        return col.renderTypeName === 'blob';
      });
    },

    hasBlobColumns: function() {
      return !_.isEmpty(this.blobColumns());
    },

    fileDataForFileId: function(id) {
      return this._fileDataForFileId[id];
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

    // Callback may be called multiple times with smaller batches of rows
    getRows: function(start, len, successCallback, errorCallback, reversedSortOrder) {
      this._activeRowSet.getRows(start, len, successCallback, errorCallback, reversedSortOrder);
    },

    getAllRows: function(successCallback, errorCallback) {
      this._activeRowSet.getAllRows(successCallback, errorCallback);
    },

    getRowsByIds: function(ids, successCallback, errorCallback) {
      this._activeRowSet.getRows(ids, null, successCallback, errorCallback);
    },

    primaryKeyExists: function(candidatePrimaryKey) {
      return this._activeRowSet.primaryKeyExists(candidatePrimaryKey);
    },

    loadedRows: function() {
      return this._activeRowSet.loadedRows();
    },

    invalidateMeta: function() {
      // Should be all row-sets?
      this._activeRowSet.invalidateMeta();
    },

    invalidateRows: function() {
      // Should be all row-sets?
      this._activeRowSet.invalidate();
    },

    createRowWithPK: function(pkValue) {
      return this.createRow(null, null, null, pkValue);
    },

    // Assume it goes at the end
    createRow: function(data, parRowId, parColId, pkValue, successCallback, errorCallback) {
      var ds = this;

      var parCol;
      if (!$.isBlank(parColId)) {
        parCol = this.columnForID(parColId);
      }
      var parRow;
      if (!$.isBlank(parRowId)) {
        parRow = this.rowForID(parRowId);
      }

      data = data || {
        data: {}
      };
      var newRow = {
        data: {},
        metadata: $.extend({}, data.metadata),
        invalid: {},
        error: {},
        changed: {}
      };
      _.each(!$.isBlank(parCol) ? parCol.childColumns : ds.columns, function(c) {
        if (!$.isBlank(data.data[c.lookup])) {
          newRow.data[c.lookup] = data.data[c.lookup];
        }
      });
      newRow.id = 'saving' + _.uniqueId();
      delete newRow.data.uuid;

      _.each(!$.isBlank(parCol) ? parCol.realChildColumns : ds.realColumns,
        function(c) {
          newRow.changed[c.lookup] = true;
        });

      if (ds.rowsNeedPK) {
        if (pkValue) {
          newRow.data[ds.rowIdentifierColumn.lookup] = pkValue;
        } else {
          // Now what happens is a round-trip to the server, which will return a 500.
          // We'll take that and render it as an error on the UX.
          // Because GOOD DESIGN.
          console.error('tried to create a row without a pk value');
          newRow.error[ds.rowIdentifierColumn.lookup] = true;
          newRow.valid = false;
        }
      }

      if ($.isBlank(parRow)) {
        ds._addRow(newRow, data.index);
      } else {
        parRow.data[parCol.lookup] = parRow.data[parCol.lookup] || [];
        if (!$.isBlank(data.index)) {
          parRow.data[parCol.lookup].splice(data.index, 0, newRow);
        } else {
          parRow.data[parCol.lookup].push(newRow);
        }
        ds._updateRow(parRow);
        ds.trigger('row_change', [
          [parRow], true
        ]);
      }

      var key = newRow.id;
      if (!$.isBlank(parRow)) {
        key += ':' + parRow.id + ':' + parCol.id;
      }

      // This feels like a hack.
      // The purpose of creating this array normally is to anticipate an edit.
      // Because row creation on an NBE dataset will fail, we need to
      // NOT anticipate the edit, because it will not be forthcoming.
      if (!ds.newBackend) {
        ds._pendingRowEdits[key] = [];
      }

      var savingLookups;
      if (ds._useSODA2) {
        savingLookups = _.pluck(ds.realColumns, 'lookup');
      } else {
        savingLookups = _.pluck(_.reject(!$.isBlank(parCol) ? parCol.realChildColumns :
          ds.realColumns,
          function(c) {
            return c.dataTypeName == 'nested_table';
          }), 'id');
      }

      // Don't bother actually doing separate row creation unless it's OBE.
      // In NBE, the entire purpose of this function is to do some UX work and then
      // return a temporary ID.
      if (!ds.newBackend) {
        var reqObj = {
          row: newRow,
          rowData: ds._rowData(newRow, savingLookups, parCol),
          parentRow: parRow,
          parentColumn: parCol,
          success: successCallback,
          error: errorCallback
        };
        if ($.isBlank(ds._pendingRowCreates)) {
          ds._serverCreateRow(reqObj);
          ds._pendingRowCreates = [];
        } else {
          ds._pendingRowCreates.push(reqObj);
        }
      }

      return newRow.id;
    },


    setRowValue: function(value, rowId, columnId, isInvalid, parRowId, parColId) {
      var parCol;
      var col;
      if (!$.isBlank(parColId)) {
        parCol = this.columnForID(parColId);
        col = parCol.childColumnForID(columnId);
      } else {
        col = this.columnForID(columnId);
      }

      if ($.isBlank(col)) {
        throw 'Column ' + columnId + ' not found';
      }
      if (col.isMeta) {
        throw 'Cannot modify metadata on rows: ' + columnId;
      }

      var row;
      if (!$.isBlank(parRowId)) {
        var parRow = this.rowForID(parRowId);
        row = this._activeRowSet.childRowForID(rowId, parRow, parCol);
      } else {
        row = this.rowForID(rowId);
      }
      if ($.isBlank(row)) {
        throw 'Row ' + rowId + ' not found while setting value ' + value;
      }

      // Save this off because we'll need it for upserting.
      if (col == this.rowIdentifierColumn && _.isUndefined(row.originalPrimaryKeyValue)) {
        row.originalPrimaryKeyValue = row.data[col.lookup];
      }

      row.data[col.lookup] = value;

      delete row.error[col.lookup];

      row.changed[col.lookup] = true;

      row.invalid[col.lookup] = isInvalid || false;

      // If the dataset has no PK, the row is always save-able.
      // If the dataset has a PK, but it isn't set, the row is not saveable.
      // This row-level validity has nothing to do with cell-level validity.
      // Confused yet?
      row.valid = !this.rowsNeedPK || !_.isUndefined(row.data[this.rowIdentifierColumn.lookup]);

      this._activeRowSet.updateRow(parRow || row);

      this.trigger('row_change', [
        [parRow || row]
      ]);
    },

    saveRow: function(rowId, parRowId, parColId, successCallback, errorCallback, useBatch) {
      var ds = this;
      var parCol;
      if (!$.isBlank(parColId)) {
        parCol = this.columnForID(parColId);
      }

      var parRow;
      var row;
      if (!$.isBlank(parRowId)) {
        parRow = this.rowForID(parRowId);
        row = this._activeRowSet.childRowForID(rowId, parRow, parCol);
      } else {
        row = this.rowForID(rowId);
      }

      if ($.isBlank(row)) {
        throw 'Row ' + rowId + ' not found while saving';
      }

      // NBE does not accept invalid data. Just toss the query.
      if (_.any(row.invalid) && ds.newBackend) {
        console.error('this row has invalid columns, so we didn\'t submit it.');
        return;
      }

      // Keep track of which columns need to be saved, and only use those values
      var saving = _.keys(row.changed);
      if (ds.rowsNeedPK) {
        if (!_.include(saving, ds.rowIdentifierColumn.lookup)) {
          saving.push(ds.rowIdentifierColumn.lookup);
        }
      }

      var sendRow = ds._rowData(row, saving, parCol);

      // Cleanup the fallout from a failed attempt to create a row on NBE.
      if (ds.newBackend && !_.has(row.metadata, 'version')) {
        if (/^saving\d+/.test(row.id)) {
          delete sendRow[':id'];
        }
        delete sendRow[':meta'];
      }

      // When attempting to modify the pk value, need to issue an upsert first.
      // 1. Throw away our sendRow. We need to re-build the entire row.
      // 2. Send a delete command on the existing row.
      // 3. Send an insert on the *entire* row, since "everything" is changed now.
      if (_.has(row.metadata, 'version') && row.changed[(ds.rowIdentifierColumn || {}).lookup]) {
        // ds.rowIdentifierColumn should be guaranteed since
        // row.changed[null] should be undefined.
        sendRow = [];
        var deleteCmd = {
          ':deleted': true
        };
        deleteCmd[ds.rowIdentifierColumn.lookup] = row.originalPrimaryKeyValue;
        sendRow.push(deleteCmd);

        sendRow.unshift(ds._rowData(row, _.pluck(ds.realColumns, 'lookup'), parCol));
      }

      var doRequest = function() {
        var reqObj = {
          row: row,
          rowData: sendRow,
          columnsSaving: saving,
          parentRow: parRow,
          parentColumn: parCol,
          success: successCallback,
          error: errorCallback
        };

        var key = row.id;
        if (!$.isBlank(parRow)) {
          key += ':' + parRow.id + ':' + parCol.id;
        }
        if (!$.isBlank(ds._pendingRowEdits[key])) {
          ds._pendingRowEdits[key].push(reqObj);
          return;
        }

        ds._pendingRowEdits[key] = [];
        ds._serverSaveRow(reqObj, useBatch);
      };

      // This check only needs to happen if there's a primary key. You can't modify
      // the server-generated :id column.
      if (ds.rowsNeedPK) {
        var primaryKeyColumnID = ds.rowIdentifierColumn.lookup;
        var hasChangedPrimaryKey = row.changed[primaryKeyColumnID];

        if (hasChangedPrimaryKey) {
          var candidatePrimaryKey = row.data[primaryKeyColumnID];

          ds.primaryKeyExists(candidatePrimaryKey).
          done(function(primaryKeyRow) {
            var hasPrimaryKeyRow = typeof primaryKeyRow === 'object';
            var isDifferentRow = row.id !== (hasPrimaryKeyRow && primaryKeyRow.id);

            if (hasPrimaryKeyRow && isDifferentRow) {
              console.error('Attempted to change primary key to one that already exists.');
              row.error[ds.rowIdentifierColumn.lookup] = true;
              row.invalid[ds.rowIdentifierColumn.lookup] = true;

              // Update the UX.
              ds.trigger('row_change', [
                [row]
              ]);
              ds.trigger('grid_error_message', [row, ds.rowIdentifierColumn, $.t('controls.grid.errors.primary_key_collision')]);
            } else {
              doRequest();
            }
          }).
          fail(function() {
            ds.trigger('grid_error_message', [row, ds.rowIdentifierColumn, $.t('controls.grid.errors.cannot_edit_at_this_time')]);
          });
        } else {
          doRequest();
        }
      } else {
        doRequest();
      }
    },

    removeRows: function(rowIds, parRowId, parColId,
      successCallback, errorCallback) {
      var ds = this;
      rowIds = $.makeArray(rowIds);

      var parCol;
      if (!$.isBlank(parColId)) {
        parCol = this.columnForID(parColId);
      }
      var parRow;
      if (!$.isBlank(parRowId)) {
        parRow = this.rowForID(parRowId);
      }

      _.each(rowIds, function(rId) {
        // Subrows need UUID
        var uuid;
        if ($.isBlank(parRow)) {
          var r = ds.rowForID(rId);
          if ($.isBlank(r)) {
            return;
          }
          uuid = ds._useSODA2 ? r.id : r.metadata.uuid;
          if (ds.rowsNeedPK) {
            uuid = r.data[ds.rowIdentifierColumn.lookup];
          }
          ds._removeRow(r);
        } else {
          parRow.data[parCol.lookup] = _.reject(parRow.data[parCol.lookup],
            function(cr) {
              if (cr.id == rId) {
                uuid = ds._useSODA2 ? cr.id : cr.metadata.uuid;
                return true;
              }
              return false;
            });
          ds._updateRow(parRow);
        }

        var key = rId;
        if (!$.isBlank(parRow)) {
          key += ':' + parRow.id + ':' + parCol.id;
        }
        if (!$.isBlank(ds._pendingRowEdits[key])) {
          ds._pendingRowDeletes[key] = {
            rowId: uuid,
            parRowId: parRowId,
            parColId: parColId
          };
          return;
        }

        ds._serverRemoveRow(uuid, parRowId, parColId, true);
      });

      if (!$.isBlank(parRow)) {
        ds.trigger('row_change', [
          [parRow], true
        ]);
      } else {
        ds.trigger('row_count_change');
      }
      ds._aggregatesStale = true;
      _.each(!$.isBlank(parCol) ? parCol.realChildColumns : ds.realColumns,
        function(c) {
          c.invalidateData();
        });
      ServerModel.sendBatch({
        success: successCallback,
        error: errorCallback
      });
    },

    markRow: function(markType, value, row) {
      _.each(this._availableRowSets, function(rs) {
        rs.markRow(markType, value, row);
      });
    },

    highlightRows: function(rows, type, column, isAdd) {
      var ds = this;
      rows = $.makeArray(rows);

      type = type || 'default';
      ds.highlightTypes = ds.highlightTypes || {};
      ds.highlightsColumn = ds.highlightsColumn || {};
      if (!isAdd) {
        if (!$.isBlank(ds.highlightTypes[type])) {
          var newIds = {};
          _.each(rows, function(r) {
            newIds[r.id] = true;
          });
          ds.unhighlightRows(_.reject(ds.highlightTypes[type],
            function(r, rId) {
              return newIds[rId] && ($.isBlank(column) && $.isBlank(ds.highlightsColumn[rId]) ||
                (column || {}).id == ds.highlightsColumn[rId]);
            }), type);
        } else {
          ds.highlightTypes[type] = {};
        }
      }

      ds.highlights = ds.highlights || {};
      var rowChanges = [];
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        ds.highlightTypes[type][row.id] = row;
        if (!ds.highlights[row.id]) {
          ds.highlights[row.id] = true;
          if (!$.isBlank(column)) {
            ds.highlightsColumn[row.id] = column.id;
          }
          var realRow = ds.rowForID(row.id);
          if (!$.isBlank(realRow)) {
            ds.markRow('highlight', true, realRow);
            if (!$.isBlank(column)) {
              ds.markRow('highlightColumn', column.id, realRow);
            }
          }
          rowChanges.push(realRow || row);
        }
      }
      if (rowChanges.length > 0) {
        ds.trigger('row_change', [rowChanges]);
      }
    },

    unhighlightRows: function(rows, type) {
      var ds = this;
      rows = $.makeArray(rows);
      type = type || 'default';
      ds.highlightTypes = ds.highlightTypes || {};

      ds.highlights = ds.highlights || {};
      ds.highlightsColumn = ds.highlightsColumn || {};
      var rowChanges = [];
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        if (!$.isBlank(ds.highlightTypes[type])) {
          delete ds.highlightTypes[type][row.id];
        }

        if (_.any(ds.highlightTypes, function(hHash) {
            return !$.isBlank(hHash[row.id]);
          })) {
          continue;
        }

        if (ds.highlights[row.id]) {
          delete ds.highlights[row.id];
          delete ds.highlightsColumn[row.id];
          var realRow = ds.rowForID(row.id);
          if (!$.isBlank(realRow)) {
            ds.markRow('highlight', false, realRow);
            ds.markRow('highlightColumn', null, realRow);
          }
          rowChanges.push(realRow || row);
        }
      }
      if (rowChanges.length > 0) {
        ds.trigger('row_change', [rowChanges]);
      }
    },

    rowToSODA2: function(row) {
      var r = {
        ':index': row.index
      };
      _.each(this.columns, function(c) {
        r[c.fieldName] = row.data[c.lookup];
        if (c.renderTypeName == 'location' && $.subKeyDefined(r[c.fieldName], 'human_address') &&
          _.isString(r[c.fieldName].human_address)) {
          r[c.fieldName].human_address = JSON.parse(r[c.fieldName].human_address);
        }
        // Do we expect SODA2 to actually return real values or not? For
        // current use cases, this is valid; but maybe not forever
        if (c.renderTypeName == 'drop_down_list' && !$.isBlank(r[c.fieldName])) {
          r[c.fieldName] = c.renderType.renderer(r[c.fieldName], c, true);
        }
      });
      // For backwards compatibility, make all the meta columns into non-: items
      // (unless that field is taken by a real column)
      _.each(this.columns, function(c) {
        if (c.isMeta && _.isUndefined(r[c.name])) {
          r[c.name] = r[c.fieldName];
        }
      });
      return r;
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

        ds._aggregatesStale = false;
        ds.trigger('column_totals_changed');
        if (_.isFunction(callback)) {
          callback();
        }
      };

      // If aggregates are stale, clear them all out to avoid confusion
      if (ds._aggregatesStale) {
        _.each(ds.realColumns, function(c) {
          c.aggregates = {};
        });
      }

      var isStale = ds._aggregatesStale ||
        _.any(customAggs || {}, function(aList, cId) {
          var col = ds.columnForID(cId);
          if ($.isBlank(col)) {
            return true;
          }
          return _.any($.makeArray(aList),
            function(a) {
              return $.isBlank(col.aggregates[a]);
            });
        }) || $.isBlank(customAggs) &&
        _.any(ds.visibleColumns, function(c) {
          return $.subKeyDefined(c.format.aggregate) &&
            $.isBlank(c.aggregates[c.format.aggregate]);
        });

      if (isStale) {
        ds._activeRowSet.getAggregates(aggResult, customAggs);
      } else if (_.isFunction(callback)) {
        callback();
      }
    },

    aggregatesChanged: function(skipStale) {
      if (!skipStale) {
        this._aggregatesStale = true;
      }
      this.trigger('column_totals_changed');
    },

    updateRating: function(rating, successCallback, errorCallback) {
      this.makeRequest({
        url: '/views/' + this.id + '/ratings.json',
        type: 'POST',
        data: JSON.stringify(rating),
        success: successCallback,
        error: errorCallback
      });
    },

    remove: function(successCallback, errorCallback) {
      var ds = this;
      var dsRemoved = function() {
        ds.trigger('removed');
        if (_.isFunction(successCallback)) {
          successCallback();
        }
      };

      if (ds.isDataLens()) {
        // Send a DELETE request to the NFE endpoint, which should propagate the delete to the
        // OBE representation.
        ds.makeRequestWithPromise({
          url: '/metadata/v1/page/{0}'.format(ds.id),
          type: 'DELETE'
        }).then(dsRemoved, errorCallback);
      } else {
        ds.makeRequest({
          url: '/api/views/' + ds.id + '.json',
          type: 'DELETE',
          success: dsRemoved,
          error: errorCallback
        });
      }
    },

    registerOpening: function(referrer) {
      // make network request.
      var params = {
        method: 'opening'
      };
      if ($.isPresent(referrer)) {
        params.referrer = referrer;
      }
      if (this._useSODA2 && $.parseParams().$$store) {
        params.$$store = $.parseParams().$$store;
      }
      this.makeRequest({
        url: '/views/' + this.id + '.json',
        params: params,
        type: 'POST'
      });

      // store in local storage.
      Dataset.saveRecentDataset(this);
    },

    _isGeoExport: function(ext) {
      return this.isGeoDataset() && ext !== 'json' && ext !== 'csv';
    },

    downloadUrl: function(type) {
      var ext = type.toLowerCase().split(' ')[0];

      if (this._isGeoExport(ext)) {
        return '/api/geospatial/{0}?method=export&format={1}'.format(this.id, type);
      }

      var bom = (type == 'CSV for Excel' || type == 'CSV for Excel (Europe)') ? '&bom=true' : '';
      var format = (type == 'CSV for Excel' || type == 'CSV for Excel (Europe)') ? '&format=true' : '';
      var delimiter = (type == 'CSV for Excel (Europe)') ? '&delimiter=;' : '';
      return '/api/views/{0}/rows.{1}?accessType=DOWNLOAD{2}{3}{4}'.format(this.id, ext, bom, format, delimiter);
    },

    _getCommentCacheKey: function(comment) {
      return $.isBlank(comment.rowId) ? this.id :
        _.compact([comment.rowId, comment.tableColumnId]).join('_');
    },

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

    removeComment: function(commentId, successCallback, errorCallback) {
      var ds = this;
      var com = ds._commentByID[commentId];

      if ($.isBlank(com)) return;

      ds.makeRequest({
        url: '/views/' + this.id + '/comments/' +
          commentId + '.json',
        type: 'DELETE',
        success: successCallback,
        error: errorCallback
      });
    },

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

    rateComment: function(commentId, thumbsUp, successCallback, errorCallback) {
      var ds = this;

      var com = ds._commentByID[commentId];
      if (!$.isBlank(com)) {
        if ((com.currentUserRating || {}).thumbUp !== thumbsUp) {
          var dir = thumbsUp ? 'up' : 'down';
          com[dir + 'Ratings']++;
          if (!$.isBlank(com.currentUserRating)) {
            com[(thumbsUp ? 'down' : 'up') + 'Ratings']--;
          }
          com.currentUserRating = com.currentUserRating || {};
          com.currentUserRating.thumbUp = thumbsUp;
        }
      }

      ds.makeRequest({
        url: '/views/' + ds.id + '/comments/' +
          commentId + '/ratings.json',
        params: {
          thumbsUp: thumbsUp
        },
        type: 'POST',
        success: successCallback,
        error: errorCallback
      });
    },

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
              ds._parent = new Dataset(parDS);
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
          Dataset.createFromViewId(ds.modifyingViewUid,
            function(modifyingView) {
              ds._modifyingView = modifyingView;
              if (!$.isBlank(ds.accessType)) {
                ds._modifyingView.setAccessType(ds.accessType);
              }
              callback(ds._modifyingView);
            },
            function(xhr) {
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
      if ($.isBlank(ds._relatedViews)) {
        ds._loadRelatedViews(function() {
          callback(ds._relatedViews);
        });
      } else {
        callback(ds._relatedViews);
      }
    },

    getViewForDisplay: function(type, callback) {
      // in most cases, it's just the dataset
      var vft = this._childViewsForType(type);
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
        Dataset.createFromViewId(ds.id, function(qb) {
          ds._queryBase = qb;
          if (_.isFunction(callback)) {
            callback();
          }
        });
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

    getChildOptionsForType: function(type, callback) {
      var ds = this;
      var children = ds._childViewsForType(type);
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
     * @function getFilteredFieldNames
     * @description
     * Attempts to grab the field names by recursively plucking
     * the attribute, columnFieldName, from dataset.query.
     * @returns {Array} - The unique field names currently being used as a filter.
     */
    getFilteredFieldNames: function() {
      return _.uniq(blist.util.recursivePluck(this.query, 'columnFieldName'));
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

    _cachedLinkedColumnOptions: {},

    getLinkedColumnOptions: function(keyCol, notUsed, $field, curVal) {
      var ds = this;
      var localKeyColumnId = keyCol && keyCol['format.linkedKey'] ?
        keyCol['format.linkedKey'] : keyCol;

      if ($.isBlank(localKeyColumnId) || isNaN(localKeyColumnId)) {
        return [];
      }

      var viewUid = ds.columnForID(localKeyColumnId).format.linkedDataset;

      if ($.isBlank(viewUid) || !viewUid.match(blist.util.patterns.UID)) {
        return [];
      }

      if ($.isBlank(ds._cachedLinkedColumnOptions[viewUid])) {
        // ETag handling is fully implemented for views
        ds.makeRequest({
          url: '/api/views/' + viewUid + '.json',
          pageCache: true,
          type: 'GET',
          error: function(req) {
            alert(JSON.parse(req.responseText).message);
          },
          success: function(linkedDataset) {
            var lds = new Dataset(linkedDataset);
            if (!$.isBlank(ds.accessType)) {
              lds.setAccessType(ds.accessType);
            }
            ds._cachedLinkedColumnOptions[viewUid] = [];
            var cldo = ds._cachedLinkedColumnOptions[viewUid];
            var opt;

            _.each(lds.columns || [], function(c) {
              if (c.canBeLinkSource()) {
                opt = {
                  value: String(c.fieldName),
                  text: c.name,
                  dataType: c.dataTypeName
                };
                cldo.push(opt);
              }
            });
            if (ds._cachedLinkedColumnOptions[viewUid].length <= 0) {
              alert('Dataset ' + viewUid + ' does not have any columns.');
            } else {
              $field.data('linkedFieldValues', '_reset');
              _.each($field.data('linkedGroup'), function(f) {
                $(f).trigger('change');
              });
              _.defer(function() {
                $field.val(curVal);
              });
            }
          }
        });
        return [];
      }

      // set up another key to get the remote columns.  used by add new
      // column dialog.
      ds._cachedLinkedColumnOptions[localKeyColumnId] =
        ds._cachedLinkedColumnOptions[viewUid];

      return ds._cachedLinkedColumnOptions[viewUid];
    },

    getLinkSourceDataType: function(col, linkSrcColId, keyColId) {
      var localKeyColId = col && col.format ? col.format.linkedKey : keyColId;
      var ds = blist.dataset;
      var keyCol = ds.columnForID(localKeyColId);
      if (keyCol == undefined) {
        return null;
      }
      var viewUid = keyCol.format.linkedDataset;
      var remoteColumns = ds._cachedLinkedColumnOptions[viewUid];
      if (remoteColumns == null) {
        return null;
      }

      for (var n = remoteColumns.length - 1; n >= 0; n--) {
        if (remoteColumns[n].value == linkSrcColId) {
          var dt = remoteColumns[n].dataType;
          return {
            value: dt,
            text: blist.datatypes[dt].title
          };
        }
      }

      return null;
    },

    hasDatasetLinkColumn: function() {
      // no link column in bnb
      var ds = this;
      if (ds && ds.parentId) {
        return false;
      }
      return _.any(ds.columns,
        function(c) {
          return (c.dataTypeName == 'dataset_link');
        });
    },

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
      this._updateSnapshot('snapshot', name, callback);
    },

    cropSnapshot: function(name, callback) {
      this._updateSnapshot('cropExisting', name, callback);
    },

    // Publishing
    makeUnpublishedCopy: function(successCallback, pendingCallback, errorCallback) {
      var ds = this;
      if (ds.isDefault()) {
        ds.makeRequest({
          url: '/api/views/' + ds.id + '/publication.json',
          params: {
            method: 'copy'
          },
          type: 'POST',
          pending: function() {
            ds.copyPending = true;
            if (_.isFunction(pendingCallback)) {
              pendingCallback();
            }
          },
          error: errorCallback,
          success: function(r) {
            delete ds.copyPending;
            ds._unpublishedView = new Dataset(r);
            if (_.isFunction(successCallback)) {
              successCallback(ds._unpublishedView);
            }
          }
        });
      } else {
        ds.getParentDataset(function(parDS) {
          ds._startRequest();
          parDS.makeUnpublishedCopy(function() {
            ds._finishRequest();
            if (_.isFunction(successCallback)) {
              successCallback.apply(ds, arguments);
            }
          }, pendingCallback, errorCallback);
        });
      }
    },

    publish: function(successCallback, errorCallback) {
      var ds = this;
      ds.makeRequest({
        url: '/api/views/' + ds.id + '/publication.json',
        type: 'POST',
        error: errorCallback,
        success: function(r) {
          var pubDS = new Dataset(r);
          if (_.isFunction(successCallback)) {
            successCallback(pubDS);
          }
        }
      });
    },

    getPublishedDataset: function(callback) {
      var ds = this;
      if ($.isBlank(ds._publishedViews)) {
        ds._loadPublicationViews(function() {
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
        ds._loadPublicationViews(function() {
          callback(ds._unpublishedView);
        });
      } else {
        callback(ds._unpublishedView);
      }
    },
    isPublicationStageChangeAvailable: function(isPublished, resultCallback) {
      var ds = this;
      var controlsGridStatusKey = 'controls.grid.{0}'.format(isPublished ? 'published' : 'unpublished');

      if (!ds.newBackend) {
        if (ds.columnsForType('location').length < 1) {
          resultCallback(true);
          return;
        }

        ds.makeRequest({
          url: '/api/geocoding/{0}.json'.format(ds.id),
          params: {
            method: 'pending'
          },
          success: function(results) {
            resultCallback(results.view < 1, $.t('{0}.geocodes_pending'.format(controlsGridStatusKey)));
          },
          error: function() {
            resultCallback(false, $.t('{0}.unknown_publication_stage_change_available_error'.format(controlsGridStatusKey)));
          }
        });
      } else {
        // EN-10105 - Show “you can’t publish this! It’s geocoding!” message on grid view
        //
        //
        // Note that successCallback takes arguments:
        //
        // 1. boolean indicating whether publishing is available
        // 2. an error message to display if publishing is not available
        //
        // TODO: check for computed columns
        // or at least point and number columns?
        ds.makeRequest({
          url: '/api/views/{0}/replication.json'.format(ds.id),
          success: function(replicationStatus) {
            var computationUpToDate = _.get(replicationStatus, 'asynchronous_computation_up_to_date', true);

            resultCallback(computationUpToDate, $.t('{0}.asynchronous_computation_pending'.format(controlsGridStatusKey)));
          },
          error: function() {
            resultCallback(false, $.t('{0}.unknown_publication_stage_change_available_error'.format(controlsGridStatusKey)));
          }
        });
      }
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

    makeBackup: function(successCallback) {
      var ds = this;
      if (!ds.newBackend) {
        return;
      }
      if (!_.isFunction(successCallback)) {
        successCallback = function() {};
      }
      ds.makeRequest({
        url: '/api/views/{0}/backups'.format(ds.id),
        type: 'POST',
        success: function() {
          successCallback();
        }
      });
    },

    deleteBackup: function(backupURI, successCallback) {
      var ds = this;
      if (!ds.newBackend) {
        return;
      }
      if (!_.isFunction(successCallback)) {
        successCallback = function() {};
      }
      ds.makeRequest({
        url: backupURI,
        type: 'DELETE',
        success: function() {
          successCallback();
        }
      });
    },

    getSnapshotDatasets: function(callback) {
      var ds = this;
      if ($.isBlank(ds._snapshotViews)) {
        ds._loadPublicationViews(function() {
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

    cleanJsonFilters: function(excludeTemporary) {
      var ds = this;
      var filters = {};
      _.each(['where', 'having'], function(k) {
        if ($.subKeyDefined(ds, 'metadata.jsonQuery.' + k)) {
          filters[k] = $.extend(true, {}, ds.metadata.jsonQuery[k]);
        }
      });
      if ($.subKeyDefined(ds, 'metadata.jsonQuery.namedFilters')) {
        var newFilters = {
          where: [],
          having: []
        };
        _.each(ds.metadata.jsonQuery.namedFilters, function(nf) {
          if (excludeTemporary && nf.temporary) {
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
          newFilters.where.push(nf.where);
          newFilters.having.push(nf.having);
        });
        _.each(['where', 'having'], function(k) {
          newFilters[k] = _.compact(newFilters[k]);
          if (newFilters[k].length > 0) {
            if (_.isEmpty(filters[k]) && newFilters[k].length == 1) {
              filters[k] = _.first(newFilters[k]);
            } else {
              if (_.isEmpty(filters[k])) {
                filters[k] = {
                  children: [],
                  operator: 'AND'
                };
              } else if (filters[k].operator != 'AND') {
                filters[k] = {
                  operator: 'AND',
                  children: [filters[k]]
                };
              }
              filters[k].children = (filters[k].children || []).concat(newFilters[k]);
            }
          }
        });
      }
      return filters;
    },

    cleanCopy: function(allowedKeys) {
      var dsCopy = this._super(allowedKeys);
      if (!$.isBlank(dsCopy.query)) {
        dsCopy.query.filterCondition = this.cleanFilters();
        delete dsCopy.query.namedFilters;
      }
      if ($.subKeyDefined(dsCopy, 'metadata.jsonQuery')) {
        $.extend(dsCopy.metadata.jsonQuery, this.cleanJsonFilters());
        delete dsCopy.metadata.jsonQuery.namedFilters;
      }
      return dsCopy;
    },

    changeOwner: function(userId, successCallback, errorCallback) {
      var ds = this;

      ds.makeRequest({
        url: '/views/' + ds.id + '?method=plagiarize&userId=' + userId,
        type: 'PUT',
        success: successCallback,
        error: errorCallback
      });
    },

    getShareTypes: function() {
      var stypes = ['Contributor', 'Owner'];
      if (this.type != 'form') {
        stypes.unshift('Viewer');
      }
      return stypes;
    },

    preferredImage: function(size) {
      var ds = this;

      if ($.isBlank(size)) {
        size = 'thumb';
      }

      if (!$.isBlank(ds.iconUrl)) {
        return '/assets/' + escape(ds.iconUrl) + '?s=thumb';
      } else if ($.deepGet(ds, 'metadata', 'thumbnail', 'page', 'filename')) {
        var result = '';
        if (ds.isFederated()) {
          result += '//' + this.domainCName;
        }

        result += '/api/views/' + ds.id + '/snapshots/page?size=thumb';
        return result;
      }
      return null;
    },

    // TODO IDE says this is an unused method
    preferredImageType: function() {
      var ds = this;

      if (!$.isBlank(ds.iconUrl)) {
        return 'customImage';
      } else if ($.subKeyDefined(ds, 'metadata.thumbnail.page.filename')) {
        return 'thumbnail';
      }
      return '';
    },

    // Private methods

    _checkValidity: function() {
      return $.isBlank(this.message);
    },

    _markTemporary: function(minorChange) {
      var oldMinor = this.minorChange;
      this.minorChange = this.minorChange && (minorChange || false);
      if (!this.temporary || oldMinor !== this.minorChange) {
        this.temporary = true;
        this.trigger('set_temporary');
        if ((blist.debug || {}).temporary && (console || {}).trace) {
          console.groupCollapsed('markingTemporary');
          console.trace();
          console.groupEnd();
        }
      }
    },

    _clearTemporary: function() {
      if (this.temporary) {
        this.temporary = false;
        this.minorChange = true;
        this.trigger('clear_temporary');
      }
    },

    _determineUseSODA2: function() {
      var ds = this;
      var useSoda2Flag = false;
      if (!_.isUndefined(blist.feature_flags.useSoda2)) {
        if (blist.feature_flags.useSoda2 === 'always') {
          useSoda2Flag = true;
        } else if (blist.feature_flags.useSoda2 === 'never') {
          useSoda2Flag = false;
        } else if (blist.feature_flags.useSoda2 === 'read-only') {
          useSoda2Flag = !!blist.currentUser;
        }
      }

      if (ds.newBackend || blist.configuration.useSoda2 || useSoda2Flag) {
        ds._useSODA2 = true;
      } else {
        ds._useSODA2 = false;
      }

      // Allow explicit override of SODA version via URL parameter
      var sodaVersion = $.urlParam(window.location.href, 'soda');
      if (sodaVersion === '1') {
        ds._useSODA2 = false;
      }
      if (sodaVersion === '2') {
        ds._useSODA2 = true;
      }
    },

    _adjustProperties: function() {
      var ds = this;
      ds.originalViewId = ds.id;

      ds._determineUseSODA2();

      ds.type = getType(ds);
      ds._mixpanelViewType = getMixpanelViewType(ds);

      if (ds.isUnpublished()) {
        ds.styleClass = 'Unpublished';
      } else if (ds.type == 'blist' && ds.isSnapshot()) {
        ds.styleClass = 'Snapshotted';
      } else {
        ds.styleClass = ds.type.capitalize();
      }

      if ($.isBlank(ds.displayType)) {
        ds.displayType = {
          'tabular': 'table',
          'blobby': 'blob',
          'href': 'href'
        }[ds.viewType || 'tabular'];
      }
      ds.displayName = getDisplayName(ds);

      // Legacy support for SODA1 search strings.
      ds.searchString = ds.searchString || undefined;

      // If we are an invalid filter, we're not really that invalid, because
      // the core server has already removed the offending clause. So just
      // ignore the message, and the view will load fine without the clause
      // on the non-existant column
      if (!$.isBlank(ds.message) && ds.type == 'filter') {
        delete ds.message;
      }

      if (!ds._addedProperties) {
        var types = [ds.type];
        if ($.subKeyDefined(ds, 'metadata.availableDisplayTypes')) {
          // Make sure main type is last so that those functions get
          // priority. Yes, this is a hack; we should probably redo
          // the module system sometime soon...
          types = _.without(ds.metadata.availableDisplayTypes, ds.type);
          types.push(ds.type);
        }
        _.each(types, function(t) {
          Dataset.addProperties(ds, Dataset.modules[t] || {}, $.extend({}, ds));
        });
        ds._addedProperties = true;
      }

      ds.displayFormat = ds.displayFormat || {};
      ds.metadata = ds.metadata || {};

      if (_.isFunction(ds._convertLegacy)) {
        ds._convertLegacy();
      }

      if (!$.subKeyDefined(ds, 'metadata.availableDisplayTypes')) {
        var adt;
        if (_.include(['blob', 'href', 'form', 'api'], ds.type)) {
          adt = [ds.type];
        } else {
          adt = ['table', 'fatrow', 'page'];
          if (!$.isBlank(ds.displayType) &&
            !_.include(['blist', 'filter', 'grouped'], ds.type)) {
            adt.unshift(ds.displayType);
          }
        }
        ds.metadata.availableDisplayTypes = adt;
      }
      if (!$.subKeyDefined(ds, 'metadata.renderTypeConfig.visible')) {
        ds.metadata = $.extend(true, {
          renderTypeConfig: {
            visible: {}
          }
        }, ds.metadata);
        ds.metadata.renderTypeConfig.visible[ds.displayType] = true;
      }
      if ($.subKeyDefined(ds, 'metadata.renderTypeConfig.active') &&
        !_.any(ds.metadata.renderTypeConfig.active, function(t) {
          return t.id == 'self';
        })) {
        // Something needs to be set to self to properly hook up sidebar, etc.; so pick one at random
        ds.metadata.renderTypeConfig.active[
          _.first(_.keys(ds.metadata.renderTypeConfig.visible))] = {
          id: 'self'
        };
      }

      ds.url = ds._generateUrl();
      ds.fullUrl = ds._generateUrl(true);
      ds.shortUrl = ds._generateShortUrl(true);
      ds.apiUrl = ds._generateApiUrl();
      ds.domainUrl = ds._generateBaseUrl(ds.domainCName);
    },

    _activateRowSet: function(newRS) {
      var ds = this;
      if (newRS == ds._activeRowSet) {
        return;
      }

      if (!$.isBlank(ds._activeRowSet)) {
        ds._activeRowSet.deactivate();
        _.each(['row_change', 'row_count_change', 'metadata_update'], function(evName) {
          ds._activeRowSet.unbind(evName, null, ds);
        });
      }

      ds._activeRowSet = newRS;
      ds._availableRowSets = ds._availableRowSets || {};
      var k = ds._activeRowSet.getKey();
      if (ds._availableRowSets[k] != ds._activeRowSet) {
        ds._availableRowSets[k] = ds._activeRowSet;
      }

      if (!$.isBlank(ds._activeRowSet)) {
        _.each(['row_change', 'row_count_change'], function(evName) {
          ds._activeRowSet.bind(evName, function() {
            ds.trigger(evName, arguments);
          }, ds);
        });
        ds._activeRowSet.bind('metadata_update', function() {
          ds._update.apply(ds, arguments);
        });
        ds._activeRowSet.activate();
      }
    },

    _getChildView: function(uid, callback, isBatch) {
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
          Dataset.lookupFromViewId(uid, handleChild, undefined, isBatch);
        }
      } else {
        callback(this._childViews[uid]);
      }
    },

    _childViewsForType: function(type) {
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

    _update: function(newDS, forceFull, updateColOrder, masterUpdate) {
      var ds = this;

      // Back-update the ID, because we don't want the new temporary one
      newDS.id = ds.id;

      // Don't care about unsaved, want to keep default
      newDS.flags = _.without(newDS.flags || [], 'unsaved');
      if (_.include(ds.flags || [], 'default') &&
        !_.include(newDS.flags || [], 'default')) {
        newDS.flags = newDS.flags || [];
        newDS.flags.push('default');

        if (_.include(ds.flags || [], 'restorable')) {
          newDS.flags.push('restorable');
        }
      }

      // Don't decide this view is unsaved because of the shared flag
      if (_.include(ds.flags || [], 'shared')) {
        newDS.flags = newDS.flags || [];
        newDS.flags.push('shared');
      }

      var oldQuery = ds._getQueryGrouping();
      var oldDispFmt = $.extend(true, {}, ds.displayFormat);
      var oldDispType = ds.displayType;
      var oldRTConfig = $.extend(true, {}, ds.metadata.renderTypeConfig);
      var oldCondFmt = ds.metadata.conditionalFormatting;

      if (forceFull) {
        // If we are updating the entire dataset, then clean out all the
        // valid keys; then the next lines will copy all the new ones over
        _.each(ds._validKeys, function(v, k) {
          if (k != 'columns') {
            delete ds[k];
          }
        });
      }

      _.each(newDS, function(v, k) {
        if (k != 'columns' && ds._validKeys[k]) {
          ds[k] = v;
        }
      });

      ds._adjustProperties();

      if (!$.isBlank(newDS.columns)) {
        ds.updateColumns(newDS.columns, forceFull, updateColOrder, masterUpdate);
      }

      ds._syncQueries(oldQuery.oldJsonQuery, oldQuery.oldQuery, oldQuery.oldGroupings, oldQuery.oldGroupAggs);

      var needsDTChange;
      if (!_.isEqual(oldRTConfig.visible, ds.metadata.renderTypeConfig.visible) || !_.isEqual(oldRTConfig.active, ds.metadata.renderTypeConfig.active)) {
        // If we have a visible type that's not available, add it
        _.each(ds.metadata.renderTypeConfig.visible, function(v, type) {
          if (v && !_.include(ds.metadata.availableDisplayTypes, type)) {
            ds.metadata.availableDisplayTypes.unshift(type);
          }
        });
        // Can't hide everything
        if (_.isEmpty(ds.metadata.renderTypeConfig.visible)) {
          ds.metadata.renderTypeConfig.visible[ds.displayType] = true;
        }
        // displayType should always be the most important visible availableDisplayType
        ds.displayType = _.detect(ds.metadata.availableDisplayTypes,
          function(adt) {
            return ds.metadata.renderTypeConfig.visible[adt];
          });
        needsDTChange = true;
      } else if (oldDispType != ds.displayType) {
        // displayType changed without rtConfig.visible being updated
        // If we're given a displayType not in our list, then add it
        if (!$.isBlank(ds.displayType) &&
          !_.include(ds.metadata.availableDisplayTypes, ds.displayType)) {
          ds.metadata.availableDisplayTypes.unshift(ds.displayType);
        }
        // Make only this type visible
        ds.metadata.renderTypeConfig.visible = {};
        ds.metadata.renderTypeConfig.visible[ds.displayType] = true;
        needsDTChange = true;
      }

      var needQueryChange = !_.isEqual(oldRTConfig.visible,
          ds.metadata.renderTypeConfig.visible) &&
        _.any(ds.query.namedFilters || [], function(nf) {
          return _.any(nf.displayTypes || [], function(nd) {
            return oldRTConfig.visible[nd] ||
              ds.metadata.renderTypeConfig.visible[nd];
          });
        });

      var cleanFC = ds.cleanJsonFilters();
      var jsonQ = $.extend({}, ds.metadata.jsonQuery, {
        where: cleanFC.where,
        having: cleanFC.having,
        namedFilters: null
      });
      var newKey = RowSet.getQueryKey(jsonQ);
      if (needQueryChange ||
        ($.subKeyDefined(ds, '_activeRowSet._key') && ds._activeRowSet._key != newKey)) {
        ds.aggregatesChanged();
        var filterChanged = needQueryChange || ds._activeRowSet._key != newKey;
        if (filterChanged) {
          if (!$.isBlank(ds._availableRowSets[newKey])) {
            ds._activateRowSet(ds._availableRowSets[newKey]);
          } else {
            // Find existing set to derive from
            var parRS = _.detect(_.sortBy(ds._availableRowSets,
                function(rs) {
                  return -(rs._isComplete ? 1000000 : 1) * rs._key.length;
                }),
              function(rs) {
                return rs.canDerive(jsonQ);
              });
            ds._activateRowSet(new RowSet(ds, jsonQ, {
                orderBys: (ds.query || {}).orderBys,
                filterCondition: ds.cleanFilters(),
                groupBys: (ds.query || {}).groupBys,
                groupFuncs: ds._getGroupedFunctions()
              },
              parRS));
          }
        } else {
          // Clear out the rows, since the data is different now
          ds._invalidateAll(filterChanged);
        }
        ds.trigger('query_change');
      } else if (!_.isEqual(oldCondFmt, ds.metadata.conditionalFormatting)) {
        // If we aren't invalidating all the rows, but conditional formatting
        // changed, then redo all the colors and re-render. We may not
        // have a row set if we're in the _init path.
        if (!$.isBlank(ds._availableRowSets) && !$.isBlank(ds._activeRowSet)) {
          _.each(ds._availableRowSets, function(rs) {
            rs.formattingChanged();
          });
          ds.trigger('row_change', [_.values(ds._activeRowSet._rows)]);
        }

        ds.trigger('conditionalformatting_change');
      }

      if (needsDTChange) {
        ds.trigger('displaytype_change');
      }

      if (!_.isEqual(oldDispFmt, ds.displayFormat)) {
        ds.trigger('displayformat_change');
      }

      if (masterUpdate) {
        ds._clearTemporary();
        ds._origObj = ds.cleanCopy();
      } else if (_.isEqual(ds._origObj, ds.cleanCopy())) {
        ds._clearTemporary();
      }

      var oldValid = ds.valid;
      ds.valid = ds._checkValidity();
      if (!oldValid && ds.valid) {
        ds.trigger('valid');
      }
    },

    _syncQueries: function(oldJsonQuery, oldQuery, oldGroupings, oldGroupAggs) {
      var ds = this;

      // the core server will do this anyway.
      ds.query = ds.query || {};
      ds.metadata.jsonQuery = ds.metadata.jsonQuery || {};

      var jsonQueryChanged = !_.isEqual($.deepCompact(oldJsonQuery), $.deepCompact(ds.metadata.jsonQuery));
      var hasOldJsonQuery = !_.isUndefined(oldJsonQuery);
      var hasNewJsonQuery = !_.isEmpty(ds.metadata.jsonQuery);
      var hasNoQuery = _.isEmpty(ds.query);

      // ds.query only gets properties set in this condition:
      if (hasOldJsonQuery && jsonQueryChanged || hasNewJsonQuery && hasNoQuery) {
        ds.query.filterCondition = blist.filter.generateSODA1(
          ds.metadata.jsonQuery.where,
          ds.metadata.jsonQuery.having,
          ds.metadata.defaultFilters
        );

        ds.query.namedFilters = ds.query.namedFilters || {};

        _.each(ds.metadata.jsonQuery.namedFilters, function(nf, id) {
          ds.query.namedFilters[id] = $.extend(blist.filter.generateSODA1(nf.where, nf.having), {
            temporary: nf.temporary,
            displayTypes: nf.displayTypes
          });
        });

        ds.query.orderBys = _.compact(_.map(ds.metadata.jsonQuery.order, function(ob) {
          var c = ds.columnForIdentifier(ob.columnFieldName);
          if ($.isBlank(c)) {
            return null;
          }
          return {
            expression: {
              columnId: c.id,
              type: 'column'
            },
            ascending: ob.ascending
          };
        }));
        ds.query.groupBys = _.compact(_.map(ds.metadata.jsonQuery.group, function(g) {
          var c = ds.columnForIdentifier(g.columnFieldName);
          if ($.isBlank(c)) {
            return null;
          }
          c.format.group_function = blist.datatypes.groupFunctionFromSoda2(g.groupFunction);
          return {
            columnId: c.id,
            type: 'column'
          };
        }));
        ds.searchString = ds.metadata.jsonQuery.search;

        // It's possible select was only set for aggregated columns; so fix it up to have grouped, too
        if (!_.isEmpty(ds.metadata.jsonQuery.group)) {
          ds.metadata.jsonQuery.select = ds.metadata.jsonQuery.select || [];
          // reverse() is mutable.  Clone/slice for a reversed copy.
          _.each(ds.metadata.jsonQuery.group.slice(0).reverse(), function(g) {
            if (!_.any(ds.metadata.jsonQuery.select, function(s) {
                return s.columnFieldName == g.columnFieldName;
              })) {
              ds.metadata.jsonQuery.select.unshift({
                columnFieldName: g.columnFieldName
              });
            }
          });
        }

        _.each(ds.metadata.jsonQuery.select, function(s) {
          var c = ds.columnForIdentifier(s.columnFieldName);
          if (!$.isBlank(c) && !$.isBlank(s.aggregate)) {
            c.format.grouping_aggregate = blist.datatypes.aggregateFromSoda2(s.aggregate);
          }
        });
      } else {
        // update jsonQuery (new version) if query has changed
        if (!_.isUndefined(oldQuery) && !_.isEqual($.deepCompact(oldQuery), $.deepCompact(ds.query)) ||
          _.isEmpty(ds.metadata.jsonQuery) && !_.isEmpty(ds.query)) {
          ds.metadata.jsonQuery.group = Dataset.translateGroupBys(
            ds.query.groupBys, ds, ds._getGroupedFunctions());
          var tfc = Dataset.translateFilterCondition(ds.query.filterCondition, ds);
          ds.metadata.jsonQuery.where = tfc.where;
          ds.metadata.jsonQuery.having = tfc.having;
          var tfcDefaults = $.deepCompact(tfc.defaults);
          if ($.isPresent(tfcDefaults) && !$.isEmptyObject(tfcDefaults)) {
            ds.metadata.defaultFilters = tfc.defaults;
          }
          ds.metadata.jsonQuery.namedFilters = ds.metadata.jsonQuery.namedFilters || {};
          _.each(ds.query.namedFilters, function(nf, id) {
            var tnf = Dataset.translateFilterCondition(nf, ds);
            // One Simple Trick To Remove Undefineds!
            ds.metadata.jsonQuery.namedFilters[id] = $.extend({}, {
              where: tnf.where,
              having: tnf.having,
              temporary: nf.temporary,
              displayTypes: nf.displayTypes
            });
          });
          ds.metadata.jsonQuery.order = _.compact(_.map(ds.query.orderBys, function(ob) {
            var c = ds.columnForIdentifier(ob.expression.columnId);
            if ($.isBlank(c)) {
              return null;
            }
            return {
              columnFieldName: c.fieldName,
              ascending: ob.ascending
            };
          }));
        }
        ds.metadata.jsonQuery.search = ds.searchString;
        if (!_.isEmpty(ds.metadata.jsonQuery.group)) {
          ds.metadata.jsonQuery.select = _.compact(_.map(ds.metadata.jsonQuery.group, function(g) {
            return {
              columnFieldName: g.columnFieldName
            };
          }).concat(_.map(ds.realColumns, function(c) {
            return $.subKeyDefined(c, 'format.grouping_aggregate') ? {
                columnFieldName: c.fieldName,
                aggregate: blist.datatypes.soda2Aggregate(c.format.grouping_aggregate)
              } :
              null;
          })));
        } else {
          delete ds.metadata.jsonQuery.select;
        }
      }

      // Clean out any empty keys in the query
      _.each(['namedFilters', 'filterCondition', 'orderBys', 'groupBys'],
        function(k) {
          if (_.isEmpty(ds.query[k])) {
            delete ds.query[k];
          }
        });
      // Clean out any empty keys in the new query
      _.each(['namedFilters', 'group', 'where', 'having', 'search', 'order', 'select'],
        function(k) {
          if (_.isEmpty(ds.metadata.jsonQuery[k])) {
            delete ds.metadata.jsonQuery[k];
          }
        });

      ds._updateGroupings(oldGroupings, oldGroupAggs);

      // Update sorts on each column
      _.each(ds.realColumns || [], function(c) {
        delete c.sortAscending;
      });
      _.each(ds.metadata.jsonQuery.order || [], function(ob) {
        var c = ds.columnForIdentifier(ob.columnFieldName);
        if (!$.isBlank(c)) {
          c.sortAscending = ob.ascending;
        }
      });
    },

    _getQueryGrouping: function() {
      var ds = this;
      var q = {};
      q.oldGroupings = (ds.query || {}).groupBys;
      q.oldGroupAggs = {};
      if ((q.oldGroupings || []).length > 0) {
        _.each(ds.realColumns, function(c) {
          if ($.isPresent(c.format.grouping_aggregate)) {
            q.oldGroupAggs[c.id] = c.format.grouping_aggregate;
          }
        });
      }
      q.oldQuery = ds.query || {};
      q.oldJsonQuery = $.extend(true, {}, ds.metadata.jsonQuery);
      return q;
    },

    _updateGroupings: function(oldGroupings, oldGroupAggs) {
      var ds = this;
      // Do we care if there was a grouping but now there isn't?
      // Yes
      if ($.isBlank((ds.query || {}).groupBys) &&
        $.isBlank(oldGroupings)) {
        return;
      }

      // Save off original column order to restore later
      var isNewOrder = $.isBlank(oldGroupings);
      if (isNewOrder) {
        ds._origColOrder = _.pluck(ds.visibleColumns, 'id');
      }

      var colsChanged = false;
      var curGrouped = {};
      _.each(ds.realColumns, function(c) {
        if (c.format.drill_down) {
          curGrouped[c.id] = true;
        }
        delete c.format.drill_down;
      });

      var newColOrder = [];
      _.each(ds.query.groupBys || [], function(g) {
        var col = ds.columnForID(g.columnId);
        if ($.isBlank(col)) {
          return;
        }

        if ($.isBlank(col.format.grouping_aggregate)) {
          if (!curGrouped[col.id]) {
            col.width += 30;
            colsChanged = true;
          }
          col.format.drill_down = 'true';
        }

        if (col.hidden && !_.any(oldGroupings || [], function(og) {
            return og.columnId == col.id;
          })) {
          col.update({
            flags: _.without(col.flags, 'hidden')
          });
          colsChanged = true;
        }

        newColOrder.push(col.id);
      });

      var newGroupAggs = {};
      var columnsWithGroupAggregate = _.filter(ds.realColumns, function(c) {
        return !$.isBlank(c.format.grouping_aggregate);
      });

      _.each(columnsWithGroupAggregate, function(c) {
        if (c.hidden && !$.isBlank(oldGroupAggs) && !oldGroupAggs[c.id]) {
          c.update({
            flags: _.without(c.flags, 'hidden')
          });
        }

        newGroupAggs[c.id] = c.format.grouping_aggregate;
        newColOrder.push(c.id);
      });

      if ($.isBlank(oldGroupAggs)) {
        oldGroupAggs = newGroupAggs;
      }

      if (_.isEmpty(ds.query.groupBys)) {
        if (!$.isBlank(ds._origColOrder)) {
          ds.setVisibleColumns(ds._origColOrder, null, true);
        }
      } else {
        _.each(ds.realColumns, function(c) {
          var i = _.indexOf(newColOrder, c.id);
          if (i < 0 && !c.hidden) {
            var f = c.flags || [];
            f.push('hidden');
            c.update({
              flags: f
            });
            colsChanged = true;
          }
          if (isNewOrder) {
            if (i < 0) {
              i = c.position + newColOrder.length;
            }
            c.position = i + 1;
          }
        });

        ds.updateColumns();
      }

      if (
        colsChanged ||
        // EN-16787 - Use socrata-viz table for NBE-only grid view
        //
        // In order to consistently render the Socrata Viz table in a way that
        // reflects the state of the UI we need to be notified if the
        // aggregation has changed, even if the other column metadata has not.
        //
        // Given this, the easiest way to do so is to fire the 'columns_changed'
        // event even if the only change was the aggregation function, since
        // we already respond to that event and calculate the query that the
        // Socrata Viz table will make from 'first principles' based on the
        // Dataset model's internal state in any case (in effect, we
        // 'invalidateAll' every time any type of change is made to the Dataset
        // model at all, so this approach seems consistent with the use of
        // 'invalidateAll' on the Dataset model when the grouping aggregations
        // change that happens inside the !_.isEqual() check below).
        (
          blist.feature_flags.enable_nbe_only_grid_view_optimizations &&
          !_.isEqual(oldGroupAggs, newGroupAggs)
        )
      ) {
        ds.trigger('columns_changed');
      }

      if (!_.isEqual(oldGroupAggs, newGroupAggs)) {
        ds._invalidateAll(false, true);
      }
    },

    _getGroupedFunctions: function() {
      var gf = {};
      _.each(this.realColumns, function(c) {
        if (!$.isBlank(c.format.group_function)) {
          gf[c.fieldName] = c.format.group_function;
        }
      });
      return gf;
    },

    // TODO IDE says this is an unused method
    _adjustVisibleColumns: function(visColIds) {
      var ds = this;
      if (ds.isGrouped()) {
        // Hide columns not grouped or rolled-up
        visColIds = _.filter(visColIds, function(cId) {
          var c = ds.columnForID(cId);
          return !$.isBlank(c.format.grouping_aggregate) ||
            _.any(ds.query.groupBys, function(g) {
              return g.columnId == c.id;
            });
        });
      }
      return visColIds;
    },

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
      if (this.isAnonymous()) {
        req.anonymous = true;
      }

      this._super(req);
    },

    _updateLinkedColumns: function(keyCol, row, newRow) {
      var ds = this;
      if (keyCol.dataTypeName == 'dataset_link') {
        for (var n = ds.columns.length - 1; n >= 0; n--) {
          var col = ds.columns[n];
          if (!col.isLinked()) continue;
          var uname = col.underscoreName(ds);
          row.data[col.lookup] = newRow[uname];
        }
      }
    },

    _rowData: function(row, savingLookups, parCol) {
      var ds = this;
      var data = {};
      _.each(savingLookups, function(cL) {
        data[cL] = row.data[cL];
      });

      // Hard-coding here is bad; but sometimes we don't get the meta column back :/
      var fieldMeta = (ds.metaColumnForName('meta') || {}).lookup || ds._useSODA2 ? ':meta' : 'meta';

      // Copy over desired metadata columns
      data[fieldMeta] = row.metadata.meta;

      // Invalid values need to be saved into metadata
      _.each(row.invalid, function(isI, cId) {
        if (isI) {
          var c = !$.isBlank(parCol) ? parCol.childColumnForID(cId) :
            ds.columnForID(cId);
          data[fieldMeta] = data[fieldMeta] || {};
          data[fieldMeta].invalidCells = data[fieldMeta].invalidCells || {};
          data[fieldMeta].invalidCells[c.fieldName] = data[cId];
          data[cId] = null;
        }
      });

      // Metadata is a JSON string
      if (!$.isBlank(data[fieldMeta])) {
        data[fieldMeta] = JSON.stringify(data[fieldMeta]);
      }

      if (ds._useSODA2) {
        data[':id'] = row.id;
      }

      return data;
    },

    _addRow: function(newRow, idx) {
      var ds = this;
      _.each(ds._availableRowSets, function(rs) {
        rs.addRow(newRow, rs == ds._activeRowSet ? idx : null);
      });
    },

    _updateRow: function(row, oldID) {
      _.each(this._availableRowSets, function(rs) {
        rs.updateRow(row, oldID);
      });
    },

    _removeRow: function(row) {
      _.each(this._availableRowSets, function(rs) {
        rs.removeRow(row);
      });
    },

    _invalidateAll: function() {
      var ds = this;
      delete ds._availableRowSets;
      var cleanFC = ds.cleanJsonFilters();
      ds._activateRowSet(new RowSet(ds, $.extend({}, ds.metadata.jsonQuery, {
        where: cleanFC.where,
        having: cleanFC.having,
        namedFilters: null
      }), {
        orderBys: (ds.query || {}).orderBys,
        filterCondition: ds.cleanFilters(),
        groupBys: (ds.query || {}).groupBys,
        groupFuncs: ds._getGroupedFunctions()
      }));
    },

    // Capture custom SODA 2 header values in the dataset model.
    _captureSodaServerHeaders: function(xhr) {
      if (xhr && _.isFunction(xhr.getResponseHeader)) {
        var dataOutOfDate = xhr.getResponseHeader('X-SODA2-Data-Out-Of-Date');
        var truthLastModified = xhr.getResponseHeader('X-SODA2-Truth-Last-Modified');
        var secondaryLastModified = xhr.getResponseHeader('X-SODA2-Secondary-Last-Modified') || xhr.getResponseHeader('Last-Modified');
        if (this.newBackend) {
          if (dataOutOfDate === 'true' && truthLastModified && secondaryLastModified) {
            this._dataOutOfDate = dataOutOfDate;
            this._truthLastModified = truthLastModified;
            this._secondaryLastModified = secondaryLastModified;
            this.trigger('dataset_last_modified', [{
              age: moment(this._secondaryLastModified).
              from(this._truthLastModified, true) // True elides suffix
            }]);
          } else if (dataOutOfDate === 'false' && truthLastModified && secondaryLastModified) {
            this._secondaryLastModified = secondaryLastModified;
            this.trigger('dataset_last_modified', [{
              lastModified: moment(this._secondaryLastModified).
              format(blist.configuration.shortDateFormat)
            }]);
          }
        }
      }
    },

    _serverCreateRow: function(req, isBatch) {
      var ds = this;
      var rowCreated = function(rr) {
        var oldID = req.row.id;
        if (!ds._useSODA2) {
          // Add metadata to new row
          // FIXME: The server response for this should be changing; we can
          // run into problems if there is a user column named something like
          // '_id'
          _.each(rr, function(v, k) {
            if (k.startsWith('_')) {
              var adjName = k.slice(1);
              var c = !$.isBlank(req.parentColumn) ?
                req.parentColumn.childColumnForID(adjName) :
                ds.columnForID(adjName);
              var l = $.isBlank(c) ? adjName : c.lookup;
              req.row.data[l] = v;
              req.row.metadata[l] = v;
            }
          });
          req.row.id = req.row.metadata.id;
        } else {
          // Pretty sure this code path never gets called.
          // Response keys = [:updated_meta, :id, :updated_at, :created_meta, :position, :created_at]
          req.row.id = req.row.metadata.id = req.row.data[':id'] = rr[':id'];
        }

        if (req.row.underlying) {
          req.row.noMatch = true;
          req.row.underlying = null;
        }

        var oldKey = oldID;
        var newKey = req.row.id;
        if (!$.isBlank(req.parentRow)) {
          oldKey += ':' + req.parentRow.id + ':' + req.parentColumn.id;
          newKey += ':' + req.parentRow.id + ':' + req.parentColumn.id;
        }
        ds._pendingRowEdits[newKey] = ds._pendingRowEdits[oldKey];
        delete ds._pendingRowEdits[oldKey];
        ds._pendingRowDeletes[newKey] = ds._pendingRowDeletes[oldKey];
        delete ds._pendingRowDeletes[oldKey];

        if (ds._useSODA2) {
          _.each(ds._pendingRowEdits[newKey], function(pre) {
            pre.rowData[':id'] = req.row.id;
          });
          _.each(ds._pendingRowDeletes[newKey], function(pre) {
            pre.rowId = req.row.id;
          });
        }

        // We can have old IDs embedded in child row keys; so messy cleanup...
        if ($.isBlank(req.parentRow)) {
          var updateKeys = function(pendingItems) {
            _.each(_.keys(pendingItems), function(k) {
              var nk = k.replace(':' + oldKey + ':', ':' + newKey + ':');
              if (nk != k) {
                pendingItems[nk] = pendingItems[k];
                delete pendingItems[k];
              }
            });
          };
          updateKeys(ds._pendingRowEdits);
          updateKeys(ds._pendingRowDeletes);
        }

        _.each(!$.isBlank(req.parentColumn) ?
          req.parentColumn.realChildColumns : ds.realColumns,
          function(c) {
            delete req.row.changed[c.lookup];
          });

        if ($.isBlank(req.parentRow)) {
          ds._updateRow(req.row, oldID);
        } else {
          ds._updateRow(req.parentRow);
        }
        ds.trigger('row_change', [
          [{
            id: oldID
          }, req.parentRow || req.row]
        ]);
        ds._processPending(req.row.id, (req.parentRow || {}).id,
          (req.parentColumn || {}).id);

        ds.aggregatesChanged();
        if (_.isFunction(req.success)) {
          req.success(req.row);
        }
      };

      var rowErrored = function() {
        _.each(!$.isBlank(req.parentColumn) ?
          req.parentColumn.realChildColumns : ds.realColumns,
          function(c) {
            req.row.error[c.lookup] = true;
          });
        ds._updateRow(req.parentRow || req.row);
        ds.trigger('row_change', [
          [req.parentRow || req.row]
        ]);
        if (_.isFunction(req.error)) {
          req.error();
        }
      };

      // On complete, kick off any pending creates
      var rowCompleted = function() {
        if ((ds._pendingRowCreates || []).length > 0) {
          while (ds._pendingRowCreates.length > 0) {
            ds._serverCreateRow(ds._pendingRowCreates.shift(), true);
          }
          ServerModel.sendBatch();
        } else {
          delete ds._pendingRowCreates;
        }
      };

      var url = ds._useSODA2 ? '/api/id/' + ds.id : '/views/' + ds.id + '/rows';
      if (!$.isBlank(req.parentRow)) {
        url += '/' + req.parentRow.id + '/columns/' + req.parentColumn.id +
          '/subrows';
      }
      url += '.json';
      var rd = req.rowData;
      if (ds._useSODA2) {
        if (blist.feature_flags.send_soql_version) {
          url += '?$$version=2.0';
        }
        rd = $.extend(true, {}, rd);
        delete rd[':id'];
      }
      ds.makeRequest({
        url: url,
        isSODA: ds._useSODA2,
        type: 'POST',
        data: JSON.stringify(rd),
        batch: isBatch,
        success: rowCreated,
        error: rowErrored,
        complete: rowCompleted
      });
    },

    _serverSaveRow: function(r, isBatch) {
      var ds = this;
      // On save, unmark each item, and fire an event
      var rowSaved = function(result) {
        _.each(r.columnsSaving, function(cL) {
          delete r.row.changed[cL];
        });

        _.each(r.columnsSaving, function(cL) {
          var col = !$.isBlank(r.parentColumn) ?
            r.parentColumn.childColumnForIdentifier(cL) :
            ds.columnForIdentifier(cL);
          ds._updateLinkedColumns(col, r.row, result);
        });

        if (!result._underlying) {
          r.row.noMatch = null;
        }

        // This is the code path when creating a new row in NBE, so
        // we tell the RowSet, here, to update the row with the new id now
        // because this is the point at which we receive it.
        //
        // This is a NOOP in OBE land.
        var oldRowId = undefined;
        if (ds._useSODA2 && result[':id']) {
          oldRowId = r.row.id;
          r.row.id = result[':id'];
        }
        ds._updateRow(r.parentRow || r.row, oldRowId);
        ds.trigger('row_change', [
          [r.parentRow || r.row]
        ]);
        ds.aggregatesChanged();
        if (_.isFunction(r.success)) {
          r.success(r.row);
        }
      };

      // On error, mark as such and notify
      var rowErrored = function() {
        _.each(r.columnsSaving, function(cL) {
          r.row.error[cL] = true;
        });
        ds._updateRow(r.parentRow || r.row);
        ds.trigger('row_change', [
          [r.parentRow || r.row]
        ]);
        if (_.isFunction(r.error)) {
          r.error();
        }
      };

      // On complete, kick off any pending saves/deletes
      var rowCompleted = function() {
        ds._processPending(r.row.id, (r.parentRow || {}).id,
          (r.parentColumn || {}).id);
      };


      var url = ds._useSODA2 ? '/api/id/' + ds.id : '/views/' + ds.id + '/rows';
      if (!$.isBlank(r.parentRow)) {
        url += '/' + r.parentRow.id + '/columns/' + r.parentColumn.id + '/subrows';
      }
      url += (ds._useSODA2 ? '' : '/' + r.row.metadata.uuid) + '.json';
      ds.makeRequest({
        url: url,
        type: ds._useSODA2 ? 'POST' : 'PUT',
        data: JSON.stringify(r.rowData),
        isSODA: ds._useSODA2,
        batch: isBatch,
        success: rowSaved,
        error: rowErrored,
        complete: rowCompleted
      });

      ds._aggregatesStale = true;
      _.each(r.columnsSaving, function(cL) {
        (!$.isBlank(r.parentColumn) ? r.parentColumn.childColumnForIdentifier(cL) :
          ds.columnForIdentifier(cL)).invalidateData();
      });
    },

    _serverRemoveRow: function(rowId, parRowId, parColId, isBatch) {
      var ds = this;
      var rowRemoved = function() {
        ds.aggregatesChanged();
      };

      var url = ds._useSODA2 ? '/api/id/' + ds.id : '/views/' + ds.id + '/rows/';
      if (!$.isBlank(parRowId)) {
        url += parRowId + '/columns/' + parColId + '/subrows/';
      }
      if (!ds._useSODA2) {
        url += rowId + '.json';
      }

      var rowData = {
        ':deleted': true
      };
      var idColName = ':id';
      if (ds.rowsNeedPK) {
        idColName = ds.rowIdentifierColumn.lookup;
      }
      rowData[idColName] = rowId;

      // Because reasons!
      if (ds.newBackend) {
        rowData = [rowData];
      }

      ds.makeRequest({
        batch: isBatch,
        url: url,
        type: ds._useSODA2 ? 'POST' : 'DELETE',
        isSODA: ds._useSODA2,
        data: JSON.stringify(rowData),
        success: rowRemoved
      });
    },

    _processPending: function(rowId, parRowId, parColId) {
      var ds = this;
      var key = rowId;
      if (!$.isBlank(parRowId)) {
        key += ':' + parRowId + ':' + parColId;
      }

      // Are there any pending edits to this row?
      // If so, save the next one
      if (ds._pendingRowEdits[key] &&
        ds._pendingRowEdits[key].length > 0) {
        while (ds._pendingRowEdits[key].length > 0) {
          // Do save
          ds._serverSaveRow(ds._pendingRowEdits[key].shift(), true);
        }
        ServerModel.sendBatch();
      } else {
        delete ds._pendingRowEdits[key];
        if (ds._pendingRowDeletes[key]) {
          var pd = ds._pendingRowDeletes[key];
          ds._serverRemoveRow(pd.rowId, pd.parRowId, pd.parColId);
          delete ds._pendingRowDeletes[key];
        }
      }
    },

    _generateUrl: function(includeDomain) {
      var ds = this;
      var base = '';

      // federated dataset has nonblank domain cname
      if (includeDomain || !$.isBlank(ds.domainCName)) {
        base = ds._generateBaseUrl(ds.domainCName);
      }

      var urlParts;
      if (ds.displayType === 'story') {
        urlParts = ['stories/s', ds.id];
      } else if (_.isUndefined(ds.name)) {
        urlParts = ['d', ds.id];
      } else {
        urlParts = [$.urlSafe(ds.category || 'dataset'), $.urlSafe(ds.name), ds.id];
      }

      return base + $.path('/' + urlParts.join('/'));
    },

    _generateShortUrl: function(includeDomain) {
      var ds = this;
      var base = '';

      // federated dataset has nonblank domain cname
      if (includeDomain || !$.isBlank(ds.domainCName)) {
        base = ds._generateBaseUrl(ds.domainCName, true);
      }

      if (ds.displayType === 'story') {
        return base + $.path('/stories/s/' + ds.id);
      } else {
        return base + $.path('/d/' + ds.id);
      }
    },

    _generateApiUrl: function() {
      return this._generateBaseUrl() + '/api/views/' + this.id;
    },

    _viewRemoved: function(view) {
      var ds = this;
      if (!$.isBlank(ds._relatedViews)) {
        ds._relatedViews = _.without(ds._relatedViews, view);
      }
      if (!$.isBlank(ds._relViewCount)) {
        ds._relViewCount--;
      }
      if (!$.isBlank(ds._parent) && ds._parent.id == view.id) {
        delete ds._parent;
      }
    },

    _loadRelatedViews: function(callback) {
      callback = callback || _.noop;

      var ds = this;

      // add data lenses to the pane using a second getByTableId call
      var coreViewsPromise = this._loadRelatedCoreViews();
      var dataLensPromise = this._getRelatedDataLenses();

      $.whenever(coreViewsPromise, dataLensPromise).done(function(coreResult, dataLensResult) {
        var coreViews = coreResult ? coreResult[0] : [];
        var dataLensViews = dataLensResult ? dataLensResult : [];

        ds._relatedViews = ds._processRelatedViews(
          _.uniq([].concat(coreViews, dataLensViews), 'id')
        );

        callback();
      });
    },

    _processRelatedViews: function(views) {
      var ds = this;
      views = _.map(views, function(v) {
        if (v.id == ds.id) {
          v = ds;
        }
        if (v instanceof Dataset) {
          return v;
        }

        var nv = new Dataset(v);
        nv.bind('removed', function() {
          ds._viewRemoved(this);
        });
        if (!$.isBlank(ds.accessType)) {
          nv.setAccessType(ds.accessType);
        }
        return nv;
      });

      var parDS = _.detect(views, function(v) {
        return _.include(v.flags || [], 'default');
      });
      if (!$.isBlank(parDS)) {
        ds._parent = parDS;
        views = _.without(views, parDS);
      }

      return views;
    },

    _loadRelatedCoreViews: function() {
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

    _getRelatedDataLenses: function() {
      var ds = this;

      return this.
      getNewBackendId().
      pipe(_.bind(ds._fetchViewJson, ds)).
      pipe(function(result) {
        return ds._lookUpDataLensesByTableId(result.tableId);
      }).
      pipe(_.bind(ds._onlyDataLenses, ds));
    },

    _fetchViewJson: function(nbeId) {
      return this.makeRequestWithPromise({
        url: '/views/{0}.json'.format(nbeId),
        pageCache: true,
        type: 'GET'
      });
    },

    _lookUpDataLensesByTableId: function(nbeTableId) {
      if ($.isBlank(nbeTableId)) {
        throw new Error('nbeTableId is blank');
      }

      return this.makeRequestWithPromise({
        url: '/views.json',
        pageCache: true,
        type: 'GET',
        data: {
          method: 'getByTableId',
          tableId: nbeTableId
        }
      });
    },

    _onlyDataLenses: function(views) {
      var dataLens = _.filter(views, function(view) {
        return view.displayType === 'data_lens' || view.displayType === 'visualization';
      });

      return $.when(dataLens);
    },

    _loadPublicationViews: function(callback) {
      var ds = this;
      var processDS = function(views) {
        views = _.map(views, function(v) {
          if (v instanceof Dataset) {
            return v;
          }

          var nv = new Dataset(v);
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

    _updateSnapshot: function(method, name, callback) {
      var ds = this;
      ds.makeRequest({
        success: function(response) {
          ds._updateThumbnailCallback(response, callback);
        },
        error: callback,
        type: 'POST',
        url: '/views/' + ds.id + '/snapshots?method=' + method + '&name=' +
          ds._getThumbNameOrDefault(name)
      });
    },

    _updateThumbnailCallback: function(response, callback) {
      if ((response.metadata || {}).thumbnail) {
        this.metadata.thumbnail = response.metadata.thumbnail;
      }
      callback(response);
    },

    _cleanUnsaveable: function(md) {
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
    }

  });

  Dataset.modules = {};

  var cachedLinkedDatasetOptions = {};

  Dataset.getLinkedDatasetOptions = function(linkedDatasetUid, col, $field, curVal,
    useRdfKeyAsDefault) {
    var viewUid = linkedDatasetUid;
    if ($.isBlank(viewUid) || !viewUid.match(blist.util.patterns.UID)) {
      return [];
    }

    if (cachedLinkedDatasetOptions[viewUid] == null) {
      $.Tache.Get({ //eslint-disable-line new-cap
        url: '/api/views/' + viewUid + '.json',
        error: function(req) {
          alert(JSON.parse(req.responseText).message);
        },
        success: function(linkedDataset) {
          var lds = new Dataset(linkedDataset);
          cachedLinkedDatasetOptions[viewUid] = [];
          var cldo = cachedLinkedDatasetOptions[viewUid];

          var opt;
          var rdfSubject = linkedDataset && linkedDataset.metadata &&
            linkedDataset.metadata.rdfSubject ?
            linkedDataset.metadata.rdfSubject : undefined;

          _.each(lds.columns || [], function(c) {
            if (c.canBeDatasetLink()) {
              opt = {
                value: String(c.fieldName),
                text: c.name
              };
              if (useRdfKeyAsDefault && opt.value === rdfSubject) {
                opt.selected = true;
              }
              cldo.push(opt);
            }
          });

          if (cachedLinkedDatasetOptions[viewUid].length <= 0) {
            alert($.t('controls.grid.no_columns', {
              uid: viewUid
            }));
          } else {
            $field.data('linkedFieldValues', '_reset');
            _.each($field.data('linkedGroup'), function(f) {
              $(f).trigger('change');
            });
            _.defer(function() {
              $field.val(curVal);
            });
          }
        }
      });
      return [];
    }

    return cachedLinkedDatasetOptions[viewUid];
  };

  Dataset.getLinkedDatasetOptionsDefault = function(linkedDatasetUid, col, $field,
    curVal) {
    return Dataset.getLinkedDatasetOptions(linkedDatasetUid, col, $field, curVal,
      true);
  };

  Dataset.getLinkedDatasetOptionsNoDefault = function(linkedDatasetUid, col, $field,
    curVal) {
    return Dataset.getLinkedDatasetOptions(linkedDatasetUid, col, $field, curVal,
      false);
  };

  Dataset.createFromMapLayerUrl = function(url, successCallback, errorCallback) {
    $.ajax({
      url: '/api/layers.json?method=createMapLayerDataset&url=' + escape(url),
      type: 'POST',
      contentType: 'application/json',
      dataType: 'json',
      success: function(view) {
        if (_.isFunction(successCallback)) {
          successCallback(new Dataset(view));
        }
      },
      error: errorCallback
    });
  };

  Dataset.lookupFromResourceName = function(resourceName, successCallback, errorCallback, isBatch, isAnonymous) {
    Dataset._create(false, resourceName, successCallback, errorCallback, isBatch, isAnonymous, true);
  };

  Dataset.createFromResourceName = function(resourceName, successCallback, errorCallback, isBatch, isAnonymous) {
    Dataset._create(true, resourceName, successCallback, errorCallback, isBatch, isAnonymous, true);
  };

  Dataset.lookupFromViewId = function(id, successCallback, errorCallback, isBatch, isAnonymous) {
    Dataset._create(false, id, successCallback, errorCallback, isBatch, isAnonymous);
  };

  Dataset.createFromViewId = function(id, successCallback, errorCallback, isBatch, isAnonymous) {
    Dataset._create(true, id, successCallback, errorCallback, isBatch, isAnonymous);
  };

  // method for grabbing the most recently opened datasets by this user on this
  // computer, including anonymous access. in 99% of cases, this should be the
  // correct behaviour. in 1%, it will probably confuse the user and cause some
  // support burden. can't win it all.
  Dataset.getRecentDatasets = function(fetchResources, successCallback, errorCallback) {
    if (typeof localStorage === 'undefined') {
      successCallback([]);
    }

    // get all recent datasets, and anonymous access sets.
    var allRecents = _getRecentsFromStorage();
    var ourRecents = allRecents['anon-mous'] || [];

    // merge in logged-in user's sets if they are logged in.
    if (!$.isBlank(blist.currentUserId)) {
      ourRecents = ourRecents.concat(allRecents[blist.currentUserId] || []);
    }

    // massage recents, grab ids.
    var ids = _.pluck(_cleanedMostRecent(ourRecents), 'id');

    // get the actual datasets if requested, otherwise just return.
    if (fetchResources === true) {
      var results = [];
      ServerModel.startBatch();
      _.each(ids, function(id) {
        Dataset.createFromViewId(
          id,
          function(ds) {
            results[ids.indexOf(id)] = ds;
          },
          null, // it's okay if we fail; probably an auth issue.
          true
        );
      });

      ServerModel.sendBatch(function() {
        successCallback(_.compact(results));
      }, errorCallback);
    } else {
      successCallback(ids);
    }
  };

  // method for saving the above.
  Dataset.saveRecentDataset = function(ds) {
    if (typeof localStorage === 'undefined') {
      return;
    }

    // grab the bucket we're qualified under.
    var allRecents = _getRecentsFromStorage();
    var userId = blist.currentUserId || 'anon-mous';
    var ourBucket = allRecents[userId] || [];

    // insert ourselves; do some house cleaning.
    ourBucket.push({
      id: ds.id,
      at: (new Date()).getTime()
    });
    ourBucket = _cleanedMostRecent(ourBucket);

    // saveback.
    allRecents[userId] = ourBucket;
    localStorage.setItem('socrataRecentDS', JSON.stringify(allRecents));
  };

  // util method for fetching the recents obj from localstorage.
  var _getRecentsFromStorage = function() {
    return JSON.parse(localStorage.getItem('socrataRecentDS') || '{}');
  };

  // util method for getting the top relevant most recent ds from an array.
  var _cleanedMostRecent = function(mostRecents) {
    // sort, dedupe, prune, pluck ids.
    // we sort THEN dedupe so that we keep the most recent time always.
    var sorted = _.sortBy(mostRecents, function(x) {
      return x.at * -1;
    });
    var unique = _.uniq(sorted, true, function(x) {
      return x.id;
    });
    return unique.slice(0, 10); // pruned
  };

  Dataset._create = function(clone, id, successCallback, errorCallback, isBatch, isAnonymous, isResourceName) {
    var cachedView = clone ? blist.viewCache[id] : (blist.sharedDatasetCache[id] || blist.viewCache[id]);
    isAnonymous = !!isAnonymous;

    if (!_.isUndefined(cachedView)) {
      if ((cachedView === false) && _.isFunction(errorCallback)) {
        errorCallback({
          responseText: JSON.stringify({
            code: 'permission_denied',
            message: $.t('controls.grid.permission_denied')
          })
        });
      } else if ((cachedView !== false) && _.isFunction(successCallback)) {
        var ds;
        if (cachedView instanceof Dataset) {
          if (clone || cachedView.isAnonymous() != isAnonymous) {
            ds = cachedView.clone();
          } else {
            ds = cachedView;
          }
        } else {
          ds = new Dataset(cachedView);
        }
        if (isAnonymous) {
          ds.isAnonymous(isAnonymous);
        }
        successCallback(ds);
      }
    } else {
      $.socrataServer.makeRequest({
        url: isResourceName ? '/api/views.json' : '/api/views/' + id + '.json',
        headers: {
          'X-Socrata-Federation': 'Honey Badger'
        },
        params: isResourceName ? {
          method: 'getByResourceName',
          name: id
        } : {},
        success: function(view) {
          var dsToReturn = null;
          if (_.isUndefined(blist.viewCache[view.id])) {
            blist.viewCache[view.id] = view;
          }

          if (_.isUndefined(blist.sharedDatasetCache[view.id])) {
            blist.sharedDatasetCache[view.id] = new Dataset(view);
          }

          if (!$.isBlank(view.resourceName) && _.isUndefined(blist.viewCache[view.resourceName])) {
            blist.viewCache[view.resourceName] = blist.viewCache[view.id];
          }

          if (!$.isBlank(view.resourceName) && _.isUndefined(blist.sharedDatasetCache[view.resourceName])) {
            blist.sharedDatasetCache[view.resourceName] = blist.sharedDatasetCache[view.id];
          }

          if (_.isFunction(successCallback)) {
            if (clone || blist.sharedDatasetCache[view.id].isAnonymous() != isAnonymous) {
              dsToReturn = new Dataset(view);
            } else {
              dsToReturn = blist.sharedDatasetCache[view.id];
            }
            if (isAnonymous) {
              dsToReturn.isAnonymous(isAnonymous);
            }

            successCallback(dsToReturn);
          }
        },
        batch: isBatch,
        anonymous: isAnonymous,
        pageCache: !isBatch,
        error: errorCallback
      });
    }
  };

  Dataset.search = function(params, successCallback, errorCallback, isAnonymous) {
    $.socrataServer.makeRequest({
      pageCache: true,
      url: '/api/search/views.json',
      params: params,
      anonymous: isAnonymous,
      success: function(results) {
        if (_.isFunction(successCallback)) {
          successCallback({
            count: results.count,
            views: _.map(results.results, function(v) {
              var ds = new Dataset(v.view);
              // Put row results in a special safe key
              ds.rowResults = v.rows;
              ds.rowResultCount = v.totalRows;
              if (isAnonymous) {
                ds.isAnonymous(isAnonymous);
              }
              return ds;
            })
          });
        }
      },
      error: errorCallback
    });
  };

  Dataset.translateFilterCondition = function(fc, ds, simplify) {
    if ($.isBlank(simplify)) {
      simplify = true;
    }
    fc = $.extend(true, {}, fc);
    if (ds.isGrouped()) {
      // Ugh, separate out having from where
      // We can only separate at an AND: an OR must stay together
      // We're only going to separate at the top level, b/c it gets complicated below that
      var splitWhere = fc,
        splitDefault,
        splitHaving;
      if (!$.isBlank(fc) && fc.type == 'operator' && _.isArray(fc.children) && fc.children.length > 0) {
        var havingCols = _.compact(_.map(ds.query.groupBys, function(gb) {
          return ds.columnForIdentifier(gb.columnId);
        }).concat(_.filter(ds.realColumns,
          function(c) {
            return $.subKeyDefined(c, 'format.grouping_aggregate');
          })));
        var isHaving = function(cond) {
          if (cond.type == 'column') {
            return _.any(havingCols, function(c) {
              return c.fieldName == cond.columnFieldName || c.id == cond.columnId;
            });
          } else if (!_.isEmpty(cond.children)) {
            return _.all(cond.children, function(cCond) {
              return isHaving(cCond);
            });
          } else {
            // literals
            return true;
          }
        };

        fc = blist.filter.collapseChildren(fc);
        if (fc.value == 'AND') {
          var children = _.groupBy(fc.children, function(cond) {
            // Find trees that only reference post-group columns
            if (_.isEmpty(cond.children)) {
              return 'defaults';
            } else if (isHaving(cond)) {
              return 'having';
            } else {
              return 'where';
            }
          });
          if (!_.isEmpty(children.having)) {
            splitHaving = {
              type: 'operator',
              value: 'AND',
              children: children.having
            };
            fc.children = _.difference(fc.children, children.having);
          }
          if (!_.isEmpty(children.defaults)) {
            splitDefault = {
              type: 'operator',
              value: 'AND',
              children: children.defaults
            };
            fc.children = _.difference(fc.children, children.defaults);
          }
        } else if (isHaving(fc)) {
          splitHaving = fc;
          splitWhere = null;
        }
      }
      return {
        where: translateSubFilter(splitWhere, ds, simplify, false),
        having: translateSubFilter(splitHaving, ds, simplify, true),
        defaults: translateSubFilter(splitDefault, ds, false, false)
      };
    } else {
      var defaults = _.isEmpty(fc) ? null : _.filter(fc, function(cond) {
        return _.isEmpty(cond.children);
      });
      return {
        where: translateSubFilter(fc, ds, simplify, false),
        defaults: translateSubFilter(defaults, ds, false, false)
      };
    }
  };

  function translateSubFilter(fc, ds, simplify, isHaving) {
    // This is a cheat. Maps NBE interface.
    if ($.isPresent(fc) && _.isString(fc.soql)) {
      return fc;
    }

    if ($.isBlank(fc) ||
      simplify && (fc.type != 'operator' || !_.isArray(fc.children) || fc.children.length == 0)) {
      return null;
    }

    var filterQ = {
      operator: fc.value
    };
    if (!$.isBlank(fc.metadata)) {
      filterQ.metadata = fc.metadata;
    }

    if (filterQ.operator == 'AND' || filterQ.operator == 'OR') {
      filterQ.children = _.compact(_.map(fc.children, function(c) {
        var fcc = translateSubFilter(c, ds, simplify, isHaving);
        return fcc;
      }));
      if (simplify) {
        if (filterQ.children.length == 0) {
          return null;
        } else if (filterQ.children.length == 1) {
          var cf = filterQ.children[0];
          cf.metadata = $.extend(filterQ.metadata, cf.metadata);
          filterQ = cf;
        }
      }
    } else {
      var col;
      _.each(fc.children, function(c) {
        if (c.type == 'column') {
          if (!$.isBlank(ds)) {
            col = ds.columnForIdentifier(c.columnFieldName || c.columnId);
          }

          if (!$.isBlank(c.columnFieldName)) {
            filterQ.columnFieldName = c.columnFieldName;
          } else if (!$.isBlank(col)) {
            filterQ.columnFieldName = col.fieldName;
          }
          if (isHaving && $.subKeyDefined(col, 'format.grouping_aggregate') && ds._useSODA2) {
            filterQ.columnFieldName = blist.datatypes.soda2Aggregate(
              col.format.grouping_aggregate) + '_' + filterQ.columnFieldName;
          }

          // Don't put in redundant subcolumns (ie, when no sub-column)
          // Special case for 'url': subcolumn name is also 'url'.
          if (!$.isBlank(c.value) && (c.value == 'url' || c.value != (col || {}).dataTypeName)) {
            filterQ.subColumn = c.value;
          }
        } else if (c.type == 'literal') {
          var v = c.value;
          if ($.isBlank(filterQ.value)) {
            filterQ.value = v;
          } else {
            filterQ.value = $.makeArray(filterQ.value);
            filterQ.value.push(v);
          }
        }
      });
    }

    return filterQ;
  }

  Dataset.translateGroupBys = function(gb, ds, groupFuncs) {
    if (_.isEmpty(gb)) {
      return null;
    }

    return _.sortBy(_.compact(_.map(gb, function(g) {
      var c = ds.columnForIdentifier(g.columnId);
      if ($.isBlank(c)) {
        return null;
      }
      return {
        columnFieldName: c.fieldName,
        groupFunction: blist.datatypes.soda2GroupFunction(($.isBlank(groupFuncs) ?
          c.format.group_function : groupFuncs[c.fieldName]), c)
      };
    })), 'columnFieldName');
  };

  Dataset.aggregateForColumn = function(column, jsonQuery) {
    return (_.detect(jsonQuery.select, function(select) {
      return select.aggregate && select.columnFieldName == column;
    }) || {}).aggregate;
  };

  Dataset.translateColumnToQueryBase = function(c, dataset) {
    var isStr = _.isString(c);
    if (isStr) {
      c = dataset.columnForIdentifier(c);
    }
    if ($.isBlank(c)) {
      return null;
    }
    var qbc = dataset._queryBase.columnForIdentifier(c.fieldName) ||
      dataset._queryBase.columnForIdentifier(c.tableColumnId);
    if ($.isBlank(qbc)) {
      return null;
    }
    return isStr ? qbc.fieldName : qbc;
  };

  Dataset.translateFilterColumnsToBase = function(filter, dataset) {
    var newF = $.extend({}, filter);
    if (!_.isEmpty(newF.children)) {
      newF.children = _.compact(_.map(newF.children, function(fc) {
        return Dataset.translateFilterColumnsToBase(fc, dataset);
      }));
      if (_.isEmpty(newF.children)) {
        return null;
      }
    }
    if (!$.isBlank(newF.columnFieldName)) {
      newF.columnFieldName = Dataset.translateColumnToQueryBase(newF.columnFieldName, dataset);
      if ($.isBlank(newF.columnFieldName)) {
        return null;
      }
    }
    return newF;
  };

  var VIZ_TYPES = ['chart', 'annotatedtimeline', 'imagesparkline',
    'areachart', 'barchart', 'columnchart', 'linechart', 'piechart'
  ];
  var MAP_TYPES = ['map', 'geomap', 'intensitymap'];

  /* The type string is not always the simplest thing -- a lot of munging
   * goes on in Rails; we roughly duplicate it here */
  function getType(ds) {
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

  // Returns a human-friendly Mixpanel 'View Type' (for internal use only!)
  function getMixpanelViewType(ds) {
    var type = ds.type;

    if (type === 'blist') {
      type = ds.isPublished() ? 'dataset' : 'working_copy';
    }

    var humanReadableTypes = {
      api: 'API view',
      blob: 'non-tabular file or document',
      calendar: 'calendar',
      chart: 'chart',
      data_lens: 'data lens',
      dataset: 'dataset',
      filter: 'filtered view',
      form: 'form',
      group: 'grouped view',
      grouped: 'grouped view',
      href: 'external dataset',
      map: 'map',
      table: 'table',
      working_copy: 'working copy'
    };

    return humanReadableTypes[type] || type;
  }

  function getDisplayName(ds) {
    switch (ds.type) {
      case 'blist':
        return ds.isPublished() ? $.t('core.view_types.dataset') : $.t('core.view_types.working_copy');
      default:
        return $.t('core.view_types.' + ds.type);
    }
  }

  /**
   * EN-12888 - Don't Copy Parent Filters Into Child Grouped View
   *
   * Possibly in an attempt to be clever or fix 'performance', the platform will
   * behave differently when creating a grouped view based on a filtered view
   * depending on whether or not the current user has write acces to both the
   * parent and the new child views.
   *
   * When the user has write access to both, instead of relying on the chaining
   * or inheritance behavior of derived views (wherein filters present in a
   * parent view are applied before groupings and filters present in the child
   * view) the frontend will merge the filters from the parent view into the new
   * filters and groupings of the child view and post the resulting composite.
   *
   * This has the effect of creating a derived view that still counts as being
   * derived from the forebearing default view, but that does not have the
   * filters chained/applied according to that lineage but rather all at once
   * when the child view is queried.
   *
   * When the user does not have write access to both, the inheritance/chaining
   * behavior is applied.
   *
   * This becomes problematic because the order in which filters and groupings
   * are applied changes based on which properties are coming from the parent
   * and which from the child:
   *
   * Case 1: parent(grouping), child(filtering) -> [grouping then filtering]
   * Case 2: parent(filtering), child(grouping) -> [filtering then grouping]
   * Case 3: parent(none), child(both)          -> [grouping then filtering]
   * Case 4: parent(both), child(none)          -> [grouping then filtering]
   *
   * Note that cases 1, 3 an 4 are essentially a HAVING clause, whereas the
   * second is a WHERE clause. This function aspires to prevent what should be
   * the second case from being turned into the third case becasue of the
   * merging behavior, which is accomplished by removing the filters from the
   * parent view that get copied into the child view which is eventually POSTed
   * to the backend to create the new child view.
   *
   * See EN-12454 for information on the accompanying fix in Core Server which
   * will interpret the lack of filters in the child view that are present in
   * the parent view as an indication that the modifyingLensId-based inheritance
   * should be used for the view in question as opposed to the derived-but-self-
   * sufficient type of behavior that ordinarily obtains when the user has write
   * access to both the parent and the child views.
   */
  function forceUseOfModifyingLensIdInNewChildViewIfGroupingWasAdded(
    originalDataset,
    newDataset
  ) {
    // We need to compare the filters that were present on the original view
    // object from which the live dataset was constructed against the serialized
    // dataset as it exists at the time the user attempts to save. Somewhere in
    // the long string of mutations the live dataset undergoes after page load,
    // filter value literals (e.g. the '1' if the filter is 'col_a != 1') are
    // cast from strings (as they are sent by Core Server) to numbers (as they
    // get serialized when we send the updated view to Core Server).
    //
    // This method mutates an object tree to cast all filter value literals
    // (defined as the value of the 'value' key of an object that also has a
    // 'type' key, the value of which 'type' key is 'literal') to numbers so
    // that we can use _.isEqual() to compare the filters present in the
    // serialized form of the 'original' dataset against the filters in the
    // serialized form of the 'new' dataset in a reliable way.
    var convertStringifiedNumberLiteralsToNumbers = function(val, key) {

      if (key === 'children' && _.isArray(val)) {
        _.each(val, function(child) {

          if (_.isObject(child)) {
            if (
              child.hasOwnProperty('type') &&
              child.hasOwnProperty('value') &&
              _.get(child, 'type') === 'literal'
            ) {

              if (String(Number(child.value)) === child.value) {
                child.value = Number(child.value);
              }
            }

            _.forIn(child, convertStringifiedNumberLiteralsToNumbers);
          }
        });
      }
    };
    var extractFilterConditionOperators = function(filterCondition) {
      var operators = [];
      var recursivelyExtractActualFilterConditionOperators = function(children) {
        children.forEach(function(child) {

          if (child.hasOwnProperty('children')) {
            var atLeastOneOperatorGrandchild = _.include(
              _.compact(
                _.get(child, 'children', []).map(function(grandchild) {
                  return _.get(grandchild, 'type');
                })
              ),
              'operator'
            );

            if (child.type === 'operator' && !atLeastOneOperatorGrandchild) {
              operators.push(_.cloneDeep(child));
            } else {
              recursivelyExtractActualFilterConditionOperators(
                _.get(child, 'children', [])
              );
            }
          }
        });
      };

      if (
        _.isObject(filterCondition) &&
        _.get(filterCondition, 'type', null) === 'operator'
      ) {
        operators.push(_.cloneDeep(filterCondition));
      }

      if (
        _.isObject(filterCondition) &&
        _.get(filterCondition, 'children', []).length > 0
      ) {
        recursivelyExtractActualFilterConditionOperators(
          _.get(filterCondition, 'children', [])
        );
      }

      return operators;
    };
    var assignNewFiltersForJsonQuery = function(dataset, filters) {
      if (filters.length === 1) {
        _.set(dataset, 'metadata.jsonQuery.where', filters[0]);
      } else if (filters.length > 1) {
        _.set(dataset, 'metadata.jsonQuery.where.children', filters);
      } else {
        _.set(dataset, 'metadata.jsonQuery.where', undefined);
      }
    };
    var originalDatasetGrouping = _.get(
      originalDataset,
      'query.groupBys',
      null
    );
    var newDatasetGrouping = _.get(
      newDataset,
      'query.groupBys',
      null
    );
    var groupingAddedToNewChildView = (
      _.isNull(originalDatasetGrouping) && !_.isNull(newDatasetGrouping)
    );
    // Hey, watch out here, occasionally instead of the filterCondition key not
    // existing, sometimes it does exist but is undefined! Argh!
    var shouldModifyQueryFilterCondition = (
      !_.isUndefined(_.get(originalDataset, 'query.filterCondition')) &&
      !_.isUndefined(_.get(newDataset, 'query.filterCondition'))
    );
    // Hey, watch out here, occasionally instead of the where key not existing,
    // sometimes it does exist but is undefined! Argh!
    var shouldModifyJsonQueryWhere = (
      !_.isUndefined(_.get(originalDataset, 'metadata.jsonQuery.where')) &&
      !_.isUndefined(_.get(newDataset, 'metadata.jsonQuery.where'))
    );

    // Just return the new dataset if no grouping is applied, or if the parent
    // had the same grouping as the child, since we don't need to take any
    // additional action in this case.
    if (!groupingAddedToNewChildView) {
      return newDataset;
    }

    // Otherwise, we need to remove any filters that are present in both the
    // original and the new dataset, which will cause the backend to create a
    // non-default view using modifyingLensId to inherit the parent's filters,
    // as opposed to the frontend copying the parent's filters into the new view
    // and then creating a non-default, but also not-inheriting, view.
    if (shouldModifyQueryFilterCondition) {
      var modifiedOriginalFilterCondition = blist.filter.generateSODA1(
        _.get(originalDataset, 'metadata.jsonQuery.where'),
        _.get(originalDataset, 'metadata.jsonQuery.having'),
        _.get(originalDataset, 'metadata.defaultFilters')
      );
      var newQueryFilterCondition = _.get(newDataset, 'query.filterCondition');

      // Recursively apply convertStringifiedNumberLiteralsToNumbers to all
      // values of modifiedOriginalFilterCondition (_.forIn does not recurse,
      // but convertStringifiedNumberLiteralsToNumbers calls _.forIn recursively
      // as it descends).
      _.forIn(
        modifiedOriginalFilterCondition,
        convertStringifiedNumberLiteralsToNumbers
      );

      var newQueryFilterConditionIsSingleFilterClause =
        _.get(newQueryFilterCondition, 'children', []).
          filter(function(newFilter) {
            return _.get(newFilter, 'type') !== 'operator';
          }).length > 0;

      // If the children of newQueryFilterCondition constitute a single filter
      // condition (e.g. they are a pair of 'column' and 'literal' types as
      // opposed to a pair of 'operator' types each with their own 'column' and
      // 'literal' children) then we just need to check if the single new filter
      // condition matches any of the old ones.
      if (newQueryFilterConditionIsSingleFilterClause) {
        var newFilterExistsInOldFilterCondition = false;
        var filterConditionOperators = extractFilterConditionOperators(
          modifiedOriginalFilterCondition
        );

        filterConditionOperators.forEach(function(oldFilter) {
          if (_.isEqual(oldFilter, newQueryFilterCondition)) {
            newFilterExistsInOldFilterCondition = true;
          }
        });

        if (
          newFilterExistsInOldFilterCondition &&
          newDataset.hasOwnProperty('query') &&
          newDataset.query.hasOwnProperty('filterCondition')
        ) {
          delete newDataset.query.filterCondition;
        }
      // Otherwise, we can actually iterate over newQueryFilterCondition's
      // children and compare them to the existing filters.
      } else {
        var newFiltersForQuery =
          _.get(newQueryFilterCondition, 'children', []).
            filter(function(newFilter) {
              var matchingOldFilter = _.get(
                modifiedOriginalFilterCondition, 'children', []).
                  filter(function(oldFilter) {
                    return _.isEqual(newFilter, oldFilter);
                  });

              return matchingOldFilter.length === 0;
            });

        if (newFiltersForQuery.length > 0) {
          _.set(
            newDataset,
            'query.filterCondition.children',
            newFiltersForQuery
          );
        } else {
          if (
            newDataset.hasOwnProperty('query') &&
            newDataset.query.hasOwnProperty('filterCondition')
          ) {
            delete newDataset.query.filterCondition;
          }
        }
      }
    }

    // We also need to remove any filters that are present in the other place
    // we store filters in a view object (metadata.jsonQuery.where v.s.
    // query.filterCondition, which is checked above) In comparison, however,
    // the representation of the current filters located at
    // metadata.jsonQuery.where does not differ between the original and new
    // copies of the dataset, so we can compare them directly without having to
    // mutate the original dataset.
    //
    // Fun fact: the jsonQuery where object only has a 'children' property if
    // there is more than one filter. Otherwise, it stores the filter parameters
    // at the root of the object.
    if (shouldModifyJsonQueryWhere) {
      var originalJsonQueryWhere = _.get(
        originalDataset,
        'metadata.jsonQuery.where'
      );
      var newJsonQueryWhere = _.get(newDataset, 'metadata.jsonQuery.where');
      var moreThanOneFilterPresent = (
        originalJsonQueryWhere.hasOwnProperty('children') ||
        newJsonQueryWhere.hasOwnProperty('children')
      );

      if (moreThanOneFilterPresent) {
        var newFiltersForJsonQuery;

        // If there is more than one filter on the original jsonQuery where and
        // there is more than one filter on the new jsonQuery where, then we
        // need to only persist filters that are present on the new jsonQuery
        // where but not the old one.
        if (
          originalJsonQueryWhere.hasOwnProperty('children') &&
          newJsonQueryWhere.hasOwnProperty('children')
        ) {
          newFiltersForJsonQuery = _.get(newJsonQueryWhere, 'children', []).
            filter(function(newFilter) {
                var matchingOldFilter =
                  _.get(originalJsonQueryWhere, 'children', []).
                    filter(function(oldFilter) {
                      return _.isEqual(newFilter, oldFilter);
                    });

                return matchingOldFilter.length === 0;
              });

          assignNewFiltersForJsonQuery(newDataset, newFiltersForJsonQuery);
        } else if (originalJsonQueryWhere.hasOwnProperty('children')) {
          // Only save the single filter on newJsonQueryWhere if it does not
          // also exist in originalJsonQueryWhere.
          var singleNewFilterExistsInOriginalJsonQueryWhere = false;

          _.get(originalJsonQueryWhere, 'children', []).
            forEach(function(oldFilter) {
              if (_.isEqual(oldFilter, newJsonQueryWhere)) {
                singleNewFilterExistsInOriginalJsonQueryWhere = true;
              }
            });

          if (singleNewFilterExistsInOriginalJsonQueryWhere) {
            _.set(newDataset, 'metadata.jsonQuery.where', undefined);
          }
        } else if (newJsonQueryWhere.hasOwnProperty('children')) {
          // Save all filters on the new jsonQuery where that are not equal to
          // the original jsonQuery where.
          newFiltersForJsonQuery = _.get(newJsonQueryWhere, 'children', []).
            filter(function(newFilter) {
              return !_.isEqual(originalJsonQueryWhere, newFilter);
            });

          assignNewFiltersForJsonQuery(newDataset, newFiltersForJsonQuery);
        }


      } else {
        // If the filter is not the one that was taken from the saved view, then
        // we can just use that filter verbatim since the modifying-lens-id
        // inheritance wouldn't apply in any case.
        if (!_.isEqual(originalJsonQueryWhere, newJsonQueryWhere)) {
          _.set(newDataset, 'metadata.jsonQuery.where', newJsonQueryWhere);
        } else {
          if (
            newDataset.hasOwnProperty('metadata') &&
            newDataset.metadata.hasOwnProperty('jsonQuery') &&
            newDataset.metadata.jsonQuery.hasOwnProperty('where')
          ) {
            delete newDataset.metadata.jsonQuery.where;
          }
        }
      }
    }

    return newDataset;
  }

  /**
   * EN-12888 - Don't Copy Parent Filters Into Child Grouped View
   *
   * If a grouping has been added to a previously-filtered view and the
   * relevant feature flag is enabled, then we need to display a notice to
   * the user that the grid preview may not reflect the actual computed
   * values, and that they'll need to 'Save As...' in order to see the
   * correct data.
   *
   * This is only the case when the 'old' view has filters but no grouping
   * and is then updated to have grouping as well.
   */
  function maybeShowIncorrectGridPreviewNotice(originalDataset, newDataset) {
    var shouldForceUseOfModifyingLensIdInGroupedChildView = _.get(
      blist,
      'feature_flags.force_use_of_modifying_lens_id_in_grouped_child_view',
      false
    );
    var originalDatasetHasGroupBys = !_.isUndefined(
      _.get(
        originalDataset,
        'query.groupBys'
      )
    );
    var originalDatasetHasFilterCondition = !_.isUndefined(
      _.get(
        originalDataset,
        'query.filterCondition'
      )
    );
    var newDatasetHasGroupBys = !_.isUndefined(
      _.get(
        newDataset,
        'query.groupBys'
      )
    );

    if (
      shouldForceUseOfModifyingLensIdInGroupedChildView &&
      !originalDatasetHasGroupBys &&
      originalDatasetHasFilterCondition &&
      newDatasetHasGroupBys
    ) {

      blist.datasetPage.flashTimedNotice(
        $.t('controls.grid.group_bys_preview_potentially_invalid'),
        20000
      );
    }
  }

  // EN-17053/EN-16787 - Use socrata-viz table for NBE-only grid view
  //
  // Since we want to override view.metadata.availableDisplayTypes and
  // view.metadata.renderTypeConfig at runtime only, we need to stash the
  // original properties of these values somewhere and restore them before we
  // attempt to save the dataset, because Core Server will just overwrite the
  // previous values with whatever happens to be in the view that we send it.
  function restoreOriginalTypeMetadata(view) {
    var originalTypeMetadata = _.get(window, 'blist.originalDatasetTypeMetadata');

    if (originalTypeMetadata) {

      if (originalTypeMetadata.hasOwnProperty('availableDisplayTypes')) {
        _.set(view, 'metadata.availableDisplayTypes', originalTypeMetadata.availableDisplayTypes);
      }

      if (originalTypeMetadata.hasOwnProperty('renderTypeConfig')) {
        _.set(view, 'metadata.renderTypeConfig', originalTypeMetadata.renderTypeConfig);
      }
    }

    return view;
  }

  function cleanViewForSave(ds, allowedKeys) {
    var dsCopy = ds.cleanCopy(allowedKeys);
    if (ds.oldColumns) {
      // If we swapped in NBE columns, swap them out when saving.
      dsCopy.columns = ds.oldColumns;
    }
    dsCopy = ds._cleanUnsaveable(dsCopy);

    // cleanCopy already removes namedFilters, so we just need to get the updated fc here
    if (!$.isBlank(dsCopy.query)) {
      dsCopy.query.filterCondition = ds.cleanFilters(true);
    }
    if ($.subKeyDefined(dsCopy, 'metadata.jsonQuery')) {
      // Clear anything marked temporary.
      var jsonQuery = ds.cleanJsonFilters(true);
      $.extend(dsCopy.metadata.jsonQuery, jsonQuery);
      dsCopy.metadata.jsonQuery.where = jsonQuery.where;
      dsCopy.metadata.jsonQuery.having = jsonQuery.having;
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

    if ($.subKeyDefined(dsCopy, 'metadata.jsonQuery')) {
      // Clear anything marked temporary.
      var jsonQuery = ds.cleanJsonFilters(true);
      $.extend(dsCopy.metadata.jsonQuery, jsonQuery);
      dsCopy.metadata.jsonQuery.where = jsonQuery.where;
      dsCopy.metadata.jsonQuery.having = jsonQuery.having;
    }

    if (dsCopy.displayType == 'assetinventory') {
      delete dsCopy.displayType;
    }

    var shouldForceUseOfModifyingLensIdInGroupedChildView = _.get(
      blist,
      'feature_flags.force_use_of_modifying_lens_id_in_grouped_child_view',
      false
    );

    // See comment above implementation of forceUseOfModifyingLensId... for an
    // explanation of what this does and why we do it (spoiler: this is a
    // consequence of the inconsistent behavior of derived views).
    if (shouldForceUseOfModifyingLensIdInGroupedChildView) {

      forceUseOfModifyingLensIdInNewChildViewIfGroupingWasAdded(
        ds._origObj,
        dsCopy
      );
    }

    return dsCopy;
  }

  Dataset.getNumberOfDaysRestorable = function() {
    return parseInt($.ajax({
      url: '/views.json?method=numberOfDaysRestorable',
      async: false
    }).responseText);
  };

  if (blist.inBrowser) {
    this.Dataset = Dataset;
  } else {
    module.exports = Dataset;
  }
})();
