(function($) {
  var getTypes = function(data) {
    var hasParent = !_.isUndefined((data || {}).parentId);
    var isNBE = blist.dataset.newBackend || blist.feature_flags.disable_legacy_types;

    var types = _.chain(blist.datatypes).
      map(function(type, k) {
        var createable = type.createable;

        if (isNBE) {
          createable = (!createable && type.nbeModifiable) || (createable && !type.deprecatedInNbe);
        } else {
          createable = createable && !type.nbeOnly;
        }

        if (createable && (!hasParent || !type.excludeInNestedTable)) {
          return {
            text: $.t('core.data_types.' + type.name),
            value: k,
            priority: type.priority,
            group: type.group
          };
        }
      }).
      compact().
      sortBy(function(type) {
        return type.priority;
      }).
      value();

    if (!hasParent && blist.dataset.hasDatasetLinkColumn()) {
      types.push({
        value: 'link',
        text: $.t('core.data_types.link')
      });
    }

    return types;
  };

  $.Control.extend('pane_addColumn', {
    isAvailable: function() {
      return this._view.valid &&
        (!this._view.temporary || this._view.minorChange) &&
        this._view.type == 'blist';
    },

    getTitle: function() {
      return $.t('screens.ds.grid_sidebar.add_column.title');
    },

    getSubtitle: function() {
      return $.t('screens.ds.grid_sidebar.add_column.subtitle');
    },

    getDisabledSubtitle: function() {
      return !this._view.valid ?
        $.t('screens.ds.grid_sidebar.base.validation.invalid_view') :
        $.t('screens.ds.grid_sidebar.add_column.validation.view_column');
    },

    _getSections: function() {
      return [{
          title: $.t('screens.ds.grid_sidebar.column_common.basic.title'),
          fields: [{
            text: $.t('screens.ds.grid_sidebar.column_common.basic.name'),
            type: 'text',
            required: true,
            name: 'name',
            prompt: $.t('screens.ds.grid_sidebar.column_common.basic.name_prompt')
          }, {
            text: $.t('screens.ds.grid_sidebar.column_common.basic.description'),
            type: 'textarea',
            name: 'description',
            prompt: $.t('screens.ds.grid_sidebar.column_common.basic.description_prompt')
          }]
        }, {
          title: $.t('screens.ds.grid_sidebar.column_common.type.title'),
          fields: [{
              text: $.t('screens.ds.grid_sidebar.column_common.type.type'),
              type: 'select',
              required: true,
              prompt: $.t('screens.ds.grid_sidebar.column_common.type.type_prompt'),
              name: 'dataTypeName',
              options: blist.dataset.newBackend ? getTypes() : getTypes
            },

            {
              text: $.t('screens.ds.grid_sidebar.column_common.type.key'),
              type: 'columnSelect',
              name: 'format.linkedKey',
              required: true,
              onlyIf: {
                field: 'dataTypeName',
                value: 'link'
              },
              columns: {
                type: 'dataset_link',
                hidden: false
              }
            },

            {
              text: $.t('screens.ds.grid_sidebar.column_common.type.source'),
              type: 'select',
              name: 'format.linkedSource',
              required: true,
              onlyIf: {
                field: 'dataTypeName',
                value: 'link'
              },
              linkedField: 'format.linkedKey',
              options:
              // wrap in function to set up the "this" var
              // so that it points to the view when
              // getLinkedColumnOptions is called.
                function(keyCol, notUsed, $field, curVal) {
                var v = this._view;
                return v.getLinkedColumnOptions.call(v, keyCol, notUsed, $field, curVal);
              }
            }
          ]
        },

        // Multiple choice value chooser
        {
          title: $.t('screens.ds.grid_sidebar.add_column.multiple_choice.title'),
          onlyIf: {
            field: 'dataTypeName',
            value: 'drop_down_list'
          },
          fields: [{
            type: 'repeater',
            addText: $.t('screens.ds.grid_sidebar.add_column.multiple_choice.add_option_button'),
            name: 'dropDownList.values',
            minimum: 1,
            field: {
              type: 'text',
              text: $.t('screens.ds.grid_sidebar.add_column.multiple_choice.option'),
              name: 'description'
            }
          }]
        },

        // Dataset Link
        {
          title: $.t('screens.ds.grid_sidebar.column_common.linked_dataset.title'),
          onlyIf: {
            field: 'dataTypeName',
            value: 'dataset_link'
          },
          fields: [{
            text: $.t('screens.ds.grid_sidebar.column_common.linked_dataset.dataset'),
            type: 'text',
            name: 'format.linkedDataset',
            data: {
              '4x4uid': 'unverified'
            },
            prompt: ''
          }, {
            text: $.t('screens.ds.grid_sidebar.column_common.linked_dataset.key'),
            type: 'select',
            name: 'format.keyColumn',
            linkedField: 'format.linkedDataset',
            // allow selected value to be determined until options are loaded.
            // this is done by setting default value to '_selected' and
            // adding _selected attrib = true in the desired option.
            defaultValue: '_selected',
            options: Dataset.getLinkedDatasetOptionsDefault
          }, {
            text: $.t('screens.ds.grid_sidebar.column_common.linked_dataset.label'),
            type: 'select',
            name: 'format.labelColumn',
            linkedField: 'format.linkedDataset',
            options: Dataset.getLinkedDatasetOptionsDefault
          }]
        },

        // Location convert
        {
          title: $.t('screens.ds.grid_sidebar.add_column.convert_latlong.title'),
          onlyIf: {
            field: 'dataTypeName',
            value: 'location'
          },
          type: 'selectable',
          name: 'latLongSection',
          fields: [{
            text: $.t('screens.ds.grid_sidebar.add_column.convert_latlong.latitude'),
            type: 'columnSelect',
            name: 'convert.latitudeColumn',
            required: true,
            notequalto: 'convertNumber',
            columns: {
              type: 'number',
              hidden: false,
              defaultNames: ['latitude', 'lat', 'y']
            }
          }, {
            text: $.t('screens.ds.grid_sidebar.add_column.convert_latlong.longitude'),
            type: 'columnSelect',
            name: 'convert.longitudeColumn',
            required: true,
            notequalto: 'convertNumber',
            columns: {
              type: 'number',
              hidden: false,
              defaultNames: ['longitude', 'long', 'x']
            }
          }]
        }, {
          title: $.t('screens.ds.grid_sidebar.add_column.convert_address.title'),
          onlyIf: {
            field: 'dataTypeName',
            value: 'location'
          },
          type: 'selectable',
          name: 'addressSection',
          fields: [{
            text: $.t('screens.ds.grid_sidebar.add_column.convert_address.street'),
            type: 'radioGroup',
            name: 'convertStreetGroup',
            defaultValue: 'streetNone',
            options: [{
              value: $.t('core.forms.none'),
              name: 'streetNone',
              type: 'static'
            }, {
              type: 'columnSelect',
              name: 'convert.addressColumn',
              notequalto: 'convertText',
              columns: {
                type: 'text',
                hidden: false,
                defaultNames: ['street address', 'street', 'address']
              }
            }]
          }, {
            text: $.t('screens.ds.grid_sidebar.add_column.convert_address.city'),
            type: 'radioGroup',
            name: 'convertCityGroup',
            defaultValue: 'cityNone',
            options: [{
              value: $.t('core.forms.none'),
              type: 'static',
              name: 'cityNone'
            }, {
              type: 'columnSelect',
              name: 'convert.cityColumn',
              notequalto: 'convertText',
              columns: {
                type: 'text',
                hidden: false,
                defaultNames: ['city']
              }
            }, {
              type: 'text',
              name: 'convert.cityValue',
              prompt: $.t('screens.ds.grid_sidebar.add_column.convert_address.city_prompt')
            }]
          }, {
            text: $.t('screens.ds.grid_sidebar.add_column.convert_address.state'),
            type: 'radioGroup',
            name: 'convertStateGroup',
            defaultValue: 'stateNone',
            options: [{
              value: $.t('core.forms.none'),
              type: 'static',
              name: 'stateNone'
            }, {
              type: 'columnSelect',
              name: 'convert.stateColumn',
              notequalto: 'convertText',
              columns: {
                type: 'text',
                hidden: false,
                defaultNames: ['state']
              }
            }, {
              type: 'text',
              name: 'convert.stateValue',
              prompt: $.t('screens.ds.grid_sidebar.add_column.convert_address.state_prompt')
            }]
          }, {
            text: $.t('screens.ds.grid_sidebar.add_column.convert_address.zip_code'),
            type: 'radioGroup',
            name: 'convertZipGroup',
            defaultValue: 'zipNone',
            options: [{
              value: $.t('core.forms.none'),
              type: 'static',
              name: 'zipNone'
            }, {
              type: 'columnSelect',
              name: 'convert.zipColumn',
              notequalto: 'convertText convertNumber',
              columns: {
                type: ['text', 'number'],
                hidden: false,
                defaultNames: ['zip code', 'postal code', 'zip']
              }
            }, {
              type: 'text',
              name: 'convert.zipValue',
              prompt: $.t('screens.ds.grid_sidebar.add_column.convert_address.zip_code_prompt')
            }]
          }]
        }
      ];
    },

    _getFinishButtons: function() {
      return [$.controlPane.buttons.create, $.controlPane.buttons.cancel];
    },

    _finish: function(data, value, finalCallback) {
      var cpObj = this;
      if (!cpObj._super.apply(this, arguments)) {
        return;
      }

      var column = cpObj._getFormValues();

      if (column.dataTypeName == 'nested_table') {
        column.childColumns = [{
          dataTypeName: 'text',
          name: $.t('screens.ds.grid_sidebar.add_column.nested_table.default_column_name'),
          width: 100
        }];
      } else if (column.dataTypeName == 'location' && !$.isBlank(column.convert)) {
        convertLocation(cpObj, column, finalCallback);
        return;
      } else if (column.dataTypeName == 'link') {
        var keyColId = column.format.linkedKey;
        if (_.isNumber(keyColId)) {
          var keyCol = this._view.columnForID(keyColId);
          if (keyCol != null) {
            column.format.linkedKey = keyCol.fieldName;
          }
        }

        var srcColId = column.format.linkedSource;
        column.dataTypeName =
          cpObj._view.getLinkSourceDataType(null, srcColId, keyColId).value;
      }

      if (!$.isBlank((data || {}).parentId)) {
        var parCol = cpObj._view.columnForID(data.parentId);
        parCol.addChildColumn(column,
          function(nc) {
            columnCreated(cpObj, nc, finalCallback);
          },
          function(xhr) {
            cpObj._genericErrorHandler(xhr);
          });
      } else {
        var actuallyAddColumn = function(col) {

          cpObj._view.addColumn(
            col,
            function(nc) {
              columnCreated(cpObj, nc, finalCallback);
            },
            function(xhr) {
              cpObj._genericErrorHandler(xhr);
            }
          );
        };

        // EN-14748 - Update Grid View to Allow Geocoding NBE Point Columns
        //
        // (See details above implementation of launchNbeGeocodingConfigurator).
        if (Column.isNbePointColumn(blist.dataset, column)) {
          // Need to call cpObj._finishProcessing() here to dismiss the spinner
          // that gets shown by something further up the inheritance tree. We
          // will call cpObj._startProcessing() in
          // launchNbeGeocodingConfigurator() to show the spinner when we
          // actually start the request.
          cpObj._finishProcessing();
          launchNbeGeocodingConfigurator(
            blist.dataset.columns,
            column,
            function() { cpObj._startProcessing(); },
            actuallyAddColumn
          );
        } else {
          actuallyAddColumn(column);
        }
      }
    }
  }, {
    name: 'addColumn'
  }, 'controlPane');


  var columnCreated = function(cpObj, newCol, finalCallback) {
    cpObj._finishProcessing();
    cpObj._showMessage($.t('screens.ds.grid_sidebar.add_column.success'));
    cpObj._hide();
    if (_.isFunction(finalCallback)) {
      finalCallback();
    }
  };

  var convertLocation = function(cpObj, column, finalCallback) {
    cpObj._view.addColumn(null, function(newCol) {
        if (!$.isBlank(column.description)) {
          newCol.description = column.description;
          newCol.save(function(nc) {
              columnCreated(cpObj, nc, finalCallback);
            },
            function(xhr) {
              cpObj._genericErrorHandler(xhr);
            });
        } else {
          columnCreated(cpObj, newCol, finalCallback);
        }
        // Since we imported data, need to reload
        cpObj._view.reload(true);
      },
      function(xhr) {
        cpObj._genericErrorHandler(xhr);
      },
      $.extend({
        method: 'addressify',
        deleteOriginalColumns: false,
        location: column.name
      }, column.convert));
  };


  if ($.isBlank(blist.sidebarHidden.edit) || !blist.sidebarHidden.edit.addColumn) {
    $.gridSidebar.registerConfig('edit.addColumn', 'pane_addColumn', 1);
  }

})(jQuery);

