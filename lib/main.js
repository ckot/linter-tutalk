'use babel'

import { CompositeDisposable } from 'atom';
import type {TextEditor} from 'atom';
import * as helpers from 'atom-linter';
// # os = require 'os'
import { dirname } from 'path';

// # { readFile, statSync, realpathSync } = require "fs"

// # { exec, findCached, tempFile } = require './constants.coffee'

const regex = /line (\d+) column (\d+) - (Warning|Error): (.+)/g;

export default {

  activate() {
    require('atom-package-deps').install('linter-tutalk');

    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      atom.config.observe('linter-tutalk.executablePath', (value) => {
        this.executablePath = value;
      }),
    );

    this.subscriptions.add(
      atom.config.observe('linter-tutalk.ignoreErrorsAndWarnings', (value) => {
        if(value) {
          this.ignoreErrorsAndWarnings = value.replace(/\s+/g, '');
        } else {
          this.ignoreErrorsAndWarnings = '';
        }
      }),
    );
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  provideLinter() {
    return {
      name: 'TuTalkLinter',
      grammarScopes: ['source.tutalk'],
      scope: 'file',
      lintsOnChange: true,
      lint: async(textEditor: TextEditor) => {
        const filePath = textEditor.getPath();
        const fileText = textEditor.getText();
        const [projectPath] = atom.project.relativizePath(filePath);
        const params = [];
        const execOptions = {
          stream: 'stderr',
          stdin: fileText,
          cwd: projectPath != null ? projectPath : dirname(filePath),
          allowEmptyStderr: true
        };
        // atom.notifications.addInfo(`executablePath: ${this.executablePath}`);
        // atom.notifications.addInfo(`filePath: ${filePath}`);
        // atom.notifications.addInfo(`fileText: ${fileText}`)
        params.push('-');
        const output = await helpers.exec(this.executablePath, params, execOptions);

        if (textEditor.getText() !== fileText) {
          // file has changed since lint was triggered, tell linter not
          // to update
          return null
        }

        const messages = [];
        atom.notifications.addError(output);
        match = regex.exec(output);
        while (match != null) {
          line = Number.parseInt(match[1], 10) -1
          col = Number.parseInt(match[2], 10) -1
          messages.push({
            type: match[3],
            text: match[4],
            filePath,
            range: helpers.generateRange(textEditor, line, col),
          });
          match = regex.exec(output);
        }
        return messages;
      },
    };
  },
};
//
// #
// #   initArgs: (curDir) =>
// #     # args = ['-F']
// #     # if @configFileLoad[0] is 'U'
// #       configFilePath = findCached curDir, @configFileName
// #
// #       # if configFilePath
// #       #   args.push.apply args, ['--options', configFilePath]
// #       # else
// #       if @ignoreErrorsAndWarnings
// #           args.push.apply args, ['--ignore', @ignoreErrorsAndWarnings]
// #       # if @skipFiles then args.push.apply args, ['--skip', @skipFiles]
// #
// #   initTuTalkLinter: =>
// #     # [@interpreter, @virtualEnv] = helpers.getExecutable @interpreter
// #     # if not @interpreter
// #     #   atom.notifications.addError 'Python executable not found', {
// #     #     detail: "[linter-tutalk] Python executable not found in `#{@interpreterPath}`
// #     #     \nPlease set the correct path to `python`"
// #     #   }
// #     [@executablePath, @virtualEnv] = helpers.getExecutable @executablePath
// #     if not @executablePath
// #       atom.notifications.addError 'tutalk-lint executable not found', {
// #         detail: "[linter-tutalk] `tutalk-lint` executable not found in `#{@executablePath}`
// #         \nPlease set the correct path to `tutalk-lint`"
// #       }
// #
// #   makeLintInfo: (fileName, originFileName) =>
// #     originFileName = fileName if not originFileName
// #     filePath = path.normalize path.dirname(originFileName)
// #     projectPath = atom.project.relativizePath(originFileName)[0]
// #     if fileName != originFileName
// #       cwd = path.dirname(fileName)
// #     else
// #       cwd = projectPath
// #     env = helps.initEnv filePath, projectPath
// #     args = @initArgs filePath
// #     args.push fileName
// #     command = @executablePath
// #     info = {
// #       fileName: originFileName,
// #       command: command,
// #       args: args
// #       options: {
// #         env: env
// #         cwd: cwd
// #         stream: "both"
// #       }
// #     }
// #
// #
// #   lintOnSave: (textEditor) =>
// #     filePath = do textEditor.getPath
// #     if process.platform is 'win32'
// #       if filePath.slice(0, 2) == '\\\\'
// #         return @lintFileOnFly textEditor
// #     lintInfo = @makeLintInfo filePath
// #     helpers.lintFile lintInfo, textEditor
// #
// #   lint: (textEditor) =>
// #     do @initTuTalkLinter if not @tutalkLinterPath
// #     return [] if not @tutalkLinterPath
// #     @lintOnSave textEditor
// #
// # }
