const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");
const {
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const utils = require("./config/utils");
const mysql2 = require("mysql2");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

client.commands = new Collection();

//Informações de inicialização do BOT
client.once(Events.ClientReady, (c) => {
  const guilds = client.guilds.cache.map((guild) => ({
    id: guild.id,
    name: guild.name,
    memberCount: guild.memberCount,
  }));

  console.log("Servidores:");
  guilds.forEach((guild) => {
    console.log(
      `${guild.name} (ID: ${guild.id}) - Membros: ${guild.memberCount}`
    );
  });
  console.log(
    `${c.user.username} está presente em ${client.guilds.cache.size} servidor(es).`
  );

  console.log(
    `Bem-vindo! Eu sou o ${c.user.username} e estou pronto para trabalhar!`
  );
});

client.on(Events.InteractionCreate, (interaction) => {
  console.log(interaction);
});

//Para o caso de Slash Commands
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`O comando ${interaction.commandName} não foi encontrado.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "Ocorreu um erro ao executar esse comando!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "Ocorreu um erro ao executar esse comando!",
        ephemeral: true,
      });
    }
  }
});

//Whitelist
client.on("messageCreate", async (interaction) => {
  if (interaction.author.bot || !interaction.guild) return;

  if (interaction.content === "+whitelist") {
    const allowedRolesIds = [utils.fundador, utils.ceo, utils.adm];

    const memberRolesIds = interaction.member.roles.cache.map(
      (role) => role.id
    );
    const hasAllowedRole = memberRolesIds.some((roleId) =>
      allowedRolesIds.includes(roleId)
    );

    if (!hasAllowedRole) {
      return interaction.reply({
        content: "Você não tem permissão para usar esse comando.",
        ephemeral: true,
      });
    }

    const wlEmbed = new EmbedBuilder()
      .setTitle("Bem vindo a Hórus Roleplay \u{1F973}\n")
      .setColor(utils.embedColor)
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter({
        text: "Desenvolvido por NitroLabs Software",
        iconURL: utils.logoIcon,
      })
      .setTimestamp()

      .addFields(
        {
          name: "**PEGUE SEU ID**",
          value: "connect horus.fivem-rp.online",
          inline: false,
        },
        {
          name: "**COMO LIBERAR ID:**",
          value: "Use o comando /liberar + ID",
          inline: false,
        }
      );

    const btnFivem = new ButtonBuilder()
      .setLabel("Conectar")
      .setURL("https://google.com")
      .setEmoji("905498840755490816")
      .setStyle(ButtonStyle.Link);

    const btnRules = new ButtonBuilder()
      .setLabel("Regras")
      .setURL(
        "https://discord.com/channels/1037148094434910280/1037148095517032481"
      )
      .setEmoji("905499772880814181")
      .setStyle(ButtonStyle.Link);

    const row = new ActionRowBuilder().addComponents(btnFivem, btnRules);

    interaction.channel.send({ embeds: [wlEmbed], components: [row] });
  }
});

//ping
client.on("messageCreate", async (interaction) => {
  if (interaction.author.bot || !interaction.guild) return;

  if (interaction.content === "!ping") {
    const allowedRolesIds = [
      utils.fundador,
      utils.ceo,
      utils.mod,
      utils.cidadao,
    ];

    const memberRolesIds = interaction.member.roles.cache.map(
      (role) => role.id
    );
    const hasAllowedRole = memberRolesIds.some((roleId) =>
      allowedRolesIds.includes(roleId)
    );

    if (!hasAllowedRole) {
      return interaction.reply({
        content: "Você não tem permissão para usar esse comando.",
        ephemeral: true,
      });
    }

    //Calcular a latência do BOT
    const sentTimestamp = interaction.createdTimestamp;
    const now = Date.now();
    const latency = sentTimestamp - now;

    const embed = new EmbedBuilder()
      .setDescription(` \u{1F916} <@1011335418823843851>!`)
      .setAuthor({
        name: interaction.guild.name,
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setColor(utils.embedColor)
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .addFields({
        name: "Ping do BOT",
        value: `${latency}ms`,
        inline: false,
      })
      .setFooter({
        text: "Desenvolvido por NitroLabs Software",
        iconURL: utils.nitroIcon,
      })
      .setTimestamp();

    interaction.reply({ embeds: [embed] });
  }
});

//Cars
client.on("messageCreate", async (interaction) => {
  if (interaction.author.bot || !interaction.guild) return;

  if (interaction.content.startsWith("!cars ")) {
    const args = interaction.content.slice("!cars ".length).trim().split(/ +/);
    const plId = args[0];

    console.log("ID passado:" + plId);

    const allowedRolesIds = [utils.fundador, utils.ceo, utils.mod, utils.adm];

    const memberRolesIds = interaction.member.roles.cache.map(
      (role) => role.id
    );
    const hasAllowedRole = memberRolesIds.some((roleId) =>
      allowedRolesIds.includes(roleId)
    );

    if (!hasAllowedRole) {
      return interaction.reply({
        content: "Você não tem permissão para usar esse comando.",
        ephemeral: true,
      });
    }

    //Parametros de conexão
    const conn = mysql2.createConnection({
      host: utils.host,
      user: utils.user,
      password: utils.password,
      database: utils.database,
    });

    //Conexão
    conn.connect(function (err) {
      if (err) {
        console.error("Erro ao acessar o banco de dados: " + err);
      } else {
        console.log("Conectado ao Banco de Dados.");
      }
    });

    //QUERY consulta
    let consultaCarros = `SELECT * FROM vrp_user_vehicles WHERE user_id=${plId}`;

    conn.query(consultaCarros, (error, results) => {
      if (error) {
        console.log("Erro ao buscar os dados no banco: " + error);
      } else {
        //console.log(results);
        let vehicleStr = "";
        results.forEach((car) => {
          console.log(car);
          const carName = car.vehicle;
          vehicleStr += `[Modelo]: ${carName}, \n`;
          //console.log(carName)
          console.log(vehicleStr);
        });

        const embed = new EmbedBuilder()
          .setDescription(`Lista de veículos do jogador`)
          .setAuthor({
            name: interaction.guild.name,
            iconURL: interaction.guild.iconURL({ dynamic: true }),
          })
          .setColor(utils.embedColor)
          .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
          .addFields(
            {
              name: "**Jogador:**",
              value: ` **${plId}** `,
              inline: true,
            },
            {
              name: "Total de Veículos:",
              value: `[**${results.length}**]`,
              inline: true,
            },
            {
              name: "Veículos:",
              value: `**${vehicleStr}**`,
              inline: false,
            }
          )
          .setFooter({
            text: "Desenvolvido por NitroLabs Software",
            iconURL: utils.logoIcon,
          })
          .setTimestamp();

        interaction.reply({ embeds: [embed] });
      }
    });
  }
});

//Addcar
client.on("messageCreate", async (interaction) => {
	if (interaction.author.bot || !interaction.guild) return;
  
	if (interaction.content.startsWith("!addcar ")) {
	  const args = interaction.content.slice("!addcar ".length).trim().split(/ +/);
	  const plId = args[0];
	  const veiculoAdd = args[1];
  
	  console.log("ID passado:" + plId);
	  console.log("Veículo passado:" + veiculoAdd);
  
	  const allowedRolesIds = [utils.fundador, utils.ceo, utils.adm];
  
	  const memberRolesIds = interaction.member.roles.cache.map(
		(role) => role.id
	  );
	  const hasAllowedRole = memberRolesIds.some((roleId) =>
		allowedRolesIds.includes(roleId)
	  );
  
	  if (!hasAllowedRole) {
		return interaction.reply({
		  content: "Você não tem permissão para usar esse comando.",
		  ephemeral: true,
		});
	  }
  
	  //Parametros de conexão
	  const conn = mysql2.createConnection({
		host: utils.host,
		user: utils.user,
		password: utils.password,
		database: utils.database,
	  });
  
	  //Conexão
	  conn.connect(function (err) {
		if (err) {
		  console.error("Erro ao acessar o banco de dados: " + err);
		} else {
		  console.log("Conectado ao Banco de Dados.");
		}
	  });
  
		//QUERY consulta
		let consultaCarros = `SELECT * FROM vrp_user_vehicles WHERE user_id=${plId}`;
		let addCarros = `INSERT INTO vrp_user_vehicles (user_id, vehicle, detido, time, engine, body, fuel) VALUES (${plId}, '${veiculoAdd}', '0', '0', '1000', '1000', '100' )`
		//console.log('CONSULTA DADOS: ' + consultaCarros)

		conn.query(consultaCarros, (error, results) => {
			if (error) {
			  console.log("Erro ao buscar os dados no banco: " + error);
			} else {
			  //console.log(results);
			  };
		});

		conn.query(addCarros, (error, results) => {
			if (error) {
			  console.log("Erro ao buscar os dados no banco: " + error);
			} else {
			  //console.log(results);
			  const resultsArr = Array.from(results) //Transforma os results em um Array
			  //const resultadosAtt = resultsArr.filter(carro => carro.vehicle !== veiculoExcluir)
			  //console.log(resultadosAtt)
			  console.log(`[${veiculoAdd}]` + " adicionado com sucesso" + " para o id " + `${plId}`)
			};
		});

		const embed = new EmbedBuilder()
			.setDescription(`**Sucesso! Veículo entregue ao jogador!**`)
			.setAuthor({
			name: interaction.guild.name,
			iconURL: interaction.guild.iconURL({ dynamic: true }),
			})
			.setColor(utils.embedColor)
			.setThumbnail(interaction.guild.iconURL({ dynamic: true }))
			.addFields(
				{
					name: "**ID:**",
					value: `[${plId}]`,
					inline: true,
				},
				{
					name: "**Veículo Adicionado:**",
					value: `**${veiculoAdd}**`,
					inline: true,
				},
				{
					name: "[Staff Responsável]",
					value: `${interaction.author.toString()}`,
					inline: true,
				},
			)
			.setFooter({
			text: "Desenvolvido por NitroLabs Software",
			iconURL: utils.logoIcon,
			})
			.setTimestamp();
  
		  	interaction.reply({ embeds: [embed] });
			interaction.delete();
		}
});

//Delcar
client.on("messageCreate", async (interaction) => {
	if (interaction.author.bot || !interaction.guild) return;
  
	if (interaction.content.startsWith("!delcar ")) {
	  const args = interaction.content.slice("!delcar ".length).trim().split(/ +/);
	  const plId = args[0];
	  const veiculoDel = args[1];
  
	  console.log("ID passado:" + plId);
	  console.log("Veículo passado:" + veiculoDel);
  
	  const allowedRolesIds = [utils.fundador, utils.ceo, utils.adm];
  
	  const memberRolesIds = interaction.member.roles.cache.map(
		(role) => role.id
	  );
	  const hasAllowedRole = memberRolesIds.some((roleId) =>
		allowedRolesIds.includes(roleId)
	  );
  
	  if (!hasAllowedRole) {
		return interaction.reply({
		  content: "Você não tem permissão para usar esse comando.",
		  ephemeral: true,
		});
	  }
  
	  //Parametros de conexão
	  const conn = mysql2.createConnection({
		host: utils.host,
		user: utils.user,
		password: utils.password,
		database: utils.database,
	  });
  
	  //Conexão
	  conn.connect(function (err) {
		if (err) {
		  console.error("Erro ao acessar o banco de dados: " + err);
		} else {
		  console.log("Conectado ao Banco de Dados.");
		}
	  });
  
		//QUERY consulta
		let consultaCarros = `SELECT * FROM vrp_user_vehicles WHERE user_id=${plId}`;
		let deletarCarros = `DELETE FROM vrp_user_vehicles WHERE vehicle='${veiculoDel}' AND user_id=${plId}`
		//console.log('CONSULTA DADOS: ' + consultaCarros)

		conn.query(consultaCarros, (error, results) => {
			if (error) {
			  console.log("Erro ao buscar os dados no banco: " + error);
			} else {
			  //console.log(results);
			} ;
		});

		conn.query(deletarCarros, (error, results) => {
			if (error) {
			  console.log("Erro ao buscar os dados no banco: " + error);
			} else {
			  //console.log(results);
			  const resultsArr = Array.from(results) //Transforma os results em um Array
			  //const resultadosAtt = resultsArr.filter(carro => carro.vehicle !== veiculoExcluir)
			  //console.log(resultadosAtt)

			  const embed = new EmbedBuilder()
			  .setDescription(`**Veículo Excluído com Sucesso!**`)
			  .setAuthor({
			  name: interaction.guild.name,
			  iconURL: interaction.guild.iconURL({ dynamic: true }),
			  })
			  .setColor(utils.embedColor)
			  .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
			  .addFields(
				  {
					  name: "**ID:**",
					  value: `[${plId}]`,
					  inline: true,
				  },
				  {
					  name: "**Veículo Removido:**",
					  value: `**${veiculoDel}**`,
					  inline: true,
				  },
				  {
					  name: "**Staff Responsável:**",
					  value: `**${interaction.author.toString()}**`,
					  inline: true,
				  },
			  )
			  .setFooter({
			  text: "Desenvolvido por NitroLabs Software",
			  iconURL: utils.logoIcon,
			  })
			  .setTimestamp();
	
				interaction.reply({ embeds: [embed] });
			  interaction.delete();

			  console.log(`[${veiculoDel}]` + " removido com sucesso" + " do id " + `${plId}`)
			};
		});
		}
});

//RG
client.on("messageCreate", async (interaction) => {
	if (interaction.author.bot || !interaction.guild) return;
  
	if (interaction.content.startsWith("!rg ")) {
	  const args = interaction.content.slice("!rg ".length).trim().split(/ +/);
	  const plId = args[0];
  
	  console.log("ID passado:" + plId);
  
	  const allowedRolesIds = [utils.fundador, utils.ceo, utils.adm];
  
	  const memberRolesIds = interaction.member.roles.cache.map(
		(role) => role.id
	  );
	  const hasAllowedRole = memberRolesIds.some((roleId) =>
		allowedRolesIds.includes(roleId)
	  );
  
	  if (!hasAllowedRole) {
		return interaction.reply({
		  content: "Você não tem permissão para usar esse comando.",
		  ephemeral: true,
		});
	  }
  
	  //Parametros de conexão
	  const conn = mysql2.createConnection({
		host: utils.host,
		user: utils.user,
		password: utils.password,
		database: utils.database,
	  });
  
	  //Conexão
	  conn.connect(function (err) {
		if (err) {
		  console.error("Erro ao acessar o banco de dados: " + err);
		} else {
		  console.log("Conectado ao Banco de Dados.");
		}
	  });
  
		//QUERY consulta
		let consultaDados = `SELECT * FROM vrp_user_identities WHERE user_id=${plId}`;
		//console.log('CONSULTA DADOS: ' + consultaCarros)

		conn.query(consultaDados, (error, results) => {
			if (error) {
			  console.log("Erro ao buscar os dados no banco: " + error);
			} else {
			  //console.log(results);
	  
			  results.forEach((rg) => {
				console.log(rg);
				ridentidade = rg.registration;
				tel = rg.phone;
				nome = rg.name;
				sobrenome = rg.firstname;
				idade = rg.age;
			  });
	  
			  const embed = new EmbedBuilder()
				.setDescription(`**DADOS DO PLAYER**`)
				.setAuthor({
				  name: interaction.guild.name,
				  iconURL: interaction.guild.iconURL({ dynamic: true }),
				})
				.setColor(utils.embedColor)
				.setThumbnail(interaction.guild.iconURL({ dynamic: true }))
				.addFields(
				  {
					name: "[ID]",
					value: `${plId}`,
					inline: true,
				  },
				  {
					name: "[NOME]",
					value: `${nome} ${sobrenome}`,
					inline: true,
				  },
				  {
					  name: "[IDADE]",
					  value: `${idade}`,
					  inline: true,
				  },
				  {
					  name: "[RG]",
					  value: `${ridentidade}`,
					  inline: true,
				  },
				  {
					  name: "[TELEFONE]",
					  value: `${tel}`,
					  inline: true,
				  },
				)
				.setFooter({
				  text: "Desenvolvido por NitroLabs Software",
				  iconURL: utils.logoIcon,
				})
				.setTimestamp();
	
				interaction.channel.send({ embeds: [embed] });
				setTimeout(() => {
					interaction.delete()
				}, 1000)
			};
		});
		}
});

//Groups
client.on("messageCreate", async (interaction) => {
	if (interaction.author.bot || !interaction.guild) return;
  
	if (interaction.content.startsWith("!groups ")) {
	  const args = interaction.content.slice("!groups ".length).trim().split(/ +/);
	  const plId = args[0];
  
	  console.log("ID passado:" + plId);
  
	  const allowedRolesIds = [utils.fundador, utils.ceo, utils.adm];
  
	  const memberRolesIds = interaction.member.roles.cache.map(
		(role) => role.id
	  );
	  const hasAllowedRole = memberRolesIds.some((roleId) =>
		allowedRolesIds.includes(roleId)
	  );
  
	  if (!hasAllowedRole) {
		return interaction.reply({
		  content: "Você não tem permissão para usar esse comando.",
		  ephemeral: true,
		});
	  }
  
	  //Parametros de conexão
	  const conn = mysql2.createConnection({
		host: utils.host,
		user: utils.user,
		password: utils.password,
		database: utils.database,
	  });
  
	  //Conexão
	  conn.connect(function (err) {
		if (err) {
		  console.error("Erro ao acessar o banco de dados: " + err);
		} else {
		  console.log("Conectado ao Banco de Dados.");
		}
	  });
  
    //QUERY consulta
    let consultaGrupos = `SELECT * FROM vrp_user_data WHERE user_id=${plId}`;
    //let consultaNomePlayer = `SELECT * FROM vrp_user_identities WHERE user_id=${id}`;
    //console.log('CONSULTA DADOS: ' + consultaCarros)

    conn.query(consultaGrupos, (error, results) => {
		if (error) {
		  console.log("Erro ao buscar os dados no banco: " + error);
		} else {
		  //console.log(results);
		  let groupStr = "";
		  results.forEach((group) => {
			//console.log(group);
			if(group.dkey === "vRP:datatable"){
			  const groupsValue = JSON.parse(group.dvalue)
			  //console.log(groupsValue)
			  const groupsName = groupsValue.groups;
			  if(groupsName){
				  Object.keys(groupsName).forEach((groupName) => {
					  groupStr += `'${groupName}', \n`
				  })
			  }
			}
	  });
  
		  const embed = new EmbedBuilder()
			.setDescription(`**[GRUPOS DO JOGADOR]**`)
			.setAuthor({
			  name: interaction.guild.name,
			  iconURL: interaction.guild.iconURL({ dynamic: true }),
			})
			.setColor(utils.embedColor)
			.setThumbnail(interaction.guild.iconURL({ dynamic: true }))
			.addFields(
			  {
				name: "[ID]:",
				value: `${plId}`,
				inline: true,
			  },
			  {
				name: "[GRUPOS]",
				value: `${groupStr}`,
				inline: false,
			  }
			)
			.setFooter({
			  text: "Desenvolvido por NitroLabs Software",
			  iconURL: utils.logoIcon,
			})
			.setTimestamp();
	
				interaction.channel.send({ embeds: [embed] });
				setTimeout(() => {
					interaction.delete()
				}, 1000)
			};
		});
	}
});

//Groups Ids
client.on("messageCreate", async (interaction) => {
	if (interaction.author.bot || !interaction.guild) return;
  
	if (interaction.content.startsWith("!groupids ")) {
	  const args = interaction.content.slice("!groupids ".length).trim().split(/ +/);
	  const groupName = args[0];
  
	  console.log("Grupo passado:" + groupName);
  
	  const allowedRolesIds = [utils.fundador, utils.ceo, utils.adm];
  
	  const memberRolesIds = interaction.member.roles.cache.map(
		(role) => role.id
	  );
	  const hasAllowedRole = memberRolesIds.some((roleId) =>
		allowedRolesIds.includes(roleId)
	  );
  
	  if (!hasAllowedRole) {
		return interaction.reply({
		  content: "Você não tem permissão para usar esse comando.",
		  ephemeral: true,
		});
	  }
  
	  //Parametros de conexão
	  const conn = mysql2.createConnection({
		host: utils.host,
		user: utils.user,
		password: utils.password,
		database: utils.database,
	  });
  
	  //Conexão
	  conn.connect(function (err) {
		if (err) {
		  console.error("Erro ao acessar o banco de dados: " + err);
		} else {
		  console.log("Conectado ao Banco de Dados.");
		}
	  });
  
    // Consulta SQL
    const consultaGroupIDs = `SELECT user_id FROM vrp_user_data WHERE dkey = 'vRP:datatable' AND JSON_EXTRACT(dvalue, '$.groups.${groupName}') IS NOT NULL`;
    console.log(consultaGroupIDs)

    conn.query(consultaGroupIDs, (error, results) => {
      if (error) {
        console.log("Erro ao buscar os dados no banco: " + error);
      } else {
        const ids = results.map((row) => row.user_id);
        console.log(ids)

        const embed = new EmbedBuilder()
          .setDescription(`**Busca de usuários de um grupo:**`)
          .setAuthor({
            name: interaction.guild.name,
            iconURL: interaction.guild.iconURL({ dynamic: true }),
          })
          .setColor(utils.embedColor)
          .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
          .addFields(
			{
				name: "[Grupo]:",
				value: `${groupName}, `,
				inline: true,
			},
            {
              name: "[IDs]:",
              value: `${ids}, `,
              inline: true,
            },
          )
          .setFooter({
            text: "Desenvolvido por NitroLabs Software",
            iconURL: utils.logoIcon,
          })
          .setTimestamp();
	
				interaction.channel.send({ embeds: [embed] });
				setTimeout(() => {
					interaction.delete()
				}, 1000)
			};
		});
	}
});

//Rename
client.on("messageCreate", async (interaction) => {
	if (interaction.author.bot || !interaction.guild) return;
  
	if (interaction.content.startsWith("!rename ")) {
	  const args = interaction.content.slice("!rename ".length).trim().split(/ +/);
	  const plId = args[0];
	  const nome = args[1];
	  const sobrenome = args[2];
  
	  console.log(`ID: ${plId} | ${nome} ${sobrenome}`);
  
	  const allowedRolesIds = [utils.fundador, utils.ceo, utils.adm];
  
	  const memberRolesIds = interaction.member.roles.cache.map(
		(role) => role.id
	  );
	  const hasAllowedRole = memberRolesIds.some((roleId) =>
		allowedRolesIds.includes(roleId)
	  );
  
	  if (!hasAllowedRole) {
		return interaction.reply({
		  content: "Você não tem permissão para usar esse comando.",
		  ephemeral: true,
		});
	  }
  
	  //Parametros de conexão
	  const conn = mysql2.createConnection({
		host: utils.host,
		user: utils.user,
		password: utils.password,
		database: utils.database,
	  });
  
	  //Conexão
	  conn.connect(function (err) {
		if (err) {
		  console.error("Erro ao acessar o banco de dados: " + err);
		} else {
		  console.log("Conectado ao Banco de Dados.");
		}
	  });
  
    //QUERY consulta
    let consultaDados = `SELECT * FROM vrp_user_identities WHERE user_id=${plId}`;
    let updateDados = `UPDATE vrp_user_identities SET name='${nome}', firstname='${sobrenome}' WHERE user_id=${plId}` 
    //console.log('CONSULTA DADOS: ' + consultaDados)
    console.log('UPDATE DADOS: ' + updateDados)
    
    conn.query(consultaDados, (error, results) => {
      if (error) {
        console.log("Erro ao buscar os dados no banco: " + error);
      } else {
        console.log(results);
      }
    });

    conn.query(updateDados, (error, results) => {
		if(error){
		  console.log("Erro ao buscar os dados no banco: " + error);
		}else{
		  console.log(results)
  
		  const embed = new EmbedBuilder()
			.setDescription(`Alteração de nome realizada com sucesso!]`)
			.setAuthor({
			  name: interaction.guild.name,
			  iconURL: interaction.guild.iconURL({ dynamic: true }),
			})
			.setColor(utils.embedColor)
			.setThumbnail(interaction.guild.iconURL({ dynamic: true }))
			.addFields(
			  {
				name: "[ID]",
				value: `${plId}`,
				inline: true,
			  },
			  {
				name: "[NOVO NOME]",
				value: `${nome} ${sobrenome}`,
				inline: true,
			  },
			  {
				name: "[Staff Responsável]",
				value: `${interaction.author.toString()}`,
				inline: true,
			  },
			)
			.setFooter({
			  text: "Desenvolvido por NitroLabs Software",
			  iconURL: utils.logoIcon,
			})
			.setTimestamp();
	
				interaction.channel.send({ embeds: [embed] });
				setTimeout(() => {
					interaction.delete()
				}, 1000)
			};
		});
	}
});

//Troca Tel
client.on("messageCreate", async (interaction) => {
	if (interaction.author.bot || !interaction.guild) return;
  
	if (interaction.content.startsWith("!telp ")) {
	  const args = interaction.content.slice("!telp ".length).trim().split(/ +/);
	  const plId = args[0];
	  const tel = args[1];
  
	  console.log(`ID: ${plId} | Telefone Novo: ${tel}`);
  
	  const allowedRolesIds = [utils.fundador, utils.ceo, utils.adm];
  
	  const memberRolesIds = interaction.member.roles.cache.map(
		(role) => role.id
	  );
	  const hasAllowedRole = memberRolesIds.some((roleId) =>
		allowedRolesIds.includes(roleId)
	  );
  
	  if (!hasAllowedRole) {
		return interaction.reply({
		  content: "Você não tem permissão para usar esse comando.",
		  ephemeral: true,
		});
	  }
  
	  //Parametros de conexão
	  const conn = mysql2.createConnection({
		host: utils.host,
		user: utils.user,
		password: utils.password,
		database: utils.database,
	  });
  
	  //Conexão
	  conn.connect(function (err) {
		if (err) {
		  console.error("Erro ao acessar o banco de dados: " + err);
		} else {
		  console.log("Conectado ao Banco de Dados.");
		}
	  });
  
    //QUERY consulta
    let consultaDados = `SELECT * FROM vrp_user_identities WHERE user_id=${plId}`;
    let updateDados = `UPDATE vrp_user_identities SET phone='${tel}' WHERE user_id=${plId}` 
    //console.log('CONSULTA DADOS: ' + consultaDados)
    //console.log('UPDATE DADOS: ' + updateDados)
    
    conn.query(consultaDados, (error, results) => {
      if (error) {
        console.log("Erro ao buscar os dados no banco: " + error);
      } else {
        console.log(results);
      }
    });

    conn.query(updateDados, (error, results) => {
      if(error){
        console.log("Erro ao buscar os dados no banco: " + error);
      }else{
        console.log(results)

        const embed = new EmbedBuilder()
          .setDescription(`**[Telefone alterado com sucesso!]**`)
          .setAuthor({
            name: interaction.guild.name,
            iconURL: interaction.guild.iconURL({ dynamic: true }),
          })
          .setColor(utils.embedColor)
          .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
          .addFields(
            {
              name: "**[ID]**",
              value: `${plId}`,
              inline: true,
            },
            {
              name: "**[Novo Telefone]**",
              value: `${tel}`,
              inline: true,
            },
			{
				name: "**[Staff Responsável]**",
				value: `${interaction.author.toString()}`,
				inline: true,
			},
          )
          .setFooter({
            text: "Desenvolvido por NitroLabs Software",
            iconURL: utils.logoIcon,
          })
          .setTimestamp();
	
				interaction.channel.send({ embeds: [embed] });
				setTimeout(() => {
					interaction.delete()
				}, 1000)
			};
		});
	}
});

//Troca Placa
client.on("messageCreate", async (interaction) => {
	if (interaction.author.bot || !interaction.guild) return;
  
	if (interaction.content.startsWith("!placap ")) {
	  const args = interaction.content.slice("!placap ".length).trim().split(/ +/);
	  const plId = args[0];
	  const placa = args[1];
  
	  console.log(`ID: ${plId} | Placa Novo: ${placa}`);
  
	  const allowedRolesIds = [utils.fundador, utils.ceo, utils.adm];
  
	  const memberRolesIds = interaction.member.roles.cache.map(
		(role) => role.id
	  );
	  const hasAllowedRole = memberRolesIds.some((roleId) =>
		allowedRolesIds.includes(roleId)
	  );
  
	  if (!hasAllowedRole) {
		return interaction.reply({
		  content: "Você não tem permissão para usar esse comando.",
		  ephemeral: true,
		});
	  }
  
	  //Parametros de conexão
	  const conn = mysql2.createConnection({
		host: utils.host,
		user: utils.user,
		password: utils.password,
		database: utils.database,
	  });
  
	  //Conexão
	  conn.connect(function (err) {
		if (err) {
		  console.error("Erro ao acessar o banco de dados: " + err);
		} else {
		  console.log("Conectado ao Banco de Dados.");
		}
	  });
  
    //QUERY consulta
    let consultaDados = `SELECT * FROM vrp_user_identities WHERE user_id=${plId}`;
    let updateDados = `UPDATE vrp_user_identities SET registration='${placa}' WHERE user_id=${plId}` 
    //console.log('CONSULTA DADOS: ' + consultaDados)
    //console.log('UPDATE DADOS: ' + updateDados)
    
    conn.query(consultaDados, (error, results) => {
      if (error) {
        console.log("Erro ao buscar os dados no banco: " + error);
      } else {
        console.log(results);
      }
    });

    conn.query(updateDados, (error, results) => {
      if(error){
        console.log("Erro ao buscar os dados no banco: " + error);
      }else{
        console.log(results)

        const embed = new EmbedBuilder()
          .setDescription(`**[Placa alterada com sucesso!]**`)
          .setAuthor({
            name: interaction.guild.name,
            iconURL: interaction.guild.iconURL({ dynamic: true }),
          })
          .setColor(utils.embedColor)
          .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
          .addFields(
            {
              name: "**[ID]**",
              value: `${plId}`,
              inline: true,
            },
            {
              name: "**[Nova Placa]**",
              value: `${placa}`,
              inline: true,
            },
			{
				name: "**[Staff Responsável]**",
				value: `${interaction.author.toString()}`,
				inline: true,
			},
          )
          .setFooter({
            text: "Desenvolvido por NitroLabs Software",
            iconURL: utils.logoIcon,
          })
          .setTimestamp();
	
				interaction.channel.send({ embeds: [embed] });
				setTimeout(() => {
					interaction.delete()
				}, 1000)
			};
		});
	}
});

//Ban discord
client.on("messageCreate", async (interaction) => {
	if (interaction.author.bot || !interaction.guild) return;

	const bannedRoleId = utils.banido;
  
	if (interaction.content.startsWith("!bandc ")) {
	  const args = interaction.content.slice("!bandc ".length).trim().split(/ +/);
	  const memberId = args[0].replace(/[\\<>@!]/g, "");
	  const player = interaction.guild.members.cache.get(memberId);
	  const motivo = args.slice(1).join(" ");

	  if(!motivo){
		return interaction.reply({ 
			content: "É obrigatório fornecer um motivo para o banimento."
		 })
	  }
  
	  console.log(`ID: ${player} | Motivo Banimento: ${motivo}`);
  
	  const allowedRolesIds = [utils.fundador, utils.ceo, utils.adm, utils.mod];
  
	  const memberRolesIds = interaction.member.roles.cache.map(
		(role) => role.id
	  );
	  const hasAllowedRole = memberRolesIds.some((roleId) =>
		allowedRolesIds.includes(roleId)
	  );
  
	  if (!hasAllowedRole) {
		return interaction.reply({
		  content: "Você não tem permissão para usar esse comando.",
		  ephemeral: true,
		});
	  }

	  if (player) {
		try {
		  // Armazenar os cargos do jogador antes de removê-los
		  const cargosAntigos = player.roles.cache.map((role) => role.toString()).join(" ");
  
		  // Remover todos os cargos do jogador
		  await player.roles.set([]);
  
		  // Adicionar o cargo de "Banido" ao jogador
		  const banidoRole = interaction.guild.roles.cache.get(bannedRoleId);
		  if (banidoRole) {
			await player.roles.add(bannedRoleId);
		  }
  
		  const embed = new EmbedBuilder()
			.setDescription(`🛑 **Novo banimento registrado!**`)
			.setAuthor({
			  name: interaction.guild.name,
			  iconURL: interaction.guild.iconURL({ dynamic: true }),
			})
			.setColor(utils.embedColor)
			.setThumbnail(interaction.guild.iconURL({ dynamic: true }))
			.addFields(
			  {
				name: "Player",
				value: `${player}`,
				inline: false,
			  },
			  {
				name: "Staff Responsável",
				value: `${interaction.member.toString()}`,
				inline: false,
			  },
			  {
				name: "Motivo",
				value: `${motivo}`,
				inline: false,
			  },
			  {
				name: "Cargos Perdidos",
				value: `${cargosAntigos}`,
				inline: false,
			  },
			  {
				name: "Cargo Recebido",
				value: `${banidoRole}`,
				inline: false,
			  }
			)
			.setFooter({
			  text: "Desenvolvido por NitroLabs Software",
			  iconURL: utils.logoIcon,
			})
			.setTimestamp();
  
			interaction.channel.send({ embeds: [embed] });
			setTimeout(() => {
				interaction.delete()
			}, 1000)

		  await player.send(`\`\`\`Você foi banido do Servidor ${interaction.guild.name} pelo motivo: ${motivo}.\nCaso você não concorde com seu banimento e tenha provas de que o mesmo foi realizado de forma incorreta, entre em contato com a Equipe Staff do servidor.\`\`\``);
		} catch (error) {
		  console.error("Erro ao banir o jogador:", error);
		  interaction.reply({
			content: "Ocorreu um erro ao banir o jogador.",
			ephemeral: true,
		  });
		}
	  } else {
		interaction.reply({
		  content: "Não foi possível encontrar o jogador no servidor.",
		  ephemeral: true,
		});
	  }
	};
});

