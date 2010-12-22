class AssetMapper

  def initialize(config, to_map)
    unless config.nil? || to_map.nil?
      @asset_map = {}
      to_map.each do |type, package_list|
        @asset_map[type] = {}
        package_list.each do |package_name|
          if Rails.env.development?
            @asset_map[type][package_name] = config[type][package_name]
              .map {|item| item.sub(STRIP_PREFIX, '') }
          else
            @asset_map[type][package_name] = config['package_path'] + '/' +
              package_name + '.js?' + Time.now().to_i.to_s
          end
        end
      end
    end
  end

  def javascripts
    if @mapped_js.nil?
      @mapped_js = @asset_map['javascripts'].to_json
    end
    @mapped_js
  end

# Jammit needs the path relative to Rails root, but that's
# not part of the publicly accessible URL
  STRIP_PREFIX = 'public'
end
