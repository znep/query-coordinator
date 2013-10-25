(function($)
{
    /*
        + name: required, identification of this config.  If this has a period in
            it, the first part is taken as the parent name.  Multiple panes
            can be grouped under a parent, in which case each pane title is
            shown in a sub-select bar.
            If the parent pane does not already exist, then the name is simply
            capitalized and used as the title. More information may be added
            later (such as a subtitle or custom title), and all
            previously-initialized sub-panes will be kept.  All sub-panes need
            to be added before any child or the parent pane is actually added
            to make sure the sub-select bar is initialized properly
        + priority: Order of the pane among siblings
    */

    var paneConfigs = {};

    $.gridSidebar =
    {
        registerConfig: function(name, controlName, priority, displayTypes)
        {
            var forceOldVisualize = $.urlParam(window.location.href, 'visualize') == 'old' || blist.configuration.oldChartConfigForced;
            var isNewVisualize = $.urlParam(window.location.href, 'visualize') == 'nextgen' || (blist.configuration.newChartConfig && !forceOldVisualize);
            if (name == 'new_chart_create' && !isNewVisualize) { return; }

            if ($.isBlank(name)) { throw 'Sidebar config requires a name'; }

            _.each($.makeArray(displayTypes || []), function(dt)
                { $.gridSidebar.paneForDisplayType[dt] = name; });

            var config = {name: name, priority: priority || 1, controlName: controlName};
            var p = name.split('.');
            if (p.length == 1)
            { paneConfigs[name] = $.extend(paneConfigs[name], config); }
            else if (p.length == 2)
            {
                var primary = p[0];
                if ($.isBlank(paneConfigs[primary]))
                {
                    paneConfigs[primary] = {name: primary, isParent: true,
                        title: $.tNull('controls.common.sidebar.tabs.' + primary) || primary.replace(/([a-z]+)([A-Z])/g, '$1 $2').capitalize(), subPanes: {}};
                }
                config.name = p[1];
                config.parent = paneConfigs[primary];
                paneConfigs[primary].subPanes[p[1]] = config;
            }
            else
            { throw "Pane config: can't name with more than one or two parts"; }
        },

        paneForDisplayType: {}
    };

    $.Control.extend('gridSidebar',
    {
        _init: function ()
        {
            var sidebarObj = this;
            sidebarObj._super.apply(this, arguments);

            var $domObj = sidebarObj.$dom();
            $domObj.find('a.close').click(function(e)
            {
                e.preventDefault();
                sidebarObj.hide();
            });

            $domObj.addClass('hide position-' + sidebarObj.settings.position);
            $domObj.attr('aria-live', 'polite');

            $(window).resize(function() { handleResize(sidebarObj); });
            $domObj.resize(function() { handleResize(sidebarObj); });

            // We have a potential hard-to-detect layout cycle here because of the defer call below.
            // When we call setPosition, we need to let our neighbor know we've resized
            // it. However, this usually triggers another resize on us. We try to break
            // that cycle by ignoring the resize if the size hasn't changed. As a fallback,
            // we maintain a maximum number of pending resize calls. If that limit is hit,
            // stop servicing resizes until all resize calls finish. This will break the
            // cycle.
            sidebarObj._setPositionCount = 0;
            sidebarObj._setPositionMaxCount = 50;
            sidebarObj._resizeBlocked = false;
            sidebarObj._lastWidth = -1;
            sidebarObj._lastHeight = -1;
            sidebarObj._resizeNotReady = false;

            sidebarObj._ready = true;
            if (sidebarObj.settings.waitOnDataset && !$.isBlank(sidebarObj.settings.view) &&
                sidebarObj.settings.view.viewType == 'tabular')
            {
                sidebarObj._ready = false;
                // We need to make sure the view is available
                // before launching the sidebar
                sidebarObj.settings.view.bind('row_count_change', function()
                {
                    if (sidebarObj._ready) { return; }
                    _.defer(function() {
                        if (!$.isBlank(sidebarObj._paneToShow))
                        {
                            sidebarObj.show(sidebarObj._paneToShow);
                            delete sidebarObj._paneToShow;
                        }
                    });
                    sidebarObj._ready = true;
                });
            }

            if (!$.isBlank(sidebarObj.settings.view))
            {
                var setCurSize = function()
                {
                    if ($.subKeyDefined(sidebarObj.settings.view, 'metadata.sidebar.width'))
                    { $domObj.width(sidebarObj.settings.view.metadata.sidebar.width); }
                    else
                    { $domObj.css('width', ''); }
                    $(window).resize();
                };
                sidebarObj.settings.view.bind('clear_temporary', setCurSize);
                setCurSize();

                sidebarObj.settings.view.bind('permissions_changed', function()
                    { sidebarObj.updateEnabledSubPanes(); });
            }

            $domObj.resizable({
                handles: sidebarObj.settings.position == 'left' ? 'e' : 'w',
                maxWidth: $(window).width() * 0.8, minWidth: 300,
                stop: function() { resizeDone(sidebarObj); }});
        },

        $neighbor: function()
        {
            if (!this._$neighbor)
            { this._$neighbor = $(this.settings.resizeNeighbor); }
            return this._$neighbor;
        },

        $currentOuterPane: function()
        {
            if (!$.subKeyDefined(this._currentOuterPane, '$pane')) { return null; }

            return this._currentOuterPane.$pane;
        },

        $currentPane: function()
        {
            if (!$.subKeyDefined(this._currentPane, 'control')) { return null; }

            return this._currentPane.control.$dom();
        },

        setDefault: function(configName)
        {
            var sidebarObj = this;
            sidebarObj._defaultPane = configName;
            if ($.isBlank(sidebarObj._currentPane) && sidebarObj.hasPane(sidebarObj._defaultPane))
            { sidebarObj.show(sidebarObj._defaultPane); }
        },

        hasPane: function(configName)
        {
            var sidebarObj = this;
            var nameParts = getConfigNames(configName);
            var outerConfig = paneConfigs[nameParts.primary];
            if ($.isBlank(outerConfig)) { return false; }

            var config = (outerConfig.subPanes || {})[nameParts.secondary] ||
                paneConfigs[nameParts.secondary];
            return !$.isBlank(config);
        },

        getPane: function(configName)
        {
            var sidebarObj = this;
            var nameParts = getConfigNames(configName);
            var outerConfig = paneConfigs[nameParts.primary];
            if ($.isBlank(outerConfig)) { return false; }

            var config = (outerConfig.subPanes || {})[nameParts.secondary] ||
                paneConfigs[nameParts.secondary];
            return (config || {}).control;
        },

        /* Create a new pane in the sidebar */
        addPane: function(configName, data, isTempData)
        {
            var sidebarObj = this;
            var nameParts = getConfigNames(configName);
            var outerConfig = paneConfigs[nameParts.primary];
            var config = (outerConfig.subPanes || {})[nameParts.secondary] ||
                paneConfigs[nameParts.secondary];

            if ($.isBlank(config) || $.isBlank(outerConfig))
            { throw "Configuration required for gridSidebar"; }

            if ($.isBlank(outerConfig.$pane))
            { createOuterPane(sidebarObj, outerConfig); }

            if (config.isParent) { return; }

            config.control.render(data, isTempData);
            config.control.$dom().hide();
        },

        /* Show the sidebar and a specific pane in it.  If it is modal,
         * then hide/disable other parts of the UI */
        show: function(paneName, data)
        {
            var sidebarObj = this;

            if ($.isBlank(paneName)) { paneName = sidebarObj._defaultPane; }
            if ($.isBlank(paneName)) { return; }

            var np = getConfigNames(paneName);
            if ($.subKeyDefined(sidebarObj, '_currentOuterPane.name') &&
                    sidebarObj._currentOuterPane.name == np.primary &&
                    ($.subKeyDefined(sidebarObj, '_currentPane.name') &&
                     sidebarObj._currentPane.name == np.secondary || np.secondary == paneName))
            { return; }

            // Hide any other open panes
            hidePane(sidebarObj);

            if (!$.isBlank(data)) { sidebarObj.addPane(paneName, data, true); }

            if (!sidebarObj._ready)
            {
                sidebarObj._paneToShow = paneName;
                return;
            }

            var nameParts = getConfigNames(paneName);
            var outerConfig = paneConfigs[nameParts.primary];
            var config = (outerConfig.subPanes || {})[nameParts.secondary] ||
                paneConfigs[nameParts.secondary];

            if ($.isBlank(config)) { return; }

            // Make sure our pane exists
            if ($.isBlank(outerConfig.$pane) || (!config.isParent && $.isBlank(config.control)))
            { sidebarObj.addPane(paneName); }

            // Refresh our pane if needed
            if (!$.isBlank(config.control)) { config.control.render(); }

            sidebarObj._currentOuterPane = outerConfig;
            sidebarObj.$currentOuterPane().show();
            if (!config.isParent)
            {
                sidebarObj._currentPane = config;
                sidebarObj.$currentOuterPane().find('.headerLink[data-paneName="' +
                    nameParts.secondary + '"]').addClass('selected');

                _.defer(function()
                {
                    // IE7 leaves weird debris when closing if we use an
                    // animation
                    if ($.browser.msie && $.browser.majorVersion <= 7)
                    {
                        sidebarObj.$currentPane().show();
                        _.defer(function()
                        {
                            if (!$.isBlank(config.control)) { config.control.validatePane(); }
                        });
                    }
                    else
                    {
                        var $cp = sidebarObj.$currentPane();
                        if (!$.isBlank($cp))
                        {
                            $cp.slideDown(function()
                            {
                                if (!$.isBlank(config.control)) { config.control.validatePane(); }
                            });
                        }
                    }
                });
            }


            // Adjust positions for the sidebar
            setPosition(sidebarObj);

            sidebarObj.updateEnabledSubPanes();

            // The big reveal
            sidebarObj.$dom().removeClass('hide');

            $(window).resize();

            if (!config.isParent)
            {
                if ($.device.ipad)
                { var scroller = new iScroll(sidebarObj.$currentOuterPane().find('.panes').get(0)); }
            }
            else
            {
                // Open the last enabled pane by default, or the last one if none are enabled
                var $a = sidebarObj.$currentOuterPane().find('.headerLink:not(.disabled):last');
                if ($a.length < 1)
                { $a = sidebarObj.$currentOuterPane().find('.headerLink:last'); }
                sidebarObj.show(outerConfig.name + '.' + $a.attr('data-paneName'));
            }

            sidebarObj.settings.onSidebarShown(nameParts.primary, nameParts.secondary);
            if (!$.isBlank(config.control)) { config.control.shown(); }
            $('ul#moreActionBarButtons').addClass('hide');
        },

        /* Hide the sidebar and all panes */
        hide: function(force)
        {
            var sidebarObj = this;
            if (!force && !$.isBlank(sidebarObj._defaultPane) && sidebarObj.hasPane(sidebarObj._defaultPane))
            {
                var np = getConfigNames(sidebarObj._defaultPane);
                if (sidebarObj._currentOuterPane.name != np.primary ||
                    sidebarObj._currentPane.name != np.secondary)
                {
                    sidebarObj.show(sidebarObj._defaultPane);
                    return;
                }
            }

            sidebarObj.$dom().addClass('hide');
            sidebarObj.$neighbor().css('width', '').css('left', '');

            hidePane(sidebarObj);

            // In non-IE we need to trigger a resize so the grid restores
            // properly.  In IE7, this will crash; IE8 works either way; IE9 requires it
            // This is only for the grid; so other types do the resize
            if (!$.browser.msie || $.browser.majorVersion > 7 || !isTable(sidebarObj))
            { $(window).resize(); }

            sidebarObj.settings.onSidebarClosed();
        },

        refresh: function(pane)
        {
            var sidebarObj = this;

            if ($.isBlank(pane))
            { pane = getFullConfigName(sidebarObj._currentOuterPane, sidebarObj._currentPane); }
            if ($.isBlank(pane)) { return; }

            var nameParts = getConfigNames(pane);
            var config = getConfig(pane);
            if ($.subKeyDefined(config, 'control'))
            { config.control.reset(); }
        },

        updateEnabledSubPanes: function()
        {
            var sidebarObj = this;

            if ($.isBlank(sidebarObj.$currentOuterPane())) { return; }

            var updateEnabled = function(sp)
            {
                if ($.isBlank(sp.control)) { return; }
                var isEnabled = sp.control.isAvailable();
                var disSub = sp.control.getDisabledSubtitle();

                var $a = sidebarObj.$currentOuterPane()
                    .find('.headerLink[data-panename="' + sp.name + '"]');
                if ($a.hasClass('disabled') != !isEnabled)
                {
                    $a.toggleClass('disabled', !isEnabled)
                        .data('title', isEnabled ?  sp.control.getSubtitle() : disSub);
                }

                if (sp.name == (sidebarObj._currentPane || {}).name)
                {
                    sp.control.$dom().toggleClass('disabled', !isEnabled)
                        .find('.disabledMessage').text(disSub);
                }
            };

            _.each(sidebarObj._currentOuterPane.subPanes ||
                $.makeArray(sidebarObj._currentOuterPane), updateEnabled);
        },

        isPaneEnabled: function(paneName)
        {
            var sidebarObj = this;

            var nameParts = getConfigNames(paneName);
            var outerConfig = paneConfigs[nameParts.primary];
            if ($.isBlank(outerConfig)) { return false; }
            var config = (outerConfig.subPanes || {})[nameParts.secondary] ||
                paneConfigs[nameParts.secondary];
            if ($.isBlank(config)) { return false; }

            if ($.isBlank(config.control)) { sidebarObj.addPane(paneName); }
            return config.control.isAvailable();
        }
    }, {
        defaultLoginMessage: 'You must be signed in',
        onSidebarClosed: function() {},
        onSidebarShown: function(primaryPane, secondaryPane) {},
        position: 'right',
        renderTypeManager: null,
        resizeNeighbor: null,
        setHeight: true,
        setSidebarTop: true,
        view: null,
        waitOnDataset: false
    });



    var isTable = function(sidebarObj)
    {
        return !$.isBlank(sidebarObj.settings.renderTypeManager) &&
            sidebarObj.settings.renderTypeManager.visibleTypes.table;
    };

    var getFullConfigName = function(outerConfig, config)
    {
        var name = outerConfig.name;
        if (outerConfig.name != config.name)
        { name = _.compact([outerConfig.name, config.name]).join('.'); }
        return name;
    };

    var getConfigNames = function(configName)
    {
        var p = configName.split('.');
        var ret = {};

        if (p.length == 1)
        { ret.primary = ret.secondary = configName; }
        else if (p.length == 2)
        {
            ret.primary = p[0];
            ret.secondary = p[1];
        }
        else
        { throw 'Only config names of 1 or 2 parts are supported'; }

        return ret;
    };

    var getConfig = function(paneName)
    {
        var nameParts = getConfigNames(paneName);
        var outerConfig = paneConfigs[nameParts.primary];
        if (outerConfig == null) { return; }
        return (outerConfig.subPanes || {})[nameParts.secondary] || paneConfigs[nameParts.secondary];
    };

    var hidePane = function(sidebarObj, paneName)
    {
        var config;
        if ($.isBlank(paneName))
        { config = sidebarObj._currentPane; }
        else
        { config = getConfig(paneName); }

        if ($.isBlank(config)) { return; }

        var outerConfig = config.parent || config;
        if (!$.isBlank(outerConfig.$pane))
        {
            outerConfig.$pane.hide()
                .find('.panes').unbind('scroll')
                .find('.headerLink.selected').removeClass('selected');
        }

        if (!$.isBlank(config.control))
        {
            // We only want to close the current pane; but it gets a bit complex...
            // We'd like to animate it closed; but animations only work if it is
            // truly visible to begin with.  Since we just hid the outerPane,
            // it might not be visible, so just hide it in that case.  But
            // if another pane is being shown next, then the outerPane will be
            // re-shown, and we can safely animate this.  We need to defer to
            // give time for that re-show to happen.
            var $curPane = config.control.$dom();
            _.defer(function()
            {
                // IE7 still doesn't animate properly, so skip it
                if ((!$.browser.msie || $.browser.majorVersion > 7) &&
                    $curPane.is(':visible')) { $curPane.slideUp(); }
                else { $curPane.hide(); }
            });
        }

        if ($.subKeyDefined(config, 'control'))
        {
            config.control.hidden();
            config.control.reset(true);
        }

        if (outerConfig == sidebarObj._currentOuterPane)
        { sidebarObj._currentOuterPane = null; }
        if (config == sidebarObj._currentPane)
        { sidebarObj._currentPane = null; }
    };

    /* Adjust the position/size of the sidebar to fit next to the grid */
    var setPosition = function(sidebarObj)
    {
        var gridHeight = sidebarObj.$neighbor().outerHeight();
        var adjH = sidebarObj.$dom().outerHeight() - sidebarObj.$dom().height();
        if (sidebarObj.settings.setHeight)
        { sidebarObj.$dom().height(gridHeight - adjH); }
        if (sidebarObj.settings.setSidebarTop)
        { sidebarObj.$dom().css('top', -gridHeight + 'px') }

        if (sidebarObj.settings.position == 'left')
        {
            sidebarObj.$dom().css('left', 0);
            sidebarObj.$neighbor().css('left', sidebarObj.$dom().outerWidth(true));
        }
        else
        { sidebarObj.$dom().css('right', 0); }

        var parW = sidebarObj.$dom().parent().innerWidth();
        sidebarObj.$neighbor().width(parW - sidebarObj.$dom().outerWidth(true) -
            (sidebarObj.$neighbor().outerWidth() - sidebarObj.$neighbor().width()));

        sidebarObj.$neighbor().resize();

        // Adjust panes section to correct height, since it is what scrolls
        var $pane = sidebarObj.$currentOuterPane();
        if (!$.isBlank($pane))
        {
            if ($pane.outerHeight() < 1)
            {
                // Not really ready to find size yet
                sidebarObj._resizeNotReady = true;
                return;
            }
            sidebarObj._resizeNotReady = false;
            var $scrollContent = $pane.find('.panes');
            $scrollContent.css('height', '');
            adjH = $pane.outerHeight() - $scrollContent.height();
            $scrollContent.height(sidebarObj.$dom().height() - adjH);
        }
    };

    /* Handle window resizing */
    var handleResize = function(sidebarObj)
    {
        var newWidth = sidebarObj.$dom().width();
        var newHeight = sidebarObj.$dom().height();

        if (newWidth == sidebarObj._lastWidth && newHeight == sidebarObj._lastHeight && !sidebarObj._resizeNotReady) { return; }

        sidebarObj._lastWidth = newWidth;
        sidebarObj._lastHeight = newHeight;

        if (sidebarObj._setPositionCount > sidebarObj._setPositionMaxCount || sidebarObj._resizeBlocked)
        {
            console.error('Layout Cycle');
            sidebarObj._resizeBlocked = true;
            return;
        }

        sidebarObj._setPositionCount ++;
        _.defer(function()
        {
            try
            {
                if (!sidebarObj.$dom().is(':hidden'))
                {
                    setPosition(sidebarObj);
                }
            }
            finally
            {
                sidebarObj._setPositionCount --;
                if (sidebarObj._setPositionCount == 0) { sidebarObj._resizeBlocked = false; } // Recover from layout cycle.
            }
        });
    };

    /* When user resize is finished */
    var resizeDone = function(sidebarObj)
    {
        // Unset left, b/c the resizable plugin sets it; but we are
        // right-positioned
        sidebarObj.$dom().css('left', '');
        $(window).resize();

        if (!$.isBlank(sidebarObj.settings.view))
        {
            var md = $.extend(true, {}, sidebarObj.settings.view.metadata);
            md.sidebar = md.sidebar || {};
            md.sidebar.width = sidebarObj.$dom().width();
            sidebarObj.settings.view.update({metadata: md}, false, true);
        }
    };


    /*** Functions related to rendering a pane ***/

    var setupPane = function(sidebarObj, config, outerConfig)
    {
        var $pane = $.tag({tagName: 'div'});
        outerConfig.$pane.find('.panes').append($pane);
        config.control = $pane[config.controlName]({
            columnChoosers: sidebarObj.settings.columnChoosers,
            renderTypeManager: sidebarObj.settings.renderTypeManager,
            view: sidebarObj.settings.view
        });
        $pane.bind('hide', function()
        {
            if (config.control.settings.name == (sidebarObj._currentPane || {}).name)
            { sidebarObj.hide(); }
        });

        if (!$.isBlank(config.parent))
        {
            var title = config.control.getTitle();
            $pane.hide().before($.tag({tagName: 'a', href: '#' + title, 'class': ['headerLink', config.name],
                data: {title: config.control.getSubtitle(), paneName: config.name},
                contents: [{tagName: 'span', 'class': 'icon'},
                    {tagName: 'span', 'class': 'title', contents: title}]}));
        }
    };

    var createOuterPane = function(sidebarObj, config)
    {
        var $outerPane = $.tag({tagName: 'div',
            id: sidebarObj.$dom().attr('id') + '_outer_' + config.name, 'class': 'outerPane'});
        config.$pane = $outerPane;

        $outerPane.append($.renderTemplate('outerPane'));

        if (!$.isBlank(config.controlName))
        { setupPane(sidebarObj, config, config); }

        $outerPane.find('.mainTitleBlock .title').text(!$.isBlank(config.control) ?
            config.control.getTitle() : config.title);

        _.each(_.sortBy(config.subPanes, function(sp) { return sp.priority; }).reverse(), function(sp)
            { setupPane(sidebarObj, sp, config); });

        $outerPane.find('.headerLink').click(function(e)
        {
            e.preventDefault();
            selectPane(sidebarObj, $(this), config.name);
        })
        .each(function()
        {
            var $this = $(this);
            var title = $(this).data('title').clean();
            if (!$.isBlank(title))
            {
                $this.socrataTip({ content: function()
                        { return $.tag({tagName: 'p', contents: $(this).data('title').clean()}, true); },
                    killTitle: true, positions: 'left' });
            }
        });

        sidebarObj.$dom().append($outerPane);
        $outerPane.hide();
    };

    var selectPane = function(sidebarObj, $a, baseName)
    {
        if ($a.is('.selected, .disabled')) { return; }

        sidebarObj.show(baseName + '.' + $a.attr('data-paneName'));
    };

})(jQuery);
