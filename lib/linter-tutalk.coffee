os = require 'os'
path = require 'path'
{ readFile, statSync, realpathSync } = require "fs"

helpers = require './helpers'
{ CompositeDisposable } = require 'atom'
{ exec, findCached, tempFile } = require './constants.coffee'

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
    }
class LinterTuTalk
  constructor: ->
    @subscriptions = new CompositeDisposable
    @subscriptions.add \
      atom.config.observe 'linter-tutalk.executablePath', (value) =>
        @executablePath = value
      atom.config.observe 'linter-tutalk.configFileLoad', (value) =>
        @configFileLoad = value
    atom.config.observe 'linter-tutalk.configFileName', (value) =>
      @configFileName = value
    atom.config.observe 'linter-tutalk.ignoreErrorsAndWarnings', (value) =>
      if value
        @ignoreErrorsAndWarnings = value.replace /\s+/g, ''
    atom.config.observe 'linter-tutalk.skipFiles', (value) =>
      @skipFiles = value


  destroy: ->
    do @subscriptions?.dispose

  initArgs: (curDir) =>
    args = ['-F']
    if @configFileLoad[0] is 'U'
      configFilePath = findCached curDir, @configFileName

      if configFilePath
        args.push.apply args, ['--options', configFilePath]
      else
        if @ignoreErrorsAndWarnings
          args.push.apply args, ['--ignore', @ignoreErrorsAndWarnings]
        if @skipFiles then args.push.apply args, ['--skip', @skipFiles]

  initTuTalkLinter: =>
    # [@interpreter, @virtualEnv] = helpers.getExecutable @interpreter
    # if not @interpreter
    #   atom.notifications.addError 'Python executable not found', {
    #     detail: "[linter-tutalk] Python executable not found in `#{@interpreterPath}`
    #     \nPlease set the correct path to `python`"
    #   }
    [@executablePath, @virtualEnv] = helpers.getExecutable @executablePath
    if not @executablePath
      atom.notifications.addError 'tutalk-lint executable not found', {
        detail: "[linter-tutalk] `tutalk-lint` executable not found in `#{@executablePath}`
        \nPlease set the correct path to `tutalk-lint`"
      }

  makeLintInfo: (fileName, originFileName) =>
    originFileName = fileName if not originFileName
    filePath = path.normalize path.dirname(originFileName)
    projectPath = atom.project.relativizePath(originFileName)[0]
    if fileName != originFileName
      cwd = path.dirname(fileName)
    else
      cwd = projectPath
    env = helps.initEnv filePath, projectPath
    args = @initArgs filePath
    args.push fileName
    command = @executablePath
    info = {
      fileName: originFileName,
      command: command,
      args: args
      options: {
        env: env
        cwd: cwd
        stream: "both"
      }
    }


  lintOnSave: (textEditor) =>
    filePath = do textEditor.getPath
    if process.platform is 'win32'
      if filePath.slice(0, 2) == '\\\\'
        return @lintFileOnFly textEditor
    lintInfo = @makeLintInfo filePath
    helpers.lintFile lintInfo, textEditor

  lint: (textEditor) =>
    do @initTuTalkLinter if not @tutalkLinterPath
    return [] if not @tutalkLinterPath
    @lintOnSave textEditor

module.exports = LinterTuTalk
