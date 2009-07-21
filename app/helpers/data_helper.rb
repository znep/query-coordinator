module DataHelper

  def sort_select_options(current_sort = nil)
    out = ""
    View.sorts.each do |sort|
      selected = current_sort == sort[0] ? " selected=\"selected\"" : ""
      out += "<option value=\"#{sort[0]}\"#{selected}>#{sort[1]}</option>"
    end
    out
  end

  def generate_filter_url(current_state, type, additional_flags = {})
    if current_state.nil?
      state = Hash.new
    else
      state = current_state.dup
    end
    
    # If current state already contains an additional flag, toggle instead
    additional_flags.each do |key, value|
      if state[key] == value
        state.delete(key)
        additional_flags.delete(key)
      end
    end

    # Merge all flags
    state[:type] = type
    state.merge!(additional_flags)

    # Deal with filter[key] special case if filter exists and is a hash
    if state.has_key?(:filter) && state[:filter].respond_to?("each")
      state[:filter].each { |key, value| state["filter[#{key}]"] = value }
      state.delete(:filter)
    end

    # Final cleanup and output
    state.reject! { |key, value| value.nil? || (value == "") || (value == false) }

    out = Array.new
    state.each { |pair| out << pair.join("=") }
    "##{out.join('&')}"
  end

end