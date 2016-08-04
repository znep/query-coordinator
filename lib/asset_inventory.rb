module AssetInventory
  def self.find
    views = Clytemnestra.search_cached_views(
      { :nofederate => true, :limitTo => 'assetinventory', :admin => true }).results
      .sort_by { |view| view.createdAt }

    if views.length > 0
      views.last
    else
      nil
    end
  end
end
