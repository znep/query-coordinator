// TinyMCE based editor implementation
//
// Best API docs here: http://wiki.moxiecode.com/index.php/Main_Page
//
// See http://wiki.moxiecode.com/index.php/Editor for editor interface.  We store this in the _editor private
// instance variable.
(function($)
{
    var DEFAULT_FONT_FACE = "Arial";
    var DEFAULT_FONT_SIZE = "12";

    var nextEditorID = 1;

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
                    }
                    else
                    {
                        css.addRule("body", null, rules.length);
                        css.addRule("p", null, rules.length);
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
                            style.fontSize = "1.1em";
                            style.lineHeight = "1.1em";
                            style.padding = 0;
                            style.margin = 0;
                        }
                    }
                }
            }
        } catch (e) {}
    }

    // Create the actual TinyMCE editor object
    var createRTE = function()
    {
        var $root = $('<div class="blist-table-editor blist-td' +
            ' type-richtext"><textarea class="tinymce"></textarea><div class="blist-rte-container"></div></div>');
        var textarea = $root.find('textarea')[0];
        textarea.id = "richtext_" + nextEditorID++;
        var container = $root.find('.blist-rte-container')[0];
        container.id = textarea.id + "_container";
        var rte = new tinymce.Editor(textarea.id, {
            content_element: textarea,
            theme: 'blist_dummy',
            body_class: 'blist-richtext-document',

            // Disable as much random as possible.  These are lightly documented but I discovered some only after
            // stepping through TinyMCE initialization in a debugger.
            add_form_submit_trigger: false,
            add_unload_trigger: false,
            popup_css: false,
            submit_patch: false,

            // These aren't needed or don't work.  See the comment in our dummy theme
            //render_ui: false,
            //editorContainer: container.id,

            // TODO - Distill down to only those sheets we really need.  And tweak accordingly when we have proper
            // bundling of CSS assets in place.
            content_css: '/stylesheets/base.css,/stylesheets/common.css,/stylesheets/table-core.css,/stylesheets/dataset-grid.css',

            // This is a relatively minimal list of default plugins we use.
            // Revisit as necessary.  All built-in plugins are here:
            //   http://wiki.moxiecode.com/index.php/TinyMCE:Plugins/template
            plugins: 'safari,style,inlinepopups,contextmenu,paste,directionality,visualchars,nonbreaking,xhtmlxtras'
        });
        rte.$dom = $root;
        return rte;
    }

    $.blistEditor.richtext = function(options, dom)
    {
        this.settings = $.extend({}, $.blistEditor.richtext.defaults, options);
        this.currentDom = dom;
        this.init();
    }

    var booleanCommand = {
        query: function(doc, name) {
            return { enabled: doc.queryCommandEnabled(name), value: doc.queryCommandState(name) }
        },

        fire: function(editor, name) {
            editor.execCommand(name);
        }
    }

    var buttonCommand = {
        query: function(doc, name) {
            return { enabled: doc.queryCommandEnabled(name) }
        },

        fire: function(editor, name) {
            editor.execCommand(name);
        }
    }

    var valueCommand = {
        query: function(doc, name) {
            return { enabled: doc.queryCommandEnabled(name), value: doc.queryCommandValue(name) }
        },

        fire: function(editor, name, value) {
            editor.execCommand(name, false, value);
        }
    }

    // Command settings; see:
    //   http://wiki.moxiecode.com/index.php/TinyMCE:Commands
    //   http://msdn.microsoft.com/en-us/library/ms533049%28VS.85%29.aspx
    //   https://developer.mozilla.org/en/Midas
    // Doesn't map all commands, just those we need
    var commandMap = {
        bold: { id: 'Bold', type: booleanCommand },
        italic: { id: 'Italic', type: booleanCommand },
        strikethrough: { id: 'StrikeThrough', type: booleanCommand },
        cut: { id: 'Cut', type: buttonCommand },
        copy: { id: 'Copy', type: buttonCommand },
        paste: { id: 'Paste', type: buttonCommand },
        undo: { id: 'Undo', type: buttonCommand },
        redo: { id: 'Redo', type: buttonCommand },
        fontFamily: { id: 'FontName', type: valueCommand },
        fontSize: { id: 'FontSize', type: valueCommand },
        color: { id: 'ForeColor', type: valueCommand },
        backgroundColor: { id: 'BackColor', type: valueCommand },
        link: { id: 'CreateLink', type: buttonCommand },
        unlink: { id: 'Unlink', type: buttonCommand },
        justifyLeft: { id: 'JustifyLeft', type: booleanCommand },
        justifyRight: { id: 'JustifyRight', type: booleanCommand },
        justifyCenter: { id: 'JustifyCenter', type: booleanCommand },
        indent: { id: 'Indent', type: buttonCommand },
        outdent: { id: 'Outdent', type: buttonCommand },
        unorderedList: { id: 'InsertUnorderedList', type: booleanCommand },
        orderedList: { id: 'InsertOrderedList', type: booleanCommand }
    };

    $.extend($.blistEditor.richtext, $.blistEditor.extend(
    {
        prototype:
        {
            $editor: function()
            {
                if (!this._editor)
                {
                    this._editor = createRTE();
                    var me = this;
                    this._editor.onInit.add(function() {
                        initDoc(this.getDoc());
                        this.setContent(this._initValue);
                        if (me.showCallback)
                            me.showCallback();
                        this.focus();
                    });
                    this._editor.onNodeChange.add(function() {
                        me.actionStatesChanged();
                    });
                }
                this._value = this.originalValue;
                this._editor._initValue = (this._value || '');
                return this._editor.$dom;
            },

            _val: function() {
                return this._editor.getContent() || '';
            },

            finishEditExtra: function()
            {
                this._value = this._val();
                this._editor.remove();

                delete this._editor;
            },

            focus: function()
            {
                if (this._editor.getWin())
                {
                    this._editor.focus();
                }
            },

            currentValue: function()
            {
                if (this._editor)
                {
                    return this._val();
                }
                else
                {
                    return this._value;
                }
            },

            editorInserted: function()
            {
                this._editor.render();
            },

            getActionStates: function()
            {
                var e = this._editor;
                var rv = {};
                if (e && e.getDoc())
                {
                    var doc = e.getDoc();
                    for (var id in commandMap) {
                        var command = commandMap[id];
                        rv[id] = command.type.query(doc, command.id);
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
            }
        }
    }));
})(jQuery);
