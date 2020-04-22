/*jshint esversion: 8 */

const Discord = require('discord.js');
const client = new Discord.Client({ autoReconnect: true });
const botVersion = "JS Alpha 0.2";
const devName = "Vanir#0001";

client.on('ready', () => {
    client.user.setPresence({ game: { name: 'with pins 📌' }, status: 'online' });
    console.log("Connected to Servers:");
    console.log("------------------------");
    client.guilds.forEach((guild) => {
        console.log(guild.name);
    });
    console.log("------------------------");
    console.log("Bot is now online.");
    console.log("------------------------");
});

client.on('message', (receivedMessage) => {
    // Prevent bot from responding to its own messages
    if (receivedMessage.author == client.user) {
        return;
    }

    if (receivedMessage.guild === null) {
        DMReply(receivedMessage);
    }
    else if (receivedMessage.content.startsWith(getCmdPrefix(receivedMessage.guild.id)) ||
        receivedMessage.content.startsWith("<@" + client.user.id + ">") ||
        receivedMessage.content.startsWith("<@!" + client.user.id + ">")
    ) {
        ProcessCommand(receivedMessage);
    }
});

client.on('disconnected', function () {

    client.login(botConfig.token);
})

client.on('error', function () {
    console.log("ERROR THROWN - ATTEMPTING TO RECONNECT")
    Restart();
})

async function Restart() {
    console.log("=====RESTARTING=====");
    await client.destroy();
    await client.login(botConfig.token);
}

function ProcessCommand(receivedMessage) {
    let prefix;
    if (receivedMessage.content.startsWith(getCmdPrefix(receivedMessage.guild.id))) {
        prefix = getCmdPrefix(receivedMessage.guild.id);
    }
    else if (receivedMessage.content.startsWith("<@" + client.user.id + ">")) {
        prefix = "<@" + client.user.id + ">";
    }
    else if (receivedMessage.content.startsWith("<@!" + client.user.id + ">")) {
        prefix = "<@!" + client.user.id + ">";
    }

    let msgRemainder = receivedMessage.content.replace(prefix, "");
    msgRemainder = msgRemainder.trim();
    let splitCommand = msgRemainder.split(" ");
    let primaryCommand = splitCommand[0];
    var d = new Date().toLocaleString();
    console.log(d + " | " + primaryCommand + " called by [" + receivedMessage.author.username + "] | " + msgRemainder);
    receivedMessage.content = msgRemainder;
    switch (primaryCommand.toLowerCase()) {
        case "help":
            receivedMessage.content = receivedMessage.content.substring(5);
            Help(receivedMessage);
            break;
        case "info":
            Info(receivedMessage);
            break;
        case "pin":
            receivedMessage.content = receivedMessage.content.substring(4);
            Pin(receivedMessage);
            break;
        case "prefix":
            receivedMessage.content = receivedMessage.content.substring(7);
            SetPrefix(receivedMessage);
            break;
        case "adduseperm":
            receivedMessage.content = receivedMessage.content.substring(12);
            AddUserPerm(receivedMessage);
            break;
        case "removeuseperm":
            receivedMessage.content = receivedMessage.content.substring(14);
            RemoveUserPerm(receivedMessage);
            break;
        case "addconfigperm":
            receivedMessage.content = receivedMessage.content.substring(14);
            addConfigPerm(receivedMessage);
            break;
        case "removeconfigperm":
            receivedMessage.content = receivedMessage.content.substring(16);
            removeConfigPerm(receivedMessage);
            break;
        case "setpinchannel":
            receivedMessage.content = receivedMessage.content.substring(14);
            setPinChannelAction(receivedMessage);
            break;
        case "helloworld":
            HelloWorld(receivedMessage);
            break;
    }

}

async function DMReply(receivedMessage) {
    const dmErrReply = "Unfortunately I can't operate with messages sent to me directly, please utilise my commands within a server!";
    await receivedMessage.channel.send(dmErrReply);
}

