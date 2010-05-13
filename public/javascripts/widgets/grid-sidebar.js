(function($)
{
    $.validator.addMethod('notEqualTo', function(value, element, param)
    {
        if (this.optional(element)) { return true; }
        var isEqual = false;
        var $e = $(element);
        $(param).each(function(i, p)
        {
            var $p = $(p);
            if ($e.index($p) < 0 && $p.val() == value)
            {
                isEqual = true;
                return false;
            }
        });
        return !isEqual;
    },
    'A different value is required.');

    $.fn.gridSidebar = function(options)
    {
        // Check if object was already created
        var gridSidebar = $(this[0]).data("gridSidebar");
        if (!gridSidebar)
        {
            gridSidebar = new gridSidebarObj(options, this[0]);
        }
        return gridSidebar;
    };

    var gridSidebarObj = function(options, dom)
    {
        this.settings = $.extend({}, gridSidebarObj.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    $.extend(gridSidebarObj,
    {
        defaults:
        {
            dataGrid: null,
            modalHiddenSelector: null
        },

        prototype:
        {
            init: function ()
            {
                var sidebarObj = this;
                var $domObj = sidebarObj.$dom();
                $domObj.data("gridSidebar", sidebarObj);

                $domObj.find('a.close').click(function(e)
                {
                    e.preventDefault();
                    sidebarObj.hide();
                });

                $(window).resize(function() { handleResize(sidebarObj); });
            },

            $dom: function()
            {
                if (!this._$dom)
                { this._$dom = $(this.currentDom); }
                return this._$dom;
            },

            $grid: function()
            {
                if (!this._$grid)
                { this._$grid = $(this.settings.dataGrid); }
                return this._$grid;
            },

            $currentPane: function()
            {
                if ($.isBlank(this._currentPane)) { return null; }

                return this._$panes[this._currentPane];
            },

            /* Create a new pane in the sidebar */
            addPane: function(config, data)
            {
                var sidebarObj = this;
                if ($.isBlank(config))
                { throw "Configuration required for gridSidebar"; }

                sidebarObj._$panes = sidebarObj._$panes || {};
                if (!$.isBlank(sidebarObj._$panes[config.name]))
                {
                    sidebarObj._$panes[config.name].remove();
                    delete sidebarObj._$panes[config.name];
                }

                var $pane = renderPane(sidebarObj, config, data);
                sidebarObj._$panes[config.name] = $pane;
                sidebarObj.$dom().append($pane);
                $pane.hide();
            },

            /* Show the sidebar and a specific pane in it.  If it is modal,
             * then hide/disable other parts of the UI */
            show: function(paneName, isModal)
            {
                var sidebarObj = this;

                // Set up the chosen pane
                sidebarObj.$dom().find('.sidebarPane').hide();
                // Make sure our pane exists
                if ($.isBlank(sidebarObj._$panes[paneName]))
                { throw paneName + ' does not exist'; }
                sidebarObj._currentPane = paneName;
                sidebarObj.$currentPane().show();
                sidebarObj.$currentPane()
                    .scroll(function(e) { handleScroll(sidebarObj, e); });


                // Adjust positions for the sidebar
                setPosition(sidebarObj);

                // The big reveal
                sidebarObj.$dom().show();
                sidebarObj.$grid().css('margin-right',
                    sidebarObj.$dom().outerWidth(true) + 'px');

                if (isModal)
                {
                    sidebarObj._isModal = true;
                    if (!_.isNull(sidebarObj.settings.modalHiddenSelector))
                    { $(sidebarObj.settings.modalHiddenSelector).hide(); }
                    sidebarObj._bodyOverflow = $('body').css('overflow');
                    $('body').css('overflow', 'hidden');

                    var $overlay = modalOverlay(sidebarObj);
                    sidebarObj._origZIndex = sidebarObj.$dom().css('z-index');
                    sidebarObj._origGridZIndex = sidebarObj.$grid().css('z-index');
                    var zIndex = parseInt($overlay.css('z-index')) + 1;
                    sidebarObj.$dom().css('z-index', zIndex);
                    sidebarObj.$grid().css('z-index', zIndex);
                    $overlay.fadeIn(500);

                    sidebarObj.$grid().datasetGrid().disable();
                }
                else { sidebarObj._isModal = false; }

                $(window).resize();

                showWizard(sidebarObj,
                    sidebarObj.$currentPane().find('.hasWizard:visible:first'));
            },

            /* Hide the sidebar and all panes.  If it was modal, then undo the
             * modal changes */
            hide: function()
            {
                var sidebarObj = this;
                sidebarObj.$dom().hide();
                sidebarObj.$dom().find('.sidebarPane').unbind('scroll').hide();
                sidebarObj.$grid().css('margin-right', 0);

                sidebarObj._currentPane = null;
                if (!$.isBlank(sidebarObj._$currentWizard))
                {
                    sidebarObj._$currentWizard.wizardPrompt().close();
                    sidebarObj._$currentWizard = null;
                    sidebarObj._$mainWizardItem = null;
                }

                if (sidebarObj._isModal)
                {
                    sidebarObj._isModal = false;
                    if (!_.isNull(sidebarObj.settings.modalHiddenSelector))
                    { $(sidebarObj.settings.modalHiddenSelector).show(); }
                    $('body').css('overflow', sidebarObj._bodyOverflow);
                    modalOverlay(sidebarObj).fadeOut(500);
                    sidebarObj.$dom().css('z-index', sidebarObj._origZIndex);
                    sidebarObj.$grid().css('z-index', sidebarObj._origGridZIndex);

                    sidebarObj.$grid().datasetGrid().enable();
                }

                $(window).resize();
            }
        }
    });

    /* Helper to get/create the modal overlay */
    var modalOverlay = function(sidebarObj)
    {
        if (!sidebarObj._$overlay)
        {
            sidebarObj.$dom().parent()
                .append('<div id="gridSidebarOverlay"></div>');
            sidebarObj._$overlay = $('#gridSidebarOverlay');
        }
        return sidebarObj._$overlay;
    };

    /* Adjust the position/size of the sidebar to fit next to the grid */
    var setPosition = function(sidebarObj)
    {
        var gridHeight = sidebarObj.$grid().height();
        var adjH = sidebarObj.$dom().outerHeight() - sidebarObj.$dom().height();
        sidebarObj.$dom().css('top', -gridHeight + 'px').height(gridHeight - adjH);

        // Adjust current pane to correct height, since it is what scrolls
        var $pane = sidebarObj.$dom().find('.sidebarPane:visible');
        adjH += $pane.outerHeight() - $pane.height();
        $pane.height(gridHeight - adjH);
    };

    /* Handle window resizing */
    var handleResize = function(sidebarObj)
    {
        if (sidebarObj.$dom().is(':hidden')) { return; }

        _.defer(function() { setPosition(sidebarObj); });
    };

    /* Handle pane scrolling */
    var handleScroll = function(sidebarObj, e)
    {
        if (!$.isBlank(sidebarObj._$currentWizard))
        {
            var $item = sidebarObj._$currentWizard;
            var newScroll = sidebarObj.$currentPane().scrollTop();
            var scrollDiff = newScroll - sidebarObj._curScroll;
            sidebarObj._curScroll = newScroll;
            $item.socrataTip().adjustPosition({top: -scrollDiff});

            updateWizardVisibility(sidebarObj);
        }
    };

    var updateWizardVisibility = function(sidebarObj)
    {
        var $item = sidebarObj._$currentWizard;
        var $pane = sidebarObj.$currentPane();
        var paneTop = $pane.offset().top;
        var itemTop = $item.offset().top;
        var paneBottom = paneTop + $pane.height();
        var itemBottom = itemTop + $item.outerHeight();

        var shouldHide = false;
        var pos = $item.socrataTip().getTipPosition();
        var fudge = 5;
        paneTop -= fudge;
        paneBottom += fudge;
        switch (pos)
        {
            case 'left':
            case 'right':
                 shouldHide = (itemTop + itemBottom) / 2 > paneBottom ||
                    (itemTop + itemBottom) / 2 < paneTop;
                break;

            case 'top':
                shouldHide = itemTop < paneTop || itemTop > paneBottom;
                break;

            case 'bottom':
                shouldHide = itemBottom > paneBottom || itemBottom < paneTop;
                break;

            default:
                shouldHide = true;
                break;
        }
        if (shouldHide) { $item.socrataTip().quickHide(); }
        else { $item.socrataTip().quickShow(); }
    };


    /*** Functions related to rendering a pane ***/

    /* Render a single input field */
    var renderInputType = function(sidebarObj, args)
    {
        var result = '';

        var commonAttrs = function(item)
        {
            return 'id="' + (item.id || item.name || '') + '"' +
                ' name="' + (item.name || '') + '"' +
                ' title="' + (item.prompt || '') + '"' +
                ' class="' + (item.extraClass || '') +
                    (item.required ? ' required' : '') +
                    (' ' + (item.notequalto || '')) +
                    (!$.isBlank(item.prompt) ? ' textPrompt' : '') + '"' +
                (!$.isBlank(item.notequalto) ? ' notequalto=".' +
                    item.notequalto.split(' ').join(', .') + '"' : '');
        };

        var cols;
        if (!$.isBlank(args.item.columns))
        {
            cols = _.select(sidebarObj.$grid().blistModel().meta().view.columns,
                function(c) { return c.dataTypeName != 'meta_data'; });
            if (!args.item.columns.hidden)
            {
                cols = _.select(cols, function(c)
                    { return !c.flags || !_.include(c.flags, 'hidden'); });
            }
            if (!$.isBlank(args.item.columns.type))
            {
                var types = args.item.columns.type;
                if (!_.isArray(args.item.columns.type))
                { types = [types]; }
                cols = _.select(cols, function(c)
                    { return _.include(types, c.dataTypeName); });
            }
        }

        switch (args.item.type)
        {
            case 'static':
                result = '<span ' + commonAttrs(args.item) + '>' +
                    (args.item.text || '') + '</span>';
                break;

            case 'text':
                result = '<input type="text" ' + commonAttrs(args.item) +
                    (!$.isBlank(args.context.data[args.item.name]) ?
                        ' value="' +
                            $.htmlEscape(args.context.data[args.item.name]) +
                            '"' : '') +
                    ' />';
                break;

            case 'textarea':
                result = '<textarea ' + commonAttrs(args.item) + '>' +
                    (!$.isBlank(args.context.data[args.item.name]) ?
                        $.htmlEscape(args.context.data[args.item.name]) : '') +
                    '</textarea>';
                break;

            case 'select':
                result = '<select ' + commonAttrs(args.item) + '>';
                if (!$.isBlank(cols))
                {
                    result += '<option value="">Select a Column</option>';
                    _.each(cols, function(c)
                    {
                        result += '<option value="' + c.id + '">' +
                            $.htmlEscape(c.name) + '</option>';
                    });
                }
                result += '</select>';
                break;

            case 'radioGroup':
                result = '<div class="radioBlock">'
                _.each(args.item.options, function(opt, i)
                {
                    result += '<div class="radioLine' +
                        (i == 0 ? ' first' : '') + '">' +
                        '<input type="radio" ' +
                        (opt.checked ? 'checked="checked" ' : '') +
                        commonAttrs($.extend({}, args.item,
                            {id: args.item.name + '_' + i})) + ' />' +
                        '<label for="' + args.item.name + '_' + i + '">' +
                        renderInputType(sidebarObj, {context: args.context,
                            item: opt, items: args.item.options, pos: i}) +
                        '</label>' +
                        '</div>';
                });
                result += '</div>';
                break;
        }

        return result;
    };

    /* Render the full pane from config */
    var renderPane = function(sidebarObj, config, data)
    {
        var $pane = $('<div id="' +
            sidebarObj.$dom().attr('id') + '_' + config.name +
            '" class="sidebarPane"></div>');
        var rData = {title: config.title, subtitle: config.subtitle,
            sections: config.sections, finishButtons: config.finishBlock.buttons,
            data: data || {}};
        var directive = {
            '.title': 'title',
            '.subtitle': 'subtitle',
            '.section': {
                'section<-sections': {
                    '@class+': function(arg)
                    { return ' ' + (arg.item.type || '') +
                        ' ' + (arg.item.name || '') +
                        (arg.item.type == 'selectable' ? ' collapsed' : ''); },
                    '.title': 'section.title',
                    '.title@for': 'section.name',
                    '.sectionSelect@id': 'section.name',
                    '.sectionSelect@name': 'section.name',
                    '.sectionSelect@class+': function(arg)
                    { return arg.item.type == 'selectable' ? '' : ' hidden'; },
                    '.line': {
                        'field<-section.fields': {
                            '@class+': ' #{field.type}',
                            'label': 'field.text',
                            'label@for': 'field.name',
                            'label@class+': function(arg)
                            { return arg.item.required ? ' required' : ''; },
                            '.+': function(a)
                            { return renderInputType(sidebarObj, a); }
                        }
                    }
                }
            },
            '.finishButtons > li': {
                'button<-finishButtons': {
                    'a': 'button.text',
                    'a@value': 'button.value',
                    'a@class+': function(arg)
                    { return arg.item.isDefault ? ' arrowButton' : ''; },
                    'a@href+': function(arg)
                    { return $.urlSafe(arg.item.text || ''); }
                }
            }
        };

        $pane.append($.renderTemplate('sidebarPane', rData, directive));

        $pane.find('.textPrompt')
            .example(function () { return $(this).attr('title'); });

        $pane.find('form').validate({ignore: ':hidden', errorElement: 'span'});

        $pane.find('.section.selectable .sectionSelect').click(function(e)
        {
            var $c = $(this);
            _.defer(function()
            {
                var $sect = $c.parent();
                var oldH = $sect.outerHeight(true);
                $sect.toggleClass('collapsed', !$c.value());
                var newH = $sect.outerHeight(true);

                if (!$.isBlank(sidebarObj._$mainWizardItem) &&
                    ($sect.nextAll().has(sidebarObj._$mainWizardItem).length > 0 ||
                    $sect.nextAll().index(sidebarObj._$mainWizardItem) > -1))
                {
                    sidebarObj._$currentWizard.socrataTip()
                        .adjustPosition({top: newH - oldH});
                    updateWizardVisibility(sidebarObj);
                }

                if (!$.isBlank(sidebarObj._$mainWizardItem) && $c.value() &&
                    $sect.has(sidebarObj._$mainWizardItem).length < 1)
                {
                    sidebarObj._$mainFlowWizard = sidebarObj._$mainWizardItem;
                    sidebarObj._$currentWizard.wizardPrompt().close();
                    sidebarObj._$currentWizard = null;
                    sidebarObj._$mainWizardItem = null;
                    wizardAction(sidebarObj, $sect, 'nextField');
                }

                if (!$.isBlank(sidebarObj._$mainWizardItem) && !$c.value() &&
                    $sect.has(sidebarObj._$mainWizardItem).length > 0)
                {
                    sidebarObj._$currentWizard.wizardPrompt().close();
                    sidebarObj._$currentWizard = null;
                    sidebarObj._$mainWizardItem = null;
                    wizardAction(sidebarObj, $sect, 'nextSection');
                }
            });
        });

        // Inputs inside labels are likely attached to radio buttons.
        // We need to preventDefault on the click so focus stays in the input,
        // and isn't stolen by the radio button; then we need to manually trigger
        // the selection of the radio button.  We use mouseup because textPrompt
        // interferes with click events
        $pane.find('.section label :input').click(function(e)
        {
            e.preventDefault();
        }).mouseup(function(e)
        {
            var forAttr = $(this).parents('label').attr('for');
            if (!$.isBlank(forAttr))
            { $pane.find('#' + forAttr).click(); }
        });

        $pane.find('.actionButtons a').click(function(e)
        {
            e.preventDefault();
            config.finishCallback(sidebarObj, data,
                $pane, $(this).attr('value'));
        });

        addWizards(sidebarObj, $pane, config);

        return $pane;
    };

    var genericErrorHandler = function($pane, xhr)
    {
        $pane.find('.mainError')
            .text($.json.deserialize(xhr.responseText).message);
    };


    /*** Functions for handling wizard step-through ***/

    var addWizards = function(sidebarObj, $pane, config)
    {
        if (!$.isBlank(config.wizard))
        {
            $pane.find('.titleBlock').addClass('hasWizard')
                .data('sidebarWizard', config.wizard);
        }

        $pane.find('.section').each(function(i)
        {
            var $s = $(this);
            var s = config.sections[i];
            if (!$.isBlank(s.wizard))
            { $s.addClass('hasWizard').data('sidebarWizard', s.wizard); }

            $s.find('.sectionContent > .line').each(function(j)
            {
                var $l = $(this);
                var l = s.fields[j];
                if (!$.isBlank(l.wizard))
                {
                    $l.addClass('hasWizard').data('sidebarWizard',
                        $.extend({}, l.wizard, {positions: ['left'],
                            closeEvents: 'change'}));
                }
            });
        });

        if (!$.isBlank(config.finishBlock.wizard))
        {
            $pane.find('.finishButtons').addClass('hasWizard')
                .data('sidebarWizard', $.extend({}, config.finishBlock.wizard,
                    {positions: ['top']}));
        }
    };

    var showWizard = function(sidebarObj, $item)
    {
        if ($item.length < 1) { return false; }

        var wiz = $item.data('sidebarWizard');
        if ($.isBlank(wiz)) { return false; }

        var wizConfig = {prompt: wiz.prompt || null,
            positions: wiz.positions || null,
            closeEvents: wiz.closeEvents || null};

        var alreadyCalled = false;
        if (!$.isBlank(wiz.actions))
        {
            wizConfig.buttons = [];
            _.each(wiz.actions, function(a)
            { wizConfig.buttons.push({text: a.text, value: a.action}); });

            wizConfig.buttonCallback = function(action)
            {
                _.defer(function()
                {
                    if (!alreadyCalled)
                    {
                        alreadyCalled = true;
                        wizardAction(sidebarObj, $item, action);
                    }
                });
            };
        }

        if (!$.isBlank(wiz.defaultAction))
        {
            wizConfig.closeCallback = function()
            {
                _.defer(function()
                {
                    if (!alreadyCalled)
                    {
                        alreadyCalled = true;
                        wizardAction(sidebarObj, $item, wiz.defaultAction);
                    }
                });
            };
        }

        /* Adjust scroll position to make sure wizard component is in view */
        var $pane = sidebarObj.$currentPane();
        var paneTop = $pane.offset().top;
        var top = $item.offset().top;
        var paneBottom = paneTop + $pane.height();
        var bottom = top + $item.outerHeight();
        if (bottom > paneBottom)
        { $pane.scrollTop($pane.scrollTop() + bottom - paneBottom); }
        if (top < paneTop)
        { $pane.scrollTop($pane.scrollTop() - (paneTop - top)); }

        var $mainItem = $item;
        /* Adjust actual item wizard is attached to */
        if (!$.isBlank(wiz.selector)) { $item = $item.find(wiz.selector); }

        /* Set scroll first, because fetching the scrollTop can trigger a scroll
         * event in IE, which screws things up if _$currentWizard is set without
         * the tooltip being created */
        sidebarObj._curScroll = $pane.scrollTop();
        $item.wizardPrompt(wizConfig);
        sidebarObj._$currentWizard = $item;
        sidebarObj._$mainWizardItem = $mainItem;

        return true;
    };

    var wizardAction = function(sidebarObj, $item, action)
    {
        if (!$.isBlank(sidebarObj._$mainFlowWizard) &&
            sidebarObj._$mainFlowWizard.index($item) > -1)
        { return; }

        sidebarObj._$currentWizard = null;
        sidebarObj._$mainWizardItem = null;
        switch(action)
        {
            case 'nextSection':
                if ($item.closest('.section').length > 0)
                { $item = $item.closest('.section'); }
                showWizard(sidebarObj, $item.nextAll('.section, .finishButtons')
                    .filter('.hasWizard:visible:first'));
                break;

            case 'nextField':
                var $triggerItem = $item;
                if ($triggerItem.is('.section'))
                { $triggerItem = $triggerItem
                    .find('.sectionContent > .line.hasWizard:visible:first'); }
                else
                { $triggerItem = $triggerItem.closest('.line')
                    .nextAll('.line.hasWizard:visible:first'); }

                if ($triggerItem.length < 1)
                {
                    // Leaving this section; see if we need to return to a previous
                    // interrupted flow
                    if (!$.isBlank(sidebarObj._$mainFlowWizard))
                    {
                        var $resumeItem = sidebarObj._$mainFlowWizard;
                        sidebarObj._$mainFlowWizard = null;
                        showWizard(sidebarObj, $resumeItem);
                    }
                    else
                    {
                        wizardAction(sidebarObj, $item.closest('.section'),
                            'nextSection');
                    }
                }
                else
                { showWizard(sidebarObj, $triggerItem); }
                break;

            case 'expand':
                if ($item.is('.selectable.collapsed'))
                { $item.find('.sectionSelect').click(); }

                _.defer(function()
                { wizardAction(sidebarObj, $item,
                    $item.find('.hasWizard').length > 0 ?
                        'nextField' : 'nextSection'); });
                break;

            case 'finish':
                showWizard(sidebarObj, $item.closest('.sidebarPane')
                    .find('.finishButtons'));
                break;

            default:
                $.debug('no handler for "' + action + '"', $item);
                break;
        }
    };


    /*** Pane-specific callbacks ***/

    var locationCreateCallback = function(sidebarObj, data, $pane, value)
    {
        if (!value)
        {
            sidebarObj.hide();
            return;
        }

        if (!$pane.find('form').valid()) { return; }

        $pane.find('.mainError').text('');

        if ($pane.find('.section.latLongSection .sectionSelect').value() ||
                $pane.find('.section.addressSection .sectionSelect').value())
        { convertLocation(sidebarObj, data, $pane); }
        else
        { createLocation(sidebarObj, data, $pane); }
    };

    var columnCreated = function(sidebarObj, newCol)
    {
        sidebarObj.$grid().blistModel().updateColumn(newCol);
        $(document).trigger(blist.events.COLUMNS_CHANGED, [newCol.id]);
        $.Tache.DeleteAll();
        sidebarObj.hide();
    };

    var convertLocation = function(sidebarObj, data, $pane)
    {
        var useLatLong =
            $pane.find('.section.latLongSection .sectionSelect').value();
        var useAddress =
            $pane.find('.section.addressSection .sectionSelect').value();

        var latVal = useLatLong ? $pane.find('#convertLat').val() : null;
        var longVal = useLatLong ? $pane.find('#convertLong').val() : null;

        var streetIsCol = false;
        var streetVal;
        var cityIsCol = false;
        var cityVal;
        var stateIsCol = false;
        var stateVal;
        var zipIsCol = false;
        var zipVal;
        if (useAddress)
        {
            var $street = $pane.find(':input[name="convertStreetGroup"]:checked')
                .siblings('label').find(':input:not(.prompt)');
            streetIsCol = $street.is('select');
            streetVal = $street.val() || null;

            var $city = $pane.find(':input[name="convertCityGroup"]:checked')
                .siblings('label').find(':input:not(.prompt)');
            cityIsCol = $city.is('select');
            cityVal = $city.val() || null;

            var $state = $pane.find(':input[name="convertStateGroup"]:checked')
                .siblings('label').find(':input:not(.prompt)');
            stateIsCol = $state.is('select');
            stateVal = $state.val() || null;

            var $zip = $pane.find(':input[name="convertZipGroup"]:checked')
                .siblings('label').find(':input:not(.prompt)');
            zipIsCol = $zip.is('select');
            zipVal = $zip.val() || null;
        }

        $.ajax({url: '/views/' + blist.display.viewId + '/columns.json?' +
            'method=' + (useLatLong ? 'locify' : 'addressify') +
            '&deleteOriginalColumns=false' +
            '&location=' + $pane.find('#columnName').val() +
            (latVal ? '&latitude=' + latVal : '') +
            (longVal ? '&longitude=' + longVal : '') +
            (streetVal ? '&address' + (streetIsCol ? 'Column' : 'Value') +
                '=' + streetVal : '') +
            (cityVal ? '&city' + (cityIsCol ? 'Column' : 'Value') +
                '=' + cityVal : '') +
            (stateVal ? '&state' + (stateIsCol ? 'Column' : 'Value') +
                '=' + stateVal : '') +
            (zipVal ? '&zip' + (zipIsCol ? 'Column' : 'Value') +
                '=' + zipVal : ''),
            type: 'POST', contentType: 'application/json', dataType: 'json',
            error: function(xhr) { genericErrorHandler($pane, xhr); },
            success: function(resp)
            {
                var desc = $pane.find('#columnDescription:not(.prompt)').val();
                if (desc)
                {
                    $.ajax({url: '/views/' + blist.display.viewId +
                        '/columns/' + resp.id + '.json', type: 'PUT',
                        contentType: 'application/json', dataType: 'json',
                        data: $.json.serialize({description: desc}),
                        error: function(xhr) { genericErrorHandler($pane, xhr); },
                        success: function(r) { columnCreated(sidebarObj, r); }
                    });
                }
                else { columnCreated(sidebarObj, resp); }
            }
        });
    };

    var createLocation = function(sidebarObj, data, $pane)
    {
        var column = {name: $pane.find('#columnName:not(.prompt)').val() || null,
            description:
                $pane.find('#columnDescription:not(.prompt)').val() || null,
            dataTypeName: data.columnType};

        $.ajax({url: '/views/' + blist.display.viewId + '/columns.json',
            type: 'POST', contentType: 'application/json', dataType: 'json',
            data: $.json.serialize(column),
            error: function(xhr) { genericErrorHandler($pane, xhr); },
            success: function(resp) { columnCreated(sidebarObj, resp); }
        });
    };


    /*** Public configurations for panes ***/

    $.gridSidebarConfig = {
        locationCreate: {
            name: 'locationCreate',
            title: 'Create a Location Column',
            subtitle: 'Create a blank column to fill in location data, or fill it with values from existing columns',
            sections: [
                {
                    title: 'Column Information',
                    fields: [
                        {text: 'Name', type: 'text', name: 'columnName',
                            prompt: 'Enter a name', required: true},
                        {text: 'Description', type: 'textarea',
                            name: 'columnDescription',
                            prompt: 'Enter a description'}
                    ]
                },
                {
                    title: 'Import Latitude/Longitude',
                    type: 'selectable',
                    name: 'latLongSection',
                    fields: [
                        {text: 'Latitude', type: 'select', name: 'convertLat',
                            required: true, notequalto: 'convertNumber',
                            columns: {type: 'number', hidden: false},
                            wizard: {prompt: 'Choose the column that contains latitude data',
                                defaultAction: 'nextField'}
                        },
                        {text: 'Longitude', type: 'select', name: 'convertLong',
                            required: true, notequalto: 'convertNumber',
                            columns: {type: 'number', hidden: false},
                            wizard: {prompt: 'Choose the column that contains longitude data',
                                defaultAction: 'nextField'}
                        }
                    ],
                    wizard: {prompt: 'Do you have latitude and longitude data to import?',
                        defaultAction: 'nextField',
                        actions: [
                            {text: 'Yes', action: 'expand'},
                            {text: 'No', action: 'nextSection'}
                        ]
                    }
                },
                {
                    title: 'Import US Addresses',
                    type: 'selectable',
                    name: 'addressSection',
                    fields: [
                        {text: 'Street', type: 'radioGroup',
                            name: 'convertStreetGroup',
                            options: [
                                {text: 'None', type: 'static', checked: true},
                                {type: 'select', name: 'convertStreetCol',
                                    notequalto: 'convertText',
                                    columns: {type: 'text', hidden: false} }
                            ],
                            wizard: {prompt: 'Choose the column that contains street address data',
                                defaultAction: 'nextField',
                                actions: [
                                    {text: 'Skip', action: 'nextField'},
                                    {text: 'Done', action: 'nextField'}
                                ]
                            }
                        },
                        {text: 'City', type: 'radioGroup', name: 'convertCityGroup',
                            options: [
                                {text: 'None', type: 'static', checked: true},
                                {type: 'select', name: 'convertCityCol',
                                    notequalto: 'convertText',
                                    columns: {type: 'text', hidden: false} },
                                {type: 'text', name: 'convertCityStatic',
                                    prompt: 'Enter a city'}
                            ],
                            wizard: {prompt: 'Choose the column that contains city data, or fill in a value to be used for all rows',
                                defaultAction: 'nextField',
                                actions: [
                                    {text: 'Skip', action: 'nextField'},
                                    {text: 'Done', action: 'nextField'}
                                ]
                            }
                        },
                        {text: 'State', type: 'radioGroup',
                            name: 'convertStateGroup',
                            options: [
                                {text: 'None', type: 'static', checked: true},
                                {type: 'select', name: 'convertStateCol',
                                    notequalto: 'convertText',
                                    columns: {type: 'text', hidden: false} },
                                {type: 'text', name: 'convertStateStatic',
                                    prompt: 'Enter a state'}
                            ],
                            wizard: {prompt: 'Choose the column that contains state data, or fill in a value to be used for all rows',
                                defaultAction: 'nextField',
                                actions: [
                                    {text: 'Skip', action: 'nextField'},
                                    {text: 'Done', action: 'nextField'}
                                ]
                            }
                        },
                        {text: 'Zip Code', type: 'radioGroup',
                            name: 'convertZipGroup',
                            options: [
                                {text: 'None', type: 'static', checked: true},
                                {type: 'select', name: 'convertZipCol',
                                    notequalto: 'convertText convertNumber',
                                    columns: {type: ['text', 'number'],
                                        hidden: false} },
                                {type: 'text', name: 'convertZipStatic',
                                    prompt: 'Enter a zip code'}
                            ],
                            wizard: {prompt: 'Choose the column that contains zip code data, or fill in a value to be used for all rows',
                                defaultAction: 'nextField',
                                actions: [
                                    {text: 'Skip', action: 'nextField'},
                                    {text: 'Done', action: 'nextField'}
                                ]
                            }
                        }
                    ],
                    wizard: {prompt: 'Do you have address data to import?',
                        defaultAction: 'nextField',
                        actions: [
                            {text: 'Yes', action: 'expand'},
                            {text: 'No', action: 'nextSection'}
                        ]
                    }
                }
            ],
            finishBlock: {
                buttons: [
                    {text: 'Create', value: true, isDefault: true},
                    {text: 'Cancel', value: false}
                ],
                wizard: {prompt: "Now you're ready to create a new column",
                    selector: '.arrowButton'}
            },
            finishCallback: locationCreateCallback,
            wizard: {prompt: 'Do you have existing location data?',
                actions: [
                    {text: 'Yes', action: 'nextSection'},
                    {text: 'No', action: 'finish'}
                ]
            }
        }
    };

})(jQuery);
