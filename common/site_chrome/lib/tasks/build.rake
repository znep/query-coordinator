namespace :site_chrome do
  desc "Build site_chrome with LocaleApp translations"
  task :build do
    # We have multiple keys in Jenkins, so they're namespaced.
    # Yet we stil have to map to what LocaleApp expects.
    if ENV['SITE_CHROME_LOCALEAPP_API_KEY']
      ENV['LOCALEAPP_API_KEY'] = ENV['SITE_CHROME_LOCALEAPP_API_KEY']
    end

    Dir.chdir("#{Dir.pwd}/site_chrome") unless Dir.pwd.end_with?('site_chrome')

    puts `npm install`
    abort('Could not run npm install') unless $?.success?

    puts `bin/push_base_locale -y`
    abort('Could not push to LocaleApp') unless $?.success?

    puts `bin/pull_translations`
    # pull_translations will fail regularly because it can't write to a log File
    # so we check to make sure that we actually downloaded locale files.
    abort('Did not successfully download locales') unless File.exists?('config/locales/es.yml')
  end

  task :site_chrome => ['site_chrome:build']
end
