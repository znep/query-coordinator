// Protect $.
(function($)
{
    $.fn.inlineEdit = function(options)
    {
        var opts = $.extend({}, $.fn.inlineEdit.defaults, options);



        // Private methods
        function editClick(event, $iEdit)
        {
            var config = $iEdit.data("config-inlineEdit");

            event.preventDefault();

            // Hide all forms, show all spans.
            closeAllForms($iEdit);

            $(document).bind('click.inlineEdit',
                function (e) {docClick(e, $iEdit);});

            $iEdit.find(config.displaySelector).hide();
            var $form = $iEdit.find("form").keyup(function(event)
            {
                if (event.keyCode == 27) { closeAllForms($iEdit); }
            });
            $form.show().find(":text,textarea").focus().select();
        };

        function closeAllForms($iEdit)
        {
            var config = $iEdit.data("config-inlineEdit");

            var $allItemContainers = $(config.allItemSelector);
            $allItemContainers.find("form").hide();
            $allItemContainers.find(config.displaySelector).show();
            $(document).unbind('click.inlineEdit');
        };

        function editSubmit(event, $iEdit)
        {
            event.preventDefault();

            saveValue($iEdit);
        };

        function saveValue($iEdit)
        {
            var config = $iEdit.data("config-inlineEdit");

            var $form = $iEdit.find(config.editSubmitSelector);
            var fieldValue = $form.find(":text,textarea").val();
            if (!fieldValue || fieldValue === '')
            {
                closeAllForms($iEdit);
                return;
            }

            if (blist.util && blist.util.inlineLogin)
            {
                $(document).unbind('click.inlineEdit');
                blist.util.inlineLogin.verifyUser(
                    function (isSuccess) {
                        if (isSuccess) { doSave($iEdit, $form, fieldValue); }
                        else { closeAllForms($iEdit); }
                    }, config.loginMessage);
            }
            else
            {
                doSave($iEdit, $form, fieldValue);
            }
        };

        function doSave($iEdit, $form, fieldValue)
        {
            var config = $iEdit.data("config-inlineEdit");

            $.ajax({
                url: (config.requestUrl || $form.attr("action")),
                type: config.requestType,
                contentType: config.requestContentType,
                data: config.requestDataCallback($form, fieldValue),
                dataType: "json",
                error: function(xhr)
                {
                    var errBody = $.json.deserialize(xhr.responseText);
                    alert(errBody.message);
                },
                success: function(responseData)
                {
                    if (responseData.error)
                    {
                        alert(responseData.error);
                    }
                    else
                    {
                        $(document).unbind('click.inlineEdit');
                        if (config.onceOnly)
                        {
                            $iEdit.find('*').unbind('.inlineEdit');
                        }
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

        function docClick(event, $iEdit)
        {
            if ($iEdit.find('*').andSelf().index(event.target) < 0)
            {
                saveValue($iEdit);
            }
        };
        
        return this.each(function()
        {
            var $iEdit = $(this);

            // Support for the Metadata Plugin.
            var config = $.meta ? $.extend({}, opts, $iEdit.data()) : opts;
            $iEdit.data("config-inlineEdit", config);

            // Wire up the events.
            $iEdit.find(config.editClickSelector)
                .bind('click.inlineEdit', function (e) {editClick(e, $iEdit);});
            $iEdit.find(config.editSubmitSelector)
                .bind('submit.inlineEdit', function (e) {editSubmit(e, $iEdit);});
            $iEdit.find(config.editCancelSelector)
                .bind('click.inlineEdit', function (e) {editCancel(e, $iEdit);});
        });
    };

     // default options
     $.fn.inlineEdit.defaults = {
       allItemSelector: ".inlineEdit",
       displaySelector: "span",
       editCancelSelector: "form .formCancelLink",
       editClickSelector: "span",
       editSubmitSelector: "form:not(.doFullReq)",
       loginMessage: 'You must be logged in to edit',
       onceOnly: false,
       requestContentType: "application/x-www-form-urlencoded",
       requestDataCallback: function($form, fieldValue)
        { return $form.find(":input"); },
       requestType: "POST",
       requestUrl: null,
       submitSuccessCallback: function($inlineEditItem, responseData){}
     };

})(jQuery);
