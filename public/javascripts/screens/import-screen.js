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
        responseType: 'json',
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
            if (response.error == true)
            {
              $("#throbber").hide();
              $('.errorMessage')
                .html("<p><strong>Failed to import that file!</strong><br/></p>" + response.message);
              return false;
            }

            // If we succeeded importing, redirect to the new view.
            window.location = "/import/redirect?id=" + response.id; 
        }
    });

    $("#importSubmit").click(function(e) { $uploader.submit() });
});
