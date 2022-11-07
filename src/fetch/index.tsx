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

const NetworkContext = React.createContext<NetworkService<any, any>>(defaultService);
const Storage = React.createContext<ReturnType<typeof _useFetch<any, any>>>({});

const _useFetch = <C, R>(
  resources: Record<string, C>,
  debounce: _.DebounceSettings & { wait?: number; },
) => {

  const network = React.useContext(NetworkContext);

  type ResourceState = {
    response?: R;
    error?: Error;
    cancelToken?: CancelToken;
    loading?: boolean;
  }

  const [state, setState] = React.useState<Record<string, ResourceState>>({});
  const setResource = (resource: string, next: ResourceState) => setState(state => ({ ...state, [resource]: _.assign({}, state[resource], next) }));

  const refresh = useDebounce(
    async (resource: string, cancelToken?: CancelToken) => {

      if (_.isNil(resources[resource])) return;

      const _cancelToken = cancelToken ?? network.createCancelToken();
      setResource(resource, { cancelToken: _cancelToken, loading: true });

      try {
        const response = await network.request({ ...resources[resource], cancelToken: _cancelToken });
        setResource(resource, { response, error: undefined, loading: false });
      } catch (error) {
        setResource(resource, { response: undefined, error: error as Error, loading: false });
      }
    },
    debounce,
    [network, setState, useEquivalent(resources)]
  );

  React.useEffect(() => {
    const cancelToken = network.createCancelToken();
    for (const resource of _.keys(resources)) {
      refresh(resource, cancelToken);
    }
    return () => cancelToken.cancel();
  }, []);

  return React.useMemo(() => _.mapValues(state, (state, resource) => ({
    ...state,
    refresh: () => refresh(resource),
  })), [state, refresh]);
}

const fetchResult = <R extends unknown = DefaultResponse>(fetch: ReturnType<typeof _useFetch<any, R>>[string]) => {
  if (_.isNil(fetch)) return;
  return {
    ...fetch,
    get cancelled() { return fetch.cancelToken?.cancelled ?? false; },
    get loading() { return fetch.loading ?? false; },
    cancel: () => { fetch.cancelToken?.cancel(); },
  };
}

export const useFetch = <R extends unknown = DefaultResponse>(resource: string) => fetchResult<R>(React.useContext(Storage)[resource]);

const FetchBase = <C extends {} = DefaultRequestConfig, R extends unknown = DefaultResponse>({
  resources,
  debounce,
  children,
}: {
  resources: Record<string, C>;
  debounce: _.DebounceSettings & { wait?: number; };
  children: React.ReactNode | ((state: Record<string, ReturnType<typeof fetchResult<R>>>) => React.ReactNode);
}) => {
  const parent = React.useContext(Storage);
  const fetch = _useFetch<C, R>(resources, debounce);
  const merged = React.useMemo(() => ({ ...parent, ...fetch }), [parent, fetch]);
  return <Storage.Provider value={merged}>{_.isFunction(children) ? children(_.mapValues(fetch, fetchResult)) : children}</Storage.Provider>;
}

const FetchProvider = <C extends {} = DefaultRequestConfig, R extends unknown = DefaultResponse>({
  service,
  children,
}: React.PropsWithChildren<{
  service: NetworkService<C, R>;
}>) => <NetworkContext.Provider value={service}>{children}</NetworkContext.Provider>;

export const Fetch = _.assign(FetchBase, { Provider: FetchProvider });
