;(function($)
{
    /* Call this to generate an html tag.
       Takes a second optional argument; set it to true to get
       a string response rather than a jQuery obj.

       Special keys are:
         tagName: name of the tag
         style: takes a key/value hash
         contents: specified, textual, or html content of the tag

       Examples:
         $.tag({ tagName: 'div',
                 class: [ 'item',
                          { this: 'selected', if: $this.isSelected() } ],
                 id: 'item' + _.getUid(),
                 contents: [
                     { tagName: 'span',
                       contents: 'Hello there, ' },
                     person.getFirstName()
                 ]
         });

         $.tag({ tagName: 'input',
                 type: 'text',
                 class: 'required',
                 disabled: form.isDisabled(),
                 value: { this: 'Hello there', if: someCondition() },
                 style: { border: '1px solid red',
                          display: { this: 'none', if: form.hasClass('something') } }
         });
    */
    $.tag = function(attrs, keepAsString)
    {
        var result = '<' + attrs.tagName.toLowerCase();

        _.each(attrs, function(value, key)
        {
            if (key == 'tagName' || key == 'contents')
            { return; }
            else if (value === true)
            { result += tag_append(key, key); }
            else if (value === false)
            { return; }
            else if (key == 'style')
            {
                var newValue = [];
                _.each(value, function(value, key)
                {
                    var parsedElem = tag_parseConditionalElement(value);
                    if (parsedElem !== false)
                    { newValue.push(key + ':' + parsedElem); }
                });

                result += tag_append(key, newValue.join(';'));
            }
            else if (_.isArray(value))
            {
                var newValue = [];
                _.each(value, function(elem)
                {
                    var parsedElem = tag_parseConditionalElement(elem);
                    if (parsedElem !== false)
                    { newValue.push(parsedElem); }
                });

                result += tag_append(key, newValue.join(' '));
            }
            else
            {
                if (_.isString(value))
                { result += tag_append(key, value); }
                else
                {
                    var parsedElem = tag_parseConditionalElement(value);
                    if (parsedElem !== false)
                    { result += tag_append(key, parsedElem); }
                }
            }
        });

        if (attrs.tagName == 'input' || attrs.tagName == 'img')
        {
            result += '/>';
        }
        else if (!_.isUndefined(attrs.contents))
        {
            result += '>';

            var children = attrs.contents;
            if (!_.isArray(children))
            { children = [ children ]; }

            // for each child, $.tag recurse if necessary, then "compact"
            // and join the resultant array. Don't use _.compact since that
            // strips 0.
            result += _.reject(_.map(children, function(child)
            {
                if (!_.isUndefined(child.tagName))
                { child = $.tag(child, true); }

                return child;
            }), function(child) { return $.isBlank(child); }).join(' ');
            result += '</' + attrs.tagName + '>';
        }
        else
        {
            result += '></' + attrs.tagName + '>';
        }

        if (keepAsString === true)
        { return result; }
        else
        { return $(result); }
    };
    var tag_append = function(key, value)
    {
        return ' ' + key + '="' + value + '"';
    };
    var tag_parseConditionalElement = function(elem)
    {
        if (elem === null || _.isUndefined(elem) || elem === '')
        { return false; }
        else if (!_.isUndefined(elem['if']))
        {
            if (elem['if'] === true)
            { return elem['this']; }
            else
            { return false; }
        }
        else
        { return elem; }
    };
})(jQuery);