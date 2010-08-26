module DatasetsHelper
  # Create a drop down menu of formatting fonts
  # Pass a font name to select it by default.
  # TODO: This sucks keeping it in sync with our text editor; better place to
  # code this?
  def font_select_options(selected_font = nil)
    out = ""
    {'Helvetica' => 'helvetica,arial,sans serif',
      'Courier' => 'courier,monospace',
      'Times' => 'times,serif'
    }.sort { |a,b| a[0] <=> b[0] }.each do |font|
      selected = selected_font == font[0] ?
        " selected=\"selected\" class=\"default\"" : ""
      out += "<option value=\"#{font[1]}\"#{selected}>#{font[0]}</option>"
    end
    out
  end

  # Create a drop down menu of formatting font sizes
  # Pass a font size to select it by default.
  # TODO: This sucks keeping it in sync with our text editor; better place to
  # code this?
  def font_size_select_options(selected_font_size = nil)
    out = ""
    {8 => 6, 10 => 8, 12 => 10, 14 => 12, 18 => 16, 24 => 22,
      36 => 34}.sort {|a,b| a[0] <=> b[0]}.
      each do |size|
      selected = selected_font_size == size[0] ?
        " selected=\"selected\" class=\"default\"" : ""
      out += "<option value=\"#{size[1]}\"#{selected}>#{size[0]}</option>"
    end
    out
  end

  safe_helper :font_select_options, :font_size_select_options
end
