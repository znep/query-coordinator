namespace :i18n do
  desc "Get pluralization rules in Rails I18n and transpile to JS"
  task :pull_plurals do
    # These commands seem to work:
    # platform-ui/common $ gem install rails-i18n
    # platform-ui/common $ rake -R tasks i18n:pull_plurals
    #
    exe_path = File.expand_path(File.join(__FILE__, '../i18n/rails_i18n_to_js.rb'))
    write_path = File.expand_path(File.join(__FILE__, '../../i18n/pluralization.js'))
    system("ruby #{exe_path} > #{write_path}")
  end
end
