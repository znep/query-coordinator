module DatasetLandingPageHelper
  include Socrata::UrlHelpers

  def meta_description
    if @view.description.present?
      "#{@view.name} - #{@view.description}"
    else
      @view.name
    end
  end

  def dataset_landing_page_translations
    translations = LocaleCache.render_translations([LocalePart.dataset_landing_page])['dataset_landing_page']
    translations.deep_merge(
      'common' => LocaleCache.render_translations([LocalePart.common])['common'],
      'data_types' => LocaleCache.render_translations([LocalePart.core.data_types])['core']['data_types'],
      # XXX: Need this to keep ExportFlannel a common component.
      'dataset_landing_page' => LocaleCache.render_translations([LocalePart.dataset_landing_page])['dataset_landing_page']
    )
  end

  def render_dataset_landing_page_translations
    old_translations = json_escape(dataset_landing_page_translations.to_json)
    new_translations = json_escape(LocaleCache.render_partial_translations(:dataset_landing_page).to_json)

    javascript_tag("var I18n = #{old_translations}; var translations = #{new_translations}")
  end

  def render_dataset_landing_page_session_data
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

  def render_dataset_landing_page_server_config
    server_config = {
      :airbrakeEnvironment => ENV['AIRBRAKE_ENVIRONMENT_NAME'] || Rails.env,
      :airbrakeKey => ENV['DATASET_LANDING_PAGE_AIRBRAKE_API_KEY'] ||
        APP_CONFIG.dataset_landing_page_airbrake_api_key,
      :airbrakeProjectId => ENV['DATASET_LANDING_PAGE_AIRBRAKE_PROJECT_ID'] ||
        APP_CONFIG.dataset_landing_page_airbrake_project_id,
      :appToken => APP_CONFIG.app_token,
      :csrfToken => form_authenticity_token.to_s,
      :currentUser => current_user,
      :domain => CurrentDomain.cname,
      :environment => Rails.env,
      :featureFlags => feature_flags_as_json,
      :locale => I18n.locale.to_s,
      :localePrefix => locale_prefix,
      :mapboxAccessToken => ENV['MAPBOX_ACCESS_TOKEN'] || APP_CONFIG.mapbox_access_token,
      :recaptchaKey => RECAPTCHA_2_SITE_KEY,
      :usersnapProjectID => 'db69b856-0f89-42cb-aec0-83c78ba79c03'
    }

    javascript_tag("var serverConfig = #{json_escape(server_config.to_json)};")
  end
end
