;(function($) {

$.component.Component.extend('Catalog', 'data', {
    _needsOwnContext: true,

    _initDom: function()
    {
        var cObj = this;
        cObj._super.apply(cObj, arguments);
        if (!cObj._$iframe)
        {
            cObj._$iframe = cObj.$contents.children('iframe');
            if (cObj._$iframe.length < 1)
            {
                cObj._$iframe = $.tag({ tagName: 'iframe', frameborder: 0, title: 'Catalog' });
                cObj.$contents.append(cObj._$iframe);
            }
            cObj._$iframe.attr('scrolling', 'no');
            cObj._$iframe.removeAttr('width');
            cObj._$iframe.removeAttr('height');
            cObj._$iframe.width(cObj.$contents.width());
            cObj._$iframe.bind('load', function()
            {
                var h;
                if (this.contentDocument)
                { h = this.contentDocument.body.offsetHeight; }
                else
                { h = this.contentWindow.document.body.scrollHeight; }
                cObj._$iframe.height(h);
            });
        }
    },

    _render: function()
    {
        if (!this._super.apply(this, arguments)) { return false; }

        var props = this._stringSubstitute(this._properties);
        var params = {};
        if (!_.isEmpty(props.defaults)) { $.extend(params, props.defaults); }
        if (!_.isEmpty(props.disabledItems))
        { params.disable = $.arrayToObjKeys(props.disabledItems, true); }
        if (!_.isEmpty(props.disabledSections))
        { params.suppressed_facets = $.arrayToObjKeys(props.disabledSections, true); }
        this._$iframe.attr('src', $.path('/browse/embed?' + $.param(params)));
        return true;
    },

    _arrange: function()
    {
        this._super.apply(this, arguments);
        this._$iframe.width(this.$contents.width());
    }
});

$.component.Container.extend('NewCatalog', 'data', {
    _init: function()
    {
        this._delayUntilVisible = true;

        // Normal object setup
        this._super.apply(this, arguments);
    },

    _getAssets: function()
    {
        return { translations: ['controls.browse', 'core.analytics'] };
    },

    _render: function()
    {
        var cObj = this;
        if (!cObj._super.apply(cObj, arguments)) { return false; }

        // Only need to do the setup once. However, we don't really handle
        // changes...
        if (cObj._setUp) { return; }

        var setDatasetList = function()
        {
            if (!$.subKeyDefined(cObj, '_context.datasetList'))
            { cObj.properties({ context: { id: 'context-' + cObj.id, type: 'datasetList', search: { limit: 20 }, noFail: true } }); }
            var conf = cObj.$contents.find('.dataCarrier').data('catalogconfig') ||
                defaultConfig(cObj._stringSubstitute(cObj._properties), (cObj._context || {}).id ||
                        cObj._properties.context.id);
            cObj.add(conf);
            cObj._setUp = true;
        };

        if (!cObj._updateDataSource(null, setDatasetList))
        { setDatasetList(); }

        return true;
    }
});

var defaultConfig = function(props, dcId)
{
    var disabledSections = {};
    if (!_.isEmpty(props.disabledSections))
    { disabledSections = $.arrayToObjKeys(props.disabledSections, true); }

    var disabledItems = {};
    if (!_.isEmpty(props.disabledItems))
    { disabledItems = $.arrayToObjKeys(props.disabledItems, true); }

    var defaults = props.defaults || {};

    return {
        type: 'HorizontalContainer',
        children: [
        {
            weight: 2,
            type: 'Container',
            htmlClass: 'sidebar',
            children: [
            (disabledItems.sort ? null : { type: 'Sort' }),
            {
                type: 'Search',
                isList: true
            },
            (disabledSections[$.t('controls.browse.facets.view_types_singular_title')] ?
                null :
                {
                    type: 'DatasetListFilter',
                    facet: 'viewTypes'
                }
            ),
            (disabledSections[$.t('controls.browse.facets.categories_singular_title')] ?
                null :
                {
                    type: 'DatasetListFilter',
                    facet: 'categories'
                }
            ),
            (disabledSections[$.t('controls.browse.facets.topics_singular_title')] ?
                null :
                {
                    type: 'DatasetListFilter',
                    facet: 'topics'
                }
            ),
            (disabledSections[$.t('controls.browse.facets.federated_domains_singular_title')] ?
                null :
                {
                    type: 'DatasetListFilter',
                    facet: 'federatedDomains'
                }
            )
            ]
        },
        {
            weight: 8,
            type: 'Container',
            children: [
            (disabledItems.table_header ? null : {
                type: 'HorizontalContainer',
                htmlClass: 'header',
                children: [
                { type: 'FormattedText', markdown: 'Name', weight: 8 },
                { type: 'FormattedText', markdown: 'Popularity', weight: 1 },
                { type: 'FormattedText', markdown: 'RSS', weight: 1 }
                ]
            }),
            {
                type: 'Repeater',
                htmlClass: 'results',
                container: {
                    type: 'MultiPagedContainer',
                    id: 'catalogPagedContainer',
                    pageSize: 10
                },
                noResultsChildren: [
                { type: 'Title', customClass: 'noResults', text: (defaults.no_results_text ||
                    $.t('controls.browse.listing.no_results')) }
                ],
                children: [
                {
                    type: 'HorizontalContainer',
                    htmlClass: 'item {dataset.domainCName /.+/federated/ ||}',
                    children: [
                    {
                        type: 'Container',
                        weight: 8,
                        children: [
                        { type: 'Picture', customClass: 'largeImage',
                            htmlClass: 'datasetImage datasetIcon {dataset.preferredImageType}',
                            url: '{dataset.preferredImage}', alt: '{dataset.name}',
                            ifValue: 'dataset.preferredImage' },
                        { type: 'SafeHtml', customClass: 'largeImage',
                            html: '<div class="datasetIcon type type{dataset.styleClass}" ' +
                            'title="{dataset.displayName $[u]}"><span class="icon"></span></div>',
                            ifValue: { key: 'dataset.preferredImage', negate: true } },
                        { type: 'Picture', customClass: 'domainIcon',
                            url: '/api/domains/{dataset.domainCName}/icons/smallIcon',
                            alt: $.t('controls.browse.listing.federation_source',
                                    { source: '{dataset.domainCName}' }), ifValue: 'dataset.domainCName' },
                        { type: 'Button', notButton: true, customClass: 'datasetLink',
                            external: props.externalLinks,
                            href: '/d/{dataset.id}', text: '{dataset.name ||(unnamed)}' },
                        { type: 'SafeHtml', customClass: 'federationSource',
                            html: $.t('controls.browse.listing.federation_source_html',
                                { source_link: '<a href="https://{dataset.domainCName}">' +
                                    '{dataset.domainCName}</a>' }),
                            ifValue: 'dataset.domainCName' },
                        { type: 'FormattedText', customClass: 'description',
                            markdown: '{dataset.description ||}' }
                        ]
                    },
                    { type: 'FormattedText', weight: 1, customClass: 'views',
                        markdown: '{dataset.viewCount %[,] || 0} ' + $.t('core.analytics.visits') },
                    { type: 'SafeHtml', weight: 1, customClass: 'rss',
                        html: '<a href="/api/views/{dataset.id}/rows.rss" title="' +
                            $.t('controls.browse.actions.dataset_subscribe') + '"><div class="subscribe">' +
                            '<span class="icon"></span></div></a>' }
                    ]
                }
                ]
            },
            {
                type: 'EventConnector',
                sourceContextId: dcId,
                sourceEvent: 'data_change',
                destComponentId: 'catalogPager',
                transformations: [{
                    sourceKey: 'count',
                    destProperty: 'hidden',
                    rules: [
                    { result: true, operator: 'equals', value: 0 },
                    { result: false, operator: 'not_equals', value: 0 }
                    ]
                }]
            },
            (disabledItems.pagination ? null : {
                type: 'Pager',
                id: 'catalogPager',
                pagedContainerId: 'catalogPagedContainer',
                selectorStyle: 'navigate',
                navigateStyle: 'paging',
                navigateWrap: false,
                showFirstLastPageLink: true,
                navigateLinksAsButtons: true
            })
            ]
        }
        ]
    };
};

})(jQuery);
