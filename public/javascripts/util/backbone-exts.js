(function() {

Backbone.CollectionView = Backbone.View.extend({
    initialize: function()
    {
        var self = this;

        // super
        Backbone.View.prototype.initialize.apply(this, arguments);

        // init list
        this._views = {};

        // render each model
        this.collection.each(function(model) { self.addOne(model) });

        // handle new/dead instances
        this.collection.on('add', function(model) { self.addOne(model); });
        this.collection.on('remove', function(model) { self.removeOne(model); });
    },
    renderCollection: function()
    {
        var els = _.map(this._views, function(view)
        {
            view.render();
            return view.el;
        });
        return $(els);
    },
    addOne: function(model)
    {
        var view = new this.options.instanceView({ model: model });
        this._views[model.cid] = view;

        // HACK: this totally won't work at scale, but is fine for this app.
        this.$el.append(view.$el);
        view.render();
    },
    removeOne: function(model)
    {
        // we want to extricate the dom node from ourself,
        // but we don't implicitly want to clean up after it, so
        // don't call model.remove()
        this._views[model.cid].$el.detach();
        delete this._views[model.cid];
    }
});

})();