import { InspecaoTipo } from "@prisma/client"

export const INSPECAO_LABELS: Record<InspecaoTipo, string> = {
  INSP_30D:      "INSP-30D (Calendário 30 dias)",
  INSP_6M:       "INSP-6M (Calendário 6 meses)",
  INSP_90D:      "INSP-90D (Calendário 90 dias)",
  INSP_12M:      "INSP-12M (Calendário 12 meses)",
  INSP_24M:      "INSP-24M (Calendário 24 meses)",
  PMS_40:        "PMS-40H (Periódica 40 horas)",
  PMS_120:       "PMS-120H (Periódica 120 horas)",
  PMS_360:       "PMS-360H (Periódica 360 horas)",
  PMI_480:       "PMI-480H (Maior 480 horas)",
  PMI_960:       "PMI-960H (Maior 960 horas)",
  EP1_ERO:       "Insp. Esp. 1 — Atmosfera Erosiva",
  EP2_POU:       "Insp. Esp. 2 — Pouso Duro",
  EP3_PAR:       "Insp. Esp. 3 — Parada Brusca",
  EP5_PRP:       "Insp. Esp. 5 — PRP Atm. Erosiva",
  INSP_ESPECIAL: "Inspeção Especial",
  MNT_NAO_PROG:  "Manutenção Não Programada",
}

export const INSPECAO_SHORT: Record<InspecaoTipo, string> = {
  INSP_30D:      "INSP-30D",
  INSP_6M:       "INSP-6M",
  INSP_90D:      "INSP-90D",
  INSP_12M:      "INSP-12M",
  INSP_24M:      "INSP-24M",
  PMS_40:        "PMS-40H",
  PMS_120:       "PMS-120H",
  PMS_360:       "PMS-360H",
  PMI_480:       "PMI-480H",
  PMI_960:       "PMI-960H",
  EP1_ERO:       "EP1 — Erosiva",
  EP2_POU:       "EP2 — Pouso Duro",
  EP3_PAR:       "EP3 — Parada Brusca",
  EP5_PRP:       "EP5 — PRP Erosiva",
  INSP_ESPECIAL: "Insp. Especial",
  MNT_NAO_PROG:  "Manut. Não Prog.",
}

export function formatTipo(tipo: string): string {
  return INSPECAO_SHORT[tipo as InspecaoTipo] ?? tipo
}

export const TIPOS_PERIODICOS: InspecaoTipo[] = [
  "INSP_30D", "INSP_6M", "INSP_90D", "INSP_12M", "INSP_24M",
  "PMS_40", "PMS_120", "PMS_360", "PMI_480", "PMI_960",
]

export const TIPOS_ESPECIAIS: InspecaoTipo[] = [
  "EP1_ERO", "EP2_POU", "EP3_PAR", "EP5_PRP", "INSP_ESPECIAL", "MNT_NAO_PROG",
]

export const TIPOS_INSPECAO_AGRUPADOS = [
  {
    grupo: "Periódicas (Calendário)",
    tipos: [
      { value: "INSP_30D" as InspecaoTipo, label: INSPECAO_LABELS.INSP_30D },
      { value: "INSP_6M"  as InspecaoTipo, label: INSPECAO_LABELS.INSP_6M  },
      { value: "INSP_90D" as InspecaoTipo, label: INSPECAO_LABELS.INSP_90D },
      { value: "INSP_12M" as InspecaoTipo, label: INSPECAO_LABELS.INSP_12M },
      { value: "INSP_24M" as InspecaoTipo, label: INSPECAO_LABELS.INSP_24M },
    ],
  },
  {
    grupo: "Periódicas (Horas)",
    tipos: [
      { value: "PMS_40"  as InspecaoTipo, label: INSPECAO_LABELS.PMS_40  },
      { value: "PMS_120" as InspecaoTipo, label: INSPECAO_LABELS.PMS_120 },
      { value: "PMS_360" as InspecaoTipo, label: INSPECAO_LABELS.PMS_360 },
      { value: "PMI_480" as InspecaoTipo, label: INSPECAO_LABELS.PMI_480 },
      { value: "PMI_960" as InspecaoTipo, label: INSPECAO_LABELS.PMI_960 },
    ],
  },
  {
    grupo: "Inspeções Especiais",
    tipos: [
      { value: "EP1_ERO"       as InspecaoTipo, label: INSPECAO_LABELS.EP1_ERO       },
      { value: "EP2_POU"       as InspecaoTipo, label: INSPECAO_LABELS.EP2_POU       },
      { value: "EP3_PAR"       as InspecaoTipo, label: INSPECAO_LABELS.EP3_PAR       },
      { value: "EP5_PRP"       as InspecaoTipo, label: INSPECAO_LABELS.EP5_PRP       },
      { value: "INSP_ESPECIAL" as InspecaoTipo, label: INSPECAO_LABELS.INSP_ESPECIAL },
      { value: "MNT_NAO_PROG"  as InspecaoTipo, label: INSPECAO_LABELS.MNT_NAO_PROG  },
    ],
  },
]
