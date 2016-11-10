module DatasetManagementUiHelper

  def dataset_management_ui_server_config
    {
      :environment => Rails.env
    }
  end

  def render_dataset_management_ui_server_config
    javascript_tag("var serverConfig = #{json_escape(dataset_management_ui_server_config.to_json)};")
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
