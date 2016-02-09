(function(root, $) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  function _renderTemplate($element, componentData, options) {
    var $componentContent = $('<div>', { class: 'component-content' });

    utils.assertHasProperty(componentData, 'type');

    $element.
      addClass(utils.typeToClassNameForComponentType(componentData.type)).
      // Pass on the destroy event to plugin.
      on('destroy', function() { $componentContent.triggerHandler('destroy'); }).
      on('SOCRATA_VISUALIZATION_TABLE_FLYOUT', function(event) {
        var payload = event.originalEvent.detail;

        if (payload !== null) {
          storyteller.flyoutRenderer.render(payload);
        } else {
          storyteller.flyoutRenderer.clear();
        }
      });

    if (_.get(options, 'editMode')) {
      $element.on('SOCRATA_VISUALIZATION_VIF_UPDATED', function(event) {
        var newVif = event.originalEvent.detail;
        var blockId = utils.findClosestAttribute(this, 'data-block-id');
        var componentIndex = parseInt(
          utils.findClosestAttribute(this, 'data-component-index'),
          10);
        var newValue;

        utils.assertIsOneOfTypes(blockId, 'string');
        utils.assert(_.isFinite(componentIndex));

        var blockComponent = storyteller.storyStore.getBlockComponentAtIndex(blockId, componentIndex);

        newValue = _.cloneDeep(componentData.value);
        newValue.layout.height = blockComponent.value.layout.height;
        newValue.vif = newVif;

        if (!_.isEqual(newValue, componentData.value)) {
          storyteller.dispatcher.dispatch({
            action: Actions.BLOCK_UPDATE_COMPONENT,
            blockId: blockId,
            componentIndex: componentIndex,
            type: componentData.type,
            value: newValue
          });
        }
      });
    }

    $element.append($componentContent);
  }

  function _updateVisualization($element, componentData) {
    var $componentContent = $element.find('.component-content');
    var renderedVif = $element.attr('data-rendered-vif') || '{}';
    var vif;

    // Today, socrata visualizations can't be updated by providing a new VIF
    // (to use a new vif, the old vis must be destroyed first). VIF.configuration
    // changes when the user changes the sort on the table. We don't want to
    // blow away the table when that happens. So, ignore changes to configuration
    // for now (until socrata visualizations can accept changing VIFs).
    var propertiesOmittedForVifComparison = [ 'configuration' ];

    utils.assertHasProperty(componentData, 'value.vif');
    vif = componentData.value.vif;

    if (!storyteller.vifsAreEquivalent(
      _.omit(JSON.parse(renderedVif), propertiesOmittedForVifComparison),
      _.omit(vif, propertiesOmittedForVifComparison))
    ) {

      $element.attr('data-rendered-vif', JSON.stringify(vif));

      vif.configuration = vif.configuration || {};
      vif.configuration.localization = {
        'PREVIOUS': 'Previous',// TODO actually get from I18n
        'NEXT': 'Next',
        'NO_ROWS': 'No {unitOther}',
        'ONLY_ROW': 'Showing {unitOne} {firstRowOrdinal} of {datasetRowCount}',
        'MANY_ROWS': 'Showing {unitOther} {firstRowOrdinal}-{lastRowOrdinal} out of {datasetRowCount}',
        'LATITUDE': 'Latitude',
        'LONGITUDE': 'Longitude'
      };

      vif.unit = {
        one: 'record',
        other: 'records'
      };

      // Use triggerHandler since we don't want this to bubble
      $componentContent.triggerHandler('SOCRATA_VISUALIZATION_DESTROY');
      $componentContent.socrataTable(vif);
    }
  }

  function componentSocrataVisualizationTable(componentData, theme, options) {
    var $this = $(this);

    utils.assertHasProperty(componentData, 'type');
    utils.assert(
      componentData.type === 'socrata.visualization.table',
      'componentSocrataVisualizationTable: Tried to render type: {0}'.format(componentData.type)
    );

    if ($this.children().length === 0) {
      _renderTemplate($this, componentData, options);
    }

    _updateVisualization($this, componentData);
    $this.componentBase(componentData, theme, _.extend(
      {
        resizeSupported: true,
        resizeOptions: {
          minHeight: Constants.MINIMUM_COMPONENT_HEIGHTS_PX.visualization
        },
        defaultHeight: Constants.DEFAULT_TABLE_HEIGHT
      },
      options
    ));

    return $this;
  }

  $.fn.componentSocrataVisualizationTable = componentSocrataVisualizationTable;
})(window, jQuery);
