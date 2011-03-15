$(function()
{
    var $browse = $('.browseSection');

    var getDS = function($item)
    {
        var id = $item.closest('tr').attr('data-viewId');
        if (!(blist.routingApproval.datasets[id] instanceof Dataset))
        {
            blist.routingApproval.datasets[id] =
                new Dataset(blist.routingApproval.datasets[id]);
            blist.routingApproval.datasets[id].setApprovalTemplate(
                blist.routingApproval.approvalTemplate);
        }
        return blist.routingApproval.datasets[id];
    };

    var doExpansion = function($row)
    {
        var $content = $row.find('.nameDesc .extraInfo .infoContent:empty');
        if ($content.length < 1) { return; }

        var ds = getDS($row);
        $content.append($.renderTemplate('expandedInfo',
            {dataset: ds, nextStage: ds.nextApprovalStage() || {}},
            {
                '.stage .description': function(v)
                    { return v.context.dataset.approvalStage().name; },
                '.created .user .value': 'dataset.owner.displayName',
                '.created .user .value@href': function(v)
                    { return new User(v.context.dataset.owner).getProfileUrl(); },
                '.created .date .value': function(v)
                    {
                        return new Date(v.context.dataset.createdAt * 1000)
                            .toString('d MMMM yyyy');
                    },
                '.lastApproved .user .type': function(v)
                    {
                        return v.context.dataset.lastApprovalAction()
                            .approvalRejected ? 'Rejected' : 'Approved';
                    },
                '.lastApproved .user .value@data-userId': function(v)
                    {
                        return v.context.dataset.lastApprovalAction()
                            .approverUserUid || '';
                    },
                '.lastApproved .date .type': function(v)
                    {
                        return v.context.dataset.lastApprovalAction()
                            .approvalRejected ? 'Rejection' : 'Approval';
                    },
                '.lastApproved .date .value': function(v)
                    {
                        return new Date((v.context.dataset.lastApprovalAction()
                            .approvalDate || 0) * 1000).toString('d MMMM yyyy');
                    },
                '.lastApproved@class+': function(v)
                    {
                        return _.isEmpty(v.context.dataset.approvalHistory) ?
                            'hide' : '';
                    },
                '.nextApprover .user li': {
                    'userId<-nextStage.approverUids': {
                        '.value@data-userId': 'userId'
                    }
                }
            }));

        $content.find('.userLoad').each(function()
        {
            var $a = $(this);
            var userId = $a.data('userId');
            if ($.isBlank(userId)) { return; }

            User.createFromUserId(userId, function(u)
            {
                $a.removeClass('userLoad');
                $a.attr('href', u.getProfileUrl());
                $a.text(u.displayName);
            }, function()
            {
                $a.removeClass('userLoad');
                $a.text('(unavailable)');
            });
        });

        var $stageIcon = $content.find('.stage .icon');
        var stagesPassed = ds.approvalHistory.length;
        _.each(ds.approvalHistory, function(ah)
            {
                $stageIcon.append($.tag({tagName: 'span',
                    title: (blist.routingApproval.approvalTemplate
                        .getStage(ah.approvalStageId) || '').name,
                    'class': ah.approvalRejected ? 'rejected' : 'on'}));
            });
        // Subtract an extra one because we add a dummy stage 0 into approval
        _(blist.routingApproval.approvalTemplate.stages.length - stagesPassed - 1)
            .times(function()
            { $stageIcon.append($.tag({tagName: 'span', 'class': 'off'})); });
    };

    $browse.delegate('.userLoad', 'click', function(e) { e.preventDefault(); });

    $browse.find('table tbody tr').expander({
        contentSelector: '.nameDesc .expandBlock',
        expandSelector: '.index .expander, .nameDesc .extraInfo .close',
        expanderCollapsedClass: 'collapsed',
        expanderExpandedClass: 'expanded',
        forceExpander: true,
        preExpandCallback: doExpansion
    });
});
