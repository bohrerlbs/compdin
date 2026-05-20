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

async function main() {
  console.log("🌱 Iniciando seed...")

  // Limpa na ordem correta
  await prisma.avisoLeitura.deleteMany()
  await prisma.avisoExecucao.deleteMany()
  await prisma.defeitoExecucao.deleteMany()
  await prisma.subitemStatus.deleteMany()
  await prisma.execucaoCartao.deleteMany()
  await prisma.cartaoInspecaoTipo.deleteMany()
  await prisma.ferramenta.deleteMany()
  await prisma.subitem.deleteMany()
  await prisma.cartao.deleteMany()
  await prisma.subsistema.deleteMany()
  await prisma.sistema.deleteMany()
  await prisma.inspecao.deleteMany()
  await prisma.anv.deleteMany()
  await prisma.user.deleteMany()

  // ─── Usuários padrão ──────────────────────────────────────────────────────

  const senhaHash = await bcrypt.hash("compdin2024", 10)

  await prisma.user.createMany({
    data: [
      { nome: "Admin COMPDIN", trigrama: "ADM", matricula: "admin", passwordHash: senhaHash, role: "ADMIN" },
      { nome: "Inspetor Padrão", trigrama: "INS", matricula: "inspetor01", passwordHash: senhaHash, role: "INSPETOR" },
      { nome: "Encarregado Padrão", trigrama: "ENC", matricula: "encarregado01", passwordHash: senhaHash, role: "ENCARREGADO" },
      { nome: "Mecânico Padrão", trigrama: "MEC", matricula: "mecanico01", passwordHash: senhaHash, role: "MECANICO" },
    ],
  })

  // ─── ANVs ─────────────────────────────────────────────────────────────────

  await prisma.anv.createMany({
    data: [
      { matricula: "8913", modelo: "H-60L" },
      { matricula: "8914", modelo: "H-60L" },
    ],
  })

  // ─── Sistemas ─────────────────────────────────────────────────────────────

  const [s004, s005, s006] = await Promise.all([
    prisma.sistema.create({ data: { codigo: "004", nomeEn: "Tail Cone Section", nomePt: "Seção do Cone de Cauda", ordem: 1 } }),
    prisma.sistema.create({ data: { codigo: "005", nomeEn: "Tail Rotor Pylon Section", nomePt: "Seção do Pylon do Rotor de Cauda", ordem: 2 } }),
    prisma.sistema.create({ data: { codigo: "006", nomeEn: "Main Rotor Pylon Section", nomePt: "Seção do Pylon do Rotor Principal", ordem: 3 } }),
  ])

  // ─── Subsistemas 004 ──────────────────────────────────────────────────────

  const sub004_shafts = await prisma.subsistema.create({
    data: { sistemaId: s004.id, nomeEn: "Drive Shafts (Sec II & III)", nomePt: "Eixos de Transmissão (Sec II e III)", ordem: 1 },
  })

  // ─── Subsistemas 005 ──────────────────────────────────────────────────────

  const [sub005_igb, sub005_pylon, sub005_trblades] = await Promise.all([
    prisma.subsistema.create({ data: { sistemaId: s005.id, nomeEn: "IGB (Intermediate Gear Box)", nomePt: "IGB (Caixa de Engrenagem Intermediária)", ordem: 1 } }),
    prisma.subsistema.create({ data: { sistemaId: s005.id, nomeEn: "Pylon / TGB (Tail Gear Box)", nomePt: "Pylon / TGB (Caixa de Engrenagem de Cauda)", ordem: 2 } }),
    prisma.subsistema.create({ data: { sistemaId: s005.id, nomeEn: "TR Blades (Tail Rotor Blades)", nomePt: "Pás do Rotor de Cauda", ordem: 3 } }),
  ])

  // ─── Subsistemas 006 ──────────────────────────────────────────────────────

  const [
    sub006_acc,
    sub006_trans,
    sub006_hub,
    sub006_droop,
    sub006_bifilar,
    sub006_swash,
    sub006_pitch,
    sub006_mrblades,
    sub006_oilcooler,
    sub006_sec1shaft,
  ] = await Promise.all([
    prisma.subsistema.create({ data: { sistemaId: s006.id, nomeEn: "Accessory Module", nomePt: "Módulo Acessório", ordem: 1 } }),
    prisma.subsistema.create({ data: { sistemaId: s006.id, nomeEn: "Main Transmission", nomePt: "Transmissão Principal", ordem: 2 } }),
    prisma.subsistema.create({ data: { sistemaId: s006.id, nomeEn: "MR Hub & Spindle", nomePt: "Hub e Spindle do Rotor Principal", ordem: 3 } }),
    prisma.subsistema.create({ data: { sistemaId: s006.id, nomeEn: "Droop Stops & Anti-Flap", nomePt: "Batentes de Droop e Anti-Flap", ordem: 4 } }),
    prisma.subsistema.create({ data: { sistemaId: s006.id, nomeEn: "Bifilar", nomePt: "Bifilar (Absorvedor de Vibração)", ordem: 5 } }),
    prisma.subsistema.create({ data: { sistemaId: s006.id, nomeEn: "Swashplate", nomePt: "Prato Oscilante (Swashplate)", ordem: 6 } }),
    prisma.subsistema.create({ data: { sistemaId: s006.id, nomeEn: "Pitch Control", nomePt: "Controle de Passo", ordem: 7 } }),
    prisma.subsistema.create({ data: { sistemaId: s006.id, nomeEn: "MR Blades (Main Rotor Blades)", nomePt: "Pás do Rotor Principal", ordem: 8 } }),
    prisma.subsistema.create({ data: { sistemaId: s006.id, nomeEn: "Oil Cooler / Radiator", nomePt: "Resfriador de Óleo / Radiador", ordem: 9 } }),
    prisma.subsistema.create({ data: { sistemaId: s006.id, nomeEn: "Drive Shaft Sec I", nomePt: "Eixo de Transmissão Sec I", ordem: 10 } }),
  ])

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
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(2),
    qtdRecursos: 1,
    ordem: 10,
    inspecaoTipos: [InspecaoTipo.INSP_90D],
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar acoplamentos dos eixos quanto a danos, corrosão e desgaste", descricaoEn: "Inspect shaft couplings for damage, corrosion, and wear" },
      { letra: "b", descricaoPt: "Verificar folga axial e radial dos eixos", descricaoEn: "Check axial and radial shaft play" },
      { letra: "c", descricaoPt: "Inspecionar suportes e mancais dos eixos", descricaoEn: "Inspect shaft supports and bearings" },
    ],
  })

  // 089-PMI — Inspect Tail Cone Sec II & III Drive Shafts (PMI-960)
  await criaCartao({
    subsistemaId: sub004_shafts.id,
    codigo: "089-PMI",
    nomeEn: "Inspect Tail Cone Sec II & III Drive Shafts (960H)",
    nomePt: "Inspecionar Eixos de Transmissão Sec II e III — 960H",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    wp: "WP 0330",
    duracaoMin: hhmm(10),
    qtdRecursos: 2,
    ordem: 20,
    inspecaoTipos: PMI960,
    subitens: [
      { letra: "a", descricaoPt: "Remover painéis de acesso e inspecionar eixos Sec II e III quanto a corrosão, danos e desgaste", descricaoEn: "Remove access panels and inspect Sec II & III shafts for corrosion, damage, and wear" },
      { letra: "b", descricaoPt: "Inspecionar acoplamentos e flanges dos eixos", descricaoEn: "Inspect shaft couplings and flanges" },
      { letra: "c", descricaoPt: "Verificar folga e alinhamento dos eixos", descricaoEn: "Check shaft play and alignment" },
      { letra: "d", descricaoPt: "Inspecionar mancais e suportes dos eixos", descricaoEn: "Inspect shaft bearings and supports" },
      { letra: "e", descricaoPt: "Reinstalar painéis e verificar fixação", descricaoEn: "Reinstall panels and verify fastening" },
    ],
  })

  // ══════════════════════════════════════════════════════════════════════════
  // ÁREA 005 — TAIL ROTOR PYLON SECTION
  // ══════════════════════════════════════════════════════════════════════════

  // ── IGB ──────────────────────────────────────────────────────────────────

  await criaCartao({
    subsistemaId: sub005_igb.id,
    codigo: "086-PMS",
    nomeEn: "Inspect IGB Oil Level and Servicing",
    nomePt: "Inspecionar Nível e Abastecimento de Óleo do IGB",
    tipo: TipoCartao.SERVICE,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 20),
    qtdRecursos: 1,
    ordem: 10,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoPt: "Verificar nível de óleo do IGB pela janela de inspeção", descricaoEn: "Check IGB oil level through sight glass" },
      { letra: "b", descricaoPt: "Completar óleo se necessário com óleo aprovado (WP 3722 Item)", descricaoEn: "Service oil if required with approved oil" },
      { letra: "c", descricaoPt: "Inspecionar por vazamentos externos", descricaoEn: "Inspect for external leaks" },
    ],
  })

  await criaCartao({
    subsistemaId: sub005_igb.id,
    codigo: "088-PMS",
    nomeEn: "Inspect IGB for Leaks and Security",
    nomePt: "Inspecionar IGB quanto a Vazamentos e Fixação",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 30),
    qtdRecursos: 1,
    ordem: 20,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar carcaça do IGB quanto a trincas e danos", descricaoEn: "Inspect IGB housing for cracks and damage" },
      { letra: "b", descricaoPt: "Verificar vedações e juntas quanto a vazamentos", descricaoEn: "Check seals and gaskets for leaks" },
      { letra: "c", descricaoPt: "Verificar torque dos parafusos de montagem do IGB", descricaoEn: "Check IGB mounting bolt torque" },
    ],
  })

  await criaCartao({
    subsistemaId: sub005_igb.id,
    codigo: "129-(90D)",
    nomeEn: "Inspect IGB Seals and Accelerometer (90D)",
    nomePt: "Inspecionar Vedações e Acelerômetro do IGB — 90D",
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 30),
    qtdRecursos: 1,
    ordem: 30,
    inspecaoTipos: [InspecaoTipo.INSP_90D],
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar vedação do eixo de entrada do IGB", descricaoEn: "Inspect IGB input shaft seal" },
      { letra: "b", descricaoPt: "Inspecionar acelerômetro do IGB quanto a fixação e danos", descricaoEn: "Inspect IGB accelerometer for security and damage" },
      { letra: "c", descricaoPt: "Verificar conexões elétricas do acelerômetro", descricaoEn: "Check accelerometer electrical connections" },
    ],
  })

  // ── Pylon / TGB ───────────────────────────────────────────────────────────

  await criaCartao({
    subsistemaId: sub005_pylon.id,
    codigo: "089-PMS",
    nomeEn: "Inspect TGB Oil Level and Servicing",
    nomePt: "Inspecionar Nível e Abastecimento de Óleo do TGB",
    tipo: TipoCartao.SERVICE,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 20),
    qtdRecursos: 1,
    ordem: 10,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoPt: "Verificar nível de óleo do TGB pela janela de inspeção", descricaoEn: "Check TGB oil level through sight glass" },
      { letra: "b", descricaoPt: "Completar óleo se necessário", descricaoEn: "Service oil if required" },
      { letra: "c", descricaoPt: "Inspecionar por vazamentos externos", descricaoEn: "Inspect for external leaks" },
    ],
  })

  await criaCartao({
    subsistemaId: sub005_pylon.id,
    codigo: "092-PMS",
    nomeEn: "Inspect TR Pylon Structure and Driveshaft (Sec IV)",
    nomePt: "Inspecionar Estrutura do Pylon TR e Eixo Sec IV",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(1),
    qtdRecursos: 1,
    ordem: 20,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar estrutura do pylon TR quanto a corrosão e danos", descricaoEn: "Inspect TR pylon structure for corrosion and damage" },
      { letra: "b", descricaoPt: "Inspecionar eixo de transmissão Sec IV quanto a danos e desgaste", descricaoEn: "Inspect Sec IV driveshaft for damage and wear" },
      { letra: "c", descricaoPt: "Verificar fixação do acoplamento do eixo Sec IV", descricaoEn: "Check Sec IV shaft coupling security" },
    ],
  })

  await criaCartao({
    subsistemaId: sub005_pylon.id,
    codigo: "128-(90D)",
    nomeEn: "Inspect TGB for Leaks, Damage, and Accelerometer (90D)",
    nomePt: "Inspecionar TGB quanto a Vazamentos, Danos e Acelerômetro — 90D",
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(1),
    qtdRecursos: 1,
    ordem: 30,
    inspecaoTipos: [InspecaoTipo.INSP_90D],
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar carcaça do TGB quanto a trincas e danos", descricaoEn: "Inspect TGB housing for cracks and damage" },
      { letra: "b", descricaoPt: "Verificar vedações e juntas do TGB", descricaoEn: "Check TGB seals and gaskets" },
      { letra: "c", descricaoPt: "Inspecionar acelerômetro do TGB", descricaoEn: "Inspect TGB accelerometer" },
    ],
  })

  await criaCartao({
    subsistemaId: sub005_pylon.id,
    codigo: "131-(90D)",
    nomeEn: "Inspect Sec IV Driveshaft (90D)",
    nomePt: "Inspecionar Eixo de Transmissão Sec IV — 90D",
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(2),
    qtdRecursos: 1,
    ordem: 40,
    inspecaoTipos: [InspecaoTipo.INSP_90D],
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar eixo Sec IV quanto a torção, danos e corrosão", descricaoEn: "Inspect Sec IV shaft for twisting, damage, and corrosion" },
      { letra: "b", descricaoPt: "Verificar acoplamentos e flanges do eixo", descricaoEn: "Check shaft couplings and flanges" },
      { letra: "c", descricaoPt: "Inspecionar mancal de suporte do eixo Sec IV", descricaoEn: "Inspect Sec IV shaft support bearing" },
    ],
  })

  await criaCartao({
    subsistemaId: sub005_pylon.id,
    codigo: "106-PMI",
    nomeEn: "Inspect TR Pylon Sec IV Driveshaft (480H/960H)",
    nomePt: "Inspecionar Eixo de Transmissão Sec IV — 480H/960H",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(3),
    qtdRecursos: 2,
    ordem: 50,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoPt: "Remover painéis de acesso do pylon TR", descricaoEn: "Remove TR pylon access panels" },
      { letra: "b", descricaoPt: "Inspecionar eixo Sec IV completamente quanto a danos, corrosão e desgaste", descricaoEn: "Thoroughly inspect Sec IV shaft for damage, corrosion, and wear" },
      { letra: "c", descricaoPt: "Inspecionar e medir folga dos acoplamentos", descricaoEn: "Inspect and measure coupling play" },
      { letra: "d", descricaoPt: "Inspecionar mancais e lubrificar se necessário", descricaoEn: "Inspect bearings and lubricate if required" },
      { letra: "e", descricaoPt: "Reinstalar painéis de acesso", descricaoEn: "Reinstall access panels" },
    ],
  })

  await criaCartao({
    subsistemaId: sub005_pylon.id,
    codigo: "108A-PMI",
    nomeEn: "Inspect IGB and TGB Seals and Accelerometers (480H/960H)",
    nomePt: "Inspecionar Vedações e Acelerômetros do IGB e TGB — 480H/960H",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(0, 20),
    qtdRecursos: 1,
    ordem: 60,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar vedações do IGB e TGB quanto a vazamentos e deterioração", descricaoEn: "Inspect IGB and TGB seals for leaks and deterioration" },
      { letra: "b", descricaoPt: "Verificar fixação e integridade dos acelerômetros do IGB e TGB", descricaoEn: "Check IGB and TGB accelerometer security and integrity" },
      { letra: "c", descricaoPt: "Verificar conexões elétricas e cabos dos acelerômetros", descricaoEn: "Check accelerometer electrical connections and wiring" },
      { letra: "d", descricaoPt: "Verificar leitura dos acelerômetros no HUMS/instrumento", descricaoEn: "Check accelerometer readings on HUMS/instrument" },
    ],
  })

  await criaCartao({
    subsistemaId: sub005_pylon.id,
    codigo: "617",
    nomeEn: "TGB Oil Sample",
    nomePt: "Amostra de Óleo do TGB",
    tipo: TipoCartao.OIL_SAMPLE,
    publicacao: "TM 1-1520-237-PMI",
    wp: "WP 0300",
    duracaoMin: hhmm(1),
    qtdRecursos: 1,
    omDesignator: "ALA 4",
    ordem: 70,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoPt: "Preparar kit de amostragem de óleo", descricaoEn: "Prepare oil sampling kit" },
      { letra: "b", descricaoPt: "Coletar amostra de óleo do TGB conforme WP 0300", descricaoEn: "Collect TGB oil sample per WP 0300" },
      { letra: "c", descricaoPt: "Etiquetar e enviar amostra para laboratório", descricaoEn: "Label and send sample to laboratory" },
    ],
  })

  // ── TR Blades ─────────────────────────────────────────────────────────────

  await criaCartao({
    subsistemaId: sub005_trblades.id,
    codigo: "614-PMS",
    nomeEn: "Inspect TR Blades (PMS-40 — PN 70101-31000-043 only)",
    nomePt: "Inspecionar Pás TR (PMS-40 — somente PN 70101-31000-043)",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(1),
    qtdRecursos: 1,
    omDesignator: "ALA 4",
    observacao: "PMS-40: somente PN 70101-31000-043 (TRB). PMS-120+: todos os PNs.",
    ordem: 10,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar pás TR quanto a danos, erosão e deformações na borda de ataque", descricaoEn: "Inspect TR blades for damage, erosion, and leading-edge deformations" },
      { letra: "b", descricaoPt: "Inspecionar revestimento da pá quanto a delaminações e bolhas", descricaoEn: "Inspect blade skin for delaminations and blisters" },
      { letra: "c", descricaoPt: "Verificar conexões de controle de passo das pás TR", descricaoEn: "Check TR blade pitch control connections" },
    ],
  })

  await criaCartao({
    subsistemaId: sub005_trblades.id,
    codigo: "614A-PMS",
    nomeEn: "Inspect TR Blades (all PNs, PMS-120+)",
    nomePt: "Inspecionar Pás TR (todos os PNs, PMS-120+)",
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(2),
    qtdRecursos: 1,
    omDesignator: "ALA 4",
    observacao: "Todos os PNs. Substitui 614-PMS em PMS-120+.",
    ordem: 20,
    inspecaoTipos: PMS120,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar todas as pás TR quanto a danos, erosão e deformações", descricaoEn: "Inspect all TR blades for damage, erosion, and deformations" },
      { letra: "b", descricaoPt: "Inspecionar longarinas e revestimento das pás", descricaoEn: "Inspect blade spar and skin" },
      { letra: "c", descricaoPt: "Verificar rolamentos e pinos de retenção das pás", descricaoEn: "Check blade retention bearings and pins" },
      { letra: "d", descricaoPt: "Medir espessura da borda de ataque", descricaoEn: "Measure leading edge thickness" },
    ],
  })

  await criaCartao({
    subsistemaId: sub005_trblades.id,
    codigo: "133-(90D)",
    nomeEn: "Inspect TR Blades (90D)",
    nomePt: "Inspecionar Pás do Rotor de Cauda — 90D",
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(2),
    qtdRecursos: 1,
    ordem: 30,
    inspecaoTipos: [InspecaoTipo.INSP_90D],
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar pás TR quanto a trincas, corrosão e erosão da borda de ataque", descricaoEn: "Inspect TR blades for cracks, corrosion, and leading edge erosion" },
      { letra: "b", descricaoPt: "Verificar fixação das pás ao hub TR", descricaoEn: "Check blade attachment to TR hub" },
      { letra: "c", descricaoPt: "Inspecionar indicadores de pressão das pás TR", descricaoEn: "Inspect TR blade pressure indicators" },
    ],
  })

  await criaCartao({
    subsistemaId: sub005_trblades.id,
    codigo: "110-PMI",
    nomeEn: "Inspect TR Hub and Trunnion Assembly",
    nomePt: "Inspecionar Hub e Conjunto Trunnion do Rotor de Cauda",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(4),
    qtdRecursos: 2,
    ordem: 40,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoPt: "Remover pás TR e inspecionar hub quanto a trincas e corrosão", descricaoEn: "Remove TR blades and inspect hub for cracks and corrosion" },
      { letra: "b", descricaoPt: "Inspecionar conjunto trunnion e rolamentos", descricaoEn: "Inspect trunnion assembly and bearings" },
      { letra: "c", descricaoPt: "Verificar pinos de retenção e rolamentos das pás", descricaoEn: "Check blade retention pins and bearings" },
      { letra: "d", descricaoPt: "Lubrificar componentes conforme necessário", descricaoEn: "Lubricate components as required" },
      { letra: "e", descricaoPt: "Reinstalar pás e torquear parafusos de retenção", descricaoEn: "Reinstall blades and torque retention bolts" },
    ],
  })

  await criaCartao({
    subsistemaId: sub005_trblades.id,
    codigo: "111-PMI",
    nomeEn: "Inspect TR Pitch Change Mechanism",
    nomePt: "Inspecionar Mecanismo de Mudança de Passo do Rotor de Cauda",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(3),
    qtdRecursos: 2,
    ordem: 50,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar caixa de mudança de passo TR quanto a danos", descricaoEn: "Inspect TR pitch change box for damage" },
      { letra: "b", descricaoPt: "Verificar folga e curso do mecanismo de mudança de passo", descricaoEn: "Check pitch change mechanism play and travel" },
      { letra: "c", descricaoPt: "Inspecionar rolamentos do mecanismo de passo", descricaoEn: "Inspect pitch mechanism bearings" },
      { letra: "d", descricaoPt: "Lubrificar e ajustar conforme necessário", descricaoEn: "Lubricate and adjust as required" },
    ],
  })

  await criaCartao({
    subsistemaId: sub005_trblades.id,
    codigo: "113-PMI",
    nomeEn: "Inspect TR Yoke Assembly",
    nomePt: "Inspecionar Conjunto Yoke do Rotor de Cauda",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(4),
    qtdRecursos: 2,
    ordem: 60,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar yoke TR quanto a trincas e desgaste", descricaoEn: "Inspect TR yoke for cracks and wear" },
      { letra: "b", descricaoPt: "Verificar integridade das superfícies de rolamento", descricaoEn: "Check bearing surface integrity" },
      { letra: "c", descricaoPt: "Inspecionar furos de instalação dos pinos", descricaoEn: "Inspect pin installation holes" },
      { letra: "d", descricaoPt: "Reinstalar e torquear conforme especificação", descricaoEn: "Reinstall and torque per specification" },
    ],
  })

  await criaCartao({
    subsistemaId: sub005_trblades.id,
    codigo: "114-PMI",
    nomeEn: "Balance TR Rotor",
    nomePt: "Balancear Rotor de Cauda",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(6),
    qtdRecursos: 2,
    ordem: 70,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoPt: "Instalar equipamento de balanceamento no rotor TR", descricaoEn: "Install balancing equipment on TR rotor" },
      { letra: "b", descricaoPt: "Realizar voo de teste e registrar vibrações", descricaoEn: "Perform test flight and record vibrations" },
      { letra: "c", descricaoPt: "Ajustar pesos de balanceamento conforme medições", descricaoEn: "Adjust balance weights per measurements" },
      { letra: "d", descricaoPt: "Verificar balanceamento final", descricaoEn: "Verify final balance" },
    ],
  })

  // ══════════════════════════════════════════════════════════════════════════
  // ÁREA 006 — MAIN ROTOR PYLON SECTION
  // ══════════════════════════════════════════════════════════════════════════

  // ── Módulo Acessório ──────────────────────────────────────────────────────

  await criaCartao({
    subsistemaId: sub006_acc.id,
    codigo: "111-PMS",
    nomeEn: "Inspect Accessory Module Oil Level",
    nomePt: "Inspecionar Nível de Óleo do Módulo Acessório",
    tipo: TipoCartao.SERVICE,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 15),
    qtdRecursos: 1,
    ordem: 10,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoPt: "Verificar nível de óleo do módulo acessório", descricaoEn: "Check accessory module oil level" },
      { letra: "b", descricaoPt: "Completar óleo se necessário", descricaoEn: "Service oil if required" },
      { letra: "c", descricaoPt: "Inspecionar por vazamentos externos no módulo acessório", descricaoEn: "Inspect for external leaks on accessory module" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_acc.id,
    codigo: "112-PMS",
    nomeEn: "Inspect Accessory Module for Security and Damage",
    nomePt: "Inspecionar Módulo Acessório quanto a Fixação e Danos",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 30),
    qtdRecursos: 1,
    ordem: 20,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar carcaça do módulo acessório", descricaoEn: "Inspect accessory module housing" },
      { letra: "b", descricaoPt: "Verificar fixação do módulo acessório à transmissão", descricaoEn: "Check accessory module attachment to transmission" },
      { letra: "c", descricaoPt: "Inspecionar conexões externas (hidráulicas, elétricas)", descricaoEn: "Inspect external connections (hydraulic, electrical)" },
    ],
  })

  // ── Transmissão Principal ─────────────────────────────────────────────────

  await criaCartao({
    subsistemaId: sub006_trans.id,
    codigo: "129-PMS",
    nomeEn: "Check Main Transmission Oil Level",
    nomePt: "Verificar Nível de Óleo da Transmissão Principal",
    tipo: TipoCartao.SERVICE,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 15),
    qtdRecursos: 1,
    ordem: 10,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoPt: "Verificar nível de óleo no visor da transmissão principal", descricaoEn: "Check main transmission oil level on sight glass" },
      { letra: "b", descricaoPt: "Completar óleo se necessário com óleo aprovado", descricaoEn: "Service with approved oil if required" },
      { letra: "c", descricaoPt: "Verificar temperatura de operação registrada", descricaoEn: "Check recorded operating temperature" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_trans.id,
    codigo: "136-(90D)",
    nomeEn: "Inspect Main Transmission for Leaks and Security (90D)",
    nomePt: "Inspecionar Transmissão Principal quanto a Vazamentos e Fixação — 90D",
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(1),
    qtdRecursos: 1,
    ordem: 20,
    inspecaoTipos: [InspecaoTipo.INSP_90D],
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar carcaça da transmissão quanto a trincas e danos", descricaoEn: "Inspect transmission housing for cracks and damage" },
      { letra: "b", descricaoPt: "Verificar todas as vedações e juntas quanto a vazamentos", descricaoEn: "Check all seals and gaskets for leaks" },
      { letra: "c", descricaoPt: "Verificar parafusos de montagem e torques", descricaoEn: "Check mounting bolts and torques" },
      { letra: "d", descricaoPt: "Inspecionar chip detector da transmissão", descricaoEn: "Inspect transmission chip detector" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_trans.id,
    codigo: "139-PMI",
    nomeEn: "Inspect Main Transmission Input Module and Accessories",
    nomePt: "Inspecionar Módulo de Entrada da Transmissão e Acessórios",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(2),
    qtdRecursos: 1,
    ordem: 30,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar módulo de entrada da transmissão quanto a danos e vazamentos", descricaoEn: "Inspect transmission input module for damage and leaks" },
      { letra: "b", descricaoPt: "Verificar vedações do módulo de entrada", descricaoEn: "Check input module seals" },
      { letra: "c", descricaoPt: "Inspecionar acelerômetros da transmissão", descricaoEn: "Inspect transmission accelerometers" },
      { letra: "d", descricaoPt: "Verificar conexões elétricas e cabos", descricaoEn: "Check electrical connections and wiring" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_trans.id,
    codigo: "141-PMI",
    nomeEn: "Inspect Main, Input, and Accessory Module (960H)",
    nomePt: "Inspecionar Módulos Principal, de Entrada e Acessório — 960H",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(0, 30),
    qtdRecursos: 1,
    ordem: 40,
    inspecaoTipos: PMI960,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar carcaça do módulo principal quanto a trincas e corrosão", descricaoEn: "Inspect main module housing for cracks and corrosion" },
      { letra: "b", descricaoPt: "Inspecionar módulo de entrada quanto a danos", descricaoEn: "Inspect input module for damage" },
      { letra: "c", descricaoPt: "Inspecionar módulo acessório quanto a danos e fixação", descricaoEn: "Inspect accessory module for damage and security" },
      { letra: "d", descricaoPt: "Verificar todos os chip detectors", descricaoEn: "Check all chip detectors" },
      { letra: "e", descricaoPt: "Registrar e reportar quaisquer achados", descricaoEn: "Record and report any findings" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_trans.id,
    codigo: "144-PMI",
    nomeEn: "Check Main Transmission Oil Level (960H)",
    nomePt: "Verificar Nível de Óleo da Transmissão Principal — 960H",
    tipo: TipoCartao.SERVICE,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(0, 10),
    qtdRecursos: 1,
    ordem: 50,
    inspecaoTipos: PMI960,
    subitens: [
      { letra: "a", descricaoPt: "Verificar nível de óleo da transmissão principal conforme PMI", descricaoEn: "Check main transmission oil level per PMI" },
      { letra: "b", descricaoPt: "Documentar leitura e comparar com tendência histórica", descricaoEn: "Document reading and compare with historical trend" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_trans.id,
    codigo: "145-PMI",
    nomeEn: "Inspect Input Module Seals (960H)",
    nomePt: "Inspecionar Vedações do Módulo de Entrada — 960H",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(0, 5),
    qtdRecursos: 1,
    ordem: 60,
    inspecaoTipos: PMI960,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar vedação do eixo de entrada da transmissão", descricaoEn: "Inspect transmission input shaft seal" },
      { letra: "b", descricaoPt: "Verificar sinais de vazamento ao redor do módulo de entrada", descricaoEn: "Check for leak signs around input module" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_trans.id,
    codigo: "146-PMI",
    nomeEn: "Inspect Main Rotor Shaft Seal (960H)",
    nomePt: "Inspecionar Vedação do Eixo do Rotor Principal — 960H",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(0, 10),
    qtdRecursos: 1,
    ordem: 70,
    inspecaoTipos: PMI960,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar vedação do eixo do rotor principal quanto a vazamentos", descricaoEn: "Inspect main rotor shaft seal for leaks" },
      { letra: "b", descricaoPt: "Verificar desgaste e deterioração da vedação", descricaoEn: "Check seal wear and deterioration" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_trans.id,
    codigo: "147-PMI",
    nomeEn: "Inspect Tail Takeoff Flange Seal and Accelerometer (960H)",
    nomePt: "Inspecionar Vedação do Flange de Saída para Cauda e Acelerômetro — 960H",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(0, 10),
    qtdRecursos: 1,
    ordem: 80,
    inspecaoTipos: PMI960,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar vedação do flange de saída para cauda", descricaoEn: "Inspect tail takeoff flange seal" },
      { letra: "b", descricaoPt: "Verificar acelerômetro do flange de saída para cauda", descricaoEn: "Check tail takeoff flange accelerometer" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_trans.id,
    codigo: "617A",
    nomeEn: "Main Gear Box Oil Sample (960H)",
    nomePt: "Amostra de Óleo da Caixa de Engrenagem Principal — 960H",
    tipo: TipoCartao.OIL_SAMPLE,
    publicacao: "TM 1-1520-237-PMI",
    wp: "WP 0300",
    duracaoMin: hhmm(1),
    qtdRecursos: 1,
    omDesignator: "ALA 4",
    ordem: 90,
    inspecaoTipos: PMI960,
    subitens: [
      { letra: "a", descricaoPt: "Preparar kit de amostragem de óleo", descricaoEn: "Prepare oil sampling kit" },
      { letra: "b", descricaoPt: "Coletar amostra de óleo da caixa de engrenagem principal conforme WP 0300", descricaoEn: "Collect main gear box oil sample per WP 0300" },
      { letra: "c", descricaoPt: "Etiquetar e enviar amostra para laboratório", descricaoEn: "Label and send sample to laboratory" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_trans.id,
    codigo: "622",
    nomeEn: "Drain and Service Main Transmission (960H)",
    nomePt: "Drenar e Abastecer a Transmissão Principal — 960H",
    tipo: TipoCartao.SERVICE,
    publicacao: "TM 1-1520-237-PMI",
    wp: "WP 0215",
    duracaoMin: hhmm(2),
    qtdRecursos: 1,
    ordem: 100,
    inspecaoTipos: PMI960,
    subitens: [
      { letra: "a", descricaoPt: "Drenar óleo da transmissão principal conforme WP 0215", descricaoEn: "Drain main transmission oil per WP 0215" },
      { letra: "b", descricaoPt: "Inspecionar filtro de óleo da transmissão", descricaoEn: "Inspect transmission oil filter" },
      { letra: "c", descricaoPt: "Inspecionar chip detectors e drenos magnéticos", descricaoEn: "Inspect chip detectors and magnetic drain plugs" },
      { letra: "d", descricaoPt: "Abastecer transmissão com óleo novo aprovado", descricaoEn: "Service transmission with new approved oil" },
      { letra: "e", descricaoPt: "Verificar nível final e por vazamentos", descricaoEn: "Check final level and for leaks" },
    ],
  })

  // ── MR Hub & Spindle ──────────────────────────────────────────────────────

  await criaCartao({
    subsistemaId: sub006_hub.id,
    codigo: "117-PMS",
    nomeEn: "Inspect MR Hub for Security and Damage",
    nomePt: "Inspecionar Hub do Rotor Principal quanto a Fixação e Danos",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 30),
    qtdRecursos: 1,
    ordem: 10,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar hub MR quanto a trincas e corrosão", descricaoEn: "Inspect MR hub for cracks and corrosion" },
      { letra: "b", descricaoPt: "Verificar parafusos de retenção e torques", descricaoEn: "Check retention bolts and torques" },
      { letra: "c", descricaoPt: "Inspecionar spindle quanto a danos", descricaoEn: "Inspect spindle for damage" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_hub.id,
    codigo: "121-PMS",
    nomeEn: "Lubricate MR Hub and Spindle Bearings",
    nomePt: "Lubrificar Rolamentos do Hub e Spindle do Rotor Principal",
    tipo: TipoCartao.LUBRIFICATION,
    publicacao: "TM 1-1520-237-PMS",
    wp: "WP 0195",
    duracaoMin: hhmm(1),
    qtdRecursos: 1,
    ordem: 20,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoPt: "Aplicar graxa nos rolamentos do spindle conforme WP 0195", descricaoEn: "Apply grease to spindle bearings per WP 0195" },
      { letra: "b", descricaoPt: "Lubrificar pinos e articulações do hub MR", descricaoEn: "Lubricate MR hub pins and articulations" },
      { letra: "c", descricaoPt: "Remover excesso de graxa", descricaoEn: "Remove excess grease" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_hub.id,
    codigo: "139-(90D)",
    nomeEn: "Inspect MR Hub Elastomeric Bearings (90D)",
    nomePt: "Inspecionar Rolamentos Elastoméricos do Hub MR — 90D",
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(2),
    qtdRecursos: 1,
    ordem: 30,
    inspecaoTipos: [InspecaoTipo.INSP_90D],
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar rolamentos elastoméricos do hub MR quanto a trincas e deformações", descricaoEn: "Inspect MR hub elastomeric bearings for cracks and deformations" },
      { letra: "b", descricaoPt: "Verificar exsudação e deterioração do elastômero", descricaoEn: "Check elastomer exudation and deterioration" },
      { letra: "c", descricaoPt: "Medir deflexão dos rolamentos", descricaoEn: "Measure bearing deflection" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_hub.id,
    codigo: "151-PMI",
    nomeEn: "Inspect MR Hub Spindle Bearings and Seals",
    nomePt: "Inspecionar Rolamentos e Vedações do Spindle do Hub MR",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(4),
    qtdRecursos: 2,
    ordem: 40,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoPt: "Remover carenagem e acessar spindle do hub MR", descricaoEn: "Remove fairing and access MR hub spindle" },
      { letra: "b", descricaoPt: "Inspecionar rolamentos do spindle quanto a desgaste e danos", descricaoEn: "Inspect spindle bearings for wear and damage" },
      { letra: "c", descricaoPt: "Verificar vedações do spindle quanto a vazamentos", descricaoEn: "Check spindle seals for leaks" },
      { letra: "d", descricaoPt: "Reinstalar e torquear componentes", descricaoEn: "Reinstall and torque components" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_hub.id,
    codigo: "152-PMI",
    nomeEn: "Inspect MR Pitch Horn and Drag Brace",
    nomePt: "Inspecionar Corno de Passo e Barra de Tração MR",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(3),
    qtdRecursos: 2,
    ordem: 50,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar corno de passo quanto a trincas e desgaste", descricaoEn: "Inspect pitch horn for cracks and wear" },
      { letra: "b", descricaoPt: "Inspecionar barra de tração quanto a danos", descricaoEn: "Inspect drag brace for damage" },
      { letra: "c", descricaoPt: "Verificar rolamentos e pinos de articulação", descricaoEn: "Check bearings and articulation pins" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_hub.id,
    codigo: "153-PMI",
    nomeEn: "Inspect MR Elastomeric Bearing Sleeve (replace at 960H per H-60-19-ASAM-06)",
    nomePt: "Inspecionar Bucha do Rolamento Elastomérico MR (substituir em 960H conforme H-60-19-ASAM-06)",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(6),
    qtdRecursos: 2,
    observacao: "Item 'i': substituir bucha elastomérica a cada 960H conforme H-60-19-ASAM-06",
    ordem: 60,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar rolamentos elastoméricos do hub quanto a deterioração", descricaoEn: "Inspect hub elastomeric bearings for deterioration" },
      { letra: "b", descricaoPt: "Verificar exsudação do elastômero", descricaoEn: "Check elastomer exudation" },
      { letra: "c", descricaoPt: "Medir deflexão estática do rolamento", descricaoEn: "Measure static bearing deflection" },
      { letra: "d", descricaoPt: "Inspecionar bucha do rolamento elastomérico", descricaoEn: "Inspect elastomeric bearing sleeve" },
      { letra: "e", descricaoPt: "Verificar fixação e torques", descricaoEn: "Check security and torques" },
      { letra: "f", descricaoPt: "Inspecionar superfície de contato do rolamento", descricaoEn: "Inspect bearing contact surface" },
      { letra: "g", descricaoPt: "Documentar condição dos rolamentos", descricaoEn: "Document bearing condition" },
      { letra: "h", descricaoPt: "Lubrificar componentes conforme necessário", descricaoEn: "Lubricate components as required" },
      { letra: "i", descricaoPt: "SUBSTITUIR bucha do rolamento elastomérico — obrigatório a cada 960H conforme H-60-19-ASAM-06", descricaoEn: "REPLACE elastomeric bearing sleeve — mandatory every 960H per H-60-19-ASAM-06", referencia: "H-60-19-ASAM-06" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_hub.id,
    codigo: "154-PMI",
    nomeEn: "Inspect MR Lead-Lag Dampers",
    nomePt: "Inspecionar Amortecedores Lead-Lag do Rotor Principal",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(4),
    qtdRecursos: 2,
    ordem: 70,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar amortecedores lead-lag quanto a danos e vazamentos", descricaoEn: "Inspect lead-lag dampers for damage and leaks" },
      { letra: "b", descricaoPt: "Verificar fixação e torques dos amortecedores", descricaoEn: "Check damper security and torques" },
      { letra: "c", descricaoPt: "Medir curso e amortecimento dos dampers", descricaoEn: "Measure damper travel and damping" },
      { letra: "d", descricaoPt: "Substituir se fora de especificação", descricaoEn: "Replace if out of specification" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_hub.id,
    codigo: "155-PMI",
    nomeEn: "Inspect MR Retention Strap and Cuff",
    nomePt: "Inspecionar Cinta de Retenção e Cuff do Rotor Principal",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(3),
    qtdRecursos: 2,
    ordem: 80,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar cinta de retenção quanto a fios cortados e desgaste", descricaoEn: "Inspect retention strap for cut wires and wear" },
      { letra: "b", descricaoPt: "Inspecionar cuff da pá MR quanto a trincas", descricaoEn: "Inspect MR blade cuff for cracks" },
      { letra: "c", descricaoPt: "Verificar parafusos de retenção da cinta", descricaoEn: "Check strap retention bolts" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_hub.id,
    codigo: "158-PMI",
    nomeEn: "Inspect Scissors Bearing Play (6.25) (960H)",
    nomePt: "Inspecionar Folga do Rolamento das Tesouras (6.25) — 960H",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(1),
    qtdRecursos: 2,
    ordem: 90,
    inspecaoTipos: PMI960,
    subitens: [
      { letra: "a", descricaoPt: "Instalar ferramenta de medição no conjunto tesouras", descricaoEn: "Install measurement tool on scissors assembly" },
      { letra: "b", descricaoPt: "Medir folga do rolamento das tesouras conforme especificação 6.25", descricaoEn: "Measure scissors bearing play per specification 6.25" },
      { letra: "c", descricaoPt: "Registrar medições e comparar com limites", descricaoEn: "Record measurements and compare with limits" },
      { letra: "d", descricaoPt: "Substituir rolamento se fora de especificação", descricaoEn: "Replace bearing if out of specification" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_hub.id,
    codigo: "160-PMI",
    nomeEn: "Inspect MR Shaft (960H)",
    nomePt: "Inspecionar Eixo do Rotor Principal — 960H",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(0, 30),
    qtdRecursos: 1,
    ordem: 100,
    inspecaoTipos: PMI960,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar eixo MR quanto a corrosão, trincas e desgaste", descricaoEn: "Inspect MR shaft for corrosion, cracks, and wear" },
      { letra: "b", descricaoPt: "Verificar estrias do eixo MR", descricaoEn: "Check MR shaft splines" },
      { letra: "c", descricaoPt: "Inspecionar flange superior do eixo MR", descricaoEn: "Inspect MR shaft upper flange" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_hub.id,
    codigo: "161-PMI",
    nomeEn: "Inspect MR Hub and Torque Head Bolts (960H)",
    nomePt: "Inspecionar Hub MR e Torquear Parafusos da Cabeça de Torque — 960H",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(4),
    qtdRecursos: 1,
    ordem: 110,
    inspecaoTipos: PMI960,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar hub MR completamente quanto a trincas e corrosão", descricaoEn: "Thoroughly inspect MR hub for cracks and corrosion" },
      { letra: "b", descricaoPt: "Inspecionar todos os furos de instalação e superfícies de contato", descricaoEn: "Inspect all installation holes and contact surfaces" },
      { letra: "c", descricaoPt: "Verificar e torquear parafusos da cabeça de torque conforme especificação", descricaoEn: "Check and torque torque head bolts per specification" },
      { letra: "d", descricaoPt: "Inspecionar porcas de retenção e contrapinos", descricaoEn: "Inspect retention nuts and cotter pins" },
    ],
  })

  // ── Droop Stops & Anti-Flap ───────────────────────────────────────────────

  await criaCartao({
    subsistemaId: sub006_droop.id,
    codigo: "119-PMS",
    nomeEn: "Inspect Droop Stops for Security and Damage",
    nomePt: "Inspecionar Batentes de Droop quanto a Fixação e Danos",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 30),
    qtdRecursos: 1,
    ordem: 10,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar batentes de droop quanto a trincas e desgaste", descricaoEn: "Inspect droop stops for cracks and wear" },
      { letra: "b", descricaoPt: "Verificar fixação e articulação dos batentes", descricaoEn: "Check droop stop security and articulation" },
      { letra: "c", descricaoPt: "Verificar rolamentos dos batentes de droop", descricaoEn: "Check droop stop bearings" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_droop.id,
    codigo: "120-PMS",
    nomeEn: "Inspect Anti-Flap System",
    nomePt: "Inspecionar Sistema Anti-Flap",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 30),
    qtdRecursos: 1,
    ordem: 20,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar componentes anti-flap quanto a danos e desgaste", descricaoEn: "Inspect anti-flap components for damage and wear" },
      { letra: "b", descricaoPt: "Verificar ajuste e folga do sistema anti-flap", descricaoEn: "Check anti-flap system adjustment and clearance" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_droop.id,
    codigo: "130-PMS",
    nomeEn: "Lubricate Droop Stop Pivot Bearings",
    nomePt: "Lubrificar Rolamentos de Pivô dos Batentes de Droop",
    tipo: TipoCartao.LUBRIFICATION,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 45),
    qtdRecursos: 1,
    ordem: 30,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoPt: "Aplicar graxa nos rolamentos de pivô dos batentes de droop", descricaoEn: "Apply grease to droop stop pivot bearings" },
      { letra: "b", descricaoPt: "Lubrificar pinos de articulação", descricaoEn: "Lubricate articulation pins" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_droop.id,
    codigo: "148-PMI",
    nomeEn: "Inspect Gust Lock Flange Teeth and Lever (960H)",
    nomePt: "Inspecionar Dentes do Flange Gust Lock e Alavanca — 960H",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(0, 10),
    qtdRecursos: 1,
    ordem: 40,
    inspecaoTipos: PMI960,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar dentes do flange gust lock quanto a desgaste e danos", descricaoEn: "Inspect gust lock flange teeth for wear and damage" },
      { letra: "b", descricaoPt: "Verificar alavanca de acionamento do gust lock", descricaoEn: "Check gust lock actuation lever" },
      { letra: "c", descricaoPt: "Verificar mecanismo de travamento em funcionamento", descricaoEn: "Check locking mechanism operation" },
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
    wp: "WP 0260",
    duracaoMin: hhmm(1),
    qtdRecursos: 1,
    ordem: 10,
    inspecaoTipos: [InspecaoTipo.INSP_30D, InspecaoTipo.PMS_40, InspecaoTipo.PMS_120, InspecaoTipo.PMS_360, InspecaoTipo.PMI_480, InspecaoTipo.PMI_960],
    subitens: [
      { letra: "a", descricaoPt: "Limpar graxa antiga dos buchas, pinos e arruelas do bifilar (WP 3722 Item 459)", descricaoEn: "Clean old grease from bifilar bushings, pins, and washers (WP 3722 Item 459)" },
      { letra: "b", descricaoPt: "Aplicar graxa nova (WP 3722 Item 194) nas buchas, pinos e arruelas", descricaoEn: "Apply new grease (WP 3722 Item 194) to bushings, pins, and washers" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_bifilar.id,
    codigo: "122-PMS",
    nomeEn: "Inspect Bifilar Absorber for Security and Damage",
    nomePt: "Inspecionar Absorvedor Bifilar quanto a Fixação e Danos",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 30),
    qtdRecursos: 1,
    ordem: 20,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar pesos do bifilar quanto a danos e corrosão", descricaoEn: "Inspect bifilar weights for damage and corrosion" },
      { letra: "b", descricaoPt: "Verificar fixação dos pinos e buchas do bifilar", descricaoEn: "Check bifilar pins and bushings security" },
      { letra: "c", descricaoPt: "Verificar integridade das arruelas de retenção", descricaoEn: "Check retention washer integrity" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_bifilar.id,
    codigo: "123-PMS",
    nomeEn: "Inspect Bifilar Absorber Pendulums",
    nomePt: "Inspecionar Pêndulos do Absorvedor Bifilar",
    tipo: TipoCartao.DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(1),
    qtdRecursos: 1,
    ordem: 30,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar pêndulos do bifilar quanto a desgaste nas superfícies de rolamento", descricaoEn: "Inspect bifilar pendulums for wear on rolling surfaces" },
      { letra: "b", descricaoPt: "Medir desgaste dos pêndulos conforme limites", descricaoEn: "Measure pendulum wear per limits" },
      { letra: "c", descricaoPt: "Verificar balanceamento dos pêndulos", descricaoEn: "Check pendulum balance" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_bifilar.id,
    codigo: "163-PMI",
    nomeEn: "Inspect Bifilar Absorber Assembly (480H/960H)",
    nomePt: "Inspecionar Conjunto do Absorvedor Bifilar — 480H/960H",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(4),
    qtdRecursos: 2,
    ordem: 40,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoPt: "Remover conjunto bifilar da cabeça do rotor principal", descricaoEn: "Remove bifilar assembly from main rotor head" },
      { letra: "b", descricaoPt: "Inspecionar completamente todos os componentes do bifilar", descricaoEn: "Thoroughly inspect all bifilar components" },
      { letra: "c", descricaoPt: "Substituir pinos e buchas desgastados", descricaoEn: "Replace worn pins and bushings" },
      { letra: "d", descricaoPt: "Reinstalar e torquear conjunto bifilar", descricaoEn: "Reinstall and torque bifilar assembly" },
    ],
  })

  // ── Swashplate ────────────────────────────────────────────────────────────

  await criaCartao({
    subsistemaId: sub006_swash.id,
    codigo: "126-PMS",
    nomeEn: "Inspect Swashplate for Security and Damage",
    nomePt: "Inspecionar Prato Oscilante quanto a Fixação e Danos",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 30),
    qtdRecursos: 1,
    ordem: 10,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar prato oscilante quanto a trincas e corrosão", descricaoEn: "Inspect swashplate for cracks and corrosion" },
      { letra: "b", descricaoPt: "Verificar fixação do prato oscilante e guias anti-rotação", descricaoEn: "Check swashplate security and anti-rotation guides" },
      { letra: "c", descricaoPt: "Verificar vedações e selos do prato oscilante", descricaoEn: "Check swashplate seals and boots" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_swash.id,
    codigo: "127-PMS",
    nomeEn: "Inspect Swashplate Scissors and Pitch Links",
    nomePt: "Inspecionar Tesouras e Links de Passo do Prato Oscilante",
    tipo: TipoCartao.VISUAL_CHECK,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(0, 30),
    qtdRecursos: 1,
    ordem: 20,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar tesouras do prato oscilante quanto a danos", descricaoEn: "Inspect swashplate scissors for damage" },
      { letra: "b", descricaoPt: "Inspecionar links de passo quanto a trincas e desgaste", descricaoEn: "Inspect pitch links for cracks and wear" },
      { letra: "c", descricaoPt: "Verificar rolamentos dos links de passo", descricaoEn: "Check pitch link bearings" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_swash.id,
    codigo: "128-PMS",
    nomeEn: "Lubricate Swashplate Bearings",
    nomePt: "Lubrificar Rolamentos do Prato Oscilante",
    tipo: TipoCartao.LUBRIFICATION,
    publicacao: "TM 1-1520-237-PMS",
    duracaoMin: hhmm(1),
    qtdRecursos: 1,
    ordem: 30,
    inspecaoTipos: PMS40,
    subitens: [
      { letra: "a", descricaoPt: "Lubrificar rolamentos do prato rotativo do swashplate", descricaoEn: "Lubricate swashplate rotating plate bearings" },
      { letra: "b", descricaoPt: "Lubrificar rolamentos das tesouras do swashplate", descricaoEn: "Lubricate swashplate scissors bearings" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_swash.id,
    codigo: "162-PMI",
    nomeEn: "Inspect Swashplate Assembly (480H/960H)",
    nomePt: "Inspecionar Conjunto do Prato Oscilante — 480H/960H",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(6),
    qtdRecursos: 2,
    ordem: 40,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoPt: "Remover conjunto do swashplate", descricaoEn: "Remove swashplate assembly" },
      { letra: "b", descricaoPt: "Inspecionar completamente todos os componentes", descricaoEn: "Thoroughly inspect all components" },
      { letra: "c", descricaoPt: "Inspecionar rolamentos e guias anti-rotação", descricaoEn: "Inspect bearings and anti-rotation guides" },
      { letra: "d", descricaoPt: "Substituir vedações e selos", descricaoEn: "Replace seals and boots" },
      { letra: "e", descricaoPt: "Reinstalar e ajustar swashplate", descricaoEn: "Reinstall and adjust swashplate" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_swash.id,
    codigo: "162A-PMI",
    nomeEn: "Inspect Swashplate Bearing Race (480H/960H)",
    nomePt: "Inspecionar Pista do Rolamento do Prato Oscilante — 480H/960H",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(4),
    qtdRecursos: 2,
    ordem: 50,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoPt: "Inspecionar pista do rolamento do swashplate quanto a desgaste", descricaoEn: "Inspect swashplate bearing race for wear" },
      { letra: "b", descricaoPt: "Medir folga da pista de rolamento", descricaoEn: "Measure bearing race clearance" },
      { letra: "c", descricaoPt: "Verificar superfície de contato do rolamento", descricaoEn: "Check bearing contact surface" },
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
    ordem: 60,
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
    nomeEn: "Lubricate Swashplate (whichever comes first: 360H or 12M)",
    nomePt: "Lubrificar Prato Oscilante (o que ocorrer primeiro: 360H ou 12M)",
    tipo: TipoCartao.LUBRIFICATION,
    publicacao: "TM 1-1520-237-PMS",
    observacao: "Compartilhado entre PMS-360 e INSP-12M — o que ocorrer primeiro",
    ordem: 70,
    inspecaoTipos: [InspecaoTipo.PMS_360, InspecaoTipo.PMI_480, InspecaoTipo.PMI_960, InspecaoTipo.INSP_12M],
    subitens: [
      { letra: "a", descricaoPt: "Limpar graxa antiga do swashplate", descricaoEn: "Clean old grease from swashplate" },
      { letra: "b", descricaoPt: "Aplicar graxa nova no swashplate conforme especificação", descricaoEn: "Apply new grease to swashplate per specification" },
      { letra: "c", descricaoPt: "Verificar operação suave do swashplate após lubrificação", descricaoEn: "Check smooth swashplate operation after lubrication" },
    ],
  })

  await criaCartao({
    subsistemaId: sub006_swash.id,
    codigo: "614",
    nomeEn: "TR Blade Tracking (PMI)",
    nomePt: "Rastreamento das Pás do Rotor de Cauda (PMI)",
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
    publicacao: "TM 1-1520-237-PMI",
    duracaoMin: hhmm(2),
    qtdRecursos: 2,
    omDesignator: "ALA 4",
    ordem: 80,
    inspecaoTipos: PMI480,
    subitens: [
      { letra: "a", descricaoPt: "Instalar equipamento de rastreamento de pás TR", descricaoEn: "Install TR blade tracking equipment" },
      { letra: "b", descricaoPt: "Realizar teste de rastreamento em voo", descricaoEn: "Perform tracking test in flight" },
      { letra: "c", descricaoPt: "Ajustar links de passo TR conforme medições", descricaoEn: "Adjust TR pitch links per measurements" },
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
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
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
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
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
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
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
    tipo: TipoCartao.SPECIAL_DETAILED_INSPECTION,
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
  const cartoes = await prisma.cartao.findMany({ select: { id: true, codigo: true, tipo: true } })

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
