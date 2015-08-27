(function($) {
$.component.Component.extend('Comments', 'content', {
    _init: function()
    {
        this._needsOwnContext = true;
        this._delayUntilVisible = true;
        this._super.apply(this, arguments);
    },

    _getAssets: function()
    {
        return {
            javascripts: [{assets: 'inline-login'}, {assets: 'feed-list'}],
            stylesheets: [{assets: 'feed'}],
            templates: ['feed?allow_comments=true'],
            translations: ['controls.feed'] };
    },

    _render: function()
    {
        if (!this._super.apply(this, arguments)) { return false; }

        if (!this._updateDataSource(this._properties, renderUpdate))
        { this.$contents.empty(); }
        return true;
    },

    _propWrite: function(properties)
    {
        this._super.apply(this, arguments);

        this._updateDataSource(properties, renderUpdate);
    }
});

var renderUpdate = function()
{
    var cObj = this;
    var datasets = cObj._getDatasetListFromContext(cObj._dataContext);
    if (datasets.length < 1) { return; }

    var comments = [];
    var numDatasetsToFetch = cObj._properties.hideComments ? 0 : datasets.length;
    var gotComments = _.after(numDatasetsToFetch, function()
    {
        cObj.finishLoading();
        if (!$.isBlank(cObj._feed))
        {
            // TODO: update other options
        }
        else
        {
            cObj.$contents.empty();
            cObj.$contents.addClass('feedList clearfix').append($.renderTemplate('feedList'));

            if (cObj._properties.hideCommenting)
            { cObj.$contents.find('.feedNewCommentButton').remove(); }
            if (cObj._properties.hideReplies)
            { cObj.$contents.find('.feed').addClass('noReplies'); }

            cObj._feed = cObj.$contents.find('.feed').feedList({
                filterCategories: null,
                comments: comments,
                mainView: _.first(datasets),
                views: datasets,
                pageSize: cObj._properties.pageSize || 10,
                hideFeed: cObj._properties.hideComments,
                alwaysShowNewCommentForm: cObj._properties.alwaysShowCommenting
            });
        }
        cObj._updateValidity();
    });
    if (numDatasetsToFetch === 0) {
      gotComments();
    }

    if (cObj._properties.hideComments) { return; }

    cObj.startLoading();
    _.each(datasets, function(ds)
    {
        ds.getComments(function(responseData)
        {
            comments = comments.concat(responseData);
            gotComments();
        });
    });
};
})(jQuery);
