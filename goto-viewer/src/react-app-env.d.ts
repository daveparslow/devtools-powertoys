/// <reference types="react-scripts" />
declare namespace NodeJS {
  interface ProcessEnv {
    readonly REACT_APP_DEFAULT_URL: string;
    readonly REACT_APP_DEFAULT_LINE_NUMBER: string;
    readonly REACT_APP_DEFAULT_COLUMN_NUMBER: string;
    readonly REACT_APP_DEFAULT_FUNCTION_NAME: string;
  }
}
