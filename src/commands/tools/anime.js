const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { request, gql } = require('graphql-request')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('anime')
    .setDescription('Procure um anime!')
    .addStringOption(option =>
      option
        .setName('titulo')
        .setDescription('nome do anime.')
        .setRequired(true)
    ),
  async execute(interaction, client) {
    let animeName = interaction.options.getString('titulo')

    const query = gql`
      query ($search: String, $format: MediaFormat) {
        Media(search: $search, format: $format) {
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
    `

    let formato = ['TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA']

    let arrayResult = []

    for (var i = 0; i <= formato.length - 1; i++) {
      let variables = {
        format: formato[i],
        search: animeName
      }

      await request('https://graphql.anilist.co', query, variables)
        .then(data => {
          function retiraAspas(info) {
            return info.substring(1).slice(0, -1)
          }

          function minuscula(info) {
            return info.toLowerCase()
          }

          function removerAcentos(info) {
            return info.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          }

          function removerCaracteresEspeciais(info) {
            return info.replace(/[^a-zA-Z\s]/g, '')
          }

          function converteMinutoHora(minutos) {
            const hor = Math.floor(minutos / 60)
            const min = (minutos %= 60)
            const textHor = `00${hor}`.slice(-1)
            const textMin = `00${min}`.slice(-2)

            return `${textHor} hora, ${textMin} minutos`
          }

          const format = retiraAspas(JSON.stringify(data.Media.format))

          const synonyms = data.Media.synonyms

          const id = JSON.stringify(data.Media.id)

          const siteUrl = retiraAspas(JSON.stringify(data.Media.siteUrl))

          const averageScore = JSON.stringify(data.Media.averageScore)

          const meanScore = JSON.stringify(data.Media.meanScore)

          const popularity = JSON.stringify(data.Media.popularity)

          const episodes = data.Media.episodes

          const episodesAtt =
            episodes == null
              ? 'em lançamento'
              : JSON.stringify(episodes)

          const duration = JSON.stringify(data.Media.duration)

          const status = retiraAspas(JSON.stringify(data.Media.status))

          const titleRomaji = retiraAspas(
            JSON.stringify(data.Media.title.romaji)
          )

          const titleEnglish = data.Media.title.english

          const titleNative = retiraAspas(
            JSON.stringify(data.Media.title.native)
          )

          const coverImage = retiraAspas(
            JSON.stringify(data.Media.coverImage.extraLarge)
          )

          const bannerImage = retiraAspas(
            JSON.stringify(data.Media.bannerImage)
          )

          const description = data.Media.description

          const durationAtt = converteMinutoHora(duration)

          const epOrDuration =
            formato[i] == 'MOVIE'
              ? {
                  name: `duração`,
                  value: durationAtt
                }
              : {
                  name: `episódios`,
                  value: episodesAtt
                }

          const titleEnglishAtt =
            titleEnglish == null
              ? titleRomaji
              : retiraAspas(JSON.stringify(titleEnglish))

          const descriptionAtt =
            description == null
              ? 'Descrição indisponível.'
              : retiraAspas(JSON.stringify(description))
                  .replace(/[<]+[a-z]{2}[>]/g, '')
                  .replaceAll(/[\\]+[n]/g, '')
                  .substring(0, 400) + '...'

          const animeNameAtt = removerCaracteresEspeciais(
            removerAcentos(minuscula(animeName))
          )
          
          const synonymsAtt = synonyms.map(title =>
            removerCaracteresEspeciais(removerAcentos(title.toLowerCase()))
          )

          // EMBED

          const embed = new EmbedBuilder()
            .setTitle(titleRomaji)
            .setURL(siteUrl)
            .setDescription(descriptionAtt)
            .setColor(0xdb1620)
            .setImage(bannerImage)
            .setThumbnail(coverImage)
            .setTimestamp(Date.now())
            .addFields([
              {
                name: `formato`,
                value: format,
                inline: true
              },
              {
                name: `status`,
                value: status,
                inline: true
              },
              {
                name: epOrDuration.name,
                value: epOrDuration.value,
                inline: true
              }
            ])
            .setFooter({
              text: `anilist.co`,
              iconURL: `https://anilist.co/img/icons/favicon-32x32.png`
            })

          // RESPOSTA

          if (
            animeNameAtt == minuscula(titleRomaji) ||
            animeNameAtt ==
              removerCaracteresEspeciais(minuscula(titleEnglishAtt)) ||
            synonymsAtt.find(element => element == animeNameAtt)
          ) {
            arrayResult.push('SUCESSO')
            interaction.reply({
              embeds: [embed]
            })
          }
        })
        .catch(error => {
          const formatErr = formato[i]
          const messageError = `O anime ${animeName} não foi encontrado!`
          arrayResult.push('FALHA' + formato[i])

          if (
            formatErr == formato[formato.length - 1] &&
            !arrayResult.find(element => element == 'SUCESSO')
          ) {
            interaction.reply({
              content: messageError
            })
          }
        })

      if (arrayResult.find(element => element == 'SUCESSO')) {
        break
      }
    }
  }
}
