$:.push File.expand_path('../lib', __FILE__)

# Maintain your gem's version:
require 'socrata_site_chrome/version'

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name        = 'socrata_site_chrome'
  s.version     = SocrataSiteChrome::VERSION
  s.authors     = ['Randy Antler']
  s.email       = ['randy.antler@socrata.com']
  s.homepage    = 'https://github.com/socrata/chrome'
  s.summary     = 'Header/footer/navbar.'
  s.description = 'The "Chrome" is the header (including navigation bar) and footer of a customer site. This gem exists so that our various services/pages (catalogs, storyteller, data_lens, etc.) can easily render the same html for these components.'
  s.license     = 'MIT'

  s.files = Dir['{app,config,db,lib,public}/**/*', 'MIT-LICENSE', 'Rakefile', 'README.rdoc']
  s.test_files = Dir['test/**/*']

  s.add_dependency 'rails', '~> 4.2', '>= 4.2.6'
end
