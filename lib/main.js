'use babel'

import { CompositeDisposable } from 'atom';
import type {TextEditor} from 'atom';
import * as helpers from 'atom-linter';
// # os = require 'os'
import { dirname } from 'path';

// # { readFile, statSync, realpathSync } = require "fs"

// # { exec, findCached, tempFile } = require './constants.coffee'

const regex = /(\w+):(\d+):(\d+) (Warning|Error): (.+)/g;

export default {

  activate() {
    require('atom-package-deps').install('linter-tutalk');

    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(

      atom.config.observe('linter-tutalk.executablePath', (value) => {
        this.executablePath = value;
      }),

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
          line = Number.parseInt(match[2], 10) -1
          col = Number.parseInt(match[3], 10) -1
          messages.push({
            type: match[4],
            text: match[5],
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
