desc 'Run lint and tests'
task default: %w[lint test]

desc 'Run linter'
task :lint do
  sh 'cd common && rake lint'
  sh 'cd frontend && rake lint'
end

desc 'Run all tests'
task :test do
  sh 'cd common && rake test'
  sh 'cd frontend && rake test'
end
