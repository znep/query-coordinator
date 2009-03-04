class Grant < Model
  # Override super.type and return the type of the grant
  def type
    data['type']
  end

end
