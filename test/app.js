const http = require("http"),
	fs = require("fs"),
	path = require("path"),
	WebSocket = require("ws"),
	wsfetch = require("../src/server.js"),
	server = http.createServer((request,response) => {
		const fpath = path.join(process.cwd(),request.url);
		fs.readFile(fpath,(error,content) => {
			if(content) {
				response.writeHead(200);
				response.end(content.toString(), "utf-8");
			} else {
				response.writeHead(404,"Not Found");
			}
            
		});
	});
server.listen(3000,"localhost");
const wss = new WebSocket.Server({server});
wsfetch(wss,(request,response) => {
	console.log(request);
	const fpath = path.join(process.cwd(),request.url);
	console.log(fpath);
	fs.readFile(fpath,(error,content) => {
		if(content) {
			response.writeHead(200);
			response.end(content.toString(), "utf-8");
		} else {
			response.writeHead(404,"Not Found");
			response.end();
		}
	});
});