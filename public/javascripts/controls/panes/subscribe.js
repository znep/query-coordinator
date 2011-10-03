(function($)
{
    $.Control.extend('pane_subscribe', {
        getTitle: function()
        { return 'Subscribe'; },

        getSubtitle: function()
        { return 'Subscribe to this dataset to stay up to date'; },

        isAvailable: function()
        {
            return this._view.isPublic() && this._view.valid &&
                (!this._view.temporary || this._view.minorChange);
        },

        getDisabledSubtitle: function()
        {
            return !this._view.valid ||
                (this._view.temporary && !this._view.minorChange) ?
                'This view must be valid and saved' :
                this._view.isGrid() ?
                    'This view must be public before it can be subscribed to' :
                    'Only tabular data may be subscribed to';
        },

        _getSections: function()
        {
            var cpObj = this;
            return [
                {
                    customContent: {
                        template: 'subscribeContent',
                        directive: {
                            '.feedItem': {
                                'feedLink <- ': {
                                    '@class+': 'feedLink.itemClass',
                                    'a@href': function(e)
                                        { return e.item.url + cpObj._view.apiUrl + '/rows.rss'; },
                                    'a@class+': 'feedLink.name',
                                    '.text': 'feedLink.text',
                                    '.badge@src': 'feedLink.img',
                                    '.badge@alt': 'feedLink.name',
                                    '.badge@class+': 'feedLink.imgClass'
                                }
                            }
                        },
                        data: [
                            {name: 'Google', url: 'http://fusion.google.com/add?feedurl=',
                                img: 'http://buttons.googlesyndication.com/fusion/add.gif'},
                            {name: 'Yahoo', url: 'http://add.my.yahoo.com/rss?url=',
                                img: 'http://us.i1.yimg.com/us.yimg.com/i/us/my/addtomyyahoo4.gif'},
                            {name: 'Bloglines', url: 'http://www.bloglines.com/sub/',
                                img: 'http://www.bloglines.com/images/sub_modern5.gif'},
                            {name: 'NewsGator',
                                url: 'http://www.newsgator.com/ngs/subscriber/subext.aspx?url=',
                                img: 'http://www.newsgator.com/images/ngsub1.gif'},
                            {name: 'Netvibes', url: 'http://www.netvibes.com/subscribe.php?url=',
                                img: 'http://www.netvibes.com/img/add2netvibes.gif'},
                            {name: 'Pageflakes', url: 'http://www.pageflakes.com/subscribe.aspx?url=',
                                img: 'http://www.pageflakes.com/subscribe2.gif'},
                            {name: 'subscribe', url: '', img: '', imgClass: 'hide',
                                text: '<span class="icon"></span>Download as RSS', itemClass: 'separated'},
                            {name: 'other', url: 'feed:', itemClass: 'separated',
                                img: '', imgClass: 'hide', text: 'Open in External Program'}
                        ]
                    }
                }
            ];
        },

        _getFinishButtons: function()
        { return [$.controlPane.buttons.done]; }

    }, {name: 'subscribe', noReset: true}, 'controlPane');

    if ($.isBlank(blist.sidebarHidden.exportSection) || !blist.sidebarHidden.exportSection.subscribe)
    { $.gridSidebar.registerConfig('export.subscribe', 'pane_subscribe', 6); }

})(jQuery);
