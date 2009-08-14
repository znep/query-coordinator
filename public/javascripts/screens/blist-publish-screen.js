publishNS = blist.namespace.fetch('blist.publish');

blist.publish.applyCustomizationToPreview = function(hash)
{
    
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
                        subhash[matches[matches.length - 1]] = $input.val();
                    }
                    break;
                case 'checkbox':
                    subhash[matches[matches.length - 1]] = $input.attr('checked');
                    break;
                default:
                    subhash[matches[matches.length - 1]] = $input.hasClass('prompt') ? '' : $input.val();
            }
        }
    });
    return hash;
};

// TODO: remove when not necessary
blist.publish.testPopulate = function()
{
    var a = blist.publish.serializeForm();
    a.publish.dimensions.width = 1234;
    a.frame.gradient = "true";
    a.frame.color = "#fff";
    a.grid.header_icons = true;
    a.menu.api = "false";
    a.menu.print = false;
    a.meta.comments.order = 100;
    a.meta.summary.show = false;
    blist.publish.populateForm(a);
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
    $('#tabsReorderList').reorderableList();
})(jQuery);