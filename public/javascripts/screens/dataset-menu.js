blist.namespace.fetch('blist.datasetMenu');

blist.datasetMenu.menuHandler = function(event)
{
    var $target = $(event.currentTarget);
    var href = $target.attr('href');
    if (href.indexOf('#') < 0)
    {
        return;
    }

    var s = href.slice(href.indexOf('#') + 1).split('_');
    var action = s[0];
    var actionId = s[1];

    event.preventDefault();
    var hideTags = true;
    switch (action)
    {
        case 'sort':
            var url = s.slice(1).join('_');
            var model = $('.blist-table').blistModel();
            var view = model.meta().view;
            var params = [];

            var sortIds = {};
            if (view.query.orderBys !== undefined)
            {
                var sorts = $.map(view.query.orderBys, function(o, i)
                {
                    sortIds[o.expression.columnId] = true;
                    return o.expression.columnId + ':' +
                        (o.ascending ? 'asc' : 'desc');
                });
                if (sorts.length > 0) { params.push('sorts=' + sorts.join(',')); }
                else { params.push('sorts='); }
            }
            else { params.push('sorts='); }

            if (model.isGrouped())
            {
                var unsorts = $.map(view.columns, function(c, i)
                {
                    if (c.dataTypeName !== 'meta_data' && !sortIds[c.id])
                    { return c.id; }
                });
                if (unsorts.length > 0)
                { params.push('unsorts=' + unsorts.join(',')); }
            }

            if (params.length > 0) { url += '?' + params.join('&'); }
            $('#modal').jqmShow($('<a href="' + url + '"></a>'));
            break;
        case 'group':
            var url = s.slice(1).join('_');
            var model = $('.blist-table').blistModel();
            var view = model.meta().view;
            var params = [];
            var groups = '';
            if (model.isGrouped())
            {
                groups = $.map(view.query.groupBys, function(g, i)
                    { return g.columnId; }).join(',');
            }
            params.push('groups=' + groups);

            var aggs = [];
            $.each(view.columns, function(i, c)
            {
                if (c.format !== undefined &&
                    c.format.grouping_aggregate !== undefined)
                {
                    aggs.push(c.id + ':' + c.format.grouping_aggregate);
                }
            });
            params.push('aggs=' + aggs.join(','));

            if ($('.blist-table').datasetGrid().isTempView)
            { params.push('isTempView=true'); }

            if (params.length > 0) { url += '?' + params.join('&'); }
            $('#modal').jqmShow($('<a href="' + url + '"></a>'));
            break;
        case 'share':
            $("#infoPane .summaryTabs").infoPaneNavigate()
                .activateTab("#tabSharing");
            $('#modal').jqmShow($('<a href="' + s.slice(1).join('_') + '"></a>'));
            break;
        case 'aggregate':
            if (s.length == 3)
            { $('.blist-table').datasetGrid().setColumnAggregate(actionId, s[2]); }
            break;
        case 'publish':
            $("#infoPane .summaryTabs").infoPaneNavigate()
                .activateTab('#tabPublishing');
            break;
        case 'infoPane':
            $("#infoPane .summaryTabs").infoPaneNavigate()
                .activateTab("#" + actionId);
            break;
        case 'hide-show-col':
            var $li = $target.closest('li');
            $('.blist-table').datasetGrid().showHideColumns(actionId,
                $li.hasClass('checked'));
            break;
        case 'delete-col':
            $('.blist-table').datasetGrid().deleteColumns(actionId);
            break;
        case 'show-rowTags':
            hideTags = false;
        case 'hide-rowTags':
            var curText = $target.text();
            var oldText = hideTags ? 'Hide' : 'Show';
            var newText = hideTags ? 'Show' : 'Hide';
            $.each($('.blist-table').blistModel().meta().view.columns,
                function(i, col)
                {
                    if (col.dataTypeName == 'tag')
                    {
                        $('.blist-table').datasetGrid().showHideColumns(col.id,
                            hideTags);
                        $('.headerMenu .rowTags a').attr('href', hideTags ?
                            '#show-rowTags' : '#hide-rowTags')
                            .find('span').text(curText.replace(oldText, newText));
                        return false;
                    }
                });
            break;
        case 'makePermissionPublic':
          $.ajax({
            url: "/views/" + actionId,
            cache: false,
            data: {
              'method': 'setPermission',
              'value': 'public'
            },
            success: function (responseData) {
              alert("Your dataset is now publicly viewable.");
            },
            error: function (request, textStatus, errorThrown)
            {
              alert("An error occurred while changing your dataset permissions. Please try again later");
            }
          });
          break;
        case 'makePermissionPrivate':
          $.ajax({
            url: "/views/" + actionId,
            cache: false,
            data: {
              'method': 'setPermission',
              'value': 'private'
            },
            success: function (responseData)
            {
              alert("Your dataset is now viewable to only the dataset owner and any sharees.");
            },
            error: function (request, textStatus, errorThrown)
            {
              alert("An error occurred while changing your dataset permissions. Please try again later");
            }
          });
          break;
    }
};

