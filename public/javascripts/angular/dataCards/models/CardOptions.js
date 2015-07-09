(function() {
  'use strict';

  angular.module('dataCards.models').factory('CardOptions', function(ServerConfig, Model) {

    var defaultCardOptions = {
      mapExtent: {}
    };

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
          self.defineObservableProperty(option, value);
        });
      }
    });

    CardOptions.deserialize = function(card, options) {
      return new CardOptions(card, options);
    };

    return CardOptions;
  });
})();
