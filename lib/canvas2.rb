# autoload is not threadsafe, so require everything we might need
requires = %w{view query format render_type column}
requires.each{ |r| require File.join(Rails.root, 'app/models', r) }
require 'clytemnestra'

%w| data_context errors util |.each { |r| require File.join(Rails.root, 'lib/canvas2', r) }

module Canvas2
end
