module ApplicationHelper
  include SiteChromeConsumerHelpers
  include LocaleHelper

  # Build translations to pass into javascript
  # Loads only from the lang/editor
  def current_editor_translations
    @translations ||= begin
      I18n.backend.send(:init_translations)
      I18n.backend.send(:translations)
    end

    locale_translations = (@translations[current_locale] || {}).with_indifferent_access
    default_translations = @translations[I18n.default_locale].with_indifferent_access

    locale_translations.reverse_merge!(default_translations)

    locale_translations.slice(:editor, :common, :shared)
  end

  def default_meta_tags(tags = [])
    defaults = [
      tag('meta', :charset => 'utf-8'),
      tag('meta', 'http-equiv' => 'x-ua-compatible', :content => 'ie=edge')
    ]

    (defaults + tags).uniq.join("\n").html_safe
  end

  def storyteller_javascript_include_tag(file)
    root = Rails.application.config.relative_url_root

    if webpack_assets
      uri = "#{root}/js/#{webpack_assets[file]['js']}"
    else
      uri = "#{root}/js/#{file}.js"
    end

    content_tag('script', '', :type => 'text/javascript', :src => uri)
  end

  def icon_with_aria_text(text, opts = {})
    content_tag(:span, aria_text_span(text), :class => opts.fetch(:class, 'icon'))
  end

  def aria_text_span(text)
    content_tag(:span, text, :class => 'aria-not-displayed')
  end

  def page_title
    page_title_parts = []
    page_title_parts << @story_metadata.title
    page_title_parts << site_chrome_window_title unless site_chrome_window_title.blank?

    page_title_parts.join(' | ')
  end

  # Renders pendo tracker code if pendo_tracking feature enabled.
  # Only runs for logged in users.
  def render_pendo_tracker
    if pendo_tracking_enabled?
      first_name = ''
      last_name = ''
      display_name = current_user && current_user['displayName']

      if display_name
        names = display_name.split
        if names.length == 1 || names.length > 2
          first_name = display_name
        elsif names.length == 2
          first_name, last_name = names
        end
      end

      pendo_config = {
        :token => Rails.application.config.pendo_token,
        :visitor => {
          :id => current_user && current_user['email'],
          :socrataID => (current_user && current_user['id']) || 'N/A',
          :userRole => (current_user && current_user['roleName']) || 'N/A',
          :firstName => first_name,
          :lastName => last_name,
          :socrataEmployee => current_user.try(:[], 'flags').try(:include?, 'admin') || false
        },
        :account => {
          :id => request.host,
          :domain => request.host,
          :environment => Rails.env,
          :hasPerspectives => true
        }
      }

      render 'shared/pendo_tracking', :pendo_config => pendo_config
    end
  end

  private

  def webpack_assets
    location = Rails.root.join('webpack-assets.json')
    @manifest ||= JSON.parse(File.read(location)) if File.exists?(location)
  end

  # TODO this functionality is duplicated in frontend. Since the monorepo is
  # impending, we'll tackle sharing the code once we're in the same repo.
  #
  # Places feature flags at window.socrata.featureFlags
  # for consumption by the FeatureFlags module in frontend-utils.
  def render_feature_flags_for_javascript
    flags = case Rails.application.config.feature_flag_service
            when :signaller then Signaller::FeatureFlags.on_domain(request.host)
            when :monitor then FeatureFlagMonitor.flags_on(domain: request.host)
            end
    javascript_tag(<<~OUT, :id => 'feature-flags'
      window.socrata = window.socrata || {};
      window.socrata.featureFlags = #{flags.to_json};
    OUT
    )
  end

end