// EN-14748 - Update Grid View to Allow Geocoding NBE Point Columns
//
// This work adds a configuration UI for NBE geocoding. It is launched when the
// user attempts to add a column of type 'point' to an NBE dataset, and augments
// the metadata that gets POSTed to the backend with a computation strategy
// based on the columns that the user has specified for each tier of geographic
// specificity (address -> locality -> subregion -> region -> postal code ->
// country), of which only address and postal code are required by the form.
//
// As such, the request that would have been made when the user clicks 'Create'
// in the Add Column form is not actually made until the user also clicks
// 'Create' on the Geocoding Configuration form.
//
// Rather than trying to figure out the weird dynamic form creation/binding
// stuff that is used by other panes in the grid view, this code uses similar
// markup and class names to approximate the look and feel but just uses basic
// jQuery DOM manipulation to actually operate the form, a pleasant consequence
// of which is that the entire experience is contained in the following function
// as opposed to split up into un-greppable stuff like:
//
//   // defines: addColumn, addChildColumn
//   props['add' + capName] = function(column, successCallback, errorCallback,
//     customParams) {
//     ...
//
// Yuck, right?
function launchNbeGeocodingConfigurator(columns, columnToAdd, showSpinner, addColumnCallback) {
  var LOCALIZATION_PREFIX = 'screens.ds.grid_sidebar.add_column.nbe_geocoding_configuration.';
  var generateSelectAndDefaultFromColumnList = function(columnList, name) {
    var labels = {
      address: $.t(LOCALIZATION_PREFIX + 'address_label'),
      address_default: $.t(LOCALIZATION_PREFIX + 'address_default_label'),
      locality: $.t(LOCALIZATION_PREFIX + 'locality_label'),
      locality_default: $.t(LOCALIZATION_PREFIX + 'locality_default_label'),
      subregion: $.t(LOCALIZATION_PREFIX + 'subregion_label'),
      subregion_default: $.t(LOCALIZATION_PREFIX + 'subregion_default_label'),
      region: $.t(LOCALIZATION_PREFIX + 'region_label'),
      region_default: $.t(LOCALIZATION_PREFIX + 'region_default_label'),
      postal_code: $.t(LOCALIZATION_PREFIX + 'postal_code_label'),
      postal_code_default: $.t(LOCALIZATION_PREFIX + 'postal_code_default_label'),
      country: $.t(LOCALIZATION_PREFIX + 'country_label'),
      country_default: $.t(LOCALIZATION_PREFIX + 'country_default_label')
    };

    return (
      '<div class="nbe-geocoding-option line clearfix select">' +
        '<label for="' + name + '">' + labels[name] + '</label>' +
        '<div class="inputWrapper">' +
          '<div class="selector uniform">' +
            '<div class="container">' +
              '<div>' +
                '<span>' +
                  $.t(LOCALIZATION_PREFIX + 'select_header') +
                '</span>' +
              '</div>' +
            '</div>' +
            '<select name="' + name + '" class="inputItem">' +
              '<option value="" selected>' + $.t(LOCALIZATION_PREFIX + 'select_header') + '</option>' +
              columnList.
                filter(function(column) {
                  // We generally only accept columns of type 'text' for geocoding
                  // source columns, but we do allow number columns to be used for
                  // the postal code field.
                  var isAcceptableTypeForField = (
                    (column.dataTypeName === 'text') ||
                    (column.dataTypeName === 'number' && name === 'postal_code')
                  );

                  return isAcceptableTypeForField;
                }).
                map(function(column) {
                  return '<option value="' + column.fieldName + '">' + column.name + '</option>';
                }).
                join('') +
            '</select>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="nbe-geocoding-option line clearfix input">' +
        '<label for="' + name + '-default">' + labels[name + '_default'] + '</label>' +
        '<input type="text" name="' + name + '-default" placeholder="' + $.t(LOCALIZATION_PREFIX + 'default_placeholder') + '" />' +
      '</div>'
    );
  };
  var $nbeGeocodingModal = $(
    '<div id="nbe-geocoding" class="commonForm formSection">' +
      '<div class="paneContent">' +
        '<div>' +
          '<input id="create-point-column" name="create-point-column-type" type="radio" checked>' +
          '<label for="create-point-column">' +
            $.t('screens.ds.grid_sidebar.add_column.nbe_geocoding_configuration.create_point_column') +
          '</label>' +
        '</div>' +
        '<div>' +
          '<input id="create-geocoded-point-column" name="create-point-column-type" type="radio">' +
          '<label for="create-geocoded-point-column">' +
            $.t('screens.ds.grid_sidebar.add_column.nbe_geocoding_configuration.create_geocoded_point_column') +
          '</label>' +
        '</div>' +
        '<div id="create-geocoded-point-column-fields" class="formSection" style="display: none;">' +
          '<div class="subtitleBlock">' +
            '<p class="subtitle">' +
              $.t('screens.ds.grid_sidebar.add_column.nbe_geocoding_configuration.subtitle') +
            '</p>' +
          '</div>' +
          '<div class="nbe-geocoding-fields sectionContent" name="nbe-geocoding-fields">' +
            generateSelectAndDefaultFromColumnList(columns, 'address') +
            generateSelectAndDefaultFromColumnList(columns, 'locality') +
            generateSelectAndDefaultFromColumnList(columns, 'subregion') +
            generateSelectAndDefaultFromColumnList(columns, 'region') +
            generateSelectAndDefaultFromColumnList(columns, 'postal_code') +
            generateSelectAndDefaultFromColumnList(columns, 'country') +
          '</div>' +
        '</div>' +
        '<div class="nbe-geocoding-buttons finishButtons">' +
          '<a id="nbe-geocoding-submit" href="#" class="button arrowButton requiresLogin submit">' +
            $.t('core.dialogs.create') +
          '</a>' +
          '<a id="nbe-geocoding-cancel" href="#" class="button requiresLogin">' +
            $.t('core.dialogs.cancel') +
          '</a>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
  var columnMapping = {
    address: null,
    locality: null,
    subregion: null,
    region: null,
    postal_code: null,
    country: null
  };
  var defaultMapping = {
    address: null,
    locality: null,
    subregion: null,
    region: null,
    postal_code: null,
    country: null
  };
  var validateComputationFields = function() {
    // To allow maximum flexibility, we only require that at least one column
    // mapping or default value exists.
    var columnFieldNames = columns.map(function(column) {
      return column.fieldName;
    });
    var selectValues = $('#create-geocoded-point-column-fields').
      find('select').
      toArray().
      map(function(el) {
        return $(el).value();
      }).
      filter(function(value) {
        return value !== null;
      });
    var invalidSelectValues = selectValues.filter(function(value) {
      return !_.include(columnFieldNames, value);
    });

    var isValid = !_.isEmpty(selectValues) && _.isEmpty(invalidSelectValues);

    $('#nbe-geocoding-submit').toggleClass('disabled', !isValid);

    return isValid;
  };

  $nbeGeocodingModal.find('#create-point-column').on('click', function() {

    $('#nbe-geocoding-submit').toggleClass('disabled', false);
    $('#create-geocoded-point-column-fields').hide();
  });

  $nbeGeocodingModal.find('#create-geocoded-point-column').on('click', function() {

    validateComputationFields();

    $('#create-geocoded-point-column-fields').show();
  });

  $nbeGeocodingModal.find('.nbe-geocoding-option select').on('change', function(e) {
    // $(...).value() will return null if the value is an empty string, which is
    // what we want. $(...).val(), on the other hand, will return an empty string,
    // which messes up our columnMapping logic. Don't use $(...).val()!
    var value = $(e.target).value();
    var $fakeSelectValue = $(e.target).parent().find('.container div span');

    columnMapping[e.target.name] = value;

    if (_.isNull(value)) {
      $fakeSelectValue.text(
        $.t(
          'screens.ds.grid_sidebar.add_column.nbe_geocoding_configuration.optional_select_header'
        )
      );
    } else {
      $fakeSelectValue.text(value);
    }

    validateComputationFields();
  });

  $nbeGeocodingModal.find('.nbe-geocoding-option input').on('input', function(e) {

    defaultMapping[e.target.name.replace(/\-default$/, '')] = $(e.target).value();

    validateComputationFields();
  });

  $nbeGeocodingModal.find('#nbe-geocoding-submit').on('click', function() {
    var createGeocodedPointColumn = $('#create-geocoded-point-column').value();

    if (createGeocodedPointColumn) {

      // If we're creating a geocoded point column, we need to add a computation
      // strategy to the column metadata so that it will be sent off for
      // computation.
      if (validateComputationFields()) {
        var sources = _.cloneDeep(columnMapping);
        var sourceColumns = [];
        var defaults = _.cloneDeep(defaultMapping);

        Object.keys(sources).forEach(function(sourceKey) {

          // Remove keys for which the value is null.
          if (_.isNull(sources[sourceKey])) {
            delete sources[sourceKey];
          // Add columns to sourceColumns if they are being used.
          } else {
            sourceColumns.push(_.get(sources, sourceKey));
          }
        });

        Object.keys(defaults).forEach(function(defaultKey) {

          // Remove keys for which the value is null.
          if (_.isNull(defaults[defaultKey])) {
            delete defaults[defaultKey];
          }
        });

        var columnWithComputationStrategy = _.cloneDeep(columnToAdd);

        columnWithComputationStrategy.computationStrategy = {
          type: 'geocoding',
          source_columns: sourceColumns,
          parameters: {
            sources: sources,
            defaults: defaults,
            version: 'v1'
          }
        };

        $nbeGeocodingModal.remove();
        showSpinner();
        addColumnCallback(columnWithComputationStrategy);
      }
    } else {

      // If we're just creating a 'normal' point column, we don't need to mutate
      // the column object that was passed in and so we just pass it along.
      $nbeGeocodingModal.remove();
      showSpinner();
      addColumnCallback(columnToAdd);
    }
  });

  $nbeGeocodingModal.find('#nbe-geocoding-cancel').on('click', function() {
    if (
      confirm(
        $.t('screens.ds.grid_sidebar.add_column.nbe_geocoding_configuration.cancel_configuration_prompt')
      )
    ) {

      $nbeGeocodingModal.remove();
    }
  });

  $('.controlPane.addColumn').append($nbeGeocodingModal);
}
