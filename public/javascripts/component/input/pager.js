;(function() {

$.component.Component.extend('Pager', 'none', {//'input', {
    _needsOwnContext: true,

    // Config options:
    //   - pagedContainerId
    //   - selectorStyle: 'radio' (default), 'navigate', 'buttons'
    //   - buttonStyle: 'pillButtons' (default), 'sidebarTabs'
    //   - navigateStyle: 'none' (default), 'paging'
    //   - navigateWrap: true (default), false
    //   - pagingWindow: positive int (default is 4)
    //   - associatedLabels: hash of id -> label for child components
    //   - associatedIcons: hash of id -> iconClass
    //   - hideButtonText

    isValid: function()
    {
        if ($.isBlank(this._context) && !$.isBlank(this._properties.pagedContainerId))
        { this._setUpBinding(); }
        return !$.isBlank(this._context);
    },

    _setUpBinding: function()
    {
        var cObj = this;
        var adjId = (cObj._properties.parentPrefix || '') + (cObj._properties.pagedContainerId || '');
        if (!$.isBlank(adjId) && ($.isBlank(cObj._context) || cObj._context.id != adjId))
        {
            $.component.globalNotifier.unbind(null, null, cObj);
            $.component.globalNotifier.bind('component_added', function(comp)
            { if (comp.id == adjId) { cObj._render(); } }, cObj);
            $.component.globalNotifier.bind('component_removed', function(comp)
            {
                if (comp.id == adjId)
                {
                    setUpComponent(cObj, null);
                    cObj._render();
                }
            }, cObj);
            setUpComponent(cObj, adjId);
        }
    },

    _initDom: function()
    {
        var cObj = this;
        cObj._super();
        if (!cObj._eventsBound)
        {
            cObj._eventsBound = true;

            cObj.$contents.delegate('.navigateLink', 'click', function(e)
            {
                e.preventDefault();
                var $a = $(this);
                if ($a.hasClass('disabled')) { return; }
                if (cObj.isValid())
                {
                    cObj._context['view' + $.hashHref($a.attr('href'))]
                        (cObj._properties.navigateWrap === false);
                }
            });
            cObj.$contents.delegate('.navigatePaging .pageLink', 'click', function(e)
            {
                e.preventDefault();
                if (cObj.isValid())
                { cObj._context.visibleIndex($.hashHref($(this).attr('href'))); }
            });

            cObj.$contents.delegate('.childLink', 'click', function(e)
            {
                e.preventDefault();
                var $a = $(this);
                if ($a.hasClass('active')) { return; }
                if (cObj.isValid())
                { cObj._context.visibleId($.hashHref($a.attr('href'))); }
            });

            cObj.$contents.delegate('input[type=radio]', 'change', function()
            {
                if (cObj.isValid())
                { cObj._context.visibleId($(this).val()); }
            });
        }
    },

    _render: function()
    {
        var cObj = this;
        cObj._super();
        cObj._setUpBinding();
        cObj.$contents.empty();
        if (cObj.isValid())
        {
            if (cObj._properties.selectorStyle == 'navigate')
            {
                cObj.$contents.append($.tag({tagName: 'a', href: '#Previous',
                    'class': ['navigateLink', 'prevLink'], contents: '&lt; Previous'}));
                if (cObj._properties.navigateStyle == 'paging')
                {
                    cObj.$contents.append($.tag({tagName: 'div', 'class': 'navigatePaging'}));
                }
                else
                {
                    cObj.$contents.append($.tag({tagName: 'div', 'class': 'navigateInfo',
                        contents: [
                            {tagName: 'span', 'class': 'currentItem'},
                            {tagName: 'span', 'class': 'separator', contents: '/'},
                            {tagName: 'span', 'class': 'totalCount'}
                    ]}));
                }
                cObj.$contents.append($.tag({tagName: 'a', href: '#Next',
                    'class': ['navigateLink', 'nextLink'], contents: 'Next &gt;'}));
            }
            else if (cObj._properties.selectorStyle == 'buttons')
            {
                var $ul = $.tag({tagName: 'ul', 'class': ['clearfix',
                    (cObj._properties.buttonStyle || 'pillButtons')]});
                cObj.$contents.append($ul);
                cObj._context.eachPage(function(page)
                {
                    var icon = (cObj._properties.associatedIcons || {})[page.id] ||
                        page.properties().iconClass;
                    var text = ((cObj._properties.associatedLabels || {})[page.id] ||
                        page.properties().label || page.id);
                    $ul.append($.tag({tagName: 'li', contents:
                        {tagName: 'a', href: '#' + page.id, title: text,
                            'class': ['childLink', {value: 'noText',
                                    onlyIf: cObj._properties.hideButtonText === true},
                                {value: icon, onlyIf: !$.isBlank(icon)}],
                        contents: [{value: {tagName: 'span', 'class': 'icon'}, onlyIf: !$.isBlank(icon)},
                            {value: text,
                                onlyIf: cObj._properties.hideButtonText !== true || $.isBlank(icon)}]}}));
                });
            }
            else
            {
                var inputName = cObj.id + '_pager';
                var curId = cObj._context.visibleId();
                cObj._context.eachPage(function(page)
                {
                    var inputId = inputName + '_' + page.id;
                    cObj.$contents.append($.tag({tagName: 'div', 'class': 'radioWrapper',
                        contents: [{tagName: 'input', type: 'radio', checked: page.id == curId,
                            name: inputName, id: inputId, value: page.id},
                        {tagName: 'label', 'for': inputId,
                            contents: (cObj._properties.associatedLabels || {})[page.id] ||
                                page.properties().label || page.id}]}));
                });
                cObj.$contents.find('input').uniform();
            }

            var vId = cObj._context.visibleId();
            if (!$.isBlank(vId)) { adjustIndex(cObj, vId); }
        }
        cObj._updateValidity();
    },

    _propWrite: function(properties)
    {
        this._super.apply(this, arguments);
        if (!_.isEmpty(properties)) { this._render(); }
    }
});

var adjustIndex = function(cObj, newChildId)
{
    var curIndex = cObj._context.visibleIndex();
    var pageCount = cObj._context.countPages();
    var $statusItem;
    var $navLinks;
    if (($navLinks = cObj.$contents.find('.navigateLink')).length > 0)
    {
        $navLinks.filter('.prevLink').toggleClass('disabled',
            cObj._properties.navigateWrap === false && curIndex == 0);
        $navLinks.filter('.nextLink').toggleClass('disabled',
            cObj._properties.navigateWrap === false && curIndex == (pageCount - 1));
    }
    if (($statusItem = cObj.$contents.find('.navigateInfo')).length > 0)
    {
        $statusItem.find('.currentItem').text(curIndex + 1);
        $statusItem.find('.totalCount').text(pageCount);
    }
    else if (($statusItem = cObj.$contents.find('.navigatePaging')).length > 0)
    {
        $statusItem.empty();
        var windowLimit = cObj._properties.pagingWindow || 4;
        var minI = Math.max(0, curIndex - windowLimit);
        var maxI = Math.min(pageCount - 1, curIndex + windowLimit);

        if (minI > 0)
        {
            $statusItem.append($.tag({tagName: 'a', href: '#0', 'class': 'pageLink',
                contents: 1}));
            if (minI > 1)
            {
                $statusItem.append($.tag({tagName: 'span',
                    'class': 'pageFillIn', contents: '&hellip;'}));
            }
        }

        for (var i = minI; i <= maxI; i++)
        {
            if (i == curIndex)
            {
                $statusItem.append($.tag({tagName: 'span', 'class': 'currentPage',
                    contents: i + 1}));
            }
            else
            {
                $statusItem.append($.tag({tagName: 'a', href: '#' + i, 'class': 'pageLink',
                    contents: i + 1}));
            }
        }

        if (maxI < pageCount - 1)
        {
            if (maxI < pageCount - 2)
            {
                $statusItem.append($.tag({tagName: 'span',
                    'class': 'pageFillIn', contents: '&hellip;'}));
            }
            $statusItem.append($.tag({tagName: 'a', href: '#' + (pageCount - 1),
                'class': 'pageLink', contents: pageCount}));
        }
    }
    else if (($statusItem = cObj.$contents.find('.childLink')).length > 0)
    {
        $statusItem.removeClass('active');
        $statusItem.filter('[href$=' + newChildId + ']').addClass('active');
    }
    else
    { $.uniform.update(cObj.$contents.find('input[id$=_' + newChildId + ']').click()); }
};

var setUpComponent = function(cObj, adjId)
{
    if (!$.isBlank(cObj._context))
    { cObj._context.unbind(null, null, cObj); }
    cObj._context = $.component(adjId, cObj._componentSet);
    if (!(cObj._context instanceof $.component.PagedContainer))
    {
        delete cObj._context;
        return;
    }
    cObj._context.bind('page_shown', function(args)
    { adjustIndex(cObj, args.newPage.id); }, cObj);
    cObj._context.bind('page_added', function() { cObj._render(); }, cObj);
    cObj._context.bind('page_removed', function() { cObj._render(); }, cObj);
};

})(jQuery);
