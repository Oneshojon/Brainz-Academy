(function () {
  const f = document.createElement("link").relList;
  if (f && f.supports && f.supports("modulepreload")) return;
  for (const d of document.querySelectorAll('link[rel="modulepreload"]')) s(d);
  new MutationObserver((d) => {
    for (const h of d)
      if (h.type === "childList")
        for (const g of h.addedNodes)
          g.tagName === "LINK" && g.rel === "modulepreload" && s(g);
  }).observe(document, { childList: !0, subtree: !0 });
  function r(d) {
    const h = {};
    return (
      d.integrity && (h.integrity = d.integrity),
      d.referrerPolicy && (h.referrerPolicy = d.referrerPolicy),
      d.crossOrigin === "use-credentials"
        ? (h.credentials = "include")
        : d.crossOrigin === "anonymous"
          ? (h.credentials = "omit")
          : (h.credentials = "same-origin"),
      h
    );
  }
  function s(d) {
    if (d.ep) return;
    d.ep = !0;
    const h = r(d);
    fetch(d.href, h);
  }
})();
function Rm(c) {
  return c && c.__esModule && Object.prototype.hasOwnProperty.call(c, "default")
    ? c.default
    : c;
}
var Hf = { exports: {} },
  jn = {};
var lm;
function Sy() {
  if (lm) return jn;
  lm = 1;
  var c = Symbol.for("react.transitional.element"),
    f = Symbol.for("react.fragment");
  function r(s, d, h) {
    var g = null;
    if (
      (h !== void 0 && (g = "" + h),
      d.key !== void 0 && (g = "" + d.key),
      "key" in d)
    ) {
      h = {};
      for (var z in d) z !== "key" && (h[z] = d[z]);
    } else h = d;
    return (
      (d = h.ref),
      { $$typeof: c, type: s, key: g, ref: d !== void 0 ? d : null, props: h }
    );
  }
  return ((jn.Fragment = f), (jn.jsx = r), (jn.jsxs = r), jn);
}
var am;
function Ey() {
  return (am || ((am = 1), (Hf.exports = Sy())), Hf.exports);
}
var x = Ey(),
  qf = { exports: {} },
  $ = {};
var nm;
function Ty() {
  if (nm) return $;
  nm = 1;
  var c = Symbol.for("react.transitional.element"),
    f = Symbol.for("react.portal"),
    r = Symbol.for("react.fragment"),
    s = Symbol.for("react.strict_mode"),
    d = Symbol.for("react.profiler"),
    h = Symbol.for("react.consumer"),
    g = Symbol.for("react.context"),
    z = Symbol.for("react.forward_ref"),
    D = Symbol.for("react.suspense"),
    b = Symbol.for("react.memo"),
    S = Symbol.for("react.lazy"),
    C = Symbol.for("react.activity"),
    V = Symbol.iterator;
  function ft(y) {
    return y === null || typeof y != "object"
      ? null
      : ((y = (V && y[V]) || y["@@iterator"]),
        typeof y == "function" ? y : null);
  }
  var H = {
      isMounted: function () {
        return !1;
      },
      enqueueForceUpdate: function () {},
      enqueueReplaceState: function () {},
      enqueueSetState: function () {},
    },
    w = Object.assign,
    B = {};
  function tt(y, M, L) {
    ((this.props = y),
      (this.context = M),
      (this.refs = B),
      (this.updater = L || H));
  }
  ((tt.prototype.isReactComponent = {}),
    (tt.prototype.setState = function (y, M) {
      if (typeof y != "object" && typeof y != "function" && y != null)
        throw Error(
          "takes an object of state variables to update or a function which returns an object of state variables.",
        );
      this.updater.enqueueSetState(this, y, M, "setState");
    }),
    (tt.prototype.forceUpdate = function (y) {
      this.updater.enqueueForceUpdate(this, y, "forceUpdate");
    }));
  function xt() {}
  xt.prototype = tt.prototype;
  function et(y, M, L) {
    ((this.props = y),
      (this.context = M),
      (this.refs = B),
      (this.updater = L || H));
  }
  var ht = (et.prototype = new xt());
  ((ht.constructor = et), w(ht, tt.prototype), (ht.isPureReactComponent = !0));
  var Ot = Array.isArray;
  function q() {}
  var G = { H: null, A: null, T: null, S: null },
    Et = Object.prototype.hasOwnProperty;
  function Yt(y, M, L) {
    var Q = L.ref;
    return {
      $$typeof: c,
      type: y,
      key: M,
      ref: Q !== void 0 ? Q : null,
      props: L,
    };
  }
  function je(y, M) {
    return Yt(y.type, M, y.props);
  }
  function re(y) {
    return typeof y == "object" && y !== null && y.$$typeof === c;
  }
  function Lt(y) {
    var M = { "=": "=0", ":": "=2" };
    return (
      "$" +
      y.replace(/[=:]/g, function (L) {
        return M[L];
      })
    );
  }
  var oe = /\/+/g;
  function Xt(y, M) {
    return typeof y == "object" && y !== null && y.key != null
      ? Lt("" + y.key)
      : M.toString(36);
  }
  function te(y) {
    switch (y.status) {
      case "fulfilled":
        return y.value;
      case "rejected":
        throw y.reason;
      default:
        switch (
          (typeof y.status == "string"
            ? y.then(q, q)
            : ((y.status = "pending"),
              y.then(
                function (M) {
                  y.status === "pending" &&
                    ((y.status = "fulfilled"), (y.value = M));
                },
                function (M) {
                  y.status === "pending" &&
                    ((y.status = "rejected"), (y.reason = M));
                },
              )),
          y.status)
        ) {
          case "fulfilled":
            return y.value;
          case "rejected":
            throw y.reason;
        }
    }
    throw y;
  }
  function R(y, M, L, Q, W) {
    var lt = typeof y;
    (lt === "undefined" || lt === "boolean") && (y = null);
    var mt = !1;
    if (y === null) mt = !0;
    else
      switch (lt) {
        case "bigint":
        case "string":
        case "number":
          mt = !0;
          break;
        case "object":
          switch (y.$$typeof) {
            case c:
            case f:
              mt = !0;
              break;
            case S:
              return ((mt = y._init), R(mt(y._payload), M, L, Q, W));
          }
      }
    if (mt)
      return (
        (W = W(y)),
        (mt = Q === "" ? "." + Xt(y, 0) : Q),
        Ot(W)
          ? ((L = ""),
            mt != null && (L = mt.replace(oe, "$&/") + "/"),
            R(W, M, L, "", function (La) {
              return La;
            }))
          : W != null &&
            (re(W) &&
              (W = je(
                W,
                L +
                  (W.key == null || (y && y.key === W.key)
                    ? ""
                    : ("" + W.key).replace(oe, "$&/") + "/") +
                  mt,
              )),
            M.push(W)),
        1
      );
    mt = 0;
    var It = Q === "" ? "." : Q + ":";
    if (Ot(y))
      for (var Dt = 0; Dt < y.length; Dt++)
        ((Q = y[Dt]), (lt = It + Xt(Q, Dt)), (mt += R(Q, M, L, lt, W)));
    else if (((Dt = ft(y)), typeof Dt == "function"))
      for (y = Dt.call(y), Dt = 0; !(Q = y.next()).done; )
        ((Q = Q.value), (lt = It + Xt(Q, Dt++)), (mt += R(Q, M, L, lt, W)));
    else if (lt === "object") {
      if (typeof y.then == "function") return R(te(y), M, L, Q, W);
      throw (
        (M = String(y)),
        Error(
          "Objects are not valid as a React child (found: " +
            (M === "[object Object]"
              ? "object with keys {" + Object.keys(y).join(", ") + "}"
              : M) +
            "). If you meant to render a collection of children, use an array instead.",
        )
      );
    }
    return mt;
  }
  function Y(y, M, L) {
    if (y == null) return y;
    var Q = [],
      W = 0;
    return (
      R(y, Q, "", "", function (lt) {
        return M.call(L, lt, W++);
      }),
      Q
    );
  }
  function K(y) {
    if (y._status === -1) {
      var M = y._result;
      ((M = M()),
        M.then(
          function (L) {
            (y._status === 0 || y._status === -1) &&
              ((y._status = 1), (y._result = L));
          },
          function (L) {
            (y._status === 0 || y._status === -1) &&
              ((y._status = 2), (y._result = L));
          },
        ),
        y._status === -1 && ((y._status = 0), (y._result = M)));
    }
    if (y._status === 1) return y._result.default;
    throw y._result;
  }
  var ot =
      typeof reportError == "function"
        ? reportError
        : function (y) {
            if (
              typeof window == "object" &&
              typeof window.ErrorEvent == "function"
            ) {
              var M = new window.ErrorEvent("error", {
                bubbles: !0,
                cancelable: !0,
                message:
                  typeof y == "object" &&
                  y !== null &&
                  typeof y.message == "string"
                    ? String(y.message)
                    : String(y),
                error: y,
              });
              if (!window.dispatchEvent(M)) return;
            } else if (
              typeof process == "object" &&
              typeof process.emit == "function"
            ) {
              process.emit("uncaughtException", y);
              return;
            }
            console.error(y);
          },
    yt = {
      map: Y,
      forEach: function (y, M, L) {
        Y(
          y,
          function () {
            M.apply(this, arguments);
          },
          L,
        );
      },
      count: function (y) {
        var M = 0;
        return (
          Y(y, function () {
            M++;
          }),
          M
        );
      },
      toArray: function (y) {
        return (
          Y(y, function (M) {
            return M;
          }) || []
        );
      },
      only: function (y) {
        if (!re(y))
          throw Error(
            "React.Children.only expected to receive a single React element child.",
          );
        return y;
      },
    };
  return (
    ($.Activity = C),
    ($.Children = yt),
    ($.Component = tt),
    ($.Fragment = r),
    ($.Profiler = d),
    ($.PureComponent = et),
    ($.StrictMode = s),
    ($.Suspense = D),
    ($.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = G),
    ($.__COMPILER_RUNTIME = {
      __proto__: null,
      c: function (y) {
        return G.H.useMemoCache(y);
      },
    }),
    ($.cache = function (y) {
      return function () {
        return y.apply(null, arguments);
      };
    }),
    ($.cacheSignal = function () {
      return null;
    }),
    ($.cloneElement = function (y, M, L) {
      if (y == null)
        throw Error(
          "The argument must be a React element, but you passed " + y + ".",
        );
      var Q = w({}, y.props),
        W = y.key;
      if (M != null)
        for (lt in (M.key !== void 0 && (W = "" + M.key), M))
          !Et.call(M, lt) ||
            lt === "key" ||
            lt === "__self" ||
            lt === "__source" ||
            (lt === "ref" && M.ref === void 0) ||
            (Q[lt] = M[lt]);
      var lt = arguments.length - 2;
      if (lt === 1) Q.children = L;
      else if (1 < lt) {
        for (var mt = Array(lt), It = 0; It < lt; It++)
          mt[It] = arguments[It + 2];
        Q.children = mt;
      }
      return Yt(y.type, W, Q);
    }),
    ($.createContext = function (y) {
      return (
        (y = {
          $$typeof: g,
          _currentValue: y,
          _currentValue2: y,
          _threadCount: 0,
          Provider: null,
          Consumer: null,
        }),
        (y.Provider = y),
        (y.Consumer = { $$typeof: h, _context: y }),
        y
      );
    }),
    ($.createElement = function (y, M, L) {
      var Q,
        W = {},
        lt = null;
      if (M != null)
        for (Q in (M.key !== void 0 && (lt = "" + M.key), M))
          Et.call(M, Q) &&
            Q !== "key" &&
            Q !== "__self" &&
            Q !== "__source" &&
            (W[Q] = M[Q]);
      var mt = arguments.length - 2;
      if (mt === 1) W.children = L;
      else if (1 < mt) {
        for (var It = Array(mt), Dt = 0; Dt < mt; Dt++)
          It[Dt] = arguments[Dt + 2];
        W.children = It;
      }
      if (y && y.defaultProps)
        for (Q in ((mt = y.defaultProps), mt))
          W[Q] === void 0 && (W[Q] = mt[Q]);
      return Yt(y, lt, W);
    }),
    ($.createRef = function () {
      return { current: null };
    }),
    ($.forwardRef = function (y) {
      return { $$typeof: z, render: y };
    }),
    ($.isValidElement = re),
    ($.lazy = function (y) {
      return { $$typeof: S, _payload: { _status: -1, _result: y }, _init: K };
    }),
    ($.memo = function (y, M) {
      return { $$typeof: b, type: y, compare: M === void 0 ? null : M };
    }),
    ($.startTransition = function (y) {
      var M = G.T,
        L = {};
      G.T = L;
      try {
        var Q = y(),
          W = G.S;
        (W !== null && W(L, Q),
          typeof Q == "object" &&
            Q !== null &&
            typeof Q.then == "function" &&
            Q.then(q, ot));
      } catch (lt) {
        ot(lt);
      } finally {
        (M !== null && L.types !== null && (M.types = L.types), (G.T = M));
      }
    }),
    ($.unstable_useCacheRefresh = function () {
      return G.H.useCacheRefresh();
    }),
    ($.use = function (y) {
      return G.H.use(y);
    }),
    ($.useActionState = function (y, M, L) {
      return G.H.useActionState(y, M, L);
    }),
    ($.useCallback = function (y, M) {
      return G.H.useCallback(y, M);
    }),
    ($.useContext = function (y) {
      return G.H.useContext(y);
    }),
    ($.useDebugValue = function () {}),
    ($.useDeferredValue = function (y, M) {
      return G.H.useDeferredValue(y, M);
    }),
    ($.useEffect = function (y, M) {
      return G.H.useEffect(y, M);
    }),
    ($.useEffectEvent = function (y) {
      return G.H.useEffectEvent(y);
    }),
    ($.useId = function () {
      return G.H.useId();
    }),
    ($.useImperativeHandle = function (y, M, L) {
      return G.H.useImperativeHandle(y, M, L);
    }),
    ($.useInsertionEffect = function (y, M) {
      return G.H.useInsertionEffect(y, M);
    }),
    ($.useLayoutEffect = function (y, M) {
      return G.H.useLayoutEffect(y, M);
    }),
    ($.useMemo = function (y, M) {
      return G.H.useMemo(y, M);
    }),
    ($.useOptimistic = function (y, M) {
      return G.H.useOptimistic(y, M);
    }),
    ($.useReducer = function (y, M, L) {
      return G.H.useReducer(y, M, L);
    }),
    ($.useRef = function (y) {
      return G.H.useRef(y);
    }),
    ($.useState = function (y) {
      return G.H.useState(y);
    }),
    ($.useSyncExternalStore = function (y, M, L) {
      return G.H.useSyncExternalStore(y, M, L);
    }),
    ($.useTransition = function () {
      return G.H.useTransition();
    }),
    ($.version = "19.2.4"),
    $
  );
}
var um;
function kf() {
  return (um || ((um = 1), (qf.exports = Ty())), qf.exports);
}
var Wt = kf();
const Ay = Rm(Wt);
var Bf = { exports: {} },
  Cn = {},
  Yf = { exports: {} },
  Lf = {};
var im;
function zy() {
  return (
    im ||
      ((im = 1),
      (function (c) {
        function f(R, Y) {
          var K = R.length;
          R.push(Y);
          t: for (; 0 < K; ) {
            var ot = (K - 1) >>> 1,
              yt = R[ot];
            if (0 < d(yt, Y)) ((R[ot] = Y), (R[K] = yt), (K = ot));
            else break t;
          }
        }
        function r(R) {
          return R.length === 0 ? null : R[0];
        }
        function s(R) {
          if (R.length === 0) return null;
          var Y = R[0],
            K = R.pop();
          if (K !== Y) {
            R[0] = K;
            t: for (var ot = 0, yt = R.length, y = yt >>> 1; ot < y; ) {
              var M = 2 * (ot + 1) - 1,
                L = R[M],
                Q = M + 1,
                W = R[Q];
              if (0 > d(L, K))
                Q < yt && 0 > d(W, L)
                  ? ((R[ot] = W), (R[Q] = K), (ot = Q))
                  : ((R[ot] = L), (R[M] = K), (ot = M));
              else if (Q < yt && 0 > d(W, K))
                ((R[ot] = W), (R[Q] = K), (ot = Q));
              else break t;
            }
          }
          return Y;
        }
        function d(R, Y) {
          var K = R.sortIndex - Y.sortIndex;
          return K !== 0 ? K : R.id - Y.id;
        }
        if (
          ((c.unstable_now = void 0),
          typeof performance == "object" &&
            typeof performance.now == "function")
        ) {
          var h = performance;
          c.unstable_now = function () {
            return h.now();
          };
        } else {
          var g = Date,
            z = g.now();
          c.unstable_now = function () {
            return g.now() - z;
          };
        }
        var D = [],
          b = [],
          S = 1,
          C = null,
          V = 3,
          ft = !1,
          H = !1,
          w = !1,
          B = !1,
          tt = typeof setTimeout == "function" ? setTimeout : null,
          xt = typeof clearTimeout == "function" ? clearTimeout : null,
          et = typeof setImmediate < "u" ? setImmediate : null;
        function ht(R) {
          for (var Y = r(b); Y !== null; ) {
            if (Y.callback === null) s(b);
            else if (Y.startTime <= R)
              (s(b), (Y.sortIndex = Y.expirationTime), f(D, Y));
            else break;
            Y = r(b);
          }
        }
        function Ot(R) {
          if (((w = !1), ht(R), !H))
            if (r(D) !== null) ((H = !0), q || ((q = !0), Lt()));
            else {
              var Y = r(b);
              Y !== null && te(Ot, Y.startTime - R);
            }
        }
        var q = !1,
          G = -1,
          Et = 5,
          Yt = -1;
        function je() {
          return B ? !0 : !(c.unstable_now() - Yt < Et);
        }
        function re() {
          if (((B = !1), q)) {
            var R = c.unstable_now();
            Yt = R;
            var Y = !0;
            try {
              t: {
                ((H = !1), w && ((w = !1), xt(G), (G = -1)), (ft = !0));
                var K = V;
                try {
                  e: {
                    for (
                      ht(R), C = r(D);
                      C !== null && !(C.expirationTime > R && je());
                    ) {
                      var ot = C.callback;
                      if (typeof ot == "function") {
                        ((C.callback = null), (V = C.priorityLevel));
                        var yt = ot(C.expirationTime <= R);
                        if (((R = c.unstable_now()), typeof yt == "function")) {
                          ((C.callback = yt), ht(R), (Y = !0));
                          break e;
                        }
                        (C === r(D) && s(D), ht(R));
                      } else s(D);
                      C = r(D);
                    }
                    if (C !== null) Y = !0;
                    else {
                      var y = r(b);
                      (y !== null && te(Ot, y.startTime - R), (Y = !1));
                    }
                  }
                  break t;
                } finally {
                  ((C = null), (V = K), (ft = !1));
                }
                Y = void 0;
              }
            } finally {
              Y ? Lt() : (q = !1);
            }
          }
        }
        var Lt;
        if (typeof et == "function")
          Lt = function () {
            et(re);
          };
        else if (typeof MessageChannel < "u") {
          var oe = new MessageChannel(),
            Xt = oe.port2;
          ((oe.port1.onmessage = re),
            (Lt = function () {
              Xt.postMessage(null);
            }));
        } else
          Lt = function () {
            tt(re, 0);
          };
        function te(R, Y) {
          G = tt(function () {
            R(c.unstable_now());
          }, Y);
        }
        ((c.unstable_IdlePriority = 5),
          (c.unstable_ImmediatePriority = 1),
          (c.unstable_LowPriority = 4),
          (c.unstable_NormalPriority = 3),
          (c.unstable_Profiling = null),
          (c.unstable_UserBlockingPriority = 2),
          (c.unstable_cancelCallback = function (R) {
            R.callback = null;
          }),
          (c.unstable_forceFrameRate = function (R) {
            0 > R || 125 < R
              ? console.error(
                  "forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported",
                )
              : (Et = 0 < R ? Math.floor(1e3 / R) : 5);
          }),
          (c.unstable_getCurrentPriorityLevel = function () {
            return V;
          }),
          (c.unstable_next = function (R) {
            switch (V) {
              case 1:
              case 2:
              case 3:
                var Y = 3;
                break;
              default:
                Y = V;
            }
            var K = V;
            V = Y;
            try {
              return R();
            } finally {
              V = K;
            }
          }),
          (c.unstable_requestPaint = function () {
            B = !0;
          }),
          (c.unstable_runWithPriority = function (R, Y) {
            switch (R) {
              case 1:
              case 2:
              case 3:
              case 4:
              case 5:
                break;
              default:
                R = 3;
            }
            var K = V;
            V = R;
            try {
              return Y();
            } finally {
              V = K;
            }
          }),
          (c.unstable_scheduleCallback = function (R, Y, K) {
            var ot = c.unstable_now();
            switch (
              (typeof K == "object" && K !== null
                ? ((K = K.delay),
                  (K = typeof K == "number" && 0 < K ? ot + K : ot))
                : (K = ot),
              R)
            ) {
              case 1:
                var yt = -1;
                break;
              case 2:
                yt = 250;
                break;
              case 5:
                yt = 1073741823;
                break;
              case 4:
                yt = 1e4;
                break;
              default:
                yt = 5e3;
            }
            return (
              (yt = K + yt),
              (R = {
                id: S++,
                callback: Y,
                priorityLevel: R,
                startTime: K,
                expirationTime: yt,
                sortIndex: -1,
              }),
              K > ot
                ? ((R.sortIndex = K),
                  f(b, R),
                  r(D) === null &&
                    R === r(b) &&
                    (w ? (xt(G), (G = -1)) : (w = !0), te(Ot, K - ot)))
                : ((R.sortIndex = yt),
                  f(D, R),
                  H || ft || ((H = !0), q || ((q = !0), Lt()))),
              R
            );
          }),
          (c.unstable_shouldYield = je),
          (c.unstable_wrapCallback = function (R) {
            var Y = V;
            return function () {
              var K = V;
              V = Y;
              try {
                return R.apply(this, arguments);
              } finally {
                V = K;
              }
            };
          }));
      })(Lf)),
    Lf
  );
}
var cm;
function Oy() {
  return (cm || ((cm = 1), (Yf.exports = zy())), Yf.exports);
}
var wf = { exports: {} },
  Ft = {};
var fm;
function _y() {
  if (fm) return Ft;
  fm = 1;
  var c = kf();
  function f(D) {
    var b = "https://react.dev/errors/" + D;
    if (1 < arguments.length) {
      b += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var S = 2; S < arguments.length; S++)
        b += "&args[]=" + encodeURIComponent(arguments[S]);
    }
    return (
      "Minified React error #" +
      D +
      "; visit " +
      b +
      " for the full message or use the non-minified dev environment for full errors and additional helpful warnings."
    );
  }
  function r() {}
  var s = {
      d: {
        f: r,
        r: function () {
          throw Error(f(522));
        },
        D: r,
        C: r,
        L: r,
        m: r,
        X: r,
        S: r,
        M: r,
      },
      p: 0,
      findDOMNode: null,
    },
    d = Symbol.for("react.portal");
  function h(D, b, S) {
    var C =
      3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return {
      $$typeof: d,
      key: C == null ? null : "" + C,
      children: D,
      containerInfo: b,
      implementation: S,
    };
  }
  var g = c.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  function z(D, b) {
    if (D === "font") return "";
    if (typeof b == "string") return b === "use-credentials" ? b : "";
  }
  return (
    (Ft.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = s),
    (Ft.createPortal = function (D, b) {
      var S =
        2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
      if (!b || (b.nodeType !== 1 && b.nodeType !== 9 && b.nodeType !== 11))
        throw Error(f(299));
      return h(D, b, null, S);
    }),
    (Ft.flushSync = function (D) {
      var b = g.T,
        S = s.p;
      try {
        if (((g.T = null), (s.p = 2), D)) return D();
      } finally {
        ((g.T = b), (s.p = S), s.d.f());
      }
    }),
    (Ft.preconnect = function (D, b) {
      typeof D == "string" &&
        (b
          ? ((b = b.crossOrigin),
            (b =
              typeof b == "string"
                ? b === "use-credentials"
                  ? b
                  : ""
                : void 0))
          : (b = null),
        s.d.C(D, b));
    }),
    (Ft.prefetchDNS = function (D) {
      typeof D == "string" && s.d.D(D);
    }),
    (Ft.preinit = function (D, b) {
      if (typeof D == "string" && b && typeof b.as == "string") {
        var S = b.as,
          C = z(S, b.crossOrigin),
          V = typeof b.integrity == "string" ? b.integrity : void 0,
          ft = typeof b.fetchPriority == "string" ? b.fetchPriority : void 0;
        S === "style"
          ? s.d.S(D, typeof b.precedence == "string" ? b.precedence : void 0, {
              crossOrigin: C,
              integrity: V,
              fetchPriority: ft,
            })
          : S === "script" &&
            s.d.X(D, {
              crossOrigin: C,
              integrity: V,
              fetchPriority: ft,
              nonce: typeof b.nonce == "string" ? b.nonce : void 0,
            });
      }
    }),
    (Ft.preinitModule = function (D, b) {
      if (typeof D == "string")
        if (typeof b == "object" && b !== null) {
          if (b.as == null || b.as === "script") {
            var S = z(b.as, b.crossOrigin);
            s.d.M(D, {
              crossOrigin: S,
              integrity: typeof b.integrity == "string" ? b.integrity : void 0,
              nonce: typeof b.nonce == "string" ? b.nonce : void 0,
            });
          }
        } else b == null && s.d.M(D);
    }),
    (Ft.preload = function (D, b) {
      if (
        typeof D == "string" &&
        typeof b == "object" &&
        b !== null &&
        typeof b.as == "string"
      ) {
        var S = b.as,
          C = z(S, b.crossOrigin);
        s.d.L(D, S, {
          crossOrigin: C,
          integrity: typeof b.integrity == "string" ? b.integrity : void 0,
          nonce: typeof b.nonce == "string" ? b.nonce : void 0,
          type: typeof b.type == "string" ? b.type : void 0,
          fetchPriority:
            typeof b.fetchPriority == "string" ? b.fetchPriority : void 0,
          referrerPolicy:
            typeof b.referrerPolicy == "string" ? b.referrerPolicy : void 0,
          imageSrcSet:
            typeof b.imageSrcSet == "string" ? b.imageSrcSet : void 0,
          imageSizes: typeof b.imageSizes == "string" ? b.imageSizes : void 0,
          media: typeof b.media == "string" ? b.media : void 0,
        });
      }
    }),
    (Ft.preloadModule = function (D, b) {
      if (typeof D == "string")
        if (b) {
          var S = z(b.as, b.crossOrigin);
          s.d.m(D, {
            as: typeof b.as == "string" && b.as !== "script" ? b.as : void 0,
            crossOrigin: S,
            integrity: typeof b.integrity == "string" ? b.integrity : void 0,
          });
        } else s.d.m(D);
    }),
    (Ft.requestFormReset = function (D) {
      s.d.r(D);
    }),
    (Ft.unstable_batchedUpdates = function (D, b) {
      return D(b);
    }),
    (Ft.useFormState = function (D, b, S) {
      return g.H.useFormState(D, b, S);
    }),
    (Ft.useFormStatus = function () {
      return g.H.useHostTransitionStatus();
    }),
    (Ft.version = "19.2.4"),
    Ft
  );
}
var sm;
function xy() {
  if (sm) return wf.exports;
  sm = 1;
  function c() {
    if (
      !(
        typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" ||
        typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"
      )
    )
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(c);
      } catch (f) {
        console.error(f);
      }
  }
  return (c(), (wf.exports = _y()), wf.exports);
}
var rm;
function Ry() {
  if (rm) return Cn;
  rm = 1;
  var c = Oy(),
    f = kf(),
    r = xy();
  function s(t) {
    var e = "https://react.dev/errors/" + t;
    if (1 < arguments.length) {
      e += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var l = 2; l < arguments.length; l++)
        e += "&args[]=" + encodeURIComponent(arguments[l]);
    }
    return (
      "Minified React error #" +
      t +
      "; visit " +
      e +
      " for the full message or use the non-minified dev environment for full errors and additional helpful warnings."
    );
  }
  function d(t) {
    return !(!t || (t.nodeType !== 1 && t.nodeType !== 9 && t.nodeType !== 11));
  }
  function h(t) {
    var e = t,
      l = t;
    if (t.alternate) for (; e.return; ) e = e.return;
    else {
      t = e;
      do ((e = t), (e.flags & 4098) !== 0 && (l = e.return), (t = e.return));
      while (t);
    }
    return e.tag === 3 ? l : null;
  }
  function g(t) {
    if (t.tag === 13) {
      var e = t.memoizedState;
      if (
        (e === null && ((t = t.alternate), t !== null && (e = t.memoizedState)),
        e !== null)
      )
        return e.dehydrated;
    }
    return null;
  }
  function z(t) {
    if (t.tag === 31) {
      var e = t.memoizedState;
      if (
        (e === null && ((t = t.alternate), t !== null && (e = t.memoizedState)),
        e !== null)
      )
        return e.dehydrated;
    }
    return null;
  }
  function D(t) {
    if (h(t) !== t) throw Error(s(188));
  }
  function b(t) {
    var e = t.alternate;
    if (!e) {
      if (((e = h(t)), e === null)) throw Error(s(188));
      return e !== t ? null : t;
    }
    for (var l = t, a = e; ; ) {
      var n = l.return;
      if (n === null) break;
      var u = n.alternate;
      if (u === null) {
        if (((a = n.return), a !== null)) {
          l = a;
          continue;
        }
        break;
      }
      if (n.child === u.child) {
        for (u = n.child; u; ) {
          if (u === l) return (D(n), t);
          if (u === a) return (D(n), e);
          u = u.sibling;
        }
        throw Error(s(188));
      }
      if (l.return !== a.return) ((l = n), (a = u));
      else {
        for (var i = !1, o = n.child; o; ) {
          if (o === l) {
            ((i = !0), (l = n), (a = u));
            break;
          }
          if (o === a) {
            ((i = !0), (a = n), (l = u));
            break;
          }
          o = o.sibling;
        }
        if (!i) {
          for (o = u.child; o; ) {
            if (o === l) {
              ((i = !0), (l = u), (a = n));
              break;
            }
            if (o === a) {
              ((i = !0), (a = u), (l = n));
              break;
            }
            o = o.sibling;
          }
          if (!i) throw Error(s(189));
        }
      }
      if (l.alternate !== a) throw Error(s(190));
    }
    if (l.tag !== 3) throw Error(s(188));
    return l.stateNode.current === l ? t : e;
  }
  function S(t) {
    var e = t.tag;
    if (e === 5 || e === 26 || e === 27 || e === 6) return t;
    for (t = t.child; t !== null; ) {
      if (((e = S(t)), e !== null)) return e;
      t = t.sibling;
    }
    return null;
  }
  var C = Object.assign,
    V = Symbol.for("react.element"),
    ft = Symbol.for("react.transitional.element"),
    H = Symbol.for("react.portal"),
    w = Symbol.for("react.fragment"),
    B = Symbol.for("react.strict_mode"),
    tt = Symbol.for("react.profiler"),
    xt = Symbol.for("react.consumer"),
    et = Symbol.for("react.context"),
    ht = Symbol.for("react.forward_ref"),
    Ot = Symbol.for("react.suspense"),
    q = Symbol.for("react.suspense_list"),
    G = Symbol.for("react.memo"),
    Et = Symbol.for("react.lazy"),
    Yt = Symbol.for("react.activity"),
    je = Symbol.for("react.memo_cache_sentinel"),
    re = Symbol.iterator;
  function Lt(t) {
    return t === null || typeof t != "object"
      ? null
      : ((t = (re && t[re]) || t["@@iterator"]),
        typeof t == "function" ? t : null);
  }
  var oe = Symbol.for("react.client.reference");
  function Xt(t) {
    if (t == null) return null;
    if (typeof t == "function")
      return t.$$typeof === oe ? null : t.displayName || t.name || null;
    if (typeof t == "string") return t;
    switch (t) {
      case w:
        return "Fragment";
      case tt:
        return "Profiler";
      case B:
        return "StrictMode";
      case Ot:
        return "Suspense";
      case q:
        return "SuspenseList";
      case Yt:
        return "Activity";
    }
    if (typeof t == "object")
      switch (t.$$typeof) {
        case H:
          return "Portal";
        case et:
          return t.displayName || "Context";
        case xt:
          return (t._context.displayName || "Context") + ".Consumer";
        case ht:
          var e = t.render;
          return (
            (t = t.displayName),
            t ||
              ((t = e.displayName || e.name || ""),
              (t = t !== "" ? "ForwardRef(" + t + ")" : "ForwardRef")),
            t
          );
        case G:
          return (
            (e = t.displayName || null),
            e !== null ? e : Xt(t.type) || "Memo"
          );
        case Et:
          ((e = t._payload), (t = t._init));
          try {
            return Xt(t(e));
          } catch {}
      }
    return null;
  }
  var te = Array.isArray,
    R = f.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
    Y = r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
    K = { pending: !1, data: null, method: null, action: null },
    ot = [],
    yt = -1;
  function y(t) {
    return { current: t };
  }
  function M(t) {
    0 > yt || ((t.current = ot[yt]), (ot[yt] = null), yt--);
  }
  function L(t, e) {
    (yt++, (ot[yt] = t.current), (t.current = e));
  }
  var Q = y(null),
    W = y(null),
    lt = y(null),
    mt = y(null);
  function It(t, e) {
    switch ((L(lt, e), L(W, t), L(Q, null), e.nodeType)) {
      case 9:
      case 11:
        t = (t = e.documentElement) && (t = t.namespaceURI) ? Od(t) : 0;
        break;
      default:
        if (((t = e.tagName), (e = e.namespaceURI)))
          ((e = Od(e)), (t = _d(e, t)));
        else
          switch (t) {
            case "svg":
              t = 1;
              break;
            case "math":
              t = 2;
              break;
            default:
              t = 0;
          }
    }
    (M(Q), L(Q, t));
  }
  function Dt() {
    (M(Q), M(W), M(lt));
  }
  function La(t) {
    t.memoizedState !== null && L(mt, t);
    var e = Q.current,
      l = _d(e, t.type);
    e !== l && (L(W, t), L(Q, l));
  }
  function Qn(t) {
    (W.current === t && (M(Q), M(W)),
      mt.current === t && (M(mt), (Nn._currentValue = K)));
  }
  var vi, ts;
  function Ul(t) {
    if (vi === void 0)
      try {
        throw Error();
      } catch (l) {
        var e = l.stack.trim().match(/\n( *(at )?)/);
        ((vi = (e && e[1]) || ""),
          (ts =
            -1 <
            l.stack.indexOf(`
    at`)
              ? " (<anonymous>)"
              : -1 < l.stack.indexOf("@")
                ? "@unknown:0:0"
                : ""));
      }
    return (
      `
` +
      vi +
      t +
      ts
    );
  }
  var gi = !1;
  function bi(t, e) {
    if (!t || gi) return "";
    gi = !0;
    var l = Error.prepareStackTrace;
    Error.prepareStackTrace = void 0;
    try {
      var a = {
        DetermineComponentFrameRoot: function () {
          try {
            if (e) {
              var j = function () {
                throw Error();
              };
              if (
                (Object.defineProperty(j.prototype, "props", {
                  set: function () {
                    throw Error();
                  },
                }),
                typeof Reflect == "object" && Reflect.construct)
              ) {
                try {
                  Reflect.construct(j, []);
                } catch (_) {
                  var A = _;
                }
                Reflect.construct(t, [], j);
              } else {
                try {
                  j.call();
                } catch (_) {
                  A = _;
                }
                t.call(j.prototype);
              }
            } else {
              try {
                throw Error();
              } catch (_) {
                A = _;
              }
              (j = t()) &&
                typeof j.catch == "function" &&
                j.catch(function () {});
            }
          } catch (_) {
            if (_ && A && typeof _.stack == "string") return [_.stack, A.stack];
          }
          return [null, null];
        },
      };
      a.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
      var n = Object.getOwnPropertyDescriptor(
        a.DetermineComponentFrameRoot,
        "name",
      );
      n &&
        n.configurable &&
        Object.defineProperty(a.DetermineComponentFrameRoot, "name", {
          value: "DetermineComponentFrameRoot",
        });
      var u = a.DetermineComponentFrameRoot(),
        i = u[0],
        o = u[1];
      if (i && o) {
        var m = i.split(`
`),
          T = o.split(`
`);
        for (
          n = a = 0;
          a < m.length && !m[a].includes("DetermineComponentFrameRoot");
        )
          a++;
        for (; n < T.length && !T[n].includes("DetermineComponentFrameRoot"); )
          n++;
        if (a === m.length || n === T.length)
          for (
            a = m.length - 1, n = T.length - 1;
            1 <= a && 0 <= n && m[a] !== T[n];
          )
            n--;
        for (; 1 <= a && 0 <= n; a--, n--)
          if (m[a] !== T[n]) {
            if (a !== 1 || n !== 1)
              do
                if ((a--, n--, 0 > n || m[a] !== T[n])) {
                  var N =
                    `
` + m[a].replace(" at new ", " at ");
                  return (
                    t.displayName &&
                      N.includes("<anonymous>") &&
                      (N = N.replace("<anonymous>", t.displayName)),
                    N
                  );
                }
              while (1 <= a && 0 <= n);
            break;
          }
      }
    } finally {
      ((gi = !1), (Error.prepareStackTrace = l));
    }
    return (l = t ? t.displayName || t.name : "") ? Ul(l) : "";
  }
  function $m(t, e) {
    switch (t.tag) {
      case 26:
      case 27:
      case 5:
        return Ul(t.type);
      case 16:
        return Ul("Lazy");
      case 13:
        return t.child !== e && e !== null
          ? Ul("Suspense Fallback")
          : Ul("Suspense");
      case 19:
        return Ul("SuspenseList");
      case 0:
      case 15:
        return bi(t.type, !1);
      case 11:
        return bi(t.type.render, !1);
      case 1:
        return bi(t.type, !0);
      case 31:
        return Ul("Activity");
      default:
        return "";
    }
  }
  function es(t) {
    try {
      var e = "",
        l = null;
      do ((e += $m(t, l)), (l = t), (t = t.return));
      while (t);
      return e;
    } catch (a) {
      return (
        `
Error generating stack: ` +
        a.message +
        `
` +
        a.stack
      );
    }
  }
  var pi = Object.prototype.hasOwnProperty,
    Si = c.unstable_scheduleCallback,
    Ei = c.unstable_cancelCallback,
    Im = c.unstable_shouldYield,
    Pm = c.unstable_requestPaint,
    de = c.unstable_now,
    th = c.unstable_getCurrentPriorityLevel,
    ls = c.unstable_ImmediatePriority,
    as = c.unstable_UserBlockingPriority,
    Xn = c.unstable_NormalPriority,
    eh = c.unstable_LowPriority,
    ns = c.unstable_IdlePriority,
    lh = c.log,
    ah = c.unstable_setDisableYieldValue,
    wa = null,
    me = null;
  function il(t) {
    if (
      (typeof lh == "function" && ah(t),
      me && typeof me.setStrictMode == "function")
    )
      try {
        me.setStrictMode(wa, t);
      } catch {}
  }
  var he = Math.clz32 ? Math.clz32 : ih,
    nh = Math.log,
    uh = Math.LN2;
  function ih(t) {
    return ((t >>>= 0), t === 0 ? 32 : (31 - ((nh(t) / uh) | 0)) | 0);
  }
  var Zn = 256,
    Vn = 262144,
    Kn = 4194304;
  function Ml(t) {
    var e = t & 42;
    if (e !== 0) return e;
    switch (t & -t) {
      case 1:
        return 1;
      case 2:
        return 2;
      case 4:
        return 4;
      case 8:
        return 8;
      case 16:
        return 16;
      case 32:
        return 32;
      case 64:
        return 64;
      case 128:
        return 128;
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
        return t & 261888;
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return t & 3932160;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        return t & 62914560;
      case 67108864:
        return 67108864;
      case 134217728:
        return 134217728;
      case 268435456:
        return 268435456;
      case 536870912:
        return 536870912;
      case 1073741824:
        return 0;
      default:
        return t;
    }
  }
  function Jn(t, e, l) {
    var a = t.pendingLanes;
    if (a === 0) return 0;
    var n = 0,
      u = t.suspendedLanes,
      i = t.pingedLanes;
    t = t.warmLanes;
    var o = a & 134217727;
    return (
      o !== 0
        ? ((a = o & ~u),
          a !== 0
            ? (n = Ml(a))
            : ((i &= o),
              i !== 0
                ? (n = Ml(i))
                : l || ((l = o & ~t), l !== 0 && (n = Ml(l)))))
        : ((o = a & ~u),
          o !== 0
            ? (n = Ml(o))
            : i !== 0
              ? (n = Ml(i))
              : l || ((l = a & ~t), l !== 0 && (n = Ml(l)))),
      n === 0
        ? 0
        : e !== 0 &&
            e !== n &&
            (e & u) === 0 &&
            ((u = n & -n),
            (l = e & -e),
            u >= l || (u === 32 && (l & 4194048) !== 0))
          ? e
          : n
    );
  }
  function Ga(t, e) {
    return (t.pendingLanes & ~(t.suspendedLanes & ~t.pingedLanes) & e) === 0;
  }
  function ch(t, e) {
    switch (t) {
      case 1:
      case 2:
      case 4:
      case 8:
      case 64:
        return e + 250;
      case 16:
      case 32:
      case 128:
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return e + 5e3;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        return -1;
      case 67108864:
      case 134217728:
      case 268435456:
      case 536870912:
      case 1073741824:
        return -1;
      default:
        return -1;
    }
  }
  function us() {
    var t = Kn;
    return ((Kn <<= 1), (Kn & 62914560) === 0 && (Kn = 4194304), t);
  }
  function Ti(t) {
    for (var e = [], l = 0; 31 > l; l++) e.push(t);
    return e;
  }
  function Qa(t, e) {
    ((t.pendingLanes |= e),
      e !== 268435456 &&
        ((t.suspendedLanes = 0), (t.pingedLanes = 0), (t.warmLanes = 0)));
  }
  function fh(t, e, l, a, n, u) {
    var i = t.pendingLanes;
    ((t.pendingLanes = l),
      (t.suspendedLanes = 0),
      (t.pingedLanes = 0),
      (t.warmLanes = 0),
      (t.expiredLanes &= l),
      (t.entangledLanes &= l),
      (t.errorRecoveryDisabledLanes &= l),
      (t.shellSuspendCounter = 0));
    var o = t.entanglements,
      m = t.expirationTimes,
      T = t.hiddenUpdates;
    for (l = i & ~l; 0 < l; ) {
      var N = 31 - he(l),
        j = 1 << N;
      ((o[N] = 0), (m[N] = -1));
      var A = T[N];
      if (A !== null)
        for (T[N] = null, N = 0; N < A.length; N++) {
          var _ = A[N];
          _ !== null && (_.lane &= -536870913);
        }
      l &= ~j;
    }
    (a !== 0 && is(t, a, 0),
      u !== 0 && n === 0 && t.tag !== 0 && (t.suspendedLanes |= u & ~(i & ~e)));
  }
  function is(t, e, l) {
    ((t.pendingLanes |= e), (t.suspendedLanes &= ~e));
    var a = 31 - he(e);
    ((t.entangledLanes |= e),
      (t.entanglements[a] = t.entanglements[a] | 1073741824 | (l & 261930)));
  }
  function cs(t, e) {
    var l = (t.entangledLanes |= e);
    for (t = t.entanglements; l; ) {
      var a = 31 - he(l),
        n = 1 << a;
      ((n & e) | (t[a] & e) && (t[a] |= e), (l &= ~n));
    }
  }
  function fs(t, e) {
    var l = e & -e;
    return (
      (l = (l & 42) !== 0 ? 1 : Ai(l)),
      (l & (t.suspendedLanes | e)) !== 0 ? 0 : l
    );
  }
  function Ai(t) {
    switch (t) {
      case 2:
        t = 1;
        break;
      case 8:
        t = 4;
        break;
      case 32:
        t = 16;
        break;
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        t = 128;
        break;
      case 268435456:
        t = 134217728;
        break;
      default:
        t = 0;
    }
    return t;
  }
  function zi(t) {
    return (
      (t &= -t),
      2 < t ? (8 < t ? ((t & 134217727) !== 0 ? 32 : 268435456) : 8) : 2
    );
  }
  function ss() {
    var t = Y.p;
    return t !== 0 ? t : ((t = window.event), t === void 0 ? 32 : Fd(t.type));
  }
  function rs(t, e) {
    var l = Y.p;
    try {
      return ((Y.p = t), e());
    } finally {
      Y.p = l;
    }
  }
  var cl = Math.random().toString(36).slice(2),
    Zt = "__reactFiber$" + cl,
    ee = "__reactProps$" + cl,
    Pl = "__reactContainer$" + cl,
    Oi = "__reactEvents$" + cl,
    sh = "__reactListeners$" + cl,
    rh = "__reactHandles$" + cl,
    os = "__reactResources$" + cl,
    Xa = "__reactMarker$" + cl;
  function _i(t) {
    (delete t[Zt], delete t[ee], delete t[Oi], delete t[sh], delete t[rh]);
  }
  function ta(t) {
    var e = t[Zt];
    if (e) return e;
    for (var l = t.parentNode; l; ) {
      if ((e = l[Pl] || l[Zt])) {
        if (
          ((l = e.alternate),
          e.child !== null || (l !== null && l.child !== null))
        )
          for (t = jd(t); t !== null; ) {
            if ((l = t[Zt])) return l;
            t = jd(t);
          }
        return e;
      }
      ((t = l), (l = t.parentNode));
    }
    return null;
  }
  function ea(t) {
    if ((t = t[Zt] || t[Pl])) {
      var e = t.tag;
      if (
        e === 5 ||
        e === 6 ||
        e === 13 ||
        e === 31 ||
        e === 26 ||
        e === 27 ||
        e === 3
      )
        return t;
    }
    return null;
  }
  function Za(t) {
    var e = t.tag;
    if (e === 5 || e === 26 || e === 27 || e === 6) return t.stateNode;
    throw Error(s(33));
  }
  function la(t) {
    var e = t[os];
    return (
      e ||
        (e = t[os] =
          { hoistableStyles: new Map(), hoistableScripts: new Map() }),
      e
    );
  }
  function Gt(t) {
    t[Xa] = !0;
  }
  var ds = new Set(),
    ms = {};
  function jl(t, e) {
    (aa(t, e), aa(t + "Capture", e));
  }
  function aa(t, e) {
    for (ms[t] = e, t = 0; t < e.length; t++) ds.add(e[t]);
  }
  var oh = RegExp(
      "^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$",
    ),
    hs = {},
    ys = {};
  function dh(t) {
    return pi.call(ys, t)
      ? !0
      : pi.call(hs, t)
        ? !1
        : oh.test(t)
          ? (ys[t] = !0)
          : ((hs[t] = !0), !1);
  }
  function kn(t, e, l) {
    if (dh(e))
      if (l === null) t.removeAttribute(e);
      else {
        switch (typeof l) {
          case "undefined":
          case "function":
          case "symbol":
            t.removeAttribute(e);
            return;
          case "boolean":
            var a = e.toLowerCase().slice(0, 5);
            if (a !== "data-" && a !== "aria-") {
              t.removeAttribute(e);
              return;
            }
        }
        t.setAttribute(e, "" + l);
      }
  }
  function Fn(t, e, l) {
    if (l === null) t.removeAttribute(e);
    else {
      switch (typeof l) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean":
          t.removeAttribute(e);
          return;
      }
      t.setAttribute(e, "" + l);
    }
  }
  function Qe(t, e, l, a) {
    if (a === null) t.removeAttribute(l);
    else {
      switch (typeof a) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean":
          t.removeAttribute(l);
          return;
      }
      t.setAttributeNS(e, l, "" + a);
    }
  }
  function Te(t) {
    switch (typeof t) {
      case "bigint":
      case "boolean":
      case "number":
      case "string":
      case "undefined":
        return t;
      case "object":
        return t;
      default:
        return "";
    }
  }
  function vs(t) {
    var e = t.type;
    return (
      (t = t.nodeName) &&
      t.toLowerCase() === "input" &&
      (e === "checkbox" || e === "radio")
    );
  }
  function mh(t, e, l) {
    var a = Object.getOwnPropertyDescriptor(t.constructor.prototype, e);
    if (
      !t.hasOwnProperty(e) &&
      typeof a < "u" &&
      typeof a.get == "function" &&
      typeof a.set == "function"
    ) {
      var n = a.get,
        u = a.set;
      return (
        Object.defineProperty(t, e, {
          configurable: !0,
          get: function () {
            return n.call(this);
          },
          set: function (i) {
            ((l = "" + i), u.call(this, i));
          },
        }),
        Object.defineProperty(t, e, { enumerable: a.enumerable }),
        {
          getValue: function () {
            return l;
          },
          setValue: function (i) {
            l = "" + i;
          },
          stopTracking: function () {
            ((t._valueTracker = null), delete t[e]);
          },
        }
      );
    }
  }
  function xi(t) {
    if (!t._valueTracker) {
      var e = vs(t) ? "checked" : "value";
      t._valueTracker = mh(t, e, "" + t[e]);
    }
  }
  function gs(t) {
    if (!t) return !1;
    var e = t._valueTracker;
    if (!e) return !0;
    var l = e.getValue(),
      a = "";
    return (
      t && (a = vs(t) ? (t.checked ? "true" : "false") : t.value),
      (t = a),
      t !== l ? (e.setValue(t), !0) : !1
    );
  }
  function Wn(t) {
    if (
      ((t = t || (typeof document < "u" ? document : void 0)), typeof t > "u")
    )
      return null;
    try {
      return t.activeElement || t.body;
    } catch {
      return t.body;
    }
  }
  var hh = /[\n"\\]/g;
  function Ae(t) {
    return t.replace(hh, function (e) {
      return "\\" + e.charCodeAt(0).toString(16) + " ";
    });
  }
  function Ri(t, e, l, a, n, u, i, o) {
    ((t.name = ""),
      i != null &&
      typeof i != "function" &&
      typeof i != "symbol" &&
      typeof i != "boolean"
        ? (t.type = i)
        : t.removeAttribute("type"),
      e != null
        ? i === "number"
          ? ((e === 0 && t.value === "") || t.value != e) &&
            (t.value = "" + Te(e))
          : t.value !== "" + Te(e) && (t.value = "" + Te(e))
        : (i !== "submit" && i !== "reset") || t.removeAttribute("value"),
      e != null
        ? Ni(t, i, Te(e))
        : l != null
          ? Ni(t, i, Te(l))
          : a != null && t.removeAttribute("value"),
      n == null && u != null && (t.defaultChecked = !!u),
      n != null &&
        (t.checked = n && typeof n != "function" && typeof n != "symbol"),
      o != null &&
      typeof o != "function" &&
      typeof o != "symbol" &&
      typeof o != "boolean"
        ? (t.name = "" + Te(o))
        : t.removeAttribute("name"));
  }
  function bs(t, e, l, a, n, u, i, o) {
    if (
      (u != null &&
        typeof u != "function" &&
        typeof u != "symbol" &&
        typeof u != "boolean" &&
        (t.type = u),
      e != null || l != null)
    ) {
      if (!((u !== "submit" && u !== "reset") || e != null)) {
        xi(t);
        return;
      }
      ((l = l != null ? "" + Te(l) : ""),
        (e = e != null ? "" + Te(e) : l),
        o || e === t.value || (t.value = e),
        (t.defaultValue = e));
    }
    ((a = a ?? n),
      (a = typeof a != "function" && typeof a != "symbol" && !!a),
      (t.checked = o ? t.checked : !!a),
      (t.defaultChecked = !!a),
      i != null &&
        typeof i != "function" &&
        typeof i != "symbol" &&
        typeof i != "boolean" &&
        (t.name = i),
      xi(t));
  }
  function Ni(t, e, l) {
    (e === "number" && Wn(t.ownerDocument) === t) ||
      t.defaultValue === "" + l ||
      (t.defaultValue = "" + l);
  }
  function na(t, e, l, a) {
    if (((t = t.options), e)) {
      e = {};
      for (var n = 0; n < l.length; n++) e["$" + l[n]] = !0;
      for (l = 0; l < t.length; l++)
        ((n = e.hasOwnProperty("$" + t[l].value)),
          t[l].selected !== n && (t[l].selected = n),
          n && a && (t[l].defaultSelected = !0));
    } else {
      for (l = "" + Te(l), e = null, n = 0; n < t.length; n++) {
        if (t[n].value === l) {
          ((t[n].selected = !0), a && (t[n].defaultSelected = !0));
          return;
        }
        e !== null || t[n].disabled || (e = t[n]);
      }
      e !== null && (e.selected = !0);
    }
  }
  function ps(t, e, l) {
    if (
      e != null &&
      ((e = "" + Te(e)), e !== t.value && (t.value = e), l == null)
    ) {
      t.defaultValue !== e && (t.defaultValue = e);
      return;
    }
    t.defaultValue = l != null ? "" + Te(l) : "";
  }
  function Ss(t, e, l, a) {
    if (e == null) {
      if (a != null) {
        if (l != null) throw Error(s(92));
        if (te(a)) {
          if (1 < a.length) throw Error(s(93));
          a = a[0];
        }
        l = a;
      }
      (l == null && (l = ""), (e = l));
    }
    ((l = Te(e)),
      (t.defaultValue = l),
      (a = t.textContent),
      a === l && a !== "" && a !== null && (t.value = a),
      xi(t));
  }
  function ua(t, e) {
    if (e) {
      var l = t.firstChild;
      if (l && l === t.lastChild && l.nodeType === 3) {
        l.nodeValue = e;
        return;
      }
    }
    t.textContent = e;
  }
  var yh = new Set(
    "animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(
      " ",
    ),
  );
  function Es(t, e, l) {
    var a = e.indexOf("--") === 0;
    l == null || typeof l == "boolean" || l === ""
      ? a
        ? t.setProperty(e, "")
        : e === "float"
          ? (t.cssFloat = "")
          : (t[e] = "")
      : a
        ? t.setProperty(e, l)
        : typeof l != "number" || l === 0 || yh.has(e)
          ? e === "float"
            ? (t.cssFloat = l)
            : (t[e] = ("" + l).trim())
          : (t[e] = l + "px");
  }
  function Ts(t, e, l) {
    if (e != null && typeof e != "object") throw Error(s(62));
    if (((t = t.style), l != null)) {
      for (var a in l)
        !l.hasOwnProperty(a) ||
          (e != null && e.hasOwnProperty(a)) ||
          (a.indexOf("--") === 0
            ? t.setProperty(a, "")
            : a === "float"
              ? (t.cssFloat = "")
              : (t[a] = ""));
      for (var n in e)
        ((a = e[n]), e.hasOwnProperty(n) && l[n] !== a && Es(t, n, a));
    } else for (var u in e) e.hasOwnProperty(u) && Es(t, u, e[u]);
  }
  function Di(t) {
    if (t.indexOf("-") === -1) return !1;
    switch (t) {
      case "annotation-xml":
      case "color-profile":
      case "font-face":
      case "font-face-src":
      case "font-face-uri":
      case "font-face-format":
      case "font-face-name":
      case "missing-glyph":
        return !1;
      default:
        return !0;
    }
  }
  var vh = new Map([
      ["acceptCharset", "accept-charset"],
      ["htmlFor", "for"],
      ["httpEquiv", "http-equiv"],
      ["crossOrigin", "crossorigin"],
      ["accentHeight", "accent-height"],
      ["alignmentBaseline", "alignment-baseline"],
      ["arabicForm", "arabic-form"],
      ["baselineShift", "baseline-shift"],
      ["capHeight", "cap-height"],
      ["clipPath", "clip-path"],
      ["clipRule", "clip-rule"],
      ["colorInterpolation", "color-interpolation"],
      ["colorInterpolationFilters", "color-interpolation-filters"],
      ["colorProfile", "color-profile"],
      ["colorRendering", "color-rendering"],
      ["dominantBaseline", "dominant-baseline"],
      ["enableBackground", "enable-background"],
      ["fillOpacity", "fill-opacity"],
      ["fillRule", "fill-rule"],
      ["floodColor", "flood-color"],
      ["floodOpacity", "flood-opacity"],
      ["fontFamily", "font-family"],
      ["fontSize", "font-size"],
      ["fontSizeAdjust", "font-size-adjust"],
      ["fontStretch", "font-stretch"],
      ["fontStyle", "font-style"],
      ["fontVariant", "font-variant"],
      ["fontWeight", "font-weight"],
      ["glyphName", "glyph-name"],
      ["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
      ["glyphOrientationVertical", "glyph-orientation-vertical"],
      ["horizAdvX", "horiz-adv-x"],
      ["horizOriginX", "horiz-origin-x"],
      ["imageRendering", "image-rendering"],
      ["letterSpacing", "letter-spacing"],
      ["lightingColor", "lighting-color"],
      ["markerEnd", "marker-end"],
      ["markerMid", "marker-mid"],
      ["markerStart", "marker-start"],
      ["overlinePosition", "overline-position"],
      ["overlineThickness", "overline-thickness"],
      ["paintOrder", "paint-order"],
      ["panose-1", "panose-1"],
      ["pointerEvents", "pointer-events"],
      ["renderingIntent", "rendering-intent"],
      ["shapeRendering", "shape-rendering"],
      ["stopColor", "stop-color"],
      ["stopOpacity", "stop-opacity"],
      ["strikethroughPosition", "strikethrough-position"],
      ["strikethroughThickness", "strikethrough-thickness"],
      ["strokeDasharray", "stroke-dasharray"],
      ["strokeDashoffset", "stroke-dashoffset"],
      ["strokeLinecap", "stroke-linecap"],
      ["strokeLinejoin", "stroke-linejoin"],
      ["strokeMiterlimit", "stroke-miterlimit"],
      ["strokeOpacity", "stroke-opacity"],
      ["strokeWidth", "stroke-width"],
      ["textAnchor", "text-anchor"],
      ["textDecoration", "text-decoration"],
      ["textRendering", "text-rendering"],
      ["transformOrigin", "transform-origin"],
      ["underlinePosition", "underline-position"],
      ["underlineThickness", "underline-thickness"],
      ["unicodeBidi", "unicode-bidi"],
      ["unicodeRange", "unicode-range"],
      ["unitsPerEm", "units-per-em"],
      ["vAlphabetic", "v-alphabetic"],
      ["vHanging", "v-hanging"],
      ["vIdeographic", "v-ideographic"],
      ["vMathematical", "v-mathematical"],
      ["vectorEffect", "vector-effect"],
      ["vertAdvY", "vert-adv-y"],
      ["vertOriginX", "vert-origin-x"],
      ["vertOriginY", "vert-origin-y"],
      ["wordSpacing", "word-spacing"],
      ["writingMode", "writing-mode"],
      ["xmlnsXlink", "xmlns:xlink"],
      ["xHeight", "x-height"],
    ]),
    gh =
      /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
  function $n(t) {
    return gh.test("" + t)
      ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')"
      : t;
  }
  function Xe() {}
  var Ui = null;
  function Mi(t) {
    return (
      (t = t.target || t.srcElement || window),
      t.correspondingUseElement && (t = t.correspondingUseElement),
      t.nodeType === 3 ? t.parentNode : t
    );
  }
  var ia = null,
    ca = null;
  function As(t) {
    var e = ea(t);
    if (e && (t = e.stateNode)) {
      var l = t[ee] || null;
      t: switch (((t = e.stateNode), e.type)) {
        case "input":
          if (
            (Ri(
              t,
              l.value,
              l.defaultValue,
              l.defaultValue,
              l.checked,
              l.defaultChecked,
              l.type,
              l.name,
            ),
            (e = l.name),
            l.type === "radio" && e != null)
          ) {
            for (l = t; l.parentNode; ) l = l.parentNode;
            for (
              l = l.querySelectorAll(
                'input[name="' + Ae("" + e) + '"][type="radio"]',
              ),
                e = 0;
              e < l.length;
              e++
            ) {
              var a = l[e];
              if (a !== t && a.form === t.form) {
                var n = a[ee] || null;
                if (!n) throw Error(s(90));
                Ri(
                  a,
                  n.value,
                  n.defaultValue,
                  n.defaultValue,
                  n.checked,
                  n.defaultChecked,
                  n.type,
                  n.name,
                );
              }
            }
            for (e = 0; e < l.length; e++)
              ((a = l[e]), a.form === t.form && gs(a));
          }
          break t;
        case "textarea":
          ps(t, l.value, l.defaultValue);
          break t;
        case "select":
          ((e = l.value), e != null && na(t, !!l.multiple, e, !1));
      }
    }
  }
  var ji = !1;
  function zs(t, e, l) {
    if (ji) return t(e, l);
    ji = !0;
    try {
      var a = t(e);
      return a;
    } finally {
      if (
        ((ji = !1),
        (ia !== null || ca !== null) &&
          (Yu(), ia && ((e = ia), (t = ca), (ca = ia = null), As(e), t)))
      )
        for (e = 0; e < t.length; e++) As(t[e]);
    }
  }
  function Va(t, e) {
    var l = t.stateNode;
    if (l === null) return null;
    var a = l[ee] || null;
    if (a === null) return null;
    l = a[e];
    t: switch (e) {
      case "onClick":
      case "onClickCapture":
      case "onDoubleClick":
      case "onDoubleClickCapture":
      case "onMouseDown":
      case "onMouseDownCapture":
      case "onMouseMove":
      case "onMouseMoveCapture":
      case "onMouseUp":
      case "onMouseUpCapture":
      case "onMouseEnter":
        ((a = !a.disabled) ||
          ((t = t.type),
          (a = !(
            t === "button" ||
            t === "input" ||
            t === "select" ||
            t === "textarea"
          ))),
          (t = !a));
        break t;
      default:
        t = !1;
    }
    if (t) return null;
    if (l && typeof l != "function") throw Error(s(231, e, typeof l));
    return l;
  }
  var Ze = !(
      typeof window > "u" ||
      typeof window.document > "u" ||
      typeof window.document.createElement > "u"
    ),
    Ci = !1;
  if (Ze)
    try {
      var Ka = {};
      (Object.defineProperty(Ka, "passive", {
        get: function () {
          Ci = !0;
        },
      }),
        window.addEventListener("test", Ka, Ka),
        window.removeEventListener("test", Ka, Ka));
    } catch {
      Ci = !1;
    }
  var fl = null,
    Hi = null,
    In = null;
  function Os() {
    if (In) return In;
    var t,
      e = Hi,
      l = e.length,
      a,
      n = "value" in fl ? fl.value : fl.textContent,
      u = n.length;
    for (t = 0; t < l && e[t] === n[t]; t++);
    var i = l - t;
    for (a = 1; a <= i && e[l - a] === n[u - a]; a++);
    return (In = n.slice(t, 1 < a ? 1 - a : void 0));
  }
  function Pn(t) {
    var e = t.keyCode;
    return (
      "charCode" in t
        ? ((t = t.charCode), t === 0 && e === 13 && (t = 13))
        : (t = e),
      t === 10 && (t = 13),
      32 <= t || t === 13 ? t : 0
    );
  }
  function tu() {
    return !0;
  }
  function _s() {
    return !1;
  }
  function le(t) {
    function e(l, a, n, u, i) {
      ((this._reactName = l),
        (this._targetInst = n),
        (this.type = a),
        (this.nativeEvent = u),
        (this.target = i),
        (this.currentTarget = null));
      for (var o in t)
        t.hasOwnProperty(o) && ((l = t[o]), (this[o] = l ? l(u) : u[o]));
      return (
        (this.isDefaultPrevented = (
          u.defaultPrevented != null ? u.defaultPrevented : u.returnValue === !1
        )
          ? tu
          : _s),
        (this.isPropagationStopped = _s),
        this
      );
    }
    return (
      C(e.prototype, {
        preventDefault: function () {
          this.defaultPrevented = !0;
          var l = this.nativeEvent;
          l &&
            (l.preventDefault
              ? l.preventDefault()
              : typeof l.returnValue != "unknown" && (l.returnValue = !1),
            (this.isDefaultPrevented = tu));
        },
        stopPropagation: function () {
          var l = this.nativeEvent;
          l &&
            (l.stopPropagation
              ? l.stopPropagation()
              : typeof l.cancelBubble != "unknown" && (l.cancelBubble = !0),
            (this.isPropagationStopped = tu));
        },
        persist: function () {},
        isPersistent: tu,
      }),
      e
    );
  }
  var Cl = {
      eventPhase: 0,
      bubbles: 0,
      cancelable: 0,
      timeStamp: function (t) {
        return t.timeStamp || Date.now();
      },
      defaultPrevented: 0,
      isTrusted: 0,
    },
    eu = le(Cl),
    Ja = C({}, Cl, { view: 0, detail: 0 }),
    bh = le(Ja),
    qi,
    Bi,
    ka,
    lu = C({}, Ja, {
      screenX: 0,
      screenY: 0,
      clientX: 0,
      clientY: 0,
      pageX: 0,
      pageY: 0,
      ctrlKey: 0,
      shiftKey: 0,
      altKey: 0,
      metaKey: 0,
      getModifierState: Li,
      button: 0,
      buttons: 0,
      relatedTarget: function (t) {
        return t.relatedTarget === void 0
          ? t.fromElement === t.srcElement
            ? t.toElement
            : t.fromElement
          : t.relatedTarget;
      },
      movementX: function (t) {
        return "movementX" in t
          ? t.movementX
          : (t !== ka &&
              (ka && t.type === "mousemove"
                ? ((qi = t.screenX - ka.screenX), (Bi = t.screenY - ka.screenY))
                : (Bi = qi = 0),
              (ka = t)),
            qi);
      },
      movementY: function (t) {
        return "movementY" in t ? t.movementY : Bi;
      },
    }),
    xs = le(lu),
    ph = C({}, lu, { dataTransfer: 0 }),
    Sh = le(ph),
    Eh = C({}, Ja, { relatedTarget: 0 }),
    Yi = le(Eh),
    Th = C({}, Cl, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }),
    Ah = le(Th),
    zh = C({}, Cl, {
      clipboardData: function (t) {
        return "clipboardData" in t ? t.clipboardData : window.clipboardData;
      },
    }),
    Oh = le(zh),
    _h = C({}, Cl, { data: 0 }),
    Rs = le(_h),
    xh = {
      Esc: "Escape",
      Spacebar: " ",
      Left: "ArrowLeft",
      Up: "ArrowUp",
      Right: "ArrowRight",
      Down: "ArrowDown",
      Del: "Delete",
      Win: "OS",
      Menu: "ContextMenu",
      Apps: "ContextMenu",
      Scroll: "ScrollLock",
      MozPrintableKey: "Unidentified",
    },
    Rh = {
      8: "Backspace",
      9: "Tab",
      12: "Clear",
      13: "Enter",
      16: "Shift",
      17: "Control",
      18: "Alt",
      19: "Pause",
      20: "CapsLock",
      27: "Escape",
      32: " ",
      33: "PageUp",
      34: "PageDown",
      35: "End",
      36: "Home",
      37: "ArrowLeft",
      38: "ArrowUp",
      39: "ArrowRight",
      40: "ArrowDown",
      45: "Insert",
      46: "Delete",
      112: "F1",
      113: "F2",
      114: "F3",
      115: "F4",
      116: "F5",
      117: "F6",
      118: "F7",
      119: "F8",
      120: "F9",
      121: "F10",
      122: "F11",
      123: "F12",
      144: "NumLock",
      145: "ScrollLock",
      224: "Meta",
    },
    Nh = {
      Alt: "altKey",
      Control: "ctrlKey",
      Meta: "metaKey",
      Shift: "shiftKey",
    };
  function Dh(t) {
    var e = this.nativeEvent;
    return e.getModifierState
      ? e.getModifierState(t)
      : (t = Nh[t])
        ? !!e[t]
        : !1;
  }
  function Li() {
    return Dh;
  }
  var Uh = C({}, Ja, {
      key: function (t) {
        if (t.key) {
          var e = xh[t.key] || t.key;
          if (e !== "Unidentified") return e;
        }
        return t.type === "keypress"
          ? ((t = Pn(t)), t === 13 ? "Enter" : String.fromCharCode(t))
          : t.type === "keydown" || t.type === "keyup"
            ? Rh[t.keyCode] || "Unidentified"
            : "";
      },
      code: 0,
      location: 0,
      ctrlKey: 0,
      shiftKey: 0,
      altKey: 0,
      metaKey: 0,
      repeat: 0,
      locale: 0,
      getModifierState: Li,
      charCode: function (t) {
        return t.type === "keypress" ? Pn(t) : 0;
      },
      keyCode: function (t) {
        return t.type === "keydown" || t.type === "keyup" ? t.keyCode : 0;
      },
      which: function (t) {
        return t.type === "keypress"
          ? Pn(t)
          : t.type === "keydown" || t.type === "keyup"
            ? t.keyCode
            : 0;
      },
    }),
    Mh = le(Uh),
    jh = C({}, lu, {
      pointerId: 0,
      width: 0,
      height: 0,
      pressure: 0,
      tangentialPressure: 0,
      tiltX: 0,
      tiltY: 0,
      twist: 0,
      pointerType: 0,
      isPrimary: 0,
    }),
    Ns = le(jh),
    Ch = C({}, Ja, {
      touches: 0,
      targetTouches: 0,
      changedTouches: 0,
      altKey: 0,
      metaKey: 0,
      ctrlKey: 0,
      shiftKey: 0,
      getModifierState: Li,
    }),
    Hh = le(Ch),
    qh = C({}, Cl, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }),
    Bh = le(qh),
    Yh = C({}, lu, {
      deltaX: function (t) {
        return "deltaX" in t
          ? t.deltaX
          : "wheelDeltaX" in t
            ? -t.wheelDeltaX
            : 0;
      },
      deltaY: function (t) {
        return "deltaY" in t
          ? t.deltaY
          : "wheelDeltaY" in t
            ? -t.wheelDeltaY
            : "wheelDelta" in t
              ? -t.wheelDelta
              : 0;
      },
      deltaZ: 0,
      deltaMode: 0,
    }),
    Lh = le(Yh),
    wh = C({}, Cl, { newState: 0, oldState: 0 }),
    Gh = le(wh),
    Qh = [9, 13, 27, 32],
    wi = Ze && "CompositionEvent" in window,
    Fa = null;
  Ze && "documentMode" in document && (Fa = document.documentMode);
  var Xh = Ze && "TextEvent" in window && !Fa,
    Ds = Ze && (!wi || (Fa && 8 < Fa && 11 >= Fa)),
    Us = " ",
    Ms = !1;
  function js(t, e) {
    switch (t) {
      case "keyup":
        return Qh.indexOf(e.keyCode) !== -1;
      case "keydown":
        return e.keyCode !== 229;
      case "keypress":
      case "mousedown":
      case "focusout":
        return !0;
      default:
        return !1;
    }
  }
  function Cs(t) {
    return (
      (t = t.detail),
      typeof t == "object" && "data" in t ? t.data : null
    );
  }
  var fa = !1;
  function Zh(t, e) {
    switch (t) {
      case "compositionend":
        return Cs(e);
      case "keypress":
        return e.which !== 32 ? null : ((Ms = !0), Us);
      case "textInput":
        return ((t = e.data), t === Us && Ms ? null : t);
      default:
        return null;
    }
  }
  function Vh(t, e) {
    if (fa)
      return t === "compositionend" || (!wi && js(t, e))
        ? ((t = Os()), (In = Hi = fl = null), (fa = !1), t)
        : null;
    switch (t) {
      case "paste":
        return null;
      case "keypress":
        if (!(e.ctrlKey || e.altKey || e.metaKey) || (e.ctrlKey && e.altKey)) {
          if (e.char && 1 < e.char.length) return e.char;
          if (e.which) return String.fromCharCode(e.which);
        }
        return null;
      case "compositionend":
        return Ds && e.locale !== "ko" ? null : e.data;
      default:
        return null;
    }
  }
  var Kh = {
    color: !0,
    date: !0,
    datetime: !0,
    "datetime-local": !0,
    email: !0,
    month: !0,
    number: !0,
    password: !0,
    range: !0,
    search: !0,
    tel: !0,
    text: !0,
    time: !0,
    url: !0,
    week: !0,
  };
  function Hs(t) {
    var e = t && t.nodeName && t.nodeName.toLowerCase();
    return e === "input" ? !!Kh[t.type] : e === "textarea";
  }
  function qs(t, e, l, a) {
    (ia ? (ca ? ca.push(a) : (ca = [a])) : (ia = a),
      (e = Vu(e, "onChange")),
      0 < e.length &&
        ((l = new eu("onChange", "change", null, l, a)),
        t.push({ event: l, listeners: e })));
  }
  var Wa = null,
    $a = null;
  function Jh(t) {
    pd(t, 0);
  }
  function au(t) {
    var e = Za(t);
    if (gs(e)) return t;
  }
  function Bs(t, e) {
    if (t === "change") return e;
  }
  var Ys = !1;
  if (Ze) {
    var Gi;
    if (Ze) {
      var Qi = "oninput" in document;
      if (!Qi) {
        var Ls = document.createElement("div");
        (Ls.setAttribute("oninput", "return;"),
          (Qi = typeof Ls.oninput == "function"));
      }
      Gi = Qi;
    } else Gi = !1;
    Ys = Gi && (!document.documentMode || 9 < document.documentMode);
  }
  function ws() {
    Wa && (Wa.detachEvent("onpropertychange", Gs), ($a = Wa = null));
  }
  function Gs(t) {
    if (t.propertyName === "value" && au($a)) {
      var e = [];
      (qs(e, $a, t, Mi(t)), zs(Jh, e));
    }
  }
  function kh(t, e, l) {
    t === "focusin"
      ? (ws(), (Wa = e), ($a = l), Wa.attachEvent("onpropertychange", Gs))
      : t === "focusout" && ws();
  }
  function Fh(t) {
    if (t === "selectionchange" || t === "keyup" || t === "keydown")
      return au($a);
  }
  function Wh(t, e) {
    if (t === "click") return au(e);
  }
  function $h(t, e) {
    if (t === "input" || t === "change") return au(e);
  }
  function Ih(t, e) {
    return (t === e && (t !== 0 || 1 / t === 1 / e)) || (t !== t && e !== e);
  }
  var ye = typeof Object.is == "function" ? Object.is : Ih;
  function Ia(t, e) {
    if (ye(t, e)) return !0;
    if (
      typeof t != "object" ||
      t === null ||
      typeof e != "object" ||
      e === null
    )
      return !1;
    var l = Object.keys(t),
      a = Object.keys(e);
    if (l.length !== a.length) return !1;
    for (a = 0; a < l.length; a++) {
      var n = l[a];
      if (!pi.call(e, n) || !ye(t[n], e[n])) return !1;
    }
    return !0;
  }
  function Qs(t) {
    for (; t && t.firstChild; ) t = t.firstChild;
    return t;
  }
  function Xs(t, e) {
    var l = Qs(t);
    t = 0;
    for (var a; l; ) {
      if (l.nodeType === 3) {
        if (((a = t + l.textContent.length), t <= e && a >= e))
          return { node: l, offset: e - t };
        t = a;
      }
      t: {
        for (; l; ) {
          if (l.nextSibling) {
            l = l.nextSibling;
            break t;
          }
          l = l.parentNode;
        }
        l = void 0;
      }
      l = Qs(l);
    }
  }
  function Zs(t, e) {
    return t && e
      ? t === e
        ? !0
        : t && t.nodeType === 3
          ? !1
          : e && e.nodeType === 3
            ? Zs(t, e.parentNode)
            : "contains" in t
              ? t.contains(e)
              : t.compareDocumentPosition
                ? !!(t.compareDocumentPosition(e) & 16)
                : !1
      : !1;
  }
  function Vs(t) {
    t =
      t != null &&
      t.ownerDocument != null &&
      t.ownerDocument.defaultView != null
        ? t.ownerDocument.defaultView
        : window;
    for (var e = Wn(t.document); e instanceof t.HTMLIFrameElement; ) {
      try {
        var l = typeof e.contentWindow.location.href == "string";
      } catch {
        l = !1;
      }
      if (l) t = e.contentWindow;
      else break;
      e = Wn(t.document);
    }
    return e;
  }
  function Xi(t) {
    var e = t && t.nodeName && t.nodeName.toLowerCase();
    return (
      e &&
      ((e === "input" &&
        (t.type === "text" ||
          t.type === "search" ||
          t.type === "tel" ||
          t.type === "url" ||
          t.type === "password")) ||
        e === "textarea" ||
        t.contentEditable === "true")
    );
  }
  var Ph = Ze && "documentMode" in document && 11 >= document.documentMode,
    sa = null,
    Zi = null,
    Pa = null,
    Vi = !1;
  function Ks(t, e, l) {
    var a =
      l.window === l ? l.document : l.nodeType === 9 ? l : l.ownerDocument;
    Vi ||
      sa == null ||
      sa !== Wn(a) ||
      ((a = sa),
      "selectionStart" in a && Xi(a)
        ? (a = { start: a.selectionStart, end: a.selectionEnd })
        : ((a = (
            (a.ownerDocument && a.ownerDocument.defaultView) ||
            window
          ).getSelection()),
          (a = {
            anchorNode: a.anchorNode,
            anchorOffset: a.anchorOffset,
            focusNode: a.focusNode,
            focusOffset: a.focusOffset,
          })),
      (Pa && Ia(Pa, a)) ||
        ((Pa = a),
        (a = Vu(Zi, "onSelect")),
        0 < a.length &&
          ((e = new eu("onSelect", "select", null, e, l)),
          t.push({ event: e, listeners: a }),
          (e.target = sa))));
  }
  function Hl(t, e) {
    var l = {};
    return (
      (l[t.toLowerCase()] = e.toLowerCase()),
      (l["Webkit" + t] = "webkit" + e),
      (l["Moz" + t] = "moz" + e),
      l
    );
  }
  var ra = {
      animationend: Hl("Animation", "AnimationEnd"),
      animationiteration: Hl("Animation", "AnimationIteration"),
      animationstart: Hl("Animation", "AnimationStart"),
      transitionrun: Hl("Transition", "TransitionRun"),
      transitionstart: Hl("Transition", "TransitionStart"),
      transitioncancel: Hl("Transition", "TransitionCancel"),
      transitionend: Hl("Transition", "TransitionEnd"),
    },
    Ki = {},
    Js = {};
  Ze &&
    ((Js = document.createElement("div").style),
    "AnimationEvent" in window ||
      (delete ra.animationend.animation,
      delete ra.animationiteration.animation,
      delete ra.animationstart.animation),
    "TransitionEvent" in window || delete ra.transitionend.transition);
  function ql(t) {
    if (Ki[t]) return Ki[t];
    if (!ra[t]) return t;
    var e = ra[t],
      l;
    for (l in e) if (e.hasOwnProperty(l) && l in Js) return (Ki[t] = e[l]);
    return t;
  }
  var ks = ql("animationend"),
    Fs = ql("animationiteration"),
    Ws = ql("animationstart"),
    t0 = ql("transitionrun"),
    e0 = ql("transitionstart"),
    l0 = ql("transitioncancel"),
    $s = ql("transitionend"),
    Is = new Map(),
    Ji =
      "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(
        " ",
      );
  Ji.push("scrollEnd");
  function Ce(t, e) {
    (Is.set(t, e), jl(e, [t]));
  }
  var nu =
      typeof reportError == "function"
        ? reportError
        : function (t) {
            if (
              typeof window == "object" &&
              typeof window.ErrorEvent == "function"
            ) {
              var e = new window.ErrorEvent("error", {
                bubbles: !0,
                cancelable: !0,
                message:
                  typeof t == "object" &&
                  t !== null &&
                  typeof t.message == "string"
                    ? String(t.message)
                    : String(t),
                error: t,
              });
              if (!window.dispatchEvent(e)) return;
            } else if (
              typeof process == "object" &&
              typeof process.emit == "function"
            ) {
              process.emit("uncaughtException", t);
              return;
            }
            console.error(t);
          },
    ze = [],
    oa = 0,
    ki = 0;
  function uu() {
    for (var t = oa, e = (ki = oa = 0); e < t; ) {
      var l = ze[e];
      ze[e++] = null;
      var a = ze[e];
      ze[e++] = null;
      var n = ze[e];
      ze[e++] = null;
      var u = ze[e];
      if (((ze[e++] = null), a !== null && n !== null)) {
        var i = a.pending;
        (i === null ? (n.next = n) : ((n.next = i.next), (i.next = n)),
          (a.pending = n));
      }
      u !== 0 && Ps(l, n, u);
    }
  }
  function iu(t, e, l, a) {
    ((ze[oa++] = t),
      (ze[oa++] = e),
      (ze[oa++] = l),
      (ze[oa++] = a),
      (ki |= a),
      (t.lanes |= a),
      (t = t.alternate),
      t !== null && (t.lanes |= a));
  }
  function Fi(t, e, l, a) {
    return (iu(t, e, l, a), cu(t));
  }
  function Bl(t, e) {
    return (iu(t, null, null, e), cu(t));
  }
  function Ps(t, e, l) {
    t.lanes |= l;
    var a = t.alternate;
    a !== null && (a.lanes |= l);
    for (var n = !1, u = t.return; u !== null; )
      ((u.childLanes |= l),
        (a = u.alternate),
        a !== null && (a.childLanes |= l),
        u.tag === 22 &&
          ((t = u.stateNode), t === null || t._visibility & 1 || (n = !0)),
        (t = u),
        (u = u.return));
    return t.tag === 3
      ? ((u = t.stateNode),
        n &&
          e !== null &&
          ((n = 31 - he(l)),
          (t = u.hiddenUpdates),
          (a = t[n]),
          a === null ? (t[n] = [e]) : a.push(e),
          (e.lane = l | 536870912)),
        u)
      : null;
  }
  function cu(t) {
    if (50 < Tn) throw ((Tn = 0), (nf = null), Error(s(185)));
    for (var e = t.return; e !== null; ) ((t = e), (e = t.return));
    return t.tag === 3 ? t.stateNode : null;
  }
  var da = {};
  function a0(t, e, l, a) {
    ((this.tag = t),
      (this.key = l),
      (this.sibling =
        this.child =
        this.return =
        this.stateNode =
        this.type =
        this.elementType =
          null),
      (this.index = 0),
      (this.refCleanup = this.ref = null),
      (this.pendingProps = e),
      (this.dependencies =
        this.memoizedState =
        this.updateQueue =
        this.memoizedProps =
          null),
      (this.mode = a),
      (this.subtreeFlags = this.flags = 0),
      (this.deletions = null),
      (this.childLanes = this.lanes = 0),
      (this.alternate = null));
  }
  function ve(t, e, l, a) {
    return new a0(t, e, l, a);
  }
  function Wi(t) {
    return ((t = t.prototype), !(!t || !t.isReactComponent));
  }
  function Ve(t, e) {
    var l = t.alternate;
    return (
      l === null
        ? ((l = ve(t.tag, e, t.key, t.mode)),
          (l.elementType = t.elementType),
          (l.type = t.type),
          (l.stateNode = t.stateNode),
          (l.alternate = t),
          (t.alternate = l))
        : ((l.pendingProps = e),
          (l.type = t.type),
          (l.flags = 0),
          (l.subtreeFlags = 0),
          (l.deletions = null)),
      (l.flags = t.flags & 65011712),
      (l.childLanes = t.childLanes),
      (l.lanes = t.lanes),
      (l.child = t.child),
      (l.memoizedProps = t.memoizedProps),
      (l.memoizedState = t.memoizedState),
      (l.updateQueue = t.updateQueue),
      (e = t.dependencies),
      (l.dependencies =
        e === null ? null : { lanes: e.lanes, firstContext: e.firstContext }),
      (l.sibling = t.sibling),
      (l.index = t.index),
      (l.ref = t.ref),
      (l.refCleanup = t.refCleanup),
      l
    );
  }
  function tr(t, e) {
    t.flags &= 65011714;
    var l = t.alternate;
    return (
      l === null
        ? ((t.childLanes = 0),
          (t.lanes = e),
          (t.child = null),
          (t.subtreeFlags = 0),
          (t.memoizedProps = null),
          (t.memoizedState = null),
          (t.updateQueue = null),
          (t.dependencies = null),
          (t.stateNode = null))
        : ((t.childLanes = l.childLanes),
          (t.lanes = l.lanes),
          (t.child = l.child),
          (t.subtreeFlags = 0),
          (t.deletions = null),
          (t.memoizedProps = l.memoizedProps),
          (t.memoizedState = l.memoizedState),
          (t.updateQueue = l.updateQueue),
          (t.type = l.type),
          (e = l.dependencies),
          (t.dependencies =
            e === null
              ? null
              : { lanes: e.lanes, firstContext: e.firstContext })),
      t
    );
  }
  function fu(t, e, l, a, n, u) {
    var i = 0;
    if (((a = t), typeof t == "function")) Wi(t) && (i = 1);
    else if (typeof t == "string")
      i = fy(t, l, Q.current)
        ? 26
        : t === "html" || t === "head" || t === "body"
          ? 27
          : 5;
    else
      t: switch (t) {
        case Yt:
          return (
            (t = ve(31, l, e, n)),
            (t.elementType = Yt),
            (t.lanes = u),
            t
          );
        case w:
          return Yl(l.children, n, u, e);
        case B:
          ((i = 8), (n |= 24));
          break;
        case tt:
          return (
            (t = ve(12, l, e, n | 2)),
            (t.elementType = tt),
            (t.lanes = u),
            t
          );
        case Ot:
          return (
            (t = ve(13, l, e, n)),
            (t.elementType = Ot),
            (t.lanes = u),
            t
          );
        case q:
          return ((t = ve(19, l, e, n)), (t.elementType = q), (t.lanes = u), t);
        default:
          if (typeof t == "object" && t !== null)
            switch (t.$$typeof) {
              case et:
                i = 10;
                break t;
              case xt:
                i = 9;
                break t;
              case ht:
                i = 11;
                break t;
              case G:
                i = 14;
                break t;
              case Et:
                ((i = 16), (a = null));
                break t;
            }
          ((i = 29),
            (l = Error(s(130, t === null ? "null" : typeof t, ""))),
            (a = null));
      }
    return (
      (e = ve(i, l, e, n)),
      (e.elementType = t),
      (e.type = a),
      (e.lanes = u),
      e
    );
  }
  function Yl(t, e, l, a) {
    return ((t = ve(7, t, a, e)), (t.lanes = l), t);
  }
  function $i(t, e, l) {
    return ((t = ve(6, t, null, e)), (t.lanes = l), t);
  }
  function er(t) {
    var e = ve(18, null, null, 0);
    return ((e.stateNode = t), e);
  }
  function Ii(t, e, l) {
    return (
      (e = ve(4, t.children !== null ? t.children : [], t.key, e)),
      (e.lanes = l),
      (e.stateNode = {
        containerInfo: t.containerInfo,
        pendingChildren: null,
        implementation: t.implementation,
      }),
      e
    );
  }
  var lr = new WeakMap();
  function Oe(t, e) {
    if (typeof t == "object" && t !== null) {
      var l = lr.get(t);
      return l !== void 0
        ? l
        : ((e = { value: t, source: e, stack: es(e) }), lr.set(t, e), e);
    }
    return { value: t, source: e, stack: es(e) };
  }
  var ma = [],
    ha = 0,
    su = null,
    tn = 0,
    _e = [],
    xe = 0,
    sl = null,
    Ye = 1,
    Le = "";
  function Ke(t, e) {
    ((ma[ha++] = tn), (ma[ha++] = su), (su = t), (tn = e));
  }
  function ar(t, e, l) {
    ((_e[xe++] = Ye), (_e[xe++] = Le), (_e[xe++] = sl), (sl = t));
    var a = Ye;
    t = Le;
    var n = 32 - he(a) - 1;
    ((a &= ~(1 << n)), (l += 1));
    var u = 32 - he(e) + n;
    if (30 < u) {
      var i = n - (n % 5);
      ((u = (a & ((1 << i) - 1)).toString(32)),
        (a >>= i),
        (n -= i),
        (Ye = (1 << (32 - he(e) + n)) | (l << n) | a),
        (Le = u + t));
    } else ((Ye = (1 << u) | (l << n) | a), (Le = t));
  }
  function Pi(t) {
    t.return !== null && (Ke(t, 1), ar(t, 1, 0));
  }
  function tc(t) {
    for (; t === su; )
      ((su = ma[--ha]), (ma[ha] = null), (tn = ma[--ha]), (ma[ha] = null));
    for (; t === sl; )
      ((sl = _e[--xe]),
        (_e[xe] = null),
        (Le = _e[--xe]),
        (_e[xe] = null),
        (Ye = _e[--xe]),
        (_e[xe] = null));
  }
  function nr(t, e) {
    ((_e[xe++] = Ye),
      (_e[xe++] = Le),
      (_e[xe++] = sl),
      (Ye = e.id),
      (Le = e.overflow),
      (sl = t));
  }
  var Vt = null,
    At = null,
    ct = !1,
    rl = null,
    Re = !1,
    ec = Error(s(519));
  function ol(t) {
    var e = Error(
      s(
        418,
        1 < arguments.length && arguments[1] !== void 0 && arguments[1]
          ? "text"
          : "HTML",
        "",
      ),
    );
    throw (en(Oe(e, t)), ec);
  }
  function ur(t) {
    var e = t.stateNode,
      l = t.type,
      a = t.memoizedProps;
    switch (((e[Zt] = t), (e[ee] = a), l)) {
      case "dialog":
        (nt("cancel", e), nt("close", e));
        break;
      case "iframe":
      case "object":
      case "embed":
        nt("load", e);
        break;
      case "video":
      case "audio":
        for (l = 0; l < zn.length; l++) nt(zn[l], e);
        break;
      case "source":
        nt("error", e);
        break;
      case "img":
      case "image":
      case "link":
        (nt("error", e), nt("load", e));
        break;
      case "details":
        nt("toggle", e);
        break;
      case "input":
        (nt("invalid", e),
          bs(
            e,
            a.value,
            a.defaultValue,
            a.checked,
            a.defaultChecked,
            a.type,
            a.name,
            !0,
          ));
        break;
      case "select":
        nt("invalid", e);
        break;
      case "textarea":
        (nt("invalid", e), Ss(e, a.value, a.defaultValue, a.children));
    }
    ((l = a.children),
      (typeof l != "string" && typeof l != "number" && typeof l != "bigint") ||
      e.textContent === "" + l ||
      a.suppressHydrationWarning === !0 ||
      Ad(e.textContent, l)
        ? (a.popover != null && (nt("beforetoggle", e), nt("toggle", e)),
          a.onScroll != null && nt("scroll", e),
          a.onScrollEnd != null && nt("scrollend", e),
          a.onClick != null && (e.onclick = Xe),
          (e = !0))
        : (e = !1),
      e || ol(t, !0));
  }
  function ir(t) {
    for (Vt = t.return; Vt; )
      switch (Vt.tag) {
        case 5:
        case 31:
        case 13:
          Re = !1;
          return;
        case 27:
        case 3:
          Re = !0;
          return;
        default:
          Vt = Vt.return;
      }
  }
  function ya(t) {
    if (t !== Vt) return !1;
    if (!ct) return (ir(t), (ct = !0), !1);
    var e = t.tag,
      l;
    if (
      ((l = e !== 3 && e !== 27) &&
        ((l = e === 5) &&
          ((l = t.type),
          (l =
            !(l !== "form" && l !== "button") || Sf(t.type, t.memoizedProps))),
        (l = !l)),
      l && At && ol(t),
      ir(t),
      e === 13)
    ) {
      if (((t = t.memoizedState), (t = t !== null ? t.dehydrated : null), !t))
        throw Error(s(317));
      At = Md(t);
    } else if (e === 31) {
      if (((t = t.memoizedState), (t = t !== null ? t.dehydrated : null), !t))
        throw Error(s(317));
      At = Md(t);
    } else
      e === 27
        ? ((e = At), Ol(t.type) ? ((t = Of), (Of = null), (At = t)) : (At = e))
        : (At = Vt ? De(t.stateNode.nextSibling) : null);
    return !0;
  }
  function Ll() {
    ((At = Vt = null), (ct = !1));
  }
  function lc() {
    var t = rl;
    return (
      t !== null &&
        (ie === null ? (ie = t) : ie.push.apply(ie, t), (rl = null)),
      t
    );
  }
  function en(t) {
    rl === null ? (rl = [t]) : rl.push(t);
  }
  var ac = y(null),
    wl = null,
    Je = null;
  function dl(t, e, l) {
    (L(ac, e._currentValue), (e._currentValue = l));
  }
  function ke(t) {
    ((t._currentValue = ac.current), M(ac));
  }
  function nc(t, e, l) {
    for (; t !== null; ) {
      var a = t.alternate;
      if (
        ((t.childLanes & e) !== e
          ? ((t.childLanes |= e), a !== null && (a.childLanes |= e))
          : a !== null && (a.childLanes & e) !== e && (a.childLanes |= e),
        t === l)
      )
        break;
      t = t.return;
    }
  }
  function uc(t, e, l, a) {
    var n = t.child;
    for (n !== null && (n.return = t); n !== null; ) {
      var u = n.dependencies;
      if (u !== null) {
        var i = n.child;
        u = u.firstContext;
        t: for (; u !== null; ) {
          var o = u;
          u = n;
          for (var m = 0; m < e.length; m++)
            if (o.context === e[m]) {
              ((u.lanes |= l),
                (o = u.alternate),
                o !== null && (o.lanes |= l),
                nc(u.return, l, t),
                a || (i = null));
              break t;
            }
          u = o.next;
        }
      } else if (n.tag === 18) {
        if (((i = n.return), i === null)) throw Error(s(341));
        ((i.lanes |= l),
          (u = i.alternate),
          u !== null && (u.lanes |= l),
          nc(i, l, t),
          (i = null));
      } else i = n.child;
      if (i !== null) i.return = n;
      else
        for (i = n; i !== null; ) {
          if (i === t) {
            i = null;
            break;
          }
          if (((n = i.sibling), n !== null)) {
            ((n.return = i.return), (i = n));
            break;
          }
          i = i.return;
        }
      n = i;
    }
  }
  function va(t, e, l, a) {
    t = null;
    for (var n = e, u = !1; n !== null; ) {
      if (!u) {
        if ((n.flags & 524288) !== 0) u = !0;
        else if ((n.flags & 262144) !== 0) break;
      }
      if (n.tag === 10) {
        var i = n.alternate;
        if (i === null) throw Error(s(387));
        if (((i = i.memoizedProps), i !== null)) {
          var o = n.type;
          ye(n.pendingProps.value, i.value) ||
            (t !== null ? t.push(o) : (t = [o]));
        }
      } else if (n === mt.current) {
        if (((i = n.alternate), i === null)) throw Error(s(387));
        i.memoizedState.memoizedState !== n.memoizedState.memoizedState &&
          (t !== null ? t.push(Nn) : (t = [Nn]));
      }
      n = n.return;
    }
    (t !== null && uc(e, t, l, a), (e.flags |= 262144));
  }
  function ru(t) {
    for (t = t.firstContext; t !== null; ) {
      if (!ye(t.context._currentValue, t.memoizedValue)) return !0;
      t = t.next;
    }
    return !1;
  }
  function Gl(t) {
    ((wl = t),
      (Je = null),
      (t = t.dependencies),
      t !== null && (t.firstContext = null));
  }
  function Kt(t) {
    return cr(wl, t);
  }
  function ou(t, e) {
    return (wl === null && Gl(t), cr(t, e));
  }
  function cr(t, e) {
    var l = e._currentValue;
    if (((e = { context: e, memoizedValue: l, next: null }), Je === null)) {
      if (t === null) throw Error(s(308));
      ((Je = e),
        (t.dependencies = { lanes: 0, firstContext: e }),
        (t.flags |= 524288));
    } else Je = Je.next = e;
    return l;
  }
  var n0 =
      typeof AbortController < "u"
        ? AbortController
        : function () {
            var t = [],
              e = (this.signal = {
                aborted: !1,
                addEventListener: function (l, a) {
                  t.push(a);
                },
              });
            this.abort = function () {
              ((e.aborted = !0),
                t.forEach(function (l) {
                  return l();
                }));
            };
          },
    u0 = c.unstable_scheduleCallback,
    i0 = c.unstable_NormalPriority,
    Ct = {
      $$typeof: et,
      Consumer: null,
      Provider: null,
      _currentValue: null,
      _currentValue2: null,
      _threadCount: 0,
    };
  function ic() {
    return { controller: new n0(), data: new Map(), refCount: 0 };
  }
  function ln(t) {
    (t.refCount--,
      t.refCount === 0 &&
        u0(i0, function () {
          t.controller.abort();
        }));
  }
  var an = null,
    cc = 0,
    ga = 0,
    ba = null;
  function c0(t, e) {
    if (an === null) {
      var l = (an = []);
      ((cc = 0),
        (ga = of()),
        (ba = {
          status: "pending",
          value: void 0,
          then: function (a) {
            l.push(a);
          },
        }));
    }
    return (cc++, e.then(fr, fr), e);
  }
  function fr() {
    if (--cc === 0 && an !== null) {
      ba !== null && (ba.status = "fulfilled");
      var t = an;
      ((an = null), (ga = 0), (ba = null));
      for (var e = 0; e < t.length; e++) (0, t[e])();
    }
  }
  function f0(t, e) {
    var l = [],
      a = {
        status: "pending",
        value: null,
        reason: null,
        then: function (n) {
          l.push(n);
        },
      };
    return (
      t.then(
        function () {
          ((a.status = "fulfilled"), (a.value = e));
          for (var n = 0; n < l.length; n++) (0, l[n])(e);
        },
        function (n) {
          for (a.status = "rejected", a.reason = n, n = 0; n < l.length; n++)
            (0, l[n])(void 0);
        },
      ),
      a
    );
  }
  var sr = R.S;
  R.S = function (t, e) {
    ((Jo = de()),
      typeof e == "object" &&
        e !== null &&
        typeof e.then == "function" &&
        c0(t, e),
      sr !== null && sr(t, e));
  };
  var Ql = y(null);
  function fc() {
    var t = Ql.current;
    return t !== null ? t : Tt.pooledCache;
  }
  function du(t, e) {
    e === null ? L(Ql, Ql.current) : L(Ql, e.pool);
  }
  function rr() {
    var t = fc();
    return t === null ? null : { parent: Ct._currentValue, pool: t };
  }
  var pa = Error(s(460)),
    sc = Error(s(474)),
    mu = Error(s(542)),
    hu = { then: function () {} };
  function or(t) {
    return ((t = t.status), t === "fulfilled" || t === "rejected");
  }
  function dr(t, e, l) {
    switch (
      ((l = t[l]),
      l === void 0 ? t.push(e) : l !== e && (e.then(Xe, Xe), (e = l)),
      e.status)
    ) {
      case "fulfilled":
        return e.value;
      case "rejected":
        throw ((t = e.reason), hr(t), t);
      default:
        if (typeof e.status == "string") e.then(Xe, Xe);
        else {
          if (((t = Tt), t !== null && 100 < t.shellSuspendCounter))
            throw Error(s(482));
          ((t = e),
            (t.status = "pending"),
            t.then(
              function (a) {
                if (e.status === "pending") {
                  var n = e;
                  ((n.status = "fulfilled"), (n.value = a));
                }
              },
              function (a) {
                if (e.status === "pending") {
                  var n = e;
                  ((n.status = "rejected"), (n.reason = a));
                }
              },
            ));
        }
        switch (e.status) {
          case "fulfilled":
            return e.value;
          case "rejected":
            throw ((t = e.reason), hr(t), t);
        }
        throw ((Zl = e), pa);
    }
  }
  function Xl(t) {
    try {
      var e = t._init;
      return e(t._payload);
    } catch (l) {
      throw l !== null && typeof l == "object" && typeof l.then == "function"
        ? ((Zl = l), pa)
        : l;
    }
  }
  var Zl = null;
  function mr() {
    if (Zl === null) throw Error(s(459));
    var t = Zl;
    return ((Zl = null), t);
  }
  function hr(t) {
    if (t === pa || t === mu) throw Error(s(483));
  }
  var Sa = null,
    nn = 0;
  function yu(t) {
    var e = nn;
    return ((nn += 1), Sa === null && (Sa = []), dr(Sa, t, e));
  }
  function un(t, e) {
    ((e = e.props.ref), (t.ref = e !== void 0 ? e : null));
  }
  function vu(t, e) {
    throw e.$$typeof === V
      ? Error(s(525))
      : ((t = Object.prototype.toString.call(e)),
        Error(
          s(
            31,
            t === "[object Object]"
              ? "object with keys {" + Object.keys(e).join(", ") + "}"
              : t,
          ),
        ));
  }
  function yr(t) {
    function e(p, v) {
      if (t) {
        var E = p.deletions;
        E === null ? ((p.deletions = [v]), (p.flags |= 16)) : E.push(v);
      }
    }
    function l(p, v) {
      if (!t) return null;
      for (; v !== null; ) (e(p, v), (v = v.sibling));
      return null;
    }
    function a(p) {
      for (var v = new Map(); p !== null; )
        (p.key !== null ? v.set(p.key, p) : v.set(p.index, p), (p = p.sibling));
      return v;
    }
    function n(p, v) {
      return ((p = Ve(p, v)), (p.index = 0), (p.sibling = null), p);
    }
    function u(p, v, E) {
      return (
        (p.index = E),
        t
          ? ((E = p.alternate),
            E !== null
              ? ((E = E.index), E < v ? ((p.flags |= 67108866), v) : E)
              : ((p.flags |= 67108866), v))
          : ((p.flags |= 1048576), v)
      );
    }
    function i(p) {
      return (t && p.alternate === null && (p.flags |= 67108866), p);
    }
    function o(p, v, E, U) {
      return v === null || v.tag !== 6
        ? ((v = $i(E, p.mode, U)), (v.return = p), v)
        : ((v = n(v, E)), (v.return = p), v);
    }
    function m(p, v, E, U) {
      var J = E.type;
      return J === w
        ? N(p, v, E.props.children, U, E.key)
        : v !== null &&
            (v.elementType === J ||
              (typeof J == "object" &&
                J !== null &&
                J.$$typeof === Et &&
                Xl(J) === v.type))
          ? ((v = n(v, E.props)), un(v, E), (v.return = p), v)
          : ((v = fu(E.type, E.key, E.props, null, p.mode, U)),
            un(v, E),
            (v.return = p),
            v);
    }
    function T(p, v, E, U) {
      return v === null ||
        v.tag !== 4 ||
        v.stateNode.containerInfo !== E.containerInfo ||
        v.stateNode.implementation !== E.implementation
        ? ((v = Ii(E, p.mode, U)), (v.return = p), v)
        : ((v = n(v, E.children || [])), (v.return = p), v);
    }
    function N(p, v, E, U, J) {
      return v === null || v.tag !== 7
        ? ((v = Yl(E, p.mode, U, J)), (v.return = p), v)
        : ((v = n(v, E)), (v.return = p), v);
    }
    function j(p, v, E) {
      if (
        (typeof v == "string" && v !== "") ||
        typeof v == "number" ||
        typeof v == "bigint"
      )
        return ((v = $i("" + v, p.mode, E)), (v.return = p), v);
      if (typeof v == "object" && v !== null) {
        switch (v.$$typeof) {
          case ft:
            return (
              (E = fu(v.type, v.key, v.props, null, p.mode, E)),
              un(E, v),
              (E.return = p),
              E
            );
          case H:
            return ((v = Ii(v, p.mode, E)), (v.return = p), v);
          case Et:
            return ((v = Xl(v)), j(p, v, E));
        }
        if (te(v) || Lt(v))
          return ((v = Yl(v, p.mode, E, null)), (v.return = p), v);
        if (typeof v.then == "function") return j(p, yu(v), E);
        if (v.$$typeof === et) return j(p, ou(p, v), E);
        vu(p, v);
      }
      return null;
    }
    function A(p, v, E, U) {
      var J = v !== null ? v.key : null;
      if (
        (typeof E == "string" && E !== "") ||
        typeof E == "number" ||
        typeof E == "bigint"
      )
        return J !== null ? null : o(p, v, "" + E, U);
      if (typeof E == "object" && E !== null) {
        switch (E.$$typeof) {
          case ft:
            return E.key === J ? m(p, v, E, U) : null;
          case H:
            return E.key === J ? T(p, v, E, U) : null;
          case Et:
            return ((E = Xl(E)), A(p, v, E, U));
        }
        if (te(E) || Lt(E)) return J !== null ? null : N(p, v, E, U, null);
        if (typeof E.then == "function") return A(p, v, yu(E), U);
        if (E.$$typeof === et) return A(p, v, ou(p, E), U);
        vu(p, E);
      }
      return null;
    }
    function _(p, v, E, U, J) {
      if (
        (typeof U == "string" && U !== "") ||
        typeof U == "number" ||
        typeof U == "bigint"
      )
        return ((p = p.get(E) || null), o(v, p, "" + U, J));
      if (typeof U == "object" && U !== null) {
        switch (U.$$typeof) {
          case ft:
            return (
              (p = p.get(U.key === null ? E : U.key) || null),
              m(v, p, U, J)
            );
          case H:
            return (
              (p = p.get(U.key === null ? E : U.key) || null),
              T(v, p, U, J)
            );
          case Et:
            return ((U = Xl(U)), _(p, v, E, U, J));
        }
        if (te(U) || Lt(U))
          return ((p = p.get(E) || null), N(v, p, U, J, null));
        if (typeof U.then == "function") return _(p, v, E, yu(U), J);
        if (U.$$typeof === et) return _(p, v, E, ou(v, U), J);
        vu(v, U);
      }
      return null;
    }
    function X(p, v, E, U) {
      for (
        var J = null, st = null, Z = v, P = (v = 0), it = null;
        Z !== null && P < E.length;
        P++
      ) {
        Z.index > P ? ((it = Z), (Z = null)) : (it = Z.sibling);
        var rt = A(p, Z, E[P], U);
        if (rt === null) {
          Z === null && (Z = it);
          break;
        }
        (t && Z && rt.alternate === null && e(p, Z),
          (v = u(rt, v, P)),
          st === null ? (J = rt) : (st.sibling = rt),
          (st = rt),
          (Z = it));
      }
      if (P === E.length) return (l(p, Z), ct && Ke(p, P), J);
      if (Z === null) {
        for (; P < E.length; P++)
          ((Z = j(p, E[P], U)),
            Z !== null &&
              ((v = u(Z, v, P)),
              st === null ? (J = Z) : (st.sibling = Z),
              (st = Z)));
        return (ct && Ke(p, P), J);
      }
      for (Z = a(Z); P < E.length; P++)
        ((it = _(Z, p, P, E[P], U)),
          it !== null &&
            (t &&
              it.alternate !== null &&
              Z.delete(it.key === null ? P : it.key),
            (v = u(it, v, P)),
            st === null ? (J = it) : (st.sibling = it),
            (st = it)));
      return (
        t &&
          Z.forEach(function (Dl) {
            return e(p, Dl);
          }),
        ct && Ke(p, P),
        J
      );
    }
    function k(p, v, E, U) {
      if (E == null) throw Error(s(151));
      for (
        var J = null, st = null, Z = v, P = (v = 0), it = null, rt = E.next();
        Z !== null && !rt.done;
        P++, rt = E.next()
      ) {
        Z.index > P ? ((it = Z), (Z = null)) : (it = Z.sibling);
        var Dl = A(p, Z, rt.value, U);
        if (Dl === null) {
          Z === null && (Z = it);
          break;
        }
        (t && Z && Dl.alternate === null && e(p, Z),
          (v = u(Dl, v, P)),
          st === null ? (J = Dl) : (st.sibling = Dl),
          (st = Dl),
          (Z = it));
      }
      if (rt.done) return (l(p, Z), ct && Ke(p, P), J);
      if (Z === null) {
        for (; !rt.done; P++, rt = E.next())
          ((rt = j(p, rt.value, U)),
            rt !== null &&
              ((v = u(rt, v, P)),
              st === null ? (J = rt) : (st.sibling = rt),
              (st = rt)));
        return (ct && Ke(p, P), J);
      }
      for (Z = a(Z); !rt.done; P++, rt = E.next())
        ((rt = _(Z, p, P, rt.value, U)),
          rt !== null &&
            (t &&
              rt.alternate !== null &&
              Z.delete(rt.key === null ? P : rt.key),
            (v = u(rt, v, P)),
            st === null ? (J = rt) : (st.sibling = rt),
            (st = rt)));
      return (
        t &&
          Z.forEach(function (py) {
            return e(p, py);
          }),
        ct && Ke(p, P),
        J
      );
    }
    function St(p, v, E, U) {
      if (
        (typeof E == "object" &&
          E !== null &&
          E.type === w &&
          E.key === null &&
          (E = E.props.children),
        typeof E == "object" && E !== null)
      ) {
        switch (E.$$typeof) {
          case ft:
            t: {
              for (var J = E.key; v !== null; ) {
                if (v.key === J) {
                  if (((J = E.type), J === w)) {
                    if (v.tag === 7) {
                      (l(p, v.sibling),
                        (U = n(v, E.props.children)),
                        (U.return = p),
                        (p = U));
                      break t;
                    }
                  } else if (
                    v.elementType === J ||
                    (typeof J == "object" &&
                      J !== null &&
                      J.$$typeof === Et &&
                      Xl(J) === v.type)
                  ) {
                    (l(p, v.sibling),
                      (U = n(v, E.props)),
                      un(U, E),
                      (U.return = p),
                      (p = U));
                    break t;
                  }
                  l(p, v);
                  break;
                } else e(p, v);
                v = v.sibling;
              }
              E.type === w
                ? ((U = Yl(E.props.children, p.mode, U, E.key)),
                  (U.return = p),
                  (p = U))
                : ((U = fu(E.type, E.key, E.props, null, p.mode, U)),
                  un(U, E),
                  (U.return = p),
                  (p = U));
            }
            return i(p);
          case H:
            t: {
              for (J = E.key; v !== null; ) {
                if (v.key === J)
                  if (
                    v.tag === 4 &&
                    v.stateNode.containerInfo === E.containerInfo &&
                    v.stateNode.implementation === E.implementation
                  ) {
                    (l(p, v.sibling),
                      (U = n(v, E.children || [])),
                      (U.return = p),
                      (p = U));
                    break t;
                  } else {
                    l(p, v);
                    break;
                  }
                else e(p, v);
                v = v.sibling;
              }
              ((U = Ii(E, p.mode, U)), (U.return = p), (p = U));
            }
            return i(p);
          case Et:
            return ((E = Xl(E)), St(p, v, E, U));
        }
        if (te(E)) return X(p, v, E, U);
        if (Lt(E)) {
          if (((J = Lt(E)), typeof J != "function")) throw Error(s(150));
          return ((E = J.call(E)), k(p, v, E, U));
        }
        if (typeof E.then == "function") return St(p, v, yu(E), U);
        if (E.$$typeof === et) return St(p, v, ou(p, E), U);
        vu(p, E);
      }
      return (typeof E == "string" && E !== "") ||
        typeof E == "number" ||
        typeof E == "bigint"
        ? ((E = "" + E),
          v !== null && v.tag === 6
            ? (l(p, v.sibling), (U = n(v, E)), (U.return = p), (p = U))
            : (l(p, v), (U = $i(E, p.mode, U)), (U.return = p), (p = U)),
          i(p))
        : l(p, v);
    }
    return function (p, v, E, U) {
      try {
        nn = 0;
        var J = St(p, v, E, U);
        return ((Sa = null), J);
      } catch (Z) {
        if (Z === pa || Z === mu) throw Z;
        var st = ve(29, Z, null, p.mode);
        return ((st.lanes = U), (st.return = p), st);
      }
    };
  }
  var Vl = yr(!0),
    vr = yr(!1),
    ml = !1;
  function rc(t) {
    t.updateQueue = {
      baseState: t.memoizedState,
      firstBaseUpdate: null,
      lastBaseUpdate: null,
      shared: { pending: null, lanes: 0, hiddenCallbacks: null },
      callbacks: null,
    };
  }
  function oc(t, e) {
    ((t = t.updateQueue),
      e.updateQueue === t &&
        (e.updateQueue = {
          baseState: t.baseState,
          firstBaseUpdate: t.firstBaseUpdate,
          lastBaseUpdate: t.lastBaseUpdate,
          shared: t.shared,
          callbacks: null,
        }));
  }
  function hl(t) {
    return { lane: t, tag: 0, payload: null, callback: null, next: null };
  }
  function yl(t, e, l) {
    var a = t.updateQueue;
    if (a === null) return null;
    if (((a = a.shared), (dt & 2) !== 0)) {
      var n = a.pending;
      return (
        n === null ? (e.next = e) : ((e.next = n.next), (n.next = e)),
        (a.pending = e),
        (e = cu(t)),
        Ps(t, null, l),
        e
      );
    }
    return (iu(t, a, e, l), cu(t));
  }
  function cn(t, e, l) {
    if (
      ((e = e.updateQueue), e !== null && ((e = e.shared), (l & 4194048) !== 0))
    ) {
      var a = e.lanes;
      ((a &= t.pendingLanes), (l |= a), (e.lanes = l), cs(t, l));
    }
  }
  function dc(t, e) {
    var l = t.updateQueue,
      a = t.alternate;
    if (a !== null && ((a = a.updateQueue), l === a)) {
      var n = null,
        u = null;
      if (((l = l.firstBaseUpdate), l !== null)) {
        do {
          var i = {
            lane: l.lane,
            tag: l.tag,
            payload: l.payload,
            callback: null,
            next: null,
          };
          (u === null ? (n = u = i) : (u = u.next = i), (l = l.next));
        } while (l !== null);
        u === null ? (n = u = e) : (u = u.next = e);
      } else n = u = e;
      ((l = {
        baseState: a.baseState,
        firstBaseUpdate: n,
        lastBaseUpdate: u,
        shared: a.shared,
        callbacks: a.callbacks,
      }),
        (t.updateQueue = l));
      return;
    }
    ((t = l.lastBaseUpdate),
      t === null ? (l.firstBaseUpdate = e) : (t.next = e),
      (l.lastBaseUpdate = e));
  }
  var mc = !1;
  function fn() {
    if (mc) {
      var t = ba;
      if (t !== null) throw t;
    }
  }
  function sn(t, e, l, a) {
    mc = !1;
    var n = t.updateQueue;
    ml = !1;
    var u = n.firstBaseUpdate,
      i = n.lastBaseUpdate,
      o = n.shared.pending;
    if (o !== null) {
      n.shared.pending = null;
      var m = o,
        T = m.next;
      ((m.next = null), i === null ? (u = T) : (i.next = T), (i = m));
      var N = t.alternate;
      N !== null &&
        ((N = N.updateQueue),
        (o = N.lastBaseUpdate),
        o !== i &&
          (o === null ? (N.firstBaseUpdate = T) : (o.next = T),
          (N.lastBaseUpdate = m)));
    }
    if (u !== null) {
      var j = n.baseState;
      ((i = 0), (N = T = m = null), (o = u));
      do {
        var A = o.lane & -536870913,
          _ = A !== o.lane;
        if (_ ? (ut & A) === A : (a & A) === A) {
          (A !== 0 && A === ga && (mc = !0),
            N !== null &&
              (N = N.next =
                {
                  lane: 0,
                  tag: o.tag,
                  payload: o.payload,
                  callback: null,
                  next: null,
                }));
          t: {
            var X = t,
              k = o;
            A = e;
            var St = l;
            switch (k.tag) {
              case 1:
                if (((X = k.payload), typeof X == "function")) {
                  j = X.call(St, j, A);
                  break t;
                }
                j = X;
                break t;
              case 3:
                X.flags = (X.flags & -65537) | 128;
              case 0:
                if (
                  ((X = k.payload),
                  (A = typeof X == "function" ? X.call(St, j, A) : X),
                  A == null)
                )
                  break t;
                j = C({}, j, A);
                break t;
              case 2:
                ml = !0;
            }
          }
          ((A = o.callback),
            A !== null &&
              ((t.flags |= 64),
              _ && (t.flags |= 8192),
              (_ = n.callbacks),
              _ === null ? (n.callbacks = [A]) : _.push(A)));
        } else
          ((_ = {
            lane: A,
            tag: o.tag,
            payload: o.payload,
            callback: o.callback,
            next: null,
          }),
            N === null ? ((T = N = _), (m = j)) : (N = N.next = _),
            (i |= A));
        if (((o = o.next), o === null)) {
          if (((o = n.shared.pending), o === null)) break;
          ((_ = o),
            (o = _.next),
            (_.next = null),
            (n.lastBaseUpdate = _),
            (n.shared.pending = null));
        }
      } while (!0);
      (N === null && (m = j),
        (n.baseState = m),
        (n.firstBaseUpdate = T),
        (n.lastBaseUpdate = N),
        u === null && (n.shared.lanes = 0),
        (Sl |= i),
        (t.lanes = i),
        (t.memoizedState = j));
    }
  }
  function gr(t, e) {
    if (typeof t != "function") throw Error(s(191, t));
    t.call(e);
  }
  function br(t, e) {
    var l = t.callbacks;
    if (l !== null)
      for (t.callbacks = null, t = 0; t < l.length; t++) gr(l[t], e);
  }
  var Ea = y(null),
    gu = y(0);
  function pr(t, e) {
    ((t = al), L(gu, t), L(Ea, e), (al = t | e.baseLanes));
  }
  function hc() {
    (L(gu, al), L(Ea, Ea.current));
  }
  function yc() {
    ((al = gu.current), M(Ea), M(gu));
  }
  var ge = y(null),
    Ne = null;
  function vl(t) {
    var e = t.alternate;
    (L(Ut, Ut.current & 1),
      L(ge, t),
      Ne === null &&
        (e === null || Ea.current !== null || e.memoizedState !== null) &&
        (Ne = t));
  }
  function vc(t) {
    (L(Ut, Ut.current), L(ge, t), Ne === null && (Ne = t));
  }
  function Sr(t) {
    t.tag === 22
      ? (L(Ut, Ut.current), L(ge, t), Ne === null && (Ne = t))
      : gl();
  }
  function gl() {
    (L(Ut, Ut.current), L(ge, ge.current));
  }
  function be(t) {
    (M(ge), Ne === t && (Ne = null), M(Ut));
  }
  var Ut = y(0);
  function bu(t) {
    for (var e = t; e !== null; ) {
      if (e.tag === 13) {
        var l = e.memoizedState;
        if (l !== null && ((l = l.dehydrated), l === null || Af(l) || zf(l)))
          return e;
      } else if (
        e.tag === 19 &&
        (e.memoizedProps.revealOrder === "forwards" ||
          e.memoizedProps.revealOrder === "backwards" ||
          e.memoizedProps.revealOrder === "unstable_legacy-backwards" ||
          e.memoizedProps.revealOrder === "together")
      ) {
        if ((e.flags & 128) !== 0) return e;
      } else if (e.child !== null) {
        ((e.child.return = e), (e = e.child));
        continue;
      }
      if (e === t) break;
      for (; e.sibling === null; ) {
        if (e.return === null || e.return === t) return null;
        e = e.return;
      }
      ((e.sibling.return = e.return), (e = e.sibling));
    }
    return null;
  }
  var Fe = 0,
    I = null,
    bt = null,
    Ht = null,
    pu = !1,
    Ta = !1,
    Kl = !1,
    Su = 0,
    rn = 0,
    Aa = null,
    s0 = 0;
  function Rt() {
    throw Error(s(321));
  }
  function gc(t, e) {
    if (e === null) return !1;
    for (var l = 0; l < e.length && l < t.length; l++)
      if (!ye(t[l], e[l])) return !1;
    return !0;
  }
  function bc(t, e, l, a, n, u) {
    return (
      (Fe = u),
      (I = e),
      (e.memoizedState = null),
      (e.updateQueue = null),
      (e.lanes = 0),
      (R.H = t === null || t.memoizedState === null ? ao : jc),
      (Kl = !1),
      (u = l(a, n)),
      (Kl = !1),
      Ta && (u = Tr(e, l, a, n)),
      Er(t),
      u
    );
  }
  function Er(t) {
    R.H = mn;
    var e = bt !== null && bt.next !== null;
    if (((Fe = 0), (Ht = bt = I = null), (pu = !1), (rn = 0), (Aa = null), e))
      throw Error(s(300));
    t === null ||
      qt ||
      ((t = t.dependencies), t !== null && ru(t) && (qt = !0));
  }
  function Tr(t, e, l, a) {
    I = t;
    var n = 0;
    do {
      if ((Ta && (Aa = null), (rn = 0), (Ta = !1), 25 <= n))
        throw Error(s(301));
      if (((n += 1), (Ht = bt = null), t.updateQueue != null)) {
        var u = t.updateQueue;
        ((u.lastEffect = null),
          (u.events = null),
          (u.stores = null),
          u.memoCache != null && (u.memoCache.index = 0));
      }
      ((R.H = no), (u = e(l, a)));
    } while (Ta);
    return u;
  }
  function r0() {
    var t = R.H,
      e = t.useState()[0];
    return (
      (e = typeof e.then == "function" ? on(e) : e),
      (t = t.useState()[0]),
      (bt !== null ? bt.memoizedState : null) !== t && (I.flags |= 1024),
      e
    );
  }
  function pc() {
    var t = Su !== 0;
    return ((Su = 0), t);
  }
  function Sc(t, e, l) {
    ((e.updateQueue = t.updateQueue), (e.flags &= -2053), (t.lanes &= ~l));
  }
  function Ec(t) {
    if (pu) {
      for (t = t.memoizedState; t !== null; ) {
        var e = t.queue;
        (e !== null && (e.pending = null), (t = t.next));
      }
      pu = !1;
    }
    ((Fe = 0), (Ht = bt = I = null), (Ta = !1), (rn = Su = 0), (Aa = null));
  }
  function Pt() {
    var t = {
      memoizedState: null,
      baseState: null,
      baseQueue: null,
      queue: null,
      next: null,
    };
    return (Ht === null ? (I.memoizedState = Ht = t) : (Ht = Ht.next = t), Ht);
  }
  function Mt() {
    if (bt === null) {
      var t = I.alternate;
      t = t !== null ? t.memoizedState : null;
    } else t = bt.next;
    var e = Ht === null ? I.memoizedState : Ht.next;
    if (e !== null) ((Ht = e), (bt = t));
    else {
      if (t === null)
        throw I.alternate === null ? Error(s(467)) : Error(s(310));
      ((bt = t),
        (t = {
          memoizedState: bt.memoizedState,
          baseState: bt.baseState,
          baseQueue: bt.baseQueue,
          queue: bt.queue,
          next: null,
        }),
        Ht === null ? (I.memoizedState = Ht = t) : (Ht = Ht.next = t));
    }
    return Ht;
  }
  function Eu() {
    return { lastEffect: null, events: null, stores: null, memoCache: null };
  }
  function on(t) {
    var e = rn;
    return (
      (rn += 1),
      Aa === null && (Aa = []),
      (t = dr(Aa, t, e)),
      (e = I),
      (Ht === null ? e.memoizedState : Ht.next) === null &&
        ((e = e.alternate),
        (R.H = e === null || e.memoizedState === null ? ao : jc)),
      t
    );
  }
  function Tu(t) {
    if (t !== null && typeof t == "object") {
      if (typeof t.then == "function") return on(t);
      if (t.$$typeof === et) return Kt(t);
    }
    throw Error(s(438, String(t)));
  }
  function Tc(t) {
    var e = null,
      l = I.updateQueue;
    if ((l !== null && (e = l.memoCache), e == null)) {
      var a = I.alternate;
      a !== null &&
        ((a = a.updateQueue),
        a !== null &&
          ((a = a.memoCache),
          a != null &&
            (e = {
              data: a.data.map(function (n) {
                return n.slice();
              }),
              index: 0,
            })));
    }
    if (
      (e == null && (e = { data: [], index: 0 }),
      l === null && ((l = Eu()), (I.updateQueue = l)),
      (l.memoCache = e),
      (l = e.data[e.index]),
      l === void 0)
    )
      for (l = e.data[e.index] = Array(t), a = 0; a < t; a++) l[a] = je;
    return (e.index++, l);
  }
  function We(t, e) {
    return typeof e == "function" ? e(t) : e;
  }
  function Au(t) {
    var e = Mt();
    return Ac(e, bt, t);
  }
  function Ac(t, e, l) {
    var a = t.queue;
    if (a === null) throw Error(s(311));
    a.lastRenderedReducer = l;
    var n = t.baseQueue,
      u = a.pending;
    if (u !== null) {
      if (n !== null) {
        var i = n.next;
        ((n.next = u.next), (u.next = i));
      }
      ((e.baseQueue = n = u), (a.pending = null));
    }
    if (((u = t.baseState), n === null)) t.memoizedState = u;
    else {
      e = n.next;
      var o = (i = null),
        m = null,
        T = e,
        N = !1;
      do {
        var j = T.lane & -536870913;
        if (j !== T.lane ? (ut & j) === j : (Fe & j) === j) {
          var A = T.revertLane;
          if (A === 0)
            (m !== null &&
              (m = m.next =
                {
                  lane: 0,
                  revertLane: 0,
                  gesture: null,
                  action: T.action,
                  hasEagerState: T.hasEagerState,
                  eagerState: T.eagerState,
                  next: null,
                }),
              j === ga && (N = !0));
          else if ((Fe & A) === A) {
            ((T = T.next), A === ga && (N = !0));
            continue;
          } else
            ((j = {
              lane: 0,
              revertLane: T.revertLane,
              gesture: null,
              action: T.action,
              hasEagerState: T.hasEagerState,
              eagerState: T.eagerState,
              next: null,
            }),
              m === null ? ((o = m = j), (i = u)) : (m = m.next = j),
              (I.lanes |= A),
              (Sl |= A));
          ((j = T.action),
            Kl && l(u, j),
            (u = T.hasEagerState ? T.eagerState : l(u, j)));
        } else
          ((A = {
            lane: j,
            revertLane: T.revertLane,
            gesture: T.gesture,
            action: T.action,
            hasEagerState: T.hasEagerState,
            eagerState: T.eagerState,
            next: null,
          }),
            m === null ? ((o = m = A), (i = u)) : (m = m.next = A),
            (I.lanes |= j),
            (Sl |= j));
        T = T.next;
      } while (T !== null && T !== e);
      if (
        (m === null ? (i = u) : (m.next = o),
        !ye(u, t.memoizedState) && ((qt = !0), N && ((l = ba), l !== null)))
      )
        throw l;
      ((t.memoizedState = u),
        (t.baseState = i),
        (t.baseQueue = m),
        (a.lastRenderedState = u));
    }
    return (n === null && (a.lanes = 0), [t.memoizedState, a.dispatch]);
  }
  function zc(t) {
    var e = Mt(),
      l = e.queue;
    if (l === null) throw Error(s(311));
    l.lastRenderedReducer = t;
    var a = l.dispatch,
      n = l.pending,
      u = e.memoizedState;
    if (n !== null) {
      l.pending = null;
      var i = (n = n.next);
      do ((u = t(u, i.action)), (i = i.next));
      while (i !== n);
      (ye(u, e.memoizedState) || (qt = !0),
        (e.memoizedState = u),
        e.baseQueue === null && (e.baseState = u),
        (l.lastRenderedState = u));
    }
    return [u, a];
  }
  function Ar(t, e, l) {
    var a = I,
      n = Mt(),
      u = ct;
    if (u) {
      if (l === void 0) throw Error(s(407));
      l = l();
    } else l = e();
    var i = !ye((bt || n).memoizedState, l);
    if (
      (i && ((n.memoizedState = l), (qt = !0)),
      (n = n.queue),
      xc(_r.bind(null, a, n, t), [t]),
      n.getSnapshot !== e || i || (Ht !== null && Ht.memoizedState.tag & 1))
    ) {
      if (
        ((a.flags |= 2048),
        za(9, { destroy: void 0 }, Or.bind(null, a, n, l, e), null),
        Tt === null)
      )
        throw Error(s(349));
      u || (Fe & 127) !== 0 || zr(a, e, l);
    }
    return l;
  }
  function zr(t, e, l) {
    ((t.flags |= 16384),
      (t = { getSnapshot: e, value: l }),
      (e = I.updateQueue),
      e === null
        ? ((e = Eu()), (I.updateQueue = e), (e.stores = [t]))
        : ((l = e.stores), l === null ? (e.stores = [t]) : l.push(t)));
  }
  function Or(t, e, l, a) {
    ((e.value = l), (e.getSnapshot = a), xr(e) && Rr(t));
  }
  function _r(t, e, l) {
    return l(function () {
      xr(e) && Rr(t);
    });
  }
  function xr(t) {
    var e = t.getSnapshot;
    t = t.value;
    try {
      var l = e();
      return !ye(t, l);
    } catch {
      return !0;
    }
  }
  function Rr(t) {
    var e = Bl(t, 2);
    e !== null && ce(e, t, 2);
  }
  function Oc(t) {
    var e = Pt();
    if (typeof t == "function") {
      var l = t;
      if (((t = l()), Kl)) {
        il(!0);
        try {
          l();
        } finally {
          il(!1);
        }
      }
    }
    return (
      (e.memoizedState = e.baseState = t),
      (e.queue = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: We,
        lastRenderedState: t,
      }),
      e
    );
  }
  function Nr(t, e, l, a) {
    return ((t.baseState = l), Ac(t, bt, typeof a == "function" ? a : We));
  }
  function o0(t, e, l, a, n) {
    if (_u(t)) throw Error(s(485));
    if (((t = e.action), t !== null)) {
      var u = {
        payload: n,
        action: t,
        next: null,
        isTransition: !0,
        status: "pending",
        value: null,
        reason: null,
        listeners: [],
        then: function (i) {
          u.listeners.push(i);
        },
      };
      (R.T !== null ? l(!0) : (u.isTransition = !1),
        a(u),
        (l = e.pending),
        l === null
          ? ((u.next = e.pending = u), Dr(e, u))
          : ((u.next = l.next), (e.pending = l.next = u)));
    }
  }
  function Dr(t, e) {
    var l = e.action,
      a = e.payload,
      n = t.state;
    if (e.isTransition) {
      var u = R.T,
        i = {};
      R.T = i;
      try {
        var o = l(n, a),
          m = R.S;
        (m !== null && m(i, o), Ur(t, e, o));
      } catch (T) {
        _c(t, e, T);
      } finally {
        (u !== null && i.types !== null && (u.types = i.types), (R.T = u));
      }
    } else
      try {
        ((u = l(n, a)), Ur(t, e, u));
      } catch (T) {
        _c(t, e, T);
      }
  }
  function Ur(t, e, l) {
    l !== null && typeof l == "object" && typeof l.then == "function"
      ? l.then(
          function (a) {
            Mr(t, e, a);
          },
          function (a) {
            return _c(t, e, a);
          },
        )
      : Mr(t, e, l);
  }
  function Mr(t, e, l) {
    ((e.status = "fulfilled"),
      (e.value = l),
      jr(e),
      (t.state = l),
      (e = t.pending),
      e !== null &&
        ((l = e.next),
        l === e ? (t.pending = null) : ((l = l.next), (e.next = l), Dr(t, l))));
  }
  function _c(t, e, l) {
    var a = t.pending;
    if (((t.pending = null), a !== null)) {
      a = a.next;
      do ((e.status = "rejected"), (e.reason = l), jr(e), (e = e.next));
      while (e !== a);
    }
    t.action = null;
  }
  function jr(t) {
    t = t.listeners;
    for (var e = 0; e < t.length; e++) (0, t[e])();
  }
  function Cr(t, e) {
    return e;
  }
  function Hr(t, e) {
    if (ct) {
      var l = Tt.formState;
      if (l !== null) {
        t: {
          var a = I;
          if (ct) {
            if (At) {
              e: {
                for (var n = At, u = Re; n.nodeType !== 8; ) {
                  if (!u) {
                    n = null;
                    break e;
                  }
                  if (((n = De(n.nextSibling)), n === null)) {
                    n = null;
                    break e;
                  }
                }
                ((u = n.data), (n = u === "F!" || u === "F" ? n : null));
              }
              if (n) {
                ((At = De(n.nextSibling)), (a = n.data === "F!"));
                break t;
              }
            }
            ol(a);
          }
          a = !1;
        }
        a && (e = l[0]);
      }
    }
    return (
      (l = Pt()),
      (l.memoizedState = l.baseState = e),
      (a = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: Cr,
        lastRenderedState: e,
      }),
      (l.queue = a),
      (l = to.bind(null, I, a)),
      (a.dispatch = l),
      (a = Oc(!1)),
      (u = Mc.bind(null, I, !1, a.queue)),
      (a = Pt()),
      (n = { state: e, dispatch: null, action: t, pending: null }),
      (a.queue = n),
      (l = o0.bind(null, I, n, u, l)),
      (n.dispatch = l),
      (a.memoizedState = t),
      [e, l, !1]
    );
  }
  function qr(t) {
    var e = Mt();
    return Br(e, bt, t);
  }
  function Br(t, e, l) {
    if (
      ((e = Ac(t, e, Cr)[0]),
      (t = Au(We)[0]),
      typeof e == "object" && e !== null && typeof e.then == "function")
    )
      try {
        var a = on(e);
      } catch (i) {
        throw i === pa ? mu : i;
      }
    else a = e;
    e = Mt();
    var n = e.queue,
      u = n.dispatch;
    return (
      l !== e.memoizedState &&
        ((I.flags |= 2048),
        za(9, { destroy: void 0 }, d0.bind(null, n, l), null)),
      [a, u, t]
    );
  }
  function d0(t, e) {
    t.action = e;
  }
  function Yr(t) {
    var e = Mt(),
      l = bt;
    if (l !== null) return Br(e, l, t);
    (Mt(), (e = e.memoizedState), (l = Mt()));
    var a = l.queue.dispatch;
    return ((l.memoizedState = t), [e, a, !1]);
  }
  function za(t, e, l, a) {
    return (
      (t = { tag: t, create: l, deps: a, inst: e, next: null }),
      (e = I.updateQueue),
      e === null && ((e = Eu()), (I.updateQueue = e)),
      (l = e.lastEffect),
      l === null
        ? (e.lastEffect = t.next = t)
        : ((a = l.next), (l.next = t), (t.next = a), (e.lastEffect = t)),
      t
    );
  }
  function Lr() {
    return Mt().memoizedState;
  }
  function zu(t, e, l, a) {
    var n = Pt();
    ((I.flags |= t),
      (n.memoizedState = za(
        1 | e,
        { destroy: void 0 },
        l,
        a === void 0 ? null : a,
      )));
  }
  function Ou(t, e, l, a) {
    var n = Mt();
    a = a === void 0 ? null : a;
    var u = n.memoizedState.inst;
    bt !== null && a !== null && gc(a, bt.memoizedState.deps)
      ? (n.memoizedState = za(e, u, l, a))
      : ((I.flags |= t), (n.memoizedState = za(1 | e, u, l, a)));
  }
  function wr(t, e) {
    zu(8390656, 8, t, e);
  }
  function xc(t, e) {
    Ou(2048, 8, t, e);
  }
  function m0(t) {
    I.flags |= 4;
    var e = I.updateQueue;
    if (e === null) ((e = Eu()), (I.updateQueue = e), (e.events = [t]));
    else {
      var l = e.events;
      l === null ? (e.events = [t]) : l.push(t);
    }
  }
  function Gr(t) {
    var e = Mt().memoizedState;
    return (
      m0({ ref: e, nextImpl: t }),
      function () {
        if ((dt & 2) !== 0) throw Error(s(440));
        return e.impl.apply(void 0, arguments);
      }
    );
  }
  function Qr(t, e) {
    return Ou(4, 2, t, e);
  }
  function Xr(t, e) {
    return Ou(4, 4, t, e);
  }
  function Zr(t, e) {
    if (typeof e == "function") {
      t = t();
      var l = e(t);
      return function () {
        typeof l == "function" ? l() : e(null);
      };
    }
    if (e != null)
      return (
        (t = t()),
        (e.current = t),
        function () {
          e.current = null;
        }
      );
  }
  function Vr(t, e, l) {
    ((l = l != null ? l.concat([t]) : null), Ou(4, 4, Zr.bind(null, e, t), l));
  }
  function Rc() {}
  function Kr(t, e) {
    var l = Mt();
    e = e === void 0 ? null : e;
    var a = l.memoizedState;
    return e !== null && gc(e, a[1]) ? a[0] : ((l.memoizedState = [t, e]), t);
  }
  function Jr(t, e) {
    var l = Mt();
    e = e === void 0 ? null : e;
    var a = l.memoizedState;
    if (e !== null && gc(e, a[1])) return a[0];
    if (((a = t()), Kl)) {
      il(!0);
      try {
        t();
      } finally {
        il(!1);
      }
    }
    return ((l.memoizedState = [a, e]), a);
  }
  function Nc(t, e, l) {
    return l === void 0 || ((Fe & 1073741824) !== 0 && (ut & 261930) === 0)
      ? (t.memoizedState = e)
      : ((t.memoizedState = l), (t = Fo()), (I.lanes |= t), (Sl |= t), l);
  }
  function kr(t, e, l, a) {
    return ye(l, e)
      ? l
      : Ea.current !== null
        ? ((t = Nc(t, l, a)), ye(t, e) || (qt = !0), t)
        : (Fe & 42) === 0 || ((Fe & 1073741824) !== 0 && (ut & 261930) === 0)
          ? ((qt = !0), (t.memoizedState = l))
          : ((t = Fo()), (I.lanes |= t), (Sl |= t), e);
  }
  function Fr(t, e, l, a, n) {
    var u = Y.p;
    Y.p = u !== 0 && 8 > u ? u : 8;
    var i = R.T,
      o = {};
    ((R.T = o), Mc(t, !1, e, l));
    try {
      var m = n(),
        T = R.S;
      if (
        (T !== null && T(o, m),
        m !== null && typeof m == "object" && typeof m.then == "function")
      ) {
        var N = f0(m, a);
        dn(t, e, N, Ee(t));
      } else dn(t, e, a, Ee(t));
    } catch (j) {
      dn(t, e, { then: function () {}, status: "rejected", reason: j }, Ee());
    } finally {
      ((Y.p = u),
        i !== null && o.types !== null && (i.types = o.types),
        (R.T = i));
    }
  }
  function h0() {}
  function Dc(t, e, l, a) {
    if (t.tag !== 5) throw Error(s(476));
    var n = Wr(t).queue;
    Fr(
      t,
      n,
      e,
      K,
      l === null
        ? h0
        : function () {
            return ($r(t), l(a));
          },
    );
  }
  function Wr(t) {
    var e = t.memoizedState;
    if (e !== null) return e;
    e = {
      memoizedState: K,
      baseState: K,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: We,
        lastRenderedState: K,
      },
      next: null,
    };
    var l = {};
    return (
      (e.next = {
        memoizedState: l,
        baseState: l,
        baseQueue: null,
        queue: {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: We,
          lastRenderedState: l,
        },
        next: null,
      }),
      (t.memoizedState = e),
      (t = t.alternate),
      t !== null && (t.memoizedState = e),
      e
    );
  }
  function $r(t) {
    var e = Wr(t);
    (e.next === null && (e = t.alternate.memoizedState),
      dn(t, e.next.queue, {}, Ee()));
  }
  function Uc() {
    return Kt(Nn);
  }
  function Ir() {
    return Mt().memoizedState;
  }
  function Pr() {
    return Mt().memoizedState;
  }
  function y0(t) {
    for (var e = t.return; e !== null; ) {
      switch (e.tag) {
        case 24:
        case 3:
          var l = Ee();
          t = hl(l);
          var a = yl(e, t, l);
          (a !== null && (ce(a, e, l), cn(a, e, l)),
            (e = { cache: ic() }),
            (t.payload = e));
          return;
      }
      e = e.return;
    }
  }
  function v0(t, e, l) {
    var a = Ee();
    ((l = {
      lane: a,
      revertLane: 0,
      gesture: null,
      action: l,
      hasEagerState: !1,
      eagerState: null,
      next: null,
    }),
      _u(t)
        ? eo(e, l)
        : ((l = Fi(t, e, l, a)), l !== null && (ce(l, t, a), lo(l, e, a))));
  }
  function to(t, e, l) {
    var a = Ee();
    dn(t, e, l, a);
  }
  function dn(t, e, l, a) {
    var n = {
      lane: a,
      revertLane: 0,
      gesture: null,
      action: l,
      hasEagerState: !1,
      eagerState: null,
      next: null,
    };
    if (_u(t)) eo(e, n);
    else {
      var u = t.alternate;
      if (
        t.lanes === 0 &&
        (u === null || u.lanes === 0) &&
        ((u = e.lastRenderedReducer), u !== null)
      )
        try {
          var i = e.lastRenderedState,
            o = u(i, l);
          if (((n.hasEagerState = !0), (n.eagerState = o), ye(o, i)))
            return (iu(t, e, n, 0), Tt === null && uu(), !1);
        } catch {}
      if (((l = Fi(t, e, n, a)), l !== null))
        return (ce(l, t, a), lo(l, e, a), !0);
    }
    return !1;
  }
  function Mc(t, e, l, a) {
    if (
      ((a = {
        lane: 2,
        revertLane: of(),
        gesture: null,
        action: a,
        hasEagerState: !1,
        eagerState: null,
        next: null,
      }),
      _u(t))
    ) {
      if (e) throw Error(s(479));
    } else ((e = Fi(t, l, a, 2)), e !== null && ce(e, t, 2));
  }
  function _u(t) {
    var e = t.alternate;
    return t === I || (e !== null && e === I);
  }
  function eo(t, e) {
    Ta = pu = !0;
    var l = t.pending;
    (l === null ? (e.next = e) : ((e.next = l.next), (l.next = e)),
      (t.pending = e));
  }
  function lo(t, e, l) {
    if ((l & 4194048) !== 0) {
      var a = e.lanes;
      ((a &= t.pendingLanes), (l |= a), (e.lanes = l), cs(t, l));
    }
  }
  var mn = {
    readContext: Kt,
    use: Tu,
    useCallback: Rt,
    useContext: Rt,
    useEffect: Rt,
    useImperativeHandle: Rt,
    useLayoutEffect: Rt,
    useInsertionEffect: Rt,
    useMemo: Rt,
    useReducer: Rt,
    useRef: Rt,
    useState: Rt,
    useDebugValue: Rt,
    useDeferredValue: Rt,
    useTransition: Rt,
    useSyncExternalStore: Rt,
    useId: Rt,
    useHostTransitionStatus: Rt,
    useFormState: Rt,
    useActionState: Rt,
    useOptimistic: Rt,
    useMemoCache: Rt,
    useCacheRefresh: Rt,
  };
  mn.useEffectEvent = Rt;
  var ao = {
      readContext: Kt,
      use: Tu,
      useCallback: function (t, e) {
        return ((Pt().memoizedState = [t, e === void 0 ? null : e]), t);
      },
      useContext: Kt,
      useEffect: wr,
      useImperativeHandle: function (t, e, l) {
        ((l = l != null ? l.concat([t]) : null),
          zu(4194308, 4, Zr.bind(null, e, t), l));
      },
      useLayoutEffect: function (t, e) {
        return zu(4194308, 4, t, e);
      },
      useInsertionEffect: function (t, e) {
        zu(4, 2, t, e);
      },
      useMemo: function (t, e) {
        var l = Pt();
        e = e === void 0 ? null : e;
        var a = t();
        if (Kl) {
          il(!0);
          try {
            t();
          } finally {
            il(!1);
          }
        }
        return ((l.memoizedState = [a, e]), a);
      },
      useReducer: function (t, e, l) {
        var a = Pt();
        if (l !== void 0) {
          var n = l(e);
          if (Kl) {
            il(!0);
            try {
              l(e);
            } finally {
              il(!1);
            }
          }
        } else n = e;
        return (
          (a.memoizedState = a.baseState = n),
          (t = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: t,
            lastRenderedState: n,
          }),
          (a.queue = t),
          (t = t.dispatch = v0.bind(null, I, t)),
          [a.memoizedState, t]
        );
      },
      useRef: function (t) {
        var e = Pt();
        return ((t = { current: t }), (e.memoizedState = t));
      },
      useState: function (t) {
        t = Oc(t);
        var e = t.queue,
          l = to.bind(null, I, e);
        return ((e.dispatch = l), [t.memoizedState, l]);
      },
      useDebugValue: Rc,
      useDeferredValue: function (t, e) {
        var l = Pt();
        return Nc(l, t, e);
      },
      useTransition: function () {
        var t = Oc(!1);
        return (
          (t = Fr.bind(null, I, t.queue, !0, !1)),
          (Pt().memoizedState = t),
          [!1, t]
        );
      },
      useSyncExternalStore: function (t, e, l) {
        var a = I,
          n = Pt();
        if (ct) {
          if (l === void 0) throw Error(s(407));
          l = l();
        } else {
          if (((l = e()), Tt === null)) throw Error(s(349));
          (ut & 127) !== 0 || zr(a, e, l);
        }
        n.memoizedState = l;
        var u = { value: l, getSnapshot: e };
        return (
          (n.queue = u),
          wr(_r.bind(null, a, u, t), [t]),
          (a.flags |= 2048),
          za(9, { destroy: void 0 }, Or.bind(null, a, u, l, e), null),
          l
        );
      },
      useId: function () {
        var t = Pt(),
          e = Tt.identifierPrefix;
        if (ct) {
          var l = Le,
            a = Ye;
          ((l = (a & ~(1 << (32 - he(a) - 1))).toString(32) + l),
            (e = "_" + e + "R_" + l),
            (l = Su++),
            0 < l && (e += "H" + l.toString(32)),
            (e += "_"));
        } else ((l = s0++), (e = "_" + e + "r_" + l.toString(32) + "_"));
        return (t.memoizedState = e);
      },
      useHostTransitionStatus: Uc,
      useFormState: Hr,
      useActionState: Hr,
      useOptimistic: function (t) {
        var e = Pt();
        e.memoizedState = e.baseState = t;
        var l = {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: null,
          lastRenderedState: null,
        };
        return (
          (e.queue = l),
          (e = Mc.bind(null, I, !0, l)),
          (l.dispatch = e),
          [t, e]
        );
      },
      useMemoCache: Tc,
      useCacheRefresh: function () {
        return (Pt().memoizedState = y0.bind(null, I));
      },
      useEffectEvent: function (t) {
        var e = Pt(),
          l = { impl: t };
        return (
          (e.memoizedState = l),
          function () {
            if ((dt & 2) !== 0) throw Error(s(440));
            return l.impl.apply(void 0, arguments);
          }
        );
      },
    },
    jc = {
      readContext: Kt,
      use: Tu,
      useCallback: Kr,
      useContext: Kt,
      useEffect: xc,
      useImperativeHandle: Vr,
      useInsertionEffect: Qr,
      useLayoutEffect: Xr,
      useMemo: Jr,
      useReducer: Au,
      useRef: Lr,
      useState: function () {
        return Au(We);
      },
      useDebugValue: Rc,
      useDeferredValue: function (t, e) {
        var l = Mt();
        return kr(l, bt.memoizedState, t, e);
      },
      useTransition: function () {
        var t = Au(We)[0],
          e = Mt().memoizedState;
        return [typeof t == "boolean" ? t : on(t), e];
      },
      useSyncExternalStore: Ar,
      useId: Ir,
      useHostTransitionStatus: Uc,
      useFormState: qr,
      useActionState: qr,
      useOptimistic: function (t, e) {
        var l = Mt();
        return Nr(l, bt, t, e);
      },
      useMemoCache: Tc,
      useCacheRefresh: Pr,
    };
  jc.useEffectEvent = Gr;
  var no = {
    readContext: Kt,
    use: Tu,
    useCallback: Kr,
    useContext: Kt,
    useEffect: xc,
    useImperativeHandle: Vr,
    useInsertionEffect: Qr,
    useLayoutEffect: Xr,
    useMemo: Jr,
    useReducer: zc,
    useRef: Lr,
    useState: function () {
      return zc(We);
    },
    useDebugValue: Rc,
    useDeferredValue: function (t, e) {
      var l = Mt();
      return bt === null ? Nc(l, t, e) : kr(l, bt.memoizedState, t, e);
    },
    useTransition: function () {
      var t = zc(We)[0],
        e = Mt().memoizedState;
      return [typeof t == "boolean" ? t : on(t), e];
    },
    useSyncExternalStore: Ar,
    useId: Ir,
    useHostTransitionStatus: Uc,
    useFormState: Yr,
    useActionState: Yr,
    useOptimistic: function (t, e) {
      var l = Mt();
      return bt !== null
        ? Nr(l, bt, t, e)
        : ((l.baseState = t), [t, l.queue.dispatch]);
    },
    useMemoCache: Tc,
    useCacheRefresh: Pr,
  };
  no.useEffectEvent = Gr;
  function Cc(t, e, l, a) {
    ((e = t.memoizedState),
      (l = l(a, e)),
      (l = l == null ? e : C({}, e, l)),
      (t.memoizedState = l),
      t.lanes === 0 && (t.updateQueue.baseState = l));
  }
  var Hc = {
    enqueueSetState: function (t, e, l) {
      t = t._reactInternals;
      var a = Ee(),
        n = hl(a);
      ((n.payload = e),
        l != null && (n.callback = l),
        (e = yl(t, n, a)),
        e !== null && (ce(e, t, a), cn(e, t, a)));
    },
    enqueueReplaceState: function (t, e, l) {
      t = t._reactInternals;
      var a = Ee(),
        n = hl(a);
      ((n.tag = 1),
        (n.payload = e),
        l != null && (n.callback = l),
        (e = yl(t, n, a)),
        e !== null && (ce(e, t, a), cn(e, t, a)));
    },
    enqueueForceUpdate: function (t, e) {
      t = t._reactInternals;
      var l = Ee(),
        a = hl(l);
      ((a.tag = 2),
        e != null && (a.callback = e),
        (e = yl(t, a, l)),
        e !== null && (ce(e, t, l), cn(e, t, l)));
    },
  };
  function uo(t, e, l, a, n, u, i) {
    return (
      (t = t.stateNode),
      typeof t.shouldComponentUpdate == "function"
        ? t.shouldComponentUpdate(a, u, i)
        : e.prototype && e.prototype.isPureReactComponent
          ? !Ia(l, a) || !Ia(n, u)
          : !0
    );
  }
  function io(t, e, l, a) {
    ((t = e.state),
      typeof e.componentWillReceiveProps == "function" &&
        e.componentWillReceiveProps(l, a),
      typeof e.UNSAFE_componentWillReceiveProps == "function" &&
        e.UNSAFE_componentWillReceiveProps(l, a),
      e.state !== t && Hc.enqueueReplaceState(e, e.state, null));
  }
  function Jl(t, e) {
    var l = e;
    if ("ref" in e) {
      l = {};
      for (var a in e) a !== "ref" && (l[a] = e[a]);
    }
    if ((t = t.defaultProps)) {
      l === e && (l = C({}, l));
      for (var n in t) l[n] === void 0 && (l[n] = t[n]);
    }
    return l;
  }
  function co(t) {
    nu(t);
  }
  function fo(t) {
    console.error(t);
  }
  function so(t) {
    nu(t);
  }
  function xu(t, e) {
    try {
      var l = t.onUncaughtError;
      l(e.value, { componentStack: e.stack });
    } catch (a) {
      setTimeout(function () {
        throw a;
      });
    }
  }
  function ro(t, e, l) {
    try {
      var a = t.onCaughtError;
      a(l.value, {
        componentStack: l.stack,
        errorBoundary: e.tag === 1 ? e.stateNode : null,
      });
    } catch (n) {
      setTimeout(function () {
        throw n;
      });
    }
  }
  function qc(t, e, l) {
    return (
      (l = hl(l)),
      (l.tag = 3),
      (l.payload = { element: null }),
      (l.callback = function () {
        xu(t, e);
      }),
      l
    );
  }
  function oo(t) {
    return ((t = hl(t)), (t.tag = 3), t);
  }
  function mo(t, e, l, a) {
    var n = l.type.getDerivedStateFromError;
    if (typeof n == "function") {
      var u = a.value;
      ((t.payload = function () {
        return n(u);
      }),
        (t.callback = function () {
          ro(e, l, a);
        }));
    }
    var i = l.stateNode;
    i !== null &&
      typeof i.componentDidCatch == "function" &&
      (t.callback = function () {
        (ro(e, l, a),
          typeof n != "function" &&
            (El === null ? (El = new Set([this])) : El.add(this)));
        var o = a.stack;
        this.componentDidCatch(a.value, {
          componentStack: o !== null ? o : "",
        });
      });
  }
  function g0(t, e, l, a, n) {
    if (
      ((l.flags |= 32768),
      a !== null && typeof a == "object" && typeof a.then == "function")
    ) {
      if (
        ((e = l.alternate),
        e !== null && va(e, l, n, !0),
        (l = ge.current),
        l !== null)
      ) {
        switch (l.tag) {
          case 31:
          case 13:
            return (
              Ne === null ? Lu() : l.alternate === null && Nt === 0 && (Nt = 3),
              (l.flags &= -257),
              (l.flags |= 65536),
              (l.lanes = n),
              a === hu
                ? (l.flags |= 16384)
                : ((e = l.updateQueue),
                  e === null ? (l.updateQueue = new Set([a])) : e.add(a),
                  ff(t, a, n)),
              !1
            );
          case 22:
            return (
              (l.flags |= 65536),
              a === hu
                ? (l.flags |= 16384)
                : ((e = l.updateQueue),
                  e === null
                    ? ((e = {
                        transitions: null,
                        markerInstances: null,
                        retryQueue: new Set([a]),
                      }),
                      (l.updateQueue = e))
                    : ((l = e.retryQueue),
                      l === null ? (e.retryQueue = new Set([a])) : l.add(a)),
                  ff(t, a, n)),
              !1
            );
        }
        throw Error(s(435, l.tag));
      }
      return (ff(t, a, n), Lu(), !1);
    }
    if (ct)
      return (
        (e = ge.current),
        e !== null
          ? ((e.flags & 65536) === 0 && (e.flags |= 256),
            (e.flags |= 65536),
            (e.lanes = n),
            a !== ec && ((t = Error(s(422), { cause: a })), en(Oe(t, l))))
          : (a !== ec && ((e = Error(s(423), { cause: a })), en(Oe(e, l))),
            (t = t.current.alternate),
            (t.flags |= 65536),
            (n &= -n),
            (t.lanes |= n),
            (a = Oe(a, l)),
            (n = qc(t.stateNode, a, n)),
            dc(t, n),
            Nt !== 4 && (Nt = 2)),
        !1
      );
    var u = Error(s(520), { cause: a });
    if (
      ((u = Oe(u, l)),
      En === null ? (En = [u]) : En.push(u),
      Nt !== 4 && (Nt = 2),
      e === null)
    )
      return !0;
    ((a = Oe(a, l)), (l = e));
    do {
      switch (l.tag) {
        case 3:
          return (
            (l.flags |= 65536),
            (t = n & -n),
            (l.lanes |= t),
            (t = qc(l.stateNode, a, t)),
            dc(l, t),
            !1
          );
        case 1:
          if (
            ((e = l.type),
            (u = l.stateNode),
            (l.flags & 128) === 0 &&
              (typeof e.getDerivedStateFromError == "function" ||
                (u !== null &&
                  typeof u.componentDidCatch == "function" &&
                  (El === null || !El.has(u)))))
          )
            return (
              (l.flags |= 65536),
              (n &= -n),
              (l.lanes |= n),
              (n = oo(n)),
              mo(n, t, l, a),
              dc(l, n),
              !1
            );
      }
      l = l.return;
    } while (l !== null);
    return !1;
  }
  var Bc = Error(s(461)),
    qt = !1;
  function Jt(t, e, l, a) {
    e.child = t === null ? vr(e, null, l, a) : Vl(e, t.child, l, a);
  }
  function ho(t, e, l, a, n) {
    l = l.render;
    var u = e.ref;
    if ("ref" in a) {
      var i = {};
      for (var o in a) o !== "ref" && (i[o] = a[o]);
    } else i = a;
    return (
      Gl(e),
      (a = bc(t, e, l, i, u, n)),
      (o = pc()),
      t !== null && !qt
        ? (Sc(t, e, n), $e(t, e, n))
        : (ct && o && Pi(e), (e.flags |= 1), Jt(t, e, a, n), e.child)
    );
  }
  function yo(t, e, l, a, n) {
    if (t === null) {
      var u = l.type;
      return typeof u == "function" &&
        !Wi(u) &&
        u.defaultProps === void 0 &&
        l.compare === null
        ? ((e.tag = 15), (e.type = u), vo(t, e, u, a, n))
        : ((t = fu(l.type, null, a, e, e.mode, n)),
          (t.ref = e.ref),
          (t.return = e),
          (e.child = t));
    }
    if (((u = t.child), !Vc(t, n))) {
      var i = u.memoizedProps;
      if (
        ((l = l.compare), (l = l !== null ? l : Ia), l(i, a) && t.ref === e.ref)
      )
        return $e(t, e, n);
    }
    return (
      (e.flags |= 1),
      (t = Ve(u, a)),
      (t.ref = e.ref),
      (t.return = e),
      (e.child = t)
    );
  }
  function vo(t, e, l, a, n) {
    if (t !== null) {
      var u = t.memoizedProps;
      if (Ia(u, a) && t.ref === e.ref)
        if (((qt = !1), (e.pendingProps = a = u), Vc(t, n)))
          (t.flags & 131072) !== 0 && (qt = !0);
        else return ((e.lanes = t.lanes), $e(t, e, n));
    }
    return Yc(t, e, l, a, n);
  }
  function go(t, e, l, a) {
    var n = a.children,
      u = t !== null ? t.memoizedState : null;
    if (
      (t === null &&
        e.stateNode === null &&
        (e.stateNode = {
          _visibility: 1,
          _pendingMarkers: null,
          _retryCache: null,
          _transitions: null,
        }),
      a.mode === "hidden")
    ) {
      if ((e.flags & 128) !== 0) {
        if (((u = u !== null ? u.baseLanes | l : l), t !== null)) {
          for (a = e.child = t.child, n = 0; a !== null; )
            ((n = n | a.lanes | a.childLanes), (a = a.sibling));
          a = n & ~u;
        } else ((a = 0), (e.child = null));
        return bo(t, e, u, l, a);
      }
      if ((l & 536870912) !== 0)
        ((e.memoizedState = { baseLanes: 0, cachePool: null }),
          t !== null && du(e, u !== null ? u.cachePool : null),
          u !== null ? pr(e, u) : hc(),
          Sr(e));
      else
        return (
          (a = e.lanes = 536870912),
          bo(t, e, u !== null ? u.baseLanes | l : l, l, a)
        );
    } else
      u !== null
        ? (du(e, u.cachePool), pr(e, u), gl(), (e.memoizedState = null))
        : (t !== null && du(e, null), hc(), gl());
    return (Jt(t, e, n, l), e.child);
  }
  function hn(t, e) {
    return (
      (t !== null && t.tag === 22) ||
        e.stateNode !== null ||
        (e.stateNode = {
          _visibility: 1,
          _pendingMarkers: null,
          _retryCache: null,
          _transitions: null,
        }),
      e.sibling
    );
  }
  function bo(t, e, l, a, n) {
    var u = fc();
    return (
      (u = u === null ? null : { parent: Ct._currentValue, pool: u }),
      (e.memoizedState = { baseLanes: l, cachePool: u }),
      t !== null && du(e, null),
      hc(),
      Sr(e),
      t !== null && va(t, e, a, !0),
      (e.childLanes = n),
      null
    );
  }
  function Ru(t, e) {
    return (
      (e = Du({ mode: e.mode, children: e.children }, t.mode)),
      (e.ref = t.ref),
      (t.child = e),
      (e.return = t),
      e
    );
  }
  function po(t, e, l) {
    return (
      Vl(e, t.child, null, l),
      (t = Ru(e, e.pendingProps)),
      (t.flags |= 2),
      be(e),
      (e.memoizedState = null),
      t
    );
  }
  function b0(t, e, l) {
    var a = e.pendingProps,
      n = (e.flags & 128) !== 0;
    if (((e.flags &= -129), t === null)) {
      if (ct) {
        if (a.mode === "hidden")
          return ((t = Ru(e, a)), (e.lanes = 536870912), hn(null, t));
        if (
          (vc(e),
          (t = At)
            ? ((t = Ud(t, Re)),
              (t = t !== null && t.data === "&" ? t : null),
              t !== null &&
                ((e.memoizedState = {
                  dehydrated: t,
                  treeContext: sl !== null ? { id: Ye, overflow: Le } : null,
                  retryLane: 536870912,
                  hydrationErrors: null,
                }),
                (l = er(t)),
                (l.return = e),
                (e.child = l),
                (Vt = e),
                (At = null)))
            : (t = null),
          t === null)
        )
          throw ol(e);
        return ((e.lanes = 536870912), null);
      }
      return Ru(e, a);
    }
    var u = t.memoizedState;
    if (u !== null) {
      var i = u.dehydrated;
      if ((vc(e), n))
        if (e.flags & 256) ((e.flags &= -257), (e = po(t, e, l)));
        else if (e.memoizedState !== null)
          ((e.child = t.child), (e.flags |= 128), (e = null));
        else throw Error(s(558));
      else if (
        (qt || va(t, e, l, !1), (n = (l & t.childLanes) !== 0), qt || n)
      ) {
        if (
          ((a = Tt),
          a !== null && ((i = fs(a, l)), i !== 0 && i !== u.retryLane))
        )
          throw ((u.retryLane = i), Bl(t, i), ce(a, t, i), Bc);
        (Lu(), (e = po(t, e, l)));
      } else
        ((t = u.treeContext),
          (At = De(i.nextSibling)),
          (Vt = e),
          (ct = !0),
          (rl = null),
          (Re = !1),
          t !== null && nr(e, t),
          (e = Ru(e, a)),
          (e.flags |= 4096));
      return e;
    }
    return (
      (t = Ve(t.child, { mode: a.mode, children: a.children })),
      (t.ref = e.ref),
      (e.child = t),
      (t.return = e),
      t
    );
  }
  function Nu(t, e) {
    var l = e.ref;
    if (l === null) t !== null && t.ref !== null && (e.flags |= 4194816);
    else {
      if (typeof l != "function" && typeof l != "object") throw Error(s(284));
      (t === null || t.ref !== l) && (e.flags |= 4194816);
    }
  }
  function Yc(t, e, l, a, n) {
    return (
      Gl(e),
      (l = bc(t, e, l, a, void 0, n)),
      (a = pc()),
      t !== null && !qt
        ? (Sc(t, e, n), $e(t, e, n))
        : (ct && a && Pi(e), (e.flags |= 1), Jt(t, e, l, n), e.child)
    );
  }
  function So(t, e, l, a, n, u) {
    return (
      Gl(e),
      (e.updateQueue = null),
      (l = Tr(e, a, l, n)),
      Er(t),
      (a = pc()),
      t !== null && !qt
        ? (Sc(t, e, u), $e(t, e, u))
        : (ct && a && Pi(e), (e.flags |= 1), Jt(t, e, l, u), e.child)
    );
  }
  function Eo(t, e, l, a, n) {
    if ((Gl(e), e.stateNode === null)) {
      var u = da,
        i = l.contextType;
      (typeof i == "object" && i !== null && (u = Kt(i)),
        (u = new l(a, u)),
        (e.memoizedState =
          u.state !== null && u.state !== void 0 ? u.state : null),
        (u.updater = Hc),
        (e.stateNode = u),
        (u._reactInternals = e),
        (u = e.stateNode),
        (u.props = a),
        (u.state = e.memoizedState),
        (u.refs = {}),
        rc(e),
        (i = l.contextType),
        (u.context = typeof i == "object" && i !== null ? Kt(i) : da),
        (u.state = e.memoizedState),
        (i = l.getDerivedStateFromProps),
        typeof i == "function" && (Cc(e, l, i, a), (u.state = e.memoizedState)),
        typeof l.getDerivedStateFromProps == "function" ||
          typeof u.getSnapshotBeforeUpdate == "function" ||
          (typeof u.UNSAFE_componentWillMount != "function" &&
            typeof u.componentWillMount != "function") ||
          ((i = u.state),
          typeof u.componentWillMount == "function" && u.componentWillMount(),
          typeof u.UNSAFE_componentWillMount == "function" &&
            u.UNSAFE_componentWillMount(),
          i !== u.state && Hc.enqueueReplaceState(u, u.state, null),
          sn(e, a, u, n),
          fn(),
          (u.state = e.memoizedState)),
        typeof u.componentDidMount == "function" && (e.flags |= 4194308),
        (a = !0));
    } else if (t === null) {
      u = e.stateNode;
      var o = e.memoizedProps,
        m = Jl(l, o);
      u.props = m;
      var T = u.context,
        N = l.contextType;
      ((i = da), typeof N == "object" && N !== null && (i = Kt(N)));
      var j = l.getDerivedStateFromProps;
      ((N =
        typeof j == "function" ||
        typeof u.getSnapshotBeforeUpdate == "function"),
        (o = e.pendingProps !== o),
        N ||
          (typeof u.UNSAFE_componentWillReceiveProps != "function" &&
            typeof u.componentWillReceiveProps != "function") ||
          ((o || T !== i) && io(e, u, a, i)),
        (ml = !1));
      var A = e.memoizedState;
      ((u.state = A),
        sn(e, a, u, n),
        fn(),
        (T = e.memoizedState),
        o || A !== T || ml
          ? (typeof j == "function" && (Cc(e, l, j, a), (T = e.memoizedState)),
            (m = ml || uo(e, l, m, a, A, T, i))
              ? (N ||
                  (typeof u.UNSAFE_componentWillMount != "function" &&
                    typeof u.componentWillMount != "function") ||
                  (typeof u.componentWillMount == "function" &&
                    u.componentWillMount(),
                  typeof u.UNSAFE_componentWillMount == "function" &&
                    u.UNSAFE_componentWillMount()),
                typeof u.componentDidMount == "function" &&
                  (e.flags |= 4194308))
              : (typeof u.componentDidMount == "function" &&
                  (e.flags |= 4194308),
                (e.memoizedProps = a),
                (e.memoizedState = T)),
            (u.props = a),
            (u.state = T),
            (u.context = i),
            (a = m))
          : (typeof u.componentDidMount == "function" && (e.flags |= 4194308),
            (a = !1)));
    } else {
      ((u = e.stateNode),
        oc(t, e),
        (i = e.memoizedProps),
        (N = Jl(l, i)),
        (u.props = N),
        (j = e.pendingProps),
        (A = u.context),
        (T = l.contextType),
        (m = da),
        typeof T == "object" && T !== null && (m = Kt(T)),
        (o = l.getDerivedStateFromProps),
        (T =
          typeof o == "function" ||
          typeof u.getSnapshotBeforeUpdate == "function") ||
          (typeof u.UNSAFE_componentWillReceiveProps != "function" &&
            typeof u.componentWillReceiveProps != "function") ||
          ((i !== j || A !== m) && io(e, u, a, m)),
        (ml = !1),
        (A = e.memoizedState),
        (u.state = A),
        sn(e, a, u, n),
        fn());
      var _ = e.memoizedState;
      i !== j ||
      A !== _ ||
      ml ||
      (t !== null && t.dependencies !== null && ru(t.dependencies))
        ? (typeof o == "function" && (Cc(e, l, o, a), (_ = e.memoizedState)),
          (N =
            ml ||
            uo(e, l, N, a, A, _, m) ||
            (t !== null && t.dependencies !== null && ru(t.dependencies)))
            ? (T ||
                (typeof u.UNSAFE_componentWillUpdate != "function" &&
                  typeof u.componentWillUpdate != "function") ||
                (typeof u.componentWillUpdate == "function" &&
                  u.componentWillUpdate(a, _, m),
                typeof u.UNSAFE_componentWillUpdate == "function" &&
                  u.UNSAFE_componentWillUpdate(a, _, m)),
              typeof u.componentDidUpdate == "function" && (e.flags |= 4),
              typeof u.getSnapshotBeforeUpdate == "function" &&
                (e.flags |= 1024))
            : (typeof u.componentDidUpdate != "function" ||
                (i === t.memoizedProps && A === t.memoizedState) ||
                (e.flags |= 4),
              typeof u.getSnapshotBeforeUpdate != "function" ||
                (i === t.memoizedProps && A === t.memoizedState) ||
                (e.flags |= 1024),
              (e.memoizedProps = a),
              (e.memoizedState = _)),
          (u.props = a),
          (u.state = _),
          (u.context = m),
          (a = N))
        : (typeof u.componentDidUpdate != "function" ||
            (i === t.memoizedProps && A === t.memoizedState) ||
            (e.flags |= 4),
          typeof u.getSnapshotBeforeUpdate != "function" ||
            (i === t.memoizedProps && A === t.memoizedState) ||
            (e.flags |= 1024),
          (a = !1));
    }
    return (
      (u = a),
      Nu(t, e),
      (a = (e.flags & 128) !== 0),
      u || a
        ? ((u = e.stateNode),
          (l =
            a && typeof l.getDerivedStateFromError != "function"
              ? null
              : u.render()),
          (e.flags |= 1),
          t !== null && a
            ? ((e.child = Vl(e, t.child, null, n)),
              (e.child = Vl(e, null, l, n)))
            : Jt(t, e, l, n),
          (e.memoizedState = u.state),
          (t = e.child))
        : (t = $e(t, e, n)),
      t
    );
  }
  function To(t, e, l, a) {
    return (Ll(), (e.flags |= 256), Jt(t, e, l, a), e.child);
  }
  var Lc = {
    dehydrated: null,
    treeContext: null,
    retryLane: 0,
    hydrationErrors: null,
  };
  function wc(t) {
    return { baseLanes: t, cachePool: rr() };
  }
  function Gc(t, e, l) {
    return ((t = t !== null ? t.childLanes & ~l : 0), e && (t |= Se), t);
  }
  function Ao(t, e, l) {
    var a = e.pendingProps,
      n = !1,
      u = (e.flags & 128) !== 0,
      i;
    if (
      ((i = u) ||
        (i =
          t !== null && t.memoizedState === null ? !1 : (Ut.current & 2) !== 0),
      i && ((n = !0), (e.flags &= -129)),
      (i = (e.flags & 32) !== 0),
      (e.flags &= -33),
      t === null)
    ) {
      if (ct) {
        if (
          (n ? vl(e) : gl(),
          (t = At)
            ? ((t = Ud(t, Re)),
              (t = t !== null && t.data !== "&" ? t : null),
              t !== null &&
                ((e.memoizedState = {
                  dehydrated: t,
                  treeContext: sl !== null ? { id: Ye, overflow: Le } : null,
                  retryLane: 536870912,
                  hydrationErrors: null,
                }),
                (l = er(t)),
                (l.return = e),
                (e.child = l),
                (Vt = e),
                (At = null)))
            : (t = null),
          t === null)
        )
          throw ol(e);
        return (zf(t) ? (e.lanes = 32) : (e.lanes = 536870912), null);
      }
      var o = a.children;
      return (
        (a = a.fallback),
        n
          ? (gl(),
            (n = e.mode),
            (o = Du({ mode: "hidden", children: o }, n)),
            (a = Yl(a, n, l, null)),
            (o.return = e),
            (a.return = e),
            (o.sibling = a),
            (e.child = o),
            (a = e.child),
            (a.memoizedState = wc(l)),
            (a.childLanes = Gc(t, i, l)),
            (e.memoizedState = Lc),
            hn(null, a))
          : (vl(e), Qc(e, o))
      );
    }
    var m = t.memoizedState;
    if (m !== null && ((o = m.dehydrated), o !== null)) {
      if (u)
        e.flags & 256
          ? (vl(e), (e.flags &= -257), (e = Xc(t, e, l)))
          : e.memoizedState !== null
            ? (gl(), (e.child = t.child), (e.flags |= 128), (e = null))
            : (gl(),
              (o = a.fallback),
              (n = e.mode),
              (a = Du({ mode: "visible", children: a.children }, n)),
              (o = Yl(o, n, l, null)),
              (o.flags |= 2),
              (a.return = e),
              (o.return = e),
              (a.sibling = o),
              (e.child = a),
              Vl(e, t.child, null, l),
              (a = e.child),
              (a.memoizedState = wc(l)),
              (a.childLanes = Gc(t, i, l)),
              (e.memoizedState = Lc),
              (e = hn(null, a)));
      else if ((vl(e), zf(o))) {
        if (((i = o.nextSibling && o.nextSibling.dataset), i)) var T = i.dgst;
        ((i = T),
          (a = Error(s(419))),
          (a.stack = ""),
          (a.digest = i),
          en({ value: a, source: null, stack: null }),
          (e = Xc(t, e, l)));
      } else if (
        (qt || va(t, e, l, !1), (i = (l & t.childLanes) !== 0), qt || i)
      ) {
        if (
          ((i = Tt),
          i !== null && ((a = fs(i, l)), a !== 0 && a !== m.retryLane))
        )
          throw ((m.retryLane = a), Bl(t, a), ce(i, t, a), Bc);
        (Af(o) || Lu(), (e = Xc(t, e, l)));
      } else
        Af(o)
          ? ((e.flags |= 192), (e.child = t.child), (e = null))
          : ((t = m.treeContext),
            (At = De(o.nextSibling)),
            (Vt = e),
            (ct = !0),
            (rl = null),
            (Re = !1),
            t !== null && nr(e, t),
            (e = Qc(e, a.children)),
            (e.flags |= 4096));
      return e;
    }
    return n
      ? (gl(),
        (o = a.fallback),
        (n = e.mode),
        (m = t.child),
        (T = m.sibling),
        (a = Ve(m, { mode: "hidden", children: a.children })),
        (a.subtreeFlags = m.subtreeFlags & 65011712),
        T !== null ? (o = Ve(T, o)) : ((o = Yl(o, n, l, null)), (o.flags |= 2)),
        (o.return = e),
        (a.return = e),
        (a.sibling = o),
        (e.child = a),
        hn(null, a),
        (a = e.child),
        (o = t.child.memoizedState),
        o === null
          ? (o = wc(l))
          : ((n = o.cachePool),
            n !== null
              ? ((m = Ct._currentValue),
                (n = n.parent !== m ? { parent: m, pool: m } : n))
              : (n = rr()),
            (o = { baseLanes: o.baseLanes | l, cachePool: n })),
        (a.memoizedState = o),
        (a.childLanes = Gc(t, i, l)),
        (e.memoizedState = Lc),
        hn(t.child, a))
      : (vl(e),
        (l = t.child),
        (t = l.sibling),
        (l = Ve(l, { mode: "visible", children: a.children })),
        (l.return = e),
        (l.sibling = null),
        t !== null &&
          ((i = e.deletions),
          i === null ? ((e.deletions = [t]), (e.flags |= 16)) : i.push(t)),
        (e.child = l),
        (e.memoizedState = null),
        l);
  }
  function Qc(t, e) {
    return (
      (e = Du({ mode: "visible", children: e }, t.mode)),
      (e.return = t),
      (t.child = e)
    );
  }
  function Du(t, e) {
    return ((t = ve(22, t, null, e)), (t.lanes = 0), t);
  }
  function Xc(t, e, l) {
    return (
      Vl(e, t.child, null, l),
      (t = Qc(e, e.pendingProps.children)),
      (t.flags |= 2),
      (e.memoizedState = null),
      t
    );
  }
  function zo(t, e, l) {
    t.lanes |= e;
    var a = t.alternate;
    (a !== null && (a.lanes |= e), nc(t.return, e, l));
  }
  function Zc(t, e, l, a, n, u) {
    var i = t.memoizedState;
    i === null
      ? (t.memoizedState = {
          isBackwards: e,
          rendering: null,
          renderingStartTime: 0,
          last: a,
          tail: l,
          tailMode: n,
          treeForkCount: u,
        })
      : ((i.isBackwards = e),
        (i.rendering = null),
        (i.renderingStartTime = 0),
        (i.last = a),
        (i.tail = l),
        (i.tailMode = n),
        (i.treeForkCount = u));
  }
  function Oo(t, e, l) {
    var a = e.pendingProps,
      n = a.revealOrder,
      u = a.tail;
    a = a.children;
    var i = Ut.current,
      o = (i & 2) !== 0;
    if (
      (o ? ((i = (i & 1) | 2), (e.flags |= 128)) : (i &= 1),
      L(Ut, i),
      Jt(t, e, a, l),
      (a = ct ? tn : 0),
      !o && t !== null && (t.flags & 128) !== 0)
    )
      t: for (t = e.child; t !== null; ) {
        if (t.tag === 13) t.memoizedState !== null && zo(t, l, e);
        else if (t.tag === 19) zo(t, l, e);
        else if (t.child !== null) {
          ((t.child.return = t), (t = t.child));
          continue;
        }
        if (t === e) break t;
        for (; t.sibling === null; ) {
          if (t.return === null || t.return === e) break t;
          t = t.return;
        }
        ((t.sibling.return = t.return), (t = t.sibling));
      }
    switch (n) {
      case "forwards":
        for (l = e.child, n = null; l !== null; )
          ((t = l.alternate),
            t !== null && bu(t) === null && (n = l),
            (l = l.sibling));
        ((l = n),
          l === null
            ? ((n = e.child), (e.child = null))
            : ((n = l.sibling), (l.sibling = null)),
          Zc(e, !1, n, l, u, a));
        break;
      case "backwards":
      case "unstable_legacy-backwards":
        for (l = null, n = e.child, e.child = null; n !== null; ) {
          if (((t = n.alternate), t !== null && bu(t) === null)) {
            e.child = n;
            break;
          }
          ((t = n.sibling), (n.sibling = l), (l = n), (n = t));
        }
        Zc(e, !0, l, null, u, a);
        break;
      case "together":
        Zc(e, !1, null, null, void 0, a);
        break;
      default:
        e.memoizedState = null;
    }
    return e.child;
  }
  function $e(t, e, l) {
    if (
      (t !== null && (e.dependencies = t.dependencies),
      (Sl |= e.lanes),
      (l & e.childLanes) === 0)
    )
      if (t !== null) {
        if ((va(t, e, l, !1), (l & e.childLanes) === 0)) return null;
      } else return null;
    if (t !== null && e.child !== t.child) throw Error(s(153));
    if (e.child !== null) {
      for (
        t = e.child, l = Ve(t, t.pendingProps), e.child = l, l.return = e;
        t.sibling !== null;
      )
        ((t = t.sibling),
          (l = l.sibling = Ve(t, t.pendingProps)),
          (l.return = e));
      l.sibling = null;
    }
    return e.child;
  }
  function Vc(t, e) {
    return (t.lanes & e) !== 0
      ? !0
      : ((t = t.dependencies), !!(t !== null && ru(t)));
  }
  function p0(t, e, l) {
    switch (e.tag) {
      case 3:
        (It(e, e.stateNode.containerInfo),
          dl(e, Ct, t.memoizedState.cache),
          Ll());
        break;
      case 27:
      case 5:
        La(e);
        break;
      case 4:
        It(e, e.stateNode.containerInfo);
        break;
      case 10:
        dl(e, e.type, e.memoizedProps.value);
        break;
      case 31:
        if (e.memoizedState !== null) return ((e.flags |= 128), vc(e), null);
        break;
      case 13:
        var a = e.memoizedState;
        if (a !== null)
          return a.dehydrated !== null
            ? (vl(e), (e.flags |= 128), null)
            : (l & e.child.childLanes) !== 0
              ? Ao(t, e, l)
              : (vl(e), (t = $e(t, e, l)), t !== null ? t.sibling : null);
        vl(e);
        break;
      case 19:
        var n = (t.flags & 128) !== 0;
        if (
          ((a = (l & e.childLanes) !== 0),
          a || (va(t, e, l, !1), (a = (l & e.childLanes) !== 0)),
          n)
        ) {
          if (a) return Oo(t, e, l);
          e.flags |= 128;
        }
        if (
          ((n = e.memoizedState),
          n !== null &&
            ((n.rendering = null), (n.tail = null), (n.lastEffect = null)),
          L(Ut, Ut.current),
          a)
        )
          break;
        return null;
      case 22:
        return ((e.lanes = 0), go(t, e, l, e.pendingProps));
      case 24:
        dl(e, Ct, t.memoizedState.cache);
    }
    return $e(t, e, l);
  }
  function _o(t, e, l) {
    if (t !== null)
      if (t.memoizedProps !== e.pendingProps) qt = !0;
      else {
        if (!Vc(t, l) && (e.flags & 128) === 0) return ((qt = !1), p0(t, e, l));
        qt = (t.flags & 131072) !== 0;
      }
    else ((qt = !1), ct && (e.flags & 1048576) !== 0 && ar(e, tn, e.index));
    switch (((e.lanes = 0), e.tag)) {
      case 16:
        t: {
          var a = e.pendingProps;
          if (((t = Xl(e.elementType)), (e.type = t), typeof t == "function"))
            Wi(t)
              ? ((a = Jl(t, a)), (e.tag = 1), (e = Eo(null, e, t, a, l)))
              : ((e.tag = 0), (e = Yc(null, e, t, a, l)));
          else {
            if (t != null) {
              var n = t.$$typeof;
              if (n === ht) {
                ((e.tag = 11), (e = ho(null, e, t, a, l)));
                break t;
              } else if (n === G) {
                ((e.tag = 14), (e = yo(null, e, t, a, l)));
                break t;
              }
            }
            throw ((e = Xt(t) || t), Error(s(306, e, "")));
          }
        }
        return e;
      case 0:
        return Yc(t, e, e.type, e.pendingProps, l);
      case 1:
        return ((a = e.type), (n = Jl(a, e.pendingProps)), Eo(t, e, a, n, l));
      case 3:
        t: {
          if ((It(e, e.stateNode.containerInfo), t === null))
            throw Error(s(387));
          a = e.pendingProps;
          var u = e.memoizedState;
          ((n = u.element), oc(t, e), sn(e, a, null, l));
          var i = e.memoizedState;
          if (
            ((a = i.cache),
            dl(e, Ct, a),
            a !== u.cache && uc(e, [Ct], l, !0),
            fn(),
            (a = i.element),
            u.isDehydrated)
          )
            if (
              ((u = { element: a, isDehydrated: !1, cache: i.cache }),
              (e.updateQueue.baseState = u),
              (e.memoizedState = u),
              e.flags & 256)
            ) {
              e = To(t, e, a, l);
              break t;
            } else if (a !== n) {
              ((n = Oe(Error(s(424)), e)), en(n), (e = To(t, e, a, l)));
              break t;
            } else
              for (
                t = e.stateNode.containerInfo,
                  t.nodeType === 9
                    ? (t = t.body)
                    : (t = t.nodeName === "HTML" ? t.ownerDocument.body : t),
                  At = De(t.firstChild),
                  Vt = e,
                  ct = !0,
                  rl = null,
                  Re = !0,
                  l = vr(e, null, a, l),
                  e.child = l;
                l;
              )
                ((l.flags = (l.flags & -3) | 4096), (l = l.sibling));
          else {
            if ((Ll(), a === n)) {
              e = $e(t, e, l);
              break t;
            }
            Jt(t, e, a, l);
          }
          e = e.child;
        }
        return e;
      case 26:
        return (
          Nu(t, e),
          t === null
            ? (l = Bd(e.type, null, e.pendingProps, null))
              ? (e.memoizedState = l)
              : ct ||
                ((l = e.type),
                (t = e.pendingProps),
                (a = Ku(lt.current).createElement(l)),
                (a[Zt] = e),
                (a[ee] = t),
                kt(a, l, t),
                Gt(a),
                (e.stateNode = a))
            : (e.memoizedState = Bd(
                e.type,
                t.memoizedProps,
                e.pendingProps,
                t.memoizedState,
              )),
          null
        );
      case 27:
        return (
          La(e),
          t === null &&
            ct &&
            ((a = e.stateNode = Cd(e.type, e.pendingProps, lt.current)),
            (Vt = e),
            (Re = !0),
            (n = At),
            Ol(e.type) ? ((Of = n), (At = De(a.firstChild))) : (At = n)),
          Jt(t, e, e.pendingProps.children, l),
          Nu(t, e),
          t === null && (e.flags |= 4194304),
          e.child
        );
      case 5:
        return (
          t === null &&
            ct &&
            ((n = a = At) &&
              ((a = F0(a, e.type, e.pendingProps, Re)),
              a !== null
                ? ((e.stateNode = a),
                  (Vt = e),
                  (At = De(a.firstChild)),
                  (Re = !1),
                  (n = !0))
                : (n = !1)),
            n || ol(e)),
          La(e),
          (n = e.type),
          (u = e.pendingProps),
          (i = t !== null ? t.memoizedProps : null),
          (a = u.children),
          Sf(n, u) ? (a = null) : i !== null && Sf(n, i) && (e.flags |= 32),
          e.memoizedState !== null &&
            ((n = bc(t, e, r0, null, null, l)), (Nn._currentValue = n)),
          Nu(t, e),
          Jt(t, e, a, l),
          e.child
        );
      case 6:
        return (
          t === null &&
            ct &&
            ((t = l = At) &&
              ((l = W0(l, e.pendingProps, Re)),
              l !== null
                ? ((e.stateNode = l), (Vt = e), (At = null), (t = !0))
                : (t = !1)),
            t || ol(e)),
          null
        );
      case 13:
        return Ao(t, e, l);
      case 4:
        return (
          It(e, e.stateNode.containerInfo),
          (a = e.pendingProps),
          t === null ? (e.child = Vl(e, null, a, l)) : Jt(t, e, a, l),
          e.child
        );
      case 11:
        return ho(t, e, e.type, e.pendingProps, l);
      case 7:
        return (Jt(t, e, e.pendingProps, l), e.child);
      case 8:
        return (Jt(t, e, e.pendingProps.children, l), e.child);
      case 12:
        return (Jt(t, e, e.pendingProps.children, l), e.child);
      case 10:
        return (
          (a = e.pendingProps),
          dl(e, e.type, a.value),
          Jt(t, e, a.children, l),
          e.child
        );
      case 9:
        return (
          (n = e.type._context),
          (a = e.pendingProps.children),
          Gl(e),
          (n = Kt(n)),
          (a = a(n)),
          (e.flags |= 1),
          Jt(t, e, a, l),
          e.child
        );
      case 14:
        return yo(t, e, e.type, e.pendingProps, l);
      case 15:
        return vo(t, e, e.type, e.pendingProps, l);
      case 19:
        return Oo(t, e, l);
      case 31:
        return b0(t, e, l);
      case 22:
        return go(t, e, l, e.pendingProps);
      case 24:
        return (
          Gl(e),
          (a = Kt(Ct)),
          t === null
            ? ((n = fc()),
              n === null &&
                ((n = Tt),
                (u = ic()),
                (n.pooledCache = u),
                u.refCount++,
                u !== null && (n.pooledCacheLanes |= l),
                (n = u)),
              (e.memoizedState = { parent: a, cache: n }),
              rc(e),
              dl(e, Ct, n))
            : ((t.lanes & l) !== 0 && (oc(t, e), sn(e, null, null, l), fn()),
              (n = t.memoizedState),
              (u = e.memoizedState),
              n.parent !== a
                ? ((n = { parent: a, cache: a }),
                  (e.memoizedState = n),
                  e.lanes === 0 &&
                    (e.memoizedState = e.updateQueue.baseState = n),
                  dl(e, Ct, a))
                : ((a = u.cache),
                  dl(e, Ct, a),
                  a !== n.cache && uc(e, [Ct], l, !0))),
          Jt(t, e, e.pendingProps.children, l),
          e.child
        );
      case 29:
        throw e.pendingProps;
    }
    throw Error(s(156, e.tag));
  }
  function Ie(t) {
    t.flags |= 4;
  }
  function Kc(t, e, l, a, n) {
    if (((e = (t.mode & 32) !== 0) && (e = !1), e)) {
      if (((t.flags |= 16777216), (n & 335544128) === n))
        if (t.stateNode.complete) t.flags |= 8192;
        else if (Po()) t.flags |= 8192;
        else throw ((Zl = hu), sc);
    } else t.flags &= -16777217;
  }
  function xo(t, e) {
    if (e.type !== "stylesheet" || (e.state.loading & 4) !== 0)
      t.flags &= -16777217;
    else if (((t.flags |= 16777216), !Qd(e)))
      if (Po()) t.flags |= 8192;
      else throw ((Zl = hu), sc);
  }
  function Uu(t, e) {
    (e !== null && (t.flags |= 4),
      t.flags & 16384 &&
        ((e = t.tag !== 22 ? us() : 536870912), (t.lanes |= e), (Ra |= e)));
  }
  function yn(t, e) {
    if (!ct)
      switch (t.tailMode) {
        case "hidden":
          e = t.tail;
          for (var l = null; e !== null; )
            (e.alternate !== null && (l = e), (e = e.sibling));
          l === null ? (t.tail = null) : (l.sibling = null);
          break;
        case "collapsed":
          l = t.tail;
          for (var a = null; l !== null; )
            (l.alternate !== null && (a = l), (l = l.sibling));
          a === null
            ? e || t.tail === null
              ? (t.tail = null)
              : (t.tail.sibling = null)
            : (a.sibling = null);
      }
  }
  function zt(t) {
    var e = t.alternate !== null && t.alternate.child === t.child,
      l = 0,
      a = 0;
    if (e)
      for (var n = t.child; n !== null; )
        ((l |= n.lanes | n.childLanes),
          (a |= n.subtreeFlags & 65011712),
          (a |= n.flags & 65011712),
          (n.return = t),
          (n = n.sibling));
    else
      for (n = t.child; n !== null; )
        ((l |= n.lanes | n.childLanes),
          (a |= n.subtreeFlags),
          (a |= n.flags),
          (n.return = t),
          (n = n.sibling));
    return ((t.subtreeFlags |= a), (t.childLanes = l), e);
  }
  function S0(t, e, l) {
    var a = e.pendingProps;
    switch ((tc(e), e.tag)) {
      case 16:
      case 15:
      case 0:
      case 11:
      case 7:
      case 8:
      case 12:
      case 9:
      case 14:
        return (zt(e), null);
      case 1:
        return (zt(e), null);
      case 3:
        return (
          (l = e.stateNode),
          (a = null),
          t !== null && (a = t.memoizedState.cache),
          e.memoizedState.cache !== a && (e.flags |= 2048),
          ke(Ct),
          Dt(),
          l.pendingContext &&
            ((l.context = l.pendingContext), (l.pendingContext = null)),
          (t === null || t.child === null) &&
            (ya(e)
              ? Ie(e)
              : t === null ||
                (t.memoizedState.isDehydrated && (e.flags & 256) === 0) ||
                ((e.flags |= 1024), lc())),
          zt(e),
          null
        );
      case 26:
        var n = e.type,
          u = e.memoizedState;
        return (
          t === null
            ? (Ie(e),
              u !== null ? (zt(e), xo(e, u)) : (zt(e), Kc(e, n, null, a, l)))
            : u
              ? u !== t.memoizedState
                ? (Ie(e), zt(e), xo(e, u))
                : (zt(e), (e.flags &= -16777217))
              : ((t = t.memoizedProps),
                t !== a && Ie(e),
                zt(e),
                Kc(e, n, t, a, l)),
          null
        );
      case 27:
        if (
          (Qn(e),
          (l = lt.current),
          (n = e.type),
          t !== null && e.stateNode != null)
        )
          t.memoizedProps !== a && Ie(e);
        else {
          if (!a) {
            if (e.stateNode === null) throw Error(s(166));
            return (zt(e), null);
          }
          ((t = Q.current),
            ya(e) ? ur(e) : ((t = Cd(n, a, l)), (e.stateNode = t), Ie(e)));
        }
        return (zt(e), null);
      case 5:
        if ((Qn(e), (n = e.type), t !== null && e.stateNode != null))
          t.memoizedProps !== a && Ie(e);
        else {
          if (!a) {
            if (e.stateNode === null) throw Error(s(166));
            return (zt(e), null);
          }
          if (((u = Q.current), ya(e))) ur(e);
          else {
            var i = Ku(lt.current);
            switch (u) {
              case 1:
                u = i.createElementNS("http://www.w3.org/2000/svg", n);
                break;
              case 2:
                u = i.createElementNS("http://www.w3.org/1998/Math/MathML", n);
                break;
              default:
                switch (n) {
                  case "svg":
                    u = i.createElementNS("http://www.w3.org/2000/svg", n);
                    break;
                  case "math":
                    u = i.createElementNS(
                      "http://www.w3.org/1998/Math/MathML",
                      n,
                    );
                    break;
                  case "script":
                    ((u = i.createElement("div")),
                      (u.innerHTML = "<script><\/script>"),
                      (u = u.removeChild(u.firstChild)));
                    break;
                  case "select":
                    ((u =
                      typeof a.is == "string"
                        ? i.createElement("select", { is: a.is })
                        : i.createElement("select")),
                      a.multiple
                        ? (u.multiple = !0)
                        : a.size && (u.size = a.size));
                    break;
                  default:
                    u =
                      typeof a.is == "string"
                        ? i.createElement(n, { is: a.is })
                        : i.createElement(n);
                }
            }
            ((u[Zt] = e), (u[ee] = a));
            t: for (i = e.child; i !== null; ) {
              if (i.tag === 5 || i.tag === 6) u.appendChild(i.stateNode);
              else if (i.tag !== 4 && i.tag !== 27 && i.child !== null) {
                ((i.child.return = i), (i = i.child));
                continue;
              }
              if (i === e) break t;
              for (; i.sibling === null; ) {
                if (i.return === null || i.return === e) break t;
                i = i.return;
              }
              ((i.sibling.return = i.return), (i = i.sibling));
            }
            e.stateNode = u;
            t: switch ((kt(u, n, a), n)) {
              case "button":
              case "input":
              case "select":
              case "textarea":
                a = !!a.autoFocus;
                break t;
              case "img":
                a = !0;
                break t;
              default:
                a = !1;
            }
            a && Ie(e);
          }
        }
        return (
          zt(e),
          Kc(e, e.type, t === null ? null : t.memoizedProps, e.pendingProps, l),
          null
        );
      case 6:
        if (t && e.stateNode != null) t.memoizedProps !== a && Ie(e);
        else {
          if (typeof a != "string" && e.stateNode === null) throw Error(s(166));
          if (((t = lt.current), ya(e))) {
            if (
              ((t = e.stateNode),
              (l = e.memoizedProps),
              (a = null),
              (n = Vt),
              n !== null)
            )
              switch (n.tag) {
                case 27:
                case 5:
                  a = n.memoizedProps;
              }
            ((t[Zt] = e),
              (t = !!(
                t.nodeValue === l ||
                (a !== null && a.suppressHydrationWarning === !0) ||
                Ad(t.nodeValue, l)
              )),
              t || ol(e, !0));
          } else
            ((t = Ku(t).createTextNode(a)), (t[Zt] = e), (e.stateNode = t));
        }
        return (zt(e), null);
      case 31:
        if (((l = e.memoizedState), t === null || t.memoizedState !== null)) {
          if (((a = ya(e)), l !== null)) {
            if (t === null) {
              if (!a) throw Error(s(318));
              if (
                ((t = e.memoizedState),
                (t = t !== null ? t.dehydrated : null),
                !t)
              )
                throw Error(s(557));
              t[Zt] = e;
            } else
              (Ll(),
                (e.flags & 128) === 0 && (e.memoizedState = null),
                (e.flags |= 4));
            (zt(e), (t = !1));
          } else
            ((l = lc()),
              t !== null &&
                t.memoizedState !== null &&
                (t.memoizedState.hydrationErrors = l),
              (t = !0));
          if (!t) return e.flags & 256 ? (be(e), e) : (be(e), null);
          if ((e.flags & 128) !== 0) throw Error(s(558));
        }
        return (zt(e), null);
      case 13:
        if (
          ((a = e.memoizedState),
          t === null ||
            (t.memoizedState !== null && t.memoizedState.dehydrated !== null))
        ) {
          if (((n = ya(e)), a !== null && a.dehydrated !== null)) {
            if (t === null) {
              if (!n) throw Error(s(318));
              if (
                ((n = e.memoizedState),
                (n = n !== null ? n.dehydrated : null),
                !n)
              )
                throw Error(s(317));
              n[Zt] = e;
            } else
              (Ll(),
                (e.flags & 128) === 0 && (e.memoizedState = null),
                (e.flags |= 4));
            (zt(e), (n = !1));
          } else
            ((n = lc()),
              t !== null &&
                t.memoizedState !== null &&
                (t.memoizedState.hydrationErrors = n),
              (n = !0));
          if (!n) return e.flags & 256 ? (be(e), e) : (be(e), null);
        }
        return (
          be(e),
          (e.flags & 128) !== 0
            ? ((e.lanes = l), e)
            : ((l = a !== null),
              (t = t !== null && t.memoizedState !== null),
              l &&
                ((a = e.child),
                (n = null),
                a.alternate !== null &&
                  a.alternate.memoizedState !== null &&
                  a.alternate.memoizedState.cachePool !== null &&
                  (n = a.alternate.memoizedState.cachePool.pool),
                (u = null),
                a.memoizedState !== null &&
                  a.memoizedState.cachePool !== null &&
                  (u = a.memoizedState.cachePool.pool),
                u !== n && (a.flags |= 2048)),
              l !== t && l && (e.child.flags |= 8192),
              Uu(e, e.updateQueue),
              zt(e),
              null)
        );
      case 4:
        return (Dt(), t === null && yf(e.stateNode.containerInfo), zt(e), null);
      case 10:
        return (ke(e.type), zt(e), null);
      case 19:
        if ((M(Ut), (a = e.memoizedState), a === null)) return (zt(e), null);
        if (((n = (e.flags & 128) !== 0), (u = a.rendering), u === null))
          if (n) yn(a, !1);
          else {
            if (Nt !== 0 || (t !== null && (t.flags & 128) !== 0))
              for (t = e.child; t !== null; ) {
                if (((u = bu(t)), u !== null)) {
                  for (
                    e.flags |= 128,
                      yn(a, !1),
                      t = u.updateQueue,
                      e.updateQueue = t,
                      Uu(e, t),
                      e.subtreeFlags = 0,
                      t = l,
                      l = e.child;
                    l !== null;
                  )
                    (tr(l, t), (l = l.sibling));
                  return (
                    L(Ut, (Ut.current & 1) | 2),
                    ct && Ke(e, a.treeForkCount),
                    e.child
                  );
                }
                t = t.sibling;
              }
            a.tail !== null &&
              de() > qu &&
              ((e.flags |= 128), (n = !0), yn(a, !1), (e.lanes = 4194304));
          }
        else {
          if (!n)
            if (((t = bu(u)), t !== null)) {
              if (
                ((e.flags |= 128),
                (n = !0),
                (t = t.updateQueue),
                (e.updateQueue = t),
                Uu(e, t),
                yn(a, !0),
                a.tail === null &&
                  a.tailMode === "hidden" &&
                  !u.alternate &&
                  !ct)
              )
                return (zt(e), null);
            } else
              2 * de() - a.renderingStartTime > qu &&
                l !== 536870912 &&
                ((e.flags |= 128), (n = !0), yn(a, !1), (e.lanes = 4194304));
          a.isBackwards
            ? ((u.sibling = e.child), (e.child = u))
            : ((t = a.last),
              t !== null ? (t.sibling = u) : (e.child = u),
              (a.last = u));
        }
        return a.tail !== null
          ? ((t = a.tail),
            (a.rendering = t),
            (a.tail = t.sibling),
            (a.renderingStartTime = de()),
            (t.sibling = null),
            (l = Ut.current),
            L(Ut, n ? (l & 1) | 2 : l & 1),
            ct && Ke(e, a.treeForkCount),
            t)
          : (zt(e), null);
      case 22:
      case 23:
        return (
          be(e),
          yc(),
          (a = e.memoizedState !== null),
          t !== null
            ? (t.memoizedState !== null) !== a && (e.flags |= 8192)
            : a && (e.flags |= 8192),
          a
            ? (l & 536870912) !== 0 &&
              (e.flags & 128) === 0 &&
              (zt(e), e.subtreeFlags & 6 && (e.flags |= 8192))
            : zt(e),
          (l = e.updateQueue),
          l !== null && Uu(e, l.retryQueue),
          (l = null),
          t !== null &&
            t.memoizedState !== null &&
            t.memoizedState.cachePool !== null &&
            (l = t.memoizedState.cachePool.pool),
          (a = null),
          e.memoizedState !== null &&
            e.memoizedState.cachePool !== null &&
            (a = e.memoizedState.cachePool.pool),
          a !== l && (e.flags |= 2048),
          t !== null && M(Ql),
          null
        );
      case 24:
        return (
          (l = null),
          t !== null && (l = t.memoizedState.cache),
          e.memoizedState.cache !== l && (e.flags |= 2048),
          ke(Ct),
          zt(e),
          null
        );
      case 25:
        return null;
      case 30:
        return null;
    }
    throw Error(s(156, e.tag));
  }
  function E0(t, e) {
    switch ((tc(e), e.tag)) {
      case 1:
        return (
          (t = e.flags),
          t & 65536 ? ((e.flags = (t & -65537) | 128), e) : null
        );
      case 3:
        return (
          ke(Ct),
          Dt(),
          (t = e.flags),
          (t & 65536) !== 0 && (t & 128) === 0
            ? ((e.flags = (t & -65537) | 128), e)
            : null
        );
      case 26:
      case 27:
      case 5:
        return (Qn(e), null);
      case 31:
        if (e.memoizedState !== null) {
          if ((be(e), e.alternate === null)) throw Error(s(340));
          Ll();
        }
        return (
          (t = e.flags),
          t & 65536 ? ((e.flags = (t & -65537) | 128), e) : null
        );
      case 13:
        if (
          (be(e), (t = e.memoizedState), t !== null && t.dehydrated !== null)
        ) {
          if (e.alternate === null) throw Error(s(340));
          Ll();
        }
        return (
          (t = e.flags),
          t & 65536 ? ((e.flags = (t & -65537) | 128), e) : null
        );
      case 19:
        return (M(Ut), null);
      case 4:
        return (Dt(), null);
      case 10:
        return (ke(e.type), null);
      case 22:
      case 23:
        return (
          be(e),
          yc(),
          t !== null && M(Ql),
          (t = e.flags),
          t & 65536 ? ((e.flags = (t & -65537) | 128), e) : null
        );
      case 24:
        return (ke(Ct), null);
      case 25:
        return null;
      default:
        return null;
    }
  }
  function Ro(t, e) {
    switch ((tc(e), e.tag)) {
      case 3:
        (ke(Ct), Dt());
        break;
      case 26:
      case 27:
      case 5:
        Qn(e);
        break;
      case 4:
        Dt();
        break;
      case 31:
        e.memoizedState !== null && be(e);
        break;
      case 13:
        be(e);
        break;
      case 19:
        M(Ut);
        break;
      case 10:
        ke(e.type);
        break;
      case 22:
      case 23:
        (be(e), yc(), t !== null && M(Ql));
        break;
      case 24:
        ke(Ct);
    }
  }
  function vn(t, e) {
    try {
      var l = e.updateQueue,
        a = l !== null ? l.lastEffect : null;
      if (a !== null) {
        var n = a.next;
        l = n;
        do {
          if ((l.tag & t) === t) {
            a = void 0;
            var u = l.create,
              i = l.inst;
            ((a = u()), (i.destroy = a));
          }
          l = l.next;
        } while (l !== n);
      }
    } catch (o) {
      gt(e, e.return, o);
    }
  }
  function bl(t, e, l) {
    try {
      var a = e.updateQueue,
        n = a !== null ? a.lastEffect : null;
      if (n !== null) {
        var u = n.next;
        a = u;
        do {
          if ((a.tag & t) === t) {
            var i = a.inst,
              o = i.destroy;
            if (o !== void 0) {
              ((i.destroy = void 0), (n = e));
              var m = l,
                T = o;
              try {
                T();
              } catch (N) {
                gt(n, m, N);
              }
            }
          }
          a = a.next;
        } while (a !== u);
      }
    } catch (N) {
      gt(e, e.return, N);
    }
  }
  function No(t) {
    var e = t.updateQueue;
    if (e !== null) {
      var l = t.stateNode;
      try {
        br(e, l);
      } catch (a) {
        gt(t, t.return, a);
      }
    }
  }
  function Do(t, e, l) {
    ((l.props = Jl(t.type, t.memoizedProps)), (l.state = t.memoizedState));
    try {
      l.componentWillUnmount();
    } catch (a) {
      gt(t, e, a);
    }
  }
  function gn(t, e) {
    try {
      var l = t.ref;
      if (l !== null) {
        switch (t.tag) {
          case 26:
          case 27:
          case 5:
            var a = t.stateNode;
            break;
          case 30:
            a = t.stateNode;
            break;
          default:
            a = t.stateNode;
        }
        typeof l == "function" ? (t.refCleanup = l(a)) : (l.current = a);
      }
    } catch (n) {
      gt(t, e, n);
    }
  }
  function we(t, e) {
    var l = t.ref,
      a = t.refCleanup;
    if (l !== null)
      if (typeof a == "function")
        try {
          a();
        } catch (n) {
          gt(t, e, n);
        } finally {
          ((t.refCleanup = null),
            (t = t.alternate),
            t != null && (t.refCleanup = null));
        }
      else if (typeof l == "function")
        try {
          l(null);
        } catch (n) {
          gt(t, e, n);
        }
      else l.current = null;
  }
  function Uo(t) {
    var e = t.type,
      l = t.memoizedProps,
      a = t.stateNode;
    try {
      t: switch (e) {
        case "button":
        case "input":
        case "select":
        case "textarea":
          l.autoFocus && a.focus();
          break t;
        case "img":
          l.src ? (a.src = l.src) : l.srcSet && (a.srcset = l.srcSet);
      }
    } catch (n) {
      gt(t, t.return, n);
    }
  }
  function Jc(t, e, l) {
    try {
      var a = t.stateNode;
      (X0(a, t.type, l, e), (a[ee] = e));
    } catch (n) {
      gt(t, t.return, n);
    }
  }
  function Mo(t) {
    return (
      t.tag === 5 ||
      t.tag === 3 ||
      t.tag === 26 ||
      (t.tag === 27 && Ol(t.type)) ||
      t.tag === 4
    );
  }
  function kc(t) {
    t: for (;;) {
      for (; t.sibling === null; ) {
        if (t.return === null || Mo(t.return)) return null;
        t = t.return;
      }
      for (
        t.sibling.return = t.return, t = t.sibling;
        t.tag !== 5 && t.tag !== 6 && t.tag !== 18;
      ) {
        if (
          (t.tag === 27 && Ol(t.type)) ||
          t.flags & 2 ||
          t.child === null ||
          t.tag === 4
        )
          continue t;
        ((t.child.return = t), (t = t.child));
      }
      if (!(t.flags & 2)) return t.stateNode;
    }
  }
  function Fc(t, e, l) {
    var a = t.tag;
    if (a === 5 || a === 6)
      ((t = t.stateNode),
        e
          ? (l.nodeType === 9
              ? l.body
              : l.nodeName === "HTML"
                ? l.ownerDocument.body
                : l
            ).insertBefore(t, e)
          : ((e =
              l.nodeType === 9
                ? l.body
                : l.nodeName === "HTML"
                  ? l.ownerDocument.body
                  : l),
            e.appendChild(t),
            (l = l._reactRootContainer),
            l != null || e.onclick !== null || (e.onclick = Xe)));
    else if (
      a !== 4 &&
      (a === 27 && Ol(t.type) && ((l = t.stateNode), (e = null)),
      (t = t.child),
      t !== null)
    )
      for (Fc(t, e, l), t = t.sibling; t !== null; )
        (Fc(t, e, l), (t = t.sibling));
  }
  function Mu(t, e, l) {
    var a = t.tag;
    if (a === 5 || a === 6)
      ((t = t.stateNode), e ? l.insertBefore(t, e) : l.appendChild(t));
    else if (
      a !== 4 &&
      (a === 27 && Ol(t.type) && (l = t.stateNode), (t = t.child), t !== null)
    )
      for (Mu(t, e, l), t = t.sibling; t !== null; )
        (Mu(t, e, l), (t = t.sibling));
  }
  function jo(t) {
    var e = t.stateNode,
      l = t.memoizedProps;
    try {
      for (var a = t.type, n = e.attributes; n.length; )
        e.removeAttributeNode(n[0]);
      (kt(e, a, l), (e[Zt] = t), (e[ee] = l));
    } catch (u) {
      gt(t, t.return, u);
    }
  }
  var Pe = !1,
    Bt = !1,
    Wc = !1,
    Co = typeof WeakSet == "function" ? WeakSet : Set,
    Qt = null;
  function T0(t, e) {
    if (((t = t.containerInfo), (bf = Pu), (t = Vs(t)), Xi(t))) {
      if ("selectionStart" in t)
        var l = { start: t.selectionStart, end: t.selectionEnd };
      else
        t: {
          l = ((l = t.ownerDocument) && l.defaultView) || window;
          var a = l.getSelection && l.getSelection();
          if (a && a.rangeCount !== 0) {
            l = a.anchorNode;
            var n = a.anchorOffset,
              u = a.focusNode;
            a = a.focusOffset;
            try {
              (l.nodeType, u.nodeType);
            } catch {
              l = null;
              break t;
            }
            var i = 0,
              o = -1,
              m = -1,
              T = 0,
              N = 0,
              j = t,
              A = null;
            e: for (;;) {
              for (
                var _;
                j !== l || (n !== 0 && j.nodeType !== 3) || (o = i + n),
                  j !== u || (a !== 0 && j.nodeType !== 3) || (m = i + a),
                  j.nodeType === 3 && (i += j.nodeValue.length),
                  (_ = j.firstChild) !== null;
              )
                ((A = j), (j = _));
              for (;;) {
                if (j === t) break e;
                if (
                  (A === l && ++T === n && (o = i),
                  A === u && ++N === a && (m = i),
                  (_ = j.nextSibling) !== null)
                )
                  break;
                ((j = A), (A = j.parentNode));
              }
              j = _;
            }
            l = o === -1 || m === -1 ? null : { start: o, end: m };
          } else l = null;
        }
      l = l || { start: 0, end: 0 };
    } else l = null;
    for (
      pf = { focusedElem: t, selectionRange: l }, Pu = !1, Qt = e;
      Qt !== null;
    )
      if (
        ((e = Qt), (t = e.child), (e.subtreeFlags & 1028) !== 0 && t !== null)
      )
        ((t.return = e), (Qt = t));
      else
        for (; Qt !== null; ) {
          switch (((e = Qt), (u = e.alternate), (t = e.flags), e.tag)) {
            case 0:
              if (
                (t & 4) !== 0 &&
                ((t = e.updateQueue),
                (t = t !== null ? t.events : null),
                t !== null)
              )
                for (l = 0; l < t.length; l++)
                  ((n = t[l]), (n.ref.impl = n.nextImpl));
              break;
            case 11:
            case 15:
              break;
            case 1:
              if ((t & 1024) !== 0 && u !== null) {
                ((t = void 0),
                  (l = e),
                  (n = u.memoizedProps),
                  (u = u.memoizedState),
                  (a = l.stateNode));
                try {
                  var X = Jl(l.type, n);
                  ((t = a.getSnapshotBeforeUpdate(X, u)),
                    (a.__reactInternalSnapshotBeforeUpdate = t));
                } catch (k) {
                  gt(l, l.return, k);
                }
              }
              break;
            case 3:
              if ((t & 1024) !== 0) {
                if (
                  ((t = e.stateNode.containerInfo), (l = t.nodeType), l === 9)
                )
                  Tf(t);
                else if (l === 1)
                  switch (t.nodeName) {
                    case "HEAD":
                    case "HTML":
                    case "BODY":
                      Tf(t);
                      break;
                    default:
                      t.textContent = "";
                  }
              }
              break;
            case 5:
            case 26:
            case 27:
            case 6:
            case 4:
            case 17:
              break;
            default:
              if ((t & 1024) !== 0) throw Error(s(163));
          }
          if (((t = e.sibling), t !== null)) {
            ((t.return = e.return), (Qt = t));
            break;
          }
          Qt = e.return;
        }
  }
  function Ho(t, e, l) {
    var a = l.flags;
    switch (l.tag) {
      case 0:
      case 11:
      case 15:
        (el(t, l), a & 4 && vn(5, l));
        break;
      case 1:
        if ((el(t, l), a & 4))
          if (((t = l.stateNode), e === null))
            try {
              t.componentDidMount();
            } catch (i) {
              gt(l, l.return, i);
            }
          else {
            var n = Jl(l.type, e.memoizedProps);
            e = e.memoizedState;
            try {
              t.componentDidUpdate(n, e, t.__reactInternalSnapshotBeforeUpdate);
            } catch (i) {
              gt(l, l.return, i);
            }
          }
        (a & 64 && No(l), a & 512 && gn(l, l.return));
        break;
      case 3:
        if ((el(t, l), a & 64 && ((t = l.updateQueue), t !== null))) {
          if (((e = null), l.child !== null))
            switch (l.child.tag) {
              case 27:
              case 5:
                e = l.child.stateNode;
                break;
              case 1:
                e = l.child.stateNode;
            }
          try {
            br(t, e);
          } catch (i) {
            gt(l, l.return, i);
          }
        }
        break;
      case 27:
        e === null && a & 4 && jo(l);
      case 26:
      case 5:
        (el(t, l), e === null && a & 4 && Uo(l), a & 512 && gn(l, l.return));
        break;
      case 12:
        el(t, l);
        break;
      case 31:
        (el(t, l), a & 4 && Yo(t, l));
        break;
      case 13:
        (el(t, l),
          a & 4 && Lo(t, l),
          a & 64 &&
            ((t = l.memoizedState),
            t !== null &&
              ((t = t.dehydrated),
              t !== null && ((l = U0.bind(null, l)), $0(t, l)))));
        break;
      case 22:
        if (((a = l.memoizedState !== null || Pe), !a)) {
          ((e = (e !== null && e.memoizedState !== null) || Bt), (n = Pe));
          var u = Bt;
          ((Pe = a),
            (Bt = e) && !u ? ll(t, l, (l.subtreeFlags & 8772) !== 0) : el(t, l),
            (Pe = n),
            (Bt = u));
        }
        break;
      case 30:
        break;
      default:
        el(t, l);
    }
  }
  function qo(t) {
    var e = t.alternate;
    (e !== null && ((t.alternate = null), qo(e)),
      (t.child = null),
      (t.deletions = null),
      (t.sibling = null),
      t.tag === 5 && ((e = t.stateNode), e !== null && _i(e)),
      (t.stateNode = null),
      (t.return = null),
      (t.dependencies = null),
      (t.memoizedProps = null),
      (t.memoizedState = null),
      (t.pendingProps = null),
      (t.stateNode = null),
      (t.updateQueue = null));
  }
  var _t = null,
    ae = !1;
  function tl(t, e, l) {
    for (l = l.child; l !== null; ) (Bo(t, e, l), (l = l.sibling));
  }
  function Bo(t, e, l) {
    if (me && typeof me.onCommitFiberUnmount == "function")
      try {
        me.onCommitFiberUnmount(wa, l);
      } catch {}
    switch (l.tag) {
      case 26:
        (Bt || we(l, e),
          tl(t, e, l),
          l.memoizedState
            ? l.memoizedState.count--
            : l.stateNode && ((l = l.stateNode), l.parentNode.removeChild(l)));
        break;
      case 27:
        Bt || we(l, e);
        var a = _t,
          n = ae;
        (Ol(l.type) && ((_t = l.stateNode), (ae = !1)),
          tl(t, e, l),
          _n(l.stateNode),
          (_t = a),
          (ae = n));
        break;
      case 5:
        Bt || we(l, e);
      case 6:
        if (
          ((a = _t),
          (n = ae),
          (_t = null),
          tl(t, e, l),
          (_t = a),
          (ae = n),
          _t !== null)
        )
          if (ae)
            try {
              (_t.nodeType === 9
                ? _t.body
                : _t.nodeName === "HTML"
                  ? _t.ownerDocument.body
                  : _t
              ).removeChild(l.stateNode);
            } catch (u) {
              gt(l, e, u);
            }
          else
            try {
              _t.removeChild(l.stateNode);
            } catch (u) {
              gt(l, e, u);
            }
        break;
      case 18:
        _t !== null &&
          (ae
            ? ((t = _t),
              Nd(
                t.nodeType === 9
                  ? t.body
                  : t.nodeName === "HTML"
                    ? t.ownerDocument.body
                    : t,
                l.stateNode,
              ),
              qa(t))
            : Nd(_t, l.stateNode));
        break;
      case 4:
        ((a = _t),
          (n = ae),
          (_t = l.stateNode.containerInfo),
          (ae = !0),
          tl(t, e, l),
          (_t = a),
          (ae = n));
        break;
      case 0:
      case 11:
      case 14:
      case 15:
        (bl(2, l, e), Bt || bl(4, l, e), tl(t, e, l));
        break;
      case 1:
        (Bt ||
          (we(l, e),
          (a = l.stateNode),
          typeof a.componentWillUnmount == "function" && Do(l, e, a)),
          tl(t, e, l));
        break;
      case 21:
        tl(t, e, l);
        break;
      case 22:
        ((Bt = (a = Bt) || l.memoizedState !== null), tl(t, e, l), (Bt = a));
        break;
      default:
        tl(t, e, l);
    }
  }
  function Yo(t, e) {
    if (
      e.memoizedState === null &&
      ((t = e.alternate), t !== null && ((t = t.memoizedState), t !== null))
    ) {
      t = t.dehydrated;
      try {
        qa(t);
      } catch (l) {
        gt(e, e.return, l);
      }
    }
  }
  function Lo(t, e) {
    if (
      e.memoizedState === null &&
      ((t = e.alternate),
      t !== null &&
        ((t = t.memoizedState), t !== null && ((t = t.dehydrated), t !== null)))
    )
      try {
        qa(t);
      } catch (l) {
        gt(e, e.return, l);
      }
  }
  function A0(t) {
    switch (t.tag) {
      case 31:
      case 13:
      case 19:
        var e = t.stateNode;
        return (e === null && (e = t.stateNode = new Co()), e);
      case 22:
        return (
          (t = t.stateNode),
          (e = t._retryCache),
          e === null && (e = t._retryCache = new Co()),
          e
        );
      default:
        throw Error(s(435, t.tag));
    }
  }
  function ju(t, e) {
    var l = A0(t);
    e.forEach(function (a) {
      if (!l.has(a)) {
        l.add(a);
        var n = M0.bind(null, t, a);
        a.then(n, n);
      }
    });
  }
  function ne(t, e) {
    var l = e.deletions;
    if (l !== null)
      for (var a = 0; a < l.length; a++) {
        var n = l[a],
          u = t,
          i = e,
          o = i;
        t: for (; o !== null; ) {
          switch (o.tag) {
            case 27:
              if (Ol(o.type)) {
                ((_t = o.stateNode), (ae = !1));
                break t;
              }
              break;
            case 5:
              ((_t = o.stateNode), (ae = !1));
              break t;
            case 3:
            case 4:
              ((_t = o.stateNode.containerInfo), (ae = !0));
              break t;
          }
          o = o.return;
        }
        if (_t === null) throw Error(s(160));
        (Bo(u, i, n),
          (_t = null),
          (ae = !1),
          (u = n.alternate),
          u !== null && (u.return = null),
          (n.return = null));
      }
    if (e.subtreeFlags & 13886)
      for (e = e.child; e !== null; ) (wo(e, t), (e = e.sibling));
  }
  var He = null;
  function wo(t, e) {
    var l = t.alternate,
      a = t.flags;
    switch (t.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        (ne(e, t),
          ue(t),
          a & 4 && (bl(3, t, t.return), vn(3, t), bl(5, t, t.return)));
        break;
      case 1:
        (ne(e, t),
          ue(t),
          a & 512 && (Bt || l === null || we(l, l.return)),
          a & 64 &&
            Pe &&
            ((t = t.updateQueue),
            t !== null &&
              ((a = t.callbacks),
              a !== null &&
                ((l = t.shared.hiddenCallbacks),
                (t.shared.hiddenCallbacks = l === null ? a : l.concat(a))))));
        break;
      case 26:
        var n = He;
        if (
          (ne(e, t),
          ue(t),
          a & 512 && (Bt || l === null || we(l, l.return)),
          a & 4)
        ) {
          var u = l !== null ? l.memoizedState : null;
          if (((a = t.memoizedState), l === null))
            if (a === null)
              if (t.stateNode === null) {
                t: {
                  ((a = t.type),
                    (l = t.memoizedProps),
                    (n = n.ownerDocument || n));
                  e: switch (a) {
                    case "title":
                      ((u = n.getElementsByTagName("title")[0]),
                        (!u ||
                          u[Xa] ||
                          u[Zt] ||
                          u.namespaceURI === "http://www.w3.org/2000/svg" ||
                          u.hasAttribute("itemprop")) &&
                          ((u = n.createElement(a)),
                          n.head.insertBefore(
                            u,
                            n.querySelector("head > title"),
                          )),
                        kt(u, a, l),
                        (u[Zt] = t),
                        Gt(u),
                        (a = u));
                      break t;
                    case "link":
                      var i = wd("link", "href", n).get(a + (l.href || ""));
                      if (i) {
                        for (var o = 0; o < i.length; o++)
                          if (
                            ((u = i[o]),
                            u.getAttribute("href") ===
                              (l.href == null || l.href === ""
                                ? null
                                : l.href) &&
                              u.getAttribute("rel") ===
                                (l.rel == null ? null : l.rel) &&
                              u.getAttribute("title") ===
                                (l.title == null ? null : l.title) &&
                              u.getAttribute("crossorigin") ===
                                (l.crossOrigin == null ? null : l.crossOrigin))
                          ) {
                            i.splice(o, 1);
                            break e;
                          }
                      }
                      ((u = n.createElement(a)),
                        kt(u, a, l),
                        n.head.appendChild(u));
                      break;
                    case "meta":
                      if (
                        (i = wd("meta", "content", n).get(
                          a + (l.content || ""),
                        ))
                      ) {
                        for (o = 0; o < i.length; o++)
                          if (
                            ((u = i[o]),
                            u.getAttribute("content") ===
                              (l.content == null ? null : "" + l.content) &&
                              u.getAttribute("name") ===
                                (l.name == null ? null : l.name) &&
                              u.getAttribute("property") ===
                                (l.property == null ? null : l.property) &&
                              u.getAttribute("http-equiv") ===
                                (l.httpEquiv == null ? null : l.httpEquiv) &&
                              u.getAttribute("charset") ===
                                (l.charSet == null ? null : l.charSet))
                          ) {
                            i.splice(o, 1);
                            break e;
                          }
                      }
                      ((u = n.createElement(a)),
                        kt(u, a, l),
                        n.head.appendChild(u));
                      break;
                    default:
                      throw Error(s(468, a));
                  }
                  ((u[Zt] = t), Gt(u), (a = u));
                }
                t.stateNode = a;
              } else Gd(n, t.type, t.stateNode);
            else t.stateNode = Ld(n, a, t.memoizedProps);
          else
            u !== a
              ? (u === null
                  ? l.stateNode !== null &&
                    ((l = l.stateNode), l.parentNode.removeChild(l))
                  : u.count--,
                a === null
                  ? Gd(n, t.type, t.stateNode)
                  : Ld(n, a, t.memoizedProps))
              : a === null &&
                t.stateNode !== null &&
                Jc(t, t.memoizedProps, l.memoizedProps);
        }
        break;
      case 27:
        (ne(e, t),
          ue(t),
          a & 512 && (Bt || l === null || we(l, l.return)),
          l !== null && a & 4 && Jc(t, t.memoizedProps, l.memoizedProps));
        break;
      case 5:
        if (
          (ne(e, t),
          ue(t),
          a & 512 && (Bt || l === null || we(l, l.return)),
          t.flags & 32)
        ) {
          n = t.stateNode;
          try {
            ua(n, "");
          } catch (X) {
            gt(t, t.return, X);
          }
        }
        (a & 4 &&
          t.stateNode != null &&
          ((n = t.memoizedProps), Jc(t, n, l !== null ? l.memoizedProps : n)),
          a & 1024 && (Wc = !0));
        break;
      case 6:
        if ((ne(e, t), ue(t), a & 4)) {
          if (t.stateNode === null) throw Error(s(162));
          ((a = t.memoizedProps), (l = t.stateNode));
          try {
            l.nodeValue = a;
          } catch (X) {
            gt(t, t.return, X);
          }
        }
        break;
      case 3:
        if (
          ((Fu = null),
          (n = He),
          (He = Ju(e.containerInfo)),
          ne(e, t),
          (He = n),
          ue(t),
          a & 4 && l !== null && l.memoizedState.isDehydrated)
        )
          try {
            qa(e.containerInfo);
          } catch (X) {
            gt(t, t.return, X);
          }
        Wc && ((Wc = !1), Go(t));
        break;
      case 4:
        ((a = He),
          (He = Ju(t.stateNode.containerInfo)),
          ne(e, t),
          ue(t),
          (He = a));
        break;
      case 12:
        (ne(e, t), ue(t));
        break;
      case 31:
        (ne(e, t),
          ue(t),
          a & 4 &&
            ((a = t.updateQueue),
            a !== null && ((t.updateQueue = null), ju(t, a))));
        break;
      case 13:
        (ne(e, t),
          ue(t),
          t.child.flags & 8192 &&
            (t.memoizedState !== null) !=
              (l !== null && l.memoizedState !== null) &&
            (Hu = de()),
          a & 4 &&
            ((a = t.updateQueue),
            a !== null && ((t.updateQueue = null), ju(t, a))));
        break;
      case 22:
        n = t.memoizedState !== null;
        var m = l !== null && l.memoizedState !== null,
          T = Pe,
          N = Bt;
        if (
          ((Pe = T || n),
          (Bt = N || m),
          ne(e, t),
          (Bt = N),
          (Pe = T),
          ue(t),
          a & 8192)
        )
          t: for (
            e = t.stateNode,
              e._visibility = n ? e._visibility & -2 : e._visibility | 1,
              n && (l === null || m || Pe || Bt || kl(t)),
              l = null,
              e = t;
            ;
          ) {
            if (e.tag === 5 || e.tag === 26) {
              if (l === null) {
                m = l = e;
                try {
                  if (((u = m.stateNode), n))
                    ((i = u.style),
                      typeof i.setProperty == "function"
                        ? i.setProperty("display", "none", "important")
                        : (i.display = "none"));
                  else {
                    o = m.stateNode;
                    var j = m.memoizedProps.style,
                      A =
                        j != null && j.hasOwnProperty("display")
                          ? j.display
                          : null;
                    o.style.display =
                      A == null || typeof A == "boolean" ? "" : ("" + A).trim();
                  }
                } catch (X) {
                  gt(m, m.return, X);
                }
              }
            } else if (e.tag === 6) {
              if (l === null) {
                m = e;
                try {
                  m.stateNode.nodeValue = n ? "" : m.memoizedProps;
                } catch (X) {
                  gt(m, m.return, X);
                }
              }
            } else if (e.tag === 18) {
              if (l === null) {
                m = e;
                try {
                  var _ = m.stateNode;
                  n ? Dd(_, !0) : Dd(m.stateNode, !1);
                } catch (X) {
                  gt(m, m.return, X);
                }
              }
            } else if (
              ((e.tag !== 22 && e.tag !== 23) ||
                e.memoizedState === null ||
                e === t) &&
              e.child !== null
            ) {
              ((e.child.return = e), (e = e.child));
              continue;
            }
            if (e === t) break t;
            for (; e.sibling === null; ) {
              if (e.return === null || e.return === t) break t;
              (l === e && (l = null), (e = e.return));
            }
            (l === e && (l = null),
              (e.sibling.return = e.return),
              (e = e.sibling));
          }
        a & 4 &&
          ((a = t.updateQueue),
          a !== null &&
            ((l = a.retryQueue),
            l !== null && ((a.retryQueue = null), ju(t, l))));
        break;
      case 19:
        (ne(e, t),
          ue(t),
          a & 4 &&
            ((a = t.updateQueue),
            a !== null && ((t.updateQueue = null), ju(t, a))));
        break;
      case 30:
        break;
      case 21:
        break;
      default:
        (ne(e, t), ue(t));
    }
  }
  function ue(t) {
    var e = t.flags;
    if (e & 2) {
      try {
        for (var l, a = t.return; a !== null; ) {
          if (Mo(a)) {
            l = a;
            break;
          }
          a = a.return;
        }
        if (l == null) throw Error(s(160));
        switch (l.tag) {
          case 27:
            var n = l.stateNode,
              u = kc(t);
            Mu(t, u, n);
            break;
          case 5:
            var i = l.stateNode;
            l.flags & 32 && (ua(i, ""), (l.flags &= -33));
            var o = kc(t);
            Mu(t, o, i);
            break;
          case 3:
          case 4:
            var m = l.stateNode.containerInfo,
              T = kc(t);
            Fc(t, T, m);
            break;
          default:
            throw Error(s(161));
        }
      } catch (N) {
        gt(t, t.return, N);
      }
      t.flags &= -3;
    }
    e & 4096 && (t.flags &= -4097);
  }
  function Go(t) {
    if (t.subtreeFlags & 1024)
      for (t = t.child; t !== null; ) {
        var e = t;
        (Go(e),
          e.tag === 5 && e.flags & 1024 && e.stateNode.reset(),
          (t = t.sibling));
      }
  }
  function el(t, e) {
    if (e.subtreeFlags & 8772)
      for (e = e.child; e !== null; ) (Ho(t, e.alternate, e), (e = e.sibling));
  }
  function kl(t) {
    for (t = t.child; t !== null; ) {
      var e = t;
      switch (e.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          (bl(4, e, e.return), kl(e));
          break;
        case 1:
          we(e, e.return);
          var l = e.stateNode;
          (typeof l.componentWillUnmount == "function" && Do(e, e.return, l),
            kl(e));
          break;
        case 27:
          _n(e.stateNode);
        case 26:
        case 5:
          (we(e, e.return), kl(e));
          break;
        case 22:
          e.memoizedState === null && kl(e);
          break;
        case 30:
          kl(e);
          break;
        default:
          kl(e);
      }
      t = t.sibling;
    }
  }
  function ll(t, e, l) {
    for (l = l && (e.subtreeFlags & 8772) !== 0, e = e.child; e !== null; ) {
      var a = e.alternate,
        n = t,
        u = e,
        i = u.flags;
      switch (u.tag) {
        case 0:
        case 11:
        case 15:
          (ll(n, u, l), vn(4, u));
          break;
        case 1:
          if (
            (ll(n, u, l),
            (a = u),
            (n = a.stateNode),
            typeof n.componentDidMount == "function")
          )
            try {
              n.componentDidMount();
            } catch (T) {
              gt(a, a.return, T);
            }
          if (((a = u), (n = a.updateQueue), n !== null)) {
            var o = a.stateNode;
            try {
              var m = n.shared.hiddenCallbacks;
              if (m !== null)
                for (n.shared.hiddenCallbacks = null, n = 0; n < m.length; n++)
                  gr(m[n], o);
            } catch (T) {
              gt(a, a.return, T);
            }
          }
          (l && i & 64 && No(u), gn(u, u.return));
          break;
        case 27:
          jo(u);
        case 26:
        case 5:
          (ll(n, u, l), l && a === null && i & 4 && Uo(u), gn(u, u.return));
          break;
        case 12:
          ll(n, u, l);
          break;
        case 31:
          (ll(n, u, l), l && i & 4 && Yo(n, u));
          break;
        case 13:
          (ll(n, u, l), l && i & 4 && Lo(n, u));
          break;
        case 22:
          (u.memoizedState === null && ll(n, u, l), gn(u, u.return));
          break;
        case 30:
          break;
        default:
          ll(n, u, l);
      }
      e = e.sibling;
    }
  }
  function $c(t, e) {
    var l = null;
    (t !== null &&
      t.memoizedState !== null &&
      t.memoizedState.cachePool !== null &&
      (l = t.memoizedState.cachePool.pool),
      (t = null),
      e.memoizedState !== null &&
        e.memoizedState.cachePool !== null &&
        (t = e.memoizedState.cachePool.pool),
      t !== l && (t != null && t.refCount++, l != null && ln(l)));
  }
  function Ic(t, e) {
    ((t = null),
      e.alternate !== null && (t = e.alternate.memoizedState.cache),
      (e = e.memoizedState.cache),
      e !== t && (e.refCount++, t != null && ln(t)));
  }
  function qe(t, e, l, a) {
    if (e.subtreeFlags & 10256)
      for (e = e.child; e !== null; ) (Qo(t, e, l, a), (e = e.sibling));
  }
  function Qo(t, e, l, a) {
    var n = e.flags;
    switch (e.tag) {
      case 0:
      case 11:
      case 15:
        (qe(t, e, l, a), n & 2048 && vn(9, e));
        break;
      case 1:
        qe(t, e, l, a);
        break;
      case 3:
        (qe(t, e, l, a),
          n & 2048 &&
            ((t = null),
            e.alternate !== null && (t = e.alternate.memoizedState.cache),
            (e = e.memoizedState.cache),
            e !== t && (e.refCount++, t != null && ln(t))));
        break;
      case 12:
        if (n & 2048) {
          (qe(t, e, l, a), (t = e.stateNode));
          try {
            var u = e.memoizedProps,
              i = u.id,
              o = u.onPostCommit;
            typeof o == "function" &&
              o(
                i,
                e.alternate === null ? "mount" : "update",
                t.passiveEffectDuration,
                -0,
              );
          } catch (m) {
            gt(e, e.return, m);
          }
        } else qe(t, e, l, a);
        break;
      case 31:
        qe(t, e, l, a);
        break;
      case 13:
        qe(t, e, l, a);
        break;
      case 23:
        break;
      case 22:
        ((u = e.stateNode),
          (i = e.alternate),
          e.memoizedState !== null
            ? u._visibility & 2
              ? qe(t, e, l, a)
              : bn(t, e)
            : u._visibility & 2
              ? qe(t, e, l, a)
              : ((u._visibility |= 2),
                Oa(t, e, l, a, (e.subtreeFlags & 10256) !== 0 || !1)),
          n & 2048 && $c(i, e));
        break;
      case 24:
        (qe(t, e, l, a), n & 2048 && Ic(e.alternate, e));
        break;
      default:
        qe(t, e, l, a);
    }
  }
  function Oa(t, e, l, a, n) {
    for (
      n = n && ((e.subtreeFlags & 10256) !== 0 || !1), e = e.child;
      e !== null;
    ) {
      var u = t,
        i = e,
        o = l,
        m = a,
        T = i.flags;
      switch (i.tag) {
        case 0:
        case 11:
        case 15:
          (Oa(u, i, o, m, n), vn(8, i));
          break;
        case 23:
          break;
        case 22:
          var N = i.stateNode;
          (i.memoizedState !== null
            ? N._visibility & 2
              ? Oa(u, i, o, m, n)
              : bn(u, i)
            : ((N._visibility |= 2), Oa(u, i, o, m, n)),
            n && T & 2048 && $c(i.alternate, i));
          break;
        case 24:
          (Oa(u, i, o, m, n), n && T & 2048 && Ic(i.alternate, i));
          break;
        default:
          Oa(u, i, o, m, n);
      }
      e = e.sibling;
    }
  }
  function bn(t, e) {
    if (e.subtreeFlags & 10256)
      for (e = e.child; e !== null; ) {
        var l = t,
          a = e,
          n = a.flags;
        switch (a.tag) {
          case 22:
            (bn(l, a), n & 2048 && $c(a.alternate, a));
            break;
          case 24:
            (bn(l, a), n & 2048 && Ic(a.alternate, a));
            break;
          default:
            bn(l, a);
        }
        e = e.sibling;
      }
  }
  var pn = 8192;
  function _a(t, e, l) {
    if (t.subtreeFlags & pn)
      for (t = t.child; t !== null; ) (Xo(t, e, l), (t = t.sibling));
  }
  function Xo(t, e, l) {
    switch (t.tag) {
      case 26:
        (_a(t, e, l),
          t.flags & pn &&
            t.memoizedState !== null &&
            sy(l, He, t.memoizedState, t.memoizedProps));
        break;
      case 5:
        _a(t, e, l);
        break;
      case 3:
      case 4:
        var a = He;
        ((He = Ju(t.stateNode.containerInfo)), _a(t, e, l), (He = a));
        break;
      case 22:
        t.memoizedState === null &&
          ((a = t.alternate),
          a !== null && a.memoizedState !== null
            ? ((a = pn), (pn = 16777216), _a(t, e, l), (pn = a))
            : _a(t, e, l));
        break;
      default:
        _a(t, e, l);
    }
  }
  function Zo(t) {
    var e = t.alternate;
    if (e !== null && ((t = e.child), t !== null)) {
      e.child = null;
      do ((e = t.sibling), (t.sibling = null), (t = e));
      while (t !== null);
    }
  }
  function Sn(t) {
    var e = t.deletions;
    if ((t.flags & 16) !== 0) {
      if (e !== null)
        for (var l = 0; l < e.length; l++) {
          var a = e[l];
          ((Qt = a), Ko(a, t));
        }
      Zo(t);
    }
    if (t.subtreeFlags & 10256)
      for (t = t.child; t !== null; ) (Vo(t), (t = t.sibling));
  }
  function Vo(t) {
    switch (t.tag) {
      case 0:
      case 11:
      case 15:
        (Sn(t), t.flags & 2048 && bl(9, t, t.return));
        break;
      case 3:
        Sn(t);
        break;
      case 12:
        Sn(t);
        break;
      case 22:
        var e = t.stateNode;
        t.memoizedState !== null &&
        e._visibility & 2 &&
        (t.return === null || t.return.tag !== 13)
          ? ((e._visibility &= -3), Cu(t))
          : Sn(t);
        break;
      default:
        Sn(t);
    }
  }
  function Cu(t) {
    var e = t.deletions;
    if ((t.flags & 16) !== 0) {
      if (e !== null)
        for (var l = 0; l < e.length; l++) {
          var a = e[l];
          ((Qt = a), Ko(a, t));
        }
      Zo(t);
    }
    for (t = t.child; t !== null; ) {
      switch (((e = t), e.tag)) {
        case 0:
        case 11:
        case 15:
          (bl(8, e, e.return), Cu(e));
          break;
        case 22:
          ((l = e.stateNode),
            l._visibility & 2 && ((l._visibility &= -3), Cu(e)));
          break;
        default:
          Cu(e);
      }
      t = t.sibling;
    }
  }
  function Ko(t, e) {
    for (; Qt !== null; ) {
      var l = Qt;
      switch (l.tag) {
        case 0:
        case 11:
        case 15:
          bl(8, l, e);
          break;
        case 23:
        case 22:
          if (l.memoizedState !== null && l.memoizedState.cachePool !== null) {
            var a = l.memoizedState.cachePool.pool;
            a != null && a.refCount++;
          }
          break;
        case 24:
          ln(l.memoizedState.cache);
      }
      if (((a = l.child), a !== null)) ((a.return = l), (Qt = a));
      else
        t: for (l = t; Qt !== null; ) {
          a = Qt;
          var n = a.sibling,
            u = a.return;
          if ((qo(a), a === l)) {
            Qt = null;
            break t;
          }
          if (n !== null) {
            ((n.return = u), (Qt = n));
            break t;
          }
          Qt = u;
        }
    }
  }
  var z0 = {
      getCacheForType: function (t) {
        var e = Kt(Ct),
          l = e.data.get(t);
        return (l === void 0 && ((l = t()), e.data.set(t, l)), l);
      },
      cacheSignal: function () {
        return Kt(Ct).controller.signal;
      },
    },
    O0 = typeof WeakMap == "function" ? WeakMap : Map,
    dt = 0,
    Tt = null,
    at = null,
    ut = 0,
    vt = 0,
    pe = null,
    pl = !1,
    xa = !1,
    Pc = !1,
    al = 0,
    Nt = 0,
    Sl = 0,
    Fl = 0,
    tf = 0,
    Se = 0,
    Ra = 0,
    En = null,
    ie = null,
    ef = !1,
    Hu = 0,
    Jo = 0,
    qu = 1 / 0,
    Bu = null,
    El = null,
    wt = 0,
    Tl = null,
    Na = null,
    nl = 0,
    lf = 0,
    af = null,
    ko = null,
    Tn = 0,
    nf = null;
  function Ee() {
    return (dt & 2) !== 0 && ut !== 0 ? ut & -ut : R.T !== null ? of() : ss();
  }
  function Fo() {
    if (Se === 0)
      if ((ut & 536870912) === 0 || ct) {
        var t = Vn;
        ((Vn <<= 1), (Vn & 3932160) === 0 && (Vn = 262144), (Se = t));
      } else Se = 536870912;
    return ((t = ge.current), t !== null && (t.flags |= 32), Se);
  }
  function ce(t, e, l) {
    (((t === Tt && (vt === 2 || vt === 9)) || t.cancelPendingCommit !== null) &&
      (Da(t, 0), Al(t, ut, Se, !1)),
      Qa(t, l),
      ((dt & 2) === 0 || t !== Tt) &&
        (t === Tt &&
          ((dt & 2) === 0 && (Fl |= l), Nt === 4 && Al(t, ut, Se, !1)),
        Ge(t)));
  }
  function Wo(t, e, l) {
    if ((dt & 6) !== 0) throw Error(s(327));
    var a = (!l && (e & 127) === 0 && (e & t.expiredLanes) === 0) || Ga(t, e),
      n = a ? R0(t, e) : cf(t, e, !0),
      u = a;
    do {
      if (n === 0) {
        xa && !a && Al(t, e, 0, !1);
        break;
      } else {
        if (((l = t.current.alternate), u && !_0(l))) {
          ((n = cf(t, e, !1)), (u = !1));
          continue;
        }
        if (n === 2) {
          if (((u = e), t.errorRecoveryDisabledLanes & u)) var i = 0;
          else
            ((i = t.pendingLanes & -536870913),
              (i = i !== 0 ? i : i & 536870912 ? 536870912 : 0));
          if (i !== 0) {
            e = i;
            t: {
              var o = t;
              n = En;
              var m = o.current.memoizedState.isDehydrated;
              if ((m && (Da(o, i).flags |= 256), (i = cf(o, i, !1)), i !== 2)) {
                if (Pc && !m) {
                  ((o.errorRecoveryDisabledLanes |= u), (Fl |= u), (n = 4));
                  break t;
                }
                ((u = ie),
                  (ie = n),
                  u !== null &&
                    (ie === null ? (ie = u) : ie.push.apply(ie, u)));
              }
              n = i;
            }
            if (((u = !1), n !== 2)) continue;
          }
        }
        if (n === 1) {
          (Da(t, 0), Al(t, e, 0, !0));
          break;
        }
        t: {
          switch (((a = t), (u = n), u)) {
            case 0:
            case 1:
              throw Error(s(345));
            case 4:
              if ((e & 4194048) !== e) break;
            case 6:
              Al(a, e, Se, !pl);
              break t;
            case 2:
              ie = null;
              break;
            case 3:
            case 5:
              break;
            default:
              throw Error(s(329));
          }
          if ((e & 62914560) === e && ((n = Hu + 300 - de()), 10 < n)) {
            if ((Al(a, e, Se, !pl), Jn(a, 0, !0) !== 0)) break t;
            ((nl = e),
              (a.timeoutHandle = xd(
                $o.bind(
                  null,
                  a,
                  l,
                  ie,
                  Bu,
                  ef,
                  e,
                  Se,
                  Fl,
                  Ra,
                  pl,
                  u,
                  "Throttled",
                  -0,
                  0,
                ),
                n,
              )));
            break t;
          }
          $o(a, l, ie, Bu, ef, e, Se, Fl, Ra, pl, u, null, -0, 0);
        }
      }
      break;
    } while (!0);
    Ge(t);
  }
  function $o(t, e, l, a, n, u, i, o, m, T, N, j, A, _) {
    if (
      ((t.timeoutHandle = -1),
      (j = e.subtreeFlags),
      j & 8192 || (j & 16785408) === 16785408)
    ) {
      ((j = {
        stylesheets: null,
        count: 0,
        imgCount: 0,
        imgBytes: 0,
        suspenseyImages: [],
        waitingForImages: !0,
        waitingForViewTransition: !1,
        unsuspend: Xe,
      }),
        Xo(e, u, j));
      var X =
        (u & 62914560) === u ? Hu - de() : (u & 4194048) === u ? Jo - de() : 0;
      if (((X = ry(j, X)), X !== null)) {
        ((nl = u),
          (t.cancelPendingCommit = X(
            ud.bind(null, t, e, u, l, a, n, i, o, m, N, j, null, A, _),
          )),
          Al(t, u, i, !T));
        return;
      }
    }
    ud(t, e, u, l, a, n, i, o, m);
  }
  function _0(t) {
    for (var e = t; ; ) {
      var l = e.tag;
      if (
        (l === 0 || l === 11 || l === 15) &&
        e.flags & 16384 &&
        ((l = e.updateQueue), l !== null && ((l = l.stores), l !== null))
      )
        for (var a = 0; a < l.length; a++) {
          var n = l[a],
            u = n.getSnapshot;
          n = n.value;
          try {
            if (!ye(u(), n)) return !1;
          } catch {
            return !1;
          }
        }
      if (((l = e.child), e.subtreeFlags & 16384 && l !== null))
        ((l.return = e), (e = l));
      else {
        if (e === t) break;
        for (; e.sibling === null; ) {
          if (e.return === null || e.return === t) return !0;
          e = e.return;
        }
        ((e.sibling.return = e.return), (e = e.sibling));
      }
    }
    return !0;
  }
  function Al(t, e, l, a) {
    ((e &= ~tf),
      (e &= ~Fl),
      (t.suspendedLanes |= e),
      (t.pingedLanes &= ~e),
      a && (t.warmLanes |= e),
      (a = t.expirationTimes));
    for (var n = e; 0 < n; ) {
      var u = 31 - he(n),
        i = 1 << u;
      ((a[u] = -1), (n &= ~i));
    }
    l !== 0 && is(t, l, e);
  }
  function Yu() {
    return (dt & 6) === 0 ? (An(0), !1) : !0;
  }
  function uf() {
    if (at !== null) {
      if (vt === 0) var t = at.return;
      else ((t = at), (Je = wl = null), Ec(t), (Sa = null), (nn = 0), (t = at));
      for (; t !== null; ) (Ro(t.alternate, t), (t = t.return));
      at = null;
    }
  }
  function Da(t, e) {
    var l = t.timeoutHandle;
    (l !== -1 && ((t.timeoutHandle = -1), K0(l)),
      (l = t.cancelPendingCommit),
      l !== null && ((t.cancelPendingCommit = null), l()),
      (nl = 0),
      uf(),
      (Tt = t),
      (at = l = Ve(t.current, null)),
      (ut = e),
      (vt = 0),
      (pe = null),
      (pl = !1),
      (xa = Ga(t, e)),
      (Pc = !1),
      (Ra = Se = tf = Fl = Sl = Nt = 0),
      (ie = En = null),
      (ef = !1),
      (e & 8) !== 0 && (e |= e & 32));
    var a = t.entangledLanes;
    if (a !== 0)
      for (t = t.entanglements, a &= e; 0 < a; ) {
        var n = 31 - he(a),
          u = 1 << n;
        ((e |= t[n]), (a &= ~u));
      }
    return ((al = e), uu(), l);
  }
  function Io(t, e) {
    ((I = null),
      (R.H = mn),
      e === pa || e === mu
        ? ((e = mr()), (vt = 3))
        : e === sc
          ? ((e = mr()), (vt = 4))
          : (vt =
              e === Bc
                ? 8
                : e !== null &&
                    typeof e == "object" &&
                    typeof e.then == "function"
                  ? 6
                  : 1),
      (pe = e),
      at === null && ((Nt = 1), xu(t, Oe(e, t.current))));
  }
  function Po() {
    var t = ge.current;
    return t === null
      ? !0
      : (ut & 4194048) === ut
        ? Ne === null
        : (ut & 62914560) === ut || (ut & 536870912) !== 0
          ? t === Ne
          : !1;
  }
  function td() {
    var t = R.H;
    return ((R.H = mn), t === null ? mn : t);
  }
  function ed() {
    var t = R.A;
    return ((R.A = z0), t);
  }
  function Lu() {
    ((Nt = 4),
      pl || ((ut & 4194048) !== ut && ge.current !== null) || (xa = !0),
      ((Sl & 134217727) === 0 && (Fl & 134217727) === 0) ||
        Tt === null ||
        Al(Tt, ut, Se, !1));
  }
  function cf(t, e, l) {
    var a = dt;
    dt |= 2;
    var n = td(),
      u = ed();
    ((Tt !== t || ut !== e) && ((Bu = null), Da(t, e)), (e = !1));
    var i = Nt;
    t: do
      try {
        if (vt !== 0 && at !== null) {
          var o = at,
            m = pe;
          switch (vt) {
            case 8:
              (uf(), (i = 6));
              break t;
            case 3:
            case 2:
            case 9:
            case 6:
              ge.current === null && (e = !0);
              var T = vt;
              if (((vt = 0), (pe = null), Ua(t, o, m, T), l && xa)) {
                i = 0;
                break t;
              }
              break;
            default:
              ((T = vt), (vt = 0), (pe = null), Ua(t, o, m, T));
          }
        }
        (x0(), (i = Nt));
        break;
      } catch (N) {
        Io(t, N);
      }
    while (!0);
    return (
      e && t.shellSuspendCounter++,
      (Je = wl = null),
      (dt = a),
      (R.H = n),
      (R.A = u),
      at === null && ((Tt = null), (ut = 0), uu()),
      i
    );
  }
  function x0() {
    for (; at !== null; ) ld(at);
  }
  function R0(t, e) {
    var l = dt;
    dt |= 2;
    var a = td(),
      n = ed();
    Tt !== t || ut !== e
      ? ((Bu = null), (qu = de() + 500), Da(t, e))
      : (xa = Ga(t, e));
    t: do
      try {
        if (vt !== 0 && at !== null) {
          e = at;
          var u = pe;
          e: switch (vt) {
            case 1:
              ((vt = 0), (pe = null), Ua(t, e, u, 1));
              break;
            case 2:
            case 9:
              if (or(u)) {
                ((vt = 0), (pe = null), ad(e));
                break;
              }
              ((e = function () {
                ((vt !== 2 && vt !== 9) || Tt !== t || (vt = 7), Ge(t));
              }),
                u.then(e, e));
              break t;
            case 3:
              vt = 7;
              break t;
            case 4:
              vt = 5;
              break t;
            case 7:
              or(u)
                ? ((vt = 0), (pe = null), ad(e))
                : ((vt = 0), (pe = null), Ua(t, e, u, 7));
              break;
            case 5:
              var i = null;
              switch (at.tag) {
                case 26:
                  i = at.memoizedState;
                case 5:
                case 27:
                  var o = at;
                  if (i ? Qd(i) : o.stateNode.complete) {
                    ((vt = 0), (pe = null));
                    var m = o.sibling;
                    if (m !== null) at = m;
                    else {
                      var T = o.return;
                      T !== null ? ((at = T), wu(T)) : (at = null);
                    }
                    break e;
                  }
              }
              ((vt = 0), (pe = null), Ua(t, e, u, 5));
              break;
            case 6:
              ((vt = 0), (pe = null), Ua(t, e, u, 6));
              break;
            case 8:
              (uf(), (Nt = 6));
              break t;
            default:
              throw Error(s(462));
          }
        }
        N0();
        break;
      } catch (N) {
        Io(t, N);
      }
    while (!0);
    return (
      (Je = wl = null),
      (R.H = a),
      (R.A = n),
      (dt = l),
      at !== null ? 0 : ((Tt = null), (ut = 0), uu(), Nt)
    );
  }
  function N0() {
    for (; at !== null && !Im(); ) ld(at);
  }
  function ld(t) {
    var e = _o(t.alternate, t, al);
    ((t.memoizedProps = t.pendingProps), e === null ? wu(t) : (at = e));
  }
  function ad(t) {
    var e = t,
      l = e.alternate;
    switch (e.tag) {
      case 15:
      case 0:
        e = So(l, e, e.pendingProps, e.type, void 0, ut);
        break;
      case 11:
        e = So(l, e, e.pendingProps, e.type.render, e.ref, ut);
        break;
      case 5:
        Ec(e);
      default:
        (Ro(l, e), (e = at = tr(e, al)), (e = _o(l, e, al)));
    }
    ((t.memoizedProps = t.pendingProps), e === null ? wu(t) : (at = e));
  }
  function Ua(t, e, l, a) {
    ((Je = wl = null), Ec(e), (Sa = null), (nn = 0));
    var n = e.return;
    try {
      if (g0(t, n, e, l, ut)) {
        ((Nt = 1), xu(t, Oe(l, t.current)), (at = null));
        return;
      }
    } catch (u) {
      if (n !== null) throw ((at = n), u);
      ((Nt = 1), xu(t, Oe(l, t.current)), (at = null));
      return;
    }
    e.flags & 32768
      ? (ct || a === 1
          ? (t = !0)
          : xa || (ut & 536870912) !== 0
            ? (t = !1)
            : ((pl = t = !0),
              (a === 2 || a === 9 || a === 3 || a === 6) &&
                ((a = ge.current),
                a !== null && a.tag === 13 && (a.flags |= 16384))),
        nd(e, t))
      : wu(e);
  }
  function wu(t) {
    var e = t;
    do {
      if ((e.flags & 32768) !== 0) {
        nd(e, pl);
        return;
      }
      t = e.return;
      var l = S0(e.alternate, e, al);
      if (l !== null) {
        at = l;
        return;
      }
      if (((e = e.sibling), e !== null)) {
        at = e;
        return;
      }
      at = e = t;
    } while (e !== null);
    Nt === 0 && (Nt = 5);
  }
  function nd(t, e) {
    do {
      var l = E0(t.alternate, t);
      if (l !== null) {
        ((l.flags &= 32767), (at = l));
        return;
      }
      if (
        ((l = t.return),
        l !== null &&
          ((l.flags |= 32768), (l.subtreeFlags = 0), (l.deletions = null)),
        !e && ((t = t.sibling), t !== null))
      ) {
        at = t;
        return;
      }
      at = t = l;
    } while (t !== null);
    ((Nt = 6), (at = null));
  }
  function ud(t, e, l, a, n, u, i, o, m) {
    t.cancelPendingCommit = null;
    do Gu();
    while (wt !== 0);
    if ((dt & 6) !== 0) throw Error(s(327));
    if (e !== null) {
      if (e === t.current) throw Error(s(177));
      if (
        ((u = e.lanes | e.childLanes),
        (u |= ki),
        fh(t, l, u, i, o, m),
        t === Tt && ((at = Tt = null), (ut = 0)),
        (Na = e),
        (Tl = t),
        (nl = l),
        (lf = u),
        (af = n),
        (ko = a),
        (e.subtreeFlags & 10256) !== 0 || (e.flags & 10256) !== 0
          ? ((t.callbackNode = null),
            (t.callbackPriority = 0),
            j0(Xn, function () {
              return (rd(), null);
            }))
          : ((t.callbackNode = null), (t.callbackPriority = 0)),
        (a = (e.flags & 13878) !== 0),
        (e.subtreeFlags & 13878) !== 0 || a)
      ) {
        ((a = R.T), (R.T = null), (n = Y.p), (Y.p = 2), (i = dt), (dt |= 4));
        try {
          T0(t, e, l);
        } finally {
          ((dt = i), (Y.p = n), (R.T = a));
        }
      }
      ((wt = 1), id(), cd(), fd());
    }
  }
  function id() {
    if (wt === 1) {
      wt = 0;
      var t = Tl,
        e = Na,
        l = (e.flags & 13878) !== 0;
      if ((e.subtreeFlags & 13878) !== 0 || l) {
        ((l = R.T), (R.T = null));
        var a = Y.p;
        Y.p = 2;
        var n = dt;
        dt |= 4;
        try {
          wo(e, t);
          var u = pf,
            i = Vs(t.containerInfo),
            o = u.focusedElem,
            m = u.selectionRange;
          if (
            i !== o &&
            o &&
            o.ownerDocument &&
            Zs(o.ownerDocument.documentElement, o)
          ) {
            if (m !== null && Xi(o)) {
              var T = m.start,
                N = m.end;
              if ((N === void 0 && (N = T), "selectionStart" in o))
                ((o.selectionStart = T),
                  (o.selectionEnd = Math.min(N, o.value.length)));
              else {
                var j = o.ownerDocument || document,
                  A = (j && j.defaultView) || window;
                if (A.getSelection) {
                  var _ = A.getSelection(),
                    X = o.textContent.length,
                    k = Math.min(m.start, X),
                    St = m.end === void 0 ? k : Math.min(m.end, X);
                  !_.extend && k > St && ((i = St), (St = k), (k = i));
                  var p = Xs(o, k),
                    v = Xs(o, St);
                  if (
                    p &&
                    v &&
                    (_.rangeCount !== 1 ||
                      _.anchorNode !== p.node ||
                      _.anchorOffset !== p.offset ||
                      _.focusNode !== v.node ||
                      _.focusOffset !== v.offset)
                  ) {
                    var E = j.createRange();
                    (E.setStart(p.node, p.offset),
                      _.removeAllRanges(),
                      k > St
                        ? (_.addRange(E), _.extend(v.node, v.offset))
                        : (E.setEnd(v.node, v.offset), _.addRange(E)));
                  }
                }
              }
            }
            for (j = [], _ = o; (_ = _.parentNode); )
              _.nodeType === 1 &&
                j.push({ element: _, left: _.scrollLeft, top: _.scrollTop });
            for (
              typeof o.focus == "function" && o.focus(), o = 0;
              o < j.length;
              o++
            ) {
              var U = j[o];
              ((U.element.scrollLeft = U.left), (U.element.scrollTop = U.top));
            }
          }
          ((Pu = !!bf), (pf = bf = null));
        } finally {
          ((dt = n), (Y.p = a), (R.T = l));
        }
      }
      ((t.current = e), (wt = 2));
    }
  }
  function cd() {
    if (wt === 2) {
      wt = 0;
      var t = Tl,
        e = Na,
        l = (e.flags & 8772) !== 0;
      if ((e.subtreeFlags & 8772) !== 0 || l) {
        ((l = R.T), (R.T = null));
        var a = Y.p;
        Y.p = 2;
        var n = dt;
        dt |= 4;
        try {
          Ho(t, e.alternate, e);
        } finally {
          ((dt = n), (Y.p = a), (R.T = l));
        }
      }
      wt = 3;
    }
  }
  function fd() {
    if (wt === 4 || wt === 3) {
      ((wt = 0), Pm());
      var t = Tl,
        e = Na,
        l = nl,
        a = ko;
      (e.subtreeFlags & 10256) !== 0 || (e.flags & 10256) !== 0
        ? (wt = 5)
        : ((wt = 0), (Na = Tl = null), sd(t, t.pendingLanes));
      var n = t.pendingLanes;
      if (
        (n === 0 && (El = null),
        zi(l),
        (e = e.stateNode),
        me && typeof me.onCommitFiberRoot == "function")
      )
        try {
          me.onCommitFiberRoot(wa, e, void 0, (e.current.flags & 128) === 128);
        } catch {}
      if (a !== null) {
        ((e = R.T), (n = Y.p), (Y.p = 2), (R.T = null));
        try {
          for (var u = t.onRecoverableError, i = 0; i < a.length; i++) {
            var o = a[i];
            u(o.value, { componentStack: o.stack });
          }
        } finally {
          ((R.T = e), (Y.p = n));
        }
      }
      ((nl & 3) !== 0 && Gu(),
        Ge(t),
        (n = t.pendingLanes),
        (l & 261930) !== 0 && (n & 42) !== 0
          ? t === nf
            ? Tn++
            : ((Tn = 0), (nf = t))
          : (Tn = 0),
        An(0));
    }
  }
  function sd(t, e) {
    (t.pooledCacheLanes &= e) === 0 &&
      ((e = t.pooledCache), e != null && ((t.pooledCache = null), ln(e)));
  }
  function Gu() {
    return (id(), cd(), fd(), rd());
  }
  function rd() {
    if (wt !== 5) return !1;
    var t = Tl,
      e = lf;
    lf = 0;
    var l = zi(nl),
      a = R.T,
      n = Y.p;
    try {
      ((Y.p = 32 > l ? 32 : l), (R.T = null), (l = af), (af = null));
      var u = Tl,
        i = nl;
      if (((wt = 0), (Na = Tl = null), (nl = 0), (dt & 6) !== 0))
        throw Error(s(331));
      var o = dt;
      if (
        ((dt |= 4),
        Vo(u.current),
        Qo(u, u.current, i, l),
        (dt = o),
        An(0, !1),
        me && typeof me.onPostCommitFiberRoot == "function")
      )
        try {
          me.onPostCommitFiberRoot(wa, u);
        } catch {}
      return !0;
    } finally {
      ((Y.p = n), (R.T = a), sd(t, e));
    }
  }
  function od(t, e, l) {
    ((e = Oe(l, e)),
      (e = qc(t.stateNode, e, 2)),
      (t = yl(t, e, 2)),
      t !== null && (Qa(t, 2), Ge(t)));
  }
  function gt(t, e, l) {
    if (t.tag === 3) od(t, t, l);
    else
      for (; e !== null; ) {
        if (e.tag === 3) {
          od(e, t, l);
          break;
        } else if (e.tag === 1) {
          var a = e.stateNode;
          if (
            typeof e.type.getDerivedStateFromError == "function" ||
            (typeof a.componentDidCatch == "function" &&
              (El === null || !El.has(a)))
          ) {
            ((t = Oe(l, t)),
              (l = oo(2)),
              (a = yl(e, l, 2)),
              a !== null && (mo(l, a, e, t), Qa(a, 2), Ge(a)));
            break;
          }
        }
        e = e.return;
      }
  }
  function ff(t, e, l) {
    var a = t.pingCache;
    if (a === null) {
      a = t.pingCache = new O0();
      var n = new Set();
      a.set(e, n);
    } else ((n = a.get(e)), n === void 0 && ((n = new Set()), a.set(e, n)));
    n.has(l) ||
      ((Pc = !0), n.add(l), (t = D0.bind(null, t, e, l)), e.then(t, t));
  }
  function D0(t, e, l) {
    var a = t.pingCache;
    (a !== null && a.delete(e),
      (t.pingedLanes |= t.suspendedLanes & l),
      (t.warmLanes &= ~l),
      Tt === t &&
        (ut & l) === l &&
        (Nt === 4 || (Nt === 3 && (ut & 62914560) === ut && 300 > de() - Hu)
          ? (dt & 2) === 0 && Da(t, 0)
          : (tf |= l),
        Ra === ut && (Ra = 0)),
      Ge(t));
  }
  function dd(t, e) {
    (e === 0 && (e = us()), (t = Bl(t, e)), t !== null && (Qa(t, e), Ge(t)));
  }
  function U0(t) {
    var e = t.memoizedState,
      l = 0;
    (e !== null && (l = e.retryLane), dd(t, l));
  }
  function M0(t, e) {
    var l = 0;
    switch (t.tag) {
      case 31:
      case 13:
        var a = t.stateNode,
          n = t.memoizedState;
        n !== null && (l = n.retryLane);
        break;
      case 19:
        a = t.stateNode;
        break;
      case 22:
        a = t.stateNode._retryCache;
        break;
      default:
        throw Error(s(314));
    }
    (a !== null && a.delete(e), dd(t, l));
  }
  function j0(t, e) {
    return Si(t, e);
  }
  var Qu = null,
    Ma = null,
    sf = !1,
    Xu = !1,
    rf = !1,
    zl = 0;
  function Ge(t) {
    (t !== Ma &&
      t.next === null &&
      (Ma === null ? (Qu = Ma = t) : (Ma = Ma.next = t)),
      (Xu = !0),
      sf || ((sf = !0), H0()));
  }
  function An(t, e) {
    if (!rf && Xu) {
      rf = !0;
      do
        for (var l = !1, a = Qu; a !== null; ) {
          if (t !== 0) {
            var n = a.pendingLanes;
            if (n === 0) var u = 0;
            else {
              var i = a.suspendedLanes,
                o = a.pingedLanes;
              ((u = (1 << (31 - he(42 | t) + 1)) - 1),
                (u &= n & ~(i & ~o)),
                (u = u & 201326741 ? (u & 201326741) | 1 : u ? u | 2 : 0));
            }
            u !== 0 && ((l = !0), vd(a, u));
          } else
            ((u = ut),
              (u = Jn(
                a,
                a === Tt ? u : 0,
                a.cancelPendingCommit !== null || a.timeoutHandle !== -1,
              )),
              (u & 3) === 0 || Ga(a, u) || ((l = !0), vd(a, u)));
          a = a.next;
        }
      while (l);
      rf = !1;
    }
  }
  function C0() {
    md();
  }
  function md() {
    Xu = sf = !1;
    var t = 0;
    zl !== 0 && V0() && (t = zl);
    for (var e = de(), l = null, a = Qu; a !== null; ) {
      var n = a.next,
        u = hd(a, e);
      (u === 0
        ? ((a.next = null),
          l === null ? (Qu = n) : (l.next = n),
          n === null && (Ma = l))
        : ((l = a), (t !== 0 || (u & 3) !== 0) && (Xu = !0)),
        (a = n));
    }
    ((wt !== 0 && wt !== 5) || An(t), zl !== 0 && (zl = 0));
  }
  function hd(t, e) {
    for (
      var l = t.suspendedLanes,
        a = t.pingedLanes,
        n = t.expirationTimes,
        u = t.pendingLanes & -62914561;
      0 < u;
    ) {
      var i = 31 - he(u),
        o = 1 << i,
        m = n[i];
      (m === -1
        ? ((o & l) === 0 || (o & a) !== 0) && (n[i] = ch(o, e))
        : m <= e && (t.expiredLanes |= o),
        (u &= ~o));
    }
    if (
      ((e = Tt),
      (l = ut),
      (l = Jn(
        t,
        t === e ? l : 0,
        t.cancelPendingCommit !== null || t.timeoutHandle !== -1,
      )),
      (a = t.callbackNode),
      l === 0 ||
        (t === e && (vt === 2 || vt === 9)) ||
        t.cancelPendingCommit !== null)
    )
      return (
        a !== null && a !== null && Ei(a),
        (t.callbackNode = null),
        (t.callbackPriority = 0)
      );
    if ((l & 3) === 0 || Ga(t, l)) {
      if (((e = l & -l), e === t.callbackPriority)) return e;
      switch ((a !== null && Ei(a), zi(l))) {
        case 2:
        case 8:
          l = as;
          break;
        case 32:
          l = Xn;
          break;
        case 268435456:
          l = ns;
          break;
        default:
          l = Xn;
      }
      return (
        (a = yd.bind(null, t)),
        (l = Si(l, a)),
        (t.callbackPriority = e),
        (t.callbackNode = l),
        e
      );
    }
    return (
      a !== null && a !== null && Ei(a),
      (t.callbackPriority = 2),
      (t.callbackNode = null),
      2
    );
  }
  function yd(t, e) {
    if (wt !== 0 && wt !== 5)
      return ((t.callbackNode = null), (t.callbackPriority = 0), null);
    var l = t.callbackNode;
    if (Gu() && t.callbackNode !== l) return null;
    var a = ut;
    return (
      (a = Jn(
        t,
        t === Tt ? a : 0,
        t.cancelPendingCommit !== null || t.timeoutHandle !== -1,
      )),
      a === 0
        ? null
        : (Wo(t, a, e),
          hd(t, de()),
          t.callbackNode != null && t.callbackNode === l
            ? yd.bind(null, t)
            : null)
    );
  }
  function vd(t, e) {
    if (Gu()) return null;
    Wo(t, e, !0);
  }
  function H0() {
    J0(function () {
      (dt & 6) !== 0 ? Si(ls, C0) : md();
    });
  }
  function of() {
    if (zl === 0) {
      var t = ga;
      (t === 0 && ((t = Zn), (Zn <<= 1), (Zn & 261888) === 0 && (Zn = 256)),
        (zl = t));
    }
    return zl;
  }
  function gd(t) {
    return t == null || typeof t == "symbol" || typeof t == "boolean"
      ? null
      : typeof t == "function"
        ? t
        : $n("" + t);
  }
  function bd(t, e) {
    var l = e.ownerDocument.createElement("input");
    return (
      (l.name = e.name),
      (l.value = e.value),
      t.id && l.setAttribute("form", t.id),
      e.parentNode.insertBefore(l, e),
      (t = new FormData(t)),
      l.parentNode.removeChild(l),
      t
    );
  }
  function q0(t, e, l, a, n) {
    if (e === "submit" && l && l.stateNode === n) {
      var u = gd((n[ee] || null).action),
        i = a.submitter;
      i &&
        ((e = (e = i[ee] || null)
          ? gd(e.formAction)
          : i.getAttribute("formAction")),
        e !== null && ((u = e), (i = null)));
      var o = new eu("action", "action", null, a, n);
      t.push({
        event: o,
        listeners: [
          {
            instance: null,
            listener: function () {
              if (a.defaultPrevented) {
                if (zl !== 0) {
                  var m = i ? bd(n, i) : new FormData(n);
                  Dc(
                    l,
                    { pending: !0, data: m, method: n.method, action: u },
                    null,
                    m,
                  );
                }
              } else
                typeof u == "function" &&
                  (o.preventDefault(),
                  (m = i ? bd(n, i) : new FormData(n)),
                  Dc(
                    l,
                    { pending: !0, data: m, method: n.method, action: u },
                    u,
                    m,
                  ));
            },
            currentTarget: n,
          },
        ],
      });
    }
  }
  for (var df = 0; df < Ji.length; df++) {
    var mf = Ji[df],
      B0 = mf.toLowerCase(),
      Y0 = mf[0].toUpperCase() + mf.slice(1);
    Ce(B0, "on" + Y0);
  }
  (Ce(ks, "onAnimationEnd"),
    Ce(Fs, "onAnimationIteration"),
    Ce(Ws, "onAnimationStart"),
    Ce("dblclick", "onDoubleClick"),
    Ce("focusin", "onFocus"),
    Ce("focusout", "onBlur"),
    Ce(t0, "onTransitionRun"),
    Ce(e0, "onTransitionStart"),
    Ce(l0, "onTransitionCancel"),
    Ce($s, "onTransitionEnd"),
    aa("onMouseEnter", ["mouseout", "mouseover"]),
    aa("onMouseLeave", ["mouseout", "mouseover"]),
    aa("onPointerEnter", ["pointerout", "pointerover"]),
    aa("onPointerLeave", ["pointerout", "pointerover"]),
    jl(
      "onChange",
      "change click focusin focusout input keydown keyup selectionchange".split(
        " ",
      ),
    ),
    jl(
      "onSelect",
      "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(
        " ",
      ),
    ),
    jl("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]),
    jl(
      "onCompositionEnd",
      "compositionend focusout keydown keypress keyup mousedown".split(" "),
    ),
    jl(
      "onCompositionStart",
      "compositionstart focusout keydown keypress keyup mousedown".split(" "),
    ),
    jl(
      "onCompositionUpdate",
      "compositionupdate focusout keydown keypress keyup mousedown".split(" "),
    ));
  var zn =
      "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(
        " ",
      ),
    L0 = new Set(
      "beforetoggle cancel close invalid load scroll scrollend toggle"
        .split(" ")
        .concat(zn),
    );
  function pd(t, e) {
    e = (e & 4) !== 0;
    for (var l = 0; l < t.length; l++) {
      var a = t[l],
        n = a.event;
      a = a.listeners;
      t: {
        var u = void 0;
        if (e)
          for (var i = a.length - 1; 0 <= i; i--) {
            var o = a[i],
              m = o.instance,
              T = o.currentTarget;
            if (((o = o.listener), m !== u && n.isPropagationStopped()))
              break t;
            ((u = o), (n.currentTarget = T));
            try {
              u(n);
            } catch (N) {
              nu(N);
            }
            ((n.currentTarget = null), (u = m));
          }
        else
          for (i = 0; i < a.length; i++) {
            if (
              ((o = a[i]),
              (m = o.instance),
              (T = o.currentTarget),
              (o = o.listener),
              m !== u && n.isPropagationStopped())
            )
              break t;
            ((u = o), (n.currentTarget = T));
            try {
              u(n);
            } catch (N) {
              nu(N);
            }
            ((n.currentTarget = null), (u = m));
          }
      }
    }
  }
  function nt(t, e) {
    var l = e[Oi];
    l === void 0 && (l = e[Oi] = new Set());
    var a = t + "__bubble";
    l.has(a) || (Sd(e, t, 2, !1), l.add(a));
  }
  function hf(t, e, l) {
    var a = 0;
    (e && (a |= 4), Sd(l, t, a, e));
  }
  var Zu = "_reactListening" + Math.random().toString(36).slice(2);
  function yf(t) {
    if (!t[Zu]) {
      ((t[Zu] = !0),
        ds.forEach(function (l) {
          l !== "selectionchange" && (L0.has(l) || hf(l, !1, t), hf(l, !0, t));
        }));
      var e = t.nodeType === 9 ? t : t.ownerDocument;
      e === null || e[Zu] || ((e[Zu] = !0), hf("selectionchange", !1, e));
    }
  }
  function Sd(t, e, l, a) {
    switch (Fd(e)) {
      case 2:
        var n = my;
        break;
      case 8:
        n = hy;
        break;
      default:
        n = Df;
    }
    ((l = n.bind(null, e, l, t)),
      (n = void 0),
      !Ci ||
        (e !== "touchstart" && e !== "touchmove" && e !== "wheel") ||
        (n = !0),
      a
        ? n !== void 0
          ? t.addEventListener(e, l, { capture: !0, passive: n })
          : t.addEventListener(e, l, !0)
        : n !== void 0
          ? t.addEventListener(e, l, { passive: n })
          : t.addEventListener(e, l, !1));
  }
  function vf(t, e, l, a, n) {
    var u = a;
    if ((e & 1) === 0 && (e & 2) === 0 && a !== null)
      t: for (;;) {
        if (a === null) return;
        var i = a.tag;
        if (i === 3 || i === 4) {
          var o = a.stateNode.containerInfo;
          if (o === n) break;
          if (i === 4)
            for (i = a.return; i !== null; ) {
              var m = i.tag;
              if ((m === 3 || m === 4) && i.stateNode.containerInfo === n)
                return;
              i = i.return;
            }
          for (; o !== null; ) {
            if (((i = ta(o)), i === null)) return;
            if (((m = i.tag), m === 5 || m === 6 || m === 26 || m === 27)) {
              a = u = i;
              continue t;
            }
            o = o.parentNode;
          }
        }
        a = a.return;
      }
    zs(function () {
      var T = u,
        N = Mi(l),
        j = [];
      t: {
        var A = Is.get(t);
        if (A !== void 0) {
          var _ = eu,
            X = t;
          switch (t) {
            case "keypress":
              if (Pn(l) === 0) break t;
            case "keydown":
            case "keyup":
              _ = Mh;
              break;
            case "focusin":
              ((X = "focus"), (_ = Yi));
              break;
            case "focusout":
              ((X = "blur"), (_ = Yi));
              break;
            case "beforeblur":
            case "afterblur":
              _ = Yi;
              break;
            case "click":
              if (l.button === 2) break t;
            case "auxclick":
            case "dblclick":
            case "mousedown":
            case "mousemove":
            case "mouseup":
            case "mouseout":
            case "mouseover":
            case "contextmenu":
              _ = xs;
              break;
            case "drag":
            case "dragend":
            case "dragenter":
            case "dragexit":
            case "dragleave":
            case "dragover":
            case "dragstart":
            case "drop":
              _ = Sh;
              break;
            case "touchcancel":
            case "touchend":
            case "touchmove":
            case "touchstart":
              _ = Hh;
              break;
            case ks:
            case Fs:
            case Ws:
              _ = Ah;
              break;
            case $s:
              _ = Bh;
              break;
            case "scroll":
            case "scrollend":
              _ = bh;
              break;
            case "wheel":
              _ = Lh;
              break;
            case "copy":
            case "cut":
            case "paste":
              _ = Oh;
              break;
            case "gotpointercapture":
            case "lostpointercapture":
            case "pointercancel":
            case "pointerdown":
            case "pointermove":
            case "pointerout":
            case "pointerover":
            case "pointerup":
              _ = Ns;
              break;
            case "toggle":
            case "beforetoggle":
              _ = Gh;
          }
          var k = (e & 4) !== 0,
            St = !k && (t === "scroll" || t === "scrollend"),
            p = k ? (A !== null ? A + "Capture" : null) : A;
          k = [];
          for (var v = T, E; v !== null; ) {
            var U = v;
            if (
              ((E = U.stateNode),
              (U = U.tag),
              (U !== 5 && U !== 26 && U !== 27) ||
                E === null ||
                p === null ||
                ((U = Va(v, p)), U != null && k.push(On(v, U, E))),
              St)
            )
              break;
            v = v.return;
          }
          0 < k.length &&
            ((A = new _(A, X, null, l, N)), j.push({ event: A, listeners: k }));
        }
      }
      if ((e & 7) === 0) {
        t: {
          if (
            ((A = t === "mouseover" || t === "pointerover"),
            (_ = t === "mouseout" || t === "pointerout"),
            A &&
              l !== Ui &&
              (X = l.relatedTarget || l.fromElement) &&
              (ta(X) || X[Pl]))
          )
            break t;
          if (
            (_ || A) &&
            ((A =
              N.window === N
                ? N
                : (A = N.ownerDocument)
                  ? A.defaultView || A.parentWindow
                  : window),
            _
              ? ((X = l.relatedTarget || l.toElement),
                (_ = T),
                (X = X ? ta(X) : null),
                X !== null &&
                  ((St = h(X)),
                  (k = X.tag),
                  X !== St || (k !== 5 && k !== 27 && k !== 6)) &&
                  (X = null))
              : ((_ = null), (X = T)),
            _ !== X)
          ) {
            if (
              ((k = xs),
              (U = "onMouseLeave"),
              (p = "onMouseEnter"),
              (v = "mouse"),
              (t === "pointerout" || t === "pointerover") &&
                ((k = Ns),
                (U = "onPointerLeave"),
                (p = "onPointerEnter"),
                (v = "pointer")),
              (St = _ == null ? A : Za(_)),
              (E = X == null ? A : Za(X)),
              (A = new k(U, v + "leave", _, l, N)),
              (A.target = St),
              (A.relatedTarget = E),
              (U = null),
              ta(N) === T &&
                ((k = new k(p, v + "enter", X, l, N)),
                (k.target = E),
                (k.relatedTarget = St),
                (U = k)),
              (St = U),
              _ && X)
            )
              e: {
                for (k = w0, p = _, v = X, E = 0, U = p; U; U = k(U)) E++;
                U = 0;
                for (var J = v; J; J = k(J)) U++;
                for (; 0 < E - U; ) ((p = k(p)), E--);
                for (; 0 < U - E; ) ((v = k(v)), U--);
                for (; E--; ) {
                  if (p === v || (v !== null && p === v.alternate)) {
                    k = p;
                    break e;
                  }
                  ((p = k(p)), (v = k(v)));
                }
                k = null;
              }
            else k = null;
            (_ !== null && Ed(j, A, _, k, !1),
              X !== null && St !== null && Ed(j, St, X, k, !0));
          }
        }
        t: {
          if (
            ((A = T ? Za(T) : window),
            (_ = A.nodeName && A.nodeName.toLowerCase()),
            _ === "select" || (_ === "input" && A.type === "file"))
          )
            var st = Bs;
          else if (Hs(A))
            if (Ys) st = $h;
            else {
              st = Fh;
              var Z = kh;
            }
          else
            ((_ = A.nodeName),
              !_ ||
              _.toLowerCase() !== "input" ||
              (A.type !== "checkbox" && A.type !== "radio")
                ? T && Di(T.elementType) && (st = Bs)
                : (st = Wh));
          if (st && (st = st(t, T))) {
            qs(j, st, l, N);
            break t;
          }
          (Z && Z(t, A, T),
            t === "focusout" &&
              T &&
              A.type === "number" &&
              T.memoizedProps.value != null &&
              Ni(A, "number", A.value));
        }
        switch (((Z = T ? Za(T) : window), t)) {
          case "focusin":
            (Hs(Z) || Z.contentEditable === "true") &&
              ((sa = Z), (Zi = T), (Pa = null));
            break;
          case "focusout":
            Pa = Zi = sa = null;
            break;
          case "mousedown":
            Vi = !0;
            break;
          case "contextmenu":
          case "mouseup":
          case "dragend":
            ((Vi = !1), Ks(j, l, N));
            break;
          case "selectionchange":
            if (Ph) break;
          case "keydown":
          case "keyup":
            Ks(j, l, N);
        }
        var P;
        if (wi)
          t: {
            switch (t) {
              case "compositionstart":
                var it = "onCompositionStart";
                break t;
              case "compositionend":
                it = "onCompositionEnd";
                break t;
              case "compositionupdate":
                it = "onCompositionUpdate";
                break t;
            }
            it = void 0;
          }
        else
          fa
            ? js(t, l) && (it = "onCompositionEnd")
            : t === "keydown" &&
              l.keyCode === 229 &&
              (it = "onCompositionStart");
        (it &&
          (Ds &&
            l.locale !== "ko" &&
            (fa || it !== "onCompositionStart"
              ? it === "onCompositionEnd" && fa && (P = Os())
              : ((fl = N),
                (Hi = "value" in fl ? fl.value : fl.textContent),
                (fa = !0))),
          (Z = Vu(T, it)),
          0 < Z.length &&
            ((it = new Rs(it, t, null, l, N)),
            j.push({ event: it, listeners: Z }),
            P ? (it.data = P) : ((P = Cs(l)), P !== null && (it.data = P)))),
          (P = Xh ? Zh(t, l) : Vh(t, l)) &&
            ((it = Vu(T, "onBeforeInput")),
            0 < it.length &&
              ((Z = new Rs("onBeforeInput", "beforeinput", null, l, N)),
              j.push({ event: Z, listeners: it }),
              (Z.data = P))),
          q0(j, t, T, l, N));
      }
      pd(j, e);
    });
  }
  function On(t, e, l) {
    return { instance: t, listener: e, currentTarget: l };
  }
  function Vu(t, e) {
    for (var l = e + "Capture", a = []; t !== null; ) {
      var n = t,
        u = n.stateNode;
      if (
        ((n = n.tag),
        (n !== 5 && n !== 26 && n !== 27) ||
          u === null ||
          ((n = Va(t, l)),
          n != null && a.unshift(On(t, n, u)),
          (n = Va(t, e)),
          n != null && a.push(On(t, n, u))),
        t.tag === 3)
      )
        return a;
      t = t.return;
    }
    return [];
  }
  function w0(t) {
    if (t === null) return null;
    do t = t.return;
    while (t && t.tag !== 5 && t.tag !== 27);
    return t || null;
  }
  function Ed(t, e, l, a, n) {
    for (var u = e._reactName, i = []; l !== null && l !== a; ) {
      var o = l,
        m = o.alternate,
        T = o.stateNode;
      if (((o = o.tag), m !== null && m === a)) break;
      ((o !== 5 && o !== 26 && o !== 27) ||
        T === null ||
        ((m = T),
        n
          ? ((T = Va(l, u)), T != null && i.unshift(On(l, T, m)))
          : n || ((T = Va(l, u)), T != null && i.push(On(l, T, m)))),
        (l = l.return));
    }
    i.length !== 0 && t.push({ event: e, listeners: i });
  }
  var G0 = /\r\n?/g,
    Q0 = /\u0000|\uFFFD/g;
  function Td(t) {
    return (typeof t == "string" ? t : "" + t)
      .replace(
        G0,
        `
`,
      )
      .replace(Q0, "");
  }
  function Ad(t, e) {
    return ((e = Td(e)), Td(t) === e);
  }
  function pt(t, e, l, a, n, u) {
    switch (l) {
      case "children":
        typeof a == "string"
          ? e === "body" || (e === "textarea" && a === "") || ua(t, a)
          : (typeof a == "number" || typeof a == "bigint") &&
            e !== "body" &&
            ua(t, "" + a);
        break;
      case "className":
        Fn(t, "class", a);
        break;
      case "tabIndex":
        Fn(t, "tabindex", a);
        break;
      case "dir":
      case "role":
      case "viewBox":
      case "width":
      case "height":
        Fn(t, l, a);
        break;
      case "style":
        Ts(t, a, u);
        break;
      case "data":
        if (e !== "object") {
          Fn(t, "data", a);
          break;
        }
      case "src":
      case "href":
        if (a === "" && (e !== "a" || l !== "href")) {
          t.removeAttribute(l);
          break;
        }
        if (
          a == null ||
          typeof a == "function" ||
          typeof a == "symbol" ||
          typeof a == "boolean"
        ) {
          t.removeAttribute(l);
          break;
        }
        ((a = $n("" + a)), t.setAttribute(l, a));
        break;
      case "action":
      case "formAction":
        if (typeof a == "function") {
          t.setAttribute(
            l,
            "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')",
          );
          break;
        } else
          typeof u == "function" &&
            (l === "formAction"
              ? (e !== "input" && pt(t, e, "name", n.name, n, null),
                pt(t, e, "formEncType", n.formEncType, n, null),
                pt(t, e, "formMethod", n.formMethod, n, null),
                pt(t, e, "formTarget", n.formTarget, n, null))
              : (pt(t, e, "encType", n.encType, n, null),
                pt(t, e, "method", n.method, n, null),
                pt(t, e, "target", n.target, n, null)));
        if (a == null || typeof a == "symbol" || typeof a == "boolean") {
          t.removeAttribute(l);
          break;
        }
        ((a = $n("" + a)), t.setAttribute(l, a));
        break;
      case "onClick":
        a != null && (t.onclick = Xe);
        break;
      case "onScroll":
        a != null && nt("scroll", t);
        break;
      case "onScrollEnd":
        a != null && nt("scrollend", t);
        break;
      case "dangerouslySetInnerHTML":
        if (a != null) {
          if (typeof a != "object" || !("__html" in a)) throw Error(s(61));
          if (((l = a.__html), l != null)) {
            if (n.children != null) throw Error(s(60));
            t.innerHTML = l;
          }
        }
        break;
      case "multiple":
        t.multiple = a && typeof a != "function" && typeof a != "symbol";
        break;
      case "muted":
        t.muted = a && typeof a != "function" && typeof a != "symbol";
        break;
      case "suppressContentEditableWarning":
      case "suppressHydrationWarning":
      case "defaultValue":
      case "defaultChecked":
      case "innerHTML":
      case "ref":
        break;
      case "autoFocus":
        break;
      case "xlinkHref":
        if (
          a == null ||
          typeof a == "function" ||
          typeof a == "boolean" ||
          typeof a == "symbol"
        ) {
          t.removeAttribute("xlink:href");
          break;
        }
        ((l = $n("" + a)),
          t.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", l));
        break;
      case "contentEditable":
      case "spellCheck":
      case "draggable":
      case "value":
      case "autoReverse":
      case "externalResourcesRequired":
      case "focusable":
      case "preserveAlpha":
        a != null && typeof a != "function" && typeof a != "symbol"
          ? t.setAttribute(l, "" + a)
          : t.removeAttribute(l);
        break;
      case "inert":
      case "allowFullScreen":
      case "async":
      case "autoPlay":
      case "controls":
      case "default":
      case "defer":
      case "disabled":
      case "disablePictureInPicture":
      case "disableRemotePlayback":
      case "formNoValidate":
      case "hidden":
      case "loop":
      case "noModule":
      case "noValidate":
      case "open":
      case "playsInline":
      case "readOnly":
      case "required":
      case "reversed":
      case "scoped":
      case "seamless":
      case "itemScope":
        a && typeof a != "function" && typeof a != "symbol"
          ? t.setAttribute(l, "")
          : t.removeAttribute(l);
        break;
      case "capture":
      case "download":
        a === !0
          ? t.setAttribute(l, "")
          : a !== !1 &&
              a != null &&
              typeof a != "function" &&
              typeof a != "symbol"
            ? t.setAttribute(l, a)
            : t.removeAttribute(l);
        break;
      case "cols":
      case "rows":
      case "size":
      case "span":
        a != null &&
        typeof a != "function" &&
        typeof a != "symbol" &&
        !isNaN(a) &&
        1 <= a
          ? t.setAttribute(l, a)
          : t.removeAttribute(l);
        break;
      case "rowSpan":
      case "start":
        a == null || typeof a == "function" || typeof a == "symbol" || isNaN(a)
          ? t.removeAttribute(l)
          : t.setAttribute(l, a);
        break;
      case "popover":
        (nt("beforetoggle", t), nt("toggle", t), kn(t, "popover", a));
        break;
      case "xlinkActuate":
        Qe(t, "http://www.w3.org/1999/xlink", "xlink:actuate", a);
        break;
      case "xlinkArcrole":
        Qe(t, "http://www.w3.org/1999/xlink", "xlink:arcrole", a);
        break;
      case "xlinkRole":
        Qe(t, "http://www.w3.org/1999/xlink", "xlink:role", a);
        break;
      case "xlinkShow":
        Qe(t, "http://www.w3.org/1999/xlink", "xlink:show", a);
        break;
      case "xlinkTitle":
        Qe(t, "http://www.w3.org/1999/xlink", "xlink:title", a);
        break;
      case "xlinkType":
        Qe(t, "http://www.w3.org/1999/xlink", "xlink:type", a);
        break;
      case "xmlBase":
        Qe(t, "http://www.w3.org/XML/1998/namespace", "xml:base", a);
        break;
      case "xmlLang":
        Qe(t, "http://www.w3.org/XML/1998/namespace", "xml:lang", a);
        break;
      case "xmlSpace":
        Qe(t, "http://www.w3.org/XML/1998/namespace", "xml:space", a);
        break;
      case "is":
        kn(t, "is", a);
        break;
      case "innerText":
      case "textContent":
        break;
      default:
        (!(2 < l.length) ||
          (l[0] !== "o" && l[0] !== "O") ||
          (l[1] !== "n" && l[1] !== "N")) &&
          ((l = vh.get(l) || l), kn(t, l, a));
    }
  }
  function gf(t, e, l, a, n, u) {
    switch (l) {
      case "style":
        Ts(t, a, u);
        break;
      case "dangerouslySetInnerHTML":
        if (a != null) {
          if (typeof a != "object" || !("__html" in a)) throw Error(s(61));
          if (((l = a.__html), l != null)) {
            if (n.children != null) throw Error(s(60));
            t.innerHTML = l;
          }
        }
        break;
      case "children":
        typeof a == "string"
          ? ua(t, a)
          : (typeof a == "number" || typeof a == "bigint") && ua(t, "" + a);
        break;
      case "onScroll":
        a != null && nt("scroll", t);
        break;
      case "onScrollEnd":
        a != null && nt("scrollend", t);
        break;
      case "onClick":
        a != null && (t.onclick = Xe);
        break;
      case "suppressContentEditableWarning":
      case "suppressHydrationWarning":
      case "innerHTML":
      case "ref":
        break;
      case "innerText":
      case "textContent":
        break;
      default:
        if (!ms.hasOwnProperty(l))
          t: {
            if (
              l[0] === "o" &&
              l[1] === "n" &&
              ((n = l.endsWith("Capture")),
              (e = l.slice(2, n ? l.length - 7 : void 0)),
              (u = t[ee] || null),
              (u = u != null ? u[l] : null),
              typeof u == "function" && t.removeEventListener(e, u, n),
              typeof a == "function")
            ) {
              (typeof u != "function" &&
                u !== null &&
                (l in t
                  ? (t[l] = null)
                  : t.hasAttribute(l) && t.removeAttribute(l)),
                t.addEventListener(e, a, n));
              break t;
            }
            l in t
              ? (t[l] = a)
              : a === !0
                ? t.setAttribute(l, "")
                : kn(t, l, a);
          }
    }
  }
  function kt(t, e, l) {
    switch (e) {
      case "div":
      case "span":
      case "svg":
      case "path":
      case "a":
      case "g":
      case "p":
      case "li":
        break;
      case "img":
        (nt("error", t), nt("load", t));
        var a = !1,
          n = !1,
          u;
        for (u in l)
          if (l.hasOwnProperty(u)) {
            var i = l[u];
            if (i != null)
              switch (u) {
                case "src":
                  a = !0;
                  break;
                case "srcSet":
                  n = !0;
                  break;
                case "children":
                case "dangerouslySetInnerHTML":
                  throw Error(s(137, e));
                default:
                  pt(t, e, u, i, l, null);
              }
          }
        (n && pt(t, e, "srcSet", l.srcSet, l, null),
          a && pt(t, e, "src", l.src, l, null));
        return;
      case "input":
        nt("invalid", t);
        var o = (u = i = n = null),
          m = null,
          T = null;
        for (a in l)
          if (l.hasOwnProperty(a)) {
            var N = l[a];
            if (N != null)
              switch (a) {
                case "name":
                  n = N;
                  break;
                case "type":
                  i = N;
                  break;
                case "checked":
                  m = N;
                  break;
                case "defaultChecked":
                  T = N;
                  break;
                case "value":
                  u = N;
                  break;
                case "defaultValue":
                  o = N;
                  break;
                case "children":
                case "dangerouslySetInnerHTML":
                  if (N != null) throw Error(s(137, e));
                  break;
                default:
                  pt(t, e, a, N, l, null);
              }
          }
        bs(t, u, o, m, T, i, n, !1);
        return;
      case "select":
        (nt("invalid", t), (a = i = u = null));
        for (n in l)
          if (l.hasOwnProperty(n) && ((o = l[n]), o != null))
            switch (n) {
              case "value":
                u = o;
                break;
              case "defaultValue":
                i = o;
                break;
              case "multiple":
                a = o;
              default:
                pt(t, e, n, o, l, null);
            }
        ((e = u),
          (l = i),
          (t.multiple = !!a),
          e != null ? na(t, !!a, e, !1) : l != null && na(t, !!a, l, !0));
        return;
      case "textarea":
        (nt("invalid", t), (u = n = a = null));
        for (i in l)
          if (l.hasOwnProperty(i) && ((o = l[i]), o != null))
            switch (i) {
              case "value":
                a = o;
                break;
              case "defaultValue":
                n = o;
                break;
              case "children":
                u = o;
                break;
              case "dangerouslySetInnerHTML":
                if (o != null) throw Error(s(91));
                break;
              default:
                pt(t, e, i, o, l, null);
            }
        Ss(t, a, n, u);
        return;
      case "option":
        for (m in l)
          l.hasOwnProperty(m) &&
            ((a = l[m]), a != null) &&
            (m === "selected"
              ? (t.selected =
                  a && typeof a != "function" && typeof a != "symbol")
              : pt(t, e, m, a, l, null));
        return;
      case "dialog":
        (nt("beforetoggle", t),
          nt("toggle", t),
          nt("cancel", t),
          nt("close", t));
        break;
      case "iframe":
      case "object":
        nt("load", t);
        break;
      case "video":
      case "audio":
        for (a = 0; a < zn.length; a++) nt(zn[a], t);
        break;
      case "image":
        (nt("error", t), nt("load", t));
        break;
      case "details":
        nt("toggle", t);
        break;
      case "embed":
      case "source":
      case "link":
        (nt("error", t), nt("load", t));
      case "area":
      case "base":
      case "br":
      case "col":
      case "hr":
      case "keygen":
      case "meta":
      case "param":
      case "track":
      case "wbr":
      case "menuitem":
        for (T in l)
          if (l.hasOwnProperty(T) && ((a = l[T]), a != null))
            switch (T) {
              case "children":
              case "dangerouslySetInnerHTML":
                throw Error(s(137, e));
              default:
                pt(t, e, T, a, l, null);
            }
        return;
      default:
        if (Di(e)) {
          for (N in l)
            l.hasOwnProperty(N) &&
              ((a = l[N]), a !== void 0 && gf(t, e, N, a, l, void 0));
          return;
        }
    }
    for (o in l)
      l.hasOwnProperty(o) && ((a = l[o]), a != null && pt(t, e, o, a, l, null));
  }
  function X0(t, e, l, a) {
    switch (e) {
      case "div":
      case "span":
      case "svg":
      case "path":
      case "a":
      case "g":
      case "p":
      case "li":
        break;
      case "input":
        var n = null,
          u = null,
          i = null,
          o = null,
          m = null,
          T = null,
          N = null;
        for (_ in l) {
          var j = l[_];
          if (l.hasOwnProperty(_) && j != null)
            switch (_) {
              case "checked":
                break;
              case "value":
                break;
              case "defaultValue":
                m = j;
              default:
                a.hasOwnProperty(_) || pt(t, e, _, null, a, j);
            }
        }
        for (var A in a) {
          var _ = a[A];
          if (((j = l[A]), a.hasOwnProperty(A) && (_ != null || j != null)))
            switch (A) {
              case "type":
                u = _;
                break;
              case "name":
                n = _;
                break;
              case "checked":
                T = _;
                break;
              case "defaultChecked":
                N = _;
                break;
              case "value":
                i = _;
                break;
              case "defaultValue":
                o = _;
                break;
              case "children":
              case "dangerouslySetInnerHTML":
                if (_ != null) throw Error(s(137, e));
                break;
              default:
                _ !== j && pt(t, e, A, _, a, j);
            }
        }
        Ri(t, i, o, m, T, N, u, n);
        return;
      case "select":
        _ = i = o = A = null;
        for (u in l)
          if (((m = l[u]), l.hasOwnProperty(u) && m != null))
            switch (u) {
              case "value":
                break;
              case "multiple":
                _ = m;
              default:
                a.hasOwnProperty(u) || pt(t, e, u, null, a, m);
            }
        for (n in a)
          if (
            ((u = a[n]),
            (m = l[n]),
            a.hasOwnProperty(n) && (u != null || m != null))
          )
            switch (n) {
              case "value":
                A = u;
                break;
              case "defaultValue":
                o = u;
                break;
              case "multiple":
                i = u;
              default:
                u !== m && pt(t, e, n, u, a, m);
            }
        ((e = o),
          (l = i),
          (a = _),
          A != null
            ? na(t, !!l, A, !1)
            : !!a != !!l &&
              (e != null ? na(t, !!l, e, !0) : na(t, !!l, l ? [] : "", !1)));
        return;
      case "textarea":
        _ = A = null;
        for (o in l)
          if (
            ((n = l[o]),
            l.hasOwnProperty(o) && n != null && !a.hasOwnProperty(o))
          )
            switch (o) {
              case "value":
                break;
              case "children":
                break;
              default:
                pt(t, e, o, null, a, n);
            }
        for (i in a)
          if (
            ((n = a[i]),
            (u = l[i]),
            a.hasOwnProperty(i) && (n != null || u != null))
          )
            switch (i) {
              case "value":
                A = n;
                break;
              case "defaultValue":
                _ = n;
                break;
              case "children":
                break;
              case "dangerouslySetInnerHTML":
                if (n != null) throw Error(s(91));
                break;
              default:
                n !== u && pt(t, e, i, n, a, u);
            }
        ps(t, A, _);
        return;
      case "option":
        for (var X in l)
          ((A = l[X]),
            l.hasOwnProperty(X) &&
              A != null &&
              !a.hasOwnProperty(X) &&
              (X === "selected" ? (t.selected = !1) : pt(t, e, X, null, a, A)));
        for (m in a)
          ((A = a[m]),
            (_ = l[m]),
            a.hasOwnProperty(m) &&
              A !== _ &&
              (A != null || _ != null) &&
              (m === "selected"
                ? (t.selected =
                    A && typeof A != "function" && typeof A != "symbol")
                : pt(t, e, m, A, a, _)));
        return;
      case "img":
      case "link":
      case "area":
      case "base":
      case "br":
      case "col":
      case "embed":
      case "hr":
      case "keygen":
      case "meta":
      case "param":
      case "source":
      case "track":
      case "wbr":
      case "menuitem":
        for (var k in l)
          ((A = l[k]),
            l.hasOwnProperty(k) &&
              A != null &&
              !a.hasOwnProperty(k) &&
              pt(t, e, k, null, a, A));
        for (T in a)
          if (
            ((A = a[T]),
            (_ = l[T]),
            a.hasOwnProperty(T) && A !== _ && (A != null || _ != null))
          )
            switch (T) {
              case "children":
              case "dangerouslySetInnerHTML":
                if (A != null) throw Error(s(137, e));
                break;
              default:
                pt(t, e, T, A, a, _);
            }
        return;
      default:
        if (Di(e)) {
          for (var St in l)
            ((A = l[St]),
              l.hasOwnProperty(St) &&
                A !== void 0 &&
                !a.hasOwnProperty(St) &&
                gf(t, e, St, void 0, a, A));
          for (N in a)
            ((A = a[N]),
              (_ = l[N]),
              !a.hasOwnProperty(N) ||
                A === _ ||
                (A === void 0 && _ === void 0) ||
                gf(t, e, N, A, a, _));
          return;
        }
    }
    for (var p in l)
      ((A = l[p]),
        l.hasOwnProperty(p) &&
          A != null &&
          !a.hasOwnProperty(p) &&
          pt(t, e, p, null, a, A));
    for (j in a)
      ((A = a[j]),
        (_ = l[j]),
        !a.hasOwnProperty(j) ||
          A === _ ||
          (A == null && _ == null) ||
          pt(t, e, j, A, a, _));
  }
  function zd(t) {
    switch (t) {
      case "css":
      case "script":
      case "font":
      case "img":
      case "image":
      case "input":
      case "link":
        return !0;
      default:
        return !1;
    }
  }
  function Z0() {
    if (typeof performance.getEntriesByType == "function") {
      for (
        var t = 0, e = 0, l = performance.getEntriesByType("resource"), a = 0;
        a < l.length;
        a++
      ) {
        var n = l[a],
          u = n.transferSize,
          i = n.initiatorType,
          o = n.duration;
        if (u && o && zd(i)) {
          for (i = 0, o = n.responseEnd, a += 1; a < l.length; a++) {
            var m = l[a],
              T = m.startTime;
            if (T > o) break;
            var N = m.transferSize,
              j = m.initiatorType;
            N &&
              zd(j) &&
              ((m = m.responseEnd), (i += N * (m < o ? 1 : (o - T) / (m - T))));
          }
          if ((--a, (e += (8 * (u + i)) / (n.duration / 1e3)), t++, 10 < t))
            break;
        }
      }
      if (0 < t) return e / t / 1e6;
    }
    return navigator.connection &&
      ((t = navigator.connection.downlink), typeof t == "number")
      ? t
      : 5;
  }
  var bf = null,
    pf = null;
  function Ku(t) {
    return t.nodeType === 9 ? t : t.ownerDocument;
  }
  function Od(t) {
    switch (t) {
      case "http://www.w3.org/2000/svg":
        return 1;
      case "http://www.w3.org/1998/Math/MathML":
        return 2;
      default:
        return 0;
    }
  }
  function _d(t, e) {
    if (t === 0)
      switch (e) {
        case "svg":
          return 1;
        case "math":
          return 2;
        default:
          return 0;
      }
    return t === 1 && e === "foreignObject" ? 0 : t;
  }
  function Sf(t, e) {
    return (
      t === "textarea" ||
      t === "noscript" ||
      typeof e.children == "string" ||
      typeof e.children == "number" ||
      typeof e.children == "bigint" ||
      (typeof e.dangerouslySetInnerHTML == "object" &&
        e.dangerouslySetInnerHTML !== null &&
        e.dangerouslySetInnerHTML.__html != null)
    );
  }
  var Ef = null;
  function V0() {
    var t = window.event;
    return t && t.type === "popstate"
      ? t === Ef
        ? !1
        : ((Ef = t), !0)
      : ((Ef = null), !1);
  }
  var xd = typeof setTimeout == "function" ? setTimeout : void 0,
    K0 = typeof clearTimeout == "function" ? clearTimeout : void 0,
    Rd = typeof Promise == "function" ? Promise : void 0,
    J0 =
      typeof queueMicrotask == "function"
        ? queueMicrotask
        : typeof Rd < "u"
          ? function (t) {
              return Rd.resolve(null).then(t).catch(k0);
            }
          : xd;
  function k0(t) {
    setTimeout(function () {
      throw t;
    });
  }
  function Ol(t) {
    return t === "head";
  }
  function Nd(t, e) {
    var l = e,
      a = 0;
    do {
      var n = l.nextSibling;
      if ((t.removeChild(l), n && n.nodeType === 8))
        if (((l = n.data), l === "/$" || l === "/&")) {
          if (a === 0) {
            (t.removeChild(n), qa(e));
            return;
          }
          a--;
        } else if (
          l === "$" ||
          l === "$?" ||
          l === "$~" ||
          l === "$!" ||
          l === "&"
        )
          a++;
        else if (l === "html") _n(t.ownerDocument.documentElement);
        else if (l === "head") {
          ((l = t.ownerDocument.head), _n(l));
          for (var u = l.firstChild; u; ) {
            var i = u.nextSibling,
              o = u.nodeName;
            (u[Xa] ||
              o === "SCRIPT" ||
              o === "STYLE" ||
              (o === "LINK" && u.rel.toLowerCase() === "stylesheet") ||
              l.removeChild(u),
              (u = i));
          }
        } else l === "body" && _n(t.ownerDocument.body);
      l = n;
    } while (l);
    qa(e);
  }
  function Dd(t, e) {
    var l = t;
    t = 0;
    do {
      var a = l.nextSibling;
      if (
        (l.nodeType === 1
          ? e
            ? ((l._stashedDisplay = l.style.display),
              (l.style.display = "none"))
            : ((l.style.display = l._stashedDisplay || ""),
              l.getAttribute("style") === "" && l.removeAttribute("style"))
          : l.nodeType === 3 &&
            (e
              ? ((l._stashedText = l.nodeValue), (l.nodeValue = ""))
              : (l.nodeValue = l._stashedText || "")),
        a && a.nodeType === 8)
      )
        if (((l = a.data), l === "/$")) {
          if (t === 0) break;
          t--;
        } else (l !== "$" && l !== "$?" && l !== "$~" && l !== "$!") || t++;
      l = a;
    } while (l);
  }
  function Tf(t) {
    var e = t.firstChild;
    for (e && e.nodeType === 10 && (e = e.nextSibling); e; ) {
      var l = e;
      switch (((e = e.nextSibling), l.nodeName)) {
        case "HTML":
        case "HEAD":
        case "BODY":
          (Tf(l), _i(l));
          continue;
        case "SCRIPT":
        case "STYLE":
          continue;
        case "LINK":
          if (l.rel.toLowerCase() === "stylesheet") continue;
      }
      t.removeChild(l);
    }
  }
  function F0(t, e, l, a) {
    for (; t.nodeType === 1; ) {
      var n = l;
      if (t.nodeName.toLowerCase() !== e.toLowerCase()) {
        if (!a && (t.nodeName !== "INPUT" || t.type !== "hidden")) break;
      } else if (a) {
        if (!t[Xa])
          switch (e) {
            case "meta":
              if (!t.hasAttribute("itemprop")) break;
              return t;
            case "link":
              if (
                ((u = t.getAttribute("rel")),
                u === "stylesheet" && t.hasAttribute("data-precedence"))
              )
                break;
              if (
                u !== n.rel ||
                t.getAttribute("href") !==
                  (n.href == null || n.href === "" ? null : n.href) ||
                t.getAttribute("crossorigin") !==
                  (n.crossOrigin == null ? null : n.crossOrigin) ||
                t.getAttribute("title") !== (n.title == null ? null : n.title)
              )
                break;
              return t;
            case "style":
              if (t.hasAttribute("data-precedence")) break;
              return t;
            case "script":
              if (
                ((u = t.getAttribute("src")),
                (u !== (n.src == null ? null : n.src) ||
                  t.getAttribute("type") !== (n.type == null ? null : n.type) ||
                  t.getAttribute("crossorigin") !==
                    (n.crossOrigin == null ? null : n.crossOrigin)) &&
                  u &&
                  t.hasAttribute("async") &&
                  !t.hasAttribute("itemprop"))
              )
                break;
              return t;
            default:
              return t;
          }
      } else if (e === "input" && t.type === "hidden") {
        var u = n.name == null ? null : "" + n.name;
        if (n.type === "hidden" && t.getAttribute("name") === u) return t;
      } else return t;
      if (((t = De(t.nextSibling)), t === null)) break;
    }
    return null;
  }
  function W0(t, e, l) {
    if (e === "") return null;
    for (; t.nodeType !== 3; )
      if (
        ((t.nodeType !== 1 || t.nodeName !== "INPUT" || t.type !== "hidden") &&
          !l) ||
        ((t = De(t.nextSibling)), t === null)
      )
        return null;
    return t;
  }
  function Ud(t, e) {
    for (; t.nodeType !== 8; )
      if (
        ((t.nodeType !== 1 || t.nodeName !== "INPUT" || t.type !== "hidden") &&
          !e) ||
        ((t = De(t.nextSibling)), t === null)
      )
        return null;
    return t;
  }
  function Af(t) {
    return t.data === "$?" || t.data === "$~";
  }
  function zf(t) {
    return (
      t.data === "$!" ||
      (t.data === "$?" && t.ownerDocument.readyState !== "loading")
    );
  }
  function $0(t, e) {
    var l = t.ownerDocument;
    if (t.data === "$~") t._reactRetry = e;
    else if (t.data !== "$?" || l.readyState !== "loading") e();
    else {
      var a = function () {
        (e(), l.removeEventListener("DOMContentLoaded", a));
      };
      (l.addEventListener("DOMContentLoaded", a), (t._reactRetry = a));
    }
  }
  function De(t) {
    for (; t != null; t = t.nextSibling) {
      var e = t.nodeType;
      if (e === 1 || e === 3) break;
      if (e === 8) {
        if (
          ((e = t.data),
          e === "$" ||
            e === "$!" ||
            e === "$?" ||
            e === "$~" ||
            e === "&" ||
            e === "F!" ||
            e === "F")
        )
          break;
        if (e === "/$" || e === "/&") return null;
      }
    }
    return t;
  }
  var Of = null;
  function Md(t) {
    t = t.nextSibling;
    for (var e = 0; t; ) {
      if (t.nodeType === 8) {
        var l = t.data;
        if (l === "/$" || l === "/&") {
          if (e === 0) return De(t.nextSibling);
          e--;
        } else
          (l !== "$" && l !== "$!" && l !== "$?" && l !== "$~" && l !== "&") ||
            e++;
      }
      t = t.nextSibling;
    }
    return null;
  }
  function jd(t) {
    t = t.previousSibling;
    for (var e = 0; t; ) {
      if (t.nodeType === 8) {
        var l = t.data;
        if (l === "$" || l === "$!" || l === "$?" || l === "$~" || l === "&") {
          if (e === 0) return t;
          e--;
        } else (l !== "/$" && l !== "/&") || e++;
      }
      t = t.previousSibling;
    }
    return null;
  }
  function Cd(t, e, l) {
    switch (((e = Ku(l)), t)) {
      case "html":
        if (((t = e.documentElement), !t)) throw Error(s(452));
        return t;
      case "head":
        if (((t = e.head), !t)) throw Error(s(453));
        return t;
      case "body":
        if (((t = e.body), !t)) throw Error(s(454));
        return t;
      default:
        throw Error(s(451));
    }
  }
  function _n(t) {
    for (var e = t.attributes; e.length; ) t.removeAttributeNode(e[0]);
    _i(t);
  }
  var Ue = new Map(),
    Hd = new Set();
  function Ju(t) {
    return typeof t.getRootNode == "function"
      ? t.getRootNode()
      : t.nodeType === 9
        ? t
        : t.ownerDocument;
  }
  var ul = Y.d;
  Y.d = { f: I0, r: P0, D: ty, C: ey, L: ly, m: ay, X: uy, S: ny, M: iy };
  function I0() {
    var t = ul.f(),
      e = Yu();
    return t || e;
  }
  function P0(t) {
    var e = ea(t);
    e !== null && e.tag === 5 && e.type === "form" ? $r(e) : ul.r(t);
  }
  var ja = typeof document > "u" ? null : document;
  function qd(t, e, l) {
    var a = ja;
    if (a && typeof e == "string" && e) {
      var n = Ae(e);
      ((n = 'link[rel="' + t + '"][href="' + n + '"]'),
        typeof l == "string" && (n += '[crossorigin="' + l + '"]'),
        Hd.has(n) ||
          (Hd.add(n),
          (t = { rel: t, crossOrigin: l, href: e }),
          a.querySelector(n) === null &&
            ((e = a.createElement("link")),
            kt(e, "link", t),
            Gt(e),
            a.head.appendChild(e))));
    }
  }
  function ty(t) {
    (ul.D(t), qd("dns-prefetch", t, null));
  }
  function ey(t, e) {
    (ul.C(t, e), qd("preconnect", t, e));
  }
  function ly(t, e, l) {
    ul.L(t, e, l);
    var a = ja;
    if (a && t && e) {
      var n = 'link[rel="preload"][as="' + Ae(e) + '"]';
      e === "image" && l && l.imageSrcSet
        ? ((n += '[imagesrcset="' + Ae(l.imageSrcSet) + '"]'),
          typeof l.imageSizes == "string" &&
            (n += '[imagesizes="' + Ae(l.imageSizes) + '"]'))
        : (n += '[href="' + Ae(t) + '"]');
      var u = n;
      switch (e) {
        case "style":
          u = Ca(t);
          break;
        case "script":
          u = Ha(t);
      }
      Ue.has(u) ||
        ((t = C(
          {
            rel: "preload",
            href: e === "image" && l && l.imageSrcSet ? void 0 : t,
            as: e,
          },
          l,
        )),
        Ue.set(u, t),
        a.querySelector(n) !== null ||
          (e === "style" && a.querySelector(xn(u))) ||
          (e === "script" && a.querySelector(Rn(u))) ||
          ((e = a.createElement("link")),
          kt(e, "link", t),
          Gt(e),
          a.head.appendChild(e)));
    }
  }
  function ay(t, e) {
    ul.m(t, e);
    var l = ja;
    if (l && t) {
      var a = e && typeof e.as == "string" ? e.as : "script",
        n =
          'link[rel="modulepreload"][as="' + Ae(a) + '"][href="' + Ae(t) + '"]',
        u = n;
      switch (a) {
        case "audioworklet":
        case "paintworklet":
        case "serviceworker":
        case "sharedworker":
        case "worker":
        case "script":
          u = Ha(t);
      }
      if (
        !Ue.has(u) &&
        ((t = C({ rel: "modulepreload", href: t }, e)),
        Ue.set(u, t),
        l.querySelector(n) === null)
      ) {
        switch (a) {
          case "audioworklet":
          case "paintworklet":
          case "serviceworker":
          case "sharedworker":
          case "worker":
          case "script":
            if (l.querySelector(Rn(u))) return;
        }
        ((a = l.createElement("link")),
          kt(a, "link", t),
          Gt(a),
          l.head.appendChild(a));
      }
    }
  }
  function ny(t, e, l) {
    ul.S(t, e, l);
    var a = ja;
    if (a && t) {
      var n = la(a).hoistableStyles,
        u = Ca(t);
      e = e || "default";
      var i = n.get(u);
      if (!i) {
        var o = { loading: 0, preload: null };
        if ((i = a.querySelector(xn(u)))) o.loading = 5;
        else {
          ((t = C({ rel: "stylesheet", href: t, "data-precedence": e }, l)),
            (l = Ue.get(u)) && _f(t, l));
          var m = (i = a.createElement("link"));
          (Gt(m),
            kt(m, "link", t),
            (m._p = new Promise(function (T, N) {
              ((m.onload = T), (m.onerror = N));
            })),
            m.addEventListener("load", function () {
              o.loading |= 1;
            }),
            m.addEventListener("error", function () {
              o.loading |= 2;
            }),
            (o.loading |= 4),
            ku(i, e, a));
        }
        ((i = { type: "stylesheet", instance: i, count: 1, state: o }),
          n.set(u, i));
      }
    }
  }
  function uy(t, e) {
    ul.X(t, e);
    var l = ja;
    if (l && t) {
      var a = la(l).hoistableScripts,
        n = Ha(t),
        u = a.get(n);
      u ||
        ((u = l.querySelector(Rn(n))),
        u ||
          ((t = C({ src: t, async: !0 }, e)),
          (e = Ue.get(n)) && xf(t, e),
          (u = l.createElement("script")),
          Gt(u),
          kt(u, "link", t),
          l.head.appendChild(u)),
        (u = { type: "script", instance: u, count: 1, state: null }),
        a.set(n, u));
    }
  }
  function iy(t, e) {
    ul.M(t, e);
    var l = ja;
    if (l && t) {
      var a = la(l).hoistableScripts,
        n = Ha(t),
        u = a.get(n);
      u ||
        ((u = l.querySelector(Rn(n))),
        u ||
          ((t = C({ src: t, async: !0, type: "module" }, e)),
          (e = Ue.get(n)) && xf(t, e),
          (u = l.createElement("script")),
          Gt(u),
          kt(u, "link", t),
          l.head.appendChild(u)),
        (u = { type: "script", instance: u, count: 1, state: null }),
        a.set(n, u));
    }
  }
  function Bd(t, e, l, a) {
    var n = (n = lt.current) ? Ju(n) : null;
    if (!n) throw Error(s(446));
    switch (t) {
      case "meta":
      case "title":
        return null;
      case "style":
        return typeof l.precedence == "string" && typeof l.href == "string"
          ? ((e = Ca(l.href)),
            (l = la(n).hoistableStyles),
            (a = l.get(e)),
            a ||
              ((a = { type: "style", instance: null, count: 0, state: null }),
              l.set(e, a)),
            a)
          : { type: "void", instance: null, count: 0, state: null };
      case "link":
        if (
          l.rel === "stylesheet" &&
          typeof l.href == "string" &&
          typeof l.precedence == "string"
        ) {
          t = Ca(l.href);
          var u = la(n).hoistableStyles,
            i = u.get(t);
          if (
            (i ||
              ((n = n.ownerDocument || n),
              (i = {
                type: "stylesheet",
                instance: null,
                count: 0,
                state: { loading: 0, preload: null },
              }),
              u.set(t, i),
              (u = n.querySelector(xn(t))) &&
                !u._p &&
                ((i.instance = u), (i.state.loading = 5)),
              Ue.has(t) ||
                ((l = {
                  rel: "preload",
                  as: "style",
                  href: l.href,
                  crossOrigin: l.crossOrigin,
                  integrity: l.integrity,
                  media: l.media,
                  hrefLang: l.hrefLang,
                  referrerPolicy: l.referrerPolicy,
                }),
                Ue.set(t, l),
                u || cy(n, t, l, i.state))),
            e && a === null)
          )
            throw Error(s(528, ""));
          return i;
        }
        if (e && a !== null) throw Error(s(529, ""));
        return null;
      case "script":
        return (
          (e = l.async),
          (l = l.src),
          typeof l == "string" &&
          e &&
          typeof e != "function" &&
          typeof e != "symbol"
            ? ((e = Ha(l)),
              (l = la(n).hoistableScripts),
              (a = l.get(e)),
              a ||
                ((a = {
                  type: "script",
                  instance: null,
                  count: 0,
                  state: null,
                }),
                l.set(e, a)),
              a)
            : { type: "void", instance: null, count: 0, state: null }
        );
      default:
        throw Error(s(444, t));
    }
  }
  function Ca(t) {
    return 'href="' + Ae(t) + '"';
  }
  function xn(t) {
    return 'link[rel="stylesheet"][' + t + "]";
  }
  function Yd(t) {
    return C({}, t, { "data-precedence": t.precedence, precedence: null });
  }
  function cy(t, e, l, a) {
    t.querySelector('link[rel="preload"][as="style"][' + e + "]")
      ? (a.loading = 1)
      : ((e = t.createElement("link")),
        (a.preload = e),
        e.addEventListener("load", function () {
          return (a.loading |= 1);
        }),
        e.addEventListener("error", function () {
          return (a.loading |= 2);
        }),
        kt(e, "link", l),
        Gt(e),
        t.head.appendChild(e));
  }
  function Ha(t) {
    return '[src="' + Ae(t) + '"]';
  }
  function Rn(t) {
    return "script[async]" + t;
  }
  function Ld(t, e, l) {
    if ((e.count++, e.instance === null))
      switch (e.type) {
        case "style":
          var a = t.querySelector('style[data-href~="' + Ae(l.href) + '"]');
          if (a) return ((e.instance = a), Gt(a), a);
          var n = C({}, l, {
            "data-href": l.href,
            "data-precedence": l.precedence,
            href: null,
            precedence: null,
          });
          return (
            (a = (t.ownerDocument || t).createElement("style")),
            Gt(a),
            kt(a, "style", n),
            ku(a, l.precedence, t),
            (e.instance = a)
          );
        case "stylesheet":
          n = Ca(l.href);
          var u = t.querySelector(xn(n));
          if (u) return ((e.state.loading |= 4), (e.instance = u), Gt(u), u);
          ((a = Yd(l)),
            (n = Ue.get(n)) && _f(a, n),
            (u = (t.ownerDocument || t).createElement("link")),
            Gt(u));
          var i = u;
          return (
            (i._p = new Promise(function (o, m) {
              ((i.onload = o), (i.onerror = m));
            })),
            kt(u, "link", a),
            (e.state.loading |= 4),
            ku(u, l.precedence, t),
            (e.instance = u)
          );
        case "script":
          return (
            (u = Ha(l.src)),
            (n = t.querySelector(Rn(u)))
              ? ((e.instance = n), Gt(n), n)
              : ((a = l),
                (n = Ue.get(u)) && ((a = C({}, l)), xf(a, n)),
                (t = t.ownerDocument || t),
                (n = t.createElement("script")),
                Gt(n),
                kt(n, "link", a),
                t.head.appendChild(n),
                (e.instance = n))
          );
        case "void":
          return null;
        default:
          throw Error(s(443, e.type));
      }
    else
      e.type === "stylesheet" &&
        (e.state.loading & 4) === 0 &&
        ((a = e.instance), (e.state.loading |= 4), ku(a, l.precedence, t));
    return e.instance;
  }
  function ku(t, e, l) {
    for (
      var a = l.querySelectorAll(
          'link[rel="stylesheet"][data-precedence],style[data-precedence]',
        ),
        n = a.length ? a[a.length - 1] : null,
        u = n,
        i = 0;
      i < a.length;
      i++
    ) {
      var o = a[i];
      if (o.dataset.precedence === e) u = o;
      else if (u !== n) break;
    }
    u
      ? u.parentNode.insertBefore(t, u.nextSibling)
      : ((e = l.nodeType === 9 ? l.head : l), e.insertBefore(t, e.firstChild));
  }
  function _f(t, e) {
    (t.crossOrigin == null && (t.crossOrigin = e.crossOrigin),
      t.referrerPolicy == null && (t.referrerPolicy = e.referrerPolicy),
      t.title == null && (t.title = e.title));
  }
  function xf(t, e) {
    (t.crossOrigin == null && (t.crossOrigin = e.crossOrigin),
      t.referrerPolicy == null && (t.referrerPolicy = e.referrerPolicy),
      t.integrity == null && (t.integrity = e.integrity));
  }
  var Fu = null;
  function wd(t, e, l) {
    if (Fu === null) {
      var a = new Map(),
        n = (Fu = new Map());
      n.set(l, a);
    } else ((n = Fu), (a = n.get(l)), a || ((a = new Map()), n.set(l, a)));
    if (a.has(t)) return a;
    for (
      a.set(t, null), l = l.getElementsByTagName(t), n = 0;
      n < l.length;
      n++
    ) {
      var u = l[n];
      if (
        !(
          u[Xa] ||
          u[Zt] ||
          (t === "link" && u.getAttribute("rel") === "stylesheet")
        ) &&
        u.namespaceURI !== "http://www.w3.org/2000/svg"
      ) {
        var i = u.getAttribute(e) || "";
        i = t + i;
        var o = a.get(i);
        o ? o.push(u) : a.set(i, [u]);
      }
    }
    return a;
  }
  function Gd(t, e, l) {
    ((t = t.ownerDocument || t),
      t.head.insertBefore(
        l,
        e === "title" ? t.querySelector("head > title") : null,
      ));
  }
  function fy(t, e, l) {
    if (l === 1 || e.itemProp != null) return !1;
    switch (t) {
      case "meta":
      case "title":
        return !0;
      case "style":
        if (
          typeof e.precedence != "string" ||
          typeof e.href != "string" ||
          e.href === ""
        )
          break;
        return !0;
      case "link":
        if (
          typeof e.rel != "string" ||
          typeof e.href != "string" ||
          e.href === "" ||
          e.onLoad ||
          e.onError
        )
          break;
        return e.rel === "stylesheet"
          ? ((t = e.disabled), typeof e.precedence == "string" && t == null)
          : !0;
      case "script":
        if (
          e.async &&
          typeof e.async != "function" &&
          typeof e.async != "symbol" &&
          !e.onLoad &&
          !e.onError &&
          e.src &&
          typeof e.src == "string"
        )
          return !0;
    }
    return !1;
  }
  function Qd(t) {
    return !(t.type === "stylesheet" && (t.state.loading & 3) === 0);
  }
  function sy(t, e, l, a) {
    if (
      l.type === "stylesheet" &&
      (typeof a.media != "string" || matchMedia(a.media).matches !== !1) &&
      (l.state.loading & 4) === 0
    ) {
      if (l.instance === null) {
        var n = Ca(a.href),
          u = e.querySelector(xn(n));
        if (u) {
          ((e = u._p),
            e !== null &&
              typeof e == "object" &&
              typeof e.then == "function" &&
              (t.count++, (t = Wu.bind(t)), e.then(t, t)),
            (l.state.loading |= 4),
            (l.instance = u),
            Gt(u));
          return;
        }
        ((u = e.ownerDocument || e),
          (a = Yd(a)),
          (n = Ue.get(n)) && _f(a, n),
          (u = u.createElement("link")),
          Gt(u));
        var i = u;
        ((i._p = new Promise(function (o, m) {
          ((i.onload = o), (i.onerror = m));
        })),
          kt(u, "link", a),
          (l.instance = u));
      }
      (t.stylesheets === null && (t.stylesheets = new Map()),
        t.stylesheets.set(l, e),
        (e = l.state.preload) &&
          (l.state.loading & 3) === 0 &&
          (t.count++,
          (l = Wu.bind(t)),
          e.addEventListener("load", l),
          e.addEventListener("error", l)));
    }
  }
  var Rf = 0;
  function ry(t, e) {
    return (
      t.stylesheets && t.count === 0 && Iu(t, t.stylesheets),
      0 < t.count || 0 < t.imgCount
        ? function (l) {
            var a = setTimeout(function () {
              if ((t.stylesheets && Iu(t, t.stylesheets), t.unsuspend)) {
                var u = t.unsuspend;
                ((t.unsuspend = null), u());
              }
            }, 6e4 + e);
            0 < t.imgBytes && Rf === 0 && (Rf = 62500 * Z0());
            var n = setTimeout(
              function () {
                if (
                  ((t.waitingForImages = !1),
                  t.count === 0 &&
                    (t.stylesheets && Iu(t, t.stylesheets), t.unsuspend))
                ) {
                  var u = t.unsuspend;
                  ((t.unsuspend = null), u());
                }
              },
              (t.imgBytes > Rf ? 50 : 800) + e,
            );
            return (
              (t.unsuspend = l),
              function () {
                ((t.unsuspend = null), clearTimeout(a), clearTimeout(n));
              }
            );
          }
        : null
    );
  }
  function Wu() {
    if (
      (this.count--,
      this.count === 0 && (this.imgCount === 0 || !this.waitingForImages))
    ) {
      if (this.stylesheets) Iu(this, this.stylesheets);
      else if (this.unsuspend) {
        var t = this.unsuspend;
        ((this.unsuspend = null), t());
      }
    }
  }
  var $u = null;
  function Iu(t, e) {
    ((t.stylesheets = null),
      t.unsuspend !== null &&
        (t.count++,
        ($u = new Map()),
        e.forEach(oy, t),
        ($u = null),
        Wu.call(t)));
  }
  function oy(t, e) {
    if (!(e.state.loading & 4)) {
      var l = $u.get(t);
      if (l) var a = l.get(null);
      else {
        ((l = new Map()), $u.set(t, l));
        for (
          var n = t.querySelectorAll(
              "link[data-precedence],style[data-precedence]",
            ),
            u = 0;
          u < n.length;
          u++
        ) {
          var i = n[u];
          (i.nodeName === "LINK" || i.getAttribute("media") !== "not all") &&
            (l.set(i.dataset.precedence, i), (a = i));
        }
        a && l.set(null, a);
      }
      ((n = e.instance),
        (i = n.getAttribute("data-precedence")),
        (u = l.get(i) || a),
        u === a && l.set(null, n),
        l.set(i, n),
        this.count++,
        (a = Wu.bind(this)),
        n.addEventListener("load", a),
        n.addEventListener("error", a),
        u
          ? u.parentNode.insertBefore(n, u.nextSibling)
          : ((t = t.nodeType === 9 ? t.head : t),
            t.insertBefore(n, t.firstChild)),
        (e.state.loading |= 4));
    }
  }
  var Nn = {
    $$typeof: et,
    Provider: null,
    Consumer: null,
    _currentValue: K,
    _currentValue2: K,
    _threadCount: 0,
  };
  function dy(t, e, l, a, n, u, i, o, m) {
    ((this.tag = 1),
      (this.containerInfo = t),
      (this.pingCache = this.current = this.pendingChildren = null),
      (this.timeoutHandle = -1),
      (this.callbackNode =
        this.next =
        this.pendingContext =
        this.context =
        this.cancelPendingCommit =
          null),
      (this.callbackPriority = 0),
      (this.expirationTimes = Ti(-1)),
      (this.entangledLanes =
        this.shellSuspendCounter =
        this.errorRecoveryDisabledLanes =
        this.expiredLanes =
        this.warmLanes =
        this.pingedLanes =
        this.suspendedLanes =
        this.pendingLanes =
          0),
      (this.entanglements = Ti(0)),
      (this.hiddenUpdates = Ti(null)),
      (this.identifierPrefix = a),
      (this.onUncaughtError = n),
      (this.onCaughtError = u),
      (this.onRecoverableError = i),
      (this.pooledCache = null),
      (this.pooledCacheLanes = 0),
      (this.formState = m),
      (this.incompleteTransitions = new Map()));
  }
  function Xd(t, e, l, a, n, u, i, o, m, T, N, j) {
    return (
      (t = new dy(t, e, l, i, m, T, N, j, o)),
      (e = 1),
      u === !0 && (e |= 24),
      (u = ve(3, null, null, e)),
      (t.current = u),
      (u.stateNode = t),
      (e = ic()),
      e.refCount++,
      (t.pooledCache = e),
      e.refCount++,
      (u.memoizedState = { element: a, isDehydrated: l, cache: e }),
      rc(u),
      t
    );
  }
  function Zd(t) {
    return t ? ((t = da), t) : da;
  }
  function Vd(t, e, l, a, n, u) {
    ((n = Zd(n)),
      a.context === null ? (a.context = n) : (a.pendingContext = n),
      (a = hl(e)),
      (a.payload = { element: l }),
      (u = u === void 0 ? null : u),
      u !== null && (a.callback = u),
      (l = yl(t, a, e)),
      l !== null && (ce(l, t, e), cn(l, t, e)));
  }
  function Kd(t, e) {
    if (((t = t.memoizedState), t !== null && t.dehydrated !== null)) {
      var l = t.retryLane;
      t.retryLane = l !== 0 && l < e ? l : e;
    }
  }
  function Nf(t, e) {
    (Kd(t, e), (t = t.alternate) && Kd(t, e));
  }
  function Jd(t) {
    if (t.tag === 13 || t.tag === 31) {
      var e = Bl(t, 67108864);
      (e !== null && ce(e, t, 67108864), Nf(t, 67108864));
    }
  }
  function kd(t) {
    if (t.tag === 13 || t.tag === 31) {
      var e = Ee();
      e = Ai(e);
      var l = Bl(t, e);
      (l !== null && ce(l, t, e), Nf(t, e));
    }
  }
  var Pu = !0;
  function my(t, e, l, a) {
    var n = R.T;
    R.T = null;
    var u = Y.p;
    try {
      ((Y.p = 2), Df(t, e, l, a));
    } finally {
      ((Y.p = u), (R.T = n));
    }
  }
  function hy(t, e, l, a) {
    var n = R.T;
    R.T = null;
    var u = Y.p;
    try {
      ((Y.p = 8), Df(t, e, l, a));
    } finally {
      ((Y.p = u), (R.T = n));
    }
  }
  function Df(t, e, l, a) {
    if (Pu) {
      var n = Uf(a);
      if (n === null) (vf(t, e, a, ti, l), Wd(t, a));
      else if (vy(n, t, e, l, a)) a.stopPropagation();
      else if ((Wd(t, a), e & 4 && -1 < yy.indexOf(t))) {
        for (; n !== null; ) {
          var u = ea(n);
          if (u !== null)
            switch (u.tag) {
              case 3:
                if (((u = u.stateNode), u.current.memoizedState.isDehydrated)) {
                  var i = Ml(u.pendingLanes);
                  if (i !== 0) {
                    var o = u;
                    for (o.pendingLanes |= 2, o.entangledLanes |= 2; i; ) {
                      var m = 1 << (31 - he(i));
                      ((o.entanglements[1] |= m), (i &= ~m));
                    }
                    (Ge(u), (dt & 6) === 0 && ((qu = de() + 500), An(0)));
                  }
                }
                break;
              case 31:
              case 13:
                ((o = Bl(u, 2)), o !== null && ce(o, u, 2), Yu(), Nf(u, 2));
            }
          if (((u = Uf(a)), u === null && vf(t, e, a, ti, l), u === n)) break;
          n = u;
        }
        n !== null && a.stopPropagation();
      } else vf(t, e, a, null, l);
    }
  }
  function Uf(t) {
    return ((t = Mi(t)), Mf(t));
  }
  var ti = null;
  function Mf(t) {
    if (((ti = null), (t = ta(t)), t !== null)) {
      var e = h(t);
      if (e === null) t = null;
      else {
        var l = e.tag;
        if (l === 13) {
          if (((t = g(e)), t !== null)) return t;
          t = null;
        } else if (l === 31) {
          if (((t = z(e)), t !== null)) return t;
          t = null;
        } else if (l === 3) {
          if (e.stateNode.current.memoizedState.isDehydrated)
            return e.tag === 3 ? e.stateNode.containerInfo : null;
          t = null;
        } else e !== t && (t = null);
      }
    }
    return ((ti = t), null);
  }
  function Fd(t) {
    switch (t) {
      case "beforetoggle":
      case "cancel":
      case "click":
      case "close":
      case "contextmenu":
      case "copy":
      case "cut":
      case "auxclick":
      case "dblclick":
      case "dragend":
      case "dragstart":
      case "drop":
      case "focusin":
      case "focusout":
      case "input":
      case "invalid":
      case "keydown":
      case "keypress":
      case "keyup":
      case "mousedown":
      case "mouseup":
      case "paste":
      case "pause":
      case "play":
      case "pointercancel":
      case "pointerdown":
      case "pointerup":
      case "ratechange":
      case "reset":
      case "resize":
      case "seeked":
      case "submit":
      case "toggle":
      case "touchcancel":
      case "touchend":
      case "touchstart":
      case "volumechange":
      case "change":
      case "selectionchange":
      case "textInput":
      case "compositionstart":
      case "compositionend":
      case "compositionupdate":
      case "beforeblur":
      case "afterblur":
      case "beforeinput":
      case "blur":
      case "fullscreenchange":
      case "focus":
      case "hashchange":
      case "popstate":
      case "select":
      case "selectstart":
        return 2;
      case "drag":
      case "dragenter":
      case "dragexit":
      case "dragleave":
      case "dragover":
      case "mousemove":
      case "mouseout":
      case "mouseover":
      case "pointermove":
      case "pointerout":
      case "pointerover":
      case "scroll":
      case "touchmove":
      case "wheel":
      case "mouseenter":
      case "mouseleave":
      case "pointerenter":
      case "pointerleave":
        return 8;
      case "message":
        switch (th()) {
          case ls:
            return 2;
          case as:
            return 8;
          case Xn:
          case eh:
            return 32;
          case ns:
            return 268435456;
          default:
            return 32;
        }
      default:
        return 32;
    }
  }
  var jf = !1,
    _l = null,
    xl = null,
    Rl = null,
    Dn = new Map(),
    Un = new Map(),
    Nl = [],
    yy =
      "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(
        " ",
      );
  function Wd(t, e) {
    switch (t) {
      case "focusin":
      case "focusout":
        _l = null;
        break;
      case "dragenter":
      case "dragleave":
        xl = null;
        break;
      case "mouseover":
      case "mouseout":
        Rl = null;
        break;
      case "pointerover":
      case "pointerout":
        Dn.delete(e.pointerId);
        break;
      case "gotpointercapture":
      case "lostpointercapture":
        Un.delete(e.pointerId);
    }
  }
  function Mn(t, e, l, a, n, u) {
    return t === null || t.nativeEvent !== u
      ? ((t = {
          blockedOn: e,
          domEventName: l,
          eventSystemFlags: a,
          nativeEvent: u,
          targetContainers: [n],
        }),
        e !== null && ((e = ea(e)), e !== null && Jd(e)),
        t)
      : ((t.eventSystemFlags |= a),
        (e = t.targetContainers),
        n !== null && e.indexOf(n) === -1 && e.push(n),
        t);
  }
  function vy(t, e, l, a, n) {
    switch (e) {
      case "focusin":
        return ((_l = Mn(_l, t, e, l, a, n)), !0);
      case "dragenter":
        return ((xl = Mn(xl, t, e, l, a, n)), !0);
      case "mouseover":
        return ((Rl = Mn(Rl, t, e, l, a, n)), !0);
      case "pointerover":
        var u = n.pointerId;
        return (Dn.set(u, Mn(Dn.get(u) || null, t, e, l, a, n)), !0);
      case "gotpointercapture":
        return (
          (u = n.pointerId),
          Un.set(u, Mn(Un.get(u) || null, t, e, l, a, n)),
          !0
        );
    }
    return !1;
  }
  function $d(t) {
    var e = ta(t.target);
    if (e !== null) {
      var l = h(e);
      if (l !== null) {
        if (((e = l.tag), e === 13)) {
          if (((e = g(l)), e !== null)) {
            ((t.blockedOn = e),
              rs(t.priority, function () {
                kd(l);
              }));
            return;
          }
        } else if (e === 31) {
          if (((e = z(l)), e !== null)) {
            ((t.blockedOn = e),
              rs(t.priority, function () {
                kd(l);
              }));
            return;
          }
        } else if (e === 3 && l.stateNode.current.memoizedState.isDehydrated) {
          t.blockedOn = l.tag === 3 ? l.stateNode.containerInfo : null;
          return;
        }
      }
    }
    t.blockedOn = null;
  }
  function ei(t) {
    if (t.blockedOn !== null) return !1;
    for (var e = t.targetContainers; 0 < e.length; ) {
      var l = Uf(t.nativeEvent);
      if (l === null) {
        l = t.nativeEvent;
        var a = new l.constructor(l.type, l);
        ((Ui = a), l.target.dispatchEvent(a), (Ui = null));
      } else return ((e = ea(l)), e !== null && Jd(e), (t.blockedOn = l), !1);
      e.shift();
    }
    return !0;
  }
  function Id(t, e, l) {
    ei(t) && l.delete(e);
  }
  function gy() {
    ((jf = !1),
      _l !== null && ei(_l) && (_l = null),
      xl !== null && ei(xl) && (xl = null),
      Rl !== null && ei(Rl) && (Rl = null),
      Dn.forEach(Id),
      Un.forEach(Id));
  }
  function li(t, e) {
    t.blockedOn === e &&
      ((t.blockedOn = null),
      jf ||
        ((jf = !0),
        c.unstable_scheduleCallback(c.unstable_NormalPriority, gy)));
  }
  var ai = null;
  function Pd(t) {
    ai !== t &&
      ((ai = t),
      c.unstable_scheduleCallback(c.unstable_NormalPriority, function () {
        ai === t && (ai = null);
        for (var e = 0; e < t.length; e += 3) {
          var l = t[e],
            a = t[e + 1],
            n = t[e + 2];
          if (typeof a != "function") {
            if (Mf(a || l) === null) continue;
            break;
          }
          var u = ea(l);
          u !== null &&
            (t.splice(e, 3),
            (e -= 3),
            Dc(u, { pending: !0, data: n, method: l.method, action: a }, a, n));
        }
      }));
  }
  function qa(t) {
    function e(m) {
      return li(m, t);
    }
    (_l !== null && li(_l, t),
      xl !== null && li(xl, t),
      Rl !== null && li(Rl, t),
      Dn.forEach(e),
      Un.forEach(e));
    for (var l = 0; l < Nl.length; l++) {
      var a = Nl[l];
      a.blockedOn === t && (a.blockedOn = null);
    }
    for (; 0 < Nl.length && ((l = Nl[0]), l.blockedOn === null); )
      ($d(l), l.blockedOn === null && Nl.shift());
    if (((l = (t.ownerDocument || t).$$reactFormReplay), l != null))
      for (a = 0; a < l.length; a += 3) {
        var n = l[a],
          u = l[a + 1],
          i = n[ee] || null;
        if (typeof u == "function") i || Pd(l);
        else if (i) {
          var o = null;
          if (u && u.hasAttribute("formAction")) {
            if (((n = u), (i = u[ee] || null))) o = i.formAction;
            else if (Mf(n) !== null) continue;
          } else o = i.action;
          (typeof o == "function" ? (l[a + 1] = o) : (l.splice(a, 3), (a -= 3)),
            Pd(l));
        }
      }
  }
  function tm() {
    function t(u) {
      u.canIntercept &&
        u.info === "react-transition" &&
        u.intercept({
          handler: function () {
            return new Promise(function (i) {
              return (n = i);
            });
          },
          focusReset: "manual",
          scroll: "manual",
        });
    }
    function e() {
      (n !== null && (n(), (n = null)), a || setTimeout(l, 20));
    }
    function l() {
      if (!a && !navigation.transition) {
        var u = navigation.currentEntry;
        u &&
          u.url != null &&
          navigation.navigate(u.url, {
            state: u.getState(),
            info: "react-transition",
            history: "replace",
          });
      }
    }
    if (typeof navigation == "object") {
      var a = !1,
        n = null;
      return (
        navigation.addEventListener("navigate", t),
        navigation.addEventListener("navigatesuccess", e),
        navigation.addEventListener("navigateerror", e),
        setTimeout(l, 100),
        function () {
          ((a = !0),
            navigation.removeEventListener("navigate", t),
            navigation.removeEventListener("navigatesuccess", e),
            navigation.removeEventListener("navigateerror", e),
            n !== null && (n(), (n = null)));
        }
      );
    }
  }
  function Cf(t) {
    this._internalRoot = t;
  }
  ((ni.prototype.render = Cf.prototype.render =
    function (t) {
      var e = this._internalRoot;
      if (e === null) throw Error(s(409));
      var l = e.current,
        a = Ee();
      Vd(l, a, t, e, null, null);
    }),
    (ni.prototype.unmount = Cf.prototype.unmount =
      function () {
        var t = this._internalRoot;
        if (t !== null) {
          this._internalRoot = null;
          var e = t.containerInfo;
          (Vd(t.current, 2, null, t, null, null), Yu(), (e[Pl] = null));
        }
      }));
  function ni(t) {
    this._internalRoot = t;
  }
  ni.prototype.unstable_scheduleHydration = function (t) {
    if (t) {
      var e = ss();
      t = { blockedOn: null, target: t, priority: e };
      for (var l = 0; l < Nl.length && e !== 0 && e < Nl[l].priority; l++);
      (Nl.splice(l, 0, t), l === 0 && $d(t));
    }
  };
  var em = f.version;
  if (em !== "19.2.4") throw Error(s(527, em, "19.2.4"));
  Y.findDOMNode = function (t) {
    var e = t._reactInternals;
    if (e === void 0)
      throw typeof t.render == "function"
        ? Error(s(188))
        : ((t = Object.keys(t).join(",")), Error(s(268, t)));
    return (
      (t = b(e)),
      (t = t !== null ? S(t) : null),
      (t = t === null ? null : t.stateNode),
      t
    );
  };
  var by = {
    bundleType: 0,
    version: "19.2.4",
    rendererPackageName: "react-dom",
    currentDispatcherRef: R,
    reconcilerVersion: "19.2.4",
  };
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
    var ui = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!ui.isDisabled && ui.supportsFiber)
      try {
        ((wa = ui.inject(by)), (me = ui));
      } catch {}
  }
  return (
    (Cn.createRoot = function (t, e) {
      if (!d(t)) throw Error(s(299));
      var l = !1,
        a = "",
        n = co,
        u = fo,
        i = so;
      return (
        e != null &&
          (e.unstable_strictMode === !0 && (l = !0),
          e.identifierPrefix !== void 0 && (a = e.identifierPrefix),
          e.onUncaughtError !== void 0 && (n = e.onUncaughtError),
          e.onCaughtError !== void 0 && (u = e.onCaughtError),
          e.onRecoverableError !== void 0 && (i = e.onRecoverableError)),
        (e = Xd(t, 1, !1, null, null, l, a, null, n, u, i, tm)),
        (t[Pl] = e.current),
        yf(t),
        new Cf(e)
      );
    }),
    (Cn.hydrateRoot = function (t, e, l) {
      if (!d(t)) throw Error(s(299));
      var a = !1,
        n = "",
        u = co,
        i = fo,
        o = so,
        m = null;
      return (
        l != null &&
          (l.unstable_strictMode === !0 && (a = !0),
          l.identifierPrefix !== void 0 && (n = l.identifierPrefix),
          l.onUncaughtError !== void 0 && (u = l.onUncaughtError),
          l.onCaughtError !== void 0 && (i = l.onCaughtError),
          l.onRecoverableError !== void 0 && (o = l.onRecoverableError),
          l.formState !== void 0 && (m = l.formState)),
        (e = Xd(t, 1, !0, e, l ?? null, a, n, m, u, i, o, tm)),
        (e.context = Zd(null)),
        (l = e.current),
        (a = Ee()),
        (a = Ai(a)),
        (n = hl(a)),
        (n.callback = null),
        yl(l, n, a),
        (l = a),
        (e.current.lanes = l),
        Qa(e, l),
        Ge(e),
        (t[Pl] = e.current),
        yf(t),
        new ni(e)
      );
    }),
    (Cn.version = "19.2.4"),
    Cn
  );
}
var om;
function Ny() {
  if (om) return Bf.exports;
  om = 1;
  function c() {
    if (
      !(
        typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" ||
        typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"
      )
    )
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(c);
      } catch (f) {
        console.error(f);
      }
  }
  return (c(), (Bf.exports = Ry()), Bf.exports);
}
var Dy = Ny();
const Uy = Rm(Dy);
function Nm(c, f) {
  return function () {
    return c.apply(f, arguments);
  };
}
const { toString: My } = Object.prototype,
  { getPrototypeOf: Ff } = Object,
  { iterator: oi, toStringTag: Dm } = Symbol,
  di = ((c) => (f) => {
    const r = My.call(f);
    return c[r] || (c[r] = r.slice(8, -1).toLowerCase());
  })(Object.create(null)),
  Be = (c) => ((c = c.toLowerCase()), (f) => di(f) === c),
  mi = (c) => (f) => typeof f === c,
  { isArray: Ya } = Array,
  Ba = mi("undefined");
function Bn(c) {
  return (
    c !== null &&
    !Ba(c) &&
    c.constructor !== null &&
    !Ba(c.constructor) &&
    fe(c.constructor.isBuffer) &&
    c.constructor.isBuffer(c)
  );
}
const Um = Be("ArrayBuffer");
function jy(c) {
  let f;
  return (
    typeof ArrayBuffer < "u" && ArrayBuffer.isView
      ? (f = ArrayBuffer.isView(c))
      : (f = c && c.buffer && Um(c.buffer)),
    f
  );
}
const Cy = mi("string"),
  fe = mi("function"),
  Mm = mi("number"),
  Yn = (c) => c !== null && typeof c == "object",
  Hy = (c) => c === !0 || c === !1,
  ci = (c) => {
    if (di(c) !== "object") return !1;
    const f = Ff(c);
    return (
      (f === null ||
        f === Object.prototype ||
        Object.getPrototypeOf(f) === null) &&
      !(Dm in c) &&
      !(oi in c)
    );
  },
  qy = (c) => {
    if (!Yn(c) || Bn(c)) return !1;
    try {
      return (
        Object.keys(c).length === 0 &&
        Object.getPrototypeOf(c) === Object.prototype
      );
    } catch {
      return !1;
    }
  },
  By = Be("Date"),
  Yy = Be("File"),
  Ly = Be("Blob"),
  wy = Be("FileList"),
  Gy = (c) => Yn(c) && fe(c.pipe),
  Qy = (c) => {
    let f;
    return (
      c &&
      ((typeof FormData == "function" && c instanceof FormData) ||
        (fe(c.append) &&
          ((f = di(c)) === "formdata" ||
            (f === "object" &&
              fe(c.toString) &&
              c.toString() === "[object FormData]"))))
    );
  },
  Xy = Be("URLSearchParams"),
  [Zy, Vy, Ky, Jy] = ["ReadableStream", "Request", "Response", "Headers"].map(
    Be,
  ),
  ky = (c) =>
    c.trim ? c.trim() : c.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
function Ln(c, f, { allOwnKeys: r = !1 } = {}) {
  if (c === null || typeof c > "u") return;
  let s, d;
  if ((typeof c != "object" && (c = [c]), Ya(c)))
    for (s = 0, d = c.length; s < d; s++) f.call(null, c[s], s, c);
  else {
    if (Bn(c)) return;
    const h = r ? Object.getOwnPropertyNames(c) : Object.keys(c),
      g = h.length;
    let z;
    for (s = 0; s < g; s++) ((z = h[s]), f.call(null, c[z], z, c));
  }
}
function jm(c, f) {
  if (Bn(c)) return null;
  f = f.toLowerCase();
  const r = Object.keys(c);
  let s = r.length,
    d;
  for (; s-- > 0; ) if (((d = r[s]), f === d.toLowerCase())) return d;
  return null;
}
const Wl =
    typeof globalThis < "u"
      ? globalThis
      : typeof self < "u"
        ? self
        : typeof window < "u"
          ? window
          : global,
  Cm = (c) => !Ba(c) && c !== Wl;
function Zf() {
  const { caseless: c, skipUndefined: f } = (Cm(this) && this) || {},
    r = {},
    s = (d, h) => {
      if (h === "__proto__" || h === "constructor" || h === "prototype") return;
      const g = (c && jm(r, h)) || h;
      ci(r[g]) && ci(d)
        ? (r[g] = Zf(r[g], d))
        : ci(d)
          ? (r[g] = Zf({}, d))
          : Ya(d)
            ? (r[g] = d.slice())
            : (!f || !Ba(d)) && (r[g] = d);
    };
  for (let d = 0, h = arguments.length; d < h; d++)
    arguments[d] && Ln(arguments[d], s);
  return r;
}
const Fy = (c, f, r, { allOwnKeys: s } = {}) => (
    Ln(
      f,
      (d, h) => {
        r && fe(d)
          ? Object.defineProperty(c, h, {
              value: Nm(d, r),
              writable: !0,
              enumerable: !0,
              configurable: !0,
            })
          : Object.defineProperty(c, h, {
              value: d,
              writable: !0,
              enumerable: !0,
              configurable: !0,
            });
      },
      { allOwnKeys: s },
    ),
    c
  ),
  Wy = (c) => (c.charCodeAt(0) === 65279 && (c = c.slice(1)), c),
  $y = (c, f, r, s) => {
    ((c.prototype = Object.create(f.prototype, s)),
      Object.defineProperty(c.prototype, "constructor", {
        value: c,
        writable: !0,
        enumerable: !1,
        configurable: !0,
      }),
      Object.defineProperty(c, "super", { value: f.prototype }),
      r && Object.assign(c.prototype, r));
  },
  Iy = (c, f, r, s) => {
    let d, h, g;
    const z = {};
    if (((f = f || {}), c == null)) return f;
    do {
      for (d = Object.getOwnPropertyNames(c), h = d.length; h-- > 0; )
        ((g = d[h]),
          (!s || s(g, c, f)) && !z[g] && ((f[g] = c[g]), (z[g] = !0)));
      c = r !== !1 && Ff(c);
    } while (c && (!r || r(c, f)) && c !== Object.prototype);
    return f;
  },
  Py = (c, f, r) => {
    ((c = String(c)),
      (r === void 0 || r > c.length) && (r = c.length),
      (r -= f.length));
    const s = c.indexOf(f, r);
    return s !== -1 && s === r;
  },
  tv = (c) => {
    if (!c) return null;
    if (Ya(c)) return c;
    let f = c.length;
    if (!Mm(f)) return null;
    const r = new Array(f);
    for (; f-- > 0; ) r[f] = c[f];
    return r;
  },
  ev = (
    (c) => (f) =>
      c && f instanceof c
  )(typeof Uint8Array < "u" && Ff(Uint8Array)),
  lv = (c, f) => {
    const s = (c && c[oi]).call(c);
    let d;
    for (; (d = s.next()) && !d.done; ) {
      const h = d.value;
      f.call(c, h[0], h[1]);
    }
  },
  av = (c, f) => {
    let r;
    const s = [];
    for (; (r = c.exec(f)) !== null; ) s.push(r);
    return s;
  },
  nv = Be("HTMLFormElement"),
  uv = (c) =>
    c.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g, function (r, s, d) {
      return s.toUpperCase() + d;
    }),
  dm = (
    ({ hasOwnProperty: c }) =>
    (f, r) =>
      c.call(f, r)
  )(Object.prototype),
  iv = Be("RegExp"),
  Hm = (c, f) => {
    const r = Object.getOwnPropertyDescriptors(c),
      s = {};
    (Ln(r, (d, h) => {
      let g;
      (g = f(d, h, c)) !== !1 && (s[h] = g || d);
    }),
      Object.defineProperties(c, s));
  },
  cv = (c) => {
    Hm(c, (f, r) => {
      if (fe(c) && ["arguments", "caller", "callee"].indexOf(r) !== -1)
        return !1;
      const s = c[r];
      if (fe(s)) {
        if (((f.enumerable = !1), "writable" in f)) {
          f.writable = !1;
          return;
        }
        f.set ||
          (f.set = () => {
            throw Error("Can not rewrite read-only method '" + r + "'");
          });
      }
    });
  },
  fv = (c, f) => {
    const r = {},
      s = (d) => {
        d.forEach((h) => {
          r[h] = !0;
        });
      };
    return (Ya(c) ? s(c) : s(String(c).split(f)), r);
  },
  sv = () => {},
  rv = (c, f) => (c != null && Number.isFinite((c = +c)) ? c : f);
function ov(c) {
  return !!(c && fe(c.append) && c[Dm] === "FormData" && c[oi]);
}
const dv = (c) => {
    const f = new Array(10),
      r = (s, d) => {
        if (Yn(s)) {
          if (f.indexOf(s) >= 0) return;
          if (Bn(s)) return s;
          if (!("toJSON" in s)) {
            f[d] = s;
            const h = Ya(s) ? [] : {};
            return (
              Ln(s, (g, z) => {
                const D = r(g, d + 1);
                !Ba(D) && (h[z] = D);
              }),
              (f[d] = void 0),
              h
            );
          }
        }
        return s;
      };
    return r(c, 0);
  },
  mv = Be("AsyncFunction"),
  hv = (c) => c && (Yn(c) || fe(c)) && fe(c.then) && fe(c.catch),
  qm = ((c, f) =>
    c
      ? setImmediate
      : f
        ? ((r, s) => (
            Wl.addEventListener(
              "message",
              ({ source: d, data: h }) => {
                d === Wl && h === r && s.length && s.shift()();
              },
              !1,
            ),
            (d) => {
              (s.push(d), Wl.postMessage(r, "*"));
            }
          ))(`axios@${Math.random()}`, [])
        : (r) => setTimeout(r))(
    typeof setImmediate == "function",
    fe(Wl.postMessage),
  ),
  yv =
    typeof queueMicrotask < "u"
      ? queueMicrotask.bind(Wl)
      : (typeof process < "u" && process.nextTick) || qm,
  vv = (c) => c != null && fe(c[oi]),
  O = {
    isArray: Ya,
    isArrayBuffer: Um,
    isBuffer: Bn,
    isFormData: Qy,
    isArrayBufferView: jy,
    isString: Cy,
    isNumber: Mm,
    isBoolean: Hy,
    isObject: Yn,
    isPlainObject: ci,
    isEmptyObject: qy,
    isReadableStream: Zy,
    isRequest: Vy,
    isResponse: Ky,
    isHeaders: Jy,
    isUndefined: Ba,
    isDate: By,
    isFile: Yy,
    isBlob: Ly,
    isRegExp: iv,
    isFunction: fe,
    isStream: Gy,
    isURLSearchParams: Xy,
    isTypedArray: ev,
    isFileList: wy,
    forEach: Ln,
    merge: Zf,
    extend: Fy,
    trim: ky,
    stripBOM: Wy,
    inherits: $y,
    toFlatObject: Iy,
    kindOf: di,
    kindOfTest: Be,
    endsWith: Py,
    toArray: tv,
    forEachEntry: lv,
    matchAll: av,
    isHTMLForm: nv,
    hasOwnProperty: dm,
    hasOwnProp: dm,
    reduceDescriptors: Hm,
    freezeMethods: cv,
    toObjectSet: fv,
    toCamelCase: uv,
    noop: sv,
    toFiniteNumber: rv,
    findKey: jm,
    global: Wl,
    isContextDefined: Cm,
    isSpecCompliantForm: ov,
    toJSONObject: dv,
    isAsyncFn: mv,
    isThenable: hv,
    setImmediate: qm,
    asap: yv,
    isIterable: vv,
  };
let F = class Bm extends Error {
  static from(f, r, s, d, h, g) {
    const z = new Bm(f.message, r || f.code, s, d, h);
    return ((z.cause = f), (z.name = f.name), g && Object.assign(z, g), z);
  }
  constructor(f, r, s, d, h) {
    (super(f),
      (this.name = "AxiosError"),
      (this.isAxiosError = !0),
      r && (this.code = r),
      s && (this.config = s),
      d && (this.request = d),
      h && ((this.response = h), (this.status = h.status)));
  }
  toJSON() {
    return {
      message: this.message,
      name: this.name,
      description: this.description,
      number: this.number,
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      config: O.toJSONObject(this.config),
      code: this.code,
      status: this.status,
    };
  }
};
F.ERR_BAD_OPTION_VALUE = "ERR_BAD_OPTION_VALUE";
F.ERR_BAD_OPTION = "ERR_BAD_OPTION";
F.ECONNABORTED = "ECONNABORTED";
F.ETIMEDOUT = "ETIMEDOUT";
F.ERR_NETWORK = "ERR_NETWORK";
F.ERR_FR_TOO_MANY_REDIRECTS = "ERR_FR_TOO_MANY_REDIRECTS";
F.ERR_DEPRECATED = "ERR_DEPRECATED";
F.ERR_BAD_RESPONSE = "ERR_BAD_RESPONSE";
F.ERR_BAD_REQUEST = "ERR_BAD_REQUEST";
F.ERR_CANCELED = "ERR_CANCELED";
F.ERR_NOT_SUPPORT = "ERR_NOT_SUPPORT";
F.ERR_INVALID_URL = "ERR_INVALID_URL";
const gv = null;
function Vf(c) {
  return O.isPlainObject(c) || O.isArray(c);
}
function Ym(c) {
  return O.endsWith(c, "[]") ? c.slice(0, -2) : c;
}
function mm(c, f, r) {
  return c
    ? c
        .concat(f)
        .map(function (d, h) {
          return ((d = Ym(d)), !r && h ? "[" + d + "]" : d);
        })
        .join(r ? "." : "")
    : f;
}
function bv(c) {
  return O.isArray(c) && !c.some(Vf);
}
const pv = O.toFlatObject(O, {}, null, function (f) {
  return /^is[A-Z]/.test(f);
});
function hi(c, f, r) {
  if (!O.isObject(c)) throw new TypeError("target must be an object");
  ((f = f || new FormData()),
    (r = O.toFlatObject(
      r,
      { metaTokens: !0, dots: !1, indexes: !1 },
      !1,
      function (w, B) {
        return !O.isUndefined(B[w]);
      },
    )));
  const s = r.metaTokens,
    d = r.visitor || S,
    h = r.dots,
    g = r.indexes,
    D = (r.Blob || (typeof Blob < "u" && Blob)) && O.isSpecCompliantForm(f);
  if (!O.isFunction(d)) throw new TypeError("visitor must be a function");
  function b(H) {
    if (H === null) return "";
    if (O.isDate(H)) return H.toISOString();
    if (O.isBoolean(H)) return H.toString();
    if (!D && O.isBlob(H))
      throw new F("Blob is not supported. Use a Buffer instead.");
    return O.isArrayBuffer(H) || O.isTypedArray(H)
      ? D && typeof Blob == "function"
        ? new Blob([H])
        : Buffer.from(H)
      : H;
  }
  function S(H, w, B) {
    let tt = H;
    if (H && !B && typeof H == "object") {
      if (O.endsWith(w, "{}"))
        ((w = s ? w : w.slice(0, -2)), (H = JSON.stringify(H)));
      else if (
        (O.isArray(H) && bv(H)) ||
        ((O.isFileList(H) || O.endsWith(w, "[]")) && (tt = O.toArray(H)))
      )
        return (
          (w = Ym(w)),
          tt.forEach(function (et, ht) {
            !(O.isUndefined(et) || et === null) &&
              f.append(
                g === !0 ? mm([w], ht, h) : g === null ? w : w + "[]",
                b(et),
              );
          }),
          !1
        );
    }
    return Vf(H) ? !0 : (f.append(mm(B, w, h), b(H)), !1);
  }
  const C = [],
    V = Object.assign(pv, {
      defaultVisitor: S,
      convertValue: b,
      isVisitable: Vf,
    });
  function ft(H, w) {
    if (!O.isUndefined(H)) {
      if (C.indexOf(H) !== -1)
        throw Error("Circular reference detected in " + w.join("."));
      (C.push(H),
        O.forEach(H, function (tt, xt) {
          (!(O.isUndefined(tt) || tt === null) &&
            d.call(f, tt, O.isString(xt) ? xt.trim() : xt, w, V)) === !0 &&
            ft(tt, w ? w.concat(xt) : [xt]);
        }),
        C.pop());
    }
  }
  if (!O.isObject(c)) throw new TypeError("data must be an object");
  return (ft(c), f);
}
function hm(c) {
  const f = {
    "!": "%21",
    "'": "%27",
    "(": "%28",
    ")": "%29",
    "~": "%7E",
    "%20": "+",
    "%00": "\0",
  };
  return encodeURIComponent(c).replace(/[!'()~]|%20|%00/g, function (s) {
    return f[s];
  });
}
function Wf(c, f) {
  ((this._pairs = []), c && hi(c, this, f));
}
const Lm = Wf.prototype;
Lm.append = function (f, r) {
  this._pairs.push([f, r]);
};
Lm.toString = function (f) {
  const r = f
    ? function (s) {
        return f.call(this, s, hm);
      }
    : hm;
  return this._pairs
    .map(function (d) {
      return r(d[0]) + "=" + r(d[1]);
    }, "")
    .join("&");
};
function Sv(c) {
  return encodeURIComponent(c)
    .replace(/%3A/gi, ":")
    .replace(/%24/g, "$")
    .replace(/%2C/gi, ",")
    .replace(/%20/g, "+");
}
function wm(c, f, r) {
  if (!f) return c;
  const s = (r && r.encode) || Sv,
    d = O.isFunction(r) ? { serialize: r } : r,
    h = d && d.serialize;
  let g;
  if (
    (h
      ? (g = h(f, d))
      : (g = O.isURLSearchParams(f) ? f.toString() : new Wf(f, d).toString(s)),
    g)
  ) {
    const z = c.indexOf("#");
    (z !== -1 && (c = c.slice(0, z)),
      (c += (c.indexOf("?") === -1 ? "?" : "&") + g));
  }
  return c;
}
class ym {
  constructor() {
    this.handlers = [];
  }
  use(f, r, s) {
    return (
      this.handlers.push({
        fulfilled: f,
        rejected: r,
        synchronous: s ? s.synchronous : !1,
        runWhen: s ? s.runWhen : null,
      }),
      this.handlers.length - 1
    );
  }
  eject(f) {
    this.handlers[f] && (this.handlers[f] = null);
  }
  clear() {
    this.handlers && (this.handlers = []);
  }
  forEach(f) {
    O.forEach(this.handlers, function (s) {
      s !== null && f(s);
    });
  }
}
const $f = {
    silentJSONParsing: !0,
    forcedJSONParsing: !0,
    clarifyTimeoutError: !1,
    legacyInterceptorReqResOrdering: !0,
  },
  Ev = typeof URLSearchParams < "u" ? URLSearchParams : Wf,
  Tv = typeof FormData < "u" ? FormData : null,
  Av = typeof Blob < "u" ? Blob : null,
  zv = {
    isBrowser: !0,
    classes: { URLSearchParams: Ev, FormData: Tv, Blob: Av },
    protocols: ["http", "https", "file", "blob", "url", "data"],
  },
  If = typeof window < "u" && typeof document < "u",
  Kf = (typeof navigator == "object" && navigator) || void 0,
  Ov =
    If &&
    (!Kf || ["ReactNative", "NativeScript", "NS"].indexOf(Kf.product) < 0),
  _v =
    typeof WorkerGlobalScope < "u" &&
    self instanceof WorkerGlobalScope &&
    typeof self.importScripts == "function",
  xv = (If && window.location.href) || "http://localhost",
  Rv = Object.freeze(
    Object.defineProperty(
      {
        __proto__: null,
        hasBrowserEnv: If,
        hasStandardBrowserEnv: Ov,
        hasStandardBrowserWebWorkerEnv: _v,
        navigator: Kf,
        origin: xv,
      },
      Symbol.toStringTag,
      { value: "Module" },
    ),
  ),
  $t = { ...Rv, ...zv };
function Nv(c, f) {
  return hi(c, new $t.classes.URLSearchParams(), {
    visitor: function (r, s, d, h) {
      return $t.isNode && O.isBuffer(r)
        ? (this.append(s, r.toString("base64")), !1)
        : h.defaultVisitor.apply(this, arguments);
    },
    ...f,
  });
}
function Dv(c) {
  return O.matchAll(/\w+|\[(\w*)]/g, c).map((f) =>
    f[0] === "[]" ? "" : f[1] || f[0],
  );
}
function Uv(c) {
  const f = {},
    r = Object.keys(c);
  let s;
  const d = r.length;
  let h;
  for (s = 0; s < d; s++) ((h = r[s]), (f[h] = c[h]));
  return f;
}
function Gm(c) {
  function f(r, s, d, h) {
    let g = r[h++];
    if (g === "__proto__") return !0;
    const z = Number.isFinite(+g),
      D = h >= r.length;
    return (
      (g = !g && O.isArray(d) ? d.length : g),
      D
        ? (O.hasOwnProp(d, g) ? (d[g] = [d[g], s]) : (d[g] = s), !z)
        : ((!d[g] || !O.isObject(d[g])) && (d[g] = []),
          f(r, s, d[g], h) && O.isArray(d[g]) && (d[g] = Uv(d[g])),
          !z)
    );
  }
  if (O.isFormData(c) && O.isFunction(c.entries)) {
    const r = {};
    return (
      O.forEachEntry(c, (s, d) => {
        f(Dv(s), d, r, 0);
      }),
      r
    );
  }
  return null;
}
function Mv(c, f, r) {
  if (O.isString(c))
    try {
      return ((f || JSON.parse)(c), O.trim(c));
    } catch (s) {
      if (s.name !== "SyntaxError") throw s;
    }
  return (r || JSON.stringify)(c);
}
const wn = {
  transitional: $f,
  adapter: ["xhr", "http", "fetch"],
  transformRequest: [
    function (f, r) {
      const s = r.getContentType() || "",
        d = s.indexOf("application/json") > -1,
        h = O.isObject(f);
      if ((h && O.isHTMLForm(f) && (f = new FormData(f)), O.isFormData(f)))
        return d ? JSON.stringify(Gm(f)) : f;
      if (
        O.isArrayBuffer(f) ||
        O.isBuffer(f) ||
        O.isStream(f) ||
        O.isFile(f) ||
        O.isBlob(f) ||
        O.isReadableStream(f)
      )
        return f;
      if (O.isArrayBufferView(f)) return f.buffer;
      if (O.isURLSearchParams(f))
        return (
          r.setContentType(
            "application/x-www-form-urlencoded;charset=utf-8",
            !1,
          ),
          f.toString()
        );
      let z;
      if (h) {
        if (s.indexOf("application/x-www-form-urlencoded") > -1)
          return Nv(f, this.formSerializer).toString();
        if ((z = O.isFileList(f)) || s.indexOf("multipart/form-data") > -1) {
          const D = this.env && this.env.FormData;
          return hi(
            z ? { "files[]": f } : f,
            D && new D(),
            this.formSerializer,
          );
        }
      }
      return h || d ? (r.setContentType("application/json", !1), Mv(f)) : f;
    },
  ],
  transformResponse: [
    function (f) {
      const r = this.transitional || wn.transitional,
        s = r && r.forcedJSONParsing,
        d = this.responseType === "json";
      if (O.isResponse(f) || O.isReadableStream(f)) return f;
      if (f && O.isString(f) && ((s && !this.responseType) || d)) {
        const g = !(r && r.silentJSONParsing) && d;
        try {
          return JSON.parse(f, this.parseReviver);
        } catch (z) {
          if (g)
            throw z.name === "SyntaxError"
              ? F.from(z, F.ERR_BAD_RESPONSE, this, null, this.response)
              : z;
        }
      }
      return f;
    },
  ],
  timeout: 0,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  maxContentLength: -1,
  maxBodyLength: -1,
  env: { FormData: $t.classes.FormData, Blob: $t.classes.Blob },
  validateStatus: function (f) {
    return f >= 200 && f < 300;
  },
  headers: {
    common: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": void 0,
    },
  },
};
O.forEach(["delete", "get", "head", "post", "put", "patch"], (c) => {
  wn.headers[c] = {};
});
const jv = O.toObjectSet([
    "age",
    "authorization",
    "content-length",
    "content-type",
    "etag",
    "expires",
    "from",
    "host",
    "if-modified-since",
    "if-unmodified-since",
    "last-modified",
    "location",
    "max-forwards",
    "proxy-authorization",
    "referer",
    "retry-after",
    "user-agent",
  ]),
  Cv = (c) => {
    const f = {};
    let r, s, d;
    return (
      c &&
        c
          .split(
            `
`,
          )
          .forEach(function (g) {
            ((d = g.indexOf(":")),
              (r = g.substring(0, d).trim().toLowerCase()),
              (s = g.substring(d + 1).trim()),
              !(!r || (f[r] && jv[r])) &&
                (r === "set-cookie"
                  ? f[r]
                    ? f[r].push(s)
                    : (f[r] = [s])
                  : (f[r] = f[r] ? f[r] + ", " + s : s)));
          }),
      f
    );
  },
  vm = Symbol("internals");
function Hn(c) {
  return c && String(c).trim().toLowerCase();
}
function fi(c) {
  return c === !1 || c == null ? c : O.isArray(c) ? c.map(fi) : String(c);
}
function Hv(c) {
  const f = Object.create(null),
    r = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
  let s;
  for (; (s = r.exec(c)); ) f[s[1]] = s[2];
  return f;
}
const qv = (c) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(c.trim());
function Gf(c, f, r, s, d) {
  if (O.isFunction(s)) return s.call(this, f, r);
  if ((d && (f = r), !!O.isString(f))) {
    if (O.isString(s)) return f.indexOf(s) !== -1;
    if (O.isRegExp(s)) return s.test(f);
  }
}
function Bv(c) {
  return c
    .trim()
    .toLowerCase()
    .replace(/([a-z\d])(\w*)/g, (f, r, s) => r.toUpperCase() + s);
}
function Yv(c, f) {
  const r = O.toCamelCase(" " + f);
  ["get", "set", "has"].forEach((s) => {
    Object.defineProperty(c, s + r, {
      value: function (d, h, g) {
        return this[s].call(this, f, d, h, g);
      },
      configurable: !0,
    });
  });
}
let se = class {
  constructor(f) {
    f && this.set(f);
  }
  set(f, r, s) {
    const d = this;
    function h(z, D, b) {
      const S = Hn(D);
      if (!S) throw new Error("header name must be a non-empty string");
      const C = O.findKey(d, S);
      (!C || d[C] === void 0 || b === !0 || (b === void 0 && d[C] !== !1)) &&
        (d[C || D] = fi(z));
    }
    const g = (z, D) => O.forEach(z, (b, S) => h(b, S, D));
    if (O.isPlainObject(f) || f instanceof this.constructor) g(f, r);
    else if (O.isString(f) && (f = f.trim()) && !qv(f)) g(Cv(f), r);
    else if (O.isObject(f) && O.isIterable(f)) {
      let z = {},
        D,
        b;
      for (const S of f) {
        if (!O.isArray(S))
          throw TypeError("Object iterator must return a key-value pair");
        z[(b = S[0])] = (D = z[b])
          ? O.isArray(D)
            ? [...D, S[1]]
            : [D, S[1]]
          : S[1];
      }
      g(z, r);
    } else f != null && h(r, f, s);
    return this;
  }
  get(f, r) {
    if (((f = Hn(f)), f)) {
      const s = O.findKey(this, f);
      if (s) {
        const d = this[s];
        if (!r) return d;
        if (r === !0) return Hv(d);
        if (O.isFunction(r)) return r.call(this, d, s);
        if (O.isRegExp(r)) return r.exec(d);
        throw new TypeError("parser must be boolean|regexp|function");
      }
    }
  }
  has(f, r) {
    if (((f = Hn(f)), f)) {
      const s = O.findKey(this, f);
      return !!(s && this[s] !== void 0 && (!r || Gf(this, this[s], s, r)));
    }
    return !1;
  }
  delete(f, r) {
    const s = this;
    let d = !1;
    function h(g) {
      if (((g = Hn(g)), g)) {
        const z = O.findKey(s, g);
        z && (!r || Gf(s, s[z], z, r)) && (delete s[z], (d = !0));
      }
    }
    return (O.isArray(f) ? f.forEach(h) : h(f), d);
  }
  clear(f) {
    const r = Object.keys(this);
    let s = r.length,
      d = !1;
    for (; s--; ) {
      const h = r[s];
      (!f || Gf(this, this[h], h, f, !0)) && (delete this[h], (d = !0));
    }
    return d;
  }
  normalize(f) {
    const r = this,
      s = {};
    return (
      O.forEach(this, (d, h) => {
        const g = O.findKey(s, h);
        if (g) {
          ((r[g] = fi(d)), delete r[h]);
          return;
        }
        const z = f ? Bv(h) : String(h).trim();
        (z !== h && delete r[h], (r[z] = fi(d)), (s[z] = !0));
      }),
      this
    );
  }
  concat(...f) {
    return this.constructor.concat(this, ...f);
  }
  toJSON(f) {
    const r = Object.create(null);
    return (
      O.forEach(this, (s, d) => {
        s != null && s !== !1 && (r[d] = f && O.isArray(s) ? s.join(", ") : s);
      }),
      r
    );
  }
  [Symbol.iterator]() {
    return Object.entries(this.toJSON())[Symbol.iterator]();
  }
  toString() {
    return Object.entries(this.toJSON()).map(([f, r]) => f + ": " + r).join(`
`);
  }
  getSetCookie() {
    return this.get("set-cookie") || [];
  }
  get [Symbol.toStringTag]() {
    return "AxiosHeaders";
  }
  static from(f) {
    return f instanceof this ? f : new this(f);
  }
  static concat(f, ...r) {
    const s = new this(f);
    return (r.forEach((d) => s.set(d)), s);
  }
  static accessor(f) {
    const s = (this[vm] = this[vm] = { accessors: {} }).accessors,
      d = this.prototype;
    function h(g) {
      const z = Hn(g);
      s[z] || (Yv(d, g), (s[z] = !0));
    }
    return (O.isArray(f) ? f.forEach(h) : h(f), this);
  }
};
se.accessor([
  "Content-Type",
  "Content-Length",
  "Accept",
  "Accept-Encoding",
  "User-Agent",
  "Authorization",
]);
O.reduceDescriptors(se.prototype, ({ value: c }, f) => {
  let r = f[0].toUpperCase() + f.slice(1);
  return {
    get: () => c,
    set(s) {
      this[r] = s;
    },
  };
});
O.freezeMethods(se);
function Qf(c, f) {
  const r = this || wn,
    s = f || r,
    d = se.from(s.headers);
  let h = s.data;
  return (
    O.forEach(c, function (z) {
      h = z.call(r, h, d.normalize(), f ? f.status : void 0);
    }),
    d.normalize(),
    h
  );
}
function Qm(c) {
  return !!(c && c.__CANCEL__);
}
let Gn = class extends F {
  constructor(f, r, s) {
    (super(f ?? "canceled", F.ERR_CANCELED, r, s),
      (this.name = "CanceledError"),
      (this.__CANCEL__ = !0));
  }
};
function Xm(c, f, r) {
  const s = r.config.validateStatus;
  !r.status || !s || s(r.status)
    ? c(r)
    : f(
        new F(
          "Request failed with status code " + r.status,
          [F.ERR_BAD_REQUEST, F.ERR_BAD_RESPONSE][
            Math.floor(r.status / 100) - 4
          ],
          r.config,
          r.request,
          r,
        ),
      );
}
function Lv(c) {
  const f = /^([-+\w]{1,25})(:?\/\/|:)/.exec(c);
  return (f && f[1]) || "";
}
function wv(c, f) {
  c = c || 10;
  const r = new Array(c),
    s = new Array(c);
  let d = 0,
    h = 0,
    g;
  return (
    (f = f !== void 0 ? f : 1e3),
    function (D) {
      const b = Date.now(),
        S = s[h];
      (g || (g = b), (r[d] = D), (s[d] = b));
      let C = h,
        V = 0;
      for (; C !== d; ) ((V += r[C++]), (C = C % c));
      if (((d = (d + 1) % c), d === h && (h = (h + 1) % c), b - g < f)) return;
      const ft = S && b - S;
      return ft ? Math.round((V * 1e3) / ft) : void 0;
    }
  );
}
function Gv(c, f) {
  let r = 0,
    s = 1e3 / f,
    d,
    h;
  const g = (b, S = Date.now()) => {
    ((r = S), (d = null), h && (clearTimeout(h), (h = null)), c(...b));
  };
  return [
    (...b) => {
      const S = Date.now(),
        C = S - r;
      C >= s
        ? g(b, S)
        : ((d = b),
          h ||
            (h = setTimeout(() => {
              ((h = null), g(d));
            }, s - C)));
    },
    () => d && g(d),
  ];
}
const ri = (c, f, r = 3) => {
    let s = 0;
    const d = wv(50, 250);
    return Gv((h) => {
      const g = h.loaded,
        z = h.lengthComputable ? h.total : void 0,
        D = g - s,
        b = d(D),
        S = g <= z;
      s = g;
      const C = {
        loaded: g,
        total: z,
        progress: z ? g / z : void 0,
        bytes: D,
        rate: b || void 0,
        estimated: b && z && S ? (z - g) / b : void 0,
        event: h,
        lengthComputable: z != null,
        [f ? "download" : "upload"]: !0,
      };
      c(C);
    }, r);
  },
  gm = (c, f) => {
    const r = c != null;
    return [(s) => f[0]({ lengthComputable: r, total: c, loaded: s }), f[1]];
  },
  bm =
    (c) =>
    (...f) =>
      O.asap(() => c(...f)),
  Qv = $t.hasStandardBrowserEnv
    ? ((c, f) => (r) => (
        (r = new URL(r, $t.origin)),
        c.protocol === r.protocol &&
          c.host === r.host &&
          (f || c.port === r.port)
      ))(
        new URL($t.origin),
        $t.navigator && /(msie|trident)/i.test($t.navigator.userAgent),
      )
    : () => !0,
  Xv = $t.hasStandardBrowserEnv
    ? {
        write(c, f, r, s, d, h, g) {
          if (typeof document > "u") return;
          const z = [`${c}=${encodeURIComponent(f)}`];
          (O.isNumber(r) && z.push(`expires=${new Date(r).toUTCString()}`),
            O.isString(s) && z.push(`path=${s}`),
            O.isString(d) && z.push(`domain=${d}`),
            h === !0 && z.push("secure"),
            O.isString(g) && z.push(`SameSite=${g}`),
            (document.cookie = z.join("; ")));
        },
        read(c) {
          if (typeof document > "u") return null;
          const f = document.cookie.match(
            new RegExp("(?:^|; )" + c + "=([^;]*)"),
          );
          return f ? decodeURIComponent(f[1]) : null;
        },
        remove(c) {
          this.write(c, "", Date.now() - 864e5, "/");
        },
      }
    : {
        write() {},
        read() {
          return null;
        },
        remove() {},
      };
function Zv(c) {
  return typeof c != "string" ? !1 : /^([a-z][a-z\d+\-.]*:)?\/\//i.test(c);
}
function Vv(c, f) {
  return f ? c.replace(/\/?\/$/, "") + "/" + f.replace(/^\/+/, "") : c;
}
function Zm(c, f, r) {
  let s = !Zv(f);
  return c && (s || r == !1) ? Vv(c, f) : f;
}
const pm = (c) => (c instanceof se ? { ...c } : c);
function Il(c, f) {
  f = f || {};
  const r = {};
  function s(b, S, C, V) {
    return O.isPlainObject(b) && O.isPlainObject(S)
      ? O.merge.call({ caseless: V }, b, S)
      : O.isPlainObject(S)
        ? O.merge({}, S)
        : O.isArray(S)
          ? S.slice()
          : S;
  }
  function d(b, S, C, V) {
    if (O.isUndefined(S)) {
      if (!O.isUndefined(b)) return s(void 0, b, C, V);
    } else return s(b, S, C, V);
  }
  function h(b, S) {
    if (!O.isUndefined(S)) return s(void 0, S);
  }
  function g(b, S) {
    if (O.isUndefined(S)) {
      if (!O.isUndefined(b)) return s(void 0, b);
    } else return s(void 0, S);
  }
  function z(b, S, C) {
    if (C in f) return s(b, S);
    if (C in c) return s(void 0, b);
  }
  const D = {
    url: h,
    method: h,
    data: h,
    baseURL: g,
    transformRequest: g,
    transformResponse: g,
    paramsSerializer: g,
    timeout: g,
    timeoutMessage: g,
    withCredentials: g,
    withXSRFToken: g,
    adapter: g,
    responseType: g,
    xsrfCookieName: g,
    xsrfHeaderName: g,
    onUploadProgress: g,
    onDownloadProgress: g,
    decompress: g,
    maxContentLength: g,
    maxBodyLength: g,
    beforeRedirect: g,
    transport: g,
    httpAgent: g,
    httpsAgent: g,
    cancelToken: g,
    socketPath: g,
    responseEncoding: g,
    validateStatus: z,
    headers: (b, S, C) => d(pm(b), pm(S), C, !0),
  };
  return (
    O.forEach(Object.keys({ ...c, ...f }), function (S) {
      if (S === "__proto__" || S === "constructor" || S === "prototype") return;
      const C = O.hasOwnProp(D, S) ? D[S] : d,
        V = C(c[S], f[S], S);
      (O.isUndefined(V) && C !== z) || (r[S] = V);
    }),
    r
  );
}
const Vm = (c) => {
    const f = Il({}, c);
    let {
      data: r,
      withXSRFToken: s,
      xsrfHeaderName: d,
      xsrfCookieName: h,
      headers: g,
      auth: z,
    } = f;
    if (
      ((f.headers = g = se.from(g)),
      (f.url = wm(
        Zm(f.baseURL, f.url, f.allowAbsoluteUrls),
        c.params,
        c.paramsSerializer,
      )),
      z &&
        g.set(
          "Authorization",
          "Basic " +
            btoa(
              (z.username || "") +
                ":" +
                (z.password ? unescape(encodeURIComponent(z.password)) : ""),
            ),
        ),
      O.isFormData(r))
    ) {
      if ($t.hasStandardBrowserEnv || $t.hasStandardBrowserWebWorkerEnv)
        g.setContentType(void 0);
      else if (O.isFunction(r.getHeaders)) {
        const D = r.getHeaders(),
          b = ["content-type", "content-length"];
        Object.entries(D).forEach(([S, C]) => {
          b.includes(S.toLowerCase()) && g.set(S, C);
        });
      }
    }
    if (
      $t.hasStandardBrowserEnv &&
      (s && O.isFunction(s) && (s = s(f)), s || (s !== !1 && Qv(f.url)))
    ) {
      const D = d && h && Xv.read(h);
      D && g.set(d, D);
    }
    return f;
  },
  Kv = typeof XMLHttpRequest < "u",
  Jv =
    Kv &&
    function (c) {
      return new Promise(function (r, s) {
        const d = Vm(c);
        let h = d.data;
        const g = se.from(d.headers).normalize();
        let { responseType: z, onUploadProgress: D, onDownloadProgress: b } = d,
          S,
          C,
          V,
          ft,
          H;
        function w() {
          (ft && ft(),
            H && H(),
            d.cancelToken && d.cancelToken.unsubscribe(S),
            d.signal && d.signal.removeEventListener("abort", S));
        }
        let B = new XMLHttpRequest();
        (B.open(d.method.toUpperCase(), d.url, !0), (B.timeout = d.timeout));
        function tt() {
          if (!B) return;
          const et = se.from(
              "getAllResponseHeaders" in B && B.getAllResponseHeaders(),
            ),
            Ot = {
              data:
                !z || z === "text" || z === "json"
                  ? B.responseText
                  : B.response,
              status: B.status,
              statusText: B.statusText,
              headers: et,
              config: c,
              request: B,
            };
          (Xm(
            function (G) {
              (r(G), w());
            },
            function (G) {
              (s(G), w());
            },
            Ot,
          ),
            (B = null));
        }
        ("onloadend" in B
          ? (B.onloadend = tt)
          : (B.onreadystatechange = function () {
              !B ||
                B.readyState !== 4 ||
                (B.status === 0 &&
                  !(B.responseURL && B.responseURL.indexOf("file:") === 0)) ||
                setTimeout(tt);
            }),
          (B.onabort = function () {
            B &&
              (s(new F("Request aborted", F.ECONNABORTED, c, B)), (B = null));
          }),
          (B.onerror = function (ht) {
            const Ot = ht && ht.message ? ht.message : "Network Error",
              q = new F(Ot, F.ERR_NETWORK, c, B);
            ((q.event = ht || null), s(q), (B = null));
          }),
          (B.ontimeout = function () {
            let ht = d.timeout
              ? "timeout of " + d.timeout + "ms exceeded"
              : "timeout exceeded";
            const Ot = d.transitional || $f;
            (d.timeoutErrorMessage && (ht = d.timeoutErrorMessage),
              s(
                new F(
                  ht,
                  Ot.clarifyTimeoutError ? F.ETIMEDOUT : F.ECONNABORTED,
                  c,
                  B,
                ),
              ),
              (B = null));
          }),
          h === void 0 && g.setContentType(null),
          "setRequestHeader" in B &&
            O.forEach(g.toJSON(), function (ht, Ot) {
              B.setRequestHeader(Ot, ht);
            }),
          O.isUndefined(d.withCredentials) ||
            (B.withCredentials = !!d.withCredentials),
          z && z !== "json" && (B.responseType = d.responseType),
          b && (([V, H] = ri(b, !0)), B.addEventListener("progress", V)),
          D &&
            B.upload &&
            (([C, ft] = ri(D)),
            B.upload.addEventListener("progress", C),
            B.upload.addEventListener("loadend", ft)),
          (d.cancelToken || d.signal) &&
            ((S = (et) => {
              B &&
                (s(!et || et.type ? new Gn(null, c, B) : et),
                B.abort(),
                (B = null));
            }),
            d.cancelToken && d.cancelToken.subscribe(S),
            d.signal &&
              (d.signal.aborted
                ? S()
                : d.signal.addEventListener("abort", S))));
        const xt = Lv(d.url);
        if (xt && $t.protocols.indexOf(xt) === -1) {
          s(new F("Unsupported protocol " + xt + ":", F.ERR_BAD_REQUEST, c));
          return;
        }
        B.send(h || null);
      });
    },
  kv = (c, f) => {
    const { length: r } = (c = c ? c.filter(Boolean) : []);
    if (f || r) {
      let s = new AbortController(),
        d;
      const h = function (b) {
        if (!d) {
          ((d = !0), z());
          const S = b instanceof Error ? b : this.reason;
          s.abort(
            S instanceof F ? S : new Gn(S instanceof Error ? S.message : S),
          );
        }
      };
      let g =
        f &&
        setTimeout(() => {
          ((g = null), h(new F(`timeout of ${f}ms exceeded`, F.ETIMEDOUT)));
        }, f);
      const z = () => {
        c &&
          (g && clearTimeout(g),
          (g = null),
          c.forEach((b) => {
            b.unsubscribe
              ? b.unsubscribe(h)
              : b.removeEventListener("abort", h);
          }),
          (c = null));
      };
      c.forEach((b) => b.addEventListener("abort", h));
      const { signal: D } = s;
      return ((D.unsubscribe = () => O.asap(z)), D);
    }
  },
  Fv = function* (c, f) {
    let r = c.byteLength;
    if (r < f) {
      yield c;
      return;
    }
    let s = 0,
      d;
    for (; s < r; ) ((d = s + f), yield c.slice(s, d), (s = d));
  },
  Wv = async function* (c, f) {
    for await (const r of $v(c)) yield* Fv(r, f);
  },
  $v = async function* (c) {
    if (c[Symbol.asyncIterator]) {
      yield* c;
      return;
    }
    const f = c.getReader();
    try {
      for (;;) {
        const { done: r, value: s } = await f.read();
        if (r) break;
        yield s;
      }
    } finally {
      await f.cancel();
    }
  },
  Sm = (c, f, r, s) => {
    const d = Wv(c, f);
    let h = 0,
      g,
      z = (D) => {
        g || ((g = !0), s && s(D));
      };
    return new ReadableStream(
      {
        async pull(D) {
          try {
            const { done: b, value: S } = await d.next();
            if (b) {
              (z(), D.close());
              return;
            }
            let C = S.byteLength;
            if (r) {
              let V = (h += C);
              r(V);
            }
            D.enqueue(new Uint8Array(S));
          } catch (b) {
            throw (z(b), b);
          }
        },
        cancel(D) {
          return (z(D), d.return());
        },
      },
      { highWaterMark: 2 },
    );
  },
  Em = 64 * 1024,
  { isFunction: ii } = O,
  Iv = (({ Request: c, Response: f }) => ({ Request: c, Response: f }))(
    O.global,
  ),
  { ReadableStream: Tm, TextEncoder: Am } = O.global,
  zm = (c, ...f) => {
    try {
      return !!c(...f);
    } catch {
      return !1;
    }
  },
  Pv = (c) => {
    c = O.merge.call({ skipUndefined: !0 }, Iv, c);
    const { fetch: f, Request: r, Response: s } = c,
      d = f ? ii(f) : typeof fetch == "function",
      h = ii(r),
      g = ii(s);
    if (!d) return !1;
    const z = d && ii(Tm),
      D =
        d &&
        (typeof Am == "function"
          ? (
              (H) => (w) =>
                H.encode(w)
            )(new Am())
          : async (H) => new Uint8Array(await new r(H).arrayBuffer())),
      b =
        h &&
        z &&
        zm(() => {
          let H = !1;
          const w = new r($t.origin, {
            body: new Tm(),
            method: "POST",
            get duplex() {
              return ((H = !0), "half");
            },
          }).headers.has("Content-Type");
          return H && !w;
        }),
      S = g && z && zm(() => O.isReadableStream(new s("").body)),
      C = { stream: S && ((H) => H.body) };
    d &&
      ["text", "arrayBuffer", "blob", "formData", "stream"].forEach((H) => {
        !C[H] &&
          (C[H] = (w, B) => {
            let tt = w && w[H];
            if (tt) return tt.call(w);
            throw new F(
              `Response type '${H}' is not supported`,
              F.ERR_NOT_SUPPORT,
              B,
            );
          });
      });
    const V = async (H) => {
        if (H == null) return 0;
        if (O.isBlob(H)) return H.size;
        if (O.isSpecCompliantForm(H))
          return (
            await new r($t.origin, { method: "POST", body: H }).arrayBuffer()
          ).byteLength;
        if (O.isArrayBufferView(H) || O.isArrayBuffer(H)) return H.byteLength;
        if ((O.isURLSearchParams(H) && (H = H + ""), O.isString(H)))
          return (await D(H)).byteLength;
      },
      ft = async (H, w) => {
        const B = O.toFiniteNumber(H.getContentLength());
        return B ?? V(w);
      };
    return async (H) => {
      let {
          url: w,
          method: B,
          data: tt,
          signal: xt,
          cancelToken: et,
          timeout: ht,
          onDownloadProgress: Ot,
          onUploadProgress: q,
          responseType: G,
          headers: Et,
          withCredentials: Yt = "same-origin",
          fetchOptions: je,
        } = Vm(H),
        re = f || fetch;
      G = G ? (G + "").toLowerCase() : "text";
      let Lt = kv([xt, et && et.toAbortSignal()], ht),
        oe = null;
      const Xt =
        Lt &&
        Lt.unsubscribe &&
        (() => {
          Lt.unsubscribe();
        });
      let te;
      try {
        if (
          q &&
          b &&
          B !== "get" &&
          B !== "head" &&
          (te = await ft(Et, tt)) !== 0
        ) {
          let y = new r(w, { method: "POST", body: tt, duplex: "half" }),
            M;
          if (
            (O.isFormData(tt) &&
              (M = y.headers.get("content-type")) &&
              Et.setContentType(M),
            y.body)
          ) {
            const [L, Q] = gm(te, ri(bm(q)));
            tt = Sm(y.body, Em, L, Q);
          }
        }
        O.isString(Yt) || (Yt = Yt ? "include" : "omit");
        const R = h && "credentials" in r.prototype,
          Y = {
            ...je,
            signal: Lt,
            method: B.toUpperCase(),
            headers: Et.normalize().toJSON(),
            body: tt,
            duplex: "half",
            credentials: R ? Yt : void 0,
          };
        oe = h && new r(w, Y);
        let K = await (h ? re(oe, je) : re(w, Y));
        const ot = S && (G === "stream" || G === "response");
        if (S && (Ot || (ot && Xt))) {
          const y = {};
          ["status", "statusText", "headers"].forEach((W) => {
            y[W] = K[W];
          });
          const M = O.toFiniteNumber(K.headers.get("content-length")),
            [L, Q] = (Ot && gm(M, ri(bm(Ot), !0))) || [];
          K = new s(
            Sm(K.body, Em, L, () => {
              (Q && Q(), Xt && Xt());
            }),
            y,
          );
        }
        G = G || "text";
        let yt = await C[O.findKey(C, G) || "text"](K, H);
        return (
          !ot && Xt && Xt(),
          await new Promise((y, M) => {
            Xm(y, M, {
              data: yt,
              headers: se.from(K.headers),
              status: K.status,
              statusText: K.statusText,
              config: H,
              request: oe,
            });
          })
        );
      } catch (R) {
        throw (
          Xt && Xt(),
          R && R.name === "TypeError" && /Load failed|fetch/i.test(R.message)
            ? Object.assign(
                new F("Network Error", F.ERR_NETWORK, H, oe, R && R.response),
                { cause: R.cause || R },
              )
            : F.from(R, R && R.code, H, oe, R && R.response)
        );
      }
    };
  },
  tg = new Map(),
  Km = (c) => {
    let f = (c && c.env) || {};
    const { fetch: r, Request: s, Response: d } = f,
      h = [s, d, r];
    let g = h.length,
      z = g,
      D,
      b,
      S = tg;
    for (; z--; )
      ((D = h[z]),
        (b = S.get(D)),
        b === void 0 && S.set(D, (b = z ? new Map() : Pv(f))),
        (S = b));
    return b;
  };
Km();
const Pf = { http: gv, xhr: Jv, fetch: { get: Km } };
O.forEach(Pf, (c, f) => {
  if (c) {
    try {
      Object.defineProperty(c, "name", { value: f });
    } catch {}
    Object.defineProperty(c, "adapterName", { value: f });
  }
});
const Om = (c) => `- ${c}`,
  eg = (c) => O.isFunction(c) || c === null || c === !1;
function lg(c, f) {
  c = O.isArray(c) ? c : [c];
  const { length: r } = c;
  let s, d;
  const h = {};
  for (let g = 0; g < r; g++) {
    s = c[g];
    let z;
    if (
      ((d = s),
      !eg(s) && ((d = Pf[(z = String(s)).toLowerCase()]), d === void 0))
    )
      throw new F(`Unknown adapter '${z}'`);
    if (d && (O.isFunction(d) || (d = d.get(f)))) break;
    h[z || "#" + g] = d;
  }
  if (!d) {
    const g = Object.entries(h).map(
      ([D, b]) =>
        `adapter ${D} ` +
        (b === !1
          ? "is not supported by the environment"
          : "is not available in the build"),
    );
    let z = r
      ? g.length > 1
        ? `since :
` +
          g.map(Om).join(`
`)
        : " " + Om(g[0])
      : "as no adapter specified";
    throw new F(
      "There is no suitable adapter to dispatch the request " + z,
      "ERR_NOT_SUPPORT",
    );
  }
  return d;
}
const Jm = { getAdapter: lg, adapters: Pf };
function Xf(c) {
  if (
    (c.cancelToken && c.cancelToken.throwIfRequested(),
    c.signal && c.signal.aborted)
  )
    throw new Gn(null, c);
}
function _m(c) {
  return (
    Xf(c),
    (c.headers = se.from(c.headers)),
    (c.data = Qf.call(c, c.transformRequest)),
    ["post", "put", "patch"].indexOf(c.method) !== -1 &&
      c.headers.setContentType("application/x-www-form-urlencoded", !1),
    Jm.getAdapter(
      c.adapter || wn.adapter,
      c,
    )(c).then(
      function (s) {
        return (
          Xf(c),
          (s.data = Qf.call(c, c.transformResponse, s)),
          (s.headers = se.from(s.headers)),
          s
        );
      },
      function (s) {
        return (
          Qm(s) ||
            (Xf(c),
            s &&
              s.response &&
              ((s.response.data = Qf.call(c, c.transformResponse, s.response)),
              (s.response.headers = se.from(s.response.headers)))),
          Promise.reject(s)
        );
      },
    )
  );
}
const km = "1.13.5",
  yi = {};
["object", "boolean", "number", "function", "string", "symbol"].forEach(
  (c, f) => {
    yi[c] = function (s) {
      return typeof s === c || "a" + (f < 1 ? "n " : " ") + c;
    };
  },
);
const xm = {};
yi.transitional = function (f, r, s) {
  function d(h, g) {
    return (
      "[Axios v" +
      km +
      "] Transitional option '" +
      h +
      "'" +
      g +
      (s ? ". " + s : "")
    );
  }
  return (h, g, z) => {
    if (f === !1)
      throw new F(
        d(g, " has been removed" + (r ? " in " + r : "")),
        F.ERR_DEPRECATED,
      );
    return (
      r &&
        !xm[g] &&
        ((xm[g] = !0),
        console.warn(
          d(
            g,
            " has been deprecated since v" +
              r +
              " and will be removed in the near future",
          ),
        )),
      f ? f(h, g, z) : !0
    );
  };
};
yi.spelling = function (f) {
  return (r, s) => (console.warn(`${s} is likely a misspelling of ${f}`), !0);
};
function ag(c, f, r) {
  if (typeof c != "object")
    throw new F("options must be an object", F.ERR_BAD_OPTION_VALUE);
  const s = Object.keys(c);
  let d = s.length;
  for (; d-- > 0; ) {
    const h = s[d],
      g = f[h];
    if (g) {
      const z = c[h],
        D = z === void 0 || g(z, h, c);
      if (D !== !0)
        throw new F("option " + h + " must be " + D, F.ERR_BAD_OPTION_VALUE);
      continue;
    }
    if (r !== !0) throw new F("Unknown option " + h, F.ERR_BAD_OPTION);
  }
}
const si = { assertOptions: ag, validators: yi },
  Me = si.validators;
let $l = class {
  constructor(f) {
    ((this.defaults = f || {}),
      (this.interceptors = { request: new ym(), response: new ym() }));
  }
  async request(f, r) {
    try {
      return await this._request(f, r);
    } catch (s) {
      if (s instanceof Error) {
        let d = {};
        Error.captureStackTrace
          ? Error.captureStackTrace(d)
          : (d = new Error());
        const h = d.stack ? d.stack.replace(/^.+\n/, "") : "";
        try {
          s.stack
            ? h &&
              !String(s.stack).endsWith(h.replace(/^.+\n.+\n/, "")) &&
              (s.stack +=
                `
` + h)
            : (s.stack = h);
        } catch {}
      }
      throw s;
    }
  }
  _request(f, r) {
    (typeof f == "string" ? ((r = r || {}), (r.url = f)) : (r = f || {}),
      (r = Il(this.defaults, r)));
    const { transitional: s, paramsSerializer: d, headers: h } = r;
    (s !== void 0 &&
      si.assertOptions(
        s,
        {
          silentJSONParsing: Me.transitional(Me.boolean),
          forcedJSONParsing: Me.transitional(Me.boolean),
          clarifyTimeoutError: Me.transitional(Me.boolean),
          legacyInterceptorReqResOrdering: Me.transitional(Me.boolean),
        },
        !1,
      ),
      d != null &&
        (O.isFunction(d)
          ? (r.paramsSerializer = { serialize: d })
          : si.assertOptions(
              d,
              { encode: Me.function, serialize: Me.function },
              !0,
            )),
      r.allowAbsoluteUrls !== void 0 ||
        (this.defaults.allowAbsoluteUrls !== void 0
          ? (r.allowAbsoluteUrls = this.defaults.allowAbsoluteUrls)
          : (r.allowAbsoluteUrls = !0)),
      si.assertOptions(
        r,
        {
          baseUrl: Me.spelling("baseURL"),
          withXsrfToken: Me.spelling("withXSRFToken"),
        },
        !0,
      ),
      (r.method = (r.method || this.defaults.method || "get").toLowerCase()));
    let g = h && O.merge(h.common, h[r.method]);
    (h &&
      O.forEach(
        ["delete", "get", "head", "post", "put", "patch", "common"],
        (H) => {
          delete h[H];
        },
      ),
      (r.headers = se.concat(g, h)));
    const z = [];
    let D = !0;
    this.interceptors.request.forEach(function (w) {
      if (typeof w.runWhen == "function" && w.runWhen(r) === !1) return;
      D = D && w.synchronous;
      const B = r.transitional || $f;
      B && B.legacyInterceptorReqResOrdering
        ? z.unshift(w.fulfilled, w.rejected)
        : z.push(w.fulfilled, w.rejected);
    });
    const b = [];
    this.interceptors.response.forEach(function (w) {
      b.push(w.fulfilled, w.rejected);
    });
    let S,
      C = 0,
      V;
    if (!D) {
      const H = [_m.bind(this), void 0];
      for (
        H.unshift(...z), H.push(...b), V = H.length, S = Promise.resolve(r);
        C < V;
      )
        S = S.then(H[C++], H[C++]);
      return S;
    }
    V = z.length;
    let ft = r;
    for (; C < V; ) {
      const H = z[C++],
        w = z[C++];
      try {
        ft = H(ft);
      } catch (B) {
        w.call(this, B);
        break;
      }
    }
    try {
      S = _m.call(this, ft);
    } catch (H) {
      return Promise.reject(H);
    }
    for (C = 0, V = b.length; C < V; ) S = S.then(b[C++], b[C++]);
    return S;
  }
  getUri(f) {
    f = Il(this.defaults, f);
    const r = Zm(f.baseURL, f.url, f.allowAbsoluteUrls);
    return wm(r, f.params, f.paramsSerializer);
  }
};
O.forEach(["delete", "get", "head", "options"], function (f) {
  $l.prototype[f] = function (r, s) {
    return this.request(
      Il(s || {}, { method: f, url: r, data: (s || {}).data }),
    );
  };
});
O.forEach(["post", "put", "patch"], function (f) {
  function r(s) {
    return function (h, g, z) {
      return this.request(
        Il(z || {}, {
          method: f,
          headers: s ? { "Content-Type": "multipart/form-data" } : {},
          url: h,
          data: g,
        }),
      );
    };
  }
  (($l.prototype[f] = r()), ($l.prototype[f + "Form"] = r(!0)));
});
let ng = class Fm {
  constructor(f) {
    if (typeof f != "function")
      throw new TypeError("executor must be a function.");
    let r;
    this.promise = new Promise(function (h) {
      r = h;
    });
    const s = this;
    (this.promise.then((d) => {
      if (!s._listeners) return;
      let h = s._listeners.length;
      for (; h-- > 0; ) s._listeners[h](d);
      s._listeners = null;
    }),
      (this.promise.then = (d) => {
        let h;
        const g = new Promise((z) => {
          (s.subscribe(z), (h = z));
        }).then(d);
        return (
          (g.cancel = function () {
            s.unsubscribe(h);
          }),
          g
        );
      }),
      f(function (h, g, z) {
        s.reason || ((s.reason = new Gn(h, g, z)), r(s.reason));
      }));
  }
  throwIfRequested() {
    if (this.reason) throw this.reason;
  }
  subscribe(f) {
    if (this.reason) {
      f(this.reason);
      return;
    }
    this._listeners ? this._listeners.push(f) : (this._listeners = [f]);
  }
  unsubscribe(f) {
    if (!this._listeners) return;
    const r = this._listeners.indexOf(f);
    r !== -1 && this._listeners.splice(r, 1);
  }
  toAbortSignal() {
    const f = new AbortController(),
      r = (s) => {
        f.abort(s);
      };
    return (
      this.subscribe(r),
      (f.signal.unsubscribe = () => this.unsubscribe(r)),
      f.signal
    );
  }
  static source() {
    let f;
    return {
      token: new Fm(function (d) {
        f = d;
      }),
      cancel: f,
    };
  }
};
function ug(c) {
  return function (r) {
    return c.apply(null, r);
  };
}
function ig(c) {
  return O.isObject(c) && c.isAxiosError === !0;
}
const Jf = {
  Continue: 100,
  SwitchingProtocols: 101,
  Processing: 102,
  EarlyHints: 103,
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NonAuthoritativeInformation: 203,
  NoContent: 204,
  ResetContent: 205,
  PartialContent: 206,
  MultiStatus: 207,
  AlreadyReported: 208,
  ImUsed: 226,
  MultipleChoices: 300,
  MovedPermanently: 301,
  Found: 302,
  SeeOther: 303,
  NotModified: 304,
  UseProxy: 305,
  Unused: 306,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
  BadRequest: 400,
  Unauthorized: 401,
  PaymentRequired: 402,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  NotAcceptable: 406,
  ProxyAuthenticationRequired: 407,
  RequestTimeout: 408,
  Conflict: 409,
  Gone: 410,
  LengthRequired: 411,
  PreconditionFailed: 412,
  PayloadTooLarge: 413,
  UriTooLong: 414,
  UnsupportedMediaType: 415,
  RangeNotSatisfiable: 416,
  ExpectationFailed: 417,
  ImATeapot: 418,
  MisdirectedRequest: 421,
  UnprocessableEntity: 422,
  Locked: 423,
  FailedDependency: 424,
  TooEarly: 425,
  UpgradeRequired: 426,
  PreconditionRequired: 428,
  TooManyRequests: 429,
  RequestHeaderFieldsTooLarge: 431,
  UnavailableForLegalReasons: 451,
  InternalServerError: 500,
  NotImplemented: 501,
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
  HttpVersionNotSupported: 505,
  VariantAlsoNegotiates: 506,
  InsufficientStorage: 507,
  LoopDetected: 508,
  NotExtended: 510,
  NetworkAuthenticationRequired: 511,
  WebServerIsDown: 521,
  ConnectionTimedOut: 522,
  OriginIsUnreachable: 523,
  TimeoutOccurred: 524,
  SslHandshakeFailed: 525,
  InvalidSslCertificate: 526,
};
Object.entries(Jf).forEach(([c, f]) => {
  Jf[f] = c;
});
function Wm(c) {
  const f = new $l(c),
    r = Nm($l.prototype.request, f);
  return (
    O.extend(r, $l.prototype, f, { allOwnKeys: !0 }),
    O.extend(r, f, null, { allOwnKeys: !0 }),
    (r.create = function (d) {
      return Wm(Il(c, d));
    }),
    r
  );
}
const jt = Wm(wn);
jt.Axios = $l;
jt.CanceledError = Gn;
jt.CancelToken = ng;
jt.isCancel = Qm;
jt.VERSION = km;
jt.toFormData = hi;
jt.AxiosError = F;
jt.Cancel = jt.CanceledError;
jt.all = function (f) {
  return Promise.all(f);
};
jt.spread = ug;
jt.isAxiosError = ig;
jt.mergeConfig = Il;
jt.AxiosHeaders = se;
jt.formToJSON = (c) => Gm(O.isHTMLForm(c) ? new FormData(c) : c);
jt.getAdapter = Jm.getAdapter;
jt.HttpStatusCode = Jf;
jt.default = jt;
const {
    Axios: bg,
    AxiosError: pg,
    CanceledError: Sg,
    isCancel: Eg,
    CancelToken: Tg,
    VERSION: Ag,
    all: zg,
    Cancel: Og,
    isAxiosError: _g,
    spread: xg,
    toFormData: Rg,
    AxiosHeaders: Ng,
    HttpStatusCode: Dg,
    formToJSON: Ug,
    getAdapter: Mg,
    mergeConfig: jg,
  } = jt,
  qn = jt.create({
    baseURL: "http://localhost:8000/api/catalog/",
    withCredentials: !0,
  }),
  cg = [
    { value: "", label: "All Sittings" },
    { value: "MAY_JUNE", label: "May/June" },
    { value: "NOV_DEC", label: "Nov/Dec" },
    { value: "MOCK", label: "Mock" },
    { value: "OTHER", label: "Other" },
  ],
  fg = [
    { value: "", label: "Both (OBJ + Theory)" },
    { value: "OBJ", label: "Objective Only" },
    { value: "THEORY", label: "Theory Only" },
  ],
  sg = `
  .gen-form {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 1.75rem;
  }

  .form-head {
    margin-bottom: 1.5rem;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid var(--border);
  }
  .form-head h2 {
    font-family: 'Syne', sans-serif;
    font-weight: 700; font-size: 1.1rem; letter-spacing: -0.3px;
    margin-bottom: 0.25rem;
  }
  .form-head p { font-size: 0.8rem; color: var(--muted); line-height: 1.5; }

  .form-section {
    margin-bottom: 1.25rem;
  }
  .form-section-label {
    font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--muted); margin-bottom: 0.75rem;
    display: flex; align-items: center; gap: 0.5rem;
  }
  .form-section-label::after {
    content: ''; flex: 1; height: 1px; background: var(--border);
  }

  .form-group { margin-bottom: 0.75rem; }
  .form-label {
    display: block; font-size: 0.78rem; font-weight: 500;
    color: var(--muted-light); margin-bottom: 0.35rem;
  }
  .form-label .hint {
    font-weight: 400; font-style: italic; color: var(--muted);
  }

  .form-select, .form-input {
    width: 100%;
    background: var(--deep); border: 1px solid var(--border);
    color: var(--text); padding: 0.6rem 0.85rem;
    border-radius: 8px; font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem; transition: border-color 0.2s, box-shadow 0.2s;
    outline: none; appearance: none;
  }
  .form-select:focus, .form-input:focus {
    border-color: rgba(156,213,255,0.45);
    box-shadow: 0 0 0 3px rgba(156,213,255,0.08);
  }
  .form-select option { background: #ffffff; }

  .multi-select-wrapper {
    position: relative;
  }
  .multi-select {
    width: 100%;
    background: var(--deep); border: 1px solid var(--border);
    color: var(--text); border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 0.875rem;
    outline: none; transition: border-color 0.2s;
    min-height: 90px;
    padding: 0.35rem;
  }
  .multi-select:focus { border-color: rgba(156,213,255,0.45); }
  .multi-select option {
    background: var(--deep); padding: 0.4rem 0.6rem;
    border-radius: 4px; cursor: pointer;
  }
  .multi-select option:checked {
    background: rgba(156,213,255,0.15);
    color: var(--accent);
  }
  .multi-select:disabled { opacity: 0.4; cursor: not-allowed; }
  .select-hint {
    font-size: 0.7rem; color: var(--muted); margin-top: 0.3rem;
    font-style: italic;
  }

  .selected-tags {
    display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.5rem;
  }
  .selected-tag {
    background: var(--accent-dim); border: 1px solid rgba(156,213,255,0.25);
    color: var(--accent); font-size: 0.72rem; font-weight: 600;
    padding: 0.2rem 0.6rem; border-radius: 100px;
    display: flex; align-items: center; gap: 0.3rem;
  }
  .selected-tag button {
    background: none; border: none; color: var(--accent);
    cursor: pointer; font-size: 0.8rem; padding: 0; line-height: 1;
  }

  .num-row {
    display: flex; gap: 0.5rem; align-items: center;
  }
  .num-row .form-input {
    width: 80px; text-align: center;
  }
  .quick-nums {
    display: flex; gap: 0.4rem; flex-wrap: wrap;
  }
  .quick-num {
    background: var(--deep); border: 1px solid var(--border);
    color: var(--muted-light); font-size: 0.78rem; font-weight: 600;
    padding: 0.35rem 0.7rem; border-radius: 6px; cursor: pointer;
    transition: all 0.15s; font-family: 'DM Sans', sans-serif;
  }
  .quick-num:hover, .quick-num.active {
    background: var(--accent-dim); border-color: rgba(156,213,255,0.3);
    color: var(--accent);
  }

  .type-toggle {
    display: flex; gap: 0.375rem;
  }
  .type-btn {
    flex: 1; padding: 0.55rem 0.5rem; border-radius: 8px;
    border: 1px solid var(--border); background: var(--deep);
    color: var(--muted); font-family: 'DM Sans', sans-serif;
    font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
    text-align: center;
  }
  .type-btn.active { background: var(--accent-dim); border-color: rgba(156,213,255,0.3); color: var(--accent); }
  .type-btn:hover:not(.active) { color: var(--text); border-color: var(--border-hover); }

  .diff-toggle {
    display: flex; gap: 0.375rem;
  }
  .diff-btn {
    flex: 1; padding: 0.5rem; border-radius: 8px;
    border: 1px solid var(--border); background: var(--deep);
    color: var(--muted); font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
    text-align: center;
  }
  .diff-btn.easy.active { background: var(--accent-dim); border-color: rgba(156,213,255,0.3); color: var(--accent); }
  .diff-btn.medium.active { background: rgba(245,200,66,0.12); border-color: rgba(245,200,66,0.3); color: var(--gold); }
  .diff-btn.hard.active { background: rgba(248,113,113,0.12); border-color: rgba(248,113,113,0.3); color: var(--red); }
  .diff-btn:hover:not(.active) { color: var(--text); border-color: var(--border-hover); }

  .form-error {
    background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.2);
    color: var(--red); font-size: 0.825rem; padding: 0.7rem 1rem;
    border-radius: 8px; margin-bottom: 1rem;
  }

  .submit-btn {
    width: 100%; padding: 0.85rem;
    background: var(--accent); color: var(--black);
    border: none; border-radius: 10px;
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.95rem;
    cursor: pointer; transition: all 0.25s;
    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  }
  .submit-btn:hover:not(:disabled) {
    background: #c2e8ff;
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(156,213,255,0.2);
  }
  .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  .clear-btn {
    width: 100%; padding: 0.6rem;
    background: transparent; color: var(--muted);
    border: 1px solid var(--border); border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 0.825rem;
    cursor: pointer; transition: all 0.2s; margin-top: 0.6rem;
  }
  .clear-btn:hover { color: var(--text); border-color: var(--border-hover); }

  .spinner {
    width: 16px; height: 16px; border: 2px solid rgba(14,31,44,0.3);
    border-top-color: var(--black); border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;
function rg({ onResults: c, onClear: f }) {
  const [r, s] = Wt.useState([]),
    [d, h] = Wt.useState([]),
    [g, z] = Wt.useState([]),
    [D, b] = Wt.useState([]),
    [S, C] = Wt.useState({
      subject: "",
      exam_board: "",
      years: [],
      sitting: "",
      question_type: "",
      topics: [],
      difficulty: "",
      num_questions: 20,
    }),
    [V, ft] = Wt.useState(!1),
    [H, w] = Wt.useState(null);
  (Wt.useEffect(() => {
    (qn
      .get("subjects/")
      .then((q) => s(q.data))
      .catch(() => {}),
      qn
        .get("exam-boards/")
        .then((q) => h(q.data))
        .catch(() => {}));
  }, []),
    Wt.useEffect(() => {
      S.subject
        ? qn
            .get(`topics/?subject=${S.subject}`)
            .then((q) => z(q.data))
            .catch(() => {})
        : (z([]), C((q) => ({ ...q, topics: [] })));
    }, [S.subject]),
    Wt.useEffect(() => {
      const q = new URLSearchParams();
      (S.subject && q.set("subject", S.subject),
        S.exam_board && q.set("exam_board", S.exam_board),
        S.subject || S.exam_board
          ? qn
              .get(`years/?${q}`)
              .then((G) => b(G.data.years))
              .catch(() => {})
          : (b([]), C((G) => ({ ...G, years: [] }))));
    }, [S.subject, S.exam_board]));
  const B = (q, G) => C((Et) => ({ ...Et, [q]: G })),
    tt = (q, G) => {
      C((Et) => {
        const Yt = Et[q];
        return {
          ...Et,
          [q]: Yt.includes(G) ? Yt.filter((je) => je !== G) : [...Yt, G],
        };
      });
    },
    xt = (q, G) => q.find((Et) => String(Et.id) === String(G)),
    et = async (q) => {
      if ((q.preventDefault(), !S.subject)) {
        w("Please select a subject.");
        return;
      }
      (ft(!0), w(null));
      try {
        const G = await qn.post("questions/generate/", {
          ...S,
          years: S.years.map(Number),
          topics: S.topics.map(Number),
          num_questions: Number(S.num_questions),
        });
        c(G.data);
      } catch (G) {
        const Et =
          G.response?.status === 403
            ? "Access denied. Make sure you are logged in as a teacher."
            : "Something went wrong. Please try again.";
        w(Et);
      } finally {
        ft(!1);
      }
    },
    ht = () => {
      (C({
        subject: "",
        exam_board: "",
        years: [],
        sitting: "",
        question_type: "",
        topics: [],
        difficulty: "",
        num_questions: 20,
      }),
        f());
    },
    Ot = [10, 20, 30, 50];
  return x.jsxs(x.Fragment, {
    children: [
      x.jsx("style", { children: sg }),
      x.jsxs("form", {
        className: "gen-form",
        onSubmit: et,
        children: [
          x.jsxs("div", {
            className: "form-head",
            children: [
              x.jsx("h2", { children: "🛠️ Question Builder" }),
              x.jsx("p", {
                children:
                  "Filter and generate a custom question set for your class.",
              }),
            ],
          }),
          x.jsxs("div", {
            className: "form-section",
            children: [
              x.jsx("div", {
                className: "form-section-label",
                children: "Exam Context",
              }),
              x.jsxs("div", {
                className: "form-group",
                children: [
                  x.jsxs("label", {
                    className: "form-label",
                    children: [
                      "Subject ",
                      x.jsx("span", {
                        style: { color: "var(--red)" },
                        children: "*",
                      }),
                    ],
                  }),
                  x.jsxs("select", {
                    className: "form-select",
                    value: S.subject,
                    onChange: (q) => B("subject", q.target.value),
                    children: [
                      x.jsx("option", {
                        value: "",
                        children: "— Select Subject —",
                      }),
                      r.map((q) =>
                        x.jsx(
                          "option",
                          { value: q.id, children: q.name },
                          q.id,
                        ),
                      ),
                    ],
                  }),
                ],
              }),
              x.jsxs("div", {
                className: "form-group",
                children: [
                  x.jsx("label", {
                    className: "form-label",
                    children: "Exam Board",
                  }),
                  x.jsxs("select", {
                    className: "form-select",
                    value: S.exam_board,
                    onChange: (q) => B("exam_board", q.target.value),
                    children: [
                      x.jsx("option", { value: "", children: "— Any Board —" }),
                      d.map((q) =>
                        x.jsxs(
                          "option",
                          {
                            value: q.id,
                            children: [q.name, " (", q.abbreviation, ")"],
                          },
                          q.id,
                        ),
                      ),
                    ],
                  }),
                ],
              }),
              x.jsxs("div", {
                className: "form-group",
                children: [
                  x.jsx("label", {
                    className: "form-label",
                    children: "Sitting",
                  }),
                  x.jsx("select", {
                    className: "form-select",
                    value: S.sitting,
                    onChange: (q) => B("sitting", q.target.value),
                    children: cg.map((q) =>
                      x.jsx(
                        "option",
                        { value: q.value, children: q.label },
                        q.value,
                      ),
                    ),
                  }),
                ],
              }),
            ],
          }),
          x.jsxs("div", {
            className: "form-section",
            children: [
              x.jsx("div", {
                className: "form-section-label",
                children: "Years",
              }),
              x.jsxs("div", {
                className: "form-group",
                children: [
                  x.jsxs("label", {
                    className: "form-label",
                    children: [
                      "Select Years ",
                      x.jsx("span", {
                        className: "hint",
                        children: "(click to toggle)",
                      }),
                    ],
                  }),
                  D.length === 0
                    ? x.jsx("p", {
                        style: {
                          fontSize: "0.8rem",
                          color: "var(--muted)",
                          fontStyle: "italic",
                        },
                        children:
                          S.subject || S.exam_board
                            ? "No years found for selection."
                            : "Select a subject or exam board first.",
                      })
                    : x.jsx("div", {
                        style: {
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.4rem",
                          marginTop: "0.25rem",
                        },
                        children: D.map((q) =>
                          x.jsx(
                            "button",
                            {
                              type: "button",
                              className: `quick-num ${S.years.includes(String(q)) ? "active" : ""}`,
                              onClick: () => tt("years", String(q)),
                              children: q,
                            },
                            q,
                          ),
                        ),
                      }),
                  S.years.length > 0 &&
                    x.jsx("div", {
                      className: "selected-tags",
                      style: { marginTop: "0.6rem" },
                      children: S.years.map((q) =>
                        x.jsxs(
                          "span",
                          {
                            className: "selected-tag",
                            children: [
                              q,
                              x.jsx("button", {
                                type: "button",
                                onClick: () => tt("years", q),
                                children: "×",
                              }),
                            ],
                          },
                          q,
                        ),
                      ),
                    }),
                ],
              }),
            ],
          }),
          x.jsxs("div", {
            className: "form-section",
            children: [
              x.jsx("div", {
                className: "form-section-label",
                children: "Topics",
              }),
              x.jsxs("div", {
                className: "form-group",
                children: [
                  x.jsxs("label", {
                    className: "form-label",
                    children: [
                      "Filter by Topics ",
                      x.jsx("span", {
                        className: "hint",
                        children: "(optional)",
                      }),
                    ],
                  }),
                  g.length === 0
                    ? x.jsx("p", {
                        style: {
                          fontSize: "0.8rem",
                          color: "var(--muted)",
                          fontStyle: "italic",
                        },
                        children: S.subject
                          ? "No topics found for this subject."
                          : "Select a subject to see topics.",
                      })
                    : x.jsx("div", {
                        style: {
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.35rem",
                          maxHeight: "180px",
                          overflowY: "auto",
                          padding: "0.25rem",
                        },
                        children: g.map((q) =>
                          x.jsxs(
                            "label",
                            {
                              style: {
                                display: "flex",
                                alignItems: "center",
                                gap: "0.6rem",
                                cursor: "pointer",
                                padding: "0.3rem 0.5rem",
                                borderRadius: "6px",
                                transition: "background 0.15s",
                                background: S.topics.includes(String(q.id))
                                  ? "var(--accent-dim)"
                                  : "transparent",
                              },
                              children: [
                                x.jsx("input", {
                                  type: "checkbox",
                                  checked: S.topics.includes(String(q.id)),
                                  onChange: () => tt("topics", String(q.id)),
                                  style: { accentColor: "var(--accent)" },
                                }),
                                x.jsx("span", {
                                  style: {
                                    fontSize: "0.85rem",
                                    color: S.topics.includes(String(q.id))
                                      ? "var(--accent)"
                                      : "var(--text)",
                                  },
                                  children: q.name,
                                }),
                              ],
                            },
                            q.id,
                          ),
                        ),
                      }),
                  S.topics.length > 0 &&
                    x.jsx("div", {
                      className: "selected-tags",
                      children: S.topics.map((q) => {
                        const G = xt(g, q);
                        return G
                          ? x.jsxs(
                              "span",
                              {
                                className: "selected-tag",
                                children: [
                                  G.name,
                                  x.jsx("button", {
                                    type: "button",
                                    onClick: () => tt("topics", q),
                                    children: "×",
                                  }),
                                ],
                              },
                              q,
                            )
                          : null;
                      }),
                    }),
                ],
              }),
            ],
          }),
          x.jsxs("div", {
            className: "form-section",
            children: [
              x.jsx("div", {
                className: "form-section-label",
                children: "Question Settings",
              }),
              x.jsxs("div", {
                className: "form-group",
                children: [
                  x.jsx("label", {
                    className: "form-label",
                    children: "Question Type",
                  }),
                  x.jsx("div", {
                    className: "type-toggle",
                    children: fg.map((q) =>
                      x.jsx(
                        "button",
                        {
                          type: "button",
                          className: `type-btn ${S.question_type === q.value ? "active" : ""}`,
                          onClick: () => B("question_type", q.value),
                          children: q.label,
                        },
                        q.value,
                      ),
                    ),
                  }),
                ],
              }),
              x.jsxs("div", {
                className: "form-group",
                children: [
                  x.jsx("label", {
                    className: "form-label",
                    children: "Difficulty",
                  }),
                  x.jsxs("div", {
                    className: "diff-toggle",
                    children: [
                      x.jsx("button", {
                        type: "button",
                        className: `diff-btn ${S.difficulty === "" ? "active easy" : ""}`,
                        onClick: () => B("difficulty", ""),
                        children: "Any",
                      }),
                      x.jsx("button", {
                        type: "button",
                        className: `diff-btn easy ${S.difficulty === "EASY" ? "active" : ""}`,
                        onClick: () => B("difficulty", "EASY"),
                        children: "Easy",
                      }),
                      x.jsx("button", {
                        type: "button",
                        className: `diff-btn medium ${S.difficulty === "MEDIUM" ? "active" : ""}`,
                        onClick: () => B("difficulty", "MEDIUM"),
                        children: "Medium",
                      }),
                      x.jsx("button", {
                        type: "button",
                        className: `diff-btn hard ${S.difficulty === "HARD" ? "active" : ""}`,
                        onClick: () => B("difficulty", "HARD"),
                        children: "Hard",
                      }),
                    ],
                  }),
                ],
              }),
              x.jsxs("div", {
                className: "form-group",
                children: [
                  x.jsx("label", {
                    className: "form-label",
                    children: "Number of Questions",
                  }),
                  x.jsx("div", {
                    className: "quick-nums",
                    style: { marginBottom: "0.5rem" },
                    children: Ot.map((q) =>
                      x.jsx(
                        "button",
                        {
                          type: "button",
                          className: `quick-num ${S.num_questions === q ? "active" : ""}`,
                          onClick: () => B("num_questions", q),
                          children: q,
                        },
                        q,
                      ),
                    ),
                  }),
                  x.jsx("input", {
                    type: "number",
                    className: "form-input",
                    value: S.num_questions,
                    onChange: (q) => B("num_questions", Number(q.target.value)),
                    min: 1,
                    max: 200,
                    style: { width: "100px" },
                  }),
                ],
              }),
            ],
          }),
          H && x.jsxs("div", { className: "form-error", children: ["⚠️ ", H] }),
          x.jsx("button", {
            type: "submit",
            className: "submit-btn",
            disabled: V,
            children: V
              ? x.jsxs(x.Fragment, {
                  children: [
                    x.jsx("div", { className: "spinner" }),
                    " Generating...",
                  ],
                })
              : x.jsx(x.Fragment, { children: "Generate Questions →" }),
          }),
          x.jsx("button", {
            type: "button",
            className: "clear-btn",
            onClick: ht,
            children: "Clear All",
          }),
        ],
      }),
    ],
  });
}
const og = `
  .q-list { display: flex; flex-direction: column; gap: 1.25rem; }

  .q-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 14px; padding: 1.75rem;
    transition: border-color 0.2s;
    position: relative; overflow: hidden;
  }
  .q-card::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 3px;
  }
  .q-card.obj::before { background: var(--mid); }
  .q-card.theory::before { background: var(--gold); }
  .q-card:hover { border-color: var(--border-hover); }

  .q-card-header {
    display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;
    margin-bottom: 1rem;
  }
  .q-num {
    font-family: 'Syne', sans-serif; font-weight: 800; font-size: 0.8rem;
    color: var(--muted); letter-spacing: 0.05em;
  }
  .q-badge {
    font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.6rem;
    border-radius: 100px; text-transform: uppercase; letter-spacing: 0.05em;
  }
  .q-badge.obj { background: var(--mid-dim); color: var(--accent); }
  .q-badge.theory { background: var(--gold-dim); color: var(--gold); }
  .q-badge.easy { background: rgba(0,232,122,0.12); color: var(--accent); }
  .q-badge.medium { background: var(--gold-dim); color: var(--gold); }
  .q-badge.hard { background: rgba(248,113,113,0.12); color: var(--red); }

  .q-marks {
    margin-left: auto; font-size: 0.75rem; color: var(--muted);
    background: var(--deep); border: 1px solid var(--border);
    padding: 0.2rem 0.6rem; border-radius: 6px;
  }

  .q-content {
    font-size: 0.975rem; line-height: 1.7; color: var(--text);
    margin-bottom: 1.25rem;
  }

  .q-image {
    max-width: 100%; border-radius: 8px; margin-bottom: 1.25rem;
    border: 1px solid var(--border);
  }

  /* Choices */
  .choices { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
  .choice-item {
    display: flex; align-items: flex-start; gap: 0.75rem;
    padding: 0.75rem 1rem; border-radius: 8px;
    border: 1px solid var(--border); background: var(--deep);
    transition: all 0.15s;
  }
  .choice-item.correct {
    background: rgba(156,213,255,0.06);
    border-color: rgba(156,213,255,0.2);
  }
  .choice-label {
    font-weight: 700; font-size: 0.875rem; flex-shrink: 0;
    width: 22px; height: 22px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: var(--card); border: 1px solid var(--border);
    font-family: 'Syne', sans-serif;
  }
  .choice-item.correct .choice-label {
    background: var(--accent); color: var(--black); border-color: var(--accent);
  }
  .choice-body { flex: 1; }
  .choice-text { font-size: 0.9rem; line-height: 1.5; }
  .choice-item.correct .choice-text { color: var(--accent); }
  .correct-tick {
    font-size: 0.75rem; color: var(--accent); font-weight: 700;
    margin-left: auto; flex-shrink: 0;
  }

  .choice-explanation {
    font-size: 0.8rem; color: var(--muted); margin-top: 0.4rem;
    line-height: 1.5; font-style: italic;
  }

  /* Theory answer */
  .theory-answer {
    background: var(--deep); border: 1px solid rgba(245,200,66,0.15);
    border-radius: 10px; padding: 1.25rem; margin-top: 0.5rem;
  }
  .theory-answer-title {
    font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; color: var(--gold); margin-bottom: 0.75rem;
  }
  .theory-answer-content {
    font-size: 0.9rem; line-height: 1.7; color: var(--muted-light);
  }
  .marking-guide {
    margin-top: 0.75rem;
    border-top: 1px solid var(--border); padding-top: 0.75rem;
  }
  .marking-guide summary {
    font-size: 0.78rem; font-weight: 600; color: var(--muted);
    cursor: pointer; user-select: none; transition: color 0.15s;
  }
  .marking-guide summary:hover { color: var(--text); }
  .marking-guide p {
    font-size: 0.85rem; color: var(--muted); line-height: 1.6;
    margin-top: 0.5rem;
  }

  /* Video link */
  .video-link {
    display: inline-flex; align-items: center; gap: 0.4rem;
    margin-top: 0.75rem;
    font-size: 0.8rem; font-weight: 600; color: var(--mid);
    text-decoration: none; padding: 0.35rem 0.8rem;
    background: var(--mid-dim); border: 1px solid rgba(122,170,206,0.2);
    border-radius: 6px; transition: all 0.2s;
  }
  .video-link:hover {
    background: var(--mid-dim);
    transform: translateX(2px);
  }

  /* Topics */
  .q-topics { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 1rem; }
  .topic-tag {
    font-size: 0.72rem; color: var(--muted); background: var(--deep);
    border: 1px solid var(--border); padding: 0.2rem 0.6rem; border-radius: 100px;
  }
`;
function dg({ questions: c }) {
  return c.length
    ? x.jsxs(x.Fragment, {
        children: [
          x.jsx("style", { children: og }),
          x.jsx("div", {
            className: "q-list",
            children: c.map((f) =>
              x.jsxs(
                "div",
                {
                  className: `q-card ${f.question_type === "OBJ" ? "obj" : "theory"}`,
                  children: [
                    x.jsxs("div", {
                      className: "q-card-header",
                      children: [
                        x.jsxs("span", {
                          className: "q-num",
                          children: ["Q", f.question_number],
                        }),
                        x.jsx("span", {
                          className: `q-badge ${f.question_type === "OBJ" ? "obj" : "theory"}`,
                          children:
                            f.question_type === "OBJ" ? "Objective" : "Theory",
                        }),
                        f.difficulty &&
                          x.jsx("span", {
                            className: `q-badge ${f.difficulty.toLowerCase()}`,
                            children: f.difficulty,
                          }),
                        x.jsxs("span", {
                          className: "q-marks",
                          children: [
                            f.marks,
                            " mark",
                            f.marks !== 1 ? "s" : "",
                          ],
                        }),
                      ],
                    }),
                    x.jsx("p", { className: "q-content", children: f.content }),
                    f.image &&
                      x.jsx("img", {
                        src: f.image,
                        alt: `Q${f.question_number}`,
                        className: "q-image",
                      }),
                    f.question_type === "OBJ" &&
                      f.choices?.length > 0 &&
                      x.jsx("ul", {
                        className: "choices",
                        children: f.choices.map((r) =>
                          x.jsxs(
                            "li",
                            {
                              className: `choice-item ${r.is_correct ? "correct" : ""}`,
                              children: [
                                x.jsx("span", {
                                  className: "choice-label",
                                  children: r.label,
                                }),
                                x.jsxs("div", {
                                  className: "choice-body",
                                  children: [
                                    x.jsx("div", {
                                      className: "choice-text",
                                      children: r.choice_text,
                                    }),
                                    r.is_correct &&
                                      r.explanation &&
                                      x.jsxs("div", {
                                        className: "choice-explanation",
                                        children: ["💡 ", r.explanation],
                                      }),
                                    r.video_url &&
                                      x.jsx("a", {
                                        href: r.video_url,
                                        target: "_blank",
                                        rel: "noreferrer",
                                        className: "video-link",
                                        children: "▶ Watch explanation",
                                      }),
                                  ],
                                }),
                                r.is_correct &&
                                  x.jsx("span", {
                                    className: "correct-tick",
                                    children: "✓",
                                  }),
                              ],
                            },
                            r.id,
                          ),
                        ),
                      }),
                    f.question_type === "THEORY" &&
                      f.theory_answer &&
                      x.jsxs("div", {
                        className: "theory-answer",
                        children: [
                          x.jsx("div", {
                            className: "theory-answer-title",
                            children: "Model Answer",
                          }),
                          x.jsx("div", {
                            className: "theory-answer-content",
                            children: f.theory_answer.content,
                          }),
                          f.theory_answer.marking_guide &&
                            x.jsxs("details", {
                              className: "marking-guide",
                              children: [
                                x.jsx("summary", {
                                  children: "📋 View Marking Guide",
                                }),
                                x.jsx("p", {
                                  children: f.theory_answer.marking_guide,
                                }),
                              ],
                            }),
                          f.theory_answer.video_url &&
                            x.jsx("a", {
                              href: f.theory_answer.video_url,
                              target: "_blank",
                              rel: "noreferrer",
                              className: "video-link",
                              children: "▶ Watch walkthrough",
                            }),
                        ],
                      }),
                    f.topics?.length > 0 &&
                      x.jsx("div", {
                        className: "q-topics",
                        children: f.topics.map((r) =>
                          x.jsx(
                            "span",
                            { className: "topic-tag", children: r.name },
                            r.id,
                          ),
                        ),
                      }),
                  ],
                },
                f.id,
              ),
            ),
          }),
        ],
      })
    : null;
}
const mg = `
  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .app-topbar {
    position: sticky; top: 0; z-index: 50;
    background: rgba(14, 31, 44, 0.92);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    padding: 0.9rem 2rem;
    display: flex; align-items: center; justify-content: space-between;
  }

  .app-logo {
    font-family: 'Syne', sans-serif;
    font-weight: 800; font-size: 1.2rem; color: var(--text); letter-spacing: -0.5px;
  }
  .app-logo span { color: var(--accent); }

  .mode-tabs {
    display: flex; gap: 0.375rem;
    background: var(--deep); border: 1px solid var(--border);
    padding: 0.25rem; border-radius: 10px;
  }
  .mode-tab {
    padding: 0.45rem 1.1rem; border-radius: 7px; font-size: 0.85rem;
    font-weight: 600; cursor: pointer; border: none; transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .mode-tab.active {
    background: var(--accent); color: var(--black);
  }
  .mode-tab.inactive {
    background: transparent; color: var(--muted);
  }
  .mode-tab.inactive:hover { color: var(--text); }
  .mode-tab.locked { opacity: 0.4; cursor: not-allowed; }

  .topbar-right {
    display: flex; align-items: center; gap: 0.75rem;
  }
  .user-chip {
    display: flex; align-items: center; gap: 0.5rem;
    background: var(--card); border: 1px solid var(--border);
    padding: 0.4rem 0.9rem; border-radius: 8px;
    font-size: 0.825rem; color: var(--muted-light);
  }
  .user-chip .role-badge {
    font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.5rem;
    border-radius: 100px; text-transform: uppercase; letter-spacing: 0.05em;
  }
  .role-badge.teacher { background: var(--gold-dim); color: var(--gold); }
  .role-badge.student { background: var(--accent-dim); color: var(--accent); }

  .app-main {
    flex: 1;
    display: flex;
    max-width: 1300px;
    margin: 0 auto;
    width: 100%;
    padding: 2rem;
    gap: 2rem;
  }

  /* Teacher layout: sidebar form + main results */
  .teacher-layout {
    display: flex; width: 100%; gap: 2rem; align-items: flex-start;
  }
  .form-sidebar {
    width: 360px; flex-shrink: 0;
    position: sticky; top: 80px;
  }
  .results-panel {
    flex: 1; min-width: 0;
  }

  /* Student layout: centered */
  .student-layout {
    width: 100%; max-width: 700px; margin: 0 auto;
  }

  .panel-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700; font-size: 1.4rem;
    letter-spacing: -0.5px; margin-bottom: 0.35rem;
  }
  .panel-sub {
    font-size: 0.875rem; color: var(--muted); margin-bottom: 1.5rem; line-height: 1.6;
  }

  .results-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;
  }
  .results-count {
    display: inline-flex; align-items: center; gap: 0.5rem;
    background: var(--accent-dim); border: 1px solid rgba(156,213,255,0.25);
    color: var(--accent); font-size: 0.825rem; font-weight: 700;
    padding: 0.35rem 0.9rem; border-radius: 100px;
  }

  .empty-state {
    text-align: center;
    padding: 5rem 2rem;
    background: var(--card); border: 1px solid var(--border);
    border-radius: 16px;
  }
  .empty-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; }
  .empty-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--muted-light); }
  .empty-desc { font-size: 0.875rem; color: var(--muted); }

  @media (max-width: 900px) {
    .teacher-layout { flex-direction: column; }
    .form-sidebar { width: 100%; position: static; }
    .app-main { padding: 1.25rem; }
  }
`;
function hg() {
  const [c, f] = Wt.useState("teacher"),
    [r, s] = Wt.useState([]),
    [d, h] = Wt.useState(null),
    [g, z] = Wt.useState("TEACHER");
  Wt.useEffect(() => {
    const V = new URLSearchParams(window.location.search).get("mode");
    ((V === "student" || V === "teacher") && f(V),
      window.USER_ROLE && z(window.USER_ROLE));
  }, []);
  const D = (C) => {
      (s(C.questions), h(C.count));
    },
    b = () => {
      (s([]), h(null));
    },
    S = g === "TEACHER";
  return x.jsxs(x.Fragment, {
    children: [
      x.jsx("style", { children: mg }),
      x.jsxs("div", {
        className: "app-shell",
        children: [
          x.jsxs("header", {
            className: "app-topbar",
            children: [
              x.jsxs("a", {
                href: "/",
                className: "app-logo",
                style: { textDecoration: "none" },
                children: ["Exam", x.jsx("span", { children: "Prep" })],
              }),
              x.jsxs("div", {
                className: "mode-tabs",
                children: [
                  x.jsx("button", {
                    className: `mode-tab ${c === "student" ? "active" : "inactive"}`,
                    onClick: () => {
                      (f("student"), b());
                    },
                    children: "🎓 Student",
                  }),
                  x.jsx("button", {
                    className: `mode-tab ${c === "teacher" ? "active" : "inactive"} ${S ? "" : "locked"}`,
                    onClick: () => {
                      S && (f("teacher"), b());
                    },
                    title: S ? "" : "Teachers only",
                    children: "🏫 Teacher",
                  }),
                ],
              }),
              x.jsx("div", {
                className: "topbar-right",
                children: x.jsxs("div", {
                  className: "user-chip",
                  children: [
                    x.jsx("span", { children: "👤" }),
                    x.jsx("span", {
                      className: `role-badge ${S ? "teacher" : "student"}`,
                      children: S ? "Teacher" : "Student",
                    }),
                  ],
                }),
              }),
            ],
          }),
          x.jsxs("main", {
            className: "app-main",
            children: [
              c === "teacher" &&
                S &&
                x.jsxs("div", {
                  className: "teacher-layout",
                  children: [
                    x.jsx("aside", {
                      className: "form-sidebar",
                      children: x.jsx(rg, { onResults: D, onClear: b }),
                    }),
                    x.jsx("div", {
                      className: "results-panel",
                      children:
                        d === null
                          ? x.jsxs("div", {
                              className: "empty-state",
                              children: [
                                x.jsx("div", {
                                  className: "empty-icon",
                                  children: "📋",
                                }),
                                x.jsx("div", {
                                  className: "empty-title",
                                  children: "No questions yet",
                                }),
                                x.jsx("div", {
                                  className: "empty-desc",
                                  children:
                                    "Use the filters on the left to generate a question set.",
                                }),
                              ],
                            })
                          : x.jsxs(x.Fragment, {
                              children: [
                                x.jsxs("div", {
                                  className: "results-header",
                                  children: [
                                    x.jsx("div", {
                                      children: x.jsx("div", {
                                        className: "panel-title",
                                        children: "Generated Questions",
                                      }),
                                    }),
                                    x.jsxs("span", {
                                      className: "results-count",
                                      children: [
                                        "✓ ",
                                        d,
                                        " question",
                                        d !== 1 ? "s" : "",
                                        " found",
                                      ],
                                    }),
                                  ],
                                }),
                                x.jsx(dg, { questions: r }),
                              ],
                            }),
                    }),
                  ],
                }),
              c === "student" &&
                x.jsxs("div", {
                  className: "student-layout",
                  children: [
                    x.jsx("div", {
                      className: "panel-title",
                      children: "Practice Mode",
                    }),
                    x.jsx("p", {
                      className: "panel-sub",
                      children:
                        "Coming soon — timed practice sessions and progress tracking.",
                    }),
                  ],
                }),
            ],
          }),
        ],
      }),
    ],
  });
}
Uy.createRoot(document.getElementById("root")).render(
  x.jsx(Ay.StrictMode, { children: x.jsx(hg, {}) }),
);
