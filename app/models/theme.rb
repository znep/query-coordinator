require 'json'

module Theme
    # Configure theming based on a web request
    def self.configure(request = nil)
        load_theme 'socrata'
        
        if request
            # TODO - create an actual registry and/or make this generally less dumb
            
            # Theme configuration
            host = request.host
            if host.contains? 'redwood'
                theme = 'redwood'
            elsif host.contains? 'gov'
                theme = 'gov'
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

        options = JSON.parse definition
        options.each do |key, value|
            if value.is_a? Array
                value = value.to_json
            else
                value = "'#{value.to_s.gsub '\'', '\\\''}'"
            end
            
            eval <<-EOS
              def self.#{key.gsub /[ \-]/, '_'}
                #{value}
              end
            EOS
        end

        @@active_name = name
    end

    # Retrieve a CSS URL definition for a specific theme image
    def self.image(name)
        "url(/images/themes/#{Theme.active}/#{self.send name})"
    end

    # Determine the name of the active theme
    def self.active
        @@active_name
    end

    # Retrieve favicon URL for the theme
    def self.favicon
        "/images/themes/#{Theme.active}/favicon.ico"
    end    
end
