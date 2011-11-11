/**
 * The application "tool bar".
 */
(function($) {
    var DEFAULT_SIDE_WIDTH = 258;

    var $ct;
    var visible = false;

    function render() {
        var width = DEFAULT_SIDE_WIDTH; // TODO

        $ct = $('<div class="socrata-cf-side" style="width: ' + width + 'px; right: -' + width + 'px"></div>');
        $(document.body).append($ct);

        var paletteCatalog = [
            $.extend($.component.catalog.content, { open: true }),
            $.component.catalog.data,
            $.component.catalog.actions,
            $.component.catalog.input
        ];

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

            // Events
            var $items = $section.find('ul');
            $section.bind('collapse', function() {
                $items.animate({ height: 0 }, 200, 'linear');
                $section.removeClass('open');
            }).mousedown(function(e) {
                if (e.which != 1)
                    return;

                // Ignore events in headers which interact independently
                var $target = $(e.target);
                if ($target.closest('h2').length)
                    return;

                // Initiate icon drag
                var $icon = $target.closest('.item');
                if ($icon.length)
                    new $.cf.ComponentDrag($icon, e);

                return false;
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
        }

        _.each(paletteCatalog, function(section) {
            createSection(section, function(entry, html) {
                html.push(
                    '<li class="item icon-',
                    entry.typeName,
                    '"><span class="icon bulb"></span><span class="label">',
                    entry.catalogName,
                    '</span></li>'
                );
            });
        });

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

        function update(id, dataset) {
            createSection({
                id: dataset.id,
                name: dataset.name + ' Properties',
                entries: _.filter(dataset.columns, function(column) {
                    return column.dataTypeName != 'meta_data';
                })
            }, function(property, html) {
                html.push(
                    '<li class="item icon-Property label-only" data-dataset="',
                    $.htmlEscape(id),
                    '" data-name="',
                    $.htmlEscape(property.fieldName),
                    '"><span class="label bulb">',
                    $.htmlEscape(property.name),
                    '</span></li>'
                );
            });
        }

        $.dataContext.bind('available', function(id, dataset) {
            dataset.bind('columns_changed', function() { update(id, dataset); });
            update(id, dataset);
        }).bind('unavailable', function() {
            dataset.unbind('columns_changed', update);
            $cf.find('.section-' + id).remove();
        });

        _.each($.dataContext.availableContexts, function(dataset, id) {
            $.dataContext.trigger('available', [ id, dataset.view ]);
        })
    }

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
    }

    var $properties;
    var propertiesEditor;

    function closeProperties(callback)
    {
        if ($.isBlank(propertiesEditor.component))
        {
            if (_.isFunction(callback)) { callback(); }
            return;
        }
        $properties.animate({ height: 0 }, 200, 'linear', function()
                {
                    $properties.css('height', '').closest('.socrata-cf-properties-shell').addClass('hide');
                    propertiesEditor.component.setEditor(null);
                    propertiesEditor.setComponent(null);
                    if (_.isFunction(callback)) { callback(); }
                });
    }

    function openProperties($dom) {
        $properties.closest('.socrata-cf-properties-shell').removeClass('hide');
        $properties.css('opacity', 0).animate({ opacity: 1 }, 200, 'linear', function()
                { $properties.css('opacity', ''); });
    }

    $.extend($.cf.side, {
        properties: function(what) {
            if (propertiesEditor.component == what)
                return;
            closeProperties(function()
            {
                if (what)
                {
                    propertiesEditor.setComponent(what);
                    what.setEditor(propertiesEditor);
                    openProperties();
                }
            });
        }
    });
})(jQuery);
