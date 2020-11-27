const { description } = require('../../package')

module.exports = {
  base: "/os-dev/",
  locales: {
    "/": {
      lang: "中文",
      title: "操作系统开发",
      description: "操作系统开发",
    },
    "/en-US/": {
      lang: "English",
      title: "OS DEV",
      description: "os dev",
    },
  },
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#title
   */
  title: "操作系统开发",
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#description
   */
  description: description,

  /**
   * Extra tags to be injected to the page HTML `<head>`
   *
   * ref：https://v1.vuepress.vuejs.org/config/#head
   */
  head: [
    ["meta", { name: "theme-color", content: "#3eaf7c" }],
    ["meta", { name: "apple-mobile-web-app-capable", content: "yes" }],
    [
      "meta",
      { name: "apple-mobile-web-app-status-bar-style", content: "black" },
    ],
  ],

  /**
   * Theme configuration, here is the default theme configuration for VuePress.
   *
   * ref：https://v1.vuepress.vuejs.org/theme/default-theme-config.html
   */
  themeConfig: {
    repo: "https://github.com/jaylinh-com/os-dev",
    editLinks: false,
    docsDir: "",
    editLinkText: "",
    lastUpdated: false,
    displayAllHeaders: true,
    lastUpdated: true,
    smoothScroll: true,
    locales: {
      "/": zhLocales(),
      "/en-US/": enLocales(),
    },
  },

  /**
   * Apply plugins，ref：https://v1.vuepress.vuejs.org/zh/plugin/
   */
  plugins: ["@vuepress/plugin-back-to-top", "@vuepress/plugin-medium-zoom"],
};

function zhLocales() {
  return {
    selectText: "切换语言",
    label: "中文",
    ariaLabel: "切换语言Switch Languages",
    lastUpdated: "最近更新",
    nav: [
      { text: "主页", link: "/" },
      { text: "示例", link: "/guide/" },
    ],
    sidebar: {
      "/guide/": [
        {
          title: "Guide",
          collapsable: false,
          children: ["", "using-vue"],
        },
      ],
    },
  };
}

function enLocales() {
  return {
    selectText: "Switch Languages",
    label: "English",
    ariaLabel: "Switch Languages",
    lastUpdated: "Last Updated",
    nav: [
      { text: "Home", link: "/en-US/" },
      { text: "Example", link: "/en-US/guide/" },
    ],
    sidebar: {
      "/en-US/guide/": [
        {
          title: "Guide",
          collapsable: false,
          children: ["", "using-vue"],
        },
      ],
    },
  };
}
