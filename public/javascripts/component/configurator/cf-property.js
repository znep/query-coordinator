;(function($) {

    $.cf.Property = Model.extend({
        _init: function(str)
        {
            this._super.apply(this, arguments);
            this.id = 'cfProp' + _.uniqueId();
            if (!$.isBlank(str)) { this.parse(str); }
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
            return $.tag({tagName: 'span', 'class': 'cf-property', contentEditable: 'false', draggable: true,
                'data-propId': this.id, contents: $.htmlEscape(this.property.replace(/.*\./, ''))}, true);
        },

        domHookup: function($node)
        {
            var prop = this;
            prop._$node = $node;
            prop._$node.data('cfProperty', prop);
            infoTipHookup(prop);

            var $contEdit = prop._$node.closest('[contentEditable=true]');
            prop._$node.bind('mousedown', function() { $contEdit.attr('contentEditable', false); })
                .bind('mouseup', function() { $contEdit.attr('contentEditable', true); });
            prop._$node.bind('dragstart', function(e)
            {
                prop._$node.socrataTip().hide();
                e.originalEvent.dataTransfer.setData('text/html',
                    '<span data-droppedId="' + prop.id + '"></span>');
                // Chrome requires copy, or won't do anything on drop
                e.originalEvent.dataTransfer.effectAllowed = 'copy';
                // Fixes a bug in Chrome where the drag helper image had a bad offset;
                // this also makes it a bit more obvious where the insertion cursor is during drag
                e.originalEvent.dataTransfer.setDragImage(prop._$node[0], 0, 0);
            })
            .bind('dragend', function(e)
            {
                _.defer(function()
                { $contEdit.find('[data-droppedid=' + prop.id + ']').replaceWith(prop._$node); });
            });

            $('body').bind('mousedown.prop_' + prop.id, function()
            {
                finishEdit(prop);
            });

            prop._$node.bind('delete', function() { prop._$node.remove(); });

            prop._$node.click(function()
            {
                prop._$node.socrataTip().destroy();
                setTimeout(function() { makeEditable(prop); }, 100);
            });
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
    };

//            this.hover(function() { $t.selectText(); });
//jQuery.fn.selectText = function(){
//    var doc = document;
//    var element = this[0];
//    console.log(this, element);
//    if (doc.body.createTextRange) {
//        var range = document.body.createTextRange();
//        range.moveToElementText(element);
//        range.select();
//    } else if (window.getSelection) {
//        var selection = window.getSelection();
//        var range = document.createRange();
//        range.selectNodeContents(element);
//        selection.removeAllRanges();
//        selection.addRange(range);
//    }
//};

    $.cf.extractProperties = function($node)
    {
        $node.children('.cf-property, .cf-property-edit').quickEach(function()
        {
            var t = this;
            if (t.hasClass('cf-property-edit')) { t = t.children('.cf-property'); }
            var cfProp = t.data('cfProperty');
            if (!$.isBlank(cfProp)) { cfProp.extract(); }
        });
    };

})(jQuery);
