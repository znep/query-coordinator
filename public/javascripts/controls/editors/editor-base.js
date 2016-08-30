(function($)
{
    // Set up namespace for editors to class themselves under
    $.blistEditor =
    {
        addEditor: function(type, editor, dependsOn)
        {
            if ($.isBlank(blist.datatypes.interfaceTypes[type])) { throw 'No such type exists: ' + type; }
            blist.datatypes.interfaceTypes[type].editor = type;
            $.Control.registerMixin(type, editor, {}, 'blistEditor', dependsOn);
        }
    };

    $.Control.extend('blistEditor', {
        _init: function()
        {
            var editObj = this;
            editObj._super.apply(this, arguments);

            var $domObj = editObj.$dom();
            $domObj.keydown(function (e) { handleKeyDown(editObj, e); })

            editObj.row = editObj.settings.row;
            editObj.type = editObj.settings.type;
            editObj.format = editObj.settings.format || {};
            editObj.customProperties = editObj.settings.customProperties || {};
            editObj.originalValue = editObj.settings.value;
            editObj.newValue = this.settings.newValue;
            if (!editObj._uid)
            { editObj._uid = _.uniqueId(); }

            var $editor = editObj.$editor();
            $domObj.append($editor);
            if (!editObj.isValid()) { $domObj.addClass('invalid'); }

            editObj.editorAdded();
            $(document).bind('mousedown.blistEditor_' + editObj._uid,
                function (e) { docMouseDown(editObj, e); });
        },

        _getMixins: function(options)
        {
            return [(options.editorInterface || options.type.interfaceType).editor];
        },

        editorAdded: function() { },

        finishEdit: function()
        {
            var editObj = this;
            if (editObj._uid)
            {
                $(document).unbind('.blistEditor_' + editObj._uid);
                editObj._uid = null;
            }
            delete editObj._$externalEditor;
            editObj.$dom().trigger("edit-finished");
        },

        flattenValue: function()
        {
            if ($.isPlainObject(this.originalValue))
            { this.originalValue = _.values(this.originalValue)[0]; }
        },

        initComplete: function(showCallback)
        {
            // Override me if desired to defer call to showCallback
            showCallback();
        },

        registerExternalEditor: function($extEditor)
        {
            this._$externalEditor = $extEditor;
        },

        currentValue: function()
        {
            // Implement me
            return this.originalValue;
        },

        /**
         * Set focus to the control.  The default implementation works for any control in which the first text
         * field should receive the focus.
         */
        focus: function()
        {
            var $text = this.$editor().find(":text:first");
            $text.focus();
            if (this.newValue != null)
            {
                delete this.newValue;
                setCursorPosition($text[0]);
            }
            else
            {
                $text.select();
            }
        },

        setFullSize: function()
        {
            this.$dom().addClass('full-size');
        },

        /**
         * Set the element's size given sizing constraints.
         */
        adjustSize: function(minWidth, minHeight, maxWidth, maxHeight)
        {
            // Determine my desired size, if any
            var size = this.querySize();
            if (size) {
                var width = size.width;
                var height = size.height;
            }
            if (!width)
                width = 0;
            if (!height)
                height = 0;

            // Obtain the element we will size and the container.  We use the container to compute padding/border
            // deltas so we can compensate for them in the CSS width/height properties.
            var $sz = $(this.getSizeElement());
            var outer = this.$dom()[0];

            // Compute the minimum dimensions (reference dimensions - editor padding) and correct dimensions that
            // are too small
            minWidth = minWidth - (outer.offsetWidth - $sz.width());
            minHeight = minHeight - (outer.offsetHeight - $sz.height());
            if (width < minWidth)
                width = minWidth;
            if (height < minHeight)
                height = minHeight;

            // Correct dimensions that are too large
            maxWidth = Math.floor(maxWidth || Infinity);
            maxHeight = Math.floor(maxHeight || Infinity);
            if (width > maxWidth)
                width = maxWidth;
            if (height > maxHeight)
                height = maxHeight;

            this.setSize(width, height);
        },

        /**
         * Retrieve the element upon which sizing logic should be applied.
         */
        getSizeElement: function()
        {
            return this.$editor()[0];
        },

        /**
         * Set the size of the element based on sizing computation.  Derivatives may override if sizing requires
         * more than simply setting a size.
         */
        setSize: function(width, height)
        {
            var $outer = this.$dom();
            var $sz = $(this.getSizeElement());
            var outerWidth = width + ($outer.width() - $sz.width());
            var outerHeight = height + ($outer.height() - $sz.height());

            // IE7 will fire resize when changing $outer's size, which can
            // lead to an infite loop of resizing, with slightly different
            // sizes each time.  The only way to avoid this seems to be to
            // keep track of previous resize target, and don't set the
            // same thing again (comparing against the current size
            // doesn't work)
            if (width != this._prevWidth || height != this._prevHeight)
            {
                this._prevWidth = width;
                this._prevHeight = height;
                $sz.css({ width: width + 'px', height: height + 'px' });
                // When scrolled horizontally in IE7, it will cut editors short
                // unless we force the size of the container
                $outer.width(outerWidth).height(outerHeight);
            }
        },

        /**
         * Derivatives can override this function to convey a preferred size.
         */
        querySize: function()
        {
            return {};
        },

        isValid: function()
        {
            // Override me if desired
            return true;
        },

        /**
         * Derivatives may call this to notify listeners of command state changes.
         */
        actionStatesChanged: function()
        {
            this.$dom().trigger("action-state-change");
        },

        /**
         * Derivatives can pass state of commands to the external world by overriding this method.
         */
        getActionStates: function() {
            return {};
        },

        /**
         * Trigger an action.  Returns true iff the action is executed.  Value is optional.
         */
        action: function(name, value) {
            return false;
        },

        /**
         * Am I embedded in a table edit container?
         */
        inContainer: function() {
            return this.$editor() && this.$editor().closest('.blist-table-edit-container').length ? true : false;
        },

        /**
         * Query whether this editor supports formatting
         */
        supportsFormatting: function()
        { return false; },

        /**
         * Derivatives may call this to convey that the user changed the control's value.  This is currently only
         * required for "expand" editors -- the table upgrades these to "select" editors when this occurs.
         */
        changed: function()
        {
            this.$dom().trigger('editor-change');
        }
    });

    // Detect key events that terminate editing
    var handleKeyDown = function(editObj, event)
    {
        var save = true;
        switch (event.keyCode) {
            case 9: // Tab
            case 13: // Enter
            case 33: // Page up
            case 34: // Page down
            case 113: // F2
                break;
                
            case 27: // Escape
                save = false;
                break;

            case 38: // Up
            case 40: // Down
                if ($(event.target).is(":text") &&
                    $(event.target).closest(".blist-combo").length < 1)
                {
                    break;
                }
                return;
                
            case 37: // Left
                if ($(event.target).is(":text"))
                {
                    if (!getCursorPosition(event.target))
                    {
                        // User hit left arrow at the left edge of the field
                        var $prev = $(event.target).prev(":text");
                        if ($prev.length)
                        {
                            // Jump to previous text box
                            $prev.focus();
                            setCursorPosition($prev[0]);
                            event.preventDefault();
                            return;
                        }
                        break;
                    }
                }
                return;
                
            case 39: // Right
                if ($(event.target).is(":text"))
                {
                    if (getCursorPosition(event.target) == $(event.target).val().length)
                    {
                        // User hit right arrow at the right edge of the field
                        var $next = $(event.target).next(":text");
                        if ($next.length)
                        {
                            // Jump to next text box
                            $next.focus();
                            setCursorPosition($next[0], 0);
                            event.preventDefault();
                            return;
                        }
                        break;
                    }
                }
                return;

            default:
                return;
        }

        event.stopPropagation();
        editObj.$dom().trigger('edit_end', [save, event]);
    };

    // Detect mouse events that terminate editing
    var docMouseDown = function(editObj, event)
    {
        // We have to detect if they chose to upload a file in here, because
        // it seems to be impossible to catch and prevent the event from
        // the upload dialog itself
        if ($(event.target).parents().andSelf().index(editObj.$dom().add(editObj._$externalEditor)) < 0 &&
            $(event.target).attr('name') != 'uploadFileInput')
        {
            editObj.$dom().trigger('edit_end', [true, event]);
        }
    };

    // Set the cursor position within a text input (default position is the end
    // of the text)
    var setCursorPosition = function(text, pos)
    {
        if (pos == null)
            pos = $(text).val().length;
        if (text.createTextRange)
        {
            var range = text.createTextRange();
            range.collapse(true);
            range.moveEnd('character', pos);
            range.moveStart('character', pos);
            range.select();
        }
        else
        {
            text.setSelectionRange(pos, pos);
        }
    }

    // Determine a cursor's position within a text input
    var getCursorPosition = function(text)
    {
        // IE
        if (text.createTextRange)
        {
            var range = text.createTextRange();
            if (range.text.length)
            {
                return -1;
            }
            range.moveStart(0);
            return range.text.length;
        }

        // Normal browsers
        if (text.selectionStart != text.selectionEnd)
        {
            return -1;
        }
        return text.selectionStart;
    };
})(jQuery);
