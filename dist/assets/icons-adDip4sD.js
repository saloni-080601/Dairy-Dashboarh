var nt=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};function Ye(r){return r&&r.__esModule&&Object.prototype.hasOwnProperty.call(r,"default")?r.default:r}var Y={exports:{}},a={};/**
 * @license React
 * react.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var J;function We(){if(J)return a;J=1;var r=Symbol.for("react.transitional.element"),n=Symbol.for("react.portal"),y=Symbol.for("react.fragment"),u=Symbol.for("react.strict_mode"),w=Symbol.for("react.profiler"),E=Symbol.for("react.consumer"),C=Symbol.for("react.context"),z=Symbol.for("react.forward_ref"),m=Symbol.for("react.suspense"),b=Symbol.for("react.memo"),$=Symbol.for("react.lazy"),S=Symbol.for("react.activity"),A=Symbol.for("react.view_transition"),g=Symbol.iterator;function p(e){return e===null||typeof e!="object"?null:(e=g&&e[g]||e["@@iterator"],typeof e=="function"?e:null)}var v={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},M=Object.assign,R={};function k(e,t,o){this.props=e,this.context=t,this.refs=R,this.updater=o||v}k.prototype.isReactComponent={},k.prototype.setState=function(e,t){if(typeof e!="object"&&typeof e!="function"&&e!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,e,t,"setState")},k.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,"forceUpdate")};function N(){}N.prototype=k.prototype;function j(e,t,o){this.props=e,this.context=t,this.refs=R,this.updater=o||v}var H=j.prototype=new N;H.constructor=j,M(H,k.prototype),H.isPureReactComponent=!0;var q=Array.isArray;function P(){}var d={H:null,A:null,T:null,S:null},B=Object.prototype.hasOwnProperty;function O(e,t,o){var s=o.ref;return{$$typeof:r,type:e,key:t,ref:s!==void 0?s:null,props:o}}function Ne(e,t){return O(e.type,t,e.props)}function I(e){return typeof e=="object"&&e!==null&&e.$$typeof===r}function qe(e){var t={"=":"=0",":":"=2"};return"$"+e.replace(/[=:]/g,function(o){return t[o]})}var G=/\/+/g;function V(e,t){return typeof e=="object"&&e!==null&&e.key!=null?qe(""+e.key):t.toString(36)}function Le(e){switch(e.status){case"fulfilled":return e.value;case"rejected":throw e.reason;default:switch(typeof e.status=="string"?e.then(P,P):(e.status="pending",e.then(function(t){e.status==="pending"&&(e.status="fulfilled",e.value=t)},function(t){e.status==="pending"&&(e.status="rejected",e.reason=t)})),e.status){case"fulfilled":return e.value;case"rejected":throw e.reason}}throw e}function D(e,t,o,s,c){var h=typeof e;(h==="undefined"||h==="boolean")&&(e=null);var l=!1;if(e===null)l=!0;else switch(h){case"bigint":case"string":case"number":l=!0;break;case"object":switch(e.$$typeof){case r:case n:l=!0;break;case $:return l=e._init,D(l(e._payload),t,o,s,c)}}if(l)return c=c(e),l=s===""?"."+V(e,0):s,q(c)?(o="",l!=null&&(o=l.replace(G,"$&/")+"/"),D(c,t,o,"",function(Ve){return Ve})):c!=null&&(I(c)&&(c=Ne(c,o+(c.key==null||e&&e.key===c.key?"":(""+c.key).replace(G,"$&/")+"/")+l)),t.push(c)),1;l=0;var _=s===""?".":s+":";if(q(e))for(var f=0;f<e.length;f++)s=e[f],h=_+V(s,f),l+=D(s,t,o,h,c);else if(f=p(e),typeof f=="function")for(e=f.call(e),f=0;!(s=e.next()).done;)s=s.value,h=_+V(s,f++),l+=D(s,t,o,h,c);else if(h==="object"){if(typeof e.then=="function")return D(Le(e),t,o,s,c);throw t=String(e),Error("Objects are not valid as a React child (found: "+(t==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":t)+"). If you meant to render a collection of children, use an array instead.")}return l}function L(e,t,o){if(e==null)return e;var s=[],c=0;return D(e,s,"","",function(h){return t.call(o,h,c++)}),s}function Oe(e){if(e._status===-1){var t=e._result,o=t();o.then(function(s){(e._status===0||e._status===-1)&&(e._status=1,e._result=s,o.status===void 0&&(o.status="fulfilled",o.value=s))},function(s){(e._status===0||e._status===-1)&&(e._status=2,e._result=s,o.status===void 0&&(o.status="rejected",o.reason=s))}),e._status===-1&&(e._status=0,e._result=o)}if(e._status===1)return e._result.default;throw e._result}var K=typeof reportError=="function"?reportError:function(e){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var t=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof e=="object"&&e!==null&&typeof e.message=="string"?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",e);return}console.error(e)};function X(e){var t=d.T,o={};o.types=t!==null?t.types:null,d.T=o;try{var s=e(),c=d.S;c!==null&&c(o,s),typeof s=="object"&&s!==null&&typeof s.then=="function"&&s.then(P,K)}catch(h){K(h)}finally{t!==null&&o.types!==null&&(t.types=o.types),d.T=t}}function Z(e){var t=d.T;if(t!==null){var o=t.types;o===null?t.types=[e]:o.indexOf(e)===-1&&o.push(e)}else X(Z.bind(null,e))}var Ie={map:L,forEach:function(e,t,o){L(e,function(){t.apply(this,arguments)},o)},count:function(e){var t=0;return L(e,function(){t++}),t},toArray:function(e){return L(e,function(t){return t})||[]},only:function(e){if(!I(e))throw Error("React.Children.only expected to receive a single React element child.");return e}};return a.Activity=S,a.Children=Ie,a.Component=k,a.Fragment=y,a.Profiler=w,a.PureComponent=j,a.StrictMode=u,a.Suspense=m,a.ViewTransition=A,a.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=d,a.__COMPILER_RUNTIME={__proto__:null,c:function(e){return d.H.useMemoCache(e)}},a.addTransitionType=Z,a.cache=function(e){return function(){return e.apply(null,arguments)}},a.cacheSignal=function(){return null},a.cloneElement=function(e,t,o){if(e==null)throw Error("The argument must be a React element, but you passed "+e+".");var s=M({},e.props),c=e.key;if(t!=null)for(h in t.key!==void 0&&(c=""+t.key),t)!B.call(t,h)||h==="key"||h==="__self"||h==="__source"||h==="ref"&&t.ref===void 0||(s[h]=t[h]);var h=arguments.length-2;if(h===1)s.children=o;else if(1<h){for(var l=Array(h),_=0;_<h;_++)l[_]=arguments[_+2];s.children=l}return O(e.type,c,s)},a.createContext=function(e){return e={$$typeof:C,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null},e.Provider=e,e.Consumer={$$typeof:E,_context:e},e},a.createElement=function(e,t,o){var s,c={},h=null;if(t!=null)for(s in t.key!==void 0&&(h=""+t.key),t)B.call(t,s)&&s!=="key"&&s!=="__self"&&s!=="__source"&&(c[s]=t[s]);var l=arguments.length-2;if(l===1)c.children=o;else if(1<l){for(var _=Array(l),f=0;f<l;f++)_[f]=arguments[f+2];c.children=_}if(e&&e.defaultProps)for(s in l=e.defaultProps,l)c[s]===void 0&&(c[s]=l[s]);return O(e,h,c)},a.createRef=function(){return{current:null}},a.forwardRef=function(e){return{$$typeof:z,render:e}},a.isValidElement=I,a.lazy=function(e){return{$$typeof:$,_payload:{_status:-1,_result:e},_init:Oe}},a.memo=function(e,t){return{$$typeof:b,type:e,compare:t===void 0?null:t}},a.startTransition=X,a.unstable_useCacheRefresh=function(){return d.H.useCacheRefresh()},a.use=function(e){return d.H.use(e)},a.useActionState=function(e,t,o){return d.H.useActionState(e,t,o)},a.useCallback=function(e,t){return d.H.useCallback(e,t)},a.useContext=function(e){return d.H.useContext(e)},a.useDebugValue=function(){},a.useDeferredValue=function(e,t){return d.H.useDeferredValue(e,t)},a.useEffect=function(e,t){return d.H.useEffect(e,t)},a.useEffectEvent=function(e){return d.H.useEffectEvent(e)},a.useId=function(){return d.H.useId()},a.useImperativeHandle=function(e,t,o){return d.H.useImperativeHandle(e,t,o)},a.useInsertionEffect=function(e,t){return d.H.useInsertionEffect(e,t)},a.useLayoutEffect=function(e,t){return d.H.useLayoutEffect(e,t)},a.useMemo=function(e,t){return d.H.useMemo(e,t)},a.useOptimistic=function(e,t){return d.H.useOptimistic(e,t)},a.useReducer=function(e,t,o){return d.H.useReducer(e,t,o)},a.useRef=function(e){return d.H.useRef(e)},a.useState=function(e){return d.H.useState(e)},a.useSyncExternalStore=function(e,t,o){return d.H.useSyncExternalStore(e,t,o)},a.useTransition=function(){return d.H.useTransition()},a.version="19.3.1",a}var Q;function Ue(){return Q||(Q=1,Y.exports=We()),Y.exports}var x=Ue();const ot=Ye(x);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Be=r=>r==null?void 0:r.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function Ge(r,n,y=[]){if(n==null)throw new Error("[lucide]: iconNode is required when icon name is used");return{name:Be(r),size:24,node:n,...y.length>0?{aliases:y}:{}}}/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ke=r=>{let n="",y=!1;for(const u of r){if(u==="-"||u==="_"||u<=" "){y=n.length>0;continue}n.length===0?n+=u.toLowerCase():n+=y?u.toUpperCase():u,y=!1}return n};/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xe=r=>{const n=Ke(r);return n.charAt(0).toUpperCase()+n.slice(1)};/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const U=(...r)=>r.filter((n,y,u)=>!!n&&n.trim()!==""&&u.indexOf(n)===y).join(" ").trim();/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const T={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function W(r){return r!=null}function Ze(r,n={}){var A,g;const y=n.attributeNames??{},u=p=>y[p]??p,w=r.size??r.width??T.width,E=r.size??r.height??T.height,C=((A=r.aliases)==null?void 0:A.filter(p=>typeof p=="string"&&p.trim()!=="").map(p=>`lucide-${p}`))??[],z=[...r.name?[`lucide-${r.name}`]:[],...C],m=((g=n.className)==null?void 0:g.split(" ").filter(Boolean))??[],b=n.includeDefaultClasses===!1?U(...m):U("lucide",...z,...m),$=n.absoluteStrokeWidth?Number(n.strokeWidth??T["stroke-width"])*Number(r.size??r.width??T.width)/Number(n.size??n.width??T.width):n.strokeWidth??T["stroke-width"];return["svg",{...Object.entries(T).reduce((p,[v,M])=>(p[u(v)]=M,p),{}),..."color"in n&&n.color&&{[u("stroke")]:n.color},..."size"in n&&W(n.size)&&{[u("width")]:n.size,[u("height")]:n.size},..."width"in n&&W(n.width)&&{[u("width")]:n.width},..."height"in n&&W(n.height)&&{[u("height")]:n.height},[u("stroke-width")]:$,...b&&{[u("class")]:b},[u("viewBox")]:`0 0 ${w} ${E}`,...n.hasA11yProp===!1?{[u("aria-hidden")]:"true"}:{},..."attributes"in n&&n.attributes},r.node.map(p=>{const[v,M,R]=p,k=n.nonScalingStroke?{[u("vector-effect")]:"non-scaling-stroke",...M}:M;return R?[v,k,R]:[v,k]})]}/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function Je(r,n={}){return Ze(r,{...n,attributeNames:{...n.attributeNames,class:"className","stroke-width":"strokeWidth","stroke-linecap":"strokeLinecap","stroke-linejoin":"strokeLinejoin","vector-effect":"vectorEffect"}})}/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qe=r=>{for(const n in r)if(n.startsWith("aria-")||n==="role"||n==="title")return!0;return!1},Fe=x.createContext({}),et=()=>x.useContext(Fe),tt=x.forwardRef(({color:r,size:n,width:y,height:u,strokeWidth:w,absoluteStrokeWidth:E,nonScalingStroke:C,className:z="",children:m,iconNode:b=[],icon:$={node:b,aliases:[],size:24},...S},A)=>{const{size:g=24,strokeWidth:p=2,absoluteStrokeWidth:v=!1,nonScalingStroke:M=!1,color:R="currentColor",className:k=""}=et()??{},N=!!m||Qe(S),[j,H,q=[]]=Je($,{color:r??R,width:y??n??g,height:u??n??g,strokeWidth:w??p,absoluteStrokeWidth:E??v,nonScalingStroke:C??M,className:U(k,z),hasA11yProp:N,attributes:S});return x.createElement(j,{ref:A,...H},[...q.map(([P,d])=>x.createElement(P,d)),...Array.isArray(m)?m:[m]])});/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function i(r,n=[],y=[]){const u=typeof r=="string"?Ge(r,n,y):r,w=x.forwardRef(({className:E,...C},z)=>x.createElement(tt,{ref:z,icon:u,className:E,...C}));return u.name&&(w.displayName=Xe(u.name)),w}/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const F={name:"arrow-up-down",size:24,node:[["path",{d:"m21 16-4 4-4-4",key:"f6ql7i"}],["path",{d:"M17 20V4",key:"1ejh1v"}],["path",{d:"m3 8 4-4 4 4",key:"11wl7u"}],["path",{d:"M7 4v16",key:"1glfcx"}]]};F.node;const st=i(F);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ee={name:"calculator",size:24,node:[["rect",{width:"16",height:"20",x:"4",y:"2",rx:"2",key:"1nb95v"}],["line",{x1:"8",x2:"16",y1:"6",y2:"6",key:"x4nwl0"}],["line",{x1:"16",x2:"16",y1:"14",y2:"18",key:"wjye3r"}],["path",{d:"M16 10h.01",key:"1m94wz"}],["path",{d:"M12 10h.01",key:"1nrarc"}],["path",{d:"M8 10h.01",key:"19clt8"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M8 14h.01",key:"6423bh"}],["path",{d:"M12 18h.01",key:"mhygvu"}],["path",{d:"M8 18h.01",key:"lrp35t"}]]};ee.node;const at=i(ee);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const te={name:"calendar-days",size:24,node:[["path",{d:"M8 2v3",key:"1ioesn"}],["path",{d:"M16 2v3",key:"otl347"}],["rect",{x:"3",y:"3",width:"18",height:"18",rx:"2",key:"h1oib"}],["path",{d:"M3 9h18",key:"1pudct"}],["path",{d:"M8 13h.01",key:"1sbv64"}],["path",{d:"M12 13h.01",key:"y0uutt"}],["path",{d:"M16 13h.01",key:"wip0gl"}],["path",{d:"M8 17h.01",key:"p3bg7i"}],["path",{d:"M12 17h.01",key:"p32p05"}],["path",{d:"M16 17h.01",key:"ql8jdd"}]]};te.node;const rt=i(te);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ne={name:"calendar-range",size:24,node:[["rect",{x:"3",y:"3",width:"18",height:"18",rx:"2",key:"h1oib"}],["path",{d:"M16 2v3",key:"otl347"}],["path",{d:"M3 9h18",key:"1pudct"}],["path",{d:"M8 2v3",key:"1ioesn"}],["path",{d:"M17 13h-6",key:"1qbiup"}],["path",{d:"M13 17H7",key:"1x38vv"}],["path",{d:"M7 13h.01",key:"1vezk1"}],["path",{d:"M17 17h.01",key:"1sd3ek"}]]};ne.node;const it=i(ne);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const oe={name:"chart-column",size:24,node:[["path",{d:"M3 3v16a2 2 0 0 0 2 2h16",key:"c24i48"}],["path",{d:"M18 17V9",key:"2bz60n"}],["path",{d:"M13 17V5",key:"1frdt8"}],["path",{d:"M8 17v-3",key:"17ska0"}]],aliases:["bar-chart-3"]};oe.node;const ct=i(oe);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const se={name:"check",size:24,node:[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]};se.node;const ut=i(se);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ae={name:"chevron-down",size:24,node:[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]]};ae.node;const dt=i(ae);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const re={name:"circle-check",size:24,node:[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m16 9-5.5 5.5L8 12",key:"xofnsj"}]],aliases:["check-circle-2"]};re.node;const ht=i(re);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ie={name:"circle-exclamation-point",size:24,node:[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]],aliases:["alert-circle","circle-alert"]};ie.node;const lt=i(ie);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ce={name:"clipboard-list",size:24,node:[["rect",{width:"8",height:"4",x:"8",y:"2",rx:"1",ry:"1",key:"tgr4d6"}],["path",{d:"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",key:"116196"}],["path",{d:"M12 11h4",key:"1jrz19"}],["path",{d:"M12 16h4",key:"n85exb"}],["path",{d:"M8 11h.01",key:"1dfujw"}],["path",{d:"M8 16h.01",key:"18s6g9"}]]};ce.node;const yt=i(ce);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ue={name:"cloud-upload",size:24,node:[["path",{d:"M12 13v8",key:"1l5pq0"}],["path",{d:"M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242",key:"1pljnt"}],["path",{d:"m8 17 4-4 4 4",key:"1quai1"}]],aliases:["upload-cloud"]};ue.node;const pt=i(ue);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const de={name:"code-xml",size:24,node:[["path",{d:"m18 16 4-4-4-4",key:"1inbqp"}],["path",{d:"m6 8-4 4 4 4",key:"15zrgr"}],["path",{d:"m14.5 4-5 16",key:"e7oirm"}]],aliases:["code-2"]};de.node;const ft=i(de);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const he={name:"coins",size:24,node:[["path",{d:"M13.744 17.736a6 6 0 1 1-7.48-7.48",key:"bq4yh3"}],["path",{d:"M15 6h1v4",key:"11y1tn"}],["path",{d:"m6.134 14.768.866-.5 2 3.464",key:"17snzx"}],["circle",{cx:"16",cy:"8",r:"6",key:"14bfc9"}]]};he.node;const kt=i(he);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const le={name:"copy",size:24,node:[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]]};le.node;const _t=i(le);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ye={name:"database",size:24,node:[["ellipse",{cx:"12",cy:"5",rx:"9",ry:"3",key:"msslwz"}],["path",{d:"M3 5V19A9 3 0 0 0 21 19V5",key:"1wlel7"}],["path",{d:"M3 12A9 3 0 0 0 21 12",key:"mv7ke4"}]]};ye.node;const mt=i(ye);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pe={name:"download",size:24,node:[["path",{d:"M12 15V3",key:"m9g1x1"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["path",{d:"m7 10 5 5 5-5",key:"brsn70"}]]};pe.node;const vt=i(pe);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fe={name:"droplets",size:24,node:[["path",{d:"M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z",key:"1ptgy4"}],["path",{d:"M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97",key:"1sl1rz"}]]};fe.node;const Mt=i(fe);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ke={name:"file-text",size:24,node:[["path",{d:"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",key:"1oefj6"}],["path",{d:"M14 2v5a1 1 0 0 0 1 1h5",key:"wfsgrz"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]]};ke.node;const wt=i(ke);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _e={name:"gauge",size:24,node:[["path",{d:"m12 14 4-4",key:"9kzdfg"}],["path",{d:"M3.34 19a10 10 0 1 1 17.32 0",key:"19p75a"}]]};_e.node;const gt=i(_e);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const me={name:"house",size:24,node:[["path",{d:"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",key:"5wwlr5"}],["path",{d:"M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",key:"r6nss1"}]],aliases:["home"]};me.node;const xt=i(me);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ve={name:"info",size:24,node:[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]]};ve.node;const Et=i(ve);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Me={name:"layers",size:24,node:[["path",{d:"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",key:"zw3jo"}],["path",{d:"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",key:"1wduqc"}],["path",{d:"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",key:"kqbvx6"}]],aliases:["layers-3"]};Me.node;const Ct=i(Me);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const we={name:"milk",size:24,node:[["path",{d:"M8 2h8",key:"1ssgc1"}],["path",{d:"M9 2v2.789a4 4 0 0 1-.672 2.219l-.656.984A4 4 0 0 0 7 10.212V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9.789a4 4 0 0 0-.672-2.219l-.656-.984A4 4 0 0 1 15 4.788V2",key:"qtp12x"}],["path",{d:"M7 15a6.472 6.472 0 0 1 5 0 6.47 6.47 0 0 0 5 0",key:"ygeh44"}]]};we.node;const zt=i(we);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ge={name:"moon",size:24,node:[["path",{d:"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401",key:"kfwtm"}]]};ge.node;const Rt=i(ge);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xe={name:"pen",size:24,node:[["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}]],aliases:["edit-2"]};xe.node;const Tt=i(xe);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ee={name:"percent",size:24,node:[["line",{x1:"19",x2:"5",y1:"5",y2:"19",key:"1x9vlm"}],["circle",{cx:"6.5",cy:"6.5",r:"2.5",key:"4mh3h7"}],["circle",{cx:"17.5",cy:"17.5",r:"2.5",key:"1mdrzq"}]]};Ee.node;const bt=i(Ee);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ce={name:"plus",size:24,node:[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]};Ce.node;const $t=i(Ce);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ze={name:"printer",size:24,node:[["path",{d:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",key:"143wyd"}],["path",{d:"M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6",key:"1itne7"}],["rect",{x:"6",y:"14",width:"12",height:"8",rx:"1",key:"1ue0tg"}]]};ze.node;const At=i(ze);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Re={name:"refresh-cw",size:24,node:[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]};Re.node;const Dt=i(Re);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Te={name:"rotate-ccw",size:24,node:[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]]};Te.node;const St=i(Te);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const be={name:"save",size:24,node:[["path",{d:"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",key:"1c8476"}],["path",{d:"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7",key:"1ydtos"}],["path",{d:"M7 3v4a1 1 0 0 0 1 1h7",key:"t51u73"}]]};be.node;const jt=i(be);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $e={name:"search",size:24,node:[["path",{d:"m21 21-4.34-4.34",key:"14j7rj"}],["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}]]};$e.node;const Ht=i($e);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ae={name:"settings-2",size:24,node:[["path",{d:"M14 17H5",key:"gfn3mx"}],["path",{d:"M19 7h-9",key:"6i9tg"}],["circle",{cx:"17",cy:"17",r:"3",key:"18b49y"}],["circle",{cx:"7",cy:"7",r:"3",key:"dfmy0x"}]]};Ae.node;const Pt=i(Ae);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const De={name:"sliders-vertical",size:24,node:[["path",{d:"M10 8h4",key:"1sr2af"}],["path",{d:"M12 21v-9",key:"17s77i"}],["path",{d:"M12 8V3",key:"13r4qs"}],["path",{d:"M17 16h4",key:"h1uq16"}],["path",{d:"M19 12V3",key:"o1uvq1"}],["path",{d:"M19 21v-5",key:"qua636"}],["path",{d:"M3 14h4",key:"bcjad9"}],["path",{d:"M5 10V3",key:"cb8scm"}],["path",{d:"M5 21v-7",key:"1w1uti"}]],aliases:["sliders"]};De.node;const Nt=i(De);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Se={name:"sun",size:24,node:[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]]};Se.node;const qt=i(Se);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const je={name:"table",size:24,node:[["path",{d:"M12 3v18",key:"108xh3"}],["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M3 9h18",key:"1pudct"}],["path",{d:"M3 15h18",key:"5xshup"}]]};je.node;const Lt=i(je);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const He={name:"trash",size:24,node:[["path",{d:"M10 11v6",key:"nco0om"}],["path",{d:"M14 11v6",key:"outv1u"}],["path",{d:"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",key:"miytrc"}],["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",key:"e791ji"}]],aliases:["trash-2"]};He.node;const Ot=i(He);/**
 * @license lucide-react v1.73.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pe={name:"x",size:24,node:[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]};Pe.node;const It=i(Pe);export{st as A,it as B,ht as C,Mt as D,Pt as E,wt as F,gt as G,xt as H,Et as I,yt as J,Ct as L,zt as M,At as P,ot as R,Nt as S,Ot as T,It as X,x as a,lt as b,nt as c,Dt as d,qt as e,Rt as f,Ye as g,jt as h,$t as i,ut as j,Tt as k,rt as l,dt as m,kt as n,bt as o,Ht as p,vt as q,Ue as r,ct as s,at as t,mt as u,ft as v,pt as w,_t as x,Lt as y,St as z};
