(function($) {

$.component.Component.extend('Search', 'none', {//'input', {
    _initDom: function()
    {
        var cObj = this;
        cObj._super.apply(cObj, arguments);

        if ($.isBlank(cObj.$input))
        {
            cObj.$input = cObj.$contents.find(':text');
            if (cObj.$input.length < 1)
            {
                cObj.$contents.children('form').remove();
                var boxId = cObj.id + '_searchBox';
                cObj.$contents.append($.tag({ tagName: 'form', action: '#', 'class': 'searchForm',
                    contents: [ { tagName: 'div', 'class': ['searchBoxContainer',
                        'hasSearchIcon', 'hasClearButton'], contents: [
                        { tagName: 'a', href: '#search', 'class': 'searchIcon' },
                        { tagName: 'label', 'for': boxId, 'class': 'accessible', contents: 'Search text' },
                        { tagName: 'input', type: 'text', id: boxId,
                            'class': ['searchField', 'textPrompt'] },
                        { tagName: 'a', href: '#clear', 'class': ['clearSearch', 'close', 'hide'],
                            contents: { tagName: 'span', 'class': 'icon' } }
                    ] },
                    { tagName: 'input', type: 'submit', 'class': ['searchButton', 'button', 'hide'] }
                    ]
                }));

                cObj.$input = cObj.$contents.find(':text');
            }
            cObj.$searchIcon = cObj.$contents.find('.searchIcon');
            cObj.$searchButton = cObj.$contents.find('.searchButton');
            cObj.$clearButton = cObj.$contents.find('.clearSearch');

            cObj.$contents.find('form').submit(function(e)
            {
                e.preventDefault();
                handleSearch(cObj);
            });

            cObj.$searchIcon.click(function(e)
            {
                e.preventDefault();
                handleSearch(cObj);
            });

            cObj.$clearButton.click(function (e)
            {
                e.preventDefault();
                cObj.$input.focus().val('').blur();
                handleSearch(cObj);
            });

            // massage search params
            cObj.$contents.find('form').submit(function()
            {
                if (cObj.$input.val() == 'snuffleupadata')
                {
                    _.times(20, function()
                    {
                        setTimeout(function()
                        {
                            $('<img src="/images/snuffleupadata.gif"/>')
                                .appendTo($('body'))
                                .css('position', 'absolute')
                                .css('zindex', '9999')
                                .css('left', '-48px')
                                .css('top', Math.random() * $(window).height())
                                .animate({left: $(window).width() + 48}, 'slow',
                                    function() { $(this).remove(); });
                        }, Math.random() * 4000);
                    });
                }
            });
        }
    },

    _render: function()
    {
        var cObj = this;
        if (!cObj._super.apply(cObj, arguments)) { return false; }

        if (!cObj._updateDataSource(null, renderUpdate))
        { renderUpdate.apply(cObj); }

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

    var dsList = cObj._getDatasetListFromContext(cObj._dataContext);
    if (!_.isEqual(cObj._dsList, dsList))
    {
        _.each(cObj._dsList, function(ds) { ds.unbind(null, null, cObj); });
        cObj._dsList = dsList;
        _.each(cObj._dsList, function(ds)
        { ds.bind('clear_temporary', function() { renderUpdate.apply(cObj); }, cObj); });
    }

    // prompts
    cObj.$searchIcon.attr('title', cObj._stringSubstitute(cObj._properties.iconPrompt || 'Find'));
    cObj.$input.example(cObj._stringSubstitute(cObj._properties.searchPrompt || 'Find'));
    cObj.$searchButton.val(cObj._stringSubstitute(cObj._properties.buttonText || 'Find'));
    cObj.$clearButton.attr('title', cObj._stringSubstitute(cObj._properties.clearPrompt || 'Clear'));

    // set value only if it agrees  across all datasets
    var curVal = _.reduce(cObj._getDatasetListFromContext(cObj._dataContext), function(memo, ds)
        { return _.isNull(memo) || ds.searcString == memo ? ds.searchString : ''; }, null);
    cObj.$input.focus().val(curVal).blur();

    // show/hide
    cObj.$searchIcon.toggleClass('hide', !!cObj._properties.hideSearchIcon);
    cObj.$clearButton.toggleClass('hide', cObj.$input.hasClass('prompt') || $.isBlank(cObj.$input.val()) ||
            !!cObj._properties.hideClearButton);
    cObj.$searchButton.toggleClass('hide', !cObj._properties.showSearchButton);
    cObj.$contents.find('.searchBoxContainer')
        .toggleClass('hasSearchIcon', !cObj._properties.hideSearchIcon)
        .toggleClass('hasClearButton', !cObj._properties.hideClearButton);
};

var handleSearch = function(cObj)
{
    var q = cObj.$input.val();
    if (cObj.$input.hasClass('prompt') || $.isBlank(q))
    { q = ''; }
    cObj.$clearButton.toggleClass('hide', $.isBlank(q) || !!cObj._properties.hideClearButton);

    _.each(cObj._dsList, function(ds)
    { ds.update({ searchString: q }); });
};
})(jQuery);
