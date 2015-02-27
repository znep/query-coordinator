angular.module('dataCards.models').factory('CardV0', function($injector, ModelHelper, Model, CardDataService, Schemas, Filter, CardTypeMapping, ServerConfig) {

  var schemas = Schemas.regarding('card_metadata');

  var CardV0 = Model.extend({
    init: function(parentPageModel, fieldName, id) {
      this._super();

      if(!(parentPageModel instanceof Model)) { throw new Error('CardV0 models must have parent Page models.'); }
      if(!_.isString(fieldName) || _.isEmpty(fieldName)) { throw new Error('CardV0 models must have a non-empty field name.'); }

      var self = this;
      this.version = '0';
      this.page = parentPageModel;
      this.fieldName = fieldName;
      this.uniqueId = id || _.uniqueId();

      _.each(_.keys(schemas.getSchemaDefinition('0').properties), function(field) {
        if (field === 'fieldName') {
          // fieldName isn't observable.
          return;
        }
        if (field === 'cardType') {
          // cardType needs a lazy default.
          return;
        }
        self.defineObservableProperty(field);
      });

      self.set('activeFilters', []);

      // To compute default cardType, we need column info.
      // Usually the default is overridden during deserialization, but
      // in case cardType isn't set, we have a sane default.
      // TODO vastly simplify when merge new deep-get observe function
      // on Model.
      self.defineObservableProperty('cardType', undefined, function() {
        return self.page.observe('dataset').
          combineLatest(
            // BIG WARNING: CardTypeMapping's API isn't designed well, so it is forced
            // to assume that a dataset's columns are there. The responsibility to
            // ensure the dataset's columns are present therefore falls to us :(
            self.page.observe('dataset.columns').filter(_.isPresent),
            function(dataset, columns) {
              // Intentionally ignoring columns param. See above.
              return CardTypeMapping.defaultVisualizationForColumn(dataset, fieldName);
            }
          ).
          first(); // Terminate the stream on the first one (toPromise waits until the stream terminates).
      });

      self.defineEphemeralObservablePropertyFromSequence(
        'column',
        self.observe('page.dataset.columns.{0}'.format(fieldName))
      );

    },

    /**
     * Creates a clone of this CardV0, including its id and everything.
     *
     * Useful for modifying the card's contents without committing them.
     */
    clone: function() {
      return CardV0.deserialize(this.page, this.serialize(), this.uniqueId);
    },

    serialize: function() {
      var serialized = this._super();
      serialized.fieldName = this.fieldName;
      validateCardBlobSchema(serialized);
      return serialized;
    }
  });

  CardV0.deserialize = function(page, blob, id) {
    validateCardBlobSchema(blob);

    var instance = new CardV0(page, blob.fieldName, id);
    _.each(_.keys(schemas.getSchemaDefinition('0').properties), function(field) {
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
    schemas.assertValidAgainstVersion('0', blob, 'CardV0 deserialization failed.');
  }

  return CardV0;
});
