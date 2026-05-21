-- CreateTable
CREATE TABLE "tarefas_compdin_mecanicos" (
    "id" TEXT NOT NULL,
    "tarefa_id" TEXT NOT NULL,
    "mecanico_id" TEXT NOT NULL,

    CONSTRAINT "tarefas_compdin_mecanicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subitem_status_mecanicos" (
    "id" TEXT NOT NULL,
    "status_id" TEXT NOT NULL,
    "mecanico_id" TEXT NOT NULL,

    CONSTRAINT "subitem_status_mecanicos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tarefas_compdin_mecanicos_tarefa_id_mecanico_id_key" ON "tarefas_compdin_mecanicos"("tarefa_id", "mecanico_id");

-- CreateIndex
CREATE UNIQUE INDEX "subitem_status_mecanicos_status_id_mecanico_id_key" ON "subitem_status_mecanicos"("status_id", "mecanico_id");

-- AddForeignKey
ALTER TABLE "tarefas_compdin_mecanicos" ADD CONSTRAINT "tarefas_compdin_mecanicos_tarefa_id_fkey" FOREIGN KEY ("tarefa_id") REFERENCES "tarefas_compdin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas_compdin_mecanicos" ADD CONSTRAINT "tarefas_compdin_mecanicos_mecanico_id_fkey" FOREIGN KEY ("mecanico_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subitem_status_mecanicos" ADD CONSTRAINT "subitem_status_mecanicos_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "subitem_statuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subitem_status_mecanicos" ADD CONSTRAINT "subitem_status_mecanicos_mecanico_id_fkey" FOREIGN KEY ("mecanico_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
