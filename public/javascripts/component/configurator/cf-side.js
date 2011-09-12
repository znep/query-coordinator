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
})(jQuery);