//Unban discord
client.on("messageCreate", async (interaction) => {
	if (interaction.author.bot || !interaction.guild) return;
  
	if (interaction.content.startsWith("!unbandc ")) {
	  const args = interaction.content.slice("!unbandc ".length).trim().split(/ +/);
	  const memberId = args[0].replace(/[\\<>@!]/g, "");
	  const player = interaction.guild.members.cache.get(memberId);
	  const motivo = args.slice(1).join(" ");

	  if(!motivo){
		return interaction.reply({ 
			content: "É obrigatório fornecer um motivo para o banimento."
		 })
	  }
  
	  console.log(`ID: ${player} | Motivo Banimento: ${motivo}`);
  
	  const allowedRolesIds = [utils.fundador, utils.ceo, utils.adm, utils.mod];
  
	  const memberRolesIds = interaction.member.roles.cache.map(
		(role) => role.id
	  );
	  const hasAllowedRole = memberRolesIds.some((roleId) =>
		allowedRolesIds.includes(roleId)
	  );
  
	  if (!hasAllowedRole) {
		return interaction.reply({
		  content: "Você não tem permissão para usar esse comando.",
		  ephemeral: true,
		});
	  }

	  if (player) {
		try {
		  // Armazenar os cargos do jogador antes de removê-los
		  const cargosAntigos = player.roles.cache.map((role) => role.toString()).join(" ");
  
		  // Remover todos os cargos do jogador
		  await player.roles.remove(utils.banido);
  
		  // Adicionar o cargo de "Cidadão" ao jogador
		  const citizenRole = interaction.guild.roles.cache.get(utils.cidadao);
		  if (citizenRole) {
			await player.roles.add(utils.cidadao);
		  }
  
		  const embed = new EmbedBuilder()
			.setDescription(`✅ **Novo unban registrado!**`)
			.setAuthor({
			  name: interaction.guild.name,
			  iconURL: interaction.guild.iconURL({ dynamic: true }),
			})
			.setColor(utils.embedColor)
			.setThumbnail(interaction.guild.iconURL({ dynamic: true }))
			.addFields(
			  {
				name: "Player",
				value: `${player}`,
				inline: false,
			  },
			  {
				name: "Staff Responsável",
				value: `${interaction.member.toString()}`,
				inline: false,
			  },
			  {
				name: "Motivo do Unban",
				value: `${motivo}`,
				inline: false,
			  },
			  {
				name: "Cargos Perdidos",
				value: cargosAntigos,
				inline: false,
			  },
			  {
				name: "Cargo Recebido",
				value: `${citizenRole}`,
				inline: false,
			  },
			)
			.setFooter({
			  text: "Desenvolvido por NitroLabs Software",
			  iconURL: utils.logoIcon,
			})
			.setTimestamp();
  
			interaction.channel.send({ embeds: [embed] });
			setTimeout(() => {
				interaction.delete()
			}, 1000)
		  //await player.send(`Você foi banido do Servidor ${interaction.guild.name} pelo motivo: ${motivo}.\n Caso você não concorde com seu banimento e tenha provas de que o mesmo foi realizado de forma incorreta, entre em contato com a Equipe Staff do servidor.`);
		} catch (error) {
		  console.error("Erro ao desbanir o jogador:", error);
		  interaction.reply({
			content: "Ocorreu um erro ao desbanir o jogador.",
			ephemeral: true,
		  });
		}
	  } else {
		interaction.reply({
		  content: "Não foi possível encontrar o jogador no servidor.",
		  ephemeral: true,
		});
	  }
	};
});

