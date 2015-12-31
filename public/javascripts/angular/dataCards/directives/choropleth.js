var templateUrl = require('angular_templates/dataCards/choropleth.html');
const angular = require('angular');
const ChoroplethMap = require('socrata-visualizations').views.ChoroplethMap;
// A WORD ON TERMINOLOGY:
//
// 'selected' is what happens when you are filtering by a feature (this is currently a yellow stroke).
// 'highlighted' is what happens when you mouseover a feature (this is currently a white stroke).

function choropleth(
  Constants,
  $timeout,
  $window,
  LeafletHelpersService,
  LeafletVisualizationHelpersService,
  FlyoutService,
  I18n,
  PluralizeService,
  rx) {
  const Rx = rx;

  return {
    restrict: 'E',
    scope: true,
    controller: 'ChoroplethController',
    templateUrl: templateUrl,
    link: function choroplethLink(scope, element) {

      if (scope.allowFilterChange) {
        element.addClass('filterable');
      }

      var baseLayerUrl$ = scope.$observe('baseLayerUrl');
      var geojsonAggregateData$ = scope.$observe('geojsonAggregateData').
        filter(function(data) {
          // The behavior of _.isPresent is different than _.isUndefined for null
          return !_.isUndefined(data);
        });

      var destroy$ = scope.$destroyAsObservable(element);

      var visualization;
      var visualizationElement = element.find('.choropleth');
      var selectionBox = element.find('.choropleth-selection-box');
      var selectionBoxFilterIcon = selectionBox.find('.icon-filter');
      var selectionBoxValue = selectionBox.find('.choropleth-selection-value');
      var clearSelectionButton = selectionBox.find('.icon-close');

      var lastTileLayer;

      // Keep track of the currently-hovered-over and currently-selected features
      // so we can render flyouts outside of Leaflet.
      var selectedFeature;
      var currentFeature;
      var lastFlyoutData;
      var selectionBoxFlyoutData;


      /**********************
      * Setup Configuration *
      **********************/

      var config = {
        configuration: {
          defaultExtent: scope.defaultExtent,
          defaultWidth: Constants.CHOROPLETH_DEFAULT_WIDTH,
          disableLeafletZoomAnimation: Constants.DISABLE_LEAFLET_ZOOM_ANIMATION,
          highlightWidth: Constants.CHOROPLETH_HIGHLIGHT_WIDTH,
          legend: {
            type: scope.stops
          },
          localization: {
            NO_VALUE: `(${I18n.common.noValue})`,
            FLYOUT_SELECTED_NOTICE: scope.allowFilterChange ? I18n.flyout.clearFilterLong : '',
            FLYOUT_UNFILTERED_AMOUNT_LABEL: I18n.flyout.total,
            FLYOUT_FILTERED_AMOUNT_LABEL: I18n.flyout.filteredAmount,
            CLEAR_FILTER_LABEL: I18n.flyout.clear_filter
          },
          savedExtent: scope.savedExtent,
          shapefile: {
            columns: {
              name: Constants.HUMAN_READABLE_PROPERTY_NAME,
              unfiltered: Constants.UNFILTERED_VALUE_PROPERTY_NAME,
              filtered: Constants.FILTERED_VALUE_PROPERTY_NAME,
              selected: Constants.SELECTED_PROPERTY_NAME
            }
          }
        },
        unit: {
          one: PluralizeService.pluralize(scope.rowDisplayUnit, 1),
          other: PluralizeService.pluralize(scope.rowDisplayUnit, 2)
        }
      };

      attachEvents();

      // This is in a separate function because we need to wait until our element
      // has a height and width before initializing it
      function initializeVisualization() {
        visualization = new ChoroplethMap(visualizationElement, config);
      }


      /******************
      * Event Listeners *
      ******************/

      function attachEvents() {
        element.on('SOCRATA_VISUALIZATION_CHOROPLETH_FEATURE_FLYOUT', handleFeatureFlyout);
        element.on('SOCRATA_VISUALIZATION_CHOROPLETH_FLYOUT_HIDE', handleFeatureMouseout);

        element.on('SOCRATA_VISUALIZATION_CHOROPLETH_RENDER_START', handleRenderStart);
        element.on('SOCRATA_VISUALIZATION_CHOROPLETH_RENDER_COMPLETE', handleRenderComplete);

        element.on('SOCRATA_VISUALIZATION_CHOROPLETH_SELECT_REGION', handleSelectRegion);
        element.on('SOCRATA_VISUALIZATION_CHOROPLETH_EXTENT_CHANGE', handleExtentChange);

        selectionBox.on('click', function() {
          clearDatasetFilter(selectedFeature);
        });
      }

      function detachEvents() {
        element.off('SOCRATA_VISUALIZATION_CHOROPLETH_FEATURE_FLYOUT', handleFeatureFlyout);
        element.off('SOCRATA_VISUALIZATION_CHOROPLETH_FLYOUT_HIDE', handleFeatureMouseout);

        element.off('SOCRATA_VISUALIZATION_CHOROPLETH_RENDER_START', handleRenderStart);
        element.off('SOCRATA_VISUALIZATION_CHOROPLETH_RENDER_COMPLETE', handleRenderComplete);

        element.off('SOCRATA_VISUALIZATION_CHOROPLETH_SELECT_REGION', handleSelectRegion);
        element.off('SOCRATA_VISUALIZATION_CHOROPLETH_EXTENT_CHANGE', handleExtentChange);

        selectionBox.off('click', function() {
          clearDatasetFilter(selectedFeature);
        });
      }


      /***************************
      * Handle dataset filtering *
      ***************************/

      /**
       * Coordinates selecting and unselecting regions
       */
      function handleSelectRegion(event) {
        // Handle if filtering enabled
        if (scope.allowFilterChange) {

          var eventObject = event.originalEvent.detail;
          var layer = eventObject.layer;
          var feature = eventObject.feature;

          if (isLayerSelected(layer)) {
            clearDatasetFilter(feature);
          } else {
            setDatasetFilter(feature);
          }
        }

        // (CORE-6981)
        // The leaflet click does not propagate to the body, so the WindowState
        // mouseLeftButtonClick$ does not get triggered, meaning closeDialogEvent$
        // doesn't get fired. This causes bugs where flannels are already open
        // and do not close despite clicking on a leaflet feature.

        // Therefore we fake a click on document.body :'(
        if (_.isFunction($window.document.body.click)) {
          $window.document.body.click();
        }
      }

      /**
       * Determines whether or not the given layer is selected.
       */
      function isLayerSelected(layer) {
        var selectedPropertyName = `feature.properties.${Constants.SELECTED_PROPERTY_NAME}`;

        return _.get(layer, selectedPropertyName);
      }

      /**
       * Emits selected filter events
       */
      function setDatasetFilter(feature) {
        scope.$emit('dataset-filter:choropleth');
        scope.$emit('toggle-dataset-filter:choropleth', feature);
      }

      /**
       * Emits cleared filter events
       */
      function clearDatasetFilter(feature) {
        scope.$emit('dataset-filter-clear:choropleth');
        scope.$emit('toggle-dataset-filter:choropleth', feature);
      }

      function handleExtentChange(e) {
        var newExtents = e.originalEvent.detail;
        var formattedExtents = {
          southwest: [newExtents.southwest.lat, newExtents.southwest.lng],
          northeast: [newExtents.northeast.lat, newExtents.northeast.lng]
        };

        scope.$emit('set-extent', formattedExtents);
      }

      function handleRenderStart(e) {
        var timestamp = e.originalEvent.detail.timestamp;

        scope.$emit('render:start', {
          source: 'choropleth_{0}'.format(scope.$id),
          timestamp: timestamp
        });
      }

      function handleRenderComplete(e) {
        var timestamp = e.originalEvent.detail.timestamp;

        scope.$emit('render:complete', {
          source: 'choropleth_{0}'.format(scope.$id),
          timestamp: timestamp
        });
      }

      /****************
      * Selection Box *
      *****************/

      /**
       * Display the bottom-left clear selection box if layer selected.
       */
      function showSelectionBox() {
        if (scope.allowFilterChange) {
          var boxValue = selectionBoxFlyoutData.title;

          // The max-width of the selection box is the width of the map minus
          // the left/right padding we want on each side.
          var maxWidth = element.find('.choropleth-container').width() -
            Constants.CHOROPLETH_SELECTION_BOX_LEFT -
            Constants.CHOROPLETH_SELECTION_BOX_RIGHT;

          selectionBoxValue.
            text(boxValue).
            css('max-width', maxWidth);

          selectionBox.show();
        }
      }

      function hideSelectionBox() {
        selectionBox.hide();
      }

      /**
       * Assemble Selection Box Data
       * Note: This replicates the payload the visualization returns on feature flyouts.
       * The selection box is a Data Lens only feature, so we have to duplicate logic here.
       */
      function getSelectionBoxFlyoutData(feature) {
        // Assemble data for selection box
        var data = {
          element: feature,
          filteredValueLabel: I18n.flyout.filteredAmount,
          selected: true,
          selectedNotice: I18n.flyout.clearFilterLong,
          title: feature.properties[Constants.HUMAN_READABLE_PROPERTY_NAME],
          unfilteredValueLabel: I18n.flyout.total
        };

        // Add unfiltered and filtered values
        data.unfilteredValue = formatValue(
          feature.properties[Constants.UNFILTERED_VALUE_PROPERTY_NAME]
        );

        if (scope.allowFilterChange) {
          data.filteredValue = formatValue(
            feature.properties[Constants.FILTERED_VALUE_PROPERTY_NAME]
          );
        }

        return data;
      }

      function formatValue(value) {
        if (!_.isFinite(value)) {
          return `(${I18n.common.noValue})`;
        }

        var rowDisplayUnit = PluralizeService.pluralize(scope.rowDisplayUnit, value);
        return `${$window.socrata.utils.formatNumber(value)} ${rowDisplayUnit}`;
      }


      /*************************
      * Handle flyout behavior *
      *************************/

      /**
       * Handle feature mouse over event
       */
      function handleFeatureFlyout(event) {
        lastFlyoutData = event.originalEvent.detail;
        currentFeature = lastFlyoutData.element.feature;
      }

      /**
       * Handle hide flyout event
       */
      function handleFeatureMouseout() {
        lastFlyoutData = null;
        currentFeature = null;
      }

      function getFlyoutContent(flyoutElement, flyoutData) {
        var isFiltered;
        var isSelected;
        var flyoutContent;
        var flyoutSpanClass;
        var dragging = $(flyoutElement).parents('.card').hasClass('dragged');

        // To ensure that only one choropleth instance will ever draw
        // a flyout at a given point in time, we check to see if the
        // directive's private scope includes a non-null currentFeature.
        // This is set to a non-null value when a feature controlled by
        // the choropleth raises a mousemove event, and reset to null
        // when a feature controlled by the choropleth raises a mouseout
        // event. (See onFeatureMouseMove and onFeatureMouseOut).
        if (dragging || (_.isNull(currentFeature) && _.isNull(selectedFeature))) {
          return undefined;
        }

        isFiltered = scope.isFiltered;
        isSelected = flyoutData.selected;

        flyoutContent = [
          '<div class="flyout-title">{0}</div>',
          '<div class="flyout-row">',
            '<span class="flyout-cell">{1}</span>',
            '<span class="flyout-cell">{2}</span>',
          '</div>'
        ];

        if (isFiltered || isSelected) {
          flyoutSpanClass = 'emphasis';
          flyoutContent.push(
            '<div class="flyout-row">',
              '<span class="flyout-cell {3}">{4}</span>',
              '<span class="flyout-cell {3}">{5}</span>',
            '</div>'
          );
        }

        if (isSelected) {
          flyoutSpanClass = 'is-selected';
          flyoutContent.push(
            '<div class="flyout-row">',
              '<span class="flyout-cell">&#8203;</span>',
              '<span class="flyout-cell">&#8203;</span>',
            '</div>',
            '<div class="flyout-row">',
              '<span class="flyout-cell">{6}</span>',
              '<span class="flyout-cell"></span>',
            '</div>'
          );
        }

        return flyoutContent.
          join('').
          format(
            _.escape(flyoutData.title),
            flyoutData.unfilteredValueLabel,
            _.escape(flyoutData.unfilteredValue),
            flyoutSpanClass,
            flyoutData.filteredValueLabel,
            _.escape(flyoutData.filteredValue),
            flyoutData.selectedNotice
          );
      }

      function renderFeatureFlyout(ignored, flyoutElement) {
        if (_.isEmpty(lastFlyoutData)) {
          return undefined;
        }

        return getFlyoutContent(flyoutElement, lastFlyoutData);
      }

      function renderSelectionBoxFlyout(ignored, flyoutElement) {
        if (_.isNull(selectionBoxFlyoutData)) {
          return undefined;
        }

        return getFlyoutContent(flyoutElement, selectionBoxFlyoutData);
      }

      // Register clear button flyout
      FlyoutService.register({
        selector: clearSelectionButton.selector,
        render: _.constant(`<div class="flyout-title">${I18n.flyout.clearFilter}</div>`)
      });

      // Merge 'mousemove' and 'mouseleave' events into a single flyout
      // registration stream.
      var registerFlyout$ = Rx.Observable.merge(
        Rx.Observable.fromEvent(element, 'mousemove'),
        Rx.Observable.fromEvent(element, 'mouseleave')
      ).map(function(e) {
        return e.type === 'mousemove';
      }).distinctUntilChanged();

      // Register flyouts if 'shouldRegister' is true, else deregister.
      registerFlyout$.subscribe(function(shouldRegister) {
        var selectionBoxSelectors = `${selectionBox.selector}, ${selectionBoxFilterIcon.selector}, ${selectionBoxValue.selector}`;

        if (shouldRegister) {
          FlyoutService.register({
            selector: '.leaflet-clickable',
            render: renderFeatureFlyout,
            destroySignal: destroy$,
            trackCursor: true
          });

          FlyoutService.register({
            selector: selectionBoxSelectors,
            render: renderSelectionBoxFlyout,
            positionOn: function(target) {
              if (!$(target).parent().is(selectionBox.selector)) {
                return selectionBox[0];
              }
            },
            destroySignal: destroy$
          });
        } else {
          FlyoutService.deregister('.leaflet-clickable', renderFeatureFlyout);
          FlyoutService.deregister(selectionBoxSelectors, renderSelectionBoxFlyout);
        }
      });


      /*********************************
      * React to changes in bound data *
      *********************************/

      // Observe dimensions
      var dimensions$ = element.closest('.card-visualization').observeDimensions().
        throttle(500, Rx.Scheduler.timeout).
        filter(function(dimensions) {
          return dimensions.width > 0 && dimensions.height > 0;
        }).publish();

      // Observe baseLayerUrl
      var tileLayer$ = baseLayerUrl$.
        map(function(urlFromScope) {
          var resultUrl;
          if (_.isNull(urlFromScope) || _.isUndefined(urlFromScope)) {
            resultUrl = Constants.MAPBOX_SIMPLE_BLUE_BASE_LAYER_URL;
          } else {
            resultUrl = urlFromScope;
          }
          var opacity =
            urlFromScope === Constants.MAPBOX_SIMPLE_GREY_BASE_LAYER_URL
              ? Constants.SIMPLE_GREY_MAP_BASE_LAYER_OPACITY
              : Constants.DEFAULT_MAP_BASE_LAYER_OPACITY;

          return {
            baseLayer: {
              url: resultUrl,
              opacity: opacity
            }
          };
        }).
        distinctUntilChanged(_.property('baseLayer.url'));

      // React to changes in data and dimensions
      Rx.Observable.subscribeLatest(
        dimensions$,
        tileLayer$,
        geojsonAggregateData$,
        function(dimensions, tileLayer, geojsonAggregateData) {
          var options = {
            // In Data Lens we want the visualization to always show
            // filtered data, so this is effectively a constant.
            showFiltered: true
          };

          if (_.isUndefined(visualization)) {
            initializeVisualization();
          }

          // Note: This is to avoid the tiles from re-rendering every time
          // dimensions change
          if (!_.isEqual(tileLayer, lastTileLayer)) {
            visualization.updateTileLayer(tileLayer);
            lastTileLayer = tileLayer;
          }

          // First, hide the clear selection box on re-render
          hideSelectionBox();

          // Update dimensions
          // Note: The visualization checks if its dimensions have changed
          visualization.updateDimensions();

          // Render features layer
          // Note: Need to call render whenever dimensions change, too, so the legend
          // can re-render at the correct height.
          visualization.render(geojsonAggregateData, options);

          // Find selected feature (if there is one)
          // Note: This happens here to handle clearAllFilters not triggering
          // anything that would clear out selectedFeature (if selectedFeature is
          // managed by clearDatasetFilter or setDatasetFilter)
          selectedFeature = _.find(geojsonAggregateData.features, function(feature) {
            return feature.properties[Constants.SELECTED_PROPERTY_NAME] === true;
          });

          // Show selection box if selectedFeature
          if (selectedFeature) {
            selectionBoxFlyoutData = getSelectionBoxFlyoutData(selectedFeature);
            showSelectionBox(selectedFeature);
          }
        });

      // Connect everything up!
      dimensions$.connect();

      // Visualization needs to be told to clean up after itself.
      destroy$.subscribe(function() {
        detachEvents();
        visualization.destroy();
      });
    }
  };
}

angular.
  module('dataCards.directives').
  directive('choropleth', choropleth);

