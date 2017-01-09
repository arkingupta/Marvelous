/**
 *
 * Marvelous is an Amazon Alexa Skill which gives information about Marvel characters.
 * Built by Arkin Gupta (http://www.arkin.xyz)
 * Feel free to use any part of this code in your open-source projects.
 * To-dos - Responding to "Marvelous, which comics was *this character* in?", Session end logic, normalize indentation!
 *
 */

//Importing libraries
var http = require('http');
var crypto = require('crypto');

//Checking for application ID, and handling event requests.
//Generic in almost evert alexa skill
exports.handler = function(event, context){
	try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

		//Checks if the application has a valid Application ID
        if (event.session.application.applicationId !== "***"){
             context.fail("Invalid Application ID");
        }

		//Handling new session
        if (event.session.new){
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

		//Handling all requests
        if (event.request.type === "LaunchRequest"){
			onLaunch(event.request, event.session,
				function callback(sessionAttributes, speechletResponse){
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                }
			);
        } else if (event.request.type === "IntentRequest"){
			onIntent(event.request, event.session,
                function callback(sessionAttributes, speechletResponse){
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                }
			);
        } else if (event.request.type === "SessionEndedRequest"){
			onSessionEnded(event.request, event.session);
            context.succeed();
		}
    }
	catch (e) {
        context.fail("Exception: " + e);
    }
};

//Skill launch
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId +
        ", sessionId=" + session.sessionId);
    getWelcomeResponse(callback);
}

//Intent logic
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId +
        ", sessionId=" + session.sessionId);
    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

	//Checking intent name and calling respective function
    if ("Marvelous" === intentName) {
        getChar(intent, session, callback);
    } else if ("AMAZON.HelpIntent" === intentName) {
        getWelcomeResponse(callback);
    } else {
        throw "Invalid intent";
    }
}

//Session Start
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId +
        ", sessionId=" + session.sessionId);
}

//Session End
function onSessionEnded(SessionEndedRequest, session){
	console.log("onSessionEnded request id =" + SessionEndedRequest.requestID + ", sessionId=" + session.sessionId);
}

//Generic help response
function getWelcomeResponse(callback) {
    var sessionAttributes = {};
    var cardTitle = "Welcome";
    var speechOutput = "Welcome to Marvelous" + "Ask me about any Marvel character";

    //If user says something not understood
    var repromptText = "Hmmm, Ask me about any Marvel Character";
    var shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

//Main function, to get information about characters
function getChar(intent, session, callback){
	var cardTitle = intent.name;
	var repromptText = "";
	var sessionAttributes = {};
	var shouldEndSession = true;
	var speechOutput = "";

	var char;

	console.log("CHAR >>>");
	console.log(intents.slots.Char.value);
	console.log("<<< CHAR");

	if(!intent.slots.Char.value){
		speechOutput = "Character not found."
	}
	else{
		char = intent.slots.Char.value;
	}

	getCharFromMarvel(char, function(chars){
	    if(chars.data.count > 0) {
	        var char = chars.data.results[0];

			if(char.description === '') {
	            speechOutput = speechOutput + "Marvelous does not have a description for";
	            speechOutput = speechOutput + char.name;
	            speechOutput = speechOutput + "But, " + char.name + " was a part of these comics ";
	            speechOutput = speechOutput + char.comics.items[0].name;
	            speechOutput = speechOutput + char.comics.items[1].name;

	        } else {
	            speechOutput = speechOutput + char.description;
	        }

	    } else {
	        speechOutput = "Marvelous failed to find anything about this character.";
	    }

	    callback(sessionAttributes,
	      buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
	  });
}

//Building responses
function buildSpeechletRespons(title, output, repromptText, shouldEndSession){
	return {
		outputSpeech: {
			type: "PlainText",
			text: output
		},
		card: {
			type: "Simple",
			title: "SessionSpeechlet - " + title,
			content: "SessionSpeechlet - " + output
		},
		reprompt: {
			outputSpeech: {
				type: "PlainText",
				text: repromptText
			}
		},
		shouldEndSession: shouldEndSession
	};
}

function buildResponse(sessionAttributes, speechletResponse){
	return {
	version: "1.0",
	sessionAttributes: sessionAttributes,
	response: speechletResponse
	};
}

//Calling Marvel API & getting info on character
function getCharFromMarvel(character, callback){
	//Generating path URL
	var PRIVATE_KEY = "***";
    var PUBLIC_KEY = "***";
	var time = new Date().getTime();
    var hash = crypto.createHash('md5').update(time + PRIVATE_KEY + PUBLIC_KEY).digest('hex');
    var pathurl = '/v1/public/characters?name=' + encodeURIComponent(char) + "&publickey=" + PUBLIC_KEY;
    pathurl += "&time="+time+"&hash="+hash;
    console.log(pathurl);
  	return http.get({
    	host: 'gateway.marvel.com',
    	path: pathurl
  	},
	function(response){
		var body = '';
		response.on('data',
			function(d){
      			body += d;
    		});
    	response.on('end',
			function(){
        	console.log(body);
      		callback(JSON.parse(body));
    	});
  	});
}
