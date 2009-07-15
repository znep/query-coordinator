$(function ()
{
    $(".outerContent").blistStretchWindow();
    
    // Wire up sidebar menus
    $('#shareMenu').dropdownMenu({triggerButton: $('#shareLink')});
    $('#downloadMenu').dropdownMenu({triggerButton: $('#downloadLink')});
    
    // Wire up name edit form
    $('.editName').click(function(event)
    {
        event.preventDefault();
        $('.dataName').hide();
        $('.editName').hide();
        $('.editNameForm').show();
    });
    
    $('.editNameCancelButton').click(function(event)
    {
        event.preventDefault();
        $('.dataName').show();
        $('.editName').show();
        $('.editNameForm').hide();
    });
    
    $('.editNameSubmitButton').click(function(event)
    {
        event.preventDefault();
        var $form = $('.editNameForm form');
        $.ajax({
            url: $form.attr("action"),
            type: "PUT",
            data: $form.find(":input"),
            dataType: "json",
            success: function(responseData)
            {
                var viewHref = 'http://'
                    + location.host + '/'
                    + (responseData['category'] || 'dataset') + '/'
                    + responseData['name'].replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_\-]/g, '-')
                        .replace(/\-+/g, '-').slice(0, 50) + '/'
                    + responseData['id'];
                $('.dataName a, .linkToDataset, .linkAndTextToDataset')
                    .attr('href', viewHref);
                $('.dataName a').text(responseData['name']);
                $('.linkAndTextToDataset').text(viewHref);
                $('.permalinkField embed').attr('flashvars', 'text=' + viewHref);
                $('.permalinkField object param[name=FlashVars]').remove();

                $('.dataName').show();
                $('.editName').show();
                $('.editNameForm').hide();
            }
        });
    });
    
    // Wire up general information edit form
    $('.editGeneral').click(function(event)
    {
        event.preventDefault();
        $('.dataGeneral').slideUp("normal");
        $('.editGeneralForm').slideDown("normal");
    });
    
    $('.closeGeneral').click(function(event)
    {
        event.preventDefault();
        $('.dataGeneral').slideDown("normal");
        $('.editGeneralForm').slideUp("normal");
    });
    
    $('#attributionEditSubmitButton').click(function()
    {
        var $form = $('.editGeneralForm form');
        $.ajax({
            url: $form.attr("action"),
            type: "PUT",
            data: $form.find(":input"),
            dataType: "json",
            success: function(responseData)
            {
                // Capitalize the category name
                var category = responseData['category'];
                category = category.charAt(0).toUpperCase() + category.slice(1);

                $('.categoryField').text(category);
                if (responseData['tags'])
                {
                    $('.tagsField').text(responseData['tags'].join(', '));
                }
                else
                {
                    $('.tagsField').empty();
                }
                $('.descriptionField').text(responseData['description']);
                $('.dataGeneral').slideDown("normal");
                $('.editGeneralForm').slideUp("normal");
            }
        });
    });

    // Wire up attribution edit widget
    $('.attributionEdit').attributionEdit({
        closeButton: $('.closeAttribution'),
        triggerButton: $('.editAttribution'),
        attributionInfoSelector: '.attributionSource',
        licensingInfoSelector: '.licenseName',
        successCallback: function(responseData, opts)
        {
            if (responseData['error'] == 'Validation failed')
            {
                var $label = $('div.itemContent>div:has(#view_attributionLink) label');
                if ($label.length == 0)
                {
                    $label = $('<label/>').addClass("error");
                }
                $label
                    .text("That does not appear to be a valid url.")
                    .insertAfter($("#view_attributionLink"));

                return;
            }
            
            if (responseData['license'])
            {
                if (responseData['license']['logoUrl'])
                {
                    $(opts.licensingInfoSelector).empty().append(
                        $('<a/>').attr('href', responseData['license']['termsLink']).append(
                            $('<img/>')
                                .attr('src', '/' + responseData['license']['logoUrl'])
                                .attr('alt', responseData['license']['name'])));
                }
                else
                {
                    $(opts.licensingInfoSelector)
                        .empty()
                        .text(responseData['license']['name']);
                }
            }
            else
            {
                $(opts.licensingInfoSelector).empty().text('No License');
            }

            if (responseData['attribution'])
            {
                $(opts.attributionInfoSelector).text(responseData['attribution']);
            }
            else
            {
                $(opts.attributionInfoSelector).empty();
            }

            if (responseData['attributionLink'])
            {
                $('.attributionSourceLink').empty().append(
                    $('<a/>')
                        .attr('href', responseData['attributionLink'])
                        .text(responseData['attributionLink']));
            }
            else
            {
                $('.attributionSourceLink').empty();
            }

            $('.attributionEdit').hide();
            $(opts.attributionContainerSelector).show();
        }});
});