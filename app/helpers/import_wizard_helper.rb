module ImportWizardHelper

  def import_wizard_translations
    parts = [
      LocalePart.screens.import_pane,
      LocalePart.screens.import_common,
      LocalePart.screens.wizard,
      LocalePart.screens.dataset_new,
      LocalePart.screens.edit_metadata,
      LocalePart.core,
      LocalePart.plugins.fileuploader
    ]
    LocaleCache.render_translations(parts)
  end

  def render_import_wizard_translations
    javascript_tag("var I18n = #{json_escape(import_wizard_translations.to_json)};")
  end

  def render_import_wizard_custom_metadata
    javascript_tag("var customMetadataSchema = #{json_escape((CurrentDomain.property(:fieldsets, :metadata) || []).to_json)};")
  end

  def render_import_wizard_importable_types
    javascript_tag("var importableTypes = #{json_escape(Column.importable_types(request).to_a.to_json)};")
  end

  def render_import_wizard_dataset_categories
    javascript_tag("var datasetCategories = #{json_escape(flatten_category_tree)};")
  end

  def render_import_wizard_enabled_modules
    javascript_tag("var enabledModules = #{json_escape(CurrentDomain.modules.pluck('name'))};")
  end

  def render_import_wizard_licenses
    javascript_tag("blist.namespace.fetch('blist.licenses');"\
                   "blist.licenses = #{safe_json(ExternalConfig.for(:license).licenses)};")
  end

  def render_import_wizard_server_config
    server_config = {
      airbrakeKey: ENV['PUBLISHING_AIRBRAKE_API_KEY'] || APP_CONFIG.publishing_airbrake_api_key,
      environment: Rails.env
    }

    javascript_tag("var serverConfig = #{json_escape(server_config.to_json)}")
  end

  def render_import_wizard_view(view)
    javascript_tag("var view = #{json_escape(view)};")
  end

end
