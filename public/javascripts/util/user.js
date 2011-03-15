;(function(){


this.User = Model.extend({
    _init: function (v)
    {
        this._super();

        $.extend(this, v);
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
    },

    getProfileImageUrl: function(size)
    {
        var user = this;
        size = size.toLowerCase();
        return user['profileImageUrl' + size.capitalize()] ||
               '/images/' + size + '-profile.png';
    },

    getProfileUrl: function()
    {
        var user = this;
        return '/profile/' + $.urlSafe(user.displayName) + '/' + user.id;
    }
});

User.createFromUserId = function(id, successCallback, errorCallback)
{
    $.Tache.Get({
        url: '/api/users/' + id + '.json',
        success: function(user)
            {
                if(_.isFunction(successCallback))
                { successCallback(new User(user)) }
            },
        error: errorCallback});
};
})();
