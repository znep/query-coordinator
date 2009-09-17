(function($)
{
    // Set up namespace for editors to class themselves under
    $.blistEditor =
    {
        extend: function(extHash, extObj)
        {
            if (!extObj) { extObj = blistEditorObject; }
            return $.extend({}, extObj, extHash,
            {
                defaults: $.extend({}, extObj.defaults, extHash.defaults || {}),
                prototype: $.extend({}, extObj.prototype, extHash.prototype || {})
            });
        }
    };

    $.fn.blistEditor = function(options)
    {
        // Check if object was already created
        var blistEditor = $(this[0]).data("blistEditor");
        if (!blistEditor)
        {
            var type = blist.data.types[options.column.type] ||
                blist.data.types.text;
            var editor = type.editor;
            if (editor !== null && editor !== undefined)
            {
                blistEditor = new editor(options, this[0]);
            }
        }
        return blistEditor;
    };

    var blistEditorObject = function(options, dom)
    {
        this.settings = $.extend({}, blistEditorObject.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    var editorUID = 1;

    $.extend(blistEditorObject,
    {
        defaults:
        {
        },

        prototype:
        {
            init: function ()
            {
                var editObj = this;
                var $domObj = editObj.$dom();
                $domObj.keydown(function (e) { handleKeyDown(editObj, e); })
                $domObj.data("blistEditor", editObj);

                editObj.row = editObj.settings.row;
                editObj.column = editObj.settings.column;
                editObj.originalValue = editObj.settings.value;
                if (!editObj._uid)
                { editObj._uid = editorUID++; }

                var $editor = editObj.$editor();
                $domObj.append($editor);
                if (!editObj.isValid()) { $domObj.addClass('invalid'); }
                editObj.editorInserted();

                $(document).bind('mousedown.blistEditor_' + editObj._uid,
                    function (e) { docMouseDown(editObj, e); });
            },

            finishEdit: function()
            {
                var editObj = this;
                if (editObj._uid)
                {
                    $(document).unbind('.blistEditor_' + editObj._uid);
                    editObj._uid = null;
                }
                editObj.$dom().trigger("edit-finished");
                editObj.finishEditExtra();
            },

            $dom: function()
            {
                if (!this._$dom)
                { this._$dom = $(this.currentDom); }
                return this._$dom;
            },

            $editor: function()
            {
                // Implement me
            },

            editorInserted: function()
            {
                // Override me if desired
            },

            initComplete: function(showCallback)
            {
                // Override me if desired to defer call to showCallback
                showCallback();
            },

            finishEditExtra: function()
            {
                // Override me if desired
            },

            currentValue: function()
            {
                // Implement me
                return this.originalValue;
            },

            focus: function()
            {
                // Implement me
            },

            adjustSize: function()
            {
                // Override me if desired
            },

            postAdjustSize: function()
            {
                // Override me if desired
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
             * Query whether this editor supports formatting
             */
            supportsFormatting: function()
            { return false; }
        }
    });

    // Private methods
    var handleKeyDown = function(editObj, event)
    {
        if (event.keyCode == 13 || event.keyCode == 9 || event.keyCode == 27 ||
            event.keyCode == 113)
        // Enter or Tab or Esc or F2
        {
            event.stopPropagation();
            editObj.$dom().trigger('edit_end', [event.keyCode != 27, event]);
        }
    };

    var docMouseDown = function(editObj, event)
    {
        if ($(event.target).parents().andSelf().index(editObj.$dom()) < 0)
        {
            editObj.$dom().trigger('edit_end', [true, event]);
        }
    };


})(jQuery);
