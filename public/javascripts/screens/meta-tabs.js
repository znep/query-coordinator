// Pass a tabKey and viewId to the updateMeta function,
// and it will update the meta header and tab for the
// associated key. The Comments and Publishing tabs
// are NOT yet supported. -pete

var metaNS = blist.namespace.fetch('blist.meta');

blist.meta.updateMeta = function(tabKey, viewId, onHeaderSuccess, onTabSuccess)
{
    metaNS.updateMetaTabHeader(tabKey, viewId, onHeaderSuccess);
    metaNS.updateMetaTab(tabKey, viewId, onTabSuccess);
};

blist.meta.metaTabHeaderMap = {
    "summary": ".singleInfoSummary .infoContentHeader",
    "filtered": ".singleInfoFiltered .infoContentHeader",
    "activity": ".singleInfoActivity .infoContentHeader",
    "sharing": ".singleInfoSharing .infoContentHeader"
};
blist.meta.updateMetaTabHeader = function(tabKey, viewId, onHeaderSuccess)
{
    if (metaNS.metaTabHeaderMap[tabKey] != undefined)
    {
        $.ajax({ url: '/dataset/' + viewId + '/meta_tab_header?tab=' + tabKey,
            cache: false,
            success: function(data)
            {
                $(metaNS.metaTabHeaderMap[tabKey]).html(data);
                if (onHeaderSuccess) { onHeaderSuccess(); }
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
blist.meta.updateMetaTab = function(tabKey, viewId, onTabSuccess)
{
    if (metaNS.metaTabMap[tabKey] != undefined)
    {
        $.ajax({ url: '/dataset/' + viewId + '/meta_tab?tab=' + tabKey,
            cache: false,
            success: function(data)
            {
                $(metaNS.metaTabMap[tabKey]).html(data);
                if (onTabSuccess) { onTabSuccess(); }
            }
        });
    }
};

blist.meta.setUpRdfEdit = function()
{
    var $rdfClassValidator = $("#form_rdf_class").validate({
        rules: {
            "view_metadata_customRdfClass": {
                url: true
            }
        },
        showErrors: function(mapErr, arErr)
        {
            var $el = $("#view_metadata_customRdfClass");
            // only show error (using default handler) if
            // combo box use custom value.  If it picks from a list,
            // it is always valid.
            if ($el.is(':visible'))
            {
                this.defaultShowErrors();
            }
        },
        errorPlacement: function(error, element) {
            // if combo shows, we do not care about the hidden field
            if (element.is(':visible'))
            {
                error.appendTo(element.parent());
            }
        }
    });
    $("#form_rdf_class").data('validator', $rdfClassValidator);
}
