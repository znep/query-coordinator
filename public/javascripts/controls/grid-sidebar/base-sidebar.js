(function($)
{
    var uniformEnabled = true;

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

    $.validator.addMethod('data-custom-4x4uid', function(value, element, param)
    {
        var viewUid = value;

        // caller passes in prompt as value where value should be empty.
        if ($.isBlank(viewUid) || viewUid == $(element).attr('title') || viewUid.match(blist.util.patterns.UID))
        {
            return true;
        }

        var viewUidMatches = viewUid.match(
            /(\/[a-zA-Z0-9_\-]+){1,2}\/(\w{4}-\w{4})/);
        if ($.isBlank(viewUidMatches))
        {
            return false;
        }
        else
        {
            $(element).val(viewUidMatches[2]);
        }
        return true;
    },
    'This requires a 4x4 view UID');

    // Special validator for validating required file types
    $.validator.addMethod('data-requiredTypes', function(value, element, param)
    {
        if (this.optional(element)) { return true; }
        return $.isBlank(param);
    },
    $.format('{0} file is required'));

    // Special validator for handling ESRI Layer URLs
    $.validator.addMethod('data-custom-validlayerurl', function(value, element, param)
    {
        if (this.optional(element)) { return true; }
        if (param == 'valid') { return true; }
        if (_.include(['invalid', 'verifying'], param)) { return false; }

        var $element = $(element);
        var validator = this;
        $element.attr('data-custom-validlayerurl', 'verifying');
        $.getJSON("/admin/verify_layer_url", {'url': value}, function(data)
            {
                if (data.value)
                {
                    $element.val(data.value);
                    $element.attr('data-custom-validlayerurl', 'valid');
                    $element.closest('.inputBlock')
                        .find('select option:selected')
                            .attr('data-custom-type', data.data.type);
                }
                else
                {
                    $element.attr('data-custom-validlayerurl', 'invalid');
                }
                validator.element(element);
            });
    },
    function (value, element)
    {
        return _.include(['unverified', 'verifying'], value)
                ? 'Verifying URL'
                : 'This URL is not valid';
    });

    $.validator.addMethod('data-validateMin', function(value, element, param)
    {
        value = parseInt(value);
        if (!_.isNumber(value))
        { return false; }

        return value >= parseFloat(param);
    },
    function (value, element)
    {
        return _.isNumber(parseInt(value)) ?
            ('Value must be at least ' + $(element).attr('data-validateMin')) :
            'Value must be a number';
    });

    $.validator.addMethod('data-validateMax', function(value, element, param)
    {
        value = parseInt(value);
        if (!_.isNumber(value))
        { return false; }

        return value <= parseFloat(param);
    },
    function (value, element)
    {
        return _.isNumber(parseInt(value)) ?
            ('Value must be no greater than ' + $(element).attr('data-validateMax')) :
            'Value must be a number';
    });



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
        + dataSource: object or function that returns an object that will be
            used to fill in the pane on render if no data is passed in to
            addPane
        + dataPreProcess: function that takes the data, and returns a
            processed version.  It is preferable to use this with an object
            dataSource instead of the function version of dataSource
        + onlyIf: boolean, or function that takes the view and returns true if
            the pane is enabled, false if not
        + disabledSubtitle: String to display when the pane is disabled
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
                Currently accepts a function, an object, or an array of objects:
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
              + negate: boolean, if true, the result will be flipped after
                  computing it (so it will match everything but the provided
                  value)
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
                      - 'color' is a color picker.  If you add lineClass
                          'colorCollapse', this will display on the right end
                          of the following line
                          + advanced: enables a more precise color picker
                          + showLabel: show the hex value of the color adjacently
                      - 'file' is a file picker.  It will return an object
                          of type AjaxUpload instead of a normal value -- you
                          must then manually call submit on it, as appropriate.
                          It has the following custom options:
                          + action: URL for form action to upload to
                          + fileTypes: single or array of required file types
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
                          + savedField: name of a value that is not editable
                             but is part of the object, and should propagated
                             through edits
                      - 'custom' renders a field using a callback. It takes a
                          special object named 'editorCallbacks',
                          with the following fields:
                          + create: Function to create the custom editor
                          + value: Function that returns the value of the input
                          + cleanup: Function that does any required cleanup;
                              called when the editor is about to be removed
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
                  + change: optional, handler for when control value changes.
                      Arguments are ($control, event).
                  + prompt: optional, prompt text for text/textarea/select.
                      If null for select, will not add a prompt option
                  + value: For a static field, the value to display.  Can also
                      be a function (passed data)
                  + defaultValue: default value to use for the field; for
                      checkboxes use true.  For radioGroup, the name of the option
                      that should be selected by default.  For color, also
                      accepts an array of colors that will be cycled through
                      in a repeater
                  + repeaterValue: like defaultValue, but used for the replicated
                      lines in a repeater; falls back to defaultValue (if set)
                  + required: optional, boolean, whether or not the input should be
                      validated as required (if visible)
                  + disabled: boolean or function (passed data); if true, the
                      field will be disabled.  Overrides options function
                      returning null
                  + minimum, maximum: For slider, limits of the range
                  + trueValue, falseValue: For checkbox, optional values to map
                      true & false to.  defaultValue can be either of these
                      values, or true or false
                  + extraClass: extra class(es) to be applied to the input;
                      should be a single string, could have multiple
                      space-separated classes
                  + onlyIf: only display the field if these criteria are true.
                    Currently accepts a boolean, or an object:
                    {
                      + field: Name of input field to check the value of
                          (will find the closest field with that name)
                      + value: Value that the field should be set to for this
                          field to be shown
                      + func: Function that takes the the field value to check,
                          returns a boolean
                      + negate: If true, the result will be inverted
                    }
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
                    + defaultNames: array of strings in priority order that
                       should be used to guess a default selection for the box.
                       If any columns match one of these names, and there is no
                       current value or default value, then the first column
                       (that matches the earliest name) will be used as the default
                       value. Matches are case-insensitive for both the provided
                       names and column names.
                  }
                  + inputFirst: for checkbox, you can opt to move the checkboxes
                      ahead of the labels with this boolean.
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
                      and returns an array of hashes as above, 'disabled' to
                      disable the select input, 'hidden' to hide it
                      (it still accepts blank values to disable for legacy
                      support, but the string versions are preferred).
                      This may also be a function without linked field, in
                      which case it is called once at render time with the data
                  + linkedField: Used with select or custom inputs.
                      Name of field, or array of field names, that should be
                      monitored.  On change, the values are passed to the options
                      function and the options for the select are updated.  If
                      there is one name, that value is passed directly;
                      otherwise, a hash of linked name to value is passed
               }
            ]
          }
        ]
        + showCallback: function that is called when this sidebar pane is shown;
            args: (sidebarObj, $pane)
        + hideCallback: function that is called when this sidebar pane is hidden;
            args: (sidebarObj, $pane)
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
        registerConfig: function(config, displayTypes)
        {
            if ($.isBlank(config.name)) { throw 'Sidebar config requires a name'; }

            _.each($.makeArray(displayTypes || []), function(dt)
                { $.gridSidebar.paneForDisplayType[dt] = config.name; });

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

        paneForDisplayType: {},

        // Pre-defined buttons for easy access
        buttons: {
            create: {text: 'Create', value: true, isDefault: true,
                requiresLogin: true},
            update: {text: 'Update', value: true, isDefault: true,
                requiresLogin: true},
            apply: {text: 'Apply', value: true, isDefault: true},
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
            onSidebarClosed: function() {},
            onSidebarShown: function(primaryPane, secondaryPane) {},
            position: 'right',
            setSidebarTop: true,
            waitOnDataset: false
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
                sidebarObj._paneData = {};
                sidebarObj._savedPaneData = {};
                sidebarObj._dirtyPanes = {};

                sidebarObj._selectOptions = {};
                sidebarObj._customCallbacks = {};
                sidebarObj._columnSelects = [];
                sidebarObj._fieldOnlyIfs = {};

                sidebarObj._changeHandlers = {};

                sidebarObj._wizDisabled = {};

                $domObj.addClass('position-' + sidebarObj.settings.position);

                $(window).resize(function() { handleResize(sidebarObj); });
                $domObj.resize(function() { handleResize(sidebarObj); });

                sidebarObj._modalCount = 0;
                $(document).bind(blist.events.MODAL_SHOWN, function()
                {
                    if (sidebarObj._modalCount === 0 &&
                        !$.isBlank(sidebarObj._$currentWizard))
                    { sidebarObj._$currentWizard.socrataTip().quickHide(); }
                    sidebarObj._modalCount++;
                });
                $(document).bind(blist.events.MODAL_HIDDEN, function()
                {
                    sidebarObj._modalCount--;
                    if (sidebarObj._modalCount === 0 &&
                        !$.isBlank(sidebarObj._$currentWizard))
                    { sidebarObj._$currentWizard.socrataTip().quickShow(); }
                });

                sidebarObj._ready = true;
                if (sidebarObj.settings.waitOnDataset &&
                    !_.isUndefined(blist.dataset) &&
                    blist.dataset.viewType == 'tabular')
                {
                    blist.dataset.bind('columns_changed', function()
                    { updateColumnSelects(sidebarObj); });

                    sidebarObj._ready = false;
                    // We need to make sure the view is available
                    // before launching the sidebar
                    blist.dataset.bind('row_count_change', function()
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

                if (!$.isBlank(blist.dataset))
                {
                    var setCurSize = function()
                    {
                        if ($.subKeyDefined(blist.dataset,
                            'metadata.sidebar.width'))
                        { $domObj.width(blist.dataset.metadata.sidebar.width); }
                        else
                        { $domObj.css('width', ''); }
                        $(window).resize();
                    };
                    blist.dataset.bind('clear_temporary', setCurSize);
                    setCurSize();
                }

                $domObj.resizable({
                    handles: sidebarObj.settings.position == 'left' ? 'e' : 'w',
                    maxWidth: $(window).width() * 0.8, minWidth: 300,
                    stop: function() { resizeDone(sidebarObj); }});
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

            setDefault: function(configName)
            {
                var sidebarObj = this;
                sidebarObj._defaultPane = configName;
                if ($.isBlank(sidebarObj._currentPane) &&
                    sidebarObj.hasPane(sidebarObj._defaultPane))
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

                if (!$.isBlank(sidebarObj._$panes[config.name]))
                {
                    clearWizard(sidebarObj);
                    sidebarObj._$panes[config.name]
                        .find('.line.custom').each(function()
                        { cleanLine(sidebarObj, $(this)); });
                    sidebarObj._$panes[config.name].remove();
                    delete sidebarObj._$panes[config.name];
                }

                if ($.isBlank(sidebarObj._$outerPanes[outerConfig.name]))
                { createOuterPane(sidebarObj, outerConfig); }

                if (config.isParent) { return; }

                sidebarObj._paneData[config.name] = data;
                if (!isTempData) { sidebarObj._savedPaneData[config.name] = data; }
                var $pane = renderPane(sidebarObj, config, data);
                sidebarObj._dirtyPanes[config.name] = false;
                sidebarObj._$panes[config.name] = $pane;

                var $header = sidebarObj._$outerPanes[outerConfig.name]
                    .find('.headerLink[data-paneName="' + config.name + '"]');
                if ($header.length > 0) { $header.after($pane); }
                else
                {
                    sidebarObj._$outerPanes[outerConfig.name]
                        .find('.panes').append($pane);
                }

                $pane.hide();
            },

            /* Show the sidebar and a specific pane in it.  If it is modal,
             * then hide/disable other parts of the UI */
            show: function(paneName, data)
            {
                var sidebarObj = this;

                // Hide any other open panes
                hideCurrentPane(sidebarObj);

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

                // Make sure our pane exists
                if ($.isBlank(sidebarObj._$outerPanes[nameParts.primary]) ||
                    (!config.isParent &&
                        $.isBlank(sidebarObj._$panes[nameParts.secondary])))
                { sidebarObj.addPane(paneName); }

                // Check if our pane needs to be refreshed
                if (sidebarObj._dirtyPanes[nameParts.secondary])
                {
                    sidebarObj.addPane(paneName,
                        sidebarObj._paneData[nameParts.secondary]);
                }

                sidebarObj._currentOuterPane = nameParts.primary;
                sidebarObj.$currentOuterPane().show();
                if (!config.isParent)
                {
                    sidebarObj._currentPane = nameParts.secondary;
                    sidebarObj.$currentOuterPane()
                        .find('.headerLink[data-paneName="' +
                            nameParts.secondary + '"]').addClass('selected');
                    if (!$.isBlank(config.wizard))
                    { sidebarObj.$currentPane().addClass('initialLoad'); }

                    _.defer(function()
                    {
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
                                .slideDown(function() { checkForm(sidebarObj); });
                        }
                    });

                    sidebarObj.$currentOuterPane().find('.panes')
                        .scroll(function(e)
                        { updateWizardVisibility(sidebarObj); });
                }


                // Adjust positions for the sidebar
                setPosition(sidebarObj);

                sidebarObj.updateEnabledSubPanes();

                // The big reveal
                sidebarObj.$dom().show();

                $(window).resize();

                if (!config.isParent)
                {
                    // Wizards are disabled
//                    showWizard(sidebarObj, sidebarObj.$currentPane()
//                        .find('.hasWizard:visible:first'));

                    if ($.device.ipad)
                    {
                        var scroller = new iScroll(sidebarObj.$currentOuterPane()
                            .find('.panes').get(0));
                    }
                }
                else
                {
                    // Open the last pane by default
                    sidebarObj.$currentOuterPane()
                        .find('.headerLink:not(.disabled):last').click();
                }

                sidebarObj.settings.onSidebarShown(nameParts.primary,
                    nameParts.secondary);
                if (_.isFunction(config.showCallback))
                {
                    config.showCallback(sidebarObj, sidebarObj.$currentPane());
                }
            },

            /* Hide the sidebar and all panes */
            hide: function()
            {
                var sidebarObj = this;
                if (!$.isBlank(sidebarObj._defaultPane) &&
                    sidebarObj.hasPane(sidebarObj._defaultPane))
                {
                    var np = getConfigNames(sidebarObj._defaultPane);
                    if (sidebarObj._currentOuterPane != np.primary ||
                        sidebarObj._currentPane != np.secondary)
                    {
                        sidebarObj.show(sidebarObj._defaultPane);
                        return;
                    }
                }

                sidebarObj.$dom().hide();
                sidebarObj.$neighbor().css('width', '').css('left', '');

                hideCurrentPane(sidebarObj);

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
                {
                    pane = getFullConfigName(sidebarObj._currentOuterPane,
                            sidebarObj._currentPane);
                }
                if ($.isBlank(pane)) { return; }

                var nameParts = getConfigNames(pane);
                if ($.isBlank(sidebarObj._$panes[nameParts.secondary])) { return; }

                if (sidebarObj._currentOuterPane == nameParts.primary &&
                        sidebarObj._currentPane == nameParts.secondary)
                {
                    sidebarObj.hide(pane);
                    sidebarObj.addPane(pane,
                            sidebarObj._paneData[nameParts.secondary]);
                    sidebarObj.show(pane);
                }
                else
                { sidebarObj._dirtyPanes[nameParts.secondary] = true; }
            },

            updateEnabledSubPanes: function()
            {
                var sidebarObj = this;

                if ($.isBlank(sidebarObj.$currentOuterPane())) { return; }

                var updateEnabled = function(sp, isEnabled)
                {
                    var disSub = sp.disabledSubtitle;
                    if (_.isFunction(disSub))
                    { disSub = disSub(); }

                    var $a = sidebarObj.$currentOuterPane()
                        .find('.headerLink[data-panename="' + sp.name + '"]');
                    if ($a.hasClass('disabled') != !isEnabled)
                    {
                        $a.toggleClass('disabled', !isEnabled)
                            .data('title', isEnabled ?  sp.subtitle : disSub);
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
                            .find('.disabledMessage').text(disSub);
                    }
                };

                var outerConfig = paneConfigs[sidebarObj._currentOuterPane];
                _.each(outerConfig.subPanes || $.makeArray(outerConfig),
                function(sp)
                {
                    if ($.isBlank(sp.onlyIf))
                    { updateEnabled(sp, true); }
                    else if (_.isFunction(sp.onlyIf))
                    {
                        updateEnabled(sp, sp.onlyIf());
                    }
                    else
                    { updateEnabled(sp, sp.onlyIf === true); }
                });
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

                if ($.isBlank(config.onlyIf))
                { return true; }
                else if (_.isFunction(config.onlyIf))
                { return config.onlyIf(); }
                else
                { return config.onlyIf === true; }
            },

            showSection: function($pane, sectionName)
            {
                var sidebarObj = this;
                var $s = $pane.find('.formSection[name="' + sectionName + '"]')
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

                prepareValidation($pane);

                // Validate form
                if (!$pane.find('form').valid())
                {
                    this.finishProcessing();
                    // Undo our hidden lines before returning
                    resetValidation($pane);
                    $pane.find('.mainError')
                        .text('There were problems with the specified values. ' +
                            'Please check the errors above.');
                    return false;
                }

                // Undo our hidden lines before returning
                resetValidation($pane);
                $pane.find('.mainError').text('');
                return true;
            },

            /* This turns a pane into an object with values based on the names
             * of the fields */
            getFormValues: function($pane)
            {
                var sidebarObj = this;
                var results = {};

                prepareValidation($pane);

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

                var getInputValue = function($input)
                {
                    if ($input.hasClass('prompt')) { return null; }

                    if ($input.hasClass('colorControl'))
                    { $input = $input.siblings(':input'); }

                    var value = $input.value();
                    if ($input.isInputType('checkbox'))
                    {
                        var t = $input.attr('data-trueValue');
                        var f = $input.attr('data-falseValue');
                        if (!$.isBlank(t) && value === true)
                        { value = t; }
                        else if (!$.isBlank(f) && value === false)
                        { value = f; }
                    }
                    else if ($input.isInputType('radio'))
                    {
                        // only going to fire for radioSelects, not radioBlocks
                        value = $input.attr('data-dataValue');
                    }
                    else if ($input.hasClass('sliderInput'))
                    {
                        var inputValue = parseFloat($input.attr('data-scale'));
                        value = (inputValue == 0) ? 0 : (value / inputValue);
                    }
                    else if ($input.hasClass('select'))
                    {
                        // Convert select box values to real booleans if
                        // appropriate
                        if (value == 'true') { value = true; }
                        if (value == 'false') { value = false; }
                    }
                    else if ($input.hasClass('customWrapper'))
                    {
                        var customValue = sidebarObj._customCallbacks[$input
                            .attr('data-customId')];
                        if (!$.isBlank(customValue))
                        { customValue = customValue.value; }

                        if (_.isFunction(customValue))
                        { value = customValue(sidebarObj, $input); }
                    }
                    else if (($input.tagName() == 'input') &&
                              $input.parents().hasClass('fileChooser'))
                    {
                        value = $input.closest('.fileChooser').data('ajaxupload');
                    }
                    return value;
                };

                // Loop through all the inputs & sliders in dom order.
                // Filter down to only the visible ones that are not
                // .prompt (meaning not filled in), .sectionSelect (top-level
                // inputs used for flow control), or in .radioLine label
                // (these are in a radioGroup, and will be handled by getting
                // the selected radio button in the group and manually getting
                // the associated input)
                $pane.find('form :input, form .colorControl, form .customWrapper')
                    .filter(':visible:not(:disabled, .prompt, ' +
                        '.sectionSelect, .radioLine label *, .customWrapper *)')
                    .each(function()
                {
                    var $input = $(this);
                    var $parents = $input.parents();

                    // If this is a radio input, then either skip it if not
                    // selected; or find the input associated with it
                    if ($input.isInputType('radio') && $parents.hasClass('radioLine'))
                    {
                        if (!$input.is(':checked')) { return; }

                        // if this is a radioBlock, we're actually interested
                        // in the values of the contained controls. otherwise,
                        // it's a radioSelect and we want the radio itself
                        if ($parents.hasClass('radioBlock'))
                        {
                            $input = $input.closest('.radioLine')
                                .find('label :input:not(.prompt)');
                            if ($input.length < 1) { return; }
                        }
                    }

                    var value = getInputValue($input);

                    var inputName = $input.attr('name');

                    // If this is in a group, then figure out if any required
                    // fields failed
                    if ($parents.hasClass('group'))
                    {
                        var failed = false;
                        $input.closest('.inputBlock')
                            .find('[data-isrequired]:visible:not(:disabled)')
                            .each(function()
                        {
                            var v = getInputValue($(this));
                            failed = failed || $.isBlank(v) || v === false;
                        });
                        if (failed) { return; }
                    }

                    // Start the parent out as top-level results
                    var parObj = results;
                    var parArray;
                    var parIndex;
                    if ($parents.hasClass('repeater'))
                    {
                        var $repeaters = $parents.filter('.line.repeater');
                        for (var i = $repeaters.length - 1; i >= 0; i--)
                        {
                            var $curRep = $repeaters.eq(i);
                            // If this is in a repeater, then it is name-spaced
                            // under the repeater.  Grab that name, and set up
                            // an array for it
                            var buttonName = $curRep
                                .children('.button.addValue').attr('name');
                            if (i != $repeaters.length - 1)
                            {
                                buttonName = buttonName.split('-')
                                    .slice(0, -1).join('-');
                            }
                            parArray = addValue(buttonName, [], parObj);

                            var curName = (i == 0 ? $input :
                                $repeaters.eq(i - 1).children('.button.addValue'))
                                .attr('name');
                            // The name has a -num on the end that specifies order
                            // in the array; grab that off to use as the index
                            var p = curName.split('-');
                            parIndex = p[p.length - 1];
                            // Set up the object for this array index, and use
                            // that as the parent
                            if (!$.isBlank(parArray))
                            { parObj = parArray[parIndex] || {}; }
                        }
                        inputName = inputName.split('-').slice(0, -1).join('-');

                        var $savedDataLine =
                            $input.closest('.line[data-savedData]');
                        if ($savedDataLine.length > 0)
                        {
                            $.extend(parObj, JSON.parse(
                                $savedDataLine.attr('data-savedData') || '{}'));
                        }
                    }

                    // If this is a column select, then parse the value as a num,
                    // since it is a column ID
                    if (!$.isBlank(value) && ($input.tagName() == 'select') &&
                         $parents.hasClass('columnSelect'))
                    {
                        value = parseInt(value);
                    }

                    // Now add the value
                    addValue(inputName, value, parObj);

                    // If this is a select, check for extra data on the actual
                    // option element
                    if ($input.tagName() == 'select')
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

                // Undo our hidden lines before returning
                resetValidation($pane);

                // Do a deep compact to get rid of any null fields, and
                // compact any arrays (especially repeaters, that may have
                // been filled in sparsely)
                return $.deepCompact(results);
            },

            startProcessing: function()
            {
                this.$dom().addClass('processing');
            },

            finishProcessing: function()
            {
                this.$dom().removeClass('processing');
            },

            resetForm: function($pane, paneName)
            {
                var sidebarObj = this;
                if ($pane.is('.noReset')) { return; }

                // Re-rendering the pane is not really much worse than trying
                // to reset it; and we don't have to worry about reset and then
                // rendering a pane immediately
                sidebarObj._dirtyPanes[paneName] = true;
            },

            genericErrorHandler: function($pane, xhr)
            {
                this.finishProcessing();
                $pane.find('.mainError')
                    .text(JSON.parse(xhr.responseText).message);
            }
        }
    });


    var isTable = function(sidebarObj)
    {
        return !$.isBlank(blist.$container) &&
            blist.$container.renderTypeManager().visibleTypes.table;
    };

    var uniformUpdate = function(items)
    {
        if (!uniformEnabled) { return; }
        if (!$.isBlank($.uniform) && !$.isBlank($.uniform.update))
        { $.uniform.update(items); }
    };

    var getFullConfigName = function(outerName, innerName)
    {
        var name = outerName;
        if (outerName != innerName)
        { name = _.compact([outerName, innerName]).join('.'); }
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


    var hideCurrentPane = function(sidebarObj)
    {
        if (!$.isBlank(sidebarObj.$currentPane()))
        { sidebarObj.resetForm(sidebarObj.$currentPane(),
            sidebarObj._currentPane); }

        if (!$.isBlank(sidebarObj.$currentOuterPane()))
        {
            sidebarObj.$currentOuterPane().hide()
                .find('.panes').unbind('scroll')
                .find('.headerLink.selected').removeClass('selected');
        }

        if (!$.isBlank(sidebarObj.$currentPane()))
        {
            // We only want to close the current pane; but it gets a bit complex...
            // We'd like to animate it closed; but animations only work if it is
            // truly visible to begin with.  Since we just hid the outerPane,
            // it might not be visible, so just hide it in that case.  But
            // if another pane is being shown next, then the outerPane will be
            // re-shown, and we can safely animate this.  We need to defer to
            // give time for that re-show to happen.
            var $curPane = sidebarObj.$currentPane();
            _.defer(function()
            {
                // IE7 still doesn't animate properly, so skip it
                if ((!$.browser.msie || $.browser.majorVersion > 7) &&
                    $curPane.is(':visible')) { $curPane.slideUp(); }
                else { $curPane.hide(); }
            });
        }

        // Reset pane on closing
        if (!_.isEqual(sidebarObj._paneData[sidebarObj._currentPane],
            sidebarObj._savedPaneData[sidebarObj._currentPane]))
        {
            sidebarObj._dirtyPanes[sidebarObj._currentPane] = true;
        }

        var outerConfig = paneConfigs[sidebarObj._currentOuterPane];
        var config = ((outerConfig || {}).subPanes || {})[sidebarObj._currentPane] ||
            paneConfigs[sidebarObj._currentPane];
        if (_.isFunction((config || {}).hideCallback))
        { config.hideCallback(sidebarObj, sidebarObj.$currentPane()); }

        sidebarObj._currentOuterPane = null;
        sidebarObj._currentPane = null;
        clearWizard(sidebarObj);
    };

    /* Adjust the position/size of the sidebar to fit next to the grid */
    var setPosition = function(sidebarObj)
    {
        var gridHeight = sidebarObj.$neighbor().outerHeight();
        var adjH = sidebarObj.$dom().outerHeight() - sidebarObj.$dom().height();
        sidebarObj.$dom().height(gridHeight - adjH);
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
            (sidebarObj.$neighbor().outerWidth() -
                sidebarObj.$neighbor().width()));

        // Adjust panes section to correct height, since it is what scrolls
        var $pane = sidebarObj.$currentOuterPane();
        var $scrollContent = $pane.find('.panes');
        adjH += $pane.outerHeight() - $scrollContent.height();
        $scrollContent.height(gridHeight - adjH);
    };

    /* Handle window resizing */
    var handleResize = function(sidebarObj)
    {
        _.defer(function()
        {
            if (sidebarObj.$dom().is(':hidden')) { return; }

            setPosition(sidebarObj);
            updateWizardVisibility(sidebarObj);
        });
    };

    /* When user resize is finished */
    var resizeDone = function(sidebarObj)
    {
        // Unset left, b/c the resizable plugin sets it; but we are
        // right-positioned
        sidebarObj.$dom().css('left', '');
        $(window).resize();

        if (!$.isBlank(blist.dataset))
        {
            var md = $.extend(true, {}, blist.dataset.metadata);
            md.sidebar = md.sidebar || {};
            md.sidebar.width = sidebarObj.$dom().width();
            blist.dataset.update({metadata: md}, false, true);
        }
    };

    var updateWizardVisibility = function(sidebarObj)
    {
        if ($.isBlank(sidebarObj._$currentWizard)) { return; }

        var $item = sidebarObj._$currentWizard;
        var itemTop = $item.offset().top;
        var itemLeft = $item.offset().left;
        if (itemTop == sidebarObj._currentWizardTop &&
            itemLeft == sidebarObj._currentWizardLeft) { return; }

        $item.socrataTip().adjustPosition(
            {top: itemTop - sidebarObj._currentWizardTop,
                left: itemLeft - sidebarObj._currentWizardLeft});
        sidebarObj._currentWizardLeft = itemLeft;
        if (itemTop == sidebarObj._currentWizardTop) { return; }
        sidebarObj._currentWizardTop = itemTop;

        if ($.isBlank(sidebarObj.$currentPane())) { return; }

        var $pane = sidebarObj.$currentPane();
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

    var prepareValidation = function($pane)
    {
        // In radioBlocks, hide the non-selected options so they don't attempt to validate
        $pane.find('.radioBlock > .radioLine').each(function()
        {
            var $t = $(this);
            if (!$t.find('input[type=radio]').is(':checked'))
            { $t.addClass('hideValidation'); }
        });
    }

    var resetValidation = function($pane)
    {
        $pane.find('.radioLine.hideValidation').removeClass('hideValidation');
    };


    /*** Functions related to rendering a pane ***/

    var renderSelectOption = function(opt, curVal)
    {
        // allow selected value to be determined until options are loaded.
        // this is done by setting default value to '_selected' and
        // adding _selected attrib = true in the desired option.
        var isSelected = (curVal === '_selected' && opt.selected === true) ||
            (opt.value || '').toLowerCase() === (curVal || '').toLowerCase();
        var item = {tagName: 'option', value: opt.value,
            selected: isSelected, contents: opt.text};
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

    var renderColumnSelectOptions = function(columnsObj, isTableColumn, curVal)
    {
        var cols = blist.dataset.columnsForType((columnsObj || {}).type,
            (columnsObj || {}).hidden);

        if (!_.isNumber(curVal) && _.isArray((columnsObj || {}).defaultNames))
        {
            // If we have a set of names to check for, look through them in
            // priority order to see if any columns match
            var foundCol;
            _.any(columnsObj.defaultNames, function(n)
            {
                foundCol = _.detect(cols, function(c)
                    { return n.toLowerCase() == c.name.toLowerCase(); });
                return !$.isBlank(foundCol);
            });
            if (!$.isBlank(foundCol))
            { curVal = isTableColumn ? foundCol.tableColumnId : foundCol.id; }
        }

        var options = [{tagName: 'option', value: '',
            contents: $.isBlank(curVal) ? 'Select a column' : 'Deselect column'}];
        _.each(cols, function(c)
        {
            var cId = isTableColumn ? c.tableColumnId : c.id;
            options.push({tagName: 'option', value: cId,
                selected: curVal == cId || (cols.length == 1 && !columnsObj.noDefault),
                contents: $.htmlEscape(c.name)});
        });

        return options;
    };

    /* Render a single input field */
    var renderLine = function(sidebarObj, args)
    {
        // bail if we don't want to render this.
        if (args.item.onlyIf === false)
        { return null; }

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
            var isDisabled = _.isFunction(item.disabled) ?
                item.disabled(args.context.data) : item.disabled;

            var result = {id: item.name, name: item.name, title: item.prompt,
                disabled: isDisabled, 'data-isDisabled': isDisabled,
                'class': [ {value: 'required', onlyIf: item.required &&
                    !args.context.inRepeater},
                        {value: 'textPrompt', onlyIf: !$.isBlank(item.prompt) &&
                            _.include(['text', 'textarea'], item.type)},
                        item.notequalto].concat(item.extraClass),
                'data-origName': item.origName,
                'data-isRequired': {value: true, onlyIf: item.required},
                'data-notequalto': {value: '.' + (item.notequalto || '')
                        .split(' ').join(', .'),
                    onlyIf: !$.isBlank(item.notequalto)},
                'data-validateMin': {value: item.validateMin,
                    onlyIf: !$.isBlank(item.validateMin)},
                'data-validateMax': {value: item.validateMax,
                    onlyIf: !$.isBlank(item.validateMax)},
                'data-defaultValue': $.htmlEscape(
                        JSON.stringify(item.defaultValue || '')),
                'data-dataValue': {value: $.htmlEscape(
                        JSON.stringify(item.dataValue || '')),
                    onlyIf: !$.isBlank(item.dataValue) &&
                        item.dataValue !== item.defaultValue}
            };

            if ($.isPlainObject(item.onlyIf))
            {
                var oiUid = _.uniqueId();
                sidebarObj._fieldOnlyIfs[oiUid] = item.onlyIf;
                result['data-onlyIf'] = oiUid;
            }

            if (_.isFunction(item.change))
            {
                var uid = 'handler_' + _.uniqueId();
                sidebarObj._changeHandlers[uid] = item.change;
                result['data-change'] = uid;
            }

            _.each(item.data || {}, function(v, k)
                {
                    result['data-custom-' + k] = v;
                });

            return result;
        };

        var defValue = args.item.defaultValue;
        if (args.context.inRepeater && !_.isUndefined(args.item.repeaterValue))
        { defValue = args.item.repeaterValue; }

        var getValue = function(data, name, valIndex)
        {
            var nParts = (name || '').split('.');
            var base = data;
            while (nParts.length > 0 && !$.isBlank(base))
            {
                base = base[nParts.shift()];
                if (_.isArray(base) && nParts.length > 0)
                {
                    if ($.isBlank(nParts[0].match(/^\d+$/)))
                    { base = _.include(base, nParts.shift()); }
                    else
                    {
                        var i = parseInt(nParts.shift());
                        if (!$.isBlank(valIndex)) { i = valIndex; }
                        base = base[i];
                    }
                }
            }
            if (nParts.length == 0 && !$.isBlank(base))
            {
                return base;
            }
            return null;
        };

        var curValue;
        if (!$.isBlank(args.item.origName))
        {
            curValue = getValue(args.context.data, args.item.origName,
                args.context.inRepeaterContext ?
                    args.context.repeaterIndex : null);
            if (!$.isBlank(curValue))
            { args.item = $.extend({}, args.item, {dataValue: curValue}); }
        }


        var getRequiredNames = function(contextData, field)
        {
            var names = [];
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
                if (f.onlyIf)
                {
                    var onlyIf = false;
                    var v = getValue(contextData, f.onlyIf.field);
                    if (_.isFunction(f.onlyIf.func))
                    { onlyIf = onlyIf || f.onlyIf.func(v); }
                    if (!$.isBlank(f.onlyIf.value))
                    { onlyIf = onlyIf || f.onlyIf.value != v; }
                    if (f.onlyIf.negate) { onlyIf = !onlyIf; }
                    if (onlyIf) { continue; }
                }

                if (f.type == 'custom' && !$.isBlank(f.editorCallbacks) &&
                    _.isFunction(f.editorCallbacks.required))
                {
                    var vals = {};
                    _.each($.arrayify(f.linkedField), function(lf)
                    { vals[lf] = getValue(contextData, lf); });
                    if (_.size(vals) == 1)
                    { vals = _.values(vals)[0]; }
                    if (!f.editorCallbacks.required(sidebarObj, vals))
                    { continue; }
                }

                names.push(f.name);
            }
            return names;
        };

        var checkRequiredData = function(contextData, field)
        {
            return _.all(getRequiredNames(contextData, field),
                function(n) { return !$.isBlank(getValue(contextData, n)); });
        };


        var wrapper = {tagName: 'span', 'class': ['inputWrapper']};
        contents.push(wrapper);
        switch (args.item.type)
        {
            case 'note':
                var val = _.isFunction(args.item.value) ?
                    args.item.value(_.isEmpty(args.context.data) ?
                        null : args.context.data) : args.item.value;
                if (!$.isBlank(val) && !args.item.isInput)
                {
                    wrapper.contents = $.extend(commonAttrs(args.item),
                        {tagName: 'span', contents: val});
                }
                else
                { contents = []; }
                break;
            case 'static':
                var val = _.isFunction(args.item.value) ?
                    args.item.value(_.isEmpty(args.context.data) ?
                        null : args.context.data) : args.item.value;
                if (!$.isBlank(val))
                {
                    if (args.item.isInput)
                    {
                        wrapper.contents = [];
                        wrapper.contents.push({tagName: 'span', contents: val});
                        wrapper.contents.push($.extend(commonAttrs(args.item),
                            {tagName: 'input', type: 'hidden', value: val}));
                    }
                    else
                    {
                        wrapper.contents = $.extend(commonAttrs(args.item),
                            {tagName: 'span', contents: val});
                    }
                }
                else
                { contents = []; }
                break;

            case 'text':
                wrapper['class'].push('textWrapper');
                wrapper.contents = $.extend(commonAttrs(args.item),
                        {tagName: 'input', type: 'text', value:
                            $.htmlEscape(curValue || defValue)});
                break;

            case 'textarea':
                wrapper['class'].push('textWrapper');
                wrapper.contents = $.extend(commonAttrs(args.item),
                    {tagName: 'textarea', contents:
                        $.htmlEscape(curValue || defValue)});
                break;

            case 'checkbox':
                var v = curValue;
                if ($.isBlank(v)) { v = defValue; }
                wrapper.contents = $.extend(commonAttrs(args.item),
                    {tagName: 'input', type: 'checkbox',
                        'data-trueValue': args.item.trueValue,
                        'data-falseValue': args.item.falseValue,
                        checked: (!$.isBlank(args.item.trueValue) &&
                            v === args.item.trueValue) ||
                            _.include([true, 'true', 1, '1', 'yes', 'checked'],
                                v)});

                if (args.item.inputFirst === true)
                {
                    // swap around last two elements, which are
                    // the label and input respectively
                    var input = contents.pop();
                    var label = contents.pop();
                    contents.push(input);
                    contents.push(label);
                }

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
                { tag['data-linkedField'] =
                    $.arrayify(args.item.linkedField).join(','); }

                wrapper.contents = $.extend(commonAttrs($.extend({}, args.item,
                        {dataValue: curValue})), tag);
                break;

            case 'columnSelect':
                contents.push({tagName: 'a',
                    href: '#Select:' + $.makeArray(args.item.columns.type)
                        .join('-'),
                    title: 'Select a column from the grid',
                    'class': ['columnSelector', {value: 'tableColumn',
                            onlyIf: args.item.isTableColumn}],
                    contents: 'Select a column from the grid'});

                var options = renderColumnSelectOptions(args.item.columns,
                    args.item.isTableColumn, curValue || defValue);

                wrapper.contents = $.extend(commonAttrs($.extend({}, args.item,
                    {extraClass: 'columnSelectControl'})),
                    {tagName: 'select', contents: options,
                    'data-isTableColumn': args.item.isTableColumn,
                    'data-columnOptions': $.htmlEscape(JSON.stringify(
                        args.item.columns || ''))});
                break;

            case 'slider':
                var min = args.item.minimum || 0;
                var max = args.item.maximum || 100;
                var scale = 1;
                if (_.isString(curValue)) { curValue = parseFloat(curValue); }
                if (_.isNaN(curValue)) { curValue = null; }
                if (max <= 1)
                {
                    scale = 100;
                    min *= scale;
                    max *= scale;
                    defValue *= scale;
                    if (!$.isBlank(curValue)) { curValue *= scale; }
                }

                // safety net
                if (!_.isNumber(curValue) && !_.isNumber(defValue))
                { defValue = min; }

                wrapper.contents = [];
                wrapper.contents.push($.extend(commonAttrs($.extend({}, args.item,
                        {defaultValue: defValue, dataValue: curValue,
                            extraClass: 'sliderInput'})),
                    {tagName: 'input', type: 'text', value: (_.isNumber(curValue) ? curValue : defValue),
                    'data-scale': scale, readonly: true}));

                wrapper.contents.push({tagName: 'span', 'class': 'sliderControl',
                        'data-min': min, 'data-max': max});
                break;

            case 'color':
                var item = $.extend({}, args.item,
                    {defaultValue: $.arrayify(args.item.defaultValue || [])});
                var defColor = curValue ||
                    item.defaultValue[args.context.repeaterIndex] ||
                    item.defaultValue[0];
                wrapper.contents = [];
                wrapper.contents.push({tagName: 'a', href: '#Color',
                    title: 'Choose color', name: args.item.name,
                    'class': ['colorControl',
                        {value: 'advanced', onlyIf: args.item.advanced}],
                    contents: 'Choose color',
                    style: {'background-color': defColor}});
                if (args.item.showLabel === true)
                {
                    wrapper.contents.push({tagName: 'span',
                        'class': 'colorControlLabel'});
                }
                wrapper.contents.push($.extend(commonAttrs(item),
                    {tagName: 'input', type: 'hidden', value: defColor}));
                break;

            case 'file':
                wrapper.contents = {tagName: 'div',
                    'class': ['uploader', 'uniform', 'fileChooser'],
                    'data-fileTypes': $.htmlEscape(JSON.stringify(
                        $.makeArray(args.item.fileTypes))),
                    'data-action': args.item.fileAction,
                    contents: [{tagName: 'span', 'class': 'filename',
                        contents: $.extend(commonAttrs(args.item),
                            {tagName: 'input', type: 'text', readonly: true})},
                        {tagName: 'span', 'class': 'action',
                            contents: 'Choose'}]};
                break;

            case 'custom':
                var u = _.uniqueId();
                wrapper.contents = $.extend(commonAttrs($.extend({}, args.item,
                    {extraClass: 'customWrapper'})),
                    {tagName: 'div', 'data-customId': u,
                    'data-linkedField':
                        $.arrayify(args.item.linkedField).join(',')});
                sidebarObj._customCallbacks[u] = args.item.editorCallbacks;
                break;

            case 'group':
                if (args.item.includeLabel !== true)
                { contents = []; }

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
                var defChecked;
                var valChecked;
                var items = _.map(args.item.options, function(opt, i)
                {
                    var id = itemAttrs.id + '-' + i;
                    var subLine = renderLine(sidebarObj,
                        {context: $.extend({}, args.context,
                            {noTag: true, inputOnly: true}),
                        item: opt, items: args.item.options, pos: i});
                    var subLineDisabled = _.all(subLine, function(subline)
                    { return subline.contents.disabled; });

                    var radioItem = $.extend({}, itemAttrs,
                        {id: id, tagName: 'input', type: 'radio',
                        disabled: subLineDisabled,
                        'class': {value: 'wizExclude',
                            onlyIf: opt.type != 'static'},
                        'data-defaultValue': $.htmlEscape(
                            JSON.stringify(defValue == opt.name))});

                    if ((curValue || defValue) == opt.name)
                    { defChecked = radioItem; }

                    var checkSubData;
                    checkSubData = function(item)
                    {
                        if ($.isPlainObject(item))
                        {
                            return (item['data-dataValue'] || {}).onlyIf ||
                                checkSubData(item.contents);
                        }

                        if (!_.isArray(item)) { return false; }

                        return _.any(item, function(i)
                            { return checkSubData(i); });
                    };
                    if (checkSubData(subLine))
                    { valChecked = radioItem; }

                    return {tagName: 'div', 'class': ['radioLine', opt.type],
                        contents: [
                            radioItem,
                            {tagName: 'label', 'for': id, contents: subLine}
                        ]};
                });

                if (!$.isBlank(valChecked))
                { valChecked.checked = true; }
                else if (!$.isBlank(defChecked))
                { defChecked.checked = true; }

                contents.push({tagName: 'div', 'class': 'radioBlock',
                    contents: items});
                break;

            case 'radioSelect':
                var v = curValue;
                if ($.isBlank(v)) { v = defValue; }
                var itemAttrs = commonAttrs(args.item);

                var items = _.map(args.item.options, function(opt, i)
                {
                    var id = itemAttrs.id + '-' + opt;

                    return {tagName: 'div', 'class': 'radioLine',
                        contents: [$.extend({}, itemAttrs,
                            {tagName: 'input', type: 'radio', id: id,
                                'data-dataValue': opt, checked: opt === v }),
                            {tagName: 'label', 'for': id, contents: opt}
                        ]};
                });

                wrapper.contents = {tagName: 'div', 'class': 'radioSelectBlock',
                    contents: items};
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

                var populatedLength = 0;
                if ($.isBlank(args.item.field.name))
                {
                    var names = getRequiredNames(args.context.data,
                        args.item.field);
                    if (names.length > 0)
                    {
                        var m = names[0].match(/^(.+)\.\d+(\..+)?$/);
                        if (!$.isBlank(m))
                        {
                            var a = getValue(args.context.data, m[1]);
                            if (_.isArray(a)) { populatedLength = a.length; }
                        }
                    }
                }
                curValue = _.select(curValue || [], function(v)
                { return checkRequiredData(v, args.item.field); });

                for (var i = 0; i < (curValue.length || populatedLength ||
                    args.item.minimum || 1); i++)
                {
                    var contextData = curValue[i] || args.context.data;
                    var hasRequiredData =
                        checkRequiredData(contextData, args.item.field);

                    var l = renderLine(sidebarObj,
                                {item: args.item.field,
                                    context: $.extend({}, args.context,
                                         {repeaterIndex: i, noTag: true,
                                            inRepeater: i >= args.item.minimum,
                                            inRepeaterContext:
                                                !$.isBlank(args.item.field.name),
                                            data: hasRequiredData ?
                                                contextData : null})
                    });

                    if (!$.isBlank(args.item.savedField))
                    {
                        var savedData = getValue(contextData,
                            args.item.savedField);
                        if (!$.isBlank(savedData))
                        {
                            var o = {};
                            o[args.item.savedField] = savedData;
                            l['data-savedData'] = $.htmlEscape(JSON.stringify(o));
                        }
                    }

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

        if (_.isUndefined(wrapper.contents))
        { contents = _.without(contents, wrapper); }

        if (contents.length < 1) { return null; }

        if (args.context.inputOnly)
        {
            return args.context.noTag ? contents :
                _.map(contents, function(c) { return $.tag(c, true); }).join('');
        }
        else
        {
            var line = {tagName: 'div',
                'class': ['line', 'clearfix', args.item.type, args.item.lineClass,
                {value: 'inputFirst', onlyIf: args.item.inputFirst}],
                contents: contents};
            return args.context.noTag ? line : $.tag(line, true);
        }
    };

    var cleanLine = function(sidebarObj, $line)
    {
        $line.find('[data-linkedField]').each(function()
        {
            var $f = $(this);
            var $li = $f.data('linkedGroup');
            if (!$.isBlank($li))
            { $li.unbind('.linkedField-' + $f.attr('data-linkedField')); }
        });

        $line.find('.customWrapper').each(function()
        {
            var $f = $(this);
            var cleaner = sidebarObj._customCallbacks[$f.attr('data-customId')];
            if (!$.isBlank(cleaner)) { cleaner = cleaner.cleanup; }
            if (!_.isFunction(cleaner)) { return; }
            cleaner(sidebarObj, $f);
        });

        $line.find('select.columnSelectControl').each(function()
        {
            sidebarObj._columnSelects = _.without(sidebarObj._columnSelects, this);
        });
    };

    var updateColumnSelects = function(sidebarObj, $colSelects)
    {
        _.each($colSelects || sidebarObj._columnSelects, function(csItem)
        {
            var $sel = $(csItem);
            var newOpts = renderColumnSelectOptions(
                JSON.parse($sel.attr('data-columnOptions') || '""'),
                !$.isBlank($sel.attr('data-isTableColumn')),
                $sel.val());
            $sel.find('option').remove();
            _.each(newOpts, function(o)
            { $sel.append($.tag(o)); });
            uniformUpdate($sel);
        });
    };

    var createOuterPane = function(sidebarObj, config)
    {
        var $outerPane = $.tag({tagName: 'div',
            id: sidebarObj.$dom().attr('id') + '_outer_' + config.name,
            'class': 'outerPane'});
        var rData = {title: config.title,
            subPanes: _.sortBy(config.subPanes || {}, function(sp)
                { return sp.priority || sp.title; }).reverse()};
        var directive = {
            '.title': 'title',
            '.headerLink':
            {
                'pane<-subPanes':
                {
                    '.title': 'pane.title',
                    '@href+': 'pane.title',
                    '@data-title': 'pane.subtitle',
                    '@data-paneName': 'pane.name',
                    '@class+': '#{pane.name}'
                }
            }
        };

        $outerPane.append($.renderTemplate('outerPane', rData, directive));

        $outerPane.find('.headerLink').click(function(e)
        {
            e.preventDefault();
            selectPane(sidebarObj, $(this), config.name);
        })
        .each(function()
        {
            var $this = $(this);
            $this.socrataTip({ content: function()
                    { return '<p>' + $(this).data('title').clean() + '</p>'; },
                killTitle: true, positions: 'left' });
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

        if ($.isBlank(data))
        {
            data = config.dataSource;
            if (_.isFunction(data))
            { data = data(); }
        }
        if (_.isFunction(config.dataPreProcess) && !$.isBlank(data))
        { data = config.dataPreProcess(data); }

        var rData = {title: config.title, subtitle: config.subtitle,
            sections: config.sections, paneId: paneId,
            finishButtons: (config.finishBlock || {}).buttons,
            data: data || {}};

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
                        (!$.isBlank(arg.item.customContent)) ? 'custom' : '' ].concat(
                            $.arrayify(arg.item.customClasses)))
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
            var $section = $pane.find('[data-onlyIf="' + uid + '"]');

            // Set up helper function
            var showHideSection = function()
            {
                _.defer(function()
                {
                    var isHidden = false;
                    var isDisabled = false;
                    var needsWarning = false;
                    var disabledMessage = "";
                    var warningMessage = "";

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
                        { failed = !o.func(data); }

                        // If they want the opposite, then flip it
                        if (o.negate) { failed = !failed; }

                        // Something of a hack:
                        // if warn: false, then ignore the onlyIf
                        if (o.warn === false) { return; }

                        if (o.disable)
                        {
                            isDisabled = isDisabled || failed;
                            if (failed && !$.isBlank(o.disabledMessage))
                            {
                                disabledMessage += _.isFunction(o.disabledMessage) ?
                                    o.disabledMessage() : o.disabledMessage;
                            }
                        }
                        // Displays a warning message but does not hide or disable
                        else if (o.warn && failed)
                        {
                            needsWarning = needsWarning || failed;
                            if (!$.isBlank(o.warningMessage))
                            {
                                warningMessage += _.isFunction(o.warningMessage) ?
                                    o.warningMessage() : o.warningMessage;
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
                    $section.toggleClass('warned', needsWarning);

                    if (isDisabled)
                    {
                        $section.find('.sectionDisabledMessage')
                            .html(disabledMessage);
                    }
                    else if (needsWarning)
                    { $section.find('.sectionWarningMessage').text(warningMessage); }

                    //updateWizardVisibility(sidebarObj);
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
                    o.$field = $pane.find(':input[name="' + paneId +
                        ':' + o.field + '"]');
                    o.$field.change(showHideSection).keypress(showHideSection)
                        .click(showHideSection).attr('data-onlyIfInput', true);
                }
                else if (isFunc && !_.isUndefined(blist.dataset))
                {
                    blist.dataset.bind('columns_changed', showHideSection);
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

        $pane.delegate('.formSection.selectable .sectionSelect', 'click',
        function(e)
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
            var $newLine = $($button.attr('data-template'));
            $newLine.find('.required').removeClass('required');

            var i = parseInt($button.attr('data-count'));
            $button.attr('data-count', i + 1);
            var attrMatch = '-templateId';
            $newLine.find('[name$="' + attrMatch + '"], [id$="' + attrMatch +
                '"], [for$="' + attrMatch + '"]').each(function()
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
                var colors = JSON.parse($i.attr('data-defaultValue') || '""');
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

            $container.delegate('.columnSelector', 'click', function(e)
            {
                e.preventDefault();
                e.stopPropagation();

                var $link = $(this);
                var $overlay = $pane.closest('.outerPane').find('.paneOverlay');

                var cancelSelect = function()
                {
                    $overlay.css('cursor', 'auto').addClass('hide');
                    if (!$.isBlank(sidebarObj._$currentWizard))
                    { sidebarObj._$currentWizard.socrataTip().quickShow(); }
                    $(document).unbind('.pane_' + sidebarObj._currentPane);
                    $link.removeClass('inProcess');
                    sidebarObj.$grid().blistTableAccessor().exitColumnChoose();
                };

                if ($link.is('.inProcess'))
                { cancelSelect(); }
                else
                {
                    $overlay.css('cursor', 'crosshair').removeClass('hide');
                    if (!$.isBlank(sidebarObj._$currentWizard))
                    {
                        _.defer(function()
                        { sidebarObj._$currentWizard.socrataTip().quickHide(); });
                    }

                    // Cancel on ESC
                    $(document).bind('keypress.pane_' + sidebarObj._currentPane,
                        function(e) { if (e.keyCode == 27) { cancelSelect(); } })
                        .bind('click.pane_' + sidebarObj._currentPane,
                        function(e)
                        {
                            if (!$.contains(sidebarObj.$neighbor()[0], e.target))
                            { cancelSelect(); }
                        });
                    $link.addClass('inProcess');

                    var href = $link.attr('href');
                    href = href.slice(href.indexOf('#') + 1);
                    var types = href.split(':')[1];
                    if ($.isBlank(types)) { types = null; }
                    else { types = types.split('-'); }
                    sidebarObj.$grid().blistTableAccessor().enterColumnChoose
                        (types,
                        function(c)
                        {
                            cancelSelect();
                            var $sel = $link.siblings('.inputWrapper')
                                .find('select');
                            $sel.val($link.is('.tableColumn') ?
                                c.tableColumnId : c.id).change();
                            uniformUpdate($sel);
                        });
                }
            });

            $container.find('select.columnSelectControl').each(function()
            { sidebarObj._columnSelects.push(this); });

            // Fields that have custom handlers specified against them.
            // Defined before default behaviors in case someone wants to
            // stop propagation for some reason.
            $container.find('[data-change]').each(function()
            {
                var $field = $(this);
                var handler = sidebarObj._changeHandlers[$field.attr('data-change')];
                var handlerProxy = function(event)
                {
                    handler($field, event);
                };
                var deferredHandlerProxy = function(event)
                {
                    _.defer(function() { handlerProxy(event); });
                };

                // deal with each field type manually
                if ($field.is('input[type=text],select,input[type=file]'))
                    $field.change(handlerProxy);
                else if ($field.is('input[type=checkbox],input[type=radio]'))
                {
                    $field.change(handlerProxy)
                    if ($.browser.msie)
                    {
                        $field.click(handlerProxy);
                    }
                }
                else if ($field.hasClass('sliderInput'))
                    $field.bind('slide', deferredHandlerProxy);
                else if ($field.hasClass('colorControl'))
                    $field.bind('color_change', deferredHandlerProxy);
            });

            $container.find('.sliderControl').each(function()
            {
                var $slider = $(this);
                $slider.slider({min: parseInt($slider.attr('data-min')),
                    max: parseInt($slider.attr('data-max')),
                    value: parseInt($slider.siblings(':input').val())});
            })
            .bind('slide', function(event, ui)
            { $(this).siblings(':input').val(ui.value); });

            $container.find('.colorControl:not(.advanced)').colorPicker().bind('color_change',
                function(e, newColor)
                {
                    $(this).css('background-color', newColor)
                        .next(':input').val(newColor)
                        .next('.colorControlLabel').text('#' + newColor);
                })
                .mousedown(function(e)
                {
                    var $t = $(this);
                    $t.data('colorpicker-color', $t.next(':input').val());
                });
            $container.find('.colorControl.advanced').each(function()
            {
                var $picker = $(this);
                var currentColor = '#' + ($picker.siblings(':input').val() || 'ffffff');
                $picker.ColorPicker({
                    color: currentColor,
                    onChange: function(hsb, hex, rgb) {
                        $picker.css('background-color', '#' + hex)
                            .siblings('.colorControlLabel').text('#' + hex)
                            .siblings(':input').val(hex.replace(/^#/, ''));
                    },
                    onHide: function() {
                        $picker.trigger('color_change'); // mimic other picker's event
                    }
                });
                $picker.css('background-color', currentColor)
                    .siblings('.colorControlLabel').text(currentColor);
            });

            $container.find('.fileChooser').each(function()
            {
                var $f = $(this);
                var $input = $f.find('.filename input');

                var ftOrig = JSON.parse($f.attr('data-fileTypes') || '[]');
                var ft = _.map(ftOrig, function(t) { return t.toLowerCase(); });

                $f.data('ajaxupload', new AjaxUpload($f, {
                    action: $f.attr('data-fileAction'),
                    autoSubmit: false,
                    name: $input.attr('id') + '_ajaxupload',
                    responseType: 'json',
                    onChange: function(filename, ext)
                    {
                        $input.val(filename);
                        if (ft.length > 0 && ($.isBlank(ext) ||
                            !_.include(ft, ext.toLowerCase())))
                        {
                            $input.attr('data-requiredTypes',
                                $.arrayToSentence(ftOrig, 'or', ',', true));
                        }
                        else { $input.attr('data-requiredTypes', ''); }
                        _.defer(function() { $input.change(); });
                    }
                }));
            });

            $container.find('.line.repeater').each(function()
            { checkRepeaterMaxMin($(this)); });

            $container.delegate('.removeLink', 'click', function(e)
            {
                e.preventDefault();
                var $t = $(this);
                var $repeater = $t.closest('.line.repeater');
                var $line = $t.closest('.line');
                if ($line.is('.repeaterAdded'))
                {
                    cleanLine(sidebarObj, $line);
                    $line.remove();
                }
                else { $line.addClass('hide'); }

                checkRepeaterMaxMin($repeater);
                updateWizardVisibility(sidebarObj);
            });


            // Find fields that are linked to another field, either through
            // linkedField or onlyIf.  Hook them up to change or show/hide
            // whenever the associated field is changed
            $container.find('[data-linkedField], [data-onlyIf]').each(function()
            {
                var $field = $(this);
                var custId = $field.attr('data-customId');
                var customField = sidebarObj._customCallbacks[custId];
                if (!$.isBlank(customField)) { customField = customField.create; }
                var onlyIf = sidebarObj._fieldOnlyIfs[$field.attr('data-onlyIf')];

                var selOpt = sidebarObj._selectOptions[$field.attr('data-selectOption')];
                if (!_.isFunction(selOpt) && !_.isFunction(customField) &&
                    !$.isPlainObject(onlyIf))
                { return; }


                var $linkedItems = $();
                var linkedFields = $.makeArray((onlyIf || {}).field || null);
                if (!$.isBlank($field.attr('data-linkedField')))
                {
                    linkedFields = linkedFields
                        .concat($field.attr('data-linkedField').split(','));
                }
                _.each(linkedFields, function(lf)
                {
                    var ls = ':input[data-origName="' + lf + '"]:first';
                    var $par = $field.closest('.line.group, .formSection');
                    var $li = $par.find(ls);
                    if ($li.length < 1)
                    { $li = $field.closest('form').find(ls); }
                    $linkedItems = $linkedItems.add($li);
                });
                $field.data('linkedGroup', $linkedItems);


                var adjustField = function(curValue, force)
                {
                    if ($.isBlank(curValue))
                    { curValue = JSON.parse(
                        $field.attr('data-defaultValue') || '""'); }

                    var vals = {};
                    $linkedItems.each(function()
                    { vals[$(this).attr('data-origName')] = $(this).val(); });
                    if (_.size(vals) == 1) { vals = _.values(vals)[0] || ''; }

                    var curVals = $field.data('linkedFieldValues');
                    if (!force && _.isEqual(curVals, vals)) { return; }
                    $field.data('linkedFieldValues', vals);

                    var $l = $field.closest('.line');
                    if ($.isPlainObject(onlyIf))
                    {
                        var showField = true;
                        if (_.isFunction(onlyIf.func))
                        { showField = showField && onlyIf.func(vals); }
                        if (!$.isBlank(onlyIf.value))
                        { showField = showField && onlyIf.value == (vals[onlyIf.field] || vals); }
                        if (onlyIf.negate) { showField = !showField; }
                        $l.toggle(showField);
                    }

                    if (_.isFunction(selOpt))
                    {
                        var newOpts = selOpt(vals, data, $field, curValue);
                        $field.find('option:not(.prompt)').remove();
                        $field.attr('disabled', $.isBlank(newOpts) ||
                            newOpts == 'disabled' ||
                            !!$field.attr('data-isDisabled'));
                        $field.closest('.line')
                            .toggleClass('hide', newOpts == 'hidden');
                        if (!_.isArray(newOpts)) { newOpts = null; }

                        _.each(newOpts || [], function(o)
                        {
                            $field.append($.tag(renderSelectOption(o, curValue)));
                        });
                        $field.change();
                    }
                    else if (_.isFunction(customField))
                    {
                        cleanLine(sidebarObj, $l);
                        $field.empty();
                        var showLine = customField(sidebarObj, $field, vals,
                            curValue);
                        $l.toggle(showLine);
                    }
                    _.defer(function() { uniformUpdate($field); });
                };
                var defAdjField = function() { _.defer(adjustField); };

                $linkedItems.bind('change.linkedField-' + custId, defAdjField)
                    .bind('blur.linkedField-' + custId, defAdjField);
                $field.bind('resetToDefault', function()
                    {
                        adjustField(JSON.parse(
                                $field.attr('data-dataValue') || '""'),
                            true);
                    })
                    .trigger('resetToDefault');
            });

            $container.find('[data-selectOption]:not([data-linkedField])')
            .each(function()
            {
                var $field = $(this);
                var selOpt = sidebarObj._selectOptions[$field
                    .attr('data-selectOption')];
                if (!_.isFunction(selOpt)) { return; }

                var curValue = JSON.parse(
                    $field.attr('data-dataValue') ||
                    $field.attr('data-defaultValue') || '""');
                var newOpts = selOpt(data);
                $field.find('option:not(.prompt)').remove();
                $field.attr('disabled', $.isBlank(newOpts) ||
                    newOpts == 'disabled' || !!$field.attr('data-isDisabled'));
                $field.closest('.line')
                    .toggleClass('hide', newOpts == 'hidden');
                if (!_.isArray(newOpts)) { newOpts = null; }

                _.each(newOpts || [], function(o)
                {
                    $field.append($.tag(renderSelectOption(o, curValue)));
                });
                $field.change();
                uniformUpdate($field);
            });

            $container.delegate('input, select, textarea', 'change blur',
                function() { _.defer(function() { checkForm(sidebarObj); }); });

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
            $container.delegate(
                'label input, label select, label textarea, label a', 'click',
                function(e)
                {
                    e.preventDefault();
                })
            .delegate(
                'label input, label select, label textarea, label a', 
                'mouseup change focus', checkRadio);

            if (uniformEnabled && !$.isBlank($.uniform))
            {
                // Defer uniform hookup so the pane can be added first and all
                // the styles applied before swapping them for uniform controls
                _.defer(function()
                    {
                        // Doing this as one selector is surprisingly slow
                        $container.find('select').uniform();
                        $container.find(':checkbox').uniform();
                        $container.find(':radio').uniform();
                        $container.find(':file').uniform();
                    });
            }
        };

        hookUpFields($pane);

        $pane.delegate('.button.addValue', 'click', function(e)
        {
            e.preventDefault();
            addValue($(this));
        });


        $pane.delegate('.finishButtons a', 'click', function(e)
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
                        else
                        {
                            $pane.find('.mainError').text(msg);
                            sidebarObj.finishProcessing();
                        }
                    }, msg);
            }
            else
            { doCallback(); }
        });

        // Disable for now
        //addWizards(sidebarObj, $pane, config);

        // Once we've hooked up everything standard, render any custom content.
        _.each(customSections, function(cs, uid)
        {
            var $section = $pane.find('[data-customContent="' + uid + '"]');
            var $sc = $section.find('.sectionContent');
            if (!$.isBlank(cs.template))
            {
                $sc.addClass(cs.template).append($.renderTemplate(cs.template,
                        $.extend({}, data, cs.data), cs.directive));
            }

            if (_.isFunction(cs.callback))
            { cs.callback($sc, sidebarObj, data); }
        });

        $pane.find('form').submit(function(e)
                {
                    if ($.isBlank($(this).attr('action')))
                    { e.preventDefault(); }
                })
            .validate({ignore: ':hidden', errorElement: 'span',
                errorPlacement: function($error, $element)
                { $error.appendTo($element.closest('.line')); }});

        return $pane;
    };

    var checkForm = function(sidebarObj)
    {
        var $pane = sidebarObj.$currentPane();
        if ($.isBlank($pane)) { return; }

        var $fsVis = $pane.find('.formSection').filter(':visible');
        var $fsVisDis = $fsVis.filter('.disabled');
        // Hide finish buttons if no visible & enabled sections
        $pane.find('.finishButtons').toggleClass('hide',
                $fsVis.length == $fsVisDis.length)
            // Disable submit button if not all visible & required fields filled in
            .find('.submit').toggleClass('disabled',
            $pane.find('input, select, textarea')
                .filter('.required:visible:not(:disabled)')
                .filter(':blank, .prompt, :checkbox:unchecked').length > 0 ||
                $fsVisDis.length > 0);
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
                    {positions: ['left']}));
        }
    };

    var clearWizard = function(sidebarObj)
    {
        if (!$.isBlank(sidebarObj._$currentWizard))
        {
            sidebarObj._$currentWizard.wizardPrompt().close();
            sidebarObj._$currentWizard = null;
            sidebarObj._currentWizardLeft = null;
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

        if ($item.is('.ranWizard') ||
            $item.children(':input:disabled, .uniform.disabled').length > 0)
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

        wizConfig.dismissCallback = function()
        {
            sidebarObj._wizDisabled[sidebarObj._currentPane] = true;
        };

        /* Adjust scroll position to make sure wizard component is in view */
        var $pane = sidebarObj.$currentPane();
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
            if (sidebarObj._wizDisabled[sidebarObj._currentPane]) { return; }

            var $mainItem = $item;
            /* Adjust actual item wizard is attached to */
            if (!$.isBlank(wiz.selector))
            { $item = $item.find(wiz.selector + ':visible'); }
            if ($item.length < 1) { $item = $mainItem; }

            /* Set scroll first, because fetching the scrollTop can trigger a
             * scroll event in IE, which screws things up if _$currentWizard is
             * set without the tooltip being created */
            sidebarObj._curScroll = $pane.scrollTop();
            $item.wizardPrompt(wizConfig);
            sidebarObj._$currentWizard = $item;
            sidebarObj._currentWizardLeft = $item.offset().left;
            sidebarObj._currentWizardTop = $item.offset().top;
            sidebarObj._$mainWizardItem = $mainItem;
            $item.children(':text, textarea').filter(':not([readonly])').focus();
        };

        if (newScroll != origScroll)
        { $pane.animate({scrollTop: newScroll}, doShow); }
        else { doShow(); }

        return true;
    };

    var wizardAction = function(sidebarObj, $item, action)
    {
        if (sidebarObj._wizDisabled[sidebarObj._currentPane]) { return; }

        // If the pane is gone, no action to do
        if ($.isBlank(sidebarObj.$currentPane())) { return; }
        // Bail out if we're trying to advance an old wizard
        if (!$.contains(sidebarObj.$currentPane()[0], $item[0])) { return; }
        // If we just finished a field that is invisible, don't advance;
        // because we just left something that is now gone
        if (!$item.is(':visible')) { return; }

        if (!$.isBlank(sidebarObj._$mainFlowWizard) &&
            (sidebarObj._$mainFlowWizard.index($item) > -1 ||
            sidebarObj._$mainFlowWizard.has($item).length > 0))
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

                if ($item.nextAll('.paneContent').length > 0)
                { $item = $item.nextAll('.paneContent')
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
                    var $selBox = $item.find('.sectionSelect').click();
                    uniformUpdate($selBox);
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
