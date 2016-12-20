namespace :test do
  desc 'Run the Karma test suites'
  namespace :karma do
    def run_karma(dir, args = {})
      watch = args.watch == 'true'
      browser = args.browser || 'PhantomJS'
      reporter = args.reporter || 'mocha'

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

    {
      'dataCards' => 'update_datacards_translations',
      'datasetLandingPage' => 'update_dataset_landing_page_translations',
      'adminGoals' => 'update_admin_goals_translations',
      'importWizard' => 'update_import_wizard_translations',
      'datasetManagementUI' => 'update_dataset_management_ui_translations',
      'visualizationCanvas' => 'update_visualization_canvas_translations',
      'autocomplete' => nil,
      'signin' => 'update_signin_translations',
      'oldUx' => nil
    }.each do |task_name, dependency|
      desc task_name
      task_args = { %i(watch browser reporter) => "translations:#{dependency}" }
      task task_name, dependency ? task_args : task_args.keys.first do |_, args|
        run_karma(task_name, args)
      end
    end

    # an opinionated JS test runner for a parallelized single run
    parallel_deps = [
      'test:karma:translations:update_datacards_translations',
      'test:karma:translations:update_dataset_landing_page_translations',
      'test:karma:translations:update_import_wizard_translations',
      'test:karma:translations:update_admin_goals_translations',
      'test:karma:translations:update_dataset_management_ui_translations',
      'test:karma:translations:update_visualization_canvas_translations',
      'test:karma:translations:update_signin_translations'
    ]
    desc 'parallel'
    task :parallel => parallel_deps do
      cmd = 'node karma/parallelize.js'
      puts cmd
      exit($?.exitstatus) unless system(cmd)
    end

    desc 'mock translations in support of Karma tests'
    namespace :translations do
      desc 'Helper task that creates a js file that injects translation into browser'
      task :update_datacards_translations do
        translations_filename = 'config/locales/en.yml'
        output_filename = 'karma/dataCards/mockTranslations.js'
        translations = YAML.load_file(translations_filename)['en']['angular']['dataCards']
        File.write(output_filename, 'window.translations = ' + translations.to_json.html_safe + ';')
      end

      desc 'Helper task that creates a js file that injects translation into browser'
      task :update_dataset_landing_page_translations do
        translations_filename = 'config/locales/en.yml'
        output_filename = 'karma/datasetLandingPage/mockTranslations.js'
        all_translations = YAML.load_file(translations_filename)['en']
        translations = all_translations['dataset_landing_page'].merge({
          data_types: all_translations['core']['data_types']
        })
        File.write(output_filename, "module.exports = #{translations.to_json.html_safe};")
      end

      desc 'update_import_wizard_translations'
      task :update_import_wizard_translations do
        translations_filename = 'config/locales/en.yml'
        output_filename = 'karma/importWizard/mockTranslations.js'
        all_translations = YAML.load_file(translations_filename)['en']
        File.write(output_filename, "module.exports = #{all_translations.to_json.html_safe};")
      end

      desc 'update_dataset_management_ui_translations'
      task :update_dataset_management_ui_translations do
        translations_filename = 'config/locales/en.yml'
        output_filename = 'karma/datasetManagementUI/mockTranslations.js'
        all_translations = YAML.load_file(translations_filename)['en']
        translations = all_translations['dataset_management_ui'].
          merge({
            data_types: all_translations['core']['data_types'],
            edit_metadata: all_translations['screens']['edit_metadata']
          })
        File.write(output_filename, "module.exports = #{translations.to_json.html_safe};")
      end

      desc 'update_admin_goals_translations'
      task :update_admin_goals_translations do
        translations_filename = 'config/locales/en.yml'
        output_filename = 'karma/adminGoals/mockTranslations.js'
        translations = YAML.load_file(translations_filename)['en']['govstat']
        File.write(output_filename, "export default #{translations.to_json.html_safe};")
      end

      desc 'update_visualization_canvas_translations'
      task :update_visualization_canvas_translations do
        translations_filename = 'config/locales/en.yml'
        output_filename = 'karma/visualizationCanvas/mockTranslations.js'
        translations = YAML.load_file(translations_filename)['en']['visualization_canvas']
        File.write(output_filename, "export default #{translations.to_json.html_safe};")
      end

      desc 'update_signin_translations'
      task :update_signin_translations do
        translations_filename = 'config/locales/en.yml'
        output_filename = 'karma/signin/mockTranslations.js'
        all_translations = YAML.load_file(translations_filename)['en']
        translations = {
          screens: {
            sign_in: all_translations['screens']['sign_in']
          }
        }
        File.write(output_filename, "module.exports = #{translations.to_json.html_safe};")
      end
    end

    desc 'all the karma tasks'
    task :karma, [:watch, :browser, :reporter] => [
      'karma:dataCards',
      'karma:datasetLandingPage',
      'karma:importWizard',
      'karma:oldUx',
      'karma:adminGoals',
      'karma:datasetManagementUI',
      'karma:visualizationCanvas',
      'karma:autocomplete',
      'karma:signin'
    ]
  end
end
