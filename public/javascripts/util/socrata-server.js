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

    makeRequestWithPromise: function(req) {
        var deferred = $.Deferred();
        var successEvent = $.Callbacks();
        var errorEvent = $.Callbacks();

        this.makeRequest($.extend({}, req, {
            success: function() {
                deferred.resolveWith(this, arguments);
            },
            error: function() {
                deferred.rejectWith(this, arguments);
            }
        }));

        return deferred.promise();
    },

    makeRequest: function(req)
    {
        var model = this;
        var isCache = req.pageCache;

        var finishCallback = function(isSuccess, callback, allCompleteCallback)
        {
            return function(dataset, statusMsg, xhr)
            {
                // In jquery 1.7.1, error callback has different argument position than success callback
                // The first argument is xhr in error case.
                // For historical compatibility, we hack the status code only instead of swapping the arguments.
                var statusCode = ((isSuccess ? xhr : arguments[0]) || {}).status;

                // Support retry responses from core server
                if (statusCode == 202)
                {
                    var retryTime = req.retryTime || 5000;
                    model.trigger('request_status', [((dataset || {}).details || {}).message ||
                        'Our servers are still processing this request. Please be patient while it finishes.',
                        retryTime / 1000]);

                    if (_.isFunction(req.pending)) { req.pending.apply(this, arguments); }

                    if (!$.isBlank(dataset) && !_.isUndefined(dataset.ticket))
                    {
                        // we have a ticket id, which means subsequent requests should
                        // be a little different
                        req = $.extend(true, {}, req);
                        req.type = 'get';

                        var origData = req.data;
                        req.data = { ticket: dataset.ticket };

                        if (!$.isBlank(origData) && !_.isUndefined(origData.method))
                            req.data = origData.method;
                    }

                    setTimeout(function() { isCache ? $.Tache.Get(req) : $.ajax(req); }, retryTime);
                    return;
                }
                else if (statusCode >= 500 && statusCode < 600)
                {
                  model._finishRequest();
                  throw new Error('There was a problem with our servers');
                }

                // TODO This is a terrible hack to serve until code in the Rails backend is settled
                // TODO This doesn't handle filtered views, which could depend on OoD datasets
                if (model.displayName === 'dataset' || model.displayName === 'working copy') {
                    model._captureSodaServerHeaders(xhr);
                }
                model._finishRequest();
                if (_.isFunction(allCompleteCallback)) { allCompleteCallback.apply(this, arguments); }
                if (_.isFunction(callback)) { callback.apply(this, arguments); }
            };
        };

        model._startRequest();
        req = $.extend({contentType: 'application/json', dataType: 'json'}, req,
                {error: finishCallback(false, req.error, req.allComplete),
                success: finishCallback(true, req.success, req.allComplete)});

        // Guess SODA can't handle accessType
        if (!req.isSODA)
        {
            if (!$.isBlank(model.accessType))
            { req.params = $.extend({accessType: model.accessType}, req.params); }
            else { $.debug('making call without accessType!', req); }
        }

        if (!$.isBlank(req.params))
        {
             req.url += (req.url.indexOf('?') >= 0 ? '&' : '?') +
                $.param(req.params);
        }

        var cleanReq = function()
        {
            delete req.batch;
            delete req.pageCache;
            delete req.params;
            delete req.isSODA;
            delete req.anonymous;
        };

        if (req.anonymous)
        {
            req.headers = $.extend(req.headers, {'X-Socrata-Auth': 'unauthenticated'});
        }

        if (req.pageCache)
        {
            cleanReq();
            $.Tache.Get(req);
        }
        else if (req.batch || ServerModel._inBatch)
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

ServerModel.startBatch = function()
{
    ServerModel._inBatch = true;
};

ServerModel.sendBatch = function(successCallback, errorCallback, completeCallback)
{
    ServerModel._inBatch = false;
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
                if (_.isFunction(errorCallback)) { errorCallback(errBody.message); }
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

    // Need to divide out requests by headers
    var extraBatch = [];
    var matchHeaders = br[0].headers || {};
    br = _.reject(br, function(r)
    {
        if (_.isEmpty(matchHeaders) && _.isEmpty(r.headers) || _.isEqual(matchHeaders, r.headers))
        {
            return false;
        }
        else
        {
            extraBatch.push(r);
            return true;
        }
    });

    var doSuccess = _.after(extraBatch.length > 0 ? 2 : 1, function()
            { if (_.isFunction(successCallback)) { successCallback(); } });
    var doComplete = _.after(extraBatch.length > 0 ? 2 : 1, function()
            { if (_.isFunction(completeCallback)) { completeCallback(); } });

    _.each(br, function(r)
        { serverReqs.push({url: r.url, requestType: r.type, body: r.data}); });

    $.ajax({url: '/api/batches', dataType: 'json', contentType: 'application/json', headers: matchHeaders,
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
                { doSuccess(); }
            },
            complete: function()
            {
                _.each(br, function(r)
                {
                    if (_.isFunction(r.complete)) { r.complete(); }
                });

                doComplete();
            },
            error: function(xhr)
            {
                var errBody = JSON.parse(xhr.responseText);
                _.each(br, function(r)
                {
                    if (_.isFunction(r.error)) { r.error(errBody.message); }
                });

                if (_.isFunction(errorCallback)) { errorCallback(errBody.message); }
            }});

    if (extraBatch.length > 0)
    {
        batchRequests = batchRequests.concat(extraBatch);
        ServerModel.sendBatch(doSuccess, errorCallback, doComplete);
    }
};

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
