/**
 * The application "tool bar".
 */
(function($) {

    var $ct;
    var visible = false;

    function render() {
        if (!$ct) {
            $ct = $.tag({ tagName: 'div', 'class': 'socrata-cf-side' });
            $(document.body).append($ct);
        }
        else {
            $ct.empty();
        }

        var paletteCatalog;
        if ($.cf.configuration().canAdd) {
            paletteCatalog = [
                $.extend($.component.catalog.content, { open: true }),
                $.component.catalog.data,
                $.component.catalog.actions,
                $.component.catalog.input
            ];
        } else {
            paletteCatalog = [];
        }

        $compPalettes = $();
        function createSection(section, createEntry) {
            // Structure
            var html = [ '<div class="section side-section-', section.id, section.open ? ' open' : '', '"><h2>', section.name, '</h2><ul>' ];

            // Components
            for (var i = 0; i < section.entries.length; i++) {
                var entry = section.entries[i];
                createEntry(entry, html);
            }

            // Add to DOM
            html.push('</ul></div>');
            var $section = $(html.join(''));
            var $oldSection = $ct.find('.section.side-section-' + section.id);
            if ($oldSection.length)
                $oldSection.replaceWith($section);
            else {
                var $propertiesShell = $ct.find('.socrata-cf-properties-shell');
                if ($propertiesShell.length)
                    $propertiesShell.before($section);
                else
                    $ct.append($section);
            }
            $compPalettes = $compPalettes.add($section);

            // Events
            var $items = $section.find('ul');
            $section.bind('collapse', function() {
                $items.animate({ height: 0 }, 200, 'linear');
                $section.removeClass('open');
            }).find('h2').click(function() {
                if ($section.is('.open'))
                    $section.trigger('collapse');
                else {
                    $section.addClass('open');
                    $items.height('');
                    var height = $items.height();
                    $items.height(0);
                    $items.animate({ height: height }, 200, 'linear');
                }

                $ct.find('.open').not(this.parentNode).trigger('collapse');
            });

            $section.find('.componentCreate').each(function()
            {
                var $t = $(this);
                $t.nativeDraggable({
                    dropId: $t.attr('data-typename')
                });
            });
        }

        _.each(paletteCatalog, function(section) {
            createSection(section, function(entry, html) {
                html.push(
                    '<li class="componentCreate icon-',
                    entry.typeName,
                    '" data-typename="' + entry.typeName + '">' +
                    '<span class="bulb"><span class="icon"></span></span><span class="label">',
                    entry.catalogName,
                    '</span></li>'
                );
            });
        });

        $propPalette = $.tag({tagName: 'div', 'class': ['propertiesPalette', 'properties']});
        propertiesPalette = $propPalette.pane_propertiesPalette();
        var $ppWrapper = $.tag({tagName: 'div',
            'class': ['section', 'open', 'socrata-cf-properties-shell', 'socrata-cf-mouse', 'hide'],
            contents: [{tagName: 'h2', contents: 'Available Properties'}]});
        propertiesPalette.render();
        $ppWrapper.append($propPalette);
        $ct.append($ppWrapper);

        $properties = $.tag({tagName: 'div', 'class': 'properties'});
        propertiesEditor = $properties.pane_propertiesEditor();
        var $wrapper = $.tag({tagName: 'div',
            'class': ['section', 'open', 'socrata-cf-properties-shell', 'socrata-cf-mouse', 'hide'],
            contents: [{tagName: 'h2', contents: propertiesEditor.getTitle()}]});
        propertiesEditor.render();
        $wrapper.append($properties);
        $ct.append($wrapper);

        if (!$.isBlank($ct[0].addEventListener))
        {
            _.each(['transitionend', 'oTransitionEnd', 'webkitTransitionEnd'],
                function(t) { $ct[0].addEventListener(t, function() { $(window).resize(); }); });
        };
        _.defer(function() { $(window).resize(); });
    };

    $.cf.side = function(show) {
        if (!show) {
            if (visible) {
                $ct.css('right', -$ct.width() + 'px');
                $(document.body).css('margin-right', 0);
            }
            visible = false;
            return;
        }

        if (visible)
            return;

        if (!$ct)
            render();

        setTimeout(function() {
            $ct.css('right', 0);
            $(document.body).css('margin-right', $ct.width());
        }, 1);

        visible = true;
    };

    var $compPalettes;

    var $propPalette;
    var propertiesPalette;

    var $properties;
    var propertiesEditor;

    var activeComponent;

    function closePanel($dom, pane, callback)
    {
        if ($.isBlank(pane.component))
        {
            if (_.isFunction(callback)) { callback(); }
            return;
        }
        $dom.animate({ height: 0 }, 200, 'linear', function()
            {
                $dom.css('height', '').closest('.socrata-cf-properties-shell').addClass('hide');
                if (_.isFunction(callback)) { callback(true); }
            });
    };

    function openPanel($dom)
    {
        $dom.closest('.socrata-cf-properties-shell').removeClass('hide');
        $dom.css('opacity', 0).animate({ opacity: 1 }, 200, 'linear', function()
                { $dom.css('opacity', ''); });
    };

    $.extend($.cf.side, {
        properties: function(what)
        {
            if ($.isBlank(what))
            { $compPalettes.removeClass('hide'); }
            else
            { $compPalettes.addClass('hide'); }

            if (!$.isBlank(activeComponent))
            { activeComponent.setActiveEdit(false); }
            if (!$.isBlank(what))
            { what.setActiveEdit(true); }
            activeComponent = what;

            if (propertiesEditor.component != what)
            {
                closePanel($properties, propertiesEditor, function(didClose)
                {
                    if (didClose)
                    { propertiesEditor.setComponent(null); }
                    if (what)
                    {
                        propertiesEditor.setComponent(what);
                        openPanel($properties);
                    }
                });
            }
            if (propertiesPalette.component != what)
            {
                closePanel($propPalette, propertiesPalette, function(didClose)
                {
                    if (didClose)
                    { propertiesPalette.setComponent(null); }
                    if (what)
                    {
                        propertiesPalette.setComponent(what);
                        openPanel($propPalette);
                    }
                });
            }
        },

        enableProperties: function(enable)
        {
            var c = enable ? activeComponent : null;
            propertiesEditor.setComponent(c);
            propertiesPalette.setComponent(c);
        },

        reset: function() {
            render();
        }
    });
})(jQuery);
