(function() {

  /**
   * This is a bunch of stuff that was taken from Dataset.js that seemed to make more sense in
   * this context. Not perfect sense, but maybe better than Dataset.js.
   */
  var LegacyFilterHelpers = function LegacyFilterHelpers() {};

  LegacyFilterHelpers.translateSubFilter = function(fc, ds, simplify, isHaving) {
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
        var fcc = LegacyFilterHelpers.translateSubFilter(c, ds, simplify, isHaving);
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
  };

  LegacyFilterHelpers.translateFilterCondition = function(fc, ds, simplify) {
    if ($.isBlank(simplify)) {
      simplify = true;
    }
    fc = $.extend(true, {}, fc);
    var dsIsGrouped = !_.isEmpty((ds.metadata.jsonQuery || {}).group);
    if (dsIsGrouped) {
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
        where: LegacyFilterHelpers.translateSubFilter(splitWhere, ds, simplify, false),
        having: LegacyFilterHelpers.translateSubFilter(splitHaving, ds, simplify, true),
        defaults: LegacyFilterHelpers.translateSubFilter(splitDefault, ds, false, false)
      };
    } else {
      var defaults = _.isEmpty(fc) ? null : _.filter(fc, function(cond) {
        return _.isEmpty(cond.children);
      });
      return {
        where: LegacyFilterHelpers.translateSubFilter(fc, ds, simplify, false),
        defaults: LegacyFilterHelpers.translateSubFilter(defaults, ds, false, false)
      };
    }
  };

  LegacyFilterHelpers.translateGroupBys = function(gb, ds, groupFuncs) {
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

  LegacyFilterHelpers.aggregateForColumn = function(column, jsonQuery) {
    return (_.detect(jsonQuery.select, function(select) {
      return select.aggregate && select.columnFieldName == column;
    }) || {}).aggregate;
  };

  LegacyFilterHelpers.translateColumnToQueryBase = function(c, dataset) {
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

  LegacyFilterHelpers.translateFilterColumnsToBase = function(filter, dataset) {
    var newF = $.extend({}, filter);
    if (!_.isEmpty(newF.children)) {
      newF.children = _.compact(_.map(newF.children, function(fc) {
        return LegacyFilterHelpers.translateFilterColumnsToBase(fc, dataset);
      }));
      if (_.isEmpty(newF.children)) {
        return null;
      }
    }
    if (!$.isBlank(newF.columnFieldName)) {
      newF.columnFieldName = LegacyFilterHelpers.translateColumnToQueryBase(newF.columnFieldName, dataset);
      if ($.isBlank(newF.columnFieldName)) {
        return null;
      }
    }
    return newF;
  };

  if (blist.inBrowser) {
    this.LegacyFilterHelpers = LegacyFilterHelpers;
  } else {
    module.exports = LegacyFilterHelpers;
  }
})();