async function Help(receivedMessage) {
    const noPermsMsg = "You lack the permissions to use any of my commands, sorry!";
    const useHelpMsg = "**Usage:**\nThe pin bot can be summoned by using either the ``" + getCmdPrefix(receivedMessage.guild.id) +
        "`` prefix, or by tagging <@" + client.user.id + ">.\nPin a message: ``pin <messageId>``\n";
    const pinChannelIsSet = "All pinned messages will be posted in the <#" + getPinChannel(receivedMessage.guild.id) + "> channel\n";
    const pinChannelNotSet = "**A pin channel has not been set for this server yet, please configure one before using this bot.**\n";
    let pinChannelStatus = pinChannelNotSet;
    if (getPinChannel(receivedMessage.guild.id).length == 18) {
        pinChannelStatus = pinChannelIsSet;
    }
    const configHelpMsg = "\n**Configuration Commands:**\nModify usage prefix: ``prefix <newPrefix>``\nPermit a role to use: ``addUsePerm <roleId>``\nRemove a roles usage permission: ``removeUsePerm <roleId>``\nPermit a role to configure: ``addConfigPerm <roleId>``\nRemove a roles configure permission: ``removeConfigPerm <roleId>``\nSet pin channel: ``setPinChannel <channelId>``";
    let customDescription = "";
    if (receivedMessage.member.hasPermission('ADMINISTRATOR')) {
        customDescription = "Welcome back, Administrator.\n" + useHelpMsg + pinChannelStatus + configHelpMsg;
    }
    else {
        if (isUsePermitted(receivedMessage.member.roles)) {
            customDescription = useHelpMsg + pinChannelStatus;
        }
        if (isConfigPermitted(receivedMessage.member.roles)) {
            customDescription += configHelpMsg;
        }
        if (customDescription == "") {
            customDescription = noPermsMsg;
        }
    }
    const helpEmbed = new Discord.RichEmbed()
        .setColor('#e03040')
        .setTitle("Pin Bot | Command Usage")
        .setDescription(customDescription)
        .setThumbnail(client.user.avatarURL)
        .setFooter("Pin Bot | Version: " + botVersion + " | Created by " + devName);

    await receivedMessage.channel.send(helpEmbed);
    return 0;
}
async function Info(receivedMessage) {

    let customDescription = "\nPin bot: What is my purpose?\nVanir: You pin things.\nPin bot: Oh my god...\n";
    const infoEmbed = new Discord.RichEmbed()
        .setColor('#e03040')
        .setTitle('Pin Bot | Info')
        .setThumbnail(client.user.avatarURL)
        .setFooter("Pin Bot | Version: " + botVersion + " | Created by " + devName)
        .setDescription(customDescription);

    await receivedMessage.channel.send(infoEmbed);
    return 0;
}
async function HelloWorld(receivedMessage) {
    if (receivedMessage.member.hasPermission('ADMINISTRATOR') || isUsePermitted(receivedMessage.member.roles) || isConfigPermitted(receivedMessage.member.roles)) {
        receivedMessage.channel.send("Hello world!");
    }
}
async function Pin(receivedMessage) {
    let operand = receivedMessage.content.trim();
    let pinGuildMember = receivedMessage.guild.members.get(receivedMessage.author.id) || await receivedMessage(receivedMessage.author.id, true);

    if (isUsePermitted(pinGuildMember.roles) || pinGuildMember.hasPermission('ADMINISTRATOR')) {
        let pinMessage = null;
        if (!isNaN(operand) && operand.length == 18) {
            pinMessage = await receivedMessage.channel.fetchMessage(operand);
        }
        else {
            let valid = true;
            if (operand.length > 32) {
                let urlPrefix = operand.substring(0, 32);
                if (urlPrefix == "https://discordapp.com/channels/") {
                    let identifiers = operand.replace("https://discordapp.com/channels/", "");
                    let IDs = identifiers.split("/");
                    IDs.forEach(element => {
                        if (isNaN(element)) {
                            valid = false;
                        }
                    });
                    if (IDs.length == 3 && valid) {
                        if (receivedMessage.guild.id == IDs[0]) {
                            if (receivedMessage.guild.channels.has(IDs[1])) {
                                pinMessage = await receivedMessage.guild.channels.get(IDs[1]).fetchMessage(IDs[2]);
                                if (pinMessage == null) {
                                    await receivedMessage.channel.send("Sorry, I couldn't find that message!");
                                }
                            }
                            else {
                                await receivedMessage.channel.send("Sorry, I don't have access to that channel!");
                            }
                        }
                        else {
                            await receivedMessage.channel.send("Sorry, you are trying to pin a message from another server!");
                        }
                    }
                }
            }
        }
        if (pinMessage != null) {
            let pinMsgRef = "" + receivedMessage.guild.id + "|" + pinMessage.channel.id + "|" + pinMessage.id;
            if (logCheck(pinMsgRef)) {
                await receivedMessage.channel.send("Sorry, this message has already been pinned before!");
            }
            else {
                let pinAuthorObject = pinMessage.member || await pinMessage.guild.fetchMember(pinMessage.author.id);
                let pinAuthor = pinMessage.author.id;
                let descFooter = "\n\nPosted by: <@" + pinAuthor + "> | Pinned by <@" + receivedMessage.author.id + ">\nFrom <#" +
                    pinMessage.channel.id + "> | [Jump To Message](" + pinMessage.url + ")";

                var name = pinAuthorObject.nickname;
                if (pinAuthorObject.nickname === null) {
                    name = pinAuthorObject.user.username;
                }

                let pinEmbed = new Discord.RichEmbed()
                    .setColor(pinAuthorObject.highestRole.color)
                    .setTitle(name + " (" + pinMessage.author.tag + ")")
                    .setThumbnail(pinMessage.author.avatarURL)
                    .setDescription(pinMessage.content);

                pinEmbed.addField("Posted by", "<@" + pinAuthor + ">", true);
                pinEmbed.addField("Pinned by", "<@" + receivedMessage.author.id + ">", true);
                pinEmbed.addField("From Channel", "<#" + pinMessage.channel.id + "> | [Jump To Message](" + pinMessage.url + ")");

                let imageAttachments = [];
                let nonImageAttachments = [];
                let attachmentString = "";
                if (pinMessage.attachments.length != 0) {
                    pinMessage.attachments.forEach(element => {
                        if (checkImageURL(element.url)) {
                            imageAttachments.push(element.url);
                        }
                        else {
                            nonImageAttachments.push(element.url);
                        }
                    });

                }
                if (pinMessage.content.includes("https://cdn.discordapp.com/attachments/") || pinMessage.content.includes("://i.imgur.com/")) {
                    let msgDissect = pinMessage.content.split(/\s+/);
                    let cdnURLs = [];
                    msgDissect.forEach(element => {
                        if (element.includes("https://cdn.discordapp.com/attachments/") || element.includes("://i.imgur.com/"))
                            cdnURLs.push(element);
                    });
                    cdnURLs.forEach(element => {
                        if (checkImageURL(element)) {
                            imageAttachments.push(element);
                        }
                        else {
                            nonImageAttachments.push(element);
                        }
                    });
                }
                if (imageAttachments.length > 1 || nonImageAttachments.length != 0) {
                    attachmentString = "**Attachments: **\n";
                }
                if (imageAttachments.length != 0) {
                    if (imageAttachments.length == 1) {
                        pinEmbed.setImage(imageAttachments[0]);
                    }
                    else {
                        imageAttachments.forEach(element => {
                            attachmentString = attachmentString + element + "\n";
                        });
                    }
                }
                if (nonImageAttachments.length != 0) {
                    nonImageAttachments.forEach(element => {
                        attachmentString = attachmentString + element + "\n";
                    });
                }
                let pinChannelID = getPinChannel(receivedMessage.guild.id);
                if (pinChannelID == "") {
                    pinChannelID = receivedMessage.channel.id;
                    await receivedMessage.channel.send("A dedicated pin channel has not been configured. When the pin command is used, it will be sent to the channel I am called from.");
                }
                let pinTextChannel = client.channels.get(pinChannelID);
                await pinTextChannel.send(pinEmbed);
                if (attachmentString != "") {
                    await pinTextChannel.send(attachmentString);
                }
                await receivedMessage.channel.send("Message has been pinned.");
                await receivedMessage.delete();
                logPin(pinMsgRef);
            }
        }
    }
    else {
        await receivedMessage.channel.send("Sorry, you don't have permission to use this command!");
    }

    return 0;
}
async function SetPrefix(receivedMessage) {
    let operand = receivedMessage.content.trim();
    if (receivedMessage.member.hasPermission('ADMINISTRATOR') || isConfigPermitted(receivedMessage.member.roles)) {
        setCmdPrefix(receivedMessage.guild.id, operand);
        await receivedMessage.channel.send("Command prefix updated. New command prefix ``" + operand + "``");
        await receivedMessage.delete();
    }
}
async function AddUserPerm(receivedMessage) {
    let operand = receivedMessage.content.trim();
    if (receivedMessage.member.hasPermission('ADMINISTRATOR') || isConfigPermitted(receivedMessage.member.roles)) {
        if (isNaN(operand)) {
            await receivedMessage.channel.send("Invalid role ID.");
        }
        else {
            addUsePermitted(operand);
            await receivedMessage.channel.send("Added role to permitted usage.");
        }
        await receivedMessage.delete();
    }

}
async function RemoveUserPerm(receivedMessage) {
    let operand = receivedMessage.content.trim();
    if (receivedMessage.member.hasPermission('ADMINISTRATOR') || isConfigPermitted(receivedMessage.member.roles)) {
        if (isNaN(operand)) {
            await receivedMessage.channel.send("Invalid role ID.");
        }
        else {
            removeUsePermitted(operand);
            await receivedMessage.channel.send("Removed role from permitted usage.");
        }
        await receivedMessage.delete();
    }
}
async function addConfigPerm(receivedMessage) {
    let operand = receivedMessage.content.trim();
    if (receivedMessage.member.hasPermission('ADMINISTRATOR') || isConfigPermitted(receivedMessage.member.roles)) {
        if (isNaN(operand)) {
            await receivedMessage.channel.send("Invalid role ID.");
        }
        else {
            addConfigPermitted(operand);
            await receivedMessage.channel.send("Role is now permitted to configure.");
        }
        await receivedMessage.delete();
    }

}
async function removeConfigPerm(receivedMessage) {
    let operand = receivedMessage.content.trim();
    if (receivedMessage.member.hasPermission('ADMINISTRATOR') || isConfigPermitted(receivedMessage.member.roles)) {
        if (isNaN(operand)) {
            await receivedMessage.channel.send("Invalid role ID.");
        }
        else {
            removeConfigPermitted(operand);
            await receivedMessage.channel.send("Role is no longer permitted to configure.");
        }
        await receivedMessage.delete();
    }
}
async function setPinChannelAction(receivedMessage) {
    let operand = receivedMessage.content.trim();
    if (receivedMessage.member.hasPermission('ADMINISTRATOR') || isConfigPermitted(receivedMessage.member.roles)) {
        if (isNaN(operand) && operand.length != 18) {
            await receivedMessage.channel.send("Invalid channel ID.");
        }
        else {
            setPinChannel(receivedMessage.guild.id, operand);
            await receivedMessage.channel.send("<#" + operand + "> is now configured as the pin channel.");
        }
        await receivedMessage.delete();
    }
}

