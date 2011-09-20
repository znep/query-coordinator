/**
 * This is the core "boot" logic for the Socrata component "configurator".
 */
(function($) {
    var $body = $(document.body);

    // This is the current focal component, if any
    var focal;

    // This flag is set while we have global mouse event handlers installed
    var trackingMouseDown = false;

    // The coordinate at which mouse interaction started
    var startX, startY;

    // The mask used to lighten components other than the focal component
    var $mask;

    $.cf = function() {
        $body.addClass('socrata-page');
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

    function unfocus(unmask) {
        if (focal) {
            $body.removeClass('socrata-cf-has-focal');
            $(focal.dom).removeClass('socrata-cf-focal');
            focal = undefined;
        }
        if ($mask && unmask) {
            $mask.remove();
            $mask = undefined;
            $.cf.side.properties();
        }
    }

    function focus(component) {
        if (focal == component)
            return;
        unfocus(false);
        focal = component;
        $body.addClass('socrata-cf-has-focal');
        $(focal.dom).addClass('socrata-cf-focal');
        $.cf.side.properties(component);
        if (!$mask) {
            $mask = $('<div class="socrata-cf-mask"></div>');
            $body.prepend($mask);
        }
    }

    function onBodyMouseMove(event) {
        if (!trackingMouseDown)
            return;
        var deltaX = Math.abs(event.pageX - startX);
        var deltaY = Math.abs(event.pageY - startY);
        var delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (delta > 4) {
            onBodyMouseUp();
            new $.cf.ComponentDrag($(focal.dom), event);
        }
    }

    function onBodyMouseUp(event) {
        if (!trackingMouseDown)
            return;
        $body.unbind('.configurator-interaction');
        trackingMouseDown = false;
    }

    function onBodyMouseDown(event) {
        // The only way we should get to this is if user presses button, moves pointer out of browser, releases button,
        // moves pointer back into browser, and releases button.  Simply continuing our prior operation seems like the
        // best response
        if (trackingMouseDown) {
            onBodyMouseMove(event);
            return false;
        }

        // Find the component this mouse event addresses
        var target = event.target;
        while (target && !target._comp)
            target = target.parentNode;

        // Simply unfocus if there is no target
        if (!target) {
            unfocus(true);
            return;
        }

        // Ensure focus is directed at the interaction component
        focus(target._comp);

        // Listen for drag unless this is a root component
        if (target._comp.parent) {
            // Bind mouse events so we can detect drag-start
            $body.bind('mousemove.configurator-interaction', onBodyMouseMove);
            $body.bind('mouseup.configurator-interaction', onBodyMouseUp);

            // Record keeping
            trackingMouseDown = true;
            startX = event.pageX;
            startY = event.pageY;
        }

        return false;
    }

    var inEditMode = false;

    $.extend($.cf, {
        edit: function(edit) {
            edit = !!edit;
            if (inEditMode != edit) {
                inEditMode = edit;
                $.cf.side(edit);
                $(document.body).toggleClass('configuring');
                $(document.body)[edit ? 'bind' : 'unbind']('mousedown', onBodyMouseDown);
                if (!edit)
                    focus();
            }
        }
    });
})(jQuery);
