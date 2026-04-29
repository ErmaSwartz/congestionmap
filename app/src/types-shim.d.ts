/// <reference types="vite/client" />

declare module 'scrollama' {
  export interface ScrollamaOptions {
    step: string | HTMLElement[] | NodeListOf<Element>;
    offset?: number;
    threshold?: number;
    progress?: boolean;
    debug?: boolean;
    once?: boolean;
  }

  export interface StepEvent {
    element: HTMLElement;
    index: number;
    direction: 'up' | 'down';
  }

  export interface ProgressEvent extends StepEvent {
    progress: number;
  }

  export interface ScrollamaInstance {
    setup(opts: ScrollamaOptions): ScrollamaInstance;
    onStepEnter(cb: (e: StepEvent) => void): ScrollamaInstance;
    onStepExit(cb: (e: StepEvent) => void): ScrollamaInstance;
    onStepProgress(cb: (e: ProgressEvent) => void): ScrollamaInstance;
    resize(): void;
    destroy(): void;
  }

  export default function scrollama(): ScrollamaInstance;
}

declare module '*.geojson' {
  const value: GeoJSON.FeatureCollection;
  export default value;
}
