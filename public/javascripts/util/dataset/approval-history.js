(function(){

Dataset.modules['approvalHistory'] =
{
    setApprovalTemplate: function(approval)
    {
        this._approval = approval;
    },

    lastApproval: function()
    {
        return _.last(_.select(this.approvalHistory,
            function(ah) { return !ah.approvalRejected; })) || {approvalStageId: 0}
    },

    lastApprovalAction: function()
    {
        return _.last(this.approvalHistory) || {approvalStageId: 0}
    },

    approvalStage: function()
    {
        return this._approval.getStage(this.lastApproval().approvalStageId);
    },

    nextApprovalStage: function()
    {
        var curIndex = 0;
        var la = this.lastApproval();
        _.detect(this._approval.stages, function(s, i)
            {
                if (s.id == la.approvalStageId)
                {
                    curIndex = i;
                    return true;
                }
                return false;
            });
        return this._approval.stages[curIndex + 1];
    }
};

})();
