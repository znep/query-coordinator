$:.push File.expand_path('../lib', __FILE__)

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name = 'socrata_site_chrome'
  s.version = '0.0.0'
  s.authors = ['Randy Antler']
  s.email = ['randy.antler@socrata.com']
  s.homepage = 'https://github.com/socrata/chrome'
  s.summary = 'Header/footer/navbar.'
  s.description = 'The "Chrome" is the header (including navigation bar) and footer of a customer site. This gem exists so that our various services/pages (catalogs, storyteller, data_lens, etc.) can easily render the same html for these components.'
  s.license = 'MIT'

  if s.respond_to?(:metadata)
    s.metadata['allowed_push_host'] = 'https://repo.socrata.com/artifactory/api/gems/ruby-local'
  end

  s.files = Dir[
    '{app,config,db,public,lib,node_modules}/**/*',
    'lib/*.rb',
    'MIT-LICENSE',
    'Rakefile',
    'README.rdoc']
  s.test_files = Dir['test/**/*']

  s.add_dependency 'airbrake', '>= 4.3.0'
  s.add_dependency 'chroma'
  s.add_dependency 'dalli'
  s.add_dependency 'hashie', '~> 2.1.2'
  s.add_dependency 'httparty'
  s.add_dependency 'rails', '~> 4.2', '~> 4.2.6'
  s.add_dependency 'request_store'
  s.add_dependency 'sass'

  s.add_development_dependency 'rake'
  s.add_development_dependency 'rspec'
end
