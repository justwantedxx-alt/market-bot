const express = require("express");
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");

// =========================
// DISCORD CLIENT
// =========================

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// =========================
// SLASH COMMANDS (GUILD)
// =========================

const commands = [
  new SlashCommandBuilder()
    .setName("sell")
    .setDescription("โพสต์ขายสินค้า")
    .addStringOption(option =>
      option.setName("ชื่อสินค้า")
        .setDescription("ชื่อสินค้า")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("ราคา")
        .setDescription("ราคาสินค้า")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("buy")
    .setDescription("แสดงรายการซื้อ")
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log("Slash commands registered!");
  } catch (err) {
    console.error(err);
  }
});

// =========================
// INTERACTION
// =========================

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "sell") {
    const name = interaction.options.getString("ชื่อสินค้า");
    const price = interaction.options.getString("ราคา");

    const embed = new EmbedBuilder()
      .setTitle("📦 มีสินค้าใหม่ลงขาย!")
      .addFields(
        { name: "ชื่อสินค้า", value: name },
        { name: "ราคา", value: price }
      )
      .setColor("Green")
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === "buy") {
    await interaction.reply("🛒 ระบบซื้อกำลังพัฒนา");
  }
});

client.login(TOKEN);

// =========================
// EXPRESS SERVER (Railway)
// =========================

const app = express();

app.get("/", (req, res) => {
  res.send("Bot is running!");
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
