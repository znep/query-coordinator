// Pass a tabKey and viewId to the updateMeta function,
// and it will update the meta header and tab for the
// associated key. The Comments and Publishing tabs
// are NOT yet supported. -pete

var metaNS = blist.namespace.fetch('blist.meta');

blist.meta.updateMeta = function(tabKey, viewId)
{
    metaNS.updateMetaTabHeader(tabKey, viewId);
    metaNS.updateMetaTab(tabKey, viewId);
};

blist.meta.metaTabHeaderMap = {
    "summary": ".singleInfoSummary .infoContentHeader",
    "filtered": ".singleInfoFiltered .infoContentHeader",
    "activity": ".singleInfoActivity .infoContentHeader",
    "sharing": ".singleInfoSharing .infoContentHeader"
};
blist.meta.updateMetaTabHeader = function(tabKey, viewId)
{
    if (metaNS.metaTabHeaderMap[tabKey] != undefined)
    {
        $.Tache.Get({ url: '/dataset/' + viewId + '/meta_tab_header?tab=' + tabKey,
            success: function(data)
            {
                $(metaNS.metaTabHeaderMap[tabKey]).html(data);
            }
        });
    }
};

blist.meta.metaTabMap = {
    "summary": ".singleInfoSummary .infoContent",
    "filtered": ".singleInfoFiltered .infoContent",
    "activity": ".singleInfoActivity .infoContent",
    "sharing": ".singleInfoSharing .infoContent"
};
blist.meta.updateMetaTab = function(tabKey, viewId)
{
    if (metaNS.metaTabMap[tabKey] != undefined)
    {
        $.Tache.Get({ url: '/dataset/' + viewId + '/meta_tab?tab=' + tabKey,
            success: function(data)
            {
                $(metaNS.metaTabMap[tabKey]).html(data);
            }
        });
    }
};
