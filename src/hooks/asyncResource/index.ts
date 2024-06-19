//
//  index.ts
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
import { useStableCallback } from '../stable';
import { useAsyncDebounce } from '../debounce';
import { Config, Fetch, FetchWithIterable } from './types';

import { Context as ErrorContext } from './error';
export { AsyncResourceErrors, useAsyncResourceErrors } from './error';

export const useAsyncResource = <T>(
  config: Fetch<T> | Config<Fetch<T>>,
  deps?: React.DependencyList,
) => {

  const fetch = _.isFunction(config) ? config : config.fetch;
  const debounce = _.isFunction(config) ? {} : config.debounce;

  const [state, setState] = React.useState<{
    count?: number;
    flag?: boolean;
    resource?: T;
    error?: any;
    token?: string;
    abort?: AbortController;
  }>({});

  const _dispatch = (
    token: string,
    next: React.SetStateAction<typeof state>,
  ) => setState(state => state.token === token ? ({
    ...(_.isFunction(next) ? next(state.flag ? state : _.omit(state, 'resource', 'error')) : next),
    count: state.flag ? state.count : (state.count ?? 0) + 1,
    flag: true,
  }) : state);

  const _fetch = useAsyncDebounce(async (
    abort: AbortController,
    reset: boolean,
    prevState?: T,
  ) => {

    const token = _.uniqueId();
    setState(state => ({ ...state, token, abort, flag: !reset }));

    try {

      const resource = await fetch({
        prevState,
        abortSignal: abort.signal,
        dispatch: (next) => {
          _dispatch(token, state => ({
            ...state,
            resource: _.isFunction(next) ? next(state.resource) : next,
          }));
        },
      });

      _dispatch(token, state => ({ resource: resource ?? state.resource }));

    } catch (error) {

      _dispatch(token, state => ({
        resource: state.resource,
        error,
      }));
    }

  }, debounce ?? {});

  React.useEffect(() => {
    const controller = new AbortController();
    void _fetch(controller, true);
    return () => controller.abort();
  }, deps ?? []);

  const _cancelRef = useStableCallback((reason?: any) => { state.abort?.abort(reason) });
  const _refreshRef = useStableCallback(() => _fetch(new AbortController(), true));
  const _nextRef = useStableCallback(() => _fetch(new AbortController(), false, state.resource));

  const { setErrors } = React.useContext(ErrorContext);
  React.useEffect(() => {
    const { token = _.uniqueId(), error } = state;
    if (!error) return;
    setErrors(v => [...v, { token, error, refresh: _refreshRef }]);
    return () => setErrors(v => _.filter(v, x => x.token !== token));
  }, [state]);

  return {
    count: state.count ?? 0,
    loading: !_.isNil(state.abort),
    resource: state.resource,
    error: state.error,
    cancel: _cancelRef,
    refresh: _refreshRef,
    next: _nextRef,
  };
}

export const useAsyncIterableResource = <T>(
  config: FetchWithIterable<T> | Config<FetchWithIterable<T>>,
  deps?: React.DependencyList,
) => {
  const fetch = _.isFunction(config) ? config : config.fetch;
  const debounce = _.isFunction(config) ? {} : config.debounce;
  const { next, ...result } = useAsyncResource<T[]>({
    fetch: async ({ dispatch, abortSignal }) => {
      const resource = await fetch({ abortSignal });
      for await (const item of resource) {
        dispatch(items => items ? [...items, item] : [item]);
      }
    },
    debounce,
  }, deps);
  return result;
}
