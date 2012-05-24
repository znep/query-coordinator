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

        toString: function()
        {
            var str = this.property;
            if (!_.isEmpty(this.regex))
            { str += ' /' + this.regex.pattern + '/' + this.regex.replacement + '/' + this.regex.modifiers; }
            if (this.hasOwnProperty('fallback'))
            { str += ' ||' + this.fallback; }
            return '{' + str + '}';
        },

        toHtml: function()
        {
            return $.tag({tagName: 'span', 'class': 'cf-property', contentEditable: false, draggable: true,
                'data-propId': this.id, contents: $.htmlEscape(this.property.replace(/.*\./, ''))}, true);
        }
    });

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
            var prop = propObjs[this.attr('data-propId')];
            this.data('cfProperty', prop);
            var regex = prop.regex || {};
            this.socrataTip({shrinkToFit: true, content: $.tag({ tagName: 'div', 'class': 'cf-property-tip',
                contents: [
                { tagName: 'p', contents: [{ tagName: 'b', contents: 'Property: ' },
                    { tagName: 'span', contents: $.htmlEscape(prop.property) }] },
                { onlyIf: prop.hasOwnProperty('fallback'), value:
                    { tagName: 'p', contents: [
                        { tagName: 'b', contents: 'Fallback: ' },
                        { tagName: 'span', contents: '"' + $.htmlEscape(prop.fallback) + '"' }] }
                },
                { onlyIf: !_.isEmpty(regex), value:
                    { tagName: 'p', contents: [
                        { tagName: 'b', contents: 'Regex: ' },
                        { tagName: 'span', contents: '/' + $.htmlEscape(regex.pattern) + '/' +
                            $.htmlEscape(regex.replacement) + '/' + $.htmlEscape(regex.modifiers)
                        }] }
                }
            ] }, true)});

            var $t = $(this);
            var $contEdit = this.closest('[contentEditable=true]');
            this.hover(function() { $contEdit.attr('contentEditable', false); },
                    function() { $contEdit.attr('contentEditable', true); });
            this.bind('dragstart', function(e)
            {
                e.originalEvent.dataTransfer.setData('text/html',
                    '<span data-droppedId="' + prop.id + '"></span>');
                // Chrome requires copy, or won't do anything on drop
                e.originalEvent.dataTransfer.effectAllowed = 'copy';
                // Fixes a bug in Chrome where the drag helper image had a bad offset;
                // this also makes it a bit more obvious where the insertion cursor is during drag
                e.originalEvent.dataTransfer.setDragImage($t[0], 0, 0);
            })
            .bind('dragend', function(e)
            {
                _.defer(function()
                { $contEdit.find('[data-droppedid=' + prop.id + ']').replaceWith($t); });
            });
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
        $node.children('.cf-property').quickEach(function()
        {
            this.replaceWith(this.data('cfProperty').toString());
        });
    };

})(jQuery);
