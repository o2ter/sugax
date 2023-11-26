//
//  animate.ts
//
//  The MIT License
//  Copyright (c) 2021 - 2023 O2ter Limited. All rights reserved.
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
//

import _ from 'lodash';
import React from 'react';
import { useStableCallback } from './stable';

type AnimateOptions = {
  fromValue?: number;
  toValue: number;
  duration: number;
  easing?: (value: number) => number;
  delay?: number;
};

export const useAnimate = (initialValue: number) => {
  const [value, setValue] = React.useState(initialValue);
  const ref = React.useRef<ReturnType<typeof setInterval>>();
  const stop = useStableCallback(() => {
    if (ref.current) clearInterval(ref.current);
    ref.current = undefined;
  });
  return {
    value,
    stop,
    start: useStableCallback(({
      fromValue = value,
      toValue,
      duration,
      easing = (x) => x,
      delay = 0,
    }: AnimateOptions) => {
      stop();
      const start = Date.now();
      if (duration > 0) ref.current = setInterval(() => {
        const t = (Date.now() - start) / duration - delay;
        if (t >= 1) {
          clearInterval(ref.current);
          ref.current = undefined;
          setValue(toValue);
        } else if (t >= 0) {
          setValue((toValue - fromValue) * easing(_.clamp(t, 0, 1)) + fromValue);
        }
      }, 1);
    }),
  };
}