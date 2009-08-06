require 'cgi'

module ThemesHelper
    def main_button_inactive_bg
        box :h => 35, :r => 10, :ry => 10, :fc => :main_button_bg, :s => 'h'
    end

    def main_button_active_bg
        box :h => 35, :r => 10, :ry => 10, :fc => :main_button_active_bg, :s => 'h'
    end

    def carousel_bg
        box :h => 235, :r => 5, :bc => 'ffffff', :fc => :carousel_bg, :s => 'h'
    end
    
    def expanded_list_bg
      # TODO: This should eventually be a gradient
      box :h => 1, :w => 150, :fc => :highlight_color
    end

    def bottom_left_dark_bg
      box :w => 18, :h => 18, :r => 9, :rw => 9, :ry => 9, :bc => "ececec", :fc => :highlight_color
    end

    def summary_bottom_right_bg
      box :w => 18, :h => 18, :fc => "cacaca", :bc => "ececec", :r => 9, :rx => 9, :rw => 9, :ry => 9, :ew => 1, :ec => :highlight_color
    end

    def background_info_tab_top_left_sprites
      # TODO: We need the ability to set dim/bright sprites, and to orient them SW->NE
    end

    def background_info_tab_top_right_sprites
      # TODO: We need the ability to set dim/bright sprites, and to orient them SW->NE      
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
