(function(){

this.Approval = ServerModel.extend({
    _init: function (a)
    {
        this._super();
        $.extend(this, a);

        this.stages = this.stages || [];
        this.stages.unshift({name: 'Not Ready Yet', id: 0});
    },

    getStage: function(id)
    {
        return _.detect(this.stages, function(s) { return s.id == id; });
    },

    getAgeInfo: function(callback)
    {
        var appr = this;
        appr.makeRequest({url: '/api/approval.json', params: {method: 'ageInfo'},
            type: 'GET', cache: false, pageCache: true,
            success: function(ageInfo, ts, xhr)
            {
                ageInfo = _.reject(ageInfo, function(a)
                    { return $.isBlank(appr.getStage(a.approval_stage_id)); });
                callback(ageInfo);
            }});
    },

    getAgingInfo: function(callback, groups)
    {
        groups = groups || 5;
        var appr = this;
        appr.makeRequest({url: '/api/approval.json',
            params: {method: 'aging', max_group: groups, interval: 86400},
            type: 'GET', cache: false, pageCache: true,
            success: function(aiResults)
            {
                var agingInfo = [];
                _.each(appr.stages, function(s)
                {
                    var as = {approval_stage_id: s.id, counts: []};
                    _.each(aiResults, function(r)
                    {
                        if (r.approval_stage_id == s.id)
                        { as.counts[r.aging_unit] = r.count; }
                    });
                    agingInfo.push(as);
                });
                callback(agingInfo);
            }});
    }
});

})();
