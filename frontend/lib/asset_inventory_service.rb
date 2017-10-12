require 'asset-inventory'
require 'cetera'

module AssetInventoryService

  class InternalAssetManager
    def self.find(request_id, cookie = nil, search_options = {})
      cetera_catalog_search_client = Cetera::Utils.catalog_search_client
      cetera_catalog_search_client.find_views(request_id, cookie, search_options)
    end
  end

  def self.find(cached = true)
    search_operation = cached ? :search_cached_views : :search_views
    search_options = { :nofederate => true, :limitTo => 'assetinventory', :admin => true }
    views = Clytemnestra.send(search_operation, search_options).results

    views_with_ai_name = views.select do |view|
      (view.name == 'Dataset of Datasets') || (view.name == 'Asset Inventory')
    end

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

  def self.api_configured?
    AssetInventory::ApiClient.default.config.host.present?
  end

  def self.api
    return unless api_configured?

    @api ||= AssetInventory::JobsApi.new
  end

  def self.create_asset_inventory
    return false unless api_configured?

    opts = {
      :body => AssetInventory::AssetInventoryJob.new(
        'sourceDomain' => "https://#{CurrentDomain.cname}",
        'nextExecutionAt' => '2015-01-01T00:00:00Z',
        'executionInterval' => 1.day.in_milliseconds
      )
    }

    begin
      api.create_job(opts)
      true
    rescue AssetInventory::ApiError => e
      Rails.logger.warn("Error creating asset inventory: #{e}")
      false
    end
  end
end
