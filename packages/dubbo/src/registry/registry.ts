/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {noop} from '../common/util';
import RequestContext from '../consumer/request-context';
import DubboUrl from '../consumer/dubbo-url';
import {IRegistrySubscriber} from '../types';

export type TAgentAddr = string;
export type TDubboInterface = string;

/**
 * 抽取注册中心的基类
 */
export default class Registry<T = {}> {
  protected _dubboProps: T;
  protected _subscriber: IRegistrySubscriber;
  protected readonly _dubboServiceUrlMap: Map<TDubboInterface, Array<DubboUrl>>;

  constructor(props: T) {
    this._dubboProps = props;

    //保存dubbo接口和服务url之间的映射关系
    this._dubboServiceUrlMap = new Map();

    //初始化订阅者
    this._subscriber = {onData: noop, onError: noop};
  }

  /**
   * 订阅者
   * @param subscriber
   */
  subscribe(subscriber: IRegistrySubscriber) {
    this._subscriber = subscriber;
    return this;
  }

  /**
   * 获取可以处理上下文context中的dubbo接口信息map
   * @param ctx
   */
  getAgentAddrMap(ctx: RequestContext): {[name: string]: DubboUrl} {
    const {dubboInterface, version, group, methodName} = ctx;

    return this._dubboServiceUrlMap
      .get(dubboInterface)
      .filter((serviceProp) => {
        // "*" refer to default wildcard in dubbo
        const isSameVersion =
          !version || version == '*' || serviceProp.version === version;
        //如果Group为null，就默认匹配， 不检查group
        //如果Group不为null，确保group和接口的group一致
        const isSameGroup = !group || group === serviceProp.group;
        const hasMethod =
          serviceProp.methods.length > 0 &&
          serviceProp.methods.includes(methodName);
        return isSameGroup && isSameVersion && hasMethod;
      })
      .reduce((reducer: Object, prop: DubboUrl) => {
        const {host, port} = prop;
        reducer[`${host}:${port}`] = prop;
        return reducer;
      }, Object.create(null));
  }

  hasAgentAddr(ctx: RequestContext) {
    const agentAddr = this._dubboServiceUrlMap.get(ctx.dubboInterface);
    return agentAddr && agentAddr.length > 0;
  }
}
