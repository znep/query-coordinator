// TinyMCE based editor implementation
//
// Best API docs here: http://wiki.moxiecode.com/index.php/Main_Page
//
// See http://wiki.moxiecode.com/index.php/Editor for editor interface.  We store this in the _editor private
// instance variable.
(function($)
{
    // We've got no use for TinyMCE themes.  Also, dynamically loading bits of JS is stupid.
    // 
    // Create a theme now that is a very simple shell.  See editor_template_src.js for the "simple" theme
    // for an example of how TinyMCE intends for this to be handled.
    //
    // Note that a careful reading of tinymce's editor "init" method will make it apparent that it's designed
    // to work without the caller specifying a theme.  An even closer reading will make it apparent that this
    // code hasn't been maintained and relevant flags (such as render_ui: false) will lead to unavoidable
    // crashes.  Thus we're required to wire in this unfortunate hack.
    tinymce.ThemeManager.add('blist_dummy', function()
    {
        return {
            init: function(editor)
            {
                this.editor = editor;
            },

            renderUI: function(o)
            {
                var ct = o.targetNode.nextSibling;
                return {
                    iframeContainer: ct,
                    editorContainer: ct.id,
                    sizeContainer: ct,
                    deltaHeight: 0
                }
            }
        };
    });
    tinymce.ThemeManager.urls.blist_dummy = true;

    // Hack -- to avoid a visual blip when our CSS loads, we install these base styles explicitly before we
    // set the content.  Lots of error handling because this isn't critical and is likely to fail on untested
    // browser configs
    function initDoc(doc)
    {
        try {
            if (doc)
            {
                // Create a stylesheet node in the header
                var rulesNode = $(doc)
                    .find('head')
                    .append('<style type="text/css" id="init-styles"></style>')
                    .children('#init-styles')[0];
                var css;
                for (var i = 0; i < doc.styleSheets.length; i++)
                {
                    css = doc.styleSheets[i];
                    if ((css.ownerNode || css.owningElement) == rulesNode)
                    {
                        break;
                    }
                }

                if (css)
                {
                    // Add the rule
                    var rules = css.cssRules || css.rules;
                    if (css.insertRule)
                    {
                        css.insertRule("body {}", rules.length);
                        css.insertRule("p {}", rules.length);
                        css.insertRule("ul {}", rules.length);
                        css.insertRule("ol {}", rules.length);
                    }
                    else
                    {
                        css.addRule("body", null, rules.length);
                        css.addRule("p", null, rules.length);
                        css.addRule("ul", null, rules.length);
                        css.addRule("ol", null, rules.length);
                    }
                    rules = css.cssRules || css.rules;

                    // Add styles to the rule
                    for (i = 0; i < rules.length; i++)
                    {
                        if (rules[i].selectorText.toLowerCase() == "body")
                        {
                            var style = rules[i].style;
                            style.fontSize = "12px";
                            style.padding = "2px 3px 3px 3px";
                            style.margin = "0";
                            style.fontFamily = "Arial,sans-serif";
                            style.color = "#333333";
                        }
                        else if (rules[i].selectorText.toLowerCase() == "p")
                        {
                            style = rules[i].style;
                            style.fontSize = "1em";
                            style.lineHeight = "1.4em";
                            style.padding = 0;
                            style.margin = "0.3em 0";
                        }
                        else if (rules[i].selectorText.toLowerCase() == "ul")
                        {
                            style = rules[i].style;
                            style.listStylePosition = 'inside';
                            style.listStyleType = 'disc';
                            style.lineHeight = "1.4em";
                            style.padding = 0;
                            style.margin = "0.3em 0";
                        }
                        else if (rules[i].selectorText.toLowerCase() == "ol")
                        {
                            style = rules[i].style;
                            style.listStylePosition = 'inside';
                            style.listStyleType = 'decimal';
                            style.lineHeight = "1.4em";
                            style.padding = 0;
                            style.margin = "0.3em 0";
                        }
                    }
                }
            }
        } catch (e) {}
    }

    var measureText = function(value)
    {
        var ret;
        if (typeof value == 'string')
        {
            var $mDiv = $('<div>' +
                    '<div class="blist-html">' + value + '</div></div>');
            // Don't allow them to execute script!
            $mDiv.find('script').remove();
            $mDiv.css('position', 'absolute');
            $mDiv.css('top', '-10000px');
            $mDiv.css('height', 'auto');
            $('body').append($mDiv);
            // Pad for body padding & extra space
            ret = {width: $mDiv.width() + 10, height: $mDiv.height() + 5};
            $mDiv.remove();
        }
        return ret;
    };

    // Create the actual TinyMCE editor object
    var createRTE = function()
    {
        var $root = $('<div class="blist-table-editor' +
            ' type-html"><textarea class="tinymce"></textarea><div class="blist-rte-container"></div></div>');
        var textarea = $root.find('textarea')[0];
        textarea.id = "html_" + _.uniqueId();
        var container = $root.find('.blist-rte-container')[0];
        container.id = textarea.id + "_container";

        // This is a tweaked version of tinymce's default element configuration.  Form elements and JS attrs removed,
        // and marked more tags as "remove-if-empty".
        // See http://wiki.moxiecode.com/index.php/TinyMCE:Configuration/valid_elements
        VALID_ELEMENTS = "@[id|class|style|title|dir<ltr?rtl|lang|xml::lang],a[rel|rev|charset|hreflang|tabindex|accesskey|type|"
            + "name|href|target|title|class],-strong/b,-em/i,-strike,-u,-s,"
            + "#p[align],-ol[type|compact],-ul[type|compact],-li,br,img[longdesc|usemap|"
            + "src|border|alt=|title|hspace|vspace|width|height|align],-sub,-sup,"
            + "-blockquote,-table[border=0|cellspacing|cellpadding|width|frame|rules|"
            + "height|align|summary|bgcolor|background|bordercolor],-tr[rowspan|width|"
            + "height|align|valign|bgcolor|background|bordercolor],tbody,thead,tfoot,"
            + "#td[colspan|rowspan|width|height|align|valign|bgcolor|background|bordercolor"
            + "|scope],#th[colspan|rowspan|width|height|align|valign|scope],caption,-div,"
            + "-span,-code,-pre,-address,-h1,-h2,-h3,-h4,-h5,-h6,hr[size|noshade],-font[face"
            + "|size|color],-dd,-dl,-dt,cite,abbr,acronym,del[datetime|cite],ins[datetime|cite],"
            + "param[name|value|_value],map[name],area[shape|coords|href|alt|target],bdo,"
            + "col[align|char|charoff|span|valign|width],colgroup[align|char|charoff|span|"
            + "valign|width],dfn,"
            + "kbd,legend,noscript,"
            + "q[cite],samp,-small,"
            + "textarea[cols|rows|disabled|name|readonly],tt,var,-big";

        var rte = new tinymce.Editor(textarea.id, {
            content_element: textarea,
            theme: 'blist_dummy',
            body_class: 'blist-html-document',
            valid_elements: VALID_ELEMENTS,

            // Disable as much random as possible.  These are lightly documented but I discovered some only after
            // stepping through TinyMCE initialization in a debugger.
            add_form_submit_trigger: false,
            add_unload_trigger: false,
            popup_css: false,
            submit_patch: false,

            // TODO - Distill down to only those sheets we really need.  And tweak accordingly when we have proper
            // bundling of CSS assets in place.
            content_css: '/stylesheets/base.css,/styles/merged/html-styles.css',

            // This is a relatively minimal list of default plugins we use.
            // Revisit as necessary.  All built-in plugins are here:
            //   http://wiki.moxiecode.com/index.php/TinyMCE:Plugins/template
            plugins: 'safari,style,inlinepopups,paste,directionality,visualchars,nonbreaking,xhtmlxtras'
        });
        rte.$dom = $root;
        return rte;
    };

    var booleanCommand = {
        query: function(editor, name) {
            return { enabled: editor.getDoc().queryCommandEnabled(name), value: editor.queryCommandState(name) };
        },

        fire: function(editor, name) {
            editor.execCommand(name);
        }
    };

    var buttonCommand = {
        query: function(editor, name) {
            return { enabled: editor.getDoc().queryCommandEnabled(name) };
        },

        fire: function(editor, name) {
            editor.execCommand(name);
        }
    };

    var valueCommand = {
        query: function(editor, name) {
            return { enabled: editor.getDoc().queryCommandEnabled(name), value: editor.queryCommandValue(name) };
        },

        fire: function(editor, name, value) {
            editor.execCommand(name, false, value);
        }
    };

    var colorCommand = {
        query: function(editor, name)
        {
            var v;
            var p = editor.dom.getParent(editor.selection.getNode(), 'span');
            if (p) { v = p.style.color; }
            return { enabled: editor.getDoc().queryCommandEnabled(name),
                value: v || editor.editorCommands.queryCommandValue(name) };
        },

        fire: function(editor, name, value) {
            editor.execCommand(name, false, value);
        }
    };

    var linkCommand = {
        query: function(editor, name)
        {
            return { enabled: editor.getDoc().queryCommandEnabled(name),
                value: $(editor.selection.getNode()).closest('a').attr('href') };
        },

        fire: function(editor, name, value) {
            editor.execCommand(name, false, value);
        }
    };

    var unlinkCommand = {
        query: function(editor, name)
        {
            return {
                enabled: $(editor.selection.getNode()).closest('a').length > 0
            };
        },

        fire: function(editor, name)
        { editor.execCommand(name); }
    };

    // Command settings; see:
    //   http://wiki.moxiecode.com/index.php/TinyMCE:Commands
    //   http://msdn.microsoft.com/en-us/library/ms533049%28VS.85%29.aspx
    //   https://developer.mozilla.org/en/Midas
    // Doesn't map all commands, just those we need
    var commandMap = {
        bold: { id: 'Bold', type: booleanCommand },
        italic: { id: 'Italic', type: booleanCommand },
        underline: { id: 'Underline', type: booleanCommand },
        strikethrough: { id: 'StrikeThrough', type: booleanCommand },
        cut: { id: 'Cut', type: buttonCommand },
        copy: { id: 'Copy', type: buttonCommand },
        paste: { id: 'Paste', type: buttonCommand },
        undo: { id: 'Undo', type: buttonCommand },
        redo: { id: 'Redo', type: buttonCommand },
        fontFamily: { id: 'FontName', type: valueCommand },
        fontSize: { id: 'FontSize', type: valueCommand },
        color: { id: 'ForeColor', type: colorCommand },
        backgroundColor: { id: 'BackColor', type: valueCommand },
        link: { id: 'CreateLink', type: linkCommand },
        unlink: { id: 'UnLink', type: unlinkCommand },
        justifyLeft: { id: 'JustifyLeft', type: booleanCommand },
        justifyRight: { id: 'JustifyRight', type: booleanCommand },
        justifyCenter: { id: 'JustifyCenter', type: booleanCommand },
        indent: { id: 'Indent', type: buttonCommand },
        outdent: { id: 'Outdent', type: buttonCommand },
        unorderedList: { id: 'InsertUnorderedList', type: booleanCommand },
        orderedList: { id: 'InsertOrderedList', type: booleanCommand }
    };

    $.blistEditor.addEditor('html', {
        editorAdded: function()
        {
            this._super.apply(this, arguments);
            this.setFullSize();
            this._editor.render();
        },

        $editor: function()
        {
            if (!this._editor)
            {
                this._editor = createRTE();
                this._editorInitDone = false;
                var me = this;
                this._editor.onInit.add(function() {
                    var t = this;
                    _.defer(function()
                    {
                        initDoc(t.getDoc());
                        t.setContent(t._initValue);
                        me._editorInitDone = true;
                        if (_.isFunction(me.showCallback))
                            me.showCallback();
                        t.focus();
                    });
                });
                this._editor.onNodeChange.add(function()
                { me.actionStatesChanged(); });
                this._editor.onKeyDown.add(function(ed, e)
                {
                    // Esc, F2 or tab
                    if (e.keyCode == 27 || e.keyCode == 113 || e.keyCode == 9)
                    {
                        // Note -- convert original event from native to jQuery;
                        // handling logic in the table requires this
                        me.$dom().trigger('edit_end', [e.keyCode != 27, $.event.fix(e)]);
                        return false;
                    }
                });
            }
            if (this.newValue != null)
            {
                this._value = this.newValue;
                this.goToEndOnFocus = true;
            }
            else
            {
                this.flattenValue();
                this._value = this.originalValue;
            }

            this._editor._initValue = (this._value || '');
            return this._editor.$dom;
        },

        _val: function() {
            return this._editor.getContent() || '';
        },

        finishEdit: function()
        {
            this._super();
            if (this._editorInitDone)
            { this._value = this._val(); }
            this._editor.remove();

            delete this._editor;
        },

        focus: function()
        {
            if (this._editor.getWin())
            {
                this._editor.execCommand("selectall");
                this._editor.focus();
                if (this.goToEndOnFocus)
                {
                    delete this.goToEndOnFocus;
                    this._editor.selection.collapse(false);
                }
            }
        },

        currentValue: function()
        {
            var v;
            if (this._editor)
            {
                v = this._val();
            }
            else
            {
                v = this._value;
            }
            return v === '' ? null : v;
        },

        getActionStates: function()
        {
            var e = this._editor;
            var rv = {};
            if (e && e.getDoc())
            {
                for (var id in commandMap) {
                    var command = commandMap[id];
                    rv[id] = command.type.query(e, command.id);
                }
            }
            return rv;
        },

        action: function(name, value)
        {
            var e = this._editor;
            if (e)
            {
                var command = commandMap[name];
                if (command)
                {
                    return command.type.fire(e, command.id, value);
                }
            }
            return false;
        },

        initComplete: function(showCallback) {
            // Prevent default show-on-init
            this.showCallback = showCallback;
        },

        querySize: function()
        {
            var s = measureText(this._value) || {width: 0, height: 0};
            s.width = Math.max(150, s.width);
            s.height = Math.max(75, s.height);
            return s;
        },

        setSize: function(width, height)
        {
            $(this.getSizeElement()).width(width).height(height);
            this.$editor().find('iframe').width(width).height(height);
        },

        supportsFormatting: function()
        { return true; }
    });

})(jQuery);
