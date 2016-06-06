namespace :test do

  # Helper task that creates a js file that injects translation into browser.
  task :update_datacards_translations do
    translations_filename = 'config/locales/en.yml'
    output_filename = 'karma/dataCards/mockTranslations.js'
    translations = YAML.load_file(translations_filename)['en']['angular']['dataCards']
    File.write(output_filename, 'window.translations = ' + translations.to_json.html_safe + ';')
  end

  # Helper task that creates a js file that injects translation into browser.
  task :update_dataset_landing_page_translations do
    translations_filename = 'config/locales/en.yml'
    output_filename = 'karma/datasetLandingPage/mockTranslations.js'
    all_translations = YAML.load_file(translations_filename)['en']
    translations = all_translations['dataset_landing_page'].merge({
      data_types: all_translations['core']['data_types']
    })
    File.write(output_filename, 'module.exports = ' + translations.to_json.html_safe + ';')
  end

  namespace :js do
    def run_karma(dir, args = {})
      watch = args.watch == 'true'
      browser = args.browser || 'PhantomJS'
      reporter = args.reporter || 'dots'

      if browser =~ /^phantom/i then
        browser = 'PhantomJS'
      elsif browser =~ /^chrome/i then
        browser = 'Chrome'
      elsif browser =~ /^firefox/i then
        browser = 'Firefox'
      end

      cmd = "./node_modules/karma/bin/karma start karma/#{dir}/karma.conf.js --singleRun #{!watch} --browsers #{browser} --reporters #{reporter}"
      puts cmd
      fail($?.exitstatus) unless system(cmd)
    end

    task :dataCards, [:watch, :browser, :reporter] => 'update_datacards_translations' do |task, args|
      run_karma('dataCards', args)
    end

    task :datasetLandingPage, [:watch, :browser, :reporter] => 'update_dataset_landing_page_translations' do |task, args|
      run_karma('datasetLandingPage', args)
    end

    task :importWizard, [:watch, :browser, :reporter] do |task, args|
      run_karma('importWizard', args)
    end

    task :oldUx, [:watch, :browser, :reporter] do |task, args|
      run_karma('oldUx', args)
    end
  end

  task :js, [:watch, :browser, :reporter] => ['js:dataCards', 'js:datasetLandingPage', 'js:oldUx']
end

Rake::Task[:test].enhance { Rake::Task['test:js'].invoke }
