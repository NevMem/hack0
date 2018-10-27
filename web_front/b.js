module.exports = function (req, res) {
  var data = '';
  
  req.on('data', function (chunk) {
    data += chunk;
  });

  req.on('end', function () {
    console.log('Input data received');
    res.writeHead(200, {
      'Content-Type': 'text/json'
    });
    res.write(JSON.stringify(data));
    res.end();
  });
};	