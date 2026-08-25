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

  export function toDataURL(
    text: string,
    options?: QRCodeOptions
  ): Promise<string>;

  export function toString(
    text: string,
    options?: { type?: 'svg' | 'utf8' | 'terminal'; margin?: number; width?: number }
  ): Promise<string>;
}
