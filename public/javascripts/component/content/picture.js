;(function($) {

var t = function(str) { return $.t('dataslate.component.picture.' + str); };

$.component.Component.extend('Picture', 'content', {
    _initDom: function()
    {
        this._super.apply(this, arguments);
        if ($.isBlank(this.$img) || this.$img.parents('body').length < 1)
        {
            this.$img = this.$contents.children('img');
            if (this.$img.length < 1)
            {
                this.$img = $.tag({tagName: 'img'});
                this.$contents.append(this.$img);
            }
        }
    },

    _getEditAssets: function()
    {
        return {
            javascripts: [{ assets: 'image-uploader' }],
            translations: [ 'dataslate.component.picture' ]
        };
    },

    configurationSchema: function()
    {
        if (this._super.apply(this, arguments) === false) { return false; }

        var retVal = {schema: [
            { title: t('image_source'), fields: [{ type: 'radioGroup', name: 'imageSource', required: true,
              lineClass: 'noLabel', options: [
                    { type: 'group', options: [
                        { name: 'asset.id', type: 'custom', required: true,
                            editorCallbacks: {create: createAssetUploader, value: assetValue} },
                        { name: 'asset.size', type: 'select', prompt: null, options: [
                            { text: t('original'), value: '' },
                            { text: t('tiny'),     value: 'tiny' },
                            { text: t('thumb'),    value: 'thumb' },
                            { text: t('medium'),   value: 'medium' },
                            { text: t('large'),    value: 'large' }
                            ] }
                        ] },
                    { name: 'url', type: 'text', extraClass: 'url', required: true,
                        prompt: t('full_url') }
                  ] }]
            },
            { fields: [{ name: 'title', type: 'text', text: t('title_attr'), prompt: t('title_attr_prompt') },
                { name: 'alt', type: 'text', text: t('alt_attr'), prompt: t('alt_attr_prompt') }] }
        ]};
        return retVal;
    },

    _render: function()
    {
        var cObj = this;
        if (!cObj._super.apply(cObj, arguments)) { return false; }

        var doRender = function()
        {
            var url;
            if (!$.isBlank((cObj._properties.asset || {}).id))
            {
                url = '/api/assets/' + cObj._stringSubstitute(cObj._properties.asset.id);
                if (!$.isBlank(cObj._properties.asset.size))
                { url += '?s=' + cObj._stringSubstitute(cObj._properties.asset.size); }
            }
            else if (!$.isBlank(cObj._properties.url))
            { url = cObj._stringSubstitute(cObj._properties.url); }
            var title = cObj._stringSubstitute(cObj._properties.title);
            var alt = cObj._stringSubstitute(cObj._properties.alt);
            cObj.$img.attr({src: url || '', title: title, alt: alt || title});
        };
        if (!cObj._updateDataSource(cObj._properties, doRender))
        { doRender(); }

        return true;
    },

    _propWrite: function(properties)
    {
        this._super(properties);
        if (!_.isEmpty(properties)) { this._render(); }
    }

});

var createAssetUploader = function($field, vals, curValue)
{
    $field.addClass('imageUploaderField');

    var $preview = $.tag({ tagName: 'span', 'class': 'imagePreview',
        contents: {tagName: 'img', src: '/api/assets/' + curValue + '?s=tiny'} });
    $field.append($preview);
    var $upload = $.tag({tagName: 'input', type: 'file', 'data-endpoint': '/api/assets'});
    $field.append($upload);
    var $hiddenInput = $.tag({tagName: 'input', type: 'hidden', name: $field.attr('name'),
        'class': 'required', value: curValue});
    $field.append($hiddenInput);

    $upload.imageUploader({
        containerSelector: '.inputItem',
        inputClass: 'socrata-cf-mouse',
        $image: $preview,
        success: function($container, $image, response)
        {
            $hiddenInput.value(response.id);
            $hiddenInput.change();
        },
        urlProcessor: function(response)
        { return '/api/assets/' + response.id + '?s=tiny'; }
    });

    return true;
};

var assetValue = function($field)
{
    var $editor = $field.find('input[type=hidden]');
    if ($editor.length < 1) { return null; }

    return $editor.value();
};

})(jQuery);
