
const TEST_CLIENT = 'ca-pub-3940256099942544'

// Google test ad slot IDs (always show test ads)
const TEST_SLOTS = {
  topBanner:   '6773093538',   // leaderboard 728x90
  sidebar:     '1033173712',   // half page 300x600
  inFeed:      '3914695758',   // in-feed native
  postSubmit:  '5894627527',   // square 300x250
  resultPage:  '5381064084',   // large rectangle 336x280
  profilePage: '1033173712',   // sidebar 300x250
}

const AD_CONFIG = {
  enabled: import.meta.env.VITE_ADS_ENABLED === 'true' ||
           import.meta.env.DEV,  // Show test ads in dev

  testMode: !import.meta.env.VITE_ADSENSE_CLIENT ||
            import.meta.env.VITE_ADSENSE_CLIENT === TEST_CLIENT,
  client: import.meta.env.VITE_ADSENSE_CLIENT || TEST_CLIENT,
  slots: {
    topBanner:   import.meta.env.VITE_AD_SLOT_TOP_BANNER  || TEST_SLOTS.topBanner,
    sidebar:     import.meta.env.VITE_AD_SLOT_SIDEBAR     || TEST_SLOTS.sidebar,
    inFeed:      import.meta.env.VITE_AD_SLOT_IN_FEED     || TEST_SLOTS.inFeed,
    postSubmit:  import.meta.env.VITE_AD_SLOT_POST_SUBMIT || TEST_SLOTS.postSubmit,
    resultPage:  import.meta.env.VITE_AD_SLOT_RESULT      || TEST_SLOTS.resultPage,
    profilePage: import.meta.env.VITE_AD_SLOT_PROFILE     || TEST_SLOTS.profilePage,
  },
  // Routes where ads are NEVER shown (regardless of premium status)
  neverShowOnRoutes: [
    '/exam/room',     // Exam concentration
    '/exam/result',   // Handled separately (only on fail, non-premium)
    '/pricing',       // Don't distract during upgrade
    '/settings',      // Settings page
    '/recruiter',     // Recruiter flow (they pay for the platform)
    '/admin',         // Admin panel
  ]
}

export default AD_CONFIG
export type AdSlot = keyof typeof AD_CONFIG.slots
