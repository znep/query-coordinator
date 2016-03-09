# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)

block_1 = Block.create(
  layout: '12',
  components: [
    {type: 'html', value: '<h1>Block One<br></h1><div>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.<br></div>'}
  ],
  created_by: 'good-doer'
)

block_2 = Block.create(
  layout: '6-6',
  components: [
    {type: 'html', value: '<h1>Block Two<br></h1><div>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.<br></div>'},
    {type: 'html', value: '<h1>Block Two<br></h1><div>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.<br></div>'}
  ],
  created_by: 'good-doer'
)

block_3 = Block.create(
  layout: '4-4-4',
  components: [
    {type: 'html', value: '<h1>Block Three<br></h1><div>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.<br></div>'},
    {type: 'html', value: '<h1>Block Three<br></h1><div>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.<br></div>'},
    {type: 'html', value: '<h1>Block Three<br></h1><div>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.<br></div>'}
  ],
  created_by: 'good-doer'
)

block_4 = Block.create(
  layout: '3-3-3-3',
  components: [
    {type: 'html', value: '<h1>Block Four<br></h1><div>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.<br></div>'},
    {type: 'html', value: '<h1>Block Four<br></h1><div>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.<br></div>'},
    {type: 'html', value: '<h1>Block Four<br></h1><div>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.<br></div>'},
    {type: 'html', value: '<h1>Block Four<br></h1><div>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.<br></div>'}
  ],
  created_by: 'good-doer'
)

block_5 = Block.create(
  layout: '12',
  components: [
    {type: 'horizontalRule'}
  ],
  created_by: 'good-doer'
)

block_6 = Block.create(
  layout: '12',
  components: [
    { type: 'html', value: '<h1 class="align-center" style="text-align:center">Your Great Story Title<br></h1>' }
  ],
  created_by: 'good-doer'
)

block_7 = Block.create(
  layout: '12',
  components: [
    { type: 'html', value: '<div><a href="https://opendata.socrata.com" target="_blank" rel="nofollow">Hello, Link!</a></div>' }
  ],
  created_by: 'good-doer'
)

block_8 = Block.create(
  layout: '12',
  components: [
    {
      'type': 'embeddedHtml',
      'value': {
        'url': 'https://sa-storyteller-dev-us-west-2-staging.s3.amazonaws.com/documents/uploads/000/000/043/original/embedded_fragment.html?1448491145',
        'documentId': 43,
        'layout': {
          'height': 123
        }
      }
    }
  ],
  created_by: 'good-doer'
)

published_story = PublishedStory.create(
  uid: 'test-test',
  block_ids: [block_1.id, block_2.id, block_3.id, block_4.id],
  created_by: 'good-doer',
  theme: 'serif'
)

draft_story = DraftStory.create(
  uid: 'test-test',
  block_ids: [],
  created_by: 'good-doer',
  theme: 'serif'
)

draft_story = DraftStory.create(
  uid: 'hasb-lock',
  block_ids: [block_1.id, block_2.id, block_3.id, block_4.id],
  created_by: 'good-doer',
  theme: 'serif'
)

presentation_story = DraftStory.create(
  uid: 'pres-ents',
  block_ids: [block_1.id, block_2.id, block_3.id, block_5.id, block_4.id],
  created_by: 'good-doer',
  theme: 'serif'
)

presentation_published = PublishedStory.create(
  uid: 'pres-ents',
  block_ids: [block_1.id, block_2.id, block_3.id, block_5.id, block_4.id],
  created_by: 'good-doer',
  theme: 'serif'
)

draft_story = DraftStory.create(
  uid: 'h1bl-ocks',
  block_ids: [block_6.id],
  created_by: 'good-doer',
  theme: 'serif'
)

draft_story = DraftStory.create(
  uid: 'href-bloc',
  block_ids: [block_6.id, block_7.id],
  created_by: 'good-doer',
  theme: 'serif'
)

embedded_html_story = DraftStory.create(
  uid: 'embd-html',
  block_ids: [block_8.id],
  created_by: 'good-doer',
  theme: 'serif'
)

unpublished_story = DraftStory.create(
  uid: 'unpu-blsh',
  block_ids: [block_8.id],
  created_by: 'good-doer',
  theme: 'serif'
)
