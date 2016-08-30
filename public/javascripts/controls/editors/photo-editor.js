(function($)
{
    var tt = function(str) { return $.t('controls.editors.photo.' + str + '_title'); };
    var ta = function(str) { return $.t('controls.editors.actions.' + str); };

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
        $.uploadDialog().show(editObj.customProperties.baseUrl,
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
        editObj.$dom().trigger('edit_end', [true]);
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

            var url = editObj.customProperties.baseUrl + editObj._curVal;
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

    $.blistEditor.addEditor('photo', {
        editorAdded: function()
        {
            this._super.apply(this, arguments);

            this.setFullSize();
            var editObj = this;
            updateButtons(this);
            editObj.$editor().find('a.tableButton')
                .click(function(e) { buttonClicked(editObj, e); })
                .end()
                .find('img')
                .load(function() { imageLoaded(editObj); })
                .end()
                .find(':input')
                .keydown(function(e) { photoKeyDown(editObj, e); });
        },

        $editor: function()
        {
            if (!this._$editor)
            {
                this.flattenValue();
                this._curVal = this.originalValue;
                var html = '<div class="blist-table-editor ' +
                    'type-' + this.type.name +
                    '"><div class="buttons">' +
                    '<a class="tableButton add" href="#add" ' +
                    'title="' + tt('add') + '">' + ta('add') + '</a>' +
                    '<a class="tableButton view" target="blist-viewer" ' +
                    'rel="external" ' +
                    'title="' + tt('view') + '">' + ta('view') + '</a>' +
                    '<a class="tableButton replace" href="#replace" ' +
                    'title="' + tt('replace') + '">' + ta('replace') + '</a>' +
                    '<a class="tableButton remove" href="#remove" ' +
                    'title="' + tt('remove') + '">' + ta('remove') + '</a></div>' +
                    '<img />' +
                    '<input class="hiddenTextField" />' +
                    '</div>';
                this._$editor = $(html);
            }
            return this._$editor;
        },

        currentValue: function()
        {
            return this._curVal;
        },

        finishEdit: function()
        {
            this._super();
            $.uploadDialog().close();
        },

        querySize: function()
        {
            var w = 1;
            var h = this.$editor().find('a:visible')
                .each(function(i, a)
                        { w += $(a).outerWidth(true); })
                .outerHeight(true);
            if (this._curVal !== null)
            {
                var $photo = this.$editor().find('img');
                w = Math.max(w, $photo.outerWidth(true));
                h = Math.max(h, $photo.outerHeight(true));
            }
            return { width: w, height: h };
        },

        focus: function()
        {
            this.$dom().find(':input').focus();
        }
    });

})(jQuery);
