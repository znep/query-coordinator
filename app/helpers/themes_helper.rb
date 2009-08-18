require 'cgi'

module ThemesHelper
    # In order to avoid alpha transparent PNGs (for IE6 support) we emulate the background gradient on our main
    # navigation buttons.  I chose the colors by using a color meter on our actual rendered site.  Not that we really
    # support IE6 anyway.
    MAIN_BUTTON_BG = 'c7c8ca:.286,e6e7e7'
        
    SUMMARY_INSIDE_BG = 'cacaca'
    SUMMARY_OUTSIDE_BG = 'ececec'

    def main_button_inactive_bg
        box :h => 35, :r => 10, :ry => 10, :fc => :main_button_bg, :bc => MAIN_BUTTON_BG, :s => 'h'
    end

    def main_button_active_bg
        box :h => 35, :r => 10, :ry => 10, :fc => :main_button_active_bg, :bc => MAIN_BUTTON_BG, :s => 'h'
    end

    def carousel_bg
        box :h => 235, :r => 5, :bc => 'ffffff', :fc => :carousel_bg, :s => 'h'
    end
    
    def expanded_list_bg
      # TODO: This should eventually be a gradient
      box :h => 3, :ry => 1, :rh => 1, :w => 150, :bc => :highlight_color
    end

    def bottom_left_dark_bg
      box :w => 18, :h => 18, :r => 9, :rw => 9, :ry => 9, :bc => SUMMARY_OUTSIDE_BG, :fc => :highlight_color
    end

    def summary_bottom_right_bg
      box :w => 18, :h => 18, :fc => SUMMARY_INSIDE_BG, :bc => SUMMARY_OUTSIDE_BG, :r => 9, :rx => 9, :rw => 9, :ry => 9, :ew => 1, :ec => :highlight_color
    end

    def summary_bottom_left_bg
      box :w => 18, :h => 18, :fc => SUMMARY_INSIDE_BG, :bc => SUMMARY_OUTSIDE_BG, :r => 9, :rw => 9, :ry => 9, :ew => 1, :ec => :highlight_color
    end

    def summary_tab_bg
        box :h => 23, :r => 3, :rh => 20, :fc => SUMMARY_OUTSIDE_BG, :bc => SUMMARY_OUTSIDE_BG, :ew => 1, :ec => :highlight_color, :s => 'h'
    end

    def summary_tab_active_bg
        box :h => 23, :r => 3, :rh => 20, :fc => SUMMARY_INSIDE_BG, :bc => SUMMARY_OUTSIDE_BG, :ew => 1, :ec => :highlight_color, :s => 'h'
    end
    
    def button_hover_slice_bg
      box :h => 24, :w => 3, :rx => 1, :rw => 1, :fc => :menu_button_bg
    end

    def button_hover_endcap_bg
      box :h => 24, :w => 5, :fc => :menu_button_bg
    end

    def button_activated_slice_bg
      box :h => 24, :w => 3, :rx => 1, :rw => 1, :fc => :menu_button_activated_bg
    end
    
    def button_activated_endcap_bg
      box :h => 24, :w => 5, :fc => :menu_button_activated_bg
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
