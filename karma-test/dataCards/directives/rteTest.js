(function() {
  'use strict';

  var $rootScope;
  var testHelpers;

  describe('Rich text area', function() {
    var jqueryFx;
    beforeEach(function() {
      module('socrataCommon.directives');
      module('test');

      inject(['$rootScope', 'testHelpers', function(_$rootScope, _testHelpers) {
        $rootScope = _$rootScope;
        testHelpers = _testHelpers;
      }]);

      jqueryFx = $.fx.off;
      $.fx.off = true;
    });

    afterEach(function() {
      $.fx.off = jqueryFx;
      testHelpers.TestDom.clear();
    });

    /**
     * Create a <rte />.
     *
     * @param {String[]} attrs A list of attributes to put on the tag.
     * @param {Function=} onload A callback to attach to the iframe's 'load' event.
     */
    function createElement(buttons, value, onload) {
      var outerScope = $rootScope.$new();
      var html = '<rte buttons="{0}" value="{1}"></rte>'.format(buttons || '', value || '');
      var element = testHelpers.TestDom.compileAndAppend(html, outerScope);
      if (onload) {
        // We need to _.deferred the callback so that the rte's callbacks can run
        element.find('iframe').on('load', _.deferred(_.bind(onload, element)));
      }
      return element;
    }

    /**
     * Puts the keyboard cursor in the first text node in the given element, at the given offset.
     * Also triggers the 'keyup' event on the ownerDocument.
     *
     * @param {DOMElement} el the element to focus.
     * @param {Number} start the index into the text node to place the cursor.
     * @param {Number=} end the index into the text node to end the selection.
     */
    function cursorTo(el, start, end) {
      var textNode = el;
      while (textNode.childNodes.length) {
        textNode = textNode.firstChild;
      }

      var documentNode = el;
      while (9 !== documentNode.nodeType) {
        documentNode = documentNode.parentNode;
      }

      var range = documentNode.createRange();
      range.setStart(textNode, start);
      range.setEnd(textNode, end || start);

      var selection = documentNode.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      testHelpers.fireEvent(el.ownerDocument, 'keyup');
    }

    it('cleans up after itself without error', function(done) {
      createElement(null, null, function() {
        // defer the assertion, so the directive's load handler can run.
        var scope = this.scope().$$childHead;
        expect(_.bind(scope.$destroy, scope)).not.to.throw(Error);
        done();
      });
    });

    describe('toolbar', function() {
      it('displays only the requested buttons', function(done) {
        createElement('bold italic', null, function() {
          expect(_.pluck(this.find('.toolbar').find('button'), 'innerHTML').sort()).
            to.deep.equals(['b', 'i'].sort());

          testHelpers.TestDom.clear();

          createElement('italic bold', null, function() {
            expect(_.pluck(this.find('.toolbar').find('button'), 'innerHTML').sort()).
              to.deep.equals(['i', 'b'].sort());

            testHelpers.TestDom.clear();

            createElement('underline bold italic', null, function() {
              expect(_.pluck(this.find('.toolbar').find('button'), 'innerHTML').sort()).
                to.deep.equals(['u', 'b', 'i'].sort());

              done();
            });
          });
        });
      });

      it('highlights all active controls', function(done) {
        createElement(
          'italic bold underline',
          'normal <b>bold <i>bolditalic <u>bolditalicunderline</u></i></b>',
          function() {
            var body = $(this.find('iframe')[0].contentDocument.body);
            var toolbar = this.find('.toolbar');

            cursorTo(body.find('b>i>u')[0], 1);
            expect(toolbar.find('.bold').hasClass('active')).to.equal(true);
            expect(toolbar.find('.italic').hasClass('active')).to.equal(true);
            expect(toolbar.find('.underline').hasClass('active')).to.equal(true);

            cursorTo(body.find('b>i')[0], 1);
            expect(toolbar.find('.bold').hasClass('active')).to.equal(true);
            expect(toolbar.find('.italic').hasClass('active')).to.equal(true);
            expect(toolbar.find('.underline').hasClass('active')).to.equal(false);

            cursorTo(body.find('b')[0], 1);
            expect(toolbar.find('.bold').hasClass('active')).to.equal(true);
            expect(toolbar.find('.italic').hasClass('active')).to.equal(false);
            expect(toolbar.find('.underline').hasClass('active')).to.equal(false);

            cursorTo(body.find('b')[0], 1);
            cursorTo(body.find('b').parent()[0], 1);
            expect(toolbar.find('.bold').hasClass('active')).to.equal(false);
            expect(toolbar.find('.italic').hasClass('active')).to.equal(false);
            expect(toolbar.find('.underline').hasClass('active')).to.equal(false);

            done();
        });
      });

      describe('buttons function', function() {
        var editorMock;

        afterEach(function() {
          editorMock.verify();
        });

        it('bolds', function(done) {
          createElement('bold', null, function() {
            editorMock = sinon.mock(this.scope().$$childHead.editor);

            editorMock.expects('bold').once();

            this.find('.toolbar button').click();

            done();
          });
        });

        it('unbolds', function(done) {
          createElement('bold', '<b>bold text</b>', function() {
            editorMock = sinon.mock(this.scope().$$childHead.editor);

            editorMock.expects('removeBold').once();

            // Focus the bolded element
            cursorTo($(this.find('iframe')[0].contentDocument.body).find('b')[0], 1);

            this.find('.toolbar button').click();

            done();
          });
        });

        it('underlines', function(done) {
          createElement('underline', null, function() {
            editorMock = sinon.mock(this.scope().$$childHead.editor);

            editorMock.expects('underline').once();

            this.find('.toolbar button').click();

            done();
          });
        });

        it('ununderlines', function(done) {
          createElement('underline', '<u>underline text</u>', function() {
            editorMock = sinon.mock(this.scope().$$childHead.editor);

            editorMock.expects('removeUnderline').once();

            // Focus the underlineed element
            cursorTo($(this.find('iframe')[0].contentDocument.body).find('u')[0], 1);

            this.find('.toolbar button').click();

            done();
          });
        });

        it('italicizes', function(done) {
          createElement('italic', null, function() {
            editorMock = sinon.mock(this.scope().$$childHead.editor);

            editorMock.expects('italic').once();

            this.find('.toolbar button').click();

            done();
          });
        });

        it('unitalicizes', function(done) {
          createElement('italic', '<i>italic text</i>', function() {
            editorMock = sinon.mock(this.scope().$$childHead.editor);

            editorMock.expects('removeItalic').once();

            // Focus the bolded element
            cursorTo($(this.find('iframe')[0].contentDocument.body).find('i')[0], 1);

            this.find('.toolbar button').click();

            done();
          });
        });
      });

      describe('anchor', function() {
        it('displays input field on click, and hides it appropriately', function(done) {
          createElement('anchor', null, function() {
            // input field should start hidden
            expect(this.find('input').length).to.equal(0);

            // clicking the anchor button should show the input field
            this.find('.toolbar button.anchor').click();
            expect(this.find('input').length).to.equal(1);

            // Clicking it again should hide it
            this.find('.toolbar button.anchor').click();
            expect(this.find('input').length).to.equal(0);

            // Show it. Clicking outside of it should hide it.
            this.find('.toolbar button.anchor').click();
            expect(this.find('input').length).to.equal(1);
            testHelpers.fireEvent(this.find('input')[0], 'blur');
            expect(this.find('input').length).to.equal(0);

            done();
          });
        });

        it('creates a link with the link text if nothing highlighted', function(done) {
          createElement('anchor', null, function() {
            // clicking the anchor button should show the input field
            this.find('.toolbar button.anchor').click();
            this.find('input').val('http://m.xkcd.com');
            testHelpers.fireEvent(this.find('form')[0], 'submit');
            // Should hide the input
            expect(this.find('input').length).to.equal(0);
            // TODO: There's a bug in squire where adding an anchor doesn't fire the 'input' event.
            this.find('iframe')[0].contentWindow.editor.fireEvent('input');
            // Should apply the input
            expect(this.val()).to.contain('<a href="http://m.xkcd.com">m.xkcd.com</a>');
            done();
          });
        });

        it('creates a link from the highlighted text with the given url', function(done) {
          createElement('anchor', '<b>text for link</b>', function() {
            // First, highlight the text we want to turn into a link.
            var body = $(this.find('iframe')[0].contentDocument.body);

            cursorTo(body.find('b')[0], 1, 12);
            this.find('.toolbar button.anchor').click();
            this.find('input').val('http://m.xkcd.com');
            testHelpers.fireEvent(this.find('form')[0], 'submit');
            // Should hide the input
            expect(this.find('input').length).to.equal(0);
            // TODO: There's a bug in squire where adding an anchor doesn't fire the 'input' event.
            this.find('iframe')[0].contentWindow.editor.fireEvent('input');
            // Should apply the input
            expect(this.val()).to.contain('<b>t<a href="http://m.xkcd.com">ext for lin</a>k</b>');
            done();
          });
        });

        it('adds an http protocol to a given link, if ommitted', function(done) {
          createElement('anchor', null, function() {
            // clicking the anchor button should show the input field
            this.find('.toolbar button.anchor').click();
            this.find('input').val('m.xkcd.com');
            testHelpers.fireEvent(this.find('form')[0], 'submit');
            // Should hide the input
            expect(this.find('input').length).to.equal(0);
            // TODO: There's a bug in squire where adding an anchor doesn't fire the 'input' event.
            this.find('iframe')[0].contentWindow.editor.fireEvent('input');
            // Should apply the input
            expect(this.val()).to.contain('<a href="http://m.xkcd.com">m.xkcd.com</a>');
            done();
          });
        });
      });
    });

    describe('edit area', function() {
      it('loads the given value into the rich text area', function(done) {
        var testHtml = 'rich <b>bold</b> <i>italic</i> <u>underline <i>italic</i></u> ' +
            '<a href="http://placekitten.com/240/240">kitten!</a>';
        createElement('bold', testHtml.replace(/"/g, '&quot;'), function() {
          expect(this.val()).to.equal(testHtml);
          expect(this.find('iframe')[0].contentDocument.body.innerHTML).to.contain(testHtml);
          done();
        });
      });

      it('inherits relevant css properties', function(done) {
        var styles = {
          color: '#010203',
          'background-color': '#020304',
          'font-size': '52px'
        };
        testHelpers.TestDom.append('<style>rte { ' + _.map(styles, function(v, k) {
          return k + ': ' + v;
        }).join(';') + ';}</style>');

        createElement('bold', null, function() {
          var body = $(this.find('iframe')[0].contentDocument.body);
          _.map(styles, function(value, prop) {
            if (prop.indexOf('color') > -1) {
              expect(testHelpers.normalizeColor(body.css(prop))).
                to.equal(testHelpers.normalizeColor(value));
            } else {
              expect(body.css(prop)).to.equal(value);
            }
          });
          done();
        });
      });

      it('converts pasted values to plaintext', function(done) {
        createElement('bold', null, function() {
          var iframe = this.find('iframe')[0];
          var win = iframe.contentWindow;
          var doc = iframe.contentDocument;
          var editor = win.editor;

          var fragment = doc.createDocumentFragment();
          var div = doc.createElement('div');
          div.innerHTML = '<b>bold</b> <i>italic</i> <script>evil script</script>';
          fragment.appendChild(div);

          editor.fireEvent('willPaste', {
            fragment: fragment
          });

          expect(fragment.childNodes.length).to.equal(1);
          expect(fragment.childNodes[0].nodeValue).to.equal('bold italic evil script');
          done();
        });
      });
    });
  });

})();
