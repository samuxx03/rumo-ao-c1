/*
 * Rumo ao C1 — grammar lessons (one per drill topic).
 * Written for a learner who already speaks Spanish: each lesson points out where Portuguese differs.
 * Block types: { h: heading, p: paragraph, table: { head: [...], rows: [[...]] }, ex: [[pt, en], ...], list: [...] }
 */
(function () {
  const lessons = {
    "fut-subj": {
      title: "Futuro do subjuntivo",
      intro: "Portuguese has a tense that modern Spanish lost: the future subjunctive. You use it for open or possible future situations after words like quando, se, assim que, enquanto and quem. Where Spanish says \"cuando llegues\", Portuguese says \"quando você chegar\".",
      blocks: [
        { h: "How to form it", p: "Take the 3rd person plural of the pretérito perfeito, remove -ram, and add the endings: — (eu/você), -mos (nós), -em (vocês/eles). For regular verbs it looks exactly like the infinitive, so the real work is the irregular verbs." },
        { table: { head: ["Verbo", "Eles (perfeito)", "eu / você", "nós", "vocês / eles"], rows: [
          ["falar", "falaram", "falar", "falarmos", "falarem"],
          ["ter", "tiveram", "tiver", "tivermos", "tiverem"],
          ["fazer", "fizeram", "fizer", "fizermos", "fizerem"],
          ["ser / ir", "foram", "for", "formos", "forem"],
          ["estar", "estiveram", "estiver", "estivermos", "estiverem"],
          ["poder", "puderam", "puder", "pudermos", "puderem"],
          ["querer", "quiseram", "quiser", "quisermos", "quiserem"],
          ["saber", "souberam", "souber", "soubermos", "souberem"],
          ["dizer", "disseram", "disser", "dissermos", "disserem"],
          ["trazer", "trouxeram", "trouxer", "trouxermos", "trouxerem"],
          ["vir", "vieram", "vier", "viermos", "vierem"],
          ["ver", "viram", "vir", "virmos", "virem"],
          ["pôr", "puseram", "puser", "pusermos", "puserem"],
        ] } },
        { h: "When to use it", list: [
          "Time clauses about the future: quando, assim que, logo que, depois que, enquanto, sempre que.",
          "Conditions that may happen: se.",
          "Open references to the future: quem, o que, onde, como, quanto.",
        ] },
        { ex: [
          ["Quando eu tiver tempo, te ligo.", "When I have time, I'll call you. (ES: cuando tenga)"],
          ["Se chover amanhã, a gente fica em casa.", "If it rains tomorrow, we'll stay home. (ES: si llueve)"],
          ["Assim que vocês souberem, me avisem.", "As soon as you know, let me know."],
          ["Quem quiser pode vir com a gente.", "Whoever wants to can come with us."],
          ["Faça como você achar melhor.", "Do it however you think best."],
          ["Enquanto eu estiver aqui, ninguém vai te incomodar.", "As long as I'm here, nobody will bother you."],
        ] },
        { h: "The ver / vir trap", p: "\"Ver\" becomes \"vir\" (viram → vir), which looks like the infinitive of \"vir\" (to come). \"Vir\" becomes \"vier\". So: \"Quando você vir o João\" (see) but \"Quando você vier aqui\" (come). Many natives get this wrong in speech, which makes it a C1 marker in writing." },
      ],
      mistakes: [
        ["Quando eu vou ter tempo, te ligo.", "Quando eu tiver tempo, te ligo.", "After quando with a future meaning, use the future subjunctive, not ir + infinitive."],
        ["Quando chegues em casa, me avisa.", "Quando você chegar em casa, me avisa.", "Spanish uses the present subjunctive here; Portuguese doesn't."],
        ["Quando você ver o filme…", "Quando você vir o filme…", "ver → viram → vir."],
        ["Se eu teria tempo, eu iria.", "Se eu tiver tempo, eu vou. / Se eu tivesse tempo, eu iria.", "Never use the conditional after se."],
      ],
      tip: "Train the irregular ones aloud as pairs: tiveram → tiver, fizeram → fizer, puseram → puser. Once the pretérito is automatic, this tense comes for free.",
    },

    hipo: {
      title: "Hipóteses: se + imperfeito do subjuntivo",
      intro: "Same logic as Spanish \"si tuviera… haría\". Portuguese has only one imperfect subjunctive form (-sse), and in speech Brazilians very often replace the conditional with the imperfect.",
      blocks: [
        { h: "Imperfeito do subjuntivo", p: "Same stem as the future subjunctive (eles perfeito minus -ram) + -sse, -ssemos, -ssem." },
        { table: { head: ["Verbo", "eu / você", "nós", "vocês / eles"], rows: [
          ["falar", "falasse", "falássemos", "falassem"],
          ["ter", "tivesse", "tivéssemos", "tivessem"],
          ["fazer", "fizesse", "fizéssemos", "fizessem"],
          ["ser / ir", "fosse", "fôssemos", "fossem"],
          ["poder", "pudesse", "pudéssemos", "pudessem"],
          ["dizer", "dissesse", "disséssemos", "dissessem"],
        ] } },
        { h: "Futuro do pretérito (the conditional)", p: "Infinitive + -ia, -íamos, -iam: falaria, comeríamos, iriam. Irregular: fazer → faria, dizer → diria, trazer → traria. In everyday speech: \"eu ia\" instead of \"eu iria\", \"eu fazia\" instead of \"eu faria\"." },
        { h: "The three types of condition", table: { head: ["Tipo", "Se + …", "Resultado", "Exemplo"], rows: [
          ["Possible (future)", "futuro do subjuntivo", "presente / futuro", "Se eu tiver dinheiro, viajo."],
          ["Unlikely or unreal (present)", "imperfeito do subjuntivo", "futuro do pretérito", "Se eu tivesse dinheiro, viajaria (viajava)."],
          ["Unreal (past)", "tivesse + particípio", "teria + particípio", "Se eu tivesse estudado, teria passado (tinha passado)."],
        ] } },
        { h: "Other triggers of the imperfect subjunctive", list: [
          "como se (always): Ele fala como se soubesse tudo.",
          "A past main verb of wish, request or emotion: Eu queria que você viesse. / Era importante que todos estivessem lá.",
          "caso, embora, para que in a past frame: Ele saiu cedo para que ninguém o visse.",
        ] },
      ],
      mistakes: [
        ["Se eu teria dinheiro…", "Se eu tivesse dinheiro…", "No conditional after se."],
        ["Se eu tivera dinheiro…", "Se eu tivesse dinheiro…", "Spanish -ra subjunctive doesn't exist in Portuguese. \"Tivera\" is a literary pluperfect indicative."],
        ["Ele fala como se sabe tudo.", "Ele fala como se soubesse tudo.", "como se always takes the imperfect subjunctive."],
        ["Queria que você vem.", "Queria que você viesse.", "Past main verb → imperfect subjunctive."],
      ],
      tip: "Practise one sentence a day out loud: \"Se eu morasse no Brasil, eu…\". It trains the tense and your vocabulary at the same time.",
    },

    "pres-subj": {
      title: "Presente do subjuntivo",
      intro: "Good news: its uses are almost identical to Spanish. The one big difference is future time clauses (quando, se), which use the future subjunctive in Portuguese.",
      blocks: [
        { h: "How to form it", p: "Take the eu form of the present indicative, drop the -o, and switch vowels: -ar verbs take -e, -er/-ir verbs take -a. faço → faça, digo → diga, tenho → tenha, posso → possa, vejo → veja." },
        { table: { head: ["Verbo", "eu / você", "nós", "vocês / eles"], rows: [
          ["falar", "fale", "falemos", "falem"],
          ["comer", "coma", "comamos", "comam"],
          ["fazer", "faça", "façamos", "façam"],
          ["ser", "seja", "sejamos", "sejam"],
          ["estar", "esteja", "estejamos", "estejam"],
          ["ir", "vá", "vamos", "vão"],
          ["saber", "saiba", "saibamos", "saibam"],
          ["querer", "queira", "queiramos", "queiram"],
          ["haver", "haja", "hajamos", "hajam"],
          ["dar", "dê", "demos", "deem"],
        ] } },
        { h: "Triggers", list: [
          "Wishes and requests: quero que, espero que, peço que, tomara que.",
          "Emotion: fico feliz que, é uma pena que, tenho medo de que.",
          "Doubt and negated opinion: duvido que, não acho que, talvez (before the verb).",
          "Impersonal expressions: é importante que, é bom que, é preciso que, é possível que.",
          "Conjunctions: embora, para que, caso, desde que (provided that), a não ser que, sem que, antes que, por mais que, mesmo que, ainda que.",
        ] },
        { ex: [
          ["Tomara que dê tudo certo.", "I hope it all works out."],
          ["Embora seja caro, vale a pena.", "Although it's expensive, it's worth it."],
          ["Talvez ela venha amanhã.", "Maybe she'll come tomorrow."],
          ["Por mais que eu tente, não consigo acordar cedo.", "However hard I try, I can't wake up early."],
        ] },
        { h: "Indicative or subjunctive?", p: "Affirmative opinions take the indicative: \"Acho que é uma boa ideia.\" Negative ones take the subjunctive: \"Não acho que seja uma boa ideia.\" \"Talvez\" after the verb takes the indicative: \"Ele vem, talvez.\"" },
      ],
      mistakes: [
        ["Espero que você gosta.", "Espero que você goste.", "esperar que → subjunctive."],
        ["Embora é caro…", "Embora seja caro…", "embora always takes the subjunctive."],
        ["Acho que seja verdade.", "Acho que é verdade.", "Affirmative opinion → indicative."],
        ["Quando você venha, me liga.", "Quando você vier, me liga.", "Future time → future subjunctive."],
      ],
      tip: "\"Tomara que\" is the most Brazilian way to say \"ojalá\". Use it every day.",
    },

    "inf-pess": {
      title: "Infinitivo pessoal",
      intro: "Spanish doesn't have this. In Portuguese the infinitive can take endings to show who is doing the action. Brazilians use it constantly, and it often replaces a whole \"para que + subjuntivo\" clause.",
      blocks: [
        { table: { head: ["Sujeito", "falar", "fazer", "ser", "ter"], rows: [
          ["eu / você / ele / a gente", "falar", "fazer", "ser", "ter"],
          ["nós", "falarmos", "fazermos", "sermos", "termos"],
          ["vocês / eles", "falarem", "fazerem", "serem", "terem"],
        ] } },
        { h: "When to use it", list: [
          "When the infinitive has its own subject, different from the main verb: É importante vocês chegarem cedo.",
          "After a preposition with its own subject: antes de eles saírem, para os alunos entenderem, depois de terminarmos.",
          "With ao + infinitive: Ao chegarmos, vimos que estava fechado.",
          "To avoid ambiguity about who does the action.",
        ] },
        { h: "When NOT to use it", p: "After auxiliary and modal verbs the infinitive never takes endings: vamos fazer, podemos sair, eles querem viajar, eles precisam estudar." },
        { ex: [
          ["O chefe pediu para nós ficarmos até mais tarde.", "The boss asked us to stay later. (ES: pidió que nos quedáramos)"],
          ["Comprei pipoca para vocês comerem no filme.", "I bought popcorn for you to eat during the film."],
          ["Foi um erro eles saírem sem avisar.", "It was a mistake for them to leave without telling anyone."],
          ["Antes de a gente sair, fecha a janela.", "Before we leave, close the window. (a gente = 3rd person singular)"],
        ] },
      ],
      mistakes: [
        ["Eles podem saírem.", "Eles podem sair.", "No endings after modal verbs."],
        ["Para a gente vermos o show…", "Para a gente ver o show…", "a gente takes the 3rd person singular."],
        ["É importante que vocês chegam cedo.", "É importante vocês chegarem cedo. / …que vocês cheguem cedo.", "Either personal infinitive or subjunctive, never indicative."],
      ],
      tip: "When you're about to say \"para que + subjuntivo\", try \"para + infinitivo pessoal\" instead. It sounds more natural in Brazil.",
    },

    "perf-comp": {
      title: "Pretérito perfeito composto × simples",
      intro: "This is the trap for Spanish speakers. \"He comido\" is NOT \"tenho comido\". In Portuguese the compound perfect only describes something repeated or ongoing up to now, never a single finished action.",
      blocks: [
        { h: "Form", p: "ter (presente) + particípio: tenho falado, tem feito, temos visto, têm trabalhado." },
        { table: { head: ["Español", "Português", "Por quê"], rows: [
          ["Hoy he visto a Juan.", "Hoje eu vi o João.", "Single event → simple past"],
          ["¿Has comido feijoada alguna vez?", "Você já comeu feijoada?", "Life experience → já + simple past"],
          ["Nunca he estado en Río.", "Nunca estive / nunca fui ao Rio.", "Experience → simple past"],
          ["Últimamente he dormido mal.", "Ultimamente tenho dormido mal.", "Repeated up to now → composto"],
          ["¿Cómo has estado?", "Como você tem passado?", "Period up to now → composto"],
        ] } },
        { h: "Signals of the composto", list: ["ultimamente, nos últimos tempos, nos últimos meses", "desde que…, este ano / este mês (still ongoing)", "cada vez mais"] },
        { h: "Spoken alternatives", p: "Brazilians often say \"andar + gerúndio\" or \"vir + gerúndio\" for the same idea: \"Ando dormindo mal.\" \"Venho pensando nisso há semanas.\"" },
      ],
      mistakes: [
        ["Hoje tenho visto o João.", "Hoje vi o João.", "Single event."],
        ["Você tem estado no Rio?", "Você já esteve no Rio? / Você já foi ao Rio?", "Experience → já + simple past."],
        ["Este ano tenho viajado para Lisboa uma vez.", "Este ano viajei para Lisboa uma vez.", "\"Uma vez\" = a single event."],
      ],
      tip: "If you could add \"lately\" or \"these days\" in English, use the composto. Otherwise use the simple past.",
    },

    mqp: {
      title: "Mais-que-perfeito",
      intro: "The past before the past. Brazilians say \"tinha feito\"; you'll see \"havia feito\" in formal texts and the simple form \"fizera\" in literature.",
      blocks: [
        { table: { head: ["Forma", "Registro", "Exemplo"], rows: [
          ["tinha + particípio", "Speech and writing", "Quando cheguei, o filme já tinha começado."],
          ["havia + particípio", "Formal writing", "O réu afirmou que não havia visto a vítima."],
          ["Simple: falara, fizera, tivera", "Literary", "Quando ela chegou, ele já partira."],
        ] } },
        { h: "Uses", list: ["An action that happened before another past action.", "Reported speech in the past: Ela disse que tinha perdido o celular.", "Something you had never done before a moment in the past: Eu nunca tinha visto o mar."] },
        { h: "Participles to know", p: "Irregular only: feito, dito, visto, escrito, aberto, posto, vindo, coberto. With two forms, ter/haver normally take the regular one: tinha aceitado, tinha entregado. In Brazil \"tinha pago\", \"tinha ganho\" and \"tinha gasto\" are also very common." },
        { h: "Careful with -ra", p: "In Spanish \"tuviera\" is a subjunctive. In Portuguese \"tivera\" is the literary pluperfect indicative. Never use it after se." },
      ],
      mistakes: [
        ["Quando cheguei, o filme já começou.", "Quando cheguei, o filme já tinha começado.", "Past before past."],
        ["Ele tinha escrevido.", "Ele tinha escrito.", "Irregular participle."],
        ["Se eu tivera sabido…", "Se eu tivesse sabido…", "-ra is not a subjunctive in Portuguese."],
      ],
      tip: "When you tell a story, add one \"já tinha…\" per paragraph. It makes your narration sound immediately more advanced.",
    },

    "perf-imp": {
      title: "Perfeito × imperfeito",
      intro: "The logic is the same as Spanish indefinido vs. imperfecto. What changes is the irregular forms, where Spanish interference is constant.",
      blocks: [
        { table: { head: ["Perfeito (completed event)", "Imperfeito (background, habit, state)"], rows: [
          ["Ontem eu encontrei o Pedro.", "Quando eu era criança, morava no interior."],
          ["Ele conheceu a esposa em 2015.", "Antigamente a gente ia à praia todo domingo."],
          ["Choveu o dia todo.", "Eu estava dormindo quando o telefone tocou."],
        ] } },
        { h: "Verbs that change meaning", table: { head: ["Verbo", "Perfeito", "Imperfeito"], rows: [
          ["saber", "soube = found out", "sabia = knew"],
          ["conhecer", "conheceu = met", "conhecia = knew"],
          ["querer", "quis = tried / decided", "queria = wanted"],
          ["poder", "pôde = managed to", "podia = was able"],
          ["ter", "teve = had (an event): teve um filho", "tinha = had (possession)"],
        ] } },
        { h: "Irregular perfeito: Spanish interference", table: { head: ["Verbo", "eu", "você / ele", "eles", "Not this (Spanish)"], rows: [
          ["ter", "tive", "teve", "tiveram", "tuve, tuvo"],
          ["fazer", "fiz", "fez", "fizeram", "hice, hizo"],
          ["vir", "vim", "veio", "vieram", "vine, vino"],
          ["estar", "estive", "esteve", "estiveram", "estuve"],
          ["poder", "pude", "pôde", "puderam", "pudo"],
          ["pôr", "pus", "pôs", "puseram", "puso"],
          ["trazer", "trouxe", "trouxe", "trouxeram", "traje"],
          ["dizer", "disse", "disse", "disseram", "dije"],
          ["ser / ir", "fui", "foi", "foram", "fue"],
        ] } },
        { h: "Brazilian extras", list: ["Polite requests use the imperfect: Eu queria um café, por favor.", "Future-in-the-past in speech: Ele disse que vinha (= viria)."] },
      ],
      mistakes: [
        ["Ele vino ontem.", "Ele veio ontem.", "vir → veio."],
        ["Eu tuve um problema.", "Eu tive um problema.", "ter → tive."],
        ["Ele pode vir ontem.", "Ele pôde vir ontem.", "Past: pôde, with the accent."],
      ],
      tip: "Write the irregular perfeito table by hand once. Spanish forms slip into your speech exactly at these verbs.",
    },

    regencia: {
      title: "Regência e preposições",
      intro: "Which preposition does each verb take? Many match Spanish, but the differences are exactly what examiners notice.",
      blocks: [
        { table: { head: ["Verbo", "Exemplo", "Atenção"], rows: [
          ["gostar de", "Eu gosto de café.", "The structure is the opposite of Spanish \"me gusta\"."],
          ["precisar de + noun", "Preciso de ajuda.", "+ infinitive: no preposition. Preciso sair."],
          ["assistir a", "Assisti ao jogo.", "\"To watch\". In speech many drop the a."],
          ["preferir X a Y", "Prefiro praia a montanha.", "\"do que\" is common in speech; write \"a\"."],
          ["namorar (no preposition)", "Ela namora o Pedro.", "\"namorar com\" is colloquial."],
          ["morar em", "Moro em São Paulo, na Rua Augusta.", "Like vivir en."],
          ["pensar em", "Penso em você.", "Like pensar en."],
          ["sonhar com", "Sonhei com você.", "Like soñar con."],
          ["casar(-se) com", "Ela se casou com um francês.", "Like casarse con."],
          ["lembrar de / lembrar-se de", "Lembro de tudo. Lembrei-me do nome.", "Also lembrar algo: Lembro tudo."],
          ["depender de", "Depende de você.", ""],
          ["concordar com", "Concordo com você.", ""],
          ["implicar / implicar com", "Isso implica custos. / Ele implica comigo.", "No preposition = to entail; com = to pick on."],
          ["ir a / ir para", "Vou ao médico. / Vou para o Japão.", "a = short visit; para = longer stay. Speech: pra."],
          ["chegar a / chegar em", "Cheguei a casa. / Cheguei em casa.", "Formal: a. Everyday speech: em."],
        ] } },
        { h: "Contractions you must make", table: { head: ["", "o", "a", "os", "as", "um", "uma"], rows: [
          ["em", "no", "na", "nos", "nas", "num", "numa"],
          ["de", "do", "da", "dos", "das", "dum*", "duma*"],
          ["a", "ao", "à", "aos", "às", "", ""],
          ["por", "pelo", "pela", "pelos", "pelas", "", ""],
        ] } },
        { p: "* \"dum\" and \"duma\" are informal; in writing use \"de um\", \"de uma\"." },
      ],
      mistakes: [
        ["Preciso de sair.", "Preciso sair.", "No de before an infinitive."],
        ["Me gosta o Rio.", "Eu gosto do Rio.", "Spanish structure."],
        ["Prefiro café do que chá. (escrita)", "Prefiro café a chá.", "Formal writing."],
        ["Moro em o centro.", "Moro no centro.", "em + o = no."],
      ],
      tip: "Learn verbs with their preposition as one block (gostar de, sonhar com), the same way the flashcards show them.",
    },

    crase: {
      title: "Crase (à, às)",
      intro: "The grave accent shows that the preposition a merged with the feminine article a. A useful shortcut for Spanish speakers: where Spanish says \"a la\", Portuguese usually writes à.",
      blocks: [
        { table: { head: ["Fusão", "Resultado", "Exemplo", "Español"], rows: [
          ["a + a", "à", "Vou à praia.", "Voy a la playa."],
          ["a + as", "às", "Chego às oito.", "Llego a las ocho."],
          ["a + aquele / aquela / aquilo", "àquele / àquela / àquilo", "Refiro-me àquilo.", "Me refiero a aquello."],
          ["a + a qual", "à qual", "A empresa à qual me candidatei.", "A la cual."],
        ] } },
        { h: "Two quick tests", list: [
          "Swap in a masculine noun. If you get \"ao\", use crase: Vou à praia → Vou ao clube.",
          "For places, say \"I'm coming back from\": Volto da Bahia → Vou à Bahia. Volto de Curitiba → Vou a Curitiba.",
        ] },
        { h: "Always", list: ["Specific times: às 15h, à uma, à meia-noite.", "Feminine fixed expressions: à vista, às vezes, à noite, à tarde, à toa, à mão, à medida que.", "\"À moda de\": bife à milanesa, à francesa."] },
        { h: "Never", list: ["Before masculine nouns: a pé, a cavalo.", "Before verbs: começou a chover.", "Before most pronouns: a ela, a você, a esta.", "Between repeated words: cara a cara, frente a frente.", "Singular a before a plural noun: Falei a pessoas importantes (but: às pessoas).", "Before casa meaning your own home: Voltei a casa. (But: Fui à casa da minha mãe.)"] },
      ],
      mistakes: [
        ["Começou à chover.", "Começou a chover.", "Never before a verb."],
        ["Fui à pé.", "Fui a pé.", "pé is masculine."],
        ["A reunião é as 15h.", "A reunião é às 15h.", "Specific time."],
        ["Vou à Curitiba.", "Vou a Curitiba.", "Volto de Curitiba → no article."],
      ],
      tip: "In speech nobody hears the crase. It only matters in writing, so check every \"a\" when you reread a formal text.",
    },

    pronome: {
      title: "Pronomes: fala × escrita",
      intro: "Brazilian speech and formal writing place pronouns differently. You need both: speech to sound natural, writing for exams and work.",
      blocks: [
        { table: { head: ["Situação", "Fala brasileira", "Escrita formal"], rows: [
          ["Start of a sentence", "Me passa o sal?", "Passe-me o sal."],
          ["3rd person object", "Eu vi ele ontem.", "Eu o vi ontem."],
          ["'Você' as object", "Te amo. Eu te vi.", "Amo você. Eu o/a vi."],
          ["Indirect object", "Te dei o livro. / Dei o livro pra você.", "Dei-lhe o livro."],
          ["With ir / estar + verb", "Vou te ligar. Estou te esperando.", "Vou ligar-lhe. Estou esperando-o."],
          ["Future tense", "Te conto amanhã.", "Contar-lhe-ei amanhã. (mesóclise, rare)"],
        ] } },
        { h: "Words that pull the pronoun forward (both registers)", p: "Negatives (não, nunca, ninguém), question words (quem, que, onde, como), relative que, and adverbs like já, ainda, sempre, também, talvez: Não me lembro. Quem te contou? Sempre me esqueço. O livro que me deram." },
        { h: "Formal pronoun changes", list: ["After -r, -s, -z the pronoun o/a becomes lo/la and the ending drops: fazer + o → fazê-lo, comprar + a → comprá-la.", "After a nasal sound it becomes no/na: fizeram + o → fizeram-no."] },
        { h: "Difference from Spanish", p: "Spanish attaches pronouns to infinitives and imperatives (llámame, voy a llamarte). Brazilian speech puts them before the main verb, even at the start of a sentence (Me liga!, vou te ligar)." },
      ],
      mistakes: [
        ["Le amo.", "Te amo. / Amo você.", "Spanish pronoun."],
        ["Lhe vi ontem.", "Te vi ontem. (fala) / Eu o vi ontem. (escrita)", "lhe is an indirect object."],
        ["Eu lhe conheço.", "Eu te conheço. / Eu o conheço.", "conhecer takes a direct object."],
        ["Não lembro-me.", "Não me lembro.", "não pulls the pronoun forward."],
      ],
      tip: "In chats and conversation, put the pronoun before the verb every time. Save -lo, -la and lhe for formal emails and essays.",
    },

    formacao: {
      title: "Formação de palavras",
      intro: "Most Spanish suffixes have a regular Portuguese match. Learn the map and you can produce thousands of words. Watch the gender traps.",
      blocks: [
        { h: "Spanish → Portuguese endings", table: { head: ["Español", "Português", "Exemplo"], rows: [
          ["-ción / -ciones", "-ção / -ções", "situación → situação, situações"],
          ["-sión", "-são", "televisión → televisão"],
          ["-dad", "-dade", "ciudad → cidade"],
          ["-ble / -bles", "-vel / -veis", "posible → possível, possíveis"],
          ["-miento", "-mento", "conocimiento → conhecimento"],
          ["-aje (masc.)", "-agem (fem.!)", "el viaje → a viagem, el mensaje → a mensagem"],
          ["-umbre", "-ume", "costumbre → o costume"],
        ] } },
        { h: "Suffixes", table: { head: ["Sufixo", "Significado", "Exemplos"], rows: [
          ["-ção, -mento", "verb → noun", "criar → criação, esquecer → esquecimento"],
          ["-dade, -eza, -ura", "adjective → noun", "feliz → felicidade, belo → beleza, alto → altura"],
          ["-vel", "\"-able\"", "aceitar → aceitável, confiar → confiável"],
          ["-oso / -osa", "full of", "perigo → perigoso, gosto → gostoso"],
          ["-eiro / -eira", "profession, tree", "pão → padeiro, laranja → laranjeira"],
          ["-aria", "shop", "padaria, sorveteria, livraria (bookshop!)"],
          ["-ada", "blow, quick action, amount, group", "facada · dar uma olhada · colherada · a criançada"],
          ["-inho / -zinho", "small, affection, softening", "cafezinho, pertinho, rapidinho, agorinha"],
          ["-ão / -aço", "big, intense", "casarão, calorão, golaço"],
          ["-íssimo", "very", "caríssimo, lindíssimo"],
          ["-ice", "quality (often negative)", "chatice, velhice, burrice"],
        ] } },
        { h: "Prefixes", list: ["des-: desfazer, desligar, desconfiar", "in- / im- / i-: incapaz, impossível, ilegal, irregular", "re-: refazer, reler", "en- / em- + -ecer: entristecer, envelhecer, enriquecer, emagrecer", "a- + -ar: adoçar, aproximar, abaixar"] },
        { h: "Gender traps for Spanish speakers", table: { head: ["Português", "Español"], rows: [
          ["a viagem, a mensagem, a garagem", "el viaje, el mensaje, el garaje"],
          ["o leite, o sangue, o mel", "la leche, la sangre, la miel"],
          ["a dor, a árvore, a ponte", "el dolor, el árbol, el puente"],
          ["o nariz, o costume", "la nariz, la costumbre"],
        ] } },
        { h: "Plurals of -ão", p: "Most become -ões (opiniões, lições). Some become -ães (pães, cães, alemães, capitães) or -ãos (mãos, irmãos, cidadãos)." },
      ],
      mistakes: [
        ["o viagem", "a viagem", "-agem nouns are feminine."],
        ["a leite", "o leite", "Gender differs from Spanish."],
        ["as opiniãos", "as opiniões", "-ão → -ões."],
        ["aceitábeis", "aceitáveis", "-vel → -veis."],
      ],
      tip: "When you don't know a Portuguese word, apply the ending map to the Spanish one and then check it in the dictionary tab.",
    },

    fala: {
      title: "Como os brasileiros falam",
      intro: "Spoken Brazilian Portuguese shortens words, softens with diminutives and moves between registers all the time. At C1 you need to understand all of it, use it with friends, and keep it out of formal writing.",
      blocks: [
        { h: "Spoken reductions", table: { head: ["Forma completa", "Na fala", "Exemplo"], rows: [
          ["você / vocês", "cê / cês", "Cê vai hoje?"],
          ["estou, está, estava", "tô, tá, tava", "Tô chegando, tá?"],
          ["para, para o, para a", "pra, pro, pra", "Vou pro centro."],
          ["não (before a verb)", "num", "Num sei."],
          ["vamos (embora)", "bora, vambora", "Bora!"],
          ["olha", "ó", "Ó, presta atenção."],
          ["deixe-me", "deixa eu", "Deixa eu ver."],
          ["está bom", "tá bom, tá", "Tá bom, combinado."],
        ] } },
        { h: "Brazil vs. Portugal", p: "Brazil uses the gerund: \"estou fazendo\". \"Estou a fazer\" sounds Portuguese. Brazilians also use \"você\" where Portugal often uses \"tu\" (except in the South and parts of the Northeast, where you'll hear \"tu vai\")." },
        { h: "Diminutives are about tone", table: { head: ["Palavra", "O que realmente quer dizer"], rows: [
          ["rapidinho", "real quick: softens a request"],
          ["um minutinho", "just a minute: polite"],
          ["agorinha", "just now / right now: emphasis"],
          ["cafezinho", "the coffee you offer a guest: hospitality"],
          ["só um probleminha", "a problem the speaker is downplaying (it may be big!)"],
        ] } },
        { h: "The same idea in four registers", table: { head: ["Formal", "Neutro", "Informal", "Gíria"], rows: [
          ["compreendo", "entendi", "saquei", "manjei"],
          ["excelente", "muito bom", "legal, bacana", "massa, show, da hora, brabo"],
          ["dinheiro", "dinheiro", "grana", "bufunfa"],
          ["trabalho", "trabalho", "serviço", "trampo"],
          ["estou exausto", "estou muito cansado", "tô morto", "tô só o pó"],
          ["peço desculpas", "desculpa", "foi mal", "vacilei"],
          ["criança", "criança", "menino, menina", "moleque"],
        ] } },
        { h: "\"Pra mim fazer\" vs. \"para eu fazer\"", p: "Before an infinitive, the subject is \"eu\": \"Ele trouxe o livro para eu ler.\" Many Brazilians say \"pra mim ler\" in speech, and you'll hear it everywhere, but in writing and in exams it counts as an error." },
      ],
      mistakes: [
        ["Cê pode me mandar o relatório? (e-mail ao chefe)", "Você poderia me enviar o relatório?", "Spoken reductions don't belong in a work email."],
        ["Ele trouxe para mim ler.", "Ele trouxe para eu ler.", "Subject of the infinitive → eu."],
        ["Estou a estudar.", "Estou estudando.", "European structure."],
        ["E aí, beleza? (entrevista de emprego)", "Bom dia, tudo bem?", "Wrong register."],
      ],
      tip: "Watch a Brazilian YouTuber and note every reduction you hear (cê, tô, num, pra) in the reader. Then do shadowing with those sentences.",
    },

    registro: {
      title: "Informal → formal",
      intro: "C1 means switching register on purpose: chatting with friends in the morning, writing a formal email in the afternoon. This is also where academic vocabulary lives (the Portuguese for \"resaltar\" or \"hacer hincapié en\").",
      blocks: [
        { table: { head: ["Fala", "Escrita neutra ou formal"], rows: [
          ["tô, tá, tava", "estou, está, estava"],
          ["pra, pro", "para, para o"],
          ["a gente vai", "nós vamos"],
          ["Tem muita gente aqui.", "Há muitas pessoas aqui. (like Spanish \"hay\")"],
          ["Eu vi ele.", "Eu o vi."],
          ["um monte de", "uma série de, inúmeros, diversos"],
          ["coisa", "aspecto, fator, questão, elemento"],
          ["falar", "afirmar, declarar, ressaltar, salientar"],
          ["mas", "no entanto, contudo, todavia"],
          ["porque", "visto que, uma vez que, porquanto"],
          ["então", "portanto, por conseguinte, desse modo"],
          ["dar uma olhada", "analisar, examinar"],
          ["tipo, né, aí", "(cut them)"],
        ] } },
        { h: "Academic phrases (your \"resaltar / hacer hincapié\" toolkit)", table: { head: ["Português", "Español"], rows: [
          ["Cabe ressaltar que…", "Cabe resaltar que…"],
          ["Vale destacar que…", "Vale la pena destacar que…"],
          ["É importante frisar que…", "Es importante recalcar que…"],
          ["dar ênfase a / enfatizar", "hacer hincapié en"],
          ["Convém salientar que…", "Conviene señalar que…"],
          ["Nesse sentido, …", "En ese sentido, …"],
          ["Diante do exposto, …", "En vista de lo expuesto, …"],
          ["Em suma, …", "En suma, …"],
        ] } },
        { h: "\"Haver\" and \"fazer\" never agree when impersonal", p: "Havia muitas pessoas (not haviam). Faz dois anos que moro aqui (not fazem). A classic C1 marker, and natives get it wrong too." },
      ],
      mistakes: [
        ["Haviam muitas pessoas na reunião.", "Havia muitas pessoas na reunião.", "Existential haver is always singular."],
        ["Fazem dois anos que…", "Faz dois anos que…", "Time with fazer is always singular."],
        ["A gente acredita que… (redação)", "Acredita-se que… / Acreditamos que…", "Too informal for an essay."],
        ["Tem vários problemas no texto. (formal)", "Há vários problemas no texto.", "Use haver in formal writing."],
      ],
      tip: "When you write formally, reread once only for register: replace every tô, pra, a gente, tem (existential) and mas.",
    },
  };
  window.PT_LESSONS = lessons;
})();
