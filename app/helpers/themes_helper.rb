require 'cgi'

module ThemesHelper
    # In order to avoid alpha transparent PNGs (for IE6 support) we emulate the background gradient on our main
    # navigation buttons.  I chose the colors by using a color meter on our actual rendered site.  Not that we really
    # support IE6 anyway.
    MAIN_BUTTON_BG = 'c7c8ca:.286,e6e7e7'
        
    SUMMARY_INSIDE_BG = 'cacaca'
    SUMMARY_OUTSIDE_BG = 'ececec'
    SUMMARY_HOVER_BG = 'e3ecf7'

    WELCOME_TOP_BG = '2f608f:.286,0f3c69'
    WELCOME_BOTTOM_BG = 'd7ecf9'
    WELCOME_EDGE = '9ba5a1'

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
    
    def background_summary_list_title
      box :h => 19, :w => 19, :r => 9, :rw => 9, :bc => :highlight_color, :fc => SUMMARY_HOVER_BG
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
    
    def background_expanded_list
      box :h => 3, :w => 150, :rh => 1, :ry => 1, :bc => :highlight_color
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

    def welcome_top
      box :rh =>34, :s => 'h', :h => 44, :r => 10, :fc => WELCOME_TOP_BG, :ec => WELCOME_EDGE, :ew => 1
    end

    def welcome_bottom
      box :ry => 10, :rh => 78, :s => 'h', :h => 88, :r => 10, :fc => WELCOME_BOTTOM_BG, :ec => WELCOME_EDGE, :ew => 1
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

# utility class for calculating colors
class Color
  attr_accessor :rgb

  def +(other)
    calc_rgb = []
    self.rgb.each_index{ |i| calc_rgb << [self.rgb[i] + other.rgb[i], 255].min}
    Color.from_rgb(calc_rgb)
  end

  def to_s
    Color.rgb_to_hex(self.rgb)
  end

  def self.from_hex(hex)
    color = Color.new
    color.rgb = Color.hex_to_rgb(hex)
    return color
  end

  def self.from_rgb(rgb)
    color = Color.new
    color.rgb = rgb
    return color
  end

  def self.hex_to_rgb(hex)
    if hex.size < 6
      hex.gsub!(/([0-9a-fA-F])/, "$1$1")
    end
  	hex = hex.gsub(/#/, '').to_i(16)

  	return [ (hex >> 16), (hex & 0x00FF00) >> 8, (hex & 0x0000FF) ]
  end
  
  def self.rgb_to_hex(rgb)
    rgb.map{ |value| "%02x" % value }.join
  end
end