(function() {
  'use strict';

  var $rootScope;
  var testHelpers;
  var $httpBackend;

  // Pre-load the squire.js, so the iframe can just grab it from the cache.
  var squireObservable = Rx.Observable.fromPromise($.get('/javascripts/plugins/squire.js'));
  var squireSubscription;

  describe('Rich text editor', function() {
    afterEach(function() {
      testHelpers.cleanUp();
      if (squireSubscription) {
        squireSubscription.dispose();
        squireSubscription = null;
      }
      if ($httpBackend) {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
      }
    });

    var jqueryFx;
    beforeEach(function() {
      module('dataCards');
      module('socrataCommon.directives');
      module('test');

      inject([
        '$rootScope',
        'testHelpers',
        '$httpBackend',
        function(_$rootScope, _testHelpers, _$httpBackend) {
          $rootScope = _$rootScope;
          testHelpers = _testHelpers;
          $httpBackend = _$httpBackend;
        }
      ]);

      jqueryFx = $.fx.off;
      $.fx.off = true;
    });

    afterEach(function() {
      $.fx.off = jqueryFx;
      testHelpers.TestDom.clear();
    });

    /**
     * Create a <rich-text-editor />.
     *
     * @param {String[]} attrs A list of attributes to put on the tag.
     * @param {Function=} onload A callback to attach to the iframe's 'load' event.
     */
    function createElement(buttons, content, placeholder, onload) {
      // Can only actually run the tests after we load squire
      squireSubscription = squireObservable.subscribe(function(data) {
        $httpBackend.when('GET', /.*\/squire\.js$/).
          respond(data);
        var outerScope = $rootScope.$new();
        outerScope.writablePage = {
          'description': content || ''
        };
        var html = '<rich-text-editor buttons="{0}" content="writablePage.description" placeholder="{1}"></rich-text-editor>'.
          format(buttons || '', placeholder || '');
        var element = testHelpers.TestDom.compileAndAppend(html, outerScope);
        $httpBackend.flush();
        if (onload) {
          _.defer(_.bind(onload, element, element.children().scope()));
        }
      });
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
      createElement(null, null, null, function($scope) {
        // defer the assertion, so the directive's load handler can run.
        expect(_.bind($scope.$destroy, $scope)).not.to.throw(Error);
        done();
      });
    });

    describe('toolbar', function() {
      describe('requested buttons', function() {
        it('only displays b i', function(done) {
          createElement('bold italic', null, null, function() {
            expect(_.pluck(this.find('.toolbar').find('.rich-text-editor-button'), 'title').sort()).
              to.deep.equals(['Bold', 'Italic'].sort());
            done();
          });
        });

        it('only displays i', function(done) {
          createElement('italic', null, null, function() {
            expect(_.pluck(this.find('.toolbar').find('.rich-text-editor-button'), 'title').sort()).
              to.deep.equals(['Italic'].sort());
            done();
          });
        });

        it('only displays u b i', function(done) {
          createElement('underline bold italic', null, null, function() {
            expect(_.pluck(this.find('.toolbar').find('.rich-text-editor-button'), 'title').sort()).
              to.deep.equals(['Bold', 'Italic', 'Underline'].sort());
            done();
          });
        });
      });

      it('highlights all active controls', function(done) {
        createElement(
          'italic bold underline',
          'normal <b>bold <i>bolditalic <u>bolditalicunderline</u></i></b>',
          null,
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
          createElement('bold', null, null, function($scope) {
            editorMock = sinon.mock($scope.editor);

            editorMock.expects('bold').once();

            this.find('.toolbar .rich-text-editor-button').click();

            done();
          });
        });

        it('unbolds', function(done) {
          createElement('bold', '<b>bold text</b>', null, function($scope) {
            editorMock = sinon.mock($scope.editor);

            editorMock.expects('removeBold').once();

            // Focus the bolded element
            cursorTo($(this.find('iframe')[0].contentDocument.body).find('b')[0], 1);

            this.find('.toolbar .rich-text-editor-button').click();

            done();
          });
        });

        it('underlines', function(done) {
          createElement('underline', null, null, function($scope) {
            editorMock = sinon.mock($scope.editor);

            editorMock.expects('underline').once();

            this.find('.toolbar .rich-text-editor-button').click();

            done();
          });
        });

        it('ununderlines', function(done) {
          createElement('underline', '<u>underline text</u>', null, function($scope) {
            editorMock = sinon.mock($scope.editor);

            editorMock.expects('removeUnderline').once();

            // Focus the underlineed element
            cursorTo($(this.find('iframe')[0].contentDocument.body).find('u')[0], 1);

            this.find('.toolbar .rich-text-editor-button').click();

            done();
          });
        });

        it('italicizes', function(done) {
          createElement('italic', null, null, function($scope) {
            editorMock = sinon.mock($scope.editor);

            editorMock.expects('italic').once();

            this.find('.toolbar .rich-text-editor-button').click();

            done();
          });
        });

        it('unitalicizes', function(done) {
          createElement('italic', '<i>italic text</i>', null, function($scope) {
            editorMock = sinon.mock($scope.editor);

            editorMock.expects('removeItalic').once();

            // Focus the bolded element
            cursorTo($(this.find('iframe')[0].contentDocument.body).find('i')[0], 1);

            this.find('.toolbar .rich-text-editor-button').click();

            done();
          });
        });
      });

      describe('anchor', function() {
        it('displays input field on click, and hides it appropriately', function(done) {
          createElement('anchor', null, null, function() {
            // input field should start hidden
            expect(this.find('input:visible').length).to.equal(0);

            // clicking the anchor button should show the input field
            this.find('.toolbar .rich-text-editor-button.anchor').click();
            expect(this.find('input:visible').length).to.equal(1);

            // Clicking it again should hide it
            this.find('.toolbar .rich-text-editor-button.anchor').click();
            expect(this.find('input:visible').length).to.equal(0);

            done();
          });
        });

        it('creates a link with the link text if nothing highlighted', function(done) {
          createElement('anchor', null, null, function() {
            // clicking the anchor button should show the input field
            this.find('.toolbar .rich-text-editor-button.anchor').click();
            this.find('input').val('http://m.xkcd.com');
            testHelpers.fireEvent(this.find('form')[0], 'submit');
            // Should hide the input
            expect(this.find('input:visible').length).to.equal(0);
            // TODO: There's a bug in squire where adding an anchor doesn't fire the 'input' event.
            this.find('iframe')[0].contentWindow.editor.fireEvent('input');
            // Should apply the input
            expect(this.val()).to.contain('<a href="http://m.xkcd.com">m.xkcd.com</a>');
            done();
          });
        });

        it('creates a link from the highlighted text with the given url', function(done) {
          createElement('anchor', '<b>text for link</b>', null, function() {
            // First, highlight the text we want to turn into a link.
            var body = $(this.find('iframe')[0].contentDocument.body);

            cursorTo(body.find('b')[0], 1, 12);
            this.find('.toolbar .rich-text-editor-button.anchor').click();
            this.find('input').val('http://m.xkcd.com');
            testHelpers.fireEvent(this.find('form')[0], 'submit');
            // Should hide the input
            expect(this.find('input:visible').length).to.equal(0);
            // TODO: There's a bug in squire where adding an anchor doesn't fire the 'input' event.
            this.find('iframe')[0].contentWindow.editor.fireEvent('input');
            // Should apply the input
            expect(this.val()).to.contain('<b>t<a href="http://m.xkcd.com">ext for lin</a>k</b>');
            done();
          });
        });

        it('adds an http protocol to a given link, if ommitted', function(done) {
          createElement('anchor', null, null, function() {
            // clicking the anchor button should show the input field
            this.find('.toolbar .rich-text-editor-button.anchor').click();
            this.find('input').val('m.xkcd.com');
            testHelpers.fireEvent(this.find('form')[0], 'submit');
            // Should hide the input
            expect(this.find('input:visible').length).to.equal(0);
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
      it('shows the placeholder message when there is no input', function(done) {
        createElement('bold', '', 'The ending scene in Rambo makes me cry, every damn time.', function() {
          expect(this.val()).to.equal('');
          expect(this.find('iframe')[0].contentDocument.body.innerHTML).to.contain('The ending scene in Rambo makes me cry, every damn time.');
          done();
        });
      });

      it('loads the given value into the rich text editor', function(done) {
        var testHtml = 'rich <b>bold</b> <i>italic</i> <u>underline <i>italic</i></u> ' +
            '<a href="http://placekitten.com/240/240">kitten!</a>';
        createElement('bold', testHtml, null, function() {
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
        testHelpers.TestDom.append('<style>rich-text-editor { ' + _.map(styles, function(v, k) {
          return k + ': ' + v;
        }).join(';') + ';}</style>');

        createElement('bold', null, null, function() {
          var body = $(this.find('iframe')[0].contentDocument.body);
          _.map(styles, function(value, prop) {
            if (prop.indexOf('color') > -1) {
              expect(testHelpers.normalizeColor(body.css(prop))).
                to.equal(testHelpers.normalizeColor(value));
            } else if (prop.indexOf('font-size') > -1) {
              expect(Math.round(parseFloat(body.css(prop), 10))).to.equal(parseInt(value, 10));
            } else {
              expect(body.css(prop)).to.equal(value);
            }
          });
          done();
        });
      });

      it('converts pasted values to plaintext', function(done) {
        createElement('bold', null, null, function() {
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
