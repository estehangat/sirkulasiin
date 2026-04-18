import midtransClient from "midtrans-client";

type IrisBeneficiaryBank = {
  code: string;
  name: string;
};

export type IrisPayoutCreateResult = {
  payouts?: Array<{ status: string; reference_no: string }>;
  error_message?: string;
  errors?: unknown;
};

export type IrisPayoutDetail = {
  amount?: string;
  beneficiary_name?: string;
  beneficiary_account?: string;
  bank?: string;
  reference_no?: string;
  notes?: string;
  beneficiary_email?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  error_message?: string;
  errors?: unknown;
  [key: string]: unknown;
};

function getIrisConfig() {
  const apiKey = process.env.MIDTRANS_IRIS_API_KEY;
  if (!apiKey) throw new Error("MIDTRANS_IRIS_API_KEY is missing.");

  return {
    apiKey,
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  };
}

function getMidtransIris() {
  const { apiKey, isProduction } = getIrisConfig();
  return new midtransClient.Iris({ isProduction, serverKey: apiKey });
}

export async function getIrisBeneficiaryBanks(): Promise<IrisBeneficiaryBank[]> {
  const iris = getMidtransIris();
  const res = (await iris.getBeneficiaryBanks()) as {
    beneficiary_banks?: IrisBeneficiaryBank[];
    beneficiaryBanks?: IrisBeneficiaryBank[];
  };

  return (
    res.beneficiary_banks ||
    // some clients use camelCase
    res.beneficiaryBanks ||
    []
  );
}

export async function createIrisPayout(input: {
  beneficiaryName: string;
  beneficiaryAccount: string;
  beneficiaryBank: string;
  beneficiaryEmail?: string | null;
  amount: number;
  notes: string;
}): Promise<IrisPayoutCreateResult> {
  const iris = getMidtransIris();
  return (await iris.createPayouts({
    payouts: [
      {
        beneficiary_name: input.beneficiaryName,
        beneficiary_account: input.beneficiaryAccount,
        beneficiary_bank: input.beneficiaryBank,
        beneficiary_email: input.beneficiaryEmail || undefined,
        amount: String(input.amount),
        notes: input.notes,
      },
    ],
  })) as IrisPayoutCreateResult;
}

export async function approveIrisPayout(referenceNo: string, otp: string) {
  const iris = getMidtransIris();
  return iris.approvePayouts({ reference_nos: [referenceNo], otp }) as Promise<{
    status?: string;
    error_message?: string;
    errors?: unknown;
    [key: string]: unknown;
  }>;
}

export async function rejectIrisPayout(referenceNo: string, rejectReason: string) {
  const iris = getMidtransIris();
  return iris.rejectPayouts({
    reference_nos: [referenceNo],
    reject_reason: rejectReason,
  }) as Promise<{
    status?: string;
    error_message?: string;
    errors?: unknown;
    [key: string]: unknown;
  }>;
}

export async function getIrisPayoutDetails(referenceNo: string): Promise<IrisPayoutDetail> {
  const iris = getMidtransIris();
  return (await iris.getPayoutDetails(referenceNo)) as IrisPayoutDetail;
}
