require 'mrdialog'

require_relative 'storyteller_releases_ui'
require_relative 'new_release_ui'

class OpsUi
  attr_reader :dialog

  def initialize
    @dialog = MRDialog.new
  end

  def open
    main_menu
    puts("\e[5A\e[3C\e[44m")
    puts('       .
       |\
     _/]_\_
  ~~~"~~~~~^~~')
    puts("\e[0m")
  end

  private

  def main_menu
    items = [
      { name: 'Create a new release', description: 'Create release and build it', task: 'ops:ui:new_release' },
      { name: 'Manage releases', description: 'Change the active version', task: 'ops:ui:releases' }
    ]

    loop do
      choice = dialog.menu("What'll it be?", items.map do |item|
        [ item[:name], item[:description] ]
      end)

      break if choice == false # User pressed cancel.

      task_name = items.detect { |item| item[:name] == choice }[:task]

      raise "Missing task for: #{choice}" unless task_name

      Rake.application[task_name].execute
    end
  end
end
