require('dotenv/config');
const { TWITCH_USER, TWITCH_PASSWORD } = process.env;

const fs = require('fs');
const { request, gql } = require('graphql-request');

const tmi = require('tmi.js');

const quotes = JSON.parse(fs.readFileSync('quotes.json'));
let quotesList = Object.keys(quotes)

const channel = 'cpteagle';

const options = {
    options: { debug: true },
    connections: {
        reconnect: true,
        secure: true
    },
    identity: {
        username: TWITCH_USER,
        password: TWITCH_PASSWORD
    },
    channels: [channel]
};

const client = new tmi.Client(options);
client.connect().catch(console.log);

client.on('message', (channel, user, message, self) => {

    if (self) return;

    let args = message.split(" ");

    function checkCommand(string) {
        if (message.toLowerCase().startsWith(`${string }`)) return true;
        return false;
    }

    switch(true) {
        case checkCommand('!addquote'):
            if (!args[1]) return client.say(channel, `You have to provide a quote! @${user.username}`);

            let newQuoteKey = quotesList.length + 1;

            args.shift();
            quotes[newQuoteKey.toString()] = args.join(" ");

            fs.writeFileSync('quotes.json', JSON.stringify(quotes, null, 2), error => {
                console.log(error);
            });

            client.say(channel, `Added your quote to the Eagle database! @${user.username}`);
        break;

        case checkCommand('!lastquote'):
            quotesList = Object.values(JSON.parse(fs.readFileSync('quotes.json')));
            quotesList.reverse();

            client.say(channel, `Here's the latest quote: ${quotesList[0]}`);
        break

        case checkCommand('!quotes'):
            client.say(channel, `You can see all the quotes here:`)
        break;

        case checkCommand('!flea'):
            if (!args[1]) return client.say(channel, `What item do you want to look up? @${user.username}`);
            
            args.shift();

            const query = gql`
                {
                    items(name: "${args[0]}") {
                        shortName
                        avg24hPrice
                        basePrice
                }
            }
            `

            request('https://api.tarkov.dev/graphql', query).then((data) => {
                client.say(channel, `Name: ${data['items'][0]['shortName']} | Price 24H: ${data['items'][0]['avg24hPrice']} | Base prise: ${data['items'][0]['basePrice']} | @${user.username}`);
            })

        break;

    }
});