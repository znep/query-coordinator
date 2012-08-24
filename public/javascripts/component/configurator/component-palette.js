;(function($) {
    $.Control.extend('pane_componentPalette', {
        _init: function()
        {
            this._super.apply(this, arguments);
            if ($('#templates > .componentPaletteContainer').length < 1)
            {
                $('#templates').append($.tag({ tagName: 'div', 'class': 'componentPaletteContainer',
                    contents: { tagName: 'ul', contents: { tagName: 'li', 'class': 'componentCreate',
                        contents: [
                            { tagName: 'span', 'class': 'icon' },
                            { tagName: 'span', 'class': 'label' }
                        ]
                    } } }));
            }
        },

        getTitle: function()
        { return this.settings.groupName + ' Components'; },

        _getSections: function()
        {
            return [ {
                customContent: {
                    template: 'componentPaletteContainer',
                    directive: {
                        '.componentCreate': {
                            'entry<-components': {
                                '.label': 'entry.catalogName!',
                                '.@data-typename': 'entry.typeName!',
                                '.@class+': 'icon-#{entry.typeName!}'
                            }
                        }
                    },
                    data: { components: this.settings.components },
                    callback: function($newSect, data)
                    {
                        $newSect.find('.componentCreate').quickEach(function()
                        {
                            var $t = $(this);
                            $t.nativeDraggable({
                                dropId: $t.attr('data-typename')
                            });
                        });
                    }
                } } ];
        }
    }, {name: 'componentPalette'}, 'controlPane');

    $.cf.edit.addComponentPalette = function(name, components, priority)
    {
        var paneClassName = 'pane_componentPalette_' + name;
        var paneName = 'componentPalette' + name.capitalize();
        $.Control.extend(paneClassName, null, { name: paneName, components: components,
            groupName: name.capitalize() }, 'pane_componentPalette');
        $.gridSidebar.registerConfig('components.' + paneName, paneClassName, priority || 10);
    };

})(jQuery);
