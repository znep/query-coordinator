class HeroComponent < ImageComponent
  # component data will look like:
  # {
  #   type:"hero",
  #   value: {
  #     url: "https://sa-storyteller-cust-us-west-2-rc.s3.amazonaws.com/documents/uploads/000/000/743/original/mcdonalds.jpg?1464390559",
  #     html: "<h1 class=\"align-center\" style=\"text-align: center;\"><br></h1>",
  #     layout: {
  #       height: 266
  #     },
  #     documentId: 743
  #   }
  # }

  def layout
    component_value.try(:[], 'layout')
  end

  def html
    component_value.try(:[], 'html').to_s
  end
end
