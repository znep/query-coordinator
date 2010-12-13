class Displays::Calendar < Displays::Base
  def invalid_message
    'Columns required for this calendar are missing'
  end

  def required_edit_javascripts
    ['shared-table-editor']
  end

  def required_style_packages
    [ 'screen-calendar' ]
  end
end
