const angular = require('angular');
function VisualizationAddController(
  $scope,
  $window,
  DatasetColumnsService,
  dataset,
  Page,
  defaultColumn,
  defaultVifType,
  defaultRelatedVisualizationUid) {

  /**
   * Declare local variables.
   */

  var socrata = $window.socrata;
  var utils = socrata.utils;
  // Cards always expect to have a page, too painful to remove for now.
  var pageMetadata = {
    cards: [],
    datasetId: dataset.id,
    version: 3
  };
  var blankPage = new Page(pageMetadata, dataset);
  var cardTypesToVIFTypes = {};
  var vifTypesToCardTypes = {
    choroplethMap: 'choropleth',
    columnChart: 'column',
    featureMap: 'feature',
    timelineChart: 'timeline'
  };

  /**
   * Declare local functions.
   */

  function generateVIF(selectedCard) {
    var card = selectedCard.serialize();
    var metadata = dataset.serialize();
    var column = metadata.columns[selectedCard.fieldName];
    var computedColumnName;
    var computedColumn;
    var defaultExtentFeatureFlagValue;
    var defaultExtent;
    var vif = {
      aggregation: {
        field: null,
        'function': 'count'
      },
      columnName: card.fieldName,
      configuration: {
        localization: {}
      },
      createdAt: (new Date()).toISOString(),
      datasetUid: dataset.id,
      description: column.description,
      domain: metadata.domain,
      filters: [],
      format: {
        type: 'visualization_interchange_format',
        version: 1
      },
      origin: {
        type: 'data_lens_add_visualization_component',
        url: `https://${metadata.domain}/view/${dataset.id}`
      },
      title: column.name,
      type: cardTypesToVIFTypes[card.cardType],
      unit: {
        one: 'record',
        other: 'records'
      }
    };

    if (card.cardType === 'choropleth') {
      computedColumnName = selectedCard.getCurrentValue('computedColumn');
      computedColumn = dataset.getCurrentValue('columns')[computedColumnName];
      defaultExtentFeatureFlagValue = $window.socrataConfig.featureMapDefaultExtent;

      // If the domain default extent is not set, it will manifest in the
      // feature flag output as an empty string. If this is the case, we
      // need to default to an empty object.
      try {
        defaultExtent = JSON.parse(defaultExtentFeatureFlagValue);
      } catch (e) {
        defaultExtent = {};
      }

      vif.configuration.computedColumnName = card.computedColumn;
      vif.configuration.defaultExtent = defaultExtent;
      vif.configuration.savedExtent = card.cardOptions.mapExtent;
      vif.configuration.shapefile = {
        columns: {
          name: 'NAME',
          unfiltered: 'UNFILTERED',
          filtered: 'FILTERED',
          selected: 'SELECTED'
        },
        primaryKey: _.get(computedColumn, 'computationStrategy.parameters.primary_key', ''),
        uid:  _.get(computedColumn, 'computationStrategy.parameters.region', '').replace(/_/g, ''),
        geometryLabel: null
      };
    }

    return vif;
  }

  function sendVisualizationToEnclosingWindow(visualizationData, visualizationType, originalUid) {

    // Trigger function attached to the iframe element in the parent
    if (_.isNull($window.frameElement)) {
      throw new Error('Page expects to be in an iframe, passing information to the parent window.');
    } else if (_.isFunction($window.frameElement.onVisualizationSelectedV2)) {
      // Passing objects cross-frame is dangerous in IE, because the cross-frame object's prototype
      // will become invalid if the frame is unloaded. The safest way around this is to send over
      // JSON strings, which are less likely to cause issues (but still suffer prototype breakage,
      // just not to the same degree).
      //
      // FYI: _.cloneDeep preserves prototypes, so we can't just use that.
      $window.frameElement.onVisualizationSelectedV2(
        visualizationData ? JSON.stringify(visualizationData) : null,
        visualizationType,
        originalUid
      );
    } else if (_.isFunction($window.frameElement.onVisualizationSelected)) {
      // DEPRECATED: Remove this function once frontend and storyteller are stable in production.
      $window.frameElement.onVisualizationSelected(visualizationData, visualizationType, originalUid);
    } else {
      throw new Error('Cannot find onVisualizationSelected or onVisualizationSelectedV2 on the iframe.');
    }
  }

  /**
   * Declare scope variables.
   */

  $scope.blankPage = blankPage;
  // Although it is unused here, DatasetColumnsService will attempt to read $scope.page and
  // will fail if it is not present.
  $scope.page = blankPage;
  $scope.dataset = dataset;
  $scope.defaultCardTypeByColumn = {};
  $scope.addCardSelectedColumnFieldName = null;
  // Right now we only support embedding a subset of visualization types.
  $scope.supportedCardTypes = ['choropleth', 'column', 'feature', 'timeline'];
  $scope.supportedVIFTypes = ['choroplethMap', 'columnChart', 'featureMap', 'timelineChart'];
  $scope.relatedVisualizations = $window.relatedVisualizations;

  /**
   * Bind observables to the scope.
   */

  $scope.$bindObservable(
    'columnNameToReadableNameFn',
    DatasetColumnsService.getReadableColumnNameFn$($scope)
  );
  $scope.$bindObservable(
    'highlightedColumns',
    $scope.$observe('addCardSelectedColumnFieldName').
      combineLatest(
        $scope.$observe('classicVisualization'),
        function(fieldName, classicVisualization) {
          if (fieldName) {
            return [fieldName];
          } else if (classicVisualization) {
            return classicVisualization.columns;
          }
        }
      )
  );

  /**
   * Modify Controller state at runtime.
   */

  // Coerce the defaults to either valid values or null.
  defaultRelatedVisualizationUid = _.any(
    $window.relatedVisualizations,
    'originalUid',
    defaultRelatedVisualizationUid) ? defaultRelatedVisualizationUid : null;

  defaultColumn = dataset.getCurrentValue('columns')[defaultColumn] ? defaultColumn : null;

  $scope.supportedCardTypes.forEach(function(cardType, index) {
    cardTypesToVIFTypes[cardType] = $scope.supportedVIFTypes[index];
  });

  // Apply the defaults, if any. defaultRelatedVisualizationUid is
  // highest priority (i.e. we only apply defaultColumn if no
  // defaultRelatedVisualizationUid is present).
  if (defaultRelatedVisualizationUid) {

    $scope.$emit(
      'related-visualization-selected',
      _.find($window.relatedVisualizations, 'originalUid', defaultRelatedVisualizationUid)
    );

  } else if (defaultColumn) {

    // If we have been passed a card type for the default column, ensure
    // that it is prioritized in `columnAndVisualizationSelector.js` by
    // assigning it here (the implementation in that file will check for
    // a default card type by accessing this hash using the column's
    // fieldName as a key).
    if (defaultVifType) {
      $scope.defaultCardTypeByColumn[defaultColumn] = vifTypesToCardTypes[defaultVifType];
    }

    // I'm... so sorry about this. There's an odd timing issue in socSelect
    // (used in columnAndVisualizationSelector) that manifests as the column
    // dropdown not taking the value of defaultColumn (but the rest of the
    // UI reflects a selection of defaultColumn).
    // I can't figure out a safe way of fixing this without seriously endangering
    // the already-fragile socSelect. So I'm sidestepping the issue with setTimeout.
    // Computers!
    $scope.$applyAsync(function() {
      $scope.addCardSelectedColumnFieldName = defaultColumn;
    });
  }



  /**
   * Respond to user actions.
   */

  // Emitted by relatedVisualizationSelector. This page metadata contains a
  // sourceVif property.
  $scope.$on('related-visualization-selected', function(event, visualization) {
    if (visualization.format === 'page_metadata') {
      throw new Error('Exported Data Lens visualizations cannot be selected at this time.');
    } else if (visualization.format === 'classic') {
      // Unlike VIF, classic visualization requires originalUid.
      utils.assertHasProperty(visualization, 'originalUid');
      utils.assertIsOneOfTypes(visualization.originalUid, 'string');

      $scope.addCardSelectedColumnFieldName = null;
      $scope.classicVisualization = visualization;
      sendVisualizationToEnclosingWindow(visualization.data, 'classic', visualization.originalUid);
    }
  });

  /**
   * Communicate changes upstream (to the iframe's parent window).
   */

  // Possible: 'visualization-selected', arg = VIF? (or selectedCard?)
  $scope.$on('card-model-selected', function(event, selectedCard) {
    var vif = selectedCard ? generateVIF(selectedCard) : null;

    $scope.classicVisualization = null;
    sendVisualizationToEnclosingWindow(vif, 'vif', null);
  });
}

angular.
  module('dataCards.controllers').
    controller('VisualizationAddController', VisualizationAddController);
