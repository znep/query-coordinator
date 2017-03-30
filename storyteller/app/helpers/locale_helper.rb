module LocaleHelper
  def current_locale
    # NOTE: LocaleConfig makes a network request, so don't try to optimize this
    # by assigning the default locale to a variable before checking params.
    @current_locale ||= params.try(:[], :locale) ||
      SocrataSiteChrome::LocaleConfig.new(CoreServer.current_domain['cname']).
        get_locale_config['default_locale']
  end
end
