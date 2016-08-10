module AssetInventory
  def self.find
    views = Clytemnestra.search_cached_views(
      { :nofederate => true, :limitTo => 'assetinventory', :admin => true }).results

    views_with_ai_name = views.select{|view|
      (view.name == 'Dataset of Datasets') || (view.name == 'Asset Inventory')
    }

    if views_with_ai_name.length > 0
      views_with_ai_name
        .sort_by{ |view| view.createdAt }
        .last
    elsif views.length > 0
      views
        .sort_by{ |view| view.rowsUpdatedAt }
        .last
    else
      nil
    end
  end
end
