export {}

declare global {
  type PaystackTransactionResponse = {
    reference: string
    status?: string
    message?: string
    trans?: string
    transaction?: string
    trxref?: string
  }

  type PaystackErrorResponse = {
    message?: string
    status?: string
  }

  type PaystackResumeOptions = {
    onSuccess?: (
      transaction: PaystackTransactionResponse
    ) => void

    onCancel?: () => void

    onError?: (
      error: PaystackErrorResponse
    ) => void

    onLoad?: (
      response?: unknown
    ) => void
  }

  class PaystackPopup {
    newTransaction(options: {
      key: string
      email: string
      amount: number
      currency?: string
      reference?: string
      metadata?: Record<string, unknown>

      onSuccess?: (
        transaction: PaystackTransactionResponse
      ) => void

      onCancel?: () => void

      onError?: (
        error: PaystackErrorResponse
      ) => void

      onLoad?: (
        response?: unknown
      ) => void
    }): void

    resumeTransaction(
      accessCode: string,
      options?: PaystackResumeOptions
    ): void

    cancelTransaction?(): void
  }

  interface Window {
    PaystackPop?: new () => PaystackPopup
  }
}