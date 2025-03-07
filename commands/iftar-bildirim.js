const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const schedule = require('node-schedule');
const config = require('../config.json');

const API_KEY = config.collectAPI.key;
const DB_PATH = path.join(__dirname, '..', 'data', 'iftarBildirim.json');

// Veritabanı işlemleri
function loadDatabase() {
    const dataDir = path.join(__dirname, '..', 'data');
    
    // Data klasörünü oluştur
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Veritabanı dosyasını oluştur veya yükle
    if (!fs.existsSync(DB_PATH)) {
        const defaultData = { servers: {} };
        fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2));
        return defaultData;
    }
    
    try {
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    } catch (error) {
        console.error('Veritabanı okuma hatası:', error);
        return { servers: {} };
    }
}

function saveDatabase(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Canvas ile bildirim görseli oluştur
async function createNotificationImage(sehir, vakit, durum) {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');

    // Arka plan
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    if (durum === 'sahur') {
        gradient.addColorStop(0, '#0a0a2a'); // Gece mavisi
        gradient.addColorStop(1, '#1a1a4a');
    } else {
        gradient.addColorStop(0, '#ff7e5f'); // Gün batımı
        gradient.addColorStop(1, '#feb47b');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 400);

    // Dekoratif efektler
    if (durum === 'sahur') {
        // Yıldızlar
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * 800;
            const y = Math.random() * 400;
            const size = Math.random() * 2 + 1;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ay
        ctx.fillStyle = '#f9d71c';
        ctx.beginPath();
        ctx.arc(700, 80, 40, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(680, 80, 35, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Güneş batışı efekti
        const sunsetGradient = ctx.createRadialGradient(400, 400, 100, 400, 400, 600);
        sunsetGradient.addColorStop(0, 'rgba(255, 140, 0, 0.7)');
        sunsetGradient.addColorStop(1, 'rgba(255, 140, 0, 0)');
        ctx.fillStyle = sunsetGradient;
        ctx.fillRect(0, 0, 800, 400);
    }

    // Cami silueti
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(400, 380, 80, Math.PI, Math.PI * 2);
    ctx.fill();
    
    ctx.fillRect(280, 300, 12, 80);
    ctx.fillRect(508, 300, 12, 80);
    
    ctx.beginPath();
    ctx.moveTo(280, 300);
    ctx.lineTo(286, 285);
    ctx.lineTo(292, 300);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(508, 300);
    ctx.lineTo(514, 285);
    ctx.lineTo(520, 300);
    ctx.fill();

    // Başlık ve metin
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(sehir.toUpperCase(), 400, 80);

    ctx.font = 'bold 36px Arial';
    if (durum === 'sahur') {
        ctx.fillText('SAHUR VAKTİNE 30 DAKİKA KALDI!', 400, 160);
        ctx.font = '32px Arial';
        ctx.fillText(`İmsak Vakti: ${vakit}`, 400, 220);
    } else {
        ctx.fillText('İFTAR VAKTİ GELDİ!', 400, 160);
        ctx.font = '32px Arial';
        ctx.fillText('Hayırlı iftarlar!', 400, 220);
    }

    return canvas.toBuffer();
}

// Bildirim zamanlaması
async function scheduleNotifications() {
    const db = loadDatabase();
    
    for (const [serverId, serverData] of Object.entries(db.servers)) {
        try {
            const response = await axios.get(`https://api.collectapi.com/pray/all?data.city=${serverData.city}`, {
                headers: {
                    'content-type': 'application/json',
                    'authorization': `apikey ${API_KEY}`
                }
            });

            if (!response.data?.result) continue;

            const imsakTime = response.data.result[0].saat;
            const iftarTime = response.data.result[4].saat;

            // İftar bildirimi
            const [iftarHour, iftarMinute] = iftarTime.split(':').map(Number);
            schedule.scheduleJob(`0 ${iftarMinute} ${iftarHour} * * *`, async function() {
                const channel = await client.channels.fetch(serverData.channelId);
                if (channel) {
                    const imageBuffer = await createNotificationImage(serverData.city, iftarTime, 'iftar');
                    channel.send({
                        content: serverData.everyone ? '@everyone' : null,
                        embeds: [{
                            title: '🌙 İFTAR VAKTİ',
                            description: `**${serverData.city.toUpperCase()}** şehri için iftar vakti geldi!\n\nHayırlı iftarlar! Allah kabul etsin.\n\n*"Allah'ım! Senin rızan için oruç tuttum, sana inandım, sana güvendim, senin verdiğin rızıkla orucumu açtım."*`,
                            color: 0x2f3136,
                            timestamp: new Date()
                        }],
                        files: [{
                            attachment: imageBuffer,
                            name: 'vakit.png'
                        }]
                    });
                }
            });

            // İmsak bildirimi (30 dakika kala)
            const imsakDate = new Date();
            const [imsakHour, imsakMinute] = imsakTime.split(':').map(Number);
            imsakDate.setHours(imsakHour, imsakMinute - 30, 0);

            if (imsakDate > new Date()) {
                schedule.scheduleJob(imsakDate, async function() {
                    const channel = await client.channels.fetch(serverData.channelId);
                    if (channel) {
                        const imageBuffer = await createNotificationImage(serverData.city, imsakTime, 'sahur');
                        channel.send({
                            content: serverData.everyone ? '@everyone' : null,
                            embeds: [{
                                title: '🌄 SAHUR VAKTİ',
                                description: `**${serverData.city.toUpperCase()}** şehri için imsak vaktine 30 dakika kaldı!\n\nSahur vaktini kaçırmayın!\n\nİmsak Vakti: **${imsakTime}**`,
                                color: 0x2f3136,
                                timestamp: new Date()
                            }],
                            files: [{
                                attachment: imageBuffer,
                                name: 'vakit.png'
                            }]
                        });
                    }
                });
            }
        } catch (error) {
            console.error(`Error scheduling notifications for server ${serverId}:`, error);
        }
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('iftar-bildirim')
        .setDescription('İftar ve sahur bildirimlerini ayarlar')
        .addStringOption(option =>
            option.setName('sehir')
                .setDescription('Bildirim almak istediğiniz şehir')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('kanal')
                .setDescription('Bildirimlerin gönderileceği kanal')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('everyone')
                .setDescription('@everyone ile etiketlensin mi?')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const sehir = interaction.options.getString('sehir').toLowerCase();
        const channel = interaction.options.getChannel('kanal');
        const everyone = interaction.options.getBoolean('everyone');

        if (!channel.isTextBased()) {
            return await interaction.reply({
                content: 'Lütfen metin tabanlı bir kanal seçin!',
                ephemeral: true
            });
        }

        try {
            // Şehir kontrolü
            const response = await axios.get(`https://api.collectapi.com/pray/all?data.city=${sehir}`, {
                headers: {
                    'content-type': 'application/json',
                    'authorization': `apikey ${API_KEY}`
                }
            });

            if (!response.data?.result) {
                return await interaction.reply({
                    content: 'Geçersiz şehir adı! Lütfen geçerli bir şehir adı girin.',
                    ephemeral: true
                });
            }

            // Veritabanına kaydet
            const db = loadDatabase();
            db.servers[interaction.guildId] = {
                city: sehir,
                channelId: channel.id,
                everyone: everyone
            };
            saveDatabase(db);

            await interaction.reply({
                embeds: [{
                    title: '✅ Bildirim Ayarları Güncellendi',
                    description: `İftar ve sahur bildirimleri ${channel} kanalına gönderilecek.\n\n**Şehir:** ${sehir.toUpperCase()}\n**@everyone:** ${everyone ? 'Evet' : 'Hayır'}\n\n• İftar vakti geldiğinde bildirim alacaksınız\n• Sahur vaktine 30 dakika kala bildirim alacaksınız`,
                    color: 0x2f3136,
                    timestamp: new Date()
                }]
            });

            // Normal bildirimleri planla
            await scheduleNotifications();

        } catch (error) {
            console.error('Error:', error);
            await interaction.reply({
                content: 'Bir hata oluştu! Lütfen daha sonra tekrar deneyin.',
                ephemeral: true
            });
        }
    }
}; 