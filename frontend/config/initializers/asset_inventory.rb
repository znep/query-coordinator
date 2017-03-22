require 'asset-inventory'

AssetInventory.configure do |config|
  config.host = ENV.fetch('ASSET_INVENTORY_SERVICE_URL', '')
end
