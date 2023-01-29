//
//  asyncResource.ts
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
import { useAsyncDebounce } from './debounce';
import { useStableCallback } from './stable';

const _useAsyncResource = <T>(
  fetch: (x: {
    dispatch: React.Dispatch<React.SetStateAction<T | undefined>>;
    signal: AbortSignal;
  }) => PromiseLike<T>,
  debounce?: _.ThrottleSettings & { wait?: number; },
  deps?: React.DependencyList,
) => {

  const [state, setState] = React.useState<{
    count?: number;
    resource?: T;
    error?: Error;
    token?: string;
    abort?: AbortController;
  }>({});

  const _refresh = useAsyncDebounce(async (abort: AbortController) => {

    const token = _.uniqueId();
    setState(state => ({ ...state, token, abort }));

    let updateFlag = false;
    const _dispatch: typeof setState = (next) => setState(state => state.token === token ? ({
      ...(_.isFunction(next) ? next(updateFlag ? state : _.omit(state, 'resource', 'error')) : next),
      count: updateFlag ? state.count : (state.count ?? 0) + 1,
    }) : state);

    try {

      const resource = await fetch({
        signal: abort.signal,
        dispatch: (next) => {
          _dispatch(state => ({
            ...state,
            resource: _.isFunction(next) ? next(state.resource) : next,
          }));
          updateFlag = true;
        },
      });

      _dispatch({ resource });

    } catch (error) {

      _dispatch(state => ({
        resource: state.resource,
        error: error as Error,
      }));
    }

  }, debounce ?? {});

  React.useEffect(() => {
    const controller = new AbortController();
    void _refresh(controller);
    return () => controller.abort();
  }, deps ?? []);

  const _cancelRef = useStableCallback((reason?: any) => void state.abort?.abort(reason));
  const _refreshRef = useStableCallback(() => _refresh(new AbortController()));

  return {
    count: state.count ?? 0,
    loading: !_.isNil(state.abort),
    resource: state.resource,
    error: state.error,
    cancel: _cancelRef,
    refresh: _refreshRef,
  };
}

export const useAsyncResource = _useAsyncResource;