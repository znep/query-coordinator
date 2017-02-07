module VisualizationCanvasHelper
  def render_visualization_canvas_translations
    translations = LocaleCache.render_translations([LocalePart.visualization_canvas])['visualization_canvas']

    javascript_tag("var I18n = #{json_escape(translations.to_json)};")
  end

  def render_visualization_canvas_server_config
    server_config = {
      :appToken => APP_CONFIG.app_token,
      :csrfToken => form_authenticity_token.to_s,
      :currentUser => current_user,
      :domain => CurrentDomain.cname,
      :environment => Rails.env,
      :featureFlags => feature_flags_as_json
    }

    javascript_tag("var serverConfig = #{json_escape(server_config.to_json)};")
  end
end
