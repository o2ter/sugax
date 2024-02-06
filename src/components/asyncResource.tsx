//
//  asyncResource.tsx
//
//  The MIT License
//  Copyright (c) 2021 - 2024 O2ter Limited. All rights reserved.
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
import { Awaitable, useAsyncIterableResource, useAsyncResource } from '../hooks';

type AsyncResourceProps<T> = {
  fetch: (x: {
    dispatch: React.Dispatch<T | ((prevState?: T) => T)>;
    abortSignal: AbortSignal;
  }) => PromiseLike<void | T>,
  debounce?: _.DebounceSettings & { wait?: number; },
  extraData?: any,
  children: (state: ReturnType<typeof useAsyncResource<T>>) => React.ReactNode;
};

export const AsyncResource = <T extends unknown>({
  fetch,
  debounce,
  extraData,
  children
}: AsyncResourceProps<T>) => {
  const state = useAsyncResource(fetch, debounce, extraData);
  return (
    <>{children(state)}</>
  );
}

type AsyncIterableResourceProps<T> = {
  fetch: (x: {
    abortSignal: AbortSignal;
  }) => Awaitable<AsyncIterable<T>>,
  debounce?: _.DebounceSettings & { wait?: number; },
  extraData?: any,
  children: (state: ReturnType<typeof useAsyncIterableResource<T>>) => React.ReactNode;
};

export const AsyncIterableResource = <T extends unknown>({
  fetch,
  debounce,
  extraData,
  children
}: AsyncIterableResourceProps<T>) => {
  const state = useAsyncIterableResource(fetch, debounce, extraData);
  return (
    <>{children(state)}</>
  );
}
