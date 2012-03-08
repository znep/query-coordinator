(function(){

// Global so that batches work together
var batchRequests = [];

var ServerModel = Model.extend({
    _init: function ()
    {
        this._super();

        this.registerEvent(['request_start', 'request_status', 'request_finish']);
        this._reqCount = 0;

        // Assume WEBSITE unless set otherwise
        this.accessType = 'WEBSITE';
    },

    setAccessType: function(accessType)
    {
        this.accessType = accessType;
    },

    makeRequest: function(req)
    {
        var model = this;
        var isCache = req.pageCache;
        var finishCallback = function(callback)
        {
            return function(d, ts, xhr)
            {
                var s = (xhr || {}).status;
                // Support retry responses from core server
                if (s == 202)
                {
                    var retryTime = req.retryTime || 5000;
                    model.trigger('request_status', [((d || {}).details || {}).message ||
                        'Our servers are still processing this request. Please be patient while it finishes.',
                        retryTime / 1000]);

                    if (_.isFunction(req.pending)) { req.pending.apply(this, arguments); }

                    if (!$.isBlank(d) && !_.isUndefined(d.ticket))
                    {
                        // we have a ticket id, which means subsequent requests should
                        // be a little different
                        req = $.extend(true, {}, req);
                        req.type = 'get';

                        var origData = req.data;
                        req.data = { ticket: d.ticket };

                        if (!$.isBlank(origData) && !_.isUndefined(origData.method))
                            req.data = origData.method;
                    }

                    setTimeout(function() { isCache ? $.Tache.Get(req) : $.ajax(req); }, retryTime);
                    return;
                }
                else if (s >= 500 && s < 600)
                { throw new Error('There was a problem with our servers'); }

                model._finishRequest();
                if (_.isFunction(callback)) { callback.apply(this, arguments); }
            };
        };

        model._startRequest();
        req = $.extend({contentType: 'application/json', dataType: 'json'}, req,
                {error: finishCallback(req.error),
                success: finishCallback(req.success)});

        if (!$.isBlank(model.accessType))
        { req.params = $.extend({accessType: model.accessType}, req.params); }
        else { $.debug('making call without accessType!', req); }

        if (!$.isBlank(req.params))
        {
             req.url += (req.url.indexOf('?') >= 0 ? '&' : '?') +
                $.param(req.params);
        }

        // We never want the browser cache, because our data can change frequently
        if ($.isBlank(req.type) || req.type.toLowerCase() == 'get')
        { req.cache = false; }

        var cleanReq = function()
        {
            delete req.batch;
            delete req.pageCache;
            delete req.params;
        };

        if (req.pageCache)
        {
            cleanReq();
            $.Tache.Get(req);
        }
        else if (req.batch)
        {
            cleanReq();
            batchRequests.push(req);
        }
        else
        {
            cleanReq();
            $.ajax(req);
        }
    },

    sendBatch: function(successCallback, errorCallback, completeCallback)
    {
        var model = this;
        if (batchRequests.length < 1)
        {
            if (_.isFunction(successCallback)) { successCallback(); }
            return;
        }

        if (batchRequests.length == 1)
        {
            var origBR = batchRequests.shift();
            $.ajax($.extend({}, origBR, {
                complete: function()
                {
                    if (_.isFunction(origBR.complete)) { origBR.complete(); }
                    if (_.isFunction(completeCallback)) { completeCallback(); }
                },
                error: function(xhr)
                {
                    var errBody = JSON.parse(xhr.responseText);
                    if (_.isFunction(origBR.error)) { origBR.error(errBody.message); }
                    if (_.isFunction(errorCallback)) { errorCallback(); }
                },
                success: function(resp)
                {
                    if (_.isFunction(origBR.success)) { origBR.success(resp); }
                    if (_.isFunction(successCallback)) { successCallback(); }
                }}));
            return;
        }

        var serverReqs = [];
        var br = batchRequests;
        batchRequests = [];
        _.each(br, function(r)
            { serverReqs.push({url: r.url, requestType: r.type, body: r.data}); });

        $.ajax({url: '/api/batches', dataType: 'json', contentType: 'application/json',
                type: 'POST', data: JSON.stringify({requests: serverReqs}),
                success: function(resp)
                {
                    var isError = false;
                    _.each(resp, function(r, i)
                    {
                        if (r.error)
                        {
                            isError = true;
                            if (_.isFunction(br[i].error))
                            { br[i].error(r.errorMessage); }
                        }
                        else if (_.isFunction(br[i].success))
                        {
                            br[i].success(JSON.parse(r.response || '""'));
                        }
                    });

                    if (isError)
                    {
                        if (_.isFunction(errorCallback)) { errorCallback(); }
                    }
                    else
                    {
                        if (_.isFunction(successCallback)) { successCallback(); }
                    }
                },
                complete: function()
                {
                    _.each(br, function(r)
                    {
                        if (_.isFunction(r.complete)) { r.complete(); }
                    });

                    if (_.isFunction(completeCallback)) { completeCallback(); }
                },
                error: function(xhr)
                {
                    var errBody = JSON.parse(xhr.responseText);
                    _.each(br, function(r)
                    {
                        if (_.isFunction(r.error)) { r.error(errBody.message); }
                    });

                    if (_.isFunction(errorCallback)) { errorCallback(); }
                }});
    },

    _startRequest: function()
    {
        if (this._reqCount < 1) { this.trigger('request_start'); }
        this._reqCount++;
    },

    _finishRequest: function()
    {
        this._reqCount--;
        if (this._reqCount < 1) { this.trigger('request_finish'); }
    }
});

if (blist.inBrowser)
{
    this.ServerModel = ServerModel;
    $.socrataServer = new ServerModel();
}
else
{
    module.exports = ServerModel;
}

})();
