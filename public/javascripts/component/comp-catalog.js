/**
 * Component registry -- creates component namespace and manages registration of component types.
 */
(function($) {
    function camelize(name) {
        return _.map(name.split(/[\W_]/), function(item) {
            return item.substring(0, 1).toUpperCase() + item.substring(1);
        }).join('');
    }

    var catalog = {};

    $.extend($.component, {
        registerCatalogType: function(type) {
            $.component[type.typeName = type.prototype.typeName = camelize(type.catalogName)] = type;
            if (type.catalogCategory) {
                var category = catalog[type.catalogCategory];
                if (!category)
                    category = catalog[type.catalogCategory] = { name: camelize(type.catalogCategory), entries: [] };
                category.entries.push(type);
            }
        },

        create: function(properties) {
            if (properties == undefined)
                throw "Component create without input properties";
            if (properties instanceof $.component.Component)
                return properties;
            var type = properties.type;
            if (type == undefined)
                throw "Component create without type property";
            var componentClass = $.component[camelize(properties.type)];
            if (!componentClass)
                throw "Invalid component type " + type;
            return new componentClass(properties);
        },

        initialize: function() {
            this.roots = [];
            for (var i = 0; i < arguments.length; i++)
                if ($.isArray(arguments[i]))
                    this.initialize.apply(this, arguments);
                else {
                    var component = this.create(arguments[i]);
                    if (!component.dom.parentNode)
                        throw "Unparented root component " + component.id;
                    this.roots.push(component);
                }
        },

        catalog: catalog
    });
})(jQuery);
