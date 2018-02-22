module DatasetManagementUiHelper
  def dataset_management_ui_server_config(websocket_token, is_data_asset = nil)
    {
      environment: Rails.env,
      csrfToken: form_authenticity_token.to_s,
      appToken: APP_CONFIG.app_token,
      websocketToken: websocket_token,
      airbrakeEnvironment: ENV['AIRBRAKE_ENVIRONMENT_NAME'] || Rails.env,
      airbrakeKey: ENV['PUBLISHING_AIRBRAKE_API_KEY'] || APP_CONFIG.publishing_airbrake_api_key,
      airbrakeProjectId: ENV['PUBLISHING_AIRBRAKE_PROJECT_ID'] || APP_CONFIG.publishing_airbrake_project_id,
      currentUser: User.current_user,
      localePrefix: locale_prefix,
      locale: I18n.locale.to_s,
      featureFlags: feature_flags_as_json,
      :mapboxAccessToken => ENV['MAPBOX_ACCESS_TOKEN'] || APP_CONFIG.mapbox_access_token,
      usersnapProjectID: 'b08ab2ec-8952-4e7f-8e61-85501ece585a'
    }
  end

  def render_dataset_management_ui_server_config(websocket_token = nil, is_data_asset = nil, deleted_at = nil)
    config = dataset_management_ui_server_config(websocket_token, is_data_asset)
    url_params = {
      isDataAsset: is_data_asset,
      deletedAt: deleted_at
    }
    javascript_tag(%Q{
      var serverConfig = #{json_escape(config.to_json)};
      var urlParams = #{json_escape(url_params.to_json)};
    })

  end

  def get_dataset_management_ui_custom_metadata
    CurrentDomain.property(:fieldsets, :metadata) || []
  end

  def render_dataset_management_ui_translations
    translations = LocaleCache.render_translations([LocalePart.dataset_management_ui])['dataset_management_ui']
    translations = translations.merge(
      data_types: LocaleCache.render_translations([LocalePart.core.data_types])['core']['data_types'],
      edit_metadata: LocaleCache.render_translations([LocalePart.screens.edit_metadata])['screens']['edit_metadata']
    )

    common = LocaleCache.render_translations([LocalePart.common])['common']

    if translations.key?('common')
      translations['common'] = translations['common'].merge(common)
    else
      translations = translations.merge(common: common)
    end

    old_translations = json_escape(translations.to_json)
    new_translations = json_escape(LocaleCache.render_partial_translations(:dataset_management_ui).to_json)
    javascript_tag("var I18n = #{old_translations}; var translations = #{new_translations}")
  end
end
