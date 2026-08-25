declare module 'qrcode' {
  export interface QRCodeOptions {
    margin?: number;
    width?: number;
    scale?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export interface QRCodeBitMatrix {
    size: number;
    data: Uint8Array;
    get(row: number, col: number): number;
  }

  export interface QRCodeObject {
    modules: QRCodeBitMatrix;
    version: number;
    errorCorrectionLevel: any;
    maskPattern: any;
    segments: any[];
  }

  export function create(
    text: string,
    options?: QRCodeOptions
  ): QRCodeObject;

  export function toDataURL(
    text: string,
    options?: QRCodeOptions
  ): Promise<string>;

  export function toString(
    text: string,
    options?: { type?: 'svg' | 'utf8' | 'terminal'; margin?: number; width?: number }
  ): Promise<string>;
}

declare module 'pngjs' {
  export class PNG {
    width: number;
    height: number;
    data: Buffer | Uint8Array;
    constructor(options?: { width?: number; height?: number });
    static sync: {
      write(png: PNG): Buffer | Uint8Array;
      read(buffer: Buffer | Uint8Array): PNG;
    };
  }
}
