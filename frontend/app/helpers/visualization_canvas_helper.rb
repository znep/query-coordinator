module VisualizationCanvasHelper
  def visualization_canvas_translations
    translations = LocaleCache.render_translations([LocalePart.visualization_canvas])['visualization_canvas']
    translations.deep_merge(
      'common' => LocaleCache.render_translations([LocalePart.common])['common']
    )
  end

  def render_visualization_canvas_translations
    old_translations = json_escape(visualization_canvas_translations.to_json)
    new_translations = json_escape(LocaleCache.render_partial_translations(:visualization_canvas).to_json)
    javascript_tag("var I18n = #{old_translations}; var translations = #{new_translations};")
  end

  def render_visualization_canvas_server_config
    server_config = {
      :airbrakeEnvironment => ENV['AIRBRAKE_ENVIRONMENT_NAME'] || Rails.env,
      :airbrakeKey => ENV['VISUALIZATION_CANVAS_AIRBRAKE_API_KEY'] ||
        APP_CONFIG.visualization_canvas_airbrake_api_key,
      :airbrakeProjectId => ENV['VISUALIZATION_CANVAS_AIRBRAKE_PROJECT_ID'] ||
        APP_CONFIG.visualization_canvas_airbrake_project_id,
      :appToken => APP_CONFIG.app_token,
      :csrfToken => form_authenticity_token.to_s,
      :currentUser => current_user,
      :customConfigurations => visualization_canvas_configurations,
      :domain => CurrentDomain.cname,
      :environment => Rails.env,
      :locale => I18n.locale.to_s,
      :localePrefix => locale_prefix,
      :usersnapProjectID => 'e4969b77-3ec6-4628-a022-6c12ba02cbea'
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

  def visualization_canvas_configurations
    configs = CurrentDomain.configuration(:visualization_canvas).try(:properties) || {}
    configs.deep_transform_keys { |key| key.to_s.camelize(first_letter = :lower) }
  end

end
