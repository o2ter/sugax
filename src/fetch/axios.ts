//
//  axios.ts
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
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { CancelToken, NetworkService } from './types';

const axiosInstance = axios.create({ withCredentials: true });
const tokenMap = new WeakMap<CancelToken, AbortController>();

export const service: NetworkService<AxiosRequestConfig<any>, AxiosResponse<any, any>> = {

  createCancelToken() {
    const controller = new AbortController();
    const token = {
      get cancelled() {
        return controller.signal.aborted;
      },
      cancel() {
        controller.abort();
      },
    };
    tokenMap.set(token, controller);
    return token;
  },

  request: async (config) => {

    const controller = _.isNil(config.cancelToken) ? undefined : tokenMap.get(config.cancelToken);

    const res = await axiosInstance.request({
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      headers: config.headers,
      params: config.params,
      data: config.data,
      signal: controller?.signal,
    });

    return res;
  },
};

export default service;