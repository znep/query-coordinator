publishNS = blist.namespace.fetch('blist.publish');

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
                if (!$target.parents('*').is($this) &&
                    !$target.is('.colorPickerTrigger'))
                {
                    $this.hide();
                }
            });
        });
    });
})(jQuery);