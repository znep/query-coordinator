(function($)
{
    $.fn.blistEditor = function(options)
    {
        // Check if object was already created
        var blistEditor = $(this[0]).data("blistEditor");
        if (!blistEditor)
        {
            blistEditor = new blistEditorObject(options, this[0]);
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
                var currentObj = this;
                var $domObj = $(currentObj.currentDom);
                $domObj.bind('keydown.blistEditor',
                    function (e) { handleKeyDown(currentObj, e); });
                $domObj.data("blistEditor", currentObj);
            },

            // External interface methods
            startEdit: function(r, c, v)
            {
                var editObj = this;
                // Make sure this is finished first
                editObj.finishEdit();

                editObj.row = r;
                editObj.column = c;
                editObj.originalValue = v;
                editObj._editorStale = true;
                if (!editObj._uid)
                { editObj._uid = editorUID++; }

                var $domObj = editObj.$dom();
                $domObj.empty();

                var $editor = editObj.$editor();
                $domObj.append($editor);

                $(document).bind('mousedown.blistEditor_' + editObj._uid,
                    function (e) { docMouseDown(editObj, e); });

                return $editor;
            },

            finishEdit: function()
            {
                var editObj = this;
                if (editObj._uid)
                {
                    $(document).unbind('.blistEditor_' + editObj._uid);
                    editObj._uid = null;
                }
            },

            $editor: function()
            {
                if (this._editorStale)
                {
                    this._$editor = $('<div class="blist-table-editor blist-td">' +
                        '<input type="text" value="' + this.originalValue +
                        '" /></div>');
                    this._editorStale = false;
                }
                return this._$editor;
            },

            currentValue: function()
            {
                return this.$editor().find(':text').val();
            },

            $dom: function()
            {
                if (!this._$dom)
                { this._$dom = $(this.currentDom); }
                return this._$dom;
            }
        }
    });

    // Private methods
    var handleKeyDown = function(editObj, event)
    {
        if (event.keyCode == 13 || event.keyCode == 9) // Enter or Tab
        {
            editObj.$dom().trigger('edit_end', [true, event]);
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
