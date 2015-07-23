desc 'Lists ActionController::StatusCodes::STATUS_CODES like routes'
task :status_codes => :environment do
  ActionController::StatusCodes::STATUS_CODES.to_a.sort.each do |code, message|
    puts "#{code} :#{message.gsub(/ /, "").underscore.to_sym}"
  end
end

