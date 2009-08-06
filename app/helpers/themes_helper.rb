require 'cgi'

module ThemesHelper
    # In order to avoid alpha transparent PNGs (for IE6 support) we emulate the background gradient on our main
    # navigation buttons.  I chose the colors by using a color meter on our actual rendered site.  Not that we really
    # support IE6 anyway.
    MAIN_BUTTON_BG = 'c7c8ca:.286,e6e7e7'

    def main_button_inactive_bg
        box :h => 35, :r => 10, :ry => 10, :fc => :main_button_bg, :bc => MAIN_BUTTON_BG, :s => 'h'
    end

    def main_button_active_bg
        box :h => 35, :r => 10, :ry => 10, :fc => :main_button_active_bg, :bc => MAIN_BUTTON_BG, :s => 'h'
    end

    def carousel_bg
        box :h => 235, :r => 5, :bc => 'ffffff', :fc => :carousel_bg, :s => 'h'
    end

    def box(options)
        ui_url :box, options
    end

private

    def ui_url type, options
        "url(/ui/#{type}.png?#{make_arguments options})"
    end

    def make_arguments(options)
        options.collect do |key, value|
            value = Theme.send value if value.is_a? Symbol
            value = value.to_s
            "#{CGI.escape key.to_s}=#{CGI.escape value}"
        end.join '&'
    end
end