function checkImageURL(urlString) {
    let isImage = false;
    let urlType = urlString.substring(urlString.length - 4);
    switch (urlType) {
        case ".png":
            isImage = true;
            break;
        case ".jpg":
            isImage = true;
            break;
        case ".gif":
            isImage = true;
            break;
    }
    return isImage;
}

function configLoad() {
    const fs = require("fs");
    const dir = "./Resources";
    const configname = "/config.json";
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    if (!fs.existsSync(dir + configname)) {
        console.log("ERROR - CONFIG FILE MISSING:\nA new configuration file has been created in the Resources directory, please modify this to include a bot token.");

        let blankConfig = {
            token: "",
            cmdPrefix: {},
            permittedUseRoles: [],
            permittedConfigRoles: [],
            pinChannel: {},
            pinnedHistory: []
        };

        let data = JSON.stringify(blankConfig, null, 2);
        fs.writeFileSync(dir + configname, data);
        return 0;
    }
    let rawData = fs.readFileSync(dir + configname);
    let output = JSON.parse(rawData);
    return output;
}
function updateConfig() {
    const fs = require("fs");
    const filePath = "./Resources/config.json";
    fs.writeFileSync(filePath, JSON.stringify(botConfig, null, 2));
}

function getCmdPrefix(guildID) {
    let cmdPrefix = botConfig["cmdPrefix"];
    if (cmdPrefix.hasOwnProperty(guildID)) {
        return cmdPrefix[guildID]
    }
    else {
        cmdPrefix[guildID] = "--";
        botConfig["cmdPrefix"] = cmdPrefix;
        updateConfig();
        return "--";
    }
}
function setCmdPrefix(guildID, newPrefix) {
    botConfig["cmdPrefix"][guildID] = newPrefix;
    updateConfig();
}

