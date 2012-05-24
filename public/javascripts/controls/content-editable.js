/* HTML editor
 *
 * This plugin makes any element editable using contentEditable.
 */
(function($) {
    function Editor($dom, options) {
        var editable;

        function startEdit()
        {
            $dom.attr('dropzone', 'all string:text/plain string:text/html');
            $dom.bind('dragenter', function(e) { if (editable) { $dom.attr('contentEditable', true); } });
//            $dom.bind('dragover', function(e) { e.preventDefault(); });
        };

        function stopEdit()
        {
            $dom.attr('dropzone', 'none');
        };

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
        };

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
