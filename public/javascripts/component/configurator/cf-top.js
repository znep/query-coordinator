/**
 * The application "edit bar".
 */
(function($) {
    $.cf.top = function() {
        var $top = $(
            '<div class="socrata-cf-top">' +
                '<div class="not-edit-mode">' +
                    '<a class="edit" href="javascript:$.cf.edit(true)">edit page</a>' +
                '</div>' +
                '<div class="edit-mode">' +
                    '<a class="save" href="javascript:$.cf.edit.save()">save</a>' +
                    '<a class="cancel" href="javascript:$.cf.edit(false)">cancel</a>' +
                    '<a class="undo" href="javascript:$.cf.edit.undo()">undo</a>' +
                    '<a class="redo" href="javascript:$.cf.edit.redo()">redo</a>' +
                '</div>' +
            '</div>'
        );
        $(document.body).append($top);

        $.cf.edit.registerListener(function(undoable, redoable) {
            $top.toggleClass('can-undo', undoable);
            $top.toggleClass('can-redo', redoable);
        });
    }
})(jQuery);
