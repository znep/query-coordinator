/******* Approval queue section ******/
$(function()
{
    var $browse = $('.browseSection');
    if ($browse.length < 1) { return; }

    var $form = $browse.find('.titleContainer form');
    $form.children('input').hide();
    $form.children('select').bind('keypress, change', function()
        { _.defer(function() { $form.submit(); }); });

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
                    { return $.htmlEscape(v.context.dataset.approvalStage().name); },
                '.created .user .value': 'dataset.owner.displayName!',
                '.created .user .value@href': function(v)
                    { return new User(v.context.dataset.owner).getProfileUrl(); },
                '.created .date .value': function(v)
                    {
                        return new Date(v.context.dataset.createdAt * 1000)
                            .toString('d MMMM yyyy');
                    },
                '.lastApproved .user .type': function(v)
                    {
                        return v.context.dataset.lastApproval(true)
                            .approvalRejected ? 'Rejected' : 'Approved';
                    },
                '.lastApproved .user .value@data-userId': function(v)
                    {
                        return v.context.dataset.lastApproval(true)
                            .approverUserUid || '';
                    },
                '.lastApproved .date .type': function(v)
                    {
                        return v.context.dataset.lastApproval(true)
                            .approvalRejected ? 'Rejection' : 'Approval';
                    },
                '.lastApproved .date .value': function(v)
                    {
                        return new Date((v.context.dataset.lastApproval(true)
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
        _.each(ds.approvalStream(), function(ah)
            {
                $stageIcon.append($.tag({tagName: 'span',
                    title: (blist.routingApproval.approvalTemplate
                        .getStage(ah.approvalStageId) || {}).name,
                    'class': ah.approvalRejected ? 'rejected' : 'on'}));
            });
        // Subtract an extra one because we add a dummy stage 0 into approval
        _(blist.routingApproval.approvalTemplate.stages.length - ds.approvalStream().length - 1)
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


/******* Approval management section ******/
$(function()
{
    var $manage = $('#routingApprovalManagement');
    if ($manage.length < 1) { return; }

    $manage.find('form').validate();

    var hookUpUserPicker = function($li)
    {
        $li.find('input').userPicker({chooseCallback: function(user)
        {
            // User ID has already been set in field
            var $newLi = $li.clone().removeClass('newItem');
            $newLi.find('ul.autocomplete').remove();
            $newLi.append($.tag({tagName: 'a', 'class': 'userLink',
                href: user.getProfileUrl(),
                contents: $.htmlEscape(user.displayName)}));
            hookUpUserItem($newLi);
            $li.before($newLi);
            $li.find('input').val('').trigger('keyup');
        },
        filterCallback: function(user) { return user.isMember(); },
        limit: 50});
    };

    // Set up adding multiple stages
    $manage.find('.stageItem:last').addClass('newStage');

    var newStages = 0;
    $manage.delegate('.newStage input.stageName', 'blur', function()
    {
        var $name = $(this);
        if (!$.isBlank($name.val()))
        {
            var $lastStage = $name.closest('.stageItem');
            var $newStage = $lastStage.clone().removeClass('newStage');
            newStages++;
            $newStage.find(':input').each(function()
            {
                var $i = $(this);
                $i.attr('name', $i.attr('name').replace('new-0',
                    'new-' + newStages));
                $i.attr('id', $i.attr('id').replace('new-0', 'new-' + newStages));
            });
            $newStage.find('label').each(function()
            {
                var $l = $(this);
                $l.attr('for', $l.attr('for').replace('new-0', 'new-' + newStages));
            });

            $lastStage.before($newStage);
            hookUpUserPicker($newStage.find('.userList .userItem:last'));
            $lastStage.find('input.stageName').val('');
        }
    });

    // Set up nice delete for stages
    $manage.find('.deleteInfo').addClass('hide');

    $manage.find('.stageItem').each(function()
    {
        var $stage = $(this);
        $stage.prepend($.tag({tagName: 'a', href: '#Remove', title: 'Remove Stage',
            'class': 'remove', contents: {tagName: 'span', 'class': 'icon'}}));
    });

    $manage.delegate('.stageItem > .remove', 'click', function(e)
    {
        e.preventDefault();
        $(this).closest('.stageItem').addClass('hide')
            .find('input.stageName').val('');
    });

    // Set up nice add & delete for approvers in a stage
    var hookUpUserItem = function($li)
    {
        $li.find('input').addClass('hide');
        $li.append($.tag({tagName: 'a', href: '#Remove', title: 'Remove Approver',
            'class': 'remove', contents: {tagName: 'span', 'class': 'icon'}}));
    };

    $manage.find('.stageItem .userList .userItem').each(function()
    {
        var $li = $(this);
        if (!$li.hasClass('newItem'))
        {
            hookUpUserItem($li);
        }
        else
        {
            $li.find('span').addClass('hide');
            hookUpUserPicker($li);
        }
    });

    $manage.delegate('.stageItem .userList .remove', 'click', function(e)
    {
        e.preventDefault();
        $(this).closest('.userItem').addClass('hide').find('input').val('');
    });

    // Handle resets
    $manage.find('.finishButtons input[type=reset]').click(function()
    { _.defer(function() {
        $manage.find('.stageList .stageItem').each(function()
        {
            var $si = $(this);
            if ($si.hasClass('newStage')) { return; }
            if ($.isBlank($si.find('input.stageName').val()))
            {
                $si.remove();
                return;
            }
            $si.find('.userList .userItem').each(function()
            {
                var $ui = $(this);
                if ($ui.hasClass('newItem')) { return; }
                if ($.isBlank($ui.find('input').val())) { $ui.remove(); }
            });
        });
    }); });
});
