(function() {
  'use strict';

  function VIFExportService(Page, DateHelpers) {

    /**
     * Return a representation of a card as a Visualization Interchange Format (VIF) JSON object.
     *
     * See: https://docs.google.com/document/d/15oKmDfv39HrhgCJRTKtYadG8ZQvFUeyfx4kR_NZkBgc
     */
    var exportVIF = function(pageModel, uniqueIdOfCardToExport, title, description) {
      var datasetModel;
      var cardModels;
      var pageActiveFilterObjects;

      // TODO: exclude filters on the column we are exporting
      function joinAllPageFilters(activeFilterObjects) {
        return _.flatten(
          activeFilterObjects.map(function(activeFilterObject) {
            return activeFilterObject.filters.map(function(activeFilterInstance) {
              var filter = activeFilterInstance.serialize();

              if (filter.arguments.hasOwnProperty('humanReadableOperand')) {
                delete filter.arguments.humanReadableOperand;
              }

              filter.columnName = activeFilterObject.columnName;

              return filter;
            });
          })
        );
      }

      function getDatasetRowDisplayUnitOrDefault(currentDatasetModel) {
        var rowDisplayUnit = currentDatasetModel.getCurrentValue('rowDisplayUnit');

        if (_.isUndefined(rowDisplayUnit)) {

          return {
            one: 'row',
            other: 'rows'
          };

        } else {

          // Note that we currently have no UI mechanism by which the user can
          // set a plural form of 'rowDisplayUnit', so we will fall back to the
          // same value for singular and plural. Eventually we should be able to
          // use the visualization export UI in order to capture both values from
          // the user on export. Until that time we will make do with the same
          // value for both singular and plural.
          return {
            one: rowDisplayUnit,
            other: rowDisplayUnit
          };
        }
      }

      function conditionallyDecorateBaseLayerUrl(vif, cardModel) {
        var baseLayerUrl = cardModel.getCurrentValue('baseLayerUrl') || null;

        if (_.isString(baseLayerUrl)) {
          vif.configuration.baseLayerUrl = baseLayerUrl;
        }
      }

      function conditionallyDecorateMapExtent(vif, cardModel) {
        var mapExtent = cardModel.getCurrentValue('cardOptions').getCurrentValue('mapExtent');

        if (!_.isEmpty(mapExtent)) {
          vif.configuration.mapExtent = mapExtent;
        }
      }

      function conditionallyDecorateHistogramConfiguration(vif, cardModel) {
        var bucketType = cardModel.getCurrentValue('bucketType');
        var bucketSize = cardModel.getCurrentValue('cardOptions').getCurrentValue('bucketSize');

        if (!_.isEmpty(bucketType)) {
          vif.configuration.bucketType = bucketType;
        }
        if (!_.isEmpty(bucketSize)) {
          vif.configuration.bucketSize = bucketSize;
        }
      }

      socrata.utils.assertIsOneOfTypes(pageModel, 'object');
      socrata.utils.assertIsOneOfTypes(uniqueIdOfCardToExport, 'number', 'string');
      socrata.utils.assertIsOneOfTypes(title, 'string');
      socrata.utils.assertIsOneOfTypes(description, 'string');

      socrata.utils.assertEqual(pageModel instanceof Page, true);

      datasetModel = pageModel.getCurrentValue('dataset');
      cardModels = pageModel.getCurrentValue('cards');
      pageActiveFilterObjects = cardModels.
        map(function(cardModel) {
          return {
            columnName: cardModel.fieldName,
            filters: cardModel.getCurrentValue('activeFilters')
          };
        }).filter(function(filter) {
          return filter.filters.length > 0;
        });

      return cardModels.
        filter(function(cardModel) {
          return String(cardModel.uniqueId) === uniqueIdOfCardToExport;
        }).map(function(cardModel) {
          var visualizationType = cardModel.getCurrentValue('cardType');
          var vif = {
            aggregation: {
              field: pageModel.getCurrentValue('primaryAmountField'),
              'function': pageModel.getCurrentValue('primaryAggregation')
            },
            columnName: cardModel.fieldName,
            configuration: {},
            createdAt: DateHelpers.serializeFloatingTimestamp(new Date()),
            datasetUid: datasetModel.id,
            description: description,
            domain: datasetModel.getCurrentValue('domain'),
            filters: joinAllPageFilters(pageActiveFilterObjects),
            format: {
              type: 'visualization_interchange_format',
              version: 1
            },
            origin: {
              type: 'data_lens_export',
              url: window.location.href
            },
            title: title,
            type: null,
            unit: getDatasetRowDisplayUnitOrDefault(datasetModel)
          };

          switch (visualizationType) {

            case 'choropleth':
              conditionallyDecorateBaseLayerUrl(vif, cardModel);
              conditionallyDecorateMapExtent(vif, cardModel);
              vif.type = 'choroplethMap';
              break;

            case 'feature':
              conditionallyDecorateBaseLayerUrl(vif, cardModel);
              conditionallyDecorateMapExtent(vif, cardModel);
              vif.type = 'featureMap';
              break;

            case 'column':
              vif.type = 'columnChart';
              break;

            case 'histogram':
              conditionallyDecorateHistogramConfiguration(vif, cardModel);
              vif.type = 'histogramChart';
              break;

            case 'timeline':
              vif.type = 'timelineChart';
              break;

            default:
              throw new Error(
                'Error exporting visualization as VIF: unrecognized visualization type {0}'.
                  format(visualizationType)
              );
          }

          return vif;
        })[0];
    };

    return {
      exportVIF: exportVIF
    };
  }

  angular.
    module('dataCards.services').
    service('VIFExportService', VIFExportService);
})();
