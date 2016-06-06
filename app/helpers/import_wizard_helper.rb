module ImportWizardHelper

  def import_wizard_translations
    parts = [
        LocalePart.screens.import_pane,
        LocalePart.screens.wizard,
        LocalePart.screens.dataset_new,
        LocalePart.screens.edit_metadata,
        LocalePart.plugins.fileuploader
    ]
    LocaleCache.render_translations(parts)
  end

  def render_import_wizard_translations
    javascript_tag("var I18n = #{json_escape(import_wizard_translations.to_json)};")
  end

  def render_importable_types
    javascript_tag("var importableTypes = #{json_escape(Column.importable_types(request).to_a.to_json)};")
  end

  def render_dataset_categories
    javascript_tag("var datasetCategories = #{json_escape(flatten_category_tree)};")
  end

  def render_enabled_modules
    javascript_tag("var enabledModules = #{json_escape(CurrentDomain.modules.pluck('name'))};")
  end

  def render_licenses
    javascript_tag("blist.namespace.fetch('blist.licenses');"\
                   "blist.licenses = #{ safe_json(ExternalConfig.for(:license).licenses) };")
  end

end
