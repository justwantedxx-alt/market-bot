const express = require("express");
const mongoose = require("mongoose");
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField
} = require("discord.js");

const app = express();
const PORT = process.env.PORT || 8080;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const MONGO_URI = process.env.MONGO_URI;

/* =======================
   DATABASE
======================= */

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const marketSchema = new mongoose.Schema({
  sellerId: String,
  productName: String,
  price: String,
  description: String,
  image: String,
  status: { type: String, default: "pending" }
});

const Market = mongoose.model("Market", marketSchema);

/* =======================
   CHANNEL CONFIG
======================= */

const PENDING_CHANNEL = "ใส่ไอดีห้องรออนุมัติ";
const MARKET_CHANNEL = "ใส่ไอดีห้องตลาดจริง";
const LOG_CHANNEL = "ใส่ไอดีห้อง log";
const ADMIN_ROLE = "ใส่ไอดี role แอดมิน";

/* =======================
   SLASH COMMAND
======================= */

const commands = [
  new SlashCommandBuilder()
    .setName("sell")
    .setDescription("โพสต์ขายสินค้า")
    .addStringOption(o => o.setName("ชื่อสินค้า").setRequired(true))
    .addStringOption(o => o.setName("ราคา").setRequired(true))
    .addStringOption(o => o.setName("รายละเอียด").setRequired(true))
    .addStringOption(o => o.setName("รูปภาพลิงก์").setRequired(true))
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
  console.log("Slash commands registered!");
});

/* =======================
   SELL COMMAND
======================= */

client.on("interactionCreate", async interaction => {

  if (interaction.isChatInputCommand()) {

    if (interaction.commandName === "sell") {

      const name = interaction.options.getString("ชื่อสินค้า");
      const price = interaction.options.getString("ราคา");
      const desc = interaction.options.getString("รายละเอียด");
      const image = interaction.options.getString("รูปภาพลิงก์");

      const newItem = await Market.create({
        sellerId: interaction.user.id,
        productName: name,
        price,
        description: desc,
        image
      });

      const embed = new EmbedBuilder()
        .setTitle("📦 สินค้ารออนุมัติ")
        .addFields(
          { name: "สินค้า", value: name },
          { name: "ราคา", value: price },
          { name: "รายละเอียด", value: desc },
          { name: "ผู้ขาย", value: `<@${interaction.user.id}>` }
        )
        .setImage(image)
        .setColor("Yellow")
        .setFooter({ text: `ID: ${newItem._id}` })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`approve_${newItem._id}`)
          .setLabel("อนุมัติ")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`reject_${newItem._id}`)
          .setLabel("ปฏิเสธ")
          .setStyle(ButtonStyle.Danger)
      );

      const channel = client.channels.cache.get(PENDING_CHANNEL);
      await channel.send({ embeds: [embed], components: [row] });

      await interaction.reply({ content: "โพสต์ถูกส่งให้แอดมินตรวจสอบแล้ว", ephemeral: true });
    }
  }

  /* =======================
     BUTTON HANDLER
  ======================= */

  if (interaction.isButton()) {

    const [action, id] = interaction.customId.split("_");
    const item = await Market.findById(id);

    if (!item) return;

    if (!interaction.member.roles.cache.has(ADMIN_ROLE))
      return interaction.reply({ content: "คุณไม่มีสิทธิ์", ephemeral: true });

    if (action === "approve") {

      item.status = "approved";
      await item.save();

      const embed = new EmbedBuilder()
        .setTitle("🛒 สินค้าพร้อมขาย!")
        .addFields(
          { name: "สินค้า", value: item.productName },
          { name: "ราคา", value: item.price },
          { name: "รายละเอียด", value: item.description }
        )
        .setImage(item.image)
        .setColor("Green")
        .setTimestamp();

      const buyButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`buy_${item._id}`)
          .setLabel("ซื้อเลย")
          .setStyle(ButtonStyle.Primary)
      );

      const marketChannel = client.channels.cache.get(MARKET_CHANNEL);
      const logChannel = client.channels.cache.get(LOG_CHANNEL);

      await marketChannel.send({ embeds: [embed], components: [buyButton] });
      await logChannel.send(`สินค้า ${item.productName} ถูกอนุมัติ`);

      await interaction.update({ content: "อนุมัติแล้ว", embeds: [], components: [] });
    }

    if (action === "buy") {

      const seller = await client.users.fetch(item.sellerId);
      await seller.send(`มีคนสนใจซื้อสินค้า ${item.productName}`);

      const logChannel = client.channels.cache.get(LOG_CHANNEL);
      await logChannel.send(`มีคนกดซื้อสินค้า ${item.productName}`);

      await interaction.reply({ content: "แจ้งผู้ขายแล้ว!", ephemeral: true });
    }
  }
});

/* =======================
   EXPRESS
======================= */

app.get("/", (req, res) => {
  res.send("Bot Running");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

client.login(TOKEN);
