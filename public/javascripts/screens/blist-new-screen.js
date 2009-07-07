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
    // Cancel button
    $('.cancelButton a').click(function(event)
    {
        event.preventDefault();
        window.history.back();
    });
    
    // Validation
    $("#newDatasetForm").validate({
        rules: {
            "view[name]": "required",
            "view[attributionLink]": "url"
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
                messages: { required: " You must attribute the dataset."}
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
    var $uploader = new AjaxUpload($uploadButton, {
        action: $uploadButton.attr('href'),
        autoSubmit: true,
        name: 'importFileInput',
        responseType: 'json',
        onChange: function (file, ext)
        {
            if (!(ext && /^(tsv|csv|xml|xls|xlsx)$/.test(ext)))
            {
                $('.uploadErrorMessage')
                    .text('Please choose a CSV, TSV, XML, XLS, or XLSX file.')
                    .removeClass('hide');
                $(".newBlistContent #view_file").val('');
                return false;
            }
            else
            {
                $('.uploadErrorMessage').addClass('hide');
                $(".newBlistContent #view_file").val(file);
            }
        },
        onSubmit: function (file, ext)
        {
            $("#uploadThrobber").show();
            $(".submitActions").hide();
            $(".submitPending").show();
            $uploadButton.hide();
        },
        onComplete: function (file, response)
        {
            $("#uploadThrobber").hide();
            $(".submitActions").show();
            
            if (response.error == true)
            {
                $(".newBlistContent #view_file").val('');
                $('.uploadErrorMessage')
                    .text("Failed to import that file!  " + response.message)
                    .removeClass('hide');
                $(".submitPending").hide();
                $uploadButton.show();
                return false;
            }
            
            $(".submitPending")
                .text("Your data is imported and ready for you.")
                .css("background-image", "none");
            $(".newBlistContent #datasetID").val(response.id);
        }
    });
});