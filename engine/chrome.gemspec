$:.push File.expand_path('../lib', __FILE__)

# Maintain your gem's version:
require 'chrome/version'

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name        = 'chrome'
  s.version     = Chrome::VERSION
  s.authors     = ['Randy Antler']
  s.email       = ['randy.antler@socrata.com']
  s.homepage    = 'TODO'
  s.summary     = 'TODO: Summary of Chrome.'
  s.description = 'TODO: Description of Chrome.'
  s.license     = 'MIT'

  s.files = Dir["{app,config,db,lib}/**/*", "MIT-LICENSE", "Rakefile", 'README.rdoc']
  s.test_files = Dir['test/**/*']

  s.add_dependency 'rails', '~> 4.2.6'

  s.add_development_dependency 'sqlite3'
end
