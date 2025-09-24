-- CreateTable
CREATE TABLE "public"."UserBank" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Settings" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "autoSaveRate" DOUBLE PRECISION NOT NULL DEFAULT 3.5,
    "weeklyTopUp" INTEGER NOT NULL DEFAULT 500,
    "minThreshold" INTEGER NOT NULL DEFAULT 100,
    "roundUpsEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Transaction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "providerTransactionId" TEXT,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "description" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Treasury" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Treasury_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TreasuryEntry" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "transactionId" INTEGER,
    "kind" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "risk" TEXT,
    "units" DOUBLE PRECISION,
    "navAtInvest" DOUBLE PRECISION,

    CONSTRAINT "TreasuryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InvestmentPosition" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "risk" TEXT NOT NULL,
    "units" DOUBLE PRECISION NOT NULL,
    "amount" INTEGER NOT NULL,
    "navAtInvest" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestmentPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InvestmentNav" (
    "id" SERIAL NOT NULL,
    "risk" TEXT NOT NULL,
    "currentNav" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentNav_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserBank_userId_idx" ON "public"."UserBank"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_userId_key" ON "public"."Settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_providerTransactionId_key" ON "public"."Transaction"("providerTransactionId");

-- CreateIndex
CREATE INDEX "Transaction_userId_occurredAt_idx" ON "public"."Transaction"("userId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "Treasury_userId_key" ON "public"."Treasury"("userId");

-- CreateIndex
CREATE INDEX "TreasuryEntry_userId_createdAt_idx" ON "public"."TreasuryEntry"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "TreasuryEntry_userId_kind_idx" ON "public"."TreasuryEntry"("userId", "kind");

-- CreateIndex
CREATE INDEX "InvestmentPosition_userId_risk_idx" ON "public"."InvestmentPosition"("userId", "risk");

-- CreateIndex
CREATE INDEX "InvestmentPosition_userId_createdAt_idx" ON "public"."InvestmentPosition"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "InvestmentNav_risk_key" ON "public"."InvestmentNav"("risk");

-- AddForeignKey
ALTER TABLE "public"."UserBank" ADD CONSTRAINT "UserBank_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Settings" ADD CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Treasury" ADD CONSTRAINT "Treasury_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TreasuryEntry" ADD CONSTRAINT "TreasuryEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TreasuryEntry" ADD CONSTRAINT "TreasuryEntry_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InvestmentPosition" ADD CONSTRAINT "InvestmentPosition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
