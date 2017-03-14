(function() {

  if (!rangy.initialized) {
    rangy.init();
  }

  // Browsers have various quirks when they're dropping text/html. IE doesn't
  // support it, and Chrome doesn't drop where you'd expect (but it does
  // mangle the element that you'd expect to drop into in wild and wonderful
  // ways, just to taunt you). So, this function controls what browsers get
  // the text/html, which gains us a much more robust system in a cooperative
  // browser.
  blist.util.enableHtmlDataForDragDrop = function() {
    return !($.browser.msie) && !($.browser.webkit);
  };

  $.Control.extend('nativeDraggable', {
    _init: function() {
      this._super.apply(this, arguments);

      this._dropId = this.settings.dropId || ('drop_' + _.uniqueId());

      var $ceParent = $(this.settings.contentEditableParent ||
        this.$dom().parent().closest('[contentEditable=true]'));
      if ($ceParent.length > 0) {
        this._inContentEditable = true;
        this._$ceParent = $ceParent;
      }

      if (!this.settings.startDisabled) {
        this.enable();
      }
    },

    enable: function() {
      var dObj = this;
      var $t = dObj.$dom();

      $t.attr('draggable', true);
      $t.addClass('nativeDraggable');

      if (dObj._inContentEditable) {
        dObj._origCE = $t.attr('contentEditable');
        // Making the assumption that a draggable item in a contentEditable
        // section cannot itself be contentEditable, because that doesn't
        // work very well
        // The stupid, it burns!
        $t.attr('contentEditable', ($.browser.msie === true).toString());
      }

      if (dObj._inContentEditable && !$.browser.msie) {
        $t.on('mousedown.nativeDraggable', function() {
          dObj._$ceParent.attr('contentEditable', false);
        }).
        on('mouseup.nativeDraggable', function() {
          dObj._$ceParent.attr('contentEditable', true);
        });
      }

      if ($.browser.msie) {
        $t.on('selectstart.nativeDraggable', function(e) {
          e.preventDefault();
          this.dragDrop();
        });
      }

      $t.on('dragstart.nativeDraggable', function(e) {
        dObj.dragStart(e);
      }).
      on('dragend.nativeDraggable', function(e) {
        dObj.dragEnd(e);
      });

      if ($.browser.msie && dObj._inContentEditable) {
        // Don't allow other properties to be dropped in a property
        $t.on('dragover.nativeDraggable drop.nativeDraggable', function(e) {
          e.preventDefault();
          return false;
        });

        // IE wasn't triggering plain clicks on the properties most of the time
        // (maybe something to do with contentEditable), so hack around it
        $t.on('mousedown.nativeDraggable', function(e) {
          if ($.isBlank(dObj.settings.clickExclude) ||
            !$(e.target).is(dObj.settings.clickExclude)) {
            $t.data('mouseDownForClick', true);
          }
        }).
        on('mousemove.nativeDraggable', function() {
          if ($t.data('mouseDownForClick')) {
            $t.data('mouseDownForClick', false);
          }
        }).
        on('mouseup.nativeDraggable', function() {
          if ($t.data('mouseDownForClick')) {
            $t.data('mouseDownForClick', false);
            $t.click();
          }
        });
      }
    },

    disable: function() {
      this.$dom().attr('draggable', false);
      this.$dom().removeClass('nativeDragging');
      if (this._inContentEditable) {
        this.$dom().attr('contentEditable', this._origCE);
      }
      this.$dom().off('.nativeDraggable');
    },

    dragStart: function(e) {
      var dObj = this;

      if (_.isFunction(dObj.settings.dragStartPrepare)) {
        dObj.settings.dragStartPrepare();
      }

      if ($.browser.msie) {
        dObj.$dom().data('mouseDownForClick', false);
      }

      if (dObj._inContentEditable && $.browser.msie) {
        dObj._$ceParent.attr('contentEditable', false);
      }

      var htmlData;
      var textData;
      switch (dObj.settings.dropType) {
        case 'copy':
          htmlData = '<span data-droppedcopy="' + dObj._dropId + '"></span>';
          textData = $.nativeDraggable.copyDropTag.begin + dObj._dropId +
            $.nativeDraggable.copyDropTag.end;
          break;
        case 'move':
          htmlData = '<span data-droppedmove="' + dObj._dropId + '"></span>';
          textData = 'move:' + dObj._dropId;
          break;
        case 'custom':
          htmlData = dObj.settings.htmlData;
          textData = dObj.settings.textData;
          break;
        default:
          break;
      }

      if (blist.util.enableHtmlDataForDragDrop()) {
        e.originalEvent.dataTransfer.setData('text/html', htmlData);
      }
      // Some browsers (chrome/ie) have issues with text/html.
      // so we don't get to have a real span dropped in; instead, we get raw
      // text that is keyed such that it will be replaced by cf.Property
      // This is also used by all browsers for replacing a property
      e.originalEvent.dataTransfer.setData('Text', textData);

      // Chrome requires copy, or won't do anything on drop
      e.originalEvent.dataTransfer.effectAllowed = 'copy';
      // Fixes a bug in Chrome where the drag helper image had a bad offset;
      // this also makes it a bit more obvious where the
      // insertion cursor is during drag
      if (!$.browser.msie) {
        e.originalEvent.dataTransfer.setDragImage(dObj.$dom()[0], 0, 0);
      } else {
        startIEDrag(dObj.$dom());
      }

      $.nativeDraggable.trigger('drag_start', [dObj.$dom()]);
    },

    dragEnd: function() {
      var dObj = this;
      if ($.browser.msie) {
        finishIEDrag();
      }

      var sel = rangy.getSelection();
      _.defer(function() {
        // Handle move within same contentEditable. This assumes the parent
        // node has been normalized, or the rangy selection will break
        // BEWARE: Some browsers (FF is the only example I know of) do not
        // select the dropped text. So if this code needs to be enabled for
        // such browsers, something needs to be done about that.
        // The trim() is there because Chrome likes to add &nbsp; around the
        // dropped text.
        if (!blist.util.enableHtmlDataForDragDrop() && sel.toString().trim() == 'move:' + dObj._dropId) {
          var moveProp = sel.anchorNode.splitText(sel.anchorOffset);
          moveProp.splitText(sel.focusOffset - sel.anchorOffset);
          $(moveProp).replaceWith(dObj.$dom());
        } else if (dObj._inContentEditable) {
          dObj._$ceParent.find('[data-droppedmove=' + dObj._dropId + ']').replaceWith(dObj.$dom());
        }
        if (dObj._inContentEditable) {
          dObj._$ceParent.trigger('content-changed');
        }
      });

      if (_.isFunction(dObj.settings.dragEndCallback)) {
        dObj.settings.dragEndCallback();
      }
    }

  }, {
    clickExclude: null,
    contentEditableParent: null,
    dragStartPrepare: null,
    dragEndCallback: null,
    dropId: null,
    dropType: 'copy',
    htmlData: '',
    startDisabled: false,
    textData: ''
  });

  $.nativeDraggable = new Model();
  $.nativeDraggable.registerEvent(['drag_start']);
  $.nativeDraggable.copyDropTag = {
    begin: '[::copyDrop|',
    end: '::]'
  };

  if ($.browser.msie) {
    // We don't want users to be able to tab into a property (since contentEditable is true),
    // so we detect non-mouse selections, and just move the cursor to the end of the actual
    // contentEditable node
    $(document).on('selectionchange', function() {
      var sel = document.selection;
      var $item;
      if (sel.type == 'Control' && ($item = $(sel.createRange().item(0))).hasClass('nativeDraggable') &&
        !$item.data('mouseDownForClick')) {
        var $ce = $item.parent().closest('[contentEditable=true]');
        var rs = rangy.getSelection();
        rs.selectAllChildren($ce[0]);
        rs.collapseToEnd();
      }
    });
  }

  // IE native drag-drop doesn't support a drag image, so fake it
  var $ieDragImage;
  var startIEDrag = function($node) {
    $ieDragImage = $node.clone();
    $ieDragImage.addClass('ieDrag').css({
      'opacity': '0.8',
      'position': 'absolute',
      'z-index': 20000,
      '-ms-filter': 'progid:DXImageTransform.Microsoft.Alpha(Opacity=80})'
    });
    $('body').append($ieDragImage);
    $('body').on('drag.ieDragImage', function(e) {
      // Slight offset in position so it isn't dragging onto itself
      if (!$.isBlank($ieDragImage)) {
        $ieDragImage.css({
          'left': e.originalEvent.pageX + 1,
          'top': e.originalEvent.pageY + 1
        });
      }
    });
  };

  var finishIEDrag = function() {
    if (!$.isBlank($ieDragImage)) {
      $ieDragImage.remove();
      $ieDragImage = null;
    }
    $('body').off('.ieDragImage');
  };

})(jQuery);
