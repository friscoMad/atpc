export class PayrollEntry {
  desc: string;
  income: number;
  retention: number;

  constructor(desc: string, income: string, retention: string | null) {
    this.desc = desc.trim();
    this.income = Number(income.trim().replaceAll('.', '').replaceAll(',', '.'));
    this.retention = Number(
      (retention ?? '').trim().replaceAll('.', '').replaceAll(',', '.'),
    );
  }
}
export interface SchwabTransaction {
  Date: string;
  Action: string;
  Symbol: string;
  Quantity: string;
  Description: string;
  FeesAndCommissions: string | undefined;
  DisbursementElection: string | undefined;
  Amount: string | undefined;
  TransactionDetails: SchwabTransactionDetail[];
}
export interface SchwabTransactionDetail {
  Details: SchwabTransactionDetailData;
}

export interface SchwabTransactionDetailData {
  AwardDate: string;
  AwardId: string;
  FairMarketValuePrice: string;
  SalePrice: string;
  SharesSoldWithheldForTaxes: string;
  NetSharesDeposited: string;
  Taxes: string;
}
