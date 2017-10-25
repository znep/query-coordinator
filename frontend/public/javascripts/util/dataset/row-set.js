(function() {

  var RowSet = ServerModel.extend({
    _init: function(ds, jsonQuery, query, parRS, initRows) {
      this._super();

      this._dataset = ds;

      this.registerEvent(['row_change', 'row_count_change', 'metadata_update']);

      this._rows = {};
      this._rowIDLookup = {};
      this._rowsLoading = {};
      this._pendingRowReqs = [];

      this._parent = parRS;
      this._query = query || {};
      this._jsonQuery = jsonQuery || {};
      this._loadedCount = 0;
      this._isComplete = false;
      this._matchesExpr = {
        where: blist.filter.matchesExpression(this._jsonQuery.where,
          this._dataset),
        having: blist.filter.matchesExpression(this._jsonQuery.having, this._dataset)
      };

      if (!_.isEmpty(initRows)) {
        this._addRows(initRows.rows, initRows.start);
        if (!$.isBlank(initRows.total)) {
          this._totalCount = initRows.total;
          delete this._potentialBuckets;
        }
      }

      this.formattingChanged();

      var rs = this;
      this._dataset.bind('columns_changed', function(changeType, lookupMap) {
        switch (changeType) {
          case 'lookupChange':
            rs.lookupsChanged(lookupMap);
            break;
          case 'visibility':
            delete rs._rowBuckets; // make nbe request rows to refresh
            break;
        }
      });
    },

    getKey: function() {
      if ($.isBlank(this._key)) {
        this._key = RowSet.getQueryKey(this._jsonQuery);
      }
      return this._key;
    },

    rowForID: function(id) {
      return this._rowIDLookup[parseInt(id) || id];
    },

    rowForIndex: function(index) {
      return this._rows[index];
    },

    rowIndex: function(id, successCallback) {
      var rs = this;
      if (!$.isBlank(rs.rowForID(id))) {
        successCallback(rs.rowForID(id).index);
      } else {
        var gotID = function(data) {
          successCallback(data[id]);
        };

        rs.makeRequest({
          inline: true,
          params: {
            method: 'getByIds',
            indexesOnly: true,
            ids: id
          },
          success: gotID
        });
      }
    },

    childRowForID: function(id, parRow, parCol) {
      // Someday an actual lookup for child rows might be good; but these
      // should be rare and small, so don't bother yet
      var cell = parRow.data[parCol.lookup];
      return _.detect(cell || {}, function(sr) {
        return sr.id === id;
      });
    },

    getTotalRows: function(successCallback, errorCallback) {
      var rs = this;
      if ($.isBlank(rs._totalCount)) {
        rs.getRows(0, 1, successCallback, errorCallback);
      } else if (_.isFunction(successCallback)) {
        successCallback();
      }
    },

    totalRows: function() {
      return this._totalCount;
    },

    potentialBuckets: function() {
      if (_.isUndefined(this._potentialBuckets)) {
        this._potentialBuckets = _.range(0, this._totalCount || 1, this._dataset.bucketSize);
      }
      return this._potentialBuckets;
    },

    // This function guarantees a valid return value. It *should* be impossible to
    // request a numerical index and fail to return a bucket.
    getRowBucket: function(index) {
      var rs = this;
      var bucketSize = rs._dataset.bucketSize;

      if (!rs._dataset.usingBuckets()) {
        return {
          start: 0,
          finish: rs._totalCount
        };
      }

      // If this is the first load, then assume start is 0 because I don't know any better.
      if (!_.isNumber(rs._totalCount)) {
        return {
          start: 0,
          finish: bucketSize
        };
      }

      // Requesting an index before the first row yields the first bucket.
      if (index <= 0) {
        return {
          start: 0,
          finish: bucketSize
        };
      }

      // Memoize all potential buckets.
      // Requesting an index beyond the last row yields the last bucket.
      var bucketStart = _.findLast(rs.potentialBuckets(), function(start) {
        return start <= index;
      });

      return {
        start: bucketStart,
        finish: bucketStart + bucketSize
      };
    },

    bucketIndex: function(bucketStart) {
      if (!_.isNumber(this._totalCount)) {
        return;
      }
      return _.indexOf(this.potentialBuckets(), bucketStart);
    },

    totalBuckets: function() {
      if (!_.isNumber(this._totalCount)) {
        return;
      }
      return this.potentialBuckets().length;
    },

    getRows: function(startOrIds, len, successCallback, errorCallback, sortOrderForRequest) {
      var rs = this;

      // If we aren't complete, but can grab data from our parent, pre-emptively do so
      // Also exclude client side filtering on the catalog dataset because its filtering is somewhat unusual.
      if (rs._dataset.resourceName !== 'datasets' && !rs._isComplete && (rs._parent || {})._isComplete &&
        rs._jsonQuery.search === rs._parent._jsonQuery.search &&
        _.isEmpty(rs._jsonQuery.group) && _.isEmpty(rs._parent._jsonQuery.group)) {
        var newRows = _.map(_.filter(rs._parent._rows, function(rowItem) {
          return rs._doesBelong(rowItem);
        }), function(rowItem) {
          return $.extend({}, rowItem);
        });
        rs._totalCount = newRows.length;
        delete rs._potentialBuckets;

        var sortVals = _.map(newRows, function(newRow) {
          return {
            sorts: [newRow.id],
            row: newRow
          };
        });

        _.each((rs._jsonQuery.order || []).slice().reverse(), function(ob) {
          var col = rs._dataset.columnForIdentifier(ob.columnFieldName);
          if ($.isBlank(col)) {
            return;
          }
          _.each(sortVals, function(sv) {
            var v = sv.row.data[col.lookup];
            if ($.isBlank(v)) {
              v = null;
            } else {
              if (_.isFunction(col.renderType.matchValue)) {
                v = col.renderType.matchValue(v, col);
              }
            }
            sv.sorts.unshift(v);
          });
        });

        var sorts = (rs._jsonQuery.order || []).slice();
        // Add fake sort for position
        sorts.push({
          ascending: true
        });
        newRows = _.map(sortVals.sort(function(left, right) {
          var a = left.sorts;
          var b = right.sorts;
          var sortIndex = 0;
          while (sortIndex < a.length && a[sortIndex] === b[sortIndex]) {
            sortIndex++;
          }
          // Nulls always sort last
          if ($.isBlank(a[sortIndex])) {
            return 1;
          }
          if ($.isBlank(b[sortIndex])) {
            return -1;
          }
          return (sortIndex === a.length ? 0 : ((a[sortIndex] < b[sortIndex] ? -1 : 1) * (sorts[sortIndex].ascending ? 1 : -1)));
        }), 'row');
        rs._addRows(newRows, 0, true);
      }

      var ids;
      var start;
      if (_.isNumber(startOrIds) && _.isNumber(len)) {
        start = startOrIds;
      } else if (_.isArray(startOrIds)) {
        ids = startOrIds;
      } else {
        if (_.isFunction(errorCallback)) {
          errorCallback({
            message: 'Missing start and length or ids'
          });
        }
        return;
      }

      var pageSize = 100;
      var reqs = [];
      var curReq;
      var pendReq;
      var finish = start + len - 1;
      var loaded = [];
      var pendingRemoved = [];
      var now = new Date().getTime();

      var doLoaded = function() {
        if (loaded.length > 0 || rs._totalCount === 0) {
          if (_.isFunction(successCallback)) {
            successCallback(loaded);
          }
          loaded = [];
        }
      };

      if (len && !$.isBlank(start)) {
        // In NBE, we want to make fewer, but larger, requests for rows.
        // Current strategy is to bucket in chunks of 1000.
        //
        // This code block ignores things like "rowsLoading" because there's not an
        // apparent need for it.
        if (rs._dataset.newBackend && false !== blist.feature_flags.nbe_bucket_size) {
          var bucketSize = rs._dataset.bucketSize;
          var bucket = {
            start: Math.floor(finish / bucketSize) * bucketSize,
            finish: (Math.ceil(finish / bucketSize) * bucketSize) - 1
          };

          if (_.isUndefined(rs._rowBuckets)) {
            rs._rowBuckets = [];
          }

          // Note: _rowBuckets should *only* contain bucket indices that we've already
          // fetched. Building this out is a bad idea.
          if (!_.contains(rs._rowBuckets, bucket.start) && bucket.start < bucket.finish) {
            reqs.push(bucket);

            // The bucket is being requested; do not fetch it again.
            // Only saving the `start` value to cargo cult for speed.
            rs._rowBuckets.push(bucket.start);
            rs._rowBuckets.sort();
          } else {
            // Special case when looking for just one row.
            if (start === finish) {
              curReq = {
                start: start,
                finish: start
              };
            }

            // The while loop is back! These numbers are based off the screen size,
            // so it's unlikely to be insane.
            while (start <= finish) {
              if (rs._rows[start]) {
                loaded.push(rs._rows[start]);
              }
              start++;
            }
          }

        } else {
          while (start <= finish &&
            ($.isBlank(rs._totalCount) || start < rs._totalCount)) {
            var r = rs._rows[start];
            // If this is an expired pending row, clean it out and mark
            // it null so it gets reloaded
            if (!$.isBlank(r) && r.pending && now > r.expires) {
              delete rs._rows[r.index];
              delete rs._rowIDLookup[r.id];
              pendingRemoved.push(r);
              r = null;
            }

            if ($.isBlank(r)) {
              doLoaded();
              if (rs._rowsLoading[start]) {
                if (!$.isBlank(curReq)) {
                  reqs.push(curReq);
                  curReq = null;
                }

                if ($.isBlank(pendReq)) {
                  pendReq = {
                    start: start,
                    length: 1,
                    successCallback: successCallback,
                    errorCallback: errorCallback
                  };
                } else {
                  pendReq.length++;
                }
              } else {
                if (!$.isBlank(pendReq)) {
                  rs._pendingRowReqs.push(pendReq);
                  pendReq = null;
                }

                if ($.isBlank(curReq)) {
                  curReq = {
                    start: start,
                    finish: start
                  };
                } else {
                  if (start - curReq.start + 1 > pageSize) {
                    reqs.push(curReq);
                    curReq = {
                      start: start
                    };
                  } else {
                    curReq.finish = start;
                  }
                }
              }
            } else {
              if (!$.isBlank(curReq)) {
                reqs.push(curReq);
                curReq = null;
              }
              if (!$.isBlank(pendReq)) {
                rs._pendingRowReqs.push(pendReq);
                pendReq = null;
              }
              loaded.push(r);
            }
            start++;
          }
        }
      } else {
        ids = _.reject(ids || [], function(id) {
          var row = rs._rowIDLookup[id];
          if (row) {
            return loaded.push(row);
          }
        });
        for (var i = 0; i < ids.length; i += 100) {
          reqs.push({
            ids: ids.slice(i, i + 100)
          });
        }
      }

      doLoaded();

      if (pendingRemoved.length > 0) {
        rs.trigger('row_change', [pendingRemoved, true]);
      }

      if (!$.isBlank(curReq)) {
        if (_.isUndefined(curReq.finish)) {
          curReq.finish = curReq.start;
        }
        reqs.push(curReq);
        curReq = null;
      }
      if (!$.isBlank(pendReq)) {
        rs._pendingRowReqs.push(pendReq);
        pendReq = null;
      }

      if (reqs.length > 0) {
        if (sortOrderForRequest) {
          _.each(reqs, function(req) {
            req.sortOrderForRequest = sortOrderForRequest;
          });
        }
        var loadAllRows = function() {
          // If we got here, and totalRows is still blank, bail, because something
          // has changed in the meantime and this load is just invalid
          if ($.isBlank(rs._totalCount)) {
            if (_.isFunction(errorCallback)) {
              errorCallback({
                cancelled: true
              });
            }
            return;
          }
          _.each(reqs, function(req) {
            var reqLen;
            var requestOptions = {
              sortOrderForRequest: req.sortOrderForRequest
            };
            if (req.finish && !$.isBlank(req.start)) {
              if (req.start >= rs._totalCount) {
                return;
              }
              if (req.finish >= rs._totalCount) {
                req.finish = rs._totalCount - 1;
              }
              reqLen = req.finish - req.start + 1;
            }
            rs._loadRows(req.ids || req.start, reqLen, requestOptions, successCallback, errorCallback);
          });
        };

        if ($.isBlank(rs._totalCount) || rs._rerequestMeta) {
          // Need to make init req to get all the meta
          var initReq = reqs.shift();
          var initReqLen;
          if (!$.isBlank(initReq.finish) && !$.isBlank(initReq.start)) {
            initReqLen = initReq.finish - initReq.start + 1;
          }
          var options = {
            includeMeta: true,
            sortOrderForRequest: initReq.sortOrderForRequest
          };
          rs._loadRows(initReq.ids || initReq.start, initReqLen, options,
            function(rows) {
              if (_.isFunction(successCallback)) {
                successCallback(rows);
              }
              loadAllRows();
            }, errorCallback);
          delete rs._rerequestMeta;
        } else {
          // Just request rows
          loadAllRows();
        }
      }
    },

    getAllRows: function(successCallback, errorCallback) {
      var rs = this;
      rs.getTotalRows(function() {
        var loadedRows = 0;
        rs.getRows(0, rs._totalCount, function(rows) {
          loadedRows += rows.length;
          if (loadedRows >= rs._totalCount) {
            rs.getRows(0, rs._totalCount, successCallback, errorCallback);
          }
        }, errorCallback);
      }, errorCallback);
    },

    loadedRows: function() {
      return this._rows;
    },

    /**
     * @function primaryKeyExists
     * @description
     * Ensures there is not a row with the candidate primary key.
     *
     * Methodology:
     * - Look through all loaded rows, if found return row, otherwise
     * - Attempt to contact the API for this dataset and
     *   ask for any rows that have the candidate primary key.
     * @param {Any} candidatePrimaryKey - The candidate key that has been requested as an addition.
     * @return {Promise}
     */
    primaryKeyExists: function(candidatePrimaryKey) {
      var rs = this;
      var ds = rs._dataset;
      var primaryKeyColumnID = (ds.rowIdentifierColumn || {}).lookup || ':id';

      // Check all loaded rows for the primary key candidate.
      var row = _.detect(rs._rows, function(r) {
        var unchanged = !r.changed[primaryKeyColumnID];
        var alreadyHasPrimaryKey = r.data[primaryKeyColumnID] === candidatePrimaryKey;

        return unchanged && alreadyHasPrimaryKey;
      });

      if (row) {
        return $.when(row);
      } else {
        // Check API rows for the primary key candidate.
        var deferred = $.Deferred(); // eslint-disable-line new-cap
        var params = {
          '$where': primaryKeyColumnID + '="' + candidatePrimaryKey + '"'
        };
        var url = '/api/id/' + ds.id + '.json?' + $.toParam(params);

        $.getJSON(url).
          done(function(rows) {
            if (Array.isArray(rows)) {
              deferred.resolve(rows[0]);
            } else {
              deferred.reject();
            }
          }).
          fail(deferred.reject);

        return deferred.promise();
      }
    },

    // This function fetches all the fileIds present in the row data.
    getFileIds: function() {
      var rs = this;

      var blobColumnLookups = _(rs._dataset.realColumns).
      filter(function(col) {
        return col.renderTypeName === 'blob';
      }).
      map('lookup').
      value();

      var fileIds = _(rs._rows).
      map(function(row) {
        return _.map(blobColumnLookups, function(lookup) {
          return _.get(row, 'data.' + lookup);
        });
      }).
      flatten().
      compact().
      uniq().
      value();

      return fileIds;
    },

    // This function creates a fileId->row mapping which is used to decorate rows
    // with fileData information.
    mapFileIdsToRows: function() {
      var rs = this;

      var blobColumnLookups = _(rs._dataset.realColumns).
      filter(function(col) {
        return col.renderTypeName === 'blob';
      }).
      map('lookup').
      value();

      if (_.isUndefined(rs._fileIdToRowMapping)) {
        rs._fileIdToRowMapping = {};
      }

      _.each(rs._rows, function(row) {
        _.each(blobColumnLookups, function(lookup) {
          var fileId = _.get(row, 'data.' + lookup);
          if (fileId) {
            rs._fileIdToRowMapping[fileId] = {
              row: row,
              lookup: lookup
            };
          }
        });
      });
    },

    // Returns the row if and only if a change was made.
    applyFileDataToRow: function(fileData) {
      var rs = this;
      var mapping = _.get(rs, '_fileIdToRowMapping.' + fileData.id);
      var row = _.get(mapping, 'row');
      var lookupPath = 'fileData.' + _.get(mapping, 'lookup');
      var rowHasSameIdAsFileData = _.get(row, lookupPath + '.id') === fileData.id;

      if (_.isUndefined(mapping) || rowHasSameIdAsFileData) {
        return false;
      }

      return _.set(mapping.row, lookupPath, fileData);
    },

    addRow: function(newRow, idx) {
      if (!this._doesBelong(newRow)) {
        return;
      }

      var row = $.extend({}, newRow);
      row.index = $.isBlank(idx) ? this._totalCount : idx;
      this._setRowFormatting(row);
      $.addItemsToObject(this._rows, row, row.index);
      this._rowIDLookup[row.id] = row;
      delete this._aggCache;
      // Not going to change isComplete
      this._loadedCount++;
      this._totalCount++;
      this.trigger('row_count_change');
    },

    updateRow: function(row, oldID) {
      var curRow = this._rowIDLookup[$.isBlank(oldID) ? row.id : oldID];
      // When updateRow is called by Dataset#_updateRows, there is no guarantee
      // that all row sets will have the row being updated. If curRow doesn't
      // exist, we can just exit early.
      if (!curRow) {
        return;
      }
      $.extend(curRow, row, {
        index: curRow.index
      });
      this._setRowFormatting(curRow);
      delete this._aggCache;
      if (!$.isBlank(oldID) && oldID !== curRow.id) {
        this._rowIDLookup[curRow.id] = curRow;
        delete this._rowIDLookup[oldID];
      }
      if (!this._doesBelong(curRow)) {
        this.removeRow(curRow);
      }
    },

    removeRow: function(origRow) {
      var row = this.rowForID(origRow.id);
      if ($.isBlank(row)) {
        return;
      }
      $.removeItemsFromObject(this._rows, row.index, 1);
      delete this._rowIDLookup[row.id];
      delete this._aggCache;
      // Not going to change isComplete
      this._loadedCount--;
      this._totalCount--;
    },

    markRow: function(markType, value, origRow) {
      var row = this.rowForID((origRow || {}).id);
      if ($.isBlank(row) || (row.sessionMeta || {})[markType] === value) {
        return;
      }

      row.sessionMeta = row.sessionMeta || {};
      row.sessionMeta[markType] = value;
    },

    reload: function(successCallback, errorCallback) {
      var rs = this;
      delete rs._totalCount;
      delete rs._potentialBuckets;
      delete rs._rows;
      delete rs._rowIDLookup;
      delete rs._aggCache;
      rs._loadRows(0, 1, {
        includeMeta: true,
        fullLoad: true
      }, successCallback, errorCallback);
    },

    getAggregates: function(callback, customAggs) {
      var rs = this;

      var aggs = [];
      var callResults = function() {
        callback(aggs);
      };

      var gotAggs = function(recAggs) {
        rs._aggCache = rs._aggCache || {};
        _.each(recAggs, function(agg) {
          rs._aggCache[agg.columnIdent] = rs._aggCache[agg.columnIdent] || {};
          rs._aggCache[agg.columnIdent][agg.name] = agg.value;
          aggs.push(agg);
        });
      };

      rs._aggCache = rs._aggCache || {};

      var args = {
        params: {
          method: 'getAggregates'
        },
        inline: true
      };
      var needReq = false;
      var soda2Aggs = [];
      if (!$.isBlank(customAggs)) {
        var ilViews = [];
        _.each(customAggs, function(aggList, cId) {
          var curCol = rs._dataset.columnForIdentifier(cId);
          if ($.isBlank(curCol)) {
            return;
          }
          _.each($.makeArray(aggList), function(a, i) {
            if ($.subKeyDefined(rs._aggCache, curCol.fieldName + '.' + a)) {
              aggs.push({
                columnIdent: curCol.fieldName,
                name: a,
                value: rs._aggCache[curCol.fieldName][a]
              });
            } else if (rs._isComplete) {
              gotAggs([{
                columnIdent: curCol.fieldName,
                name: a,
                value: rs._calculateAggregate(curCol.fieldName, a)
              }]);
            } else {
              needReq = true;
              if ($.isBlank(ilViews[i])) {
                ilViews[i] = rs._dataset.cleanCopy();
              }
              var col = _.detect(ilViews[i].columns, function(c) {
                return c.fieldName === curCol.fieldName;
              });
              col.format.aggregate = a;
            }
          });
        });

        if (needReq) {
          args.success = function(resAggs) {
            gotAggs(_.map(resAggs, function(ra) {
              return {
                columnIdent: ra.fieldName,
                name: ra.name,
                value: ra.value
              };
            }));
          };
          _.each(ilViews, function(v) {
            if ($.isBlank(v)) {
              return;
            }
            var req = $.extend({}, args, {
              data: v,
              batch: true
            });
            rs.makeRequest(req);
          });
          ServerModel.sendBatch(callResults);
        } else {
          callResults();
        }
      } else {
        var checkAgg = function(c) {
          if ($.subKeyDefined(c, 'format.aggregate')) {
            if ($.subKeyDefined(rs._aggCache, c.fieldName + '.' + c.format.aggregate)) {
              aggs.push({
                columnIdent: c.fieldName,
                name: c.format.aggregate,
                value: rs._aggCache[c.fieldName][c.format.aggregate]
              });
            } else if (rs._isComplete) {
              gotAggs([{
                columnIdent: c.fieldName,
                name: c.format.aggregate,
                value: rs._calculateAggregate(c.fieldName, c.format.aggregate)
              }]);
            } else {
              needReq = true;
            }
          }
        };

        _.each(rs._dataset.realColumns, function(c) {
          checkAgg(c);
          _.each(c.realChildColumns, function(cc) {
            checkAgg(cc);
          });
        });

        if (needReq) {
          aggs = [];
          args.success = function(recAggs) {
            gotAggs(recAggs);
            gotAggs(_.map(recAggs, function(ra) {
              return {
                columnIdent: ra.fieldName,
                name: ra.name,
                value: ra.value
              };
            }));
            callResults();
          };
          rs.makeRequest(args);
        } else {
          callResults();
        }
      }

      if (soda2Aggs.length > 0) {
        var sel = _.map(soda2Aggs, function(a) {
          return a.method + '(' + a.column + ')';
        }).join(',');
        rs.makeRequest({
          params: {
            '$select': sel
          },
          success: function(resp) {
            gotAggs(_.map(resp[0], function(v, k) {
              var i = k.indexOf('_');
              return {
                columnIdent: k.slice(i + 1),
                name: blist.datatypes.aggregateFromSoda2(k.slice(0, i)),
                value: v
              };
            }));
            callResults();
          }
        });
      }
    },

    activate: function() {
      var rs = this;
      rs._isActive = true;
      rs.trigger('row_change', [_.values(rs._rows), true]);
      _.defer(function() {
        rs.trigger('row_count_change');
      });
    },

    deactivate: function() {
      this._isActive = false;
      var pending = this._pendingRowReqs;
      this._pendingRowReqs = [];
      // Tell pending requests they are being cancelled
      _.each(pending, function(p) {
        if (_.isFunction(p.errorCallback)) {
          p.errorCallback({
            cancelled: true
          });
        }
      });
      delete this._curMetaReq;
      delete this._curMetaReqMeta;
      this.trigger('row_change', [_.values(this._rows), true]);
    },

    invalidate: function(rowCountChanged, columnsChanged) {
      var invRows = _.values(this._rows);
      this._rows = {};
      this._rowsLoading = {};
      var pending = this._pendingRowReqs;
      this._pendingRowReqs = [];
      // Tell pending requests they are being cancelled
      _.each(pending, function(p) {
        if (_.isFunction(p.errorCallback)) {
          p.errorCallback({
            cancelled: true
          });
        }
      });
      delete this._curMetaReq;
      delete this._curMetaReqMeta;
      this._rowIDLookup = {};
      this._loadedCount = 0;
      this._isComplete = false;
      delete this._aggCache;
      if (rowCountChanged) {
        delete this._totalCount;
      }
      if (columnsChanged) {
        this._columnsInvalid = true;
      }
      _.each(this._dataset.columns || [], function(c) {
        c.invalidateData();
      });
      this.trigger('row_change', [invRows, true]);
    },

    invalidateMeta: function() {
      this._rerequestMeta = true;
    },

    formattingChanged: function(condFmt) {
      var rs = this;
      var format = condFmt || ($.subKeyDefined(rs, '_dataset.metadata.conditionalFormatting') &&
        rs._dataset.metadata.conditionalFormatting);
      if (!_.isArray(format)) {
        rs._condFmt = null;
      } else {
        rs._condFmt = _.map(format, function(c) {
          return $.extend({}, c, {
            matches: blist.filter.matchesExpression(c.condition, rs._dataset)
          });
        });
      }
      _.each(rs._rows, function(r) {
        rs._setRowFormatting(r);
      });
    },

    lookupsChanged: function(lookupMap) {
      var rs = this;

      _.each(rs._rows, function(row) {
        _.each(lookupMap, function(newLookup, oldLookup) {
          _.each(['data', 'changed', 'error', 'invalid'], function(subdatum) {
            row[subdatum][newLookup] = row[subdatum][oldLookup];
          });
        });
      });
    },

    canDerive: function(otherQ) {
      return canDeriveExpr(addParents(this._jsonQuery.where, true),
          addParents(otherQ.where, true)) &&
        canDeriveExpr(addParents(this._jsonQuery.having, true),
          addParents(otherQ.having, true)) &&
        _.isEqual(this._jsonQuery.group, otherQ.group);
    },

    makeRequest: function(args) {
      // Always get federated datasets cross-domain
      args.headers = $.extend(args.headers, {
        'X-Socrata-Federation': 'Honey Badger'
      });
      var rs = this;

      // Adding $$query_timeout_seconds to the NBE search request. This parameter has no effect on, and is
      // harmless to send on OBE queries. We're adding it here due to EN-10852 in order to limit the amount
      // of time the database allows in-dataset-search queries to run before being terminated.
      // The TTL for these queries can be controlled by setting inDatasetSearchQueryTimeoutSeconds which is
      // derived from the "nbe_query_timeouts" domain configuration using the "in_dataset_search" property.
      if ($.deepGet(rs, '_dataset', 'metadata', 'inDatasetSearch') === true) {
        args.params.$$query_timeout_seconds =
          $.deepGet(blist, 'configuration', 'inDatasetSearchQueryTimeoutSeconds') || 30;
      }

      if (args.inline) {
        var d;
        if (!$.isBlank(args.data)) {
          d = _.isString(args.data) ? JSON.parse(args.data) : args.data;
        } else {
          d = rs._dataset.cleanCopy();
        }
        if (!_.isEmpty(rs._query)) {
          d.query = d.query || {};
          d.query.orderBys = rs._query.orderBys;
          d.query.groupBys = rs._query.groupBys;
          d.query.filterCondition = rs._query.filterCondition;
        }
        if ($.subKeyDefined(d, 'metadata.jsonQuery.select')) {
          _.each(d.metadata.jsonQuery.select, function(s) {
            var col = _.detect(d.columns, function(c) {
              s.columnFieldName === c.fieldName;
            });
            if ($.isBlank(col)) {
              return;
            }
            if (col instanceof Column) {
              col = col.cleanCopy();
            }
            if (!$.isBlank(s.aggregate)) {
              col.format = col.format || {};
              col.format.grouping_aggregate = blist.datatypes.aggregateFromSoda2(s.aggregate);
            }
          });
        }
        args.data = JSON.stringify(d);
      }
      rs._dataset.makeRequest(args);
    },

    _generateQueryParams: function(args) {
      var rs = this;

      if (_.isUndefined(args)) {
        args = {};
      }

      if ($.isBlank(this._dataset._queryBase)) {
        throw new Error(
          'Please ensure that <Dataset>.getQueryBase() is called before ' +
          'attempting to call <RowSet>._generateQueryParams().'
        );
      }

      var params = args.params || {};
      var baseQuery = rs._dataset._queryBase.metadata.jsonQuery;
      var hasGroups = !_.isEmpty(rs._jsonQuery.group);
      var hasBaseQueryGroups = !_.isEmpty(baseQuery.group);
      var baseQueryIsQuery = rs._dataset.id === rs._dataset._queryBase.id;

      // Need to take the difference from queryBase, and adjust columns if necessary
      var adjSearchString = rs._jsonQuery.search === baseQuery.search ? '' : rs._jsonQuery.search;

      if (!$.isBlank(adjSearchString)) {
        params.$search = adjSearchString;
      }

      if (!_.isEmpty(rs._jsonQuery.where)) {

        // Can't apply a where on top of a true base query group by
        if (!hasBaseQueryGroups || (baseQueryIsQuery && hasBaseQueryGroups)) {
          var soqlWhere = '';
          var where = blist.filter.generateSOQLWhere(rs._jsonQuery.where, rs._dataset);
          var baseWhere = blist.filter.generateSOQLWhere(baseQuery.where, rs._dataset._queryBase);
          var hasWhere = !_.isEmpty(where);
          var hasBaseWhere = !_.isEmpty(baseWhere);

          // If we have a multiple possible where's
          // we simply join them with an AND, as opposed
          // to using subtractQueries.
          if (hasWhere && hasBaseWhere) {
            soqlWhere = where + ' and ' + baseWhere;
          } else if (hasBaseWhere) {
            soqlWhere = baseWhere;
          } else if (hasWhere) {
            soqlWhere = where;
          }

          // This is a cheat. Maps NBE interface. Appending viewport.
          if ($.isPresent(rs._jsonQuery.where.soql)) {
            if (soqlWhere.length > 0) {
              soqlWhere += ' and ';
            }
            soqlWhere += rs._jsonQuery.where.soql;
          }

          params.$where = !$.isBlank(params.$where) ?
            (params.$where + ' and ' + soqlWhere) : soqlWhere;
        }
      }

      if (!_.isEmpty(rs._jsonQuery.having)) {
        var soqlHaving = '';
        var having = blist.filter.generateSOQLWhere(rs._jsonQuery.having, rs._dataset);
        var baseHaving = blist.filter.generateSOQLWhere(baseQuery.having, rs._dataset._queryBase);
        var hasHaving = !_.isEmpty(having);
        var hasBaseHaving = !_.isEmpty(baseHaving);

        if (hasHaving && hasBaseHaving) {
          soqlHaving = having + ' and ' + baseHaving;
        } else if (hasBaseHaving) {
          soqlHaving = baseHaving;
        } else if (hasHaving) {
          soqlHaving = having;
        }

        params.$having = !$.isBlank(params.$having) ?
          (params.$having + ' and ' + soqlHaving) : soqlHaving;
      }

      // If queryBase has any group bys, we can't add more
      if ((hasGroups && !hasBaseQueryGroups) || (hasGroups && hasBaseQueryGroups && baseQueryIsQuery)) {
        var soqlGroup = [];
        var groupSelect = [];

        _.each(rs._jsonQuery.group, function(gb) {
          var qbCF = Dataset.translateColumnToQueryBase(gb.columnFieldName, rs._dataset);

          if ($.isBlank(qbCF)) {
            return;
          }

          if ($.isBlank(gb.groupFunction)) {
            soqlGroup.push(qbCF);
            groupSelect.push(qbCF);
          } else {
            var k = qbCF + '__' + gb.groupFunction;
            soqlGroup.push(k);
            groupSelect.push(gb.groupFunction + '(' + qbCF + ') as ' + k);
          }
        });

        soqlGroup = _.uniq(soqlGroup).join(',');
        params.$group = !$.isBlank(params.$group) ?
          (params.$group + ',' + soqlGroup) : soqlGroup;

        groupSelect = _.uniq(
          groupSelect.concat(
            _.compact(
              _.map(
                rs._jsonQuery.select,
                function(s) {
                  if (!$.isBlank(s.aggregate)) {
                    var qbCF = Dataset.translateColumnToQueryBase(s.columnFieldName, rs._dataset);

                    if ($.isBlank(qbCF)) {
                      return null;
                    }

                    return rs._soqlFnCall(s.aggregate, qbCF);
                  }

                  return null;
                }
              )
            )
          )
        ).join(',');

        var sel = (params.$select || '').replace(/:\*,\*/, '');

        params.$select = !$.isBlank(sel) ? (sel + ',' + groupSelect) : groupSelect;
      }

      if (!_.isEmpty(rs._jsonQuery.order)) {
        var selectCols = _.reject((params.$select || '').split(','), _.isEmpty).map($.trim),
          selectingAllCols = _.isEmpty(selectCols) || _.include(selectCols, '*');
        // Just apply all orderBys, because they can safely be applied on top without harm
        params.$order = _.compact(_.map(rs._jsonQuery.order, function(ob) {
          var orderByColumn = rs._dataset.columnForIdentifier(ob.columnFieldName);
          if ($.isBlank(orderByColumn)) {
            return null;
          }
          var qbC = Dataset.translateColumnToQueryBase(orderByColumn, rs._dataset);
          if ($.isBlank(qbC)) {
            return null;
          }

          var aggregateFn = Dataset.aggregateForColumn(qbC.fieldName, rs._jsonQuery);
          var aggregateFieldName = qbC.fieldNameForRollup(aggregateFn);
          var aggregateFieldNameWithAlias = rs._soqlFnCall(aggregateFn, qbC.fieldName);

          if (!(selectingAllCols || _.include(selectCols, ob.columnFieldName) || _.include(selectCols, aggregateFieldNameWithAlias))) {
            return null;
          }
          return aggregateFieldName + (ob.ascending ? '' : ' desc');
        })).join(',');
      }
      if (args.sortOrderForRequest === 'reversed') {
        var orderBys = params.$order.split(',');
        params.$order = orderBys.map(function(orderBy) {
          if (_.endsWith(orderBy, ' desc')) {
            return orderBy.split(' ')[0]; // desc -> asc
          } else {
            return orderBy + ' desc'; // asc -> desc
          }
        }).join(',');
      }

      return params;
    },

    _makeSODA2Request: function(args) {
      var rs = this;

      if ($.isBlank(rs._dataset._queryBase)) {
        rs._dataset.getQueryBase(function() {
          rs._makeSODA2Request(args);
        });
        return;
      }

      var viewId = this._dataset.nbe_view_id || this._dataset._queryBase.id;

      args.isSODA = true;
      args.url = args.url || '/api/id/{0}.json'.format(viewId);
      args.params = this._generateQueryParams(args);
      if (blist.feature_flags.send_soql_version) {
        args.params.$$version = '2.0';
      }

      rs._dataset.makeRequest(args);
    },

    clone: function() {
      return new RowSet(this._dataset, this._jsonQuery, this._query, this._parent);
    },

    _soqlFnCall: function(fn, field) {
      return fn + '(' + field + ') as ' + fn + '_' + field;
    },

    _loadRows: function(startOrIds, len, options, successCallback, errorCallback) {
      var rs = this;
      options = options || {};
      var includeMeta = options.includeMeta;
      var fullLoad = options.fullLoad;
      var sortOrderForRequest = options.sortOrderForRequest;
      var params = {
        method: 'getByIds',
        asHashes: true
      };

      var start;
      if (_.isNumber(startOrIds) && _.isNumber(len)) {
        start = startOrIds;
        $.extend(params, {
          start: start,
          length: len
        });
        if (sortOrderForRequest === 'reversed' && _.isNumber(rs._totalCount)) {
          params.$offset = rs._totalCount - (start + len);
        }
      } else if (_.isArray(startOrIds)) {
        params.ids = startOrIds;
      } else {
        if (_.isFunction(errorCallback)) {
          errorCallback({
            message: 'Missing start and length, or ids'
          });
        }
        return;
      }

      var reqData = rs._dataset.cleanCopy();
      if (!_.isEmpty(rs._query)) {
        reqData.query = reqData.query || {};
        reqData.query.orderBys = rs._query.orderBys;
        reqData.query.groupBys = rs._query.groupBys;
        reqData.query.filterCondition = rs._query.filterCondition;
      }

      if ((fullLoad || (includeMeta || $.isBlank(rs._totalCount) || rs._columnsInvalid) &&
          !_.isEqual(reqData, rs._curMetaReqMeta))) {
        params.meta = true;
      }

      var reqId = _.uniqueId();
      var rowsLoaded = function(result) {
        if (sortOrderForRequest === 'reversed') {
          result.reverse();
        }
        if (len && !$.isBlank(start)) {
          // Mark all rows as not in-process
          for (var rowIndex = 0; rowIndex < len; rowIndex++) {
            delete rs._rowsLoading[rowIndex + start];
          }
        }

        var oldCount = rs._totalCount;
        if (!$.isBlank(result.meta)) {
          // If another meta request started while this was loading, then
          // skip this one, and only use the latest
          if (rs._curMetaReq !== reqId) {
            if (_.isFunction(errorCallback)) {
              _.defer(function() {
                errorCallback({
                  cancelled: true
                });
              });
            }
            return;
          }
          delete rs._curMetaReq;
          delete rs._curMetaReqMeta;
          rs._totalCount = result.meta.totalRows;
          delete rs._potentialBuckets;
          delete rs._columnsInvalid;

          var metaToUpdate = result.meta.view;

          if (!fullLoad) {
            // I would rather get rid of triggering a metadata_update
            // all the time, since if this isn't a full load, I don't
            // think any relevant metadata has changed. But various UI
            // already depends on events triggered from a metadata
            // update, so we're stuck with this for the moment.
            // Mitigate race conditions by using the current version of
            // data on the dataset for items that are known to cause
            // problems
            metaToUpdate.query.filterCondition = rs._dataset.query.filterCondition;
            if (!$.isBlank(rs._dataset.query.namedFilters)) {
              metaToUpdate.query.namedFilters = rs._dataset.query.namedFilters;
            }
            metaToUpdate.metadata = rs._dataset.metadata;
          }
          rs.trigger('metadata_update', [metaToUpdate, true, true]);
        } else if ($.isBlank(rs._totalCount)) {
          // If we loaded without meta but don't have meta available, bail
          if (_.isFunction(errorCallback)) {
            _.defer(function() {
              errorCallback({
                cancelled: true
              });
            });
          }
          return;
        }

        var rows;
        // If this result is marked pending, then we got no data, and we need
        // placeholder rows
        if (result.pending && len && !$.isBlank(start)) {
          rows = [];
          var oldRows = [];
          // Make them expire after a short time, which will force a reload
          // the next time something wants to render them
          var expires = new Date().getTime() + 30000;
          for (var idx = 0; idx < len; idx++) {
            var newRow = {
              invalid: {},
              error: {},
              changed: {},
              index: idx + start,
              pending: true,
              expires: expires,
              id: 'pending_' + _.uniqueId()
            };

            // If an existing row, clean it out
            if (!$.isBlank(rs._rows[newRow.index])) {
              var oldRow = rs._rows[newRow.index];
              oldRows.push(oldRow);
              delete rs._rowIDLookup[oldRow.id];
            }

            rs._rows[newRow.index] = newRow;
            rs._rowIDLookup[newRow.id] = newRow;
            rows.push(newRow);
          }
          if (oldRows.length > 0) {
            rs.trigger('row_change', [oldRows, true]);
          }
        } else {
          // Normal load
          rows = rs._addRows(result.data || result, start);
        }

        if (oldCount !== rs._totalCount) {
          rs.trigger('row_count_change');
        }

        if (!rs._isActive) {
          if (_.isFunction(errorCallback)) {
            _.defer(function() {
              errorCallback({
                cancelled: true
              });
            });
          }
          return;
        }

        if (_.isFunction(successCallback)) {
          successCallback(rows);
        }

        var pending = rs._pendingRowReqs;
        rs._pendingRowReqs = [];
        _.each(pending, function(p) {
          rs.getRows(p.start, p.length, p.successCallback, p.errorCallback);
        });

        if (rs._dataset.hasBlobColumns()) {
          rs._dataset.resyncFileDataForFileIds();
        }
      }; // end of rowsLoaded callback function

      if (len && !$.isBlank(start)) {
        // Keep track of rows that are being loaded
        for (var i = 0; i < len; i++) {
          rs._rowsLoading[i + start] = true;
        }
      }

      // Always be sorting by something to provide a stable row order.
      // Don't try this when there's a group-by because :id is no longer guaranteed.
      if (_.isEmpty(rs._jsonQuery.order) && _.isEmpty(rs._jsonQuery.group)) {
        params.$order = ':id';
      }

      if (params.$offset) {
        params.$offset = Math.max(0, params.$offset);
      }

      // TODO: CORE-1794: The correct fix is changing the ETag in the backend, but
      // that won't happen anytime soon and a customer wants this and the only impact
      // should be client-side repeated fetches for the same set of rows.
      if ($.browser.safari) {
        params.safariCacheBust = Math.random().toString().slice(2);
      }
      var req = {
        success: rowsLoaded,
        params: params,
        inline: !fullLoad,
        type: fullLoad ? 'GET' : 'POST'
      };
      if (fullLoad) {
        req.url = '/views/' + rs._dataset.id + '/rows.json';
      }
      if (params.meta) {
        rs._curMetaReq = reqId;
        rs._curMetaReqMeta = reqData;
      }

      req.sortOrderForRequest = sortOrderForRequest;

      rs.makeRequest(req);
    },

    _addRows: function(newRows, start, skipTranslate) {
      var rs = this;
      var adjRows = [];
      var oldRows = [];
      var hasIndex = !$.isBlank(start);
      _.each(newRows, function(r, i) {
        var newRow = skipTranslate ? r : RowSet.translateRow(r, rs._dataset, rs);
        var ind;
        if (hasIndex) {
          ind = start + i;
        }

        // If a row already exists at this index, clean it out
        var oldRow;
        if (hasIndex) {
          if (!$.isBlank(rs._rows[ind]) && ($.isBlank(newRow) || newRow.id !== rs._rows[ind].id)) {
            oldRow = rs._rows[ind];
            oldRows.push(oldRow);
            delete rs._rows[ind];
            delete rs._rowIDLookup[oldRow.id];
            rs._loadedCount--;
          }
        } else {
          oldRow = rs._rowIDLookup[newRow.id];
          if (!$.isBlank(oldRow)) {
            oldRows.push(oldRow);
            delete rs._rowIDLookup[oldRow.id];
            rs._loadedCount--;
          }
        }

        if ($.isBlank(newRow)) {
          return;
        }

        if (hasIndex) {
          newRow.index = ind;
          rs._rows[newRow.index] = newRow;
        }
        rs._rowIDLookup[newRow.id] = newRow;
        rs._loadedCount++;
        adjRows.push(newRow);
      });

      rs._isComplete = rs._totalCount === rs._loadedCount;
      if (oldRows.length > 0) {
        rs.trigger('row_change', [oldRows, true]);
      }

      return adjRows;
    },

    _doesBelong: function(row) {
      // If is grouped, assume where matches, since that is processed pre-aggregate.
      // But always evaluate having
      return (this._dataset.isGrouped() ? true : this._matchesExpr.where(row)) &&
        this._matchesExpr.having(row);
    },

    _calculateAggregate: function(cId, aggName) {
      var rs = this;
      var col = rs._dataset.columnForIdentifier(cId);
      var parCol;
      // Might be a child column...
      if ($.isBlank(col)) {
        // Look through each nested table, and find if it has a child
        // column -- find the first real one
        _.any(rs._dataset.columnsForType('nested_table', true), function(pc) {
          col = pc.childColumnForID(cId);
          if (!$.isBlank(col)) {
            parCol = pc;
            return true;
          }
          return false;
        });
      }
      if ($.isBlank(col)) {
        return null;
      }

      var agg = _.detect(col.renderType.aggregates, function(a) {
        return blist.datatypes.aggregateFromSoda2(a.value) === aggName;
      });
      if ($.isBlank(agg)) {
        return null;
      }

      var valuesForRows = function(rows) {
        var processRows = function(memo, row, idx, list) {
          if (row.invalid[col.lookup] !== true) {
            // If this is a nested table, recurse,
            // but don't go more than one level.
            if (!$.isBlank(parCol) && list === rows) {
              _.reduce(row.data[parCol.lookup], processRows, memo);
            } else {
              memo.push(row.data[col.lookup]);
            }
          }
          return memo;
        };

        return _.reduce(rows, processRows, []);
      };

      return agg.calculate(valuesForRows(rs._rows));
    },

    _setRowFormatting: function(row) {
      // This reads metadata.conditionalFormatting, which is an ordered
      // array of conditions & colors. The row will get the color of the
      // first condition that it matches, or no color if it matches none
      // of them.
      // metadata.conditionalFormatting is an array. Each entry is an object
      // with two keys: color and condition.
      // * color: String of CSS color, such as '#ffffff' or
      //          'rgba(255, 255, 255, 1)'
      // * condition: Can be true, in which case any row will match this
      //          condition. This is a good way to make a default as the
      //          last item in the list. Otherwise it is an object. In the basic
      //          case, this has three keys:
      //   * tableColumnId: Identifies a column to look up the cell value in this
      //          row to use for comparision
      //   * subColumn: Identifies a sub-column to check for a value
      //   * operator: How to do the comparison; operators available are the same
      //          as for filter conditions
      //   * value: Value to compare against
      //   Alternately, you can have more complex expressions by providing
      //   a key of children which has an array of condition objects.
      //   In this case, operator is still required, but should be either
      //   'and' or 'or' to control how the multiple conditions are combined
      //
      // Simple example to mark rows that have too high a measurement, too low,
      // or within range:
      // metadata.conditionalFormatting: [
      //   {
      //     color: '#ff9999',
      //     condition: {
      //       tableColumnId: 123,
      //       operator: 'greater_than',
      //       value: 100
      //     }
      //   },
      //   {
      //     color: '#9999ff',
      //     condition: {
      //       tableColumnId: 123,
      //       operator: 'less_than',
      //       value: 20
      //     }
      //   },
      //   {
      //     color: '#99ff99',
      //     condition: true
      //   }
      // ]

      var rs = this;

      // First clear color & icon, as they will be set properly later
      row.color = row.icon = null;

      if (!_.isArray(rs._condFmt)) {
        return null;
      }

      var relevantCondition = _.detect(rs._condFmt, function(c) {
        return c.matches(row);
      }) || {};

      if (relevantCondition.color) {
        row.color = relevantCondition.color;
      }

      if (relevantCondition.icon) {
        row.icon = relevantCondition.icon;
      }
    }
  });

  RowSet.translateRow = function(r, dataset, rowSet, parCol, skipMissingCols) {
    var adjVals = {
      invalid: {},
      changed: {},
      error: {},
      sessionMeta: {},
      data: {},
      metadata: {}
    };
    if (_.any(r, function(val, id) {
        var newVal = val;
        var c = dataset.findColumnForServerName(id, parCol);

        if ($.isBlank(c)) {
          return !skipMissingCols;
        }

        if (c.isMeta && c.name === 'meta' && _.isString(newVal)) {
          newVal = JSON.parse(newVal || 'null');
        }

        if ($.isPlainObject(newVal)) {
          // First, convert an empty array into a null
          // Booleans in the array don't count because location type
          // has a flag that may be set even if there is no data.  If
          // some type actually cares about only having a boolean,
          // this will need to be made more specific
          if (_.all(newVal, function(v) {
              return $.isBlank(v) || _.isBoolean(v);
            })) {
            newVal = null;
          }
        }

        if (c.renderTypeName === 'checkbox' && newVal === false ||
          c.renderTypeName === 'stars' && newVal === 0) {
          newVal = null;
        }

        if (c.renderTypeName === 'geospatial' && r['sid']) {
          newVal = $.extend({}, newVal, {
            row_id: r['sid']
          });
        }

        if (c.dataTypeName === 'nested_table' && _.isArray(newVal)) {
          newVal = _.map(newVal, function(cr) {
            return RowSet.translateRow(cr, dataset, rowSet, c);
          });
          if (_.any(newVal, function(cr) {
              return _.isNull(cr);
            })) {
            return true;
          }
        }

        if (!_.isUndefined(newVal)) {
          adjVals.data[c.lookup] = newVal;
          if (c.isMeta) {
            adjVals.metadata[c.lookup.startsWith(':') ? c.lookup.slice(1) : c.lookup] = newVal;
          }
        }

        return false;
      })) {
      return null;
    }

    if ($.isBlank(adjVals.metadata.id)) {
      // Have to make up an id
      adjVals.metadata.id = 'jsrowid-' + _.uniqueId();
      var metaColumn = dataset.metaColumnForName('id');
      if (!$.isBlank(metaColumn)) {
        adjVals.data[metaColumn.lookup] = adjVals.metadata.id;
      }
    }
    adjVals.id = adjVals.metadata.id;

    _.each((adjVals.metadata.meta || {}).invalidCells || {}, function(v, cId) {
      if (!$.isBlank(v)) {
        var childColumn = !$.isBlank(parCol) ? parCol.childColumnForIdentifier(cId) :
          dataset.columnForIdentifier(cId);
        if (!$.isBlank(childColumn) && $.isBlank(adjVals.data[childColumn.lookup])) {
          adjVals.invalid[childColumn.lookup] = true;
          adjVals.data[childColumn.lookup] = v;
        }
      }
    });
    delete(adjVals.metadata.meta || {}).invalidCells;

    _.each((dataset._commentLocations || {})[adjVals.id] || {}, function(v, tcId) {
      var column = dataset.columnForTCID(tcId);
      if (!$.isBlank(column)) {
        adjVals.annotations = adjVals.annotations || {};
        adjVals.annotations[column.lookup] = 'comments';
      }
    });

    if (!$.isBlank(rowSet)) {
      rowSet._setRowFormatting(adjVals);

      if ($.subKeyDefined(dataset, 'highlights.' + adjVals.id)) {
        rowSet.markRow('highlight', true, adjVals);
      }
    }

    return adjVals;
  };

  RowSet.getQueryKey = function(query) {
    return getSortKey(query.order) + '/' + getGroupKey(query.group) +
      '/' + blist.filter.getFilterKey(query.where) +
      '/' + blist.filter.getFilterKey(query.having) +
      '/' + getSelectKey(query.select) +
      '/' + query.search;
  };

  function getSortKey(ob) {
    if (_.isEmpty(ob)) {
      return '';
    }
    return '(' + _.map(ob, function(o) {
      return o.columnFieldName + ':' + o.ascending;
    }).join('|') + ')';
  }

  function getGroupKey(gb) {
    if (_.isEmpty(gb)) {
      return '';
    }
    return '(' + _.map(_.sortBy(gb, 'columnFieldName'), function(g) {
      return g.columnFieldName + ':' + g.groupFunction;
    }).join('|') + ')';
  }

  function getSelectKey(selects) {
    if (_.isEmpty(selects)) {
      return '';
    }
    return '(' + _.map(_.sortBy(selects, 'columnFieldName'), function(s) {
      return s.columnFieldName + ':' + s.aggregate;
    }).join('|') + ')';
  }

  function addParents(fc, safe) {
    if (safe) {
      fc = $.extend(true, {}, fc);
    }
    _.each(fc.children, function(c) {
      c._parent = fc;
      addParents(c);
    });
    return fc;
  }

  function canDeriveExpr(baseFC, otherFC) {
    if (_.isEmpty(baseFC)) {
      return true;
    }
    if (_.isEmpty(otherFC)) {
      return false;
    }

    // Find all leaves in both, and try to match them up on:
    // value, columnFieldName, tableColumnId, operator, subColumn (actually by key)
    var curLeaves = [];
    var processLeaves = function(expr) {
      if (_.isArray(expr.children)) {
        _.each(expr.children, processLeaves);
      } else {
        if ($.isBlank(expr._key)) {
          expr._key = blist.filter.getFilterKey(expr);
        }
        curLeaves.push(expr);
      }
    };
    processLeaves(baseFC);

    var leftoverLeaves = [];
    var parDeriveCache = {};
    var processOther = function(expr) {
      if (_.isArray(expr.children)) {
        var leftoverChildren = _.filter(expr.children, processOther);
        // If all children are added, then just add this expr, not each child
        if (leftoverChildren.length === expr.children.length) {
          return true;
        } else if (leftoverChildren.length > 0) {
          leftoverLeaves = leftoverLeaves.concat(leftoverChildren);
          return false;
        }
        // If all children matched, then check parents
      }

      if ($.isBlank(expr._key)) {
        expr._key = blist.filter.getFilterKey(expr);
      }
      var matchExpr;
      curLeaves = _.reject(curLeaves, function(cl) {
        // If we found a matching leaf, make sure the parents of each have
        // the proper relationship
        if (cl._key === expr._key) {
          var parMatch = cl._parent === baseFC && expr._parent === otherFC &&
            baseFC.operator === otherFC.operator ||
            $.isBlank(cl._parent) && $.isBlank(expr._parent) ||
            $.isBlank(cl._parent) && expr._parent.operator.toLowerCase() === 'and' ||
            $.isBlank(expr._parent) && cl._parent.operator.toLowerCase() === 'or';
          var k;
          if (!parMatch) {
            if ($.isBlank(cl._parent) || $.isBlank(expr._parent) ||
              cl._parent.operator !== expr._parent.operator) {
              return false;
            }
            if ($.isBlank(cl._parent._key)) {
              cl._parent._key = blist.filter.getFilterKey(cl._parent);
            }
            if ($.isBlank(expr._parent._key)) {
              expr._parent._key = blist.filter.getFilterKey(expr._parent);
            }
            k = cl._parent._key + '::' + expr._parent._key;
            if ($.isBlank(parDeriveCache[k])) {
              parDeriveCache[k] = canDeriveExpr(cl._parent, expr._parent);
            }
          }
          if (parMatch || parDeriveCache[k]) {
            matchExpr = cl;
            return true;
          }
        }
        return false;
      });
      return $.isBlank(matchExpr);
    };
    // If none of the leaves in otherQ matched, filter condition is completely different
    if (processOther(otherFC)) {
      return false;
    }

    // Reduce each set to highest common expr that completely changed
    // Combine removed items into higher-level ops if possible
    var reduceNodes = function(nodes) {
      var result = [];
      var madeChange = false;
      while (nodes.length > 0) {
        var n = nodes[0];
        if ($.isBlank(n._parent)) {
          result.push(nodes.shift());
          continue;
        }
        var p = n._parent;
        var found = [];
        nodes = _.reject(nodes, function(nn) {
          if (nn._parent === p) {
            found.push(nn);
            return true;
          }
          return false;
        });
        if (found.length === p.children.length) {
          result.push(p);
          madeChange = true;
        } else {
          result = result.concat(found);
        }
      }
      return madeChange ? reduceNodes(result) : result;
    };
    curLeaves = reduceNodes(curLeaves);

    // Added operator under AND, removed under OR are good
    return _.all(curLeaves, function(cl) {
        return !$.isBlank(cl._parent) && cl._parent.operator.toLowerCase() === 'or';
      }) &&
      _.all(leftoverLeaves, function(ll) {
        return $.isBlank(ll._parent) || ll._parent.operator.toLowerCase() === 'and';
      });
  }

  if (blist.inBrowser) {
    this.RowSet = RowSet;
  } else {
    module.exports = RowSet;
  }

})();
