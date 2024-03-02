export function notRequiredAccessRoutes() {
  const routes = [
    '/admin/login',
    // '/admin/refresh-token',
    // '/user/refresh-token',
    // '/user/resend-otp',
    // '/user/check-fields-exist',
    // '/user/forgot-password',
    // '/distributor/login',
    // '/distributor/otp-verify',
    // '/retailer/login',
    // '/retailer/otp-verify',
    // '/retailer/verify-otp',
    // '/guest/login',
    // '/guest/token-verify',
    '/access-modules/get-access-modules',
    '/access-modules/add',
  ];

  return routes;
}

export function webModules() {
  const modules = [
    {
      moduleName: 'PAN_APPLICATIONS',
      webActions: ['ADD', 'VIEW_WEB', 'EDIT', 'CHECK_APPLICATION_WITH_SRN'],
    },
    {
      moduleName: 'ITR_APPLICATIONS',
      webActions: ['ADD', 'VIEW_WEB', 'EDIT', 'CHECK_APPLICATION_WITH_SRN'],
    },
    {
      moduleName: 'DSC_APPLICATIONS',
      webActions: ['ADD', 'VIEW_WEB', 'EDIT', 'CHECK_APPLICATION_WITH_SRN'],
    },
    {
      moduleName: 'GUMASTA_APPLICATIONS',
      webActions: ['ADD', 'VIEW_WEB', 'EDIT', 'CHECK_APPLICATION_WITH_SRN'],
    },
    {
      moduleName: 'MSME_APPLICATIONS',
      webActions: ['ADD', 'VIEW_WEB', 'EDIT', 'CHECK_APPLICATION_WITH_SRN'],
    },
    {
      moduleName: 'USERS',
      webActions: [
        'CATEGORIES_LIST',
        'SERVICES_LIST',
        'CHECK_AADHAR_NUMBER_EXIST',
        'CHECK_EMAIL_PHONE_PAN_NUMBER_EXIST',
        'CHECK_APPLICATION_WITH_SRN',
        'VIEW_HISTORY',
        'CANCEL_APPLICATION',
        'FORGOT_PASSWORD',
        'RESET_PASSWORDS',
      ],
    },
    {
      moduleName: 'DISTRIBUTORS',
      webActions: ['VIEW_PROFILE', 'ADD', 'VIEW_PROFILE'],
    },
    {
      moduleName: 'RETAILERS',
      webActions: ['APPLY_FOR_DISTRIBUTOR', 'EDIT', 'VIEW_USER_PROFILE'],
    },
    {
      moduleName: 'GUESTS',
      webActions: ['APPLY_FOR_DISTRIBUTOR', 'EDIT', 'VIEW_USER_PROFILE'],
    },
    {
      moduleName: 'PRICE_CONFIGS',
      webActions: ['LIST_WEB'],
    },
    {
      moduleName: 'ITR_CATEGORIES',
      webActions: ['LIST_WEB'],
    },
    {
      moduleName: 'PAN_CATEGORIES',
      webActions: ['LIST_WEB'],
    },
    {
      moduleName: 'GALLERY_CATEGORIES',
      webActions: ['LIST_WEB', 'VIEW_WEB'],
    },
    {
      moduleName: 'FOOTER_CATEGORIES',
      webActions: ['LIST_WEB', 'VIEW_WEB'],
    },
    {
      moduleName: 'GALLERIES',
      webActions: ['ALL_NORMAL_LIST_WITH_CATEGORY', 'LIST_WEB'],
    },
    {
      moduleName: 'BANNERS',
      webActions: ['ALL_NORMAL_LIST_WITH_CATEGORY', 'VIEW_WEB', 'LIST_WEB'],
    },
    {
      moduleName: 'BUSINESS_OPPORTUNITIES',
      webActions: ['LIST_WEB'],
    },
    {
      moduleName: 'POPUP_BANNERS',
      webActions: ['LIST_WEB', 'VIEW_WEB'],
    },
    {
      moduleName: 'CONTACT_INFOS',
      webActions: ['LIST_WEB', 'ALL_NORMAL_LIST_WEB'],
    },
    {
      moduleName: 'DOWNLOAD_FILES',
      webActions: ['LIST_WEB', 'VIEW_WEB', 'ALL_NORMAL_LIST_WEB'],
    },
    {
      moduleName: 'FOOTERS',
      webActions: ['LIST_WEB'],
    },
    {
      moduleName: 'MENU_LINKS',
      webActions: ['LIST_WEB', 'VIEW_WEB'],
    },
    {
      moduleName: 'FAQS',
      webActions: ['LIST_WEB'],
    },
    {
      moduleName: 'SUBSCRIPTIONS',
      webActions: ['BUY_SUBSCRIPTION', 'LIST_WEB', 'SUBSCRIPTIONS_HISTORY'],
    },
    {
      moduleName: 'REFUND_AND_CANCELLATIONS',
      webActions: ['ALL_NORMAL_LIST_FOR_WEB'],
    },
    {
      moduleName: 'PRIVACY_POLICIES',
      webActions: ['ALL_NORMAL_LIST_FOR_WEB'],
    },
    {
      moduleName: 'PRIVACY_POLICIES',
      webActions: ['ALL_NORMAL_LIST_FOR_WEB'],
    },
    {
      moduleName: 'PRIVACY_POLICIES',
      webActions: ['ALL_NORMAL_LIST_FOR_WEB'],
    },
    {
      moduleName: 'INITIAL_NAMES',
      webActions: ['LIST_WEB'],
    },
    {
      moduleName: 'INITIAL_NAMES',
      webActions: ['LIST_WEB'],
    },
    {
      moduleName: 'BUSINESS_ENQUIRIES',
      webActions: ['ADD'],
    },
    {
      moduleName: 'LOAN_ENQUIRIES',
      webActions: ['ADD'],
    },
    {
      moduleName: 'CONTACT_US_ENQUIRIES',
      webActions: ['ADD'],
    },
    {
      moduleName: 'REFUND_WALLETS',
      webActions: ['VIEW_WEB'],
    },
    {
      moduleName: 'REFUND_REQUESTS',
      webActions: ['ADD', 'LIST_WEB'],
    },
    {
      moduleName: 'REFUND_WALLET_TRANSACTIONS',
      webActions: ['LIST_WEB'],
    },
    {
      moduleName: 'REWARDS',
      webActions: ['USER_CHECK_REWARD'],
    },
    {
      moduleName: 'REWARD_POINTS',
      webActions: [
        'LIST_WEB',
        'LOGGED_IN_USER_REWARD_POINT_LIST',
        'LOGGED_IN_USER_TOTAL_REWARD_POINT',
        'HISTORY',
      ],
    },
    {
      moduleName: 'TERMS_AND_CONDITIONS',
      webActions: ['LIST_WEB'],
    },
    {
      moduleName: 'RETAILER_REGISTER_REWARDS',
      webActions: ['LIST_WEB'],
    },
    {
      moduleName: 'PAN_CARTS',
      webActions: ['ADD_TO_CART', 'VIEW', 'DELETE'],
    },
    {
      moduleName: 'ITR_CARTS',
      webActions: ['ADD_TO_CART', 'VIEW', 'DELETE'],
    },
    {
      moduleName: 'MSME_CARTS',
      webActions: ['ADD_TO_CART', 'VIEW', 'DELETE'],
    },
    {
      moduleName: 'DSC_CARTS',
      webActions: ['ADD_TO_CART', 'VIEW', 'DELETE'],
    },
    {
      moduleName: 'GUMASTA_CARTS',
      webActions: ['ADD_TO_CART', 'VIEW', 'DELETE'],
    },
    {
      moduleName: 'STATIC_PAGES',
      webActions: ['VIEW_WITH_NAME', 'LIST_WEB'],
    },
    {
      moduleName: 'OTHER_SERVICES',
      webActions: ['LIST_WEB', 'VIEW_WEB'],
    },
    {
      moduleName: 'COMMISSIONS',
      webActions: ['LIST_WEB', 'VIEW_WEB', 'TOTAL_COMMISSION'],
    },
  ];

  return modules;
}
