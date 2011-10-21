(function($)
{
    var uniformEnabled = function() { return !$.browser.msie || $.browser.majorVersion > 7; };

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

    $.validator.addMethod('data-custom-fieldName', function(value, element, param)
    {
        return value == Column.sanitizeName(value);
    },
    'Valid API identifier characters are lower case letters, digits and underscore.  It must start with a letter and cannot have consecutive underscores.');


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
        + sections: array of sections for entering data
        [
          {
            + title: section title
            + type: optional, 'selectable' makes the field collapseable.
                By default it will be collapsed; when collapsed, nothing is
                validated.  'hidden' hides the section completely
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
    }

    */


    $.controlPane = {
        // Pre-defined buttons for easy access
        buttons: {
            create: {text: 'Create', value: true, isDefault: true, requiresLogin: true},
            update: {text: 'Update', value: true, isDefault: true, requiresLogin: true},
            apply: {text: 'Apply', value: true, isDefault: true},
            done: {text: 'Done', value: false, isDefault: true},
            cancel: {text: 'Cancel', value: false, isCancel: true}
        }
    };

    $.Control.extend('controlPane', {
        _init: function()
        {
            var cpObj = this;
            cpObj._super.apply(cpObj, arguments);

            cpObj.$dom().loadingSpinner({overlay: true});
            cpObj.$dom().append($.tag([
                    {tagName: 'div', 'class': 'disabledOverlay'},
                    {tagName: 'p', 'class': 'disabledMessage'} ]));

            cpObj._selectOptions = {};
            cpObj._customCallbacks = {};
            cpObj._columnSelects = [];
            cpObj._fieldOnlyIfs = {};
            cpObj._changeHandlers = {};

            cpObj._isDirty = true;
            cpObj._visible = false;
            cpObj._isReady = true;

            cpObj.setView(cpObj.settings.view);

            cpObj.$dom().attr('id', 'controlPane_' + cpObj.settings.name + '_' + _.uniqueId())
                .addClass('controlPane ' + cpObj.settings.name);
            if (cpObj.settings.noReset) { cpObj.$dom().addClass('noReset'); }
        },

        $content: function()
        {
            if ($.isBlank(this._$content))
            {
                this._$content = $.tag({tagName: 'form', 'class': 'commonForm'});
                this.$dom().append(this._$content);
            }
            return this._$content;
        },

        setView: function(newView)
        {
            var cpObj = this;
            if (!$.isBlank(cpObj._view))
            { cpObj._view.unbind(null, null, cpObj); }

            cpObj._view = newView;
            if ($.isBlank(newView)) { return; }

            cpObj._view.bind('columns_changed', function() { updateColumnSelects(cpObj); }, cpObj);
        },

        // Whether or not the pane is available for interaction
        isAvailable: function()
        { return true; },

        // Main title for the pane
        getTitle: function()
        { return ''; },

        // Appears under main title
        getSubtitle: function()
        { return ''; },

        // When disabled, indicates the reason why
        getDisabledSubtitle: function()
        { return ''; },

        // Called when this pane is shown
        shown: function()
        { this._visible = true; },

        // Called when this pane is hidden;
        hidden: function()
        { this._visible = false; },

        /* Render the full pane */
        render: function(data, isTempData)
        {
            var cpObj = this;
            var $pane = cpObj.$content();

            if (!cpObj._isReady)
            {
                if ($.isBlank(cpObj._cachedRender) || !$.isBlank(data))
                { cpObj._cachedRender = {data: data, isTempData: isTempData}; }
                cpObj._startProcessing();
                return;
            }

            cpObj._finishProcessing();

            if (($.isBlank(data) || _.isEqual(data, cpObj._getCurrentData())) && !cpObj._isDirty)
            { return; }

            $pane.find('.line.custom').each(function() { cleanLine(cpObj, $(this)); });
            $pane.empty();

            if (!cpObj.isAvailable()) { return; }

            if ($.isBlank(data))
            { data = cpObj._getCurrentData(); }
            else if (!isTempData)
            { this._data = data; }

            if (!$.isBlank(data))
            { data = cpObj._dataPreProcess(data); }
            this._curData = data;

            var rData = {title: cpObj.getTitle(), subtitle: cpObj.getSubtitle(),
                sections: cpObj._getSections(), paneId: cpObj.$dom().attr('id'), data: data || {}};
            if (!cpObj._isReadOnly())
            { rData.finishButtons = cpObj._getFinishButtons(); }
            else
            { rData.readOnlyMessage = cpObj._getReadOnlyMessage(); }

            var sectionOnlyIfs = {};
            var customSections = {};
            var curSectId;
            var directive = {
                '.subtitle': 'subtitle',
                '.subtitleBlock@class+': function(a)
                { return $.isBlank(a.context.subtitle) ? 'hide' : ''; },
                '.readOnlyMessage': 'readOnlyMessage',
                '.readOnlyBlock@class+': function(a)
                { return $.isBlank(a.context.readOnlyMessage) ? 'hide' : ''; },
                '.formSection': {
                    'section<-sections': {
                        '@class+': function(arg)
                        {
                            curSectId = _.uniqueId();
                            return _.compact([arg.item.type, arg.item.name,
                            (!$.isBlank(arg.item.onlyIf) ||
                                arg.item.type == 'hidden' ? 'hide' : ''),
                            (!$.isBlank(arg.item.customContent)) ? 'custom' : '' ].concat(
                                $.arrayify(arg.item.customClasses)))
                            .join(' ');
                        },
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
                        '@name': function(arg)
                        { return (arg.item.name || '') + '_' + curSectId; },
                        '.formHeader': 'section.title',
                        '.formHeader@for': function(arg)
                        { return (arg.item.name || '') + '_' + curSectId; },
                        '.formHeader@class+': function(arg)
                        { return $.isBlank(arg.item.title) ? 'hide' : ''; },
                        '.sectionSelect@id': function(arg)
                        { return (arg.item.name || '') + '_' + curSectId; },
                        '.sectionSelect@name': function(arg)
                        { return (arg.item.name || '') + '_' + curSectId; },
                        '.sectionContent+': function(a)
                        { return _.map(a.item.fields || [], function(f, i)
                            { return renderLine(cpObj,
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
            $pane.toggleClass('readOnly', cpObj._isReadOnly());

            if ($pane.find('label.required').length > 0)
            { $pane.find('div.required').removeClass('hide'); }

            // Dynamically show/hide panes
            // Pre-run these selectors, because for large panes, it can be slow in IE7
            var $sections = cpObj.$dom().find('.formSection');
            var $fields = cpObj.$dom().find('input, select, textarea');
            _.each(sectionOnlyIfs, function(oif, uid)
                    { hookUpSectionHiding(cpObj, oif, uid, $sections, $fields); });

            $pane.find('.formSection.selectable').each(function()
            {
                var $s = $(this);
                var hasData = $s.find('[data-dataValue]').length > 0;
                $s.toggleClass('collapsed', !hasData);
                $s.find('.sectionSelect').value(hasData);
            });

            if (!cpObj._isReadOnly())
            {
                $pane.find('.formSection.selectable .sectionSelect').bind('click', function(e)
                {
                    var $c = $(this);
                    _.defer(function()
                    { $c.closest('.formSection').toggleClass('collapsed', !$c.value()); });
                });
            }

            hookUpFields(cpObj, $pane);

            $pane.find('.button.addValue').bind('click', function(e)
            {
                e.preventDefault();
                addRepeaterLine(cpObj, $(this));
            });


            $pane.find('.finishButtons a').bind('click', function(e)
            {
                e.preventDefault();
                var $button = $(this);
                if ($button.is('.disabled')) { return; }

                cpObj._startProcessing();

                var doCallback = function(finalCallback)
                { cpObj._finish(data, $button.attr('data-value'), finalCallback); };

                if (!$.isBlank(blist.util.inlineLogin) && $button.is('.requiresLogin'))
                {
                    var msg = $button.attr('data-loginMsg') || cpObj.settings.defaultLoginMessage;
                    blist.util.inlineLogin.verifyUser(
                        function(isSuccess, successCallback)
                        {
                            if (isSuccess) { doCallback(successCallback); }
                            else
                            {
                                $pane.find('.mainError').text(msg);
                                cpObj._finishProcessing();
                            }
                        }, msg);
                }
                else
                { doCallback(); }
            });

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
                { cs.callback.call(cpObj, $sc, data); }
            });

            cpObj._validator = $pane.submit(function(e)
                    {
                        if ($.isBlank($(this).attr('action')))
                        { e.preventDefault(); }
                    })
                .validate({ignore: ':hidden', errorElement: 'span',
                    errorPlacement: function($error, $element)
                        { $error.appendTo($element.closest('.line')); }});

            cpObj._isDirty = false;
            cpObj._visible = true;
        },

        reset: function(isSoft)
        {
            var cpObj = this;
            if (isSoft && cpObj.$dom().is('.noReset')) { return; }

            // Re-rendering the pane is not really much worse than trying
            // to reset it; and we don't have to worry about reset and then
            // rendering a pane immediately
            cpObj._isDirty = true;

            if (cpObj._visible) { cpObj.render(); }
        },

        validatePane: function()
        {
            var cpObj = this;
            var $fsVis = cpObj.$dom().find('.formSection').filter(':visible');
            var $fsVisDis = $fsVis.filter('.disabled');
            // Hide finish buttons if no visible & enabled sections
            cpObj.$dom().find('.finishButtons').toggleClass('hide', $fsVis.length == $fsVisDis.length)
                // Disable submit button if not all visible & required fields filled in
                .find('.submit').toggleClass('disabled', cpObj.$dom().find('input, select, textarea')
                    .filter('.required:visible:not(:disabled)')
                    .filter(':blank, .prompt, :checkbox:unchecked').length > 0 || $fsVisDis.length > 0);
        },

        _startProcessing: function()
        { this.$dom().loadingSpinner().showHide(true); },

        _finishProcessing: function()
        { this.$dom().loadingSpinner().showHide(false); },

        // Merely tells parent it can be hidden now, and then marks it as dirty
        _hide: function()
        {
            this.$dom().trigger('hide');
            this.reset();
        },

        // Data to populate the pane with
        _getCurrentData: function()
        { return this._data || this.settings.data; },

        _dataPreProcess: function(data)
        { return data; },

        // readOnly means finish buttons are hidden, all fields are disabled,
        // text fields are put in read-only mode (selectable, not editable)
        _isReadOnly: function()
        { return false; },

        _getReadOnlyMessage: function()
        { return null; },

        // Get configuration for the sections to display in the pane. See config above
        _getSections: function()
        { return []; },

        // List of buttons to display for the conclusion of the pane
        // [
        //   {
        //     + text: text to display
        //     + value: value that is passed to the finishCallback on click
        //     + isDefault: boolean, marked as default button if true
        //     + isCancel: boolean, marked as cancel button if true
        //     + requiresLogin: boolean, whether or not this action requires
        //       the user to be logged in
        //     + loginMessage: custom message to display when prompting the user
        //       to log in.  Will use the defaultLoginMessage from gridSidebar
        //       if not provided
        //   }
        // ]
        _getFinishButtons: function()
        { return []; },

        // Called when a finish button is clicked
        _finish: function(data, value, finalCallback)
        {
            var cpObj = this;
            if (!value)
            {
                cpObj._finishProcessing();
                cpObj._hide();
                return false;
            }

            // Validate disabled sections
            cpObj.$dom().find('.formSection.disabled:visible').addClass('error');

            prepareValidation(cpObj);

            // Validate form
            if (!cpObj.$dom().find('form').valid())
            {
                cpObj._finishProcessing();
                // Undo our hidden lines before returning
                resetValidation(cpObj);
                cpObj.$dom().find('.mainError')
                    .text('There were problems with the specified values. ' +
                        'Please check the errors above.');
                return false;
            }

            // Undo our hidden lines before returning
            resetValidation(cpObj);
            cpObj.$dom().find('.mainError').text('');
            return true;
        },

        _getInputValue: function($input, results)
        {
            var cpObj = this;
            var $parents = $input.parents();

            // If this is a radioBlock, we're actually interested in the values
            // of the contained controls. otherwise, it's a radioSelect and we
            // want the radio itself
            if ($input.isInputType('radio') && $parents.hasClass('radioBlock'))
            {
                $input = $input.closest('.radioLine').find('label :input:not(.prompt)');
                if ($input.length < 1) { return results; }
            }

            var value = inputValue(cpObj, $input);

            var inputName = $input.attr('name');

            results = results || {};
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
                    var buttonName = $curRep.children('.button.addValue').attr('name');
                    if (i != $repeaters.length - 1)
                    { buttonName = buttonName.split('-').slice(0, -1).join('-'); }
                    parArray = addFormValue(buttonName, [], parObj);

                    var curName = (i == 0 ? $input :
                        $repeaters.eq(i - 1).children('.button.addValue')).attr('name');
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

                var $savedDataLine = $input.closest('.line[data-savedData]');
                if ($savedDataLine.length > 0)
                { $.extend(parObj, JSON.parse($savedDataLine.attr('data-savedData') || '{}')); }
            }

            // If this is a column select, then parse the value as a num,
            // since it is a column ID
            if (!$.isBlank(value) && ($input.tagName() == 'select') && $parents.hasClass('columnSelect'))
            { value = parseInt(value); }

            // Now add the value
            addFormValue(inputName, value, parObj);

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
                    { addFormValue(k, $sel.attr('data-custom-' + k), parObj); });
                }
            }

            if (!$.isBlank(parArray) && !_.isEmpty(parObj))
            { parArray[parIndex] = parObj; }

            return results;
        },

        /* This turns a pane into an object with values based on the names
         * of the fields */
        _getFormValues: function()
        {
            var cpObj = this;
            var results = {};

            prepareValidation(cpObj);

            // Loop through all the inputs & sliders in dom order.
            // Filter down to only the visible ones that are not
            // .prompt (meaning not filled in), .sectionSelect (top-level
            // inputs used for flow control), or in .radioLine label
            // (these are in a radioGroup, and will be handled by getting
            // the selected radio button in the group and manually getting
            // the associated input)
            cpObj.$dom().find('form :input, form .colorControl, form .customWrapper')
                .filter(':visible:not(:disabled, .prompt, ' +
                    '.sectionSelect, .radioLine label *, .customWrapper *)')
                .each(function()
            {
                var $input = $(this);
                var $parents = $input.parents();

                // If this is a radio input, then skip it if not selected
                if ($input.isInputType('radio') && $parents.hasClass('radioLine') &&
                    !$input.is(':checked'))
                { return; }

                // If it is a radioBlock, we need to find the real input
                if ($input.isInputType('radio') && $parents.hasClass('radioBlock'))
                {
                    $input = $input.closest('.radioLine').find('label :input:not(.prompt)');
                    if ($input.length < 1) { return; }
                }

                // If this is in a group, then figure out if any required
                // fields failed
                if ($parents.hasClass('group'))
                {
                    var failed = false;
                    $input.closest('.inputBlock').find('[data-isrequired]:visible:not(:disabled)')
                        .each(function()
                        {
                            var v = inputValue(cpObj, $(this));
                            failed = failed || $.isBlank(v) || v === false;
                        });
                    if (failed) { return; }
                }

                cpObj._getInputValue($input, results);
            });

            // Undo our hidden lines before returning
            resetValidation(cpObj);

            // Do a deep compact to get rid of any null fields, and
            // compact any arrays (especially repeaters, that may have
            // been filled in sparsely)
            return $.deepCompact(results);
        },

        _showMessage: function(msg)
        {
            this.$dom().socrataAlert({message: msg, overlay: true});
        },

        _genericErrorHandler: function(xhr)
        {
            this._finishProcessing();
            this.$dom().find('.mainError').text(JSON.parse(xhr.responseText).message);
        },

        _markReady: function()
        {
            var cpObj = this;
            cpObj._isReady = true;
            var cr = cpObj._cachedRender;
            if (!$.isBlank(cr))
            {
                delete cpObj._cachedRender;
                cpObj.render(cr.data, cr.isTempData);
            }
        }
    }, {
        columnChoosers: null, // One or more dom nodes that can support enterColumnChoose and exitColumnChoose
        name: 'unset', // Name of pane for ID & class
        noReset: false, // if true form elements will not be reset on close
        renderTypeManager: null, // Allows components to access all the render types, if necessary
        view: null
    });


    var uniformUpdate = function(items)
    {
        if (!uniformEnabled()) { return; }
        if (!$.isBlank($.uniform) && !$.isBlank($.uniform.update))
        { $.uniform.update(items); }
    };

    var prepareValidation = function(cpObj)
    {
        // In radioBlocks, hide the non-selected options so they don't attempt to validate
        cpObj.$dom().find('.radioBlock > .radioLine').each(function()
        {
            var $t = $(this);
            if (!$t.find('input[type=radio]').is(':checked'))
            { $t.addClass('hideValidation'); }
        });
    }

    var resetValidation = function(cpObj)
    { cpObj.$dom().find('.radioLine.hideValidation').removeClass('hideValidation'); };

    /* Helper function for getFormValues; this takes a full field name and value,
     * the parent object it goes into */
    var addFormValue = function(name, value, parObj)
    {
        // The name is something like
        // gridSidebar_mapPane:displayFormat.plot.titleId

        // First take off everything up to the colon; that is used
        // simply to make it unique in the page
        var p = name.split(':');
        name = p[p.length - 1];

        if ($.isBlank(name)) { return null; }

        // Next pull apart the name into pieces.  For each level,
        // recurse down, creating empty objects if needed.
        // 'flags' is special, and assumed to be an array
        p = name.split('.');
        while (p.length > 1)
        {
            parObj[p[0]] = parObj[p[0]] ||
                (p[0] == 'flags' || !$.isBlank(p[1].match(/^\d+$/)) ? [] : {});
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
            if ($.isBlank(parObj[p[0]]))
            { parObj[p[0]] = value; }
            ret = parObj[p[0]];
        }
        // Return the element, since we may not have pushed it
        // or overwritten it
        return ret;
    };

    var inputValue = function(cpObj, $input)
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
            var customValue = cpObj._customCallbacks[$input.attr('data-customId')];
            if (!$.isBlank(customValue))
            { customValue = customValue.value; }

            if (_.isFunction(customValue))
            { value = customValue.call(cpObj, $input); }
        }
        else if (($input.tagName() == 'input') &&
                  $input.parents().hasClass('fileChooser'))
        {
            value = $input.closest('.fileChooser').data('ajaxupload');
        }
        return value;
    };

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

    var renderColumnSelectOptions = function(cpObj, columnsObj, isTableColumn, curVal)
    {
        if ($.isBlank(cpObj._view)) { return []; }

        var cols = cpObj._view.columnsForType((columnsObj || {}).type,
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

    /* Get the common attributes from an item for use with $.tag */
    var commonAttrs = function(cpObj, item, context)
    {
        var isDisabled = cpObj._isReadOnly() || (_.isFunction(item.disabled) ?
            item.disabled.call(cpObj, context.data) : item.disabled);

        var result = {id: item.name + '_' + (item.uniqueId || _.uniqueId()),
            name: item.name, title: item.prompt,
            disabled: isDisabled, 'data-isDisabled': isDisabled,
            'class': [ 'inputItem', {value: 'required', onlyIf: item.required &&
                !context.inRepeater},
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
            cpObj._fieldOnlyIfs[oiUid] = item.onlyIf;
            result['data-onlyIf'] = oiUid;
        }

        if (_.isFunction(item.change))
        {
            var uid = 'handler_' + _.uniqueId();
            cpObj._changeHandlers[uid] = item.change;
            result['data-change'] = uid;
        }

        _.each(item.data || {}, function(v, k)
            {
                result['data-custom-' + k] = v;
            });

        return result;
    };

    /* Quick & dirty way to get the value of an item */
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
        { return base; }
        return null;
    };

    /* Get all the required items for a field */
    var getRequiredNames = function(cpObj, contextData, field)
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
                { onlyIf = onlyIf || f.onlyIf.func.call(cpObj, v); }
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
                if (!f.editorCallbacks.required.call(cpObj, vals))
                { continue; }
            }

            names.push(f.name);
        }
        return names;
    };

    /* Check if everything required is present */
    var checkRequiredData = function(cpObj, contextData, field)
    {
        return _.all(getRequiredNames(cpObj, contextData, field),
            function(n) { return !$.isBlank(getValue(contextData, n)); });
    };

    var renderLineItem = {};

    renderLineItem.checkbox = function(cpObj, contents, args, curValue, defValue)
    {
        var v = curValue;
        if ($.isBlank(v)) { v = defValue; }
        _.last(contents).contents = $.extend(commonAttrs(cpObj, args.item, args.context),
            {tagName: 'input', type: 'checkbox', 'data-trueValue': args.item.trueValue,
                'data-falseValue': args.item.falseValue, checked: (!$.isBlank(args.item.trueValue) &&
                    v === args.item.trueValue) || _.include([true, 'true', 1, '1', 'yes', 'checked'], v)});

        if (args.item.inputFirst === true)
        {
            // swap around last two elements, which are
            // the label and input respectively
            var input = contents.pop();
            var label = contents.pop();
            contents.push(input);
            contents.push(label);
        }
    };

    renderLineItem.color = function(cpObj, contents, args, curValue)
    {
        var item = $.extend({}, args.item,
            {defaultValue: $.arrayify(args.item.defaultValue || []), extraClass: 'colorInput'});
        var defColor = curValue ||
            item.defaultValue[args.context.repeaterIndex] ||
            item.defaultValue[0];
        var wrapper = _.last(contents);
        wrapper.contents = [];
        wrapper.contents.push({tagName: 'a', href: '#Color',
            title: 'Choose color', name: args.item.name,
            'class': ['colorControl', {value: 'advanced', onlyIf: args.item.advanced}],
            contents: 'Choose color', style: {'background-color': defColor}});
        if (args.item.showLabel === true)
        { wrapper.contents.push({tagName: 'span', 'class': 'colorControlLabel'}); }
        wrapper.contents.push($.extend(commonAttrs(cpObj, item, args.context),
            {tagName: 'input', type: 'hidden', value: defColor}));
    };

    renderLineItem.columnSelect = function(cpObj, contents, args, curValue, defValue)
    {
        var wrapper = _.last(contents);
        contents.push({tagName: 'a',
            href: '#Select:' + $.makeArray(args.item.columns.type)
                .join('-'),
            title: 'Select a column from the grid',
            'class': ['columnSelector', {value: 'tableColumn', onlyIf: args.item.isTableColumn}],
            contents: 'Select a column from the grid'});

        var options = renderColumnSelectOptions(cpObj, args.item.columns,
            args.item.isTableColumn, curValue || defValue);

        wrapper.contents = $.extend(commonAttrs(cpObj, $.extend({}, args.item,
            {extraClass: 'columnSelectControl'}), args.context),
            {tagName: 'select', contents: options,
            'data-isTableColumn': args.item.isTableColumn,
            'data-columnOptions': $.htmlEscape(JSON.stringify(
                args.item.columns || ''))});
    };

    renderLineItem.custom = function(cpObj, contents, args, curValue)
    {
        var u = _.uniqueId();
        _.last(contents).contents = $.extend(commonAttrs(cpObj, $.extend({}, args.item,
            {extraClass: 'customWrapper'}), args.context),
            {tagName: 'div', 'data-customId': u, 'data-linkedField':
                $.arrayify(args.item.linkedField).join(',')});
        cpObj._customCallbacks[u] = args.item.editorCallbacks;
    };

    renderLineItem.file = function(cpObj, contents, args, curValue)
    {
        _.last(contents).contents = {tagName: 'div', 'class': ['uploader', 'uniform', 'fileChooser'],
            'data-fileTypes': $.htmlEscape(JSON.stringify($.makeArray(args.item.fileTypes))),
            'data-action': args.item.fileAction,
            contents: [{tagName: 'span', 'class': 'filename',
                contents: $.extend(commonAttrs(cpObj, args.item, args.context),
                    {tagName: 'input', type: 'text', readonly: true})},
                {tagName: 'span', 'class': 'action', contents: 'Choose'}]};
    };

    renderLineItem.group = function(cpObj, contents, args, curValue)
    {
        if (args.item.includeLabel !== true)
        { contents.splice(0, contents.length); }

        var items = _.map(args.item.options, function(opt, i)
        {
            return renderLine(cpObj, {context: $.extend({}, args.context, {noTag: true}),
                item: opt, items: args.item.options, pos: i});
        });
        contents.push({tagName: 'div', 'class': ['inputBlock', args.item.extraClass], contents: items});
    };

    renderLineItem.note = function(cpObj, contents, args, curValue)
    {
        var val = _.isFunction(args.item.value) ?
            args.item.value.call(cpObj, _.isEmpty(args.context.data) ?
                null : args.context.data) : args.item.value;
        if (!$.isBlank(val) && !args.item.isInput)
        {
            _.last(contents).contents = $.extend(commonAttrs(cpObj, args.item, args.context),
                {tagName: 'span', contents: val});
        }
        else
        { contents.splice(0, contents.length); }
    };

    renderLineItem.radioGroup = function(cpObj, contents, args, curValue, defValue)
    {
        args.item.name += '_' + _.uniqueId();
        var itemAttrs = commonAttrs(cpObj, args.item, args.context);
        var defChecked;
        var valChecked;
        var items = _.map(args.item.options, function(opt, i)
        {
            var id = itemAttrs.id + '-' + i;
            var subLine = renderLine(cpObj, {context: $.extend({}, args.context,
                    {noTag: true, inputOnly: true}), item: opt, items: args.item.options, pos: i});
            var subLineDisabled = _.all(subLine, function(subline)
            { return _.any($.makeArray(subline.contents), function(c) { return c.disabled; }); });

            var radioItem = $.extend({}, itemAttrs, {id: id, tagName: 'input', type: 'radio',
                disabled: subLineDisabled,
                'data-defaultValue': $.htmlEscape(JSON.stringify(defValue == opt.name))});

            if ((curValue || defValue) == opt.name)
            { defChecked = radioItem; }

            var checkSubData;
            checkSubData = function(item)
            {
                if ($.isPlainObject(item))
                { return (item['data-dataValue'] || {}).onlyIf || checkSubData(item.contents); }

                if (!_.isArray(item)) { return false; }

                return _.any(item, function(i) { return checkSubData(i); });
            };
            if (checkSubData(subLine))
            { valChecked = radioItem; }

            return {tagName: 'div', 'class': ['radioLine', opt.type],
                contents: [radioItem, {tagName: 'label', 'for': id, contents: subLine}]};
        });

        if (!$.isBlank(valChecked))
        { valChecked.checked = true; }
        else if (!$.isBlank(defChecked))
        { defChecked.checked = true; }

        contents.push({tagName: 'div', 'class': 'radioBlock', contents: items});
    };

    renderLineItem.radioSelect = function(cpObj, contents, args, curValue, defValue)
    {
        var v = curValue;
        if ($.isBlank(v)) { v = defValue; }
        var itemAttrs = commonAttrs(cpObj, args.item, args.context);

        var items = _.map(args.item.options, function(opt, i)
        {
            var id = itemAttrs.id + '-' + opt;

            return {tagName: 'div', 'class': 'radioLine',
                contents: [$.extend({}, itemAttrs, {tagName: 'input', type: 'radio', id: id,
                    'data-dataValue': opt, checked: opt === v }),
                {tagName: 'label', 'for': id, contents: opt}]};
        });

        _.last(contents).contents = {tagName: 'div', 'class': 'radioSelectBlock', contents: items};
    };

    renderLineItem.repeater = function(cpObj, contents, args, curValue)
    {
        var isRO = cpObj._isReadOnly();
        if ($.isBlank(args.item.text))
        { contents.splice(0, contents.length); }

        var removeButton = {tagName: 'a', href: '#remove',
            title: 'Remove', 'class': 'removeLink delete',
            contents: {tagName: 'span', 'class': 'icon'}};

        var populatedLength = 0;
        if ($.isBlank(args.item.field.name))
        {
            var names = getRequiredNames(cpObj, args.context.data, args.item.field);
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
        { return checkRequiredData(cpObj, v, args.item.field); });

        var numItems = curValue.length || populatedLength;
        if (!isRO && numItems < 1)
        { numItems = args.item.minimum || 1; }
        for (var i = 0; i < numItems; i++)
        {
            var contextData = curValue[i] || args.context.data;
            var hasRequiredData =
                checkRequiredData(cpObj, contextData, args.item.field);

            var l = renderLine(cpObj, {item: args.item.field,
                    context: $.extend({}, args.context,
                        {repeaterIndex: i, noTag: true, inRepeater: i >= args.item.minimum,
                            inRepeaterContext: !$.isBlank(args.item.field.name),
                            data: hasRequiredData ? contextData : null})
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

            if (i >= args.item.minimum && !isRO)
            { l.contents.unshift(removeButton); }

            contents.push(l);
        }

        if (!isRO)
        {
            var templateLine = renderLine(cpObj, {item: $.extend({}, args.item.field,
                        {lineClass: 'repeaterAdded'}),
                context: $.extend({}, args.context, {repeaterIndex: 'templateId',
                    noTag: true, inRepeater: true})
                });
            templateLine.contents.unshift(removeButton);
            templateLine = $.htmlEscape($.tag(templateLine, true));
            contents.push($.button({text: args.item.addText || 'Add Value',
                customAttrs: $.extend(commonAttrs(cpObj, args.item, args.context),
                    {'data-template': templateLine, 'data-count': i, 'data-dataValue': null,
                        'data-maximum': args.item.maximum}),
                className: 'addValue', iconClass: 'add'}, true));
        }
    };

    renderLineItem.select = function(cpObj, contents, args, curValue, defValue)
    {
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
            cpObj._selectOptions[u] = args.item.options;
            tag['data-selectOption'] = u;
        }

        if (!$.isBlank(args.item.linkedField))
        { tag['data-linkedField'] =
            $.arrayify(args.item.linkedField).join(','); }

        _.last(contents).contents = $.extend(commonAttrs(cpObj, $.extend({}, args.item,
                {dataValue: curValue}), args.context), tag);
    };

    renderLineItem.slider = function(cpObj, contents, args, curValue, defValue)
    {
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

        var wrapper = _.last(contents);
        wrapper.contents = [];
        wrapper.contents.push($.extend(commonAttrs(cpObj, $.extend({}, args.item,
                {defaultValue: defValue, dataValue: curValue, extraClass: 'sliderInput'}), args.context),
            {tagName: 'input', type: 'text', value: (_.isNumber(curValue) ? curValue : defValue),
                'data-scale': scale, readonly: true}));

        wrapper.contents.push({tagName: 'span', 'class': 'sliderControl',
                'data-min': min, 'data-max': max});
    };

    renderLineItem['static'] = function(cpObj, contents, args, curValue)
    {
        var val = _.isFunction(args.item.value) ?
            args.item.value.call(cpObj, _.isEmpty(args.context.data) ? null : args.context.data) :
            args.item.value;
        var wrapper = _.last(contents);
        if (!$.isBlank(val))
        {
            if (args.item.isInput)
            {
                wrapper.contents = [];
                wrapper.contents.push({tagName: 'span', contents: val});
                wrapper.contents.push($.extend(commonAttrs(cpObj, args.item, args.context),
                    {tagName: 'input', type: 'hidden', value: val}));
            }
            else
            {
                wrapper.contents = $.extend(commonAttrs(cpObj, args.item, args.context),
                    {tagName: 'span', contents: val});
            }
        }
        else
        { contents.splice(0, contents.length); }
    };

    renderLineItem.text = function(cpObj, contents, args, curValue, defValue)
    {
        var wrapper = _.last(contents);
        wrapper['class'].push('textWrapper');
        var attrs = commonAttrs(cpObj, args.item, args.context);
        if (cpObj._isReadOnly())
        {
            delete attrs.disabled;
            attrs.readonly = 'readonly';
        }
        if (attrs.disabled || attrs.readonly)
        { delete attrs.title; }
        wrapper.contents = $.extend(attrs, {tagName: 'input', type: 'text',
            value: $.htmlEscape(curValue || defValue)});
    };

    renderLineItem.textarea = function(cpObj, contents, args, curValue, defValue)
    {
        var wrapper = _.last(contents);
        wrapper['class'].push('textWrapper');
        var attrs = commonAttrs(cpObj, args.item, args.context);
        if (cpObj._isReadOnly())
        {
            delete attrs.disabled;
            attrs.readonly = 'readonly';
        }
        if (attrs.disabled || attrs.readonly)
        { delete attrs.title; }
        wrapper.contents = $.extend(attrs, {tagName: 'textarea',
            contents: $.htmlEscape(curValue || defValue)});
    };

    /* Render a single input field */
    var renderLine = function(cpObj, args)
    {
        // bail if we don't want to render this.
        if (args.item.onlyIf === false)
        { return null; }

        // Add optional modifier to name; also adjust to make it unique
        args.item = $.extend({}, args.item, {origName : args.item.name,
            name: args.context.paneId +
                ($.isBlank(args.context.sectionName) ? '' : '_' + args.context.sectionName) + ':' +
                (args.item.name || '') +
                ($.isBlank(args.context.repeaterIndex) ? '' : '-' + args.context.repeaterIndex)});

        var contents = [];
        if (!args.context.inputOnly)
        {
            args.item.uniqueId = _.uniqueId();
            contents.push({tagName: 'label', 'for': args.item.name + '_' + args.item.uniqueId,
                    'class': [{value: 'required', onlyIf: args.item.required &&
                        !args.context.inRepeater}],
                    contents: args.item.text});
        }

        var defValue = args.item.defaultValue;
        if (args.context.inRepeater && !_.isUndefined(args.item.repeaterValue))
        { defValue = args.item.repeaterValue; }

        var curValue;
        if (!$.isBlank(args.item.origName))
        {
            curValue = getValue(args.context.data, args.item.origName,
                args.context.inRepeaterContext ? args.context.repeaterIndex : null);
            if (!$.isBlank(curValue))
            { args.item = $.extend({}, args.item, {dataValue: curValue}); }
        }

        var wrapper = {tagName: 'span', 'class': ['inputWrapper']};
        contents.push(wrapper);
        renderLineItem[args.item.type](cpObj, contents, args, curValue, defValue);

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
                {value: 'inputFirst', onlyIf: args.item.inputFirst}], contents: contents};
            return args.context.noTag ? line : $.tag(line, true);
        }
    };

    var cleanLine = function(cpObj, $line)
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
            var cleaner = cpObj._customCallbacks[$f.attr('data-customId')];
            if (!$.isBlank(cleaner)) { cleaner = cleaner.cleanup; }
            if (!_.isFunction(cleaner)) { return; }
            cleaner.call(cpObj, $f);
        });

        $line.find('select.columnSelectControl').each(function()
        { cpObj._columnSelects = _.without(cpObj._columnSelects, this); });
    };

    var updateColumnSelects = function(cpObj, $colSelects)
    {
        _.each($colSelects || cpObj._columnSelects, function(csItem)
        {
            var $sel = $(csItem);
            var newOpts = renderColumnSelectOptions(cpObj,
                JSON.parse($sel.attr('data-columnOptions') || '""'),
                !$.isBlank($sel.attr('data-isTableColumn')),
                $sel.val());
            $sel.find('option').remove();
            _.each(newOpts, function(o) { $sel.append($.tag(o)); });
            uniformUpdate($sel);
        });
    };

    var hookUpLinkedField = function(cpObj, $field)
    {
        var custId = $field.attr('data-customId');
        var customField = cpObj._customCallbacks[custId];
        if (!$.isBlank(customField)) { customField = customField.create; }
        var onlyIf = cpObj._fieldOnlyIfs[$field.attr('data-onlyIf')];

        var selOpt = cpObj._selectOptions[$field.attr('data-selectOption')];
        if (!_.isFunction(selOpt) && !_.isFunction(customField) && !$.isPlainObject(onlyIf))
        { return; }


        var $linkedItems = $();
        var linkedFields = $.makeArray((onlyIf || {}).field || null);
        if (!$.isBlank($field.attr('data-linkedField')))
        {
            linkedFields = linkedFields.concat($field.attr('data-linkedField').split(','));
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
            { curValue = JSON.parse($field.attr('data-defaultValue') || '""'); }

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
                { showField = showField && onlyIf.func.call(cpObj, vals); }
                if (!$.isBlank(onlyIf.value))
                { showField = showField && onlyIf.value == (vals[onlyIf.field] || vals); }
                if (onlyIf.negate) { showField = !showField; }
                $l.toggle(showField);
            }

            if (_.isFunction(selOpt))
            {
                var newOpts = selOpt.call(cpObj, vals, cpObj._curData, $field, curValue);
                $field.find('option:not(.prompt)').remove();
                $field.attr('disabled', $.isBlank(newOpts) || newOpts == 'disabled' ||
                    !!$field.attr('data-isDisabled'));
                $field.closest('.line').toggleClass('hide', newOpts == 'hidden');
                if (!_.isArray(newOpts)) { newOpts = null; }

                _.each(newOpts || [], function(o)
                { $field.append($.tag(renderSelectOption(o, curValue))); });
                $field.change();
            }
            else if (_.isFunction(customField))
            {
                cleanLine(cpObj, $l);
                $field.empty();
                var showLine = customField.call(cpObj, $field, vals, curValue);
                $l.toggle(showLine);
            }
            _.defer(function() { uniformUpdate($field); });
        };
        var defAdjField = function() { _.defer(adjustField); };

        $linkedItems.bind('change.linkedField-' + custId, defAdjField)
            .bind('blur.linkedField-' + custId, defAdjField);
        $field.bind('resetToDefault', function()
            { adjustField(JSON.parse($field.attr('data-dataValue') || '""'), true); })
            .trigger('resetToDefault');
    };

    var hookUpChangeHandler = function(cpObj, $field, handler)
    {
        var handlerProxy = function(event) { handler.call(cpObj, $field, event); };
        var deferredHandlerProxy = function(event)
        { _.defer(function() { handlerProxy(event); }); };

        // deal with each field type manually
        if ($field.hasClass('sliderInput'))
        { $field.siblings('.sliderControl').bind('slide', deferredHandlerProxy); }
        else if ($field.hasClass('colorInput'))
        { $field.siblings('.colorControl').bind('color_change', deferredHandlerProxy); }
        else if ($field.is('input[type=text],textarea,select,input[type=file]'))
        { $field.change(handlerProxy); }
        else if ($field.is('input[type=checkbox],input[type=radio]'))
        {
            $field.change(handlerProxy)
            if ($.browser.msie) { $field.click(handlerProxy); }
        }
    };

    var hookUpFields = function(cpObj, $container)
    {
        //*** Text Prompts
        $container.find('.textPrompt').example(function () { return $(this).attr('title'); });


        //*** Column Selectors
        $container.delegate('.columnSelector', 'click', function(e)
        {
            e.preventDefault();
            e.stopPropagation();

            var $link = $(this);
            var $overlay = cpObj.$dom().closest('.outerPane').find('.paneOverlay');

            var cancelSelect = function()
            {
                $overlay.css('cursor', 'auto').addClass('hide');
                $(document).unbind('.pane_' + cpObj.$dom().attr('id'));
                $link.removeClass('inProcess');
                // TODO: should genericize this away from 'blistTableAccessor'
                cpObj.settings.columnChoosers.each(function()
                    { $(this).blistTableAccessor().exitColumnChoose(); });
            };

            if ($link.is('.inProcess'))
            { cancelSelect(); }
            else
            {
                $overlay.css('cursor', 'crosshair').removeClass('hide');

                // Cancel on ESC
                $(document).bind('keypress.pane_' + cpObj.$dom().attr('id'),
                    function(e) { if (e.keyCode == 27) { cancelSelect(); } })
                    .bind('click.pane_' + cpObj.$dom().attr('id'), function(e)
                    {
                        var inAny = false;
                        cpObj.settings.columnChoosers.each(function()
                        { inAny = inAny || (e.target != document && $.contains(this, e.target)); });
                        if (!inAny) { cancelSelect(); }
                    });
                $link.addClass('inProcess');

                var href = $link.attr('href');
                href = href.slice(href.indexOf('#') + 1);
                var types = href.split(':')[1];
                if ($.isBlank(types)) { types = null; }
                else { types = types.split('-'); }
                cpObj.settings.columnChoosers.each(function()
                {
                    $(this).blistTableAccessor().enterColumnChoose(types, function(c)
                    {
                        cancelSelect();
                        var $sel = $link.siblings('.inputWrapper').find('select');
                        $sel.val($link.is('.tableColumn') ? c.tableColumnId : c.id).change();
                        uniformUpdate($sel);
                    });
                });
            }
        });

        $container.find('select.columnSelectControl').each(function()
        { cpObj._columnSelects.push(this); });


        //*** Custom Handlers
        // Fields that have custom handlers specified against them.
        // Defined before default behaviors in case someone wants to
        // stop propagation for some reason.
        $container.find('[data-change]').each(function()
        { hookUpChangeHandler(cpObj, $(this), cpObj._changeHandlers[$(this).attr('data-change')]); });
        if (_.isFunction(cpObj._changeHandler))
        {
            $container.find('.inputItem').each(function()
            { hookUpChangeHandler(cpObj, $(this), cpObj._changeHandler); });
        }


        //*** Slider
        $container.find('.sliderControl').each(function()
        {
            var $slider = $(this);
            $slider.slider({
                disabled: $slider.siblings('input')[0].disabled,
                min: parseInt($slider.attr('data-min')),
                max: parseInt($slider.attr('data-max')),
                value: parseInt($slider.siblings(':input').val())});
        })
        .bind('slide', function(event, ui) { $(this).siblings(':input').val(ui.value); });


        //*** Color Picker
        $container.find('.colorControl').each(function()
        {
            var $picker = $(this);
            if ($picker.siblings('input')[0].disabled)
            {
                $picker.click(function(e) { e.preventDefault(); });
                return;
            }

            if (!$picker.hasClass('advanced'))
            {
                $picker.bind('color_change',
                function(e, newColor)
                {
                    $(this).css('background-color', newColor)
                        .siblings(':input').val(newColor)
                        .siblings('.colorControlLabel').text(newColor);
                })
                .mousedown(function(e)
                {
                    var $t = $(this);
                    $t.data('colorpicker-color', $t.siblings(':input').val());
                }).one('mousedown', function() { $picker.colorPicker(); });
            }
            else
            {
                var currentColor = ($picker.siblings(':input').val() || '#ffffff');
                if (!currentColor.startsWith('#')) { currentColor = '#' + currentColor; }
                $picker.ColorPicker({
                    color: currentColor,
                    onChange: function(hsb, hex, rgb) {
                        $picker.css('background-color', '#' + hex)
                            .siblings('.colorControlLabel').text('#' + hex)
                            .siblings(':input').val('#' + hex);
                    },
                    onHide: function()
                    { $picker.trigger('color_change'); } // mimic other picker's event
                });
                $picker.css('background-color', currentColor)
                    .siblings('.colorControlLabel').text(currentColor);
            }
        });


        //*** File Chooser
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
                    if (ft.length > 0 && ($.isBlank(ext) || !_.include(ft, ext.toLowerCase())))
                    {
                        $input.attr('data-requiredTypes', $.arrayToSentence(ftOrig, 'or', ',', true));
                    }
                    else { $input.attr('data-requiredTypes', ''); }
                    _.defer(function() { $input.change(); });
                }
            }));
        });


        //*** Repeater
        $container.find('.line.repeater').each(function()
        { checkRepeaterMaxMin(cpObj, $(this)); });

        $container.delegate('.removeLink', 'click', function(e)
        {
            e.preventDefault();
            var $t = $(this);
            var $repeater = $t.closest('.line.repeater');
            var $line = $t.closest('.line');
            if ($line.is('.repeaterAdded'))
            {
                cleanLine(cpObj, $line);
                $line.remove();
            }
            else { $line.addClass('hide'); }

            checkRepeaterMaxMin(cpObj, $repeater);
        });


        //*** Linked Field
        // Find fields that are linked to another field, either through
        // linkedField or onlyIf.  Hook them up to change or show/hide
        // whenever the associated field is changed
        $container.find('[data-linkedField], [data-onlyIf]').each(function()
            { hookUpLinkedField(cpObj, $(this)); });


        //*** Custom Selects
        $container.find('[data-selectOption]:not([data-linkedField])').each(function()
        {
            var $field = $(this);
            var selOpt = cpObj._selectOptions[$field.attr('data-selectOption')];
            if (!_.isFunction(selOpt)) { return; }

            var curValue = JSON.parse($field.attr('data-dataValue') ||
                $field.attr('data-defaultValue') || '""');
            var newOpts = selOpt.call(cpObj, cpObj._curData);
            $field.find('option:not(.prompt)').remove();
            $field.attr('disabled', $.isBlank(newOpts) ||
                newOpts == 'disabled' || !!$field.attr('data-isDisabled'));
            $field.closest('.line').toggleClass('hide', newOpts == 'hidden');
            if (!_.isArray(newOpts)) { newOpts = null; }

            _.each(newOpts || [], function(o)
            { $field.append($.tag(renderSelectOption(o, curValue))); });
            $field.change();
            uniformUpdate($field);
        });


        //*** Validation for Finish Buttons
        $container.delegate('input, select, textarea', 'change blur',
            function() { _.defer(function() { cpObj.validatePane(); }); });


        //*** Radio Selects & Groups
        var checkRadio = function(e)
        {
            var forAttr = $(this).parents('label').attr('for');
            if (!$.isBlank(forAttr))
            { cpObj.$dom().find('#' + $.safeId(forAttr)).click(); }
        };

        // Inputs inside labels are likely attached to radio buttons.
        // We need to preventDefault on the click so focus stays in the input,
        // and isn't stolen by the radio button; then we need to manually
        // trigger the selection of the radio button.  We use mouseup
        // because textPrompt interferes with click events
        $container.delegate('label input, label select, label textarea, label a',
            'click', function(e) { e.preventDefault(); })
        .delegate('label input, label select, label textarea, label a',
            'mouseup change focus', checkRadio);


        //*** Uniform Inputs
        if (uniformEnabled() && !$.isBlank($.uniform))
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

    var hookUpSectionHiding = function(cpObj, oif, uid, $sections, $inputs)
    {
        var $section = $sections.filter('[data-onlyIf="' + uid + '"]');

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
                    { failed = !o.func.call(cpObj, cpObj._curData); }

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
                                o.disabledMessage.call(cpObj) : o.disabledMessage;
                        }
                    }
                    // Displays a warning message but does not hide or disable
                    else if (o.warn && failed)
                    {
                        needsWarning = needsWarning || failed;
                        if (!$.isBlank(o.warningMessage))
                        {
                            warningMessage += _.isFunction(o.warningMessage) ?
                                o.warningMessage.call(cpObj) : o.warningMessage;
                        }
                    }
                    else
                    { isHidden = isHidden || failed; }

                });

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
                { $section.find('.sectionDisabledMessage').html(disabledMessage); }
                else if (needsWarning)
                { $section.find('.sectionWarningMessage').text(warningMessage); }
            });
        };

        // Validate all fields
        _.each(oif, function(o)
        {
            var isField = !$.isBlank(o.field);
            var isFunc = _.isFunction(o.func);
            if (!isField && !isFunc)
            { throw new Error('Only field-value or func objects supported for section onlyIfs'); }

            if (isField)
            {
                // This isn't going to work if there is a section name...
                o.$field = $inputs.filter('[name="' + cpObj.$dom().attr('id') + ':' + o.field + '"]');
                o.$field.change(showHideSection).keypress(showHideSection)
                    .click(showHideSection).attr('data-onlyIfInput', true);
            }
            else if (isFunc && !$.isBlank(cpObj._view))
            { cpObj._view.bind('columns_changed', showHideSection, cpObj); }
        });

        showHideSection();
    };

    var checkRepeaterMaxMin = function(cpObj, $repeater)
    {
        var numLines = $repeater.children('.line:not(.hide)').length;
        var $button = $repeater.children('.button.addValue');
        if (numLines < 1) { _.defer(function() { addRepeaterLine(cpObj, $button); }); }

        var max = $button.attr('data-maximum');
        if ($.isBlank(max)) { return; }

        $button.toggleClass('hide', numLines >= parseInt(max));
    };

    var addRepeaterLine = function(cpObj, $button)
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
            var $i = $a.siblings(':input');
            var colors = JSON.parse($i.attr('data-defaultValue') || '""');
            if (colors.length < 2) { return; }

            var newColor = colors[i % colors.length];
            $a.css('background-color', newColor);
            $i.val(newColor);
        });

        hookUpFields(cpObj, $newLine);
        $button.before($newLine);

        checkRepeaterMaxMin(cpObj, $container);
    };

})(jQuery);
