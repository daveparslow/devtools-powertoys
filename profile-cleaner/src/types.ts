export type CallFrame = {
  functionName: string;
  scriptId: string;
  url: string;
  lineNumber: number;
  columnNumber: number;
};

export const DeletedCallFrame = Symbol('DeletedCallFrame');

export type CPUProfileNode = {
  children: number[];
  id: number;
  callFrame: CallFrame;
  parent?: number;
  [DeletedCallFrame]: boolean;
};

export type CPUProfile = {
  nodes?: CPUProfileNode[];
};

export type ProfileEvent = {
  id?: number;
  parentId?: number;
  name: string;
  ph: string;
  cat: string;
  ts: number;
  pid: number;
  tid: number;
  args?: {
    data?: {
      cpuProfile?: CPUProfile;
    };
  };
};

export type PerformanceProfile = {
  traceEvents: ProfileEvent[];
};
