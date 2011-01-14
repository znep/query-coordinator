class Displays::Chart < Displays::Base
  def invalid_message
    'Columns required for this chart are missing'
  end

  def type
    'chart'
  end
end
