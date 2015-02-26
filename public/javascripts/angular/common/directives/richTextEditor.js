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
            element: $('<button class="bold">b</button>').
              on('click', _.bind(self.toggleBold, self)).
              appendTo(element),
            pathRegex: />B\b/
          };
          break;
        case 'italic':
          controls.italic = {
            element: $('<button class="italic">i</button>').
              on('click', _.bind(self.toggleItalic, self)).
              appendTo(element),
            pathRegex: />I\b/
          };
          break;
        case 'underline':
          controls.underline = {
            element: $('<button class="underline">u</button>').
              on('click', _.bind(self.toggleUnderline, self)).
              appendTo(element),
            pathRegex: />U\b/
          };
          break;
        case 'anchor':
        case 'link':
          controls.anchor = {
            element: $('<button class="anchor">a</button>').
              css({position: 'relative'}).
              on('click', _.bind(self.toggleAnchor, self)).
              appendTo(element),
            form: $('<form><input type=text /></form>').
              on('submit', _.bind(self.createAnchor, self)).
              find('input').on('blur', _.bind(self.hideAnchorInput, self)).
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
    toggleAnchor: function(e) {
      if (this.editor.getSelectedText() && this.editor.hasFormat('a')) {
        this.editor.removeLink();
      } else {
        var anchor = this.controls.anchor;
        if (anchor.form.is(':visible')) {
          var form = anchor.form;
          form[0].reset();
          form.fadeOut(100, _.bind(form.detach, form));
        } else {
          var pos = anchor.element.position();
          anchor.form.css({
            top: '0',
            left: '100%',
            position: 'absolute'
          }).appendTo(anchor.element).fadeIn(100);
          anchor.form.find('input').eq(0).focus();
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
      if (!/^https?:\/\//.test(url)) {
        url = 'http://' + url;
      }
      this.editor.makeLink(url);

      this.hideAnchorInput();
    },
    hideAnchorInput: function(e) {
      var form = this.controls.anchor.form;
      form.fadeOut(100, _.bind(form.detach, form));
    },
    /**
     * Update the visual state of all the controls, to highlight the currently-applied ones.
     */
    updateState: function(path) {
      _.forOwn(this.controls, function(obj) {
        if (obj.pathRegex) {
          obj.element.toggleClass('active', obj.pathRegex.test(path));
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
    AngularRxExtensions
  ) {
    var toolbar;
    /**
     * We need to update the value on both the 'input' event and the 'blur' event, because squire
     * has a bug where if you add an anchor (or change the format of a selection), it won't fire an
     * 'input' event. So - define the event handler once, and we can re-use it for both events.
     */
    function updateValue(element, e) {
      // Set the val() so we can get the value like a normal textarea
      element.val(this.getHTML());

      element.trigger(e);
    }
    // Event handlers, for squire events.
    var events = {
      input: updateValue,
      blur: updateValue,
      willPaste: function(element, e) {
        // Only allow pasting of plaintext
        var text = disemarkup(e.fragment);
        removeChildren(e.fragment);
        e.fragment.appendChild(document.createTextNode(text));
      },
      pathChange: function(element, e) {
        if (toolbar) {
          toolbar.updateState(e.path);
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
        margin: 0,
        padding: 0
      });
    }

    function initIframe(element, iframe) {
      // Give the iframe some html, and include squire
      var idoc = iframe[0].contentDocument;
      idoc.open();
      idoc.write('<!DOCTYPE html><html style="height:100%"><head>' +
                 '<meta charset="UTF-8">' +
                 '<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">' +
                 '</head><body><script src="' +
                 SQUIRE_JS +
                 '"></script></body></html>');
      idoc.close();

      // Let the body's html inherit this rte's css
      $(idoc.body).css($.extend({
        padding: 0,
        margin: 0,
        height: '100%'
      }, element.css(['color', 'background-color', 'font-family', 'font-size'])));
    }

    function init($scope, element, attr) {
      AngularRxExtensions.install($scope);

      var iframe = element.find('iframe');

      // Grab a reference to squire after it loads.
      iframe.on('load', function() {
        $scope.safeApply(_.bind(function() {
          $scope.editor = this.contentWindow.editor;
          initEvents($scope.editor, element);
          element.val(element.attr('value'));
          $scope.editor.setHTML(element.val());
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
      scope: {},
      template: ('<div class="toolbar"></div>' +
                 '<iframe allowtransparency="true" scrolling="auto" src="about:blank"/>'),
      link: init
    }
  });
})();
