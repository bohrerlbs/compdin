import { PrismaClient, TipoCartao, InspecaoTipo } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hhmm(h: number, m = 0) {
  return h * 60 + m
}

// Todas as inspeções horárias progressivas
const PMS40: InspecaoTipo[] = [InspecaoTipo.PMS_40, InspecaoTipo.PMS_120, InspecaoTipo.PMS_360, InspecaoTipo.PMI_480, InspecaoTipo.PMI_960]
const PMS120: InspecaoTipo[] = [InspecaoTipo.PMS_120, InspecaoTipo.PMS_360, InspecaoTipo.PMI_480, InspecaoTipo.PMI_960]
const PMS360: InspecaoTipo[] = [InspecaoTipo.PMS_360, InspecaoTipo.PMI_480, InspecaoTipo.PMI_960]
const PMI480: InspecaoTipo[] = [InspecaoTipo.PMI_480, InspecaoTipo.PMI_960]
const PMI960: InspecaoTipo[] = [InspecaoTipo.PMI_960]

// ─── Main ─────────────────────────────────────────────────────────────────────

async function findOrCreateSubsistema(data: { sistemaId: string; nomeEn: string; nomePt: string; ordem: number }) {
  return (
    (await prisma.subsistema.findFirst({ where: { sistemaId: data.sistemaId, nomeEn: data.nomeEn } })) ??
    (await prisma.subsistema.create({ data }))
  )
}

