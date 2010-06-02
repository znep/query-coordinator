(function($)
{
    $.validator.addMethod('data-notEqualTo', function(value, element, param)
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

    /* Config hash:
    {
        + name: required, identification of this config.  If this has a period in
            it, the first part is taken as the parent name.  Multiple panes
            can be grouped under a parent, in which case each pane title is
            shown in a sub-select bar.  If just the parent pane is opened,
            there is a wizard prompt to choose the actual pane to show.
            If the parent pane does not already exist, then the name is simply
            capitalized and used as the title. More information may be added
            later (such as a subtitle or custom title), and all
            previously-initialized sub-panes will be kept.  All sub-panes need
            to be added before any child or the parent pane is actually added
            to make sure the sub-select bar is initialized properly
        + title: main title
        + subtitle: appears under main title
        + sections: array of sections for entering data
        [
          {
            + title: section title
            + type: optional, 'selectable' makes the field collapseable.
                By default it will be collapsed; when collapsed, nothing is
                validated or wizard-ed
            + name: internal name for field; required if it is of type selectable
            + fields: array of input fields
            [
               {
                  + text: label for input
                  + type: required, one of: 'static', 'text', 'textarea',
                      'checkbox', 'columnSelect', 'radioGroup'
                  + name: required, HTML name of input
                  + prompt: optional, prompt text for text/textareas
                  + required: optional, boolean, whether or not the input should be
                      validated as required (if visible)
                  + checked: boolean, if true, this field is selected/checked
                      by default
                  + extraClass: extra class(es) to be applied to the input;
                      should be a single string, could have multiple
                      space-separated classes
                  + notequalto: optional, string to use for validating notequalto;
                      all fields that are validated like this should have the
                      same string
                  + columns: for type columnSelect, tells what type of columns
                      should be available
                  {
                    + type: array or single datatype names
                    + hidden: boolean, whether or not to include hidden columns
                  }
                  + options: for radioGroup, array of sub-fields.  Same options
                      as top-level fields
               }
            ]
          }
        ]
        + finishCallback: function that is called when a finish button is clicked;
            args: (sidebarObj, data, $pane, value)
        + finishBlock: specifies final actions
        {
          + buttons: array of finish buttons
          [
            {
              + text: text to display
              + value: value that is passed to the finishCallback on click
              + isDefault: boolean, marked as default button if true
              + isCancel: boolean, marked as cancel button if true
              + requiresLogin: boolean, whether or not this action requires
                the user to be logged in
              + loginMessage: custom message to display when prompting the user
                to log in.  Will use the defaultLoginMessage from gridSidebar
                if not provided
            }
          ]
        }
    }

    Additionally, certain elements may have a wizard key to add a wizard prompt.
    These elements are: top-level config (will display against the title),
      section (prompt on initial entrance to a section; can be used to expand a
       section), field, finishBlock (by default will prompt against default
       button)
    wizard:
    {
      prompt: text to display in wizard tip
      defaultAction: default wizard action if the wizard is closed (because
        value is selected or button clicked)
      actions: array of action buttons to display in the wizard
      [
        {
          text: text for button
          action: action to perform on click
        }
      ]
      selector: optional, sub-element to prompt against
    }

    Possible wizard actions:
    * nextSection: will go to the next section (first section if on the title
      block), or the finish buttons if there are no more sections
    * nextField: will go to the next field in the section; if at the end of a
      section, will perform the nextSection action
    * expand: only valid on a section wizard; will expand the section and go to
      the first field (perform the nextField action)
    * finish: Will skip directly to finish buttons

    */

    var paneConfigs = {};
    $.gridSidebar =
    {
        registerConfig: function(config)
        {
            if ($.isBlank(config.name)) { throw 'Sidebar config requires a name'; }
            var p = config.name.split('.');
            if (p.length == 1)
            {
                paneConfigs[config.name] =
                    $.extend(paneConfigs[config.name], config);
            }
            else if (p.length == 2)
            {
                var primary = p[0];
                if ($.isBlank(paneConfigs[primary]))
                {
                    paneConfigs[primary] = {name: primary, isParent: true,
                        title: primary.capitalize(), subPanes: {}};
                }
                config.name = p[1];
                paneConfigs[primary].subPanes[p[1]] = config;
            }
            else
            {
                throw "Pane config: can't name with more than one or two parts";
            }
        },

        // Pre-defined buttons for easy access
        buttons: {
            create: {text: 'Create', value: true, isDefault: true,
                requiresLogin: true},
            cancel: {text: 'Cancel', value: false, isCancel: true}
        },

        wizard: {
            buttons: {
                skip: {text: 'Skip', action: 'nextField'},
                done: {text: 'Done', action: 'nextField'}
            },
            buttonGroups:
            {
                sectionExpand: [{text: 'Yes', action: 'expand'},
                    {text: 'No', action: 'nextSection'}]
            }
        }
    };

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
            defaultLoginMessage: 'You must be signed in',
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

                sidebarObj._$outerPanes = {};
                sidebarObj._$panes = {};

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

            $neighbor: function()
            {
                if (!this._$neighbor)
                {
                    var $sibs = this.$dom().siblings();
                    var $par = this.$grid().parent();
                    while ($par.length > 0 && $sibs.index($par) < 0)
                    { $par = $par.parent(); }

                    this._$neighbor = $par.length > 0 ? $par : this.$grid();
                }
                return this._$neighbor;
            },

            $currentOuterPane: function()
            {
                if ($.isBlank(this._currentOuterPane)) { return null; }

                return this._$outerPanes[this._currentOuterPane];
            },

            $currentPane: function()
            {
                if ($.isBlank(this._currentPane)) { return null; }

                return this._$panes[this._currentPane];
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

            /* Create a new pane in the sidebar */
            addPane: function(configName, data)
            {
                var sidebarObj = this;
                var nameParts = getConfigNames(configName);
                var outerConfig = paneConfigs[nameParts.primary];
                var config = (outerConfig.subPanes || {})[nameParts.secondary] ||
                    paneConfigs[nameParts.secondary];

                if ($.isBlank(config) || $.isBlank(outerConfig))
                { throw "Configuration required for gridSidebar"; }

                if (!$.isBlank(sidebarObj._$panes[config.name]))
                {
                    sidebarObj._$panes[config.name].remove();
                    delete sidebarObj._$panes[config.name];
                }

                if ($.isBlank(sidebarObj._$outerPanes[outerConfig.name]))
                { createOuterPane(sidebarObj, outerConfig); }

                if (config.isParent) { return; }

                var $pane = renderPane(sidebarObj, config, data);
                sidebarObj._$panes[config.name] = $pane;
                sidebarObj._$outerPanes[outerConfig.name]
                    .find('.panes').append($pane);
                $pane.hide();
            },

            /* Show the sidebar and a specific pane in it.  If it is modal,
             * then hide/disable other parts of the UI */
            show: function(paneName, isModal)
            {
                var sidebarObj = this;

                // Hide any other open panes
                hideCurrentPane(sidebarObj);

                var nameParts = getConfigNames(paneName);
                var outerConfig = paneConfigs[nameParts.primary];
                var config = (outerConfig.subPanes || {})[nameParts.secondary] ||
                    paneConfigs[nameParts.secondary];

                // Make sure our pane exists
                if ($.isBlank(sidebarObj._$outerPanes[nameParts.primary]) ||
                    (!config.isParent &&
                        $.isBlank(sidebarObj._$panes[nameParts.secondary])))
                { sidebarObj.addPane(paneName); }

                sidebarObj._currentOuterPane = nameParts.primary;
                sidebarObj.$currentOuterPane().show();
                if (!config.isParent)
                {
                    sidebarObj._currentPane = nameParts.secondary;
                    sidebarObj.$currentOuterPane()
                        .find('.paneSelect a[data-paneName=' +
                            nameParts.secondary + ']').addClass('selected');
                    if (!$.isBlank(config.wizard))
                    { sidebarObj.$currentPane().addClass('initialLoad'); }
                    sidebarObj.$currentPane().fadeIn();
                    sidebarObj.$currentPane().find('.scrollContent')
                        .scroll(function(e) { handleScroll(sidebarObj, e); });
                }


                // Adjust positions for the sidebar
                setPosition(sidebarObj);

                sidebarObj.updateEnabledSubPanes();

                // The big reveal
                sidebarObj.$dom().show();
                sidebarObj.$neighbor().css('margin-right',
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
                    sidebarObj._origGridZIndex = sidebarObj.$neighbor()
                        .css('z-index');
                    sidebarObj._origParent = sidebarObj.$dom().offsetParent();
                    sidebarObj._origParentZIndex = sidebarObj.$dom()
                        .offsetParent().css('z-index');
                    var zIndex = parseInt($overlay.css('z-index')) + 1;
                    sidebarObj.$dom().css('z-index', zIndex);
                    sidebarObj.$neighbor().css('z-index', zIndex);
                    sidebarObj.$dom().offsetParent().css('z-index', zIndex - 1);

                    // IE7 apparently isn't terribly happy the second time you
                    // open this pane if there is a fadeIn, but no fadeOut
                    // (because IE7 really has problems with that one)
                    if ($('body').is('.ie7')) { $overlay.show(); }
                    else { $overlay.fadeIn(500); }

                    sidebarObj.$grid().datasetGrid().disable();
                }
                else { sidebarObj._isModal = false; }

                $(window).resize();

                if (!config.isParent)
                {
                    showWizard(sidebarObj, sidebarObj.$currentPane()
                        .find('.hasWizard:visible:first'));
                }
                else
                {
                    showPaneSelectWizard(sidebarObj, outerConfig);
                }
            },

            /* Hide the sidebar and all panes.  If it was modal, then undo the
             * modal changes */
            hide: function()
            {
                var sidebarObj = this;
                sidebarObj.$dom().hide();
                sidebarObj.$neighbor().css('margin-right', 0);

                hideCurrentPane(sidebarObj);

                if (sidebarObj._isModal)
                {
                    sidebarObj._isModal = false;
                    if (!_.isNull(sidebarObj.settings.modalHiddenSelector))
                    { $(sidebarObj.settings.modalHiddenSelector).show(); }
                    $('body').css('overflow', sidebarObj._bodyOverflow);

                    // IE7 doesn't like this fade out
                    if ($('body').is('.ie7'))
                    { modalOverlay(sidebarObj).hide(); }
                    else { modalOverlay(sidebarObj).fadeOut(500); }

                    sidebarObj.$dom().css('z-index', sidebarObj._origZIndex);
                    sidebarObj.$neighbor().css('z-index',
                        sidebarObj._origGridZIndex);
                    sidebarObj._origParent.css('z-index',
                        sidebarObj._origParentZIndex);

                    sidebarObj.$grid().datasetGrid().enable();
                }

                // In non-IE we need to trigger a resize so the grid restores
                // properly.  In IE7, this will crash; IE8 works either way
                if (!$.browser.msie) { $(window).resize(); }
            },

            updateEnabledSubPanes: function()
            {
                var sidebarObj = this;

                if ($.isBlank(sidebarObj.$currentOuterPane())) { return; }

                var updatedLinks = false;
                var $paneSelect = sidebarObj.$currentOuterPane()
                    .find('.paneSelect');
                var updateEnabled = function(sp, isEnabled)
                {
                    var $a = $paneSelect.find('[data-panename="' + sp.name + '"]');
                    if ($a.hasClass('disabled') != !isEnabled)
                    {
                        updatedLinks = true;
                        $a.toggleClass('disabled', !isEnabled)
                            .attr('title', isEnabled ?
                                sp.subtitle : sp.disabledSubtitle);
                    }

                    if (sp.name == sidebarObj._currentPane)
                    {
                        var $pane = sidebarObj.$currentPane();
                        if (!$.isBlank(sidebarObj._$currentWizard) &&
                            $pane.hasClass('disabled') != !isEnabled)
                        {
                            if (isEnabled)
                            {
                                sidebarObj._$currentWizard
                                    .socrataTip().quickShow();
                            }
                            else
                            {
                                sidebarObj._$currentWizard
                                    .socrataTip().quickHide();
                            }
                        }
                        $pane.toggleClass('disabled', !isEnabled)
                            .find('.disabledMessage').text(sp.disabledSubtitle);
                    }
                };

                var outerConfig = paneConfigs[sidebarObj._currentOuterPane];
                _.each(outerConfig.subPanes || {}, function(sp)
                {
                    if ($.isBlank(sp.onlyIf))
                    { updateEnabled(sp, true); }
                    else if (_.isFunction(sp.onlyIf))
                    {
                        updateEnabled(sp, sp.onlyIf(
                            sidebarObj.$grid().blistModel().meta().view
                        ));
                    }
                    else
                    { updateEnabled(sp, sp.onlyIf === true); }
                });

                if (updatedLinks && $.isBlank(sidebarObj._currentPane) &&
                    sidebarObj.$dom().is(':visible'))
                { showPaneSelectWizard(sidebarObj, outerConfig); }
            },

            baseFormHandler: function($pane, value)
            {
                if (!value)
                {
                    this.resetFinish();
                    this.hide();
                    return false;
                }

                // Clear out fields that are prompts so they validate
                $pane.find(':input.prompt').val('');
                if (!$pane.find('form').valid())
                {
                    this.resetFinish();
                    return false;
                }

                $pane.find('.mainError').text('');
                return true;
            },

            resetFinish: function()
            {
                this.$dom().removeClass('processing');
            },

            genericErrorHandler: function($pane, xhr)
            {
                this.resetFinish();
                $pane.find('.mainError')
                    .text(JSON.parse(xhr.responseText).message);
            }
        }
    });


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


    var hideCurrentPane = function(sidebarObj)
    {
        if (!$.isBlank(sidebarObj.$currentOuterPane()))
        {
            var $paneSel = sidebarObj.$currentOuterPane().find('.paneSelect');
            if ($paneSel.isSocrataTip()) { $paneSel.socrataTip().destroy(); }
        }

        sidebarObj.$dom().find('.outerPane').hide()
            .find('.paneSelect a.selected').removeClass('selected');
        sidebarObj.$dom().find('.sidebarPane').hide()
            .find('.scrollContent').unbind('scroll');
        sidebarObj._currentOuterPane = null;
        sidebarObj._currentPane = null;
        if (!$.isBlank(sidebarObj._$currentWizard))
        {
            sidebarObj._$currentWizard.wizardPrompt().close();
            sidebarObj._$currentWizard = null;
            sidebarObj._$mainWizardItem = null;
        }
    };

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
        var gridHeight = sidebarObj.$neighbor().height();
        var adjH = sidebarObj.$dom().outerHeight() - sidebarObj.$dom().height();
        sidebarObj.$dom().css('top', -gridHeight + 'px').height(gridHeight - adjH);

        // Adjust current pane to correct height, since it is what scrolls
        var $pane = sidebarObj.$dom().find('.outerPane:visible');
        var $scrollContent = $pane.find('.sidebarPane:visible .scrollContent');
        adjH += $pane.outerHeight() - $scrollContent.height();
        $scrollContent.height(gridHeight - adjH);
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
            var newScroll = sidebarObj.$currentPane()
                .find('.scrollContent').scrollTop();
            var scrollDiff = newScroll - sidebarObj._curScroll;
            sidebarObj._curScroll = newScroll;
            $item.socrataTip().adjustPosition({top: -scrollDiff});

            updateWizardVisibility(sidebarObj);
        }
    };

    var updateWizardVisibility = function(sidebarObj)
    {
        var $item = sidebarObj._$currentWizard;
        var $pane = sidebarObj.$currentPane().find('.scrollContent');
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
            return {id: item.id || item.name, name: item.name,
                title: item.prompt,
                'class': [ {value: 'required', onlyIf: item.required},
                        {value: 'textPrompt', onlyIf: !$.isBlank(item.prompt)},
                        item.notequalto, item.extraClass ],
                'data-notequalto': {value: '.' + (item.notequalto || '')
                        .split(' ').join(', .'),
                    onlyIf: !$.isBlank(item.notequalto)}
            };
        };

        var cols;
        var colTypes = [];
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
                colTypes = args.item.columns.type;
                if (!_.isArray(args.item.columns.type))
                { colTypes = [colTypes]; }
                cols = _.select(cols, function(c)
                    { return _.include(colTypes, c.dataTypeName); });
            }
        }

        switch (args.item.type)
        {
            case 'static':
                result = $.tag($.extend(commonAttrs(args.item),
                    {tagName: 'span', contents: args.item.text}), true);
                break;

            case 'text':
                result = $.tag($.extend(commonAttrs(args.item),
                    {tagName: 'input', type: 'text', value:
                        $.htmlEscape(args.context.data[args.item.name])}), true);
                break;

            case 'textarea':
                result = $.tag($.extend(commonAttrs(args.item),
                    {tagName: 'textarea', contents:
                        $.htmlEscape(args.context.data[args.item.name])}), true);
                break;

            case 'checkbox':
                result = $.tag($.extend(commonAttrs(args.item),
                    {tagName: 'input', type: 'checkbox',
                        checked: args.item.checked}), true);
                    break;

            case 'columnSelect':
                result = $.tag({tagName: 'a',
                    href: '#Select:' + colTypes.join('-'),
                    title: 'Select a column from the grid',
                    'class': 'columnSelector',
                    contents: 'Select a column from the grid'}, true);

                var options =
                    [{tagName: 'option', value: '', contents: 'Select a Column'}];
                _.each(cols, function(c)
                {
                    options.push({tagName: 'option', value: c.id,
                        contents: $.htmlEscape(c.name)});
                });
                result += $.tag($.extend(commonAttrs(args.item),
                    {tagName: 'select', contents: options}), true);
                break;

            case 'radioGroup':
                var items = _.map(args.item.options, function(opt, i)
                {
                    var id = args.item.name + '_' + i;
                    return {tagName: 'div', 'class': ['radioLine', opt.type],
                        contents: [
                            $.extend(commonAttrs(args.item),
                                {id: id, tagName: 'input', type: 'radio',
                                'class': {value: 'wizExclude',
                                    onlyIf: opt.type != 'static'},
                                checked: opt.checked}),
                            {tagName: 'label', 'for': id,
                            contents:
                                renderInputType(sidebarObj, {context: args.context,
                                    item: opt, items: args.item.options, pos: i})}
                        ]};
                });
                result = $.tag({tagName: 'div', 'class': 'radioBlock',
                    contents: items}, true);
                break;
        }

        return result;
    };

    var createOuterPane = function(sidebarObj, config)
    {
        var $outerPane = $.tag({tagName: 'div',
            id: sidebarObj.$dom().attr('id') + '_outer_' + config.name,
            'class': 'outerPane'});
        var rData = {title: config.title,
            subPanes: _.sortBy(config.subPanes || {}, function(sp)
                { return sp.priority || sp.title; })};
        var directive = {
            '.title': 'title',
            '.paneSelect li':
            {
                'pane<-subPanes':
                {
                    'a': 'pane.title',
                    'a@href+': 'pane.title',
                    'a@title': 'pane.subtitle',
                    'a@data-paneName': 'pane.name',
                    '@class+': ' #{pane.name}'
                }
            },
            '.paneSelect@class+': function(a)
            { return _.isEmpty(a.context.subPanes) ? ' hide' : ''; }
        };

        $outerPane.append($.renderTemplate('outerPane', rData, directive));

        $outerPane.find('.paneSelect a').click(function(e)
        {
            e.preventDefault();
            selectPane(sidebarObj, $(this), config.name);
        });

        sidebarObj.$dom().append($outerPane);
        $outerPane.hide();
        sidebarObj._$outerPanes[config.name] = $outerPane;
    };

    /* Render the full pane from config */
    var renderPane = function(sidebarObj, config, data)
    {
        var $pane = $.tag({tagName: 'div',
            id: sidebarObj.$dom().attr('id') + '_' + config.name,
            'class': 'sidebarPane'});
        var rData = {title: config.title, subtitle: config.subtitle,
            sections: config.sections,
            finishButtons: (config.finishBlock || {}).buttons,
            data: data || {}};
        var directive = {
            '.subtitle': 'subtitle',
            '.formSection': {
                'section<-sections': {
                    '@class+': function(arg)
                    { return ' ' + (arg.item.type || '') +
                        ' ' + (arg.item.name || '') +
                        (arg.item.type == 'selectable' ? ' collapsed' : ''); },
                    '.formHeader': 'section.title',
                    '.formHeader@for': 'section.name',
                    '.sectionSelect@id': 'section.name',
                    '.sectionSelect@name': 'section.name',
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
                    '.+': function(a)
                    {
                        var opts = {text: a.item.text, className: [],
                            customAttrs: {'data-value': a.item.value,
                                'data-loginMsg': a.item.loginMessage}};

                        if (a.item.isDefault)
                        {
                            opts.className.push('arrowButton');
                            opts.iconClass = 'submit';
                        }
                        else if (a.item.isCancel)
                        { opts.iconClass = 'cancel'; }

                        if (a.item.requiresLogin)
                        { opts.className.push('requiresLogin'); }

                        return $.button(opts, true);
                    }
                }
            }
        };

        $pane.append($.renderTemplate('sidebarPane', rData, directive));

        if ($pane.find('label.required').length > 0)
        { $pane.find('div.required').removeClass('hide'); }

        $pane.find('.textPrompt')
            .example(function () { return $(this).attr('title'); });

        $pane.find('form').validate({ignore: ':hidden', errorElement: 'span',
            errorPlacement: function($error, $element)
            { $error.appendTo($element.closest('.line')); }});

        $pane.find('.formSection.selectable .sectionSelect').click(function(e)
        {
            var $c = $(this);
            _.defer(function()
            {
                var $sect = $c.closest('.formSection');
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

                // We're opening a section out-of-order, so store off the
                // current flow, then start a temp set in the newly opened
                // section
                if (!$.isBlank(sidebarObj._$mainWizardItem) && $c.value() &&
                    $sect.has(sidebarObj._$mainWizardItem).length < 1)
                {
                    sidebarObj._$mainFlowWizard = sidebarObj._$mainWizardItem;
                    sidebarObj._$currentWizard.wizardPrompt().close();
                    sidebarObj._$currentWizard = null;
                    sidebarObj._$mainWizardItem = null;
                    wizardAction(sidebarObj, $sect, 'nextField');
                }

                // We're closing a section that the flow was in, so skip
                // to the next section
                if (!$.isBlank(sidebarObj._$mainWizardItem) && !$c.value() &&
                    $sect.has(sidebarObj._$mainWizardItem).length > 0)
                {
                    sidebarObj._$currentWizard.wizardPrompt().close();
                    sidebarObj._$currentWizard = null;
                    sidebarObj._$mainWizardItem = null;
                    // If there is a main flow, it will resume; otherwise
                    // advance to the next section
                    if ($.isBlank(sidebarObj._$mainFlowWizard))
                    { wizardAction(sidebarObj, $sect, 'nextSection'); }
                }
            });
        });

        // Inputs inside labels are likely attached to radio buttons.
        // We need to preventDefault on the click so focus stays in the input,
        // and isn't stolen by the radio button; then we need to manually trigger
        // the selection of the radio button.  We use mouseup because textPrompt
        // interferes with click events
        $pane.find('.formSection label :input, .formSection label a')
            .click(function(e)
            {
                e.preventDefault();
            })
            .mouseup(function(e)
            {
                var forAttr = $(this).parents('label').attr('for');
                if (!$.isBlank(forAttr))
                { $pane.find('#' + forAttr).click(); }
            });

        $pane.find('.formSection .columnSelector').click(function(e)
        {
            e.preventDefault();

            var $link = $(this);
            var $overlay = $pane.closest('.outerPane').find('.paneOverlay');

            var cancelSelect = function()
            {
                $overlay.css('cursor', 'auto').addClass('hide');
                sidebarObj._$currentWizard.socrataTip().quickShow();
                $(document).unbind('.pane_' + sidebarObj._currentPane);
                $link.removeClass('inProcess');
                sidebarObj.$grid().blistTableAccessor().exitColumnChoose();
            };

            if ($link.is('.inProcess'))
            { cancelSelect(); }
            else
            {
                $overlay.css('cursor', 'crosshair').removeClass('hide');
                sidebarObj._$currentWizard.socrataTip().quickHide();
                // Cancel on ESC
                $(document).bind('keypress.pane_' + sidebarObj._currentPane,
                    function(e) { if (e.keyCode == 27) { cancelSelect(); } });
                $link.addClass('inProcess');

                var href = $link.attr('href');
                href = href.slice(href.indexOf('#') + 1);
                sidebarObj.$grid().blistTableAccessor().enterColumnChoose
                    (href.split(':')[1].split('-'),
                    function(c)
                    {
                        cancelSelect();
                        var $sel = $link.siblings('select');
                        if ($sel.length < 1)
                        {
                            $sel = $link.siblings('.uniform.selector')
                                .find('select');
                        }
                        $sel.val(c.id).change();
                        if (!$.isBlank($.uniform)) { $.uniform.update(); }
                    });
            }
        });

        $pane.find('.finishButtons a').click(function(e)
        {
            e.preventDefault();
            var $button = $(this);
            if ($button.is('.disabled')) { return; }

            sidebarObj.$dom().addClass('processing');

            var doCallback = function()
            {
                config.finishCallback(sidebarObj, data,
                    $pane, $button.attr('data-value'));
            };

            if (!$.isBlank(blist.util.inlineLogin) && $button.is('.requiresLogin'))
            {
                var msg = $button.attr('data-loginMsg') ||
                    sidebarObj.settings.defaultLoginMessage;
                blist.util.inlineLogin.verifyUser(
                    function(isSuccess)
                    {
                        if (isSuccess) { doCallback(); }
                        else { $pane.find('.mainError').text(msg); }
                    }, msg);
            }
            else
            { doCallback(); }
        });

        addWizards(sidebarObj, $pane, config);

        if (!$.isBlank($.uniform))
        {
            // Defer uniform hookup so the pane can be added first and all
            // the styles applied before swapping them for uniform controls
            _.defer(function()
                    { $pane.find('select, :checkbox, :radio, :file').uniform(); });
        }

        return $pane;
    };


    /*** Functions for handling wizard step-through ***/

    var addWizards = function(sidebarObj, $pane, config)
    {
        if (!$.isBlank(config.wizard))
        {
            $pane.find('.subtitleBlock').addClass('hasWizard')
                .data('sidebarWizard', config.wizard);
        }

        $pane.find('.formSection').each(function(i)
        {
            var $s = $(this);
            var s = config.sections[i];
            if (!$.isBlank(s.wizard))
            { $s.addClass('hasWizard').data('sidebarWizard',
                $.extend({defaultAction: 'nextField'}, s.wizard)); }

            $s.find('.sectionContent > .line').each(function(j)
            {
                var $l = $(this);
                var l = s.fields[j];
                if (!$.isBlank(l.wizard))
                {
                    $l.addClass('hasWizard').data('sidebarWizard',
                        $.extend({defaultAction: 'nextField'},
                            l.wizard, {positions: ['left'],
                            closeEvents: 'change'}));
                }
            });
        });

        if (!$.isBlank((config.finishBlock || {}).wizard))
        {
            $pane.find('.finishButtons').addClass('hasWizard')
                .data('sidebarWizard', $.extend({selector: '.button.submit'},
                    config.finishBlock.wizard, {positions: ['top']}));
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
        var $pane = sidebarObj.$currentPane().find('.scrollContent');
        var paneTop = $pane.offset().top;
        var top = $item.offset().top;
        var paneBottom = paneTop + $pane.height();
        var bottom = top + $item.outerHeight();

        var origScroll = $pane.scrollTop();
        var newScroll = origScroll;
        if (bottom > paneBottom) { newScroll += bottom - paneBottom; }
        if (top < paneTop) { newScroll -= (paneTop - top); }

        var doShow = function ()
        {
            var $mainItem = $item;
            /* Adjust actual item wizard is attached to */
            if (!$.isBlank(wiz.selector)) { $item = $item.find(wiz.selector); }
            if ($item.length < 1) { $item = $mainItem; }

            /* Set scroll first, because fetching the scrollTop can trigger a
             * scroll event in IE, which screws things up if _$currentWizard is
             * set without the tooltip being created */
            sidebarObj._curScroll = $pane.scrollTop();
            $item.wizardPrompt(wizConfig);
            sidebarObj._$currentWizard = $item;
            sidebarObj._$mainWizardItem = $mainItem;
        };

        if (newScroll != origScroll)
        { $pane.animate({scrollTop: newScroll}, doShow); }
        else { doShow(); }

        return true;
    };

    var wizardAction = function(sidebarObj, $item, action)
    {
        // If the pane is gone, no action to do
        if ($.isBlank(sidebarObj.$currentPane())) { return; }

        if (!$.isBlank(sidebarObj._$mainFlowWizard) &&
            sidebarObj._$mainFlowWizard.index($item) > -1)
        { return; }

        // After the first wizard action, clear initialLoad
        sidebarObj.$currentPane().removeClass('initialLoad');

        sidebarObj._$currentWizard = null;
        sidebarObj._$mainWizardItem = null;

        if ($item.is('.uniform, :input'))
        {
            $item.closest('form').validate().element($item.is(':input') ?
                $item : $item.find(':input'));
        }

        switch(action)
        {
            case 'nextSection':
                if ($item.closest('.formSection').length > 0)
                { $item = $item.closest('.formSection'); }

                if ($item.nextAll('.scrollContent').length > 0)
                { $item = $item.nextAll('.scrollContent')
                    .find('.formSection:visible, .finishButtons:visible'); }
                else
                { $item = $item
                    .nextAll('.formSection:visible, .finishButtons:visible'); }

                if (!$item.eq(0).is('.hasWizard') &&
                    $item.eq(0).find('.line.hasWizard:visible').length > 0)
                { wizardAction(sidebarObj, $item.eq(0), 'nextField'); }
                else
                { showWizard(sidebarObj, $item.filter('.hasWizard:first')); }
                break;

            case 'nextField':
                var $triggerItem = $item;
                if ($triggerItem.is('.formSection'))
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
                        wizardAction(sidebarObj, $item.closest('.formSection'),
                            'nextSection');
                    }
                }
                else
                { showWizard(sidebarObj, $triggerItem); }
                break;

            case 'expand':
                if ($item.is('.selectable.collapsed'))
                {
                    $item.find('.sectionSelect').click();
                    if (!$.isBlank($.uniform)) { $.uniform.update(); }
                }

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

    var showPaneSelectWizard = function(sidebarObj, config)
    {
        var $paneSel = sidebarObj.$currentOuterPane()
            .find('.paneSelect');
        if ($paneSel.isSocrataTip()) { $paneSel.socrataTip().destroy(); }

        var paneOptions = [];
        $paneSel.find('a').each(function()
        {
            var $a = $(this);
            var name = $a.attr('data-paneName');
            paneOptions.push({tagName: 'li',
                contents: [
                    {tagName: 'a', href: '#' + name, 'data-paneName': name,
                    'class': $a.attr('class'), contents: $a.text()},
                    {tagName: 'span',
                        // This is returning with &nbsp;, so replace them all
                        // with normal spaces
                        contents: $a.attr('title').replace(/\s/g, ' ')}
                ]});
        });

        var $content = $.tag({tagName: 'div', 'class': 'paneSelectWizard',
            contents: [
                {tagName: 'h3', 'class': 'title',
                contents: [config.subtitle || config.title + ' this ' +
                    blist.dataset.getTypeName(blist.display.view)]},
                {tagName: 'p',
                contents:
                    'Start by making one of the following selections above:'},
                {tagName: 'ul', 'class': 'paneOptions', contents: paneOptions}
            ]});

        $content.find('ul a').click(function(e)
        {
            e.preventDefault();
            selectPane(sidebarObj, $(this), config.name);
        });

        // Defer this call because if we just destroyed the tip, we need
        // to wait for it to fully go away
        _.defer(function()
        { $paneSel.socrataTip({content: $content, trigger: 'now',
                closeOnClick: false, shrinkToFit: false}); });
    };

    var selectPane = function(sidebarObj, $a, baseName)
    {
        if ($a.is('.selected, .disabled')) { return; }

        var name = $a.attr('data-paneName');
        var fullName = baseName + '.' + name;
        if ($.isBlank(sidebarObj._$panes[name]))
        { sidebarObj.addPane(fullName); }
        sidebarObj.show(fullName);
    };

})(jQuery);
