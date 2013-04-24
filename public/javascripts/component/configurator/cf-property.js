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

            var m;
            if (!_.isEmpty(m = str.match(/(.*)\s+\|\|\s*(.*)$/)))
            {
                str = m[1];
                this.fallback = m[2];
            }

            if (!_.isEmpty(m = str.match(/(.*)\s+\/(\S*)\/(.*)\/([gim]*)$/)))
            {
                str = m[1];
                this.regex = {
                    pattern: m[2],
                    replacement: m[3],
                    modifiers: m[4]
                };
            }

            if (!_.isEmpty(m = str.match(/(.*)\s+([%@])\[([^\]]*)\]$/)))
            {
                str = m[1];
                var t;
                switch (m[2])
                {
                    case '%':
                        t = 'number';
                        break;
                    case '@':
                        t = 'date';
                        break;
                }
                this.typeFormat = {
                    type: t,
                    format: m[3]
                };
            }

            if (!_.isEmpty(m = str.match(/(.*)\s+=\[([^\]]*)\]$/)))
            {
                str = m[1];
                this.mathExpr = m[2];
            }

            this.property = str;
        },

        hasFallback: function()
        { return this.hasOwnProperty('fallback'); },

        toString: function()
        {
            var str = this.property;
            if (!$.isBlank(this.mathExpr))
            { str += ' =[' + this.mathExpr + ']'; }
            if (!_.isEmpty(this.typeFormat))
            {
                str += ' ' + (this.typeFormat.type == 'date' ? '@' : '%') +
                    '[' + this.typeFormat.format + ']';
            }
            if (!_.isEmpty(this.regex))
            { str += ' /' + this.regex.pattern + '/' + this.regex.replacement + '/' + this.regex.modifiers; }
            if (this.hasFallback())
            { str += ' ||' + this.fallback; }
            return '{' + str + '}';
        },

        toHtml: function()
        {
            return $.tag({ tagName: 'div', 'class': ['cf-property', 'nonEditable', 'socrata-cf-mouse'],
                'data-propId': this.id,
                contents: [ { tagName: 'span', 'class': 'itemText',
                        contents: $.htmlEscape(this.property.replace(/.*\./, '')) },
                    { tagName: 'a', href: '#Remove', 'class': ['remove', 'hide'], title: 'Remove property' }
                ] }, true);
        },

        remove: function()
        {
            $('body').off('.prop_' + this.id);
            this._$node.socrataTip().destroy();
            this._$node.remove();
        },

        domHookup: function($node)
        {
            var prop = this;
            prop._$node = $node;
            prop._$node.data('cfProperty', prop);
            infoTipHookup(prop);

            var $remButton = prop._$node.children('.remove');
            prop._$node.hover(function() { $remButton.removeClass('hide'); },
                    function() { $remButton.addClass('hide'); });
            if ($.browser.msie)
            {
                $remButton.hover(function() { prop._$node.attr('contentEditable', false); },
                        function() { prop._$node.attr('contentEditable', true); })
            }
            $remButton.click(function(e)
            {
                e.preventDefault();
                prop.remove();
            });

            var $contEdit = prop._$node.parent().closest('[contentEditable=true]');
            prop._$node.nativeDraggable({ dropType: 'move', dropId: prop.id, clickExclude: '.remove',
                dragStartPrepare: function()
                {
                    $remButton.addClass('hide');
                    prop._$node.socrataTip().hide();
                }
            });

            $('body').on('mousedown.prop_' + prop.id, function() { finishEdit(prop); });

            prop._$node.on('delete', function() { prop.remove(); });

            prop._$node.nativeDropTarget({
                contentEditable: false,
                acceptCheck: function($item) { return $item.hasClass('cf-property'); },
                findReplacement: function(mId)
                {
                    if (mId == prop.id) { return null; }
                    return $contEdit.find('[data-propid=' + mId + ']');
                },
                copyReplace: function(newProp)
                {
                    $contEdit.nativeDropTarget().addNewDropped(newProp, prop._$node);
                    return true;
                },
                replacedCallback: function() { prop.remove(); }
            });

            prop._$node.click(function()
            {
                prop._$node.socrataTip().destroy();
                setTimeout(function() { makeEditable(prop); }, 100);
            });
        },

        extract: function()
        {
            finishEdit(this, true);
            $('body').off('.prop_' + this.id);
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
            { tagName: 'p', contents: [{ tagName: 'strong', contents: 'Property: ' },
                { tagName: 'span', contents: $.htmlEscape(prop.property) }] },
            { onlyIf: !_.isEmpty(regex), value:
                { tagName: 'p', contents: [
                    { tagName: 'strong', contents: 'Regex: ' },
                    { tagName: 'span', contents: '/' + $.htmlEscape(regex.pattern) + '/' +
                        $.htmlEscape(regex.replacement) + '/' + $.htmlEscape(regex.modifiers)
                    }] }
            },
            { onlyIf: prop.hasFallback(), value:
                { tagName: 'p', contents: [
                    { tagName: 'strong', contents: 'Fallback Value: ' },
                    { tagName: 'span', contents: '"' + $.htmlEscape(prop.fallback) + '"' }] }
            }
        ] })});
    };

    var makeEditable = function(prop)
    {
        var regex = prop.regex || {};
        prop._$node.socrataTip({width: '42em', trigger: 'now',
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
                        { tagName: 'label', 'for': 'propEdit_fallback', contents: 'Fallback Value' },
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
                prop._$editBox.closest('.bt-wrapper').addClass('socrata-cf-mouse');
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
            prop._$node.children('.itemText').text(prop.property.replace(/.*\./, ''));
        }
        prop._$node.socrataTip().destroy();
        delete prop._$editBox;
        infoTipHookup(prop);
    };

    $.cf.enhanceProperties = function($node, multiLineMode)
    {
        $node.editable({ edit: true, focusOnEdit: true, singleLineMode: !multiLineMode });

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
        $node.find('.cf-property').quickEach(function()
        {
            var $t = $(this);
            var prop = propObjs[$t.attr('data-propId')];
            prop.domHookup($t);
        });

        if ($node.isControlClass('nativeDropTarget'))
        { $node.nativeDropTarget().enable(); }
        else
        {
            $node.nativeDropTarget({
                acceptCheck: function($item) { return $item.hasClass('cf-property'); },
                newItemDrop: function(dropId)
                {
                    var prop = new $.cf.Property({property: dropId, fallback: ''});
                    var $newProp = $(prop.toHtml());
                    _.defer(function() { prop.domHookup($newProp); });
                    return $newProp;
                }
            });
        }
    };

    $.cf.extractProperties = function($node)
    {
        $node.editable({ edit: false });

        $node.find('.cf-property, .cf-property-edit').quickEach(function()
        {
            var t = this;
            if (t.hasClass('cf-property-edit')) { t = t.children('.cf-property'); }
            var cfProp = t.data('cfProperty');
            if (!$.isBlank(cfProp)) { cfProp.extract(); }
        });
        $node.nativeDropTarget().disable();
    };

})(jQuery);
