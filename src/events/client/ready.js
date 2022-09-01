const { ActivityType } = require('discord.js')

module.exports = {
  name: 'ready',
  once: 'true',
  async execute(client) {
    const options = [
      {
        type: ActivityType.Watching,
        text: 'Gurren Lagann',
        status: 'online'
      },
      {
        type: ActivityType.Watching,
        text: 'One Piece',
        status: 'online'
      },
      {
        type: ActivityType.Watching,
        text: 'Berserk',
        status: 'online'
      }
    ]

    let index = 0
    setInterval(() => {
      if (index === options.length) index = 0
      client.user.setPresence({
        activities: [
          {
            name: options[index].text,
            type: options[index].type
          }
        ],
        status: options[index].status
      })
      index++
    }, 10 * 1000)

    console.log(`${client.user.tag} está logada no Discord`)
  }
}
