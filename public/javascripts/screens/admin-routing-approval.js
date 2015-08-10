/******* Approval dashboard section ******/
$(function()
{
    var $dashboard = $('#routingApprovalDashboard');
    if ($dashboard.length < 1) { return; }

    var apprTmpl = blist.routingApproval.approvalTemplate;

    $dashboard.find('.report.loading.hide').each(function()
        { $(this).loadingSpinner({metric: 'routing', showInitially: true}); }).removeClass('hide');

    var getStageIcon = function(stage)
    {
        var r = '';
        var seenStage = false;
        _.each(apprTmpl.stages, function(s)
        {
            if (s.visible) { return; }
            seenStage = seenStage || s.id == stage.id;
            r += $.tag({tagName: 'span', 'class': seenStage ? 'off' : 'on'}, true);
        });
        return r;
    };

    var ageInfo;
    var allViewsCount;
    var renderPipeline = _.after(2, function()
    {
        var $pipeline = $dashboard.find('.pipeline.report ul');
        var totalCount = Math.max(1, _.reduce(ageInfo, function(memo, ai) { return memo + ai.count; }, 0));
        _.each(apprTmpl.stages, function(s)
        {
            var ai = s.visible ? {count: allViewsCount} : _.detect(ageInfo, function(a)
                { return a.approval_stage_id == s.id; }) || {count: 0};
            $pipeline.append($.renderTemplate('pipelineItem', {ageInfo: ai, stage: s},
                {
                    '.label@title': 'stage.name!',
                    '.label span': function(d)
                    {
                        var stage = d.context.stage;
                        return $.htmlEscape(stage.visible ?
                            'Publicly available (' + stage.name + ')' : stage.name);
                    },
                    '.barContainer .bar@style': function(d)
                    {
                        return 'width:' +
                            Math.min(100, 99 * d.context.ageInfo.count / totalCount) +
                            '%';
                    },
                    '.barContainer .count': function(d)
                        { return $.commaify(d.context.ageInfo.count); },
                    'li@class+': function(d)
                        { return d.context.stage.visible ? 'finalStage' : ''; }
                }));
        });
        $pipeline.closest('.report').removeClass('loading').loadingSpinner().showHide(false);
    });

    $.Tache.Get({url: '/api/search/views.json?limit=1&datasetView=dataset',
        dataType: 'json', contentType: 'application/json',
        success: function(results)
        {
            allViewsCount = results.count;
            renderPipeline();
        }});

    var renderAgeByStage = function()
    {
        var $ageByStage = $dashboard.find('.ageReport.report table tbody');
        _.each(apprTmpl.stages, function(s)
        {
            if (s.visible) { return; }

            var ai = _.detect(ageInfo, function(a)
                { return a.approval_stage_id == s.id; }) || {count: 0, average_age: 0};
            ai.average_age = Math.round(ai.average_age);
            $ageByStage.append($.renderTemplate('ageItem', {stage: s, ageInfo: ai},
                {
                    '.stage .icon': function(d)
                        { return getStageIcon(d.context.stage); },
                    '.stage .name': 'stage.name!',
                    '.count': function(d)
                        { return $.commaify(d.context.ageInfo.count); },
                    '.average': function(d)
                        {
                            return d.context.ageInfo.count < 1 ? 'N/A' :
                                $.commaify(d.context.ageInfo.average_age) +
                                    ' day' + (d.context.ageInfo.average_age != 1 ? 's' : '');
                        }
                }).find('tr'));
        });
        $ageByStage.closest('.report').removeClass('loading').loadingSpinner().showHide(false);
    };

    apprTmpl.getAgeInfo(function(ai)
    {
        ageInfo = ai;
        renderPipeline();
        renderAgeByStage();
    });

    var numGroups = 5;
    var agingInfo;
    var renderStageBreakdown = function()
    {
        var $stageBreakdown = $dashboard.find('.agingReport.report table');
        var cols = [];
        _.times(numGroups, function() { cols.push({tagName: 'col', 'class': 'unitCount'}); });
        $stageBreakdown.find('colgroup').append($.tag(cols));

        var ths = [];
        _.times(numGroups, function(i)
        {
            ths.push({tagName: 'th', 'class': 'unitCount',
                contents: i == 0 ?
                    'Today' : i == numGroups - 1 ?
                        'Older' : i + ' day' + (i == 1 ? '' : 's') + ' old'});
        });
        $stageBreakdown.find('thead tr').append($.tag(ths));

        var $stageBreakdownBody = $stageBreakdown.find('tbody');
        _.each(apprTmpl.stages, function(s)
        {
            if (s.visible) { return; }

            var ai = _.detect(agingInfo, function(a) { return a.approval_stage_id == s.id; });
            var $tr = $.renderTemplate('agingItem', {stage: s, agingInfo: ai},
                {
                    '.stage .icon': function(d)
                        { return getStageIcon(d.context.stage); },
                    '.stage .name': 'stage.name!'
                }).find('tr');
            _.times(numGroups, function(i)
            {
                $tr.append($.tag({tagName: 'td', 'class': 'unitCount',
                    contents: $.commaify(ai.counts[i] || 0)}));
            });
            $stageBreakdownBody.append($tr);
        });
        $stageBreakdown.closest('.report').removeClass('loading').loadingSpinner().showHide(false);
    };

    apprTmpl.getAgingInfo(function(ai)
    {
        agingInfo = ai;
        renderStageBreakdown();
    }, numGroups - 1);
});

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
                        var la = v.context.dataset.lastApproval(true);
                        return la.approvalTypeName == 'R' ? 'Rejected' :
                            la.approvalTypeName == 'A' ? 'Approved' : 'Resubmitted';
                    },
                '.lastApproved .user .value@data-userId': function(v)
                    {
                        return v.context.dataset.lastApproval(true)
                            .approverUserUid || '';
                    },
                '.lastApproved .date .type': function(v)
                    {
                        var la = v.context.dataset.lastApproval(true);
                        return la.approvalTypeName == 'R' ? 'Rejection' :
                            la.approvalTypeName == 'A' ? 'Approval' : 'Resubmission';
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
                '.reason .title .type': function(v)
                    {
                        var la = v.context.dataset.lastApproval(true);
                        return la.approvalTypeName == 'R' ? 'Rejection' :
                            la.approvalTypeName == 'A' ? 'Approval' : 'Resubmission';
                    },
                '.reason .value': function(v)
                    {
                        return v.context.dataset.lastApproval(true).comment ||
                            'No reason provided';
                    },
                '.reason@class+': function(v)
                    {
                        return v.context.dataset.lastApproval(true)
                            .approvalTypeName == 'A' ? 'hide' : '';
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
            var userId = $a.data('userid');
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
                    'class': ah.approvalTypeName == 'R' ? 'rejected' :
                        ah.approvalTypeName == 'A' ? 'on' : 'off'}));
            });

        // Subtract an extra one because we add a dummy stage 0 into approval
        _.times(blist.routingApproval.approvalTemplate.stages.length - ds.approvalStream().length - 1, function() {
          $stageIcon.append($.tag({tagName: 'span', 'class': 'off'}));
        });
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

    $browse.find('table tbody tr .actions .reasonBox').each(function()
    { blist.datasetControls.raReasonBox($(this)); });
});


