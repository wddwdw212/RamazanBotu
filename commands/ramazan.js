const { SlashCommandBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');
const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');

// API anahtarı
const API_KEY = "6mKJ4YQPLviug1vhnRFI41:6XZxvSxIpK3x641nInPsHk";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ramazan')
        .setDescription('Bir şehir için namaz vakitlerini gösterir')
        .addStringOption(option =>
            option.setName('sehir')
                .setDescription('Namaz vakitlerini görmek istediğiniz şehir')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();
        const sehir = interaction.options.getString('sehir').toLowerCase();

        try {
            // CollectAPI'den namaz vakitlerini al
            const response = await axios.get(`https://api.collectapi.com/pray/all?data.city=${sehir}`, {
                headers: {
                    'content-type': 'application/json',
                    'authorization': `apikey ${API_KEY}`
                }
            });

            if (!response.data || !response.data.result) {
                return await interaction.editReply('Bu şehir için veri bulunamadı. Lütfen geçerli bir şehir adı girin.');
            }

            const vakitler = {
                imsak: response.data.result[0].saat,
                gunes: response.data.result[1].saat,
                ogle: response.data.result[2].saat,
                ikindi: response.data.result[3].saat,
                aksam: response.data.result[4].saat,
                yatsi: response.data.result[5].saat
            };

            // Canvas görselini oluştur
            const imageBuffer = await createVakitImage(sehir, vakitler);

            await interaction.editReply({
                embeds: [{
                    title: `${sehir.toUpperCase()} Namaz Vakitleri`,
                    color: 0x2f3136,
                    timestamp: new Date(),
                }],
                files: [{
                    attachment: imageBuffer,
                    name: 'vakitler.png'
                }]
            });

        } catch (error) {
            console.error('Hata:', error);
            await interaction.editReply('Namaz vakitleri alınırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        }
    }
};

async function createVakitImage(sehir, vakitler) {
    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext('2d');

    // Arka plan
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, '#0d1b3e'); // Koyu gece mavisi
    gradient.addColorStop(1, '#1e3163'); // Koyu mavi
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);

    // Yıldızlar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * 800;
        const y = Math.random() * 600;
        const size = Math.random() * 2 + 1;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }

    // Hilal çizimi
    ctx.fillStyle = '#f9d71c';
    ctx.beginPath();
    ctx.arc(700, 80, 40, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#0d1b3e';
    ctx.beginPath();
    ctx.arc(680, 80, 35, 0, Math.PI * 2);
    ctx.fill();

    // Cami silueti
    ctx.fillStyle = '#000000';
    // Ana kubbe
    ctx.beginPath();
    ctx.arc(400, 580, 100, Math.PI, Math.PI * 2);
    ctx.fill();
    
    // Minareler
    ctx.fillRect(250, 480, 15, 100);
    ctx.fillRect(535, 480, 15, 100);
    
    // Minare külahları
    ctx.beginPath();
    ctx.moveTo(250, 480);
    ctx.lineTo(257.5, 460);
    ctx.lineTo(265, 480);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(535, 480);
    ctx.lineTo(542.5, 460);
    ctx.lineTo(550, 480);
    ctx.fill();

    // Ramazan yazısı
    ctx.fillStyle = '#f9d71c'; // Altın sarısı
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('RAMAZAN', 400, 70);

    // Şehir adı
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${sehir.toUpperCase()}`, 400, 130);

    // Dekoratif süsleme - Ramazan feneri
    drawRamazanFeneri(ctx, 100, 100);
    drawRamazanFeneri(ctx, 700, 200);

    // Vakit bilgileri
    ctx.font = '28px Arial';
    let y = 220;
    const vakitIsimleri = {
        imsak: 'İmsak',
        gunes: 'Güneş',
        ogle: 'Öğle',
        ikindi: 'İkindi',
        aksam: 'Akşam',
        yatsi: 'Yatsı'
    };

    // Vakit tablosu başlığı
    ctx.fillStyle = '#f9d71c';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('Namaz Vakitleri', 400, 180);

    for (const [vakit, saat] of Object.entries(vakitler)) {
        // Vakit kutusu
        const boxWidth = 400;
        const boxHeight = 50;
        const boxX = 200;
        const boxY = y - 30;

        // Yuvarlak köşeli dikdörtgen çizimi
        const gradient = ctx.createLinearGradient(boxX, boxY, boxX + boxWidth, boxY);
        gradient.addColorStop(0, 'rgba(249, 215, 28, 0.2)'); // Altın sarısı
        gradient.addColorStop(1, 'rgba(249, 215, 28, 0.05)');
        ctx.fillStyle = gradient;
        
        ctx.beginPath();
        const radius = 10;
        ctx.moveTo(boxX + radius, boxY);
        ctx.lineTo(boxX + boxWidth - radius, boxY);
        ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + radius);
        ctx.lineTo(boxX + boxWidth, boxY + boxHeight - radius);
        ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - radius, boxY + boxHeight);
        ctx.lineTo(boxX + radius, boxY + boxHeight);
        ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - radius);
        ctx.lineTo(boxX, boxY + radius);
        ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
        ctx.closePath();
        ctx.fill();

        // Vakit adı ve saati
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.font = 'bold 28px Arial';
        ctx.fillText(vakitIsimleri[vakit], boxX + 20, y);
        ctx.textAlign = 'right';
        ctx.font = '28px Arial';
        ctx.fillText(saat, boxX + boxWidth - 20, y);

        y += 60;
    }

    // Tarih
    ctx.textAlign = 'center';
    ctx.font = '20px Arial';
    moment.locale('tr');
    const tarih = moment().format('DD MMMM YYYY');
    ctx.fillText(tarih, 400, 560);

    // Hayırlı Ramazanlar yazısı
    ctx.fillStyle = '#f9d71c';
    ctx.font = 'italic 24px Arial';
    ctx.fillText('Hayırlı Ramazanlar', 400, 520);

    return canvas.toBuffer();
}

// Ramazan feneri çizimi
function drawRamazanFeneri(ctx, x, y) {
    // Fener gövdesi
    ctx.fillStyle = '#f9d71c';
    ctx.beginPath();
    ctx.moveTo(x - 15, y);
    ctx.lineTo(x + 15, y);
    ctx.lineTo(x + 10, y + 40);
    ctx.lineTo(x - 10, y + 40);
    ctx.closePath();
    ctx.fill();
    
    // Fener üst kısmı
    ctx.beginPath();
    ctx.moveTo(x - 20, y);
    ctx.lineTo(x + 20, y);
    ctx.lineTo(x + 15, y - 10);
    ctx.lineTo(x - 15, y - 10);
    ctx.closePath();
    ctx.fill();
    
    // Fener alt kısmı
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 40);
    ctx.lineTo(x + 10, y + 40);
    ctx.lineTo(x + 5, y + 50);
    ctx.lineTo(x - 5, y + 50);
    ctx.closePath();
    ctx.fill();
    
    // Fener ışığı
    const gradient = ctx.createRadialGradient(x, y + 20, 0, x, y + 20, 20);
    gradient.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y + 20, 20, 0, Math.PI * 2);
    ctx.fill();
} 