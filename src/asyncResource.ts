//
//  asyncResource.ts
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
import { useDebounce } from './debounce';

export const useAsyncResource = <T>(
  fetch: () => PromiseLike<T>,
  debounce?: _.ThrottleSettings & { wait?: number; },
  deps: React.DependencyList = [],
) => {

  type State = {
    loading?: boolean;
    resource?: T;
    error?: Error;
    token?: string;
  };

  const [state, setState] = React.useState<State>({});

  const _refresh = useDebounce(async () => {

    const token = _.uniqueId();
    setState(state => ({ ...state, token, loading: true }));

    const _state: State = {};

    try {
      _state.resource = await fetch();
    } catch (error) {
      _state.error = error as Error;
    }

    setState(state => state.token === token ? ({ ...state, ..._state, loading: false }) : state);

  }, debounce ?? {}, deps);

  React.useEffect(() => { _refresh(); }, []);

  const refresh = React.useCallback(() => _refresh() ?? Promise.resolve(), [_refresh]);

  return {
    get loading() { return state.loading ?? false },
    get resource() { return state.resource },
    get error() { return state.error },
    refresh,
  };
}