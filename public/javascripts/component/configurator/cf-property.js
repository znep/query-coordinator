;(function($) {

    $.cf.Property = Model.extend({
        _init: function(str)
        {
            this._super.apply(this, arguments);
            this.id = 'cfProp' + _.uniqueId();
            if (!$.isBlank(str) && _.isString(str))
            { this.parse(str); }
            else if ($.isPlainObject(str))
            { $.extend(this, str); }
        },

        parse: function(str)
        {
            if (str.startsWith('{') && str.endsWith('}'))
            { str = str.slice(1, str.length - 1); }

            var m = str.match(/(.*)\s+\|\|\s*(.*)$/);
            if (!_.isEmpty(m))
            {
                str = m[1];
                this.fallback = m[2];
            }
            m = str.match(/(.*)\s+\/(\S*)\/(.*)\/([gim]*)$/);
            if (!_.isEmpty(m))
            {
                str = m[1];
                this.regex = {
                    pattern: m[2],
                    replacement: m[3],
                    modifiers: m[4]
                };
            }
            this.property = str;
        },

        hasFallback: function()
        { return this.hasOwnProperty('fallback'); },

        toString: function()
        {
            var str = this.property;
            if (!_.isEmpty(this.regex))
            { str += ' /' + this.regex.pattern + '/' + this.regex.replacement + '/' + this.regex.modifiers; }
            if (this.hasFallback())
            { str += ' ||' + this.fallback; }
            return '{' + str + '}';
        },

        toHtml: function()
        {
            return $.tag({ tagName: 'span', 'class': 'cf-property', 'data-propId': this.id,
                // The stupid, it burns!
                contentEditable: ($.browser.msie == true).toString(), draggable: true,
                contents: $.htmlEscape(this.property.replace(/.*\./, '')) }, true);
        },

        domHookup: function($node)
        {
            var prop = this;
            prop._$node = $node;
            prop._$node.data('cfProperty', prop);
            infoTipHookup(prop);

            var $contEdit = prop._$node.parent().closest('[contentEditable=true]');
            if (!$.browser.msie)
            {
                prop._$node.bind('mousedown', function() { $contEdit.attr('contentEditable', false); })
                    .bind('mouseup', function() { $contEdit.attr('contentEditable', true); });
            }
            prop._$node.bind('dragstart', function(e)
            {
                if ($.browser.msie) { prop._$node.data('mouseDownForEdit', false); }
                prop._$node.socrataTip().hide();
                prop._$node.addClass('dragcopy');
                if (!$.browser.msie)
                {
                    // IE doesn't support anything but "Text" or "URL"; but it
                    // doesn't matter in this case, because it literally copies
                    // the element and ignores this
                    e.originalEvent.dataTransfer.setData('text/html',
                        '<span data-droppedId="' + prop.id + '"></span>');
                }
                // Chrome requires copy, or won't do anything on drop
                e.originalEvent.dataTransfer.effectAllowed = 'copy';
                // Fixes a bug in Chrome where the drag helper image had a bad offset;
                // this also makes it a bit more obvious where the insertion cursor is during drag
                if (!$.browser.msie)
                { e.originalEvent.dataTransfer.setDragImage(prop._$node[0], 0, 0); }
                else
                { blist.util.startIEDrag(prop._$node); }
            })
            .bind('dragend', function(e)
            {
                if ($.browser.msie) { blist.util.finishIEDrag(); }
                _.defer(function()
                {
                    prop._$node.removeClass('dragcopy');
                    if ($.browser.msie)
                    {
                        var $newNode = $contEdit.find('.dragcopy[data-propid=' + prop.id + ']');
                        if ($newNode.length == 1)
                        { $newNode.replaceWith(prop._$node); }
                    }
                    else
                    { $contEdit.find('[data-droppedid=' + prop.id + ']').replaceWith(prop._$node); }
                    readjustCanaries($contEdit);
                });
            });

            $('body').bind('mousedown.prop_' + prop.id, function()
            {
                finishEdit(prop);
            });

            prop._$node.bind('delete', function() { prop._$node.remove(); });

            var doEdit = function()
            {
                prop._$node.socrataTip().destroy();
                setTimeout(function() { makeEditable(prop); }, 100);
            };

            if ($.browser.msie)
            {
                // Don't allow other properties to be dropped in a property
                prop._$node.bind('dragover drop', function(e)
                {
                    e.preventDefault();
                    return false;
                });

                // IE wasn't triggering plain clicks on the properties most of the time
                // (maybe something to do with contentEditable), so hack around it
                prop._$node.mousedown(function() { prop._$node.data('mouseDownForEdit', true); })
                .mousemove(function()
                {
                    if (prop._$node.data('mouseDownForEdit'))
                    { prop._$node.data('mouseDownForEdit', false); }
                })
                .mouseup(function()
                {
                    if (prop._$node.data('mouseDownForEdit'))
                    {
                        prop._$node.data('mouseDownForEdit', false);
                        doEdit();
                    }
                });
            }
            else
            { prop._$node.click(doEdit); }
        },

        extract: function()
        {
            finishEdit(this, true);
            $('body').unbind('.prop_' + this.id);
            this._$node.socrataTip().destroy();
            this._$node.replaceWith(this.toString());
        }
    });

    var infoTipHookup = function(prop)
    {
        if ($.isBlank(prop._$node)) { return; }

        var regex = prop.regex || {};
        prop._$node.socrataTip({shrinkToFit: true,
            content: $.tag({ tagName: 'div', 'class': 'cf-property-tip',
            contents: [
            { tagName: 'p', contents: [{ tagName: 'b', contents: 'Property: ' },
                { tagName: 'span', contents: $.htmlEscape(prop.property) }] },
            { onlyIf: !_.isEmpty(regex), value:
                { tagName: 'p', contents: [
                    { tagName: 'b', contents: 'Regex: ' },
                    { tagName: 'span', contents: '/' + $.htmlEscape(regex.pattern) + '/' +
                        $.htmlEscape(regex.replacement) + '/' + $.htmlEscape(regex.modifiers)
                    }] }
            },
            { onlyIf: prop.hasFallback(), value:
                { tagName: 'p', contents: [
                    { tagName: 'b', contents: 'Fallback: ' },
                    { tagName: 'span', contents: '"' + $.htmlEscape(prop.fallback) + '"' }] }
            }
        ] })});
    };

    var makeEditable = function(prop)
    {
        var regex = prop.regex || {};
        prop._$node.socrataTip({width: '40em', trigger: 'now',
            content: $.tag({ tagName: 'form', 'class': 'cf-property-edit-tip',
                contents: [
                    { tagName: 'div', 'class': ['line', 'property'], contents: [
                        { tagName: 'label', 'for': 'propEdit_property', contents: 'Property' },
                        { tagName: 'input', type: 'text', id: 'propEdit_property', name: 'property',
                            'class': 'first', value: $.htmlEscape(prop.property) }
                    ] },
                    { tagName: 'div', 'class': ['line', 'regex'], contents: [
                        { tagName: 'label', 'for': 'propEdit_regex', contents: 'Regex' },
                        '/',
                        { tagName: 'input', type: 'text', id: 'propEdit_regex',
                            name: 'regex.pattern', value: $.htmlEscape(regex.pattern) },
                        '/',
                        { tagName: 'input', type: 'text', name: 'regex.replacement',
                            value: $.htmlEscape(regex.replacement) },
                        '/',
                        { tagName: 'input', type: 'checkbox', id: 'propEdit_regex_modifier_g',
                            name: 'regex.modifiers.g',
                            checked: (regex.modifiers || '').indexOf('g') > -1 },
                        { tagName: 'label', 'class': 'regexModifier',
                            'for': 'propEdit_regex_modifier_g', contents: 'g' },
                        { tagName: 'input', type: 'checkbox', id: 'propEdit_regex_modifier_i',
                            name: 'regex.modifiers.i',
                            checked: (regex.modifiers || '').indexOf('i') > -1 },
                        { tagName: 'label', 'class': 'regexModifier',
                            'for': 'propEdit_regex_modifier_i', contents: 'i' },
                        { tagName: 'input', type: 'checkbox', id: 'propEdit_regex_modifier_m',
                            name: 'regex.modifiers.m',
                            checked: (regex.modifiers || '').indexOf('m') > -1 },
                        { tagName: 'label', 'class': 'regexModifier',
                            'for': 'propEdit_regex_modifier_m', contents: 'm' }
                    ] },
                    { tagName: 'div', 'class': ['line', 'fallback'], contents: [
                        { tagName: 'label', 'for': 'propEdit_fallback', contents: 'Fallback' },
                        { tagName: 'input', type: 'checkbox', name: 'useFallback',
                            checked: prop.hasFallback() },
                        { tagName: 'input', type: 'text', id: 'propEdit_fallback', name: 'fallback',
                            'class': 'last', disabled: !prop.hasFallback(),
                            value: $.htmlEscape(prop.fallback) }
                    ] }
                ] }),
            shownCallback: function(box)
            {
                prop._$editBox = $(box);
                prop._$editBox.mousedown(function(e) { e.stopPropagation(); });
                prop._$editBox.find('.fallback input[type=checkbox]').change(function()
                {
                    var $c = $(this);
                    $c.siblings('input[type=text]').attr('disabled', !$c.value());
                });
                prop._$editBox.find('input:first').focus();
                prop._$editBox.find('input').keydown(function(e)
                {
                    // Esc
                    if (e.which == 27)
                    {
                        finishEdit(prop, true);
                        return;
                    }
                    var $i = $(this);
                    var isFirst = $i.hasClass('first');
                    var isLast = $i.hasClass('last');
                    // Tab
                    if (e.which == 9 && ((isFirst && !e.shiftKey) ||
                            (isLast && e.shiftKey) || (!isFirst && !isLast)))
                    { e.stopPropagation(); }
                });
            }});
    };

    var finishEdit = function(prop, isCancel)
    {
        if ($.isBlank(prop._$editBox)) { return; }
        if (!isCancel)
        {
            prop._$editBox.find('input').quickEach(function()
            {
                if (this.is(':disabled')) { return; }
                var name = this.attr('name');
                var v = this.value() || '';
                if (name == 'useFallback' && !v)
                { delete prop.fallback; }
                else if (name.startsWith('regex.'))
                {
                    prop.regex = prop.regex || {};
                    var rp = name.split('.');
                    if (rp[1] == 'modifiers')
                    {
                        prop.regex.modifiers = prop.regex.modifiers || '';
                        var curI = prop.regex.modifiers.indexOf(rp[2]);
                        if (curI > -1 && !v)
                        { prop.regex.modifiers = prop.regex.modifiers.replace(rp[2], ''); }
                        else if (curI < 0 && v)
                        { prop.regex.modifiers += rp[2]; }
                    }
                    else
                    { prop.regex[rp[1]] = v; }
                }
                else
                { prop[name] = v; }
            });
            if ($.isBlank(prop.regex.pattern)) { delete prop.regex; }
            prop._$node.text(prop.property.replace(/.*\./, ''));
        }
        prop._$node.socrataTip().destroy();
        delete prop._$editBox;
        infoTipHookup(prop);
    };

    $.cf.Property.newPropertyTagIE = { begin: '[::newProperty|', end: '::]' };

    if ($.browser.msie)
    {
        // We don't want users to be able to tab into a property (since contentEditable is true),
        // so we detect non-mouse selections, and just move the cursor to the end of the actual
        // contentEditable node
        $(document).bind('selectionchange', function()
        {
            var sel = document.selection;
            var $item;
            if (sel.type == 'Control' && ($item = $(sel.createRange().item(0))).hasClass('cf-property') &&
                !$item.data('mouseDownForEdit'))
            {
                var $ce = $item.parent().closest('[contentEditable=true]');
                var rs = rangy.getSelection();
                rs.selectAllChildren($ce[0]);
                rs.collapseToEnd();
            }
        });
    }

    $.cf.enhanceProperties = function($node)
    {
        var html = $node.html();
        var props = html.match(/({[^{}]+})/mg);
        var propObjs = {};
        _.each(props, function(p)
        {
            var prop = new $.cf.Property(p);
            propObjs[prop.id] = prop;
            html = html.replace(p, prop.toHtml());
        });
        $node.html(html);
        $node.children('.cf-property').quickEach(function()
        {
            var $t = $(this);
            var prop = propObjs[$t.attr('data-propId')];
            prop.domHookup($t);
        });
        $node.bind('drop.cfProperty', function(e)
        {
            _.defer(function()
            {
                if ($.browser.msie)
                {
                    readjustCanaries($node);
                    findNewProperties($node);
                }
                else
                {
                    $node.find('[data-droppednewproperty]').quickEach(function()
                    { addNewProperty($node, this.attr('data-droppednewproperty'), this) });
                }
            });
        });

        readjustCanaries($node);

        $node.bind('keyup.cfProperty mouseup.cfProperty', function(e)
        {
            _.defer(function()
            {
                readjustCanaries($node);
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
        });

        $node.on('keydown.cfProperty', function(e)
        {
            var sel = rangy.getSelection();
            if (sel.isCollapsed && $(sel.anchorNode).parent().andSelf().is('.canary.intermediate'))
            {
                if (e.which == 8 || e.which == 37) // backspace || arrow_left
                { sel.collapse(sel.anchorNode, 0); }
                if (e.which == 46 || e.which == 39) // delete || arrow_right
                { sel.collapse(sel.anchorNode, 1); }
            }
        });
    };

    // Special IE hack to find the text that was dropped in and replace it with a real property
    var findNewProperties = function($curNode)
    {
        var npTag = $.cf.Property.newPropertyTagIE;
        if ($curNode.text().indexOf(npTag.begin) > -1)
        {
            $curNode.contents().quickEach(function()
            {
                var t = this[0];
                var tbi, tei;
                if (t.nodeType == 3 &&
                    (tbi = t.nodeValue.indexOf(npTag.begin)) > -1 &&
                    (tei = t.nodeValue.indexOf(npTag.end)) > tbi + npTag.begin.length)
                {
                    var newProp = t.splitText(tbi);
                    newProp.splitText(tei - tbi + npTag.end.length);
                    addNewProperty($curNode, newProp.nodeValue.slice(npTag.begin.length,
                        newProp.nodeValue.length - npTag.end.length), $(newProp));
                }
                else if (t.nodeType == 1)
                { findNewProperties(this); }
            });
        }
    };

    // Common things to do to hook up a newly-added property
    var addNewProperty = function($node, prop, $replaceNode)
    {
        var prop = new $.cf.Property({property: prop, fallback: ''});
        var $newProp = $(prop.toHtml());
        $replaceNode.replaceWith($newProp);
        prop.domHookup($newProp);
        readjustCanaries($node);
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
                    ($t.hasClass('first') && (i != 0 || !$items.eq(1).hasClass('cf-property'))) ||
                    // If not really last item, or not after a property
                    ($t.hasClass('last') && (i != ($items.length - 1) ||
                                             !$items.eq(-2).hasClass('cf-property'))) ||
                    // If intermediate and at beginning or end, or not between two properties
                    ($t.hasClass('intermediate') && (i == 0 || i == ($items.length - 1) ||
                                                     !$items.eq(i - 1).hasClass('cf-property') ||
                                                     !$items.eq(i + 1).hasClass('cf-property')))
                    )
                { $t.remove(); }
            }
        });

        $items = $node.contents();
        var sel = rangy.getSelection();
        var savePos = sel.isCollapsed && sel.anchorNode == $node[0];
        var pos = sel.anchorOffset;
        var canary = { tagName: 'span', 'class': ['canary'], contents: '&#x200b;' };
        if ($items.first().hasClass('cf-property'))
        {
            var firstC = $.extend(true, {}, canary);
            firstC['class'].push('first');
            firstC = $.tag(firstC);
            $node.prepend(firstC);
            if (savePos && pos == 0)
            { sel.collapse(firstC[0], 1); }
        }
        if ($items.last().hasClass('cf-property'))
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
            if ($t.hasClass('cf-property') && $items.eq(i+1).hasClass('cf-property'))
            {
                var $ic = $.tag(interC);
                $t.after($ic);
                if (savePos && (pos - 1) == i)
                { sel.collapse($ic[0], 0); }
            }
        });
    };

    $.cf.extractProperties = function($node)
    {
        readjustCanaries($node);
        $node.children('.canary').remove();
        $node.children('.cf-property, .cf-property-edit').quickEach(function()
        {
            var t = this;
            if (t.hasClass('cf-property-edit')) { t = t.children('.cf-property'); }
            var cfProp = t.data('cfProperty');
            if (!$.isBlank(cfProp)) { cfProp.extract(); }
        });
        $node.off('.cfProperty');
    };

})(jQuery);
