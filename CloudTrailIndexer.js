var aws  = require('aws-sdk');
var zlib = require('zlib');
var async = require('async');
var http = require('http');

var ELASTICSEARCH_URL = 'yourcloudsearchurl.com'; // your cloudesearch server url
var ELASTICSEARCH_PORT = 80; // your cloudsearch server port
var ELASTICSEARCH_MAPPING_PATH = '/cloudtrail/record'; // the mapping/record you are going to use

var s3 = new aws.S3();

exports.handler = function(event, context) {
    var srcBucket = event.Records[0].s3.bucket.name;
    var srcKey = event.Records[0].s3.object.key;

    async.waterfall([
        function fetchLogFromS3(next){
            console.log('Fetching compressed log from S3...');
            s3.getObject({
               Bucket: srcBucket,
               Key: srcKey
            },
            next);
        },
        function uncompressLog(response, next){
            console.log("Uncompressing log...");
            zlib.gunzip(response.Body, next);
        },
        function publishNotifications(jsonBuffer, next) {
            console.log('Filtering log...');
            var json = jsonBuffer.toString();
            console.log('CloudTrail JSON from S3:', json);
            var records;
            try {
                records = JSON.parse(json);
            } catch (err) {
                next('Unable to parse CloudTrail JSON: ' + err);
                return;
            }

            var recordsToBeIndexed = records.Records;

            console.log('Indexing ' + recordsToBeIndexed.length + ' in parallel...');

            async.each(
              recordsToBeIndexed,
                function(record, publishComplete) {
                    console.log('Indexing record: ', record);

                    var recordString = JSON.stringify(record);

                    var elasticSearchIndexingOptions = {
                      host: ELASTICSEARCH_URL,
                      port: ELASTICSEARCH_PORT,
                      path: ELASTICSEARCH_MAPPING_PATH,
                      method: 'POST',
                      headers: {
                        "Content-Type": "application/json",
                        "Content-Length": recordString.length
                      }
                    };

                    var req = http.request(elasticSearchIndexingOptions);

                    req.on('error', function(e) {
                      console.log('Could not index record:' + e.message);
                    });

                    req.write(recordString);
                    req.end();
                },
                next
            );
        }
    ], function (err) {
        if (err) {
            console.error('Failed to index records: ', err);
        } else {
            console.log('Successfully indexed all records.');
            context.done(null, "done.");
        }
        context.done(err);
    });
};
