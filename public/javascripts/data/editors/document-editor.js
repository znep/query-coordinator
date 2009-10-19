(function($)
{
    $.blistEditor.document = function(options, dom)
    {
        this.settings = $.extend({}, $.blistEditor.document.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    var buttonClicked = function(editObj, event)
    {
        event.preventDefault();

        var href = $(event.currentTarget).attr('href');
        var action = href.slice(href.indexOf('#') + 1);

        switch (action)
        {
            case 'add':
            case 'replace':
                showDialog(editObj);
                break;
            case 'remove':
                editObj._curVal = null;
                updateButtons(editObj);
                editObj.focus();
                break;
        }
    };

    var showDialog = function(editObj)
    {
        $.uploadDialog().show(editObj.column.base,
                function(id, name) { fileUploaded(editObj, id, name); },
                function() { editObj.focus(); });
        editObj.focus();
    };

    var fileUploaded = function(editObj, fileId, fileName)
    {
        editObj._curVal = {id: fileId, filename: fileName};
        updateButtons(editObj);
    };

    var updateButtons = function(editObj)
    {
        var $d = editObj.$dom();
        var $add = $d.find('.add');
        var $editItems = $d.find('.replace, .remove, .docLink');
        if (editObj._curVal === null)
        {
            $add.show();
            $editItems.hide();
        }
        else
        {
            $add.hide();
            $editItems.show();
        }

        var v = editObj._curVal;
        $d.find('.docLink')
            .attr('href', v ? editObj.column.base + v.id : '')
            .text(v ? v.filename : '');
        $d.trigger('resize');
    };

    var docKeyDown = function(editObj, e)
    {
        if ($.uploadDialog().isVisible())
        {
            if (e.keyCode == 27) // Esc
            {
                e.stopPropagation();
                $.uploadDialog().close();
            }
        }
        else
        {
            if (e.keyCode == 32) // Space
            { showDialog(editObj); }
            if (e.keyCode == 46 || e.keyCode == 8) // Delete or Backspace
            {
                editObj._curVal = null;
                updateButtons(editObj);
            }
        }
    };

    $.extend($.blistEditor.document, $.blistEditor.extend(
    {
        prototype:
        {
            $editor: function()
            {
                if (!this._$editor)
                {
                    this._curVal = this.originalValue;
                    var html = '<div class="blist-table-editor ' +
                        'type-' + this.column.type + '">' +
                        '<a class="button add" href="#add" ' +
                        'title="Add a new document">Add</a>' +
                        '<a class="button replace" href="#replace" ' +
                        'title="Replace the document">Replace</a>' +
                        '<a class="button remove" href="#remove" ' +
                        'title="Remove the document">Remove</a>' +
                        '<a class="docLink" target="blist-viewer"></a>' +
                        '<input class="hiddenTextField" />' +
                        '</div>';
                    this._$editor = $(html);
                }
                return this._$editor;
            },

            editorInserted: function()
            {
                var editObj = this;
                updateButtons(this);
                editObj.$editor().find('a.button')
                    .click(function(e) { buttonClicked(editObj, e); })
                    .end()
                    .find(':input')
                    .keydown(function(e) { docKeyDown(editObj, e); });
            },

            currentValue: function()
            {
                return this._curVal;
            },

            finishEditExtra: function()
            {
                $.uploadDialog().close();
            },

            querySize: function()
            {
                var w = 1;
                this.$editor().find('a:visible').each(function(i, a)
                { w += $(a).outerWidth(true); });
                return { width: w };
            },

            focus: function()
            {
                this.$dom().find(':input').focus();
            }
        }
    }));

})(jQuery);
