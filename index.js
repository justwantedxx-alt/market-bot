const express = require("express");
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const app = express();

// ====== EXPRESS SERVER ======
app.get("/", (req, res) => {
  res.send("Market Bot is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ====== DISCORD CLIENT ======
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ====== SLASH COMMANDS ======
const commands = [
  new SlashCommandBuilder()
    .setName("sell")
    .setDescription("โพสต์ขายสินค้า")
    .addStringOption(option =>
      option.setName("สินค้า").setDescription("ชื่อสินค้า").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("ราคา").setDescription("ราคา").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("รายละเอียด")
        .setDescription("รายละเอียดเพิ่มเติม")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("buy")
    .setDescription("โพสต์รับซื้อสินค้า")
    .addStringOption(option =>
      option.setName("สินค้า").setDescription("ชื่อสินค้า").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("งบประมาณ").setDescription("งบประมาณ").setRequired(true)
    )
];

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log("Slash commands registered!");
  } catch (error) {
    console.error(error);
  }
});

// ====== INTERACTION ======
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const logChannelName = "log-ตลาด";
  const logChannel = interaction.guild.channels.cache.find(
    ch => ch.name === logChannelName
  );

  if (!logChannel) {
    return interaction.reply({
      content: "❌ ไม่พบห้อง log-ตลาด",
      ephemeral: true
    });
  }

  // ===== SELL =====
  if (interaction.commandName === "sell") {
    const item = interaction.options.getString("สินค้า");
    const price = interaction.options.getString("ราคา");
    const detail = interaction.options.getString("รายละเอียด") || "ไม่มีรายละเอียดเพิ่มเติม";

    const embed = new EmbedBuilder()
      .setTitle("🛒 ประกาศขายสินค้า")
      .setColor(0x00ff99)
      .addFields(
        { name: "📦 สินค้า", value: item },
        { name: "💰 ราคา", value: price },
        { name: "📝 รายละเอียด", value: detail },
        { name: "👤 ผู้ขาย", value: interaction.user.tag }
      )
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });

    await interaction.reply({
      content: "✅ โพสต์ขายเรียบร้อยแล้ว!",
      ephemeral: true
    });
  }

  // ===== BUY =====
  if (interaction.commandName === "buy") {
    const item = interaction.options.getString("สินค้า");
    const budget = interaction.options.getString("งบประมาณ");

    const embed = new EmbedBuilder()
      .setTitle("🔎 ประกาศรับซื้อสินค้า")
      .setColor(0xffcc00)
      .addFields(
        { name: "📦 สินค้าที่ต้องการ", value: item },
        { name: "💰 งบประมาณ", value: budget },
        { name: "👤 ผู้ซื้อ", value: interaction.user.tag }
      )
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });

    await interaction.reply({
      content: "✅ โพสต์รับซื้อเรียบร้อยแล้ว!",
      ephemeral: true
    });
  }
});

client.login(process.env.TOKEN);
