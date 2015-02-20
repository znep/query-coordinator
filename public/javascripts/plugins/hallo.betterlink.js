(function(jQuery) {
  return jQuery.widget('IKS.hallobetterlink', {
    options: {
      editable: null,
      uuid: '',
      defaultUrl: '',
      toolbar: null,
      linkInput: null,
      urlForm: null,
      urlInput: null,
      clearButton: null,
      submitButton: null,
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
      saved: null,
      savedToolbarPosition: null,
      linkInSelection: null,
      dirty: false
    },

    _bindEvents: function() {
      var onBodyClick,
        _this = this;

      onBodyClick = function(e) {
        var target = jQuery(e.target);
        if (target.closest('.hallobetterlink').length === 0) {
          _this.options.editable.element.trigger('hallounselected');
        }
      }

      this.options.editable.element.on('halloselected', function(e, data) {
        _this.options.savedToolbarPosition = data;
        _this._initializeUrlInputValue();
      });

      this.options.editable.element.on('hallobetterlinkexpanded', function() {
        var data = jQuery.extend(_this.options.savedToolbarPosition, { alreadyInitialized: true });
        _this.options.editable.element.trigger('halloselected', data);
      });

      this.options.editable.element.on('hallounselected', function(){
        if (_this.options.dirty === true) {
          return false;
        }
        _this.options.editing = false;
        _this.options.dirty = false;
        _this.options.editable.element.focus();
        _this.options.editable.keepActivated(false);
        _this.options.buttonset.removeClass('expanded');
        _this.options.urlInput.val(_this.options.defaultUrl);
        _this.options.linkInput.removeClass('urlError');
        _this.options.linkInSelection = null;
        _this.options.toolbar.hide();
        jQuery(document.body).off('click', onBodyClick);
      });

      this.options.clearButton.on('click', function() {
        var $link = $(_this.options.linkInSelection);
        $link.contents().unwrap(); // removes anchor tag but preserves innerHTML

        _this.options.urlInput.val(_this.options.defaultUrl);
        _this.options.dirty = true;
        _this._setClearButtonState();
        _this.options.linkInput.removeClass('urlError');
        _this._saveUrl();
      });

      this.options.urlInput.on('keyup', function(e) {
        _this._setClearButtonState();
        if (e.which === 13) {
          e.preventDefault();
          _this.options.urlForm.submit();
        }
      });

      this.options.urlForm.on('change submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        _this._saveUrl();
      });

      this.options.urlInput.on('keyup paste change', function(e) {
        _this.options.dirty = true;
      });

      this.element.on('keyup paste change mouseup', function() {
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

      this.options.button.on('click', function(e) {
        var buttonSelector, selectionParent;
        var $target = jQuery(e.target);

        e.preventDefault();

        if (_this.options.editing || $target.is('.icon-remove, .clear')) {
          return false;
        }

        jQuery(document.body).on('click', onBodyClick);

        _this.options.editing = true;
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
      var selection, selectionParentNode, urlInput, submitButton, linkInSelection, links;
      urlInput = this.options.urlInput;
      submitButton = this.options.submitButton;
      urlInput.prop('disabled', false);
      this.lastSelection = this.options.editable.getSelection();
      selectionParentNode = this.lastSelection.startContainer.parentNode;
      if (_.isUndefined(selectionParentNode.href)) {
        selection = jQuery('<div>').html(this.lastSelection.toHtml());
        links = jQuery('a', selection)
        if (links.length === 1) {
          this.options.linkInSelection = links.first();
        } else if (links.length > 1) {
          urlInput.val('(multiple links selected)').prop('disabled', true);
        } else {
          urlInput.val(this.options.defaultUrl);
          submitButton.val(butTitle);
        }
      } else if (!_.isUndefined(selectionParentNode.href)) {
        this.options.linkInSelection = selectionParentNode;
      }

      if (this.options.linkInSelection !== null) {
        urlInput.val(jQuery(this.options.linkInSelection).attr('href'));
        this._setUrlErrorState();
        submitButton.val(butUpdateTitle);
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
      if (blist.util.patterns.customUrl.test(url)) {
        this.options.linkInput.removeClass('urlError');
      } else {
        this.options.linkInput.addClass('urlError');
      }
    },

    _saveUrl: function() {
      var link, selectionStart,
        _this = this;

      if (this.options.dirty !== true) {
        return false;
      }

      link = this.options.urlInput.val();
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
        if (this.options.linkInSelection === null) {
          this.options.execCommandOverride('createLink', null, link);
        } else {
          this.options.linkInSelection.href = link;
        }
      }

      this.options.linkInSelection = null;
      this.options.dirty = false;
      this.options.editable.element.trigger('change');
      this.options.editable.removeAllSelections();
      this.options.editable.element.trigger('hallounselected');
    },

    populateToolbar: function(toolbar) {
      var buttonize, buttonset, widget,
        _this = this;

      widget = this;
      this.options.toolbar = jQuery(toolbar);
      linkInputId = '' + this.options.uuid + '-linkInput';
      butTitle = this.options.linkInputOpts.buttonTitle;
      butUpdateTitle = this.options.linkInputOpts.buttonUpdateTitle;
      linkInput = jQuery('<span id="hbl' + linkInputId + '"> <form action="#" method="post" class="linkForm"> <input class="url" type="text" name="url" placeholder="Enter website URL" value="' + this.options.defaultUrl + '" /> <span class="warning" title="This is not a valid website URL"><i class="icon-warning-sign"></i></span> <span class="clear"><i class="icon-remove"></i></span> </form></span>');
      this.options.linkInput = linkInput;
      this.options.urlInput = jQuery('input[name=url]', linkInput);
      this.options.clearButton = jQuery('.clear', linkInput);
      this.options.urlForm = jQuery(this.options.urlInput[0].form)
      this.options.submitButton = this.options.urlForm.find('input[type=submit]');

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
          cssClass: _this.options.buttonCssClass,
          buttonElement: 'a'
        });

        buttonset.append(buttonHolder);
        return _this.options.button = buttonHolder;
      };

      buttonize('A');
      jQuery('.ui-button', this.options.button).prepend(linkInput);
      buttonset.hallobuttonset();

      this._bindEvents();

      return toolbar.append(buttonset);
    }
  });
})(jQuery);
