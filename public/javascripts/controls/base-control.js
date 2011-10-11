(function($)
{
    var controlRegistry = {};

    $.fn.isControlClass = function(name)
    { return _.include(($(this[0]).data('controlClass') || '').split('.'), name); };

    $.Control =
    {
        extend: function(name, childModel, defaults, parentName, virtual)
        {
            if ($.isBlank(parentName)) { parentName = 'Control'; }
            var parentModel = controlRegistry[parentName];
            if ($.isBlank(parentModel)) { throw 'Unrecognized parent ' + parentName + ' for ' + name; }
            var newModel = parentModel.model.extend(childModel);
            var df = $.extend(true, {}, parentModel.defaults, defaults);
            controlRegistry[name] = { defaults: df, model: newModel,
                name: parentModel.name + '.' + name };

            if (!virtual)
            {
                $.fn[name] = function(options)
                {
                    // Check if object was already created
                    var obj = $(this[0]).data(name);
                    if ($.isBlank(obj))
                    {
                        obj = new newModel(options, this[0], controlRegistry[name]);
                        $(this[0]).data(name, obj).data('controlClass', controlRegistry[name].name);
                    }
                    return obj;
                };
            }
            return newModel;
        },

        registerMixin: function(name, model, defaults, parentName, dependsOn)
        {
            if ($.isBlank(parentName)) { parentName = 'Control'; }
            var parentModel = controlRegistry[parentName];
            if ($.isBlank(parentModel)) { throw 'Unrecognized parent ' + parentName + ' for mixin ' + name; }
            parentModel.mixins = parentModel.mixins || {};
            parentModel.mixins[name] = {model: model, defaults: defaults, dependsOn: dependsOn};
        }
    };

    controlRegistry.Control = { defaults: {}, model: Class.extend({
        _init: function(options, dom, modelHash)
        {
            var df = $.extend(true, {}, modelHash.defaults);
            var obj = this;

            var addedMixins = {};
            var addMixin = function(mn)
            {
                if (!addedMixins[mn] && $.subKeyDefined(modelHash.mixins, mn))
                {
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
        _getMixins: function(options)
        { return []; },

        // This is used since mixins aren't added until during _init, so overriding _init will do nothing
        _initMixins: function() { },

        $dom: function()
        {
            if (!this._$dom)
            { this._$dom = $(this.currentDom); }
            return this._$dom;
        }
    }), name: 'Control' };

})(jQuery);
