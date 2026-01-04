import { environment } from "../../environment/environment";

/**
 * Base URLs
 */
const PUBLIC_INQUIRY_BASE = `${environment.baseUrl}/public/inquiries`;
const STAFF_INQUIRY_BASE  = `${environment.baseUrl}/staff/inquiries`;

export const inquiryUrl = {

    // =========================
    // PUBLIC INQUIRY APIs
    // =========================
    public: {
        add: `${PUBLIC_INQUIRY_BASE}`,           // POST
    },

    // =========================
    // STAFF INQUIRY APIs
    // =========================
    staff: {
        add: `${STAFF_INQUIRY_BASE}`,             // POST
        view: `${STAFF_INQUIRY_BASE}`,            // GET (list with filters)
        getById: (id: number) => `${STAFF_INQUIRY_BASE}/${id}`, // GET
        update: (id: number) => `${STAFF_INQUIRY_BASE}/${id}`,  // PUT
        delete: (id: number) => `${STAFF_INQUIRY_BASE}/${id}`,  // DELETE (soft)
    },

    // =========================
    // FOLLOW-UP APIs (future)
    // =========================
    followUp: {
        add: (enquiryId: number) =>
            `${STAFF_INQUIRY_BASE}/${enquiryId}/follow-ups`,
        view: (enquiryId: number) =>
            `${STAFF_INQUIRY_BASE}/${enquiryId}/follow-ups`
    },

    // =========================
    // CONVERSION APIs (future)
    // =========================
    conversion: {
        proceedToAdmission: (enquiryId: number) =>
            `${STAFF_INQUIRY_BASE}/${enquiryId}/proceed-admission`
    }
};
