module OpMeasureHelper
  def op_measure_translations
    translations = LocaleCache.render_translations([LocalePart.open_performance])['open_performance']
    translations.deep_merge(
      'common' => LocaleCache.render_translations([LocalePart.common])['common']
    )
  end

  def render_op_measure_translations
    old_translations = json_escape(op_measure_translations.to_json)
    new_translations = json_escape(LocaleCache.render_partial_translations(:open_performance).to_json)
    javascript_tag("var I18n = #{old_translations}; var translations = #{new_translations};")
  end

  def render_op_measure_server_config
    server_config = {
      :airbrakeEnvironment => ENV['AIRBRAKE_ENVIRONMENT_NAME'] || Rails.env,
      :airbrakeKey => ENV['OP_MEASURE_AIRBRAKE_API_KEY'] ||
        APP_CONFIG.op_measure_airbrake_api_key,
      :airbrakeProjectId => ENV['OP_MEASURE_AIRBRAKE_PROJECT_ID'] ||
        APP_CONFIG.op_measure_airbrake_project_id,
      :appToken => APP_CONFIG.app_token,
      :csrfToken => form_authenticity_token.to_s,
      :currentUser => current_user,
      :domain => CurrentDomain.cname,
      :environment => Rails.env,
      :usersnapProjectID => '4e60055c-c036-4884-a35a-53d921c21cb1'
    }

    javascript_tag("var serverConfig = #{json_escape(server_config.to_json)};")
  end

  def render_op_measure_session_data
    session_data = {
      :userId => current_user.try(:id) || 'N/A',
      :ownerId => @view.try(:owner).try(:id) || 'N/A',
      :userOwnsDataset => @view.owned_by?(current_user),
      :socrataEmployee => current_user.try(:is_superadmin?) || false,
      :userRoleName => current_user.try(:roleName) || 'N/A',
      :viewId => @view.try(:id) || 'N/A',
      :email => current_user.try(:email).to_s
    }

    javascript_tag("var sessionData = #{json_escape(session_data.to_json)};")
  end

  def op_measure_initial_state
    # If this becomes more complex, parts can be factored out into view.rb; see
    # visualization canvas treatment of initial state for comparison.
    {
      :mode => @edit_mode ? 'EDIT' : 'VIEW',
      :measure => {
        :name => @view.name,
        :description => @view.description || 'Description goes here',
        :metadata => {
          :methods => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
          :analysis => 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. '
        },
        :metric => {}
      }
    }
  end
end
