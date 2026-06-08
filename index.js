require('dotenv').config();
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const express = require('express');
const app = express();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const linksDb = {};

app.get('/r/:id', (req, res) => {
    const originalUrl = linksDb[req.params.id];
    if (originalUrl) return res.redirect(originalUrl);
    res.send('Ссылка не найдена');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Веб-сервер запущен`));

client.once('ready', () => console.log(`✅ Бот ${client.user.tag} готов!`));

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'create_hyperlink') {
        const modal = new ModalBuilder().setCustomId('link_modal').setTitle('Создать ссылку');
        modal.addComponents(new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('url_input').setLabel('Вставьте ссылку').setStyle(TextInputStyle.Short).setRequired(true)
        ));
        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'link_modal') {
        const url = interaction.fields.getTextInputValue('url_input');
        const id = Math.random().toString(36).substring(7);
        linksDb[id] = url;
        const shortUrl = `${process.env.BASE_URL}/r/${id}`;
        const visualUrl = url.replace(/https?:\/\/(robiox|roblox)[a-z0-9.-]+(\/|$)/i, 'https://www.roblox.com/').replace('https://', 'https_:_//');
        await interaction.reply({ content: `✅ Ваша ссылка: \`[${visualUrl}](${shortUrl})\``, flags: [MessageFlags.Ephemeral] });
    }
});

client.login(process.env.TOKEN);
