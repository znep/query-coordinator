// TinyMCE based editor implementation
//
// Best API docs here: http://wiki.moxiecode.com/index.php/Main_Page
//
// See http://wiki.moxiecode.com/index.php/Editor for editor interface.  We store this in the _editor private
// instance variable.
(function($)
{
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
        rte.onInit.add(function() {
            rte.setContent(rte._initValue);
            rte.focus();
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
                if (this._e)
                {
                    return {
                        bold: e.queryCommandState("Bold"),
                        italic: e.queryCommandState("Italic"),
                        strikethrough: e.queryCommandState("StrikeThrough"),
                        cut: e.queryCommandState("Cut"),
                        copy: e.queryCommandState("Copy"),
                        paste: e.queryCommandState("Paste"),
                        undo: e.queryCommandState("Undo"),
                        redo: e.queryCommandState("Redo")
                        // etc. -- see http://wiki.moxiecode.com/index.php/TinyMCE:Commands
                    };
                }
                return {};
            }
        }
    }));
})(jQuery);
