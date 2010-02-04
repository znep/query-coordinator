require 'cgi'

module ThemesHelper
    def main_submenu_last_bg(color)
      box :h => 35, :w => 20, :r => 10, :ry => 10, :rx => 10, :fc => color
    end

    def box(options)
      ui_url(:box, options)
    end

    def link_from_theme(options)
      text = options[:text]
      options.delete(:text)
      return content_tag('a', text, options)
    end

    def color_string(array)
      array.map{ |stop| stop.has_key?(:position) ? "#{stop[:color]}:#{stop[:position]}" : stop[:color] }.join(',')
    end

    def theme_image(options)
      "url(#{theme_image_url(options)})"
    end

    def theme_image_url(options)
      if options[:type].to_s == "static"
        return "#{options[:source]}"
      elsif options[:type].to_s == "hosted"
        return "/assets/#{options[:source]}"
      end
    end

    safe_helper :box

private

    def ui_url(type, options)
      "url(/ui/#{type}.png?#{make_arguments options})"
    end

    def make_arguments(options)
      options.collect do |key, value|
        value = color_string(value) if value.is_a? Array
        "#{CGI.escape key.to_s}=#{CGI.escape value.to_s}"
      end.join('&')
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
