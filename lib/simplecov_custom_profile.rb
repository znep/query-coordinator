require 'simplecov'
require 'simplecov-cobertura'

SimpleCov.profiles.define 'filtered' do
  load_profile 'rails'
  add_filter 'vendor' # Don't include vendored stuff
  coverage_dir 'coverage/ruby'
  add_group 'Admin', %w(app/controllers/administration_controller.rb lib/view_models/administration lib/services/administration)
end

SimpleCov.formatters = [
  SimpleCov::Formatter::HTMLFormatter,
  SimpleCov::Formatter::CoberturaFormatter
]

