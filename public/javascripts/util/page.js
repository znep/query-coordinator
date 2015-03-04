;(function(){


this.Page = ServerModel.extend({
    _init: function (v)
    {
        this._super();

        $.extend(this, v);
    },

    update: function(newItems)
    {
        if ($.subKeyDefined(newItems, 'path') && newItems.path != this.path)
        {
            this._pathDirty = true;
            this._oldPath = this.path;
        }
        $.extend(this, newItems);
    },

    save: function(successCallback, errorCallback)
    {
        var page = this;
        var type = 'PUT';
        if ($.isBlank(page.uid))
        {
            // Creating a new page; converting from Pages dataset
            delete page.owner;
            delete page.flags;
            page.permission = 'public';
            type = 'POST';
        }

        var finalSuccess = function(resp)
        {
            var flags = {};
            if (page._pathDirty)
            { flags.oldPath = page._oldPath; }
            page.update(resp);
            page._pathDirty = false;
            delete page._oldPath;
            if (_.isFunction(successCallback))
            { successCallback(page, flags); }
        };

        var realSave = function()
        {
            page.makeRequest({ type: type,
                success: function(resp)
                {
                    if (page._pathDirty)
                    {
                        page.makeRequest({ type: 'POST', url: '/api/id/pages',
                            data: JSON.stringify([{ path: page._oldPath, ':deleted': true }]),
                            complete: function()
                            { finalSuccess(resp); }
                        });
                    }
                    else
                    { finalSuccess(resp); }
                },
                error: errorCallback
            });
        };

        if (page._pathDirty)
        {
            // Check if overwrite
            Page.checkUnique(page.path, realSave, function()
            {
                if (_.isFunction(errorCallback))
                { errorCallback({ duplicatePath: true }); }
            });
        }
        else
        { realSave(); }
    },

    saveCopy: function(newProps, successCallback, errorCallback)
    {
        var newPage = $.extend(this.cleanCopy(), newProps);
        _.each(['uid', 'version', 'createdAt', 'updatedAt'], function(p)
            { delete newPage[p]; });

        this.makeRequest({ type: 'POST', data: JSON.stringify(newPage),
            success: function(resp)
            {
                if (_.isFunction(successCallback))
                { successCallback(new Page(resp)); }
            },
            error: errorCallback
        });
    },

    makeRequest: function(req)
    {
        if ($.isBlank(req.url))
        {
            if (req.type == 'POST')
            { req.url = '/api/pages.json'; }
            else if (req.type == 'PUT')
            { req.url = '/api/pages/' + this.uid + '.json'; }
            req.data = req.data || JSON.stringify(this.cleanCopy());
        }
        this._super(req);
    },

    _validKeys: {
        uid: true,
        path: true,
        name: true,
        format: true,
        privateData: true,
        status: true,
        category: true,
        grouping: true,
        version: true,
        permission: true,
        content: true,
        data: true,
        metadata: true,
        cacheInfo: true
    }
});

// Or (id, successCallback, errorCallback)
Page.createFromId = function(newId, oldId, successCallback, errorCallback)
{
    if (_.isFunction(oldId))
    {
        errorCallback = successCallback;
        successCallback = oldId;
        oldId = null;
    }

    $.Tache.Get({
        url: $.isBlank(newId) ? '/api/id/pages.json?path=' + oldId : '/api/pages/' + newId + '.json',
        success: function(page)
        {
            if (_.isArray(page))
            { page = _.first(page); }
            if (_.isFunction(successCallback))
            { successCallback(new Page(page)) }
        },
        error: errorCallback
    });
};

// Or (id, successCallback, errorCallback)
Page.deleteById = function(newId, oldId, successCallback, errorCallback)
{
    if (_.isFunction(oldId))
    {
        errorCallback = successCallback;
        successCallback = oldId;
        oldId = null;
    }

    var callback = _.after(2, successCallback);

    // Have to delete from both new and old service :/
    if (!$.isBlank(newId))
    {
        $.socrataServer.makeRequest({
            type: 'DELETE', url: '/api/pages/' + newId + '.json',
            error: errorCallback, success: callback
        });
    }
    else
    { callback(); }
    if (!$.isBlank(oldId))
    {
        $.socrataServer.makeRequest({
            type: 'POST', url: '/api/id/pages',
            data: JSON.stringify([{ path: oldId, ':deleted': true }]),
            error: function(e) {
              // ignore error if it's a 404, because it means the /api/id/pages dataset does not exist
              if (e.status !== 404) {
                errorCallback();
              } else {
                callback();
              }
            },
            success: callback
        });
    }
    else
    { callback(); }
};

Page.checkUnique = function(path, successCallback, errorCallback)
{
    var doSave = _.after(2, successCallback);
    $.socrataServer.makeRequest({ type: 'GET', cache: false, url: '/api/pages.json?method=isPathAvailable',
        params: { path: path },
        success: function(resp)
        {
            if (resp)
            { doSave(); }
            else
            { errorCallback(); }
        }
    });
    $.socrataServer.makeRequest({ type: 'GET', cache: false, url: '/api/id/pages', isSODA: true,
        params: { path: path },
        success: function(resp)
        {
            if (_.isEmpty(resp))
            { doSave(); }
            else
            { errorCallback(); }
        },
        error: function() { doSave(); }
    });
};

Page.uniquePath = function(title, prefix, successCallback)
{
    if ($.isBlank(title))
    { title = 'unnamed'; }
    if ($.isBlank(prefix))
    { prefix = '/'; }
    if (!prefix.startsWith('/'))
    { prefix = '/' + prefix; }

    var p = prefix + $.urlSafe(title);
    var check = p;
    var i = 1;
    var doCheck = function()
    {
        Page.checkUnique(check, function() { successCallback(check); },
            function()
            {
                check = p + '-' + i;
                i++;
                doCheck();
            });
    };
    doCheck();
};

})();
