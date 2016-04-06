module SiteChromeHelper
  def social_link_classname(type)
    {
      'facebook' => 'icon-facebook',
      'twitter' => 'icon-twitter'
    }[type.to_s.downcase]
  end

  def localized(key, locales)
    # TODO - handling different locales
    locales['en'].dig(*key.split('.')) || key
  end
end
