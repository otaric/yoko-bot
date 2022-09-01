const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { request, gql } = require('graphql-request')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('anime-list')
    .setDescription('Procure um anime por lista!')
    .addStringOption(option =>
      option
        .setName('titulo')
        .setDescription('nome do anime.')
        .setRequired(true)
    ),
  async execute(interaction, client) {
    const embed = new EmbedBuilder().setTitle('BUSCANDO...')

    const message = await interaction.reply({
      embeds: [embed],
      fetchReply: true
    })

    let animeName = interaction.options.getString('titulo')

    let query = gql`
      query ($page: Int, $perPage: Int, $search: String, $type: MediaType) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            currentPage
            hasNextPage
            perPage
            lastPage
          }
          media(type: $type, search: $search) {
            format
            id
            siteUrl
            averageScore
            meanScore
            popularity
            episodes
            duration
            status
            title {
              romaji
              english
              native
            }
            synonyms
            coverImage {
              extraLarge
            }
            bannerImage
            trailer {
              id
              site
              thumbnail
            }
            description
          }
        }
      }
    `

    let variables = {
      type: 'ANIME',
      search: animeName,
      page: 1,
      perPage: 6
    }

    await request('https://graphql.anilist.co', query, variables)
      .then(data => {
        const receivedEmbed = message.embeds[0]

        let array = []
        let emoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣']

        for (var i = 0; i <= data.Page.media.length - 1; i++) {
          array.push(data.Page.media[i])
          array[i].emoji = emoji[i]
        }

        const embedLista = EmbedBuilder.from(receivedEmbed)
          .setTitle('RESULTADO')
          .setDescription(
            `Escolha uma das opções abaixo reagindo no emoji correspondente para ver mais informações!`
          )
          .setColor(0xdb1620)
          .setTimestamp(Date.now())
          .setFooter({
            text: `anilist.co`,
            iconURL: `https://anilist.co/img/icons/favicon-32x32.png`
          })

        array.forEach(e => {
          embedLista.addFields({
            name: `${e.emoji} ${e.title.romaji}`,
            value: `formato: ${e.format}\n `
          })
        })

        const embedErro = EmbedBuilder.from(receivedEmbed)
          .setTitle('ERRO')
          .setDescription(
            `Nenhum anime com o título ${animeName} foi encontrado, tente reescrever o título corretamente.`
          )

        if (data.Page.media[0] == undefined) {
          console.log('teste')
          message.edit({
            embeds: [embedErro]
          })
        } else {
          message.edit({
            embeds: [embedLista],
            fetchReply: true
          })

          message.react('1️⃣')
          message.react('2️⃣')
          message.react('3️⃣')
          message.react('4️⃣')
          message.react('5️⃣')
          message.react('6️⃣')
        }

        const filter = (reaction, user) => {
          return (
            ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'].includes(
              reaction.emoji.name
            ) && user.id === interaction.user.id
          )
        }

        const embedTitleSelect = EmbedBuilder.from(receivedEmbed)
          .setColor(0xdb1620)
          .setTimestamp(Date.now())
          .setFooter({
            text: `anilist.co`,
            iconURL: `https://anilist.co/img/icons/favicon-32x32.png`
          })

        function converteMinutoHora(minutos) {
          const hor = Math.floor(minutos / 60)
          const min = (minutos %= 60)
          const textHor = `00${hor}`.slice(-1)
          const textMin = `00${min}`.slice(-2)

          return `${textHor} hora, ${textMin} minutos`
        }

        function editEmbed(e) {
          const description = array[e].description
          const descriptionAtt =
            description == null
              ? 'Descrição indisponível.'
              : description
                  .replace(/[<]+[a-z]{2}[>]/g, '')
                  .replaceAll(/[\\]+[n]/g, '')
                  .substring(0, 400) + '...'

          const format = array[e].format
          const episodes = array[e].episodes
          const episodesAtt = episodes == null ? 'em lançamento' : episodes
          const duration = array[e].duration

          const durationAtt = converteMinutoHora(duration)

          const epOrDuration =
            format == 'MOVIE'
              ? {
                  name: `duração`,
                  value: durationAtt
                }
              : {
                  name: `episódios`,
                  value: episodesAtt
                }

          message.reactions.removeAll()
          embedTitleSelect
            .setTitle(`${array[e].title.romaji}`)
            .setURL(`${array[e].siteUrl}`)
            .setDescription(`${descriptionAtt}`)
            .setImage(array[e].bannerImage)
            .setThumbnail(array[e].coverImage.extraLarge)
            .addFields(
              {
                name: `formato`,
                value: `${format}`,
                inline: true
              },
              {
                name: `status`,
                value: `${array[e].status}`,
                inline: true
              },
              {
                name: `${epOrDuration.name}`,
                value: `${epOrDuration.value}`,
                inline: true
              }
            )
        }

        message
          .awaitReactions({ filter, max: 1, time: 60000, errors: ['time'] })
          .then(collected => {
            const reaction = collected.first()

            if (reaction.emoji.name === '1️⃣') {
              editEmbed(0)
              message.edit({
                embeds: [embedTitleSelect],
                fetchReply: true
              })
            } else if (reaction.emoji.name === '2️⃣') {
              editEmbed(1)
              message.edit({
                embeds: [embedTitleSelect],
                fetchReply: true
              })
            } else if (reaction.emoji.name === '3️⃣') {
              editEmbed(2)
              message.edit({
                embeds: [embedTitleSelect],
                fetchReply: true
              })
            } else if (reaction.emoji.name === '4️⃣') {
              editEmbed(3)
              message.edit({
                embeds: [embedTitleSelect],
                fetchReply: true
              })
            } else if (reaction.emoji.name === '5️⃣') {
              editEmbed(4)
              message.edit({
                embeds: [embedTitleSelect],
                fetchReply: true
              })
            } else if (reaction.emoji.name === '6️⃣') {
              editEmbed(5)
              message.edit({
                embeds: [embedTitleSelect],
                fetchReply: true
              })
            }
          })
          .catch(erro => {
            console.log(erro)
            message.edit({ content: `ERRO` })
          })
      })
      .catch(erro => {
        console.log(erro)
        interaction.editReply({
          content: `ERRO`
        })
      })
  }
}
