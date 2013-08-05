(function($) {

    var $ct;
    var sidebar;

    function render()
    {
        if (!$ct)
        {
            $ct = $.tag({ tagName: 'div', id: 'gridSidebar', 'class': 'socrata-cf-side' });
            $(document.body).append($ct);
        }
        else
        { $ct.empty(); }

        if ($.cf.configuration().canAdd)
        {
            if (blist.configuration.govStat)
            {
                // GovStat gets a special sidebar for Report Builder
                $.cf.edit.addComponentPalette('Report', [
                        { typeName: 'Header', catalogName: 'Header' },
                        { typeName: 'Title', catalogName: 'Title' },
                        { typeName: 'FormattedText', catalogName: 'Formatted Text' },
                        { typeName: 'Picture', catalogName: 'Picture' },
                        { typeName: 'Print', catalogName: 'Print' },
                        { typeName: 'Share', catalogName: 'Share' },
                        { typeName: 'Visualization', catalogName: 'Chart', icon: 'Chart' },
                        { typeName: 'Visualization', catalogName: 'Map', icon: 'Map' },
                        { typeName: 'Visualization', catalogName: 'Table', icon: 'Table' },
                        { typeName: 'Container', catalogName: 'Vertical Layout', icon: 'Container' },
                        { typeName: 'HorizontalContainer', catalogName: 'Horizontal Layout',
                            icon: 'HorizontalContainer' }
                    ]);
                $.cf.edit.addComponentPalette('Advanced', [
                        { typeName: 'Map', catalogName: 'Base Map' },
                        { typeName: 'MapLayer', catalogName: 'Map Layer' }
                    ].concat(_.select($.component.catalog.data.entries, function(e)
                            { return e.catalogName.endsWith(' Chart'); }))
                );
            }
            else
            {
                // Standard Designer
                _.each([$.component.catalog.content, $.component.catalog.data, $.component.catalog.actions,
                        $.component.catalog.input], function(section, i)
                {
                    var comps = section.entries;
                    if (!_.isEmpty(comps)) { $.cf.edit.addComponentPalette(section.name, comps, i+1); }
                });
            }
        }

        sidebar = $ct.gridSidebar({
            position: 'right',
            resizeNeighbor: $('.cfMainContainer'),
            setHeight: false,
            setSidebarTop: false
        });

        if ($.cf.configuration().canAdd)
        { sidebar.setDefault('components'); }
    };

    $.cf.side = function(show)
    {
        if (!$ct) { render(); }
        if (!show) { sidebar.hide(true); }
        else { sidebar.show(); }
    };

    var $compPalettes;

    var activeComponent;

    $.extend($.cf.side, {
        properties: function(what)
        {
            if (!$.isBlank(activeComponent))
            { activeComponent.setActiveEdit(false); }
            if (!$.isBlank(what))
            { what.setActiveEdit(true); }
            activeComponent = what;

            if ($.isBlank(what))
            { sidebar.hide(); }
            else
            { sidebar.show('configuration.propertiesEditor'); }

            var propertiesEditor = sidebar.getPane('configuration.propertiesEditor');
            if (!$.isBlank(propertiesEditor) && propertiesEditor.component != what)
            {
                propertiesEditor.setComponent(null);
                if (what)
                { propertiesEditor.setComponent(what); }
            }

            var propertiesPalette = sidebar.getPane('configuration.propertiesPalette');
            if (!$.isBlank(propertiesPalette) && propertiesPalette.component != what)
            {
                propertiesPalette.setComponent(null);
                if (what)
                { propertiesPalette.setComponent(what); }
            }

            sidebar.updateEnabledSubPanes();
        },

        enableProperties: function(enable)
        {
            var c = enable ? activeComponent : null;

            var propertiesEditor = sidebar.getPane('configuration.propertiesEditor');
            if (!$.isBlank(propertiesEditor))
            { propertiesEditor.setComponent(c); }

            var propertiesPalette = sidebar.getPane('configuration.propertiesPalette');
            if (!$.isBlank(propertiesPalette))
            { propertiesPalette.setComponent(c); }

            sidebar.updateEnabledSubPanes();
        },

        reset: function() {
            render();
        }
    });
})(jQuery);
