/* HTML editor
 *
 * This plugin makes any element editable using contentEditable.
 */
(function($) {
    function Editor($dom, options) {
        var editable;

        function startEdit()
        {
            if (!rangy.initialized) { rangy.init(); }

            $dom.attr('dropzone', 'all string:text/plain string:text/html');
            $dom.bind('dragenter', function(e) { if (editable) { $dom.attr('contentEditable', true); } });
            $dom.bind('keypress', function(e)
            {
                if (e.which == 8) // Backspace
                {
                    var sel = rangy.getSelection();
                    if (sel.isCollapsed && sel.anchorOffset == 0)
                    {
                        var curNode = sel.anchorNode;
                        var $par = $(curNode).parent();
                        var $parConts = $par.contents();
                        // Iterate up the tree until we're at the level of this node
                        while ($par[0] != $dom[0])
                        {
                            if ($parConts.index(curNode) != 0) { return; }
                            curNode = $par[0];
                            $par = $par.parent();
                            $parConts = $par.contents();
                        }
                        var $prevNode = $parConts.eq($parConts.index(curNode) - 1);
                        if ($prevNode.is('[contentEditable=false]'))
                        { _.defer(function() { $prevNode.trigger('delete'); }); }
                    }
                }
            });
        };

        function stopEdit()
        {
            $dom.attr('dropzone', 'none');
        };

        function processOptions(options) {
            var newEditable = options.edit === undefined || options.edit === true;
            if (newEditable != editable) {
                editable = newEditable;
                $dom.attr('contentEditable', editable);
                if (editable)
                    startEdit();
                else
                    stopEdit();
            }
        };

        $.extend(this, {
            update: processOptions
        });

        processOptions(options);
    }

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
    }
})(jQuery);
