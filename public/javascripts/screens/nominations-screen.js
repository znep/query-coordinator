var nominationsNS = blist.namespace.fetch("blist.nominations");
nominationsNS.servicePath = '/data/nominations';

nominationsNS.changeStatus = function(url, newStatus)
{
    $.ajax({
        type: "PUT",
        url: url, 
        data: $.json.serialize({status: newStatus}),
        contentType: "application/json",
        success: function(response, status) {
            nominationsNS.loadData(nominationsNS.servicePath);
        }
    });
}

nominationsNS.configureEditing = function()
{
    $(".nominationList-row .acceptNomination").click(function(event) {
        event.preventDefault();
        nominationsNS.changeStatus($(this).attr("href"), "approved");
    });
    
    $(".nominationList-row .rejectNomination").click(function(event) {
        event.preventDefault();
        nominationsNS.changeStatus($(this).attr("href"), "rejected");
    });

    $(".nominationList-row .delete").click(function(event) {
        event.preventDefault();
        var $a = $(this);

        $.ajax({
            type: "DELETE",
            url: $a.attr("href"),
            success: function(response, status) {
                $a.closest(".attachmentsTitle").remove();
            }
        });
    });

    $(".nominationList-row .inlineEdit").inlineEdit({
        requestType: "PUT",
        editClickSelector: "span,p",
        displaySelector: "span,p",
        requestContentType: "application/json",
        editCancelSelector: ".close",
        requestDataCallback: function($form, fieldValue) {
            if ($form.hasClass("title"))
            {
                return $.json.serialize({title: fieldValue});
            }
            else if ($form.hasClass("description"))
            {
                return $.json.serialize({description: fieldValue});
            }
        }
    });
};

nominationsNS.configureVoting = function()
{
    $(".nominationList-row").each(function() {
        var previousClick = null;
        var $newRow = $(this);
        $newRow.find(".rateNomination").click(function(event) {
            event.preventDefault();
            $anchor = $(this);

            $.ajax({
                url: $(this).attr("href"),
                type: "POST",
                dataType: "json",
                contentType: "application/json",
                success: function(response, status) {
                    var net = parseInt($newRow.find(".nominationNet").html());
                    var delta = 0;

                    if ($anchor.hasClass("rateUp"))
                    {
                        delta += 1;
                    }
                    else
                    {
                        delta -= 1;
                    }

                    if (previousClick == null)
                    {
                        $newRow.find(".nominationNet").html((net + delta).toString());
                    }
                    else if (delta != previousClick)
                    {
                        $newRow.find(".nominationNet").html((net + delta * 2).toString());
                    }

                    previousClick = delta;
                }
            });
        });
    });
}

nominationsNS.configurePaging = function()
{
    $(".nominationPager a").click(function(event) {
        event.preventDefault();

        nominationsNS.loadData($(this).attr("href"));
    });
};

nominationsNS.loadData = function(url)
{
    // load the data in
    $.ajax({
        url: url,
        success: function(response, status) {
            $(".nominationList-body").children().remove();
            $(".nominationList-body").append(response);
            nominationsNS.configureVoting();
            nominationsNS.configurePaging();
        }
    });
};

$(function() {
    nominationsNS.configureVoting();
    nominationsNS.configurePaging();
    nominationsNS.configureEditing();

    $(".nominationFilter").click(function(event) {
        event.preventDefault();

        nominationsNS.loadData($(this).attr("href"));
    });
});

