/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */var oe=globalThis,ne=oe.ShadowRoot&&(oe.ShadyCSS===void 0||oe.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,_e=Symbol(),qe=new WeakMap,I=class{constructor(e,t,a){if(this._$cssResult$=!0,a!==_e)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(ne&&e===void 0){let a=t!==void 0&&t.length===1;a&&(e=qe.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),a&&qe.set(t,e))}return e}toString(){return this.cssText}},Ye=r=>new I(typeof r=="string"?r:r+"",void 0,_e),ie=(r,...e)=>{let t=r.length===1?r[0]:e.reduce((a,o,n)=>a+(i=>{if(i._$cssResult$===!0)return i.cssText;if(typeof i=="number")return i;throw Error("Value passed to 'css' function must be a 'css' function result: "+i+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(o)+r[n+1],r[0]);return new I(t,r,_e)},Je=(r,e)=>{if(ne)r.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(let t of e){let a=document.createElement("style"),o=oe.litNonce;o!==void 0&&a.setAttribute("nonce",o),a.textContent=t.cssText,r.appendChild(a)}},me=ne?r=>r:r=>r instanceof CSSStyleSheet?(e=>{let t="";for(let a of e.cssRules)t+=a.cssText;return Ye(t)})(r):r;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */var{is:Ht,defineProperty:zt,getOwnPropertyDescriptor:It,getOwnPropertyNames:Wt,getOwnPropertySymbols:Ft,getPrototypeOf:Gt}=Object,se=globalThis,Xe=se.trustedTypes,jt=Xe?Xe.emptyScript:"",Kt=se.reactiveElementPolyfillSupport,W=(r,e)=>r,ve={toAttribute(r,e){switch(e){case Boolean:r=r?jt:null;break;case Object:case Array:r=r==null?r:JSON.stringify(r)}return r},fromAttribute(r,e){let t=r;switch(e){case Boolean:t=r!==null;break;case Number:t=r===null?null:Number(r);break;case Object:case Array:try{t=JSON.parse(r)}catch{t=null}}return t}},Ze=(r,e)=>!Ht(r,e),Qe={attribute:!0,type:String,converter:ve,reflect:!1,useDefault:!1,hasChanged:Ze};Symbol.metadata??=Symbol("metadata"),se.litPropertyMetadata??=new WeakMap;var E=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=Qe){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let a=Symbol(),o=this.getPropertyDescriptor(e,a,t);o!==void 0&&zt(this.prototype,e,o)}}static getPropertyDescriptor(e,t,a){let{get:o,set:n}=It(this.prototype,e)??{get(){return this[t]},set(i){this[t]=i}};return{get:o,set(i){let s=o?.call(this);n?.call(this,i),this.requestUpdate(e,s,a)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??Qe}static _$Ei(){if(this.hasOwnProperty(W("elementProperties")))return;let e=Gt(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(W("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(W("properties"))){let t=this.properties,a=[...Wt(t),...Ft(t)];for(let o of a)this.createProperty(o,t[o])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[a,o]of t)this.elementProperties.set(a,o)}this._$Eh=new Map;for(let[t,a]of this.elementProperties){let o=this._$Eu(t,a);o!==void 0&&this._$Eh.set(o,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let a=new Set(e.flat(1/0).reverse());for(let o of a)t.unshift(me(o))}else e!==void 0&&t.push(me(e));return t}static _$Eu(e,t){let a=t.attribute;return a===!1?void 0:typeof a=="string"?a:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let a of t.keys())this.hasOwnProperty(a)&&(e.set(a,this[a]),delete this[a]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Je(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,a){this._$AK(e,a)}_$ET(e,t){let a=this.constructor.elementProperties.get(e),o=this.constructor._$Eu(e,a);if(o!==void 0&&a.reflect===!0){let n=(a.converter?.toAttribute!==void 0?a.converter:ve).toAttribute(t,a.type);this._$Em=e,n==null?this.removeAttribute(o):this.setAttribute(o,n),this._$Em=null}}_$AK(e,t){let a=this.constructor,o=a._$Eh.get(e);if(o!==void 0&&this._$Em!==o){let n=a.getPropertyOptions(o),i=typeof n.converter=="function"?{fromAttribute:n.converter}:n.converter?.fromAttribute!==void 0?n.converter:ve;this._$Em=o;let s=i.fromAttribute(t,n.type);this[o]=s??this._$Ej?.get(o)??s,this._$Em=null}}requestUpdate(e,t,a,o=!1,n){if(e!==void 0){let i=this.constructor;if(o===!1&&(n=this[e]),a??=i.getPropertyOptions(e),!((a.hasChanged??Ze)(n,t)||a.useDefault&&a.reflect&&n===this._$Ej?.get(e)&&!this.hasAttribute(i._$Eu(e,a))))return;this.C(e,t,a)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:a,reflect:o,wrapped:n},i){a&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,i??t??this[e]),n!==!0||i!==void 0)||(this._$AL.has(e)||(this.hasUpdated||a||(t=void 0),this._$AL.set(e,t)),o===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[o,n]of this._$Ep)this[o]=n;this._$Ep=void 0}let a=this.constructor.elementProperties;if(a.size>0)for(let[o,n]of a){let{wrapped:i}=n,s=this[o];i!==!0||this._$AL.has(o)||s===void 0||this.C(o,void 0,n,s)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(a=>a.hostUpdate?.()),this.update(t)):this._$EM()}catch(a){throw e=!1,this._$EM(),a}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(e){}firstUpdated(e){}};E.elementStyles=[],E.shadowRootOptions={mode:"open"},E[W("elementProperties")]=new Map,E[W("finalized")]=new Map,Kt?.({ReactiveElement:E}),(se.reactiveElementVersions??=[]).push("2.1.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */var Ae=globalThis,et=r=>r,le=Ae.trustedTypes,tt=le?le.createPolicy("lit-html",{createHTML:r=>r}):void 0,st="$lit$",T=`lit$${Math.random().toFixed(9).slice(2)}$`,lt="?"+T,Vt=`<${lt}>`,O=document,G=()=>O.createComment(""),j=r=>r===null||typeof r!="object"&&typeof r!="function",Ce=Array.isArray,qt=r=>Ce(r)||typeof r?.[Symbol.iterator]=="function",we=`[ 	
\f\r]`,F=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,rt=/-->/g,at=/>/g,L=RegExp(`>|${we}(?:([^\\s"'>=/]+)(${we}*=${we}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),ot=/'/g,nt=/"/g,ct=/^(?:script|style|textarea|title)$/i,Te=r=>(e,...t)=>({_$litType$:r,strings:e,values:t}),p=Te(1),na=Te(2),ia=Te(3),D=Symbol.for("lit-noChange"),v=Symbol.for("lit-nothing"),it=new WeakMap,P=O.createTreeWalker(O,129);function dt(r,e){if(!Ce(r)||!r.hasOwnProperty("raw"))throw Error("invalid template strings array");return tt!==void 0?tt.createHTML(e):e}var Yt=(r,e)=>{let t=r.length-1,a=[],o,n=e===2?"<svg>":e===3?"<math>":"",i=F;for(let s=0;s<t;s++){let l=r[s],d,h,c=-1,w=0;for(;w<l.length&&(i.lastIndex=w,h=i.exec(l),h!==null);)w=i.lastIndex,i===F?h[1]==="!--"?i=rt:h[1]!==void 0?i=at:h[2]!==void 0?(ct.test(h[2])&&(o=RegExp("</"+h[2],"g")),i=L):h[3]!==void 0&&(i=L):i===L?h[0]===">"?(i=o??F,c=-1):h[1]===void 0?c=-2:(c=i.lastIndex-h[2].length,d=h[1],i=h[3]===void 0?L:h[3]==='"'?nt:ot):i===nt||i===ot?i=L:i===rt||i===at?i=F:(i=L,o=void 0);let m=i===L&&r[s+1].startsWith("/>")?" ":"";n+=i===F?l+Vt:c>=0?(a.push(d),l.slice(0,c)+st+l.slice(c)+T+m):l+T+(c===-2?s:m)}return[dt(r,n+(r[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),a]},K=class r{constructor({strings:e,_$litType$:t},a){let o;this.parts=[];let n=0,i=0,s=e.length-1,l=this.parts,[d,h]=Yt(e,t);if(this.el=r.createElement(d,a),P.currentNode=this.el.content,t===2||t===3){let c=this.el.content.firstChild;c.replaceWith(...c.childNodes)}for(;(o=P.nextNode())!==null&&l.length<s;){if(o.nodeType===1){if(o.hasAttributes())for(let c of o.getAttributeNames())if(c.endsWith(st)){let w=h[i++],m=o.getAttribute(c).split(T),C=/([.?@])?(.*)/.exec(w);l.push({type:1,index:n,name:C[2],strings:m,ctor:C[1]==="."?$e:C[1]==="?"?Se:C[1]==="@"?ke:U}),o.removeAttribute(c)}else c.startsWith(T)&&(l.push({type:6,index:n}),o.removeAttribute(c));if(ct.test(o.tagName)){let c=o.textContent.split(T),w=c.length-1;if(w>0){o.textContent=le?le.emptyScript:"";for(let m=0;m<w;m++)o.append(c[m],G()),P.nextNode(),l.push({type:2,index:++n});o.append(c[w],G())}}}else if(o.nodeType===8)if(o.data===lt)l.push({type:2,index:n});else{let c=-1;for(;(c=o.data.indexOf(T,c+1))!==-1;)l.push({type:7,index:n}),c+=T.length-1}n++}}static createElement(e,t){let a=O.createElement("template");return a.innerHTML=e,a}};function N(r,e,t=r,a){if(e===D)return e;let o=a!==void 0?t._$Co?.[a]:t._$Cl,n=j(e)?void 0:e._$litDirective$;return o?.constructor!==n&&(o?._$AO?.(!1),n===void 0?o=void 0:(o=new n(r),o._$AT(r,t,a)),a!==void 0?(t._$Co??=[])[a]=o:t._$Cl=o),o!==void 0&&(e=N(r,o._$AS(r,e.values),o,a)),e}var xe=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:a}=this._$AD,o=(e?.creationScope??O).importNode(t,!0);P.currentNode=o;let n=P.nextNode(),i=0,s=0,l=a[0];for(;l!==void 0;){if(i===l.index){let d;l.type===2?d=new V(n,n.nextSibling,this,e):l.type===1?d=new l.ctor(n,l.name,l.strings,this,e):l.type===6&&(d=new Ee(n,this,e)),this._$AV.push(d),l=a[++s]}i!==l?.index&&(n=P.nextNode(),i++)}return P.currentNode=O,o}p(e){let t=0;for(let a of this._$AV)a!==void 0&&(a.strings!==void 0?(a._$AI(e,a,t),t+=a.strings.length-2):a._$AI(e[t])),t++}},V=class r{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,a,o){this.type=2,this._$AH=v,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=a,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=N(this,e,t),j(e)?e===v||e==null||e===""?(this._$AH!==v&&this._$AR(),this._$AH=v):e!==this._$AH&&e!==D&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):qt(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==v&&j(this._$AH)?this._$AA.nextSibling.data=e:this.T(O.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:a}=e,o=typeof a=="number"?this._$AC(e):(a.el===void 0&&(a.el=K.createElement(dt(a.h,a.h[0]),this.options)),a);if(this._$AH?._$AD===o)this._$AH.p(t);else{let n=new xe(o,this),i=n.u(this.options);n.p(t),this.T(i),this._$AH=n}}_$AC(e){let t=it.get(e.strings);return t===void 0&&it.set(e.strings,t=new K(e)),t}k(e){Ce(this._$AH)||(this._$AH=[],this._$AR());let t=this._$AH,a,o=0;for(let n of e)o===t.length?t.push(a=new r(this.O(G()),this.O(G()),this,this.options)):a=t[o],a._$AI(n),o++;o<t.length&&(this._$AR(a&&a._$AB.nextSibling,o),t.length=o)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let a=et(e).nextSibling;et(e).remove(),e=a}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},U=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,a,o,n){this.type=1,this._$AH=v,this._$AN=void 0,this.element=e,this.name=t,this._$AM=o,this.options=n,a.length>2||a[0]!==""||a[1]!==""?(this._$AH=Array(a.length-1).fill(new String),this.strings=a):this._$AH=v}_$AI(e,t=this,a,o){let n=this.strings,i=!1;if(n===void 0)e=N(this,e,t,0),i=!j(e)||e!==this._$AH&&e!==D,i&&(this._$AH=e);else{let s=e,l,d;for(e=n[0],l=0;l<n.length-1;l++)d=N(this,s[a+l],t,l),d===D&&(d=this._$AH[l]),i||=!j(d)||d!==this._$AH[l],d===v?e=v:e!==v&&(e+=(d??"")+n[l+1]),this._$AH[l]=d}i&&!o&&this.j(e)}j(e){e===v?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},$e=class extends U{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===v?void 0:e}},Se=class extends U{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==v)}},ke=class extends U{constructor(e,t,a,o,n){super(e,t,a,o,n),this.type=5}_$AI(e,t=this){if((e=N(this,e,t,0)??v)===D)return;let a=this._$AH,o=e===v&&a!==v||e.capture!==a.capture||e.once!==a.once||e.passive!==a.passive,n=e!==v&&(a===v||o);o&&this.element.removeEventListener(this.name,this,a),n&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},Ee=class{constructor(e,t,a){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=a}get _$AU(){return this._$AM._$AU}_$AI(e){N(this,e)}};var Jt=Ae.litHtmlPolyfillSupport;Jt?.(K,V),(Ae.litHtmlVersions??=[]).push("3.3.3");var pt=(r,e,t)=>{let a=t?.renderBefore??e,o=a._$litPart$;if(o===void 0){let n=t?.renderBefore??null;a._$litPart$=o=new V(e.insertBefore(G(),n),n,void 0,t??{})}return o._$AI(r),o};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */var Le=globalThis,A=class extends E{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=pt(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return D}};A._$litElement$=!0,A.finalized=!0,Le.litElementHydrateSupport?.({LitElement:A});var Xt=Le.litElementPolyfillSupport;Xt?.({LitElement:A});(Le.litElementVersions??=[]).push("4.2.2");/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */var xt=new URL(".",import.meta.url),ue=25,Qt=6,Zt=19,H=320,ee=180,re=5,er=1400,tr="\xA3",rr=["grid","solar","house","ev","battery"],ar="1.1.0";function ut(r){return new URL(r,xt).href}function x(r){let t=(xt.pathname||"").endsWith("/dist/");return{default:ut(r),fallback:t?null:ut(`dist/${r}`)}}var or={full:{day:x("energy-bg-full-day.png"),night:x("energy-bg-full-night.png")},ev_solar:{day:x("energy-bg-ev-solar-day.png"),night:x("energy-bg-ev-solar-night.png")},ev_battery:{day:x("energy-bg-ev-battery-day.png"),night:x("energy-bg-ev-battery-night.png")},solar_battery:{day:x("energy-bg-no-ev-day.png"),night:x("energy-bg-no-ev-night.png")},ev_only:{day:x("energy-bg-no-solar-battery-day.png"),night:x("energy-bg-no-solar-battery-night.png")},solar_only:{day:x("energy-bg-solar-only-day.png"),night:x("energy-bg-solar-only-night.png")},battery_only:{day:x("energy-bg-battery-only-day.png"),night:x("energy-bg-battery-only-night.png")},base:{day:x("energy-bg-base-day.png"),night:x("energy-bg-base-night.png")}},nr={solar_battery:["solar_battery","no_ev"],ev_only:["ev_only","no_solar_battery"]};function f(r,e){return!r||!e||!r.states||!r.states[e]?"unknown":r.states[e].state??"unknown"}function R(r,e){return!r||!e||!r.states||!r.states[e]?{}:r.states[e].attributes||{}}function y(r){if(typeof r=="number")return Number.isFinite(r)?r:null;if(r==null)return null;let e=String(r).replace(/,/g,"").trim();if(!e||e==="unknown"||e==="unavailable")return null;let t=Number.parseFloat(e);return Number.isFinite(t)?t:null}function S(r,e){return y(f(r,e))}function $t(r,e){return String(R(r,e).unit_of_measurement||"").toLowerCase()}function ce(r,e){let t=y(r);return t===null?null:`${Math.max(e,Math.round(t))}px`}function ir(r){let e=ce(r.min_width,H)||`${H}px`,t=ce(r.min_height,ee)||`${ee}px`;return{width:ce(r.card_width,y(e)??H),height:ce(r.card_height,y(t)??ee),minWidth:e,minHeight:t}}function ht(r){let e=y(r);if(e===null)return"-";let t=Math.abs(e);return t>=1e3?`${(Math.round(t/1e3*10)/10).toFixed(1)} kW`:`${Math.round(t)} W`}function $(r){let e=y(r);return e===null?"-":`${e.toFixed(1)} kWh`}function sr(r){let e=y(r);if(e===null||e<0)return"-";let t=Math.round(e*60),a=Math.floor(t/60),o=t%60;return`${a}h ${String(o).padStart(2,"0")}m`}function St(r){let e=y(r);return e===null?"-":`${Math.max(0,Math.min(100,Math.round(e)))}%`}function lr(r){let e=St(r);return e==="-"?null:e}function cr(r){let e=y(r);return e===null?null:`${Math.round(e*10)/10} kWh`}function De(r,e){let t=y(r);return t===null?"-":`${t<0?"-":""}${e}${Math.abs(t).toFixed(2)}`}function Be(r,e){let t=y(r);return t===null?"-":`${e}${t.toFixed(t<1?3:2).replace(/0$/,"")}/kWh`}function dr(r,e="\xB0C"){let t=y(r);return t===null?"-":`${Math.round(t*10)/10}${e||"\xB0C"}`}function pr(r){if(!r)return"-";let e=new Date(r);return Number.isNaN(e.getTime())?"-":new Intl.DateTimeFormat(void 0,{hour:"2-digit",minute:"2-digit"}).format(e)}function ur(r,e){let t=y(r),a=y(e);return t===null||a===null||a<=0?null:Math.max(0,Math.min(100,Math.round(t/a*100)))}function hr(r){let e=String(r??"");return e.charAt(0).toUpperCase()+e.slice(1)}function he(r){return String(r??"").replace(/\b[a-z]/g,e=>e.toUpperCase())}function gt(r,e=" \xB7 "){return r.filter(t=>t&&t!=="-").join(e)}function gr(r,e){let t=String(r??"").trim().toLowerCase();return!t||t==="unknown"||t==="unavailable"?e:["on","true","charging"].includes(t)?"charging":["off","false","not_charging","not charging"].includes(t)?"not charging":t.replace(/_/g," ")}function ae(r,e){let t=f(r,e);if(t==="unknown"||t==="unavailable")return"-";let a=R(r,e).unit_of_measurement;return a==="%"?`${t}%`:a?`${t} ${a}`:String(t)}function kt(r){return String(r||"").split(".")[0]}function He(r,e,t){return R(r,e).friendly_name||t||ze(String(e||"").split(".").pop())}var yt={pv_voltage:"PV voltage",pv_current:"PV current",voltage:"Voltage",current:"Current",energy_24h:"Energy last 24h",energy_today:"Generated today",energy_week:"Generated this week",energy_month:"Generated this month",import_24h:"Imported last 24h",export_24h:"Exported last 24h",charge_24h:"Charged last 24h",discharge_24h:"Discharged last 24h",soc:"State of charge",state:"State"},yr={grid:"Grid",gridCard:"Electricity",solar:"Solar",house:"Home",ev:"EV",evCard:"Electric Vehicle",battery:"Battery"},_={grid:"mdi:transmission-tower",cost:"mdi:cash",tariff:"mdi:cash-clock",selfPowered:"mdi:home-lightning-bolt",solar:"mdi:solar-power-variant",solarToday:"mdi:white-balance-sunny",house:"mdi:home",houseToday:"mdi:home-lightning-bolt-outline",ev:"mdi:car-electric",evToday:"mdi:ev-station",battery:"mdi:home-battery",batteryReserve:"mdi:battery-clock",batteryCharge:"mdi:battery-arrow-up",batteryDischarge:"mdi:battery-arrow-down",sun:"mdi:weather-sunset",weather:"mdi:weather-partly-cloudy",entity:"mdi:information-outline"},u={grid:"#58bfff",export:"#5ef2a1",cost:"#8ee6a5",selfPowered:"#7ee8ff",solar:"#ffd15a",house:"#ffffff",ev:"#50eaff",battery:"#56f0d0",discharge:"#ffb86b",sun:"#ffb86b",weather:"#a7d8ff",entity:"#d9f2ff"},bt={import:u.grid,export:u.export,producing:u.solar,consuming:u.house,charging:u.battery,discharging:u.discharge,idle:"rgba(255, 255, 255, .42)"};function ze(r){return yt[r]?yt[r]:String(r).replace(/_/g," ").replace(/\b\w/g,e=>e.toUpperCase())}function br(r={}){return{...yr,...r.labels||{}}}function q(r,e,t){let a=r.node_info?.[t];if(!a)return null;if(typeof a=="string")return ae(e,a);if(typeof a=="object"&&a.entity){let o=ae(e,a.entity);return!o||o==="-"?null:a.label?`${a.label} ${o}`:o}return null}function fr(r,e,t){let a=y(r.solar_capacity_kw);if(a!==null)return a*1e3;let o=S(e,t.solar_capacity);if(o===null)return null;let n=$t(e,t.solar_capacity);return n==="w"||n==="watts"?o:n==="kw"||n==="kilowatts"||o<=100?o*1e3:o}function _r(r,e,t){let a=y(r.battery_capacity_kwh);if(a!==null)return a;let o=S(e,t.battery_capacity);return o===null?null:$t(e,t.battery_capacity)==="wh"?o/1e3:o}function mr(r,e){return!e||e<=0?null:`${Math.max(0,Math.round((y(r)??0)/e*100))}%`}function ft(r,e,t){let a=r.tariffs||{};return S(e,a[`${t}_rate_entity`])??y(a[`${t}_rate`])}function Et(r){return r.tariffs?.currency||tr}function vr(r,e,t){let a=t>=0,o=Et(r),n=ft(r,e,"import"),i=ft(r,e,"export"),s=a?n:i,l=s===null?null:Math.abs(t)/1e3*s*(a?1:-1);return{watts:t,rate:s,importRate:n,exportRate:i,currency:o,status:a?"import cost":"export credit",displayStatus:a?"Import cost":"Export credit",valueLabel:l===null?"-":`${De(l,o)}/h`}}var At=[{value:"cost_today",label:"Cost today"},{value:"cost_now",label:"Grid cost now"},{value:"tariff_now",label:"Tariff now"},{value:"self_powered_today",label:"Self powered today"},{value:"grid_import_export",label:"Grid import / export today"},{value:"home_today",label:"Home used today"},{value:"solar_today",label:"Solar generated today",system:"solar"},{value:"ev_today",label:"EV charged today",system:"ev"},{value:"battery_reserve",label:"Battery reserve",system:"battery"},{value:"battery_charge",label:"Battery charged today",system:"battery"},{value:"battery_discharge",label:"Battery discharged today",system:"battery"},{value:"sun",label:"Sunrise / sunset"},{value:"weather",label:"Weather"},{value:"entity",label:"Custom entity"}],wr={cost:"cost_now",current_cost:"cost_now",budget:"cost_today",self_powered:"self_powered_today",grid_energy:"grid_import_export"},ge=Object.fromEntries(At.filter(r=>r.system).map(r=>[r.value,r.system]));ge.solar="solar";ge.ev="ev";ge.battery="battery";function Ct(r,e,t,a){return(r.energy_today||{})[e]||r.detail_entities?.[t]?.[a]}function te(r,e,t,a,o){return S(e,Ct(r,t,a,o))}function Y(r,e,t,{entityKey:a,fallbackGroup:o,fallbackKey:n,label:i,status:s,icon:l,color:d,detailKind:h}){let c=Ct(e,a,o,n);return{kind:r,label:i,status:s,value:$(f(t,c)),icon:l,color:d,detailKind:h,entityId:c,available:!!c}}function xr(r,e){let t=r.costs||{},a=t.today_entity,o=Et(r),n=S(e,a),i=y(t.daily_budget);return{kind:"cost_today",label:"Cost today",status:i?`of ${De(i,o)} budget`:"Today",value:De(n,o),progress:ur(n,i),icon:_.cost,color:u.cost,detailKind:"grid",entityId:a,available:!!a}}function $r(r){return{kind:"cost",label:"Grid cost",status:r.cost.displayStatus,value:r.cost.valueLabel,icon:_.cost,color:r.cost.watts>=0?u.cost:u.export,detailKind:"grid",available:r.cost.importRate!==null||r.cost.exportRate!==null}}function Sr(r){let{importRate:e,exportRate:t,currency:a}=r.cost;return{kind:"tariff_now",label:"Tariff",status:t!==null?`Export ${Be(t,a)}`:"Import rate",value:e===null?"-":Be(e,a),icon:_.tariff,color:u.cost,detailKind:"grid",available:e!==null}}function kr(r,e){let t=te(r,e,"home","house","energy_24h"),a=te(r,e,"grid_import","grid","import_24h");a===null&&(a=Math.max(0,te(r,e,"grid","grid","import_24h")??0));let o=t&&t>0?Math.max(0,Math.min(100,Math.round((t-a)/t*100))):null;return{kind:"self_powered_today",label:"Self powered",status:"Today",value:o===null?"-":`${o}%`,progress:o,icon:_.selfPowered,color:u.selfPowered,detailKind:"house",available:o!==null}}function Er(r,e){let t=te(r,e,"grid_import","grid","import_24h"),a=te(r,e,"grid_export","grid","export_24h"),o=(t??0)+(a??0);return{kind:"grid_import_export",label:"Grid today",status:"Import / export",value:`${$(t).replace(" kWh","")} / ${$(a)}`,progress:t!==null&&a!==null&&o>0?Math.round(a/o*100):null,icon:_.grid,color:u.grid,detailKind:"grid",available:t!==null||a!==null}}function Ar(r){let e=y(r.battery.capacityLabel),t=y(r.battery.socLabel),a=Math.max(0,(y(r.house.watts)??0)/1e3),o=e!==null&&t!==null?e*(t/100):null,n=o!==null&&a>.025?o/a:null;return{kind:"battery_reserve",label:"Battery reserve",status:"At current load",value:sr(n),progress:t,icon:_.batteryReserve,color:u.battery,detailKind:"battery",available:o!==null}}function Cr(r,e){let t=r.entities?.weather,a=r.entities?.outdoor_temperature,o=R(e,t),n=a?f(e,a):o.temperature,i=a?R(e,a).unit_of_measurement:o.temperature_unit;return{kind:"weather",label:"Weather",status:Tr(f(e,t)),value:dr(n,i),icon:_.weather,color:u.weather,entityId:t||a,available:!!(t||a)}}function Tr(r){let e=String(r||"unknown").toLowerCase();return{"clear-night":"Clear night",cloudy:"Cloudy",fog:"Fog",hail:"Hail",lightning:"Lightning","lightning-rainy":"Lightning and rain",partlycloudy:"Partly cloudy",pouring:"Pouring",rainy:"Rainy",snowy:"Snowy","snowy-rainy":"Sleet",sunny:"Sunny",windy:"Windy","windy-variant":"Windy",unknown:""}[e]??he(e.replace(/[-_]/g," "))}function Tt(r,e){let t=r.entities?.sun||"sun.sun",a=String(f(e,t)).toLowerCase(),o=R(e,t),n=a==="above_horizon";return{kind:"sun",label:n?"Sunset":"Sunrise",status:n?"Today":"Tomorrow",value:pr(n?o.next_setting:o.next_rising),icon:_.sun,color:u.sun,entityId:t,available:a==="above_horizon"||a==="below_horizon"}}function J(r,e,t,a){return{kind:r,label:e.cardLabel||e.label,status:e.displayStatus,value:e.pillValue||e.powerLabel,icon:t,color:a,available:!0}}function Lt(r,e,t,a){let o=wr[r]||r,n=ge[o];if(n&&!e.visible[n])return null;switch(o){case"cost_today":return xr(t,a);case"cost_now":return $r(e);case"tariff_now":return Sr(e);case"self_powered_today":return kr(t,a);case"grid_import_export":return Er(t,a);case"home_today":return Y("home_today",t,a,{entityKey:"home",fallbackGroup:"house",fallbackKey:"energy_24h",label:"Home today",status:"Used",icon:_.houseToday,color:u.house,detailKind:"house"});case"solar_today":return Y("solar_today",t,a,{entityKey:"solar",fallbackGroup:"solar",fallbackKey:"energy_24h",label:"Solar today",status:"Generated",icon:_.solarToday,color:u.solar,detailKind:"solar"});case"ev_today":return Y("ev_today",t,a,{entityKey:"ev",fallbackGroup:"ev",fallbackKey:"energy_24h",label:"EV today",status:"Charged",icon:_.evToday,color:u.ev,detailKind:"ev"});case"battery_reserve":return Ar(e);case"battery_charge":return Y("battery_charge",t,a,{entityKey:"battery_charge",fallbackGroup:"battery",fallbackKey:"charge_24h",label:"Battery charged",status:"Today",icon:_.batteryCharge,color:u.battery,detailKind:"battery"});case"battery_discharge":return Y("battery_discharge",t,a,{entityKey:"battery_discharge",fallbackGroup:"battery",fallbackKey:"discharge_24h",label:"Battery discharged",status:"Today",icon:_.batteryDischarge,color:u.discharge,detailKind:"battery"});case"sun":return Tt(t,a);case"weather":return Cr(t,a);case"grid":return{...J("grid",e.grid,_.grid,u.grid),value:e.grid.powerLabel};case"solar":return J("solar",e.solar,_.solar,u.solar);case"house":return{...J("house",e.house,_.house,u.house),value:e.house.powerLabel};case"ev":return J("ev",e.ev,_.ev,u.ev);case"battery":return J("battery",e.battery,_.battery,u.battery);default:return null}}function Lr(r,e,t,a){let o=typeof r=="string"?r:r?.type;if(!o||o==="none")return null;if(o==="entity")return typeof r!="object"||!r.entity?null:{kind:"entity",label:r.label||He(t,r.entity),status:r.status||"",value:ae(t,r.entity),icon:r.icon||_.entity,color:r.color||u.entity,entityId:r.entity};let n=Lt(o,a,e,t);return n?typeof r!="object"?n:{...n,label:r.label||n.label,status:r.status||n.status,icon:r.icon||n.icon,color:r.color||n.color,detailKind:r.detail_kind||n.detailKind}:null}function Ie(r){return Array.isArray(r.bottom_bar)?r.bottom_bar:null}var Pr=["cost_today","self_powered_today","grid_import_export","battery_reserve","solar_today","cost_now","ev_today","home_today","sun"];function Or(r,e,t){let a=Ie(r);if(a?.length)return a.map(n=>Lr(n,r,e,t)).filter(Boolean).slice(0,re);let o=Pr.map(n=>Lt(n,t,r,e)).filter(n=>n?.available);if(o.length<3&&!o.some(n=>n.kind==="sun")){let n=Tt(r,e);n.available&&o.push(n)}return o.slice(0,re)}var Dr=new Set(["button","input_button","lock","switch"]);function b(r,e,t){return!e||e==="-"?null:{label:r,value:e,entityId:t}}function Pt(r){if(!r||typeof r!="object"||!r.service)return null;let[e,t]=String(r.service).split(".");return!e||!t?null:{label:r.label||he(t.replace(/_/g," ")),icon:r.icon||"mdi:gesture-tap-button",service:r.service,domain:e,serviceName:t,target:r.target||{},data:r.data||r.service_data||{},entityId:r.entity||r.entity_id||r.target?.entity_id,stateLabel:r.state_label,tone:r.tone||"neutral"}}function _t(r,e){return typeof e=="string"?{key:r,entity:e,auto:!0}:!e||typeof e!="object"?null:{...e,key:e.key||r,entity:e.entity||e.entity_id}}function ye(r,e){let t=r.detail_entities?.[e]||{};return Array.isArray(t)?t.map((a,o)=>typeof a=="string"?{key:a.split(".").pop(),entity:a,auto:!0,listed:!0}:_t(a?.key||a?.name||a?.label||`item_${o+1}`,a)).filter(Boolean):Object.entries(t).map(([a,o])=>_t(a,o)).filter(Boolean)}function Ot(r){return r?.service?!0:Dr.has(kt(r?.entity))&&r?.display!=="row"}function Br(r,e){if(r?.service)return Pt(r);let t=r?.entity,a=kt(t),o=String(f(e,t)).toLowerCase(),n={entity_id:t},i=r?.label||He(e,t,ze(r?.key));if(a==="lock"){let s=o==="locked";return{label:r?.label||(s?"Unlock":"Lock"),icon:r?.icon||(s?"mdi:lock":"mdi:lock-open-variant"),service:s?"lock.unlock":"lock.lock",domain:"lock",serviceName:s?"unlock":"lock",target:n,data:{},entityId:t,stateLabel:he(o||"unknown"),tone:s?"secure":"alert"}}return a==="switch"?{label:i,icon:r?.icon||(o==="on"?"mdi:toggle-switch":"mdi:toggle-switch-off-outline"),service:"switch.toggle",domain:"switch",serviceName:"toggle",target:n,data:{},entityId:t,stateLabel:he(o||"unknown"),tone:o==="on"?"on":"off"}:a==="button"||a==="input_button"?{label:i,icon:r?.icon||"mdi:gesture-tap-button",service:`${a}.press`,domain:a,serviceName:"press",target:n,data:{},entityId:t,stateLabel:r?.state_label,tone:"neutral"}:null}function Mr(r,e){let t=r.actions||{};return Object.fromEntries(rr.map(a=>[a,[...ye(r,a).filter(Ot).map(o=>Br(o,e)).filter(Boolean),...(Array.isArray(t[a])?t[a]:[]).map(Pt).filter(Boolean)]]))}function Rr(r,e){if(!String(e?.key||e?.label||"").toLowerCase().includes("odometer"))return ae(r,e.entity);let a=S(r,e.entity);if(a===null)return ae(r,e.entity);let o=R(r,e.entity).unit_of_measurement;return o?`${Math.round(a)} ${o}`:String(Math.round(a))}function X(r,e,t){return ye(r,t).filter(a=>!Ot(a)).map(a=>{let o=a.label||(a.listed?He(e,a.entity):ze(a.key));return b(o,Rr(e,a),a.entity)}).filter(Boolean)}function Nr(r,e,t){let a=r.energy_today||{};return{grid:[b("Grid power",t.grid.powerLabel,t.entities.grid_power),b("Status",t.grid.displayStatus),b("Current cost",t.cost.valueLabel),b(t.cost.rate===null?null:`${t.cost.displayStatus} rate`,t.cost.rate===null?null:Be(t.cost.rate,t.cost.currency)),b("Energy today",t.energyToday.grid,a.grid),b("Imported today",t.energyToday.gridImport,a.grid_import),b("Exported today",t.energyToday.gridExport,a.grid_export),...X(r,e,"grid")].filter(Boolean),solar:[b("Solar power",t.solar.powerLabel,t.entities.solar_power),b("Efficiency",t.solar.efficiencyLabel),b("Generated today",t.energyToday.solar,a.solar),...X(r,e,"solar")].filter(Boolean),house:[b("Home usage",t.house.powerLabel,t.entities.house_power),b("Used today",t.energyToday.home,a.home),...X(r,e,"house")].filter(Boolean),ev:[b("Charge power",t.ev.powerLabel,t.entities.ev_power),b("State of charge",t.ev.socLabel,t.entities.ev_soc),b("Charging state",t.ev.displayStatus,t.entities.ev_charging_state),b("Charged today",t.energyToday.ev,a.ev),...X(r,e,"ev")].filter(Boolean),battery:[b("Battery power",t.battery.powerLabel,t.entities.battery_power),b("State of charge",t.battery.socLabel,t.entities.battery_soc),b("Capacity",t.battery.capacityLabel,t.entities.battery_capacity),b("Charged today",t.energyToday.batteryCharge,a.battery_charge),b("Discharged today",t.energyToday.batteryDischarge,a.battery_discharge),...X(r,e,"battery")].filter(Boolean)}}function de(r,e,t=!1){if(r==null)return t;if(typeof r=="boolean")return r;if(typeof r=="number")return r!==0;let a=String(r).trim();if(!a)return t;if(a.includes(".")){let o=f(e,a);return["on","true","home","charging","plugged_in","connected","open"].includes(String(o).toLowerCase())}return["on","true","yes","1","enabled","show"].includes(a.toLowerCase())}function Ur(r={},e,t=new Date){let a=r.time_of_day;if(a){if(typeof a=="string"&&a.includes(".")){let s=String(f(e,a)).toLowerCase();if(["above_horizon","day","sunny","on","true"].includes(s))return"day";if(["below_horizon","night","off","false"].includes(s))return"night"}let i=String(a).toLowerCase();if(i==="day"||i==="night")return i}let o=String(f(e,r.entities?.sun||"sun.sun")).toLowerCase();if(o==="above_horizon")return"day";if(o==="below_horizon")return"night";let n=t.getHours();return n>=Qt&&n<Zt?"day":"night"}function Hr(r){let{ev:e,solar:t,battery:a}=r;return e&&t&&a?"full":e&&t?"ev_solar":e&&a?"ev_battery":t&&a?"solar_battery":e?"ev_only":t?"solar_only":a?"battery_only":"base"}function mt(r,e){if(!r)return null;if(typeof r=="string")return{url:r,fallback:null};let t=r[e];return t&&typeof t=="object"?{url:t.default||null,fallback:t.fallback||null}:{url:t||r.default||null,fallback:r.fallback||null}}function Dt(r={},e={},t="night"){let a=Hr(e),o=nr[a]||[a];if(r.backgrounds)for(let n of o){let i=mt(r.backgrounds[n],t);if(i?.url)return i}return a==="solar_battery"&&r.background_no_ev?{url:r.background_no_ev,fallback:null}:a==="full"&&r.background_full?{url:r.background_full,fallback:null}:mt(or[a],t)}function va(r={},e={},t="night"){return Dt(r,e,t).url}function Pe(r,e,t,a="idle"){let o=y(r)??0;return o>ue?e:o<-ue?t:a}function Q({label:r,cardLabel:e,watts:t,status:a,tone:o,extras:n=[],nodeExtra:i,configured:s=!0,...l}){let d=hr(a),h=o!=="idle";return{label:r,cardLabel:e||r,watts:t,powerLabel:s?ht(t):"-",status:a,displayStatus:d,statusLabel:gt([d,...n]),pillValue:gt([ht(t),...n]),tone:o,toneColor:bt[o]||bt.idle,active:h,nodeExtra:i,...l}}function zr(r={},e){let t=r.entities||{},a=r.energy_today||{},o={ev:de(r.show_ev,e,!1),solar:de(r.show_solar,e,!0),battery:de(r.show_battery,e,!0)},n=S(e,t.grid_power)??0,i=S(e,t.solar_power)??0,s=S(e,t.house_power)??0,l=S(e,t.ev_power)??0,d=S(e,t.battery_power)??0,h=_r(r,e,t),c=mr(i,fr(r,e,t)),w=Ur(r,e,r.now?new Date(r.now):new Date),m=br(r),C=Pe(n,"importing","exporting"),be=i>ue?"producing":"idle",fe=gr(f(e,t.ev_charging_state),Pe(l,"charging","discharging","plugged in")),Ut=fe==="charging"?"charging":fe==="discharging"?"discharging":"idle",Ge=Pe(d,"charging","discharging"),je=lr(f(e,t.ev_soc)),Ke=St(f(e,t.battery_soc)),Ve=Dt(r,o,w),z={mode:w,entities:t,visible:o,labels:m,setupComplete:!!(t.grid_power&&t.house_power),background:Ve.url,backgroundFallback:Ve.fallback,showStatusBar:de(r.show_bottom_bar,e,!0),size:ir(r),cost:vr(r,e,n),actions:Mr(r,e),grid:Q({label:m.grid,cardLabel:m.gridCard,watts:n,configured:!!t.grid_power,status:C,tone:C==="importing"?"import":C==="exporting"?"export":"idle",nodeExtra:q(r,e,"grid")}),solar:Q({label:m.solar,watts:i,configured:!!t.solar_power,status:be,tone:be==="producing"?"producing":"idle",extras:[be==="producing"?c:null],nodeExtra:q(r,e,"solar"),efficiencyLabel:c}),house:Q({label:m.house,watts:s,configured:!!t.house_power,status:"consuming",tone:s>ue?"consuming":"idle",nodeExtra:q(r,e,"house")}),ev:Q({label:m.ev,cardLabel:m.evCard,watts:l,configured:!!t.ev_power,status:fe,tone:Ut,extras:[je],nodeExtra:q(r,e,"ev"),socLabel:je||"-"}),battery:Q({label:m.battery,watts:d,configured:!!t.battery_power,status:Ge,tone:Ge,extras:[Ke],nodeExtra:q(r,e,"battery"),socLabel:Ke,capacityLabel:cr(h)}),energyToday:{grid:$(f(e,a.grid)),gridImport:$(f(e,a.grid_import)),gridExport:$(f(e,a.grid_export)),solar:$(f(e,a.solar)),home:$(f(e,a.home)),ev:$(f(e,a.ev)),batteryCharge:$(f(e,a.battery_charge)),batteryDischarge:$(f(e,a.battery_discharge))}};return z.details=Nr(r,e,z),z.bottomCards=Or(r,e,z),z}function Me(r,e,t,a={}){r.dispatchEvent(new CustomEvent(e,{bubbles:a.bubbles??!0,cancelable:a.cancelable??!1,composed:a.composed??!0,detail:t}))}var Re=class extends A{static properties={hass:{attribute:!1},_config:{state:!0},_activeDetail:{state:!0},_outgoingScene:{state:!0}};static styles=ie`
    :host {
      display: block;
      width: min(100%, var(--energy-card-width, 100%));
      min-width: min(100%, var(--energy-card-min-width, 320px));
      max-width: 100%;
      color: var(--energy-card-text, #f7fbff);
      --energy-card-accent: #58d5ff;
      --energy-card-radius: 8px;
      --energy-card-aspect-ratio: 1672 / 941;
      --energy-card-padding: clamp(12px, 3cqw, 34px);
      --energy-card-glass: rgba(4, 12, 18, .52);
      --energy-card-glass-strong: rgba(5, 14, 20, .68);
      --energy-card-border: rgba(220, 242, 255, .2);
      --energy-card-muted: rgba(232, 245, 255, .72);
      --energy-card-shadow: 0 24px 70px rgba(0, 0, 0, .46);
      --energy-card-ease: cubic-bezier(.2, .7, .2, 1);
      font-family: var(--energy-card-font-family, var(--paper-font-body1_-_font-family, Inter, Roboto, sans-serif));
    }

    ha-card {
      display: block;
      position: relative;
      overflow: hidden;
      width: 100%;
      height: var(--energy-card-height, auto);
      min-height: var(--energy-card-min-height, 180px);
      aspect-ratio: var(--energy-card-aspect-ratio);
      container-type: inline-size;
      border-radius: var(--energy-card-radius);
      border: 1px solid var(--energy-card-border);
      background: #071015;
      box-shadow: var(--energy-card-shadow);
    }

    button {
      appearance: none;
      font: inherit;
      color: inherit;
      text-align: left;
    }

    button:focus-visible {
      outline: 2px solid var(--energy-card-accent);
      outline-offset: 2px;
    }

    /* Scene layers. Two can exist briefly while a day/night or setup change crossfades. */
    .scene {
      position: absolute;
      inset: 0;
      background-image: var(--energy-background), var(--energy-background-fallback, none);
      background-position: center;
      background-size: 100% 100%;
      filter: saturate(1.08) contrast(1.06);
    }

    .scene::after {
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(90deg, rgba(0, 0, 0, .58), rgba(0, 0, 0, .18) 48%, rgba(0, 0, 0, .42)),
        linear-gradient(180deg, rgba(0, 0, 0, .28), rgba(0, 0, 0, .06) 42%, rgba(0, 0, 0, .68)),
        linear-gradient(100deg, rgba(23, 185, 255, .08), transparent 34%),
        radial-gradient(circle at 78% 18%, rgba(255, 209, 90, .16), transparent 28%);
    }

    .scene.mode-day {
      filter: saturate(1.02) contrast(1.02);
    }

    .scene.mode-day::after {
      background:
        linear-gradient(90deg, rgba(0, 0, 0, .30), rgba(0, 0, 0, .06) 48%, rgba(0, 0, 0, .24)),
        linear-gradient(180deg, rgba(0, 0, 0, .12), rgba(0, 0, 0, .02) 42%, rgba(0, 0, 0, .42)),
        linear-gradient(100deg, rgba(45, 156, 255, .05), transparent 34%),
        radial-gradient(circle at 76% 14%, rgba(255, 222, 145, .10), transparent 24%);
    }

    .scene.scene-incoming {
      animation: sceneFade 1.4s var(--energy-card-ease) both;
    }

    .content {
      position: absolute;
      inset: 0;
      z-index: 2;
      padding: var(--energy-card-padding);
      box-sizing: border-box;
    }

    .mid {
      position: absolute;
      inset: 0;
    }

    /* Floating nodes */
    .node {
      position: absolute;
      z-index: 2;
      display: grid;
      gap: 2px;
      min-width: 92px;
      padding: 7px 10px 8px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, .18);
      background: var(--energy-card-glass);
      backdrop-filter: blur(10px);
      box-shadow: 0 10px 24px rgba(0, 0, 0, .28);
      cursor: pointer;
      --node-tone: rgba(255, 255, 255, .42);
      transition: transform .18s var(--energy-card-ease), border-color .18s ease, background .18s ease;
    }

    .node[data-active="true"] {
      border-color: color-mix(in srgb, var(--node-tone), rgba(255, 255, 255, .18) 55%);
      animation: nodeBreath 3.6s ease-in-out infinite;
    }

    .node:hover,
    .pill:hover {
      transform: translateY(-1px);
      border-color: rgba(255, 255, 255, .4);
      background: rgba(7, 22, 32, .74);
    }

    .node-label,
    .pill-label {
      color: var(--energy-card-muted);
      font-size: 10px;
      letter-spacing: .06em;
      text-transform: uppercase;
    }

    .pill-label {
      letter-spacing: .04em;
    }

    .node-value {
      font-size: clamp(16px, 2.1cqw, 24px);
      line-height: 1;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      text-shadow: 0 0 18px rgba(86, 213, 255, .24);
      white-space: nowrap;
    }

    .node-state,
    .node-extra {
      color: var(--energy-card-muted);
      font-size: 11px;
      line-height: 1.25;
      white-space: nowrap;
    }

    .node-state {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 2px;
    }

    .node-state::before {
      content: "";
      flex: none;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--node-tone);
      box-shadow: 0 0 8px var(--node-tone);
    }

    .node-solar { top: 31%; left: 52%; color: #fff2bc; }
    .node-grid { top: 42%; left: 2%; color: #d9f2ff; }
    .node-house { top: 47%; left: 42%; color: #ffffff; }
    .node-ev { right: 3%; bottom: 26%; color: #d9fbff; }
    .node-battery { top: 58%; left: 65%; color: #dbfff6; }

    /* First run hint */
    .setup-hint {
      position: absolute;
      left: 50%;
      top: 44%;
      z-index: 4;
      width: min(380px, 80%);
      padding: 16px 18px;
      transform: translate(-50%, -50%);
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, .22);
      background: var(--energy-card-glass-strong);
      backdrop-filter: blur(16px);
      box-shadow: 0 18px 50px rgba(0, 0, 0, .4);
      animation: hintRise .3s var(--energy-card-ease) both;
    }

    .setup-hint-title {
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
    }

    .setup-hint-body {
      margin-top: 4px;
      color: var(--energy-card-muted);
      font-size: 13px;
      line-height: 1.4;
    }

    /* Bottom glance bar */
    .statusbar {
      position: absolute;
      left: var(--energy-card-padding);
      right: var(--energy-card-padding);
      bottom: var(--energy-card-padding);
      z-index: 3;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(140px, 100%), 1fr));
      gap: clamp(8px, 1.6cqw, 16px);
    }

    .pill {
      min-width: 0;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 10px;
      align-items: center;
      padding: 10px 12px 10px 11px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, .17);
      background: var(--energy-card-glass-strong);
      backdrop-filter: blur(16px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, .28);
      cursor: pointer;
      transition: transform .18s var(--energy-card-ease), border-color .18s ease, background .18s ease;
    }

    .pill ha-icon {
      width: 22px;
      height: 22px;
      color: var(--pill-color, var(--energy-card-accent));
      filter: drop-shadow(0 0 12px color-mix(in srgb, var(--pill-color, #58d5ff), transparent 35%));
    }

    .pill-body {
      display: grid;
      gap: 1px;
      min-width: 0;
    }

    .pill-label,
    .pill-value,
    .pill-status {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .pill-value {
      margin-top: 2px;
      color: #ffffff;
      font-size: clamp(14px, 1.7cqw, 19px);
      line-height: 1.1;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    .pill-status {
      color: var(--energy-card-muted);
      font-size: clamp(11px, 1.2cqw, 12px);
      line-height: 1.3;
    }

    .pill-progress {
      display: block;
      height: 3px;
      margin-top: 7px;
      overflow: hidden;
      border-radius: 999px;
      background: rgba(255, 255, 255, .16);
    }

    .pill-progress span {
      display: block;
      width: var(--pill-progress, 0%);
      height: 100%;
      border-radius: inherit;
      background: var(--pill-color, var(--energy-card-accent));
      box-shadow: 0 0 12px color-mix(in srgb, var(--pill-color, #58d5ff), transparent 30%);
      transition: width .6s var(--energy-card-ease);
    }

    /* Detail panel */
    .detail-backdrop {
      position: absolute;
      inset: 0;
      z-index: 8;
      display: grid;
      place-items: center;
      padding: var(--energy-card-padding);
      background: rgba(0, 0, 0, .28);
      backdrop-filter: blur(2px);
      animation: detailFade .16s ease both;
    }

    .detail-panel {
      width: min(430px, 100%);
      max-height: calc(100% - (var(--energy-card-padding) * 2));
      overflow: auto;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, .22);
      background: rgba(5, 15, 22, .88);
      box-shadow: 0 24px 80px rgba(0, 0, 0, .52), inset 0 1px 0 rgba(255, 255, 255, .08);
      backdrop-filter: blur(20px);
      animation: detailRise .22s var(--energy-card-ease) both;
      color: var(--energy-card-text, #f7fbff);
    }

    .detail-head {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 12px;
      align-items: start;
      padding: 18px 18px 10px;
      border-bottom: 1px solid rgba(255, 255, 255, .10);
    }

    .detail-label {
      color: var(--energy-card-muted);
      font-size: 11px;
      letter-spacing: .08em;
      text-transform: uppercase;
    }

    .detail-title {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-top: 4px;
      color: #ffffff;
      font-size: 22px;
      line-height: 1;
      font-weight: 700;
    }

    .detail-title ha-icon,
    .detail-action ha-icon {
      width: 22px;
      height: 22px;
      color: var(--pill-color, var(--energy-card-accent));
      filter: drop-shadow(0 0 12px color-mix(in srgb, var(--pill-color, #58d5ff), transparent 35%));
    }

    .detail-close {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      border: 1px solid rgba(255, 255, 255, .16);
      border-radius: 8px;
      background: rgba(255, 255, 255, .06);
      color: #ffffff;
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
    }

    .detail-body {
      display: grid;
      padding: 8px 18px 18px;
    }

    .detail-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 14px;
      align-items: baseline;
      padding: 10px 0;
      border: 0;
      border-bottom: 1px solid rgba(255, 255, 255, .08);
      background: transparent;
      cursor: default;
    }

    .detail-row.has-entity {
      cursor: pointer;
    }

    .detail-row.has-entity:hover .detail-row-label {
      color: #ffffff;
    }

    .detail-row:last-child {
      border-bottom: 0;
    }

    .detail-row-label {
      color: var(--energy-card-muted);
      font-size: 13px;
      transition: color .15s ease;
    }

    .detail-row-value {
      color: #ffffff;
      font-size: 15px;
      font-weight: 650;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .detail-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, .10);
    }

    .detail-action {
      display: inline-grid;
      justify-items: center;
      align-content: center;
      gap: 3px;
      width: 68px;
      min-height: 68px;
      padding: 8px 6px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, .16);
      background: rgba(255, 255, 255, .06);
      color: #ffffff;
      cursor: pointer;
      text-align: center;
      --pill-color: var(--action-color, var(--energy-card-accent));
    }

    .detail-action:hover {
      border-color: rgba(255, 255, 255, .34);
      background: rgba(255, 255, 255, .10);
    }

    .detail-action-label,
    .detail-action-state {
      max-width: 56px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .detail-action-label {
      color: #ffffff;
      font-size: 10px;
      font-weight: 650;
      line-height: 1.12;
    }

    .detail-action-state {
      color: var(--energy-card-muted);
      font-size: 9px;
      line-height: 1.1;
    }

    .detail-action.tone-secure,
    .detail-action.tone-on { --action-color: #56f0a8; }
    .detail-action.tone-alert { --action-color: #ff6b6b; }
    .detail-action.tone-off { --action-color: #ffb86b; }

    @keyframes sceneFade {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes nodeBreath {
      0%, 100% { box-shadow: 0 10px 24px rgba(0, 0, 0, .28), 0 0 0 0 color-mix(in srgb, var(--node-tone), transparent 100%); }
      50% { box-shadow: 0 10px 24px rgba(0, 0, 0, .28), 0 0 0 4px color-mix(in srgb, var(--node-tone), transparent 78%); }
    }

    @keyframes detailFade {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes detailRise {
      from { opacity: 0; transform: translateY(10px) scale(.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes hintRise {
      from { opacity: 0; transform: translate(-50%, calc(-50% + 8px)); }
      to { opacity: 1; transform: translate(-50%, -50%); }
    }

    @media (prefers-reduced-motion: reduce) {
      .node,
      .scene,
      .detail-backdrop,
      .detail-panel,
      .setup-hint {
        animation: none;
      }

      .node,
      .pill,
      .pill-progress span {
        transition: none;
      }
    }

    /* Responsive: the card is a container, so every breakpoint reads the card width, not the viewport. */
    @container (max-width: 960px) {
      .pill { gap: 9px; padding: 9px 10px; }
      .pill ha-icon { width: 19px; height: 19px; }
    }

    @container (max-width: 760px) {
      .pill { gap: 8px; padding: 8px 10px; }
      .pill ha-icon { width: 18px; height: 18px; }
      .pill-status { display: none; }
      .pill-progress { margin-top: 5px; }
      .statusbar { grid-template-columns: repeat(auto-fit, minmax(min(112px, 100%), 1fr)); gap: 6px; }
    }

    @container (max-width: 620px) {
      .content { --energy-card-padding: 14px; }
      .node { min-width: 72px; padding: 5px 8px 6px; }
      .node-label { font-size: 8px; }
      .node-value { font-size: 15px; }
      .node-state, .node-extra { display: none; }
      .node-solar { top: 29%; left: 53%; }
      .node-grid { top: 42%; left: 4%; }
      .node-house { top: 47%; left: 40%; }
      .node-ev { right: 4%; bottom: 34%; }
      .node-battery { top: 60%; left: 62%; }
      .statusbar { grid-template-columns: repeat(auto-fit, minmax(min(84px, 100%), 1fr)); gap: 5px; }
      .pill { gap: 6px; padding: 6px 8px; }
      .pill ha-icon { width: 16px; height: 16px; }
      .pill-label { display: none; }
      .pill-value { margin-top: 0; font-size: 12px; }
      .setup-hint { padding: 12px 14px; }
      .setup-hint-title { font-size: 14px; }
      .setup-hint-body { font-size: 12px; }
    }

    @container (max-width: 420px) {
      .content { --energy-card-padding: 9px; }
      .node { min-width: 58px; padding: 4px 6px; }
      .node-label { font-size: 7px; }
      .node-value { font-size: 12px; }
      .node-solar { top: 26%; left: 52%; }
      .node-grid { top: 36%; left: 3%; }
      .node-house { top: 42%; left: 39%; }
      .node-ev { right: 3%; bottom: 40%; }
      .node-battery { top: 54%; left: 58%; }
      .statusbar { grid-template-columns: repeat(auto-fit, minmax(min(100px, 100%), 1fr)); gap: 4px; }
      .pill { gap: 4px; padding: 4px 6px; }
      .pill ha-icon { width: 13px; height: 13px; }
      .pill-value { font-size: 11px; }
      .pill-progress { display: none; }
    }
  `;static getConfigElement(){return document.createElement("hacs-home-energy-card-editor")}static getStubConfig(e){return Fr(e)}setConfig(e){if(!e||typeof e!="object")throw new Error("hacs-home-energy-card requires a configuration object");this._config=e}getCardSize(){return 7}getGridOptions(){return{columns:"full",min_columns:6}}willUpdate(e){(e.has("hass")||e.has("_config"))&&(this._model=this._config?zr(this._config,this.hass):null,this.trackScene(this._model))}trackScene(e){e&&(this._scene&&this._scene.url!==e.background&&(this._outgoingScene=this._scene,clearTimeout(this._sceneTimer),this._sceneTimer=setTimeout(()=>{this._outgoingScene=null},er+100)),this._scene={url:e.background,fallback:e.backgroundFallback,mode:e.mode})}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this._sceneTimer)}render(){let e=this._model;return e?(this.applySizing(e.size),p`
      <ha-card class="mode-${e.mode}">
        ${this._outgoingScene?this.renderScene(this._outgoingScene,"scene-outgoing"):p``}
        ${this.renderScene(this._scene,this._outgoingScene?"scene-incoming":"")}
        <div class="content">
          <div class="mid">${e.setupComplete?this.renderNodes(e):this.renderSetupHint()}</div>
          ${e.showStatusBar?this.renderStatusbar(e):p``}
          ${this.renderDetailPanel(e)}
        </div>
      </ha-card>
    `):p``}renderScene(e,t){return e?p`
      <div
        class="scene mode-${e.mode} ${t}"
        style="--energy-background: url('${e.url}'); --energy-background-fallback: ${e.fallback?`url('${e.fallback}')`:"none"}"
      ></div>
    `:p``}applySizing(e){let t=e?.width||"100%";this.style.width=t==="100%"?"100%":`min(100%, ${t})`,this.style.minWidth=`min(100%, ${e?.minWidth||`${H}px`})`,this.style.maxWidth="100%",this.style.setProperty("--energy-card-width",t),this.style.setProperty("--energy-card-min-width",e?.minWidth||`${H}px`),this.style.setProperty("--energy-card-min-height",e?.minHeight||`${ee}px`),e?.height?this.style.setProperty("--energy-card-height",e.height):this.style.removeProperty("--energy-card-height")}renderNodes(e){return p`
      ${e.visible.solar?this.renderNode("solar",e.solar):p``}
      ${this.renderNode("grid",e.grid)}
      ${this.renderNode("house",e.house)}
      ${e.visible.ev?this.renderNode("ev",e.ev):p``}
      ${e.visible.battery?this.renderNode("battery",e.battery):p``}
    `}renderSetupHint(){return p`
      <div class="setup-hint" role="status">
        <div class="setup-hint-title">Choose your power sensors</div>
        <div class="setup-hint-body">
          Pick a grid power and a home power sensor in the card editor. Solar, battery and EV can be added after.
        </div>
      </div>
    `}renderNode(e,t){return p`
      <button
        class="node node-${e}"
        type="button"
        data-active=${t.active?"true":"false"}
        style="--node-tone:${t.toneColor}"
        @click=${()=>this.openDetail(e)}
        aria-label=${`${t.label} details`}
      >
        <span class="node-label">${t.label}</span>
        <span class="node-value">${t.powerLabel}</span>
        <span class="node-state">${t.statusLabel}</span>
        ${t.nodeExtra?p`<span class="node-extra">${t.nodeExtra}</span>`:p``}
      </button>
    `}renderStatusbar(e){return e.bottomCards.length?p`<div class="statusbar">${e.bottomCards.map(t=>this.renderPill(t))}</div>`:p``}renderPill(e){let t=e.progress!==null&&e.progress!==void 0;return p`
      <button
        class="pill"
        type="button"
        style="--pill-color:${e.color||u.entity}"
        @click=${()=>this.openPill(e)}
        aria-label=${`${e.label} details`}
      >
        <ha-icon icon=${e.icon||_.entity}></ha-icon>
        <span class="pill-body">
          <span class="pill-label">${e.label}</span>
          <span class="pill-value">${e.value}</span>
          ${e.status?p`<span class="pill-status">${e.status}</span>`:p``}
          ${t?p`<span class="pill-progress" title=${`${e.progress}%`}><span style=${`--pill-progress:${e.progress}%`}></span></span>`:p``}
        </span>
      </button>
    `}renderDetailPanel(e){let t=this._activeDetail;if(!t||!e.details?.[t])return p``;let a=e[t],o=_[t],n=u[t],i=e.actions?.[t]||[];return p`
      <div class="detail-backdrop" @click=${s=>this.closeDetail(s)}>
        <section class="detail-panel" style="--pill-color:${n}" @click=${s=>s.stopPropagation()} role="dialog" aria-label=${`${a.cardLabel} details`}>
          <div class="detail-head">
            <div>
              <div class="detail-label">${a.statusLabel}</div>
              <div class="detail-title"><ha-icon icon=${o}></ha-icon> ${a.cardLabel}</div>
            </div>
            <button class="detail-close" type="button" @click=${()=>this.closeDetail()} aria-label="Close details">×</button>
          </div>
          <div class="detail-body">
            ${e.details[t].map(s=>p`
                <button class="detail-row ${s.entityId?"has-entity":""}" type="button" @click=${()=>this.openMoreInfo(s.entityId)}>
                  <span class="detail-row-label">${s.label}</span>
                  <span class="detail-row-value">${s.value}</span>
                </button>
              `)}
            ${i.length?p`
                  <div class="detail-actions">
                    ${i.map(s=>p`
                        <button
                          class="detail-action tone-${s.tone||"neutral"}"
                          type="button"
                          @click=${()=>this.callQuickAction(s)}
                          aria-label=${s.stateLabel?`${s.label}, ${s.stateLabel}`:s.label}
                        >
                          <ha-icon icon=${s.icon}></ha-icon>
                          <span class="detail-action-label">${s.label}</span>
                          ${s.stateLabel?p`<span class="detail-action-state">${s.stateLabel}</span>`:p``}
                        </button>
                      `)}
                  </div>
                `:p``}
          </div>
        </section>
      </div>
    `}openPill(e){if(e.detailKind){this.openDetail(e.detailKind);return}e.entityId?this.openMoreInfo(e.entityId):this.openDetail(e.kind)}openDetail(e){this._activeDetail=e}closeDetail(e){e?.stopPropagation?.(),this._activeDetail=null}callQuickAction(e){if(!(!e?.domain||!e?.serviceName)){if(this.hass?.callService){this.hass.callService(e.domain,e.serviceName,e.data||{},e.target||{});return}Me(this,"hass-call-service",{domain:e.domain,service:e.serviceName,serviceData:e.data||{},target:e.target||{}})}}openMoreInfo(e){e&&Me(this,"hass-more-info",{entityId:e})}},Ir=[["grid_power","power",[/grid/i,/import/i,/mains/i,/\bmeter\b/i]],["house_power","power",[/house/i,/home/i,/\bload\b/i,/consum/i]],["solar_power","power",[/solar/i,/\bpv\b/i,/inverter/i]],["battery_power","power",[/batter/i,/powerwall/i]],["ev_power","power",[/\bev\b/i,/charger/i,/wallbox/i,/\bcar\b/i]],["battery_soc","battery",[/home batt/i,/powerwall/i,/batter/i]],["ev_soc","battery",[/\bev\b/i,/\bcar\b/i,/vehicle/i]]];function Wr(r){let e=r?.states||{},t=new Set,a={};for(let[o,n,i]of Ir){let s=Object.entries(e).find(([l,d])=>{if(t.has(l)||!l.startsWith("sensor.")||d?.attributes?.device_class!==n)return!1;let h=`${l} ${d?.attributes?.friendly_name||""}`;return i.some(c=>c.test(h))});s&&(a[o]=s[0],t.add(s[0]))}return a}function Fr(r){if(!r?.states)return{show_ev:!0,show_solar:!0,show_battery:!0,solar_capacity_kw:5,entities:{sun:"sun.sun",grid_power:"sensor.grid_power_w",solar_power:"sensor.solar_power_w",house_power:"sensor.house_power_w",ev_power:"sensor.ev_charging_power_w",ev_soc:"sensor.ev_state_of_charge",battery_power:"sensor.battery_power_w",battery_soc:"sensor.battery_soc"}};let e=Wr(r);return{show_solar:!!e.solar_power,show_battery:!!(e.battery_power||e.battery_soc),show_ev:!!e.ev_power,entities:{sun:"sun.sun",...e}}}var g={entity:{domain:"sensor"}},B=(r,e)=>({number:{min:r,step:e,mode:"box"}}),M={text:{}},pe={boolean:{}},Z={entity:{multiple:!0}},We=[{name:"grid_power",label:"Grid power",helper:"Watts. Positive when importing, negative when exporting.",path:["entities","grid_power"],selector:g},{name:"house_power",label:"Home power",helper:"Watts. What the house is using right now.",path:["entities","house_power"],selector:g},{name:"show_solar",label:"Solar",path:["show_solar"],selector:pe,default:!0},{name:"show_battery",label:"Battery",path:["show_battery"],selector:pe,default:!0},{name:"show_ev",label:"EV",path:["show_ev"],selector:pe,default:!1},{name:"solar_power",label:"Solar power",helper:"Watts.",path:["entities","solar_power"],selector:g},{name:"solar_capacity_kw",label:"Array size (kW)",helper:"Used for the efficiency percentage.",path:["solar_capacity_kw"],selector:B(0,.1)},{name:"solar_energy_today",label:"Generated today",helper:"kWh.",path:["energy_today","solar"],selector:g},{name:"solar_capacity",label:"Array size sensor",helper:"Optional alternative to a fixed array size.",path:["entities","solar_capacity"],selector:g},{name:"solar_node_extra",label:"Extra value on node",path:["node_info","solar","entity"],selector:g},{name:"solar_detail",label:"Detail panel extras",helper:"Sensors become rows. Locks, switches and buttons become controls.",detailGroup:"solar",selector:Z},{name:"battery_power",label:"Battery power",helper:"Watts. Positive when charging, negative when discharging.",path:["entities","battery_power"],selector:g},{name:"battery_soc",label:"State of charge",helper:"Percent.",path:["entities","battery_soc"],selector:g},{name:"battery_capacity_kwh",label:"Capacity (kWh)",helper:"Used for the reserve estimate.",path:["battery_capacity_kwh"],selector:B(0,.1)},{name:"battery_capacity",label:"Capacity sensor",helper:"Optional alternative to a fixed capacity.",path:["entities","battery_capacity"],selector:g},{name:"battery_charge_today",label:"Charged today",helper:"kWh.",path:["energy_today","battery_charge"],selector:g},{name:"battery_discharge_today",label:"Discharged today",helper:"kWh.",path:["energy_today","battery_discharge"],selector:g},{name:"battery_node_extra",label:"Extra value on node",path:["node_info","battery","entity"],selector:g},{name:"battery_detail",label:"Detail panel extras",helper:"Sensors become rows. Locks, switches and buttons become controls.",detailGroup:"battery",selector:Z},{name:"ev_power",label:"Charge power",helper:"Watts. Negative values show as vehicle to home.",path:["entities","ev_power"],selector:g},{name:"ev_soc",label:"State of charge",helper:"Percent.",path:["entities","ev_soc"],selector:g},{name:"ev_charging_state",label:"Charging state",helper:"A binary sensor or a sensor with a charging state.",path:["entities","ev_charging_state"],selector:{entity:{domain:["binary_sensor","sensor"]}}},{name:"ev_energy_today",label:"Charged today",helper:"kWh.",path:["energy_today","ev"],selector:g},{name:"ev_node_extra",label:"Extra value on node",path:["node_info","ev","entity"],selector:g},{name:"ev_detail",label:"Detail panel extras",helper:"Range, odometer, a lock, a boost switch. Locks, switches and buttons become controls.",detailGroup:"ev",selector:Z},{name:"grid_import_today",label:"Imported today",helper:"kWh. Powers the self powered and grid cards.",path:["energy_today","grid_import"],selector:g},{name:"grid_export_today",label:"Exported today",helper:"kWh.",path:["energy_today","grid_export"],selector:g},{name:"home_energy_today",label:"Home used today",helper:"kWh.",path:["energy_today","home"],selector:g},{name:"grid_energy_today",label:"Net grid today",helper:"kWh. Optional when import and export are set.",path:["energy_today","grid"],selector:g},{name:"grid_node_extra",label:"Extra value on grid node",path:["node_info","grid","entity"],selector:g},{name:"home_node_extra",label:"Extra value on home node",path:["node_info","house","entity"],selector:g},{name:"grid_detail",label:"Grid detail extras",detailGroup:"grid",selector:Z},{name:"house_detail",label:"Home detail extras",detailGroup:"house",selector:Z},{name:"currency",label:"Currency symbol",path:["tariffs","currency"],selector:M},{name:"cost_today_entity",label:"Cost today",helper:"A daily cost sensor.",path:["costs","today_entity"],selector:g},{name:"cost_daily_budget",label:"Daily budget",helper:"Optional. Fills the cost today progress bar.",path:["costs","daily_budget"],selector:B(0,.01)},{name:"import_rate_entity",label:"Import rate sensor",helper:"Per kWh. Best for time of use tariffs.",path:["tariffs","import_rate_entity"],selector:g},{name:"export_rate_entity",label:"Export rate sensor",helper:"Per kWh.",path:["tariffs","export_rate_entity"],selector:g},{name:"import_rate",label:"Fixed import rate",helper:"Per kWh. Used when no sensor is set.",path:["tariffs","import_rate"],selector:B(0,.001)},{name:"export_rate",label:"Fixed export rate",helper:"Per kWh.",path:["tariffs","export_rate"],selector:B(0,.001)},{name:"show_bottom_bar",label:"Show bottom bar",path:["show_bottom_bar"],selector:pe,default:!0},{name:"grid_label",label:"Grid",path:["labels","grid"],selector:M},{name:"house_label",label:"Home",path:["labels","house"],selector:M},{name:"solar_label",label:"Solar",path:["labels","solar"],selector:M},{name:"battery_label",label:"Battery",path:["labels","battery"],selector:M},{name:"ev_label",label:"EV",path:["labels","ev"],selector:M},{name:"sun",label:"Sun entity",helper:"Switches the day and night scene.",path:["entities","sun"],selector:{entity:{domain:"sun"}}},{name:"time_of_day",label:"Scene",helper:"Follow the sun, or lock the card to day or night.",path:["time_of_day"],selector:{select:{mode:"dropdown",options:[{value:"auto",label:"Follow the sun"},{value:"day",label:"Always day"},{value:"night",label:"Always night"}]}},default:"auto",deleteWhen:"auto"},{name:"weather",label:"Weather entity",helper:"Used by the weather glance card.",path:["entities","weather"],selector:{entity:{domain:"weather"}}},{name:"outdoor_temperature",label:"Outdoor temperature",helper:"Optional. Replaces the weather entity temperature.",path:["entities","outdoor_temperature"],selector:g},{name:"card_width",label:"Fixed width (px)",helper:"Leave blank to fill the column.",path:["card_width"],selector:B(H,1)},{name:"card_height",label:"Fixed height (px)",helper:"Leave blank to keep the scene aspect ratio.",path:["card_height"],selector:B(ee,1)}],Fe=Object.fromEntries(We.map(r=>[r.name,r])),Gr=[{key:"setup",title:"Setup",secondary:"The two sensors every home needs, then the systems you have.",expanded:!0,rows:[["grid_power","house_power"],["show_solar","show_battery","show_ev"]]},{key:"solar",title:"Solar",system:"solar",rows:[["solar_power","solar_capacity_kw"],["solar_energy_today","solar_capacity"],"solar_node_extra","solar_detail"]},{key:"battery",title:"Battery",system:"battery",rows:[["battery_power","battery_soc"],["battery_capacity_kwh","battery_capacity"],["battery_charge_today","battery_discharge_today"],"battery_node_extra","battery_detail"]},{key:"ev",title:"EV",system:"ev",rows:[["ev_power","ev_soc"],["ev_charging_state","ev_energy_today"],"ev_node_extra","ev_detail"]},{key:"energy",title:"Grid and home energy",secondary:"Daily totals for the glance cards and detail panels.",rows:[["grid_import_today","grid_export_today"],["home_energy_today","grid_energy_today"],["grid_node_extra","home_node_extra"],"grid_detail","house_detail"]},{key:"cost",title:"Cost and tariff",rows:[["currency","cost_today_entity"],"cost_daily_budget",["import_rate_entity","export_rate_entity"],["import_rate","export_rate"]]},{key:"bottom_bar",title:"Bottom bar",secondary:"Up to five glance cards.",rows:["show_bottom_bar"],bottomBar:!0},{key:"appearance",title:"Appearance",rows:[["grid_label","house_label"],["solar_label","battery_label"],"ev_label",["sun","time_of_day"],["weather","outdoor_temperature"],["card_width","card_height"]]}],jr={solar:"show_solar",ev:"show_ev",battery:"show_battery"};function k(r,e=""){return`bottom_bar_slot_${r+1}${e}`}function Kr(r){return JSON.parse(JSON.stringify(r||{}))}function Vr(r,e){let t=r||{};for(let a of e)t=t?.[a];return t}function vt(r,e,t){let a=r;for(let o of e.slice(0,-1))a[o]={...a[o]||{}},a=a[o];a[e[e.length-1]]=t}function Oe(r,e){let t=[],a=r;for(let o of e.slice(0,-1)){if(!a?.[o])return;t.push([a,o]),a=a[o]}delete a[e[e.length-1]];for(let o=t.length-1;o>=0;o-=1){let[n,i]=t[o];n[i]&&typeof n[i]=="object"&&!Object.keys(n[i]).length&&delete n[i]}}function Bt(r,e){return ye(r,e).map(t=>t.entity).filter(Boolean)}function Mt(r,e){return e?r[jr[e]]!==!1:!0}function qr(r){return At.filter(e=>Mt(r,e.system))}function Ne(r){let e={};for(let a of We){if(a.detailGroup){e[a.name]=Bt(r,a.detailGroup);continue}let o=Vr(r,a.path);o!=null?e[a.name]=o:a.default!==void 0&&(e[a.name]=a.default)}let t=Ie(r)||[];for(let a=0;a<re;a+=1){let o=t[a],n=typeof o=="string"?o:o?.type;e[k(a)]=n||"none",typeof o=="object"&&o?.entity&&(e[k(a,"_entity")]=o.entity),typeof o=="object"&&o?.label&&(e[k(a,"_label")]=o.label)}return e}function Yr(r,e,t){let a=ye(r,e),o=r.detail_entities?.[e];return t.map(n=>{let i=a.find(w=>w.entity===n);if(!i||i.auto)return n;let{auto:s,listed:l,...d}=i;if(Array.isArray(o))return d;let{key:h,...c}=d;return{key:h,...c}})}function Jr(r,e){let t=Kr(r);for(let o of We){if(o.detailGroup){let s=Array.isArray(e[o.name])?e[o.name]:[],l=Bt(r,o.detailGroup);if(s.join("|")===l.join("|"))continue;s.length?vt(t,["detail_entities",o.detailGroup],Yr(r,o.detailGroup,s)):Oe(t,["detail_entities",o.detailGroup]);continue}let n=e[o.name];n===""||n===void 0||n===null||n===o.deleteWhen?Oe(t,o.path):vt(t,o.path,n)}let a=Array.from({length:re},(o,n)=>k(n));if(a.some(o=>Object.hasOwn(e,o))){let o=Ie(r)||[],n=a.map((i,s)=>{let l=e[i]||"none";if(l==="none")return null;let d=o[s],c={...d&&typeof d=="object"&&d.type===l?{...d}:{},type:l},w=e[k(s,"_entity")],m=e[k(s,"_label")];return l==="entity"&&(w?c.entity=w:delete c.entity),m?c.label=m:Object.hasOwn(e,k(s,"_label"))&&delete c.label,c}).filter(Boolean);n.length?t.bottom_bar=n:Oe(t,["bottom_bar"])}return t}function wt(r){let e=Fe[r];return e?{name:e.name,selector:e.selector}:null}function Xr(r){return r.map(e=>Array.isArray(e)?{name:"",type:"grid",schema:e.map(wt).filter(Boolean)}:wt(e)).filter(Boolean)}function Qr(r){let e=qr(r).map(({value:a,label:o})=>({value:a,label:o})),t=[];for(let a=0;a<re;a+=1)t.push({name:k(a),selector:{select:{mode:"dropdown",options:[{value:"none",label:"None"},...e]}}}),r[k(a)]==="entity"&&t.push({name:"",type:"grid",schema:[{name:k(a,"_entity"),selector:{entity:{}}},{name:k(a,"_label"),selector:M}]});return t}function Rt(r){let e=Ne(r);return Gr.map(t=>({key:t.key,title:t.title,secondary:t.secondary,expanded:!!t.expanded,visible:Mt(e,t.system),schema:[...Xr(t.rows),...t.bottomBar?Qr(e):[]]}))}function Nt(r){return r.flatMap(e=>e.type==="grid"?Nt(e.schema):[e.name])}function wa(r){return Rt(r).filter(e=>e.visible).flatMap(e=>Nt(e.schema))}function Zr(r){let e=Fe[r.name];if(e)return e.label;let t=r.name.match(/^bottom_bar_slot_(\d+)(_entity|_label)?$/);return t?t[2]==="_entity"?"Entity":t[2]==="_label"?"Label":`Card ${t[1]}`:r.name}function ea(r){return Fe[r.name]?.helper}var Ue=class extends A{static properties={hass:{attribute:!1},_config:{state:!0}};static styles=ie`
    .editor {
      display: grid;
      gap: 10px;
    }

    ha-expansion-panel {
      --expansion-panel-summary-padding: 0 12px;
      --expansion-panel-content-padding: 0 12px 12px;
    }

    .section-body {
      display: grid;
      gap: 8px;
      padding-top: 4px;
    }

    .setup {
      display: grid;
      gap: 6px;
      padding: 4px 0 6px;
    }

    .setup-title {
      color: var(--primary-text-color);
      font-size: 15px;
      font-weight: 600;
    }

    .setup-secondary {
      margin-bottom: 4px;
      color: var(--secondary-text-color);
      font-size: 13px;
    }

    ha-form {
      width: 100%;
    }
  `;setConfig(e){this._config=e||{}}render(){let e=Ne(this._config),t=Rt(this._config);return p`
      <div class="editor">
        ${t.map(a=>a.key==="setup"?p`
                <div class="setup">
                  <div class="setup-title">${a.title}</div>
                  <div class="setup-secondary">${a.secondary}</div>
                  ${this.renderForm(a,e)}
                </div>
              `:p`
                <ha-expansion-panel outlined .header=${a.title} .secondary=${a.secondary||""} .expanded=${a.expanded} ?hidden=${!a.visible}>
                  <div class="section-body">${this.renderForm(a,e)}</div>
                </ha-expansion-panel>
              `)}
      </div>
    `}renderForm(e,t){return p`
      <ha-form
        .hass=${this.hass}
        .data=${t}
        .schema=${e.schema}
        .computeLabel=${Zr}
        .computeHelper=${ea}
        @value-changed=${this.valueChanged}
      ></ha-form>
    `}valueChanged(e){e.stopPropagation();let t={...Ne(this._config),...e.detail.value||{}},a=Jr(this._config,t);this._config=a,Me(this,"config-changed",{config:a})}};typeof customElements<"u"&&!customElements.get("hacs-home-energy-card")&&customElements.define("hacs-home-energy-card",Re);typeof customElements<"u"&&!customElements.get("hacs-home-energy-card-editor")&&customElements.define("hacs-home-energy-card-editor",Ue);if(typeof window<"u"){console.info(`%c HACS Home Energy Card %c v${ar} `,"color: #07101a; background: #58d5ff; font-weight: 700","color: #58d5ff; background: #07101a"),window.customCards=window.customCards||[];let r={type:"hacs-home-energy-card",name:"HACS Home Energy Card",description:"Cinematic home energy dashboard with solar, grid, EV, battery, cost, and weather glance cards.",preview:!0,documentationURL:"https://github.com/RoBro92/HACS-home-energy-card/blob/main/docs/setup.md"},e=window.customCards.findIndex(t=>t?.type===r.type);e===-1?window.customCards.push(r):window.customCards[e]={...window.customCards[e],...r}}export{At as BOTTOM_CARD_OPTIONS,Re as HacsHomeEnergyCard,Ue as HacsHomeEnergyCardEditor,zr as buildEnergyModel,Ne as editorDataFromConfig,Jr as editorDataToConfig,wa as editorFieldsForConfig,Rt as editorSectionsForConfig,de as entityEnabled,$ as formatEnergy,St as formatPercent,ht as formatPower,Wr as guessStubEntities,y as parseNumber,va as selectBackground,Hr as setupBackgroundKey,R as stateAttributes,f as stateValue,Ur as timeOfDay};
