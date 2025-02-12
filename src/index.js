function noop() {}
function isFunction(variable) {
  return !!(variable && variable.constructor && variable.call && variable.apply)
}

export default function (url, opts) {
	opts = opts || {};

	var ws, num=0, timer=1, $={};
	var max = opts.maxAttempts || Infinity;


	$.open = function () {
		var resolveUrl = isFunction(url) ? url(num) : url

		Promise.resolve(resolveUrl).then(function (resolvedURL) {
			ws = new WebSocket(resolvedURL, opts.protocols || []);

			ws.onmessage = opts.onmessage || noop;

			ws.onopen = function (e) {
				(opts.onopen || noop)(e);
				num = 0;
			};

			ws.onclose = function (e) {
				e.code === 1e3 || e.code === 1001 || e.code === 1005 || $.reconnect(e);
				(opts.onclose || noop)(e);
			};

			ws.onerror = function (e) {
				(e && e.code==='ECONNREFUSED') ? $.reconnect(e) : (opts.onerror || noop)(e);
			};
		})
	};

	$.reconnect = function (e) {
		if (timer && num++ < max) {
			timer = setTimeout(function () {
				(opts.onreconnect || noop)(e);
				$.open();
			}, opts.timeout || 1e3);
		} else {
			(opts.onmaximum || noop)(e);
		}
	};

	$.json = function (x) {
		ws.send(JSON.stringify(x));
	};

	$.send = function (x) {
		ws.send(x);
	};

	$.close = function (x, y) {
		timer = clearTimeout(timer);
		ws.close(x || 1e3, y);
	};

	$.open(); // init

	return $;
}
