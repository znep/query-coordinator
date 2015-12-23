;(function($) {
    $.Control.extend('pane_componentPalette', {
        _init: function()
        {
            this._super.apply(this, arguments);
            if ($('#templates > .componentPaletteContainer').length < 1)
            {
                $('#templates').append($.tag2({ _: 'div', className: 'componentPaletteContainer',
                    contents: { _: 'div', className: ['componentBlock', 'clearfix'],
                        contents: [
                            { _: 'span', className: 'title' },
                            { _: 'ul', contents: { _: 'li', className: 'componentCreate',
                                 contents: [ { _: 'span', className: 'icon' },
                                    { _: 'span', className: 'label' } ] } }
                        ]
                    } }));
            }
        },

        getTitle: function()
        { return $.t('dataslate.configurator.' + this.settings.groupName.toLowerCase() + '_components'); },

        _getSections: function()
        {
            var compBlocks = this.settings.components;
            // If just an array of components, make it a section obj
            if (_.isArray(compBlocks) && !$.subKeyDefined(compBlocks[0], 'components'))
            { compBlocks = { components: compBlocks }; }
            // If just a section obj, make it an array of sections
            if ($.subKeyDefined(compBlocks, 'components'))
            { compBlocks = [compBlocks]; }

            return [ {
                customContent: {
                    template: 'componentPaletteContainer',
                    directive: {
                        '.componentBlock': {
                            'block<-components': {
                                '.title': 'block.title!',
                                '.title@class+': function(a)
                                    { return $.isBlank(a.item.title) ? 'hide' : '' },
                                '.componentCreate': {
                                    'entry<-block.components': {
                                        '.label': 'entry.catalogName!',
                                        '.@data-typename': 'entry.typeName!',
                                        '.@class+': function(a)
                                        { return 'icon-' + (a.item.icon || a.item.typeName); }
                                    }
                                },
                                '.@class+': 'block.className'
                            }
                        }
                    },
                    data: { components: compBlocks },
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
