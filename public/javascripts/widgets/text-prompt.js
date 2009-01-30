var textPromptNS = blist.namespace.fetch('blist.widgets.textPrompt');

$(function ()
{
    $.fn.example.defaults.className = 'prompt';
    $('.textPrompt').example(function ()
        {
            return $(this).attr('title');
        });
});
