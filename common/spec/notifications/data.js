export const fakeNotifications = {
  'notifications': [
    {
      id: 'abc123',
      title: 'Disrupt tofu succulents everyday',
      titleLink: 'https://socrata.com',
      body: 'Hella migas, art party YOLO kombucha live-edge heirloom sriracha lomo mixtape paleo flannel. Humblebrag flexitarian semiotics pour-over, tbh tattooed farm-to-table',
      dateTime: 1484888755016,
      isUnread: true
    },
    {
      id: 'abc456',
      title: 'Billions upon billions upon billions upon billions upon billions upon billions!',
      titleLink: 'https://carlsagan.com/',
      body: 'Shores of the cosmic ocean encyclopaedia galactica paroxysm of global death? Decipherment, great turbulent clouds kindling the energy hidden in matter?',
      dateTime: 1484888755016,
      isUnread: false
    },
    {
      id: 'def123',
      title: 'Collaboratively administrate empowered markets via plug-and-play networks.',
      titleLink: 'https://www.beeradvocate.com/beer/profile/47051/1720/',
      body: 'Leverage agile frameworks to provide robust disruptive innovation via workplace diversity and empowerment. Iterative approaches to corporate strategy foster collaborative thinking to further the overa',
      dateTime: 1484888755016,
      isUnread: true
    },
    {
      id: 'def456',
      title: "Ph'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn",
      titleLink: 'http://www.hplovecraft.com/writings/texts/',
      body: "Naflgrah'n goka wgah'n mg f'ooboshu tharanak Azathothagl na'fhalma ngluiagl ngnilgh'ri, nglui lw'nafh hlirgh shoggagl r'luh wgah'n hafh'drn mg, naflli'hee ebunma k'yarnak gotha R'lyeh ron nauh'e nglui",
      dateTime: 1484888755016,
      isUnread: false
    }
  ],
  viewOlderLink: 'https://support.socrata.com/hc/en-us/sections/203977877-Check-out-the-Latest'
};

export const fakeZeroNotifications = {
  notifications: [],
  viewOlderLink: 'https://support.socrata.com/hc/en-us/sections/203977877-Check-out-the-Latest'
}


export const fakeUserNotifications = {
  data:[
    {
      user_id: "tugg-ikce",
      subscription: {
        user_id: "tugg-ikce",
        id: 32,
        email: false,
        domain: "elumitas.test-socrata.com",
        dataset: "*",
        activity: "*"
      },
      read: false,
      id: 100,
      activity: {
        working_copy_uid: null,
        service: "activity-feed",
        latest_event_id: null,
        id: 1618,
        domain_id: 59,
        domain_cname: "elumitas.test-socrata.com",
        details: "{\"summary\":\"Desingh published the dataset FINAL TEST.\",\"tag\":\"VIEW_PUBLISHED\"}",
        dataset_uid: "wjhe-kwyt",
        dataset_name: "FINAL TEST",
        created_at: "2017-09-04T10:17:56.97",
        asset_type: "dataset",
        activity_type: "WorkingCopyPublished",
        acting_user_role: "administrator",
        acting_user_name: "Desingh",
        acting_user_id: "v7rp-h59f"
      }
    },
    {
      user_id: "tugg-ikce",
      subscription: {
        user_id: "tugg-ikce",
        id: 32,
        email: false,
        domain: "elumitas.test-socrata.com",
        dataset: "*",
        activity: "*"
      },
      read: false,
      id: 104,
      activity: {
        working_copy_uid: null,
        service: "activity-feed",
        latest_event_id: null,
        id: 1620,
        domain_id: 59,
        domain_cname: "elumitas.test-socrata.com",
        details: "{\"summary\":\"Desingh published the dataset FINAL TEST.\",\"tag\":\"VIEW_PUBLISHED\"}",
        dataset_uid: "wjhe-kwyt",
        dataset_name: "FINAL TEST",
        created_at: "2017-09-04T10:17:56.97",
        asset_type: "dataset",
        activity_type: "ViewPermissionsChanged",
        acting_user_role: "administrator",
        acting_user_name: "Desingh",
        acting_user_id: "v7rp-h59f"
      }
    },
    {
      user_id: "tugg-ikce",
      subscription: {
        user_id: "tugg-ikce",
        id: 32,
        email: false,
        domain: "elumitas.test-socrata.com",
        dataset: "*",
        activity: "*"
      },
      read: false,
      id: 116,
      activity: {
        working_copy_uid: null,
        service: "activity-feed",
        latest_event_id: null,
        id: 1626,
        domain_id: 59,
        domain_cname: "elumitas.test-socrata.com",
        details: "{\"summary\":\"Vinu created draft WORKFLOWTEST.\"}",
        dataset_uid: "binx-cnrq",
        dataset_name: "WORKFLOWTEST",
        created_at: "2017-09-18T10:23:04.881",
        asset_type: "draft",
        activity_type: "ApprovalChanged",
        acting_user_role: "administrator",
        acting_user_name: "Vinu",
        acting_user_id: "gbyy-925e"
      }
    },
    {
      user_id: "tugg-ikce",
      subscription: {
        user_id: "tugg-ikce",
        id:32,
        email: false,
        domain: "elumitas.test-socrata.com",
        dataset: "*",
        activity: "*"
      },
      read: false,
      id: 124,
      activity: {
        working_copy_uid:null,
        service: "activity-feed",
        latest_event_id: null,
        id: 1630,
        domain_id: 59,
        domain_cname: "elumitas.test-socrata.com",
        details: "{\"summary\":\"Vinu created the working copy of dataset WORKFLOWTEST.\"}",
        dataset_uid: "binx-cnrq",
        dataset_name: "WORKFLOWTEST",
        created_at: "2017-09-18T10:27:33.001",
        asset_type: "dataset",
        activity_type: "CollaboratorAdded",
        acting_user_role: "administrator",
        acting_user_name: "Vinu",
        acting_user_id: "gbyy-925e"
      }
    }
  ]
};
