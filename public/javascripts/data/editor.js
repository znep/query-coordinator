(function($)
{
    $.fn.blistEditor = function(options)
    {
        // Check if object was already created
        var blistEditor = $(this[0]).data("blistEditor");
        if (!blistEditor)
        {
            blistEditor = new $.blistEditorObject(options, this[0]);
        }
        return blistEditor;
    };

    $.blistEditorObject = function(options, dom)
    {
        this.settings = $.extend({}, $.blistEditorObject.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    $.extend($.blistEditorObject,
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
                $domObj.data("blistEditor", currentObj);
            },

            // External interface methods
            setEditor: function(r, c, v)
            {
                this.row = r;
                this.column = c;
                this.originalValue = v;
                this._editorStale = true;

                var $domObj = this.$dom();
                $domObj.empty();

                var $editor = this.$editor();
                $domObj.append($editor);
                return $editor;
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
                return $(this.currentDom);
            }
        }
    });

    // Private methods

})(jQuery);
