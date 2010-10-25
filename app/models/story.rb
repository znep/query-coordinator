class Story < Model
  def customization
    @customization ||= JSON.parse(data['customization'])
  end

  def raw_customization
    data['customization']
  end
end
