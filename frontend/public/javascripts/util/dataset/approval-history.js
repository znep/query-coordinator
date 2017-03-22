(function() {

  Dataset.modules.approvalHistory = {
    setApprovalTemplate: function(approval) {
      var ds = this;
      ds._approval = approval;
      ds.approvalHistory = _.select(ds.approvalHistory, function(ah) {
        return !$.isBlank(ds._approval.getStage(ah.approvalStageId));
      });
    },

    approvalStream: function() {
      var ds = this;
      if ($.isBlank(ds._approvalStream)) {
        var stageItems = {};
        _.each(ds.approvalHistory, function(ah) {
          stageItems[ah.approvalStageId] = ah;
        });
        ds._approvalStream = [];
        _.each(ds._approval.stages, function(a) {
          if (!$.isBlank(stageItems[a.id])) {
            ds._approvalStream.push(stageItems[a.id]);
          }
        });
      }
      return ds._approvalStream;
    },

    lastApproval: function(includeRejected) {
      var defaultApproval = {
        approvalStageId: 0
      };
      var lastApproval = _.last(_.select(this.approvalHistory, function(ah) {
        return includeRejected || ah.approvalTypeName == 'A';
      }));
      return lastApproval || defaultApproval;
    },

    approvalStage: function() {
      return this._approval.getStage(this.lastApproval().approvalStageId);
    },

    nextApprovalStage: function() {
      var curIndex = 0;
      var la = this.lastApproval();
      _.detect(this._approval.stages, function(s, i) {
        if (s.id == la.approvalStageId) {
          curIndex = i;
          return true;
        }
        return false;
      });
      return this._approval.stages[curIndex + 1];
    }
  };

})();
