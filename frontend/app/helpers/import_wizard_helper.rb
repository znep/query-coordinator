module ImportWizardHelper

  def import_wizard_translations
    parts = [
      LocalePart.screens.import_pane,
      LocalePart.screens.import_common,
      LocalePart.screens.wizard,
      LocalePart.screens.dataset_new,
      LocalePart.screens.edit_metadata,
      LocalePart.core,
      LocalePart.plugins.fileuploader,
      LocalePart.screens.admin.jobs.show_page.event_messages
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
    modules = CurrentDomain.modules.pluck('name');
    enabled_modules = modules.select do |mod|
      CurrentDomain.module_enabled?(mod)
    end

    javascript_tag("var enabledModules = #{json_escape(enabled_modules)};")
  end

  def render_import_wizard_blist_licenses
    javascript_tag("var blistLicenses = #{json_escape(ExternalConfig.for(:license).licenses.to_json)};")
  end

  def render_import_wizard_server_config
    server_config = {
      :airbrakeEnvironment => ENV['AIRBRAKE_ENVIRONMENT_NAME'] || Rails.env,
      :airbrakeKey => ENV['PUBLISHING_AIRBRAKE_API_KEY'] || APP_CONFIG.publishing_airbrake_api_key,
      :airbrakeProjectId => ENV['PUBLISHING_AIRBRAKE_PROJECT_ID'] || APP_CONFIG.publishing_airbrake_project_id,
      :feature_flags => feature_flags_as_json,
      :environment => Rails.env,
      :reduxLogging => params['redux_logging'].nil? ?
        Rails.env == 'development' :              # We want to log when running in development mode
        params['redux_logging'] == 'true'         # or if we have the `redux_logging` query param
    }

    javascript_tag("var serverConfig = #{json_escape(server_config.to_json)};")
  end

  def render_import_wizard_view(view)
    javascript_tag("var view = #{json_escape(view)};")
  end

  def render_import_status(view)
    activities = ImportActivity.activities_of(view.id)
    javascript_tag("var issActivities = #{json_escape(JSON::dump(activities))};")
  end

  def render_import_wizard_license_options(selected_license = '')
    licenses = ExternalConfig.for(:license).merged_licenses
    licenses["-- #{t 'core.no_license'} --"] = ''

    options_for_select(licenses.sort_by(&:first), selected_license)
    javascript_tag("var licenses = #{json_escape(licenses.to_json)};")
  end

  def render_import_source(view)
    begin
      import_source = CoreServer::Base.connection.get_request("/views/#{view.id}/import_sources")
      javascript_tag("var importSource = #{json_escape(JSON::parse(import_source).to_json)};")
    rescue CoreServer::ResourceNotFound
      javascript_tag('var importSource = {};')
    end
  end

end
