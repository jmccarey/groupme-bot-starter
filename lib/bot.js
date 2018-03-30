'use strict';


require('dotenv').config();
const https = require('https');
const http = require('http');
const request = require('sync-request');

class Bot {

    /**
     * Called when the bot receives a message.
     *
     * @static
     * @param {Object} message The message data incoming from GroupMe
     * @return {string} Bot's output to GroupMe
     */
    static checkMessage(message) {


        const messageText = message.text;

        // Learn about regular expressions in JavaScript: https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_Expressions
        const botRegex = /^\/shrug/;
		
		const teamRegex = /^\/team/;
        
        const gitRegex = /^\/github/;


        // Check if the GroupMe message has content and if the regex pattern is true
        if (messageText && botRegex.test(messageText)) {
            // Check is successful, return a message!
            if(message.sender_type === 'user')
                return '¯\\_(ツ)_/¯';
        }
        
        // Shameless plug to my github
        if (messageText && gitRegex.test(messageText)) {
            if(message.sender_type === 'user')
                return 'https://github.com/jmccarey/groupme-frc-bot';
        }

        
		if(messageText && teamRegex.test(messageText)){
            if(message.sender_type === 'user'){
                //Find the first index of the team number
                var numberPos = messageText.search(/\d{1,4}/);
                
                //Check to see if there are NOT between 1 & 4 digits in a row in the message
                if(numberPos < 0){
                    //A polite apology
                    return 'Sorry, that is not a team.';
                }

                //Loop through the message to find the end of the team number
                for(var i = numberPos;i <= messageText.length;i++){
                    //If the current character is not a digit do not increment
                    if(!/\d/.test(messageText.charAt(i)))
                        break;
                    //Cap the team number at 4 digits
                    if(i > numberPos + 3)
                        break;
                }

                //Extract the team number from the message
                var teamCode = messageText.slice(numberPos,i);
                //Gets the string returned from TBA
                var body = this.getBody(teamCode);
                //If the call fails return invalid team
                if(!body){
                    return 'Sorry, that is not a team.';
                }
                //Parse the string body to JSON
                var parsed = JSON.parse(body);
                var city = parsed.city;
                var state = parsed.state_prov;
                var name = parsed.nickname;
                //Form and return a string with team number, name, city and state
                return "Team " + teamCode + ", " + name + ", is from " + city + ", " + state + ".";
            }
        }

		
			return null;
    };

    /**
     * Sends a message to GroupMe with a POST request.
     *
     * @static
     * @param {string} messageText A message to send to chat
     * @return {undefined}
     */
    static sendMessage(messageText) {
        // Get the GroupMe bot id saved in `.env`
        const botId = process.env.BOT_ID;

        const options = {
            hostname: 'api.groupme.com',
            path: '/v3/bots/post',
            method: 'POST'
        };

        const body = {
            bot_id: botId,
            text: messageText
        };

        // Make the POST request to GroupMe with the http module
        const botRequest = https.request(options, function(response) {
            if (response.statusCode !== 202) {
                console.log('Rejecting bad status code ' + response.statusCode);
            }
        });

        // On error
        botRequest.on('error', function(error) {
            console.log('Error posting message ' + JSON.stringify(error));
        });

        // On timeout
        botRequest.on('timeout', function(error) {
            console.log('Timeout posting message ' + JSON.stringify(error));
        });

        // Finally, send the body to GroupMe as a string
        botRequest.end(JSON.stringify(body));
    };
    
    
    /**
     * Sends a synchronous GET request to The Blue Alliance API
     *
     * @static
     * @param {string} teamNumber The FRC team number to be requested
     * @return {Object} The content received from TBA
     */
	static getBody(teamNumber){
        const apiKey = process.env.API_KEY;
        //The Blue Alliance API base url + requested team + retrieve API key from ENV file
		var url = 'http://www.thebluealliance.com/api/v3/team/frc' + teamNumber + '?X-TBA-Auth-Key=' + apiKey;
        //Synchronous get request to TBA  
        var res = request('GET', url);
        //Check for success
        if(res.statusCode !== 200)
            return false;
        //Extract the string body received from TBA
        return res.getBody();
	}
};

module.exports = Bot;
