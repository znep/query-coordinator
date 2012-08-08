/* HTML editor
 *
 * This plugin makes any element editable using contentEditable.
 */
(function($) {
    function Editor($dom, options)
    {
        var editable;

        function startEdit()
        {
            if (!rangy.initialized) { rangy.init(); }

            $dom.on('keypress.editableControl', function(e)
            {
                if (e.which == 8) // Backspace
                {
                    var sel = rangy.getSelection();
                    if (sel.isCollapsed && sel.anchorOffset == 0)
                    {
                        var $contents = $dom.contents();
                        var $prevNode = $contents.eq($contents.index
                            (getChildNode(sel.anchorNode, $dom)) - 1);
                        if ($prevNode.hasClass('nonEditable'))
                        { _.defer(function() { $prevNode.trigger('delete'); }); }
                    }
                    else if (sel.isCollapsed && sel.anchorOffset == 1 &&
                        sel.anchorNode.length == sel.anchorOffset)
                    {
                        // If we delete the last character in the first text
                        // node before a non-editable item, we don't want the
                        // cursor automatically moved to after the non-editable
                        // property (or another backspace would accidentally
                        // delete the item), so we mark the case
                        var $contents = $dom.contents();
                        var cn = getChildNode(sel.anchorNode, $dom);
                        if ($contents.index(cn) == 0 && $contents.eq(1).hasClass('nonEditable'))
                        { $dom.data('forceToBeginning', true); }
                    }
                }
            })
            .on('keyup.editableControl mouseup.editableControl', function(e)
            {
                _.defer(function()
                {
                    readjustCanaries($dom);
                    var sel = rangy.getSelection();
                    if (!sel.isCollapsed)
                    {
                        return; // Some kind of selection; don't worry about canaries(?)
                    }

                    var $par = $(sel.anchorNode).parent();
                    if ($par.hasClass('canary'))
                    {
                        if ($par.hasClass('first') && sel.anchorOffset == 0)
                        { sel.collapse(sel.anchorNode, 1); }
                        else if ($par.hasClass('last') && sel.anchorOffset == 1)
                        { sel.collapse(sel.anchorNode, 0); }
                    }
                });
            })
            .on('keydown.editableControl', function(e)
            {
                var sel = rangy.getSelection();
                if (sel.isCollapsed && $(sel.anchorNode).parent().andSelf().is('.canary.intermediate'))
                {
                    if (e.which == 8 || e.which == 37) // backspace || arrow_left
                    { sel.collapse(sel.anchorNode, 0); }
                    if (e.which == 46 || e.which == 39) // delete || arrow_right
                    { sel.collapse(sel.anchorNode, 1); }
                }
            })
            .on('content-changed.editableControl', function() { readjustCanaries($dom); });

            $dom.addClass('editing');
            _.defer(function()
            {
                if (options.focusOnEdit)
                {
                    $dom.focus();
                    var rs = rangy.getSelection();
                    rs.selectAllChildren($dom[0]);
                    rs.collapseToEnd();
                }
                readjustCanaries($dom);
            });
        };

        function stopEdit()
        {
            $dom.off('.editableControl');
            readjustCanaries($dom);
            $dom.children('.canary').remove();
            $dom.removeClass('editing');
        };

        function processOptions(options)
        {
            var newEditable = options.edit === undefined || options.edit === true;
            $dom.addClass('contentEditable');
            if (newEditable != editable)
            {
                editable = newEditable;
                $dom.attr('contentEditable', editable);
                if (editable)
                { startEdit(); }
                else
                { stopEdit(); }
            }
        };

        $.extend(this, {
            update: processOptions
        });

        processOptions(options);
    }

    var getChildNode = function(curNode, $dom)
    {
        var $par = $(curNode).parent();
        var $parConts = $par.contents();
        // Iterate up the tree until we're at the level of this node
        while ($par[0] != $dom[0])
        {
            if ($parConts.index(curNode) != 0) { return null; }
            curNode = $par[0];
            $par = $par.parent();
            $parConts = $par.contents();
        }
        return curNode;
    };

    var zws = '\u200b';
    var readjustCanaries = function($node)
    {
        var $items = $node.contents();
        // Any to remove/replace with text?
        $items.quickEach(function(i)
        {
            var $t = $(this);
            if ($t.hasClass('canary'))
            {
                var h = $t.html();
                if (h != zws)
                {
                    var sel = rangy.getSelection();
                    var pos;
                    if (sel.isCollapsed && $(sel.anchorNode).parent().index($t) == 0)
                    {
                        pos = sel.anchorOffset;
                        var zi = h.indexOf(zws);
                        if (zi > -1 && zi < pos && pos > 0) { pos--; }
                    }
                    $t.replaceWith(h.replace(zws, ''));
                    if (!$.isBlank(pos))
                    { sel.collapse($node.contents()[i], pos); }
                }
                else if (
                    // If not really first item, or not before a property
                    ($t.hasClass('first') && (i != 0 || !$items.eq(1).hasClass('nonEditable'))) ||
                    // If not really last item, or not after a property
                    ($t.hasClass('last') && (i != ($items.length - 1) ||
                                             !$items.eq(-2).hasClass('nonEditable'))) ||
                    // If intermediate and at beginning or end, or not between two properties
                    ($t.hasClass('intermediate') && (i == 0 || i == ($items.length - 1) ||
                                                     !$items.eq(i - 1).hasClass('nonEditable') ||
                                                     !$items.eq(i + 1).hasClass('nonEditable')))
                    )
                { $t.remove(); }
            }
        });

        $items = $node.contents();
        var sel = rangy.getSelection();
        var savePos = sel.isCollapsed && sel.anchorNode == $node[0];
        var pos = sel.anchorOffset;
        var canary = { tagName: 'span', 'class': ['canary'], contents: '&#x200b;' };
        if ($items.first().hasClass('nonEditable'))
        {
            var firstC = $.extend(true, {}, canary);
            firstC['class'].push('first');
            firstC = $.tag(firstC);
            $node.prepend(firstC);
            if (savePos && pos == 0 || $node.data('forceToBeginning'))
            {
                sel.collapse(firstC[0], 1);
                $node.removeData('forceToBeginning');
            }
        }
        if ($items.last().hasClass('nonEditable'))
        {
            var lastC = $.extend(true, {}, canary);
            lastC['class'].push('last');
            lastC = $.tag(lastC);
            $node.append(lastC);
            if (savePos && pos == $items.length)
            { sel.collapse(lastC[0], 0); }
        }
        var interC = $.extend(true, {}, canary);
        interC['class'].push('intermediate');
        $items.quickEach(function(i)
        {
            var $t = $(this);
            if ($t.hasClass('nonEditable') && $items.eq(i+1).hasClass('nonEditable'))
            {
                var $ic = $.tag(interC);
                $t.after($ic);
                if (savePos && (pos - 1) == i)
                { sel.collapse($ic[0], 0); }
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
    }
})(jQuery);
