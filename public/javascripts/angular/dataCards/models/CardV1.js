(function() {
  'use strict';

  angular.module('dataCards.models').factory('CardV1', function(ServerConfig, Model, Schemas, Filter, CardTypeMapping) {

    var schemas = Schemas.regarding('card_metadata');
    var schemaVersion = '1';

    var CUSTOMIZABLE_CARD_TYPES = ['choropleth'];
    var EXPORTABLE_CARD_TYPES = ['choropleth', 'column', 'timeline'];

    if (ServerConfig.get('oduxEnableFeatureMap')) {
      CUSTOMIZABLE_CARD_TYPES.push('feature');
      EXPORTABLE_CARD_TYPES.push('feature');
    }

    var CardV1 = Model.extend({
      init: function(parentPageModel, fieldName, initialValues) {
        this._super();

        if(!(parentPageModel instanceof Model)) { throw new Error('CardV1 models must have parent Page models.'); }
        if(!_.isString(fieldName) || _.isEmpty(fieldName)) { throw new Error('CardV1 models must have a non-empty field name.'); }

        if (!_.isObject(initialValues)) {
          initialValues = {};
        }
        var self = this;
        this.version = '1';
        this.page = parentPageModel;
        this.fieldName = fieldName;
        this.uniqueId = initialValues.id || _.uniqueId();

        _.each(_.keys(schemas.getSchemaDefinition(schemaVersion).properties), function(field) {
          if (field === 'fieldName') {
            // fieldName isn't observable.
            return;
          }
          self.defineObservableProperty(field, initialValues[field]);
        });

        self.set('activeFilters', []);

        self.defineEphemeralObservablePropertyFromSequence(
          'column',
          self.observe('page.dataset.columns.{0}'.format(fieldName))
        );

        if (ServerConfig.metadataMigration.shouldUseLocalCardTypeMapping()) {

          self.defineEphemeralObservablePropertyFromSequence(
            'isCustomizable',
            Rx.Observable.combineLatest(
              self.observe('cardType'),
              self.page.observe('dataset.columns').filter(_.isPresent),
              function(cardType, dataset) {
                return CardTypeMapping.modelIsCustomizable(self);
              }
            )
          );

          self.defineEphemeralObservablePropertyFromSequence(
            'isExportable',
            Rx.Observable.combineLatest(
              self.observe('cardType'),
              self.page.observe('dataset.columns').filter(_.isPresent),
              function(cardType, dataset) {
                return CardTypeMapping.modelIsExportable(self);
              }
            )
          );

        } else {

          self.defineEphemeralObservablePropertyFromSequence(
            'isCustomizable',
            self.observe('cardType').map(
              function(cardType) {
                return CUSTOMIZABLE_CARD_TYPES.indexOf(cardType) > -1;
              }
            )
          );

          self.defineEphemeralObservablePropertyFromSequence(
            'isExportable',
            self.observe('cardType').map(
              function(cardType) {
                return EXPORTABLE_CARD_TYPES.indexOf(cardType) > -1;
              }
            )
          );

        }

      },

      /**
       * Creates a clone of this CardV1, including its id and everything.
       *
       * Useful for modifying the card's contents without committing them.
       */
      clone: function() {
        return CardV1.deserialize(this.page, this.serialize(), this.uniqueId);
      },

      serialize: function() {
        var serialized = this._super();
        serialized.fieldName = this.fieldName;
        validateCardBlobSchema(serialized);
        return serialized;
      }
    });

    CardV1.deserialize = function(page, blob, id) {
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

      var instance = new CardV1(page, blob.fieldName, {id: id});
      _.each(_.keys(schemas.getSchemaDefinition(schemaVersion).properties), function(field) {
        if (field === 'fieldName') {
          // fieldName isn't observable.
          return;
        }
        if (field === 'activeFilters') {
          // activeFilters needs a bit more deserialization
          instance.set(field, _.map(blob[field], Filter.deserialize));
        } else if (_.isDefined(blob[field])){
          instance.set(field, blob[field]);
        }
      });

      return instance;
    };

    function validateCardBlobSchema(blob) {
      schemas.assertValidAgainstVersion(schemaVersion, blob, 'CardV1 deserialization failed.');
    }

    return CardV1;
  });

})();
