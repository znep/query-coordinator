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
                var t = function(name) { return $.t('govstat.reports.component.' + name); };
                $.cf.edit.addComponentPalette('Report', [
                        { typeName: 'Header', catalogName: t('header') },
                        { typeName: 'Title', catalogName: t('title') },
                        { typeName: 'FormattedText', catalogName: t('formatted_text') },
                        { typeName: 'Picture', catalogName: t('picture') },
                        { typeName: 'Print', catalogName: t('print') },
                        { typeName: 'Share', catalogName: t('share') },
                        { typeName: 'Visualization', catalogName: t('chart'), icon: 'Chart' },
                        { typeName: 'Visualization', catalogName: t('map'), icon: 'Map' },
                        { typeName: 'Visualization', catalogName: t('table'), icon: 'Table' }
                    ]);
                $.cf.edit.addComponentPalette('Advanced', [
                        { typeName: 'Container', catalogName: t('vertical_layout'), icon: 'VerticalContainer' },
                        { typeName: 'HorizontalContainer', catalogName: t('horizontal_layout'),
                            icon: 'HorizontalContainer' },
                        { typeName: 'Visualization', catalogName: t('visualize'), icon: 'Visualization' },
                        { typeName: 'Map', catalogName: t('base_map') },
                        { typeName: 'MapLayer', catalogName: t('map_layer') }
                    ].concat(_.select($.component.catalog.data.entries, function(e)
                            { return e.typeName.indexOf('Chart') > 0; }))
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
