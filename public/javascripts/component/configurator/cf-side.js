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

        _.each(paletteCatalog, function(section) {
            var html = [ '<div class="section', section.open ? ' open' : '', '"><h2>', section.name, '</h2><ul>' ];
            for (var i = 0; i < section.entries.length; i++) {
                var entry = section.entries[i];
                html.push('<li class="item icon-', entry.typeName, '"><span class="icon"></span><span class="label">', entry.catalogName, '</span></li>');
            }
            html.push('</ul></div>');
            var $section = $(html.join(''));
            $ct.append($section);
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
        });

        $ct.mousedown(function(e) {
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
        });

        if (!$.isBlank($ct[0].addEventListener))
        {
            _.each(['transitionend', 'oTransitionEnd', 'webkitTransitionEnd'],
                function(t) { $ct[0].addEventListener(t, function() { $(window).resize(); }); });
        };
        $(window).resize();
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

    var propertiesFor;
    var $properties;

    function closeProperties() {
        if (!propertiesFor)
            return;
        var $old = $properties;
        $properties
            .stop()
            .css({ top: $properties[0].offsetTop, width: $properties.width() })
            .addClass('animating out')
            .animate({ opacity: 0 }, 200, 'linear', function() {
                $old.remove();
            });
        propertiesFor = undefined;
    }

    function openProperties($dom) {
        $properties = $('<div class="socrata-cf-properties-shell"></div>');
        $properties
            .css({ opacity: 0 })
            .addClass('animating')
            .append($dom);
        $ct.append($properties);
        $properties.css('opacity', 0).animate({ opacity: 1 }, 200, 'linear', function() {
            $properties.removeClass('animating').css('opacity', '');
        });
    }

    $.extend($.cf.side, {
        properties: function(what) {
            if (propertiesFor == what)
                return;
            closeProperties();
            if (what) {
                propertiesFor = what;
                if (what.propertiesUI)
                    what = what.propertiesUI();
                openProperties($(what));
            }
        }
    });
})(jQuery);
