require 'json'

module Theme
    # Configure theming based on a web request
    def self.configure(request = nil)
        # TODO - create an actual registry and/or make this generally less dumb
        if request
            # Theme configuration
            host = request.host
            if host.index 'redwood'
                theme = 'redwood'
            end

            load_theme theme if theme

            # Legacy theme config (eventually to be merged into this system)
            if (request.host.match('gov'))
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
            eval <<-EOS
              def self.#{key}
                '#{ value.gsub '\'', '\\\'' }'
              end
            EOS
        end

        @@active_name = name
    end

    def self.active
        @@active_name
    end
    
    load_theme 'socrata'
end
