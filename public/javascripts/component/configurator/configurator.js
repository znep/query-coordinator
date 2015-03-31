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
        if (!target || !target._comp.canEdit('focus') ||
            $(target).closest('.cfEditingWrapper').length < 1 ||
            // Clicking on the root should defocus for easier interaction;
            // plus the root container has no config options at all
            $(target).parent().hasClass('cfEditingWrapper'))
        {
            $.cf.blur(true);
            return false;
        }

        // Ensure focus is directed at the interaction component
        $.cf.focus(target._comp);
        return target;
    };

    var onBodyKeyDown = function(event)
    {
        switch (event.which)
        {
            case 9: // Tab
                // We need to notify components that they lost focus
                // as the browser will jump away on Tab
                _.defer(function()
                {
                    var active = document.activeElement;
                    if (active)
                    { focusOnTarget(active); }
                    else
                    { $.cf.blur(true); }
                });
                break;
            case 13: // Enter
                if (!$.isBlank(focal))
                { $.cf.focus(focal); }
                break;
            case 27: // ESC
                if (!$.isBlank(focal))
                {
                    var curF = focal;
                    var wasEditing = curF.isEditing();
                    $.cf.blur(true);
                    if (wasEditing)
                    { $.cf.focus(curF); }
                }
                break;
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
                $target.closest('.socrata-cf-side').length > 0;

        // If they are interacting with the properties editor or toolbar, let them
        // Or, if the component explicitly disables mouse interaction
        // (by adding the socrata-cf-mouse class) and we're *not*
        // in editOnly mode, don't fire events

        if ((mouseTrap && !$.cf.configuration().editOnly) ||
             $target.closest('#color_selector').length > 0 ||
             $target.closest('.colorpicker').length > 0 ||
             $target.closest('.hallobetterlink').length > 0)
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
        $previewCont.removeClass('hide').width('').siblings().addClass('hide');
        $body.find('.siteOuterWrapper').fullScreen().disable();
        $.component.root().show();
        $.component.root('edit').hide();
        _.defer(function() { $(window).resize(); });
        // Remove ?_edit_mode=true url param reload
        window.location.href = window.location.href.replace(/\?_edit_mode=true/, '');
    };

    var pullConfig = function()
    {
        var page = blist.configuration.page;
        page.update({ content: $.component.root().properties(),
            data: $.dataContext.currentContexts() });
        return page;
    };

    var designing = false;
    var originalConfiguration;

    var defaultOptions = {
        canAdd: blist.configuration.canvasX || blist.configuration.govStat,  // Can you add new components?
        editOnly: false,  // Are components always in edit mode?
        edit: true,       // Start edit mode once initalized?
        mask: true,       // Mask out the background when editing a component?
        sidebar: true     // Show the sidebar?
    };
    var options = $.extend({}, defaultOptions);

    var $viewOptions;
    var $viewsCont;
    var $previewCont;
    var $editCont;

    $.extend($.cf, {
        initialize: function(opts)
        {
            $.cf.configuration(opts || {});
            var page = blist.configuration.page;

            var $body = $('body');
            var $cont = $.tag2({ _: 'div', className: 'cfMainContainer' });
            $body.find('.siteInnerWrapper').append($cont);

            var $top = $.tag2({ _: 'div', className: 'cfEditingBar', contents: [
                { _: 'div', className: 'editTitle', contents: [
                    { _: 'span', contents: $.t('dataslate.edit.editing') + '&nbsp;' },
                    { _: 'span', className: 'pageName', contents: page.name }
                ] },
                { _: 'ul', className: 'actionBar', contents: [
                    { _: 'li', contents:
                        { _: 'ul', className: ['pillButtons', { i: blist.configuration.govStat, t: 'hide' }],
                            contents: [
                            { _: 'li', contents:
                                { _: 'a', href: '#preview', className: ['preview', 'ss-icon'],
                                    title: $.t('dataslate.edit.preview_page'), contents: 'desktop' } },
                            { _: 'li', contents:
                                { _: 'a', href: '#interactive', className: ['interactive', 'ss-icon'],
                                    title: $.t('dataslate.edit.view_editor'), contents: 'layout' } }
                    ] } },
                    { _: 'li', contents:
                        { _: 'a', href: '#undo', className: ['undo', 'button', 'ss-replay'],
                            contents: $.t('dataslate.edit.undo') } },
                    { _: 'li', contents:
                        { _: 'a', href: '#redo', className: ['redo', 'button', 'ss-refresh'],
                            contents: $.t('dataslate.edit.redo') } },
                    { _: 'li', className: 'separator', contents:
                        { _: 'a', href: '#permissions', className: ['permissions', 'button', 'ss-users'],
                            contents: $.t('dataslate.edit.permissions') } },
                    { _: 'li', contents:
                        { _: 'a', href: '#settings', className: ['settings', 'button', 'ss-settings'],
                            contents: $.t('dataslate.edit.settings') } },
                    { _: 'li', className: 'separator', contents:
                        { _: 'a', href: '#save', className: ['save', 'button'],
                            contents: $.t('dataslate.edit.save') } },
                    { _: 'li', contents:
                        { _: 'a', href: '#saveCopy', className: ['saveCopy', 'button'],
                            contents: $.t('dataslate.edit.save_as') } },
                    { _: 'li', contents:
                        { _: 'a', href: '#revert', className: ['revert', 'button'],
                            contents: $.t('dataslate.edit.revert') } }
                ] }
            ] });
            $cont.append($top);

            $top.find('.actionBar > li > a').click(function(e)
            {
                e.preventDefault();
                // Blur immediately so any edits take effect
                $.cf.blur(true);
                var action = $.hashHref($(this).attr('href'));
                var prefix = action == 'undo' || action == 'redo' ? $.cf.edit : $.cf;
                prefix[action]();
            });

            $viewOptions = $top.find('.actionBar .pillButtons a');
            $viewOptions.filter('.interactive').addClass('active');
            $viewOptions.click(function(e)
            {
                e.preventDefault();
                // Blur immediately so any edits take effect
                $.cf.blur(true);
                var $a = $(this);
                var view = $.hashHref($a.attr('href'));
                var isHide = $a.hasClass('active');
                if (isHide && $viewOptions.filter('.active').length < 2)
                { return; }

                $a.toggleClass('active', !isHide);
                $.cf.showView(view, !isHide);
            });

            $.cf.edit.registerListener(function(undoable, redoable)
            {
                $top.toggleClass('can-save', $.cf.edit.dirty === true);
                $top.toggleClass('can-undo', undoable);
                $top.find('.undo').toggleClass('disabled', !undoable)
                                  .attr('title', undoable ? ''
                                                          :$.t('dataslate.configurator.undo_title'));
                $top.toggleClass('can-redo', redoable);
                $top.find('.redo').toggleClass('disabled', !redoable)
                                  .attr('title', redoable ? ''
                                                          :$.t('dataslate.configurator.redo_title'));
            });

            $viewsCont = $.tag2({ _: 'div', className: 'cfViewsContainer' });
            $cont.append($viewsCont);

            $previewCont = $.tag2({ _: 'div', className: ['cfPreviewWrapper', 'cfViewTypeWrapper'],
                contents: { _: 'div', className: 'cfViewInnerWrapper' } });
            $viewsCont.append($previewCont);
            $previewCont.css('background-color', $body.css('background-color'))
                .find('.cfViewInnerWrapper').append($body.find('.siteContentWrapper'));
            $previewCont.resizable({
                handles: 'e',
                maxWidth: $viewsCont.width() * 0.8, minWidth: $viewsCont.width() * 0.2,
                resize: function()
                {
                    var vcw = $viewsCont.width();
                    $editCont.width(Math.floor((vcw - $previewCont.width()) / vcw * 100) + '%');
                },
                start: function()
                { $previewCont.resizable('option', 'maxWidth', $viewsCont.width() * 0.8); },
                stop: function()
                {
                    var vcw = $viewsCont.width();
                    var ew = Math.floor((vcw - $previewCont.width()) / vcw * 100);
                    $editCont.width(ew + '%');
                    $previewCont.width((100 - ew) + '%');
                    $viewsCont.children().quickEach(function()
                    {
                        var $t = $(this);
                        $t.data('editWidth', Math.floor(($t.width() / vcw) * 100));
                    });
                }
            });

            var editContent = $.component.root().properties();
            $editCont = $.tag2({ _: 'div', className: ['cfEditingWrapper', 'cfViewTypeWrapper'] });
            $viewsCont.append($editCont);
            $editCont.css('background-color', $body.css('background-color'))
                .append($.tag2({ _: 'div', id: 'edit_' + editContent.id, className: 'editRoot' }));

            $('.socrataModalWrapper').on('submit', function(e)
            {
                $('.socrataModalWrapper .actions .save').click();
            });

            $('.socrataModalWrapper').on('click', '#configuratorPermissions .actions .save', function(e)
            {
                e.preventDefault();
                var $permissionsDialog = $(this).closest('#configuratorPermissions');

                var newPage = blist.configuration.page;
                newPage.update({ permission: $permissionsDialog.find(':radio:checked').val() });
                $.cf.edit.dirty = true;
                var $spinner = $permissionsDialog.find('.loadingOverlay');
                $spinner.removeClass('hide');

                $.cf.save(newPage, function()
                {
                    $spinner.addClass('hide');
                    $.popModal();
                });
            });

            $('.socrataModalWrapper').on('click', '#configuratorSettings .actions .save', function(e)
            {
                e.preventDefault();
                var $settingsDialog = $(this).closest('#configuratorSettings');
                if (!$settingsDialog.find('form').valid())
                { return; }

                var isCopy = $settingsDialog.data('isCopy');
                var newPage = blist.configuration.page.clone();
                newPage.update({ name: $settingsDialog.find('[name=pageTitle]').value() });

                $.cf.edit.dirty = true;
                var $spinner = $settingsDialog.find('.loadingOverlay');
                $settingsDialog.find('.errorMessage').addClass('hide');
                $spinner.removeClass('hide');

                if (!isCopy)
                {
                    newPage.update({ path: $settingsDialog.find('[name=pageUrl]').value() });
                    $.cf.save(newPage, function(__, flags)
                    {
                        $top.find('.editTitle .pageName').text(newPage.name);
                        $spinner.addClass('hide');
                        $.popModal();
                        if ($.subKeyDefined(flags, 'oldPath'))
                        { window.location = newPage.path + '?_edit_mode=true'; }
                    }, function(err)
                    {
                        if ($.subKeyDefined(err, 'duplicatePath'))
                        {
                            $spinner.addClass('hide');
                            $settingsDialog.find('.errorMessage').removeClass('hide').text(newPage.path +
                                ' already exists; please choose a different path');
                        }
                    });
                }
                else
                {
                    Page.uniquePath(newPage.name, blist.configuration.govStat ? '/reports/' : '',
                    function(path)
                    {
                        newPage.saveCopy({ path: path }, function(newReport)
                        {
                            $spinner.addClass('hide');
                            $.popModal();
                            window.location = newReport.path + '?_edit_mode=true';
                        });
                    });
                }
            });

            $body.find('.siteOuterWrapper').fullScreen({ fullHeightSelector: '.notUsedNoConflict'});

            // Make sure all dom manipulation is done before starting edit mode
            _.defer(function()
            {
                $.component.initialize(editContent, 'edit');
                $.cf.edit($.cf.configuration().edit);
            });
        },

        showView: function(view, isShow)
        {
            switch (view)
            {
                case 'preview':
                    $previewCont.toggleClass('hide', !isShow);
                    $.component.root().setVisibility(isShow);
                    break;
                case 'interactive':
                    $editCont.toggleClass('hide', !isShow);
                    $.component.root('edit').setVisibility(isShow);
                    if ($.cf.configuration().sidebar)
                    { $.cf.side(designing && isShow); }
                    break;
            }

            var $children = $viewsCont.children(':visible');
            var totalW = 0;
            var items = [];
            $children.quickEach(function()
            {
                var $t = $(this);
                var w = $t.data('editWidth') || Math.floor(100 / $children.length);
                totalW += w;
                items.push({ $dom: $t, width: w });
            });
            _.each(items, function(item)
            {
                item['$dom'].width(Math.floor(item.width / totalW * 100) + '%');
            });

            $previewCont.find('.ui-resizable-handle').toggleClass('hide', $children.length < 2);

            // Blunt instrument
            $(window).resize();
        },

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
                if ($.cf.configuration().sidebar)
                { $.cf.side(edit); }
                $body.toggleClass('configuring', edit);
                $body[edit ? 'on' : 'off']('click', onBodyClick);
                $body[edit ? 'on' : 'off']('keydown', onBodyKeyDown);
                $body[edit ? 'on' : 'off']('mouseover', '.socrata-component', onBodyMouseOver);
                if (!edit)
                { $.cf.blur(true); }

                if (designing)
                {
                    originalConfiguration = _.map($.component.root(true), function(root)
                        { return { component: root, properties: root.properties() }; });

                    var root = $.component.root('edit');
                    root.design(designing);
                    if ($.cf.configuration().editOnly)
                    { root.edit(designing); }

                    $body.find('.siteOuterWrapper').fullScreen().enable();

                    $viewsCont.children().quickEach(function()
                    {
                        var $t = $(this);
                        if (!$.isBlank($t.data('editWidth')))
                        { $t.width($t.data('editWidth') + '%'); }
                    });

                    // Check each view button, and sync actual view state with buttons
                    $viewOptions.quickEach(function()
                    {
                        var $a = $(this);
                        $.cf.showView($.hashHref($a.attr('href')), $a.hasClass('active'));
                    });
                }
            }
        },

        save: function(newPage, finishCallback, errorCallback)
        {
            if (!_.isFunction(finishCallback))
            { finishCallback = function() { exitEditMode(); }; }

            if ($.cf.edit.dirty)
            {
                var spinner = $('.socrata-page').loadingSpinner({ metric: 'dataslate-configurator' });
                spinner.showHide(true);
                if ($.isBlank(newPage))
                { newPage = pullConfig(); }

                newPage.save(function(resp)
                    {
                        spinner.showHide(false);
                        blist.configuration.page = resp;
                        if (_.isFunction(finishCallback))
                        { finishCallback.apply(this, arguments); }
                    },
                    function()
                    {
                        spinner.showHide(false);
                        if (_.isFunction(errorCallback))
                        { errorCallback.apply(this, arguments); }
                        // TODO -- what to do with error?
                    }
                );
            }
            else
            { finishCallback(); }
        },

        revert: function()
        {
            if (!_.isEmpty(originalConfiguration) && $.cf.edit.dirty)
            {
                _.each(originalConfiguration, function(item)
                        { item.component.properties(item.properties); });
                originalConfiguration = undefined;
            }

            exitEditMode();
        },

        permissions: function()
        {
            var $permissionsDialog = $.showModal('configuratorPermissions');
            var $allRadio = $permissionsDialog.find(':radio');
            $allRadio.value(false);
            $allRadio.filter('[value=' +
                    (blist.configuration.page.permission || 'public') + ']').value(true);
            $allRadio.uniform();
        },

        settings: function()
        {
            var $settingsDialog = $.showModal('configuratorSettings');
            $settingsDialog.find('form').validate({errorElement: 'span', ignore: ':hidden',
                    errorPlacement: function($error, $element)
                        { $error.appendTo($element.closest('.line')); }});
            $settingsDialog.find('[name=pageTitle]').value(blist.configuration.page.name);
            $settingsDialog.find('[name=pageUrl]').value(blist.configuration.page.path);
            $settingsDialog.find('.errorMessage').addClass('hide');
            // Include access to translate here
        },

        saveCopy: function()
        {
            var $settingsDialog = $.showModal('configuratorSettings');
            $settingsDialog.find('form').validate({errorElement: 'span', ignore: ':hidden',
                    errorPlacement: function($error, $element)
                        { $error.appendTo($element.closest('.line')); }});
            $settingsDialog.find('[name=pageTitle]').value('Copy of ' + blist.configuration.page.name);
            $settingsDialog.find('[name=pageUrl]').closest('.line').addClass('hide');
            $settingsDialog.find('.errorMessage').addClass('hide');
            $settingsDialog.find('h2').text($.t('dataslate.edit.save_as'));
            $settingsDialog.data('isCopy', true);
        },

        blur: function(unmask)
        {
            if (!$.isBlank(focal))
            {
                // Make this safe from editFocus triggering something that
                // re-calls blur later in the call-stack
                var localFocal = focal;
                focal = undefined;
                localFocal.select(false);
                if (localFocal.isEditing())
                {
                    localFocal.editFocus(false);
                    if (!$.cf.configuration().editOnly)
                    { localFocal.edit(false); }
                }
                $body.removeClass('socrata-cf-has-focal');
                $(localFocal.dom).removeClass('socrata-cf-focal');
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

        focus: function(component, directEdit)
        {
            if (focal == component)
            {
                if (focal.isEditing())
                { return; }

                // Stay on target...
                focal.select(false);
                disableHoverFocus();
                if (!$.cf.configuration().editOnly)
                { focal.edit(true); }
                focal.editFocus(true);
                if ($.cf.configuration().sidebar)
                { $.cf.side.properties(component); }

                if (!$mask && $.cf.configuration().mask)
                {
                    $mask = $.tag2({ _: 'div', className: 'socrata-cf-mask' });
                    focal.$dom.closest('.cfEditingWrapper').prepend($mask);
                }

                return;
            }
            $.cf.blur(true);
            focal = component;
            $body.addClass('socrata-cf-has-focal');
            focal.$dom.addClass('socrata-cf-focal');
            focal.select(true);
            if (directEdit)
            { $.cf.focus(component); }
        }

    });
})(jQuery);
