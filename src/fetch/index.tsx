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

export const createFetch = <C extends {}, R extends unknown>(config: {
  service: NetworkService<C, R>;
}) => {

  const service = config.service;

  const _request = (
    resources: Record<string, C>,
    debounce: _.DebounceSettings & { wait?: number; },
  ) => {

    type ResourceState = {
      response?: R;
      error?: Error;
      cancelToken?: CancelToken;
      loading?: boolean;
    }

    const [state, setState] = React.useState<Record<string, ResourceState>>({});
    const [progress, setProgress] = React.useState<Record<string, ProgressEvent>>({});
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
    }, debounce, [service, setState, useEquivalent(resources)]);

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

  type FetchState = ReturnType<typeof _request>['state'];

  const FetchStateContext = React.createContext<FetchState>({});
  const ProgressContext = React.createContext<Record<string, ProgressEvent>>({});

  const fetchResult = (
    fetch: FetchState[string],
    progress?: ProgressEvent,
  ) => {
    if (_.isNil(fetch)) return;
    return {
      ...fetch,
      progress,
      get cancelled() { return fetch.cancelToken?.cancelled ?? false; },
      get loading() { return fetch.loading ?? false; },
      cancel: () => { fetch.cancelToken?.cancel(); },
    };
  };

  const Fetch: React.FC<{
    resources: Record<string, C>;
    debounce: _.DebounceSettings & { wait?: number; };
    children: React.ReactNode | ((state: Record<string, ReturnType<typeof fetchResult>>) => React.ReactNode);
  }> = ({
    resources,
    debounce,
    children,
  }) => {
    const { state, progress } = _request(resources, debounce);
    const parent_state = React.useContext(FetchStateContext);
    const parent_progress = React.useContext(ProgressContext);
    const merged_state = React.useMemo(() => ({ ...parent_state, ...state }), [parent_state, state]);
    const merged_progress = React.useMemo(() => ({ ...parent_progress, ...progress }), [parent_progress, progress]);
    return <FetchStateContext.Provider value={merged_state}><ProgressContext.Provider value={merged_progress}>
      {_.isFunction(children) ? children(_.mapValues(state, (state, resource) => fetchResult(state, progress[resource]))) : children}
    </ProgressContext.Provider></FetchStateContext.Provider>;
  };

  const useFetch = (resource: string) => fetchResult(
    React.useContext(FetchStateContext)[resource],
    React.useContext(ProgressContext)[resource]
  );

  return { Fetch, useFetch };
}

export const {
  Fetch,
  useFetch,
} = createFetch<DefaultRequestConfig, DefaultResponse>({ service: defaultService });