async function main() {
  console.log("🌱 Iniciando seed...")

  // ─── Usuários padrão (cria apenas se não existir) ─────────────────────────
  const senhaHash = await bcrypt.hash("compdin2024", 10)
  for (const u of [
    { nome: "Admin COMPDIN", trigrama: "ADM", matricula: "admin", role: "ADMIN" as const },
    { nome: "Inspetor Padrão", trigrama: "INS", matricula: "inspetor01", role: "INSPETOR" as const },
    { nome: "Encarregado Padrão", trigrama: "ENC", matricula: "encarregado01", role: "ENCARREGADO" as const },
    { nome: "Mecânico Padrão", trigrama: "MEC", matricula: "mecanico01", role: "MECANICO" as const },
  ]) {
    await prisma.user.upsert({
      where: { matricula: u.matricula },
      create: { ...u, passwordHash: senhaHash },
      update: {},
    })
  }

  // ─── ANVs (cria apenas se não existir) ────────────────────────────────────
  for (const anv of [
    { matricula: "8913", modelo: "H-60L" },
    { matricula: "8914", modelo: "H-60L" },
  ]) {
    await prisma.anv.upsert({
      where: { matricula: anv.matricula },
      create: anv,
      update: {},
    })
  }

  // ─── Sistemas ─────────────────────────────────────────────────────────────

  const [s004, s005, s006] = await Promise.all([
    prisma.sistema.upsert({ where: { codigo: "004" }, create: { codigo: "004", nomeEn: "Tail Cone Section", nomePt: "Seção do Cone de Cauda", ordem: 1 }, update: {} }),
    prisma.sistema.upsert({ where: { codigo: "005" }, create: { codigo: "005", nomeEn: "Tail Rotor Pylon Section", nomePt: "Seção do Pylon do Rotor de Cauda", ordem: 2 }, update: {} }),
    prisma.sistema.upsert({ where: { codigo: "006" }, create: { codigo: "006", nomeEn: "Main Rotor Pylon Section", nomePt: "Seção do Pylon do Rotor Principal", ordem: 3 }, update: {} }),
  ])

  // ─── Subsistemas 004 ──────────────────────────────────────────────────────

  const sub004_shafts = await findOrCreateSubsistema({ sistemaId: s004.id, nomeEn: "Drive Shafts (Sec II & III)", nomePt: "Eixos de Transmissão (Sec II e III)", ordem: 1 })

  // ─── Subsistemas 005 ──────────────────────────────────────────────────────

  const sub005_igb = await findOrCreateSubsistema({ sistemaId: s005.id, nomeEn: "IGB (Intermediate Gear Box)", nomePt: "IGB (Caixa de Engrenagem Intermediária)", ordem: 1 })
  const sub005_pylon = await findOrCreateSubsistema({ sistemaId: s005.id, nomeEn: "Pylon / TGB (Tail Gear Box)", nomePt: "Pylon / TGB (Caixa de Engrenagem de Cauda)", ordem: 2 })
  const sub005_trblades = await findOrCreateSubsistema({ sistemaId: s005.id, nomeEn: "TR Blades (Tail Rotor Blades)", nomePt: "Pás do Rotor de Cauda", ordem: 3 })

  // ─── Subsistemas 006 ──────────────────────────────────────────────────────

  const sub006_acc = await findOrCreateSubsistema({ sistemaId: s006.id, nomeEn: "Accessory Module", nomePt: "Módulo Acessório", ordem: 1 })
  const sub006_trans = await findOrCreateSubsistema({ sistemaId: s006.id, nomeEn: "Main Transmission", nomePt: "Transmissão Principal", ordem: 2 })
  const sub006_hub = await findOrCreateSubsistema({ sistemaId: s006.id, nomeEn: "MR Hub & Spindle", nomePt: "Hub e Spindle do Rotor Principal", ordem: 3 })
  const sub006_droop = await findOrCreateSubsistema({ sistemaId: s006.id, nomeEn: "Droop Stops & Anti-Flap", nomePt: "Batentes de Droop e Anti-Flap", ordem: 4 })
  const sub006_bifilar = await findOrCreateSubsistema({ sistemaId: s006.id, nomeEn: "Bifilar", nomePt: "Bifilar (Absorvedor de Vibração)", ordem: 5 })
  const sub006_swash = await findOrCreateSubsistema({ sistemaId: s006.id, nomeEn: "Swashplate", nomePt: "Prato Oscilante (Swashplate)", ordem: 6 })
  const sub006_pitch = await findOrCreateSubsistema({ sistemaId: s006.id, nomeEn: "Pitch Control", nomePt: "Controle de Passo", ordem: 7 })
  const sub006_mrblades = await findOrCreateSubsistema({ sistemaId: s006.id, nomeEn: "MR Blades (Main Rotor Blades)", nomePt: "Pás do Rotor Principal", ordem: 8 })
  const sub006_oilcooler = await findOrCreateSubsistema({ sistemaId: s006.id, nomeEn: "Oil Cooler / Radiator", nomePt: "Resfriador de Óleo / Radiador", ordem: 9 })
  const sub006_sec1shaft = await findOrCreateSubsistema({ sistemaId: s006.id, nomeEn: "Drive Shaft Sec I", nomePt: "Eixo de Transmissão Sec I", ordem: 10 })

  // ─── Helper para criar cartão com subitens ────────────────────────────────

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

  async function criaCartao(data: CartaoInput) {
    const existing = await prisma.cartao.findFirst({
      where: { subsistemaId: data.subsistemaId, codigo: data.codigo },
    })
    if (existing) return existing

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
        omDesignator: data.omDesignator ?? "PAMASP",
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

    return cartao
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ÁREA 004 — TAIL CONE SECTION
  // ══════════════════════════════════════════════════════════════════════════

  // 124-(90D) — Inspect Tail Cone Sec II & III Drive Shafts (INSP-90D)
  await criaCartao({
    subsistemaId: sub004_shafts.id,
    codigo: "124-(90D)",
    nomeEn: "Inspect Tail Cone Sec II & III Drive Shafts",
    nomePt: "Inspecionar Eixos de Transmissão Sec II e III do Cone de Cauda",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 30),
    qtdRecursos: 1,
    ordem: 10,
    inspecaoTipos: [InspecaoTipo.INSP_90D],
    subitens: [
      { letra: "d", descricaoEn: "Open drive shaft covers.", descricaoPt: "Abrir as tampas dos eixos de transmissão." },
      { letra: "e", descricaoEn: "Inspect driveshafts for chipped paint, cracks, and/or corrosion.", descricaoPt: "Inspecionar os eixos de transmissão quanto a tinta lascada, trincas e/ou corrosão." },
      { letra: "f", descricaoEn: "Inspect drive shaft flanges for corrosion between tube and flange which can be identified by flaking paint.", descricaoPt: "Inspecionar os flanges dos eixos de transmissão quanto à corrosão entre o tubo e o flange, identificável por tinta descascando." },
      { letra: "g", descricaoEn: "Inspect disc pack couplings for corrosion and condition of corrosion preventative compound. Treat as necessary.", descricaoPt: "Inspecionar os acoplamentos de disco quanto à corrosão e à condição do composto anticorrosivo. Tratar conforme necessário." },
      { letra: "h", descricaoEn: "Inspect drive shaft bearing supports for cracks, corrosion, distortion, and security.", descricaoPt: "Inspecionar os suportes de mancal dos eixos de transmissão quanto a trincas, corrosão, distorção e fixação." },
      { letra: "i", descricaoEn: "Close and secure drive shaft covers.", descricaoPt: "Fechar e fixar as tampas dos eixos de transmissão." },
    ],
  })

  // 089-PMI — Inspect Tail Cone Sec II & III Drive Shafts (PMI-960)
  await criaCartao({
    subsistemaId: sub004_shafts.id,
    codigo: "089-PMI",
    nomeEn: "Inspect Tail Cone Sec II & III Drive Shafts (960H)",
    nomePt: "Inspecionar Eixos de Transmissão Sec II e III — 960H",
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    wp: "WP 0330",
    duracaoMin: hhmm(10),
    qtdRecursos: 2,
    ordem: 20,
    inspecaoTipos: PMI960,
    subitens: [
      { letra: "a", descricaoEn: "Remove section II and III tail rotor drive shafts.", descricaoPt: "Remover os eixos de transmissão do rotor de cauda seções II e III." },
      { letra: "b", descricaoEn: "Inspect tail rotor drive shaft section II and III.", descricaoPt: "Inspecionar os eixos de transmissão do rotor de cauda seções II e III." },
      { letra: "c", descricaoEn: "Inspect tail rotor drive shaft bearing supports for cracks and security.", descricaoPt: "Inspecionar os suportes de mancal dos eixos de transmissão do rotor de cauda quanto a trincas e fixação." },
      { letra: "d", descricaoEn: "Inspect viscous damper bearing mount holes for elongation.", descricaoPt: "Inspecionar os furos de montagem do mancal do amortecedor viscoso quanto à elongação." },
      { letra: "e", descricaoEn: "Install section II and III tail rotor drive shafts.", descricaoPt: "Instalar os eixos de transmissão do rotor de cauda seções II e III." },
    ],
  })

  // ══════════════════════════════════════════════════════════════════════════
  // ÁREA 005 — TAIL ROTOR PYLON SECTION
  // ══════════════════════════════════════════════════════════════════════════

  // ── IGB ──────────────────────────────────────────────────────────────────

  await criaCartao({
    subsistemaId: sub005_igb.id,
    codigo: "086-PMS",
    nomeEn: "Inspect IGB Housing and Mounting",
    nomePt: "Inspecionar Carcaça e Montagem do IGB",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 30),
    qtdRecursos: 1,
    ordem: 10,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoEn: "Remove cover. (ROT)", descricaoPt: "Remover a tampa. (ROT)" },
      { letra: "b", descricaoEn: "Inspect housing, mounting feet, and fuselage mounting pads for cracks, dents, nicks, corrosion and security. (ROT)", descricaoPt: "Inspecionar a carcaça, pés de montagem e almofadas de montagem da fuselagem quanto a trincas, amassados, mossas, corrosão e fixação. (ROT)" },
    ],
  })

  await criaCartao({
    subsistemaId: sub005_igb.id,
    codigo: "088-PMS",
    nomeEn: "Inspect IGB Drain Holes and Reinstall Cover",
    nomePt: "Inspecionar Orifícios de Drenagem do IGB e Reinstalar Tampa",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 10),
    qtdRecursos: 1,
    ordem: 20,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoEn: "Inspect drain holes for obstruction. (ROT)", descricaoPt: "Inspecionar os orifícios de drenagem quanto à obstrução. (ROT)" },
      { letra: "b", descricaoEn: "Reinstall cover. (ROT)", descricaoPt: "Reinstalar a tampa. (ROT)" },
    ],
  })

  await criaCartao({
    subsistemaId: sub005_igb.id,
    codigo: "129-(90D)",
    nomeEn: "Inspect IGB Housing for Corrosion and Apply CPC (90D)",
    nomePt: "Inspecionar Carcaça do IGB quanto a Corrosão e Aplicar CPC — 90D",
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 30),
    qtdRecursos: 1,
    ordem: 30,
    inspecaoTipos: [InspecaoTipo.INSP_90D],
    subitens: [
      { letra: "a", descricaoEn: "Remove corrosion preventive compound. Refer to, Corrosion Preventive Compound Buildup Removal.", descricaoPt: "Remover o composto anticorrosivo. Consultar procedimento de Remoção de Acúmulo de Composto Anticorrosivo." },
      { letra: "b", descricaoEn: "Inspect gearbox housing for corrosion, especially around housing joints, bolts, and studs. If corrosion is found, remove corrosion (WP 0877).", descricaoPt: "Inspecionar a carcaça da caixa de engrenagens quanto à corrosão, especialmente ao redor das juntas, parafusos e pinos roscados da carcaça. Se corrosão for encontrada, removê-la (WP 0877)." },
      { letra: "c", descricaoEn: "Using acid swabbing brush, (WP 3722, Item 74), apply corrosion preventive compound, (WP 3722, Item 139).", descricaoPt: "Usando escova de aplicação ácida, (WP 3722, Item 74), aplicar composto anticorrosivo, (WP 3722, Item 139)." },
    ],
  })

  // ── Pylon / TGB ───────────────────────────────────────────────────────────

  await criaCartao({
    subsistemaId: sub005_pylon.id,
    codigo: "089-PMS",
    nomeEn: "Open TR Pylon Drive Shaft Cover",
    nomePt: "Abrir Tampa do Eixo de Transmissão do Pylon TR",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 5),
    qtdRecursos: 1,
    ordem: 10,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoEn: "Open drive shaft cover. (ROT)", descricaoPt: "Abrir a tampa do eixo de transmissão. (ROT)" },
    ],
  })

  await criaCartao({
    subsistemaId: sub005_pylon.id,
    codigo: "092-PMS",
    nomeEn: "Close TR Pylon Drive Shaft Cover",
    nomePt: "Fechar Tampa do Eixo de Transmissão do Pylon TR",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 5),
    qtdRecursos: 1,
    ordem: 20,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoEn: "Close drive shaft cover. (ROT)", descricaoPt: "Fechar a tampa do eixo de transmissão. (ROT)" },
    ],
  })

  await criaCartao({
    subsistemaId: sub005_pylon.id,
    codigo: "128-(90D)",
    nomeEn: "Inspect TR Pylon Driveshaft and Disc Pack Coupling (90D)",
    nomePt: "Inspecionar Eixo de Transmissão e Acoplamento de Disco do Pylon TR — 90D",
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 30),
    qtdRecursos: 1,
    ordem: 30,
    inspecaoTipos: [InspecaoTipo.INSP_90D],
    subitens: [
      { letra: "b", descricaoEn: "Remove intermediate and tail rotor gear box fairings. Open tail pylon drive shaft cover.", descricaoPt: "Remover os carenamentos das caixas de engrenagens intermediária e do rotor de cauda. Abrir a tampa do eixo de transmissão do pylon de cauda." },
      { letra: "c", descricaoEn: "Inspect driveshaft for chipped paint, cracks, and/or corrosion.", descricaoPt: "Inspecionar o eixo de transmissão quanto a tinta lascada, trincas e/ou corrosão." },
      { letra: "d", descricaoEn: "Inspect drive shaft flange for corrosion between tube and flange which can be identified by flaking paint.", descricaoPt: "Inspecionar o flange do eixo de transmissão quanto à corrosão entre o tubo e o flange, identificável por tinta descascando." },
      { letra: "e", descricaoEn: "Inspect disc pack coupling for corrosion and condition of corrosion preventative compound. Treat as necessary.", descricaoPt: "Inspecionar o acoplamento de disco quanto à corrosão e à condição do composto anticorrosivo. Tratar conforme necessário." },
    ],
  })

  await criaCartao({
    subsistemaId: sub005_pylon.id,
    codigo: "131-(90D)",
    nomeEn: "Inspect TGB Housing for Corrosion and Apply CPC (90D)",
    nomePt: "Inspecionar Carcaça do TGB quanto a Corrosão e Aplicar CPC — 90D",
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 30),
    qtdRecursos: 1,
    ordem: 40,
    inspecaoTipos: [InspecaoTipo.INSP_90D],
    subitens: [
      { letra: "a", descricaoEn: "Remove corrosion preventive compound. Refer to, Corrosion Preventive Compound Buildup Removal.", descricaoPt: "Remover o composto anticorrosivo. Consultar procedimento de Remoção de Acúmulo de Composto Anticorrosivo." },
      { letra: "b", descricaoEn: "Inspect gear box housing for corrosion, especially around housing joints, bolts, and studs. If corrosion is found, remove corrosion (WP 0887).", descricaoPt: "Inspecionar a carcaça da caixa de engrenagens quanto à corrosão, especialmente ao redor das juntas, parafusos e pinos roscados. Se corrosão for encontrada, removê-la (WP 0887)." },
      { letra: "c", descricaoEn: "Using acid swabbing brush, (WP 3722, Item 74), apply corrosion preventive compound, (WP 3722, Item 140).", descricaoPt: "Usando escova de aplicação ácida, (WP 3722, Item 74), aplicar composto anticorrosivo, (WP 3722, Item 140)." },
    ],
  })

  await criaCartao({
    subsistemaId: sub005_pylon.id,
    codigo: "133-(90D)",
    nomeEn: "Inspect TR Pitch Beam Retaining Nut and Close Fairings (90D)",
    nomePt: "Inspecionar Porca de Retenção do Pitch Beam do TR e Fechar Carenamentos — 90D",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 15),
    qtdRecursos: 1,
    ordem: 45,
    inspecaoTipos: [InspecaoTipo.INSP_90D],
    subitens: [
      { letra: "a", descricaoEn: "Inspect tail rotor pitch beam retaining nut, washer, and exposed end of shaft for corrosion. Treat as necessary with corrosion preventive compound, (WP 3722). (ROT)", descricaoPt: "Inspecionar a porca de retenção do pitch beam do rotor de cauda, arruela e extremidade exposta do eixo quanto à corrosão. Tratar conforme necessário com composto anticorrosivo, (WP 3722). (ROT)" },
      { letra: "b", descricaoEn: "Install intermediate and tail rotor gearbox fairings. Close and secure tail pylon drive shaft cover. (ROT)", descricaoPt: "Instalar os carenamentos das caixas de engrenagens intermediária e do rotor de cauda. Fechar e fixar a tampa do eixo de transmissão do pylon de cauda. (ROT)" },
    ],
  })

  await criaCartao({
    subsistemaId: sub005_pylon.id,
    codigo: "106-PMI",
    nomeEn: "Inspect TR Pylon Sec IV Driveshaft Flexible Couplings (480H/960H)",
    nomePt: "Inspecionar Acoplamentos Flexíveis do Eixo Sec IV do Pylon TR — 480H/960H",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(3),
    qtdRecursos: 2,
    ordem: 50,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoEn: "Remove section IV tail rotor drive shaft.", descricaoPt: "Remover o eixo de transmissão do rotor de cauda seção IV." },
      { letra: "b", descricaoEn: "Inspect flexible couplings for corrosion, damage, security, cracks, buckling, wear, and lamination spread.", descricaoPt: "Inspecionar os acoplamentos flexíveis quanto à corrosão, danos, fixação, trincas, empenamento, desgaste e separação de laminados." },
      { letra: "c", descricaoEn: "Inspect spherical washers for corrosion.", descricaoPt: "Inspecionar as arruelas esféricas quanto à corrosão." },
      { letra: "d", descricaoEn: "Reconnect flexible couplings.", descricaoPt: "Reconectar os acoplamentos flexíveis." },
      { letra: "e", descricaoEn: "Install section IV tail rotor drive shaft.", descricaoPt: "Instalar o eixo de transmissão do rotor de cauda seção IV." },
    ],
  })

  await criaCartao({
    subsistemaId: sub005_pylon.id,
    codigo: "108A-PMI",
    nomeEn: "Inspect IGB and TGB Seals and Accelerometers (960H)",
    nomePt: "Inspecionar Vedações e Acelerômetros do IGB e TGB — 960H",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(0, 20),
    qtdRecursos: 1,
    ordem: 60,
    inspecaoTipos: PMI960,
    subitens: [
      { letra: "c", descricaoEn: "Inspect input and output seals for leaks on IGB.", descricaoPt: "Inspecionar as vedações de entrada e saída do IGB quanto a vazamentos." },
      { letra: "d", descricaoEn: "Inspect accelerometers and wiring on input and output sides of gearbox for condition and security.", descricaoPt: "Inspecionar os acelerômetros e a fiação nos lados de entrada e saída da caixa de engrenagens quanto à condição e fixação." },
      { letra: "g", descricaoEn: "Inspect input and output seals for leaks on TGB.", descricaoPt: "Inspecionar as vedações de entrada e saída do TGB quanto a vazamentos." },
    ],
  })

  await criaCartao({
    subsistemaId: sub005_pylon.id,
    codigo: "617",
    nomeEn: "TGB and IGB Oil Sample",
    nomePt: "Amostra de Óleo do TGB e IGB",
    tipo: TipoCartao.LUBRIFICATION,
    publicacao: "TM 1-1520-237-PMI",
    wp: "WP 0321 ROT",
    duracaoMin: hhmm(1),
    qtdRecursos: 1,
    omDesignator: "ALA 4",
    ordem: 70,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoEn: "Perform tail rotor gear box oil sample (WP 0321).", descricaoPt: "Realizar amostra de óleo da caixa de engrenagens do rotor de cauda (WP 0321)." },
      { letra: "b", descricaoEn: "Perform intermediate gear box oil sample (WP 0321).", descricaoPt: "Realizar amostra de óleo da caixa de engrenagens intermediária (WP 0321)." },
    ],
  })

  // ── TR Blades ─────────────────────────────────────────────────────────────

  await criaCartao({
    subsistemaId: sub005_trblades.id,
    codigo: "614-PMS",
    nomeEn: "Inspect TR Blade Horn Assemblies for Cracks (PMS-40)",
    nomePt: "Inspecionar Trincas nos Conjuntos de Corno das Pás TR — PMS-40",
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMS",
    wp: "WP 0297 ROT",
    duracaoMin: hhmm(1),
    qtdRecursos: 2,
    omDesignator: "ALA 4",
    ordem: 10,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoEn: "Clean surfaces of four tail rotor blade horn assemblies with soap and water or isopropyl alcohol, (WP 3722, Item 238).", descricaoPt: "Limpar as superfícies dos quatro conjuntos de corno das pás do rotor de cauda com água e sabão ou álcool isopropílico, (WP 3722, Item 238)." },
      { letra: "b", descricaoEn: "Visually examine painted surfaces for cracks with a magnifying glass.", descricaoPt: "Examinar visualmente as superfícies pintadas quanto a trincas com uma lupa." },
      { letra: "c", descricaoEn: "If no cracks are found, tail rotor blade assembly may continue in service.", descricaoPt: "Se nenhuma trinca for encontrada, o conjunto das pás do rotor de cauda pode continuar em serviço." },
      { letra: "d", descricaoEn: "If crack is suspected, refer to WP 0816.", descricaoPt: "Se trinca for suspeita, consultar WP 0816." },
    ],
  })

  await criaCartao({
    subsistemaId: sub005_trblades.id,
    codigo: "614A-PMS",
    nomeEn: "Inspect TR Blade Spar (all PNs, PMS-120+)",
    nomePt: "Inspecionar Longarina das Pás TR (todos os PNs, PMS-120+)",
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMS",
    wp: "WP 0297 ROT",
    duracaoMin: hhmm(1),
    qtdRecursos: 1,
    omDesignator: "ALA 4",
    observacao: "Todos os PNs. Repetir para as 4 pás.",
    ordem: 20,
    inspecaoTipos: PMS120,
    subitens: [
      { letra: "a", descricaoEn: "Remove one of the tail rotor boot ties and roll back tail rotor boot (WP 0818).", descricaoPt: "Remover uma das tiras de fixação do boot do rotor de cauda e dobrar o boot (WP 0818)." },
      { letra: "b", descricaoEn: "Inspect blade spar for damage as a result of contact with tail rotor horn fairing (WP 0826).", descricaoPt: "Inspecionar a longarina da pá quanto a danos resultantes do contato com o carenamento do corno do rotor de cauda (WP 0826)." },
      { letra: "c", descricaoEn: "Inspect blade spar for delamination and/or splinters in area near horn fairing inner lip (WP 0826).", descricaoPt: "Inspecionar a longarina da pá quanto a delaminação e/ou lascas na área próxima à borda interna do carenamento do corno (WP 0826)." },
      { letra: "d", descricaoEn: "Check for blade spar corner-to-fairing clearance (WP 0815).", descricaoPt: "Verificar a folga entre o canto da longarina da pá e o carenamento (WP 0815)." },
      { letra: "e", descricaoEn: "Install tail rotor boot (WP 0818).", descricaoPt: "Instalar o boot do rotor de cauda (WP 0818)." },
      { letra: "f", descricaoEn: "Repeat for all 4 tail rotor blades.", descricaoPt: "Repetir para todas as 4 pás do rotor de cauda." },
    ],
  })

  await criaCartao({
    subsistemaId: sub005_trblades.id,
    codigo: "110-PMI",
    nomeEn: "Remove TR Blades and Outboard Retention Plate (480H/960H)",
    nomePt: "Remover Pás TR e Placa de Retenção Externa — 480H/960H",
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(2),
    qtdRecursos: 1,
    ordem: 30,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoEn: "Remove tail rotor blades and outboard retention plate.", descricaoPt: "Remover as pás do rotor de cauda e a placa de retenção externa." },
    ],
  })

  await criaCartao({
    subsistemaId: sub005_trblades.id,
    codigo: "111-PMI",
    nomeEn: "Inspect TR Retention Plates, Pitch Beam, and Pitch Control Rods (480H/960H)",
    nomePt: "Inspecionar Placas de Retenção, Pitch Beam e Varetas de Controle de Passo do TR — 480H/960H",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(5),
    qtdRecursos: 1,
    ordem: 40,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "b", descricaoEn: "Inspect retention plates for cracks, damage, and security.", descricaoPt: "Inspecionar as placas de retenção quanto a trincas, danos e fixação." },
      { letra: "c", descricaoEn: "Inspect index sensor sweeper bracket on inboard side of inboard retention plate for security and damage.", descricaoPt: "Inspecionar o suporte do varredor do sensor de índice no lado interno da placa de retenção interna quanto à fixação e danos." },
      { letra: "d", descricaoEn: "Inspect nylon shims on inboard and outboard retention plates for waviness and minimum and maximum thickness.", descricaoPt: "Inspecionar os calços de nylon nas placas de retenção interna e externa quanto à ondulação e espessura mínima e máxima." },
      { letra: "e", descricaoEn: "Inspect threads of pitch beam retaining nut for thread face wear or chafing.", descricaoPt: "Inspecionar as roscas da porca de retenção do pitch beam quanto ao desgaste ou abrasão das faces das roscas." },
      { letra: "f", descricaoEn: "Remove seal from outboard retention plate.", descricaoPt: "Remover a vedação da placa de retenção externa." },
      { letra: "g", descricaoEn: "Inspect snap ring and end of bushing for corrosion.", descricaoPt: "Inspecionar o anel de retenção e a extremidade da bucha quanto à corrosão." },
      { letra: "h", descricaoEn: "Inspect pitch control rods IAW Airframe Maintenance Procedures.", descricaoPt: "Inspecionar as varetas de controle de passo conforme os Procedimentos de Manutenção da Célula." },
      { letra: "i", descricaoEn: "Inspect pitch beam for cracks and damage.", descricaoPt: "Inspecionar o pitch beam quanto a trincas e danos." },
      { letra: "j", descricaoEn: "Visually inspect pitch beam washer for cracks. Replace washer if any cracks are present.", descricaoPt: "Inspecionar visualmente a arruela do pitch beam quanto a trincas. Substituir a arruela se quaisquer trincas estiverem presentes." },
      { letra: "k", descricaoEn: "Perform torque check on inboard retention plate attaching bolts.", descricaoPt: "Realizar verificação de torque nos parafusos de fixação da placa de retenção interna." },
    ],
  })

  await criaCartao({
    subsistemaId: sub005_trblades.id,
    codigo: "113-PMI",
    nomeEn: "Inspect TR Blades, Pitch Horn, and Boot (480H/960H)",
    nomePt: "Inspecionar Pás TR, Corno de Passo e Boot — 480H/960H",
    tipo: TipoCartao.SERVICE,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(3),
    qtdRecursos: 2,
    ordem: 50,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoEn: "Inspect tail rotor blades for erosion and damage.", descricaoPt: "Inspecionar as pás do rotor de cauda quanto à erosão e danos." },
      { letra: "b", descricaoEn: "Inspect tipcaps for security.", descricaoPt: "Inspecionar os tipcaps quanto à fixação." },
      { letra: "c", descricaoEn: "Inspect tail rotor blade erosion protection kit polyurethane tape for wear, holes, or disbonding.", descricaoPt: "Inspecionar a fita de poliuretano do kit de proteção contra erosão das pás do rotor de cauda quanto ao desgaste, furos ou descolamento." },
      { letra: "d", descricaoEn: "Inspect tail rotor blade tip cap erosion protection kit polyurethane coating for wear.", descricaoPt: "Inspecionar o revestimento de poliuretano do kit de proteção contra erosão do tipcap das pás do rotor de cauda quanto ao desgaste." },
      { letra: "e", descricaoEn: "Inspect pitch horn and bracket for damage, cracks, corrosion, and security.", descricaoPt: "Inspecionar o corno de passo e o suporte quanto a danos, trincas, corrosão e fixação." },
      { letra: "f", descricaoEn: "Perform coin-tapping inspection to the horn-to-torque tube bond area.", descricaoPt: "Realizar inspeção por percussão com moeda na área de ligação corno-tubo de torque." },
      { letra: "g", descricaoEn: "Remove one boot tiedown strap from each blade and roll back boot.", descricaoPt: "Remover uma tira de fixação do boot de cada pá e dobrar o boot." },
      { letra: "h", descricaoEn: "Inspect blade spar for wear or damage and security as a result of contact with tail rotor horn fairing. Check for spar corner to fairing clearance. Check for delaminations and splinters on spar in areas near fairing inner lip.", descricaoPt: "Inspecionar a longarina da pá quanto ao desgaste ou danos e fixação resultantes do contato com o carenamento do corno do rotor de cauda. Verificar folga do canto da longarina ao carenamento. Verificar delaminações e lascas na longarina nas áreas próximas à borda interna do carenamento." },
      { letra: "i", descricaoEn: "Inspect tail rotor plug for cracks, disbonding, fretting, scoring, and corrosion.", descricaoPt: "Inspecionar o plug do rotor de cauda quanto a trincas, descolamento, desgaste por atrito, riscos e corrosão." },
    ],
  })

  await criaCartao({
    subsistemaId: sub005_trblades.id,
    codigo: "114-PMI",
    nomeEn: "Inspect TR Pivot Bearing and Reinstall Blades (480H/960H)",
    nomePt: "Inspecionar Rolamento Pivô do TR e Reinstalar Pás — 480H/960H",
    tipo: TipoCartao.SERVICE,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(3),
    qtdRecursos: 2,
    ordem: 60,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "j", descricaoEn: "Inspect pivot bearing for wear and separation.", descricaoPt: "Inspecionar o rolamento pivô quanto ao desgaste e separação." },
      { letra: "k", descricaoEn: "Inspect pivot bearing retainer for disbonding.", descricaoPt: "Inspecionar o retentor do rolamento pivô quanto ao descolamento." },
      { letra: "l", descricaoEn: "Inspect boots for wear or damage and security.", descricaoPt: "Inspecionar os boots quanto ao desgaste ou danos e fixação." },
      { letra: "m", descricaoEn: "Install boot tiedown strap.", descricaoPt: "Instalar a tira de fixação do boot." },
      { letra: "n", descricaoEn: "Install tail rotor blades.", descricaoPt: "Instalar as pás do rotor de cauda." },
    ],
  })

  // ══════════════════════════════════════════════════════════════════════════
  // ÁREA 006 — MAIN ROTOR PYLON SECTION
  // ══════════════════════════════════════════════════════════════════════════

  // ── Módulo Acessório ──────────────────────────────────────────────────────

  await criaCartao({
    subsistemaId: sub006_acc.id,
    codigo: "111-PMS",
    nomeEn: "Inspect Accessory Module for Oil Seepage",
    nomePt: "Inspecionar Módulo Acessório quanto a Vazamento de Óleo",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 15),
    qtdRecursos: 1,
    ordem: 10,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoEn: "Inspect accessory module for oil seepage, paying particular attention to area around main generator. (ROT)", descricaoPt: "Inspecionar o módulo acessório quanto a vazamento de óleo, prestando atenção especial à área ao redor do gerador principal. (ROT)" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_acc.id,
    codigo: "112-PMS",
    nomeEn: "Inspect Input and Accessory Module Housings for Paint Discoloration",
    nomePt: "Inspecionar Carcaças dos Módulos de Entrada e Acessório quanto a Descoloração da Tinta",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 15),
    qtdRecursos: 1,
    ordem: 20,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoEn: "Inspect input and accessory module housings for paint discoloration from aluminized gray to brown. (ROT)", descricaoPt: "Inspecionar as carcaças dos módulos de entrada e acessório quanto à descoloração da tinta de cinza aluminizado para marrom. (ROT)" },
    ],
  })

  // ── Transmissão Principal ─────────────────────────────────────────────────

  await criaCartao({
    subsistemaId: sub006_trans.id,
    codigo: "129-PMS",
    nomeEn: "Inspect Main Transmission Mounting Lugs and Dowel Pins",
    nomePt: "Inspecionar Apoios de Montagem e Pinos Guia da Transmissão Principal",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 30),
    qtdRecursos: 1,
    ordem: 10,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoEn: "Inspect mounting lugs for cracks, dents, nicks, corrosion, and security.", descricaoPt: "Inspecionar os apoios de montagem quanto a trincas, amassados, mossas, corrosão e fixação." },
      { letra: "b", descricaoEn: "Check engine input seal area for oil leaks.", descricaoPt: "Verificar a área de vedação da entrada do motor quanto a vazamentos de óleo." },
      { letra: "c", descricaoEn: "MWO 50-43 Inspect dowel pin retention bolts and retaining angles for deformation and security.", descricaoPt: "MWO 50-43 Inspecionar os parafusos de retenção dos pinos guia e os ângulos de retenção quanto à deformação e fixação." },
      { letra: "d", descricaoEn: "W/O MWO 50-43 Inspect dowel pins for signs of axial or rotational play on main gear box with slippage strip.", descricaoPt: "S/ MWO 50-43 Inspecionar os pinos guia quanto a sinais de folga axial ou rotacional na caixa de engrenagem principal com a tira de deslizamento." },
      { letra: "e", descricaoEn: "W/O MWO 50-43 Inspect sealing compound covering dowel pins for bulging, blistering, and cracking.", descricaoPt: "S/ MWO 50-43 Inspecionar o composto de vedação que cobre os pinos guia quanto a abaulamento, bolhas e rachaduras." },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_trans.id,
    codigo: "136-(90D)",
    nomeEn: "Inspect Main Transmission Housing for Corrosion and Apply CPC (90D)",
    nomePt: "Inspecionar Carcaça da Transmissão Principal quanto a Corrosão e Aplicar CPC — 90D",
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMS",
    wp: "WP 0304 ROT",
    duracaoMin: hhmm(0, 25),
    qtdRecursos: 1,
    ordem: 20,
    inspecaoTipos: [InspecaoTipo.INSP_90D],
    subitens: [
      { letra: "a", descricaoEn: "Remove corrosion preventive compound. Refer to, Corrosion Preventive Compound Buildup Removal.", descricaoPt: "Remover o composto anticorrosivo. Consultar procedimento de Remoção de Acúmulo de Composto Anticorrosivo." },
      { letra: "b", descricaoEn: "Inspect main transmission housing for corrosion, especially around housing joints, bolts, and studs. If corrosion is found, remove corrosion (WP 0487).", descricaoPt: "Inspecionar a carcaça da transmissão principal quanto à corrosão, especialmente ao redor das juntas, parafusos e pinos roscados. Se corrosão for encontrada, removê-la (WP 0487)." },
      { letra: "c", descricaoEn: "Inspect drain hole on forward bridge mount pad of main transmission for clog or obstruction, which could lead to water entrapment. (Figure 1).", descricaoPt: "Inspecionar o orifício de drenagem no apoio de montagem da ponte dianteira da transmissão principal quanto à obstrução, que pode levar ao acúmulo de água. (Figura 1)." },
      { letra: "d", descricaoEn: "Remove obstruction and remove corrosion (WP 0487).", descricaoPt: "Remover a obstrução e a corrosão (WP 0487)." },
      { letra: "e", descricaoEn: "Reapply corrosion preventive compound (WP 3722, Item 135).", descricaoPt: "Reaplicar o composto anticorrosivo (WP 3722, Item 135)." },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_trans.id,
    codigo: "139-PMI",
    nomeEn: "Inspect Main Transmission Dowel Pins and Bellcrank Supports (480H/960H)",
    nomePt: "Inspecionar Pinos Guia e Suportes do Bellcrank da Transmissão Principal — 480H/960H",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(0, 30),
    qtdRecursos: 1,
    ordem: 30,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "b", descricaoEn: "MWO 50-43> Inspect dowel pin retention bolts and retaining angles for deformation and security.", descricaoPt: "MWO 50-43> Inspecionar os parafusos de retenção dos pinos guia e os ângulos de retenção quanto à deformação e fixação." },
      { letra: "c", descricaoEn: "W/O MWO 50-43> Inspect dowel pins for signs of axial or rotational play on main gear boxes with slippage strip.", descricaoPt: "S/ MWO 50-43> Inspecionar os pinos guia quanto a sinais de folga axial ou rotacional nas caixas de engrenagem principais com a tira de deslizamento." },
      { letra: "d", descricaoEn: "Inspect sealing compound covering dowel pins for bulging, blistering, and cracking.", descricaoPt: "Inspecionar o composto de vedação que cobre os pinos guia quanto a abaulamento, bolhas e rachaduras." },
      { letra: "e", descricaoEn: "MWO 50-43> Check gap between rear bellcrank support retaining angle dowel pin.", descricaoPt: "MWO 50-43> Verificar a folga entre o pino guia do ângulo de retenção do suporte do bellcrank traseiro." },
      { letra: "f", descricaoEn: "Inspect forward bellcrank support mounts for cracks and damage.", descricaoPt: "Inspecionar os apoios do suporte do bellcrank dianteiro quanto a trincas e danos." },
      { letra: "g", descricaoEn: "Inspect aft bellcrank support mounts for cracks and damage.", descricaoPt: "Inspecionar os apoios do suporte do bellcrank traseiro quanto a trincas e danos." },
      { letra: "h", descricaoEn: "Inspect exposed portions of lug areas on the following components for damage and corrosion. Do not disconnect hardware to inspect lugs. (1) Forward bellcrank support (2) Aft bellcrank support (3) Right and left tie rods (4) Aft tie rod and support", descricaoPt: "Inspecionar as porções expostas das áreas de olhal nos seguintes componentes quanto a danos e corrosão. Não desconectar ferragens para inspecionar olhais. (1) Suporte do bellcrank dianteiro (2) Suporte do bellcrank traseiro (3) Tirantes direito e esquerdo (4) Tirante traseiro e suporte" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_trans.id,
    codigo: "141-PMI",
    nomeEn: "Inspect Main Transmission Mating Flanges and Generators (960H)",
    nomePt: "Inspecionar Flanges de Acoplamento e Geradores da Transmissão Principal — 960H",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(3),
    qtdRecursos: 3,
    ordem: 40,
    inspecaoTipos: PMI960,
    subitens: [
      { letra: "b", descricaoEn: "Inspect main, input, and accessory module mating flanges and all connections for oil leaks.", descricaoPt: "Inspecionar os flanges de acoplamento dos módulos principal, de entrada e acessório e todas as conexões quanto a vazamentos de óleo." },
      { letra: "c", descricaoEn: "Inspect main generators for security and evidence of oil leaks.", descricaoPt: "Inspecionar os geradores principais quanto à fixação e evidências de vazamentos de óleo." },
      { letra: "d", descricaoEn: "Inspect main module breather for cleanness.", descricaoPt: "Inspecionar o respiro do módulo principal quanto à limpeza." },
      { letra: "e", descricaoEn: "Inspect installation bolts for burrs and binding in diaphragm coupling assembly.", descricaoPt: "Inspecionar os parafusos de instalação quanto a rebarbas e travamento no conjunto de acoplamento de diafragma." },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_trans.id,
    codigo: "144-PMI",
    nomeEn: "Check Main Transmission Oil Level (960H)",
    nomePt: "Verificar Nível de Óleo da Transmissão Principal — 960H",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(0, 10),
    qtdRecursos: 1,
    ordem: 50,
    inspecaoTipos: PMI960,
    subitens: [
      { letra: "u", descricaoEn: "Check main transmission oil level.", descricaoPt: "Verificar o nível de óleo da transmissão principal." },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_trans.id,
    codigo: "145-PMI",
    nomeEn: "Inspect Input Module Seals for Leaks (960H)",
    nomePt: "Inspecionar Vedações do Módulo de Entrada quanto a Vazamentos — 960H",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(0, 5),
    qtdRecursos: 1,
    ordem: 60,
    inspecaoTipos: PMI960,
    subitens: [
      { letra: "a", descricaoEn: "Inspect input module seals for leaks. (ROT)", descricaoPt: "Inspecionar as vedações do módulo de entrada quanto a vazamentos. (ROT)" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_trans.id,
    codigo: "146-PMI",
    nomeEn: "Inspect Main Rotor Shaft Seal for Leaks (960H)",
    nomePt: "Inspecionar Vedação do Eixo do Rotor Principal quanto a Vazamentos — 960H",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(0, 10),
    qtdRecursos: 1,
    ordem: 70,
    inspecaoTipos: PMI960,
    subitens: [
      { letra: "a", descricaoEn: "Inspect main transmission main rotor shaft seal for leaks. (ROT)", descricaoPt: "Inspecionar a vedação do eixo do rotor principal da transmissão principal quanto a vazamentos. (ROT)" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_trans.id,
    codigo: "147-PMI",
    nomeEn: "Inspect Tail Takeoff Flange Seal and Accelerometer (960H)",
    nomePt: "Inspecionar Vedação do Flange de Saída para Cauda e Acelerômetro — 960H",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(0, 10),
    qtdRecursos: 1,
    ordem: 80,
    inspecaoTipos: PMI960,
    subitens: [
      { letra: "a", descricaoEn: "Inspect main transmission tail takeoff flange output seal for leaks. (ROT)", descricaoPt: "Inspecionar a vedação de saída do flange de tomada de cauda da transmissão principal quanto a vazamentos. (ROT)" },
      { letra: "b", descricaoEn: "Check accelerometer, bracket, and wiring for condition and security.", descricaoPt: "Verificar o acelerômetro, suporte e fiação quanto à condição e fixação." },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_trans.id,
    codigo: "617A",
    nomeEn: "Main Gear Box Oil Sample (960H)",
    nomePt: "Amostra de Óleo da Caixa de Engrenagem Principal — 960H",
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    wp: "WP 0300 ROT",
    duracaoMin: hhmm(1),
    qtdRecursos: 1,
    omDesignator: "ALA 4",
    ordem: 90,
    inspecaoTipos: PMI960,
    subitens: [
      { letra: "a", descricaoEn: "Main gear box oil sample (WP 0321).", descricaoPt: "Amostra de óleo da caixa de engrenagem principal (WP 0321)." },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_trans.id,
    codigo: "622",
    nomeEn: "Drain and Service Main Transmission (960H)",
    nomePt: "Drenar e Abastecer a Transmissão Principal — 960H",
    tipo: TipoCartao.SERVICE,
    publicacao: "TM 1-1520-237-PMI",
    wp: "WP 0215 ROT",
    duracaoMin: hhmm(2),
    qtdRecursos: 1,
    ordem: 100,
    inspecaoTipos: PMI960,
    subitens: [
      { letra: "a", descricaoEn: "Remove drain lines and drip pan (WP 0445, WP 0446, or WP 0447), if required, or open access panel.", descricaoPt: "Remover as linhas de drenagem e a bandeja coletora (WP 0445, WP 0446 ou WP 0447), se necessário, ou abrir o painel de acesso." },
      { letra: "b", descricaoEn: "Remove drain plug (Figure 2). Discard packing.", descricaoPt: "Remover o plug de drenagem (Figura 2). Descartar a vedação." },
      { letra: "c", descricaoEn: "Place end of drain hose (WP 3721, Item 86) in empty 10 gallon container. Insert other end in drain on transmission. Turn fitting on hose clockwise and drain oil into container.", descricaoPt: "Colocar a extremidade da mangueira de drenagem (WP 3721, Item 86) em um recipiente vazio de 10 galões. Inserir a outra extremidade no dreno da transmissão. Girar a conexão da mangueira no sentido horário e drenar o óleo no recipiente." },
      { letra: "d", descricaoEn: "When oil stops flowing, turn drain hose counterclockwise, and remove from drain.", descricaoPt: "Quando o óleo parar de fluir, girar a mangueira de drenagem no sentido anti-horário e remover do dreno." },
      { letra: "e", descricaoEn: "Lubricate packing with oil you will service transmission with. Install packing and plug in drain on transmission. TORQUE PLUG TO 20-60 IN. LBS.", descricaoPt: "Lubrificar a vedação com o óleo com o qual a transmissão será abastecida. Instalar a vedação e o plug no dreno da transmissão. TORQUEAR O PLUG PARA 20-60 LBS.POL." },
      { letra: "f", descricaoEn: "Using nonelectrical wire (WP 3722, Item 477) lockwire plug to drain.", descricaoPt: "Usando arame não elétrico (WP 3722, Item 477), fazer arame de segurança no plug do dreno." },
      { letra: "g", descricaoEn: "Install drain lines and drip pan (WP 0445, WP 0446, or WP 0447), if required, or close access panel.", descricaoPt: "Instalar as linhas de drenagem e a bandeja coletora (WP 0445, WP 0446 ou WP 0447), se necessário, ou fechar o painel de acesso." },
      { letra: "h", descricaoEn: "Check oil level gauge (dipstick) for proper oil level (Figure 1, Detail A).", descricaoPt: "Verificar o medidor de nível de óleo (vareta) para o nível correto de óleo (Figura 1, Detalhe A)." },
      { letra: "i", descricaoEn: "If necessary to add oil, open filler tube cap and fill gear box with approved oil (WP 3722, Item 254/259/256).", descricaoPt: "Se necessário adicionar óleo, abrir a tampa do tubo de abastecimento e encher a caixa de engrenagens com óleo aprovado (WP 3722, Item 254/259/256)." },
    ],
  })

  // ── MR Hub & Spindle ──────────────────────────────────────────────────────

  await criaCartao({
    subsistemaId: sub006_hub.id,
    codigo: "117-PMS",
    nomeEn: "Inspect MR Hub for Cracks and Slippage",
    nomePt: "Inspecionar Hub do Rotor Principal quanto a Trincas e Deslizamento",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 45),
    qtdRecursos: 1,
    ordem: 10,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoEn: "Inspect hub for cracks and damage.", descricaoPt: "Inspecionar o hub quanto a trincas e danos." },
      { letra: "b", descricaoEn: "Visually check spindle shaft shrink tubing for evidence of looseness or movement.", descricaoPt: "Verificar visualmente o tubo termocontrátil do eixo do spindle quanto a evidências de folga ou movimento." },
      { letra: "c", descricaoEn: "Check inner race slippage mark for movement.", descricaoPt: "Verificar a marca de deslizamento da pista interna quanto a movimento." },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_hub.id,
    codigo: "121-PMS",
    nomeEn: "Inspect MR Hub Spherical and Thrust Bearings",
    nomePt: "Inspecionar Rolamentos Esféricos e de Empuxo do Hub do Rotor Principal",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(1, 30),
    qtdRecursos: 1,
    ordem: 20,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoEn: "Using a flashlight and mirror, visually inspect inner and outer surface of spherical bearings through the 2-inch diameter inspection hole for wear, laminate separations, and cracked shims.", descricaoPt: "Usando lanterna e espelho, inspecionar visualmente as superfícies interna e externa dos rolamentos esféricos através do furo de inspeção de 2 polegadas de diâmetro quanto a desgaste, separações de laminados e calços trincados." },
      { letra: "b", descricaoEn: "Using a flashlight and mirror, visually inspect outer surface thrust bearing for elastomeric extrusions, paying particular attention to the 6 o'clock position and surface areas furthest inboard. Replace thrust bearing within the next 40 flight hours if any extrusions are found.", descricaoPt: "Usando lanterna e espelho, inspecionar visualmente a superfície externa do rolamento de empuxo quanto a extrusões elastoméricas, prestando atenção especial à posição das 6 horas e às áreas de superfície mais internas. Substituir o rolamento de empuxo nas próximas 40 horas de voo se quaisquer extrusões forem encontradas." },
      { letra: "c", descricaoEn: "Inspect thrust bearings for laminate separations and cracked shims. Cracks will appear in the edge of metal shims. No cracks allowed.", descricaoPt: "Inspecionar os rolamentos de empuxo quanto a separações de laminados e calços trincados. Trincas aparecerão na borda dos calços metálicos. Nenhuma trinca é permitida." },
      { letra: "d", descricaoEn: "Check elastomeric bearings for surface cracking or crazing of rubber. Small hairline surface cracking or crazing of rubber is acceptable.", descricaoPt: "Verificar os rolamentos elastoméricos quanto a rachaduras de superfície ou craquelamento da borracha. Pequenas rachaduras capilares ou craquelamento da superfície da borracha são aceitáveis." },
      { letra: "e", descricaoEn: "If droop stop pounding is experienced, inspect droop stop ears on spherical elastomeric bearing endplates for cracks.", descricaoPt: "Se impacto do batente de droop for verificado, inspecionar as orelhas do batente de droop nas placas de extremidade dos rolamentos elastoméricos esféricos quanto a trincas." },
      { letra: "f", descricaoEn: "Check thrust bearing endplates for cracks.", descricaoPt: "Verificar as placas de extremidade do rolamento de empuxo quanto a trincas." },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_hub.id,
    codigo: "151-PMI",
    nomeEn: "Remove MR Blades (480H/960H)",
    nomePt: "Remover Pás do Rotor Principal — 480H/960H",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(4),
    qtdRecursos: 1,
    ordem: 30,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoEn: "Remove main rotor blades.", descricaoPt: "Remover as pás do rotor principal." },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_hub.id,
    codigo: "152-PMI",
    nomeEn: "Ultrasonic Inspection of MR Blade Attachment Lugs (480H/960H)",
    nomePt: "Inspeção Ultrassônica dos Olhais de Fixação das Pás do Rotor Principal — 480H/960H",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(10),
    qtdRecursos: 2,
    ordem: 40,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "b", descricaoEn: "Perform Ultrasonic Inspection to Main Rotor Blade Attachment Lugs IAW TM 1-1520-265-23 (Main Rotor Hub Spindle (UT)).", descricaoPt: "Realizar Inspeção Ultrassônica nos Olhais de Fixação das Pás do Rotor Principal conforme TM 1-1520-265-23 (Hub do Rotor Principal Spindle (UT))." },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_hub.id,
    codigo: "153-PMI",
    nomeEn: "Inspect MR Hub Spindle Assemblies and Elastomeric Bearings (480H/960H)",
    nomePt: "Inspecionar Conjuntos do Spindle e Rolamentos Elastoméricos do Hub MR — 480H/960H",
    tipo: TipoCartao.SERVICE,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(6),
    qtdRecursos: 2,
    ordem: 50,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "c", descricaoEn: "Remove spindle assemblies from hub.", descricaoPt: "Remover os conjuntos do spindle do hub." },
      { letra: "d", descricaoEn: "Remove elastomeric bearings from spindles.", descricaoPt: "Remover os rolamentos elastoméricos dos spindles." },
      { letra: "e", descricaoEn: "Inspect spindle sleeve bearings for wear, cracks, corrosion, slippage, and damage.", descricaoPt: "Inspecionar os rolamentos de bucha do spindle quanto a desgaste, trincas, corrosão, deslizamento e danos." },
      { letra: "f", descricaoEn: "Inspect spindle threads for dry film lubricant.", descricaoPt: "Inspecionar as roscas do spindle quanto ao lubrificante em filme seco." },
      { letra: "g", descricaoEn: "Inspect spindle nut threads for dry film lubricant.", descricaoPt: "Inspecionar as roscas da porca do spindle quanto ao lubrificante em filme seco." },
      { letra: "h", descricaoEn: "Inspect elastomeric bearing for wear, damage, or laminate separation.", descricaoPt: "Inspecionar o rolamento elastomérico quanto a desgaste, danos ou separação de laminados." },
      { letra: "i", descricaoEn: "Replace elastomeric bearing sleeve bearing.", descricaoPt: "Substituir o rolamento de bucha do rolamento elastomérico." },
      { letra: "j", descricaoEn: "Inspect droop stop pin bushings for wear and security.", descricaoPt: "Inspecionar as buchas do pino do batente de droop quanto a desgaste e fixação." },
      { letra: "k", descricaoEn: "Check torque on horn attachment bolts.", descricaoPt: "Verificar o torque nos parafusos de fixação do corno." },
      { letra: "l", descricaoEn: "Remove retaining ring and loosen and back off droop stop nut, on applicable spindle assemblies.", descricaoPt: "Remover o anel de retenção e afrouxar e recuar a porca do batente de droop, nos conjuntos de spindle aplicáveis." },
      { letra: "m", descricaoEn: "Inspect droop stop support inner race sleeve bearing for cracks, on applicable spindle assemblies.", descricaoPt: "Inspecionar o rolamento de bucha da pista interna do suporte do batente de droop quanto a trincas, nos conjuntos de spindle aplicáveis." },
      { letra: "n", descricaoEn: "Inspect droop stop nut for corrosion and cracking, on applicable spindle assemblies.", descricaoPt: "Inspecionar a porca do batente de droop quanto a corrosão e rachaduras, nos conjuntos de spindle aplicáveis." },
      { letra: "o", descricaoEn: "Inspect hub inner diameter for evidence of retaining rod contact.", descricaoPt: "Inspecionar o diâmetro interno do hub quanto a evidências de contato com a haste de retenção." },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_hub.id,
    codigo: "154-PMI",
    nomeEn: "Reassemble MR Hub Spindle Assemblies (480H/960H)",
    nomePt: "Remontar Conjuntos do Spindle do Hub MR — 480H/960H",
    tipo: TipoCartao.SERVICE,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(6),
    qtdRecursos: 2,
    ordem: 60,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "p", descricaoEn: "Reassemble spindle assemblies.", descricaoPt: "Remontar os conjuntos do spindle." },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_hub.id,
    codigo: "155-PMI",
    nomeEn: "Install MR Hub Spindle Assemblies (480H/960H)",
    nomePt: "Instalar Conjuntos do Spindle do Hub MR — 480H/960H",
    tipo: TipoCartao.SERVICE,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(15),
    qtdRecursos: 3,
    ordem: 70,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "q", descricaoEn: "Install spindle assemblies.", descricaoPt: "Instalar os conjuntos do spindle." },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_hub.id,
    codigo: "158-PMI",
    nomeEn: "Inspect MR Rotating Scissors Bearing Play (960H)",
    nomePt: "Inspecionar Folga do Rolamento das Tesouras Rotativas do Rotor Principal — 960H",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(1),
    qtdRecursos: 1,
    ordem: 80,
    inspecaoTipos: PMI960,
    subitens: [
      { letra: "a", descricaoEn: "Inspect main rotor rotating scissors for bearing play at upper and lower links and between upper link and pressure plate lugs. (ROT)", descricaoPt: "Inspecionar as tesouras rotativas do rotor principal quanto à folga do rolamento nos links superior e inferior e entre o link superior e os olhais da placa de pressão. (ROT)" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_hub.id,
    codigo: "160-PMI",
    nomeEn: "Inspect MR Shaft for Corrosion and Damage (960H)",
    nomePt: "Inspecionar Eixo do Rotor Principal quanto a Corrosão e Danos — 960H",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(0, 30),
    qtdRecursos: 1,
    ordem: 90,
    inspecaoTipos: PMI960,
    subitens: [
      { letra: "a", descricaoEn: "Inspect inner diameter for signs of corrosion, blistering, flaking, or missing resin coating.", descricaoPt: "Inspecionar o diâmetro interno quanto a sinais de corrosão, bolhas, lascamento ou ausência de revestimento de resina." },
      { letra: "b", descricaoEn: "Inspect all exposed portions of shaft for rust or corrosion.", descricaoPt: "Inspecionar todas as porções expostas do eixo quanto a ferrugem ou corrosão." },
      { letra: "c", descricaoEn: "Inspect shaft extension surface for damage.", descricaoPt: "Inspecionar a superfície de extensão do eixo quanto a danos." },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_hub.id,
    codigo: "161-PMI",
    nomeEn: "Inspect MR Hub, Pressure Plates, and Torque Head Bolts (960H)",
    nomePt: "Inspecionar Hub MR, Placas de Pressão e Parafusos da Cabeça de Torque — 960H",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(4),
    qtdRecursos: 1,
    ordem: 100,
    inspecaoTipos: PMI960,
    subitens: [
      { letra: "a", descricaoEn: "Inspect hub and upper and lower pressure plates for cracks, damage, and corrosion.", descricaoPt: "Inspecionar o hub e as placas de pressão superior e inferior quanto a trincas, danos e corrosão." },
      { letra: "b", descricaoEn: "Check torque of all Zone 1 and Zone 2 Main Rotor Head Bolts. Any torque failures, as outlined in the TM, should be treated as a 1st prescribed torque check failure.", descricaoPt: "Verificar o torque de todos os Parafusos da Cabeça do Rotor Principal das Zonas 1 e 2. Qualquer falha de torque, conforme descrito no TM, deve ser tratada como uma falha de verificação de torque prescrita de 1ª vez." },
      { letra: "c", descricaoEn: "Inspect main rotor blade deice distributor.", descricaoPt: "Inspecionar o distribuidor de degelo das pás do rotor principal." },
      { letra: "d", descricaoEn: "Inspect shaft extension surface for damage.", descricaoPt: "Inspecionar a superfície de extensão do eixo quanto a danos." },
    ],
  })

  // ── Droop Stops & Anti-Flap ───────────────────────────────────────────────

  await criaCartao({
    subsistemaId: sub006_droop.id,
    codigo: "119-PMS",
    nomeEn: "Inspect Droop Stops and Anti-Flap Springs",
    nomePt: "Inspecionar Batentes de Droop e Molas Anti-Flap",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 40),
    qtdRecursos: 1,
    ordem: 10,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoEn: "Check droop stop lugs for cracks.", descricaoPt: "Verificar os olhais do batente de droop quanto a trincas." },
      { letra: "b", descricaoEn: "Check droop stop ring nut for looseness, and sleeve bearing (inner race) for cracks, on spindle assemblies 70070-10030-041, 70070-10030-042, 70070-10030-045, 70070-10030-046, 70102-08200-041 through 70102-08200-044, and 70102-08200-063.", descricaoPt: "Verificar a porca de anel do batente de droop quanto a folga, e o rolamento de bucha (pista interna) quanto a trincas, nos conjuntos de spindle 70070-10030-041, 70070-10030-042, 70070-10030-045, 70070-10030-046, 70102-08200-041 a 70102-08200-044 e 70102-08200-063." },
      { letra: "c", descricaoEn: "Check droop stop support for cracks. Visually inspect droop stop support for cracks at upper and lower puller grooves.", descricaoPt: "Verificar o suporte do batente de droop quanto a trincas. Inspecionar visualmente o suporte do batente de droop quanto a trincas nas ranhuras de extração superior e inferior." },
      { letra: "d", descricaoEn: "Check droop stop and droop stop retaining pin bushings for damage and security.", descricaoPt: "Verificar as buchas do pino de retenção do batente de droop e do batente de droop quanto a danos e fixação." },
      { letra: "e", descricaoEn: "Visually inspect springs and attaching hardware for signs of corrosion.", descricaoPt: "Inspecionar visualmente as molas e os fixadores quanto a sinais de corrosão." },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_droop.id,
    codigo: "120-PMS",
    nomeEn: "Inspect Anti-Flap Cam and Droop Stop Cam",
    nomePt: "Inspecionar Came Anti-Flap e Came do Batente de Droop",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 30),
    qtdRecursos: 1,
    ordem: 20,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoEn: "Check for damage, security, and freedom of Operation.", descricaoPt: "Verificar quanto a danos, fixação e liberdade de operação." },
      { letra: "b", descricaoEn: "Visually inspect for interference or contact between the anti-flap cam and stop plate.", descricaoPt: "Inspecionar visualmente quanto à interferência ou contato entre o came anti-flap e a placa de parada." },
      { letra: "c", descricaoEn: "Visually inspect for contact between the droop stop cam and horn attachment bolts.", descricaoPt: "Inspecionar visualmente quanto ao contato entre o came do batente de droop e os parafusos de fixação do corno." },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_droop.id,
    codigo: "130-PMS",
    nomeEn: "Inspect Gust Lock",
    nomePt: "Inspecionar Trava de Rajada (Gust Lock)",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 5),
    qtdRecursos: 1,
    ordem: 30,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoEn: "Engage gust lock.", descricaoPt: "Engatar a trava de rajada." },
      { letra: "b", descricaoEn: "Inspect gust lock for damage, wear, and security.", descricaoPt: "Inspecionar a trava de rajada quanto a danos, desgaste e fixação." },
      { letra: "c", descricaoEn: "Release gust lock.", descricaoPt: "Soltar a trava de rajada." },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_droop.id,
    codigo: "148-PMI",
    nomeEn: "Inspect Gust Lock Flange Teeth and Lever (960H)",
    nomePt: "Inspecionar Dentes do Flange da Trava de Rajada e Alavanca — 960H",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(0, 10),
    qtdRecursos: 1,
    ordem: 40,
    inspecaoTipos: PMI960,
    subitens: [
      { letra: "a", descricaoEn: "Inspect gust lock flange teeth and lever for condition. (ROT)", descricaoPt: "Inspecionar os dentes do flange da trava de rajada e a alavanca quanto à condição. (ROT)" },
    ],
  })

  // ── Bifilar ───────────────────────────────────────────────────────────────

  await criaCartao({
    subsistemaId: sub006_bifilar.id,
    codigo: "001-(30D)",
    nomeEn: "Lubricate Bifilar Absorber",
    nomePt: "Lubrificar Absorvedor Bifilar",
    tipo: TipoCartao.LUBRIFICATION,
    publicacao: "TM 1-1520-237-PMS",
    wp: "WP 0260 ROT",
    duracaoMin: hhmm(1),
    qtdRecursos: 1,
    omDesignator: "ALA 4",
    ordem: 10,
    inspecaoTipos: [InspecaoTipo.INSP_30D, InspecaoTipo.PMS_40, InspecaoTipo.PMS_120, InspecaoTipo.PMS_360, InspecaoTipo.PMI_480, InspecaoTipo.PMI_960],
    subitens: [
      { letra: "a", descricaoEn: "Clean old lubricant from bifilar with machinery wiping towel, (WP 3722, Item 459).", descricaoPt: "Limpar o lubrificante antigo do bifilar com toalha de limpeza de máquinas, (WP 3722, Item 459)." },
      { letra: "b", descricaoEn: "Apply general purpose grease (WP 3722, Item 194), to bifilar bushings, pins, and washers (Figure 1).", descricaoPt: "Aplicar graxa de uso geral (WP 3722, Item 194) nas buchas, pinos e arruelas do bifilar (Figura 1)." },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_bifilar.id,
    codigo: "122-PMS",
    nomeEn: "Inspect Bifilar Weights, Bushings, and Bonded Joints",
    nomePt: "Inspecionar Pesos, Buchas e Juntas Adesivas do Bifilar",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 45),
    qtdRecursos: 1,
    ordem: 20,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoEn: "Inspect bifilar for cracks, visible damage, wear, and security.", descricaoPt: "Inspecionar o bifilar quanto a trincas, danos visíveis, desgaste e fixação." },
      { letra: "b", descricaoEn: "Clean tapered bifilar washers, bushings, and pins.", descricaoPt: "Limpar as arruelas cônicas, buchas e pinos do bifilar." },
      { letra: "c", descricaoEn: "Visually inspect tapered bifilar washers for wear and damage.", descricaoPt: "Inspecionar visualmente as arruelas cônicas do bifilar quanto a desgaste e danos." },
      { letra: "d", descricaoEn: "Inspect weights for cracks between and adjacent to bushing bores on both upper and lower surfaces.", descricaoPt: "Inspecionar os pesos quanto a trincas entre e adjacentes aos furos das buchas nas superfícies superior e inferior." },
      { letra: "e", descricaoEn: "Inspect top and bottom bonded joints of weights for cracks.", descricaoPt: "Inspecionar as juntas adesivas superior e inferior dos pesos quanto a trincas." },
      { letra: "f", descricaoEn: "Lubricate washers, pins, and bushings.", descricaoPt: "Lubrificar as arruelas, pinos e buchas." },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_bifilar.id,
    codigo: "123-PMS",
    nomeEn: "Inspect Bifilar Weights for Nicks, Gouges, and Cracks in Areas A, B, C",
    nomePt: "Inspecionar Pesos do Bifilar quanto a Mossas, Ranhuras e Trincas nas Áreas A, B, C",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 30),
    qtdRecursos: 1,
    ordem: 30,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoEn: "Inspect weights for nicks, gouges, and cracks in Areas A, B, and C.", descricaoPt: "Inspecionar os pesos quanto a mossas, ranhuras e trincas nas Áreas A, B e C." },
      { letra: "b", descricaoEn: "Inspect weights without \"UT\" marked in area of part number for cracks in paint in AREAS A, B, and C.", descricaoPt: "Inspecionar os pesos sem a marcação \"UT\" na área do número de peça quanto a trincas na pintura nas ÁREAS A, B e C." },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_bifilar.id,
    codigo: "163-PMI",
    nomeEn: "Inspect Bifilar Weights, Pins, Bushings, and Support Arm (480H/960H)",
    nomePt: "Inspecionar Pesos, Pinos, Buchas e Braço de Suporte do Bifilar — 480H/960H",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(5),
    qtdRecursos: 2,
    ordem: 40,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoEn: "Remove bifilar weights from support arm.", descricaoPt: "Remover os pesos do bifilar do braço de suporte." },
      { letra: "b", descricaoEn: "Remove lubricant from pins, bushings, and washers.", descricaoPt: "Remover o lubrificante dos pinos, buchas e arruelas." },
      { letra: "c", descricaoEn: "Inspect pins, bushings, and washers for wear, cracks, or other damage.", descricaoPt: "Inspecionar os pinos, buchas e arruelas quanto a desgaste, trincas ou outros danos." },
      { letra: "d", descricaoEn: "Inspect weights for cracks in lower and upper bonded joints. If cracked paint is found at bonded joints of weights without \"UT\" marked in area of part number, remove paint and inspect weight base metal for cracks. Cracked paint at bonded joints of weights with \"UT\" marked in area of part number is acceptable.", descricaoPt: "Inspecionar os pesos quanto a trincas nas juntas adesivas inferior e superior. Se pintura trincada for encontrada nas juntas adesivas de pesos sem a marcação \"UT\" na área do número de peça, remover a tinta e inspecionar o metal base do peso quanto a trincas. Pintura trincada nas juntas adesivas de pesos com a marcação \"UT\" na área do número de peça é aceitável." },
      { letra: "e", descricaoEn: "Inspect weights in areas away from bonded joints for cracks.", descricaoPt: "Inspecionar os pesos nas áreas afastadas das juntas adesivas quanto a trincas." },
      { letra: "f", descricaoEn: "Inspect support arm and bushings for cracks, corrosion, or other damage, particularly in weight attachment lug areas.", descricaoPt: "Inspecionar o braço de suporte e as buchas quanto a trincas, corrosão ou outros danos, particularmente nas áreas dos olhais de fixação dos pesos." },
      { letra: "g", descricaoEn: "Install weights on support arm.", descricaoPt: "Instalar os pesos no braço de suporte." },
      { letra: "h", descricaoEn: "Lubricate bifilar.", descricaoPt: "Lubrificar o bifilar." },
    ],
  })

  // ── Swashplate ────────────────────────────────────────────────────────────

  await criaCartao({
    subsistemaId: sub006_swash.id,
    codigo: "126-PMS",
    nomeEn: "Inspect Swashplate, Scissors Assemblies, and Uniball",
    nomePt: "Inspecionar Prato Oscilante, Conjuntos de Tesoura e Uniball",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 20),
    qtdRecursos: 1,
    ordem: 10,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoEn: "Inspect swashplate and scissors assemblies for cracks, dents, distortion, corrosion and security.", descricaoPt: "Inspecionar o prato oscilante e os conjuntos de tesoura quanto a trincas, amassados, distorção, corrosão e fixação." },
      { letra: "b", descricaoEn: "Inspect swashplate uniball for cleanness.", descricaoPt: "Inspecionar o uniball do prato oscilante quanto à limpeza." },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_swash.id,
    codigo: "127-PMS",
    nomeEn: "Inspect Swashplate Link Assemblies for Cracks",
    nomePt: "Inspecionar Conjuntos de Link do Prato Oscilante quanto a Trincas",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 10),
    qtdRecursos: 1,
    ordem: 20,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoEn: "Inspect swashplate link assemblies for cracks. (ROT)", descricaoPt: "Inspecionar os conjuntos de link do prato oscilante quanto a trincas. (ROT)" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_swash.id,
    codigo: "128-PMS",
    nomeEn: "Inspect Swashplate Scissors Bearing Play with Dial Indicator",
    nomePt: "Inspecionar Folga dos Rolamentos das Tesouras do Prato Oscilante com Indicador de Deflexão",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 50),
    qtdRecursos: 1,
    ordem: 30,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoEn: "Using a dial indicator inspect scissors attachment bearings on swashplate for radial and axial play.", descricaoPt: "Usando um indicador de deflexão, inspecionar os rolamentos de fixação das tesouras no prato oscilante quanto à folga radial e axial." },
      { letra: "b", descricaoEn: "Using a dial indicator inspect upper rotating scissors bearings for radial and axial play.", descricaoPt: "Usando um indicador de deflexão, inspecionar os rolamentos das tesouras rotativas superiores quanto à folga radial e axial." },
      { letra: "c", descricaoEn: "Using a dial indicator inspect lower rotating scissors bearings for radial and axial play.", descricaoPt: "Usando um indicador de deflexão, inspecionar os rolamentos das tesouras rotativas inferiores quanto à folga radial e axial." },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_swash.id,
    codigo: "162-PMI",
    nomeEn: "Inspect Swashplate Assembly — Bearings, Sensors, and Links (480H/960H)",
    nomePt: "Inspecionar Conjunto do Prato Oscilante — Rolamentos, Sensores e Links — 480H/960H",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(2),
    qtdRecursos: 2,
    ordem: 40,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoEn: "Inspect for cracks, nicks, and security.", descricaoPt: "Inspecionar quanto a trincas, mossas e fixação." },
      { letra: "b", descricaoEn: "Using a flashlight and mirror, visually inspect two sensors, main rotor index, brackets, clamps, and wiring on the underside of the non-rotating swashplate for condition and security. Check blade track bracket on the underside of the rotating swashplate for security and damage.", descricaoPt: "Usando lanterna e espelho, inspecionar visualmente dois sensores, o índice do rotor principal, suportes, abraçadeiras e fiação na parte inferior do prato oscilante não rotativo quanto à condição e fixação. Verificar o suporte de rastreamento de pás na parte inferior do prato oscilante rotativo quanto à fixação e danos." },
      { letra: "c", descricaoEn: "Inspect expandable pins for correct installation of lock rings and half male spacers. Inspect expandable pin nuts for fractures cracks.", descricaoPt: "Inspecionar os pinos expansíveis quanto à instalação correta dos anéis de trava e meio espaçadores macho. Inspecionar as porcas dos pinos expansíveis quanto a fraturas e trincas." },
      { letra: "d", descricaoEn: "Inspect ball bearings between stationary and rotating swashplates as follows: (1) Check for hesitation, ratcheting, or uneven movement. (2) Inspect for wear IAW TM 1-1520-237-23&P.", descricaoPt: "Inspecionar os rolamentos de esferas entre os pratos oscilantes estacionário e rotativo conforme a seguir: (1) Verificar hesitação, catraca ou movimento irregular. (2) Inspecionar quanto ao desgaste conforme TM 1-1520-237-23&P." },
      { letra: "e", descricaoEn: "Inspect large spherical bearing and socket for wear.", descricaoPt: "Inspecionar o rolamento esférico grande e o soquete quanto ao desgaste." },
      { letra: "f", descricaoEn: "Check clearance between swashplate guide and bearing inner race.", descricaoPt: "Verificar a folga entre o guia do prato oscilante e a pista interna do rolamento." },
      { letra: "g", descricaoEn: "Inspect scissors attachment spherical bearings for wear and discoloration.", descricaoPt: "Inspecionar os rolamentos esféricos de fixação das tesouras quanto ao desgaste e descoloração." },
      { letra: "h", descricaoEn: "Inspect forward, aft, and lateral connecting link assemblies for bearing play and looseness.", descricaoPt: "Inspecionar os conjuntos de link de conexão dianteiro, traseiro e lateral quanto à folga do rolamento e folga." },
      { letra: "i", descricaoEn: "Visually inspect swashplate retaining ring for cracks, loose or missing fasteners.", descricaoPt: "Inspecionar visualmente o anel de retenção do prato oscilante quanto a trincas, fixadores soltos ou ausentes." },
      { letra: "j", descricaoEn: "Retorque inner and outer swashplate duplex bearing retaining ring bolts.", descricaoPt: "Retorquear os parafusos dos anéis de retenção dos rolamentos duplex interno e externo do prato oscilante." },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_swash.id,
    codigo: "162A-PMI",
    nomeEn: "Replace Swashplate Upper Scissors Link Sleeve Bearings (480H/960H)",
    nomePt: "Substituir Rolamentos de Bucha do Link das Tesouras Superiores do Prato Oscilante — 480H/960H",
    tipo: TipoCartao.SERVICE,
    publicacao: "TM 1-1520-237-PMI",
    wp: "WP 0808 ROT",
    duracaoMin: hhmm(8),
    qtdRecursos: 2,
    ordem: 50,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoEn: "Remove upper and lower scissor link assemblies (WP 0787).", descricaoPt: "Remover os conjuntos de link das tesouras superior e inferior (WP 0787)." },
      { letra: "b", descricaoEn: "Remove inner sleeve bearings from upper scissors link.", descricaoPt: "Remover os rolamentos de bucha internos do link das tesouras superiores." },
      { letra: "c", descricaoEn: "Freeze replacement bearings in carbon dioxide (WP 3722, Item 81) or a freezer at least -65°F (-54°C), for a minimum of 30 minutes.", descricaoPt: "Congelar os rolamentos de reposição em dióxido de carbono (WP 3722, Item 81) ou em um freezer a pelo menos -65°F (-54°C), por no mínimo 30 minutos." },
      { letra: "d", descricaoEn: "Press sleeve bearings into bores using arbor press (Figure 1).", descricaoPt: "Pressionar os rolamentos de bucha nos furos usando uma prensa de mandril (Figura 1)." },
      { letra: "e", descricaoEn: "Seal exposed edges of outer bearing with sealing compound (WP 3722, Item 362).", descricaoPt: "Selar as bordas expostas do rolamento externo com composto selante (WP 3722, Item 362)." },
      { letra: "f", descricaoEn: "Install upper and lower scissor link assemblies (WP 0787).", descricaoPt: "Instalar os conjuntos de link das tesouras superior e inferior (WP 0787)." },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_swash.id,
    codigo: "162B-PMI",
    nomeEn: "Inspect Swashplate Inner Ring (480H/960H)",
    nomePt: "Inspecionar Anel Interno do Prato Oscilante — 480H/960H",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(3),
    qtdRecursos: 2,
    ordem: 55,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar anel interno do swashplate quanto a desgaste e danos", descricaoEn: "Inspect swashplate inner ring for wear and damage" },
      { letra: "b", descricaoPt: "Verificar estrias internas do anel", descricaoEn: "Check inner ring internal splines" },
      { letra: "c", descricaoPt: "Medir desgaste conforme limites especificados", descricaoEn: "Measure wear per specified limits" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_swash.id,
    codigo: "600",
    nomeEn: "Lubricate Swashplate Bearings (whichever comes first: 360H or 12M)",
    nomePt: "Lubrificar Rolamentos do Prato Oscilante (o que ocorrer primeiro: 360H ou 12M)",
    tipo: TipoCartao.LUBRIFICATION,
    publicacao: "TM 1-1520-237-PMS",
    wp: "WP 0261 ROT",
    duracaoMin: hhmm(1, 30),
    qtdRecursos: 2,
    omDesignator: "ALA 4",
    observacao: "Compartilhado entre PMS-360 e INSP-12M — o que ocorrer primeiro",
    ordem: 60,
    inspecaoTipos: [InspecaoTipo.PMS_360, InspecaoTipo.PMI_480, InspecaoTipo.PMI_960, InspecaoTipo.INSP_12M],
    subitens: [
      { letra: "a", descricaoEn: "Turn main rotor head until red index marks on rotating and stationary swashplates line up. Engage gust lock.", descricaoPt: "Girar a cabeça do rotor principal até que as marcas de índice vermelhas nos pratos oscilantes rotativo e estacionário se alinhem. Engatar a trava de rajada." },
      { letra: "b", descricaoEn: "Remove bolts and washers holding inner bearing retainer ring to swashplate (Figure 1).", descricaoPt: "Remover os parafusos e arruelas que fixam o anel retentor do rolamento interno ao prato oscilante (Figura 1)." },
      { letra: "c", descricaoEn: "Slide retainer ring to one side so upper bearing seal can be seen.", descricaoPt: "Deslizar o anel retentor para um lado para que a vedação do rolamento superior possa ser vista." },
      { letra: "d", descricaoEn: "Lubricate bearings through four fittings on rotating swashplate with hand-operated lubricating gun using aircraft grease (WP 3722, Item 188).", descricaoPt: "Lubrificar os rolamentos através dos quatro fittings no prato oscilante rotativo com pistola de lubrificação manual usando graxa aeronáutica (WP 3722, Item 188)." },
      { letra: "e", descricaoEn: "Stop lubricating when grease seeps out of either upper or lower bearing seal (normally within 10 inches of fitting).", descricaoPt: "Parar de lubrificar quando a graxa sair pela vedação do rolamento superior ou inferior (normalmente dentro de 10 polegadas do fitting)." },
      { letra: "f", descricaoEn: "Wipe off extra grease in seal area.", descricaoPt: "Limpar o excesso de graxa na área da vedação." },
      { letra: "g", descricaoEn: "Install retainer assembly by aligning red index marks and securing with bolts and washers. Make sure all 9 tabs of shield receive a bolt. TORQUE BOLTS TO 176 - 194 INCH-POUNDS.", descricaoPt: "Instalar o conjunto retentor alinhando as marcas de índice vermelhas e fixando com parafusos e arruelas. Certificar-se de que todas as 9 abas do escudo recebam um parafuso. TORQUEAR OS PARAFUSOS PARA 176 - 194 LIBRAS-POLEGADA." },
      { letra: "h", descricaoEn: "Release gust lock.", descricaoPt: "Soltar a trava de rajada." },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_swash.id,
    codigo: "614",
    nomeEn: "Torque Swashplate Duplex Bearing Retaining Ring Bolts (PMI)",
    nomePt: "Torquear Parafusos do Anel de Retenção dos Rolamentos Duplex do Prato Oscilante — PMI",
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    wp: "WP 0785 ROT",
    duracaoMin: hhmm(0, 30),
    qtdRecursos: 1,
    omDesignator: "ALA 4",
    ordem: 70,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoEn: "Engage gust lock.", descricaoPt: "Engatar a trava de rajada." },
      { letra: "b", descricaoEn: "TORQUE INNER AND OUTER DUPLEX BEARING RETAINING RING BOLTS TO 185 INCH-POUNDS.", descricaoPt: "TORQUEAR OS PARAFUSOS DO ANEL DE RETENÇÃO DOS ROLAMENTOS DUPLEX INTERNO E EXTERNO PARA 185 LIBRAS-POLEGADA." },
      { letra: "c", descricaoEn: "Release gust lock.", descricaoPt: "Soltar a trava de rajada." },
    ],
  })

  // ── Pitch Control ─────────────────────────────────────────────────────────

  await criaCartao({
    subsistemaId: sub006_pitch.id,
    codigo: "116-PMS",
    nomeEn: "Inspect Pitch Control Rods and Bearings",
    nomePt: "Inspecionar Varetas de Controle de Passo e Rolamentos",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(1),
    qtdRecursos: 1,
    ordem: 10,
    inspecaoTipos: PMS120,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar varetas de controle de passo quanto a danos e deformações", descricaoEn: "Inspect pitch control rods for damage and deformation" },
      { letra: "b", descricaoPt: "Verificar rolamentos nas extremidades das varetas", descricaoEn: "Check rod end bearings" },
      { letra: "c", descricaoPt: "Verificar ajuste e folga das varetas de passo", descricaoEn: "Check pitch rod adjustment and clearance" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_pitch.id,
    codigo: "609-PMS",
    nomeEn: "Inspect Pitch Control Sector and Bearings",
    nomePt: "Inspecionar Setor de Controle de Passo e Rolamentos",
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(1),
    qtdRecursos: 1,
    ordem: 20,
    inspecaoTipos: PMS120,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar setor de controle de passo quanto a desgaste", descricaoEn: "Inspect pitch control sector for wear" },
      { letra: "b", descricaoPt: "Verificar rolamentos do setor de passo", descricaoEn: "Check pitch sector bearings" },
      { letra: "c", descricaoPt: "Verificar curso e ajuste do sistema de passo", descricaoEn: "Check pitch system travel and adjustment" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_pitch.id,
    codigo: "150-PMI",
    nomeEn: "Inspect Pitch Control System (480H/960H)",
    nomePt: "Inspecionar Sistema de Controle de Passo — 480H/960H",
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(6),
    qtdRecursos: 2,
    ordem: 30,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar todos os componentes do sistema de controle de passo MR", descricaoEn: "Inspect all MR pitch control system components" },
      { letra: "b", descricaoPt: "Verificar folgas e ajustes de todos os links", descricaoEn: "Check clearances and adjustments of all links" },
      { letra: "c", descricaoPt: "Inspecionar todos os rolamentos do sistema de passo", descricaoEn: "Inspect all pitch system bearings" },
      { letra: "d", descricaoPt: "Lubrificar componentes conforme necessário", descricaoEn: "Lubricate components as required" },
      { letra: "e", descricaoPt: "Verificar curso e resposta do sistema de passo", descricaoEn: "Check pitch system travel and response" },
    ],
  })

  // ── MR Blades ─────────────────────────────────────────────────────────────

  await criaCartao({
    subsistemaId: sub006_mrblades.id,
    codigo: "124-PMS",
    nomeEn: "Inspect MR Blades for Damage and Erosion",
    nomePt: "Inspecionar Pás do Rotor Principal quanto a Danos e Erosão",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(1),
    qtdRecursos: 1,
    ordem: 10,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar pás MR quanto a danos, erosão e deformações na borda de ataque", descricaoEn: "Inspect MR blades for damage, erosion, and leading edge deformation" },
      { letra: "b", descricaoPt: "Inspecionar revestimento das pás MR quanto a delaminações e bolhas", descricaoEn: "Inspect MR blade skin for delaminations and blisters" },
      { letra: "c", descricaoPt: "Verificar indicadores de pressão das longarinas", descricaoEn: "Check spar pressure indicators" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_mrblades.id,
    codigo: "125-PMS",
    nomeEn: "Inspect MR Blade Root Fittings and Retention",
    nomePt: "Inspecionar Encaixes de Raiz e Retenção das Pás MR",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 45),
    qtdRecursos: 1,
    ordem: 20,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar encaixes de raiz das pás MR quanto a trincas e corrosão", descricaoEn: "Inspect MR blade root fittings for cracks and corrosion" },
      { letra: "b", descricaoPt: "Verificar parafusos de retenção das pás MR", descricaoEn: "Check MR blade retention bolts" },
      { letra: "c", descricaoPt: "Inspecionar cintas de retenção das pás", descricaoEn: "Inspect blade retention straps" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_mrblades.id,
    codigo: "139-(90D)",
    nomeEn: "Inspect MR Hub Components (90D)",
    nomePt: "Inspecionar Componentes do Hub do Rotor Principal — 90D",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(1),
    qtdRecursos: 1,
    ordem: 25,
    inspecaoTipos: [InspecaoTipo.INSP_90D],
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar hub do rotor principal quanto a trincas, corrosão e danos", descricaoEn: "Inspect MR hub for cracks, corrosion, and damage" },
      { letra: "b", descricaoPt: "Verificar parafusos de fixação das pás e estado dos contrapinos", descricaoEn: "Check blade attachment bolts and cotter pin condition" },
      { letra: "c", descricaoPt: "Inspecionar dobradiças e encaixes do hub", descricaoEn: "Inspect hub hinges and fittings" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_mrblades.id,
    codigo: "140-(90D)",
    nomeEn: "Inspect MR Blades (90D)",
    nomePt: "Inspecionar Pás do Rotor Principal — 90D",
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(2),
    qtdRecursos: 1,
    ordem: 30,
    inspecaoTipos: [InspecaoTipo.INSP_90D],
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar todas as pás MR quanto a trincas, corrosão e erosão detalhada", descricaoEn: "Inspect all MR blades for cracks, corrosion, and detailed erosion" },
      { letra: "b", descricaoPt: "Verificar pressão das longarinas com indicador", descricaoEn: "Check spar pressure with indicator" },
      { letra: "c", descricaoPt: "Inspecionar tabs de rastreamento das pás", descricaoEn: "Inspect blade tracking tabs" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_mrblades.id,
    codigo: "300-(6M)",
    nomeEn: "BIM Check — MR Blade Spar Pressure (6M)",
    nomePt: "Verificação BIM — Pressão da Longarina das Pás MR — 6M",
    tipo: TipoCartao.BIM_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 30),
    qtdRecursos: 1,
    ordem: 40,
    inspecaoTipos: [InspecaoTipo.INSP_6M],
    subitens: [
      { letra: "a", descricaoPt: "Verificar indicador de pressão BIM em cada pá MR", descricaoEn: "Check BIM pressure indicator on each MR blade" },
      { letra: "b", descricaoPt: "Registrar leitura de pressão de cada pá", descricaoEn: "Record pressure reading for each blade" },
      { letra: "c", descricaoPt: "Reportar qualquer indicação de pressão baixa ou fora de faixa", descricaoEn: "Report any low pressure or out-of-range indication" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_mrblades.id,
    codigo: "502-(24M)",
    nomeEn: "Tap Test MR Blade Spar (24M)",
    nomePt: "Teste de Batida (Tap Test) na Longarina das Pás MR — 24M",
    tipo: TipoCartao.TAP_TEST,
    publicacao: "H-60-20-ASAM-04",
    duracaoMin: hhmm(4),
    qtdRecursos: 2,
    observacao: "Referência: H-60-20-ASAM-04 (Rev 2020)",
    ordem: 50,
    inspecaoTipos: [InspecaoTipo.INSP_24M],
    subitens: [
      { letra: "a", descricaoPt: "Instalar pás MR conforme configuração de teste", descricaoEn: "Install MR blades per test configuration" },
      { letra: "b", descricaoPt: "Realizar tap test na longarina de cada pá conforme H-60-20-ASAM-04", descricaoEn: "Perform tap test on each blade spar per H-60-20-ASAM-04" },
      { letra: "c", descricaoPt: "Mapear e registrar qualquer área suspeita", descricaoEn: "Map and record any suspect area" },
      { letra: "d", descricaoPt: "Avaliar resultados e reportar", descricaoEn: "Evaluate results and report" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_mrblades.id,
    codigo: "164-PMI",
    nomeEn: "Full MR Blade Inspection (960H)",
    nomePt: "Inspeção Completa das Pás do Rotor Principal — 960H",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(12),
    qtdRecursos: 2,
    ordem: 60,
    inspecaoTipos: PMI960,
    subitens: [
      { letra: "a", descricaoPt: "Remover todas as pás MR e inspecionar completamente", descricaoEn: "Remove all MR blades and inspect thoroughly" },
      { letra: "b", descricaoPt: "Inspecionar tip caps, longarinas, revestimento e bordas", descricaoEn: "Inspect tip caps, spars, skin, and edges" },
      { letra: "c", descricaoPt: "Inspecionar proteções de borda de ataque", descricaoEn: "Inspect leading edge abrasion strips" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_mrblades.id,
    codigo: "165-PMI",
    nomeEn: "Install MR Blades (960H)",
    nomePt: "Instalar Pás do Rotor Principal — 960H",
    tipo: TipoCartao.SERVICE,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(1, 30),
    qtdRecursos: 3,
    ordem: 70,
    inspecaoTipos: PMI960,
    subitens: [
      { letra: "a", descricaoPt: "Preparar superfícies de contato do hub MR", descricaoEn: "Prepare MR hub contact surfaces" },
      { letra: "b", descricaoPt: "Instalar pás MR no hub e torquear parafusos de retenção conforme especificação", descricaoEn: "Install MR blades on hub and torque retention bolts per specification" },
      { letra: "c", descricaoPt: "Verificar instalação de todas as pás e contrapinos", descricaoEn: "Verify all blade installations and cotter pins" },
      { letra: "d", descricaoPt: "Verificar folga e movimento livre das pás instaladas", descricaoEn: "Check installed blade clearance and free movement" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_mrblades.id,
    codigo: "166-PMI",
    nomeEn: "Test MR Blade Pressure Indicators (960H)",
    nomePt: "Testar Indicadores de Pressão das Pás MR — 960H",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(2),
    qtdRecursos: 2,
    ordem: 80,
    inspecaoTipos: PMI960,
    subitens: [
      { letra: "a", descricaoPt: "Instalar ferramenta de teste de pressão em cada pá MR", descricaoEn: "Install pressure test tool on each MR blade" },
      { letra: "b", descricaoPt: "Pressurizar longarinas e verificar retenção de pressão", descricaoEn: "Pressurize spars and check pressure retention" },
      { letra: "c", descricaoPt: "Verificar indicadores de pressão BIM em funcionamento", descricaoEn: "Verify BIM pressure indicators operation" },
      { letra: "d", descricaoPt: "Registrar pressões e reportar qualquer pá com pressão baixa", descricaoEn: "Record pressures and report any blade with low pressure" },
      { letra: "e", descricaoPt: "Remover ferramentas de teste e reinstalar caps", descricaoEn: "Remove test tools and reinstall caps" },
    ],
  })

  // ── Oil Cooler / Radiador ─────────────────────────────────────────────────

  await criaCartao({
    subsistemaId: sub006_oilcooler.id,
    codigo: "131-PMS",
    nomeEn: "Inspect Oil Cooler for Leaks and Security",
    nomePt: "Inspecionar Resfriador de Óleo quanto a Vazamentos e Fixação",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 30),
    qtdRecursos: 1,
    ordem: 10,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar resfriador de óleo quanto a trincas, danos e corrosão", descricaoEn: "Inspect oil cooler for cracks, damage, and corrosion" },
      { letra: "b", descricaoPt: "Verificar conexões e mangueiras quanto a vazamentos", descricaoEn: "Check connections and hoses for leaks" },
      { letra: "c", descricaoPt: "Verificar fixação do resfriador de óleo", descricaoEn: "Check oil cooler security" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_oilcooler.id,
    codigo: "134-PMS",
    nomeEn: "Inspect Oil Cooler Fan and Blower",
    nomePt: "Inspecionar Ventilador e Soprador do Resfriador de Óleo",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 30),
    qtdRecursos: 1,
    ordem: 20,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar pás do ventilador do resfriador quanto a danos", descricaoEn: "Inspect cooler fan blades for damage" },
      { letra: "b", descricaoPt: "Verificar rolamentos do ventilador", descricaoEn: "Check fan bearings" },
      { letra: "c", descricaoPt: "Verificar fixação do conjunto do ventilador", descricaoEn: "Check fan assembly security" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_oilcooler.id,
    codigo: "136-PMS",
    nomeEn: "Service Oil Cooler",
    nomePt: "Abastecer/Manutenção do Resfriador de Óleo",
    tipo: TipoCartao.SERVICE,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 30),
    qtdRecursos: 1,
    ordem: 30,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoPt: "Verificar nível de fluido do sistema de resfriamento", descricaoEn: "Check cooling system fluid level" },
      { letra: "b", descricaoPt: "Completar fluido se necessário", descricaoEn: "Service fluid if required" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_oilcooler.id,
    codigo: "169-PMI",
    nomeEn: "Inspect Oil Cooler Assembly (480H/960H)",
    nomePt: "Inspecionar Conjunto do Resfriador de Óleo — 480H/960H",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(4),
    qtdRecursos: 2,
    ordem: 40,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoPt: "Remover resfriador de óleo para inspeção detalhada", descricaoEn: "Remove oil cooler for detailed inspection" },
      { letra: "b", descricaoPt: "Inspecionar núcleo do resfriador quanto a obstrução e danos", descricaoEn: "Inspect cooler core for obstruction and damage" },
      { letra: "c", descricaoPt: "Inspecionar conjunto do ventilador completamente", descricaoEn: "Thoroughly inspect fan assembly" },
      { letra: "d", descricaoPt: "Limpar e reinstalar resfriador de óleo", descricaoEn: "Clean and reinstall oil cooler" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_oilcooler.id,
    codigo: "171-PMI",
    nomeEn: "Inspect Viscous Damper (replace bearing at 960H per H-60-19-ASAM-06)",
    nomePt: "Inspecionar Amortecedor Viscoso (substituir rolamento em 960H conforme H-60-19-ASAM-06)",
    tipo: TipoCartao.SERVICE,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(4),
    qtdRecursos: 2,
    observacao: "Item 'm': substituir rolamento do amortecedor viscoso a cada 960H conforme H-60-19-ASAM-06",
    ordem: 50,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar amortecedor viscoso quanto a danos e vazamentos", descricaoEn: "Inspect viscous damper for damage and leaks" },
      { letra: "b", descricaoPt: "Verificar fixação e montagem do amortecedor", descricaoEn: "Check damper security and mounting" },
      { letra: "c", descricaoPt: "Verificar conexões de fluido do amortecedor", descricaoEn: "Check damper fluid connections" },
      { letra: "d", descricaoPt: "Inspecionar vedações do amortecedor viscoso", descricaoEn: "Inspect viscous damper seals" },
      { letra: "e", descricaoPt: "Verificar nível de fluido do amortecedor viscoso", descricaoEn: "Check viscous damper fluid level" },
      { letra: "f", descricaoPt: "Verificar funcionamento do amortecedor", descricaoEn: "Check damper operation" },
      { letra: "g", descricaoPt: "Inspecionar eixo e rolamentos do amortecedor", descricaoEn: "Inspect damper shaft and bearings" },
      { letra: "h", descricaoPt: "Verificar torques dos parafusos de fixação", descricaoEn: "Check mounting bolt torques" },
      { letra: "i", descricaoPt: "Inspecionar suportes de montagem do amortecedor", descricaoEn: "Inspect damper mounting brackets" },
      { letra: "j", descricaoPt: "Verificar alinhamento do conjunto", descricaoEn: "Check assembly alignment" },
      { letra: "k", descricaoPt: "Verificar condição geral do amortecedor viscoso", descricaoEn: "Check general condition of viscous damper" },
      { letra: "l", descricaoPt: "Documentar condição e registrar achados", descricaoEn: "Document condition and record findings" },
      { letra: "m", descricaoPt: "SUBSTITUIR rolamento do amortecedor viscoso — obrigatório a cada 960H conforme H-60-19-ASAM-06", descricaoEn: "REPLACE viscous damper bearing — mandatory every 960H per H-60-19-ASAM-06", referencia: "H-60-19-ASAM-06" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_oilcooler.id,
    codigo: "171A-PMI",
    nomeEn: "Inspect Oil Cooler Blower Duct (480H/960H)",
    nomePt: "Inspecionar Duto do Soprador do Resfriador de Óleo — 480H/960H",
    tipo: TipoCartao.SERVICE,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(2),
    qtdRecursos: 1,
    ordem: 60,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar duto do soprador quanto a trincas e danos", descricaoEn: "Inspect blower duct for cracks and damage" },
      { letra: "b", descricaoPt: "Verificar vedações e conexões do duto", descricaoEn: "Check duct seals and connections" },
      { letra: "c", descricaoPt: "Verificar fixação do duto ao resfriador", descricaoEn: "Check duct attachment to cooler" },
    ],
  })

  // ── Eixo Sec I ────────────────────────────────────────────────────────────

  await criaCartao({
    subsistemaId: sub006_sec1shaft.id,
    codigo: "141-(90D)",
    nomeEn: "Inspect Drive Shaft Sec I (90D)",
    nomePt: "Inspecionar Eixo de Transmissão Sec I — 90D",
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(1),
    qtdRecursos: 1,
    ordem: 10,
    inspecaoTipos: [InspecaoTipo.INSP_90D],
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar eixo Sec I quanto a corrosão e danos", descricaoEn: "Inspect Sec I shaft for corrosion and damage" },
      { letra: "b", descricaoPt: "Verificar acoplamentos e flanges do eixo Sec I", descricaoEn: "Check Sec I shaft couplings and flanges" },
      { letra: "c", descricaoPt: "Verificar mancal de suporte do eixo Sec I", descricaoEn: "Check Sec I shaft support bearing" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_sec1shaft.id,
    codigo: "167-PMI",
    nomeEn: "Inspect Drive Shaft Sec I (960H)",
    nomePt: "Inspecionar Eixo de Transmissão Sec I — 960H",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(6),
    qtdRecursos: 2,
    ordem: 20,
    inspecaoTipos: PMI960,
    subitens: [
      { letra: "a", descricaoPt: "Remover painéis de acesso e acessar eixo Sec I", descricaoEn: "Remove access panels and access Sec I shaft" },
      { letra: "b", descricaoPt: "Inspecionar completamente o eixo Sec I quanto a torção, corrosão e danos", descricaoEn: "Thoroughly inspect Sec I shaft for twisting, corrosion, and damage" },
      { letra: "c", descricaoPt: "Inspecionar acoplamentos e flanges do eixo Sec I", descricaoEn: "Inspect Sec I shaft couplings and flanges" },
      { letra: "d", descricaoPt: "Inspecionar mancal de suporte e lubrificar se necessário", descricaoEn: "Inspect support bearing and lubricate if required" },
      { letra: "e", descricaoPt: "Reinstalar painéis de acesso", descricaoEn: "Reinstall access panels" },
    ],
  })

  // ══════════════════════════════════════════════════════════════════════════
  // INSPEÇÕES ESPECIAIS
  // ══════════════════════════════════════════════════════════════════════════

  // ── EP1 — Inspeção Especial 1: Atmosfera Erosiva ─────────────────────────
  // Cartão 900 — SERVICING (ROT) — Sistema 006, Área Swashplate
  await criaCartao({
    subsistemaId: sub006_swash.id,
    codigo: "900-EP1",
    nomeEn: "Servicing (ROT) — Erosive Environment (WP 0331)",
    nomePt: "Servicing (ROT) — Ambiente Erosivo (WP 0331)",
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "EM 0013",
    wp: "WP 0331",
    duracaoMin: 120,
    qtdRecursos: 2,
    omDesignator: "ALA 4",
    observacao: "Itens com requisitos mínimos. A Inspetoria pode acrescentar tarefas via Special/Conditional Inspections do EM 0013.",
    ordem: 900,
    inspecaoTipos: [InspecaoTipo.EP1_ERO],
    subitens: [
      {
        letra: "A",
        descricaoEn: "Clean swashplate guide and spherical bearing (WP 0234).",
        descricaoPt: "Limpar o guia do swashplate e o rolamento esférico (WP 0234).",
        referencia: "WP 0234",
      },
      {
        letra: "B",
        descricaoEn: "Inspect swashplate guide and spherical bearing (WP 0755).",
        descricaoPt: "Inspecionar o guia do swashplate e o rolamento esférico (WP 0755).",
        referencia: "WP 0755",
      },
      {
        letra: "C",
        descricaoEn: "Clean main rotor blade pins (WP 0233).",
        descricaoPt: "Limpar os pinos das pás do rotor principal (WP 0233).",
        referencia: "WP 0233",
      },
    ],
  })

  // ── EP2 — Inspeção Especial 2: Pouso Duro ────────────────────────────────
  // Cartão 913 — Tail Cone Section — Sistema 004
  await criaCartao({
    subsistemaId: sub004_shafts.id,
    codigo: "913-EP2",
    nomeEn: "Hard Landing — Inspect Tail Cone Drive Shafts (SERVICE)",
    nomePt: "Pouso Duro — Inspecionar Eixos de Transmissão do Cone de Cauda",
    tipo: TipoCartao.SERVICE,
    publicacao: "EM 0013",
    duracaoMin: 1440,
    qtdRecursos: 3,
    omDesignator: "ALA 4",
    observacao: "Itens com requisitos mínimos. A Inspetoria pode acrescentar tarefas via Special/Conditional Inspections do EM 0013.",
    ordem: 913,
    inspecaoTipos: [InspecaoTipo.EP2_POU],
    subitens: [
      {
        letra: "A",
        descricaoEn: "Open tailcone drive shaft covers and inspect drive shaft for damage, cracks, and corrosion.",
        descricaoPt: "Abrir as tampas dos eixos de transmissão do cone de cauda e inspecionar o eixo de transmissão quanto a danos, trincas e corrosão.",
      },
    ],
  })

  // Cartão 915 — MR Hub & Spindle — Sistema 006
  await criaCartao({
    subsistemaId: sub006_hub.id,
    codigo: "915-EP2",
    nomeEn: "Hard Landing — Inspect MR Hub Arm and Droop Stop Ears",
    nomePt: "Pouso Duro — Inspecionar Braço do Hub do RM e Orelhas do Droop Stop",
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "EM 0013",
    duracaoMin: 60,
    qtdRecursos: 1,
    omDesignator: "ALA 4",
    observacao: "Itens com requisitos mínimos. A Inspetoria pode acrescentar tarefas via Special/Conditional Inspections do EM 0013.",
    ordem: 915,
    inspecaoTipos: [InspecaoTipo.EP2_POU],
    subitens: [
      {
        letra: "A",
        descricaoEn: "Inspect inside of hub arm for signs of contact with spindle retention nut. If evidence of contact is found, replace spindles. Tag removed spindle \"DAMAGE OCCURRED DUE TO EXCESSIVE BLADE FLAPPING\". Inspect if damage exceeds repair limits.",
        descricaoPt: "Inspecionar o interior do braço do hub quanto a sinais de contato com a porca de retenção do spindle. Se houver evidência de contato, substituir os spindles. Etiquetar o spindle removido: \"DANO OCORREU DEVIDO A FLAPPING EXCESSIVO DAS PÁS\". Inspecionar se os danos excedem os limites de reparo.",
      },
      {
        letra: "B",
        descricaoEn: "Inspect droop stop ears for cracks. If ear is cracked, replace elastomeric bearing assembly. Tag removed spindle \"DAMAGE OCCURRED DUE TO EXCESSIVE BLADE FLAPPING\".",
        descricaoPt: "Inspecionar as orelhas dos batentes de droop quanto a trincas. Se a orelha estiver trincada, substituir o conjunto de rolamento elastomérico. Etiquetar o spindle removido: \"DANO OCORREU DEVIDO A FLAPPING EXCESSIVO DAS PÁS\".",
      },
    ],
  })

  // Cartão 918 — MR Blades — Sistema 006
  await criaCartao({
    subsistemaId: sub006_mrblades.id,
    codigo: "918-EP2",
    nomeEn: "Hard Landing — Inspect MR Blades for Blade Strike",
    nomePt: "Pouso Duro — Inspecionar Pás do RM quanto a Contato",
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "EM 0013",
    duracaoMin: 60,
    qtdRecursos: 1,
    omDesignator: "ALA 4",
    observacao: "Itens com requisitos mínimos. A Inspetoria pode acrescentar tarefas via Special/Conditional Inspections do EM 0013.",
    ordem: 918,
    inspecaoTipos: [InspecaoTipo.EP2_POU],
    subitens: [
      {
        letra: "A",
        descricaoEn: "If main rotor blades contacted tailcone, pylon, or IR jammer with or without blade tip damage, inspect for signs of impact. Tag components \"OCCURRED DUE TO BLADE STRIKE\" and note what blade contacted.",
        descricaoPt: "Se as pás do rotor principal contataram o cone de cauda, pylon ou bloqueador IR com ou sem dano à ponta da pá, inspecionar quanto a sinais de impacto. Etiquetar os componentes \"OCORREU DEVIDO A CONTATO DAS PÁS\" e registrar o que a pá contatou.",
      },
      {
        letra: "B",
        descricaoEn: "Inspect damaged hub. Tag damaged hub \"DAMAGE OCCURRED DUE TO EXCESSIVE BLADE FLAPPING\".",
        descricaoPt: "Inspecionar o hub danificado. Etiquetar o hub danificado: \"DANO OCORREU DEVIDO A FLAPPING EXCESSIVO DAS PÁS\".",
      },
    ],
  })

  // Cartão 919 — Oil Cooler Drive Shaft — Sistema 006
  await criaCartao({
    subsistemaId: sub006_oilcooler.id,
    codigo: "919-EP2",
    nomeEn: "Hard Landing — Check Oil Cooler Drive Shaft Preloading",
    nomePt: "Pouso Duro — Verificar Pré-carga do Eixo de Transmissão do Resfriador de Óleo",
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "EM 0013",
    duracaoMin: 960,
    qtdRecursos: 2,
    omDesignator: "ALA 4",
    observacao: "Itens com requisitos mínimos. A Inspetoria pode acrescentar tarefas via Special/Conditional Inspections do EM 0013.",
    ordem: 919,
    inspecaoTipos: [InspecaoTipo.EP2_POU],
    subitens: [
      {
        letra: "A",
        descricaoEn: "Disconnect Section II tail rotor drive shaft near No 1 viscous damper.",
        descricaoPt: "Desconectar o eixo de transmissão Seção II do rotor de cauda próximo ao amortecedor viscoso No 1.",
      },
      {
        letra: "B",
        descricaoEn: "Remove bolts attaching rear oil cooler support.",
        descricaoPt: "Remover os parafusos de fixação do suporte traseiro do resfriador de óleo.",
      },
      {
        letra: "C",
        descricaoEn: "WARNING — CSI: Verification of preload is a critical characteristic. Using dial indicating scale, make sure that no more than 10 pounds of force is needed to align rear oil cooler support bolt holes with bolt holes in bearing flange.",
        descricaoPt: "ATENÇÃO — CSI: Verificação de pré-carga é característica crítica. Usando escala com indicador de mostrador, certificar que não mais de 10 libras de força são necessárias para alinhar os furos do suporte traseiro do resfriador de óleo com os furos na flange do rolamento.",
      },
      {
        letra: "D",
        descricaoEn: "IF PRELOAD IS MORE THAN 10 POUNDS, REPLACE OIL COOLER.",
        descricaoPt: "SE A PRÉ-CARGA FOR MAIOR QUE 10 LIBRAS, SUBSTITUIR O RESFRIADOR DE ÓLEO.",
      },
      {
        letra: "E",
        descricaoEn: "WARNING — CSI: Verification of torque is a critical characteristic. If preload is 10 pounds or less, install oil cooler rear support to bearing support with bolts, washers, shims and nuts. TORQUE NUTS TO 115–125 INCH-POUNDS. Follow shimming procedures in WP 0907.",
        descricaoPt: "ATENÇÃO — CSI: Verificação de torque é característica crítica. Se a pré-carga for 10 libras ou menos, instalar o suporte traseiro do resfriador de óleo no suporte do rolamento com parafusos, arruelas, calços e porcas. TORQUEAR AS PORCAS PARA 115–125 INCH-POUNDS. Seguir os procedimentos de calçagem no WP 0907.",
        referencia: "WP 0907",
      },
    ],
  })

  // ── EP3 — Inspeção Especial 3: Parada Brusca ─────────────────────────────
  // Cartão 920 — Main Rotor Blades Sudden Stoppage — Sistema 006
  await criaCartao({
    subsistemaId: sub006_mrblades.id,
    codigo: "920-EP3",
    nomeEn: "Sudden Stoppage — Main Rotor Blades (SDI)",
    nomePt: "Parada Brusca — Pás do Rotor Principal (SDI)",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "EM 0013",
    duracaoMin: 1440,
    qtdRecursos: 3,
    omDesignator: "ALA 4",
    observacao: "Itens com requisitos mínimos. A Inspetoria pode acrescentar tarefas via Special/Conditional Inspections do EM 0013.",
    ordem: 920,
    inspecaoTipos: [InspecaoTipo.EP3_PAR],
    subitens: [
      {
        letra: "A",
        descricaoEn: "If damage to blades is less than the accept/reject criteria, repair blades.",
        descricaoPt: "Se o dano às pás for menor que o critério de aceitação/rejeição, reparar as pás.",
      },
      {
        letra: "B",
        descricaoEn: "Inspect droop stop ears for cracks. If ear is cracked, replace spindle. Tag removed spindle \"DAMAGE OCCURRED DUE TO EXCESSIVE BLADE FLAPPING\".",
        descricaoPt: "Inspecionar as orelhas dos batentes de droop quanto a trincas. Se a orelha estiver trincada, substituir o spindle. Etiquetar o spindle removido: \"DANO OCORREU DEVIDO A FLAPPING EXCESSIVO DAS PÁS\".",
      },
      {
        letra: "C",
        descricaoEn: "If damage to blades includes severing blades inboard of tip cap, remove transmission and rotor head assembly and send to overhaul facility. Clearly tag all components \"BLADE DAMAGE OCCURRED WHILE ROTOR HEAD IN MOTION\". Also explain what the blades hit, if known, and how badly helicopter parts were damaged.",
        descricaoPt: "Se o dano às pás incluir rompimento das pás na parte interna da tampa da ponta, remover a transmissão e o conjunto do cabeça do rotor e enviar para revisão. Etiquetar claramente todos os componentes: \"DANO ÀS PÁS OCORREU ENQUANTO O CABEÇA DO ROTOR ESTAVA EM MOVIMENTO\". Registrar o que as pás atingiram, se souber, e a extensão dos danos.",
      },
      {
        letra: "D",
        descricaoEn: "If damage to blades is greater than main rotor blade accept/reject criteria — remove blades and spindles and send to overhaul facility. Tag all components \"BLADE DAMAGE OCCURRED WHILE ROTOR HEAD IN MOTION\". Inspect blade attachment lugs and damper lugs on spindle for damage (crazing of paint on lugs is evidence of damage).",
        descricaoPt: "Se o dano às pás for maior que o critério de aceitação/rejeição do rotor principal — remover as pás e spindles e enviar para revisão. Etiquetar todos os componentes: \"DANO ÀS PÁS OCORREU ENQUANTO O CABEÇA DO ROTOR ESTAVA EM MOVIMENTO\". Inspecionar as orelhas de fixação das pás e as orelhas do amortecedor no spindle quanto a danos (craquelamento da tinta nas orelhas é evidência de dano).",
      },
      {
        letra: "E",
        descricaoEn: "Replace hub if damage found. Clearly tag hub \"DAMAGE OCCURRED DUE TO EXCESSIVE BLADE FLAPPING\". Inspect dampers, control horns, pitch control rods, rotating swashplate and swashplate scissors for damage.",
        descricaoPt: "Substituir o hub se dano for encontrado. Etiquetar claramente o hub: \"DANO OCORREU DEVIDO A FLAPPING EXCESSIVO DAS PÁS\". Inspecionar amortecedores, cornos de controle, hastes de controle de passo, swashplate giratório e tesouras do swashplate quanto a danos.",
      },
      {
        letra: "F",
        descricaoEn: "Inspect airframe attachment points for deformation and damage.",
        descricaoPt: "Inspecionar os pontos de fixação da estrutura quanto a deformação e danos.",
      },
      {
        letra: "G",
        descricaoEn: "Visually inspect input drive shafts, tail drive shafts, oil cooler shaft area, all associated flexible couplings, bearings, and supports for cracks and distortion.",
        descricaoPt: "Inspecionar visualmente os eixos de transmissão de entrada, eixos de transmissão de cauda, área do eixo do resfriador de óleo, todos os acoplamentos flexíveis associados, rolamentos e suportes quanto a trincas e distorção.",
      },
      {
        letra: "H",
        descricaoEn: "If damage to blades is greater than main rotor accept/reject trim tab, abrasion strip, and balance block and does not include damage to primary structural components, remove blades and send to approved overhaul facility.",
        descricaoPt: "Se o dano às pás for maior que o critério de aceitação/rejeição do aba de trim, tira abrasiva e bloco de equilíbrio e não incluir dano aos componentes estruturais primários, remover as pás e enviar para revisão.",
      },
      {
        letra: "I",
        descricaoEn: "If damage to tip cap is greater than tip cap accept/reject criteria (tip block, Rosan inserts, tip weights, weight studs, tip rib), evaluate based on repairability of these components.",
        descricaoPt: "Se o dano à tampa da ponta for maior que o critério de aceitação/rejeição da tampa da ponta (bloco da ponta, insertos Rosan, pesos da ponta, pinos de peso, nervura da ponta), avaliar com base na capacidade de reparo desses componentes.",
      },
    ],
  })

  // Cartão 922 — Tail Rotor Blades Sudden Stoppage — Sistema 005
  await criaCartao({
    subsistemaId: sub005_trblades.id,
    codigo: "922-EP3",
    nomeEn: "Sudden Stoppage — Tail Rotor Blades (SDI)",
    nomePt: "Parada Brusca — Pás do Rotor de Cauda (SDI)",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "EM 0013",
    duracaoMin: 960,
    qtdRecursos: 2,
    omDesignator: "ALA 4",
    observacao: "Itens com requisitos mínimos. A Inspetoria pode acrescentar tarefas via Special/Conditional Inspections do EM 0013.",
    ordem: 922,
    inspecaoTipos: [InspecaoTipo.EP3_PAR],
    subitens: [
      {
        letra: "A",
        descricaoEn: "If damage to blades is less than tail rotor blade accept/reject criteria — inspect all four tail gear box mounting lugs. Visually inspect intermediate gear box mounting, all drive shaftings, flexible couplings, drive shaft bearings, oil cooler axial fan, and drive shaft supports for cracks and distortion. Perform oil cooler spline wear inspection.",
        descricaoPt: "Se o dano às pás for menor que o critério de aceitação/rejeição das pás do rotor de cauda — inspecionar as quatro orelhas de montagem da caixa de engrenagens de cauda. Inspecionar visualmente a montagem da caixa de engrenagens intermediária, todos os eixos de transmissão, acoplamentos flexíveis, rolamentos dos eixos, ventilador axial do resfriador de óleo e suportes dos eixos quanto a trincas e distorção. Realizar inspeção de desgaste do spline do resfriador de óleo.",
      },
      {
        letra: "B",
        descricaoEn: "If damage to blades is greater than tail rotor blade accept/reject criteria (dents or gouges in leading edge over 1/4-inch deep, or damage to attachment block) — remove pitch beam, pitch change links, blades, retention plates, tail gear box, intermediate gear box, oil cooler axial fan, and all tail drive shaft assemblies. Send to overhaul with tag \"DAMAGE OCCURRED WHILE TAIL ROTOR IN MOTION\".",
        descricaoPt: "Se o dano às pás for maior que o critério de aceitação/rejeição das pás do rotor de cauda (amassados ou sulcos na borda de ataque com mais de 1/4 de polegada de profundidade, ou dano no bloco de fixação) — remover o pitch beam, links de mudança de passo, pás, placas de retenção, caixa de engrenagens de cauda, caixa de engrenagens intermediária, ventilador axial do resfriador de óleo e todos os conjuntos de eixo de transmissão de cauda. Enviar para revisão com etiqueta \"DANO OCORREU ENQUANTO O ROTOR DE CAUDA ESTAVA EM MOVIMENTO\".",
      },
      {
        letra: "C",
        descricaoEn: "Visually inspect tail pylon for possible structural damage such as loose rivets, cracks, etc. Inspect gear box attachment points for deformation and other signs of damage.",
        descricaoPt: "Inspecionar visualmente o pylon de cauda quanto a possíveis danos estruturais como rebites soltos, trincas, etc. Inspecionar os pontos de fixação da caixa de engrenagens quanto a deformação e outros sinais de dano.",
      },
      {
        letra: "D",
        descricaoEn: "If damage to blades is greater than tail rotor blade accept/reject criteria in Region A, B, or C — inspect all four tail gear box mounting lugs, intermediate gear box mounting, drive shafting, flexible couplings and supports. Perform oil cooler spline wear inspection. Remove blades and send to overhaul facility with tag \"DAMAGE OCCURRED WHILE TAIL ROTOR IN MOTION\".",
        descricaoPt: "Se o dano às pás for maior que o critério de aceitação/rejeição nas Regiões A, B ou C — inspecionar as quatro orelhas de montagem da caixa de engrenagens de cauda, montagem da caixa intermediária, eixos de transmissão, acoplamentos flexíveis e suportes. Realizar inspeção de desgaste do spline do resfriador de óleo. Remover as pás e enviar para revisão com etiqueta \"DANO OCORREU ENQUANTO O ROTOR DE CAUDA ESTAVA EM MOVIMENTO\".",
      },
    ],
  })

  // ── EP5 — Inspeção PRP Atmosfera Erosiva ──────────────────────────────────
  // Cartão 960 — Tail Rotor Pylon — Sistema 005
  await criaCartao({
    subsistemaId: sub005_pylon.id,
    codigo: "960-EP5",
    nomeEn: "PRP Erosive Environment — De-Ice Tail Rotor (Lubrification)",
    nomePt: "PRP Atmosfera Erosiva — De-Ice do Rotor de Cauda (Lubrificação)",
    tipo: TipoCartao.LUBRIFICATION,
    publicacao: "EM 0013",
    duracaoMin: 30,
    qtdRecursos: 1,
    omDesignator: "PAMASP",
    ordem: 960,
    inspecaoTipos: [InspecaoTipo.EP5_PRP],
    subitens: [
      {
        letra: "A",
        descricaoEn: "Apply protective paint on the outer surface of screws and fixed nut of the tail rotor de-ice.",
        descricaoPt: "Aplicar pintura protetora na superfície externa dos screws e porca fixa do de-ice do rotor de cauda.",
      },
    ],
  })

  // Cartão 961 — Bifilar — Sistema 006
  await criaCartao({
    subsistemaId: sub006_bifilar.id,
    codigo: "961-EP5",
    nomeEn: "PRP Erosive Environment — Clean and Lubricate Bifilar",
    nomePt: "PRP Atmosfera Erosiva — Limpar e Lubrificar o Bifilar",
    tipo: TipoCartao.LUBRIFICATION,
    publicacao: "EM 0013",
    duracaoMin: 20,
    qtdRecursos: 1,
    omDesignator: "PAMASP",
    ordem: 961,
    inspecaoTipos: [InspecaoTipo.EP5_PRP],
    subitens: [
      {
        letra: "A",
        descricaoEn: "Clean and lubricate the bifilar (vibration absorber).",
        descricaoPt: "Limpe e lubrifique o bifilar (absorvedor de vibração).",
      },
    ],
  })

  // Cartão 962 — Pitch Control — Sistema 006
  await criaCartao({
    subsistemaId: sub006_pitch.id,
    codigo: "962-EP5",
    nomeEn: "PRP Erosive Environment — Lubricate Pitch Beam Retaining Nut",
    nomePt: "PRP Atmosfera Erosiva — Lubrificar Porca de Retenção do Pitch Beam",
    tipo: TipoCartao.LUBRIFICATION,
    publicacao: "EM 0013",
    duracaoMin: 20,
    qtdRecursos: 1,
    omDesignator: "PAMASP",
    observacao: "NÃO MISTURE OS COMPOSTOS — USE O QUE JÁ ESTAVA NAS PEÇAS.",
    ordem: 962,
    inspecaoTipos: [InspecaoTipo.EP5_PRP],
    subitens: [
      {
        letra: "A",
        descricaoEn: "Lubricate the outer surface of the pitch beam retaining nut and washer. NOTE: DO NOT MIX COMPOUNDS — USE WHATEVER WAS ALREADY ON THE PARTS.",
        descricaoPt: "Lubrificar a superfície externa da porca de retenção do pitch beam e da arruela. NOTA: NÃO MISTURE OS COMPOSTOS — USE O QUE JÁ ESTAVA NAS PEÇAS.",
      },
    ],
  })

  // Cartão 963 — Pitch Control — Sistema 006
  await criaCartao({
    subsistemaId: sub006_pitch.id,
    codigo: "963-EP5",
    nomeEn: "PRP Erosive Environment — Lubricate Outboard Retention Plate Bolts",
    nomePt: "PRP Atmosfera Erosiva — Lubrificar Parafusos da Placa de Retenção Externo",
    tipo: TipoCartao.LUBRIFICATION,
    publicacao: "EM 0013",
    duracaoMin: 20,
    qtdRecursos: 1,
    omDesignator: "PAMASP",
    ordem: 963,
    inspecaoTipos: [InspecaoTipo.EP5_PRP],
    subitens: [
      {
        letra: "A",
        descricaoEn: "Lubricate the outer surface of the bolts and nuts of the outboard retention plate.",
        descricaoPt: "Lubrificar a superfície externa dos bolts e nuts da placa de retenção externa (outboard retention plate).",
      },
    ],
  })

  // Cartão 964 — Tail Cone Drive Shafts — Sistema 004
  await criaCartao({
    subsistemaId: sub004_shafts.id,
    codigo: "964-EP5",
    nomeEn: "PRP Erosive Environment — Lubricate Tail Rotor Drive Shaft Couplings",
    nomePt: "PRP Atmosfera Erosiva — Lubrificar Acoplamentos dos Eixos do Rotor de Cauda",
    tipo: TipoCartao.LUBRIFICATION,
    publicacao: "EM 0013",
    duracaoMin: 30,
    qtdRecursos: 1,
    omDesignator: "PAMASP",
    ordem: 964,
    inspecaoTipos: [InspecaoTipo.EP5_PRP],
    subitens: [
      {
        letra: "A",
        descricaoEn: "Lubricate the couplings and screws of the tail rotor drive shafts.",
        descricaoPt: "Lubrificar os couplings e os parafusos dos eixos de acionamento do rotor de cauda.",
      },
    ],
  })

  // ── Ferramentas ─────────────────────────────────────────────────────────────
  await seedFerramentas()

  console.log("✅ Seed concluído com sucesso!")
}

// ─── Ferramentas por cartão ────────────────────────────────────────────────────

type Ferr = { nome: string; especificacao?: string }

// Conjuntos reutilizáveis
const F_LANTERNA: Ferr = { nome: "Lanterna LED de inspeção", especificacao: "feixe ajustável" }
const F_ESPELHO: Ferr = { nome: "Espelho telescópico de inspeção" }
const F_LUVA: Ferr = { nome: "Luvas nitrílicas descartáveis" }
const F_PANO: Ferr = { nome: "Pano de limpeza (flanela)" }
const F_PAQUIMETRO: Ferr = { nome: "Paquímetro digital", especificacao: "0–150 mm" }
const F_CALIBRADOR: Ferr = { nome: "Calibrador de folga (feeler gauge)", especificacao: "0,05–1,0 mm" }
const F_TORQ_100: Ferr = { nome: "Torquímetro de estalo", especificacao: "5–100 Nm, 3/8\" drive" }
const F_TORQ_300: Ferr = { nome: "Torquímetro de estalo", especificacao: "40–300 Nm, 1/2\" drive" }
const F_SOQUETES: Ferr = { nome: "Jogo de soquetes", especificacao: "1/2\" drive, 8–32 mm" }
const F_CHAVE_BOCA: Ferr = { nome: "Jogo de chaves de boca", especificacao: "8–32 mm" }
const F_ALLEN: Ferr = { nome: "Jogo de chaves Allen (hex)", especificacao: "2–12 mm" }
const F_RECIPIENTE: Ferr = { nome: "Recipiente graduado para óleo", especificacao: "500 ml" }
const F_FUNIL: Ferr = { nome: "Funil com filtro" }
const F_OIL_DRY: Ferr = { nome: "Pano absorvente (oil dry)" }
const F_PISTOLA_GRAXA: Ferr = { nome: "Pistola de graxa manual", especificacao: "400 g" }
const F_GRAXA_23827: Ferr = { nome: "Graxa aérea", especificacao: "MIL-PRF-23827 ou equiv." }
const F_DIAL: Ferr = { nome: "Indicador de deflexão (dial indicator)", especificacao: "0,001\" resolução" }
const F_SUPORTE_DIAL: Ferr = { nome: "Suporte magnético para dial indicator" }
const F_KIT_AMOSTRA: Ferr = { nome: "Kit de coleta de amostra de óleo", especificacao: "seringa 60 ml + frascos" }
const F_CHIP_WRENCH: Ferr = { nome: "Chave para chip detector", especificacao: "boca 1\" (25,4 mm)" }
const F_FILTER_WRENCH: Ferr = { nome: "Chave para filtro de óleo" }
const F_MOEDA: Ferr = { nome: "Moeda de inspeção de compósito (BIM)" }
const F_MARTELO: Ferr = { nome: "Martelo de inspeção / percussão", especificacao: "pequeno, sem marca" }
const F_REGUA: Ferr = { nome: "Régua de aço", especificacao: "300 mm" }
const F_FITA: Ferr = { nome: "Fita métrica", especificacao: "5 m" }
const F_PAINEIS: Ferr = { nome: "Ferramental de painéis de acesso", especificacao: "chave Dzus / Camloc" }

// Conjuntos compostos
const BASIC_INSP: Ferr[] = [F_LANTERNA, F_ESPELHO, F_LUVA]
const OIL_SERVICE: Ferr[] = [F_RECIPIENTE, F_FUNIL, F_OIL_DRY, F_LUVA, F_PANO]
const GREASE_SET: Ferr[] = [F_PISTOLA_GRAXA, F_GRAXA_23827, F_PANO, F_LUVA]
const TORQUE_SET: Ferr[] = [F_TORQ_100, F_SOQUETES, F_CHAVE_BOCA]
const DIAL_SET: Ferr[] = [F_DIAL, F_SUPORTE_DIAL, F_CALIBRADOR]

// Ferramentas específicas por código de cartão
const FERR_POR_CODIGO: Record<string, Ferr[]> = {
  // ── 004 · Eixos de Transmissão ──────────────────────────────────────────────
  "124-(90D)": [
    F_LANTERNA, F_ESPELHO, F_PAQUIMETRO, F_CALIBRADOR,
    F_LUVA, F_TORQ_100, F_SOQUETES,
  ],
  "089-PMI": [
    F_PAINEIS, F_LANTERNA, F_ESPELHO,
    ...DIAL_SET, F_PAQUIMETRO, F_CALIBRADOR,
    F_TORQ_300, F_SOQUETES, F_CHAVE_BOCA, F_LUVA,
  ],

  // ── 005 · IGB ───────────────────────────────────────────────────────────────
  "086-PMS": [
    ...OIL_SERVICE,
    { nome: "Óleo sintético para engrenagens", especificacao: "MIL-PRF-23699 ou OX-26" },
  ],
  "087-PMS": [
    F_CHIP_WRENCH, F_LANTERNA, F_LUVA, F_PANO,
    { nome: "Chip detector (sobressalente)", especificacao: "conforme NSN do cartão" },
  ],
  "091-PMS": [
    ...OIL_SERVICE, F_KIT_AMOSTRA,
    { nome: "Óleo sintético para engrenagens", especificacao: "MIL-PRF-23699 ou OX-26" },
    F_CHIP_WRENCH, F_FILTER_WRENCH,
  ],
  "090-PMI": [
    F_PAINEIS, F_LANTERNA, F_ESPELHO,
    ...DIAL_SET, F_PAQUIMETRO, F_CALIBRADOR,
    F_TORQ_100, F_SOQUETES, F_LUVA,
  ],

  // ── 005 · Pylon / TGB ───────────────────────────────────────────────────────
  "092-PMS": [
    ...OIL_SERVICE,
    { nome: "Óleo sintético para engrenagens", especificacao: "MIL-PRF-23699 ou OX-26" },
  ],
  "093-PMS": [
    F_CHIP_WRENCH, F_LANTERNA, F_LUVA, F_PANO,
    { nome: "Chip detector (sobressalente)", especificacao: "conforme NSN" },
  ],
  "095-PMS": [
    ...OIL_SERVICE, F_KIT_AMOSTRA,
    { nome: "Óleo sintético para engrenagens", especificacao: "MIL-PRF-23699 ou OX-26" },
    F_CHIP_WRENCH, F_FILTER_WRENCH,
  ],
  "094-PMI": [
    F_PAINEIS, F_LANTERNA, F_ESPELHO,
    ...DIAL_SET, F_PAQUIMETRO, F_TORQ_100, F_SOQUETES, F_LUVA,
  ],

  // ── 005 · Pás do Rotor de Cauda ─────────────────────────────────────────────
  "096-PMS": [
    F_LANTERNA, F_ESPELHO, F_REGUA,
    { nome: "Gabarito de inspeção de pás de cauda", especificacao: "específico H-60" },
    F_LUVA,
  ],
  "097-PMS": [
    F_MOEDA, F_MARTELO, F_LANTERNA, F_LUVA,
    { nome: "Gabarito de inspeção de compósito", especificacao: "específico H-60" },
  ],
  "098-PMI": [
    F_LANTERNA, F_ESPELHO, F_PAQUIMETRO, F_REGUA,
    { nome: "Gabarito de passo de pá de cauda", especificacao: "específico H-60" },
    { nome: "Kit de balanceamento dinâmico de TR" },
    F_LUVA, F_ALLEN,
  ],

  // ── 006 · Módulo Acessório ───────────────────────────────────────────────────
  "099-PMS": [
    ...OIL_SERVICE,
    { nome: "Óleo sintético para caixa de transmissão", especificacao: "MIL-PRF-23699" },
  ],
  "100-PMS": [
    F_CHIP_WRENCH, F_LANTERNA, F_LUVA, F_PANO,
  ],
  "101-PMI": [
    F_PAINEIS, F_LANTERNA, F_ESPELHO,
    F_FILTER_WRENCH, F_KIT_AMOSTRA,
    ...DIAL_SET, F_TORQ_100, F_SOQUETES, F_LUVA,
  ],

  // ── 006 · Transmissão Principal ─────────────────────────────────────────────
  "102-PMS": [
    ...OIL_SERVICE,
    { nome: "Óleo sintético para MGB", especificacao: "MIL-PRF-23699 — verificar nível QUENTE" },
    F_LUVA,
  ],
  "103-PMS": [
    F_CHIP_WRENCH, F_LANTERNA, F_LUVA, F_PANO,
    { nome: "Chip detector sobressalente (MGB)", especificacao: "conforme NSN" },
  ],
  "104-PMS": [
    F_KIT_AMOSTRA, F_LUVA, F_PANO,
    { nome: "Etiqueta de identificação de amostra" },
  ],
  "105-PMI": [
    F_PAINEIS, F_LANTERNA, F_ESPELHO,
    F_FILTER_WRENCH, F_KIT_AMOSTRA,
    ...DIAL_SET, F_PAQUIMETRO, F_TORQ_300, F_SOQUETES, F_LUVA,
  ],

  // ── 006 · Hub e Spindle ─────────────────────────────────────────────────────
  "106-PMS": [
    F_LANTERNA, F_ESPELHO, F_PAQUIMETRO, F_CALIBRADOR,
    F_TORQ_300, F_SOQUETES, F_LUVA,
  ],
  "107-PMS": [
    ...GREASE_SET, F_LANTERNA, F_ALLEN,
    { nome: "Graxa para rolamentos de hub", especificacao: "MIL-PRF-81322 ou equiv." },
  ],
  "108-PMI": [
    F_PAINEIS, F_LANTERNA, F_ESPELHO,
    ...DIAL_SET, F_PAQUIMETRO, F_CALIBRADOR,
    F_TORQ_300, F_SOQUETES, F_ALLEN, F_LUVA,
  ],

  // ── 006 · Droop Stops e Anti-Flap ───────────────────────────────────────────
  "109-PMS": [
    F_LANTERNA, F_ESPELHO, F_PAQUIMETRO, F_CALIBRADOR,
    F_TORQ_100, F_SOQUETES, F_LUVA,
  ],
  "110-PMI": [
    F_LANTERNA, F_ESPELHO, F_PAQUIMETRO, F_CALIBRADOR,
    ...DIAL_SET, F_TORQ_100, F_SOQUETES, F_LUVA,
  ],

  // ── 006 · Bifilar ───────────────────────────────────────────────────────────
  "111-PMS": [
    F_LANTERNA, F_ESPELHO, F_PAQUIMETRO, F_CALIBRADOR,
    F_TORQ_100, F_SOQUETES, F_LUVA,
  ],
  "112-PMI": [
    F_PAINEIS, F_LANTERNA, F_ESPELHO,
    F_PAQUIMETRO, F_CALIBRADOR, ...DIAL_SET,
    { nome: "Kit de balanceamento dinâmico de MR / bifilar" },
    F_TORQ_100, F_SOQUETES, F_LUVA,
  ],

  // ── 006 · Swashplate ────────────────────────────────────────────────────────
  "113-PMS": [
    F_LANTERNA, F_ESPELHO, F_PAQUIMETRO, F_CALIBRADOR,
    F_TORQ_100, F_SOQUETES, F_LUVA,
  ],
  "114-PMS": [
    ...GREASE_SET,
    { nome: "Graxa para mancais de swashplate", especificacao: "MIL-PRF-81322" },
    F_ALLEN,
  ],
  "115-PMI": [
    F_PAINEIS, F_LANTERNA, F_ESPELHO,
    ...DIAL_SET, F_PAQUIMETRO, F_CALIBRADOR,
    F_TORQ_100, F_SOQUETES, F_ALLEN, F_LUVA,
  ],

  // ── 006 · Controle de Passo ─────────────────────────────────────────────────
  "116-PMS": [
    F_LANTERNA, F_ESPELHO, F_PAQUIMETRO, F_CALIBRADOR,
    F_TORQ_100, F_SOQUETES, F_ALLEN, F_LUVA,
  ],
  "117-PMI": [
    F_PAINEIS, F_LANTERNA, F_ESPELHO,
    ...DIAL_SET, F_PAQUIMETRO, F_CALIBRADOR,
    { nome: "Equipamento de regulagem de passo (rigging set)", especificacao: "específico H-60" },
    F_TORQ_100, F_SOQUETES, F_ALLEN, F_LUVA,
  ],

  // ── 006 · Pás do Rotor Principal ────────────────────────────────────────────
  "118-PMS": [
    F_LANTERNA, F_ESPELHO, F_REGUA, F_FITA,
    { nome: "Gabarito de inspeção de pás de MR", especificacao: "específico H-60" },
    F_LUVA,
  ],
  "119-PMS": [
    F_MOEDA, F_MARTELO, F_LANTERNA, F_LUVA,
    { nome: "Gabarito de inspeção de compósito (MR)", especificacao: "específico H-60" },
  ],
  "120-PMI": [
    F_LANTERNA, F_ESPELHO, F_PAQUIMETRO, F_REGUA, F_FITA,
    { nome: "Gabarito de passo de pá de MR (pitch gauge)", especificacao: "específico H-60" },
    { nome: "Kit de balanceamento dinâmico de MR" },
    F_LUVA, F_ALLEN, F_TORQ_300,
  ],

  // ── 006 · Resfriador de Óleo ────────────────────────────────────────────────
  "133-PMS": [
    F_LANTERNA, F_ESPELHO, F_LUVA, F_PANO, F_OIL_DRY,
  ],
  "134-PMS": [
    F_LANTERNA, F_ESPELHO,
    ...DIAL_SET, F_TORQ_100, F_SOQUETES, F_LUVA,
  ],
  "136-PMS": [
    ...OIL_SERVICE,
    { nome: "Óleo de motor para Oil Cooler", especificacao: "conforme MRC do cartão" },
    F_TORQ_100, F_SOQUETES, F_LUVA,
  ],

  // ── 006 · Eixo Sec I ────────────────────────────────────────────────────────
  "166-PMS": [
    F_LANTERNA, F_ESPELHO, F_PAQUIMETRO, F_CALIBRADOR,
    F_TORQ_100, F_SOQUETES, F_LUVA,
  ],
  "167-PMI": [
    F_PAINEIS, F_LANTERNA, F_ESPELHO,
    ...DIAL_SET, F_PAQUIMETRO, F_CALIBRADOR,
    F_TORQ_300, F_SOQUETES, F_CHAVE_BOCA, F_LUVA,
  ],
}

async function seedFerramentas() {
  const cartoes = await prisma.cartao.findMany({
    select: { id: true, codigo: true, tipo: true },
    where: { ferramentas: { none: {} } },
  })

  for (const cartao of cartoes) {
    const ferramentas = FERR_POR_CODIGO[cartao.codigo] ?? BASIC_INSP

    await prisma.ferramenta.createMany({
      data: ferramentas.map((f, i) => ({
        cartaoId: cartao.id,
        nome: f.nome,
        especificacao: f.especificacao ?? null,
        ordem: i,
      })),
    })
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
