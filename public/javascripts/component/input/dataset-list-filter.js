;(function($) {

$.component.Component.extend('DatasetListFilter', 'none', {//'input', {
    _needsOwnContext: true,

    _initDom: function()
    {
        var cObj = this;
        this._super.apply(this, arguments);

        if ($.isBlank(cObj.$title))
        {
            cObj.$title = cObj.$contents.find('.title');
            if (cObj.$title.length < 1)
            {
                cObj.$title = $.tag2({ _: 'div', className: 'title' });
                cObj.$contents.append(cObj.$title);
            }
        }

        if ($.isBlank(cObj.$listSection))
        {
            cObj.$listSection = cObj.$contents.find('.listSection');
            if (cObj.$listSection.length < 1)
            {
                cObj.$listSection = $.tag2({ _: 'ul', className: 'listSection' });
                cObj.$contents.append(cObj.$listSection);
            }
            cObj._existingData = cObj.$listSection.data('jsdata') || {};

            cObj.$listSection.on('click', 'a', function(e) { filterClick(cObj, e); });
        }

        if ($.isBlank(cObj.$dialog))
        {
            var dialogId = 'browseDialog_' + cObj.id;
            cObj.$dialog = $.tag2({ _: 'div', id: dialogId,
                className: ['socrataDialog', 'listFilterDialog'],
                contents: [ { _: 'a', href: '#close', className: ['jqmClose', 'cornerClose'], contents: 'Close' },
                    { _: 'div', className: 'optionsContent' } ] });
            $('#newModals').append(cObj.$dialog);

            $(window).on('click', '#' + dialogId + ' .optionsContent a', function(e)
            {
                filterClick(cObj, e);
                $.popModal();
            });
        }
    },

    _getAssets: function()
    {
        return { javascripts: [ { assets: 'tagcloud' } ], translations: ['controls.browse'] };
    },

    _assetsAvailable: function()
    {
        this._super.apply(this, arguments);
        if (this._rendered)
        { interactiveSetup.apply(this); }
    },

    _render: function()
    {
        var isServerRendered = this.$dom.hasClass('serverRendered');
        if (!this._super.apply(this, arguments))
        {
            if (isServerRendered)
            {
                if (!this._updateDataSource(null, interactiveSetup))
                { interactiveSetup.apply(this); }
            }
            return false;
        }

        if (!this._updateDataSource(null, renderUpdate))
        { renderUpdate.apply(this); }
    },

    _propWrite: function(properties)
    {
        this._super.apply(this, arguments);

        this._updateDataSource(properties, renderUpdate);
    }
});

var listOptions = {
    viewTypes: {
        translation: 'controls.browse.facets.view_types_title',
        catalogKey: 'view_type',
        useIcons: true,
        items: function(callback, cObj)
        {
            var i = [
                { translation: 'controls.browse.facets.view_types.datasets', value: 'datasets',
                    className: 'typeBlist' },
                { translation: 'controls.browse.facets.view_types.charts', value: 'charts',
                    className: 'typeChart' },
                { translation: 'controls.browse.facets.view_types.maps', value: 'maps',
                    className: 'typeMap'} ,
                { translation: 'controls.browse.facets.view_types.calendars', value: 'calendars',
                    className: 'typeCalendar' },
                { translation: 'controls.browse.facets.view_types.filters', value: 'filters',
                    className: 'typeFilter' },
                { translation: 'controls.browse.facets.view_types.href', value: 'href',
                    className: 'typeHref' },
                { translation: 'controls.browse.facets.view_types.blob', value: 'blob',
                    className: 'typeBlob' },
                { translation: 'controls.browse.facets.view_types.forms', value: 'forms',
                    className: 'typeForm' }
            ];
            var apiItem = { translation: 'controls.browse.facets.view_types.apis', value: 'apis',
                className: 'typeApi' };
            if ($.subKeyDefined(cObj, '_existingData.hasApi'))
            {
                if (cObj._existingData.hasApi)
                { i.push(apiItem); }
                callback(i);
            }
            else
            {
                $.socrataServer.makeRequest({ type: 'GET', url: '/browse/domain_info.json', pageCache: true,
                    success: function(d)
                    {
                        if (d.hasApi)
                        { i.push(apiItem); }
                        callback(i);
                    } });
            }
        },
        updateFilter: function(obj, value)
        {
            delete obj.publication_stage;
            delete obj.datasetView;
            switch (value)
            {
                case 'unpublished':
                    obj.limitTo = 'tables';
                    obj.datasetView = 'dataset';
                    obj.publication_stage = 'unpublished';
                    break;
                case 'datasets':
                    obj.limitTo = 'tables';
                    obj.datasetView = 'dataset';
                    break;
                case 'filters':
                    obj.limitTo = 'tables';
                    obj.datasetView = 'view';
                    break;
                default:
                    obj.limitTo = value;
                    break;
            }
        },
        clearFilter: function(obj)
        {
            delete obj.publication_stage;
            delete obj.datasetView;
            delete obj.limitTo;
        },
        // Based on the config, return the currently-selected value
        currentValue: function(obj)
        {
            if (obj.publication_stage == 'unpublished')
            { return 'unpublished'; }
            if (obj.datasetView == 'dataset')
            { return 'datasets'; }
            if (obj.datasetView == 'view')
            { return 'filters'; }
            return obj.limitTo;
        }
    },
    categories: {
        translation: 'controls.browse.facets.categories_title',
        catalogKey: 'category',
        useCutoff: true,
        items: function(callback, cObj)
        {
            if ($.subKeyDefined(cObj, '_existingData.categories'))
            {
                callback(cObj._existingData.categories);
            }
            else
            {
                Configuration.findByType('view_categories', null, function(cats)
                {
                    var topLevel = {};
                    _.each(cats.properties, function(obj, cat)
                    {
                        if (!obj.enabled) { return; }
                        cat = cat.displayable();
                        var text = (obj.locale_strings || {})[blist.locale];
                        if ($.isBlank(text)) { text = cat; }
                        if ($.isBlank(obj.parent))
                        {
                            topLevel[cat] = topLevel[cat] || {};
                            topLevel[cat].value = cat;
                            topLevel[cat].text = text;
                        }
                        else
                        {
                            var p = obj.parent.displayable();
                            topLevel[p] = topLevel[p]  || {};
                            topLevel[p].children = topLevel[p].children || [];
                            topLevel[p].children.push({ value: cat, text: text });
                        }
                    });
                    callback(_.sortBy(_.reject(topLevel,
                                    function(cat) { return _.isNull(cat.value); }), 'value'));
                });
            }
        },
        updateFilter: function(obj, value)
        {
            obj.category = value;
        },
        clearFilter: function(obj)
        {
            delete obj.category;
        },
        currentValue: function(obj)
        {
            return (obj.category || '').displayable();
        }
    },
    topics: {
        translation: 'controls.browse.facets.topics_title',
        catalogKey: 'topic',
        useCutoff: true,
        useModal: true,
        items: function(callback, cObj)
        {
            if ($.subKeyDefined(cObj, '_existingData.tags'))
            {
                callback(cObj._existingData.tags);
            }
            else
            {
                $.socrataServer.makeRequest({ type: 'GET', url: '/api/tags.json?method=viewsTags',
                    success: function(tags)
                    {
                        callback(_.map(tags, function(t)
                                { return { text: t.name, value: t.name, count: t.frequency }; }));
                    }
                });
            }
        },
        updateFilter: function(obj, value)
        {
            obj.tags = value;
        },
        clearFilter: function(obj)
        {
            delete obj.tags;
        },
        currentValue: function(obj)
        {
            return obj.tags;
        }
    },
    federatedDomains: {
        translation: 'controls.browse.facets.federated_domains_title',
        catalogKey: 'federation',
        useCutoff: true,
        items: function(callback, cObj)
        {
            var rawFeds;
            var fedDomains;
            var domain;
            var processResults = _.after(2, function()
            {
                if ($.isBlank(fedDomains))
                {
                    fedDomains = _.map(_.sortBy(_.select(rawFeds, function(f)
                        {
                            return $.isBlank(f.lensName) && !$.isBlank(f.acceptedUserId) &&
                                f.targetDomainCName == domain.cname;
                        }), 'sourceDomainCName'), function(f)
                        {
                            return { text: f.sourceDomainCName, value: f.sourceDomainId,
                                icon: '/api/domains/' + f.sourceDomainCName + '/icons/smallIcon' };
                        });
                }
                callback([{ text: 'This site only', value: domain.id,
                    icon: '/api/domains/' + domain.cname + '/icons/smallIcon' }].concat(fedDomains));
            });

            if ($.subKeyDefined(cObj, '_existingData.federatedDomains'))
            {
                fedDomains = cObj._existingData.federatedDomains;
                processResults();
            }
            else
            {
                $.socrataServer.makeRequest({ type: 'GET', url: '/api/federations.json',
                    success: function(result)
                    {
                        rawFeds = result;
                        processResults();
                    } });
            }

            if ($.subKeyDefined(cObj, '_existingData.currentDomain'))
            {
                domain = cObj._existingData.currentDomain;
                processResults();
            }
            else
            {
                $.socrataServer.makeRequest({ type: 'GET', url: '/browse/domain_info.json', pageCache: true,
                    success: function(result)
                    {
                        domain = result;
                        processResults();
                    } });
            }
        },
        updateFilter: function(obj, value)
        {
            obj.federation_filter = value;
        },
        clearFilter: function(obj)
        {
            delete obj.federation_filter;
        },
        currentValue: function(obj)
        {
            return obj.federation_filter;
        }
    }
};

var catConfig;

var renderUpdate = function()
{
    var cObj = this;
    if (!cObj._initialized) { return; }

    var newFacet = listOptions[cObj._stringSubstitute(cObj._properties.facet)];
    if (cObj._facet != newFacet)
    {
        if (!$.isBlank(cObj._facet))
        {
            if (cObj._dataContext.type == 'datasetList')
            {
                var c = $.extend(true, {}, cObj._dataContext.config);
                c.search = c.search || {};
                cObj._facet.clearFilter(c);
                cObj._dataContext.updateConfig(c);
                // Re-render to make sure everything is updated
                renderUpdate.apply(cObj);
            }
        }
        cObj.$listSection.empty();

        cObj._facet = newFacet;
        cObj.$title.toggleClass('hide', $.isBlank(cObj._facet));
        cObj.$listSection.toggleClass('hide', $.isBlank(cObj._facet));
        if ($.isBlank(cObj._facet)) { return; }

        cObj.$title.text(!$.isBlank(cObj._facet.translation) ? $.t(cObj._facet.translation) :
                cObj._facet.title);

        cObj.$listSection.append($.tag2({ _: 'li', contents: {
            _: 'a', href: '#clear', className: 'clearFacet',
                contents: $.t('controls.browse.actions.clear_facet') }
        }));

        var itemHash = function(item)
        {
            return { _: 'li', contents: [ {
                _: 'a', href: '#' + item.value, className: item.className, 'data-value': item.value,
                    rel: item.count, contents: [ { i: cObj._facet.useIcons,
                        t: { _: 'span', className: 'icon' } },
                    { i: !$.isBlank(item.icon), t: { _: 'img', className: 'customIcon', alt: 'icon',
                                                       src: item.icon } },
                    !$.isBlank(item.translation) ? $.t(item.translation) : item.text ]
            }, { i: !$.isBlank(item.children), t: {
                _: 'ul', className: 'childList', contents: _.map(item.children, function(c)
                           { return itemHash(c); })
            } } ] };
        };

        var renderItems = function(items)
        {
            cObj.finishLoading();
            _.each(items, function(item)
            { cObj.$listSection.append($.tag2(itemHash(item))); });
            if (cObj._facet.useCutoff)
            {
                if (!$.isBlank(catConfig))
                { setUpCutoff(cObj); }
                else
                {
                    Configuration.findByType('catalog', null, function(c)
                    {
                        catConfig = c;
                        setUpCutoff(cObj);
                    });
                }
            }
            updateState(cObj);
        };
        cObj.startLoading();
        if (_.isFunction(cObj._facet.items))
        { cObj._facet.items(renderItems, cObj); }
        else
        { renderItems(cObj._facet.items); }
    }

    updateState(cObj);
};

var interactiveSetup = function()
{
    var cObj = this;
    if (cObj._loadingAssets) { return; }

    if ($.subKeyDefined(cObj, '_existingData.catalogConfig'))
    { catConfig = new Configuration(cObj._existingData.catalogConfig); }
    cObj._facet = listOptions[cObj._stringSubstitute(cObj._properties.facet)];
    if (cObj._facet.useCutoff)
    {
        if (!$.isBlank(catConfig))
        { setUpCutoff(cObj); }
        else
        {
            Configuration.findByType('catalog', null, function(c)
            {
                catConfig = c;
                setUpCutoff(cObj);
            });
        }
    }
    updateState(cObj);
};

var setUpCutoff = function(cObj)
{
    var cutoff = $.deepGet(catConfig, 'properties', 'facet_cutoffs', cObj._facet.catalogKey) || 5;
    cObj.$listSection.children('li').slice(cutoff + 1).addClass('cutoff');
    if (cObj._facet.useModal)
    {
        var links = cObj.$listSection.find('a:not(.clearFacet)').clone().toArray();
        links = _.sortBy(links, function(item) { return $(item).text(); });
        cObj.$dialog.find('.optionsContent').empty().append(links);
    }
    cObj.$listSection.append($.tag2({ _: 'li', className: ['viewAll',
        { i: cObj._facet.useModal, t: 'viewCloud' } ],
        contents: { _: 'a', className: ['viewAllLink', { i: cObj._facet.useModal, t: 'cloudLink' },
            'ss-dropdown'], href: '#viewAll', contents: $.t('controls.browse.actions.all_options') } }));
    cObj.$listSection.append($.tag2({ _: 'li', className: 'viewLess',
        contents: { _: 'a', className: ['viewLessLink', 'ss-directup'], href: '#viewLess',
            contents: $.t('controls.browse.actions.less_options') } }));
};

var updateState = function(cObj)
{
    if ($.isBlank(cObj._facet)) { return; }

    cObj.$listSection.find('.active').removeClass('active').parents('li').removeClass('activeItem');
    if ($.subKeyDefined(cObj, '_dataContext.config'))
    {
        var cv = cObj._facet.currentValue(cObj._dataContext.config.search || {});
        if (!$.isBlank(cv))
        {
            cObj.$listSection.find('a[data-value="' + cv + '"]').addClass('active')
                .parents('li').addClass('activeItem');
            cObj.$listSection.find('.clearFacet').removeClass('hide');
        }
        else
        { cObj.$listSection.find('.clearFacet').addClass('hide'); }
    }
};

var filterClick = function(cObj, e)
{
    e.preventDefault();

    var $a = $(e.currentTarget);
    if ($a.hasClass('active')) { return; }

    if ($a.hasClass('cloudLink'))
    {
        cObj.$dialog.find('.optionsContent a').tagcloud({
            size: { start: 1.2, end: 2.8, unit: 'em' }
        });
        cObj.$dialog.showModal();

        _.defer(function() { cObj.$dialog.find('.optionsContent a:first').focus(); });
        return;
    }
    if ($a.hasClass('viewAllLink'))
    {
        cObj.$listSection.addClass('expanded');
        return;
    }
    if ($a.hasClass('viewLessLink'))
    {
        cObj.$listSection.removeClass('expanded');
        return;
    }

    if (cObj._dataContext.type != 'datasetList' || $.isBlank(cObj._facet))
    { return; }

    var c = $.extend(true, {}, cObj._dataContext.config);
    c.search = c.search || {};
    var v = $a.data('value');
    if ($.isBlank(v))
    { cObj._facet.clearFilter(c.search); }
    else
    { cObj._facet.updateFilter(c.search, v); }
    cObj._dataContext.updateConfig(c);
    // Re-render to make sure everything is updated
    updateState(cObj);
};

})(jQuery);
