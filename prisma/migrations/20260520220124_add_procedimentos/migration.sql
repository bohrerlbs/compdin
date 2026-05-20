-- CreateTable
CREATE TABLE "procedimentos_padrao" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "autor_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "procedimentos_padrao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procedimento_imagens" (
    "id" TEXT NOT NULL,
    "procedimento_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "legenda" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "procedimento_imagens_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "procedimentos_padrao" ADD CONSTRAINT "procedimentos_padrao_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procedimento_imagens" ADD CONSTRAINT "procedimento_imagens_procedimento_id_fkey" FOREIGN KEY ("procedimento_id") REFERENCES "procedimentos_padrao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
