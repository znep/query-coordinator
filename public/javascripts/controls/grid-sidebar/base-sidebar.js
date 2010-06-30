(function($)
{
    $.validator.addMethod('data-notEqualTo', function(value, element, param)
    {
        if (this.optional(element)) { return true; }
        var isEqual = false;
        var $e = $(element);
        if (!$e.is(':visible')) { return true; }
        $(param + ':visible').each(function(i, p)
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

    // Special validator for figuring out which inputs have resulted in
    // a disabled section appearing
    $.validator.addMethod('data-onlyIfInput', function(value, element, param)
    {
        if (this.optional(element)) { return true; }
        return _.isNull(element.className.match(/\bsectionDisabled-/));
    },
    'This value is invalid');


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
        + noReset: boolean, if true form elements will not be reset on close
        + priority: Optional value for sorting a sub-pane within a parent;
            sorted ascending (lower values first)
        + sections: array of sections for entering data
        [
          {
            + title: section title
            + type: optional, 'selectable' makes the field collapseable.
                By default it will be collapsed; when collapsed, nothing is
                validated or wizard-ed.  'hidden' hides the section completely;
                it can be manually opened by calling showSection() and passing
                in the section name
            + name: internal name for field; required if it is of type selectable.
                Used to identify a hidden section to open
            + onlyIf: only display the section if these criteria are true.
                Currently accepts an object or array of objects:
            {
              + field: Input field to check the value of
              + value: Value that the field should be set to for the section
                  to be shown
              + func: Instead of field & value, a function that takes a model
                  object in, and returns true if available.  Will be recalled
                  whenever columns change
              + disable: boolean, if set the section will be disabled on a failed
                  test instead of hidden
              + disabledMessage: Message to display when the section is disabled
            }
            + customContent: Hash for rendering custom content using pure
            {
              + template: String of template name for pure
              + directive: pure directive
              + data: Data for pure rendering
              + callback: optional, function to be called with newly-rendered
                  section
            }
            + fields: array of input fields
            [
               {
                  + text: label for input
                  + type: required, one of: 'static', 'text', 'textarea',
                      'checkbox', 'select', 'columnSelect', 'radioGroup', 'slider'
                      - 'color' is a color picker.  By default, this will
                          display on the right end of the following line
                      - 'group' is a special option that only needs an options
                          array of subfields.  Also accepts extraClass
                      - 'repeater' is a special option that allows the user
                          to have multiple copies.  It takes several sepcial
                          options:
                          + field: A field element to be repeated
                          + minimum: The minimum that are required of this element;
                              this many will be rendered initially, and will
                              not have remove buttons; further added fields will
                              have remove buttons
                          + maximum: The upper limit on number of fields; once
                              this has been reached, the Add button will disappear
                          + addText: Text of the button to add new fields; defaults
                              to 'Add Value'
                  + name: required, HTML name of input.  This is the name the
                      value will be associated with in the output hash.  If it
                      has one or more periods (.), it will be taken as a nested
                      hash key, and the appropriate hashes will be created.
                      If the last piece of the key is just digits, then the
                      previous level will be an array, and this value be pushed
                      on to the end.
                      This name does not need to be globally unique; it will
                      be namespaced into the pane.  However, it should be unique
                      within the pane.  If the section has a name, it will be
                      namespaced into their, so it only has to be unique within
                      the section.  For repeaters, this name is the name of
                      the array.  Fields inside the repeater are rooted at the
                      particular object of the repeater array; so essentially
                      they are namespaced into the repeater
                  + prompt: optional, prompt text for text/textarea/select.
                      If null for select, will not add a prompt option
                  + defaultValue: default value to use for the field; for
                      checkboxes use true.  For radioGroup, the name of the option
                      that should be selected by default.  For color, also
                      accepts an array of colors that will be cycled through
                      in a repeater
                  + repeaterValue: like defaultValue, but used for the replicated
                      lines in a repeater; falls back to defaultValue (if set)
                  + required: optional, boolean, whether or not the input should be
                      validated as required (if visible)
                  + minimum, maximum: For slider, limits of the range
                  + trueValue, falseValue: For checkbox, optional values to map
                      true & false to.  defaultValue can be either of these
                      values, or true or false
                  + extraClass: extra class(es) to be applied to the input;
                      should be a single string, could have multiple
                      space-separated classes
                  + notequalto: optional, string to use for validating notequalto;
                      all fields that are validated like this should have the
                      same string
                  + isTableColumn: boolean, for columnSelect, use the
                      tableColumnId instead of the column ID
                  + columns: for type columnSelect, tells what type of columns
                      should be available
                  {
                    + type: array or single datatype names; empty for all
                    + hidden: boolean, whether or not to include hidden columns
                  }
                  + options: for group or radioGroup, array of sub-fields.
                      Same options as top-level fields.  For select, array of
                      hashes:
                  {
                    + text: text to display in the select item
                    + value: value of the select item
                    + data: optional, hash of key-value string pairs that
                        will be add as 'data-<key>' attributes to the select.
                        These can be used to store & retrieve extra data on
                        an option item
                  }
                      If used with linkedField, should be a function that
                      accepts the current value of the linkedField,
                      and returns an array of hashes as above, or null to
                      disable the select input
                  + linkedField: Used with select input.  Name of field that
                      should be monitored.  On change, the value is passed to
                      the options function and the options for the select are
                      updated.
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
    + wizard: If this is just a string, it will be used as the prompt
    {
      + prompt: text to display in wizard tip
      + defaultAction: default wizard action if the wizard is closed (because
          value is selected or button clicked)
      + actions: array of action buttons to display in the wizard
      [
        {
          + text: text for button
          + action: action to perform on click
        }
      ]
      + selector: optional, sub-element to prompt against
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
            done: {text: 'Done', value: true, isDefault: true},
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
            modalHiddenSelector: null,
            onSidebarClosed: function() {},
            onSidebarShown: function(primaryPane, secondaryPane) {},
            setSidebarTop: true
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

                sidebarObj._selectOptions = {};

                $(window).resize(function() { handleResize(sidebarObj); });
                $domObj.resize(function() { handleResize(sidebarObj); });

                $(document).bind(blist.events.MODAL_SHOWN, function()
                {
                    if (!$.isBlank(sidebarObj._$currentWizard))
                    { sidebarObj._$currentWizard.socrataTip().quickHide(); }
                });
                $(document).bind(blist.events.MODAL_HIDDEN, function()
                {
                    if (!$.isBlank(sidebarObj._$currentWizard))
                    { sidebarObj._$currentWizard.socrataTip().quickShow(); }
                });
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
                    if (sidebarObj.$currentPane() ==
                        sidebarObj._$panes[config.name])
                    { hideCurrentPane(sidebarObj); }
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

                    // IE7 leaves weird debris when closing if we use an
                    // animation
                    if ($.browser.msie && $.browser.majorVersion <= 7)
                    {
                        sidebarObj.$currentPane().show();
                        _.defer(function() { checkForm(sidebarObj); });
                    }
                    else
                    {
                        sidebarObj.$currentPane()
                            .fadeIn(function() { checkForm(sidebarObj); });
                    }

                    sidebarObj.$currentPane().find('.scrollContent')
                        .scroll(function(e)
                        { updateWizardVisibility(sidebarObj); });
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
                    if ($.browser.msie && $.browser.majorVersion <= 7)
                    { $overlay.show(); }
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

                sidebarObj.settings.onSidebarShown(nameParts.primary,
                    nameParts.secondary);
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
                    if ($.browser.msie && $.browser.majorVersion <= 7)
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

                sidebarObj.settings.onSidebarClosed();
            },

            refresh: function()
            {
                var sidebarObj = this;

                var pane = _.compact([sidebarObj._currentOuterPane,
                        sidebarObj._currentPane]).join('.');
                if ($.isBlank(pane)) { return; }

                sidebarObj.addPane(pane);
                sidebarObj.show(pane);
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

            showSection: function($pane, sectionName)
            {
                var sidebarObj = this;
                var $s = $pane.find('.formSection[name=' + sectionName + ']')
                    .removeClass('hide');
                if (!$.isBlank($s))
                { wizardAction(sidebarObj, $s, 'nextField'); }
            },

            baseFormHandler: function($pane, value)
            {
                if (!value)
                {
                    this.finishProcessing();
                    this.hide();
                    return false;
                }

                // Validate disabled sections
                $pane.find('.formSection.disabled:visible').addClass('error');

                // Validate form
                if (!$pane.find('form').valid())
                {
                    this.finishProcessing();
                    $pane.find('.mainError')
                        .text('There were problems with the specified values. ' +
                            'Please check the errors above.');
                    return false;
                }

                $pane.find('.mainError').text('');
                return true;
            },

            /* This turns a pane into an object with values based on the names
             * of the fields */
            getFormValues: function($pane)
            {
                var sidebarObj = this;
                var results = {};

                /* Helper function; this takes a full field name and value,
                 * the parent object it goes into */
                var addValue = function(name, value, parObj)
                {
                    // The name is something like
                    // gridSidebar_mapPane:displayFormat.plot.titleId

                    // First take off everything up to the colon; that is used
                    // simply to make it unique in the page
                    var p = name.split(':');
                    name = p[p.length - 1];

                    if ($.isBlank(name) || $.isBlank(value)) { return null; }

                    // Next pull apart the name into pieces.  For each level,
                    // recurse down, creating empty objects if needed.
                    // 'flags' is special, and assumed to be an array
                    p = name.split('.');
                    while (p.length > 1)
                    {
                        parObj[p[0]] = parObj[p[0]] ||
                            (p[0] == 'flags' || !$.isBlank(p[1].match(/^\d+$/)) ?
                                [] : {});
                        parObj = parObj[p[0]];
                        p.shift();
                    }

                    var ret;
                    if (_.isArray(parObj))
                    {
                        if (!$.isBlank(p[0].match(/^\d+$/)))
                        {
                            parObj.push(value);
                        }
                        // If an array and the value is true, then just push on
                        // the last part of the name as a value
                        else if (value)
                        {
                            parObj.push(p[0]);
                            ret = p[0];
                        }
                    }
                    else
                    {
                        // If an object, then stick the value in at the last
                        // element of the key
                        if (!$.isBlank(value) && $.isBlank(parObj[p[0]]))
                        { parObj[p[0]] = value; }
                        ret = parObj[p[0]];
                    }
                    // Return the element, since we may not have pushed it
                    // or overwritten it
                    return ret;
                };

                // Loop through all the inputs & sliders in dom order.
                // Filter down to only the visible ones that are not
                // .prompt (meaning not filled in), .sectionSelect (top-level
                // inputs used for flow control), or in .radioLine label
                // (these are in a radioGroup, and will be handled by getting
                // the selected radio button in the group and manually getting
                // the associated input)
                $pane.find('form :input, form .colorControl')
                    .filter(':visible:not(' +
                        '.prompt, .sectionSelect, .radioLine label *)')
                    .each(function()
                {
                    var $input = $(this);

                    // If this is a radio input, then either skip it if not
                    // selected; or find the input associated with it
                    if ($input.is('.radioLine :radio'))
                    {
                        if (!$input.is(':checked')) { return; }
                        $input = $input.closest('.radioLine')
                            .find('label :input:not(.prompt)');
                        if ($input.length < 1) { return; }
                    }

                    if ($input.is('.colorControl'))
                    { $input = $input.next(':input'); }

                    var value = $input.value();
                    if ($input.is(':checkbox'))
                    {
                        var t = $input.attr('data-trueValue');
                        var f = $input.attr('data-falseValue');
                        if (!$.isBlank(t) && value === true)
                        { value = t; }
                        else if (!$.isBlank(f) && value === false)
                        { value = f; }
                    }
                    else if ($input.is('.sliderInput'))
                    {
                        value /= parseFloat($input.attr('data-scale'));
                    }
                    else if ($input.is('select'))
                    {
                        // Convert select box values to real booleans if
                        // appropriate
                        if (value == 'true') { value = true; }
                        if (value == 'false') { value = false; }
                    }


                    var inputName = $input.attr('name');

                    // If this is in a group, then figure out if any required
                    // fields failed
                    if ($input.is('.group *'))
                    {
                        if ($.isBlank($input.attr('data-isrequired')))
                        {
                            var failed = false;
                            $input.closest('.inputBlock')
                                .find(':input[data-isrequired]').each(function()
                            {
                                var $this = $(this);
                                failed = failed || $this.is('.prompt') ||
                                    $.isBlank($this.value()) ||
                                    $this.value() === false;
                            });
                            if (failed) { return; }
                        }
                    }

                    // Start the parent out as top-level results
                    var parObj = results;
                    var parArray;
                    var parIndex;
                    if ($input.is('.line.repeater *'))
                    {
                        // If this is in a repeater, then it is name-spaced
                        // under the repeater.  Grab that name, and set up
                        // an array for it
                        parArray = addValue($input.closest('.line.repeater')
                            .find('.button.addValue').attr('name'), [], parObj);
                        // The name has a -num on the end that specifies order
                        // in the array; grab that off to use as the index
                        var p = inputName.split('-');
                        parIndex = p[p.length - 1];
                        inputName = p.slice(0, -1).join('-');
                        // Set up the object for this array index, and use
                        // that as the parent
                        if (!$.isBlank(parArray))
                        { parObj = parArray[parIndex] || {}; }
                    }

                    // If this is a column select, then parse the value as a num,
                    // since it is a column ID
                    value = !$.isBlank(value) &&
                        $input.is('.columnSelect select') ?
                            parseInt(value) : value;

                    // Now add the value
                    addValue(inputName, value, parObj);

                    // If this is a select, check for extra data on the actual
                    // option element
                    if ($input.is('select'))
                    {
                        var $sel = $input.find('option:selected');
                        var ckeys = $sel.attr('data-customKeys');
                        if (!$.isBlank(ckeys))
                        {
                            // If there are custom keys, loop through each one,
                            // and add the value in
                            _.each(ckeys.split(','), function(k)
                            {
                                addValue(k, $sel.attr('data-custom-' + k),
                                    parObj);
                            });
                        }
                    }

                    // Wait to add this to the parent array until the end,
                    // in case it failed the required checks and doesn't have
                    // anything real to be added
                    if (!$.isBlank(parArray) && !_.isEmpty(parObj))
                    { parArray[parIndex] = parObj; }
                });

                // Do a deep compact to get rid of any null fields, and
                // compact any arrays (especially repeaters, that may have
                // been filled in sparsely)
                return $.deepCompact(results);
            },

            finishProcessing: function()
            {
                this.$dom().removeClass('processing');
            },

            resetForm: function($pane)
            {
                if ($pane.is('.noReset')) { return; }

                $pane.find('.formSection.selectable:not(.collapsed)')
                    .each(function()
                {
                    var $s = $(this);
                    if ($s.find('[data-dataValue]').length < 1)
                    { $s.find('.sectionSelect').click(); }
                });

                $pane.find('.formSection.hidden').addClass('hide');

                $pane.find('.line.repeater .line.repeaterAdded').remove();
                $pane.find('.line.repeater > .line.hide').removeClass('hide');

                $pane.find('.ranWizard').removeClass('ranWizard');

                // Remove errors
                $pane.find('form').validate().resetForm();
                $pane.find('.mainError').text('');

                var resetInput = function($input)
                {
                    var defValue = $input.attr('data-dataValue') ||
                        $input.attr('data-defaultValue') || null;
                    $input.value(defValue);
                    // Fire events to make sure uniform controls are updated,
                    // and text prompts are reset
                    $input.change().focus().blur();
                };

                // First reset everything but radio buttons, because in a
                // radio group firing a change, focus or blur on an input in
                // a radio group selects the radio button for it, which ends up
                // always selecting the last radio button.  So first reset
                // everything besides radio buttons; then go back and reset those
                $pane.find('.line :input:not(:radio)').each(function()
                { resetInput($(this)); });

                $pane.find('.line .sliderControl').each(function()
                {
                    var $slider = $(this);
                    var $input = $slider.next(':input');
                    $slider.slider('value',
                        parseInt($input.attr('data-dataValue') ||
                            $input.attr('data-defaultValue') || 0));
                });

                $pane.find('.line :radio').each(function()
                { resetInput($(this)); });

                if (!$.isBlank($.uniform)) { $.uniform.update(); }
            },

            genericErrorHandler: function($pane, xhr)
            {
                this.finishProcessing();
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
            if ($paneSel.isSocrataTip())
            {
                $paneSel.socrataTip().destroy();
                sidebarObj._$currentWizard = null;
                sidebarObj._currentWizardTop = null;
                sidebarObj._$mainWizardItem = null;
            }
        }

        if (!$.isBlank(sidebarObj.$currentPane()))
        { sidebarObj.resetForm(sidebarObj.$currentPane()); }

        sidebarObj.$dom().find('.outerPane').hide()
            .find('.paneSelect a.selected').removeClass('selected');
        sidebarObj.$dom().find('.sidebarPane').hide()
            .find('.scrollContent').unbind('scroll');
        sidebarObj._currentOuterPane = null;
        sidebarObj._currentPane = null;
        clearWizard(sidebarObj);
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
        sidebarObj.$dom().height(gridHeight - adjH);
        if (sidebarObj.settings.setSidebarTop)
        { sidebarObj.$dom().css('top', -gridHeight + 'px') }

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

        _.defer(function()
        {
            setPosition(sidebarObj);
            updateWizardVisibility(sidebarObj);
        });
    };

    var updateWizardVisibility = function(sidebarObj)
    {
        if ($.isBlank(sidebarObj._$currentWizard)) { return; }

        var $item = sidebarObj._$currentWizard;
        var itemTop = $item.offset().top;
        if (itemTop == sidebarObj._currentWizardTop) { return; }

        $item.socrataTip().adjustPosition(
            {top: itemTop - sidebarObj._currentWizardTop});
        sidebarObj._currentWizardTop = itemTop;

        if ($.isBlank(sidebarObj.$currentPane())) { return; }

        var $pane = sidebarObj.$currentPane().find('.scrollContent');
        var paneTop = $pane.offset().top;
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

    var renderSelectOption = function(opt, curVal)
    {
        var item = {tagName: 'option', value: opt.value,
            selected: opt.value === curVal, contents: opt.text};
        var dataKeys = [];
        _.each(opt.data || {}, function(v, k)
            {
                item['data-custom-' + k] = v;
                dataKeys.push(k);
            });
        if (dataKeys.length > 0)
        { item['data-customKeys'] = dataKeys.join(','); }
        return item;
    };

    /* Render a single input field */
    var renderLine = function(sidebarObj, args)
    {
        // Add optional modifier to name; also adjust to make it unique
        args.item = $.extend({}, args.item, {origName : args.item.name,
            name: args.context.paneId + ($.isBlank(args.context.sectionName) ?
                '' : '_' + args.context.sectionName) + ':' +
                (args.item.name || '') +
                ($.isBlank(args.context.repeaterIndex) ? '' :
                    '-' + args.context.repeaterIndex)});

        var contents = [];
        if (!args.context.inputOnly)
        {
            contents.push({tagName: 'label', 'for': args.item.name,
                    'class': [{value: 'required', onlyIf: args.item.required &&
                        !args.context.inRepeater}],
                    contents: args.item.text});
        }

        var commonAttrs = function(item)
        {
            return {id: item.name, name: item.name, title: item.prompt,
                'class': [ {value: 'required', onlyIf: item.required &&
                    !args.context.inRepeater},
                        {value: 'textPrompt', onlyIf: !$.isBlank(item.prompt)},
                        item.notequalto, item.extraClass ],
                'data-origName': item.origName,
                'data-isRequired': {value: true, onlyIf: item.required},
                'data-notequalto': {value: '.' + (item.notequalto || '')
                        .split(' ').join(', .'),
                    onlyIf: !$.isBlank(item.notequalto)},
                'data-defaultValue': item.defaultValue,
                'data-dataValue': {value: item.dataValue,
                    onlyIf: !$.isBlank(item.dataValue)}
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
                colTypes = $.arrayify(args.item.columns.type);
                cols = _.select(cols, function(c)
                    { return _.include(colTypes, c.renderTypeName); });
            }
        }

        var defValue = args.item.defaultValue;
        if (args.context.inRepeater && !_.isUndefined(args.item.repeaterValue))
        { defValue = args.item.repeaterValue; }

        var getValue = function(data, name)
        {
            var nParts = name.split('.');
            var base = data;
            while (nParts.length > 0 && !$.isBlank(base))
            { base = base[nParts.shift()]; }
            if (nParts.length == 0 && !$.isBlank(base))
            {
                return base;
            }
            return null;
        };

        var curValue;
        if (!$.isBlank(args.item.origName))
        {
            curValue = getValue(args.context.data, args.item.origName);
            if (!$.isBlank(curValue))
            { args.item = $.extend({}, args.item, {dataValue: curValue}); }
        }


        var checkRequiredData = function(contextData, field)
        {
            var fields = $.arrayify(field);
            while (fields.length > 0)
            {
                var f = fields.shift();
                if (f.type == 'group')
                {
                    fields = fields.concat(f.options);
                    continue;
                }

                if (!f.required) { continue; }

                if ($.isBlank(getValue(contextData, f.name))) { return false; }
            }
            return true;
        };


        switch (args.item.type)
        {
            case 'static':
                contents = [];
                contents.push($.extend(commonAttrs(args.item),
                    {tagName: 'span', contents: args.item.text}));
                break;

            case 'text':
                contents.push($.extend(commonAttrs(args.item),
                    {tagName: 'input', type: 'text', value:
                        $.htmlEscape(curValue || defValue)}));
                break;

            case 'textarea':
                contents.push($.extend(commonAttrs(args.item),
                    {tagName: 'textarea', contents:
                        $.htmlEscape(curValue || defValue)}));
                break;

            case 'checkbox':
                var v = curValue;
                if ($.isBlank(v)) { v = defValue; }
                contents.push($.extend(commonAttrs(args.item),
                    {tagName: 'input', type: 'checkbox',
                        'data-trueValue': args.item.trueValue,
                        'data-falseValue': args.item.falseValue,
                        checked: (!$.isBlank(args.item.trueValue) &&
                            v === args.item.trueValue) ||
                            _.include([true, 'true', 1, '1', 'yes', 'checked'],
                                v)}));
                break;

            case 'select':
                var options = [];
                if (!_.isNull(args.item.prompt))
                {
                    options.push({tagName: 'option', value: '', 'class': 'prompt',
                        contents: args.item.prompt || 'Select a value'});
                }
                if (_.isBoolean(curValue)) { curValue = curValue.toString(); }

                var tag = {tagName: 'select', contents: options};
                if (_.isArray(args.item.options))
                {
                    _.each(args.item.options, function(o)
                    {
                        options.push(renderSelectOption(o, curValue || defValue));
                    });
                }
                else if (_.isFunction(args.item.options))
                {
                    var u = _.uniqueId();
                    sidebarObj._selectOptions[u] = args.item.options;
                    tag['data-selectOption'] = u;
                }

                if (!$.isBlank(args.item.linkedField))
                { tag['data-linkedField'] = args.item.linkedField; }

                contents.push($.extend(commonAttrs($.extend({}, args.item,
                        {dataValue: curValue})), tag));
                break;

            case 'columnSelect':
                contents.push({tagName: 'a',
                    href: '#Select:' + colTypes.join('-'),
                    title: 'Select a column from the grid',
                    'class': ['columnSelector',
                        {value: 'tableColumn', onlyIf: args.item.isTableColumn}],
                    contents: 'Select a column from the grid'});

                var options =
                    [{tagName: 'option', value: '', contents: 'Select a column'}];
                _.each(cols, function(c)
                {
                    var cId = args.item.isTableColumn ? c.tableColumnId : c.id;
                    options.push({tagName: 'option', value: cId,
                        selected: (curValue || defValue) == cId,
                        contents: $.htmlEscape(c.name)});
                });
                contents.push($.extend(commonAttrs(args.item),
                    {tagName: 'select', contents: options}));
                break;

            case 'slider':
                var min = args.item.minimum || 0;
                var max = args.item.maximum || 100;
                var scale = 1;
                if (max <= 1)
                {
                    scale = 100;
                    min *= scale;
                    max *= scale;
                    defValue *= scale;
                    curValue *= scale;
                }
                contents.push({tagName: 'div', 'class': 'sliderControl',
                        'data-min': min, 'data-max': max});

                contents.push($.extend(commonAttrs($.extend({}, args.item,
                        {defaultValue: defValue, dataValue: curValue,
                            extraClass: 'sliderInput'})),
                    {tagName: 'input', type: 'text', value: (curValue || defValue),
                    'data-scale': scale, disabled: true}));
                break;

            case 'color':
                var item = $.extend({}, args.item,
                    {defaultValue: $.arrayify(args.item.defaultValue || [])});
                var defColor = item.defaultValue[args.context.repeaterIndex] ||
                    item.defaultValue[0];
                contents.push({tagName: 'a', href: '#Color', title: 'Choose color',
                    'class': 'colorControl', contents: 'Choose color',
                    style: {'background-color': defColor}});
                contents.push($.extend(commonAttrs(item),
                    {tagName: 'input', type: 'hidden', value: defColor}));
                break;

            case 'group':
                contents = [];
                var items = _.map(args.item.options, function(opt, i)
                {
                    return renderLine(sidebarObj,
                                {context: $.extend({}, args.context,
                                    {noTag: true}),
                                item: opt, items: args.item.options, pos: i});
                });
                contents.push({tagName: 'div',
                    'class': ['inputBlock', args.item.extraClass],
                    contents: items});
                break;

            case 'radioGroup':
                var itemAttrs = commonAttrs(args.item);
                var items = _.map(args.item.options, function(opt, i)
                {
                    var id = itemAttrs.id + '-' + i;
                    return {tagName: 'div', 'class': ['radioLine', opt.type],
                        contents: [
                            $.extend({}, itemAttrs,
                                {id: id, tagName: 'input', type: 'radio',
                                'class': {value: 'wizExclude',
                                    onlyIf: opt.type != 'static'},
                                checked: (curValue || defValue) == opt.name,
                                'data-defaultValue': defValue == opt.name}),
                            {tagName: 'label', 'for': id,
                            contents:
                                renderLine(sidebarObj,
                                    {context: $.extend({}, args.context,
                                        {noTag: true, inputOnly: true}),
                                    item: opt, items: args.item.options, pos: i})
                            }
                        ]};
                });
                contents.push({tagName: 'div', 'class': 'radioBlock',
                    contents: items});
                break;

            case 'repeater':
                if ($.isBlank(args.item.text))
                { contents = []; }

                var templateLine = renderLine(sidebarObj,
                            {item: $.extend({}, args.item.field,
                                    {lineClass: 'repeaterAdded'}),
                                context: $.extend({}, args.context,
                                     {repeaterIndex: 'templateId', noTag: true,
                                        inRepeater: true})
                    });
                var removeButton = {tagName: 'a', href: '#remove',
                    title: 'Remove', 'class': 'removeLink delete',
                    contents: {tagName: 'span', 'class': 'icon'}};
                templateLine.contents.unshift(removeButton);
                templateLine = $.htmlEscape($.tag(templateLine, true));

                curValue = _.select(curValue || [], function(v)
                { return checkRequiredData(v, args.item.field); });
                for (var i = 0; i < (curValue.length || args.item.minimum || 1);
                    i++)
                {
                    var contextData = curValue[i] || args.context.data;
                    var hasRequiredData =
                        checkRequiredData(contextData, args.item.field);

                    var l = renderLine(sidebarObj,
                                {item: args.item.field,
                                    context: $.extend({}, args.context,
                                         {repeaterIndex: i, noTag: true,
                                            inRepeater: i >= args.item.minimum,
                                            data: hasRequiredData ?
                                                contextData : null})
                    });

                    if (i >= args.item.minimum)
                    { l.contents.unshift(removeButton); }

                    contents.push(l);
                }

                contents.push($.button({text: args.item.addText || 'Add Value',
                    customAttrs: $.extend(commonAttrs(args.item),
                        {'data-template': templateLine,
                        'data-count': i, 'data-dataValue': null,
                        'data-maximum': args.item.maximum}),
                    className: 'addValue',
                    iconClass: 'add'}, true));
                break;
        }

        if (args.context.inputOnly)
        {
            return args.context.noTag ? contents :
                _.map(contents, function(c) { return $.tag(c, true); }).join('');
        }
        else
        {
            var line = {tagName: 'div',
                'class': ['line', 'clearfix', args.item.type, args.item.lineClass],
                contents: contents};
            return args.context.noTag ? line : $.tag(line, true);
        }
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
        var paneId = sidebarObj.$dom().attr('id') + '_' + config.name;
        var $pane = $.tag({tagName: 'div', id: paneId, 'class': 'sidebarPane'});
        if (config.noReset) { $pane.addClass('noReset'); }
        var rData = {title: config.title, subtitle: config.subtitle,
            sections: config.sections, paneId: paneId,
            finishButtons: (config.finishBlock || {}).buttons,
            data: data || config.dataSource || {}};
        var sectionOnlyIfs = {};
        var customSections = {};
        var directive = {
            '.subtitle': 'subtitle',
            '.subtitleBlock@class+': function(a)
            { return $.isBlank(a.context.subtitle) ? 'hide' : ''; },
            '.formSection': {
                'section<-sections': {
                    '@class+': function(arg)
                    { return _.compact([arg.item.type, arg.item.name,
                        (!$.isBlank(arg.item.onlyIf) ||
                            arg.item.type == 'hidden' ? 'hide' : ''),
                        (!$.isBlank(arg.item.customContent)) ? 'custom' : '' ])
                        .join(' '); },
                    '@data-onlyIf': function(arg)
                    {
                        if (!$.isBlank(arg.item.onlyIf))
                        {
                            var u = _.uniqueId();
                            sectionOnlyIfs[u] = $.arrayify(arg.item.onlyIf);
                            return u;
                        }
                        return '';
                    },
                    '@data-customContent': function(arg)
                    {
                        if (!$.isBlank(arg.item.customContent))
                        {
                            var u = _.uniqueId();
                            customSections[u] = arg.item.customContent;
                            return u;
                        }
                        return '';
                    },
                    '@name': 'section.name',
                    '.formHeader': 'section.title',
                    '.formHeader@for': 'section.name',
                    '.formHeader@class+': function(arg)
                    {
                        return $.isBlank(arg.item.title) ? 'hide' : '';
                    },
                    '.sectionSelect@id': 'section.name',
                    '.sectionSelect@name': 'section.name',
                    '.sectionContent+': function(a)
                    { return _.map(a.item.fields || [], function(f, i)
                        { return renderLine(sidebarObj,
                            {context: $.extend({}, a.context,
                                {sectionName: a.item.name}),
                            item: f, items: a.item.fields, pos: i}); }
                        ).join(''); }
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

        // Dynamically show/hide panes
        _.each(sectionOnlyIfs, function(oif, uid)
        {
            var $section = $pane.find('[data-onlyIf=' + uid + ']');

            // Set up helper function
            var showHideSection = function()
            {
                _.defer(function()
                {
                    var isHidden = false;
                    var isDisabled = false;
                    var msg = '';

                    $section.removeClass('error');

                    var $firstField;
                    _.each(oif, function(o)
                    {
                        var failed = false;
                        if (!$.isBlank(o.$field))
                        {
                            failed = o.$field.val() != o.value;

                            if ($.isBlank($firstField))
                            { $firstField = o.$field; }
                        }
                        else if (_.isFunction(o.func))
                        { failed = !o.func(sidebarObj.$grid().blistModel()); }

                        if (o.disable)
                        {
                            isDisabled = isDisabled || failed;
                            if (failed && !$.isBlank(o.disabledMessage))
                            {
                                msg += _.isFunction(o.disabledMessage) ?
                                    o.disabledMessage() : o.disabledMessage;
                            }
                        }
                        else
                        { isHidden = isHidden || failed; }
                    });

                    // If this section is being hidden or disabled and has an
                    // active wizard in it, then we need to move it elsewhere
                    if ((isHidden || isDisabled) &&
                        !$.isBlank(sidebarObj._$mainWizardItem) &&
                        $.contains($section[0], sidebarObj._$mainWizardItem[0]))
                    {
                        clearWizard(sidebarObj);
                        if (!$.isBlank($firstField))
                        {
                            // If we found a field to attach the wizard to,
                            // then move it there
                            var $wizItem = $firstField.closest('.hasWizard');
                            _.defer(function()
                            { showWizard(sidebarObj, $wizItem); });
                        }
                    }

                    // Update class on associated field so it can get validated
                    // This is kind of fragile, since it assumes the $firstField
                    // is related to it being disabled
                    if (!$.isBlank($firstField))
                    {
                        $firstField.toggleClass('sectionDisabled-' +
                            $section.attr('name'), !isHidden && isDisabled);
                    }

                    $section.toggleClass('hide', isHidden);
                    $section.toggleClass('disabled', isDisabled);

                    if (isDisabled)
                    { $section.find('.sectionDisabledMessage').text(msg); }

                    updateWizardVisibility(sidebarObj);
                });
            };


            // Validate all fields
            _.each(oif, function(o)
            {
                var isField = !$.isBlank(o.field);
                var isFunc = _.isFunction(o.func);
                if (!isField && !isFunc)
                { throw 'Only field-value or func objects supported ' +
                    'for section onlyIfs'; }

                if (isField)
                {
                    // This isn't going to work if there is a section name...
                    o.$field = $pane.find(':input[name=' +
                        paneId + ':' + o.field + ']');
                    o.$field.change(showHideSection).keypress(showHideSection)
                        .click(showHideSection).attr('data-onlyIfInput', true);
                }
                else if (isFunc)
                {
                    $(document).bind(blist.events.COLUMNS_CHANGED,
                        showHideSection);
                }
            });

            showHideSection();
        });

        $pane.find('.formSection.selectable').each(function()
        {
            var $s = $(this);
            var hasData = $s.find('[data-dataValue]').length > 0;
            $s.toggleClass('collapsed', !hasData);
            $s.find('.sectionSelect').value(hasData);
        });

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
                    updateWizardVisibility(sidebarObj);
                }

                // We're opening a section out-of-order, so store off the
                // current flow, then start a temp set in the newly opened
                // section
                if (!$.isBlank(sidebarObj._$mainWizardItem) && $c.value() &&
                    $sect.index(sidebarObj._$mainWizardItem) < 0 &&
                    $sect.has(sidebarObj._$mainWizardItem).length < 1)
                {
                    sidebarObj._$mainFlowWizard = sidebarObj._$mainWizardItem;
                    clearWizard(sidebarObj);
                    resetWizard(sidebarObj._$mainFlowWizard);
                    wizardAction(sidebarObj, $sect, 'nextField');
                }

                // We're closing a section that the flow was in, so skip
                // to the next section
                if (!$.isBlank(sidebarObj._$mainWizardItem) && !$c.value() &&
                    $sect.has(sidebarObj._$mainWizardItem).length > 0)
                {
                    var $mwi = sidebarObj._$mainWizardItem;
                    clearWizard(sidebarObj);
                    resetWizard($mwi);
                    // If there is a main flow, resume it; otherwise
                    // advance to the next section
                    if ($.isBlank(sidebarObj._$mainFlowWizard))
                    { wizardAction(sidebarObj, $sect, 'nextSection'); }
                    else
                    {
                        var $resumeItem = sidebarObj._$mainFlowWizard;
                        sidebarObj._$mainFlowWizard = null;
                        showWizard(sidebarObj, $resumeItem);
                    }
                }
            });
        });

        var addValue = function($button)
        {
            var $container = $button.closest('.line.repeater');
            var $newLine = $($.htmlUnescape($button.attr('data-template')));
            $newLine.find('.required').removeClass('required');

            var i = parseInt($button.attr('data-count'));
            $button.attr('data-count', i + 1);
            var attrMatch = '-templateId';
            $newLine.find('[name$=' + attrMatch + '], [id$=' + attrMatch +
                '], [for$=' + attrMatch + ']').each(function()
            {
                var $elem = $(this);
                _.each(['name', 'id', 'for'], function(aName)
                {
                    var a = $elem.attr(aName);
                    if (!$.isBlank(a) && a.endsWith(attrMatch))
                    { $elem.attr(aName, a.slice(0, -attrMatch.length) + '-' + i); }
                });
            });

            $newLine.find('.colorControl').each(function()
            {
                var $a = $(this);
                var $i = $a.next(':input');
                var colors = ($i.attr('data-defaultValue') || '').split(' ');
                if (colors.length < 2) { return; }

                var newColor = colors[i % colors.length];
                $a.css('background-color', newColor);
                $i.val(newColor);
            });

            hookUpFields($newLine);
            $button.before($newLine);

            checkRepeaterMaxMin($container);
            updateWizardVisibility(sidebarObj);
        };

        var checkRepeaterMaxMin = function($repeater)
        {
            var numLines = $repeater.children('.line:not(.hide)').length;
            var $button = $repeater.children('.button.addValue');
            if (numLines < 1) { _.defer(function() { addValue($button); }); }

            var max = $button.attr('data-maximum');
            if ($.isBlank(max)) { return; }

            $button.toggleClass('hide', numLines >= parseInt(max));
            updateWizardVisibility(sidebarObj);
        };

        var hookUpFields = function($container)
        {
            $container.find('.textPrompt')
                .example(function () { return $(this).attr('title'); });

            $container.find(':input').change(function()
            { _.defer(function() { checkForm(sidebarObj); }); });

            var checkRadio = function(e)
            {
                var forAttr = $(this).parents('label').attr('for');
                if (!$.isBlank(forAttr))
                { $pane.find('#' + $.safeId(forAttr)).click(); }
            };

            // Inputs inside labels are likely attached to radio buttons.
            // We need to preventDefault on the click so focus stays in the input,
            // and isn't stolen by the radio button; then we need to manually
            // trigger the selection of the radio button.  We use mouseup
            // because textPrompt interferes with click events
            $container.find('label :input, label a')
                .click(function(e)
                {
                    e.preventDefault();
                })
                .mouseup(checkRadio).change(checkRadio).focus(checkRadio);

            $container.find('.columnSelector').click(function(e)
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
                            $sel.val($link.is('.tableColumn') ?
                                c.tableColumnId : c.id).change();
                            if (!$.isBlank($.uniform)) { $.uniform.update(); }
                        });
                }
            });

            $container.find('.sliderControl').each(function()
            {
                var $slider = $(this);
                $slider.slider({min: parseInt($slider.attr('data-min')),
                    max: parseInt($slider.attr('data-max')),
                    value: parseInt($slider.next(':input').val())});
            })
            .bind('slide', function(event, ui)
            { $(this).next(':input').val(ui.value); });

            $container.find('.colorControl').colorPicker().bind('color_change',
                function(e, newColor)
                {
                    $(this).css('background-color', newColor)
                        .next(':input').val(newColor);
                })
                .mousedown(function(e)
                {
                    var $t = $(this);
                    $t.data('colorpicker-color', $t.next(':input').val());
                });

            $container.find('.line.repeater').each(function()
            { checkRepeaterMaxMin($(this)); });

            $container.find('.removeLink').click(function(e)
            {
                e.preventDefault();
                var $t = $(this);
                var $repeater = $t.closest('.line.repeater');
                var $line = $t.closest('.line');
                if ($line.is('.repeaterAdded')) { $line.remove(); }
                else { $line.addClass('hide'); }

                checkRepeaterMaxMin($repeater);
                updateWizardVisibility(sidebarObj);
            });


            // Find selects that have options linked to another field.  Hook
            // them up to change whenever the associated field is changed
            $container.find('select[data-linkedField]').each(function()
            {
                var $select = $(this);
                var selOpt = sidebarObj._selectOptions[$select
                    .attr('data-selectOption')];
                if (!_.isFunction(selOpt)) { return; }

                var linkedSel = ':input[data-origName=' +
                    $select.attr('data-linkedField') + ']:first';
                var $par = $select.closest('.line.group, .formSection');
                var $linkedItem = $par.find(linkedSel);
                if ($linkedItem.length < 1)
                { $linkedItem = $select.closest('form').find(linkedSel); }

                var adjustOptions = function()
                {
                    var newOpts = selOpt($linkedItem.val());
                    $select.find('option:not(.prompt)').remove();
                    $select.attr('disabled', $.isBlank(newOpts));

                    _.each(newOpts || [], function(o)
                    {
                        $select.append($.tag(renderSelectOption(o)));
                    });
                    $select.val('').change();

                    if (!$.isBlank($.uniform) && !$.isBlank($.uniform.update))
                    { $.uniform.update(); }
                };
                var defAdjOpts = function() { _.defer(adjustOptions); }

                $linkedItem.change(defAdjOpts).blur(defAdjOpts);
                adjustOptions();

                if (!$.isBlank($select.attr('data-dataValue')))
                {
                    $select.val($select.attr('data-dataValue'));
                    if (!$.isBlank($.uniform) && !$.isBlank($.uniform.update))
                    { $.uniform.update(); }
                }
            });

            if (!$.isBlank($.uniform))
            {
                // Defer uniform hookup so the pane can be added first and all
                // the styles applied before swapping them for uniform controls
                _.defer(function()
                        { $container.find('select, :checkbox, :radio, :file')
                            .uniform(); });
            }
        };

        hookUpFields($pane);

        $pane.find('.button.addValue').click(function(e)
        {
            e.preventDefault();
            addValue($(this));
        });


        $pane.find('.finishButtons a').click(function(e)
        {
            e.preventDefault();
            var $button = $(this);
            if ($button.is('.disabled')) { return; }

            sidebarObj.$dom().addClass('processing');

            var doCallback = function()
            {
                if (_.isFunction(config.finishCallback))
                {
                    config.finishCallback(sidebarObj, data,
                        $pane, $button.attr('data-value'));
                }
                else
                {
                    sidebarObj.finishProcessing();
                    sidebarObj.hide();
                }
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

        // Once we've hooked up everything standard, render any custom content.
        _.each(customSections, function(cs, uid)
        {
            var $section = $pane.find('[data-customContent=' + uid + ']');
            var $sc = $section.find('.sectionContent');
            $sc.addClass(cs.template).append($.renderTemplate(cs.template,
                    cs.data || {}, cs.directive));

            if (_.isFunction(cs.callback))
            { cs.callback($sc); }
        });

        $pane.find('form').validate({ignore: ':hidden', errorElement: 'span',
            errorPlacement: function($error, $element)
            { $error.appendTo($element.closest('.line')); }});

        return $pane;
    };

    var checkForm = function(sidebarObj)
    {
        var $pane = sidebarObj.$currentPane();
        if ($.isBlank($pane)) { return; }

        $pane.find('.finishButtons .submit').toggleClass('disabled',
            $pane.find(':input.required:visible')
             .filter(':blank, .prompt, :checkbox:unchecked').length > 0 ||
            $pane.find('.formSection:visible.disabled').length > 0);
    };

    /*** Functions for handling wizard step-through ***/

    var addWizards = function(sidebarObj, $pane, config)
    {
        if (!$.isBlank(config.wizard))
        {
            $pane.find('.subtitleBlock').addClass('hasWizard')
                .data('sidebarWizard', $.objectify(config.wizard, 'prompt'));
        }

        $pane.find('.formSection').each(function(i)
        {
            var $s = $(this);
            var s = config.sections[i];
            if (!$.isBlank(s.wizard))
            { $s.addClass('hasWizard').data('sidebarWizard',
                $.extend({defaultAction: 'nextField',
                        actions: $s.is('.selectable') ?
                        $.gridSidebar.wizard.buttonGroups.sectionExpand : null},
                    $.objectify(s.wizard, 'prompt'))); }

            $s.find('.sectionContent > .line').each(function(j)
            {
                var $l = $(this);
                var l = s.fields[j];
                if (!$.isBlank(l.wizard))
                {
                    var defActions = [];
                    if ($l.find('label.required').length < 1)
                    { defActions.push($.gridSidebar.wizard.buttons.skip); }
                    if ($l.is(':not(.select, .columnSelect, .checkbox)'))
                    { defActions.push($.gridSidebar.wizard.buttons.done); }

                    $l.addClass('hasWizard').data('sidebarWizard',
                        $.extend({defaultAction: 'nextField', actions: defActions,
                            selector: '.addValue'},
                            $.objectify(l.wizard, 'prompt'), {positions: ['left'],
                            closeEvents: $l.is('.repeater, .group') ?
                                'none' : 'change'}));
                }
            });
        });

        if (!$.isBlank((config.finishBlock || {}).wizard))
        {
            $pane.find('.finishButtons').addClass('hasWizard')
                .data('sidebarWizard', $.extend({selector: '.button.submit'},
                    $.objectify(config.finishBlock.wizard, 'prompt'),
                    {positions: ['top']}));
        }
    };

    var clearWizard = function(sidebarObj)
    {
        if (!$.isBlank(sidebarObj._$currentWizard))
        {
            sidebarObj._$currentWizard.wizardPrompt().close();
            sidebarObj._$currentWizard = null;
            sidebarObj._currentWizardTop = null;
            sidebarObj._$mainWizardItem = null;
        }
    };

    var resetWizard = function($item)
    {
        $item.removeClass('ranWizard');
    };

    var showWizard = function(sidebarObj, $item)
    {
        if ($item.length < 1) { return false; }

        var wiz = $item.data('sidebarWizard');
        if ($.isBlank(wiz)) { return false; }

        var wizConfig = {prompt: wiz.prompt || null,
            positions: wiz.positions || null,
            closeEvents: wiz.closeEvents || null};

        if ($item.is('.ranWizard'))
        {
            wizardAction(sidebarObj, $item, wiz.defaultAction || 'nextField');
            return true;
        }

        // If we hit a disabled submit button, then prompting them would be bad.
        // So find the first failed required field
        if ($item.has('.finishButtons .submit.disabled').length > 0)
        {
            var $form = sidebarObj.$currentPane().find('form');
            $form.valid();
            var $errorLine = $form.find(':input.error:first')
                .closest('.line.hasWizard');
            resetWizard($errorLine);
            _.defer(function() { showWizard(sidebarObj, $errorLine); });
            return true;
        }

        // If we hit an already-expanded section, go into
        if ($item.is('.formSection.selectable:not(.collapsed)'))
        {
            wizardAction(sidebarObj, $item, wiz.defaultAction || 'nextField');
            return true;
        }

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
            sidebarObj._currentWizardTop = $item.offset().top;
            sidebarObj._$mainWizardItem = $mainItem;
            $item.find(':text, textarea').focus();
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
        // Bail out if we're trying to advance an old wizard
        if (!$.contains(sidebarObj.$currentPane()[0], $item[0])) { return; }
        // If we just finished a field that is invisible, don't advance;
        // because we just left something that is now gone
        if (!$item.is(':visible')) { return; }

        if (!$.isBlank(sidebarObj._$mainFlowWizard) &&
            sidebarObj._$mainFlowWizard.index($item) > -1)
        { return; }

        // After the first wizard action, clear initialLoad
        sidebarObj.$currentPane().removeClass('initialLoad');

        clearWizard(sidebarObj);
        $item.addClass('ranWizard');

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
                { _.defer(function() { showWizard(sidebarObj, $triggerItem); }); }
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
                        contents: $a.attr('title').clean()}
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

        sidebarObj._$currentWizard = sidebarObj._$mainWizardItem = $paneSel;
        sidebarObj._currentWizardTop = $paneSel.offset().top;

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
