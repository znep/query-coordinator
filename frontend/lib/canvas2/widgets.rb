%w| canvas_widget container horizontal_container misc repeater tabular_widgets |.each do |widg|
  require File.join(Rails.root, 'lib', 'canvas2', 'widgets', widg)
end
