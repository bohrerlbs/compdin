-- CreateEnum
CREATE TYPE "StatusTarefa" AS ENUM ('PENDENTE', 'INICIADA', 'CONCLUIDA');

-- CreateTable
CREATE TABLE "tarefas_compdin" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "StatusTarefa" NOT NULL DEFAULT 'PENDENTE',
    "autor_id" TEXT NOT NULL,
    "responsavel_id" TEXT,
    "iniciado_em" TIMESTAMP(3),
    "concluido_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tarefas_compdin_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tarefas_compdin" ADD CONSTRAINT "tarefas_compdin_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas_compdin" ADD CONSTRAINT "tarefas_compdin_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
