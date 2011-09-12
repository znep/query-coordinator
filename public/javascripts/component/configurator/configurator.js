/**
 * This is the core "boot" logic for the Socrata component "configurator".
 */
(function($) {
    $.cf = function() {
        $(document.body).addClass('socrata-page');
        $.cf.top();

        // Set timeout here so top menu animates in.  Delete if we decide that's undesirable
        setTimeout(function() {
            $(document.body).addClass('configurable');
        }, 1);

        var roots = arguments;
        $(function() {
            $.component.initialize.apply($.component, roots);
        });
    }

    $.extend($.cf, {
        edit: function(edit) {
            $.cf.side(edit);
            $(document.body)[edit ? 'addClass' : 'removeClass']('configuring');
        }
    });
})(jQuery);
