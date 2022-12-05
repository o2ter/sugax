//
//  debounce.ts
//
//  The MIT License
//  Copyright (c) 2021 - 2022 O2ter Limited. All rights reserved.
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
import { useStableRef } from './stableRef';

export const useDebounce = <T extends (...args: any) => any>(
  callback: T,
  settings: _.ThrottleSettings & { wait?: number; },
) => {
  const { wait, ...options } = settings;
  const callbackRef = useStableRef(callback);
  return React.useCallback(_.throttle(((...args) => callbackRef.current(...args)) as T, wait, options), []);
}

const asyncDebounce = <T extends (...args: any) => PromiseLike<any>>(
  func: T,
  wait?: number,
  options?: _.ThrottleSettings,
) => {

  type R = T extends (...args: any) => PromiseLike<infer R> ? R : never;
  let preflight: Promise<R>;

  const debounced = _.throttle(async (
    resolve?: (value: PromiseLike<R>) => void,
    ...args: Parameters<T>
  ) => {
    const result = func(...args as any) as PromiseLike<R>;
    if (_.isFunction(resolve)) resolve(result);
    return result;
  }, wait, options);

  return (...args: Parameters<T>) => {
    if (_.isNil(preflight)) {
      preflight = new Promise<R>(r => debounced(r, ...args));
      return preflight;
    }
    return debounced(undefined, ...args) ?? preflight;
  };
};

export const useAsyncDebounce = <T extends (...args: any) => PromiseLike<any>>(
  callback: T,
  settings: _.ThrottleSettings & { wait?: number; },
) => {
  const { wait, ...options } = settings;
  const callbackRef = useStableRef(callback);
  return React.useCallback(asyncDebounce(((...args) => callbackRef.current(...args)) as T, wait, options), []);
}
