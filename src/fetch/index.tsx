//
//  index.js
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
import defaultService from './axios';
import { useAsyncDebounce } from '../debounce';
import { CancelToken, NetworkService } from './types';
import { useMount, useUnmount } from '../mount';

export * from './types';

type FetchState<R> = ReturnType<typeof _request<{}, any, R, Record<string, any>>>['state'];

const _request = <C extends {}, P, R, Resources extends { [key: string]: C }>(
  service: NetworkService<C, P, R>,
  resources: Resources,
  debounce?: _.ThrottleSettings & { wait?: number; },
) => {

  type UpdateToken = {
    token?: string;
  }

  type ResourceState = {
    count?: number;
    response?: R;
    error?: Error;
    cancelToken?: CancelToken;
    loading?: boolean;
  }

  const [state, setState] = React.useState<{ [K in keyof Resources]: UpdateToken & ResourceState }>(_.mapValues(resources, () => ({})));
  const [progress, setProgress] = React.useState<{ [K in keyof Resources]?: UpdateToken & { progress?: P } }>({});

  const refresh = useAsyncDebounce(async (resource: string) => {

    if (_.isNil(resources[resource])) return;

    const token = _.uniqueId();
    state[resource]?.cancelToken?.cancel();

    const shouldUpdate = (state: Record<string, UpdateToken | undefined>, token?: string) => _.isNil(token) || state[resource]?.token === token;
    const setResource = (next: UpdateToken & ResourceState, token?: string) => setState(state => shouldUpdate(state, token) ? ({
      ...state,
      [resource]: _.assign({}, state[resource], next, { count: (state[resource].count ?? 0) + (next.count ?? 0) }),
    }) : state);
    const setResourceProgress = (next: UpdateToken & { progress?: P }, token?: string) => setProgress(progress => shouldUpdate(progress, token) ? ({
      ...progress,
      [resource]: _.assign({}, progress[resource], next),
    }) : progress);

    const _cancelToken = service.createCancelToken();
    setResourceProgress({ token, progress: undefined });
    setResource({
      token,
      loading: true,
      cancelToken: {
        get cancelled() { return _cancelToken.cancelled },
        cancel: _.once(() => void _cancelToken.cancel()),
      },
    });

    const _state: ResourceState = {
      response: undefined,
      error: undefined,
    };

    try {
      _state.response = await service.request({
        ...resources[resource],
        cancelToken: _cancelToken,
        onDownloadProgress: (progress) => setResourceProgress({ progress }, token),
      });
    } catch (error) {
      _state.error = error as Error;
    }

    setResource({ ..._state, count: 1, loading: false }, token);

  }, debounce ?? {});

  useMount(() => {
    for (const resource of _.keys(resources)) {
      refresh(resource);
    }
  });
  useUnmount(() => {
    for (const { cancelToken } of _.values(state)) {
      cancelToken?.cancel();
    }
  });

  const _state = React.useMemo(() => _.mapValues(state, (state, resource) => ({
    ..._.omit(state, 'token', 'count'),
    count: state.count ?? 0,
    refresh: () => refresh(resource),
  })), [state]);

  const _progress = React.useMemo(() => _.mapValues(progress, progress => progress?.progress), [progress]);

  return { state: _state, progress: _progress };
}

const fetchResult = <R extends unknown, P>(
  fetch: FetchState<R>[string],
  progress?: P,
) => ({
  ...fetch,
  progress,
  get cancelled() { return fetch.cancelToken?.cancelled ?? false; },
  get loading() { return fetch.loading ?? false; },
  cancel: () => void fetch.cancelToken?.cancel(),
});

export const createFetch = <C extends {}, P, R>(config: {
  service: NetworkService<C, P, R>;
}) => {

  const FetchStateContext = React.createContext<FetchState<R>>({});
  const ProgressContext = React.createContext<Record<string, P>>({});

  const Fetch = React.forwardRef(<Resources extends { [key: string]: C }>({
    resources,
    debounce,
    children,
  }: {
    resources: Resources;
    debounce?: _.DebounceSettings & { wait?: number; };
    children: React.ReactNode | ((state: { [K in keyof Resources]: ReturnType<typeof fetchResult<R, P>> }) => React.ReactNode);
  }, forwardRef: React.ForwardedRef<{ [K in keyof Resources]: ReturnType<typeof fetchResult<R, P>> }>) => {

    const { state, progress } = _request(config.service, resources, debounce);

    const parent_state = React.useContext(FetchStateContext);
    const parent_progress = React.useContext(ProgressContext);

    const merged_state = React.useMemo(() => ({ ...parent_state, ...state }), [parent_state, state]);
    const merged_progress = React.useMemo(() => ({ ...parent_progress, ...progress }), [parent_progress, progress]);
    const combined = React.useCallback(() => _.mapValues(state, (state, resource) => fetchResult(state, progress[resource])), [state, progress]);

    React.useImperativeHandle(forwardRef, combined, [combined]);

    return <FetchStateContext.Provider value={merged_state}><ProgressContext.Provider value={merged_progress}>
      {_.isFunction(children) ? children(combined()) : children}
    </ProgressContext.Provider></FetchStateContext.Provider>;
  });

  const useFetch = (resource: string) => {
    const state = React.useContext(FetchStateContext)[resource];
    const progress = React.useContext(ProgressContext)[resource];
    return fetchResult(state ?? {}, progress);
  };

  const useRequest = (
    setting: C,
    debounce?: _.DebounceSettings & { wait?: number; },
  ) => {
    const { state, progress } = _request(config.service, { resource: setting }, debounce);
    return fetchResult(state.resource, progress.resource);
  };

  const request = (setting: C) => {
    const cancelToken = config.service.createCancelToken();
    const response = config.service.request({
      ...setting,
      cancelToken,
    });
    return _.assign(response, {
      cancelToken,
      cancel: cancelToken.cancel,
    });
  };

  return { Fetch, useFetch, useRequest, request };
}

export const {
  Fetch,
  useFetch,
  useRequest,
  request,
} = createFetch({ service: defaultService });
