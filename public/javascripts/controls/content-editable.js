/* HTML editor
 *
 * This plugin makes any element editable using contentEditable.
 */
(function($) {
    function Editor($dom, options) {
        var editable;

        function startEdit() {
            // TODO
        }

        function stopEdit() {
            // TODO
        }

        function processOptions(options) {
            var newEditable = options.edit === undefined || options.edit === true;
            if (newEditable != editable) {
                editable = newEditable;
                $dom.attr('contentEditable', editable);
                if (editable)
                    startEdit();
                else
                    stopEdit();
            }
        }

        $.extend(this, {
            update: processOptions
        });

        processOptions(options);
    }

    $.fn.editable = function(options) {
        if (!options)
            return this.data('socrataEditable');
        _.each(this, function(dom) {
            var $dom = $(dom);
            var editor = $dom.data('socrataEditable');
            if (editor)
                editor.update(options);
            else {
                editor = new Editor($dom, options);
                $dom.data('socrataEditable', editor);
            }
        });
    }
})(jQuery);
