/**
 * Script incremental — adiciona apenas os cartões de Inspeções Especiais
 * sem apagar nenhum dado existente.
 * Uso: npx tsx prisma/seed-especiais.ts
 */
import { PrismaClient, TipoCartao, InspecaoTipo } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Adicionando cartões de Inspeções Especiais...")

  // Busca os sistemas existentes pelo código
  const [s004, s005, s006] = await Promise.all([
    prisma.sistema.findUnique({ where: { codigo: "004" }, include: { subsistemas: true } }),
    prisma.sistema.findUnique({ where: { codigo: "005" }, include: { subsistemas: true } }),
    prisma.sistema.findUnique({ where: { codigo: "006" }, include: { subsistemas: true } }),
  ])

  if (!s004 || !s005 || !s006) {
    throw new Error("Sistemas 004, 005 ou 006 não encontrados. Execute o seed principal primeiro.")
  }

  type SubList = { id: string; nomeEn: string; nomePt: string }[]
  function findSub(subs: SubList, nameContains: string) {
    const sub = subs.find(s => s.nomeEn.includes(nameContains) || s.nomePt.includes(nameContains))
    if (!sub) throw new Error(`Subsistema contendo "${nameContains}" não encontrado.`)
    return sub
  }

  const sub004_shafts  = findSub(s004.subsistemas, "Drive Shafts")
  const sub005_pylon   = findSub(s005.subsistemas, "Pylon")
  const sub005_trblades = findSub(s005.subsistemas, "TR Blades")
  const sub006_swash   = findSub(s006.subsistemas, "Swashplate")
  const sub006_hub     = findSub(s006.subsistemas, "Hub")
  const sub006_mrblades = findSub(s006.subsistemas, "MR Blades")
  const sub006_oilcooler = findSub(s006.subsistemas, "Oil Cooler")
  const sub006_bifilar = findSub(s006.subsistemas, "Bifilar")
  const sub006_pitch   = findSub(s006.subsistemas, "Pitch Control")

  type SubitemInput = { letra: string; descricaoPt: string; descricaoEn?: string; referencia?: string }
  type CartaoInput = {
    subsistemaId: string
    codigo: string
    nomeEn: string
    nomePt: string
    tipo: TipoCartao
    publicacao?: string
    wp?: string
    duracaoMin?: number
    qtdRecursos?: number
    omDesignator?: string
    observacao?: string
    ordem: number
    inspecaoTipos: InspecaoTipo[]
    subitens: SubitemInput[]
  }

  async function criaCartaoSeNaoExiste(data: CartaoInput) {
    const existente = await prisma.cartao.findFirst({ where: { codigo: data.codigo } })
    if (existente) {
      console.log(`  ↷ Cartão ${data.codigo} já existe, pulando.`)
      return
    }
    const cartao = await prisma.cartao.create({
      data: {
        subsistemaId: data.subsistemaId,
        codigo: data.codigo,
        nomeEn: data.nomeEn,
        nomePt: data.nomePt,
        tipo: data.tipo,
        publicacao: data.publicacao,
        wp: data.wp,
        duracaoMin: data.duracaoMin,
        qtdRecursos: data.qtdRecursos ?? 1,
        omDesignator: data.omDesignator ?? "ALA 4",
        observacao: data.observacao,
        ordem: data.ordem,
      },
    })
    if (data.inspecaoTipos.length > 0) {
      await prisma.cartaoInspecaoTipo.createMany({
        data: data.inspecaoTipos.map((tipo) => ({ cartaoId: cartao.id, inspecaoTipo: tipo })),
      })
    }
    if (data.subitens.length > 0) {
      await prisma.subitem.createMany({
        data: data.subitens.map((s, i) => ({
          cartaoId: cartao.id,
          letra: s.letra,
          descricaoPt: s.descricaoPt,
          descricaoEn: s.descricaoEn,
          referencia: s.referencia,
          ordem: i,
        })),
      })
    }
    console.log(`  ✅ Cartão ${data.codigo} criado.`)
  }

  // ── EP1 ──────────────────────────────────────────────────────────────────
  await criaCartaoSeNaoExiste({
    subsistemaId: sub006_swash.id,
    codigo: "900-EP1",
    nomeEn: "Servicing (ROT) — Erosive Environment (WP 0331)",
    nomePt: "Servicing (ROT) — Ambiente Erosivo (WP 0331)",
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "EM 0013", wp: "WP 0331",
    duracaoMin: 120, qtdRecursos: 2, omDesignator: "ALA 4",
    observacao: "Itens com requisitos mínimos. A Inspetoria pode acrescentar tarefas via Special/Conditional Inspections do EM 0013.",
    ordem: 900, inspecaoTipos: [InspecaoTipo.EP1_ERO],
    subitens: [
      { letra: "A", descricaoEn: "Clean swashplate guide and spherical bearing (WP 0234).", descricaoPt: "Limpar o guia do swashplate e o rolamento esférico (WP 0234).", referencia: "WP 0234" },
      { letra: "B", descricaoEn: "Inspect swashplate guide and spherical bearing (WP 0755).", descricaoPt: "Inspecionar o guia do swashplate e o rolamento esférico (WP 0755).", referencia: "WP 0755" },
      { letra: "C", descricaoEn: "Clean main rotor blade pins (WP 0233).", descricaoPt: "Limpar os pinos das pás do rotor principal (WP 0233).", referencia: "WP 0233" },
    ],
  })

  // ── EP2 ──────────────────────────────────────────────────────────────────
  await criaCartaoSeNaoExiste({
    subsistemaId: sub004_shafts.id,
    codigo: "913-EP2",
    nomeEn: "Hard Landing — Inspect Tail Cone Drive Shafts",
    nomePt: "Pouso Duro — Inspecionar Eixos de Transmissão do Cone de Cauda",
    tipo: TipoCartao.SERVICE,
    publicacao: "EM 0013", duracaoMin: 1440, qtdRecursos: 3, omDesignator: "ALA 4",
    observacao: "Itens com requisitos mínimos.",
    ordem: 913, inspecaoTipos: [InspecaoTipo.EP2_POU],
    subitens: [
      { letra: "A", descricaoEn: "Open tailcone drive shaft covers and inspect drive shaft for damage, cracks, and corrosion.", descricaoPt: "Abrir as tampas dos eixos de transmissão do cone de cauda e inspecionar o eixo de transmissão quanto a danos, trincas e corrosão." },
    ],
  })

  await criaCartaoSeNaoExiste({
    subsistemaId: sub006_hub.id,
    codigo: "915-EP2",
    nomeEn: "Hard Landing — Inspect MR Hub Arm and Droop Stop Ears",
    nomePt: "Pouso Duro — Inspecionar Braço do Hub do RM e Orelhas do Droop Stop",
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "EM 0013", duracaoMin: 60, qtdRecursos: 1, omDesignator: "ALA 4",
    observacao: "Itens com requisitos mínimos.",
    ordem: 915, inspecaoTipos: [InspecaoTipo.EP2_POU],
    subitens: [
      { letra: "A", descricaoEn: "Inspect inside of hub arm for signs of contact with spindle retention nut. If evidence of contact is found, replace spindles. Tag \"DAMAGE OCCURRED DUE TO EXCESSIVE BLADE FLAPPING\".", descricaoPt: "Inspecionar o interior do braço do hub quanto a sinais de contato com a porca de retenção do spindle. Se houver evidência de contato, substituir os spindles. Etiquetar: \"DANO OCORREU DEVIDO A FLAPPING EXCESSIVO DAS PÁS\"." },
      { letra: "B", descricaoEn: "Inspect droop stop ears for cracks. If cracked, replace elastomeric bearing assembly. Tag \"DAMAGE OCCURRED DUE TO EXCESSIVE BLADE FLAPPING\".", descricaoPt: "Inspecionar as orelhas dos batentes de droop quanto a trincas. Se trincadas, substituir o conjunto de rolamento elastomérico. Etiquetar: \"DANO OCORREU DEVIDO A FLAPPING EXCESSIVO DAS PÁS\"." },
    ],
  })

  await criaCartaoSeNaoExiste({
    subsistemaId: sub006_mrblades.id,
    codigo: "918-EP2",
    nomeEn: "Hard Landing — Inspect MR Blades for Blade Strike",
    nomePt: "Pouso Duro — Inspecionar Pás do RM quanto a Contato",
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "EM 0013", duracaoMin: 60, qtdRecursos: 1, omDesignator: "ALA 4",
    observacao: "Itens com requisitos mínimos.",
    ordem: 918, inspecaoTipos: [InspecaoTipo.EP2_POU],
    subitens: [
      { letra: "A", descricaoEn: "If main rotor blades contacted tailcone, pylon, or IR jammer, inspect for signs of impact. Tag \"OCCURRED DUE TO BLADE STRIKE\".", descricaoPt: "Se as pás do rotor principal contataram o cone de cauda, pylon ou bloqueador IR, inspecionar quanto a sinais de impacto. Etiquetar: \"OCORREU DEVIDO A CONTATO DAS PÁS\"." },
      { letra: "B", descricaoEn: "Inspect damaged hub. Tag \"DAMAGE OCCURRED DUE TO EXCESSIVE BLADE FLAPPING\".", descricaoPt: "Inspecionar o hub danificado. Etiquetar: \"DANO OCORREU DEVIDO A FLAPPING EXCESSIVO DAS PÁS\"." },
    ],
  })

  await criaCartaoSeNaoExiste({
    subsistemaId: sub006_oilcooler.id,
    codigo: "919-EP2",
    nomeEn: "Hard Landing — Check Oil Cooler Drive Shaft Preloading",
    nomePt: "Pouso Duro — Verificar Pré-carga do Eixo do Resfriador de Óleo",
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "EM 0013", duracaoMin: 960, qtdRecursos: 2, omDesignator: "ALA 4",
    observacao: "Itens com requisitos mínimos.",
    ordem: 919, inspecaoTipos: [InspecaoTipo.EP2_POU],
    subitens: [
      { letra: "A", descricaoPt: "Desconectar o eixo de transmissão Seção II do rotor de cauda próximo ao amortecedor viscoso No 1.", descricaoEn: "Disconnect Section II tail rotor drive shaft near No 1 viscous damper." },
      { letra: "B", descricaoPt: "Remover os parafusos de fixação do suporte traseiro do resfriador de óleo.", descricaoEn: "Remove bolts attaching rear oil cooler support." },
      { letra: "C", descricaoPt: "ATENÇÃO — CSI: Usar escala com indicador de mostrador. Certificar que não mais de 10 lb de força são necessárias para alinhar os furos do suporte traseiro do resfriador de óleo com os furos na flange do rolamento.", descricaoEn: "WARNING — CSI: Using dial indicating scale, make sure no more than 10 lbs force needed to align rear oil cooler support bolt holes with bearing flange bolt holes." },
      { letra: "D", descricaoPt: "SE A PRÉ-CARGA FOR MAIOR QUE 10 lb, SUBSTITUIR O RESFRIADOR DE ÓLEO.", descricaoEn: "IF PRELOAD IS MORE THAN 10 POUNDS, REPLACE OIL COOLER." },
      { letra: "E", descricaoPt: "ATENÇÃO — CSI: Se a pré-carga for ≤ 10 lb, instalar o suporte traseiro com parafusos, arruelas, calços e porcas. TORQUEAR 115–125 INCH-POUNDS. Seguir WP 0907.", descricaoEn: "WARNING — CSI: If preload ≤ 10 lbs, install oil cooler rear support with bolts, washers, shims and nuts. TORQUE NUTS 115–125 INCH-POUNDS. Follow WP 0907.", referencia: "WP 0907" },
    ],
  })

  // ── EP3 ──────────────────────────────────────────────────────────────────
  await criaCartaoSeNaoExiste({
    subsistemaId: sub006_mrblades.id,
    codigo: "920-EP3",
    nomeEn: "Sudden Stoppage — Main Rotor Blades (SDI)",
    nomePt: "Parada Brusca — Pás do Rotor Principal (SDI)",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "EM 0013", duracaoMin: 1440, qtdRecursos: 3, omDesignator: "ALA 4",
    observacao: "Itens com requisitos mínimos.",
    ordem: 920, inspecaoTipos: [InspecaoTipo.EP3_PAR],
    subitens: [
      { letra: "A", descricaoPt: "Se o dano for menor que o critério de aceitação/rejeição, reparar as pás.", descricaoEn: "If damage is less than accept/reject criteria, repair blades." },
      { letra: "B", descricaoPt: "Inspecionar orelhas dos batentes de droop quanto a trincas. Se trincadas, substituir spindle. Etiquetar: \"DANO OCORREU DEVIDO A FLAPPING EXCESSIVO DAS PÁS\".", descricaoEn: "Inspect droop stop ears for cracks. If cracked, replace spindle. Tag \"DAMAGE OCCURRED DUE TO EXCESSIVE BLADE FLAPPING\"." },
      { letra: "C", descricaoPt: "Se o dano incluir rompimento das pás na parte interna da tampa da ponta, remover a transmissão e cabeça do rotor e enviar para revisão. Etiquetar todos os componentes: \"DANO ÀS PÁS OCORREU ENQUANTO O CABEÇA DO ROTOR ESTAVA EM MOVIMENTO\".", descricaoEn: "If damage includes severing blades inboard of tip cap, remove transmission and rotor head and send to overhaul. Tag all components \"BLADE DAMAGE OCCURRED WHILE ROTOR HEAD IN MOTION\"." },
      { letra: "D", descricaoPt: "Se o dano for maior que o critério de aceitação/rejeição — remover pás e spindles para revisão. Inspecionar orelhas de fixação das pás e orelhas do amortecedor no spindle quanto a danos.", descricaoEn: "If damage is greater than accept/reject criteria — remove blades and spindles for overhaul. Inspect blade attachment lugs and damper lugs on spindle for damage." },
      { letra: "E", descricaoPt: "Substituir hub se danificado. Etiquetar: \"DANO OCORREU DEVIDO A FLAPPING EXCESSIVO DAS PÁS\". Inspecionar amortecedores, cornos de controle, hastes de passo, swashplate giratório e tesouras.", descricaoEn: "Replace hub if damaged. Tag \"DAMAGE DUE TO EXCESSIVE BLADE FLAPPING\". Inspect dampers, control horns, pitch control rods, rotating swashplate and scissors." },
      { letra: "F", descricaoPt: "Inspecionar os pontos de fixação da estrutura quanto a deformação e danos.", descricaoEn: "Inspect airframe attachment points for deformation and damage." },
      { letra: "G", descricaoPt: "Inspecionar visualmente eixos de transmissão de entrada, eixos de cauda, área do eixo do resfriador de óleo, acoplamentos flexíveis, rolamentos e suportes quanto a trincas e distorção.", descricaoEn: "Visually inspect input drive shafts, tail drive shafts, oil cooler shaft area, flexible couplings, bearings, and supports for cracks and distortion." },
      { letra: "H", descricaoPt: "Se o dano for maior que o critério de aba de trim, tira abrasiva e bloco de equilíbrio (sem dano estrutural primário), remover pás e enviar para revisão.", descricaoEn: "If damage is greater than trim tab, abrasion strip, and balance block accept/reject (no primary structural damage), remove blades and send to overhaul." },
      { letra: "I", descricaoPt: "Se o dano à tampa da ponta for maior que o critério de aceitação/rejeição, avaliar com base na capacidade de reparo dos componentes (bloco, insertos Rosan, pesos, pinos, nervura).", descricaoEn: "If tip cap damage is greater than accept/reject criteria, evaluate based on repairability (tip block, Rosan inserts, tip weights, weight studs, tip rib)." },
    ],
  })

  await criaCartaoSeNaoExiste({
    subsistemaId: sub005_trblades.id,
    codigo: "922-EP3",
    nomeEn: "Sudden Stoppage — Tail Rotor Blades (SDI)",
    nomePt: "Parada Brusca — Pás do Rotor de Cauda (SDI)",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "EM 0013", duracaoMin: 960, qtdRecursos: 2, omDesignator: "ALA 4",
    observacao: "Itens com requisitos mínimos.",
    ordem: 922, inspecaoTipos: [InspecaoTipo.EP3_PAR],
    subitens: [
      { letra: "A", descricaoPt: "Se o dano for menor que o critério de aceitação/rejeição — inspecionar as 4 orelhas de montagem da TGB. Inspecionar visualmente a montagem da IGB, eixos de transmissão, acoplamentos, rolamentos e suportes. Realizar inspeção de desgaste do spline do resfriador de óleo.", descricaoEn: "If blade damage less than accept/reject — inspect all 4 TGB mounting lugs. Visually inspect IGB mounting, drive shafts, couplings, bearings and supports. Perform oil cooler spline wear inspection." },
      { letra: "B", descricaoPt: "Se o dano for maior (amassados ou sulcos > 1/4 pol., ou dano no bloco de fixação) — remover pitch beam, links, pás, placas de retenção, TGB, IGB, ventilador axial e todos os eixos de cauda. Enviar para revisão com etiqueta \"DANO OCORREU ENQUANTO O ROTOR DE CAUDA ESTAVA EM MOVIMENTO\".", descricaoEn: "If greater damage — remove pitch beam, links, blades, retention plates, TGB, IGB, axial fan and all tail drive shafts. Send for overhaul tagged \"DAMAGE OCCURRED WHILE TAIL ROTOR IN MOTION\"." },
      { letra: "C", descricaoPt: "Inspecionar visualmente o pylon de cauda quanto a danos estruturais (rebites soltos, trincas). Inspecionar pontos de fixação da TGB quanto a deformação.", descricaoEn: "Visually inspect tail pylon for structural damage (loose rivets, cracks). Inspect TGB attachment points for deformation." },
      { letra: "D", descricaoPt: "Se o dano for nas Regiões A, B ou C — inspecionar 4 orelhas de montagem da TGB, montagem da IGB, eixos, acoplamentos e suportes. Realizar inspeção do spline. Remover pás e enviar para revisão: \"DANO OCORREU ENQUANTO O ROTOR DE CAUDA ESTAVA EM MOVIMENTO\".", descricaoEn: "If damage in Region A, B, or C — inspect 4 TGB mounting lugs, IGB mounting, drive shafts, couplings. Perform spline inspection. Remove blades for overhaul \"DAMAGE OCCURRED WHILE TAIL ROTOR IN MOTION\"." },
    ],
  })

  // ── EP5 ──────────────────────────────────────────────────────────────────
  await criaCartaoSeNaoExiste({
    subsistemaId: sub005_pylon.id,
    codigo: "960-EP5",
    nomeEn: "PRP Erosive Env — De-Ice Tail Rotor (Lubrification)",
    nomePt: "PRP Atmosfera Erosiva — De-Ice do Rotor de Cauda (Lubrificação)",
    tipo: TipoCartao.LUBRIFICATION,
    publicacao: "EM 0013", duracaoMin: 30, qtdRecursos: 1, omDesignator: "PAMASP",
    ordem: 960, inspecaoTipos: [InspecaoTipo.EP5_PRP],
    subitens: [{ letra: "A", descricaoEn: "Apply protective paint on outer surface of screws and fixed nut of tail rotor de-ice.", descricaoPt: "Aplicar pintura protetora na superfície externa dos screws e porca fixa do de-ice do rotor de cauda." }],
  })

  await criaCartaoSeNaoExiste({
    subsistemaId: sub006_bifilar.id,
    codigo: "961-EP5",
    nomeEn: "PRP Erosive Env — Clean and Lubricate Bifilar",
    nomePt: "PRP Atmosfera Erosiva — Limpar e Lubrificar o Bifilar",
    tipo: TipoCartao.LUBRIFICATION,
    publicacao: "EM 0013", duracaoMin: 20, qtdRecursos: 1, omDesignator: "PAMASP",
    ordem: 961, inspecaoTipos: [InspecaoTipo.EP5_PRP],
    subitens: [{ letra: "A", descricaoEn: "Clean and lubricate the bifilar (vibration absorber).", descricaoPt: "Limpar e lubrificar o bifilar (absorvedor de vibração)." }],
  })

  await criaCartaoSeNaoExiste({
    subsistemaId: sub006_pitch.id,
    codigo: "962-EP5",
    nomeEn: "PRP Erosive Env — Lubricate Pitch Beam Retaining Nut",
    nomePt: "PRP Atmosfera Erosiva — Lubrificar Porca de Retenção do Pitch Beam",
    tipo: TipoCartao.LUBRIFICATION,
    publicacao: "EM 0013", duracaoMin: 20, qtdRecursos: 1, omDesignator: "PAMASP",
    observacao: "NÃO MISTURE OS COMPOSTOS — USE O QUE JÁ ESTAVA NAS PEÇAS.",
    ordem: 962, inspecaoTipos: [InspecaoTipo.EP5_PRP],
    subitens: [{ letra: "A", descricaoEn: "Lubricate outer surface of pitch beam retaining nut and washer. DO NOT MIX COMPOUNDS — USE WHATEVER WAS ON THE PARTS.", descricaoPt: "Lubrificar a superfície externa da porca de retenção do pitch beam e da arruela. NÃO MISTURE OS COMPOSTOS — USE O QUE JÁ ESTAVA NAS PEÇAS." }],
  })

  await criaCartaoSeNaoExiste({
    subsistemaId: sub006_pitch.id,
    codigo: "963-EP5",
    nomeEn: "PRP Erosive Env — Lubricate Outboard Retention Plate Bolts",
    nomePt: "PRP Atmosfera Erosiva — Lubrificar Bolts da Placa de Retenção Externa",
    tipo: TipoCartao.LUBRIFICATION,
    publicacao: "EM 0013", duracaoMin: 20, qtdRecursos: 1, omDesignator: "PAMASP",
    ordem: 963, inspecaoTipos: [InspecaoTipo.EP5_PRP],
    subitens: [{ letra: "A", descricaoEn: "Lubricate outer surface of bolts and nuts of outboard retention plate.", descricaoPt: "Lubrificar a superfície externa dos bolts e nuts da placa de retenção externa (outboard retention plate)." }],
  })

  await criaCartaoSeNaoExiste({
    subsistemaId: sub004_shafts.id,
    codigo: "964-EP5",
    nomeEn: "PRP Erosive Env — Lubricate Tail Rotor Drive Shaft Couplings",
    nomePt: "PRP Atmosfera Erosiva — Lubrificar Acoplamentos dos Eixos do Rotor de Cauda",
    tipo: TipoCartao.LUBRIFICATION,
    publicacao: "EM 0013", duracaoMin: 30, qtdRecursos: 1, omDesignator: "PAMASP",
    ordem: 964, inspecaoTipos: [InspecaoTipo.EP5_PRP],
    subitens: [{ letra: "A", descricaoEn: "Lubricate couplings and screws of tail rotor drive shafts.", descricaoPt: "Lubrificar os couplings e os parafusos dos eixos de acionamento do rotor de cauda." }],
  })

  console.log("✅ Cartões de Inspeções Especiais adicionados com sucesso!")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
