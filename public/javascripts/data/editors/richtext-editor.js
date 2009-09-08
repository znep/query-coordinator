(function($)
{
    var nextTinyMceID = 1;

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
                if (!this._$editor)
                {
                    this._$editor = $('<div class="blist-table-editor blist-td' +
                        ' type-richtext"><textarea class="tinymce"></textarea></div>');
                    var dom = this._$editor.find('textarea')[0];
                    if (!dom.id)
                        dom.id = "richtext_" + nextTinyMceID++;
                    this._rte = new tinymce.Editor(dom.id, {
                        content_element: dom,
                        theme: 'simple',
                        add_form_submit_trigger: false,
                        add_unload_trigger: false,
                        submit_patch: false,
                        render_ui: true,

                        // This is a relatively minimal list of default plugins we use.
                        // Revisit as necessary.  All built-in plugins are here:
                        //   http://wiki.moxiecode.com/index.php/TinyMCE:Plugins/template
                        plugins: 'safari,style,inlinepopups,contextmenu,paste,directionality,visualchars,nonbreaking,xhtmlxtras'
                    });
                    this._rte.render();
                }
                return this._$editor;
            }
        }
    }));
})(jQuery);
