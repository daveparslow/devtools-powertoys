import './App.css';
import CodeEditor from './CodeEditor';

function App() {
  const params = new URL(document.location.href).searchParams;

  const getParamString = (name: string, defaultValue: string) =>
    params.get(name) ?? defaultValue;
  const getParamInt = (name: string, defaultValue: string) => {
    const value = params.get(name) ?? defaultValue;
    const intValue = value ? parseInt(value) : undefined;
    return intValue;
  };

  const url = getParamString('url', process.env.REACT_APP_DEFAULT_URL);
  const lineNumber = getParamInt(
    'lineNumber',
    process.env.REACT_APP_DEFAULT_LINE_NUMBER,
  );
  const columnNumber = getParamInt(
    'columnNumber',
    process.env.REACT_APP_DEFAULT_COLUMN_NUMBER,
  );
  const functionName = getParamString(
    'functionName',
    process.env.REACT_APP_DEFAULT_FUNCTION_NAME,
  );

  return (
    <CodeEditor
      url={url}
      lineNumber={lineNumber}
      columnNumber={columnNumber}
      functionName={functionName}
    />
  );
}

export default App;
