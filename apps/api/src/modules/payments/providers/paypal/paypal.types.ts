export type PayPalCreateOrderRequest = {
  intent: "CAPTURE" | "AUTHORIZE";

  purchase_units: Array<{
    reference_id?: string;

    amount: {
      currency_code: string;
      value: string;
    };

    custom_id?: string;
  }>;
};

export type PayPalLink = {
  href: string;
  rel: string;
  method?: string;
};

export type PayPalCreateOrderResponse = {
  id: string;
  status: string;

  links?: PayPalLink[];
};

export type PayPalOrderDetails = {
  id: string;

  intent: "CAPTURE" | "AUTHORIZE";

  status:
    | "CREATED"
    | "SAVED"
    | "APPROVED"
    | "VOIDED"
    | "COMPLETED"
    | "PAYER_ACTION_REQUIRED"
    | string;

  purchase_units?: Array<{
    reference_id?: string;

    amount?: {
      currency_code?: string;
      value?: string;
    };

    payments?: {
      captures?: Array<{
        id: string;
        status: string;

        amount?: {
          currency_code?: string;
          value?: string;
        };
      }>;
    };
  }>;

  links?: PayPalLink[];
};

export type PayPalCaptureResponse = {
  id: string;
  status: string;

  purchase_units?: Array<{
    payments?: {
      captures?: Array<{
        id: string;
        status: string;

        amount?: {
          currency_code?: string;
          value?: string;
        };
      }>;
    };
  }>;
};


export type PayPalWebhookEvent = {
  id: string;
  event_type: string;
  create_time?: string;
  resource_type?: string;
  summary?: string;
  resource: unknown;
};

export type PayPalWebhookVerificationHeaders = {
  authAlgo: string;
  certUrl: string;
  transmissionId: string;
  transmissionSig: string;
  transmissionTime: string;
};

export type PayPalVerifyWebhookSignatureRequest = {
  auth_algo: string;
  cert_url: string;
  transmission_id: string;
  transmission_sig: string;
  transmission_time: string;
  webhook_id: string;
  webhook_event: PayPalWebhookEvent;
};

export type PayPalVerifyWebhookSignatureResponse = {
  verification_status: "SUCCESS" | "FAILURE";
};


export type PayPalRefundStatus =
  | "CANCELLED"
  | "FAILED"
  | "PENDING"
  | "COMPLETED";

export type PayPalRefundRequest = {
  amount?: {
    value: string;
    currency_code: string;
  };
};

export type PayPalRefundResponse = {
  id?: string;

  status?: PayPalRefundStatus;

  amount?: {
    value?: string;
    currency_code?: string;
  };

  status_details?: {
    reason?: string;
  };

  create_time?: string;
  update_time?: string;

  links?: Array<{
    href?: string;
    rel?: string;
    method?: string;
  }>;
};