function isUsePermitted(userRoles) {
    let crossover = userRoles.filter(Set.prototype.has, new Set(botConfig["permittedUseRoles"]))
    return crossover.length != 0
}
function isRoleUsePermitted(roleID) {
    return botConfig["permittedUseRoles"].includes(roleID);
}
function addUsePermitted(roleID) {
    if (!isRoleUsePermitted(roleID)) {
        botConfig["permittedUseRoles"].push(roleID);
        updateConfig();
    }
}
function removeUsePermitted(roleID) {
    if (isRoleUsePermitted(roleID)) {
        botConfig["permittedUseRoles"].splice(botConfig["permittedUseRoles"].indexOf(roleID), 1);
        updateConfig();
    }
}

function isConfigPermitted(userRoles) {
    let crossover = userRoles.filter(Set.prototype.has, new Set(botConfig["permittedConfigRoles"]))
    return crossover.length != 0;
}
function isRoleConfigPermitted(roleID) {
    return botConfig["permittedConfigRoles"].includes(roleID);
}
function addConfigPermitted(roleID) {
    if (!isRoleConfigPermitted(roleID)) {
        botConfig["permittedConfigRoles"].push(roleID);
        updateConfig();
    }
}
function removeConfigPermitted(roleID) {
    if (isRoleConfigPermitted(roleID)) {
        botConfig["permittedConfigRoles"].splice(botConfig["permittedConfigRoles"].indexOf(roleID), 1);
        updateConfig();
    }
}

function getPinChannel(guildID) {
    let pinChannelStorage = botConfig["pinChannel"];
    if (pinChannelStorage.hasOwnProperty(guildID)) {
        return pinChannelStorage[guildID];
    }
    else {
        return "";
    }
}
function setPinChannel(guildID, channelID) {
    botConfig.pinChannel[guildID] = channelID;
    updateConfig();
}

function logPin(msgRef) {
    if (!logCheck(msgRef)) {
        botConfig["pinnedHistory"].push(msgRef);
        updateConfig();
    }
}
function logCheck(msgRef) {
    if (botConfig["pinnedHistory"].includes(msgRef)) {
        return true;
    }
    else {
        return false;
    }
}

var botConfig = configLoad();
if (botConfig != 0) {
    if (botConfig.token != "") {
        client.login(botConfig.token)
    }
    else {
        console.log("ERROR - BOT TOKEN MISSING:\n Please enter your API token into the Resources/config.json file.");
    }
}