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
        const text = model.getValue();

        setIsFormatted(true);

        // Get the current cursor position as an offset
        const currentPosition = editor.getPosition();
        const offset = currentPosition ? model.getOffsetAt(currentPosition) : 0;

        // Format the code using Prettier
        const result = await prettier.formatWithCursor(text, {
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
        setPosition({
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
    if (!isFormatted) {
      const action = editorRef.current?.getAction(
        'editor.action.formatDocument',
      );
      await action?.run();
    }
  };

  const goto = () => {
    if (editorRef.current) {
      const position = { lineNumber: lineNumber, column: columnNumber };
      editorRef.current.revealPosition(position);
      editorRef.current.setPosition(position);
      editorRef.current.focus();
    }
  };

  const getFileName = (url?: string) => {
    if (!url) {
      return '';
    }

    return new URL(url).pathname.split('/').pop();
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
          <span className="toolbar-label">{`Ln ${position.lineNumber}, Col ${position.columnNumber}, Offset ${offset}`}</span>
        </span>
      </div>
    </>
  );
};

export default CodeEditor;
