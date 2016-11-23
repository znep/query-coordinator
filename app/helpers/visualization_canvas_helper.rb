module VisualizationCanvasHelper
  def render_visualization_canvas_translations
    translations = LocaleCache.render_translations([LocalePart.visualization_canvas])['visualization_canvas']

    javascript_tag("var I18n = #{json_escape(translations.to_json)};")
  end

  def render_visualization_canvas_server_config
    server_config = {
      :domain => CurrentDomain.cname,
      :environment => Rails.env
    }

    javascript_tag("var serverConfig = #{json_escape(server_config.to_json)};")
  end
end
