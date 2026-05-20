-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MECANICO', 'ENCARREGADO', 'INSPETOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "InspecaoTipo" AS ENUM ('INSP_30D', 'INSP_6M', 'INSP_90D', 'INSP_12M', 'INSP_24M', 'PMS_40', 'PMS_120', 'PMS_360', 'PMI_480', 'PMI_960');

-- CreateEnum
CREATE TYPE "InspecaoStatus" AS ENUM ('ABERTA', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoCartao" AS ENUM ('VISUAL_CHECK', 'DETAILED_INSPECTION', 'SPECIAL_DETAILED_INSPECTION', 'SERVICE', 'LUBRIFICATION', 'BIM_CHECK', 'TAP_TEST', 'OIL_SAMPLE');

-- CreateEnum
CREATE TYPE "StatusSubitem" AS ENUM ('PENDENTE', 'INICIADA', 'CONCLUIDA');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "trigrama" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MECANICO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anvs" (
    "id" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "modelo" TEXT NOT NULL DEFAULT 'H-60L',
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "anvs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspecoes" (
    "id" TEXT NOT NULL,
    "anv_id" TEXT NOT NULL,
    "tipo" "InspecaoTipo" NOT NULL,
    "status" "InspecaoStatus" NOT NULL DEFAULT 'ABERTA',
    "aberta_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aberta_por_id" TEXT NOT NULL,
    "fechada_em" TIMESTAMP(3),
    "fechada_por_id" TEXT,
    "observacao" TEXT,

    CONSTRAINT "inspecoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sistemas" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome_en" TEXT NOT NULL,
    "nome_pt" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sistemas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subsistemas" (
    "id" TEXT NOT NULL,
    "sistema_id" TEXT NOT NULL,
    "nome_en" TEXT NOT NULL,
    "nome_pt" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "subsistemas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cartoes" (
    "id" TEXT NOT NULL,
    "subsistema_id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome_en" TEXT NOT NULL,
    "nome_pt" TEXT NOT NULL,
    "tipo" "TipoCartao" NOT NULL,
    "publicacao" TEXT,
    "wp" TEXT,
    "duracao_min" INTEGER,
    "qtd_recursos" INTEGER DEFAULT 1,
    "om_designator" TEXT,
    "observacao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "cartoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cartao_inspecao_tipos" (
    "cartao_id" TEXT NOT NULL,
    "inspecao_tipo" "InspecaoTipo" NOT NULL,

    CONSTRAINT "cartao_inspecao_tipos_pkey" PRIMARY KEY ("cartao_id","inspecao_tipo")
);

-- CreateTable
CREATE TABLE "ferramentas" (
    "id" TEXT NOT NULL,
    "cartao_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "especificacao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ferramentas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subitens" (
    "id" TEXT NOT NULL,
    "cartao_id" TEXT NOT NULL,
    "letra" TEXT NOT NULL,
    "descricao_pt" TEXT NOT NULL,
    "descricao_en" TEXT,
    "referencia" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "subitens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execucoes_cartao" (
    "id" TEXT NOT NULL,
    "inspecao_id" TEXT NOT NULL,
    "cartao_id" TEXT NOT NULL,
    "inspecionado_em" TIMESTAMP(3),
    "inspecionador_id" TEXT,

    CONSTRAINT "execucoes_cartao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avisos_execucao" (
    "id" TEXT NOT NULL,
    "execucao_id" TEXT NOT NULL,
    "autor_id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editado_em" TIMESTAMP(3),

    CONSTRAINT "avisos_execucao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aviso_leituras" (
    "aviso_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lido_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aviso_leituras_pkey" PRIMARY KEY ("aviso_id","user_id")
);

-- CreateTable
CREATE TABLE "defeitos_execucao" (
    "id" TEXT NOT NULL,
    "execucao_id" TEXT NOT NULL,
    "inspetor_id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editado_em" TIMESTAMP(3),
    "resolvido_em" TIMESTAMP(3),

    CONSTRAINT "defeitos_execucao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subitem_statuses" (
    "id" TEXT NOT NULL,
    "execucao_id" TEXT NOT NULL,
    "subitem_id" TEXT NOT NULL,
    "status" "StatusSubitem" NOT NULL DEFAULT 'PENDENTE',
    "mecanico_id" TEXT,
    "data_inicio" TIMESTAMP(3),
    "data_conclusao" TIMESTAMP(3),
    "observacao" TEXT,
    "observacao_autor_id" TEXT,
    "observacao_em" TIMESTAMP(3),

    CONSTRAINT "subitem_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_trigrama_key" ON "users"("trigrama");

-- CreateIndex
CREATE UNIQUE INDEX "users_matricula_key" ON "users"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "anvs_matricula_key" ON "anvs"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "sistemas_codigo_key" ON "sistemas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "execucoes_cartao_inspecao_id_cartao_id_key" ON "execucoes_cartao"("inspecao_id", "cartao_id");

-- CreateIndex
CREATE UNIQUE INDEX "subitem_statuses_execucao_id_subitem_id_key" ON "subitem_statuses"("execucao_id", "subitem_id");

-- AddForeignKey
ALTER TABLE "inspecoes" ADD CONSTRAINT "inspecoes_anv_id_fkey" FOREIGN KEY ("anv_id") REFERENCES "anvs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspecoes" ADD CONSTRAINT "inspecoes_aberta_por_id_fkey" FOREIGN KEY ("aberta_por_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspecoes" ADD CONSTRAINT "inspecoes_fechada_por_id_fkey" FOREIGN KEY ("fechada_por_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subsistemas" ADD CONSTRAINT "subsistemas_sistema_id_fkey" FOREIGN KEY ("sistema_id") REFERENCES "sistemas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cartoes" ADD CONSTRAINT "cartoes_subsistema_id_fkey" FOREIGN KEY ("subsistema_id") REFERENCES "subsistemas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cartao_inspecao_tipos" ADD CONSTRAINT "cartao_inspecao_tipos_cartao_id_fkey" FOREIGN KEY ("cartao_id") REFERENCES "cartoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ferramentas" ADD CONSTRAINT "ferramentas_cartao_id_fkey" FOREIGN KEY ("cartao_id") REFERENCES "cartoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subitens" ADD CONSTRAINT "subitens_cartao_id_fkey" FOREIGN KEY ("cartao_id") REFERENCES "cartoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execucoes_cartao" ADD CONSTRAINT "execucoes_cartao_inspecao_id_fkey" FOREIGN KEY ("inspecao_id") REFERENCES "inspecoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execucoes_cartao" ADD CONSTRAINT "execucoes_cartao_cartao_id_fkey" FOREIGN KEY ("cartao_id") REFERENCES "cartoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execucoes_cartao" ADD CONSTRAINT "execucoes_cartao_inspecionador_id_fkey" FOREIGN KEY ("inspecionador_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avisos_execucao" ADD CONSTRAINT "avisos_execucao_execucao_id_fkey" FOREIGN KEY ("execucao_id") REFERENCES "execucoes_cartao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avisos_execucao" ADD CONSTRAINT "avisos_execucao_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aviso_leituras" ADD CONSTRAINT "aviso_leituras_aviso_id_fkey" FOREIGN KEY ("aviso_id") REFERENCES "avisos_execucao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defeitos_execucao" ADD CONSTRAINT "defeitos_execucao_execucao_id_fkey" FOREIGN KEY ("execucao_id") REFERENCES "execucoes_cartao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defeitos_execucao" ADD CONSTRAINT "defeitos_execucao_inspetor_id_fkey" FOREIGN KEY ("inspetor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subitem_statuses" ADD CONSTRAINT "subitem_statuses_execucao_id_fkey" FOREIGN KEY ("execucao_id") REFERENCES "execucoes_cartao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subitem_statuses" ADD CONSTRAINT "subitem_statuses_subitem_id_fkey" FOREIGN KEY ("subitem_id") REFERENCES "subitens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subitem_statuses" ADD CONSTRAINT "subitem_statuses_mecanico_id_fkey" FOREIGN KEY ("mecanico_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
