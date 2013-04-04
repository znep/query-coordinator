/**
 * The application "tool bar".
 */
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
            _.each([$.component.catalog.content, $.component.catalog.data, $.component.catalog.actions,
                $.component.catalog.input], function(section, i)
            {
                var comps = section.entries;
                if (blist.configuration.govStat)
                {
                    comps = _.filter(comps, function(e)
                    {
                        return _.include(['Title', 'Text', 'Picture', 'Map', 'Map Layer', 'Table', 'Print',
                            'Visualization', 'Header'],
                            e.catalogName) || e.catalogName.toLowerCase().endsWith('chart');
                    });
                }
                if (!_.isEmpty(comps)) { $.cf.edit.addComponentPalette(section.name, comps, i+1); }
            });
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
