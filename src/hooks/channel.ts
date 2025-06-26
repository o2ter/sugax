//
//  channel.ts
//
//  The MIT License
//  Copyright (c) 2021 - 2025 O2ter Limited. All rights reserved.
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
import { IState } from './types';

export interface IChannel<T extends unknown = any> extends IState<T> {
  subscribe: (callback: (oldVal: T, newVal: T) => void) => VoidFunction
}

export const createChannel = <T extends unknown = any>(initialValue: T): IChannel<T> => {

  const listeners = new Set<(oldVal: T, newVal: T) => void>();
  let current = initialValue;

  return {
    get current() {
      return current;
    },
    setValue(value: React.SetStateAction<T>) {
      const oldVal = current;
      current = _.isFunction(value) ? value(current) : value;
      listeners.forEach(listener => void listener(oldVal, current));
    },
    subscribe: (callback: (oldVal: T, newVal: T) => void) => {
      listeners.add(callback);
      return () => void listeners.delete(callback);
    },
  };
}

export const useChannel = <T extends unknown = any, S = T>(
  channel: IChannel<T>,
  selector: (state: T) => S = v => v as any,
  equal: (value: S, other: S) => boolean = _.isEqual,
): S => React.useSyncExternalStore(
  (onStoreChange) => channel.subscribe((oldVal, newVal) => {
    if (!equal(selector(oldVal), selector(newVal))) onStoreChange();
  }),
  () => selector(channel.current)
);
