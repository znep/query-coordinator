(function($)
{
    $.blistEditor.photo = function(options, dom)
    {
        this.settings = $.extend({}, $.blistEditor.photo.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    var buttonClicked = function(editObj, event)
    {
        var href = $(event.currentTarget).attr('href');
        var hashI = href.indexOf('#');
        if (hashI < 0) { return; }

        event.preventDefault();
        var action = href.slice(hashI + 1);

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
                function(id) { fileUploaded(editObj, id); },
                function() { editObj.focus(); },
                ['jpg', 'jpeg', 'gif', 'pjpeg', 'bmp', 'png', 'tif', 'tiff'],
                'Photo');
        editObj.focus();
    };

    var fileUploaded = function(editObj, fileId)
    {
        editObj._curVal = fileId;
        updateButtons(editObj);
    };

    var updateButtons = function(editObj)
    {
        var $d = editObj.$dom();
        var $add = $d.find('.add');
        var $editItems = $d.find('.view, .replace, .remove, img');
        if (editObj._curVal === null)
        {
            $add.show();
            $editItems.hide();
        }
        else
        {
            $add.hide();
            $editItems.show();

            var url = editObj.column.base + editObj._curVal;
            $d.find('.view').attr('href', url);
            $d.find('img').attr('src', url);
        }

        $d.trigger('resize');
    };

    var photoKeyDown = function(editObj, e)
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

    var imageLoaded = function(editObj)
    {
        editObj.$dom().trigger('resize');
    };

    $.extend($.blistEditor.photo, $.blistEditor.extend(
    {
        prototype:
        {
            $editor: function()
            {
                if (!this._$editor)
                {
                    this._curVal = this.originalValue;
                    var html = '<div class="blist-table-editor ' +
                        'type-' + this.column.type + '"><div class="buttons">' +
                        '<a class="button add" href="#add" ' +
                        'title="Add a new image">Add</a>' +
                        '<a class="button view" target="blist-viewer" ' +
                        'title="View the image in a separate window">View</a>' +
                        '<a class="button replace" href="#replace" ' +
                        'title="Replace the image">Replace</a>' +
                        '<a class="button remove" href="#remove" ' +
                        'title="Remove the image">Remove</a></div>' +
                        '<img />' +
                        '<input />' +
                        '</div>';
                    this._$editor = $(html);
                }
                return this._$editor;
            },

            editorInserted: function()
            {
                this.$dom().addClass('photo-container');
                var editObj = this;
                updateButtons(this);
                editObj.$editor().find('a.button')
                    .click(function(e) { buttonClicked(editObj, e); })
                    .end()
                    .find('img')
                    .load(function() { imageLoaded(editObj); })
                    .end()
                    .find(':input')
                    .keydown(function(e) { photoKeyDown(editObj, e); });
            },

            currentValue: function()
            {
                return this._curVal;
            },

            finishEditExtra: function()
            {
                $.uploadDialog().close();
            },

            setSize: function() {
            },

            focus: function()
            {
                this.$dom().find(':input').focus();
            }
        }
    }));

})(jQuery);
