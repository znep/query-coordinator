(function(){

this.Approval = Model.extend({
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
    }
});

})();
