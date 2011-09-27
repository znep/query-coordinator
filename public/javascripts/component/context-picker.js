;(function($) {

$.cf.contextPicker = function()
{
    return {name: 'viewId', required: true, text: 'View Data', type: 'custom',
        editorCallbacks: {create: picker, value: pickerValue, validate: pickerValidate}};
};

var picker = function($field, vals, curValue)
{
    $field.addClass('contextPicker');
    var $wrapper = $.tag({tagName: 'div', 'class': 'wrapper'});
    $field.append($wrapper);

    var $hiddenInput = $.tag({tagName: 'input', type: 'hidden', name: $field.attr('name'),
        'class': 'required', data: {'custom-4x4uid': 'req'}, value: curValue});
    $field.append($hiddenInput);

    var fullData = $.dataContext.availableContexts[curValue];
    var $textInput = $.tag({tagName: 'input', type: 'text', 'class': 'textInput',
        value: $.htmlEscape((fullData || {}).name || curValue)});
    $textInput.change(function(e)
        {
            var v = ($textInput.data('fullData') || {}).id || $textInput.value();
            if (!$.isBlank(v))
            {
                var m = v.match(/^https?:\/\/.*\/(\w{4}-\w{4})(\?.*)*$/);
                if (!$.isBlank(m)) { v = m[1]; }
            }
            $hiddenInput.value(v);
            if (!$hiddenInput.valid()) { return; }

            if ($.isBlank($.dataContext.availableContexts[v]))
            {
                e.stopPropagation();
                $.dataContext.getContext(v, function() { $textInput.change(); },
                    function(xhr)
                    {
                        var validator = $hiddenInput.closest('form').data('form-validator');
                        var errors = {};
                        errors[$hiddenInput.attr('name')] = xhr.status == 404 ?
                            'This view is not valid' : 'There was an error';
                        if ($.isBlank(validator))
                        { alert(_.first(_.values(errors))); }
                        else
                        { validator.showErrors(errors); }
                    });
            }
        })
    .focus(function() { $textInput.select(); });
    $wrapper.append($textInput);

    var $chooser = $.tag({tagName: 'a', href: '#choose', 'class': 'dropdownChooser'});
    $chooser.mousedown(function(e)
            {
                if (!$textInput.is(':focus'))
                { _.defer(function() { $textInput.focus(); }); }
            })
    .click(function(e) { e.preventDefault(); });
    $wrapper.append($chooser);

    _.defer(function()
    {
        $textInput.awesomecomplete({
            alignRight: true,
            attachTo: $field.closest('.controlPane'),
            dontMatch: ['id'],
            forcePosition: true,
            showAll: true,
            dataMethod: function(term, $f, dataCallback)
            {
                dataCallback(_.map($.dataContext.availableContexts, function(ds)
                        {
                            var d = {};
                            _.each(['name', 'id', 'description', 'category', 'tags'], function(key)
                                { d[key] = ds[key]; });
                            return d;
                        }));
            },
            onComplete: function(data)
            { $textInput.data('fullData', data).change(); }
        });
    });

    return true;
};

var pickerValue = function($field)
{
    var $editor = $field.find('input[type=hidden]');
    if ($editor.length < 1) { return null; }

    return $editor.value();
};

var pickerValidate = function($field)
{
    var $editor = $field.find('input[type=hidden]');
    if ($editor.length < 1) { return false; }

    return $editor.valid();
};

})(jQuery);
