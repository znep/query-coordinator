;(function(){


this.User = Model.extend({
    _init: function (v)
    {
        this._super();

        $.extend(this, v);

        var selfUrl = '/users/' + this.id;
    },

    isCurrentUser: function()
    {
        return this.id == blist.currentUserId;
    },

    /* TODO: Not used yet
    addFriend: function(user, successCallback, errorCallback)
    {
        this._makeRequest({url: '/contacts.json', type: 'GET',
            data: JSON.stringify({id: user.id}),
            error: errorCallback,
            success: successCallback
        });
    },

    removeFriend: function(user)
    {
        this._makeRequest({url: '/contacts/' + user.id,
            type: 'DELETE'
        });
    },
    */

    getDatasets: function(callback)
    {
        var user = this;
        if ($.isBlank(user._datasets))
        {
            user._makeRequest({url: '/users/' + user.id + '/views.json',
                type: 'GET', pageCache: true, success: function(dss)
                {
                    user._datasets = _.map(dss, function(d)
                        { return new Dataset(d); });
                    callback(user._datasets);
                }});
        }
        else { callback(user._datasets); }
    }
});

})();
