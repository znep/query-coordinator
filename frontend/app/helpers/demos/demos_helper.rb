module Demos::DemosHelper
  def render_demos_javascript_environment
    render_demos_translations << render_feature_flags_for_javascript
    render_demos_translations << render_server_config
  end

  def render_demos_translations
    # Standard cross-app translations.
    new_translations = json_escape(LocaleCache.render_partial_translations(:shared).to_json)
    javascript_tag("var translations = #{new_translations};")
  end

  def render_server_config
    server_config = {
      :mapboxAccessToken => ENV['MAPBOX_ACCESS_TOKEN'] || APP_CONFIG.mapbox_access_token
    }
    javascript_tag("var serverConfig = #{json_escape(server_config.to_json)};")
  end
end
