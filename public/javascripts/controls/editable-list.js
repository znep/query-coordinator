/**
 *  DEPENDENCIES: awesomereorder
 */

;(function($)
{
    $.fn.editableList = function(options)
    {
        options = $.extend({}, $.fn.editableList.defaults, options);

        return this.each(function()
        {
            var $container = $(this),
                $newLine   = $container.find(options.newItemSelector),
                $list      = $container.find(options.listSelector),
                $saveBtn   = $container.find(options.saveButtonSelector),
                $template  = $container.find('.' + options.templateClass);

            var modified = function()
            { $container.addClass('modified'); };

            if (options.reorderable)
            { $list.awesomereorder({stop: modified}); }

            var bindEventsForLine = function($line)
            {
                $line.change(modified)
                    .find(options.deleteSelector).click(function(event) {
                        event.preventDefault();
                        $line.slideUp(500, function() {$line.remove(); });
                        modified();
                    });
            };

            var addNewLine = function()
            {
                var $newb = $template.clone()
                    .find(options.valueSelector)
                        .val($newLine.find(options.valueSelector).val())
                    .end()
                    .insertBefore($newLine)
                    .removeClass(options.templateClass + ' ui-draggable');
                bindEventsForLine($newb);

                if (options.reorderable)
                { $list.trigger('awesomereorder-listupdated'); }
                $newLine.find(options.valueSelector).val('');
                modified();
            };

            $list.find('li').each(function() {
                bindEventsForLine($(this));
            });

            $saveBtn.click(function(event) {
                event.preventDefault();
                var data = [];
                $list.find('li').each(function() {
                    var val = $(this).find(options.valueSelector).val();
                    if (!$.isBlank(val.trim()))
                    { data.push(val); }
                });
                options.saveCallback($container, data);
            });

            $newLine.keypress(function(event) {
                if (event.which == 13)
                { addNewLine(); }
            });

            $newLine.find(options.newItemButton).click(function(event) {
                event.preventDefault();
                addNewLine();
            });
        });
    };


    $.fn.editableList.defaults = {
        deleteSelector: '.deleteItem',
        listSelector: '.editableList',
        newItemSelector: '.newItemLine',
        newItemButton: '.newItemButton',
        reorderable: true,
        saveButtonSelector: '.saveButton',
        saveCallback: function($container, data) {},
        templateClass: 'templateLine',
        valueSelector: '.value'
    };
})(jQuery);
