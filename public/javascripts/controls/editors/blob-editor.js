(function($)
{
    var tt = function(str) { return $.t('controls.editors.document.' + str + '_title'); };
    var ta = function(str) { return $.t('controls.editors.actions.' + str); };

    var buttonClicked = function(editObj, event) {
      event.preventDefault();

      var href = $(event.currentTarget).attr('href');
      var action = href.slice(href.indexOf('#') + 1);

      switch (action) {
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

    var showDialog = function(editObj) {
      $.uploadDialog().show(editObj.customProperties.baseUrl,
        function(id, name) { fileUploaded(editObj, id, name); },
        function() { editObj.focus(); });
      editObj.focus();
    };

    var fileUploaded = function(editObj, fileId, fileName) {
      editObj._curVal = fileId;
      editObj._modelView.resyncFileDataForFileIds([ fileId ]).
        done(function(responseData) { editObj._fileData = responseData[0]; }).
        then(function() {
          updateButtons(editObj);
          editObj.$dom().trigger('edit_end', [true]);
        });
    };

    var updateButtons = function(editObj) {
      var $d = editObj.$dom();
      var $add = $d.find('.add');
      var $editItems = $d.find('.replace, .remove');
      if (editObj._curVal === null) {
        $add.show();
        $editItems.hide();
      } else {
        $add.hide();
        $editItems.show();
      }

      $d.trigger('resize');
    };

    var blobKeyDown = function(editObj, e) {
      if ($.uploadDialog().isVisible()) {
        if (e.keyCode == 27) { // Esc
            e.stopPropagation();
            $.uploadDialog().close();
        }
      } else {
        if (e.keyCode == 32) {  // Space
          showDialog(editObj);
        }
        if (e.keyCode == 46 || e.keyCode == 8) { // Delete or Backspace
          editObj._curVal = null;
          updateButtons(editObj);
        }
      }
    };

    var imageLoaded = function(editObj) {
      editObj.$dom().trigger('resize');
    };

    $.blistEditor.addEditor('blob', {
      editorAdded: function() {
        this._super.apply(this, arguments);

        this._fileData = $.deepGet(this.row, 'fileData', this.settings.colLookup);
        this._modelView = this.settings.modelView;

        this.setFullSize();
        var editObj = this;
        updateButtons(this);
        editObj.$editor().
          find('a.tableButton').
            click(function(e) { buttonClicked(editObj, e); }).
          end().
          find('img').
            load(function() { imageLoaded(editObj); }).
          end().
          find(':input').
            keydown(function(e) { blobKeyDown(editObj, e); });
      },

      $editor: function() {
        if (!this._$editor) {
          this._curVal = this.originalValue;
          var html = '<div class="blist-table-editor ' +
            'type-' + this.type.name + '">' +
            '<a class="tableButton add" href="#add" ' +
            'title="' + tt('add') + '">' + ta('add') + '</a>' +
            '<a class="tableButton replace" href="#replace" ' +
            'title="' + tt('replace') + '">' + ta('replace') + '</a>' +
            '<a class="tableButton remove" href="#remove" ' +
            'title="' + tt('remove') + '">' + ta('remove') + '</a>' +
            '<a class="docLink" target="blist-viewer" ' +
            'rel="external"></a>' +
            '<img />' +
            '<input class="hiddenTextField" />' +
            '</div>';
          this._$editor = $(html);
        }
        return this._$editor;
      },

      currentValue: function() {
        return this._curVal;
      },

      finishEdit: function() {
        this._super();
        $.uploadDialog().close();
      },

      querySize: function() {
        var w = 1;
        this.$editor().find('a:visible').each(function(i, a) {
          w += $(a).outerWidth(true);
        });
        return { width: w };
      },

      focus: function() {
        this.$dom().find(':input').focus();
      }
    });
})(jQuery);
