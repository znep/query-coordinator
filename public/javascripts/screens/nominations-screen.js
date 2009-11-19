var nominationsNS = blist.namespace.fetch("blist.nominations");
nominationsNS.servicePath = '/data/nominations';

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

    $(".nominationFilter").click(function(event) {
        event.preventDefault();

        nominationsNS.loadData($(this).attr("href"));
    });
});

