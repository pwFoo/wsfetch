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
	const fs = require("fs"),
		msgpack = require("msgpack-lite"),
		mimeTypes = {
			"css": "text/css",
			"gzip": "application/gzip",
			"gif": "image/gif",
			"htm": "text/html",
			"html": "text/html",
			"ico": "image/x-icon",
			"jpg": "image/jpeg",
			"jpeg": "image/jpeg",
			"js": "application/javascript",
			"json": "application/json",
			"md": "text/markdown",
			"mp4": "video/mp4",
			"mp4v": "video/mp4",
			"mpg4": "video/mp4",
			"mpg": "video/mpeg",
			"mpeg": "video/mpeg",
			"pdf": "applicaion/pdf",
			"png": "image/png",
			"txt": "text/plain",
			"wsdl": "application/wsdl+xml",
			"xml": "application/xml",
			"xsl": "application/xml"
		},
		msgpackmin = fs.readFileSync("./node_modules/msgpack-lite/dist/msgpack.min.js").toString();
	class Response {
		constructor(ws) {
			Object.defineProperty(this,"ws",{enumerable:false,value:ws});
			this.statusCode = "200";
			this.statusText = "OK";
			this.redirected = false;
			this.headers = {};
		}
		end(value,encoding) {
			if(!!value) {
				if(this.body) {
					this.body = Buffer.concat([this.body,Buffer.from(value,encoding)]);
				} else {
					this.body = Buffer.from(value,encoding)
				}
			}
			this.ws.send(msgpack.encode(this));
		}
		setHeader(key,value) {
			this.headers[key] = value;
		}
		write(value,encoding) {
			if(this.body) {
				this.body = Buffer.concat([this.body,Buffer.from(value,encoding)]);
			} else {
				this.body = Buffer.from(value,encoding)
			}
		}
		writeHead(statusCode) {
			const me = this;
			this.statusCode = statusCode;
			const headers = (arguments.length===3 ? arguments[2] : (arguments.length==2 && typeof(arguments[1])==="object") ? arguments[1] : {});
			Object.keys(headers).forEach((key) => {
				me[key] = headers[key];
			});
			if(typeof(arguments[1])==="string") {
				me.statusText = arguments[1];
			}
		}
	}
	module.exports = (wss,handler,contentTypes={}) => {
		wss.on("connection", (ws) => {
			ws.send(msgpackmin);
			ws.on("message", (message) => {
				const request = msgpack.decode(message),
					response = new Response(ws);
				request.headers || (request.headers={});
				response.messageid = request.messageid;
				if(request.url) {
					const parts = request.url.split("."),
						ext = parts[parts.length-1],
						ct = contentTypes[ext] || mimeTypes[ext];
					if(ct) {
						response.setHeader("Content-Type",ct);
					}
				}
				response.url = request.url;
				handler(request,response);
			});
		});
	}
}).call(this);

