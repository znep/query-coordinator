/**
 * This is the core "boot" logic for the Socrata component "configurator".
 */
(function($) {
    var $body = $(document.body);
    var DEFAULT_SIDE_WIDTH = 258;

    // This is the current focal component, if any
    var focal;

    // This flag is set while we have global mouse event handlers installed
    var trackingMouseDown = false;

    // The coordinate at which mouse interaction started
    var startX, startY;

    // The mask used to lighten components other than the focal component
    var $mask;

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

        // Don't track right-clicks
        if (event.which == 3) {
            return false;
        }

        // Find the component this mouse event addresses
        var target = event.target;

        var $target = $(target),
            mouseTrap = $target.closest('.socrata-cf-mouse').length > 0;

        // If they are interacting with the properties editor, let them
        // Or, if the component explicitly disables mouse interaction
        // (by adding the socrata-cf-mouse class) and we're *not*
        // in editOnly mode, don't fire events
        if ((mouseTrap && !$.cf.configuration().editOnly) ||
             $target.closest('#color_selector').length > 0 ||
             $target.closest('.colorpicker').length > 0 )
        { return; }

        while (target && !target._comp)
            target = target.parentNode;

        // Simply unfocus if there is no target
        if (!target) {
            $.cf.blur(true);
            return;
        }

        // Ensure focus is directed at the interaction component
        $.cf.focus(target._comp);

        // We let this pass through above so that we can properly
        // track focus, but we stillwant to disable drag-tracking since
        // the component specifically disabled it
        if (mouseTrap && $.cf.configuration().editOnly)
        { return; }


        // Listen for drag unless this is a root component or immobilized by container
        if (target._comp.parent && target._comp.parent.drag !== false) {
            // Bind mouse events so we can detect drag-start
            $body.bind('mousemove.configurator-interaction', onBodyMouseMove);
            $body.bind('mouseup.configurator-interaction', onBodyMouseUp);

            // Record keeping
            trackingMouseDown = true;
            startX = event.pageX;
            startY = event.pageY;
        }

        return;
    }

    function exitEditMode() {
        $.cf.edit.reset();
        $.cf.edit(false);
    }

    var designing = false;
    var originalConfiguration;
    var options;

    var defaultOptions = {
        canAdd: true,     // Can you add new components?
        editOnly: false,  // Are components always in edit mode?
        edit: true,       // Start edit mode once initalized?
        mask: true,       // Mask out the background when editing a component?
        sidebar: true,    // Show the sidebar?
        sidebarWidth: DEFAULT_SIDE_WIDTH
    };

    $.extend($.cf, {
        initialize: function($top, opts)
        {
            $.cf.configuration(opts || {});

            $top.append($.tag({tagName: 'div', 'class': 'edit-mode', contents: [
                {tagName: 'a', href: '#save', 'class': 'save', contents: 'save'},
                {tagName: 'a', href: '#cancel', 'class': 'cancel', contents: 'cancel'},
                {tagName: 'a', href: '#undo', 'class': 'undo', contents: 'undo'},
                {tagName: 'a', href: '#redo', 'class': 'redo', contents: 'redo'},
                {tagName: 'a', href: '#translate', 'class': 'translate', contents: 'translate' }
            ]}));

            $top.find('.edit-mode a').click(function(e)
                {
                    e.preventDefault();
                    var action = $.hashHref($(this).attr('href'));
                    var prefix = action == 'undo' || action == 'redo' ? $.cf.edit : $.cf;
                    prefix[action]();
                });

            $.cf.edit.registerListener(function(undoable, redoable) {
                $top.toggleClass('can-save', $.cf.edit.dirty === true);
                $top.toggleClass('can-undo', undoable);
                $top.toggleClass('can-redo', redoable);
            });

            $.cf.edit($.cf.configuration().edit);
        },

        // todo: checks?
        configuration: function(opts) {
            if (opts) {
                options = $.extend({}, defaultOptions, opts);
            }
            return options;
        },

        edit: function(edit) {
            edit = !!edit;
            if (designing != edit) {
                designing = this.designing = edit;
                $.cf.side(!$.cf.configuration().sidebar ? false : edit);
                $body.toggleClass('configuring');
                $body[edit ? 'on' : 'off']('mousedown', onBodyMouseDown);
                if (!edit)
                    $.cf.focus();

                if (designing)
                    originalConfiguration = [];
                $.component.eachRoot(function(root) {
                    root.design(designing);
                    if ($.cf.configuration().editOnly)
                        root.edit(designing);
                    if (originalConfiguration)
                        originalConfiguration.push([ root, root.properties() ]);
                });
            }
        },

        save: function() {
            if ($.cf.edit.dirty) {
                var spinner = $('.socrata-page').loadingSpinner({overlay: true});
                spinner.showHide(true);
                var page = blist.configuration.page;
                var content = [];
                $.component.eachRoot(function(root) {
                    content.push(root._propRead());
                });
                if (content.length == 1)
                    page.content = content[0];
                else
                    page.content = content;
                page.locale = $.locale.updated();
                $.ajax({
                    type: 'POST',
                    url: '/id/pages',
                    data: JSON.stringify(page),
                    dataType: 'json',
                    contentType: 'text/json',

                    complete: function() {
                        spinner.showHide(false);
                    },

                    success: function() {
                        var historyDone = function() {
                            if (page.path && window.location.pathname != page.path) {
                                if (_.isFunction(window.history.pushState)) {
                                    window.history.pushState({}, page.name, page.path);
                                }
                                else {
                                    window.location.pathname = page.path;
                                }
                            }
                        }
                        // clear the rails page cache
                        $.ajax({
                            type: 'POST',
                            url: '/protected/page_edit',
                            success: historyDone
                        });

                        $.locale.initialize(page.locale);
                        exitEditMode();
                    },

                    error: function() {
                        // TODO -- what to do with error?
                    }
                });
            } else
                exitEditMode();
        },

        cancel: function() {
            if (originalConfiguration && $.cf.edit.dirty) {
                _.each(originalConfiguration, function(pair) {
                    pair[0].properties(pair[1]);
                });
                originalConfiguration = undefined;
            }

            exitEditMode();
        },

        blur: function(unmask) {
            if (focal) {
                focal.editFocus(false);
                if (!$.cf.configuration().editOnly)
                  focal.edit(false);
                $body.removeClass('socrata-cf-has-focal');
                $(focal.dom).removeClass('socrata-cf-focal');
                focal = undefined;
            }
            if ($mask && unmask) {
                $mask.remove();
                $mask = undefined;
                if ($.cf.configuration().sidebar)
                    $.cf.side.properties();
            }
        },

        focus: function(component) {
            if (focal == component)
                return;
            $.cf.blur(false);
            focal = component;
            $body.addClass('socrata-cf-has-focal');
            $(focal.dom).addClass('socrata-cf-focal');
            if (!$.cf.configuration().editOnly)
                focal.edit(true);
            focal.editFocus(true);
            if ($.cf.configuration().sidebar)
                $.cf.side.properties(component);
            if (!$mask && $.cf.configuration().mask) {
                $mask = $('<div class="socrata-cf-mask"></div>');
                $body.prepend($mask);
            }
        }

    });
})(jQuery);
