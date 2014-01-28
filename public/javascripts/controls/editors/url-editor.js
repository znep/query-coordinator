(function($)
{
    var hrefValue = function(editObj)
    {
        var v = editObj.originalValue;
        var ret = v || '';
        if (v instanceof Object) { ret = v[editObj.type.subColumns.url.name]; }
        return ret || '';
    };

    var descValue = function(editObj)
    {
        var v = editObj.originalValue;
        var ret = '';
        if (v instanceof Object) { ret = v[editObj.type.subColumns.description.name]; }
        return ret || '';
    };

    $.blistEditor.addEditor('url', {
        editorAdded: function()
        {
            this._super.apply(this, arguments);

            var editObj = this;
            editObj.setFullSize();
            editObj.$dom().find(':text.href').keydown(function(e)
                { if (e.keyCode == 9 && !e.shiftKey)
                    { e.stopPropagation(); } });
            editObj.$dom().find(':text.description').keydown(function(e)
                { if (e.keyCode == 9 && e.shiftKey)
                    { e.stopPropagation(); } });
            editObj.$dom().find(':text.href').keypress(function(e)
                { setTimeout(function() { editObj.textModified(); }, 0); });
        },

        $editor: function()
        {
            if (!this._$editor)
            {
                var hrefVal = $.htmlEscape(this.newValue || hrefValue(this));
                this._$editor = $('<div class="blist-table-editor' +
                    ' type-' + (this.type.cls || this.type.name) +
                    '"><div class="labels"><span class="href">URL</span>' +
                    '<span class="description">Description</span></div>' +
                    '<input type="text" class="href" value="' +
                    hrefVal + '" />' +
                    '<input type="text" ' +
                    'class="description" value="' +
                    $.htmlEscape(descValue(this)) + '" /></div>');
            }
            return this._$editor;
        },

        textModified: function()
        {
            if (this.isValid()) { this.$dom().removeClass('invalid'); }
            else { this.$dom().addClass('invalid'); }
        },

        isValid: function()
        {
            var curVal = this.urlValue();
            if (!$.isBlank(curVal) && $.subKeyDefined(this.format, 'baseUrl'))
            { curVal = this.format.baseUrl + curVal; }
            return curVal === null ||
                curVal.match(/^(mailto\:|(news|(ht|f)tp(s?))\:\/\/)?[a-zA-Z0-9\-\.]+\.([a-zA-Z]{2,}|[0-9]+)(\:\d+)?(\/?\S*)?$/i);
        },

        urlValue: function()
        {
            var newHref = this.$editor().find(':text.href:not(.prompt)').val();
            return newHref === '' || newHref === undefined ? null : newHref;
        },

        currentValue: function()
        {
            var newHref = this.urlValue();
            if (!this.isValid()) { return newHref; }

            var newDesc = this.$editor()
                .find(':text.description:not(.prompt)').val();
            newDesc = newDesc === '' || newDesc === undefined ? null : newDesc;
            if (newHref === null && newDesc === null) { return null; }

            var ret = {};
            ret[this.type.subColumns.url.name] = newHref;
            ret[this.type.subColumns.description.name] = newDesc;
            return ret;
        },

        querySize: function()
        {
            return { width: Math.max(120, hrefValue(this)
                    .visualLength(this.$editor().css('font-size'))) +
                    Math.max(120, descValue(this)
                    .visualLength(this.$editor().css('font-size'))),
                height: this.$editor()
                    .find('.labels').outerHeight(true) +
                    this.$editor().find(':input').outerHeight(true) };
        }
    });

})(jQuery);
