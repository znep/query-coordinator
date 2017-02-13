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

  def render_visualization_canvas_session_data
    view = @view.id.nil? ? @parent_view : @view

    session_data = {
      :userId => current_user.try(:id) || 'N/A',
      :ownerId => view.try(:owner).try(:id) || 'N/A',
      :userOwnsDataset => view.owned_by?(current_user),
      :socrataEmployee => current_user.try(:is_superadmin?) || false,
      :userRoleName => current_user.try(:roleName) || 'N/A',
      :viewId => view.try(:id) || 'N/A',
      :email => current_user.try(:email).to_s
    }

    javascript_tag("var sessionData = #{json_escape(session_data.to_json)};")
  end

end
