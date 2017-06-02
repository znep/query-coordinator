# Debugging Polaroid in the Browser
Since Polaroid works by posting to `/view/vif`, it's helpful to be able to see what Polaroid is seeing for debugging. Here's how to do that:

1. Add a GET route for `/view/vif` in `routes.rb`:
```
get '/view/vif', :controller => 'data_lens', :action => 'view_vif', :app =>
'dataCards'
```

2. Go to the Data Lens of the card you want to test exporting and open the Network tab of your console.

3. `Click Export` > `Visualization as an Image` > `Choose Card` and then `Download` on the card whose VIF you want.

4. In your Network tab, look for a request to `/view/vif.png?renderTrackingId={#}` and copy the everything in the request payload under the `"vif"` key.

5. In `DataLensController#view_vif`, reassign the VIF that gets sent down with a `JSON.parse`'d version of the payload you copied from the Network tab. For example:
```
parsed_vif =
JSON.parse('{"aggregation":{"function":"count"},"columnName":"frolicking_wombats","configuration":{"baseLayerUrl":"https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}","mapExtent":{"southwest":[22.59372606392931,-293.203125],"northeast":[42.16340342422401,113.73046875]}},"createdAt":"2016-03-04T14:52:21","datasetUid":"vu75-ih58","description":"","domain":"localhost","filters":[],"format":{"type":"visualization_interchange_format","version":1},"origin":{"type":"data_lens_export","url":"https://localhost/view/abcd-abcd"},"title":"Polaroid
Export","type":"featureMap","unit":{"one":"Wombat","other":"Wombats"}}').with_indifferent_access
```

6. Visit `/view/vif` and check out what's going on. While it's helpful to see what's getting rendered, be aware that Phantom may render things differently than Chrome or Firefox.
