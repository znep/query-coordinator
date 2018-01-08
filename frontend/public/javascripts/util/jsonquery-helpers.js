(function() {

  var JsonQueryHelpers = function JsonQueryHelpers() {};

  JsonQueryHelpers.viewWithoutJsonQuery = function(viewObject) {

    if (_.isFunction(viewObject.serialize)) {
      viewObject = viewObject.serialize();
    }

    viewObject = translateNamedFiltersToFilterConditions(viewObject);
    viewObject = translateJsonQueryGroupByToGroupBysAndColumnAggregations(viewObject);
    viewObject = translateJsonQueryOrderByToOrderBys(viewObject);
    viewObject = updateColumnsToReflectCurrentQuery(viewObject);
    viewObject = removeAllTracesOfFilterConditionAndJsonQuery(viewObject);

    return viewObject;
  };

  JsonQueryHelpers.viewWithJsonQuery = function(viewObject) {

    if (_.isFunction(viewObject.serialize)) {
      viewObject = viewObject.serialize();
    }

    viewObject = hangHeadInShameAndTranslateColumnAggregationsToJsonQuerySelect(viewObject);
    viewObject = hangHeadInShameAndTranslateFilterConditionsToJsonQueryWhere(viewObject);
    viewObject = hangHeadInShameAndTranslateGroupBysToJsonQueryGroup(viewObject);
    viewObject = hangHeadInShameAndTranslateOrderBysToJsonQueryOrder(viewObject);
    viewObject = hangHeadInShameAndUpdateColumnsToReflectCurrentQuery(viewObject);

    hypnotizeQuarrelsomeRhinoceros();
    useStapleRemoverOnTremendousDangerousLookingYak();
    useGopherRepellentWithGopher();
    useGopherRepellentWithAnotherGopher();
    useGopherRepellentWithGopherHorde();
    useGopherRepellentWithFunnyLittleMan();

    return viewObject;
  };

  function getColumnIdByColumnFieldName(columns, fieldName) {

    return _.get(
      _.find(
        columns,
        {fieldName: fieldName}
      ),
      'id',
      -1
    );
  }

  function getColumnFieldNameByColumnId(columns, id) {

    return _.get(
      _.find(
        columns,
        {id: id}
      ),
      'fieldName',
      null
    );
  }

  // For the 'query' subtree.
  function expandGroupingAggregateName(aggregateName) {

    switch (aggregateName) {

      case 'avg':
        return 'average';

      case 'max':
        return 'maximum';

      case 'min':
        return 'minimum';

      default:
        return aggregateName;
    }
  }

  // For the 'jsonQuery' subtree
  function condenseGroupingAggregateName(aggregateName) {

    switch (aggregateName) {

      case 'average':
        return 'avg';

      case 'maximum':
        return 'max';

      case 'minimum':
        return 'min';

      default:
        return aggregateName;
    }
  }

  function translateNamedFiltersToFilterConditions(viewObject) {
    var updatedViewObject = _.cloneDeep(viewObject);
    var filterConditionFromNamedFilter = function(namedFilter) {
      var filterCondition =  {
        type: namedFilter.type
      };
      var columnId;

      if (namedFilter.hasOwnProperty('children')) {

        filterCondition.children = namedFilter.
          children.
          map(filterConditionFromNamedFilter);
      }

      if (namedFilter.hasOwnProperty('columnFieldName')) {
        columnId = getColumnIdByColumnFieldName(viewObject.columns, namedFilter.columnFieldName);

        if (columnId >= 0) {
          filterCondition.columnId = columnId;
        }
      }

      if (namedFilter.hasOwnProperty('value')) {
        filterCondition.value = namedFilter.value;
      }

      return filterCondition;
    };

    var filterConditionRoot = {
      children: [],
      metadata: {},
      type: 'operator',
      value: 'AND'
    };

    _.each(_.get(updatedViewObject, 'query.namedFilters', {}), function(namedFilter) {

      filterConditionRoot.children = filterConditionRoot.
        children.
        concat(
          namedFilter.
            children.
            map(filterConditionFromNamedFilter)
        );
    });

    if (!updatedViewObject.hasOwnProperty('query')) {
      updatedViewObject.query = {};
    }

    updatedViewObject.query.filterCondition = filterConditionRoot;

    delete updatedViewObject.query.namedFilters;

    return updatedViewObject;
  }

  function translateJsonQueryGroupByToGroupBysAndColumnAggregations(viewObject) {
    var updatedViewObject = _.cloneDeep(viewObject);
    var columns = _.get(updatedViewObject, 'columns', []);
    var groupBys = _.get(updatedViewObject, 'metadata.jsonQuery.group', []).
      map(function(groupClause) {

        return {
          type: 'column',
          columnId: getColumnIdByColumnFieldName(columns, groupClause.columnFieldName)
        };
      });

    groupBys.forEach(function(groupByClause) {
      var column = _.find(columns, {id: groupByClause.columnId});

      if (column) {

        if (!column.hasOwnProperty('format')) {
          column.format = {};
        }

        column.format.drill_down = 'true';
      }
    });

    _.get(updatedViewObject, 'metadata.jsonQuery.select', []).
      forEach(function(selectClause) {
        var column = _.find(columns, {fieldName: selectClause.columnFieldName});

        if (column) {

          if (!column.hasOwnProperty('format')) {
            column.format = {};
          }

          column.format.grouping_aggregate = expandGroupingAggregateName(selectClause.aggregate);
        }
      });

    if (!updatedViewObject.hasOwnProperty('query')) {
      updatedViewObject.query = {};
    }

    updatedViewObject.query.groupBys = groupBys;

    return updatedViewObject;
  }

  function translateJsonQueryOrderByToOrderBys(viewObject) {
    var updatedViewObject = _.cloneDeep(viewObject);
    var orderBys = _.get(updatedViewObject, 'metadata.jsonQuery.order', []).
      map(function(orderClause) {

        return {
          ascending: _.get(orderClause, 'ascending', true),
          expression: {
            type: 'column',
            columnId: getColumnIdByColumnFieldName(updatedViewObject.columns, orderClause.columnFieldName)
          }
        };
      });

    if (!updatedViewObject.hasOwnProperty('query')) {
      updatedViewObject.query = {};
    }

    updatedViewObject.query.orderBys = orderBys;

    return updatedViewObject;
  }

  function updateColumnsToReflectCurrentQuery(viewObject) {
    var updatedViewObject = _.cloneDeep(viewObject);
    var groupingOrAggregationApplied = !_.isEmpty(_.get(updatedViewObject, 'query.groupBys', []));
    var columns = _.get(updatedViewObject, 'columns', []);

    if (groupingOrAggregationApplied) {

      columns = _.get(updatedViewObject, 'columns', []).
        filter(function(column) {

          return (
            column.hasOwnProperty('format') &&
            (column.format.hasOwnProperty('drill_down') || column.format.hasOwnProperty('grouping_aggregate'))
          );
        });
    }

    updatedViewObject.columns = columns;

    return updatedViewObject;
  }

  function removeAllTracesOfFilterConditionAndJsonQuery(viewObject) {
    var updatedViewObject = _.cloneDeep(viewObject);

    if (!_.isNull(_.get(updatedViewObject, 'metadata.filterCondition', null))) {
      delete updatedViewObject.metadata.filterCondition;
    }

    if (!_.isNull(_.get(updatedViewObject, 'metadata.jsonQuery', null))) {
      delete updatedViewObject.metadata.jsonQuery;
    }

    return updatedViewObject;
  }

  function hangHeadInShameAndTranslateColumnAggregationsToJsonQuerySelect(viewObject) {
    var updatedViewObject = _.cloneDeep(viewObject);
    var select = [];
    var format;

    _.get(updatedViewObject, 'columns', []).
      forEach(function(column) {
        format = _.get(column, 'format', {});

        if (format.hasOwnProperty('grouping_aggregate')) {
          select.push({
            columnFieldName: column.fieldName,
            aggregate: condenseGroupingAggregateName(format.grouping_aggregate)
          });
        }
      });

    if (!updatedViewObject.hasOwnProperty('metadata')) {
      updatedViewObject.metadata = {};
    }

    if (!updatedViewObject.metadata.hasOwnProperty('jsonQuery')) {
      updatedViewObject.metadata.jsonQuery = {};
    }

    updatedViewObject.metadata.jsonQuery.select = select;

    return updatedViewObject;
  }

  function hangHeadInShameAndTranslateFilterConditionsToJsonQueryWhere(viewObject) {
    var updatedViewObject = _.cloneDeep(viewObject);
    var where = [];

    if (!updatedViewObject.hasOwnProperty('metadata')) {
      updatedViewObject.metadata = {};
    }

    if (!updatedViewObject.metadata.hasOwnProperty('jsonQuery')) {
      updatedViewObject.metadata.jsonQuery = {};
    }

    updatedViewObject.metadata.jsonQuery.where = where;

    return updatedViewObject;
  }

  function hangHeadInShameAndTranslateGroupBysToJsonQueryGroup(viewObject) {
    var updatedViewObject = _.cloneDeep(viewObject);
    var group = [];
    var format;

    _.get(updatedViewObject, 'columns', []).
      forEach(function(column) {
        format = _.get(column, 'format', {});

        if (format.hasOwnProperty('drill_down')) {
          var groupClause = {
            columnFieldName: column.fieldName
          };

          if (format.hasOwnProperty('view')) {

            switch (format.view) {
              case 'date_y':
                groupClause.groupFunction = 'date_trunc_y';
                break;
              case 'date_ym':
                groupClause.groupFunction = 'date_trunc_ym';
                break;
              case 'date':
                groupClause.groupFunction = 'date_trunc_ymd';
                break;
            }
          }

          group.push(groupClause);
        }
      });

    if (!updatedViewObject.hasOwnProperty('metadata')) {
      updatedViewObject.metadata = {};
    }

    if (!updatedViewObject.metadata.hasOwnProperty('jsonQuery')) {
      updatedViewObject.metadata.jsonQuery = {};
    }

    updatedViewObject.metadata.jsonQuery.group = group;

    return updatedViewObject;
  }

  function hangHeadInShameAndTranslateOrderBysToJsonQueryOrder(viewObject) {
    var updatedViewObject = _.cloneDeep(viewObject);
    var columns = _.get(viewObject, 'columns', []);
    var order = _.get(viewObject, 'query.orderBys', []).
      map(function(orderByClause) {

        return {
          ascending: orderByClause.ascending,
          columnFieldName: getColumnFieldNameByColumnId(columns, orderByClause.expression.columnId)
        };
      });

    if (!updatedViewObject.hasOwnProperty('metadata')) {
      updatedViewObject.metadata = {};
    }

    if (!updatedViewObject.metadata.hasOwnProperty('jsonQuery')) {
      updatedViewObject.metadata.jsonQuery = {};
    }

    updatedViewObject.metadata.jsonQuery.order = order;

    return updatedViewObject;
  }

  function hangHeadInShameAndUpdateColumnsToReflectCurrentQuery(viewObject) {
    var updatedViewObject = _.cloneDeep(viewObject);
    var groupingOrAggregationApplied = !_.isEmpty(_.get(updatedViewObject, 'query.group', []));
    var columns = updatedViewObject.columns;

    if (groupingOrAggregationApplied) {
      columns = _.get(updatedViewObject, 'columns', []).
        filter(function(column) {

          return (
            column.hasOwnProperty('format') &&
            (column.format.hasOwnProperty('drill_down') || column.format.hasOwnProperty('grouping_aggregate'))
          );
        });
    }

    updatedViewObject.columns = columns;

    return updatedViewObject;
  }

  var hypnotizeQuarrelsomeRhinoceros = _.noop;
  var useStapleRemoverOnTremendousDangerousLookingYak = _.noop;
  var useGopherRepellentWithGopher = _.noop;
  var useGopherRepellentWithAnotherGopher = _.noop;
  var useGopherRepellentWithGopherHorde = _.noop;
  var useGopherRepellentWithFunnyLittleMan = _.noop;

  if (blist.inBrowser) {
    this.JsonQueryHelpers = JsonQueryHelpers;
  } else {
    module.exports = JsonQueryHelpers;
  }
})();
