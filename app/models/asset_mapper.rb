class AssetMapper

  def initialize(config, to_map)
    unless config.nil? || to_map.nil?
      @asset_map = {}
      to_map.each do |type, package_list|
        @asset_map[type] = {}
        @asset_map['debug_' + type] = {}
        package_list.each do |package_name|
          @asset_map[type][package_name] = "/#{config['package_path']}/#{package_name}.js?#{Time.now().to_i.to_s}"
          @asset_map['debug_' + type][package_name] = config[type][package_name].map do
            |item| "#{item.sub(STRIP_PREFIX, '')}?#{Time.now().to_i.to_s}"
          end
        end
      end
    end
  end

  def javascripts
    return debug_javascripts if Rails.env.development? || FeatureFlags.derive.debug_assets
    @_javascripts ||= @asset_map['javascripts'].to_json
  end

  def debug_javascripts
    @_debug_javascripts ||= @asset_map['debug_javascripts'].to_json
  end

# Jammit needs the path relative to Rails root, but that's
# not part of the publicly accessible URL
  STRIP_PREFIX = 'public'
end
