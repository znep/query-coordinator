(function() {
  'use strict';

  angular.module('dataCards.models').factory('CardOptions', function(ServerConfig, Model) {

    var defaultCardOptions = {
      mapExtent: {},
      bucketSize: null,
      mapFlannelTitleColumn: null
    };

    var ephemeralCardOptions = ['bucketSize'];

    var CardOptions = Model.extend({
      init: function(parentCardModel, initialOptions) {
        this._super();

        if (!(parentCardModel instanceof Model)) {
          throw new Error('CardOptions models must have parent Card models.');
        }

        var self = this;
        this.card = parentCardModel;
        this.version = this.card.version;

        initialOptions = _.extend({}, defaultCardOptions, initialOptions);

        _.each(initialOptions, function(value, option) {
          if (_.includes(ephemeralCardOptions, option)) {
            self.defineEphemeralObservableProperty(option, value);
          } else {
            self.defineObservableProperty(option, value);
          }
        });
      },

      // Some card options are ephemeral but must still be saved on the model.
      // For example, we might need to persist them across page loads or use
      // them in some way on the backend, but want to set them 'silently'
      // without triggering an unsaved state.
      _isPropertySerializable: function(propertyName) {
        return !this._isObservablePropertyEphemeral(propertyName) ||
          _.includes(ephemeralCardOptions, propertyName);
      }
    });

    CardOptions.deserialize = function(card, options) {
      return new CardOptions(card, options);
    };

    return CardOptions;
  });
})();
