require 'cgi'

module ThemesHelper
    def main_button_inactive
        box :h => 35, :r => 10, :ry => 10, :fc => :main_button_bg, :s => 'h'
    end

    def main_button_active
        box :h => 35, :r => 10, :ry => 10, :fc => :main_button_active_bg, :s => 'h'
    end

    def discover_carousel
        box :h => 235, :r => 5, :bc => 'ffffff', :fc => :discover_carousel_bg, :s => 'h'
    end

    def box(options)
        ui_url :box, options
    end

    def th
        Theme
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
