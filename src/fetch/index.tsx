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
import defaultService, { DefaultRequestConfig, DefaultResponse } from './axios';
import { useDebounce } from '../debounce';
import { useEquivalent } from '../equivalent';
import { CancelToken, NetworkService, ProgressEvent } from './types';

type FetchState<R> = ReturnType<typeof _request<{}, R, Record<string, any>>>['state'];

const _request = <C extends {}, R, Resources extends { [K in string]: C }>(
  service: NetworkService<C, R>,
  resources: Resources,
  debounce?: _.DebounceSettings & { wait?: number; },
) => {

  type ResourceState = {
    response?: R;
    error?: Error;
    cancelToken?: CancelToken;
    loading?: boolean;
  }

  const [state, setState] = React.useState<{ [P in keyof Resources]: ResourceState }>(_.mapValues(resources, () => ({})));
  const [progress, setProgress] = React.useState<{ [P in keyof Resources]?: ProgressEvent }>({});
  const setResource = (resource: string, next: ResourceState) => setState(state => ({ ...state, [resource]: _.assign({}, state[resource], next) }));
  const setResourceProgress = (resource: string, next: ProgressEvent) => setProgress(progress => ({ ...progress, [resource]: _.assign({}, progress[resource], next) }));

  const refresh = useDebounce(async (resource: string, cancelToken?: CancelToken) => {

    if (_.isNil(resources[resource])) return;

    const _cancelToken = cancelToken ?? service.createCancelToken();
    setResource(resource, { cancelToken: _cancelToken, loading: true });

    try {
      const response = await service.request({
        ...resources[resource],
        cancelToken: _cancelToken,
        onDownloadProgress: (progress) => setResourceProgress(resource, progress),
      });
      setResource(resource, { response, error: undefined, loading: false });
    } catch (error) {
      setResource(resource, { response: undefined, error: error as Error, loading: false });
    }
  }, debounce ?? {}, [service, setState, useEquivalent(resources)]);

  React.useEffect(() => {
    const cancelToken = service.createCancelToken();
    for (const resource of _.keys(resources)) {
      refresh(resource, cancelToken);
    }
    return () => cancelToken.cancel();
  }, []);

  const _state = React.useMemo(() => _.mapValues(state, (state, resource) => ({
    ...state,
    refresh: () => refresh(resource),
  })), [state, refresh]);

  return { state: _state, progress };
}

const fetchResult = <R extends unknown>(
  fetch?: FetchState<R>[string],
  progress?: ProgressEvent,
) => ({
  ...(fetch ?? {}),
  progress,
  get cancelled() { return fetch?.cancelToken?.cancelled ?? false; },
  get loading() { return fetch?.loading ?? false; },
  cancel: () => { fetch?.cancelToken?.cancel(); },
  refresh: fetch?.refresh ?? (async () => {}),
});

export const createFetch = <C extends {}, R>(config: {
  service: NetworkService<C, R>;
}) => {

  const FetchStateContext = React.createContext<FetchState<R>>({});
  const ProgressContext = React.createContext<Record<string, ProgressEvent>>({});

  const Fetch = <Resources extends { [K in string]: C }>({
    resources,
    debounce,
    children,
  }: {
    resources: Resources;
    debounce?: _.DebounceSettings & { wait?: number; };
    children: React.ReactNode | ((state: { [P in keyof Resources]: ReturnType<typeof fetchResult<R>> }) => React.ReactNode);
  }) => {
    const { state, progress } = _request(config.service, resources, debounce);
    const parent_state = React.useContext(FetchStateContext);
    const parent_progress = React.useContext(ProgressContext);
    const merged_state = React.useMemo(() => ({ ...parent_state, ...state }), [parent_state, state]);
    const merged_progress = React.useMemo(() => ({ ...parent_progress, ...progress }), [parent_progress, progress]);
    return <FetchStateContext.Provider value={merged_state}><ProgressContext.Provider value={merged_progress}>
      {_.isFunction(children) ? children(_.mapValues(state, (state, resource) => fetchResult(state, progress[resource]))) : children}
    </ProgressContext.Provider></FetchStateContext.Provider>;
  };

  const useFetch = (resource: string) => {
    const state = React.useContext(FetchStateContext)[resource];
    const progress = React.useContext(ProgressContext)[resource];
    return fetchResult(state, progress);
  };

  const useRequest = (
    setting: C,
    debounce?: _.DebounceSettings & { wait?: number; },
  ) => {
    const { state, progress } = _request(config.service, { resource: setting }, debounce);
    return fetchResult(state.resource, progress.resource);
  };

  return { Fetch, useFetch, useRequest };
}

export const {
  Fetch,
  useFetch,
  useRequest,
} = createFetch<DefaultRequestConfig, DefaultResponse>({ service: defaultService });
