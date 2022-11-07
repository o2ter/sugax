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
import { CancelToken, NetworkService } from './types';

type FetchResult<R> = ReturnType<typeof _useFetch<any, R>>;

type ResponseState<R> = {
  response?: R;
  error?: Error;
  cancelToken?: CancelToken;
}

const NetworkContext = React.createContext<NetworkService<any, any>>(defaultService);
const Storage = React.createContext<FetchResult<any>>({});

const fetch = async <C, R>(
  network: NetworkService<C, R>,
  config: C & { cancelToken?: CancelToken; }
) => {
  try {
    const response = await network.request(config);
    return { response };
  } catch (error) {
    return { error: error as Error };
  }
}

const _useFetch = <C, R>(
  resources: Record<string, C>,
  debounce: _.DebounceSettings & { wait?: number; },
) => {

  const network = React.useContext(NetworkContext);

  const [state, setState] = React.useState<Record<string, ResponseState<R>>>({});
  const setResource = (resource: string, next: ResponseState<R>) => setState(state => ({ ...state, [resource]: _.assign({}, state[resource], next) }));

  const refresh = useDebounce(
    async (resource: string, cancelToken?: CancelToken) => {
      if (_.isNil(resources[resource])) return;
      const _cancelToken = cancelToken ?? network.createCancelToken();
      setResource(resource, { cancelToken: _cancelToken });
      const response = await fetch<C, R>(network, { ...resources[resource], cancelToken: _cancelToken });
      setResource(resource, response);
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

  return _.mapValues(state, (state, resource) => ({
    ...state,
    refresh: () => refresh(resource),
  }));
}

export const useFetch = <R = DefaultResponse>(resource: string) => {
  const fetch: FetchResult<R>[string] = React.useContext(Storage)[resource];
  if (_.isNil(fetch)) return;
  return {
    ..._.omit(fetch, 'cancelToken'),
    get cancelled() { return fetch.cancelToken?.cancelled ?? false; },
    cancel: () => { fetch.cancelToken?.cancel(); },
  };
}

const FetchBase = <C = DefaultRequestConfig, R = DefaultResponse>({
  resources,
  debounce,
  children,
}: {
  resources: Record<string, C>;
  debounce: _.DebounceSettings & { wait?: number; };
  children: React.ReactNode | ((state: FetchResult<R>) => React.ReactNode);
}) => {
  const fetch = _useFetch<C, R>(resources, debounce);
  return <Storage.Provider value={fetch}>{_.isFunction(children) ? children(fetch) : children}</Storage.Provider>;
}

const FetchProvider = <C = DefaultRequestConfig, R = DefaultResponse>({
  service,
  children,
}: React.PropsWithChildren<{
  service?: NetworkService<C, R>;
}>) => {
  const parent = React.useContext(NetworkContext);
  return (
    <NetworkContext.Provider value={service ?? parent}>{children}</NetworkContext.Provider>
  );
}

export const Fetch = _.assign(FetchBase, {
  Provider: FetchProvider,
})
