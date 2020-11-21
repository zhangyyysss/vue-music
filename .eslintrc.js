// https://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  parserOptions: {
    parser: 'babel-eslint'
  },
  env: {
    browser: true,
  },
  extends: [
    // https://github.com/vuejs/eslint-plugin-vue#priority-a-essential-error-prevention
    // consider switching to `plugin:vue/strongly-recommended` or `plugin:vue/recommended` for stricter rules.
    'plugin:vue/essential',
    // https://github.com/standard/standard/blob/master/docs/RULES-en.md
    'standard'
  ],
  // required to lint *.vue files
  plugins: [
    'vue'
  ],
  // add your custom rules here
  rules: {
    // allow async-await
    'generator-star-spacing': 'off',
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    //文件末尾不为空行
    'eol-last': 0,
    //function左括号(可以没空格
    "space-before-function-paren": 0,
    //数字2表示同意缩进2个空格,数字1表示1倍缩进
    'vue/script-indent': ['error', 2, {'baseIndent': 1}]
  },
  overrides:[
    {
      'files':['*.vue'],
      'rules':{
        'indent':'off'
      }
    }
  ]
}
