require "rails_helper"

RSpec.describe "themes/custom" do
  let(:core_config) {
    {
      "default" => true,
      "domainCName" => "bobloblawslawblog.com",
      "id" => 234,
      "name" => "Story Theme 1",
      "updatedAt" => 1389226069,
      "properties" => [
        {
          "name" => "title",
          "value" => "Girls Just Wanna Have Fun"
        },
        {
          "name" => "description",
          "value" => "The 80s were a horrible nightmarish time"
        },
        {
          "name" => "google_font_code",
          "value" => "<link href='https://www.bobloblawsblog.com'>"
        },
        {
          "name" => "css_variables",
          "value" => {
            "$list-margin-adjustment" => "1.2em",
            "$std-type-size" => "1.1em",
            "$list-bullet-color" => "#252525",
            "$link-color" => "#c6f",
            "$ol-list-style-type" => "decimal",
            "$heading-font-stack" => "'Indie Flower', cursive",
            "$list-padding-left" => "2.1em",
            "$list-bullet-character" => "\u{1F984}",
            "$ul-list-style-type" => "disc",
            "$blockquote-padding-left" => "1rem",
            "$std-line-height" => "1.44",
            "$blockquote-border-left" => "2px solid #ccc",
            "$default-type-color" => "#f0f",
            "$hr-border-top" => "1px solid #ccc",
            "$blockquote-font-style" => "italic",
            "$heading-type-color" => "#f39",
            "$link-text-decoration" => "none",
            "$lg-type-size" => "1.18em",
            "$link-hover" => "#f39",
            "$body-font-stack" => "'Raleway', sans-serif",
            "$lg-line-height" => "1.54",
            "$heading-font-weight" => "700",
            "$blockquote-margin-left" => "1.3rem"
          }
        }
      ],
      "type" => "story_theme"
    }
  }

  let(:theme) { Theme.from_core_config(core_config) }
  let(:themes) { [theme] }

  it "does not have a BOM" do
    assign(:custom_themes, themes)

    render

    expect(rendered).to_not include("\xEF\xBB\xBF".force_encoding('utf-8'))
  end
end
