/**
 * Semver UMD module
 * Copyright (c) Isaac Z. Schlueter and Contributors
 * https://github.com/npm/node-semver
 */

/**
 * DO NOT EDIT THIS FILE
 */

!((e, r) => {
	if ("object" === typeof exports && "object" === typeof module) {
		module.exports = r();
	} else if ("function" === typeof define && define.amd) {
		define([], r);
	} else {
		const t = r();
		for (const n in t) {
			("object" === typeof exports ? exports : e)[n] = t[n];
		}
	}
})("undefined" !== typeof self ? self : this, () =>
	((e) => {
		const r = {};
		function t(n) {
			if (r[n]) {
				return r[n].exports;
			}
			const o = (r[n] = { i: n, l: !1, exports: {} });
			return e[n].call(o.exports, o, o.exports, t), (o.l = !0), o.exports;
		}
		return (
			(t.m = e),
			(t.c = r),
			(t.d = (e, r, n) => {
				t.o(e, r) ||
					Object.defineProperty(e, r, { enumerable: !0, get: n });
			}),
			(t.r = (e) => {
				"undefined" !== typeof Symbol &&
					Symbol.toStringTag &&
					Object.defineProperty(e, Symbol.toStringTag, {
						value: "Module",
					}),
					Object.defineProperty(e, "__esModule", { value: !0 });
			}),
			(t.t = (e, r) => {
				if ((1 & r && (e = t(e)), 8 & r)) {
					return e;
				}
				if (4 & r && "object" === typeof e && e && e.__esModule) {
					return e;
				}
				const n = Object.create(null);
				if (
					(t.r(n),
					Object.defineProperty(n, "default", {
						enumerable: !0,
						value: e,
					}),
					2 & r && "string" !== typeof e)
				) {
					for (const o in e) {
						t.d(n, o, (r) => e[r].bind(null, o));
					}
				}
				return n;
			}),
			(t.n = (e) => {
				const r = e?.__esModule ? () => e.default : () => e;
				return t.d(r, "a", r), r;
			}),
			(t.o = (e, r) => Object.prototype.hasOwnProperty.call(e, r)),
			(t.p = ""),
			t((t.s = 0))
		);
	})([
		function (e, r, t) {
			((t) => {
				let n;
				(r = e.exports = H),
					(n =
						"object" === typeof t &&
						t.env &&
						t.env.NODE_DEBUG &&
						/\bsemver\b/i.test(t.env.NODE_DEBUG)
							? () => {
									const e = Array.prototype.slice.call(
										arguments,
										0,
									);
									e.unshift("SEMVER"),
										console.log.apply(console, e);
							  }
							: () => {}),
					(r.SEMVER_SPEC_VERSION = "2.0.0");
				const o = 256;
				const i = Number.MAX_SAFE_INTEGER || 9007199254740991;
				const s = (r.re = []);
				const a = (r.src = []);
				let u = 0;
				const c = u++;
				a[c] = "0|[1-9]\\d*";
				const p = u++;
				a[p] = "[0-9]+";
				const f = u++;
				a[f] = "\\d*[a-zA-Z-][a-zA-Z0-9-]*";
				const l = u++;
				a[l] = `(${a[c]})\\.(${a[c]})\\.(${a[c]})`;
				const h = u++;
				a[h] = `(${a[p]})\\.(${a[p]})\\.(${a[p]})`;
				const v = u++;
				a[v] = `(?:${a[c]}|${a[f]})`;
				const m = u++;
				a[m] = `(?:${a[p]}|${a[f]})`;
				const w = u++;
				a[w] = `(?:-(${a[v]}(?:\\.${a[v]})*))`;
				const g = u++;
				a[g] = `(?:-?(${a[m]}(?:\\.${a[m]})*))`;
				const y = u++;
				a[y] = "[0-9A-Za-z-]+";
				const d = u++;
				a[d] = `(?:\\+(${a[y]}(?:\\.${a[y]})*))`;
				const b = u++;
				const j = `v?${a[l]}${a[w]}?${a[d]}?`;
				a[b] = `^${j}$`;
				const E = `[v=\\s]*${a[h]}${a[g]}?${a[d]}?`;
				const T = u++;
				a[T] = `^${E}$`;
				const x = u++;
				a[x] = "((?:<|>)?=?)";
				const $ = u++;
				a[$] = `${a[p]}|x|X|\\*`;
				const k = u++;
				a[k] = `${a[c]}|x|X|\\*`;
				const S = u++;
				a[
					S
				] = `[v=\\s]*(${a[k]})(?:\\.(${a[k]})(?:\\.(${a[k]})(?:${a[w]})?${a[d]}?)?)?`;
				const R = u++;
				a[
					R
				] = `[v=\\s]*(${a[$]})(?:\\.(${a[$]})(?:\\.(${a[$]})(?:${a[g]})?${a[d]}?)?)?`;
				const I = u++;
				a[I] = `^${a[x]}\\s*${a[S]}$`;
				const _ = u++;
				a[_] = `^${a[x]}\\s*${a[R]}$`;
				const O = u++;
				a[O] =
					"(?:^|[^\\d])(\\d{1,16})(?:\\.(\\d{1,16}))?(?:\\.(\\d{1,16}))?(?:$|[^\\d])";
				const A = u++;
				a[A] = "(?:~>?)";
				const M = u++;
				(a[M] = `(\\s*)${a[A]}\\s+`), (s[M] = new RegExp(a[M], "g"));
				const V = u++;
				a[V] = `^${a[A]}${a[S]}$`;
				const P = u++;
				a[P] = `^${a[A]}${a[R]}$`;
				const C = u++;
				a[C] = "(?:\\^)";
				const L = u++;
				(a[L] = `(\\s*)${a[C]}\\s+`), (s[L] = new RegExp(a[L], "g"));
				const N = u++;
				a[N] = `^${a[C]}${a[S]}$`;
				const q = u++;
				a[q] = `^${a[C]}${a[R]}$`;
				const D = u++;
				a[D] = `^${a[x]}\\s*(${E})$|^$`;
				const X = u++;
				a[X] = `^${a[x]}\\s*(${j})$|^$`;
				const z = u++;
				(a[z] = `(\\s*)${a[x]}\\s*(${E}|${a[S]})`),
					(s[z] = new RegExp(a[z], "g"));
				const G = u++;
				a[G] = `^\\s*(${a[S]})\\s+-\\s+(${a[S]})\\s*$`;
				const Z = u++;
				a[Z] = `^\\s*(${a[R]})\\s+-\\s+(${a[R]})\\s*$`;
				const B = u++;
				a[B] = "(<|>)?=?\\s*\\*";
				for (let U = 0; U < 35; U++) {
					n(U, a[U]), s[U] || (s[U] = new RegExp(a[U]));
				}
				function F(e, r) {
					if (e instanceof H) {
						return e;
					}
					if ("string" !== typeof e) {
						return null;
					}
					if (e.length > o) {
						return null;
					}
					if (!(r ? s[T] : s[b]).test(e)) {
						return null;
					}
					try {
						return new H(e, r);
					} catch (e) {
						return null;
					}
				}
				function H(e, r) {
					if (e instanceof H) {
						if (e.loose === r) {
							return e;
						}
						e = e.version;
					} else if ("string" !== typeof e) {
						throw new TypeError(`Invalid Version: ${e}`);
					}
					if (e.length > o) {
						throw new TypeError(
							`version is longer than ${o} characters`,
						);
					}
					if (!(this instanceof H)) {
						return new H(e, r);
					}
					n("SemVer", e, r), (this.loose = r);
					const t = e.trim().match(r ? s[T] : s[b]);
					if (!t) {
						throw new TypeError(`Invalid Version: ${e}`);
					}
					if (
						((this.raw = e),
						(this.major = +t[1]),
						(this.minor = +t[2]),
						(this.patch = +t[3]),
						this.major > i || this.major < 0)
					) {
						throw new TypeError("Invalid major version");
					}
					if (this.minor > i || this.minor < 0) {
						throw new TypeError("Invalid minor version");
					}
					if (this.patch > i || this.patch < 0) {
						throw new TypeError("Invalid patch version");
					}
					t[4]
						? (this.prerelease = t[4].split(".").map((e) => {
								if (/^[0-9]+$/.test(e)) {
									const r = +e;
									if (r >= 0 && r < i) {
										return r;
									}
								}
								return e;
						  }))
						: (this.prerelease = []),
						(this.build = t[5] ? t[5].split(".") : []),
						this.format();
				}
				(r.parse = F),
					(r.valid = (e, r) => {
						const t = F(e, r);
						return t ? t.version : null;
					}),
					(r.clean = (e, r) => {
						const t = F(e.trim().replace(/^[=v]+/, ""), r);
						return t ? t.version : null;
					}),
					(r.SemVer = H),
					(H.prototype.format = function () {
						return (
							(this.version = `${this.major}.${this.minor}.${this.patch}`),
							this.prerelease.length &&
								(this.version += `-${this.prerelease.join(
									".",
								)}`),
							this.version
						);
					}),
					(H.prototype.toString = function () {
						return this.version;
					}),
					(H.prototype.compare = function (e) {
						return (
							n("SemVer.compare", this.version, this.loose, e),
							e instanceof H || (e = new H(e, this.loose)),
							this.compareMain(e) || this.comparePre(e)
						);
					}),
					(H.prototype.compareMain = function (e) {
						return (
							e instanceof H || (e = new H(e, this.loose)),
							K(this.major, e.major) ||
								K(this.minor, e.minor) ||
								K(this.patch, e.patch)
						);
					}),
					(H.prototype.comparePre = function (e) {
						if (
							(e instanceof H || (e = new H(e, this.loose)),
							this.prerelease.length && !e.prerelease.length)
						) {
							return -1;
						}
						if (!this.prerelease.length && e.prerelease.length) {
							return 1;
						}
						if (!(this.prerelease.length || e.prerelease.length)) {
							return 0;
						}
						let r = 0;
						do {
							const t = this.prerelease[r];
							const o = e.prerelease[r];
							if (
								(n("prerelease compare", r, t, o),
								void 0 === t && void 0 === o)
							) {
								return 0;
							}
							if (void 0 === o) {
								return 1;
							}
							if (void 0 === t) {
								return -1;
							}
							if (t !== o) {
								return K(t, o);
							}
						} while (++r);
					}),
					(H.prototype.inc = function (e, r) {
						switch (e) {
							case "premajor": {
								(this.prerelease.length = 0),
									(this.patch = 0),
									(this.minor = 0),
									this.major++,
									this.inc("pre", r);
								break;
							}
							case "preminor": {
								(this.prerelease.length = 0),
									(this.patch = 0),
									this.minor++,
									this.inc("pre", r);
								break;
							}
							case "prepatch": {
								(this.prerelease.length = 0),
									this.inc("patch", r),
									this.inc("pre", r);
								break;
							}
							case "prerelease": {
								0 === this.prerelease.length &&
									this.inc("patch", r),
									this.inc("pre", r);
								break;
							}
							case "major": {
								(0 === this.minor &&
									0 === this.patch &&
									0 !== this.prerelease.length) ||
									this.major++,
									(this.minor = 0),
									(this.patch = 0),
									(this.prerelease = []);
								break;
							}
							case "minor": {
								(0 === this.patch &&
									0 !== this.prerelease.length) ||
									this.minor++,
									(this.patch = 0),
									(this.prerelease = []);
								break;
							}
							case "patch": {
								0 === this.prerelease.length && this.patch++,
									(this.prerelease = []);
								break;
							}
							case "pre": {
								if (0 === this.prerelease.length) {
									this.prerelease = [0];
								} else {
									for (
										let t = this.prerelease.length;
										--t >= 0;
									) {
										"number" ===
											typeof this.prerelease[t] &&
											(this.prerelease[t]++, (t = -2));
									}
									-1 === t && this.prerelease.push(0);
								}
								r &&
									(this.prerelease[0] === r
										? Number.isNaN(this.prerelease[1]) &&
										  (this.prerelease = [r, 0])
										: (this.prerelease = [r, 0]));
								break;
							}
							default:
								throw new Error(
									`invalid increment argument: ${e}`,
								);
						}
						return this.format(), (this.raw = this.version), this;
					}),
					(r.inc = (e, r, t, n) => {
						"string" === typeof t && ((n = t), (t = void 0));
						try {
							return new H(e, t).inc(r, n).version;
						} catch (e) {
							return null;
						}
					}),
					(r.diff = (e, r) => {
						if (ee(e, r)) {
							return null;
						}
						const t = F(e);
						const n = F(r);
						if (t.prerelease.length || n.prerelease.length) {
							for (const o in t) {
								if (
									("major" === o ||
										"minor" === o ||
										"patch" === o) &&
									t[o] !== n[o]
								) {
									return `pre${o}`;
								}
							}
							return "prerelease";
						}
						for (const o in t) {
							if (
								("major" === o ||
									"minor" === o ||
									"patch" === o) &&
								t[o] !== n[o]
							) {
								return o;
							}
						}
					}),
					(r.compareIdentifiers = K);
				const J = /^[0-9]+$/;
				function K(e, r) {
					const t = J.test(e);
					const n = J.test(r);
					return (
						t && n && ((e = +e), (r = +r)),
						t && !n ? -1 : n && !t ? 1 : e < r ? -1 : e > r ? 1 : 0
					);
				}
				function Q(e, r, t) {
					return new H(e, t).compare(new H(r, t));
				}
				function W(e, r, t) {
					return Q(e, r, t) > 0;
				}
				function Y(e, r, t) {
					return Q(e, r, t) < 0;
				}
				function ee(e, r, t) {
					return 0 === Q(e, r, t);
				}
				function re(e, r, t) {
					return 0 !== Q(e, r, t);
				}
				function te(e, r, t) {
					return Q(e, r, t) >= 0;
				}
				function ne(e, r, t) {
					return Q(e, r, t) <= 0;
				}
				function oe(e, r, t, n) {
					let o;
					switch (r) {
						case "===": {
							"object" === typeof e && (e = e.version),
								"object" === typeof t && (t = t.version),
								(o = e === t);
							break;
						}
						case "!==": {
							"object" === typeof e && (e = e.version),
								"object" === typeof t && (t = t.version),
								(o = e !== t);
							break;
						}
						case "":
						case "=":
						case "==": {
							o = ee(e, t, n);
							break;
						}
						case "!=": {
							o = re(e, t, n);
							break;
						}
						case ">": {
							o = W(e, t, n);
							break;
						}
						case ">=": {
							o = te(e, t, n);
							break;
						}
						case "<": {
							o = Y(e, t, n);
							break;
						}
						case "<=": {
							o = ne(e, t, n);
							break;
						}
						default:
							throw new TypeError(`Invalid operator: ${r}`);
					}
					return o;
				}
				function ie(e, r) {
					if (e instanceof ie) {
						if (e.loose === r) {
							return e;
						}
						e = e.value;
					}
					if (!(this instanceof ie)) {
						return new ie(e, r);
					}
					n("comparator", e, r),
						(this.loose = r),
						this.parse(e),
						this.semver === se
							? (this.value = "")
							: (this.value =
									this.operator + this.semver.version),
						n("comp", this);
				}
				(r.rcompareIdentifiers = (e, r) => K(r, e)),
					(r.major = (e, r) => new H(e, r).major),
					(r.minor = (e, r) => new H(e, r).minor),
					(r.patch = (e, r) => new H(e, r).patch),
					(r.compare = Q),
					(r.compareLoose = (e, r) => Q(e, r, !0)),
					(r.rcompare = (e, r, t) => Q(r, e, t)),
					(r.sort = (e, t) => e.sort((e, n) => r.compare(e, n, t))),
					(r.rsort = (e, t) => e.sort((e, n) => r.rcompare(e, n, t))),
					(r.gt = W),
					(r.lt = Y),
					(r.eq = ee),
					(r.neq = re),
					(r.gte = te),
					(r.lte = ne),
					(r.cmp = oe),
					(r.Comparator = ie);
				const se = {};
				function ae(e, r) {
					if (e instanceof ae) {
						return e.loose === r ? e : new ae(e.raw, r);
					}
					if (e instanceof ie) {
						return new ae(e.value, r);
					}
					if (!(this instanceof ae)) {
						return new ae(e, r);
					}
					if (
						((this.loose = r),
						(this.raw = e),
						(this.set = e
							.split(/\s*\|\|\s*/)
							.map(function (e) {
								return this.parseRange(e.trim());
							}, this)
							.filter((e) => e.length)),
						!this.set.length)
					) {
						throw new TypeError(`Invalid SemVer Range: ${e}`);
					}
					this.format();
				}
				function ue(e) {
					return !e || "x" === e.toLowerCase() || "*" === e;
				}
				function ce(e, r, t, n, o, i, s, a, u, c, p, f, l) {
					return `${(r = ue(t)
						? ""
						: ue(n)
						  ? `>=${t}.0.0`
						  : ue(o)
							  ? `>=${t}.${n}.0`
							  : `>=${r}`)} ${(a = ue(u)
						? ""
						: ue(c)
						  ? `<${+u}${1}.0.0`
						  : ue(p)
							  ? `<${u}.${+c}${1}.0`
							  : f
								  ? `<=${u}.${c}.${p}-${f}`
								  : `<=${a}`)}`.trim();
				}
				function pe(e, r) {
					for (let t = 0; t < e.length; t++) {
						if (!e[t].test(r)) {
							return !1;
						}
					}
					if (r.prerelease.length) {
						for (t = 0; t < e.length; t++) {
							if (
								(n(e[t].semver),
								e[t].semver !== se &&
									e[t].semver.prerelease.length > 0)
							) {
								const o = e[t].semver;
								if (
									o.major === r.major &&
									o.minor === r.minor &&
									o.patch === r.patch
								) {
									return !0;
								}
							}
						}
						return !1;
					}
					return !0;
				}
				function fe(e, r, t) {
					try {
						r = new ae(r, t);
					} catch (e) {
						return !1;
					}
					return r.test(e);
				}
				function le(e, r, t, n) {
					let o;
					let i;
					let s;
					let a;
					let u;
					switch (((e = new H(e, n)), (r = new ae(r, n)), t)) {
						case ">": {
							(o = W), (i = ne), (s = Y), (a = ">"), (u = ">=");
							break;
						}
						case "<": {
							(o = Y), (i = te), (s = W), (a = "<"), (u = "<=");
							break;
						}
						default:
							throw new TypeError(
								'Must provide a hilo val of "<" or ">"',
							);
					}
					if (fe(e, r, n)) {
						return !1;
					}
					for (let c = 0; c < r.set.length; ++c) {
						const p = r.set[c];
						let f = null;
						let l = null;
						if (
							(p.forEach((e) => {
								e.semver === se && (e = new ie(">=0.0.0")),
									(f = f || e),
									(l = l || e),
									o(e.semver, f.semver, n)
										? (f = e)
										: s(e.semver, l.semver, n) && (l = e);
							}),
							f.operator === a || f.operator === u)
						) {
							return !1;
						}
						if (
							(!l.operator || l.operator === a) &&
							i(e, l.semver)
						) {
							return !1;
						}
						if (l.operator === u && s(e, l.semver)) {
							return !1;
						}
					}
					return !0;
				}
				(ie.prototype.parse = function (e) {
					const r = this.loose ? s[D] : s[X];
					const t = e.match(r);
					if (!t) {
						throw new TypeError(`Invalid comparator: ${e}`);
					}
					(this.operator = t[1]),
						"=" === this.operator && (this.operator = ""),
						t[2]
							? (this.semver = new H(t[2], this.loose))
							: (this.semver = se);
				}),
					(ie.prototype.toString = function () {
						return this.value;
					}),
					(ie.prototype.test = function (e) {
						return (
							n("Comparator.test", e, this.loose),
							this.semver === se ||
								("string" === typeof e &&
									(e = new H(e, this.loose)),
								oe(e, this.operator, this.semver, this.loose))
						);
					}),
					(ie.prototype.intersects = function (e, r) {
						if (!(e instanceof ie)) {
							throw new TypeError("a Comparator is required");
						}
						let t;
						if ("" === this.operator) {
							return (
								(t = new ae(e.value, r)), fe(this.value, t, r)
							);
						}
						if ("" === e.operator) {
							return (
								(t = new ae(this.value, r)), fe(e.semver, t, r)
							);
						}
						const n = !(
							(">=" !== this.operator && ">" !== this.operator) ||
							(">=" !== e.operator && ">" !== e.operator)
						);
						const o = !(
							("<=" !== this.operator && "<" !== this.operator) ||
							("<=" !== e.operator && "<" !== e.operator)
						);
						const i = this.semver.version === e.semver.version;
						const s = !(
							(">=" !== this.operator &&
								"<=" !== this.operator) ||
							(">=" !== e.operator && "<=" !== e.operator)
						);
						const a =
							oe(this.semver, "<", e.semver, r) &&
							(">=" === this.operator || ">" === this.operator) &&
							("<=" === e.operator || "<" === e.operator);
						const u =
							oe(this.semver, ">", e.semver, r) &&
							("<=" === this.operator || "<" === this.operator) &&
							(">=" === e.operator || ">" === e.operator);
						return n || o || (i && s) || a || u;
					}),
					(r.Range = ae),
					(ae.prototype.format = function () {
						return (
							(this.range = this.set
								.map((e) => e.join(" ").trim())
								.join("||")
								.trim()),
							this.range
						);
					}),
					(ae.prototype.toString = function () {
						return this.range;
					}),
					(ae.prototype.parseRange = function (e) {
						const r = this.loose;
						(e = e.trim()), n("range", e, r);
						const t = r ? s[Z] : s[G];
						(e = e.replace(t, ce)),
							n("hyphen replace", e),
							(e = e.replace(s[z], "$1$2$3")),
							n("comparator trim", e, s[z]),
							(e = (e = (e = e.replace(s[M], "$1~")).replace(
								s[L],
								"$1^",
							))
								.split(/\s+/)
								.join(" "));
						const o = r ? s[D] : s[X];
						let i = e
							.split(" ")
							.map((e) =>
								((e, r) => (
									n("comp", e),
									(e = ((e, r) =>
										e
											.trim()
											.split(/\s+/)
											.map((e) =>
												((e, r) => {
													n("caret", e, r);
													const t = r ? s[q] : s[N];
													return e.replace(
														t,
														(r, t, o, i, s) => {
															let a;
															return (
																n(
																	"caret",
																	e,
																	r,
																	t,
																	o,
																	i,
																	s,
																),
																ue(t)
																	? (a = "")
																	: ue(o)
																	  ? (a = `>=${t}.0.0 <${+t}${1}.0.0`)
																	  : ue(i)
																		  ? (a =
																					"0" ===
																					t
																						? `>=${t}.${o}.0 <${t}.${+o}${1}.0`
																						: `>=${t}.${o}.0 <${+t}${1}.0.0`)
																		  : s
																			  ? (n(
																						"replaceCaret pr",
																						s,
																				  ),
																				  "-" !==
																						s.charAt(
																							0,
																						) &&
																						(s = `-${s}`),
																				  (a =
																						"0" ===
																						t
																							? "0" ===
																							  o
																								? `>=${t}.${o}.${i}${s} <${t}.${o}.${+i}${1}`
																								: `>=${t}.${o}.${i}${s} <${t}.${+o}${1}.0`
																							: `>=${t}.${o}.${i}${s} <${+t}${1}.0.0`))
																			  : (n(
																						"no pr",
																				  ),
																				  (a =
																						"0" ===
																						t
																							? "0" ===
																							  o
																								? `>=${t}.${o}.${i} <${t}.${o}.${+i}${1}`
																								: `>=${t}.${o}.${i} <${t}.${+o}${1}.0`
																							: `>=${t}.${o}.${i} <${+t}${1}.0.0`)),
																n(
																	"caret return",
																	a,
																),
																a
															);
														},
													);
												})(e, r),
											)
											.join(" "))(e, r)),
									n("caret", e),
									(e = ((e, r) =>
										e
											.trim()
											.split(/\s+/)
											.map((e) =>
												((e, r) => {
													const t = r ? s[P] : s[V];
													return e.replace(
														t,
														(r, t, o, i, s) => {
															let a;
															return (
																n(
																	"tilde",
																	e,
																	r,
																	t,
																	o,
																	i,
																	s,
																),
																ue(t)
																	? (a = "")
																	: ue(o)
																	  ? (a = `>=${t}.0.0 <${+t}${1}.0.0`)
																	  : ue(i)
																		  ? (a = `>=${t}.${o}.0 <${t}.${+o}${1}.0`)
																		  : s
																			  ? (n(
																						"replaceTilde pr",
																						s,
																				  ),
																				  "-" !==
																						s.charAt(
																							0,
																						) &&
																						(s = `-${s}`),
																				  (a = `>=${t}.${o}.${i}${s} <${t}.${+o}${1}.0`))
																			  : (a = `>=${t}.${o}.${i} <${t}.${+o}${1}.0`),
																n(
																	"tilde return",
																	a,
																),
																a
															);
														},
													);
												})(e, r),
											)
											.join(" "))(e, r)),
									n("tildes", e),
									(e = ((e, r) => (
										n("replaceXRanges", e, r),
										e
											.split(/\s+/)
											.map((e) =>
												((e, r) => {
													e = e.trim();
													const t = r ? s[_] : s[I];
													return e.replace(
															t,
															(
																r,
																t,
																o,
																i,
																s,
																a,
															) => {
																n(
																	"xRange",
																	e,
																	r,
																	t,
																	o,
																	i,
																	s,
																	a,
																);
																const u = ue(o);
																const c =
																		u ||
																		ue(i);
																const p =
																		c ||
																		ue(s);
																return (
																	"=" === t &&
																		p &&
																		(t =
																			""),
																	u
																		? (r =
																				">" ===
																					t ||
																				"<" ===
																					t
																					? "<0.0.0"
																					: "*")
																		: t && p
																		  ? (c &&
																					(i = 0),
																			  p &&
																					(s = 0),
																			  ">" ===
																			  t
																					? ((t =
																							">="),
																					  c
																							? ((o =
																									+o +
																									1),
																							  (i = 0),
																							  (s = 0))
																							: p &&
																							  ((i =
																									+i +
																									1),
																							  (s = 0)))
																					: "<=" ===
																							t &&
																					  ((t =
																							"<"),
																					  c
																							? (o =
																									+o +
																									1)
																							: (i =
																									+i +
																									1)),
																			  (r =
																					`${t +
																					o}.${i}.${s}`))
																		  : c
																			  ? (r =
																						`>=${o}.0.0 <${+o}${1}.0.0`)
																			  : p &&
																				  (r =
																						`>=${o}.${i}.0 <${o}.${+i}${1}.0`),
																	n(
																		"xRange return",
																		r,
																	),
																	r
																);
															},
														);
												})(e, r),
											)
											.join(" ")
									))(e, r)),
									n("xrange", e),
									(e = ((e, r) => (
										n("replaceStars", e, r),
										e.trim().replace(s[B], "")
									))(e, r)),
									n("stars", e),
									e
								))(e, r),
							)
							.join(" ")
							.split(/\s+/);
						return (
							this.loose && (i = i.filter((e) => !!e.match(o))),
							(i = i.map((e) => new ie(e, r)))
						);
					}),
					(ae.prototype.intersects = function (e, r) {
						if (!(e instanceof ae)) {
							throw new TypeError("a Range is required");
						}
						return this.set.some((t) =>
							t.every((t) =>
								e.set.some((e) =>
									e.every((e) => t.intersects(e, r)),
								),
							),
						);
					}),
					(r.toComparators = (e, r) =>
						new ae(e, r).set.map((e) =>
							e
								.map((e) => e.value)
								.join(" ")
								.trim()
								.split(" "),
						)),
					(ae.prototype.test = function (e) {
						if (!e) {
							return !1;
						}
						"string" === typeof e && (e = new H(e, this.loose));
						for (let r = 0; r < this.set.length; r++) {
							if (pe(this.set[r], e)) {
								return !0;
							}
						}
						return !1;
					}),
					(r.satisfies = fe),
					(r.maxSatisfying = (e, r, t) => {
						let n = null;
						let o = null;
						try {
							const i = new ae(r, t);
						} catch (e) {
							return null;
						}
						return (
							e.forEach((e) => {
								i.test(e) &&
									((n && -1 !== o.compare(e)) ||
										(o = new H((n = e), t)));
							}),
							n
						);
					}),
					(r.minSatisfying = (e, r, t) => {
						let n = null;
						let o = null;
						try {
							const i = new ae(r, t);
						} catch (e) {
							return null;
						}
						return (
							e.forEach((e) => {
								i.test(e) &&
									((n && 1 !== o.compare(e)) ||
										(o = new H((n = e), t)));
							}),
							n
						);
					}),
					(r.validRange = (e, r) => {
						try {
							return new ae(e, r).range || "*";
						} catch (e) {
							return null;
						}
					}),
					(r.ltr = (e, r, t) => le(e, r, "<", t)),
					(r.gtr = (e, r, t) => le(e, r, ">", t)),
					(r.outside = le),
					(r.prerelease = (e, r) => {
						const t = F(e, r);
						return t?.prerelease.length ? t.prerelease : null;
					}),
					(r.intersects = (e, r, t) => (
						(e = new ae(e, t)), (r = new ae(r, t)), e.intersects(r)
					)),
					(r.coerce = (e) => {
						if (e instanceof H) {
							return e;
						}
						if ("string" !== typeof e) {
							return null;
						}
						const r = e.match(s[O]);
						return null == r
							? null
							: F(`${r[1] || "0"}.${r[2] || "0"}.${r[3] || "0"}`);
					});
			}).call(this, t(1));
		},
		(e, r) => {
			let t;
			let n;
			const o = (e.exports = {});
			function i() {
				throw new Error("setTimeout has not been defined");
			}
			function s() {
				throw new Error("clearTimeout has not been defined");
			}
			function a(e) {
				if (t === setTimeout) {
					return setTimeout(e, 0);
				}
				if ((t === i || !t) && setTimeout) {
					return (t = setTimeout), setTimeout(e, 0);
				}
				try {
					return t(e, 0);
				} catch (r) {
					try {
						return t.call(null, e, 0);
					} catch (r) {
						return t.call(this, e, 0);
					}
				}
			}
			!(() => {
				try {
					t = "function" === typeof setTimeout ? setTimeout : i;
				} catch (e) {
					t = i;
				}
				try {
					n = "function" === typeof clearTimeout ? clearTimeout : s;
				} catch (e) {
					n = s;
				}
			})();
			let u;
			let c = [];
			let p = !1;
			let f = -1;
			function l() {
				p &&
					u &&
					((p = !1),
					u.length ? (c = u.concat(c)) : (f = -1),
					c.length && h());
			}
			function h() {
				if (!p) {
					const e = a(l);
					p = !0;
					for (let r = c.length; r; ) {
						for (u = c, c = []; ++f < r; ) {
							u?.[f].run();
						}
						(f = -1), (r = c.length);
					}
					(u = null),
						(p = !1),
						(function (e) {
							if (n === clearTimeout) {
								return clearTimeout(e);
							}
							if ((n === s || !n) && clearTimeout) {
								return (n = clearTimeout), clearTimeout(e);
							}
							try {
								n(e);
							} catch (r) {
								try {
									return n.call(null, e);
								} catch (r) {
									return n.call(this, e);
								}
							}
						})(e);
				}
			}
			function v(e, r) {
				(this.fun = e), (this.array = r);
			}
			function m() {}
			(o.nextTick = (e) => {
				const r = new Array(arguments.length - 1);
				if (arguments.length > 1) {
					for (let t = 1; t < arguments.length; t++) {
						r[t - 1] = arguments[t];
					}
				}
				c.push(new v(e, r)), 1 !== c.length || p || a(h);
			}),
				(v.prototype.run = function () {
					this.fun.apply(null, this.array);
				}),
				(o.title = "browser"),
				(o.browser = !0),
				(o.env = {}),
				(o.argv = []),
				(o.version = ""),
				(o.versions = {}),
				(o.on = m),
				(o.addListener = m),
				(o.once = m),
				(o.off = m),
				(o.removeListener = m),
				(o.removeAllListeners = m),
				(o.emit = m),
				(o.prependListener = m),
				(o.prependOnceListener = m),
				(o.listeners = (e) => []),
				(o.binding = (e) => {
					throw new Error("process.binding is not supported");
				}),
				(o.cwd = () => "/"),
				(o.chdir = (e) => {
					throw new Error("process.chdir is not supported");
				}),
				(o.umask = () => 0);
		},
	]),
);
