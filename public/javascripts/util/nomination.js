this.Nomination = ServerModel.extend({
    _init: function (n)
    {
        this._super();
        $.extend(this, n);
        this.selfUrl = '/api/nominations/' + n.id;
    },

    addComment: function(comment, callback, errorCallback)
    {
        this.makeRequest({url: this.selfUrl + '/comments.json',
            type: 'POST', data: JSON.stringify(comment),
            success: callback, error: errorCallback});
    },

    remove: function(successCallback, errorCallback)
    {
        var url = this.selfUrl;
        this.makeRequest({url: url + '.json', type: 'DELETE',
          success: successCallback, error: errorCallback});
    },

    removeComment: function(commentId, successCallback, errorCallback)
    {
        this.makeRequest({url: this.selfUrl + '/comments/' + commentId + '.json',
            type: 'DELETE', success: successCallback, error: errorCallback});
    },

    contactOwner: function(message, callback, errorCallback)
    {
        this.makeRequest({url: this.selfUrl + '?method=notifyNominator',
            type: 'POST', data: JSON.stringify(message),
            success: callback, error: errorCallback});
    },

    getComments: function(callback)
    {
        this.makeRequest({url: this.selfUrl + '/comments.json', success: callback});
    },

    flagComment: function(id, successCallback, errorCallback) {
        var nom = this;
        nom.makeRequest({url: nom.selfUrl + '/comments/' + id + '.json',
                type: 'PUT', data: JSON.stringify({ flags: [ 'flag' ] }),
                success: successCallback, error: errorCallback});
    },

    moderate: function(status, successCallback, errorCallback)
    {
        this.makeRequest({url: this.selfUrl, data: JSON.stringify({status: status}),
            type: 'PUT', success: successCallback, error: errorCallback});
    },

    rate: function(isUp, successCallback, errorCallback)
    {
        this.makeRequest({url: this.selfUrl + '/ratings.json?thumbsUp=' + isUp,
            type: 'POST', success: successCallback, error: errorCallback});
    },

    rateComment: function(id, thumbsUp, successCallback, errorCallback) {
         // no-op, should never be called
    },

    save: function(successCallback, errorCallback) {
        var nom = this;
        nom.makeRequest({url: nom.selfUrl, type: 'PUT',
            data: JSON.stringify(nom.cleanCopy()),
            success: successCallback,
            error: errorCallback});
    },

    saveNew: function(attachmentId, successCallback, errorCallback) {
        var nom = this;
        var url = '/api/nominations';
        if (!$.isBlank(attachmentId))
        { url += '?attachmentIds=' + attachmentId; }

        nom.makeRequest({url: url, type: 'POST',
            data: JSON.stringify(nom.cleanCopy()),
            success: successCallback,
            error: errorCallback});
    },

    _validKeys: {
        id: true,
        description: true,
        status: true,
        title: true
    }
});

Nomination.create = function(data, attachmentId, successCallback, errorCallback)
{
    var nomnom = new Nomination(data);
    nomnom.saveNew(attachmentId, successCallback, errorCallback);
    return nomnom;
};
