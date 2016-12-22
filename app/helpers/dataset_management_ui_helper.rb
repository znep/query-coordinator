module DatasetManagementUiHelper

  def dataset_management_ui_server_config(websocket_token)
    {
      :environment => Rails.env,
      :csrfToken => form_authenticity_token.to_s,
      :appToken => APP_CONFIG.app_token,
      :websocketToken => websocket_token
    }
  end

  def render_dataset_management_ui_server_config(websocket_token = nil)
    config = dataset_management_ui_server_config(websocket_token)
    javascript_tag("var serverConfig = #{json_escape(config.to_json)};")
  end

  def render_dataset_management_ui_translations
    translations = LocaleCache.render_translations([LocalePart.dataset_management_ui])['dataset_management_ui'].
      merge({
        data_types: LocaleCache.render_translations([LocalePart.core.data_types])['core']['data_types'],
        edit_metadata: LocaleCache.render_translations([LocalePart.screens.edit_metadata])['screens']['edit_metadata']
      })
    javascript_tag("var I18n = #{json_escape(translations.to_json)};")
  end

end
