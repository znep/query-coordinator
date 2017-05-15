(function($) {
  var controlRegistry = {};

  $.fn.isControlClass = function(name) {
    return !!($(this[0]).data('controlClass') || {})[name];
  };

  $.Control = {
    extend: function(name, childModel, defaults, parentName, virtual) {
      if ($.isBlank(parentName)) {
        parentName = 'Control';
      }
      var parentModel = controlRegistry[parentName];
      if ($.isBlank(parentModel)) {
        throw 'Unrecognized parent ' + parentName + ' for ' + name;
      }
      var NewModel = parentModel.model.extend(childModel);
      var df = $.extend(true, {}, parentModel.defaults, defaults);
      controlRegistry[name] = {
        defaults: df,
        model: NewModel,
        name: parentModel.name + '.' + name
      };

      if (!virtual) {
        $.fn[name] = function(options) {
          // Check if object was already created
          var $t = $(this[0]);
          var obj = $t.data(name);
          if ($.isBlank(obj)) {
            obj = new NewModel(options, this[0], controlRegistry[name]);
            $t.data(name, obj);
            var cc = $t.data('controlClass') || {};
            _.each(controlRegistry[name].name.split('.'), function(n) {
              cc[n] = true;
            });
            $t.data('controlClass', cc);
          }
          return obj;
        };
      }
      return NewModel;
    },

    registerMixin: function(name, model, defaults, parentName, dependsOn) {
      if ($.isBlank(parentName)) {
        parentName = 'Control';
      }
      var parentModel = controlRegistry[parentName];
      if ($.isBlank(parentModel)) {
        throw 'Unrecognized parent ' + parentName + ' for mixin ' + name;
      }
      parentModel.mixins = parentModel.mixins || {};
      parentModel.mixins[name] = {
        model: model,
        defaults: defaults,
        dependsOn: dependsOn
      };
    }
  };

  controlRegistry.Control = {
    defaults: {},
    model: Class.extend({
      _init: function(options, dom, modelHash) {
        var df = $.extend(true, {}, modelHash.defaults);
        var obj = this;

        var addedMixins = {};
        var addMixin = function(mn) {
          if (!addedMixins[mn] && $.subKeyDefined(modelHash.mixins, mn)) {
            var mix = modelHash.mixins[mn];
            _.each($.makeArray(mix.dependsOn), addMixin);
            // We want to layer all the mixins so they chain together via _super.
            // We can't just inherit from any prototype object, because that doesn't
            // change with each mixin added. Instead, we make a copy of this object
            // as it exists right now, and mixin the model on top of that. This
            // correctly adds just the new methods from mix.model, referencing the
            // previous version of the current object.
            modelHash.model.addProperties(obj, mix.model, $.extend({}, obj));
            addedMixins[mn] = true;
            $.extend(true, df, mix.defaults);
          }
        };
        _.each(obj._getMixins(options) || [], addMixin);

        obj.settings = $.extend(df, options);
        obj.currentDom = dom;
        obj._initMixins();
      },

      // Returns a list of names that should be applied to this instance
      _getMixins: function() {
        return [];
      },

      // This is used since mixins aren't added until during _init, so overriding _init will do nothing
      _initMixins: function() {},

      $dom: function() {
        if (!this._$dom) {
          this._$dom = $(this.currentDom);
        }
        return this._$dom;
      }
    }),
    name: 'Control'
  };

})(jQuery);