//Addwl
client.on("messageCreate", async (interaction) => {
  if (interaction.author.bot || !interaction.guild) return;

  if (interaction.content.startsWith("!addwl ")) {
    const args = interaction.content.slice("!addwl ".length).trim().split(/ +/);
    const player = args[0];

    const whitelisted = 1;

    console.log(`ID: ${player}`);

    const allowedRolesIds = [utils.fundador, utils.ceo, utils.adm, utils.mod, utils.suporte];

    const memberRolesIds = interaction.member.roles.cache.map(
      (role) => role.id
    );
    const hasAllowedRole = memberRolesIds.some((roleId) =>
      allowedRolesIds.includes(roleId)
    );

    if (!hasAllowedRole) {
      return interaction.reply({
        content: "Você não tem permissão para usar esse comando.",
        ephemeral: true,
      });
    }

    //QUERY consulta
    let consultaDados = `SELECT * FROM vrp_users WHERE id=${player}`;
    let updatePlayer = `UPDATE vrp_users SET whitelisted=${whitelisted} WHERE id=${player}`;
    //console.log('CONSULTA DADOS: ' + consultaDados)
    //console.log('UPDATE DADOS: ' + updatePlayer)

    //Parametros de conexão
    const conn = mysql2.createConnection({
      host: utils.host,
      user: utils.user,
      password: utils.password,
      database: utils.database,
    });

    conn.query(consultaDados, (error, results) => {
      if (error) {
        console.log("Erro ao buscar os dados no banco: " + error);
      } else {
		if(results.length === 0){
			const embed = new EmbedBuilder()
			.setTitle(`🛑 ID [ ${player} ] não existe no banco de dados.`)
			.setDescription(`Verifique seu ID e tente novamente.`)
			.setAuthor({
			  name: interaction.guild.name,
			  iconURL: interaction.guild.iconURL({ dynamic: true }),
			})
			.setColor(utils.embedColor)
			.setThumbnail(interaction.guild.iconURL({ dynamic: true }))
			.setFooter({
			  text: "Desenvolvido por NitroLabs Software",
			  iconURL: utils.logoIcon,
			})
			.setTimestamp();


			interaction.channel.send({ embeds: [embed] })
				.then((message) => {
					setTimeout(() => {
						message.delete()
					}, 7500)
				})
			setTimeout(() => {
				interaction.delete()
			}, 2500)
		}else{

			conn.query(updatePlayer, (error, results) => {
				if (error) {
				  console.log("Erro ao buscar os dados no banco: " + error);
				} else {
				  console.log(results);
				}
			});

			const embed = new EmbedBuilder()
			.setTitle(`✅ Whitelist Adicionada com Sucesso!`)
			.setDescription(`Parabéns, agora você pode entrar na cidade! 🥳!`)
			.setAuthor({
			  name: interaction.guild.name,
			  iconURL: interaction.guild.iconURL({ dynamic: true }),
			})
			.setColor(utils.embedColor)
			.setThumbnail(interaction.guild.iconURL({ dynamic: true }))
			.addFields(
			  {
				name: "ID",
				value: `${player}`,
				inline: false,
			  },
			  {
				  name: "Player",
				  value: `${interaction.author.toString()} | ${interaction.author.tag}`,
				  inline: false,
				},
			  {
				name: "Staff Responsável",
				value: `${interaction.member.toString()}`,
				inline: false,
			  }
			)
			.setFooter({
			  text: "Desenvolvido por NitroLabs Software",
			  iconURL: utils.logoIcon,
			})
			.setTimestamp();

			interaction.channel.send({ embeds: [embed] })
			setTimeout(() => {
				interaction.delete()
			}, 2000)
		}
        console.log(results);
      }
    });
  }
});

