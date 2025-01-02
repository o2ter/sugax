//
//  storage.ts
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

const listeners = new Map<Storage, ((value: string | null) => void)[]>;

const setStorage = (storage: Storage, key: string, value: string | null) => _.isNil(value) ? storage.removeItem(key) : storage.setItem(key, value);
const useStorage = (storage: Storage, key: string): [string | null, React.Dispatch<React.SetStateAction<string | null>>] => {

  const [value, update] = React.useState(storage.getItem(key));

  React.useEffect(() => {
    const listener = (event: StorageEvent) => {
      if (event.storageArea === storage && event.key === key) update(event.newValue);
    };
    listeners.set(storage, [...listeners.get(storage) ?? [], update]);
    window.addEventListener('storage', listener);
    return () => {
      listeners.set(storage, _.filter(listeners.get(storage), x => x !== update));
      window.removeEventListener('storage', listener);
    }
  }, [storage, key]);

  return [value, React.useCallback((value) => {
    const newValue = _.isFunction(value) ? value(storage.getItem(key)) : value;
    listeners.get(storage)?.forEach(x => { if (x !== update) x(newValue); });
    update(newValue);
    setStorage(storage, key, newValue);
  }, [storage, key])];
}

export const useLocalStorage = (key: string): ReturnType<typeof useStorage> => typeof window !== 'undefined' ? useStorage(window.localStorage, key) : [null, () => {}];
export const useSessionStorage = (key: string): ReturnType<typeof useStorage> => typeof window !== 'undefined' ? useStorage(window.sessionStorage, key) : [null, () => {}];
