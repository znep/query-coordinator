var publishNS = blist.namespace.fetch('blist.publish');

blist.publish.customizationApplication = {
    
};

blist.publish.applyCustomizationToPreview = function(hash)
{
    var recurse = function(subhash, subapply)
    {
        for (var key in subhash)
        {
            if (typeof subhash[key] == 'object')
            {
                recurse(subhash[key], subapply[key]);
            }
            else
            {
                
            }
        }
    };
    recurse(hash, publishNS.customizationApplication);
};

blist.publish.valueChanged = function()
{
    var hash = publishNS.serializeForm();
    //publishNS.applyCustomizationToPreview(hash);

    clearTimeout(publishNS.saveTimeout);
    publishNS.saveTimeout = setTimeout(function() { publishNS.saveCustomization(hash); }, 2000);
};

blist.publish.saveCustomization = function(hash)
{
    // Make a true deep clone of the merge
    var upload = $.extend(true, {}, publishNS.currentTheme);
    $.extend(true, upload, hash);

    $.ajax({
        url: $('#publishOptionsPane form').attr('action') + $('#template_name').val(),
        type: "PUT",
        data: $.json.serialize({ 'customization': $.json.serialize(upload) }),
        dataType: "json",
        error: function(request, status, error)
        {
            // TODO: wait and retry and/or notify user
        }
    });
};

blist.publish.serializeForm = function()
{
    var hash = {};
    $('#publishOptionsPane form :input').each(function()
    {
        var $input = $(this);
        if ($input.attr('name').match(/^customization(\[[a-z_]+\])+$/i))
        {
            var matches = $input.attr('name').match(/[a-z_]+/ig);
            var subhash = hash;
            for (var i = 1; i < matches.length - 1; i++)
            {
                if (subhash[matches[i]] === undefined)
                {
                    subhash[matches[i]] = {};
                }
                subhash = subhash[matches[i]];
            }
            switch ($input.attr('type'))
            {
                case 'radio':
                    if ($input.attr('checked'))
                    {
                        subhash[matches[matches.length - 1]] = publishNS.parseVal($input.val());
                    }
                    break;
                case 'checkbox':
                    subhash[matches[matches.length - 1]] = $input.attr('checked');
                    break;
                default:
                    subhash[matches[matches.length - 1]] = 
                        $input.hasClass('prompt') ? '' : publishNS.parseVal($input.val());
            }
        }
    });
    return hash;
};

blist.publish.parseVal = function(val)
{
    switch (val)
    {
        case "true":  return true;
        case "false": return false;
        default:      return val;
    }
};

blist.publish.populateForm = function(hash)
{
    var recurse = function(subhash, prefix)
    {
        for (var key in subhash)
        {
            if (typeof subhash[key] == 'object')
            {
                recurse(subhash[key], prefix + '[' + key + ']');
            }
            else
            {
                var $inputs = $('[name="' + prefix + '[' + key + ']"]');
                switch ($inputs.attr('type'))
                {
                    case 'checkbox':
                    case 'radio':
                        // [] syntax deals properly with checking/unchecking
                        $inputs.val([subhash[key].toString()]);
                        break;
                    case 'text':
                        // deal with textPrompt example text
                        $inputs.val(subhash[key].toString());
                        if ((subhash[key].toString() === "") && ($inputs.hasClass('textPrompt')))
                        {
                            $inputs.addClass('prompt');
                            $inputs.val($inputs.attr('title'));
                        }
                        break;
                    case 'hidden':
                        $inputs.val(subhash[key].toString());
                        if ($inputs.siblings('.colorPickerContainer').length > 0)
                        {
                            // deal with color pickers
                            $inputs.siblings('.colorPickerContainer').ColorPickerSetColor(subhash[key].toString());
                        }
                        break;
                    default:
                        $inputs.val(subhash[key].toString());
                }
            }
        }
    };
    recurse(hash, 'customization');
    $('#tabsReorderList').reorderableList_updateFromData();

    $('#customizationDescription').text(hash['description'] || '(none)');

    // Save loaded theme
    publishNS.currentTheme = hash;
};

blist.publish.loadCustomization = function()
{
    $.ajax({
        url: $('#publishOptionsPane form').attr('action') + $('#template_name').val(),
        type: "GET",
        dataType: "json",
        success: function(responseData)
        {
            publishNS.populateForm($.json.deserialize(responseData['customization']));
            $('.templateName').text(responseData['name']);
        },
        error: function(request, status, error)
        {
            // TODO: wait and retry and/or notify user
        } 
    });
};

(function($) {
    // Highlight copy code on click
    $('.publishCode textarea').live('click', function() { $(this).select(); });

    // Tab behavior
    $("#publishOptionsPane .summaryTabs").infoPaneNavigate({
        tabMap: {
            "tabTemplates" : "#publishOptionsPane .singleInfoTemplates",
            "tabVisual" : "#publishOptionsPane .singleInfoVisual",
            "tabMenuControl" : "#publishOptionsPane .singleInfoMenuControl",
            "tabTab" : "#publishOptionsPane .singleInfoTab",
            "tabAdvanced" : "#publishOptionsPane .singleInfoAdvanced"
        },
        allPanelsSelector : "#publishOptionsPane .infoContentOuter",
        expandableSelector: "#publishOptionsPane .infoContent",
        initialTab: "tabTemplates"
    });

    // Color pickers
    $('.colorPickerContainer').each(function() {
        var $this = $(this);
        $this.ColorPicker({
            flat: true,
            color: $this.siblings('.colorPickerTrigger').css('background-color'),
            onChange: function(hsb, hex, rgb) {
                $this.siblings('.colorPickerTrigger').css('background-color', '#' + hex);
                $this.siblings('input').val('#' + hex);

                // Save changes
                publishNS.valueChanged();
            }
        });
        $this.siblings('.colorPickerTrigger').click(function()
        {
            $this.show();
            $(document).bind('click.colorPicker', function(event)
            {
                var $target = $(event.target);
                if (($target.parents('.colorPickerContainer').length == 0) &&
                    !$target.is('.colorPickerTrigger'))
                {
                    $(document).unbind('click.colorPicker');
                    $this.hide();
                }
            });
        });
    });

    // Reorderable List
    $('#tabsReorderList').reorderableList({
        onChange: publishNS.valueChanged
    });

    // Save whenever the user changes something
    $(':input[name^=customization]:not([type=text])').change(publishNS.valueChanged);
    $(':input[name^=customization][type=text]').keyup(publishNS.valueChanged);

    // Load customizations when user chooses one
    $('#template_name').change(publishNS.loadCustomization);

    // Cancel changes link
    $('.cancelCustomizationLink').click(function()
    {
        clearTimeout(publishNS.saveTimeout);
        publishNS.populateForm(publishNS.currentTheme);
        publishNS.saveCustomization(publishNS.currentTheme);
    });

})(jQuery);