import { useEffect, useRef, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import type { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import prettier from 'prettier/standalone';
import * as prettierPluginBabel from 'prettier/plugins/babel';
import * as prettierPluginESTree from 'prettier/plugins/estree';

interface CodeEditorProps {
  url?: string;
  lineNumber?: number;
  columnNumber?: number;
  functionName?: string;
}

const CodeEditor = ({
  url,
  lineNumber = 1,
  columnNumber = 1,
  functionName = '',
}: CodeEditorProps) => {
  const [code, setCode] = useState('');
  const [position, setPosition] = useState({
    lineNumber: lineNumber,
    columnNumber: columnNumber,
  });
  const [formattedPosition, setFormattedPosition] = useState({
    lineNumber: 1,
    columnNumber: 1,
  });
  const [isFormatted, setIsFormatted] = useState(false);
  // const [formattedCode, setFormattedCode] = useState('');
  const [offset, setOffset] = useState(0);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    const fetchContents = async () => {
      if (!url) {
        return;
      }

      const contents = await (await fetch(url)).text();
      setCode(contents);

      // TODO: Better handling when line and column are not found
      // const lines = contents.split('\n');
      // const line = lines[defaultLineNumber];
      // let lineText;

      // if (line) {
      //     if (line.length > defaultColumnNumber) {
      //         lineText = line.substring(defaultColumnNumber, defaultColumnNumber + 150);
      //     } else {
      //         lineText = `Line ${defaultLineNumber} is too short ${line.length
      //             } expected column ${defaultColumnNumber} - other lines ${lines
      //                 .map((line, i) =>
      //                     i !== defaultLineNumber && line.length >= defaultColumnNumber
      //                         ? `<div>${i}:${line.length}:${line.substring(
      //                             defaultColumnNumber,
      //                             defaultColumnNumber + 150
      //                         )}</div>`
      //                         : ''
      //                 )
      //                 .filter(Boolean)
      //                 .join(',')}`;
      //     }
      // } else {
      //     lineText = `Line not found: ${defaultLineNumber} of ${lines.length}}`;
      // }
    };

    fetchContents();
  }, [columnNumber, lineNumber, url]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monaco.languages.registerDocumentFormattingEditProvider('javascript', {
      provideDocumentFormattingEdits: async function (
        model: editor.ITextModel,
      ) {
        setIsFormatted(true);

        // Get the current cursor position as an offset
        const offset = model.getOffsetAt({ lineNumber, column: columnNumber });

        // Format the code using Prettier
        const result = await prettier.formatWithCursor(code, {
          parser: 'babel',
          plugins: [prettierPluginBabel, prettierPluginESTree],
          cursorOffset: offset,
        });

        const range = model.getFullModelRange();
        const edits = [{ range, text: result.formatted }];

        // Apply the formatted text and set the cursor position
        editor.executeEdits('', edits);
        setOffset(result.cursorOffset);
        const newPosition = model.getPositionAt(result.cursorOffset);
        setFormattedPosition({
          lineNumber: newPosition.lineNumber,
          columnNumber: newPosition.column,
        });
        editor.setPosition(newPosition);
        editor.revealLineInCenter(newPosition.lineNumber);
        editor.focus();

        return [];
      },
    });
  };

  const formatDocument = async () => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!editor || !model) {
      return;
    }

    if (!isFormatted) {
      const action = editorRef.current?.getAction(
        'editor.action.formatDocument',
      );
      await action?.run();
    } else {
      setIsFormatted(false);
      const range = model.getFullModelRange();
      const edits = [{ range, text: code }];

      // Apply the formatted text and set the cursor position
      editor.executeEdits('', edits);
      editor.setPosition({
        lineNumber: position.lineNumber,
        column: position.columnNumber,
      });
      editor.revealLineInCenter(position.lineNumber);
      editor.focus();
    }
  };

  const goto = () => {
    const editor = editorRef.current;

    if (editor) {
      const position = !isFormatted
        ? { lineNumber: lineNumber, column: columnNumber }
        : {
            lineNumber: formattedPosition.lineNumber,
            column: formattedPosition.columnNumber,
          };
      editor.revealPosition(position);
      editor.setPosition(position);
      editor.focus();
    }
  };

  const getFileName = (url?: string) => {
    if (!url) {
      return '';
    }

    return new URL(url).pathname.split('/').pop();
  };

  const getPositionLabel = () => {
    if (!isFormatted) {
      return `Ln ${position.lineNumber}, Col ${position.columnNumber}`;
    } else {
      return `Ln ${formattedPosition.lineNumber}, Col ${formattedPosition.columnNumber}`;
    }
  };

  return (
    <>
      <div className="toolbar">
        <span className="toolbar-item" onClick={goto}>
          <span className="toolbar-label" title={url}>
            {getFileName(url)} {'>'}
          </span>
        </span>
        <span className="toolbar-item" onClick={goto}>
          <span className="toolbar-label">
            {functionName ? functionName : '(anonymous)'}
          </span>
        </span>
      </div>
      <div className="editor">
        <MonacoEditor
          height="100%"
          defaultLanguage="javascript"
          theme="vs-dark"
          value={code}
          options={{
            selectOnLineNumbers: true,
            roundedSelection: false,
            readOnly: false,
            cursorStyle: 'line',
            automaticLayout: true,
            // TODO: Add prop to toggle these
            // maxTokenizationLineLength: Number.MAX_VALUE,
            // stopRenderingLineAfter: -1,
          }}
          onMount={handleEditorDidMount}
        />
      </div>
      <div className="toolbar status-bar">
        <span className="toolbar-item status-bar-item">
          <span
            className="toolbar-label"
            onClick={formatDocument}
            title="Pretty Print"
          >{`{ }`}</span>
        </span>
        <span className="toolbar-item status-bar-item" onClick={goto}>
          <span className="toolbar-label">{getPositionLabel()}</span>
        </span>
      </div>
    </>
  );
};

export default CodeEditor;
