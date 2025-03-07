const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');
const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');
const { token, clientId } = require('./config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

client.commands = new Collection();

// İl ve ilçe verileri
const iller = {
    "istanbul": {
        "ilceler": ["Kadıköy", "Üsküdar", "Beşiktaş", "Fatih"],
        "timezone": "Europe/Istanbul"
    },
    "ankara": {
        "ilceler": ["Çankaya", "Keçiören", "Mamak", "Yenimahalle"],
        "timezone": "Europe/Istanbul"
    }
    // Diğer iller eklenebilir
};

// Vakit bilgilerini çeken fonksiyon
async function getVakitler(il, ilce) {
    try {
        // Diyanet API'si yerine örnek veri kullanıyoruz
        // Gerçek uygulamada buraya API entegrasyonu yapılabilir
        const now = moment().tz(iller[il].timezone);
        
        // Örnek vakit verileri
        return {
            imsak: now.clone().hour(4).minute(30).format('HH:mm'),
            gunes: now.clone().hour(6).minute(15).format('HH:mm'),
            ogle: now.clone().hour(13).minute(0).format('HH:mm'),
            ikindi: now.clone().hour(16).minute(30).format('HH:mm'),
            aksam: now.clone().hour(19).minute(45).format('HH:mm'),
            yatsi: now.clone().hour(21).minute(15).format('HH:mm')
        };
    } catch (error) {
        console.error('Vakit bilgileri alınamadı:', error);
        return null;
    }
}

// Canvas ile görsel oluşturan fonksiyon
async function createVakitImage(il, ilce, vakitler) {
    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext('2d');

    // Arka plan
    ctx.fillStyle = '#2f3136';
    ctx.fillRect(0, 0, 800, 600);

    // Başlık
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${il.toUpperCase()} - ${ilce}`, 400, 80);

    // Vakit bilgileri
    ctx.font = '30px Arial';
    let y = 180;
    for (const [vakit, saat] of Object.entries(vakitler)) {
        ctx.fillText(`${vakit.toUpperCase()}: ${saat}`, 400, y);
        y += 60;
    }

    return canvas.toBuffer();
}

// Komutları yükle
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const commands = [];

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    }
}

// Slash komutlarını kaydet
const rest = new REST().setToken(token);

(async () => {
    try {
        console.log('Slash komutları yükleniyor...');

        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log('Slash komutları başarıyla yüklendi!');
    } catch (error) {
        console.error('Slash komutları yüklenirken hata oluştu:', error);
    }
})();

// Komut handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'Komut çalıştırılırken bir hata oluştu!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'Komut çalıştırılırken bir hata oluştu!', ephemeral: true });
        }
    }
});

client.once('ready', () => {
    console.log(`${client.user.tag} olarak giriş yapıldı!`);
});

client.login(token); 