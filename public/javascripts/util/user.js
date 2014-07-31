;(function(){


this.User = ServerModel.extend({
    _init: function (v)
    {
        this._super();

        $.extend(this, v);
    },

    isCurrentUser: function()
    {
        return this.id == blist.currentUserId;
    },

    isMember: function()
    {
        return (this.rights || []).length > 0;
    },

    isAdmin: function()
    { return _.include(this.flags, 'admin'); },

    nameAndOrEmail: function()
    {
        var base = "";
        if (this.displayName)
        {
            base = this.displayName;
        }
        if (this.email)
        {
            if (base == "") { base = this.email; }
            else { base += ' (' + this.email + ')'; }
        }
        return base;
    },

    hasRight: function(right)
    {
        return _.include(this.rights, right);
    },

    /* TODO: Not used yet
    addFriend: function(user, successCallback, errorCallback)
    {
        this.makeRequest({url: '/contacts.json', type: 'GET',
            data: JSON.stringify({id: user.id}),
            error: errorCallback,
            success: successCallback
        });
    },

    removeFriend: function(user)
    {
        this.makeRequest({url: '/contacts/' + user.id,
            type: 'DELETE'
        });
    },
    */

    getDatasets: function(callback)
    {
        var user = this;
        if ($.isBlank(user._datasets))
        {
            user.makeRequest({url: '/users/' + user.id + '/views.json',
                type: 'GET', cache: false, pageCache: true, success: function(dss)
                {
                    user._datasets = _.map(dss, function(d)
                        { return new Dataset(d); });
                    callback(user._datasets);
                }});
        }
        else { callback(user._datasets); }
    },

    addEmailInterest: function(tag, info, callback)
    {
        var user = this;
        user.makeRequest({url: '/users/' + user.id + '/email_interests.json',
            data: JSON.stringify({eventTag: tag.toUpperCase(), extraInfo: info}),
            type: 'POST', success: callback });
    },

    getEmailInterest: function(tag, info, callback)
    {
        var user = this;
        user.makeRequest({url: '/users/' + user.id + '/email_interests/' + tag.toUpperCase(),
            params: { extraInfo: info },
            type: 'GET', cache: false, pageCache: true, success: callback });
    },

    removeEmailInterest: function(tag, info, callback)
    {
        var user = this;
        user.makeRequest({url: '/users/' + user.id + '/email_interests/' + tag.toUpperCase(),
            params: { extraInfo: info },
            type: 'DELETE', pageCache: false, success: callback });
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
        return $.path('/profile/' + $.urlSafe(user.displayName || '-') + '/' + user.id);
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