/******* Approval management section ******/
$(function()
{
    var $manage = $('#routingApprovalManagement');
    if ($manage.length < 1) { return; }

    $.validator.addMethod('userId', function(value, element, param)
    {
        if (this.optional(element)) { return true; }
        return !_.isNull(value.match(/\w{4}-\w{4}$/));
    },
    'A valid user is required');
    $.validator.addClassRules('userId', {userId: true});

    $manage.find('form').validate();

    var hookUpUserPicker = function($li)
    {
        $li.find('input').userPicker({chooseCallback: function(user)
        {
            // User ID has already been set in field
            var $newLi = $li.clone().removeClass('newItem');
            $newLi.find('ul.autocomplete').remove();
            $newLi.find('label.error').remove();
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

    var adjustStages = function()
    {
        var $stages = $manage.find('.stageItem:visible:not(.newStage)');
        $stages.toggleClass('onlyStage', $stages.length < 2);
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

            adjustStages();
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
        adjustStages();
    });

    adjustStages();

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
            else { $si.removeClass('hide'); }
            $si.find('.userList .userItem').each(function()
            {
                var $ui = $(this);
                if ($ui.hasClass('newItem')) { return; }
                if ($.isBlank($ui.find('input').val())) { $ui.remove(); }
                else { $ui.removeClass('hide'); }
            });
        });
        adjustStages();
    }); });
});
