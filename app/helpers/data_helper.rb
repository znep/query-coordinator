module DataHelper

  def sort_select_options(current_sort = nil)
    sort_select_options_internal(View.sorts, current_sort)
  end

  def sort_select_options_for_search(current_sort = nil)
    sort_select_options_internal(View.search_sorts, current_sort)
  end

  private

  def sort_select_options_internal(sorts, current_sort = nil)
    out = ""
    sorts.each do |sort|
      selected = current_sort == sort[0] ? " selected=\"selected\"" : ""
      out += "<option value=\"#{sort[0]}\"#{selected}>#{sort[1]}</option>"
    end
    out
  end
end
