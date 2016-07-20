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

  task :update_import_wizard_translations do
    translations_filename = 'config/locales/en.yml'
    output_filename = 'karma/importWizard/mockTranslations.js'
    all_translations = YAML.load_file(translations_filename)['en']
    File.write(output_filename, 'module.exports = ' + all_translations.to_json.html_safe + ';')
  end

  task :update_admin_goals_translations do
    translations_filename = 'config/locales/en.yml'
    output_filename = 'karma/adminGoals/mockTranslations.js'
    translations = YAML.load_file(translations_filename)['en']['govstat']
    File.write(output_filename, 'export default ' + translations.to_json.html_safe + ';')
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

    task :adminGoals, [:watch, :browser, :reporter] => :update_admin_goals_translations do |task, args|
      run_karma('adminGoals', args)
    end

    task :importWizard, [:watch, :browser, :reporter] => 'update_import_wizard_translations' do |task, args|
      run_karma('importWizard', args)
    end

    task :oldUx, [:watch, :browser, :reporter] do |task, args|
      run_karma('oldUx', args)
    end

    # an opinionated JS test runner for a parallelized single run
    parallel_deps = [
      'test:update_datacards_translations',
      'test:update_dataset_landing_page_translations',
      'test:update_import_wizard_translations',
      'test:update_admin_goals_translations'
    ]
    task :parallel => parallel_deps do
      cmd = 'node karma/parallelize.js'
      puts cmd
      exit($?.exitstatus) unless system(cmd)
    end
  end

  task :js, [:watch, :browser, :reporter] => ['js:dataCards', 'js:datasetLandingPage', 'js:importWizard', 'js:oldUx', 'js:adminGoals']
end

Rake::Task[:test].enhance { Rake::Task['test:js:parallel'].invoke }
