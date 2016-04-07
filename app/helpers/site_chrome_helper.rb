module SiteChromeHelper
  def social_link_classname(type)
    {
      'facebook' => 'icon-facebook',
      'twitter' => 'icon-twitter'
    }[type.to_s.downcase]
  end

  def localized(locale_key, locales)
    # TODO - actually handle different locales
    locales['en'].dig(*locale_key.split('.'))
  end
end
