class Displays::Calendar < Displays::Base
  def invalid_message
    'Columns required for this calendar are missing'
  end
end
