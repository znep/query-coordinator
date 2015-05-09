# Prepare test database with Comfy CMS fixtures
#
# Example task taken from
# https://github.com/comfy/comfortable-mexican-sofa/wiki/Working-with-CMS-fixtures
namespace :test do
  task :prepare do

    ENV['FROM'] = 'example.local'
    ENV['TO']   = 'default'

    begin
      Comfy::Cms::Site.create!(:identifier => 'default', :hostname => 'localhost')
    rescue
      # rescue because create will fail if there is already a site in the test db
      # with that identifier
    end

    Rake::Task['comfortable_mexican_sofa:fixtures:import'].invoke
  end
end