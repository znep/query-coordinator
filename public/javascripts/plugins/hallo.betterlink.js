(function(jQuery) {
  return jQuery.widget('IKS.hallobetterlink', {
    options: {
      editable: null,
      uuid: '',
      defaultUrl: '',
      toolbar: null,
      linkInput: null,
      urlInput: null,
      clearButton: null,
      button: null,
      buttonset: null,
      execCommandOverride: function() { document.execCommand.apply(document, arguments); },
      linkInputOpts: {
        title: 'Enter Link',
        buttonTitle: 'Insert',
        buttonUpdateTitle: 'Update',
        linkInputClass: 'hallobetterlink-linkInput'
      },
      buttonCssClass: null,
      editing: false,
      savedToolbarPosition: null
    },

    _bindEvents: function() {
      var _this = this;

      this.options.editable.element.on('halloselected', function(event, data) {
        _this.options.savedToolbarPosition = data;
        _this._initializeUrlInputValue();
      });

      this.options.editable.element.on('hallobetterlinkexpanded', function() {
        _this.options.editable.element.trigger('halloselected', _this.options.savedToolbarPosition);
      });

      this.options.editable.element.on('hallobetterlinkfinished, hallounselected', function(){
        _this.options.editing = false;
        _this.options.buttonset.removeClass('expanded');
        _this.options.urlInput.val(_this.options.defaultUrl);
        _this.options.linkInput.removeClass('urlError');
        _this.options.toolbar.hide();
      });

      this.options.clearButton.on('click', function() {
        _this.element.trigger('clearlink');
      });

      this.options.urlInput.on('keyup', function(e) {
        _this._setClearButtonState();
      });

      this.element.on('clearlink', function(){
        _this.options.urlInput.val(_this.options.defaultUrl);
        _this._setClearButtonState();
        _this.options.linkInput.removeClass('urlError');
      });

      this.options.linkInput.find('form').on('change', function(e){
        _this._saveUrl();
      });

      jQuery(this.options.urlInput[0].form).find('input[type=submit]').on('click', function() {
        _this._saveUrl();
      });

      this.element.on('keyup paste change mouseup', function(event) {
        var nodeName, start;
        start = jQuery(_this.options.editable.getSelection().startContainer);
        if (start.prop('nodeName')) {
          nodeName = start.prop('nodeName');
        } else {
          nodeName = start.parent().prop('nodeName');
        }
        if (nodeName && nodeName.toUpperCase() === 'A') {
          jQuery('label', _this.options.button).addClass('ui-state-active');
          return;
        }
        return jQuery('label', _this.options.button).removeClass('ui-state-active');
      });

      this.options.button.on('click', function(event) {
        var buttonSelector, selectionParent;
        if (_this.options.editing) {
          return false;
        }
        _this.options.editing = true;
        _this._initializeUrlInputValue();
        _this._setClearButtonState();
        _this.options.editable.keepActivated(true);
        _this.options.buttonset.addClass('expanded');
        _this.options.editable.element.trigger('hallobetterlinkexpanded');
        return setTimeout(function(){
          _this.options.urlInput.focus();
        }, 20);
      });
    },

    _initializeUrlInputValue: function() {
      var $submitButton, $selection, selectionParent, urlInput;
      urlInput = this.options.urlInput;
      urlInput.prop('disabled', false);
      this.lastSelection = this.options.editable.getSelection();
      selectionParent = this.lastSelection.startContainer.parentNode;
      $submitButton = jQuery(urlInput[0].form).find('input[type=submit]')
      if (!selectionParent.href) {
        $selection = jQuery('<div>').html(this.lastSelection.toHtml());
        if (jQuery('a', $selection).length > 1) {
          urlInput.prop('disabled', true).val('(multiple links selected)');
        } else {
          urlInput.val(this.options.defaultUrl);
          $submitButton.val(butTitle);
        }
      } else {
        urlInput.val(jQuery(selectionParent).attr('href'));
        this._setUrlErrorState();
        $submitButton.val(butUpdateTitle);
        if (!this.options.buttonset.hasClass('expanded')) {
          this.options.button.click();
        }
      }
    },

    _setClearButtonState: function() {
      if (this.options.urlInput.val().length > 0 && !this.options.urlInput.prop('disabled')) {
        this.options.clearButton.show();
      } else {
        this.options.clearButton.hide();
      }
    },

    _setUrlErrorState: function() {
      var url = this.options.urlInput.val();
      if (!(/^(http(?:s)?\:\/\/[a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*\.[a-zA-Z]{2,6}(?:\/?|(?:\/[\w\-]+)*)(?:\/?|\/\w+\.[a-zA-Z]{2,4}(?:\?[\w]+\=[\w\-]+)?)?(?:\&[\w]+\=[\w\-]+)*)$/).test(url)) {
        this.options.linkInput.addClass('urlError');
      } else {
        this.options.linkInput.removeClass('urlError');
      }
    },

    _saveUrl: function() {
      var link, selectionStart, urlInput,
        _this = this;

      urlInput = this.options.urlInput;
      link = urlInput.val();
      this.options.editable.restoreSelection(this.lastSelection);

      isEmptyLink = function(link) {
        if ((new RegExp(/^\s*$/)).test(link)) {
          return true;
        }
        if (link === _this.options.defaultUrl) {
          return true;
        }
        return false;
      };

      if (isEmptyLink(link)) {
        selectionStart = this.lastSelection.startContainer;
        if (this.lastSelection.collapsed) {
          this.lastSelection.setStartBefore(selectionStart);
          this.lastSelection.setEndAfter(selectionStart);
          window.getSelection().addRange(this.lastSelection);
        }
        this.options.execCommandOverride('unlink', null, '');
      } else {
        if (!(/:\/\//.test(link)) && !(/^mailto:/.test(link))) {
          link = 'http://' + link;
        }
        if (this.lastSelection.startContainer.parentNode.href === void 0) {
          this.options.execCommandOverride('createLink', null, link);
        } else {
          this.lastSelection.startContainer.parentNode.href = link;
        }
      }
      this.options.editable.element.focus();
      this.options.editable.keepActivated(false);

      this.options.editable.element.trigger('change');
      this.options.editable.removeAllSelections();

      this.options.editable.element.trigger('hallobetterlinkfinished');
    },

    populateToolbar: function(toolbar) {
      var buttonize, buttonset, widget,
        _this = this;

      widget = this;
      this.options.toolbar = jQuery(toolbar);
      linkInputId = '' + this.options.uuid + '-linkInput';
      butTitle = this.options.linkInputOpts.buttonTitle;
      butUpdateTitle = this.options.linkInputOpts.buttonUpdateTitle;
      linkInput = jQuery('<span id="hbl' + linkInputId + '"> <form action="#" method="post" class="linkForm"> <input class="url" type="text" name="url" placeholder="Enter website URL" value="' + this.options.defaultUrl + '" /> <input type="submit" id="addlinkButton" value="' + butTitle + '"/> <span class="warning" title="This is not a valid website URL"><i class="icon-warning-sign"></i></span> <span class="clear"><i class="icon-remove"></i></span> </form></span>');
      this.options.linkInput = linkInput;
      this.options.urlInput = jQuery('input[name=url]', linkInput);
      this.options.clearButton = jQuery('.clear', linkInput);

      this.options.buttonset = buttonset = jQuery('<span class="' + widget.widgetName + '"></span>');

      buttonize = function(type) {
        var button, buttonHolder, id;
        id = 'hbl' + _this.options.uuid + '-' + type;
        buttonHolder = jQuery('<span></span>');
        buttonHolder.hallobutton({
          label: 'Link',
          icon: 'icon-link',
          editable: _this.options.editable,
          command: null,
          queryState: false,
          uuid: _this.options.uuid,
          cssClass: _this.options.buttonCssClass
        });

        buttonset.append(buttonHolder);
        return _this.options.button = buttonHolder;
      };

      buttonize('A');
      jQuery('button', this.options.button).prepend(linkInput);
      buttonset.hallobuttonset();

      this._bindEvents();

      return toolbar.append(buttonset);
    }
  });
})(jQuery);
