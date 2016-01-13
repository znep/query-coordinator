const angular = require('angular');
angular.module('dataCards.models').
  factory('Card', function(ServerConfig, CardOptions, Model, Schemas, Filter, Constants, I18n, rx, Dataset) {
    const Rx = rx;

    var schemas = Schemas.regarding('card_metadata');

    // Determine additional customization and export parameters based on enabled features
    var CUSTOMIZABLE_MAP_TYPES = ['choropleth'];
    var EXPORTABLE_CARD_TYPES = ['choropleth', 'column', 'timeline'];

    if (ServerConfig.get('oduxEnableFeatureMap')) {
      CUSTOMIZABLE_MAP_TYPES.push('feature');
      EXPORTABLE_CARD_TYPES.push('feature');
    }

    if (ServerConfig.get('oduxEnableHistogram')) {
      EXPORTABLE_CARD_TYPES.push('histogram');
    }

    var Card = Model.extend({
      init: function(parentPageModel, fieldName, initialValues) {
        this._super();

        if (!(parentPageModel instanceof Model)) { throw new Error('Card models must have parent Page models.'); }
        if (!_.isString(fieldName) || _.isEmpty(fieldName)) { throw new Error('Card models must have a non-empty field name.'); }

        if (!_.isObject(initialValues)) {
          initialValues = {};
        }
        var self = this;
        this.version = parentPageModel.version;
        this.page = parentPageModel;
        this.fieldName = fieldName;
        this.uniqueId = initialValues.id || _.uniqueId();

        if (_.isNumber(this.version) && this.version >= schemas.getLatestSchemaVersion()) {
          this.version = schemas.getLatestSchemaVersion();
        }

        var cardOptions = CardOptions.deserialize(self, initialValues.cardOptions);
        this.defineObservableProperty('cardOptions', cardOptions);

        var unserializableProperties = ['fieldName', 'cardOptions'];
        var serializableProperties = _.chain(schemas.getSchemaDefinition(this.version).properties).
          keys().
          difference(unserializableProperties).
          value();

        _.each(serializableProperties, function(propertyName) {
          self.defineObservableProperty(propertyName, initialValues[propertyName]);
        });

        self.set('activeFilters', []);

        self.defineEphemeralObservablePropertyFromSequence(
          'column',
          self.observe(`page.dataset.columns.${fieldName}`)
        );

        self.defineEphemeralObservableProperty('customTitle', null);
        self.defineEphemeralObservableProperty('showDescription', true);

        // Keep track of customization or export options for the model's card and data types
        self.defineEphemeralObservablePropertyFromSequence(
          'isCustomizableMap',
          self.observe('cardType').map(
            function(cardType) {
              return _.contains(CUSTOMIZABLE_MAP_TYPES, cardType);
            }
          )
        );

        self.defineEphemeralObservablePropertyFromSequence(
          'isCustomizableCard',
          self.observe('cardType').map(
            function(cardType) {
              return !_.contains(Constants.CUSTOMIZATION_DISABLED_CARD_TYPES, cardType);
            }
          )
        );

        self.defineEphemeralObservablePropertyFromSequence(
          'isCustomizableDataType',
          self.observe('column').map(
            function(column) {
              return !_.contains(Constants.CUSTOMIZATION_DISABLED_DATA_TYPES, column.physicalDatatype);
            }
          )
        );

        self.defineEphemeralObservablePropertyFromSequence(
          'isCustomizable',
          self.observe('isCustomizableCard').combineLatest(self.observe('isCustomizableDataType'),
            function(isCustomizableCard, isCustomizableDataType) {
              return isCustomizableCard && isCustomizableDataType;
            }
          )
        );

        self.defineEphemeralObservablePropertyFromSequence(
          'isExportable',
          self.observe('cardType').map(
            function(cardType) {
              return _.contains(EXPORTABLE_CARD_TYPES, cardType);
            }
          )
        );

        // Sometimes cards render as other visualizations, e.g. histogram.
        // Defaults to the defined cardType, but may be overidden by the card
        // visualization directive.
        self.defineEphemeralObservableProperty(
          'visualizationType',
          self.getCurrentValue('cardType')
        );

        var aggregation$;

        if (self.version <= 3 || !ServerConfig.get('enableDataLensCardLevelAggregation')) {
          aggregation$ = self.observe('page.aggregation');
        } else {
          aggregation$ = Rx.Observable.combineLatest(
            self.observe('aggregationField'),
            self.observe('aggregationFunction'),
            self.observe('page.dataset.rowDisplayUnit'),
            self.observe('page.dataset.columns'),
            function(aggregationField, aggregationFunction, rowDisplayUnit, columns) {
              if (aggregationField === '*') {
                aggregationField = null;
              }

              var unit = rowDisplayUnit || I18n.common.row;
              if (_.has(columns, aggregationField)) {
                unit = Dataset.extractHumanReadableColumnName(columns[aggregationField]);
              } else if (aggregationFunction !== 'count' || aggregationField !== null) {
                aggregationFunction = 'count';
                aggregationField = null;
              }

              return {
                'function': aggregationFunction || 'count',
                fieldName: aggregationField,
                unit: unit,
                rowDisplayUnit: rowDisplayUnit || I18n.common.row
              };
            }
          );
        }

        self.defineEphemeralObservablePropertyFromSequence('aggregation', aggregation$);
      },

      /**
       * Creates a clone of this Card, including its id and everything.
       *
       * Useful for modifying the card's contents without committing them.
       */
      clone: function() {
        return Card.deserialize(this.page, _.extend({id: this.uniqueId}, this.serialize()));
      },

      serialize: function() {
        var serialized = this._super();
        serialized.fieldName = this.fieldName;
        validateCardBlobSchema(this.version, serialized);
        return serialized;
      },

      setOption: function(key, value) {
        var cardOptions = this.getCurrentValue('cardOptions');
        cardOptions.set(key, value);
        return value;
      },

      getFilteredColumn: function() {
        var cardType = this.getCurrentValue('cardType');
        if (this.version >= 3 && cardType === 'choropleth') {
          return this.getCurrentValue('computedColumn');
        } else {
          return this.fieldName;
        }
      }
    });

    Card.deserialize = function(page, blob) {
      // Since cardType was expected to be required but was later decided
      // to be optional, we need to gracefully handle the case where cardType
      // is not present on the serialized card.
      // If it is not present we default to null and then later map that
      // to the column's default card type in cardVisualization.js when
      // cardType is bound to the scope.
      if (!blob.hasOwnProperty('cardType')) {
        blob.cardType = null;
      }

      blob = conditionallyMigrateChoroplethBinaryOperatorFilter(blob);

      var instance = new Card(page, blob.fieldName, blob);
      _.each(_.keys(schemas.getSchemaDefinition(instance.version).properties), function(field) {
        if (field === 'fieldName' || field === 'cardOptions') {
          // fieldName isn't observable.
          return;
        }
        if (field === 'activeFilters') {
          // activeFilters needs a bit more deserialization
          instance.set(field, _.map(blob[field], Filter.deserialize));
        } else if (_.isDefined(blob[field])) {
          instance.set(field, blob[field]);
        }
      });

      return instance;
    };

    function validateCardBlobSchema(schemaVersion, blob) {
      schemas.assertValidAgainstVersion(schemaVersion, blob, 'Card deserialization failed.');
    }

    function conditionallyMigrateChoroplethBinaryOperatorFilter(blob) {
      var migratedBlob = _.cloneDeep(blob);

      if (
        // Contrary to what we previously believed, the non-null presence of a
        // `computedColumn` does not indicate that a card is a choropleth;
        // rather, we must check that the cardType is 'choropleth' AND it has a
        // computed column.
        migratedBlob.cardType === 'choropleth' &&
        migratedBlob.hasOwnProperty('computedColumn') &&
        migratedBlob.computedColumn !== null &&
        migratedBlob.hasOwnProperty('activeFilters')
      ) {

        migratedBlob.activeFilters = migratedBlob.activeFilters.map(function(filterBlob) {
          // The purpose of this is to migrate old 'BinaryOperator' filters on
          // Choropleth cards to use the new 'BinaryComputedGeoregionOperator'
          // filter instead. If we deserialize from 'BinaryOperator' into a
          // 'BinaryComputedGeoregionOperator', then the next time the page is
          // saved or a VIF is exported it will have the new, correct filter type.
          if (filterBlob['function'] === 'BinaryOperator') {

            return _.extend(
              {},
              filterBlob,
              {
                'function': 'BinaryComputedGeoregionOperator',
                'computedColumnName': migratedBlob.computedColumn
              }
            );

          } else {
            return filterBlob;
          }
        });
      }

      return migratedBlob;
    }

    return Card;
  });
