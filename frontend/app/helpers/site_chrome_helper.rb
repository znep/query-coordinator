# A lot of factors must be considered when determining whether the site chrome
# header/footer (H/F) will actually appear somewhere. Please consult and update
# the following documentation resource:
#
#   https://docs.google.com/spreadsheets/d/1VBIMiP42_G5cqeog9OZqzJxHHZCrzT8x6BguKuI1UIg/edit
#
# There is an unfortunate interdependence in this module - it is included into
# ApplicationHelper yet depends on module_enabled? and suppress_govstat? from
# that other helper - but as the new site chrome continues to be rolled out and
# normalized across products, it should be possible to alleviate this problem.
# This module also helps chip away at the 1KLOC ApplicationHelper, so yay.
module SiteChromeHelper

  # Determines whether we consider site chrome to be enabled, according to a
  # complex set of rules.
  def enable_site_chrome?
    # If there's no site appearance model, it can't be enabled.
    return false unless site_appearance

    # If we are in preview mode, it's always enabled.
    return true if site_chrome_preview_mode?

    # If we are using custom chrome, enable it.
    return true if enable_custom_chrome?

    # After this point, things get more complicated.
    #
    # The site appearance model contains a coarse-grained view of whether it
    # should be considered enabled in a given context, but within each context
    # there may be additional factors to account for.
    #
    # Each coarse-grained context roughly corresponds to one or more controllers
    # which can handle a request.
    case current_controller

      when CustomContentController
        # CustomContentController sets some variables to handle two contexts.
        if @on_homepage
          enable_site_chrome_on_homepage?
        elsif @using_dataslate
          enable_site_chrome_on_dataslate?
        else
          false
        end

      when DataLensController, NewUxBootstrapController
        enable_site_chrome_on_data_lens?

      else
        enable_site_chrome_on_open_data?

    end
  end

  # GovStat (OP) chrome is somewhat orthogonal to the other logic, but it ends
  # up having important interactions with site chrome.
  def enable_govstat_chrome?
    (FeatureFlags.derive(nil, request)[:show_govstat_header] || module_enabled?(:govStat)) && !suppress_govstat?
  end

  # The site chrome may act as a vehicle for custom chrome.
  def enable_custom_chrome?
    site_appearance.custom_content_activated?
  end

  # We won't necessarily render the site chrome H/F just because site chrome is
  # considered to be enabled; in certain situations, we override the rendering
  # with a @suppress_chrome property.
  def render_site_chrome?
    return false if @suppress_chrome || current_controller.disable_site_chrome?

    enable_site_chrome?
  end

  # Similarly, the legacy chrome will only be rendered if we're not rendering
  # the site chrome and we're not suppressing all chrome. OP domains also don't
  # use the legacy chrome.
  def render_legacy_chrome?
    return false if @suppress_chrome

    return false if enable_govstat_chrome?

    !enable_site_chrome?
  end

  # There's also the admin header to consider. This header does a run-around so
  # it can be shown on OP domains without site chrome actually being activated.
  def render_site_admin_chrome?
    return false if @suppress_chrome

    enable_govstat_chrome?
  end

  def site_chrome_preview_mode?
    !!cookies[:socrata_site_chrome_preview]
  end

  def site_chrome_published_mode?
    !site_chrome_preview_mode?
  end

  # Determines the size of the site chrome H/F to use.
  #
  # TODO: figure out a better way to do this, because DL uses different sizes
  # for its header and footer.
  def site_chrome_size
    if @view.try(:data).try(:[], 'id').present?
      'small'
    else
      nil
    end
  end

  private

  def enable_site_chrome_on_homepage?
    # Delegate to the site appearance model.
    site_appearance.is_activated_on?('homepage')
  end

  def enable_site_chrome_on_dataslate?
    # Delegate to the site appearance model, which has some special logic here.
    site_appearance.enabled_on_dataslate?(defined?(request) && request)
  end

  def enable_site_chrome_on_data_lens?
    # Delegate to the site appearance model.
    site_appearance.is_activated_on?('data_lens')
  end

  def enable_site_chrome_on_open_data?
    case current_controller
      when StylesController
        false
      else
        site_appearance.is_activated_on?('open_data')
    end
  end

  def site_appearance
    SiteAppearance.find
  end

  # Because this helper may be called either by the controller itself or by the
  # layout directly, we do a little dance to determine which controller this is.
  # (We could use the controller_name method instead, but that would give us
  # strings for our case statement comparisons instead of classes.)
  def current_controller
    @current_controller ||= self.is_a?(ActionController::Base) ? self : self.controller
  end

end
