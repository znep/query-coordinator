class Object
  alias_method :to_core_param, :to_param
  alias_method :to_core_query, :to_query

  def fix_get_encoding!
  end
end