require 'mrdialog'

require_relative 'storyteller_releases_ui'

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
      StorytellerReleasesUi.new
    ]

    loop do
      choice = dialog.menu('What\'ll it be?', items.map do |item|
        [ item.main_menu_entry_name, item.main_menu_entry_description ]
      end)

      break if choice == false # User pressed cancel.

      items.detect { |item| item.main_menu_entry_name == choice }.show_main_menu
    end
  end
end
