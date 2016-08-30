(function($) {
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
                        { value: 'selected', onlyIf: $this.isSelected() } ],
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
               value: { value: 'Hello there', onlyIf: someCondition() },
               style: { border: '1px solid red',
                        display: { value: 'none', onlyIf: form.hasClass('something') } }
       });
  */
  $.tag = function(attrs, keepAsString) {
    // First check for any blanks/failed conditionals
    attrs = tagParseConditionalElement(attrs);
    if (attrs === false) {
      return null;
    }

    // deal with toplevel array case
    if (_.isArray(attrs)) {
      var markup = _.map(attrs, function(tag) {
        return $.tag(tag, true);
      }).join('');
      return (keepAsString === true) ? markup : $(markup);
    }

    // deal with toplevel string case
    if (_.isString(attrs)) {
      return attrs;
    }

    // normal case
    var result = '<' + attrs.tagName.toLowerCase();

    _.each(attrs, function(value, key) {
      // _.include is more concise but slower
      var k = key.toLowerCase();
      var newValue;
      if (key == 'tagName' || key == 'contents') {
        return;
      } else if ((value === true) && (k == 'checked' ||
          k == 'selected' || k == 'disabled' || k == 'readonly' ||
          k == 'multiple' || k == 'ismap' || k == 'defer' ||
          k == 'declare' || k == 'noresize' || k == 'nowrap' ||
          k == 'noshade' || k == 'compact')) {
        result += tagAppend(key, key);
      } else if (value === false) {
        return;
      } else if (key == 'style') {
        newValue = [];
        _.each(value, function(v, valueKey) {
          var parsed = tagParseConditionalElement(v);
          if (parsed !== false) {
            newValue.push(valueKey + ':' + parsed);
          }
        });

        result += tagAppend(key, newValue.join(';'));
      } else if (key == 'data') {
        _.each(value, function(v, valueKey) {
          result += tagAppend('data-' + valueKey, v);
        });
      } else if (_.isArray(value)) {
        newValue = [];
        _.each(value, function(elem) {
          var parsed = tagParseConditionalElement(elem);
          if (parsed !== false) {
            newValue.push(parsed);
          }
        });

        result += tagAppend(key, newValue.join(' '));
      } else {
        if (_.isString(value)) {
          result += tagAppend(key, value);
        } else {
          var parsedElem = tagParseConditionalElement(value);
          if (parsedElem !== false) {
            result += tagAppend(key, parsedElem);
          }
        }
      }
    });

    if (attrs.tagName == 'input' || attrs.tagName == 'img' ||
      attrs.tagName == 'link' || attrs.tagName == 'meta') {
      result += '/>';
    } else if (!$.isBlank(attrs.contents)) {
      result += '>';
      result += tagRenderChildren(attrs.contents);
      result += '</' + attrs.tagName + '>';
    } else {
      result += '></' + attrs.tagName + '>';
    }

    if (keepAsString === true) {
      return result;
    } else {
      return $(result);
    }
  };
  var tagAppend = function(key, value) {
    return ' ' + key + '="' + value + '"';
  };
  var tagParseConditionalElement = function(elem) {
    if ($.isBlank(elem)) {
      return false;
    } else if ($.isBlank(elem.tagName) &&
      (!_.isUndefined(elem.value) || !$.isBlank(elem.onlyIf))) {
      if (elem.onlyIf === true) {
        return elem.value;
      } else {
        return false;
      }
    } else {
      return elem;
    }
  };
  var tagRenderChildren = function(children) {
    children = $.makeArray(children);

    // for each child, $.tag recurse if necessary, then "compact"
    // and join the resultant array. Don't use _.compact since that
    // strips 0.
    return _.reject(_.map(children, function(child) {
        if ($.isPlainObject(child)) {
          child = $.tag(child, true);
        }

        if (_.isArray(child)) {
          child = tagRenderChildren(child);
        }

        return child;
      }), function(child) {
        return $.isBlank(child);
      }).
      // Don't join with a space, because FF will add extra
      // un-controllable padding
      join('');
  };

  $.button = function(opts, keepAsText) {
    if (_.isString(opts)) {
      opts = {
        text: opts,
        href: '#' + $.urlSafe(opts)
      };
    }

    return $.tag($.extend(opts.customAttrs, {
      tagName: 'a',
      href: opts.href || '#',
      'class': _.flatten(['button', opts.className, opts.iconClass]),
      contents: [{
          value: {
            tagName: 'span',
            'class': 'icon'
          },
          onlyIf: !$.isBlank(opts.iconClass)
        },
        opts.text
      ]
    }), keepAsText);
  };

})(jQuery);
