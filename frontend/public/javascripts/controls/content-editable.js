/* HTML editor
 *
 * This plugin makes any element editable using contentEditable.
 */
(function($) {
  function Editor($dom, options) {
    var editable;


    function startEdit() {
      if (!rangy.initialized) {
        rangy.init();
      }

      $dom.on('keypress.editableControl', function(e) {
          if (e.which == 8) { // Backspace
            var sel = rangy.getSelection();
            if (sel.isCollapsed && sel.anchorOffset == 0) {
              var $contents = $dom.contents();
              var $prevNode = $contents.eq($contents.index(getChildNode(sel.anchorNode, $dom)) - 1);
              if ($prevNode.hasClass('nonEditable')) {
                _.defer(function() {
                  $prevNode.trigger('delete');
                });
              }
            }
          }
        }).
        on('keyup.editableControl mouseup.editableControl', function() {
          _.defer(function() {
            readjustCanaries($dom);
            var sel = rangy.getSelection();
            if (!sel.isCollapsed) {
              return; // Some kind of selection; don't worry about canaries(?)
            }

            var $par = $(sel.anchorNode).parent();
            if ($par.hasClass('canary')) {
              if ($par.hasClass('after') && sel.anchorOffset == 0) {
                sel.collapse(sel.anchorNode, 1);
              } else if ($par.hasClass('before') && sel.anchorOffset == 1) {
                sel.collapse(sel.anchorNode, 0);
              }
            }
          });
        }).
        on('keydown.editableControl', function(e) {
          // No Enter in single-line mode
          if (options.singleLineMode && e.which == 13) {
            e.preventDefault();
          }

          var sel = rangy.getSelection();
          if (!sel.isCollapsed) {
            return;
          }

          var $anchorNode = $(sel.anchorNode);
          var $items = $anchorNode.parent().contents();
          var idx = $items.index($anchorNode);
          var $curNodes = $anchorNode.parent().andSelf();
          var node;
          // backspace || arrow_left
          if (e.which == 8 || e.which == 37) {
            if ($curNodes.is('.canary.after')) {
              node = sel.anchorNode;
            } else if (sel.anchorOffset == 0 && $items.eq(idx - 1).is('.canary.after')) {
              node = $items.eq(idx - 1)[0];
            }
            if (!$.isBlank(node)) {
              sel.collapse(node, 0);
            }
          }

          // delete || arrow_right
          if (e.which == 46 || e.which == 39) {
            if ($curNodes.is('.canary.before')) {
              node = sel.anchorNode;
            } else if (sel.anchorOffset == $anchorNode.text().length &&
              $items.eq(idx + 1).is('.canary.before')) {
              node = $items.eq(idx + 1)[0];
            }
            if (!$.isBlank(node)) {
              sel.collapse(node, 1);
            }
          }
        }).
        on('content-changed.editableControl', function() {
          readjustCanaries($dom);
        });

      $dom.addClass('editing');
      _.defer(function() {
        if (options.focusOnEdit) {
          $dom.focus();
          var rs = rangy.getSelection();
          rs.selectAllChildren($dom[0]);
          rs.collapseToEnd();
        }
        readjustCanaries($dom);
      });
    }

    function stopEdit() {
      $dom.off('.editableControl');
      readjustCanaries($dom);
      $dom.children('.canary').remove();
      $dom.removeClass('editing');
    }

    function processOptions(_options) {
      var newEditable = _options.edit === undefined || _options.edit === true;
      $dom.addClass('contentEditable');
      if (newEditable != editable) {
        editable = newEditable;
        $dom.attr('contentEditable', editable);
        if (editable) {
          startEdit();
        } else {
          stopEdit();
        }
      }
    }

    $.extend(this, {
      update: processOptions
    });

    processOptions(options);
  }

  var getChildNode = function(curNode, $dom) {
    var $par = $(curNode).parent();
    var $parConts = $par.contents();
    // Iterate up the tree until we're at the level of this node
    while ($par[0] != $dom[0]) {
      if ($parConts.index(curNode) != 0) {
        return null;
      }
      curNode = $par[0];
      $par = $par.parent();
      $parConts = $par.contents();
    }
    return curNode;
  };

  var zws = '\u200b';
  var readjustCanaries = function($node) {
    var $items = $node.contents();
    // Any to remove/replace with text?
    $items.quickEach(function(i) {
      var $t = $(this);
      if ($t.hasClass('canary')) {
        var h = $t.html();
        if (h != zws) {
          var sel = rangy.getSelection();
          var pos;
          if (sel.isCollapsed && $(sel.anchorNode).parent().index($t) == 0) {
            pos = sel.anchorOffset;
            var zi = h.indexOf(zws);
            if (zi > -1 && zi < pos && pos > 0) {
              pos--;
            }
          }
          $t.replaceWith(h.replace(zws, ''));
          if (!$.isBlank(pos)) {
            sel.collapse($node.contents()[i], pos);
          }
        } else if (($t.hasClass('before') && !$items.eq(i + 1).hasClass('nonEditable')) ||
          ($t.hasClass('after') && !$items.eq(i - 1).hasClass('nonEditable'))) {
          $t.remove();
        }
      }
    });

    rangy.getSelection();
    var c = {
      tagName: 'span',
      'class': ['canary'],
      contents: '&#x200b;'
    };
    var beforeC = $.extend(true, {}, c);
    beforeC['class'].push('before');
    var afterC = $.extend(true, {}, c);
    afterC['class'].push('after');
    $node.children('.nonEditable').quickEach(function() {
      var $t = $(this);
      if ($t.prev('.canary.before').length < 1) {
        $t.before($.tag(beforeC));
      }
      if ($t.next('.canary.after').length < 1) {
        $t.after($.tag(afterC));
      }
    });
    $node[0].normalize();
  };

  $.fn.editable = function(options) {
    if (!options)
      return this.data('socrataEditable');
    _.each(this, function(dom) {
      var $dom = $(dom);
      var editor = $dom.data('socrataEditable');
      if (editor)
        editor.update(options);
      else {
        editor = new Editor($dom, options);
        $dom.data('socrataEditable', editor);
      }
    });
  };
})(jQuery);
