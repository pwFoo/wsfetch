/*
MIT License

Copyright (c) 2017 Simon Y. Blackwell

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */
(function() {
	const scope = this;
	class Response {
		constructor(data) {
			const me = this,
				status = parseInt(data.statusCode);
			Object.keys(data).forEach((key) => {
				me[key] = data[key];
			})
			Object.keys(me.headers).forEach((key) => {
				const lower = key.toLowerCase();
				if(lower!==key) {
					me.headers[lower] = me.headers[key];
					delete me.headers[key];
				}
			});
			this.ok = (status>=200 && status<400 ? true : false);
			Object.freeze(me);
		}
		text() { return Promise.resolve(this.body.toString()); }
		json() { return Promise.resolve(JSON.parse(this.body.toString())); }
		exec() { return Promise.resolve(new Function("return " + this.body)()); }
		blob() { return Promise.resolve(new Blob(this.body,{type: this.headers["content-type"]})); }
		valueOf() { return this.body };
	}
	WebSocket.prototype.ready = function() {
		const me = this;
		return new Promise((resolve,reject) => {
			me.addEventListener("open",(event) => {
				
			});
			me.addEventListener("message",(message) => {
				if(typeof(message.data)==="string" && !scope.msgpack) {
					(new Function(message.data)).call(scope);
					resolve();
				} else {
					const fileReader = new FileReader();
					fileReader.onload = function(progressEvent) {
					    const arrayBufferNew = this.result,
					    	uint8ArrayNew  = new Uint8Array(arrayBufferNew),
					    	response = new Response(scope.msgpack.decode(uint8ArrayNew));
					    if(me.messages[response.messageid]) {
					    	me.messages[response.messageid](response);
							delete me.messages[response.messageid];
						}
					}
					fileReader.readAsArrayBuffer(message.data);
				}
			});
		});
	};
	WebSocket.prototype.fetch = function(url,options={method:"get"}) {
		let me = this,
			location = document.createElement("a"),
			resolver,
			rejector,
			promise = new Promise((resolve,reject) => {
				resolver = resolve;
				rejector = reject;
			}),
			id =  ((Math.random()*Math.random())+"").split(".")[1];
		me.messages || (me.messages = {});
		me.messages[id] = resolver;
		location.href = url;
		me.send(scope.msgpack.encode({url:location.pathname,method:options.method,headers:options.headers,body:options.body,messageid:id}));
		return promise;
	}
}).call(this);