//Mande seu id
client.on("messageCreate", async (interaction) => {

	if (interaction.author.bot || !interaction.guild) return;

	const channelLiberarID = utils.liberarId;
	const idDigitado = interaction.content;
	const whitelisted = 1;
  
	if (interaction.channel.id === channelLiberarID && idDigitado === idDigitado) {
    //QUERY consulta
    let consultaDados = `SELECT * FROM vrp_users WHERE id=${idDigitado}`;
    let updatePlayer = `UPDATE vrp_users SET whitelisted=${whitelisted} WHERE id=${idDigitado}`;
    //console.log('CONSULTA DADOS: ' + consultaDados)
    //console.log('UPDATE DADOS: ' + updatePlayer)

    //Parametros de conexão
    const conn = mysql2.createConnection({
      host: utils.host,
      user: utils.user,
      password: utils.password,
      database: utils.database,
    });

    conn.query(consultaDados, (error, results) => {
      if (error) {
        console.log("Erro ao buscar os dados no banco: " + error);
      } else {
		if(results.length === 0){

			const embed = new EmbedBuilder()
			.setTitle(`🛑 ID [${idDigitado}] não existe no banco de dados.`)
			.setDescription(`Verifique seu ID e tente novamente.`)
			.setAuthor({
			  name: interaction.guild.name,
			  iconURL: interaction.guild.iconURL({ dynamic: true }),
			})
			.setColor(utils.embedColor)
			.setThumbnail(interaction.guild.iconURL({ dynamic: true }))
			.setFooter({
			  text: "Desenvolvido por NitroLabs Software",
			  iconURL: utils.logoIcon,
			})
			.setTimestamp();


			interaction.channel.send({ embeds: [embed] })
				.then((message) => {
					setTimeout(() => {
						message.delete()
					}, 7500)
				})
			setTimeout(() => {
				interaction.delete()
			}, 2500)
		}else{
			conn.query(updatePlayer, (error, results) => {
				if (error) {
				  console.log("Erro ao buscar os dados no banco: " + error);
				} else {

					const embed = new EmbedBuilder()
					.setTitle(`✅ Sua whitelist foi liberada. ID: [ ${idDigitado} ]`)
					.setDescription(`Agora você já pode acessar o servidor.\n\n ${interaction.author.toString()} | ${interaction.author.tag}`)
					.setAuthor({
					  name: interaction.guild.name,
					  iconURL: interaction.guild.iconURL({ dynamic: true }),
					})
					.setColor(utils.embedColor)
					.setThumbnail(interaction.guild.iconURL({ dynamic: true }))
					.setFooter({
					  text: "Desenvolvido por NitroLabs Software",
					  iconURL: utils.logoIcon,
					})
					.setTimestamp();

					interaction.channel.send({ embeds: [embed] })
					setTimeout(() => {
						interaction.delete()
					}, 2000)
				}
			});
		}
      }
    });
  }
});

