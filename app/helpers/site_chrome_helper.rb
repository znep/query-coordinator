module SiteChromeHelper
  def site_name
    @site_name ||= localized('general.site_name', @locales) || ''
  end

  def logo(source)
    image_tag(source['logo']['src'], :alt => source['logo']['alt'] || site_name)
  end

  def copyright
    "\u00A9 #{Time.now.year}, #{site_name}"
  end

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
