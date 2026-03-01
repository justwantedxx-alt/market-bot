require("dotenv").config();
const express = require("express");
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");

const app = express();
app.use(express.json());

/* =========================
   DISCORD CLIENT
========================= */

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

/* =========================
   SLASH COMMANDS
========================= */

const commands = [
  new SlashCommandBuilder()
    .setName("sell")
    .setDescription("โพสต์ขายสินค้า")
    .addStringOption((option) =>
      option.setName("ชื่อสินค้า").setDescription("ชื่อสินค้า").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("ราคา").setDescription("ราคาสินค้า").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("buy")
    .setDescription("โพสต์หาซื้อสินค้า")
    .addStringOption((option) =>
      option.setName("ชื่อสินค้า").setDescription("ชื่อสินค้า").setRequired(true)
    ),
].map((command) => command.toJSON());

/* =========================
   REGISTER COMMANDS
========================= */

client.once("clientReady", async () => {
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

/* =========================
   COMMAND HANDLER
========================= */

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const logChannel = interaction.guild.channels.cache.find(
    (c) => c.name === "log-ตลาด"
  );

  if (!logChannel) {
    return interaction.reply({
      content: "ไม่พบห้อง log-ตลาด",
      ephemeral: true,
    });
  }

  if (interaction.commandName === "sell") {
    const item = interaction.options.getString("ชื่อสินค้า");
    const price = interaction.options.getString("ราคา");

    const embed = new EmbedBuilder()
      .setTitle("📦 มีสินค้ามาขาย!")
      .setColor(0x00ff99)
      .addFields(
        { name: "ผู้ขาย", value: interaction.user.tag },
        { name: "สินค้า", value: item },
        { name: "ราคา", value: price }
      )
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });

    await interaction.reply({
      content: "โพสต์ขายเรียบร้อย ✅",
      ephemeral: true,
    });
  }

  if (interaction.commandName === "buy") {
    const item = interaction.options.getString("ชื่อสินค้า");

    const embed = new EmbedBuilder()
      .setTitle("🔎 กำลังหาซื้อสินค้า")
      .setColor(0x0099ff)
      .addFields(
        { name: "ผู้ซื้อ", value: interaction.user.tag },
        { name: "สินค้า", value: item }
      )
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });

    await interaction.reply({
      content: "โพสต์หาซื้อเรียบร้อย ✅",
      ephemeral: true,
    });
  }
});

/* =========================
   LOGIN BOT
========================= */

client.login(process.env.TOKEN);

/* =========================
   EXPRESS SERVER (สำคัญสำหรับ Railway)
========================= */

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot is running!");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
