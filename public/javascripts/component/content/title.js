;(function() {

var dimensionOptions = [
    { text: 'ems', value: 'em' },
    { text: 'points', value: 'pt' },
    { text: 'pixels', value: 'px' },
    { text: 'inches', value: 'in' } ];

var fontOptions = [
    { text: 'Arial', value: 'helvetica, arial, sans-serif' }, // protecting people from themselves!
    { text: 'Palatino', value: '\'palatino linotype\', palatino, \'book antiqua\', serif' },
    { text: 'Times', value: 'times, \'times new roman\', serif' },
    { text: 'Verdana', value: 'verdana, sans-serif' },
    { text: 'Georgia', value: 'georgia, serif' },
    { text: 'Trebuchet', value: '\'trebuchet ms\', sans-serif'} ];

$.component.Component.extend('Title', 'content', {
    configurationSchema: function()
    {
        return [{fields: [
            {type: 'text', name: 'text', text: 'Title', required: true}
        ]},
        { title: 'Styling', name: 'stylingOptions', fields: [
            {type: 'group', text: 'Font Size', includeLabel: true,
                lineClass: 'dimensions', options: [
                {type: 'text', name: 'styleDimensions.font-size.value', inputOnly: true,
                    defaultValue: 1.5},
                {type: 'select', name: 'styleDimensions.font-size.unit', inputOnly: true,
                    prompt: null, options: dimensionOptions, defaultValue: 'em'}]},
            {text: 'Font Family', name: 'styles.font-family', prompt: null,
                type: 'select', options: fontOptions},
            {text: 'Font Color', name: 'styles.color', type: 'color',
                advanced: true, showLabel: true, defaultValue: '#333333'},
            {text: 'Alignment', name: 'styles.text-align', type: 'select', defaultValue: 'left',
                prompt: null, options: [
                    {text: 'Left', value: 'left'},
                    {text: 'Center', value: 'center'},
                    {text: 'Right', value: 'right'}
            ]},
            {text: 'Bold', name: 'styles.font-weight', type: 'checkbox',
                trueValue: 'bold', falseValue: 'normal', defaultValue: 'bold'},
            {text: 'Italics', name: 'styles.font-style', type: 'checkbox',
                trueValue: 'italic', falseValue: 'normal', defaultValue: 'normal'},
            {text: 'Underline', name: 'styles.text-decoration', type: 'checkbox',
                trueValue: 'underline', falseValue: 'none', defaultValue: 'none'}
        ]}];
    },

    _initDom: function()
    {
        this._super.apply(this, arguments);
        if ($.isBlank(this.$title))
        {
            this.$contents.append($.tag({tagName: 'h2'}));
            this.$title = this.$contents.find('h2');
        }
    },

    _render: function()
    {
        this._super.apply(this, arguments);
        this.$title.text(this._properties.text);
        var styles = this._properties.styles || {};
        _.each(this._properties.styleDimensions, function(v, k)
                {
                    if (!$.isBlank(v.value) && !$.isBlank(v.unit))
                    { styles[k] = v.value + v.unit; }
                });
        this.$title.css(styles);
    },

    _propWrite: function(properties)
    {
        this._super.apply(this, arguments);
        if (!_.isEmpty(properties)) { this._render(); }
    }
});

})(jQuery);
