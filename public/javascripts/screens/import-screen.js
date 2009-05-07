$(function ()
{
    $("#throbber").hide();

    $(".fileInputContainer input[type='file']").change(function()
    {
        $(".fileInputContainer input[type='text']").val($(this).val());
    });

    var $uploadButton = $("#importButton")
        .click(function(e) { e.preventDefault(); });

    var $uploader = new AjaxUpload($uploadButton, {
        action: $("#importAction").attr('href'),
        autoSubmit: false,
        name: 'importFileInput',
        onChange: function (file, ext)
        {
            if (!(ext && /^(csv|xml)$/.test(ext)))
            {
                $('.errorMessage')
                    .html('Please choose a csv or xml file');
                $(".fileInputContainer input[type='text']").val('');
                return false;
            }
            else
            {
                $('.errorMessage').html('');
            }

            $(".fileInputContainer input[type='text']").val(file);
        },
        onSubmit: function (file, ext)
        {
            $("#throbber").show();
            $('.errorMessage').text('');
        },
        onComplete: function (file, response)
        {
            // Errors start with a header, success doesn't.
            if (response.indexOf("<h1>") == 0)
            {
              $("#throbber").hide();

              // We don't care what type of error it was, only that there was
              // one. Error format is "<h1>{http error code} Error</h1>\n"
              // followed by the error payload.
              response = response.slice(19, -6);
              response = response.replace(/\s*\(code <em>\w+<\/em>\)\s*/, '');
              $('.errorMessage')
                .html("<p><strong>Failed to import that file!</strong><br/></p>" + response);
              return false;
            }

            // If we succeeded importing, redirect to the new view.
            response = $.json.deserialize(response.slice(5, -6));
            window.location = "/import/redirect?id=" + response.id; 
        }
    });

    $("#importSubmit").click(function(e) { $uploader.submit() });
});
