// Fixed template — every user gets the same checklist; only completion
// state (checklist_progress) is per-user.
export const CHECKLIST_TEMPLATE = [
  {
    key: "anmeldung",
    label: "Anmeldung & registration",
    items: [
      { key: "anmeldung_appointment", label: "Book a Bürgeramt appointment" },
      { key: "anmeldung_complete", label: "Complete your Anmeldung" },
      { key: "anmeldung_certificate", label: "Receive your registration certificate" },
    ],
  },
  {
    key: "visa",
    label: "Visa & residence permit",
    items: [
      { key: "visa_documents", label: "Gather required documents" },
      { key: "visa_appointment", label: "Book an Ausländerbehörde appointment" },
      { key: "visa_submit", label: "Submit your residence permit application" },
    ],
  },
  {
    key: "tax_id",
    label: "Tax ID & Steuernummer",
    items: [
      { key: "tax_id_received", label: "Receive your Steuer-ID by post" },
      { key: "tax_finanzamt", label: "Register with your local Finanzamt (if self-employed)" },
    ],
  },
  {
    key: "bank",
    label: "Bank account & SCHUFA",
    items: [
      { key: "bank_account", label: "Open a bank account" },
      { key: "bank_schufa", label: "Understand your SCHUFA score" },
      { key: "bank_linked", label: "Link your account for salary/rent" },
    ],
  },
] as const;

export const ALL_CHECKLIST_ITEM_KEYS = CHECKLIST_TEMPLATE.flatMap((c) => c.items.map((i) => i.key));
