$(function ()
{
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
            if (!(ext && /^(csv)$/.test(ext)))
            {
                $('.errorMessage')
                    .html('<p>Please choose a csv file</p>');
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
            if (!(ext && /^(csv)$/.test(ext)))
            {
                $('.errorMessage')
                    .html('<p>Please choose a csv file</p>');
                $(".fileInputContainer input[type='text']").val('');
                return false;
            }
            else
            {
                $("#throbber").css("display", "inline");
                $('.errorMessage').text('');
            }
        },
        onComplete: function (file, response)
        {
            if (response.indexOf("<h1>500 Error</h1>") == 0)
            {
              $("#throbber").css("display", "none");

              response = response.slice(19, -6);
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