//Advertência
client.on('messageCreate', async (interaction) => {
	if (interaction.author.bot || !interaction.guild) return;
  
	const channelLiberarID = utils.advertenciasChannel;
  
	if (interaction.content.startsWith("!adv ") && interaction.channel.id === channelLiberarID) {
	  const args = interaction.content.slice("!adv ".length).trim().split(/ +/);
	  const memberId = args[0].replace(/[\\<>@!]/g, "");
	  const player = interaction.guild.members.cache.get(memberId);
	  const motivo = args.slice(1).join(" ");
  
	  if (!motivo) {
		interaction.channel.send({
		  content: "É obrigatório fornecer um motivo para a advertência.",
		}).then((message) => {
		  setTimeout(() => {
			message.delete();
		  }, 2500);
		});
  
		setTimeout(() => {
		  interaction.delete();
		}, 1500);
		return;
	  }
  
	  console.log(`ID: ${player} | Motivo da advertência: ${motivo}`);
  
	  const allowedRolesIds = [utils.fundador, utils.ceo, utils.adm, utils.mod];
  
	  const memberRolesIds = interaction.member.roles.cache.map(
		(role) => role.id
	  );
  
	  if (!allowedRolesIds.some((roleId) => memberRolesIds.includes(roleId))) {
		interaction.reply({
		  content: "Você não tem permissão para usar esse comando.",
		  ephemeral: true,
		});
		return;
	  }
  
	  const guild = interaction.guild;
  
	  try {
		const member = await guild.members.fetch(player);
		if (!member) {
		  return interaction.reply({ content: `Jogador ${player} não encontrado.`, ephemeral: true });
		}
  
		const advertencia1 = guild.roles.cache.find((role) => role.id === utils.cargoAdv1);
		const advertencia2 = guild.roles.cache.find((role) => role.id === utils.cargoAdv2);
		const advertencia3 = guild.roles.cache.find((role) => role.id === utils.cargoAdv3);
		const advertencia4 = guild.roles.cache.find((role) => role.id === utils.cargoAdv4);
  
		if (!advertencia1 || !advertencia2 || !advertencia3 || !advertencia4) {
		  return interaction.reply({
			content: "Os cargos de advertência não foram encontrados.",
			ephemeral: true,
		  });
		}
  
		let advertenciasAtuais = 0;
		if (member.roles.cache.has(advertencia1.id)) advertenciasAtuais = 1;
		else if (member.roles.cache.has(advertencia2.id)) advertenciasAtuais = 2;
		else if (member.roles.cache.has(advertencia3.id)) advertenciasAtuais = 3;
		else if (member.roles.cache.has(advertencia4.id)) advertenciasAtuais = 4;
  
		if (advertenciasAtuais === 4) {
		  return interaction.reply({
			content: `O jogador ${member.toString()} já possui 4 advertências e não pode receber mais.`,
			ephemeral: true,
		  });
		}
  
		let proximaAdvertencia;
		if (advertenciasAtuais === 0) proximaAdvertencia = advertencia1;
		else if (advertenciasAtuais === 1) proximaAdvertencia = advertencia2;
		else if (advertenciasAtuais === 2) proximaAdvertencia = advertencia3;
		else if (advertenciasAtuais === 3) proximaAdvertencia = advertencia4;
  
		await member.roles.add(proximaAdvertencia);
  
		const embed = new EmbedBuilder()
		.setTitle(`🛑 Nova advertência registrada!`)
		  .setAuthor({
			name: interaction.guild.name,
			iconURL: interaction.guild.iconURL({ dynamic: true }),
		  })
		  .setColor(utils.embedColor)
		  .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
		  .addFields(
			{
			  name: "[ADVERTIDO POR]",
			  value: `${interaction.author.toString()}`,
			  inline: true,
			},
			{
			  name: "[MOTIVO]",
			  value: `${motivo}`,
			  inline: true,
			},
			{
			  name: "[MENSAGEM]",
			  value: `O jogador ${member.toString()} foi punido com ${proximaAdvertencia.toString()}.`,
			  inline: false,
			},
		  )
		  .setFooter({
			text: "Desenvolvido por NitroLabs Software",
			iconURL: utils.logoIcon,
		  })
		  .setTimestamp();

		  setTimeout(() => {
			interaction.delete()
		  }, 2000)
  
		interaction.channel.send({ embeds: [embed] });

  
		await member.send(`\`\`\`Você acabou de receber uma advertência em ${interaction.guild.name} pelo seguinte motivo: ${motivo}.\nLembrando que recebendo três advertências, você é banido automaticamente do servidor.\nCaso queira falar com nossa equipe de suporte, por favor, abra um ticket!\`\`\``);
	  } catch (error) {
		console.error(error);
		await interaction.reply({
		  content: "Ocorreu um erro ao adicionar o cargo ao jogador.",
		  ephemeral: true,
		});
	  }
	}
});

