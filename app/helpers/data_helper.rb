module DataHelper
  
  def sort_select_options(current_sort = nil)
    out = ""
    View.sorts.each do |sort|
      selected = current_sort == sort[0] ? " selected=\"selected\"" : ""
      out += "<option value=\"#{sort[0]}\"#{selected}>#{sort[1]}</option>"
    end
    out
  end
  
end