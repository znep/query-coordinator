/**
 * Creates a new page by matching insertions by ID
 */
(function($) {

    var render = function(page, $container) {
        if (_.isArray(page))
            throw "Don't know how to render multiple root elements into a single container";

        $container.attr('id', page.id);
        $.component.initialize(page);
    };

    var insertRecursively = function(destination, sources) {
        if (_.isArray(destination)) {
            return _.map(destination, function(dest) {
                return insertRecursively(dest, sources);
            });
        }
        else if (destination.children) {
            destination.children = insertRecursively(destination.children, sources);
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
    };

    $.cf.template = function(page, insertions, $into) {
        var templated = insertRecursively(page.content, insertions);

        if ($into) {
            render(templated, $into);
        }
        return templated;
    };

})(jQuery);
