;(function($) {

$.component.Picture.extend('Header', 'content', {
    _needsOwnContext: true,

    _initDom: function()
    {
        this._super.apply(this, arguments);
        $('body').addClass('hasHeader');
    },

    destroy: function()
    {
        this._super.apply(this, arguments);
        // Assume only one
        $('body').removeClass('hasHeader');
    },

    configurationSchema: function()
    {
        var retVal = this._super.apply(this, arguments);
        if (retVal === false) { return false; }

        retVal.schema.push({ fields: [{ text: 'Height', type: 'text', name: 'height' }] });
        return retVal;
    }
});

})(jQuery);
