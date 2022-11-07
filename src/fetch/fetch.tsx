//
//  network.tsx
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
import { useDebounce } from '../debounce';
import { useEquivalent } from '../equivalent';
import { useNetwork } from './network';
import { CancelToken, NetworkService } from './types';

type FetchResult<R> = ReturnType<typeof _useFetch<any, R>>;

type ResponseState<R> = {
  response?: R | undefined;
  error?: Error | undefined;
}

const Storage = React.createContext<FetchResult<any>>({});

const fetch = async <C, R>(
  network: NetworkService<C, R>,
  config: C & { cancelToken?: CancelToken; },
  setState: (state: ResponseState<R>) => void
) => {
  try {
    setState({ response: await network.request(config) });
  } catch (error) {
    setState({ error: error as Error });
  }
}

const _useFetch = <C, R>(
  resources: Record<string, C>,
  debounce: _.DebounceSettings & { wait?: number; },
) => {

  const network = useNetwork();
  const cancelToken = React.useRef(network.createCancelToken()).current;

  const [state, setState] = React.useState<Record<string, ResponseState<R>>>({});
  const refresh = useDebounce(
    (resource?: string) => {
      const _setState = (resource: string) => (next: ResponseState<R>) => setState(state => ({ ...state, [resource]: next }));
      const _fetch = (resource: string) => {
        if (!_.isNil(resources[resource])) fetch(network, { ...resources[resource], cancelToken }, _setState(resource));
      }
      if (_.isString(resource)) {
        _fetch(resource);
      } else {
        for (const resource of _.keys(resources)) {
          _fetch(resource);
        }
      }
    },
    debounce,
    [network, setState, useEquivalent(resources)]
  );

  React.useEffect(() => {
    refresh();
    return () => cancelToken.cancel();
  }, []);

  return _.mapValues(state, (state, resource) => ({
    ...state,
    cancelToken,
    refresh: () => refresh(resource),
  }));
}

export const useFetch = <R extends unknown>(resource: string) => React.useContext(Storage)[resource] as FetchResult<R>[string] | undefined;

export const Fetch = <C, R>({
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
