$(function ()
{
    $.socrataServer = $.socrataServer || {};

    var batchRequests = [];
    $.socrataServer.addRequest = function(req)
    { batchRequests.push(req); };

    $.socrataServer.runRequests = function(callbacks)
    {
        if (batchRequests.length < 1) { return false; }

        callbacks = callbacks || {};
        if (batchRequests.length == 1)
        {
            var origBR = batchRequests.shift();
            $.ajax($.extend({}, origBR,
                { dataType: 'json', contentType: 'application/json',
                complete: function()
                {
                    if (typeof origBR.complete == 'function')
                    { origBR.complete(); }
                    if (typeof callbacks.complete == 'function')
                    { callbacks.complete(); }
                },
                error: function(xhr)
                {
                    var errBody = JSON.parse(xhr.responseText);
                    if (typeof origBR.error == 'function')
                    { origBR.error(errBody.message); }
                    if (typeof callbacks.error == 'function')
                    { callbacks.error(); }
                },
                success: function(resp)
                {
                    if (typeof origBR.success == 'function')
                    { origBR.success(resp); }
                    if (typeof callbacks.success == 'function')
                    { callbacks.success(); }
                }}));
            return true;
        }

        var serverReqs = [];
        var br = batchRequests;
        batchRequests = [];
        $.each(br, function(i, r)
            { serverReqs.push({url: r.url,
                requestType: r.type, body: r.data}); });

        $.ajax({url: '/batches',
                dataType: 'json', contentType: 'application/json',
                type: 'POST',
                data: JSON.stringify({requests: serverReqs}),
                success: function(resp)
                {
                    var isError = false;
                    $.each(resp, function(i, r)
                    {
                        if (r.error)
                        {
                            isError = true;
                            if (typeof br[i].error == 'function')
                            { br[i].error(r.errorMessage); }
                        }
                        else if (typeof br[i].success == 'function')
                        {
                            br[i].success(JSON.parse(r.response));
                        }
                    });

                    if (isError)
                    {
                        if (typeof callbacks.error == 'function')
                        { callbacks.error(); }
                    }
                    else
                    {
                        if (typeof callbacks.success == 'function')
                        { callbacks.success(); }
                    }
                },
                complete: function()
                {
                    $.each(br, function(i, r)
                    {
                        if (typeof r.complete == 'function') { r.complete(); }
                    });

                    if (typeof callbacks.complete == 'function')
                    { callbacks.complete(); }
                },
                error: function(xhr)
                {
                    var errBody = JSON.parse(xhr.responseText);
                    $.each(br, function(i, r)
                    {
                        if (typeof r.error == 'function')
                        { r.error(errBody.message); }
                    });

                    if (typeof callbacks.error == 'function')
                    { callbacks.error(); }
                }});

        return true;
    };
});
