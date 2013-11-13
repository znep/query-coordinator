module LocaleCache
  def self.load!
    # load and merge everything to start with
    @locales = locales = {}
    Dir.glob("#{Rails.root}/config/locales/*.yml") do |filename|
      locales.deep_merge!(YAML.load_file(filename) || {})
    end

    # merge in en as the backup fallthrough for all locales
    en_translations = locales['en']
    locales.each do |locale, translations|
      locales[locale] = en_translations.deep_merge(translations) { |en, other| other || en }
    end

    # set en as the fallback for all other locales
    I18n.backend.class.send(:include, I18n::Backend::Fallbacks)
    locales.each do |locale, _|
      I18n.fallbacks.map(locale => 'en') unless locale == 'en'
    end

    # init cache
    @cache = {}
  end

  def self.[](locale)
    @locales[locale]
  end

  def self.render_translations(relevant_parts)
    self.load! unless @cache # in dev env, this class gets reloaded and the cache needs rebuilding

    cache_key = relevant_parts.map{ |part| part.to_s }.sort.join('!') + ":#{I18n.locale}"
    return @cache[cache_key] if @cache.has_key? cache_key

    result = {}
    relevant_parts.each do |part|
      part.set!(result, part.get?(@locales[I18n.locale.to_s]))
    end

    @cache[cache_key] = result
    return result
  end
end
