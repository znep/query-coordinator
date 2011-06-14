var textPromptNS = blist.namespace.fetch('blist.widgets.textPrompt');

$(function ()
{
    $.fn.example.defaults.className = 'prompt';
    $('.textPrompt').example(function ()
        {
            return $(this).attr('title');
        });

    if (!$.isBlank($.validator))
    {
        // Monkey-patch required to support textPrompt
        var oldReq = $.validator.methods.required;
        $.validator.methods.required = function(value, element, param)
        {
            if ((element.nodeName.toLowerCase() == 'textarea' ||
                (element.nodeName.toLowerCase() == 'input' &&
                element.type.toLowerCase() == 'text')) &&
                $(element).hasClass('prompt')) { return false; }
            return oldReq.apply(this, [value, element, param]);
        };
    }
});