//Advertência 2
client.on('messageCreate', async (interaction) => {
    if (interaction.author.bot || !interaction.guild) return;
  
    const channelLiberarID = utils.advertenciasChannel;
  
    if (interaction.content.startsWith("!adv2 ") && interaction.channel.id === channelLiberarID) {
        const args = interaction.content.slice("!adv2 ".length).trim().split(/ +/);
        const memberId = args[0].replace(/[\\<>@!]/g, "");
        const player = interaction.guild.members.cache.get(memberId);
        const cargoAddMention = args[1]; 
        const motivo = args.slice(2).join(" "); 

        if (!motivo) {
            interaction.channel.send({
                content: "Motivo não preenchido.",
            }).then((message) => {
                setTimeout(() => {
                    message.delete();
                }, 2500);
            });
  
            setTimeout(() => {
                interaction.delete();
            }, 1500);
            return;
        }
  
        if (!player) {
            interaction.channel.send({
                content: "Membro inválido. Certifique-se de mencionar um membro válido após o comando.",
            }).then((message) => {
                setTimeout(() => {
                    message.delete();
                }, 2500);
            });
  
            setTimeout(() => {
                interaction.delete();
            }, 1500);
            return;
        }
  
        if (!cargoAddMention) {
            interaction.channel.send({
                content: "É obrigatório fornecer uma menção do cargo para adicionar ao membro.",
            }).then((message) => {
                setTimeout(() => {
                    message.delete();
                }, 2500);
            });
  
            setTimeout(() => {
                interaction.delete();
            }, 1500);
            return;
        }
  
        console.log(`ID: ${player.user.tag} | Cargo a adicionar: ${cargoAddMention}`);
  
        const allowedRolesIds = [utils.fundador, utils.ceo, utils.adm, utils.mod];
  
        const memberRolesIds = interaction.member.roles.cache.map(
            (role) => role.id
        );
  
        if (!allowedRolesIds.some((roleId) => memberRolesIds.includes(roleId))) {
            interaction.reply({
                content: "Você não tem permissão para usar esse comando.",
                ephemeral: true,
            });
            return;
        }
  
        // Aqui, adicionamos o cargo ao perfil do membro
        const roleToAdd = interaction.guild.roles.cache.find(role => role.toString() === cargoAddMention);
        if (!roleToAdd) {
            interaction.channel.send({
                content: "Cargo inválido. Certifique-se de mencionar um cargo válido após o comando.",
            }).then((message) => {
                setTimeout(() => {
                    message.delete();
                }, 2500);
            });
  
            setTimeout(() => {
                interaction.delete();
            }, 1500);
            return;
        }
  
        try {
            await player.roles.add(roleToAdd);
        } catch (error) {
            console.error("Erro ao adicionar o cargo ao membro:", error);
            interaction.channel.send({
                content: "Ocorreu um erro ao adicionar o cargo ao membro. Por favor, tente novamente mais tarde.",
            });
            return;
        }
  
        const embed = new EmbedBuilder()
            .setTitle(`🛑 Nova advertência registrada!`)
            .setAuthor({
                name: interaction.guild.name,
                iconURL: interaction.guild.iconURL({ dynamic: true }),
            })
            .setColor(utils.embedColor)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .addFields(
                {
                    name: "[ADVERTIDO POR]",
                    value: `${interaction.author.toString()}`,
                    inline: true,
                },
                {
                    name: "[MEMBRO ADVERTIDO]",
                    value: `${player.user.toString()}`,
                    inline: true,
                },
                {
                    name: "[CARGO ADICIONADO]",
                    value: `${roleToAdd.toString()}`,
                    inline: true,
                },
				{
                    name: "[MOTIVO]",
                    value: `${motivo}`,
                    inline: false,
                },
                {
                    name: "[MENSAGEM]",
                    value: `O jogador ${player.user.toString()} foi punido com ${roleToAdd.toString()}.`,
                    inline: false,
                },
            )
            .setFooter({
                text: "Desenvolvido por NitroLabs Software",
                iconURL: utils.logoIcon,
            })
            .setTimestamp();
  
        setTimeout(() => {
            interaction.delete()
        }, 2000)
  
        interaction.channel.send({ embeds: [embed] });

		await player.send(`\`\`\`Você acabou de receber uma advertência em ${interaction.guild.name} pelo seguinte motivo: ${motivo}.\nLembrando que recebendo três advertências, você é banido automaticamente do servidor.\nCaso queira falar com nossa equipe de suporte, por favor, abra um ticket!\`\`\``);
    }
});

