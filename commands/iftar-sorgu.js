const { SlashCommandBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');
const moment = require('moment-timezone');

// API anahtarı
const API_KEY = "6mKJ4YQPLviug1vhnRFI41:6XZxvSxIpK3x641nInPsHk";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('iftar-sorgu')
        .setDescription('Bir şehir için iftar ve imsak vakitlerini gösterir')
        .addStringOption(option =>
            option.setName('sehir')
                .setDescription('Sorgulamak istediğiniz şehir')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();
        const sehir = interaction.options.getString('sehir').toLowerCase();

        try {
            // Namaz vakitlerini al
            const response = await axios.get(`https://api.collectapi.com/pray/all?data.city=${sehir}`, {
                headers: {
                    'content-type': 'application/json',
                    'authorization': `apikey ${API_KEY}`
                }
            });

            if (!response.data?.result) {
                return await interaction.editReply('Bu şehir için veri bulunamadı. Lütfen geçerli bir şehir adı girin.');
            }

            // İmsak ve akşam vakitleri
            const imsakVakti = response.data.result[0].saat;
            const aksamVakti = response.data.result[4].saat;
            
            // Şu anki saat
            const now = moment();
            const [aksamSaat, aksamDakika] = aksamVakti.split(':').map(Number);
            const [imsakSaat, imsakDakika] = imsakVakti.split(':').map(Number);
            const suAnSaat = now.hour();
            const suAnDakika = now.minute();

            // İftara kalan süreyi hesapla
            let durum = '';
            let kalanSaat = 0;
            let kalanDakika = 0;

            const totalNowMinutes = suAnSaat * 60 + suAnDakika;
            const totalAksamMinutes = aksamSaat * 60 + aksamDakika;
            const totalImsakMinutes = imsakSaat * 60 + imsakDakika;

            if (suAnSaat < imsakSaat || (suAnSaat === imsakSaat && suAnDakika < imsakDakika)) {
                // Henüz imsak olmadı
                durum = 'Sahur Vakti';
                const diffMinutes = totalImsakMinutes - totalNowMinutes;
                kalanSaat = Math.floor(diffMinutes / 60);
                kalanDakika = diffMinutes % 60;
            } else if (suAnSaat < aksamSaat || (suAnSaat === aksamSaat && suAnDakika < aksamDakika)) {
                // İftar olmadı
                durum = 'İftara';
                const diffMinutes = totalAksamMinutes - totalNowMinutes;
                kalanSaat = Math.floor(diffMinutes / 60);
                kalanDakika = diffMinutes % 60;
            } else {
                // İftar geçti
                durum = 'İftar Vakti Geçti';
            }

            // Canvas görselini oluştur
            const imageBuffer = await createVakitImage(sehir, imsakVakti, aksamVakti, durum, kalanSaat, kalanDakika);

            await interaction.editReply({
                embeds: [{
                    title: `${sehir.toUpperCase()} İftar ve İmsak Vakitleri`,
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
            await interaction.editReply('Vakitler alınırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        }
    }
};

async function createVakitImage(sehir, imsakVakti, aksamVakti, durum, kalanSaat, kalanDakika) {
    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext('2d');

    // Arka plan
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    if (durum === 'Sahur Vakti') {
        gradient.addColorStop(0, '#0a0a2a'); // Gece mavisi
        gradient.addColorStop(1, '#1a1a4a');
    } else {
        gradient.addColorStop(0, '#ff7e5f'); // Gün batımı
        gradient.addColorStop(1, '#feb47b');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);

    // Dekoratif efektler
    if (durum === 'Sahur Vakti') {
        // Yıldızlar
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * 800;
            const y = Math.random() * 600;
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
        
        ctx.fillStyle = gradient.addColorStop(0, '#0a0a2a');
        ctx.beginPath();
        ctx.arc(680, 80, 35, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Güneş batışı efekti
        const sunsetGradient = ctx.createRadialGradient(400, 600, 100, 400, 600, 800);
        sunsetGradient.addColorStop(0, 'rgba(255, 140, 0, 0.7)');
        sunsetGradient.addColorStop(1, 'rgba(255, 140, 0, 0)');
        ctx.fillStyle = sunsetGradient;
        ctx.fillRect(0, 0, 800, 600);
    }

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

    // Başlık
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(sehir.toUpperCase(), 400, 80);

    // Vakit bilgileri
    const boxWidth = 500;
    const boxHeight = 100;
    const boxX = 150;
    let boxY = 120;

    // İmsak vakti kutusu
    const boxGradient = ctx.createLinearGradient(boxX, boxY, boxX + boxWidth, boxY);
    boxGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    boxGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');

    // İmsak vakti
    ctx.fillStyle = boxGradient;
    drawBox(ctx, boxX, boxY, boxWidth, boxHeight);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('İmsak Vakti:', boxX + 20, boxY + 60);
    
    ctx.textAlign = 'right';
    ctx.fillText(imsakVakti, boxX + boxWidth - 20, boxY + 60);

    // Akşam vakti kutusu
    boxY += 120;
    ctx.fillStyle = boxGradient;
    drawBox(ctx, boxX, boxY, boxWidth, boxHeight);
    
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('İftar Vakti:', boxX + 20, boxY + 60);
    
    ctx.textAlign = 'right';
    ctx.fillText(aksamVakti, boxX + boxWidth - 20, boxY + 60);

    // Kalan süre bilgisi
    boxY += 120;
    if (durum !== 'İftar Vakti Geçti') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        drawBox(ctx, boxX, boxY, boxWidth, boxHeight);

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px Arial';
        ctx.fillText(`${durum} Kalan Süre:`, 400, boxY + 40);
        ctx.fillText(`${kalanSaat} saat ${kalanDakika} dakika`, 400, boxY + 80);
    }

    return canvas.toBuffer();
}

function drawBox(ctx, x, y, width, height) {
    const radius = 15;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
} 