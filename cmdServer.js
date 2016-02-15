/*
 * This is a node command agent server. This is a 2 part project.
 * This agent runs in the targeted computer in daemon mode, and waits
 * for the control server to execute command. It uses encryption commands
 * to keep the data transfer safe.
 * 
 * It has to be run in adminstrative mode or root mode.
 * 
 * Currently this can handle native commands only.
 * Planning to execute js codes using sandbox as well.
 * 
 * 
 * @author Bismay K Mohapatra bismay4u@gmail.com
 * @version 3.0
 * */
var crypto = require('crypto');
var cluster = require('cluster');
var os = require("os");

var masterIP="127.0.0.1";
var hostPort=8090;

var algorithm = 'aes-128-cbc';
var password="qwertyuiopqwieuu";
var iv="0123456789123456";
var exitCode="bkm";

var closeOnExit=false;

function Server() {
	var cmdServer=this;
	var password = 'abcdefghijklmnop';
	var enableEncrypt=true;
	
	this.start=function(host, port, pwd) {
		this.password=pwd;
		this.enableEncrypt=true;
		
		if(host==null || port==null) {
			console.error("HOST/PORT Not Defined");
			process.exit();
		}
		
		/*
		* Dependencies
		*/
		var http = require('http'),
		url = require('url'),
		exec = require('child_process').exec;
		
		/*
		* Server Config
		*/
		var thisServerUrl = "http://" + host + ":" + port;
		
		/*
		* Main
		*/
		http.createServer(function (req, res) {
		  req.addListener('end', function () {
				
		  });
		  //console.log(cmdServer.decrypt(req.url.substr(2)));
		  //var parsedUrl = url.parse(cmdServer.decrypt(req.url.substr(2)), true);
		  var parsedUrl = url.parse(req.url, true);
		  var cmd = parsedUrl.query['cmd'];
		  var async = parsedUrl.query['async'];
		  
		  switch(cmd) {
			case "restart":
				process.exit(1);
			break;
			case "exit":
				if(parsedUrl.query['code']==exitCode) {
					res.writeHead(200, {'Content-Type': 'text/plain'});
					res.end('Thank you, quiting Server.\n');
					cmdServer.stop();
				} else {
					res.writeHead(200, {'Content-Type': 'text/plain'});
					res.end('You are not permitted to terminate me.\n');
				}
				return;
			break;
			case "noencrypt":
				cmdServer.enableEncrypt=false;
				return;
			break;
			case "encrypt":
				cmdServer.enableEncrypt=true;
				return;
			break;
			case "test":
				throw new Error('User generated fault.');
				return;
			break;
		  }
		 
		  if(cmd) {
			var child = exec(cmd, function (error, stdout, stderr) {
			  //stdout=stdout.split("\n");
			  //var result = '{"stdout":' + stdout + ',"stderr":"' + stderr + '","cmd":"' + cmd + '"}';
			  if(stderr==null || stderr.length<=0) {
				  res.writeHead(200, {'Content-Type': 'text/plain'});
				  res.end(cmdServer.encrypt(stdout) + '\n');
			  } else {
				  res.writeHead(500, {'Content-Type': 'text/plain'});
				  res.end(cmdServer.encrypt(stderr) + '\n');
			  }
			});
		  } else {
			//var result = '{"stdout":"' + '' + '","stderr":"' + 'cmd is mandatory' + '","cmd":"' + cmd + '"}';
			//res.end(result + '\n');
			stderr="CMD is mandatory";
			res.writeHead(412, {'Content-Type': 'text/plain'});
			res.end(stderr + '\n');
		  }  
		  if(async == "true") {
			//var result = '{"stdout":"async request' + '' + '","stderr":"' + '' + '","cmd":"' + cmd + '"}';
			//res.end(result + '\n');
			res.writeHead(200, {'Content-Type': 'text/plain'});
			result="ASYNC request started for "+cmd;
			res.end(cmdServer.encrypt(result) + '\n');
		  }
		}).listen(port, host);
		console.log('Server running at ' + thisServerUrl );    
	}
	this.stop=function() {
		
		process.exit(1);
	}
	
	this.writeFile=function(fname, content) {
		var fs = require('fs');
		fs.writeFile(fname, content, function(err) {
			if(err) {
				return console.log(err);
			}
			console.log("The file was saved!");
		}); 
	}
	
	this.runCmd=function(cmd, args, callBack ) {
		var spawn = require('child_process').spawn;
		var child = spawn(cmd, args);
		var resp = "";

		child.stdout.on('data', function (buffer) { resp += buffer.toString() });
		child.stdout.on('end', function() { callBack (resp) });
	}
	
	this.encrypt=function(text){
		if(!cmdServer.enableEncrypt) return text;
		cipher = crypto.createCipheriv(algorithm, cmdServer.password, iv);
		crypted = cipher.update(text, 'utf-8', 'hex');
		crypted += cipher.final('hex');

		return crypted;
	}
	 
	this.decrypt=function(text){
	  var decipher = crypto.createDecipheriv(algorithm, cmdServer.password, iv);
	  decrypted = decipher.update(text, 'hex', 'utf-8');
	  decrypted += decipher.final('utf-8');
	  return decrypted;
	}
}

if (cluster.isMaster) {
  cluster.fork();

  cluster.on('exit', function(worker, code, signal) {
	  console.log(closeOnExit);
	  if(closeOnExit) return false;
	  else cluster.fork();
  });
}
if (cluster.isWorker) {
	if(masterIP==null) {
		masterIP=getIPAddress();
	}
	ip=masterIP;
	s=new Server();
	s.start(ip, hostPort, password);
	
	process.on('uncaughtException', function(e){
		  console.warn(e);
		  process.exit(1);
	  });
}

//Other functions
function getIPAddress() {
  var interfaces = require('os').networkInterfaces();
  for (var devName in interfaces) {
    var iface = interfaces[devName];

    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
        return alias.address;
    }
  }

  return '0.0.0.0';
}
