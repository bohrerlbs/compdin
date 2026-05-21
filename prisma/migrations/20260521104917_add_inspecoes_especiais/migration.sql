-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InspecaoTipo" ADD VALUE 'EP1_ERO';
ALTER TYPE "InspecaoTipo" ADD VALUE 'EP2_POU';
ALTER TYPE "InspecaoTipo" ADD VALUE 'EP3_PAR';
ALTER TYPE "InspecaoTipo" ADD VALUE 'EP5_PRP';
ALTER TYPE "InspecaoTipo" ADD VALUE 'INSP_ESPECIAL';
