/**
 * Creates a new page by matching insertions by ID
 */
(function($) {
    var Template = Model.extend({
        _init: function(properties) {
            var tObj = this;
            tObj._super.apply(this, arguments);

            tObj._properties = properties || {};

            if ($.isBlank(tObj._properties.insertions))
                throw new Error("Need insertions to instantiate a template");

            tObj._properties.template || (tObj._properties.template =
                (blist.configuration.template || {}).content);

            if ($.isBlank(tObj._properties.template))
                throw new Error("Need a template to insert into");
        },

        _resolve: function(destination, sources) {
            var tObj = this;
            if (_.isArray(destination)) {
                return _.map(destination, function(dest) {
                    return tObj._resolve(dest, sources);
                });
            }
            else if (destination.children) {
                destination.children = tObj._resolve(destination.children, sources);
                return destination;
            }
            if (destination.type == 'insertion') {
                var match = _.find(sources, function(source) {
                    return (destination.id == source.id);
                });
                if (match) {
                    return match;
                }
            }
            return destination;
        },

        resolve: function() {
            if (!this._applied)
                this._applied = this._resolve(this._properties.template,
                    this._properties.insertions);
            return this._applied;
        }
    });

    $.extend($.component, {
        Template: Template,

        PageTemplate: Template.extend({
            render: function($destination) {
                var page = this.resolve();

                if (_.isArray(page))
                    throw "Don't know how to render multiple root elements into a single container";

                $destination.attr('id', page.id);
                $.component.initialize(page);
                return page;
            }
        })
    });
})(jQuery);
