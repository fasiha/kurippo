module.exports = {
  github: {
    clientID: 'd8bc63408f3afa66a8f1', // Go to github.com, create an application and add clientID
    clientSecret: '97616938a87d5547e540fa08644bf0b0a880b2d0' // Go to github.com, create an application and add clientSecret
  },
  twitter: {
    consumerKey: '4HAIezqWRVRkWvAfAfyTc3BkY', // Go to apps.twitter.com, create an application and add consumerKey
    consumerSecret: 'CMoeUFbuSlKDGzsgSLGjHJGrZSe1eYru7usB0kzEa3spdhrZRY' // Go to apps.twitter.com, create an application and add consumerSecret
  },
  protocol: 'https',
  url: '127.0.0.1',
  ports: {
    https: 4001
  },
  rethinkdb: {
    host: 'localhost',
    port: 28015,
    db: 'passport_rethinkdb_tutorial'
  }
};
