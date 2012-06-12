OpenLayers.Layer.Heatmap = OpenLayers.Class(OpenLayers.Layer, {
	// the heatmap isn't a basic layer by default - you usually want to display the heatmap over another map ;)
	isBaseLayer: false,
	heatmap: null,
	mapLayer: null,
	tmpData: {},
	initialize: function(name, map, mLayer, hmoptions, options){
		this.mapLayer = mLayer;
		OpenLayers.Layer.prototype.initialize.apply(this, [name, options]);
		var heatdiv = document.createElement("div");
		heatdiv.style.cssText = "position:absolute;width:"+map.size.w+"px;height:"+map.size.h+"px;";
		this.div.appendChild(heatdiv);
		hmoptions.element = heatdiv;
		this.heatmap = h337.create(hmoptions);
        this.active = true;
		var handler = function(){ if(this.tmpData.max)this.updateLayer(); };
		map.events.register("zoomend", this, handler);
	},
    deactivate: function(){
        this.active = false;
    },
    activate: function(){
        this.active = true;
    },
	updateLayer: function(){
		if (this.active) { this.setDataSet(this.tmpData); }
	},
	setDataSet: function(obj){
		var set = {},
		dataset = obj.data
		dlen = dataset.length;
		set.max = obj.max;
		set.data = [];
		
		while(dlen--){
			var lonlat = new OpenLayers.LonLat(dataset[dlen].lon, dataset[dlen].lat);
			var pixel = this.roundPixels(this.mapLayer.getViewPortPxFromLonLat(lonlat));
			if(pixel)
				set.data.push({x: pixel.x, y: pixel.y, count: dataset[dlen].count});
		}
		this.tmpData = obj;
		this.heatmap.store.setDataSet(set);
	},
	roundPixels: function(p){
		if(p.x < 0 || p.y < 0)
			return false;
			
		// fast rounding - thanks to Seb Lee-Delisle for this neat hack
		p.x = ~~ (p.x+0.5);
		p.y = ~~ (p.y+0.5);
		return p;
	},
	addDataPoint: function(lon, lat){
		var lonlat = new OpenLayers.LonLat(lon, lat);
		var pixel = this.roundPixels(this.mapLayer.getViewPortPxFromLonLat(lonlat));
		var args = [pixel.x, pixel.y];
		if(pixel){
			if(arguments.length == 3){
				args.push(arguments[2]);
			}
			this.heatmap.store.addDataPoint.apply(this.heatmap.store, args);
		}
	},
	toggle: function(){
		this.heatmap.toggleDisplay();
	},
	destroy: function() {
        // for now, nothing special to do here. 
        OpenLayers.Layer.prototype.destroy.apply(this, arguments);
    },
	CLASS_NAME: "OpenLayers.Layer.Heatmap"
});
