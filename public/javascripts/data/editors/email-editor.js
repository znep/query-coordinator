(function($)
{
    $.blistEditor.email = function(options, dom)
    {
        this.settings = $.extend({}, $.blistEditor.email.defaults, options);
        this.currentDom = dom;
        this.init();
    };


    $.extend($.blistEditor.email, $.blistEditor.extend(
    {
        prototype:
        {
            isValid: function()
            {
                var curVal = this.currentValue();
                // Derived from code at:
                // http://www.stimuli.com.br/, Arthur Debert
                // permissive, will allow quite a few non matching email addresses
                return curVal === null ||
                    curVal.match(/^[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,4}$/i);
            }
        }
    }, $.blistEditor.text));

    $.blistEditor.addEditor($.blistEditor.email, 'email');

})(jQuery);
