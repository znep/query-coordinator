/**
 * The application "tool bar".
 */
(function($) {

    var $ct;
    var visible = false;
    var sidebar;

    function render() {
        if (!$ct) {
            $ct = $.tag({ tagName: 'div', id: 'gridSidebar', 'class': 'socrata-cf-side' });
            $(document.body).append($ct);
        }
        else {
            $ct.empty();
        }

//        var paletteCatalog;
//        if ($.cf.configuration().canAdd) {
//            paletteCatalog = [
//                $.extend($.component.catalog.content, { open: true }),
//                $.component.catalog.data,
//                $.component.catalog.actions,
//                $.component.catalog.input
//            ];
//        } else {
//            paletteCatalog = [];
//        }
//
//        $compPalettes = $();
//        function createSection(section, createEntry) {
//            // Structure
//            var html = [ '<div class="section side-section-', section.id, section.open ? ' open' : '', '"><h2>', section.name, '</h2><ul>' ];
//
//            // Components
//            for (var i = 0; i < section.entries.length; i++) {
//                var entry = section.entries[i];
//                createEntry(entry, html);
//            }
//
//            // Add to DOM
//            html.push('</ul></div>');
//            var $section = $(html.join(''));
//            var $oldSection = $ct.find('.section.side-section-' + section.id);
//            if ($oldSection.length)
//                $oldSection.replaceWith($section);
//            else {
//                var $propertiesShell = $ct.find('.socrata-cf-properties-shell');
//                if ($propertiesShell.length)
//                    $propertiesShell.before($section);
//                else
//                    $ct.append($section);
//            }
//            $compPalettes = $compPalettes.add($section);
//
//            // Events
//            var $items = $section.find('ul');
//            $section.bind('collapse', function() {
//                $items.animate({ height: 0 }, 200, 'linear');
//                $section.removeClass('open');
//            }).find('h2').click(function() {
//                if ($section.is('.open'))
//                    $section.trigger('collapse');
//                else {
//                    $section.addClass('open');
//                    $items.height('');
//                    var height = $items.height();
//                    $items.height(0);
//                    $items.animate({ height: height }, 200, 'linear');
//                }
//
//                $ct.find('.open').not(this.parentNode).trigger('collapse');
//            });
//
//            $section.find('.componentCreate').each(function()
//            {
//                var $t = $(this);
//                $t.nativeDraggable({
//                    dropId: $t.attr('data-typename')
//                });
//            });
//        }
//
//        _.each(paletteCatalog, function(section) {
//            createSection(section, function(entry, html) {
//                html.push(
//                    '<li class="componentCreate icon-',
//                    entry.typeName,
//                    '" data-typename="' + entry.typeName + '">' +
//                    '<span class="bulb"><span class="icon"></span></span><span class="label">',
//                    entry.catalogName,
//                    '</span></li>'
//                );
//            });
//        });

        sidebar = $ct.gridSidebar({
            position: 'right',
            resizeNeighbor: $('.cfMainContainer'),
            setHeight: false,
            setSidebarTop: false
        });
    };

    $.cf.side = function(show) {
        if (!show) {
            if (visible) {
//                $ct.css('right', -$ct.width() + 'px');
            }
            visible = false;
            return;
        }

        if (visible)
            return;

        if (!$ct)
            render();

//        setTimeout(function() {
//            $ct.css('right', 0);
//        }, 1);

        visible = true;
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
            { sidebar.show('configuration.propertiesPalette'); }

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
