//
//  storage.ts
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

const setStorage = (storage: Storage, key: string, value?: string) => _.isNil(value) ? storage.removeItem(key) : storage.setItem(key, value);

const useStorage = (storage: Storage, key: string): [string | null, (value?: string) => void] => {

  const value = React.useSyncExternalStore((callback) => {
    const listener = (event: StorageEvent) => {
      if (event.storageArea === storage && event.key === key) callback();
    };
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  }, () => storage.getItem(key));

  const setValue = React.useCallback((value?: string) => setStorage(storage, key, value), []);

  return [value, setValue];
}

export const useLocalStorage = (key: string): ReturnType<typeof useStorage> => typeof window !== 'undefined' ? useStorage(window.localStorage, key) : [null, () => {}];
export const useSessionStorage = (key: string): ReturnType<typeof useStorage> => typeof window !== 'undefined' ? useStorage(window.sessionStorage, key) : [null, () => {}];
