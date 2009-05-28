// Protect $.
(function($)
{
    $.fn.inlineEdit = function(options)
    {
        var opts = $.extend({}, $.fn.inlineEdit.defaults, options);

        return this.each(function()
        {
            var $iEdit = $(this);

            // Support for the Metadata Plugin.
            var config = $.meta ? $.extend({}, opts, $iEdit.data()) : opts;
            $iEdit.data("config-inlineEdit", config);

            // Wire up the events.
            $iEdit.find(config.editClickSelector)
                .click(function (e) {editClick(e, $iEdit);});
            $iEdit.find(config.editSubmitSelector)
                .submit(function (e) {editSubmit(e, $iEdit);});
            $iEdit.find(config.editCancelSelector)
                .click(function (e) {editCancel(e, $iEdit);});
        });

        // Private methods
        function editClick(event, $iEdit)
        {
            var config = $iEdit.data("config-inlineEdit");

            event.preventDefault();

            // Hide all forms, show all spans.
            closeAllForms($iEdit);

            $iEdit.find(config.displaySelector).hide();
            var $form = $iEdit.find("form").keyup(function(event)
            {
                if (event.keyCode == 27) closeAllForms($iEdit);
            });
            $form.show().find("input[type='text']").focus().select();
        };

        function closeAllForms($iEdit)
        {
            var config = $iEdit.data("config-inlineEdit");

            var $allItemContainers = $(config.allItemSelector);
            $allItemContainers.find("form").hide();
            $allItemContainers.find(config.displaySelector).show();
        };

        function editSubmit(event, $iEdit)
        {
            var config = $iEdit.data("config-inlineEdit");

            event.preventDefault();
            var $form = $(event.currentTarget);
            var fieldValue = $form.find(":text").val();

            $.ajax({
                url: $form.attr("action"),
                type: config.requestType,
                data: $form.find(":input"),
                dataType: "json",
                success: function(responseData)
                {
                    if (responseData.error)
                    {
                        alert(responseData.error);
                    }
                    else
                    {
                        $form.hide();
                        $iEdit.find(config.displaySelector).text(fieldValue).show();
                        config.submitSuccessCallback($iEdit, responseData);
                    }
                }
            });
        };

        function editCancel(event, $iEdit)
        {
            event.preventDefault();
            closeAllForms($iEdit);
        };
    };

     // default options
     $.fn.inlineEdit.defaults = {
       allItemSelector: ".inlineEdit",
       displaySelector: "span",
       editCancelSelector: "form .formCancelLink",
       editClickSelector: "*:not(form):not(form *)",
       editSubmitSelector: "form:not(.doFullReq)",
       requestType: "POST",
       submitSuccessCallback: function($inlineEditItem, responseData){}
     };

})(jQuery);