//Remover Advertência
client.on('messageCreate', async (interaction) => {
    if (interaction.author.bot || !interaction.guild) return;
  
    const channelLiberarID = utils.advertenciasChannel;
  
    if (interaction.content.startsWith("!remadv ") && interaction.channel.id === channelLiberarID) {
        const args = interaction.content.slice("!remadv ".length).trim().split(/ +/);
        const memberId = args[0].replace(/[\\<>@!]/g, "");
        const player = interaction.guild.members.cache.get(memberId);
        const cargoRemMention = args[1]; 
        const motivo = args.slice(2).join(" "); 
        if (!motivo) {
            interaction.channel.send({
                content: "Motivo não preenchido.",
            }).then((message) => {
                setTimeout(() => {
                    message.delete();
                }, 2500);
            });
  
            setTimeout(() => {
                interaction.delete();
            }, 1500);
            return;
        }
  
        if (!player) {
            interaction.channel.send({
                content: "Membro inválido. Certifique-se de mencionar um membro válido após o comando.",
            }).then((message) => {
                setTimeout(() => {
                    message.delete();
                }, 2500);
            });
  
            setTimeout(() => {
                interaction.delete();
            }, 1500);
            return;
        }
  
        if (!cargoRemMention) {
            interaction.channel.send({
                content: "É obrigatório fornecer uma menção do cargo para adicionar ao membro.",
            }).then((message) => {
                setTimeout(() => {
                    message.delete();
                }, 2500);
            });
  
            setTimeout(() => {
                interaction.delete();
            }, 1500);
            return;
        }
  
        console.log(`ID: ${player.user.tag} | Cargo a deletar: ${cargoRemMention}`);
  
        const allowedRolesIds = [utils.fundador, utils.ceo, utils.adm, utils.mod];
  
        const memberRolesIds = interaction.member.roles.cache.map(
            (role) => role.id
        );
  
        if (!allowedRolesIds.some((roleId) => memberRolesIds.includes(roleId))) {
            interaction.reply({
                content: "Você não tem permissão para usar esse comando.",
                ephemeral: true,
            });
            return;
        }
  
        // Aqui, adicionamos o cargo ao perfil do membro
        const roleToRemove = interaction.guild.roles.cache.find(role => role.toString() === cargoRemMention);
        if (!roleToRemove) {
            interaction.channel.send({
                content: "Cargo inválido. Certifique-se de mencionar um cargo válido após o comando.",
            }).then((message) => {
                setTimeout(() => {
                    message.delete();
                }, 2500);
            });
  
            setTimeout(() => {
                interaction.delete();
            }, 1500);
            return;
        }
  
        try {
            await player.roles.remove(roleToRemove);
        } catch (error) {
            console.error("Erro ao remover o cargo do membro:", error);
            interaction.channel.send({
                content: "Ocorreu um erro ao remover o cargo do membro. Por favor, tente novamente mais tarde.",
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(`🛑 Nova advertência registrada!`)
            .setAuthor({
                name: interaction.guild.name,
                iconURL: interaction.guild.iconURL({ dynamic: true }),
            })
            .setColor(utils.embedColor)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .addFields(
                {
                    name: "[REMOVIDO POR]",
                    value: `${interaction.author.toString()}`,
                    inline: true,
                },
                {
                    name: "[MEMBRO]",
                    value: `${player.user.toString()}`,
                    inline: true,
                },
                {
                    name: "[CARGO REMOVIDO]",
                    value: `${roleToRemove.toString()}`,
                    inline: true,
                },
				{
                    name: "[MOTIVO]",
                    value: `${motivo}`,
                    inline: false,
                },
                {
                    name: "[MENSAGEM]",
                    value: `O jogador ${player.user.toString()} teve o(s) cargo(s) ${roleToRemove.toString()} removidos.`,
                    inline: false,
                },
            )
            .setFooter({
                text: "Desenvolvido por NitroLabs Software",
                iconURL: utils.logoIcon,
            })
            .setTimestamp();
  
        setTimeout(() => {
            interaction.delete()
        }, 2000)
  
        interaction.channel.send({ embeds: [embed] });

		await player.send(`\`\`\`Sua(s) advertência(s) em ${interaction.guild.name} foi(ram) removida(s) pelo seguinte motivo: ${motivo}.\nLembrando que recebendo três advertências, você é banido automaticamente do servidor.\nCaso queira falar com nossa equipe de suporte, por favor, abra um ticket!\`\`\``);
    }
});


client.login(utils.token);