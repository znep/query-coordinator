(function() {
  'use strict';

  angular.module('dataCards.models').
    factory('Card', function(ServerConfig, CardOptions, Model, Schemas, Filter, Constants) {

      var schemas = Schemas.regarding('card_metadata');
      var schemaVersion = '1';

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
            self.observe('page.dataset.columns.{0}'.format(fieldName))
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
          validateCardBlobSchema(serialized);
          return serialized;
        },

        setOption: function(key, value) {
          var cardOptions = this.getCurrentValue('cardOptions');
          cardOptions.set(key, value);
          return value;
        }
      });

      Card.deserialize = function(page, blob) {
        validateCardBlobSchema(blob);

        // Since cardType was expected to be required but was later decided
        // to be optional, we need to gracefully handle the case where cardType
        // is not present on the serialized card.
        // If it is not present we default to null and then later map that
        // to the column's default card type in cardVisualization.js when
        // cardType is bound to the scope.
        if (!blob.hasOwnProperty('cardType')) {
          blob.cardType = null;
        }

        var instance = new Card(page, blob.fieldName, blob);
        _.each(_.keys(schemas.getSchemaDefinition(schemaVersion).properties), function(field) {
          if (field === 'fieldName') {
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

      function validateCardBlobSchema(blob) {
        schemas.assertValidAgainstVersion(schemaVersion, blob, 'Card deserialization failed.');
      }

      return Card;
    });
})();
