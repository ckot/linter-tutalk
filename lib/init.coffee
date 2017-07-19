module.exports = {
  config: {
    interpreter: {
      type: 'string'
      default: 'python'
      description: '''Python interpreter to use'''
      order: 0
    }
    executablePath: {
      type: 'string',
      default: 'tutalk-lint',
      description: """name of tutalk-lint command"""
      order: 1
    }
    configFileLoad: {
      type: 'string',
      default: 'Use config file'
      enum: [
        'Don\'t use config file',
        'Use config file'
      ],
      title: 'Use configuration file',
      order: 2
    }
    configFileName: {
      type: 'string',
      default: '.tutalkrc',
      title: 'Configuration file name',
      order: 3
    }
    ignoreErrorsAndWarnings: {
      type: 'string'
      default: ''
      description: "comma-separated list of error and warning codes"
      order: 4
    },
    skipFiles: {
      type: 'string'
      default: ''
      description: "skip linting of files which match csv of patterns"
      order: 5
    }
  }
}

activate: ->
  require('atom-package-deps').install 'linter-tutalk'

provideLinter: ->
  LinterTuTalk = require './linter-tutalk.coffee'
  provider = new LinterTuTalk()
  {
    grammarScopes: [
      'source.tutalk'
    ]
    name: 'TuTalkLinter'
    scope: 'file'
    lint: provider.linter-tutalk
    lintsOnChange: do provider.isLintOnFly
  }
