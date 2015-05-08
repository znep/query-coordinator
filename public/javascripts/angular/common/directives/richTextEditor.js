(function() {
  'use strict';

  // The path to the squire.js source, for the iframe to reference
  // NOTE: this lives in plugins/ and not bower because our js blob doesn't actually need squire.js
  // in it, and squire.js has default behavior that initializes itself if it finds itself in an
  // iframe, which makes the whole document contenteditable.
  var SQUIRE_JS = '/javascripts/plugins/squire.js';

  /**
   * A toolbar that controls the iframe, via squire.
   */
  function Toolbar(element, attrs, editor) {
    this.editor = editor;
    this.element = element;
    var controls = this.controls = {};
    var self = this;

    // Add the requested buttons
    _.each(attrs.buttons.split(' '), function(value) {
      switch(value) {
        case 'bold':
          controls.bold = {
            element: $('<div class="rich-text-editor-button bold icon-bold" title="Bold"></button>').
              on('click', _.bind(self.toggleBold, self)).
              appendTo(element),
            pathRegex: />B\b/
          };
          break;
        case 'italic':
          controls.italic = {
            element: $('<div class="rich-text-editor-button italic icon-italic" title="Italic"></button>').
              on('click', _.bind(self.toggleItalic, self)).
              appendTo(element),
            pathRegex: />I\b/
          };
          break;
        case 'underline':
          controls.underline = {
            element: $('<div class="rich-text-editor-button underline icon-underline" title="Underline">u</button>').
              on('click', _.bind(self.toggleUnderline, self)).
              appendTo(element),
            pathRegex: />U\b/
          };
          break;
        case 'anchor':
        case 'link':
          controls.anchor = {
            element: $('<div class="rich-text-editor-button anchor icon-link" title="Link"></button>').
              css({position: 'relative'}).
              on('click', function(e) {
                if ($(e.target).hasClass('rich-text-editor-button')) {
                  self.toggleAnchor();
                }
              }).
              appendTo(element),
            form:
              $('<form class="icon-link-edit" action="javascript:void(0);">' +
                  '<div class="icon-link-edit-hint"></div>' +
                  '<p>Insert link</p>' +
                  '<input type="text" name="url" placeholder="Enter a URL here" />' +
                  '<div class="icon-link-edit-buttons">' +
                    '<button type="button" class="cancel tool-panel-toggle-btn action-btn r-to-l dark">Cancel</button>' +
                    '<button type="submit" class="tool-panel-toggle-btn action-btn r-to-l dark">OK</button>' +
                  '</div>' +
                '</form>').
              on('keyup', function(e) {
                if (e.keyCode === 27) {
                  // Esc key, close link edit
                  self.hideAnchorInput();
                }
              }).
              on('submit', function(e) {
                self.createAnchor(e);
              }).
              find('button.cancel').on('click', function() {
                self.hideAnchorInput();
              }).
              end(),
            pathRegex: />A\b/
          };
          break;
        case '|':
          controls.divider = {
            element: $('<span>|</span>').appendTo(element)
          };
        default:
      }
    });
  }
  // Add instance methods
  $.extend(Toolbar.prototype, {
    toggleBold: function() {
      this.editor[this.editor.hasFormat('b') ? 'removeBold' : 'bold']();
    },
    toggleItalic: function() {
      this.editor[this.editor.hasFormat('i') ? 'removeItalic' : 'italic']();
    },
    toggleUnderline: function() {
      this.editor[this.editor.hasFormat('u') ? 'removeUnderline' : 'underline']();
    },
    /**
     * Display an input field, to prompt for a url for the anchor.
     */
    toggleAnchor: function() {
      var anchor = this.controls.anchor;
      if (anchor.form.is(':visible')) {
        var form = anchor.form;
        this.hideAnchorInput();
      } else {
        var pos = anchor.element.position();
        anchor.form.css({
          top: '2.2em',
          left: '50%',
          position: 'absolute'
        }).appendTo(anchor.element).fadeIn(100);
        anchor.form.find('input').eq(0).focus();

        // If user selects an existing link, show it in edit window
        if (this.editor.getSelectedText() && this.editor.hasFormat('a')) {
          var url = this.editor.getSelection().startContainer.parentElement.href;
          anchor.form.find('input').val(url).focus();
        }
      }
    },
    /**
     * Given the input field is filled out, apply the url to either the selected text, or insert a
     * new anchor for the given url.
     */
    createAnchor: function(e) {
      e.preventDefault();
      var anchor = this.controls.anchor;
      var url = anchor.form.find('input').val();
      anchor.form[0].reset();

      // Clear placeholder text if it exists when inserting a link.
      // This happens when users add a link before adding any text
      if ($(this.editor.getHTML()).hasClass('placeholder')) {
        this.editor.setHTML('');
      }

      if (!/^https?:\/\//.test(url)) {
        url = 'http://' + url;
      }
      var urlOptions = { target: '_blank' };
      this.editor.makeLink(url, urlOptions);

      this.hideAnchorInput();

      this.editor.fireEvent('input');
    },
    hideAnchorInput: function(e) {
      var anchor = this.controls.anchor;
      if (anchor) {
        var form = anchor.form;
        form.fadeOut(100, function() {
          _.bind(form.detach, form)
          form[0].reset();
        });
      }
    },
    /**
     * Update the visual state of all the controls, to highlight the currently-applied ones.
     */
    updateState: function(path, curToolbar) {
      _.forOwn(this.controls, function(obj) {
        if (obj.pathRegex) {
          obj.element.toggleClass('active', obj.pathRegex.test(path));
          if (!obj.pathRegex.test(path) || !obj.element.hasClass('anchor')) {
            // If not clicking on an anchor, close any open anchor edit windows
            curToolbar.hideAnchorInput();
          }
        }
      });
    }
  });

  /**
   * Converts the given Node structure to a string containing only the text contained in the Node.
   *
   * @param {Node} node the Node containing the text you'd like to extract.
   * @return {String} all the text contained within the given Node.
   */
  function disemarkup(node) {
    if (node.childNodes.length) {
      return _.map(node.childNodes, disemarkup).join('');
    } else {
      return node.nodeValue;
    }
  }

  /**
   * Empty the given node of children.
   * Note this is a destructive operation.
   *
   * @param {Node} node The node whose children we should remove.
   */
  function removeChildren(node) {
    while(node.childNodes.length) {
      node.removeChild(node.firstChild);
    }
  }

  /**
   * A <rich-text-editor /> is meant to replace a <textarea />, and provide limited html formatting.
   */
  angular.module('socrataCommon.directives').directive('richTextEditor', function(
    AngularRxExtensions,
    $http
  ) {
    var toolbar;
    /**
     * We need to update the value on both the 'input' event and the 'blur' event, because squire
     * has a bug where if you add an anchor (or change the format of a selection), it won't fire an
     * 'input' event. So - define the event handler once, and we can re-use it for both events.
     */
    function updateValue(element, e) {
      // Set the val() so we can get the value like a normal textarea
      // Make sure currentHTML isn't set to the placeholder - if it is, blank it
      var updatedHTML = ($(this.getHTML()).text() !== element.attr('placeholder')) ?
        this.getHTML() : '';
      element.val(updatedHTML);

      element.trigger(e);

      element.isolateScope().safeApply(function() {
        element.isolateScope().content = element.val();
      });
    }
    // Event handlers, for squire events.
    var events = {
      input: updateValue,
      focus: function(element) {
        if ($(this.getHTML()).text() == element.attr('placeholder')) {
          this.setHTML('');
        }
        // allows css to detect focus based on class, because child iframe's :focus doesn't
        element.addClass('focus');
      },
      blur: function(element, e) {
        updateValue.apply(this, [element, e]);
        showPlaceholderIfEmpty(element, this);
        element.removeClass('focus');
      },
      willPaste: function(element, e) {
        // Only allow pasting of plaintext
        var text = disemarkup(e.fragment);
        removeChildren(e.fragment);
        e.fragment.appendChild(document.createTextNode(text));
      },
      pathChange: function(element, e) {
        if (toolbar) {
          toolbar.updateState(e.path, toolbar);
        }
      }
    };

    /**
     * Bind the event handlers.
     */
    function initEvents(editor, element) {
      for (var event in events) {
        editor.addEventListener(event, _.bind(events[event], editor, element));
      }
    }

    /**
     * Clean up bound events.
     */
    function cleanupEvents(editor) {
      for (var event in events) {
        editor.removeEventListener(event, events[event]);
      }
    }

    function initCss(element) {
      element.css({
        position: 'relative'
      }).find('iframe').css({
        width: '100%',
        height: '100%',
        overflow: 'auto',
        boxSizing: 'border-box',
        border: 0,
        margin: 0
      });
    }

    // Show placeholder text if editor html is empty (and placeholder attribute exists)
    function showPlaceholderIfEmpty(element, editor) {
      if ($(editor.getHTML()).text() == '' && element.attr('placeholder') !== typeof undefined) {
        editor.setHTML(
          '<div class="placeholder" style="color:{1}">{0}</div>'.
            format(element.attr('placeholder'), 'rgba(0,0,0,0.4)')
        );
      }
    }

    function initIframe(element, iframe) {
      // Give the iframe some html, and include squire
      var idoc = iframe[0].contentDocument;
      idoc.open();
      idoc.write('<!DOCTYPE html><html style="height:100%"><head>' +
                 '<meta charset="UTF-8">' +
                 '<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">' +
                 '</head><body>' +
                 '<script id="squire-js"></script>' +
                 '</body></html>');
      idoc.close();

      // Let the body's html inherit this rte's css
      $(idoc.body).css($.extend({
        'box-sizing': 'border-box',
        margin: 0,
        height: '100%'
      }, element.css(['padding', 'color', 'background-color', 'font-family', 'font-size'])));

      // Now load squire.js
      $http.get(SQUIRE_JS).success(function(data) {
        idoc.getElementById('squire-js').innerHTML = data;
        iframe.trigger('squire-loaded');
      });
    }

    function init($scope, element, attr) {
      AngularRxExtensions.install($scope);

      var iframe = element.find('iframe');

      // Grab a reference to squire after it loads.
      iframe.on('squire-loaded', function() {
        $scope.safeApply(_.bind(function() {
          $scope.editor = this.contentWindow.editor;
          initEvents($scope.editor, element);
          element.val($scope.content);
          $scope.editor.setHTML(element.val());
          showPlaceholderIfEmpty(element, $scope.editor);
          toolbar = new Toolbar(element.find('.toolbar'), attr, $scope.editor);
        }, this));
      });

      initIframe(element, iframe);

      initCss(element);

      Rx.Observable.combineLatest(
        $scope.observeDestroy(element),
        // Mostly for unit tests - Guard against a race condition where the iframe doesn't load
        // before we're done with the test.
        $scope.observe('editor').filter(_.isPresent),
        _.identity
      ).subscribe(function() {
        cleanupEvents($scope.editor);
      });
    }

    return {
      restrict: 'E',
      scope: {
        content: '='
      },
      template: ('<div class="toolbar"></div>' +
                 '<iframe allowtransparency="true" scrolling="auto" src="about:blank"/>'),
      link: init
    }
  });
})();
