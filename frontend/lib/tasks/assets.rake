namespace :assets do
  desc 'Compile bundles with webpack for production'
  task :webpack do
    unless File.exist?('./node_modules/.bin/babel')
      raise RuntimeError.new('Unable to find babel binary. Install babel with "npm install"')
    end
    cmd = 'npm run build:prod'
    puts cmd
    fail($?.exitstatus) unless system(cmd)
  end
end
