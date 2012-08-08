/**
 * This is the core "boot" logic for the Socrata component "configurator".
 */
(function($) {
    var $body = $(document.body);

    // This is the current focal component, if any
    var focal;

    // Separately track what is being hovered over
    var hoverFocus;
    var hoverFocusDisabled = false;

    // The mask used to lighten components other than the focal component
    var $mask;


    var focusOnTarget = function(target)
    {
        while (target && !target._comp)
        { target = target.parentNode; }

        // Simply unfocus if there is no target
        if (!target || !target._comp.canEdit('focus'))
        {
            $.cf.blur(true);
            return false;
        }

        // Ensure focus is directed at the interaction component
        $.cf.focus(target._comp);
        return target;
    };

    // We need to notify components that they lost focus
    // as the browser will jump away on Tab
    var onBodyKeyDown = function(event)
    {
        if (event.which == 9)
        {
            _.defer(function()
            {
                var active = document.activeElement;
                if (active)
                { focusOnTarget(active); }
                else
                { $.cf.blur(true); }
            });
        }
    };

    function onBodyClick(event)
    {
        // Don't track right-clicks
        if (event.which == 3)
        { return false; }

        // Find the component this mouse event addresses
        var target = event.target;

        var $target = $(target),
            mouseTrap = $target.closest('.socrata-cf-mouse').length > 0 ||
                // Capture scrollbar clicks; or as a side effect, just general clicks in this div
                $target.hasClass('socrata-cf-side');

        // If they are interacting with the properties editor, let them
        // Or, if the component explicitly disables mouse interaction
        // (by adding the socrata-cf-mouse class) and we're *not*
        // in editOnly mode, don't fire events
        if ((mouseTrap && !$.cf.configuration().editOnly) ||
             $target.closest('#color_selector').length > 0 ||
             $target.closest('.colorpicker').length > 0 )
        { return; }

        focusOnTarget(target);
    };

    function onBodyMouseOver(e)
    {
        if (hoverFocusDisabled) { return; }

        var target = e.target;
        while (target && !target._comp)
        { target = target.parentNode; }
        if (!$.isBlank(target) && hoverFocus == target._comp)
        { return; }

        if (!$.isBlank(hoverFocus))
        { hoverFocus.dragFocus(false); }

        if ($.isBlank(target) || !target._comp.canEdit('drag'))
        { return; }

        hoverFocus = target._comp;
        hoverFocus.dragFocus(true);
    };

    function disableHoverFocus()
    {
        hoverFocusDisabled = true;
        if (!$.isBlank(hoverFocus))
        { hoverFocus.dragFocus(false); }
    };

    function enableHoverFocus()
    {
        hoverFocusDisabled = false;
    };

    function exitEditMode()
    {
        $.cf.edit.reset();
        $.cf.edit(false);
    };

    var designing = false;
    var originalConfiguration;
    var options;

    var defaultOptions = {
        canAdd: true,     // Can you add new components?
        editOnly: false,  // Are components always in edit mode?
        edit: true,       // Start edit mode once initalized?
        mask: true,       // Mask out the background when editing a component?
        sidebar: true     // Show the sidebar?
    };

    $.extend($.cf, {
        initialize: function(opts)
        {
            $.cf.configuration(opts || {});
            var page = blist.configuration.page;

            var $body = $('body');
            var $wrapper = $.tag({ tagName: 'div', 'class': 'cfEditingWrapper' });
            $body.append($wrapper);
            $wrapper.css('background-color', $body.css('background-color'))
                .append($body.children('.siteOuterWrapper, #siteFooter'));

            var $top = $.tag({ tagName: 'div', 'class': 'cfEditingBar', contents: [
                { tagName: 'div', 'class': 'editTitle', contents: [
                    { tagName: 'span', contents: 'Editing&nbsp;' },
                    { tagName: 'span', 'class': 'pageName', contents: page.name }
                ] },
                { tagName: 'ul', 'class': 'actionBar', contents: [
                    { tagName: 'li', contents:
                        { tagName: 'a', href: '#undo', 'class': ['undo', 'button', 'ss-replay'],
                            contents: 'Undo' } },
                    { tagName: 'li', contents:
                        { tagName: 'a', href: '#redo', 'class': ['redo', 'button', 'ss-refresh'],
                            contents: 'Redo' } },
                    { tagName: 'li', 'class': 'separator', contents:
                        { tagName: 'a', href: '#settings', 'class': ['settings', 'button', 'ss-settings'],
                            contents: 'Settings' } },
                    { tagName: 'li', 'class': 'separator', contents:
                        { tagName: 'a', href: '#save', 'class': ['save', 'button'],
                            contents: 'Save' } },
                    { tagName: 'li', contents:
                        { tagName: 'a', href: '#revert', 'class': ['revert', 'button'],
                            contents: 'Revert' } }
                ] }
            ] });
            $body.append($top);

            $top.find('.actionBar a').click(function(e)
            {
                e.preventDefault();
                // Blur immediately so any edits take effect
                $.cf.blur(true);
                var action = $.hashHref($(this).attr('href'));
                var prefix = action == 'undo' || action == 'redo' ? $.cf.edit : $.cf;
                prefix[action]();
            });

            $.cf.edit.registerListener(function(undoable, redoable)
            {
                $top.toggleClass('can-save', $.cf.edit.dirty === true);
                $top.toggleClass('can-undo', undoable);
                $top.toggleClass('can-redo', redoable);
            });

            $.cf.edit($.cf.configuration().edit);
        },

        // todo: checks?
        configuration: function(opts)
        {
            if (opts)
            { options = $.extend({}, defaultOptions, opts); }
            return options;
        },

        edit: function(edit)
        {
            edit = !!edit;
            if (designing != edit)
            {
                designing = this.designing = edit;
                $.cf.side(!$.cf.configuration().sidebar ? false : edit);
                $body.toggleClass('configuring', edit);
                $body[edit ? 'on' : 'off']('click', onBodyClick);
                $body[edit ? 'on' : 'off']('keydown', onBodyKeyDown);
                $body[edit ? 'on' : 'off']('mouseover', '.socrata-component', onBodyMouseOver);
                if (!edit)
                { $.cf.blur(true); }

                if (designing)
                { originalConfiguration = []; }
                $.component.eachRoot(function(root)
                {
                    root.design(designing);
                    if ($.cf.configuration().editOnly)
                    { root.edit(designing); }
                    if (originalConfiguration)
                    { originalConfiguration.push([ root, root.properties() ]); }
                });
            }
        },

        save: function()
        {
            if ($.cf.edit.dirty)
            {
                var spinner = $('.socrata-page').loadingSpinner({overlay: true});
                spinner.showHide(true);
                var page = blist.configuration.page;
                var content = [];
                $.component.eachRoot(function(root)
                { content.push(root._propRead()); });
                if (content.length == 1)
                { page.content = content[0]; }
                else
                { page.content = content; }
                page.locale = $.locale.updated();
                $.ajax({
                    type: 'POST',
                    url: '/id/pages',
                    data: JSON.stringify(page),
                    dataType: 'json',
                    contentType: 'text/json',

                    complete: function()
                    { spinner.showHide(false); },

                    success: function()
                    {
                        $.locale.initialize(page.locale);
                        exitEditMode();
                    },

                    error: function()
                    {
                        // TODO -- what to do with error?
                    }
                });
            }
            else
            { exitEditMode(); }
        },

        revert: function()
        {
            if (originalConfiguration && $.cf.edit.dirty)
            {
                _.each(originalConfiguration, function(pair) { pair[0].properties(pair[1]); });
                originalConfiguration = undefined;
            }

            exitEditMode();
        },

        settings: function()
        {
            alert('Coming Soon!');
            // Include access to translate here
        },

        blur: function(unmask)
        {
            if (focal)
            {
                focal.editFocus(false);
                if (!$.cf.configuration().editOnly)
                { focal.edit(false); }
                $body.removeClass('socrata-cf-has-focal');
                $(focal.dom).removeClass('socrata-cf-focal');
                focal = undefined;
            }
            if ($mask && unmask)
            {
                $mask.remove();
                $mask = undefined;
                if ($.cf.configuration().sidebar)
                { $.cf.side.properties(); }
            }
            if (unmask)
            { enableHoverFocus(); }
        },

        focus: function(component)
        {
            if (focal == component)
            { return; }
            $.cf.blur(false);
            disableHoverFocus();
            focal = component;
            $body.addClass('socrata-cf-has-focal');
            $(focal.dom).addClass('socrata-cf-focal');
            if (!$.cf.configuration().editOnly)
            { focal.edit(true); }
            focal.editFocus(true);
            if ($.cf.configuration().sidebar)
            { $.cf.side.properties(component); }
            if (!$mask && $.cf.configuration().mask)
            {
                $mask = $('<div class="socrata-cf-mask"></div>');
                $body.prepend($mask);
            }
        }

    });
})(jQuery);
