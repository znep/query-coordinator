blist.common.privacyText = {
    privacy_public_view: "This dataset can be viewed by the public.",
    privacy_public_edit: "This dataset can be viewed and edited by the public.",
    privacy_private: "This dataset's data is private.",
    privacy_private_data: "This dataset's data is private but column names are public.",
    privacy_private_columns: "This dataset's data and column names are private.",
    privacy_adult_content: "This dataset contains adult content."
};

$(function ()
{
    // Validation
    $("#newDatasetForm").validate({
        rules: {
            "view[name]": "required",
            "view[attributionLink]": "customUrl"
        },
        messages: {
            "view[name]": " Dataset name is required.",
            "view[attributionLink]": " That does not appear to be a valid URL."
        }
    });
    
    // Licensing options
    $(".newBlistContent #view_licenseId").change(function(event)
    {
        if ($(".newBlistContent #view_licenseId").val() == "CC")
        {
            $(".newBlistContent .licensing").addClass("active");
            $(".newBlistContent #licensingCreativeCommons").show();

            $(".newBlistContent .licensing #license_cc_type").rules("add", {
                required: true,
                messages: { required: " You must specify a license type."}
            });
            $(".newBlistContent .licensing #view_attribution").prev("label").addClass("required");
            $(".newBlistContent .licensing #view_attribution").rules("add", {
                required: true,
                messages: { required: " You must specify the data provider (attribution)."}
            });
        }
        else
        {
            $(".newBlistContent .licensing").removeClass("active");
            $(".newBlistContent #licensingCreativeCommons").hide();
            
            $(".newBlistContent .licensing #license_cc_type").rules("remove");
            $(".newBlistContent .licensing #view_attribution").prev("label").removeClass("required");
            $(".newBlistContent .licensing #view_attribution").rules("remove");
        }
    });
    
    // Privacy options
    $(".privacyExpander").click(function(event)
    {
        event.preventDefault();
        $(this).closest("p").next().toggle();
    });
    
    var updatePrivacyText = function()
    {
        var selectedId = $("input[name='privacy']:checked").attr("id");
        $("#privacyDisplayText").text(blist.common.privacyText[selectedId]);
    };
    updatePrivacyText();
    $("input[name='privacy']").change(updatePrivacyText);
    
    // Import/upload
    var $uploadButton = $(".newBlistContent #fileBrowseButton");
    var $clearButton = $(".newBlistContent #fileClearButton");
    var isImport = false;
    var importErrors = false;

    var $uploader = new AjaxUpload($uploadButton, {
        action: $uploadButton.attr('href'),
        autoSubmit: false,
        name: 'importFileInput',
        responseType: 'json',
        onChange: function (file, ext)
        {
            $uploadButton.hide();
            $clearButton.closest("li").removeClass('hide');
            isImport = true;
            $(".newBlistContent #view_file")
                .val(file)
                .removeClass('prompt');
        
            if (!(ext && /^(tsv|csv|xml|xls|xlsx)$/.test(ext)))
            {    
                // replace commented if line if we want to support only certain extensions.
                // if (ext && /(pdf|ext2|ext3)$/.test(ext))
                if (true)
                {
                    $('#uploadMessage')
                        .text('Non-tabular data will not be converted to tabular form.' +
                        '  It will be treated as embedded file.' +
                        ' If you do not wish for this to happen, please choose another file.')
                        .removeClass('uploadErrorMessage hide').addClass('uploadInfoMessage');
                    $uploader._settings.action = $('#fileBrowseButton').attr('href') + '&type=blobby';
                    importErrors = false;
                }
                else
                {
                    $('#uploadMessage')
                        .text('Please choose a CSV, TSV, XML, XLS, or XLSX file.')
                        .removeClass('uploadInfoMessage hide').addClass('uploadErrorMessage');
                    importErrors = true;
                    return false;
                }
            }        
            else
            {
                $uploader._settings.action = $('#fileBrowseButton').attr('href');
                $('#uploadMessage').addClass('hide');
                importErrors = false;
            }             
        },
        onSubmit: function (file, ext)
        {
            $(".submitActions").hide();
            $(".submitPending").show();
            $clearButton.addClass("hide");
        },
        onComplete: function (file, response)
        {
            isImport = false;
            
            if (response.error == true)
            {
                $(".submitActions").show();
                $clearButton.removeClass("hide");
                $('.uploadErrorMessage')
                    .text("Failed to import that file.  " + response.message)
                    .removeClass('hide');
                $(".submitPending").hide();
                return false;
            }
            
            $(".newBlistContent #datasetID").val(response.id);
            $uploader.destroy();
            $("#newDatasetForm").submit();
        }
    });
    
    $clearButton.click(function()
    {
        $('.newBlistContent #view_file')
            .val('Supported Formats: .csv .tsv .xml .xls .xlsx')
            .addClass('prompt');
        $('.newBlistContent #datasetID').val('');
        $('.uploadErrorMessage').addClass('hide');
        var $uploaderClone = new AjaxUpload($uploadButton, jQuery.extend(true, {}, $uploader._settings));
        $uploader.destroy();
        $uploader = $uploaderClone;
        $uploadButton.show();
        $clearButton.closest("li").addClass('hide');
        isImport = false;
    });
    
    // Form Submit
    var formSubmit = function()
    {
        if (isImport || $('#newDatasetForm #view_file').prev("label").hasClass('required'))
        {
            $('#newDatasetForm .prompt').val('');
            validateRequiredFile();
            if ($('#newDatasetForm').valid() && isImport && !importErrors)
            {
                $uploader.submit();
            }
        }
        else
        {
            $('#newDatasetForm').submit();
        }
    };
    $('#newDatasetForm #submitButton').click(function(event)
    {
        event.preventDefault();
        formSubmit();
    });
    $('#newDatasetForm input').keypress(function(event)
    {
        if (event.which == 13)
        {
            formSubmit();
        }
    });
    
    var validateRequiredFile = function()
    {
        if (!isImport)
        {
            $('.uploadErrorMessage')
                .text("You must choose a file to import.")
                .removeClass('hide');
            return false;
        }
        return true;
    };
});