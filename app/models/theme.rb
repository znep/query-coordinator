require 'json'

module Theme
  # Configure theming based on a web request
  def self.configure(request = nil)
    load_theme 'socrata'

    if request
      # TODO - create an actual registry and/or make this generally less dumb

      # Theme configuration
      host = request.host
      if host.include? 'redwood'
        theme = 'redwood'
      elsif host.include? 'datasf'
        theme = 'datasf'
      elsif host.include? 'ohioag'
        theme = 'ohioag'
      elsif host.include? 'utah'
        theme = 'utah'
      elsif host.match(/^az\.(?:.+\.)?socrata\.com$/)
        theme = 'arizona'
      elsif host.include? 'redmond'
        theme = 'redmond'
      elsif host.include? 'ers'
        theme = 'ers'
      elsif host.include? 'portland'
        theme = 'portland'
      elsif host.include? 'kingcounty'
        theme = 'kingcounty'
      elsif host.include? 'gov'
        theme = 'gov'
      elsif host.include? 'chicago'
        theme = 'cityofchicago'
      elsif host.include? 'austin'
        theme = 'cityofaustin'
      elsif host.include? 'nwpublic'
        theme = 'nwpublic'
      elsif host.include? 'seattle'
        theme = 'cityofseattle'
      end

      load_theme theme if theme

      # Legacy theme config (to be phased out)
      if (host.match('gov'))
        I18n.locale = 'gov'
      else
        # Force the locale back to blist if we're not datagov
        I18n.locale = 'blist'
      end
    end
  end

  # Load a theme with a specific name
  def self.load_theme(name)
    return false unless name

    begin
      definition = File.read Rails.root + 'config/themes' + "#{name}.json"
    rescue
      return false
    end

    @@options = JSON.parse definition
    @@active_name = name
  end
  
  # Method missing is a lot cleaner. Really.
  def self.method_missing(meth, *args, &blk)
    if !@@options[meth.id2name].nil?
      @@options[meth.id2name]
    elsif !@@options[meth.id2name.gsub(/_/, " ")].nil?
      @@options[meth.id2name.gsub(/_/, " ")]
    else
      nil
    end
  end

  # Retrieve a CSS URL definition for a specific theme image
  def self.image(name)
    "url(/images/themes/#{Theme.active}/#{self.send name})"
  end

  # Determine the name of the active theme
  def self.active
    @@active_name
  end

  # The body class included for themes
  def self.body_class
    ".#{@@active_name}"
  end

  # Retrieve favicon URL for the theme
  def self.favicon
    "/images/themes/#{Theme.active}/favicon.ico"
  end
end
